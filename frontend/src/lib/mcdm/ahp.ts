// AHP – port z backend/main.py (compute_ahp_full a validace AHPFullRequest).
//
// Váhy z párové matice počítá pyDecision.ahp_method s výchozím wd='m':
// průměr řádků matice s normalizovanými sloupci (aproximace, NE vlastní vektor).
// λmax = průměr (A·w)_i / w_i, CI = (λmax − n)/(n − 1), CR = CI / RI.

import { McdmError, argsortDesc, mean, minMaxValue, sum, type CriterionType } from './common';

export const AHP_MIN_CRITERIA = 2;
export const AHP_MAX_CRITERIA = 8;
export const AHP_MIN_ALTERNATIVES = 2;
export const AHP_MAX_ALTERNATIVES = 6;
export const CR_THRESHOLD = 0.1;
export const RECIPROCITY_TOLERANCE = 0.01;
/** Saatyho náhodné indexy – stejná tabulka jako v pyDecision.ahp_method. */
export const RANDOM_INDEX = [0, 0, 0, 0.58, 0.9, 1.12, 1.24, 1.32, 1.41, 1.45, 1.49, 1.51, 1.48, 1.56, 1.57, 1.59];

export type Matrix = number[][];

export interface Consistency {
  lambda_max: number;
  ci: number;
  ri: number;
  cr: number;
  is_consistent: boolean;
}

export type AlternativeEvaluation =
  | { method: 'pairwise'; matrix: Matrix }
  | { method: 'direct'; scores: number[] }
  | { method: 'smart'; values: number[]; type: CriterionType };

export interface AHPFullRequest {
  criteria_matrix: Matrix;
  alternative_evaluations: AlternativeEvaluation[];
}

export interface LocalPriorities {
  method: AlternativeEvaluation['method'];
  raw: number[];
  normalized: number[];
  consistency: Consistency | null;
}

export interface AHPFullResponse {
  criteria: { weights: number[]; consistency: Consistency };
  local_priorities: LocalPriorities[];
  weighted_contributions: Matrix; // [alternativa][kritérium]
  global_scores: number[];
  ranking: number[]; // 0-indexed, nejlepší první
  inconsistent_matrices: { target: 'criteria' | 'alternatives'; criterion: number | null; cr: number }[];
}

/** pyDecision.ahp_method(wd='m'): průměr řádků normalizovaných sloupců. */
export function meanColumnWeights(a: Matrix): number[] {
  const n = a.length;
  const colSums = a[0].map((_, j) => sum(a.map((row) => row[j])));
  return a.map((row) => sum(row.map((x, j) => x / colSums[j])) / n);
}

export function pairwisePriorities(matrix: Matrix): { weights: number[]; consistency: Consistency } {
  const n = matrix.length;
  const weights = meanColumnWeights(matrix);
  const lambdaMax = mean(matrix.map((row, i) => sum(row.map((x, j) => x * weights[j])) / weights[i]));
  let ci = 0;
  let ri = 0;
  let cr = 0;
  if (n > 2) {
    ci = (lambdaMax - n) / (n - 1);
    ri = RANDOM_INDEX[n];
    cr = ci / ri;
  }
  return { weights, consistency: { lambda_max: lambdaMax, ci, ri, cr, is_consistent: cr < CR_THRESHOLD } };
}

/** Normalizace na součet 1; nekladný součet → rovnoměrné priority. */
export function normalizeToSum(v: readonly number[]): number[] {
  const total = sum(v);
  if (total <= 0) return v.map(() => 1 / v.length);
  return v.map((x) => x / total);
}

export function evaluateAlternatives(ev: AlternativeEvaluation): LocalPriorities {
  let raw: number[];
  let consistency: Consistency | null = null;
  if (ev.method === 'pairwise') {
    const r = pairwisePriorities(ev.matrix);
    raw = r.weights;
    consistency = r.consistency;
  } else if (ev.method === 'direct') {
    raw = [...ev.scores];
  } else if (ev.method === 'smart') {
    raw = minMaxValue(ev.values, ev.type);
  } else {
    throw new McdmError(`Neznámá metoda hodnocení: ${(ev as { method: string }).method}`);
  }
  return { method: ev.method, raw, normalized: normalizeToSum(raw), consistency };
}

/** Distributivní syntéza: příspěvek[i][j] = w_j · p_ij, skóre = součet řádku. */
export function synthesize(criteriaWeights: number[], localNormalized: number[][]) {
  const nAlts = localNormalized[0].length;
  const contributions = Array.from({ length: nAlts }, (_, i) =>
    criteriaWeights.map((w, j) => localNormalized[j][i] * w),
  );
  const scores = contributions.map(sum);
  return { contributions, scores, ranking: argsortDesc(scores) };
}

// ── Validace (stejné české zprávy jako backend, 422) ───────────────────────────

function validatePairwiseMatrix(matrix: Matrix, label: string, minN: number, maxN: number): void {
  const n = matrix.length;
  if (n < minN || n > maxN) throw new McdmError(`${label}: rozměr musí být ${minN}–${maxN}, je ${n}.`);
  for (const row of matrix) {
    if (row.length !== n) throw new McdmError(`${label}: matice musí být čtvercová (${n}×${n}).`);
  }
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (!Number.isFinite(matrix[i][j]) || matrix[i][j] <= 0) {
        throw new McdmError(`${label}: všechny hodnoty musí být kladná konečná čísla (řádek ${i + 1}, sloupec ${j + 1}).`);
      }
    }
    if (Math.abs(matrix[i][i] - 1) > RECIPROCITY_TOLERANCE) {
      throw new McdmError(`${label}: na diagonále musí být 1 (řádek ${i + 1}).`);
    }
    for (let j = i + 1; j < n; j++) {
      if (Math.abs(matrix[i][j] * matrix[j][i] - 1) > RECIPROCITY_TOLERANCE) {
        throw new McdmError(`${label}: matice není reciproční (prvky [${i + 1},${j + 1}] a [${j + 1},${i + 1}]).`);
      }
    }
  }
}

export function validateAhpFullRequest(req: AHPFullRequest): void {
  validatePairwiseMatrix(req.criteria_matrix, 'Matice kritérií', AHP_MIN_CRITERIA, AHP_MAX_CRITERIA);
  const nCrit = req.criteria_matrix.length;
  const evals = req.alternative_evaluations;
  if (evals.length !== nCrit) {
    throw new McdmError(`Počet hodnocení alternativ (${evals.length}) neodpovídá počtu kritérií (${nCrit}).`);
  }
  let nAlts: number | null = null;
  evals.forEach((ev, j) => {
    const label = `Kritérium ${j + 1}`;
    let size: number;
    if (ev.method === 'pairwise') {
      validatePairwiseMatrix(ev.matrix, `${label} – párová matice alternativ`, AHP_MIN_ALTERNATIVES, AHP_MAX_ALTERNATIVES);
      size = ev.matrix.length;
    } else if (ev.method === 'direct') {
      size = ev.scores.length;
      if (ev.scores.some((s) => !Number.isFinite(s) || s < 0 || s > 100)) {
        throw new McdmError(`${label}: body přímého hodnocení musí být v rozsahu 0–100.`);
      }
    } else if (ev.method === 'smart') {
      size = ev.values.length;
      if (ev.values.some((v) => !Number.isFinite(v))) throw new McdmError(`${label}: hodnoty SMART musí být konečná čísla.`);
      if (ev.type !== 'benefit' && ev.type !== 'cost') {
        throw new McdmError(`Neplatná hodnota pole alternative_evaluations.${j}.smart.type, povolené hodnoty: 'benefit', 'cost'.`);
      }
    } else {
      throw new McdmError(`Neplatná metoda hodnocení (alternative_evaluations.${j}): povolené jsou pairwise, direct, smart.`);
    }
    if (size < AHP_MIN_ALTERNATIVES || size > AHP_MAX_ALTERNATIVES) {
      throw new McdmError(`${label}: počet alternativ musí být ${AHP_MIN_ALTERNATIVES}–${AHP_MAX_ALTERNATIVES}, je ${size}.`);
    }
    if (nAlts === null) nAlts = size;
    else if (size !== nAlts) throw new McdmError(`${label}: počet alternativ (${size}) se liší od ostatních kritérií (${nAlts}).`);
  });
}

/** Ekvivalent POST /api/calculate-ahp-full (včetně validace). */
export function computeAhpFull(req: AHPFullRequest): AHPFullResponse {
  validateAhpFullRequest(req);
  const criteria = pairwisePriorities(req.criteria_matrix);
  const local = req.alternative_evaluations.map(evaluateAlternatives);
  const { contributions, scores, ranking } = synthesize(criteria.weights, local.map((l) => l.normalized));

  const inconsistent: AHPFullResponse['inconsistent_matrices'] = [];
  if (!criteria.consistency.is_consistent) {
    inconsistent.push({ target: 'criteria', criterion: null, cr: criteria.consistency.cr });
  }
  local.forEach((l, j) => {
    if (l.consistency && !l.consistency.is_consistent) {
      inconsistent.push({ target: 'alternatives', criterion: j, cr: l.consistency.cr });
    }
  });

  return {
    criteria,
    local_priorities: local,
    weighted_contributions: contributions,
    global_scores: scores,
    ranking,
    inconsistent_matrices: inconsistent,
  };
}

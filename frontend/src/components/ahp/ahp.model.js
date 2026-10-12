import {
  ALT_METHODS,
  DEFAULT_ALT_METHOD,
  MAX_ALTS,
  MAX_CRIT,
  MIN_ALTS,
  MIN_CRIT,
} from './ahp.constants';
import { parseNum } from './ahp.math';

// Model labu. Kritéria jsou zatím jedna úroveň: critMatrix srovnává kritéria pod
// kořenem a evals[j] je hodnocení alternativ vůči kritériu j. Každé hodnocení je
// samostatný objekt, takže víceúrovňová hierarchie ho později jen přesune do
// listového uzlu a vnitřní uzly dostanou vlastní párovou matici podkritérií.
//
// model = {
//   nCrit, nAlts,
//   critNames: string[MAX_CRIT], altNames: string[MAX_ALTS],   // názvy se drží i mimo aktuální počet
//   critMatrix: number[nCrit][nCrit],
//   evals: [{ method, matrix: number[nAlts][nAlts], scores: string[nAlts], values: string[nAlts], type }],
// }

export const SCHEMA_VERSION = '2';
export const DEFAULT_CRIT_NAMES = Array.from({ length: MAX_CRIT }, (_, i) => `K${i + 1}`);
export const DEFAULT_ALT_NAMES = Array.from({ length: MAX_ALTS }, (_, i) => `A${i + 1}`);
const DEFAULT_N_CRIT = 3;
const DEFAULT_N_ALTS = 3;
const DEFAULT_SCORE = '50';
const METHOD_IDS = ALT_METHODS.map((m) => m.id);

export function onesMatrix(n) {
  return Array.from({ length: n }, () => Array.from({ length: n }, () => 1));
}

// Zachová srovnání mezi prvky, které zůstaly; nové dvojice začínají na 1 (rovnocenné).
function resizeMatrix(matrix, n) {
  return Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => matrix[i]?.[j] ?? 1));
}

function resizeList(list, n, fill) {
  return Array.from({ length: n }, (_, i) => list[i] ?? fill);
}

export function makeEvaluation(nAlts) {
  return {
    method: DEFAULT_ALT_METHOD,
    matrix: onesMatrix(nAlts),
    scores: Array(nAlts).fill(DEFAULT_SCORE),
    values: Array(nAlts).fill(''),
    type: 'benefit',
  };
}

export function createInitialModel() {
  return {
    nCrit: DEFAULT_N_CRIT,
    nAlts: DEFAULT_N_ALTS,
    critNames: [...DEFAULT_CRIT_NAMES],
    altNames: [...DEFAULT_ALT_NAMES],
    critMatrix: onesMatrix(DEFAULT_N_CRIT),
    evals: Array.from({ length: DEFAULT_N_CRIT }, () => makeEvaluation(DEFAULT_N_ALTS)),
  };
}

export function withCritCount(model, n) {
  return {
    ...model,
    nCrit: n,
    critMatrix: resizeMatrix(model.critMatrix, n),
    evals: Array.from({ length: n }, (_, j) => model.evals[j] ?? makeEvaluation(model.nAlts)),
  };
}

export function withAltCount(model, n) {
  return {
    ...model,
    nAlts: n,
    evals: model.evals.map((ev) => ({
      ...ev,
      matrix: resizeMatrix(ev.matrix, n),
      scores: resizeList(ev.scores, n, DEFAULT_SCORE),
      values: resizeList(ev.values, n, ''),
    })),
  };
}

export function setReciprocal(matrix, i, j, value) {
  return matrix.map((row, r) => row.map((cell, c) => {
    if (r === i && c === j) return value;
    if (r === j && c === i) return 1 / value;
    return cell;
  }));
}

export function critNamesOf(model) {
  return model.critNames.slice(0, model.nCrit);
}

export function altNamesOf(model) {
  return model.altNames.slice(0, model.nAlts);
}

// Seznam problémů, které brání výpočtu: { step, criterion?, message }.
export function validateModel(model) {
  const issues = [];
  const cNames = critNamesOf(model);
  const aNames = altNamesOf(model);
  if (cNames.some((n) => !n.trim())) issues.push({ step: 0, message: 'Některé kritérium nemá název.' });
  if (aNames.some((n) => !n.trim())) issues.push({ step: 0, message: 'Některá alternativa nemá název.' });
  model.evals.forEach((ev, j) => {
    const label = cNames[j] || `Kritérium ${j + 1}`;
    if (ev.method === 'direct') {
      const bad = ev.scores.some((s) => {
        const x = parseNum(s);
        return !Number.isFinite(x) || x < 0 || x > 100;
      });
      if (bad) issues.push({ step: 2, criterion: j, message: `${label}: body musí být čísla 0–100.` });
    } else if (ev.method === 'smart') {
      if (ev.values.some((s) => !Number.isFinite(parseNum(s)))) {
        issues.push({ step: 2, criterion: j, message: `${label}: vyplňte číselné hodnoty všech alternativ.` });
      }
    }
  });
  return issues;
}

export function buildPayload(model) {
  return {
    criteria_matrix: model.critMatrix,
    alternative_evaluations: model.evals.map((ev) => {
      if (ev.method === 'pairwise') return { method: 'pairwise', matrix: ev.matrix };
      if (ev.method === 'direct') return { method: 'direct', scores: ev.scores.map(parseNum) };
      return { method: 'smart', values: ev.values.map(parseNum), type: ev.type };
    }),
  };
}

function exportEvaluation(ev) {
  const num = (s) => {
    const x = parseNum(s);
    return Number.isFinite(x) ? x : null;
  };
  if (ev.method === 'pairwise') return { method: 'pairwise', matrix: ev.matrix };
  if (ev.method === 'direct') return { method: 'direct', scores: ev.scores.map(num) };
  return { method: 'smart', values: ev.values.map(num), type: ev.type };
}

export function exportModel(model, results) {
  const aNames = altNamesOf(model);
  return {
    version: SCHEMA_VERSION,
    method: 'AHP',
    savedAt: new Date().toISOString(),
    criteria: critNamesOf(model).map((name, j) => ({ name, evaluation: exportEvaluation(model.evals[j]) })),
    alternatives: aNames.map((name) => ({ name })),
    criteriaMatrix: model.critMatrix,
    results: results ? {
      criteriaWeights: results.criteria.weights,
      globalScores: results.global_scores,
      ranking: results.ranking.map((i) => aNames[i]),
    } : null,
  };
}

function checkPairwise(matrix, n, label) {
  const ok = Array.isArray(matrix) && matrix.length === n && matrix.every((row) => (
    Array.isArray(row) && row.length === n && row.every((x) => typeof x === 'number' && x > 0)
  ));
  if (!ok) throw new Error(`${label}: neplatná matice.`);
  const reciprocal = matrix.every((row, i) => row.every((x, j) => Math.abs(x * matrix[j][i] - 1) <= 0.01));
  if (!reciprocal) throw new Error(`${label}: matice není reciproční.`);
  return matrix.map((row) => [...row]);
}

function checkNames(names, min, max, label) {
  if (!Array.isArray(names) || names.length < min || names.length > max) {
    throw new Error(`Neplatný počet ${label} (povoleno ${min}–${max}).`);
  }
  return names.map((n) => String(n ?? ''));
}

const toText = (x) => (typeof x === 'number' && Number.isFinite(x) ? String(x) : '');

function importEvaluation(raw, nAlts, label) {
  const ev = makeEvaluation(nAlts);
  if (!raw || !METHOD_IDS.includes(raw.method)) throw new Error(`${label}: neznámá metoda hodnocení.`);
  ev.method = raw.method;
  if (raw.method === 'pairwise') {
    ev.matrix = checkPairwise(raw.matrix, nAlts, label);
  } else {
    const list = raw.method === 'direct' ? raw.scores : raw.values;
    if (!Array.isArray(list) || list.length !== nAlts) throw new Error(`${label}: neplatný počet hodnot.`);
    if (raw.method === 'direct') ev.scores = list.map(toText);
    else {
      ev.values = list.map(toText);
      if (!['benefit', 'cost'].includes(raw.type)) throw new Error(`${label}: neplatný typ (benefit/cost).`);
      ev.type = raw.type;
    }
  }
  return ev;
}

// Načte session verze '2' (celý model) i '1' (jen kritéria → alternativy výchozí).
export function importModel(data) {
  if (data?.method !== 'AHP') throw new Error('Soubor není AHP session.');
  if (!data.version) throw new Error('Chybí verze schématu.');
  const base = createInitialModel();

  if (String(data.version) === '1') {
    const names = checkNames(data.criteriaNames, MIN_CRIT, MAX_CRIT, 'kritérií');
    if (data.size !== names.length) throw new Error('Neplatný počet kritérií.');
    const n = names.length;
    return {
      ...base,
      nCrit: n,
      critNames: names.concat(DEFAULT_CRIT_NAMES.slice(n)),
      critMatrix: checkPairwise(data.matrix, n, 'Matice kritérií'),
      evals: Array.from({ length: n }, () => makeEvaluation(base.nAlts)),
    };
  }

  if (String(data.version) !== SCHEMA_VERSION) throw new Error(`Nepodporovaná verze schématu: ${data.version}.`);
  if (!Array.isArray(data.criteria) || !Array.isArray(data.alternatives)) throw new Error('Chybí kritéria nebo alternativy.');
  const cNames = checkNames(data.criteria.map((c) => c?.name), MIN_CRIT, MAX_CRIT, 'kritérií');
  const aNames = checkNames(data.alternatives.map((a) => a?.name), MIN_ALTS, MAX_ALTS, 'alternativ');
  const nCrit = cNames.length;
  const nAlts = aNames.length;
  return {
    nCrit,
    nAlts,
    critNames: cNames.concat(DEFAULT_CRIT_NAMES.slice(nCrit)),
    altNames: aNames.concat(DEFAULT_ALT_NAMES.slice(nAlts)),
    critMatrix: checkPairwise(data.criteriaMatrix, nCrit, 'Matice kritérií'),
    evals: data.criteria.map((c, j) => importEvaluation(c.evaluation, nAlts, cNames[j] || `Kritérium ${j + 1}`)),
  };
}

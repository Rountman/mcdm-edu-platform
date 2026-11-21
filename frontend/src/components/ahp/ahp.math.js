import { pairwisePriorities } from '../../lib/mcdm/ahp';

// Živý náhled vah a konzistence – stejný výpočet jako finální výsledek (lib/mcdm/ahp.ts,
// pyDecision ahp_method „mean“): průměr řádků normalizovaných sloupců, λmax = průměr (A·w)_i / w_i.
export function pairwiseConsistency(matrix) {
  const { weights, consistency: c } = pairwisePriorities(matrix);
  return { weights, lambdaMax: c.lambda_max, ci: c.ci, ri: c.ri, cr: c.cr, isConsistent: c.is_consistent };
}

export function formatSaaty(cell) {
  return cell < 1 ? `1/${Math.round(1 / cell)}` : String(Math.round(cell));
}

// Čísla se zadávají jako text, aby šla psát i desetinná čárka a záporné hodnoty.
export function parseNum(text) {
  if (typeof text === 'number') return text;
  const s = String(text ?? '').trim().replace(',', '.');
  if (s === '') return NaN;
  return Number(s);
}

export function fmt(x, digits = 3) {
  return Number.isFinite(x) ? x.toFixed(digits) : '–';
}

export function pct(x, digits = 1) {
  return `${(x * 100).toFixed(digits)} %`;
}

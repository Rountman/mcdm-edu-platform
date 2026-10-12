import { CR_THRESHOLD, RANDOM_INDEX } from './ahp.constants';

// Živý náhled vah a konzistence – stejný postup jako backend (pyDecision ahp_method,
// varianta „mean“): průměr řádků normalizovaných sloupců, λmax = průměr (A·w)_i / w_i.
export function pairwiseConsistency(matrix) {
  const n = matrix.length;
  const colSums = matrix[0].map((_, j) => matrix.reduce((s, row) => s + row[j], 0));
  const weights = matrix.map((row) => row.reduce((s, cell, j) => s + cell / colSums[j], 0) / n);
  const lambdaMax = matrix.reduce(
    (s, row, i) => s + row.reduce((acc, cell, j) => acc + cell * weights[j], 0) / weights[i],
    0,
  ) / n;
  if (n <= 2) return { weights, lambdaMax, ci: 0, ri: 0, cr: 0, isConsistent: true };
  const ci = (lambdaMax - n) / (n - 1);
  const ri = RANDOM_INDEX[n];
  const cr = ci / ri;
  return { weights, lambdaMax, ci, ri, cr, isConsistent: cr < CR_THRESHOLD };
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

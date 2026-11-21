// Ruční příklady převzaté z backend/test_ahp_full.py (čísla spočítaná na papíře).
import { describe, expect, it } from 'vitest';
import { McdmError, argsortDesc } from '../common';
import { computeAhpFull, pairwisePriorities, type AlternativeEvaluation } from '../ahp';
import { expectClose } from './helpers';

const C3 = [[1, 2, 2], [1 / 2, 1, 1], [1 / 2, 1, 1]];
const K1 = [[1, 3, 3], [1 / 3, 1, 1], [1 / 3, 1, 1]];
const CYCLIC = [[1, 9, 1 / 9], [1 / 9, 1, 9], [9, 1 / 9, 1]];
const req = (criteria_matrix: number[][], alternative_evaluations: AlternativeEvaluation[]) =>
  ({ criteria_matrix, alternative_evaluations });

describe('AHP – váhy a konzistence (pyDecision wd="m")', () => {
  it('konzistentní matice: w = (0,5; 0,25; 0,25), λmax = 3, CR = 0', () => {
    const r = pairwisePriorities(C3);
    expectClose(r.weights, [0.5, 0.25, 0.25]);
    expectClose(r.consistency.lambda_max, 3);
    expectClose(r.consistency.cr, 0);
    expect(r.consistency.ri).toBe(0.58);
  });

  it('n = 2: CI = RI = CR = 0', () => {
    const r = pairwisePriorities([[1, 3], [1 / 3, 1]]);
    expectClose(r.weights, [0.75, 0.25]);
    expect(r.consistency).toMatchObject({ ci: 0, ri: 0, cr: 0, is_consistent: true });
    expectClose(r.consistency.lambda_max, 2);
  });

  it('metoda je průměr normalizovaných sloupců, ne vlastní vektor', () => {
    // Pro tuto matici se obě metody liší ve 3. desetinném místě.
    const m = [[1, 3, 5, 7], [1 / 3, 1, 3, 5], [1 / 5, 1 / 3, 1, 3], [1 / 7, 1 / 5, 1 / 3, 1]];
    const w = pairwisePriorities(m).weights;
    const colSums = m[0].map((_, j) => m.reduce((s, row) => s + row[j], 0));
    const expected = m.map((row) => row.reduce((s, x, j) => s + x / colSums[j], 0) / 4);
    expectClose(w, expected, 1e-12);
    expectClose(w.reduce((a, b) => a + b, 0), 1, 1e-12);
  });
});

describe('AHP – kompletní model', () => {
  it('ruční příklad 3×3 (všechny párově)', () => {
    const r = computeAhpFull(req(C3, [
      { method: 'pairwise', matrix: K1 },
      { method: 'pairwise', matrix: [[1, 1 / 2, 1], [2, 1, 2], [1, 1 / 2, 1]] },
      { method: 'pairwise', matrix: [[1, 1, 1 / 4], [1, 1, 1 / 4], [4, 4, 1]] },
    ]));
    expectClose(r.criteria.weights, [0.5, 0.25, 0.25]);
    expectClose(r.local_priorities[0].normalized, [0.6, 0.2, 0.2]);
    expectClose(r.local_priorities[1].normalized, [0.25, 0.5, 0.25]);
    expectClose(r.local_priorities[2].normalized, [1 / 6, 1 / 6, 2 / 3]);
    expectClose(r.global_scores, [0.3 + 0.0625 + 0.25 / 6, 0.1 + 0.125 + 0.25 / 6, 0.1 + 0.0625 + 0.5 / 3]);
    expectClose(r.weighted_contributions[0], [0.3, 0.0625, 0.25 / 6]);
    expect(r.ranking).toEqual([0, 2, 1]);
    expect(r.inconsistent_matrices).toEqual([]);
  });

  it('kombinace metod pairwise / direct / smart cost', () => {
    const r = computeAhpFull(req(C3, [
      { method: 'pairwise', matrix: K1 },
      { method: 'direct', scores: [50, 30, 20] },
      { method: 'smart', values: [100, 200, 300], type: 'cost' },
    ]));
    expectClose(r.local_priorities[1].raw, [50, 30, 20]);
    expectClose(r.local_priorities[1].normalized, [0.5, 0.3, 0.2]);
    expectClose(r.local_priorities[2].raw, [1, 0.5, 0]);
    expectClose(r.local_priorities[2].normalized, [2 / 3, 1 / 3, 0]);
    expect(r.local_priorities[1].consistency).toBeNull();
    expectClose(r.global_scores, [0.3 + 0.125 + 0.5 / 3, 0.1 + 0.075 + 0.25 / 3, 0.15]);
    expect(r.ranking).toEqual([0, 1, 2]);
  });

  it('n = 2 kritéria i alternativy', () => {
    const r = computeAhpFull(req([[1, 3], [1 / 3, 1]], [
      { method: 'pairwise', matrix: [[1, 1 / 4], [4, 1]] },
      { method: 'direct', scores: [40, 60] },
    ]));
    expectClose(r.local_priorities[0].normalized, [0.2, 0.8]);
    expectClose(r.global_scores, [0.25, 0.75]);
    expect(r.ranking).toEqual([1, 0]);
  });

  it('shodné SMART hodnoty a nulové body → rovnoměrné priority', () => {
    for (const type of ['benefit', 'cost'] as const) {
      const r = computeAhpFull(req(C3, [
        { method: 'smart', values: [7, 7, 7], type },
        { method: 'direct', scores: [0, 0, 0] },
        { method: 'direct', scores: [0, 50, 0] },
      ]));
      expectClose(r.local_priorities[0].raw, [0, 0, 0]);
      expectClose(r.local_priorities[0].normalized, [1 / 3, 1 / 3, 1 / 3]);
      expectClose(r.local_priorities[1].normalized, [1 / 3, 1 / 3, 1 / 3]);
      expectClose(r.local_priorities[2].normalized, [0, 1, 0]);
    }
  });

  it('hlásí nekonzistentní matice', () => {
    const r = computeAhpFull(req(CYCLIC, [
      { method: 'direct', scores: [1, 2, 3] },
      { method: 'pairwise', matrix: CYCLIC },
      { method: 'pairwise', matrix: K1 },
    ]));
    expect(r.inconsistent_matrices.map((m) => [m.target, m.criterion])).toEqual([['criteria', null], ['alternatives', 1]]);
    expect(r.criteria.consistency.cr).toBeGreaterThan(0.1);
  });

  it('validace vrací české zprávy jako backend (422)', () => {
    const ok = [{ method: 'direct', scores: [1, 2] }] as AlternativeEvaluation[];
    const cases: [number[][], AlternativeEvaluation[], string][] = [
      [[[1, 2, 2], [1, 1, 1], [1 / 2, 1, 1]], [...ok, ...ok, ...ok], 'reciproční'],
      [[[1, 2], [1 / 2, 1, 3]], [...ok, ...ok], 'čtvercová'],
      [[[1, -2], [-0.5, 1]], [...ok, ...ok], 'kladná'],
      [C3, [...ok, ...ok], 'neodpovídá počtu kritérií'],
    ];
    for (const [m, evals, fragment] of cases) {
      expect(() => computeAhpFull(req(m, evals))).toThrow(McdmError);
      expect(() => computeAhpFull(req(m, evals))).toThrow(fragment);
    }
  });
});

describe('argsortDesc', () => {
  it('při shodě zachová nižší index první (jako np.argsort pro malá pole)', () => {
    expect(argsortDesc([0.2, 0.5, 0.2, 0.5])).toEqual([1, 3, 0, 2]);
  });
});

// Společné pomocné funkce. Čisté funkce bez UI, chování odpovídá NumPy v backend/main.py.

/** Chyba vstupu – odpovídá 422 s `detail` z původního API. */
export class McdmError extends Error {
  readonly detail: string;
  constructor(detail: string) {
    super(detail);
    this.name = 'McdmError';
    this.detail = detail;
  }
}

export const sum = (xs: readonly number[]): number => xs.reduce((s, x) => s + x, 0);

export const mean = (xs: readonly number[]): number => sum(xs) / xs.length;

/**
 * Indexy od největší hodnoty po nejmenší, při shodě nižší index první.
 * Odpovídá np.argsort(-x) – pro pole ≤ 16 prvků NumPy třídí stabilně (insertion sort).
 */
export function argsortDesc(xs: readonly number[]): number[] {
  return xs.map((_, i) => i).sort((a, b) => xs[b] - xs[a]);
}

export type CriterionType = 'benefit' | 'cost';

/**
 * Min-max hodnotová funkce: benefit (x − min)/rozsah, cost (max − x)/rozsah.
 * Shodné hodnoty → rozsah 1, tedy samé nuly (jako backend).
 */
export function minMaxValue(values: readonly number[], kind: CriterionType | string): number[] {
  const mn = Math.min(...values);
  const mx = Math.max(...values);
  const rng = mx !== mn ? mx - mn : 1;
  return kind === 'cost' ? values.map((x) => (mx - x) / rng) : values.map((x) => (x - mn) / rng);
}

/** Matice [řádky][sloupce] → sloupec j. */
export const column = (m: readonly (readonly number[])[], j: number): number[] => m.map((row) => row[j]);

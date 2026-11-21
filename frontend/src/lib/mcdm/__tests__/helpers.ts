import { expect } from 'vitest';

export const TOL = 1e-6;

/** Rekurzivní porovnání: čísla s tolerancí, ostatní hodnoty přesně. */
export function expectClose(actual: unknown, expected: unknown, tol = TOL, path = '$'): void {
  if (typeof expected === 'number') {
    expect(typeof actual, `${path}: typ`).toBe('number');
    expect(Math.abs((actual as number) - expected), `${path}: ${actual} vs ${expected}`).toBeLessThanOrEqual(tol);
    return;
  }
  if (Array.isArray(expected)) {
    expect(Array.isArray(actual), `${path}: má být pole`).toBe(true);
    expect((actual as unknown[]).length, `${path}: délka`).toBe(expected.length);
    expected.forEach((e, i) => expectClose((actual as unknown[])[i], e, tol, `${path}[${i}]`));
    return;
  }
  if (expected !== null && typeof expected === 'object') {
    expect(actual !== null && typeof actual === 'object', `${path}: má být objekt`).toBe(true);
    const a = actual as Record<string, unknown>;
    expect(Object.keys(a).sort(), `${path}: klíče`).toEqual(Object.keys(expected).sort());
    for (const [k, e] of Object.entries(expected)) expectClose(a[k], e, tol, `${path}.${k}`);
    return;
  }
  expect(actual, path).toEqual(expected);
}

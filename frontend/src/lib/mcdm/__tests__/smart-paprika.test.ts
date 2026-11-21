import { describe, expect, it } from 'vitest';
import { McdmError } from '../common';
import { calculatePaprika } from '../paprika';
import { calculateSmart } from '../smart';
import { expectClose } from './helpers';

describe('SMART', () => {
  it('ruční příklad s benefit/cost', () => {
    // váhy 50/30/20 → 0,5/0,3/0,2
    // K1 benefit 80,60,40 → 1; 0,5; 0   K2 cost 20,40,90 → 1; 50/70; 0   K3 benefit 50,50,10 → 1; 1; 0
    const r = calculateSmart({
      weights: [50, 30, 20],
      ratings: [[80, 20, 50], [60, 40, 50], [40, 90, 10]],
      criteria_types: ['benefit', 'cost', 'benefit'],
    });
    expectClose(r.normalized_weights, [0.5, 0.3, 0.2]);
    expectClose(r.normalized_ratings, [[1, 1, 1], [0.5, 50 / 70, 1], [0, 0, 0]]);
    expectClose(r.scores, [1, 0.25 + 0.3 * (50 / 70) + 0.2, 0]);
    expect(r.ranking).toEqual([0, 1, 2]);
  });

  it('nulový součet vah → chyba místo NaN', () => {
    expect(() => calculateSmart({ weights: [0, 0], ratings: [[1, 2], [3, 4]], criteria_types: ['benefit', 'benefit'] }))
      .toThrow(McdmError);
  });
});

describe('PAPRIKA', () => {
  it('váhy z vítězství s Laplaceovým vyhlazením', () => {
    // vítězové 0, 2, 2 → wins (2, 1, 3) / 6
    const r = calculatePaprika({
      ratings: [[8, 3, 5], [6, 7, 5], [2, 9, 1]],
      comparisons: [{ i: 0, j: 1, winner: 0 }, { i: 0, j: 2, winner: 2 }, { i: 1, j: 2, winner: 2 }],
    });
    expectClose(r.weights, [1 / 3, 1 / 6, 1 / 2]);
    expect(r.criteria_wins).toEqual([1, 0, 2]);
    expectClose(r.normalized_ratings, [[1, 0, 1], [4 / 6, 4 / 6, 1], [0, 1, 0]]);
    expectClose(r.scores, [1 / 3 + 1 / 2, 2 / 9 + 1 / 9 + 1 / 2, 1 / 6]);
  });
});

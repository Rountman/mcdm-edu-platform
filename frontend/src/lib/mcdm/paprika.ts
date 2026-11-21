// PAPRIKA (zjednodušená výuková varianta) – port POST /api/calculate-paprika z backend/main.py.

import { McdmError, argsortDesc, column, minMaxValue, sum } from './common';

export interface PAPRIKAComparison {
  i: number;
  j: number;
  winner: number; // index vítězného kritéria
}

export interface PAPRIKARequest {
  ratings: number[][]; // [n_alts][n_crits], 1–10
  comparisons: PAPRIKAComparison[];
}

export interface PAPRIKAResponse {
  weights: number[];
  scores: number[];
  normalized_ratings: number[][];
  ranking: number[]; // 0-indexed, nejlepší první
  criteria_wins: number[];
}

export function calculatePaprika(req: PAPRIKARequest): PAPRIKAResponse {
  const nCrits = req.ratings[0].length;

  // Váhy z vítězství v párových trade-off srovnáních (Laplaceovo vyhlazení +1)
  const wins = Array<number>(nCrits).fill(1);
  for (const comp of req.comparisons) {
    const w = Math.trunc(comp.winner);
    if (!(w >= 0 && w < nCrits)) throw new McdmError(`Neplatný index vítězného kritéria: ${comp.winner}.`);
    wins[w] += 1;
  }
  const total = sum(wins);
  const weights = wins.map((w) => w / total);

  // Min-max normalizace po kritériích (vždy benefit, škála 1–10)
  const valueCols = Array.from({ length: nCrits }, (_, j) => minMaxValue(column(req.ratings, j), 'benefit'));
  const v = req.ratings.map((_, i) => valueCols.map((col) => col[i]));

  const scores = v.map((row) => sum(row.map((x, j) => x * weights[j])));
  return {
    weights,
    scores,
    normalized_ratings: v,
    ranking: argsortDesc(scores),
    criteria_wins: wins.map((w) => w - 1),
  };
}

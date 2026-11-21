// SMART – port POST /api/calculate-smart z backend/main.py.

import { McdmError, argsortDesc, column, minMaxValue, sum } from './common';

export interface SMARTRequest {
  weights: number[]; // přímé váhy 0–100, jedna na kritérium
  ratings: number[][]; // [n_alts][n_crits]
  criteria_types: string[]; // "benefit" | "cost"; cokoli jiného než "cost" = benefit
}

export interface SMARTResponse {
  scores: number[];
  normalized_weights: number[];
  normalized_ratings: number[][];
  ranking: number[]; // 0-indexed, nejlepší první
}

export function calculateSmart(req: SMARTRequest): SMARTResponse {
  const total = sum(req.weights);
  // Backend zde dělil nulou a vracel 500 (NaN nejde do JSON); tady srozumitelná chyba.
  if (!(total > 0)) throw new McdmError('Součet vah kritérií musí být kladný.');
  const wNorm = req.weights.map((w) => w / total);

  const nCrits = req.ratings[0].length;
  const valueCols = Array.from({ length: nCrits }, (_, j) => minMaxValue(column(req.ratings, j), req.criteria_types[j]));
  const v = req.ratings.map((_, i) => valueCols.map((col) => col[i]));

  const scores = v.map((row) => sum(row.map((x, j) => x * wNorm[j])));
  return {
    scores,
    normalized_weights: wNorm,
    normalized_ratings: v,
    ranking: argsortDesc(scores),
  };
}

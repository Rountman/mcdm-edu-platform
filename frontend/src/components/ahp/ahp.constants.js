export const ACCENT = '#0057FF';
export const ACCENT2 = '#FF3B5C';
export const BG = '#FFFFFF';
export const PANEL = '#F5F7FA';
export const PANEL2 = '#EEF1F6';
export const BORDER = '#DDE3ED';
export const TEXT = '#0D1526';
export const MUTED = '#8896AE';
export const SAATY_STEPS = [-9, -8, -7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
export const STEP_COUNT = SAATY_STEPS.length;
export const CENTER_IDX = 9;

export const MIN_CRIT = 2;
export const MAX_CRIT = 8;
export const MIN_ALTS = 2;
export const MAX_ALTS = 6;
export const CR_THRESHOLD = 0.1;
// Saatyho náhodné indexy (stejná tabulka jako backend / pyDecision)
export const RANDOM_INDEX = [0, 0, 0, 0.58, 0.9, 1.12, 1.24, 1.32, 1.41, 1.45, 1.49, 1.51, 1.48, 1.56, 1.57, 1.59];

export const ALT_METHODS = [
  { id: 'pairwise', label: 'Párově', hint: 'Saatyho škála mezi alternativami' },
  { id: 'direct', label: 'Přímo', hint: 'Body 0–100 pro každou alternativu' },
  { id: 'smart', label: 'SMART', hint: 'Skutečné hodnoty + benefit/cost' },
];
export const DEFAULT_ALT_METHOD = 'pairwise';
export const METHOD_LABELS = Object.fromEntries(ALT_METHODS.map((m) => [m.id, m.label]));
export const SUCCESS = '#059669';

import { tokens } from '../../styles/tokens';

// Barvy z design tokenů. ACCENT2 = „druhá strana“ srovnání (fialová), DANGER = jen chyby a nekonzistence.
export const ACCENT = tokens.primary;
export const ACCENT2 = tokens.secondary;
export const DANGER = tokens.danger;
export const BG = tokens.surface;
export const PANEL = tokens.surface2;
export const PANEL2 = tokens.surface3;
export const BORDER = tokens.border;
export const TEXT = tokens.text;
export const MUTED = tokens.textMuted;
export const BAR_NEUTRAL = tokens.barNeutral;
export const SAATY_STEPS = [-9, -8, -7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
export const STEP_COUNT = SAATY_STEPS.length;
export const CENTER_IDX = 9;

export const MIN_CRIT = 2;
export const MAX_CRIT = 8;
export const MIN_ALTS = 2;
export const MAX_ALTS = 6;
// Saatyho náhodné indexy a práh CR – jediný zdroj je výpočetní knihovna
export { CR_THRESHOLD, RANDOM_INDEX } from '../../lib/mcdm/ahp';

export const ALT_METHODS = [
  { id: 'pairwise', label: 'Párově', labelEn: 'Pairwise', hint: 'Saatyho škála mezi alternativami', hintEn: 'Saaty scale between alternatives' },
  { id: 'direct', label: 'Přímo', labelEn: 'Direct', hint: 'Body 0–100 pro každou alternativu', hintEn: 'Points 0–100 for each alternative' },
  { id: 'smart', label: 'SMART', labelEn: 'SMART', hint: 'Skutečné hodnoty + benefit/cost', hintEn: 'Actual values + benefit/cost' },
];
export const DEFAULT_ALT_METHOD = 'pairwise';
export const METHOD_LABELS = Object.fromEntries(ALT_METHODS.map((m) => [m.id, m.label]));
export const METHOD_LABELS_EN = Object.fromEntries(ALT_METHODS.map((m) => [m.id, m.labelEn]));
export const SUCCESS = tokens.success;

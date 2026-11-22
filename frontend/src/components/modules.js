// Moduly platformy – pořadí určuje menu i URL (#/<slug>/<tab>). URL zůstávají česky v obou jazycích.
export const MODULES = [
  { slug: 'ahp', label: { cs: 'Metoda AHP', en: 'AHP method' } },
  { slug: 'smart', label: { cs: 'Metoda SMART', en: 'SMART method' } },
  { slug: 'paprika', label: { cs: 'Metoda PAPRIKA', en: 'PAPRIKA method' } },
  { slug: 'citlivost', label: { cs: 'Analýza citlivosti', en: 'Sensitivity analysis' } },
  { slug: 'stromy', label: { cs: 'Rozhodovací stromy', en: 'Decision trees' } },
];

export const TAB_SLUGS = ['teorie', 'lab'];
export const TAB_LABELS = [
  { cs: 'Teorie', en: 'Theory' },
  { cs: 'Laboratoř', en: 'Lab' },
];

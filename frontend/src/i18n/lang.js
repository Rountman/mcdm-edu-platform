import { createContext, useContext } from 'react';

export const LANGS = ['cs', 'en'];

export const LanguageContext = createContext({
  lang: 'cs',
  setLang: () => {},
  tr: (cs) => cs,
});

/** const { lang, setLang, tr } = useLang();  tr('Výsledky', 'Results') */
export const useLang = () => useContext(LanguageContext);

// Chybové hlášky výpočetní knihovny (lib/mcdm) jsou česky; knihovnu neměníme,
// v angličtině je překládáme až při zobrazení. Neznámá hláška zůstane v originále.
const LABELS = [
  [/Matice kritérií/g, 'Criteria matrix'],
  [/Kritérium (\d+) – párová matice alternativ/g, 'Criterion $1 – pairwise matrix of alternatives'],
  [/Kritérium (\d+)/g, 'Criterion $1'],
];
const LIB_MESSAGES = [
  [/^Součet vah kritérií musí být kladný\.$/, 'The sum of criteria weights must be positive.'],
  [/^Neplatný index vítězného kritéria: (.*)\.$/, 'Invalid index of the winning criterion: $1.'],
  [/: rozměr musí být (.*), je (.*)\.$/, ': size must be $1, got $2.'],
  [/: matice musí být čtvercová \((.*)\)\.$/, ': the matrix must be square ($1).'],
  [/: všechny hodnoty musí být kladná konečná čísla \(řádek (\d+), sloupec (\d+)\)\.$/, ': all values must be positive finite numbers (row $1, column $2).'],
  [/: na diagonále musí být 1 \(řádek (\d+)\)\.$/, ': the diagonal must be 1 (row $1).'],
  [/: matice není reciproční \(prvky (.*) a (.*)\)\.$/, ': the matrix is not reciprocal (elements $1 and $2).'],
  [/^Počet hodnocení alternativ \((\d+)\) neodpovídá počtu kritérií \((\d+)\)\.$/, 'Number of alternative evaluations ($1) does not match the number of criteria ($2).'],
  [/: body přímého hodnocení musí být v rozsahu 0–100\.$/, ': direct rating points must be between 0 and 100.'],
  [/: hodnoty SMART musí být konečná čísla\.$/, ': SMART values must be finite numbers.'],
  [/: počet alternativ musí být (.*), je (.*)\.$/, ': the number of alternatives must be $1, got $2.'],
  [/: počet alternativ \((\d+)\) se liší od ostatních kritérií \((\d+)\)\.$/, ': the number of alternatives ($1) differs from other criteria ($2).'],
  [/^Výpočet se nezdařil kvůli neočekávané chybě\.$/, 'The calculation failed due to an unexpected error.'],
  [/^Výpočet se nezdařil\.$/, 'The calculation failed.'],
];

export function translateLibMessage(msg, lang) {
  if (lang !== 'en' || typeof msg !== 'string') return msg;
  for (const [re, en] of LIB_MESSAGES) {
    if (re.test(msg)) {
      let out = msg.replace(re, en);
      for (const [lre, len] of LABELS) out = out.replace(lre, len);
      return out;
    }
  }
  return msg;
}

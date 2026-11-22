// Prezentace pořadí: zvýraznit vítěze jen při jednoznačném prvním místě.
const EPS = 1e-9;

/** Kolik položek sdílí první místo (hodnoty seřazené sestupně). */
export function tiedAtTop(sortedValues) {
  if (sortedValues.length === 0) return 0;
  return sortedValues.filter((v) => Math.abs(v - sortedValues[0]) < EPS).length;
}

/** Text upozornění při shodě na prvním místě (v daném jazyce), jinak null. */
export function tieNote(sortedValues, lang = 'cs') {
  const n = tiedAtTop(sortedValues);
  if (n < 2) return null;
  if (lang === 'en') {
    return `Tie for first place (${n} alternatives with the same score) – their order is not decided.`;
  }
  const word = n < 5 ? 'alternativy' : 'alternativ';
  return `Shoda na prvním místě (${n} ${word} se stejným skóre) – pořadí mezi nimi není rozhodnuté.`;
}

import { useMemo, useRef, useState } from 'react';
import './PAPRIKALab.css';
import PAPRIKAResults from './PAPRIKAResults';
import { calculatePaprika, McdmError } from '../../lib/mcdm/api';

const MAX_CRIT = 6;
const MAX_ALTS = 5;
const DEFAULT_CRIT_NAMES = Array.from({ length: MAX_CRIT }, (_, i) => `K${i + 1}`);
const DEFAULT_ALT_NAMES  = Array.from({ length: MAX_ALTS }, (_, i) => `A${i + 1}`);
const SCHEMA_VERSION = '1';

function makeRatings(nAlts, nCrit) {
  return Array.from({ length: nAlts }, () => Array.from({ length: nCrit }, () => 5));
}

export default function PAPRIKALab() {
  const [nCrit, setNCrit]   = useState(3);
  const [nAlts, setNAlts]   = useState(3);
  const [critNames, setCritNames] = useState(DEFAULT_CRIT_NAMES);
  const [altNames, setAltNames]   = useState(DEFAULT_ALT_NAMES);
  const [ratings, setRatings]     = useState(() => makeRatings(MAX_ALTS, MAX_CRIT));
  // comparisons[k] = winner criterion index (null = unanswered)
  const [comparisons, setComparisons] = useState({});
  const [results, setResults]   = useState(null);
  const [loading, setLoading]   = useState(false);
  const [importError, setImportError] = useState(null);
  const [calcError, setCalcError] = useState(null);
  const fileRef = useRef(null);

  const cNames = critNames.slice(0, nCrit);
  const aNames = altNames.slice(0, nAlts);

  // Generate all unique pairs (i, j) with i < j
  const pairs = useMemo(() => {
    const p = [];
    for (let i = 0; i < nCrit; i++)
      for (let j = i + 1; j < nCrit; j++)
        p.push({ i, j });
    return p;
  }, [nCrit]);

  const answeredCount = pairs.filter(({ i, j }) => comparisons[`${i}-${j}`] != null).length;
  const allAnswered = answeredCount === pairs.length;

  const setRating = (ai, j, val) =>
    setRatings(prev => prev.map((row, r) =>
      r === ai ? row.map((c, ci) => (ci === j ? Number(val) : c)) : row
    ));

  const setWinner = (i, j, winner) => {
    setComparisons(prev => ({ ...prev, [`${i}-${j}`]: winner }));
    setResults(null);
  };

  const handleCalc = async () => {
    if (!allAnswered) return;
    setLoading(true);
    setCalcError(null);
    try {
      const comps = pairs.map(({ i, j }) => ({
        i, j, winner: comparisons[`${i}-${j}`],
      }));
      setResults(await calculatePaprika({
        ratings: ratings.slice(0, nAlts).map(row => row.slice(0, nCrit)),
        comparisons: comps,
      }));
    } catch (err) {
      setResults(null);
      setCalcError(err instanceof McdmError ? err.detail : 'Výpočet se nezdařil kvůli neočekávané chybě.');
      if (!(err instanceof McdmError)) console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const payload = {
      version: SCHEMA_VERSION, method: 'PAPRIKA', savedAt: new Date().toISOString(),
      nCrit, nAlts,
      criteriaNames: cNames, altNames: aNames,
      ratings: ratings.slice(0, nAlts).map(row => row.slice(0, nCrit)),
      comparisons,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `paprika-session-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const d = JSON.parse(ev.target.result);
        if (d.method !== 'PAPRIKA') throw new Error('Soubor není PAPRIKA session.');
        const { nCrit: nc, nAlts: na, criteriaNames: cn, altNames: an, ratings: r, comparisons: c } = d;
        if (!Number.isInteger(nc) || nc < 2 || nc > MAX_CRIT) throw new Error('Neplatný počet kritérií.');
        if (!Number.isInteger(na) || na < 2 || na > MAX_ALTS) throw new Error('Neplatný počet alternativ.');
        setNCrit(nc); setNAlts(na);
        setCritNames(cn.concat(DEFAULT_CRIT_NAMES.slice(cn.length)));
        setAltNames(an.concat(DEFAULT_ALT_NAMES.slice(an.length)));
        const fullRatings = makeRatings(MAX_ALTS, MAX_CRIT);
        r.forEach((row, ai) => row.forEach((v, ci) => { fullRatings[ai][ci] = v; }));
        setRatings(fullRatings);
        setComparisons(c || {});
        setResults(null); setImportError(null);
      } catch (err) { setImportError(err.message); }
    };
    reader.readAsText(file);
  };

  const remaining = pairs.length - answeredCount;

  return (
    <div className="pap-root">
      {/* Toolbar */}
      <div className="pap-toolbar">
        <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImportFile} />
        <button type="button" className="pap-tbtn" onClick={() => fileRef.current?.click()}>
          <svg width="16" height="16" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M7 1v8M3.5 5.5 7 2l3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M1.5 10v1.5A1 1 0 0 0 2.5 12.5h9a1 1 0 0 0 1-1V10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
          Načíst data
        </button>
        <button type="button" className="pap-tbtn pap-tbtn--primary" onClick={handleExport}>
          <svg width="16" height="16" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M7 9V1M3.5 5.5 7 9l3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M1.5 10v1.5A1 1 0 0 0 2.5 12.5h9a1 1 0 0 0 1-1V10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
          Uložit data
        </button>
        {importError && <span className="pap-tbtn-error" role="alert">{importError}</span>}
      </div>

      {/* Step 1 – Setup */}
      <section className="pap-card" aria-labelledby="pap-step1">
        <h2 className="pap-step-tag" id="pap-step1">
          <span className="pap-step-badge" aria-hidden="true">1</span>
          Definice kritérií a alternativ
        </h2>
        <div className="pap-config-row">
          <div>
            <label className="pap-field-label" htmlFor="pap-n-crit">Počet kritérií</label>
            <select id="pap-n-crit" className="pap-select" value={nCrit}
              onChange={e => { setNCrit(Number(e.target.value)); setComparisons({}); setResults(null); }}>
              {[2,3,4,5,6].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <label className="pap-field-label" htmlFor="pap-n-alts">Počet alternativ</label>
            <select id="pap-n-alts" className="pap-select" value={nAlts}
              onChange={e => { setNAlts(Number(e.target.value)); setResults(null); }}>
              {[2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>

        <div className="pap-names-row">
          <fieldset>
            <legend className="pap-field-label">Názvy kritérií</legend>
            <div className="pap-name-grid">
              {cNames.map((name, j) => (
                <input key={j} className="pap-name-input" value={name}
                  aria-label={`Název kritéria ${j + 1}`}
                  onChange={e => {
                    const next = [...critNames]; next[j] = e.target.value;
                    setCritNames(next); setResults(null);
                  }} />
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="pap-field-label">Názvy alternativ</legend>
            <div className="pap-name-grid">
              {aNames.map((name, ai) => (
                <input key={ai} className="pap-name-input" value={name}
                  aria-label={`Název alternativy ${ai + 1}`}
                  onChange={e => {
                    const next = [...altNames]; next[ai] = e.target.value;
                    setAltNames(next); setResults(null);
                  }} />
              ))}
            </div>
          </fieldset>
        </div>
      </section>

      {/* Step 2 – Ratings table */}
      <section className="pap-card" aria-labelledby="pap-step2">
        <h2 className="pap-step-tag" id="pap-step2">
          <span className="pap-step-badge" aria-hidden="true">2</span>
          Hodnocení alternativ
          <span className="pap-step-note">škála 1–10</span>
        </h2>
        <div className="pap-table-wrap">
          <table className="pap-table">
            <thead>
              <tr>
                <th scope="col" className="pap-th-empty">Alternativa</th>
                {cNames.map((cn, j) => <th key={j} scope="col" className="pap-th">{cn}</th>)}
              </tr>
            </thead>
            <tbody>
              {aNames.map((an, ai) => (
                <tr key={ai}>
                  <th scope="row" className="pap-td-alt">{an}</th>
                  {cNames.map((cn, j) => (
                    <td key={j} className="pap-td">
                      <input
                        type="number" min={1} max={10} step={1}
                        className="pap-rating-input"
                        aria-label={`Hodnocení ${an} podle ${cn}`}
                        value={ratings[ai][j]}
                        onChange={e => { setRating(ai, j, e.target.value); setResults(null); }}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Step 3 – Pairwise comparisons */}
      <section className="pap-card" aria-labelledby="pap-step3">
        <h2 className="pap-step-tag" id="pap-step3">
          <span className="pap-step-badge" aria-hidden="true">3</span>
          Párová srovnání kritérií (kompromisy)
        </h2>
        <p className="pap-comp-intro">
          U každé dvojice vyberte variantu, kterou byste preferoval/a. Varianta má na jednom kritériu
          nejlepší hodnotu (10/10) a na druhém nejhorší (1/10), ostatní kritéria jsou na střední hodnotě.
        </p>
        <div className="pap-progress">
          <div className="pap-progress-track" aria-hidden="true">
            <div className="pap-progress-bar" style={{ width: `${pairs.length ? (answeredCount / pairs.length) * 100 : 0}%` }} />
          </div>
          <span className="pap-progress-text" role="status">
            Zodpovězeno {answeredCount} z {pairs.length}
          </span>
        </div>
        <div className="pap-comp-grid">
          {pairs.map(({ i, j }) => {
            const key = `${i}-${j}`;
            const winner = comparisons[key];
            const choice = (w, hi, lo) => (
              <button
                type="button"
                className={`pap-choice${winner === w ? ' pap-choice--selected' : ''}`}
                aria-pressed={winner === w}
                onClick={() => setWinner(i, j, w)}
              >
                {winner === w && (
                  <span className="pap-choice-check" aria-hidden="true">
                    <svg width="12" height="12" viewBox="0 0 16 16"><path d="M3 8.5 6.5 12 13 4.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </span>
                )}
                <span className="pap-choice-header">Přednost {cNames[w]}</span>
                <span className="pap-choice-vals">
                  <span className="pap-choice-hi">{cNames[hi]}: 10/10</span>
                  <span className="pap-choice-lo">{cNames[lo]}: 1/10</span>
                </span>
              </button>
            );
            return (
              <fieldset key={key} className={`pap-comp-card${winner != null ? ' pap-comp-card--done' : ''}`}>
                <legend className="pap-comp-label">
                  {cNames[i]} <span className="pap-comp-vs">vs</span> {cNames[j]}
                </legend>
                <div className="pap-comp-choices">
                  {choice(i, i, j)}
                  {choice(j, j, i)}
                </div>
              </fieldset>
            );
          })}
        </div>
      </section>

      <div className="pap-calc-row">
        <button
          type="button"
          className="pap-calc-btn"
          onClick={handleCalc}
          disabled={loading || !allAnswered}
          aria-describedby={!allAnswered ? 'pap-calc-hint' : undefined}
        >
          {loading ? 'Počítám…' : 'Vypočítat pořadí'}
        </button>
        {!allAnswered && (
          <p id="pap-calc-hint" className="u-alert u-alert--warning pap-warn">
            V kroku 3 zbývá zodpovědět srovnání: {remaining}.
          </p>
        )}
        {calcError && <p className="pap-tbtn-error" role="alert">{calcError}</p>}
      </div>

      <section aria-labelledby="pap-step4" aria-live="polite">
        <h2 className="pap-step-tag" id="pap-step4">
          <span className="pap-step-badge" aria-hidden="true">4</span>
          Výsledky
        </h2>
        {results ? (
          <PAPRIKAResults results={results} criteriaNames={cNames} altNames={aNames} />
        ) : (
          <div className="u-placeholder">
            Výsledky zatím nejsou spočtené. Zodpovězte všechna srovnání a stiskněte „Vypočítat pořadí“.
          </div>
        )}
      </section>
    </div>
  );
}

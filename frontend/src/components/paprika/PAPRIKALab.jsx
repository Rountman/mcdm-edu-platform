import { useMemo, useRef, useState } from 'react';
import './PAPRIKALab.css';
import PAPRIKAResults from './PAPRIKAResults';

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
    try {
      const comps = pairs.map(({ i, j }) => ({
        i, j, winner: comparisons[`${i}-${j}`],
      }));
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/calculate-paprika`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ratings: ratings.slice(0, nAlts).map(row => row.slice(0, nCrit)),
          comparisons: comps,
        }),
      });
      setResults(await res.json());
    } catch (err) {
      console.error(err);
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

  return (
    <div className="pap-root">
      {/* Toolbar */}
      <div className="pap-toolbar">
        <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImportFile} />
        <button className="pap-tbtn" onClick={() => fileRef.current?.click()}>
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M7 1v8M3.5 5.5 7 2l3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M1.5 10v1.5A1 1 0 0 0 2.5 12.5h9a1 1 0 0 0 1-1V10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
          Načíst data
        </button>
        <button className="pap-tbtn pap-tbtn--primary" onClick={handleExport}>
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M7 9V1M3.5 5.5 7 9l3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M1.5 10v1.5A1 1 0 0 0 2.5 12.5h9a1 1 0 0 0 1-1V10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
          Uložit data
        </button>
        {importError && <span className="pap-tbtn-error">{importError}</span>}
      </div>

      {/* Step 1 – Setup */}
      <div className="pap-card">
        <div className="pap-step-tag">
          <span className="pap-step-badge">1</span>
          Definice kritérií a alternativ
        </div>
        <div className="pap-config-row">
          <div>
            <div className="pap-field-label">Počet kritérií</div>
            <select className="pap-select" value={nCrit}
              onChange={e => { setNCrit(Number(e.target.value)); setComparisons({}); setResults(null); }}>
              {[2,3,4,5,6].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <div className="pap-field-label">Počet alternativ</div>
            <select className="pap-select" value={nAlts}
              onChange={e => { setNAlts(Number(e.target.value)); setResults(null); }}>
              {[2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>

        <div className="pap-names-row">
          <div>
            <div className="pap-field-label">Kritéria</div>
            <div className="pap-name-grid">
              {cNames.map((name, j) => (
                <input key={j} className="pap-name-input" value={name}
                  onChange={e => {
                    const next = [...critNames]; next[j] = e.target.value;
                    setCritNames(next); setResults(null);
                  }} />
              ))}
            </div>
          </div>
          <div>
            <div className="pap-field-label">Alternativy</div>
            <div className="pap-name-grid">
              {aNames.map((name, ai) => (
                <input key={ai} className="pap-name-input" value={name}
                  onChange={e => {
                    const next = [...altNames]; next[ai] = e.target.value;
                    setAltNames(next); setResults(null);
                  }} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Step 2 – Ratings table */}
      <div className="pap-card">
        <div className="pap-step-tag">
          <span className="pap-step-badge">2</span>
          Hodnocení alternativ
          <span style={{ marginLeft: 'auto', fontSize: '0.58rem' }}>Škála 1–10</span>
        </div>
        <div className="pap-table-wrap">
          <table className="pap-table">
            <thead>
              <tr>
                <th className="pap-th-empty" />
                {cNames.map((cn, j) => <th key={j} className="pap-th">{cn}</th>)}
              </tr>
            </thead>
            <tbody>
              {aNames.map((an, ai) => (
                <tr key={ai}>
                  <td className="pap-td-alt">{an}</td>
                  {cNames.map((_, j) => (
                    <td key={j} className="pap-td">
                      <input
                        type="number" min={1} max={10} step={1}
                        className="pap-rating-input"
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
      </div>

      {/* Step 3 – Pairwise comparisons */}
      <div className="pap-card">
        <div className="pap-step-tag">
          <span className="pap-step-badge">3</span>
          Párová srovnání kritérií — kompromisy
          <span style={{ marginLeft: 'auto', fontSize: '0.58rem' }}>
            {answeredCount} / {pairs.length} zodpovězeno
          </span>
        </div>
        <p className="pap-comp-intro">
          Vyberte, které ze dvou hypotetických variant byste preferoval/a.
          Každá varianta představuje extrémní hodnotu na dvou kritériích — ostatní jsou na střední hodnotě.
        </p>
        <div className="pap-comp-grid">
          {pairs.map(({ i, j }) => {
            const key = `${i}-${j}`;
            const winner = comparisons[key];
            return (
              <div key={key} className={`pap-comp-card${winner != null ? ' pap-comp-card--done' : ''}`}>
                <div className="pap-comp-label">
                  {cNames[i]} <span className="pap-comp-vs">vs</span> {cNames[j]}
                </div>
                <div className="pap-comp-choices">
                  <button
                    className={`pap-choice${winner === i ? ' pap-choice--selected' : ''}`}
                    onClick={() => setWinner(i, j, i)}
                  >
                    <div className="pap-choice-header">{cNames[i]}</div>
                    <div className="pap-choice-vals">
                      <span className="pap-choice-hi">{cNames[i]}: 10/10</span>
                      <span className="pap-choice-lo">{cNames[j]}: 1/10</span>
                    </div>
                  </button>
                  <button
                    className={`pap-choice${winner === j ? ' pap-choice--selected' : ''}`}
                    onClick={() => setWinner(i, j, j)}
                  >
                    <div className="pap-choice-header">{cNames[j]}</div>
                    <div className="pap-choice-vals">
                      <span className="pap-choice-lo">{cNames[i]}: 1/10</span>
                      <span className="pap-choice-hi">{cNames[j]}: 10/10</span>
                    </div>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pap-two-col">
        <div>
          {!allAnswered && (
            <div className="pap-warn">
              Zodpovězte všechna párová srovnání ({pairs.length - answeredCount} zbývá)
            </div>
          )}
          <button
            className="pap-calc-btn"
            onClick={handleCalc}
            disabled={loading || !allAnswered}
          >
            {loading ? 'Počítám…' : 'Vypočítat pořadí'}
          </button>
        </div>
        <div>
          <div className="pap-step-tag">
            <span className="pap-step-badge">4</span>
            Výsledky
          </div>
          {results ? (
            <PAPRIKAResults results={results} criteriaNames={cNames} altNames={aNames} />
          ) : (
            <div className="pap-placeholder">
              <span className="pap-placeholder-icon">[]</span>
              Spusťte výpočet pro zobrazení pořadí
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

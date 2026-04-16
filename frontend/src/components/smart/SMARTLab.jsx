import { useEffect, useRef, useState } from 'react';
import './SMARTLab.css';
import SMARTResults from './SMARTResults';
import { downloadJson } from '../../utils/downloadJson';

const MAX_CRIT = 7;
const MAX_ALTS = 6;
const DEFAULT_CRIT_NAMES = Array.from({ length: MAX_CRIT }, (_, i) => `K${i + 1}`);
const DEFAULT_ALT_NAMES  = Array.from({ length: MAX_ALTS }, (_, i) => `A${i + 1}`);
const SCHEMA_VERSION = '1';

function makeRatings(nAlts, nCrit) {
  return Array.from({ length: nAlts }, () => Array.from({ length: nCrit }, () => 50));
}

export default function SMARTLab() {
  const [nCrit, setNCrit]     = useState(3);
  const [nAlts, setNAlts]     = useState(3);
  const [critNames, setCritNames]   = useState(DEFAULT_CRIT_NAMES);
  const [critTypes, setCritTypes]   = useState(Array(MAX_CRIT).fill('benefit'));
  const [weights, setWeights]       = useState(Array(MAX_CRIT).fill(50));
  const [altNames, setAltNames]     = useState(DEFAULT_ALT_NAMES);
  const [ratings, setRatings]       = useState(() => makeRatings(MAX_ALTS, MAX_CRIT));
  const [results, setResults]       = useState(null);
  const [loading, setLoading]       = useState(false);
  const [importError, setImportError] = useState(null);
  const fileRef = useRef(null);

  // Reset results when inputs change
  useEffect(() => { setResults(null); }, [nCrit, nAlts]);

  const cNames = critNames.slice(0, nCrit);
  const aNames = altNames.slice(0, nAlts);
  const wSlice = weights.slice(0, nCrit);
  const totalW = wSlice.reduce((a, b) => a + b, 0) || 1;

  const setWeight = (j, val) =>
    setWeights(prev => prev.map((w, i) => (i === j ? Number(val) : w)));

  const setRating = (ai, j, val) =>
    setRatings(prev => prev.map((row, r) =>
      r === ai ? row.map((c, ci) => (ci === j ? Number(val) : c)) : row
    ));

  const toggleType = (j) =>
    setCritTypes(prev => prev.map((t, i) => (i === j ? (t === 'benefit' ? 'cost' : 'benefit') : t)));

  const handleCalc = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/calculate-smart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weights: wSlice,
          ratings: ratings.slice(0, nAlts).map(row => row.slice(0, nCrit)),
          criteria_types: critTypes.slice(0, nCrit),
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
    downloadJson({
      version: SCHEMA_VERSION, method: 'SMART', savedAt: new Date().toISOString(),
      nCrit, nAlts,
      criteriaNames: cNames, criteriaTypes: critTypes.slice(0, nCrit),
      weights: wSlice, altNames: aNames,
      ratings: ratings.slice(0, nAlts).map(row => row.slice(0, nCrit)),
    }, `smart-session-${new Date().toISOString().slice(0, 10)}.json`);
  };

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const d = JSON.parse(ev.target.result);
        if (d.method !== 'SMART') throw new Error('Soubor není SMART session.');
        const { nCrit: nc, nAlts: na, criteriaNames: cn, criteriaTypes: ct, weights: w, altNames: an, ratings: r } = d;
        if (!Number.isInteger(nc) || nc < 2 || nc > MAX_CRIT) throw new Error('Neplatný počet kritérií.');
        if (!Number.isInteger(na) || na < 2 || na > MAX_ALTS) throw new Error('Neplatný počet alternativ.');
        setNCrit(nc); setNAlts(na);
        setCritNames(cn.concat(DEFAULT_CRIT_NAMES.slice(cn.length)));
        setCritTypes(ct.concat(Array(MAX_CRIT - ct.length).fill('benefit')));
        setWeights(w.concat(Array(MAX_CRIT - w.length).fill(50)));
        setAltNames(an.concat(DEFAULT_ALT_NAMES.slice(an.length)));
        const fullRatings = makeRatings(MAX_ALTS, MAX_CRIT);
        r.forEach((row, ai) => row.forEach((v, ci) => { fullRatings[ai][ci] = v; }));
        setRatings(fullRatings);
        setResults(null); setImportError(null);
      } catch (err) { setImportError(err.message); }
    };
    reader.readAsText(file);
  };

  return (
    <div className="smrt-root">
      {/* Toolbar */}
      <div className="smrt-toolbar">
        <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImportFile} />
        <button type="button" className="smrt-tbtn" onClick={() => fileRef.current?.click()}>
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M7 1v8M3.5 5.5 7 2l3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M1.5 10v1.5A1 1 0 0 0 2.5 12.5h9a1 1 0 0 0 1-1V10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
          Načíst data
        </button>
        <button type="button" className="smrt-tbtn smrt-tbtn--primary" onClick={handleExport}>
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M7 9V1M3.5 5.5 7 9l3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M1.5 10v1.5A1 1 0 0 0 2.5 12.5h9a1 1 0 0 0 1-1V10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
          Uložit data
        </button>
        {importError && <span className="smrt-tbtn-error">{importError}</span>}
      </div>

      {/* Step 1 – Criteria */}
      <div className="smrt-card">
        <div className="smrt-step-tag">
          <span className="smrt-step-badge">1</span>
          Definice kritérií
        </div>
        <div className="smrt-config-row">
          <div>
            <div className="smrt-field-label">Počet kritérií</div>
            <select className="smrt-select" value={nCrit} onChange={e => setNCrit(Number(e.target.value))}>
              {[2,3,4,5,6,7].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <div className="smrt-field-label">Počet alternativ</div>
            <select className="smrt-select" value={nAlts} onChange={e => setNAlts(Number(e.target.value))}>
              {[2,3,4,5,6].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>

        <div className="smrt-crit-grid">
          <div className="smrt-crit-header">
            <span>Název</span>
            <span>Typ</span>
            <span>Váha (0–100)</span>
            <span className="smrt-right">{(100).toFixed(0)} %</span>
          </div>
          {cNames.map((name, j) => (
            <div key={j} className="smrt-crit-row">
              <input
                className="smrt-name-input"
                value={name}
                onChange={e => {
                  const next = [...critNames];
                  next[j] = e.target.value;
                  setCritNames(next);
                  setResults(null);
                }}
              />
              <button
                type="button"
                className={`smrt-type-btn${critTypes[j] === 'cost' ? ' smrt-type-btn--cost' : ''}`}
                onClick={() => { toggleType(j); setResults(null); }}
              >
                {critTypes[j] === 'benefit' ? 'Benefit' : 'Cost'}
              </button>
              <input
                type="range" min={0} max={100} step={1}
                className="smrt-weight-slider"
                value={weights[j]}
                onChange={e => { setWeight(j, e.target.value); setResults(null); }}
              />
              <span className="smrt-right smrt-weight-pct">
                {((weights[j] / totalW) * 100).toFixed(0)} %
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Step 2 – Ratings */}
      <div className="smrt-card">
        <div className="smrt-step-tag">
          <span className="smrt-step-badge">2</span>
          Hodnocení alternativ
          <span style={{ marginLeft: 'auto', fontSize: '0.58rem' }}>Škála 0–100</span>
        </div>
        <div className="smrt-table-wrap">
          <table className="smrt-table">
            <thead>
              <tr>
                <th className="smrt-th-alt" />
                {cNames.map((cn, j) => (
                  <th key={j} className="smrt-th">
                    <div>{cn}</div>
                    <div className="smrt-th-type">{critTypes[j] === 'benefit' ? '↑ benefit' : '↓ cost'}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {aNames.map((an, ai) => (
                <tr key={ai}>
                  <td className="smrt-td-alt">
                    <input
                      className="smrt-name-input"
                      value={an}
                      onChange={e => {
                        const next = [...altNames];
                        next[ai] = e.target.value;
                        setAltNames(next);
                        setResults(null);
                      }}
                    />
                  </td>
                  {cNames.map((_, j) => (
                    <td key={j} className="smrt-td">
                      <input
                        type="number" min={0} max={100} step={1}
                        className="smrt-rating-input"
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

      <div className="smrt-two-col">
        {/* Left – Calculate */}
        <div>
          <button type="button" className="smrt-calc-btn" onClick={handleCalc} disabled={loading}>
            {loading ? 'Počítám…' : 'Vypočítat skóre'}
          </button>
        </div>

        {/* Right – Results */}
        <div>
          <div className="smrt-step-tag">
            <span className="smrt-step-badge">3</span>
            Výsledky
          </div>
          {results ? (
            <SMARTResults results={results} criteriaNames={cNames} altNames={aNames} />
          ) : (
            <div className="smrt-placeholder">
              <span className="smrt-placeholder-icon">[]</span>
              Spusťte výpočet pro zobrazení skóre
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

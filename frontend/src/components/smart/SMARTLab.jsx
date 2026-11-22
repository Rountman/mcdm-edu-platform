import { useEffect, useRef, useState } from 'react';
import './SMARTLab.css';
import SMARTResults from './SMARTResults';
import { downloadJson } from '../../utils/downloadJson';
import { calculateSmart, McdmError } from '../../lib/mcdm/api';
import { translateLibMessage, useLang } from '../../i18n/lang';

const MAX_CRIT = 7;
const MAX_ALTS = 6;
const DEFAULT_CRIT_NAMES = Array.from({ length: MAX_CRIT }, (_, i) => `K${i + 1}`);
const DEFAULT_ALT_NAMES  = Array.from({ length: MAX_ALTS }, (_, i) => `A${i + 1}`);
const SCHEMA_VERSION = '1';

function makeRatings(nAlts, nCrit) {
  return Array.from({ length: nAlts }, () => Array.from({ length: nCrit }, () => 50));
}

export default function SMARTLab() {
  const { lang, tr } = useLang();
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
  const [calcError, setCalcError]   = useState(null);
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
      setCalcError(null);
      setResults(await calculateSmart({
        weights: wSlice,
        ratings: ratings.slice(0, nAlts).map(row => row.slice(0, nCrit)),
        criteria_types: critTypes.slice(0, nCrit),
      }));
    } catch (err) {
      setResults(null);
      setCalcError(err instanceof McdmError ? err.detail : 'Výpočet se nezdařil.');
      if (!(err instanceof McdmError)) console.error(err);
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
        if (d.method !== 'SMART') throw Object.assign(new Error('Soubor není SMART session.'), { en: 'The file is not a SMART session.' });
        const { nCrit: nc, nAlts: na, criteriaNames: cn, criteriaTypes: ct, weights: w, altNames: an, ratings: r } = d;
        if (!Number.isInteger(nc) || nc < 2 || nc > MAX_CRIT) throw Object.assign(new Error('Neplatný počet kritérií.'), { en: 'Invalid number of criteria.' });
        if (!Number.isInteger(na) || na < 2 || na > MAX_ALTS) throw Object.assign(new Error('Neplatný počet alternativ.'), { en: 'Invalid number of alternatives.' });
        setNCrit(nc); setNAlts(na);
        setCritNames(cn.concat(DEFAULT_CRIT_NAMES.slice(cn.length)));
        setCritTypes(ct.concat(Array(MAX_CRIT - ct.length).fill('benefit')));
        setWeights(w.concat(Array(MAX_CRIT - w.length).fill(50)));
        setAltNames(an.concat(DEFAULT_ALT_NAMES.slice(an.length)));
        const fullRatings = makeRatings(MAX_ALTS, MAX_CRIT);
        r.forEach((row, ai) => row.forEach((v, ci) => { fullRatings[ai][ci] = v; }));
        setRatings(fullRatings);
        setResults(null); setImportError(null);
      } catch (err) {
        setImportError(err instanceof SyntaxError
          ? { cs: 'Soubor není platný JSON.', en: 'The file is not valid JSON.' }
          : { cs: err.message, en: err.en ?? err.message });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="smrt-root">
      {/* Toolbar */}
      <div className="smrt-toolbar">
        <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImportFile} />
        <button type="button" className="smrt-tbtn" onClick={() => fileRef.current?.click()}>
          <svg width="16" height="16" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M7 1v8M3.5 5.5 7 2l3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M1.5 10v1.5A1 1 0 0 0 2.5 12.5h9a1 1 0 0 0 1-1V10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
          {tr('Načíst data', 'Load data')}
        </button>
        <button type="button" className="smrt-tbtn smrt-tbtn--primary" onClick={handleExport}>
          <svg width="16" height="16" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M7 9V1M3.5 5.5 7 9l3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M1.5 10v1.5A1 1 0 0 0 2.5 12.5h9a1 1 0 0 0 1-1V10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
          {tr('Uložit data', 'Save data')}
        </button>
        {importError && <span className="smrt-tbtn-error" role="alert">{importError[lang]}</span>}
      </div>

      {/* Step 1 – Criteria */}
      <section className="smrt-card" aria-labelledby="smrt-step1">
        <h2 className="smrt-step-tag" id="smrt-step1">
          <span className="smrt-step-badge" aria-hidden="true">1</span>
          {tr('Definice kritérií', 'Criteria definition')}
        </h2>
        <div className="smrt-config-row">
          <div>
            <label className="smrt-field-label" htmlFor="smrt-n-crit">{tr('Počet kritérií', 'Number of criteria')}</label>
            <select id="smrt-n-crit" className="smrt-select" value={nCrit} onChange={e => setNCrit(Number(e.target.value))}>
              {[2,3,4,5,6,7].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <label className="smrt-field-label" htmlFor="smrt-n-alts">{tr('Počet alternativ', 'Number of alternatives')}</label>
            <select id="smrt-n-alts" className="smrt-select" value={nAlts} onChange={e => setNAlts(Number(e.target.value))}>
              {[2,3,4,5,6].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>

        <div className="smrt-crit-grid">
          <div className="smrt-crit-header" aria-hidden="true">
            <span>{tr('Název kritéria', 'Criterion name')}</span>
            <span>{tr('Typ', 'Type')}</span>
            <span>{tr('Váha (posuvník 0–100)', 'Weight (slider 0–100)')}</span>
            <span className="smrt-right">{tr('Podíl', 'Share')}</span>
          </div>
          {cNames.map((name, j) => (
            <div key={j} className="smrt-crit-row">
              <input
                className="smrt-name-input"
                aria-label={tr(`Název kritéria ${j + 1}`, `Criterion name ${j + 1}`)}
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
                aria-label={tr(
                  `Typ kritéria ${name}: ${critTypes[j] === 'benefit' ? 'benefit, více je lépe' : 'cost, méně je lépe'}. Kliknutím přepnete.`,
                  `Criterion type ${name}: ${critTypes[j] === 'benefit' ? 'benefit, more is better' : 'cost, less is better'}. Click to switch.`,
                )}
                onClick={() => { toggleType(j); setResults(null); }}
              >
                <span aria-hidden="true">{critTypes[j] === 'benefit' ? '↑ Benefit' : '↓ Cost'}</span>
              </button>
              <input
                type="range" min={0} max={100} step={1}
                className="smrt-weight-slider"
                aria-label={tr(`Váha kritéria ${name}`, `Weight of criterion ${name}`)}
                aria-valuetext={tr(`${weights[j]} bodů, podíl ${((weights[j] / totalW) * 100).toFixed(0)} %`, `${weights[j]} points, share ${((weights[j] / totalW) * 100).toFixed(0)}%`)}
                value={weights[j]}
                onChange={e => { setWeight(j, e.target.value); setResults(null); }}
              />
              <span className="smrt-right smrt-weight-pct">
                <span className="smrt-weight-raw">{weights[j]} {tr('b.', 'pts')} · </span>
                {((weights[j] / totalW) * 100).toFixed(0)}{tr(' %', '%')}
              </span>
            </div>
          ))}
        </div>
        <p className="smrt-hint">
          {tr(
            'Podíl = váha kritéria / součet všech vah. Benefit: vyšší hodnota je lepší, cost: nižší hodnota je lepší.',
            'Share = criterion weight / sum of all weights. Benefit: a higher value is better, cost: a lower value is better.',
          )}
        </p>
      </section>

      {/* Step 2 – Ratings */}
      <section className="smrt-card" aria-labelledby="smrt-step2">
        <h2 className="smrt-step-tag" id="smrt-step2">
          <span className="smrt-step-badge" aria-hidden="true">2</span>
          {tr('Hodnocení alternativ', 'Rating alternatives')}
          <span className="smrt-step-note">{tr('škála 0–100', 'scale 0–100')}</span>
        </h2>
        <div className="smrt-table-wrap">
          <table className="smrt-table">
            <thead>
              <tr>
                <th scope="col" className="smrt-th-alt">{tr('Alternativa', 'Alternative')}</th>
                {cNames.map((cn, j) => (
                  <th key={j} scope="col" className="smrt-th">
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
                      aria-label={tr(`Název alternativy ${ai + 1}`, `Alternative name ${ai + 1}`)}
                      value={an}
                      onChange={e => {
                        const next = [...altNames];
                        next[ai] = e.target.value;
                        setAltNames(next);
                        setResults(null);
                      }}
                    />
                  </td>
                  {cNames.map((cn, j) => (
                    <td key={j} className="smrt-td">
                      <input
                        type="number" min={0} max={100} step={1}
                        className="smrt-rating-input"
                        aria-label={tr(`Hodnocení ${an} podle ${cn}`, `Rating of ${an} on ${cn}`)}
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

      <div className="smrt-calc-row">
        <button type="button" className="smrt-calc-btn" onClick={handleCalc} disabled={loading}>
          {loading ? tr('Počítám…', 'Calculating…') : tr('Vypočítat skóre', 'Calculate scores')}
        </button>
        {calcError && <p className="smrt-tbtn-error" role="alert">{translateLibMessage(calcError, lang)}</p>}
      </div>

      <section aria-labelledby="smrt-step3" aria-live="polite">
        <h2 className="smrt-step-tag" id="smrt-step3">
          <span className="smrt-step-badge" aria-hidden="true">3</span>
          {tr('Výsledky', 'Results')}
        </h2>
        {results ? (
          <SMARTResults results={results} criteriaNames={cNames} altNames={aNames} />
        ) : (
          <div className="u-placeholder">
            {tr('Výsledky zatím nejsou spočtené. Vyplňte hodnocení a stiskněte „Vypočítat skóre“.', 'Results have not been calculated yet. Fill in the ratings and press “Calculate scores”.')}
          </div>
        )}
      </section>
    </div>
  );
}

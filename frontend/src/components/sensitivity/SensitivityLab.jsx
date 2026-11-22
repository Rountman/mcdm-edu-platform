import { useMemo, useRef, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ReferenceLine, ResponsiveContainer,
} from 'recharts';
import './SensitivityLab.css';
import { downloadJson } from '../../utils/downloadJson';
import { useLang } from '../../i18n/lang';

const SCHEMA_VERSION = '1';

const MAX_CRIT = 6;
const MAX_ALTS = 5;
const ALT_COLORS = ['#0057FF', '#6D28D9', '#047857', '#B45309', '#DB2777', '#0E7490'];
const ALT_DASH = [undefined, '8 4', '2 3', '10 3 2 3', '4 4', '1 2'];
const AXIS = { fontSize: 12, fill: '#4A5875' };
const DEFAULT_CRIT = Array.from({ length: MAX_CRIT }, (_, i) => `K${i + 1}`);
const DEFAULT_ALTS = Array.from({ length: MAX_ALTS }, (_, i) => `A${i + 1}`);

// Výchozí ukázková data (jen počáteční vstup, výpočet se nemění): A1 vyniká v K1,
// A3 v K2 a K3, A2 je mezi nimi. Při rovných vahách vede A3; při změně váhy K1 se pořadí
// mění v ~27 % (A1/A2), ~47 % (A1/A3) a ~55 % (A2/A3). Hodnoty jsou zvolené tak, aby
// žádné křížení nepadlo přesně na vzorkovací bod grafu (krok 2 %).
const SAMPLE_RATINGS = [
  [90, 30, 48],
  [60, 62, 40],
  [20, 85, 70],
];
function initialRatings() {
  const r = Array.from({ length: MAX_ALTS }, () => Array(MAX_CRIT).fill(50));
  SAMPLE_RATINGS.forEach((row, ai) => row.forEach((v, ci) => { r[ai][ci] = v; }));
  return r;
}

// Normalise a column of ratings (benefit/cost)
function normCol(col, type) {
  const mn = Math.min(...col), mx = Math.max(...col);
  const rng = mx === mn ? 1 : mx - mn;
  return col.map(v => type === 'cost' ? (mx - v) / rng : (v - mn) / rng);
}

// Build 51-point sensitivity data varying weight of `focus` criterion
function buildSensData(normW, normRatings, focus, nCrit, nAlts) {
  const otherSum = normW.reduce((s, w, i) => i !== focus ? s + w : s, 0);
  return Array.from({ length: 51 }, (_, p) => {
    const wj = p / 50;
    const w = normW.map((v, i) => {
      if (i === focus) return wj;
      if (otherSum < 1e-9) return (1 - wj) / Math.max(nCrit - 1, 1);
      return (v / otherSum) * (1 - wj);
    });
    const pt = { pct: p * 2 }; // 0..100 in steps of 2
    for (let ai = 0; ai < nAlts; ai++)
      pt[`a${ai}`] = +(normRatings[ai].reduce((s, v, j) => s + v * w[j], 0) * 100).toFixed(2);
    return pt;
  });
}

// Find crossover points (where ranking changes between two alts)
function findCrossovers(data, nAlts) {
  const crossovers = [];
  for (let p = 1; p < data.length; p++) {
    for (let a = 0; a < nAlts; a++)
      for (let b = a + 1; b < nAlts; b++) {
        const prev = data[p - 1][`a${a}`] - data[p - 1][`a${b}`];
        const curr = data[p][`a${a}`]     - data[p][`a${b}`];
        if (prev * curr < 0)
          crossovers.push({ pct: (data[p - 1].pct + data[p].pct) / 2, a, b });
      }
  }
  return crossovers;
}

export default function SensitivityLab() {
  const { lang, tr } = useLang();
  const [nCrit, setNCrit] = useState(3);
  const [nAlts, setNAlts] = useState(3);
  const [critNames, setCritNames] = useState(DEFAULT_CRIT);
  const [critTypes, setCritTypes] = useState(Array(MAX_CRIT).fill('benefit'));
  const [weights, setWeights]     = useState(Array(MAX_CRIT).fill(50));
  const [altNames, setAltNames]   = useState(DEFAULT_ALTS);
  const [ratings, setRatings]     = useState(initialRatings);
  const [focus, setFocus] = useState(0);
  const [importError, setImportError] = useState(null);
  const fileInputRef = useRef(null);

  const handleExport = () => {
    downloadJson({
      version: SCHEMA_VERSION,
      method: 'SENSITIVITY',
      savedAt: new Date().toISOString(),
      nCrit, nAlts,
      criteriaNames: critNames.slice(0, nCrit),
      criteriaTypes: critTypes.slice(0, nCrit),
      weights: weights.slice(0, nCrit),
      altNames: altNames.slice(0, nAlts),
      ratings: ratings.slice(0, nAlts).map(r => r.slice(0, nCrit)),
    }, `sensitivity-${new Date().toISOString().slice(0,10)}.json`);
  };

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const d = JSON.parse(ev.target.result);
        if (!['SENSITIVITY', 'SMART', 'AHP'].includes(d.method))
          throw Object.assign(new Error('Nepodporovaný formát. Použijte soubor z SMART, AHP nebo Citlivosti.'), { en: 'Unsupported format. Use a file from SMART, AHP or Sensitivity.' });

        if (d.method === 'AHP') {
          // Import criteria names + weights; keep existing alternatives
          const n = d.size;
          if (!n || n < 2 || n > MAX_CRIT) throw Object.assign(new Error('Neplatný počet kritérií v AHP souboru.'), { en: 'Invalid number of criteria in the AHP file.' });
          const names = [...DEFAULT_CRIT]; d.criteriaNames.forEach((v, i) => { names[i] = v; });
          setCritNames(names);
          setNCrit(n);
          setFocus(0);
          if (Array.isArray(d.weights) && d.weights.length === n) {
            // AHP weights are probabilities (0-1) → scale to 0-100 for sliders
            const scaled = [...Array(MAX_CRIT).fill(50)];
            d.weights.forEach((w, i) => { scaled[i] = Math.round(w * 100); });
            setWeights(scaled);
          }
          setImportError(null);
          return;
        }

        // SMART or SENSITIVITY format
        const { nCrit: nc, nAlts: na, criteriaNames: cn, criteriaTypes: ct, weights: wt, altNames: an, ratings: rt } = d;
        if (!nc || nc < 2 || nc > MAX_CRIT) throw Object.assign(new Error('Neplatný počet kritérií.'), { en: 'Invalid number of criteria.' });
        if (!na || na < 2 || na > MAX_ALTS) throw Object.assign(new Error('Neplatný počet alternativ.'), { en: 'Invalid number of alternatives.' });

        const newNames = [...DEFAULT_CRIT]; cn.forEach((v, i) => { newNames[i] = v; });
        const newAlts  = [...DEFAULT_ALTS]; an.forEach((v, i) => { newAlts[i]  = v; });
        const newTypes = [...Array(MAX_CRIT).fill('benefit')]; ct.forEach((v, i) => { newTypes[i] = v; });
        const newW     = [...Array(MAX_CRIT).fill(50)];        wt.forEach((v, i) => { newW[i] = v; });
        const newRatings = Array.from({ length: MAX_ALTS }, () => Array(MAX_CRIT).fill(50));
        rt.forEach((row, ai) => row.forEach((v, ci) => { if (ai < MAX_ALTS && ci < MAX_CRIT) newRatings[ai][ci] = v; }));

        setNCrit(nc); setNAlts(na); setCritNames(newNames); setAltNames(newAlts);
        setCritTypes(newTypes); setWeights(newW); setRatings(newRatings); setFocus(0);
        setImportError(null);
      } catch (err) {
        setImportError(err instanceof SyntaxError
          ? { cs: 'Soubor není platný JSON.', en: 'The file is not valid JSON.' }
          : { cs: err.message, en: err.en ?? err.message });
      }
    };
    reader.readAsText(file);
  };

  const cNames = critNames.slice(0, nCrit);
  const aNames = altNames.slice(0, nAlts);
  const wSlice = weights.slice(0, nCrit);
  const totalW = wSlice.reduce((s, w) => s + w, 0) || 1;
  const normW  = wSlice.map(w => w / totalW);

  // Normalised ratings matrix
  const normRatings = useMemo(() => {
    const nr = Array.from({ length: nAlts }, () => Array(nCrit).fill(0));
    for (let j = 0; j < nCrit; j++) {
      const col = ratings.slice(0, nAlts).map(r => r[j]);
      const nc  = normCol(col, critTypes[j]);
      nc.forEach((v, ai) => { nr[ai][j] = v; });
    }
    return nr;
  }, [ratings, critTypes, nCrit, nAlts]);

  const chartData = useMemo(
    () => buildSensData(normW, normRatings, focus, nCrit, nAlts),
    [normW, normRatings, focus, nCrit, nAlts]
  );

  const crossovers = useMemo(() => findCrossovers(chartData, nAlts), [chartData, nAlts]);
  const currentPct = Math.round(normW[focus] * 100);

  return (
    <div className="snsl-root">

      {/* ── TOOLBAR ────────────────────────────────────── */}
      <div className="snsl-toolbar">
        <div className="snsl-toolbar-actions">
          <input ref={fileInputRef} type="file" accept=".json,application/json" style={{ display: 'none' }} onChange={handleImportFile} />
          <button type="button" className="snsl-tbtn" onClick={() => fileInputRef.current?.click()}>
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M7 1v8M3.5 5.5 7 2l3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M1.5 10v1.5A1 1 0 0 0 2.5 12.5h9a1 1 0 0 0 1-1V10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
            {tr('Načíst data', 'Load data')}
          </button>
          <button type="button" className="snsl-tbtn snsl-tbtn--primary" onClick={handleExport}>
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M7 9V1M3.5 5.5 7 9l3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M1.5 10v1.5A1 1 0 0 0 2.5 12.5h9a1 1 0 0 0 1-1V10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
            {tr('Uložit data', 'Save data')}
          </button>
        </div>
        {importError && <span className="snsl-toolbar-err" role="alert">{importError[lang]}</span>}
      </div>

      {/* ── DATA INPUT ─────────────────────────────────── */}
      <section className="snsl-card" aria-labelledby="snsl-step1">
        <h2 className="snsl-step-tag" id="snsl-step1"><span className="snsl-badge-n" aria-hidden="true">1</span>{tr('Kritéria a hodnocení', 'Criteria and ratings')}</h2>

        <div className="snsl-config-row">
          <div>
            <label className="snsl-field-label" htmlFor="snsl-n-crit">{tr('Počet kritérií', 'Number of criteria')}</label>
            <select id="snsl-n-crit" className="snsl-select" value={nCrit}
              onChange={e => { setNCrit(Number(e.target.value)); setFocus(0); }}>
              {[2,3,4,5,6].map(n => <option key={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <label className="snsl-field-label" htmlFor="snsl-n-alts">{tr('Počet alternativ', 'Number of alternatives')}</label>
            <select id="snsl-n-alts" className="snsl-select" value={nAlts} onChange={e => setNAlts(Number(e.target.value))}>
              {[2,3,4,5].map(n => <option key={n}>{n}</option>)}
            </select>
          </div>
        </div>

        {/* Criteria row */}
        <div className="snsl-crit-grid">
          <div className="snsl-crit-header" aria-hidden="true"><span>{tr('Název kritéria', 'Criterion name')}</span><span>{tr('Typ', 'Type')}</span><span>{tr('Váha', 'Weight')}</span><span className="snsl-right">{tr('Podíl', 'Share')}</span></div>
          {cNames.map((name, j) => (
            <div key={j} className="snsl-crit-row">
              <input className="snsl-input" value={name} aria-label={tr(`Název kritéria ${j + 1}`, `Criterion name ${j + 1}`)}
                onChange={e => { const n=[...critNames]; n[j]=e.target.value; setCritNames(n); }} />
              <button
                type="button"
                className={`snsl-type-btn${critTypes[j]==='cost'?' snsl-type-btn--cost':''}`}
                aria-label={tr(
                  `Typ kritéria ${name}: ${critTypes[j]==='benefit'?'benefit, více je lépe':'cost, méně je lépe'}. Kliknutím přepnete.`,
                  `Criterion type ${name}: ${critTypes[j]==='benefit'?'benefit, more is better':'cost, less is better'}. Click to switch.`,
                )}
                onClick={() => setCritTypes(prev => prev.map((t,i) => i===j?(t==='benefit'?'cost':'benefit'):t))}>
                <span aria-hidden="true">{critTypes[j]==='benefit'?'↑ Benefit':'↓ Cost'}</span>
              </button>
              <input type="range" min={0} max={100} className="snsl-slider" value={weights[j]}
                aria-label={tr(`Váha kritéria ${name}`, `Weight of criterion ${name}`)}
                aria-valuetext={tr(`${weights[j]} bodů, podíl ${Math.round(normW[j]*100)} %`, `${weights[j]} points, share ${Math.round(normW[j]*100)}%`)}
                onChange={e => setWeights(prev => prev.map((w,i) => i===j?Number(e.target.value):w))} />
              <span className="snsl-right snsl-w-pct">{Math.round(normW[j]*100)}{tr(' %', '%')}</span>
            </div>
          ))}
        </div>

        {/* Ratings table */}
        <div className="snsl-table-wrap">
          <table className="snsl-table">
            <thead>
              <tr>
                <th scope="col" className="snsl-th-empty">{tr('Alternativa', 'Alternative')}</th>
                {cNames.map((cn, j) => (
                  <th key={j} scope="col" className="snsl-th">
                    {cn}<br/><span className="snsl-th-type">{critTypes[j]==='benefit'?'↑ benefit':'↓ cost'}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {aNames.map((an, ai) => (
                <tr key={ai}>
                  <td className="snsl-td-alt">
                    <input className="snsl-input" value={an} aria-label={tr(`Název alternativy ${ai + 1}`, `Alternative name ${ai + 1}`)}
                      onChange={e => { const n=[...altNames]; n[ai]=e.target.value; setAltNames(n); }} />
                  </td>
                  {cNames.map((cn, j) => (
                    <td key={j} className="snsl-td">
                      <input type="number" min={0} max={100} className="snsl-num"
                        aria-label={tr(`Hodnocení ${an} podle ${cn}`, `Rating of ${an} on ${cn}`)}
                        value={ratings[ai][j]}
                        onChange={e => setRatings(prev =>
                          prev.map((row, r) => r===ai ? row.map((c,ci) => ci===j?Number(e.target.value):c) : row)
                        )} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── CHART ──────────────────────────────────────── */}
      <section className="snsl-card" aria-labelledby="snsl-step2">
        <h2 className="snsl-step-tag" id="snsl-step2"><span className="snsl-badge-n" aria-hidden="true">2</span>{tr('Graf citlivosti', 'Sensitivity chart')}</h2>

        {/* Criterion selector */}
        <div className="snsl-focus-row" role="group" aria-labelledby="snsl-focus-label">
          <span className="snsl-field-label" id="snsl-focus-label" style={{ marginBottom: 0 }}>{tr('Analyzované kritérium:', 'Criterion analysed:')}</span>
          {cNames.map((name, j) => (
            <button type="button" key={j}
              className={`snsl-focus-btn${focus===j?' snsl-focus-btn--active':''}`}
              aria-pressed={focus===j}
              onClick={() => setFocus(j)}>
              {name}
            </button>
          ))}
        </div>

        <div role="img" aria-label={tr(
          `Spojnicový graf: celkové skóre alternativ v závislosti na váze kritéria ${cNames[focus]} od 0 do 100 %. Shrnutí je v části Interpretace.`,
          `Line chart: total scores of alternatives as the weight of criterion ${cNames[focus]} goes from 0 to 100%. A summary is in the Interpretation section.`,
        )}>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#DDE3ED" />
            {/* Číselná osa: svislé čáry (aktuální váha, přechodové body) leží i mimo vzorky po 2 % */}
            <XAxis dataKey="pct" type="number" domain={[0, 100]} ticks={[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]}
              unit="%" tick={AXIS}
              label={{ value: `${tr('Váha', 'Weight')}: ${cNames[focus]}`, position: 'insideBottom', offset: -2, ...AXIS }} />
            <YAxis unit="%" domain={[0, 100]} tick={AXIS} width={44} />
            <Tooltip
              formatter={(v, name) => [`${v.toFixed(1)}${tr(' %', '%')}`, name]}
              contentStyle={{ fontSize: 14, borderRadius: 8, border: '1px solid #7A869C' }} />
            <Legend wrapperStyle={{ fontSize: 14 }} />
            <ReferenceLine x={currentPct} stroke="#4A5875" strokeDasharray="5 4"
              label={{ value: tr('Aktuální', 'Current'), position: 'insideTopLeft', ...AXIS }} />
            {crossovers.map((co, i) => (
              <ReferenceLine key={i} x={co.pct} stroke="#B45309" strokeDasharray="3 3" strokeWidth={1.5} />
            ))}
            {aNames.map((name, ai) => (
              <Line key={ai} type="monotone" dataKey={`a${ai}`} name={name}
                stroke={ALT_COLORS[ai]} strokeDasharray={ALT_DASH[ai]} strokeWidth={2.5} dot={false}
                isAnimationActive={false}
                activeDot={{ r: 4 }} />
            ))}
          </LineChart>
        </ResponsiveContainer>
        </div>
        <p className="snsl-chart-note">{tr(
          'Čáry se liší barvou i vzorem. Svislá přerušovaná čára = aktuální váha, oranžové čáry = přechodové body.',
          'Lines differ in colour and pattern. Vertical dashed line = current weight, orange lines = crossover points.',
        )}</p>
      </section>

      {/* ── INSIGHTS ───────────────────────────────────── */}
      <section className="snsl-card" aria-labelledby="snsl-step3" aria-live="polite">
        <h2 className="snsl-step-tag" id="snsl-step3"><span className="snsl-badge-n" aria-hidden="true">3</span>{tr('Interpretace', 'Interpretation')}</h2>
        <div className="snsl-insights">
          <div className="snsl-insight-item">
            <span className="snsl-insight-label">{tr('Aktuální váha', 'Current weight of')} {cNames[focus]}</span>
            <span className="snsl-insight-val">{currentPct}{tr(' %', '%')}</span>
          </div>
          {crossovers.length === 0 ? (
            <div className="snsl-insight-ok">
              {tr(
                `Žádný přechodový bod — pořadí alternativ je robustní vůči změně váhy ${cNames[focus]}.`,
                `No crossover point — the ranking of alternatives is robust to changes in the weight of ${cNames[focus]}.`,
              )}
            </div>
          ) : (
            crossovers.map((co, i) => (
              <div key={i} className="snsl-insight-warn">
                <span className="snsl-insight-cross">{tr(`Přechodový bod při ${co.pct.toFixed(0)} %`, `Crossover point at ${co.pct.toFixed(0)}%`)}</span>
                &nbsp;— {tr(`pořadí ${aNames[co.a]} a ${aNames[co.b]} se změní.`, `the order of ${aNames[co.a]} and ${aNames[co.b]} changes.`)}
                {Math.abs(co.pct - currentPct) < 10 && (
                  <span className="snsl-insight-risky"> {tr('Blízko aktuální váhy — vyžaduje pozornost!', 'Close to the current weight — needs attention!')}</span>
                )}
              </div>
            ))
          )}
        </div>
      </section>

    </div>
  );
}

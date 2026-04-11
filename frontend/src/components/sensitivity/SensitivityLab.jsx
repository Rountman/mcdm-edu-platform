import { useMemo, useRef, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ReferenceLine, ResponsiveContainer,
} from 'recharts';
import './SensitivityLab.css';

const SCHEMA_VERSION = '1';

const MAX_CRIT = 6;
const MAX_ALTS = 5;
const ALT_COLORS = ['#0057FF', '#FF3B5C', '#059669', '#F59E0B', '#7C3AED', '#06B6D4'];
const DEFAULT_CRIT = Array.from({ length: MAX_CRIT }, (_, i) => `K${i + 1}`);
const DEFAULT_ALTS = Array.from({ length: MAX_ALTS }, (_, i) => `A${i + 1}`);

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
  const [nCrit, setNCrit] = useState(3);
  const [nAlts, setNAlts] = useState(3);
  const [critNames, setCritNames] = useState(DEFAULT_CRIT);
  const [critTypes, setCritTypes] = useState(Array(MAX_CRIT).fill('benefit'));
  const [weights, setWeights]     = useState(Array(MAX_CRIT).fill(50));
  const [altNames, setAltNames]   = useState(DEFAULT_ALTS);
  const [ratings, setRatings]     = useState(() =>
    Array.from({ length: MAX_ALTS }, () => Array(MAX_CRIT).fill(50))
  );
  const [focus, setFocus] = useState(0);
  const [importError, setImportError] = useState(null);
  const fileInputRef = useRef(null);

  const handleExport = () => {
    const payload = {
      version: SCHEMA_VERSION,
      method: 'SENSITIVITY',
      savedAt: new Date().toISOString(),
      nCrit, nAlts,
      criteriaNames: critNames.slice(0, nCrit),
      criteriaTypes: critTypes.slice(0, nCrit),
      weights: weights.slice(0, nCrit),
      altNames: altNames.slice(0, nAlts),
      ratings: ratings.slice(0, nAlts).map(r => r.slice(0, nCrit)),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `sensitivity-${new Date().toISOString().slice(0,10)}.json`; a.click();
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
        if (!['SENSITIVITY', 'SMART', 'AHP'].includes(d.method))
          throw new Error('Nepodporovaný formát. Použijte soubor z SMART, AHP nebo Citlivosti.');

        if (d.method === 'AHP') {
          // Import criteria names + weights; keep existing alternatives
          const n = d.size;
          if (!n || n < 2 || n > MAX_CRIT) throw new Error('Neplatný počet kritérií v AHP souboru.');
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
        if (!nc || nc < 2 || nc > MAX_CRIT) throw new Error('Neplatný počet kritérií.');
        if (!na || na < 2 || na > MAX_ALTS) throw new Error('Neplatný počet alternativ.');

        const newNames = [...DEFAULT_CRIT]; cn.forEach((v, i) => { newNames[i] = v; });
        const newAlts  = [...DEFAULT_ALTS]; an.forEach((v, i) => { newAlts[i]  = v; });
        const newTypes = [...Array(MAX_CRIT).fill('benefit')]; ct.forEach((v, i) => { newTypes[i] = v; });
        const newW     = [...Array(MAX_CRIT).fill(50)];        wt.forEach((v, i) => { newW[i] = v; });
        const newRatings = Array.from({ length: MAX_ALTS }, () => Array(MAX_CRIT).fill(50));
        rt.forEach((row, ai) => row.forEach((v, ci) => { if (ai < MAX_ALTS && ci < MAX_CRIT) newRatings[ai][ci] = v; }));

        setNCrit(nc); setNAlts(na); setCritNames(newNames); setAltNames(newAlts);
        setCritTypes(newTypes); setWeights(newW); setRatings(newRatings); setFocus(0);
        setImportError(null);
      } catch (err) { setImportError(err.message); }
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
        <span className="snsl-toolbar-title">Analýza citlivosti</span>
        <div className="snsl-toolbar-actions">
          <input ref={fileInputRef} type="file" accept=".json,application/json" style={{ display: 'none' }} onChange={handleImportFile} />
          <button className="snsl-tbtn" onClick={() => fileInputRef.current?.click()}>
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M7 1v8M3.5 5.5 7 2l3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M1.5 10v1.5A1 1 0 0 0 2.5 12.5h9a1 1 0 0 0 1-1V10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
            Načíst data
          </button>
          <button className="snsl-tbtn snsl-tbtn--primary" onClick={handleExport}>
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M7 9V1M3.5 5.5 7 9l3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M1.5 10v1.5A1 1 0 0 0 2.5 12.5h9a1 1 0 0 0 1-1V10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
            Uložit data
          </button>
        </div>
        {importError && <span className="snsl-toolbar-err">{importError}</span>}
      </div>

      {/* ── DATA INPUT ─────────────────────────────────── */}
      <div className="snsl-card">
        <div className="snsl-step-tag"><span className="snsl-badge-n">1</span>Data — kritéria a hodnocení</div>

        <div className="snsl-config-row">
          <div>
            <div className="snsl-field-label">Počet kritérií</div>
            <select className="snsl-select" value={nCrit}
              onChange={e => { setNCrit(Number(e.target.value)); setFocus(0); }}>
              {[2,3,4,5,6].map(n => <option key={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <div className="snsl-field-label">Počet alternativ</div>
            <select className="snsl-select" value={nAlts} onChange={e => setNAlts(Number(e.target.value))}>
              {[2,3,4,5].map(n => <option key={n}>{n}</option>)}
            </select>
          </div>
        </div>

        {/* Criteria row */}
        <div className="snsl-crit-grid">
          <div className="snsl-crit-header"><span>Název</span><span>Typ</span><span>Váha</span><span className="snsl-right">%</span></div>
          {cNames.map((name, j) => (
            <div key={j} className="snsl-crit-row">
              <input className="snsl-input" value={name}
                onChange={e => { const n=[...critNames]; n[j]=e.target.value; setCritNames(n); }} />
              <button
                className={`snsl-type-btn${critTypes[j]==='cost'?' snsl-type-btn--cost':''}`}
                onClick={() => setCritTypes(prev => prev.map((t,i) => i===j?(t==='benefit'?'cost':'benefit'):t))}>
                {critTypes[j]==='benefit'?'Benefit':'Cost'}
              </button>
              <input type="range" min={0} max={100} className="snsl-slider" value={weights[j]}
                onChange={e => setWeights(prev => prev.map((w,i) => i===j?Number(e.target.value):w))} />
              <span className="snsl-right snsl-w-pct">{Math.round(normW[j]*100)} %</span>
            </div>
          ))}
        </div>

        {/* Ratings table */}
        <div className="snsl-table-wrap" style={{ marginTop: 18 }}>
          <table className="snsl-table">
            <thead>
              <tr>
                <th className="snsl-th-empty" />
                {cNames.map((cn, j) => (
                  <th key={j} className="snsl-th">
                    {cn}<br/><span className="snsl-th-type">{critTypes[j]==='benefit'?'↑':'↓'}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {aNames.map((an, ai) => (
                <tr key={ai}>
                  <td className="snsl-td-alt">
                    <input className="snsl-input snsl-input--sm" value={an}
                      onChange={e => { const n=[...altNames]; n[ai]=e.target.value; setAltNames(n); }} />
                  </td>
                  {cNames.map((_, j) => (
                    <td key={j} className="snsl-td">
                      <input type="number" min={0} max={100} className="snsl-num"
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
      </div>

      {/* ── CHART ──────────────────────────────────────── */}
      <div className="snsl-card">
        <div className="snsl-step-tag"><span className="snsl-badge-n">2</span>Graf citlivosti</div>

        {/* Criterion selector */}
        <div className="snsl-focus-row">
          <span className="snsl-field-label" style={{ marginBottom: 0 }}>Analyzované kritérium:</span>
          {cNames.map((name, j) => (
            <button key={j}
              className={`snsl-focus-btn${focus===j?' snsl-focus-btn--active':''}`}
              onClick={() => setFocus(j)}>
              {name}
            </button>
          ))}
        </div>

        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F6" />
            <XAxis dataKey="pct" unit="%" tick={{ fontSize: 11, fill: '#8896AE' }}
              label={{ value: `Váha: ${cNames[focus]}`, position: 'insideBottom', offset: -2, fontSize: 11, fill: '#8896AE' }} />
            <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 11, fill: '#8896AE' }} width={38} />
            <Tooltip
              formatter={(v, name) => [`${v.toFixed(1)} %`, name]}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #DDE3ED' }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <ReferenceLine x={currentPct} stroke="#8896AE" strokeDasharray="5 4"
              label={{ value: 'Aktuální', position: 'insideTopLeft', fontSize: 10, fill: '#8896AE' }} />
            {crossovers.map((co, i) => (
              <ReferenceLine key={i} x={co.pct} stroke="#F59E0B" strokeDasharray="3 3" strokeWidth={1.5} />
            ))}
            {aNames.map((name, ai) => (
              <Line key={ai} type="monotone" dataKey={`a${ai}`} name={name}
                stroke={ALT_COLORS[ai]} strokeWidth={2.5} dot={false}
                activeDot={{ r: 4 }} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ── INSIGHTS ───────────────────────────────────── */}
      <div className="snsl-card">
        <div className="snsl-step-tag"><span className="snsl-badge-n">3</span>Interpretace</div>
        <div className="snsl-insights">
          <div className="snsl-insight-item">
            <span className="snsl-insight-label">Aktuální váha {cNames[focus]}</span>
            <span className="snsl-insight-val">{currentPct} %</span>
          </div>
          {crossovers.length === 0 ? (
            <div className="snsl-insight-ok">
              Žádný přechodový bod — pořadí alternativ je robustní vůči změně váhy {cNames[focus]}.
            </div>
          ) : (
            crossovers.map((co, i) => (
              <div key={i} className="snsl-insight-warn">
                <span className="snsl-insight-cross">Přechodový bod při {co.pct.toFixed(0)} %</span>
                &nbsp;— pořadí {aNames[co.a]} a {aNames[co.b]} se změní.
                {Math.abs(co.pct - currentPct) < 10 && (
                  <span className="snsl-insight-risky"> Blízko aktuální váhy — vyžaduje pozornost!</span>
                )}
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from 'react';
import './AHPInputTable.css';
import AHPResults from './AHPResults';
import SaatySlider from './SaatySlider';
import { ACCENT, ACCENT2, MUTED, PANEL2, TEXT } from './ahp.constants';
import { downloadJson } from '../../utils/downloadJson';

const SCHEMA_VERSION = '1';
const DEFAULT_NAMES = Array.from({ length: 8 }, (_, i) => `K${i + 1}`);

export default function AHPInputTable() {
  const [size, setSize] = useState(3);
  const [criteriaNames, setCriteriaNames] = useState(DEFAULT_NAMES);
  const [matrix, setMatrix] = useState([]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [importError, setImportError] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setMatrix(Array.from({ length: size }, () => Array.from({ length: size }, () => 1)));
    setResults(null);
  }, [size]);

  const comparisons = useMemo(() => {
    const pairs = [];
    for (let i = 0; i < size; i += 1) {
      for (let j = i + 1; j < size; j += 1) pairs.push({ i, j });
    }
    return pairs;
  }, [size]);

  if (matrix.length !== size) return null;

  const handleUpdate = (i, j, value) => {
    setMatrix((prev) => prev.map((row, rIdx) => (
      row.map((cell, cIdx) => {
        if (rIdx === i && cIdx === j) return value;
        if (rIdx === j && cIdx === i) return 1 / value;
        return cell;
      })
    )));
  };

  const handleCalc = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/calculate-ahp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matrix }),
      });
      setResults(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const names = criteriaNames.slice(0, size);
    downloadJson({
      version: SCHEMA_VERSION,
      method: 'AHP',
      savedAt: new Date().toISOString(),
      size,
      criteriaNames: names,
      matrix,
      weights: results?.weights ?? null,
    }, `ahp-session-${new Date().toISOString().slice(0, 10)}.json`);
  };

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.method !== 'AHP') throw new Error('Soubor není AHP session.');
        if (!data.version) throw new Error('Chybí verze schématu.');
        const { size: s, criteriaNames: names, matrix: mat } = data;
        if (!Number.isInteger(s) || s < 2 || s > 8) throw new Error('Neplatný počet kritérií.');
        if (!Array.isArray(names) || names.length !== s) throw new Error('Neplatná kritéria.');
        if (!Array.isArray(mat) || mat.length !== s || mat.some(r => r.length !== s)) throw new Error('Neplatná matice.');
        const restoredNames = names.concat(DEFAULT_NAMES.slice(names.length));
        setCriteriaNames(restoredNames);
        setSize(s);
        setMatrix(mat);
        setResults(null);
        setImportError(null);
      } catch (err) {
        setImportError(err.message);
      }
    };
    reader.readAsText(file);
  };

  const names = criteriaNames.slice(0, size);

  return (
    <div className="ahp-root">
      <div className="ahp-toolbar">
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          style={{ display: 'none' }}
          onChange={handleImportFile}
        />
        <button type="button" className="ahp-toolbar-btn" onClick={() => fileInputRef.current?.click()}>
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M7 1v8M3.5 5.5 7 2l3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M1.5 10v1.5A1 1 0 0 0 2.5 12.5h9a1 1 0 0 0 1-1V10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
          Načíst data
        </button>
        <button type="button" className="ahp-toolbar-btn ahp-toolbar-btn--primary" onClick={handleExport}>
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M7 9V1M3.5 5.5 7 9l3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M1.5 10v1.5A1 1 0 0 0 2.5 12.5h9a1 1 0 0 0 1-1V10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
          Uložit data
        </button>
        {importError && (
          <span className="ahp-toolbar-error">{importError}</span>
        )}
      </div>

      <div className="ahp-card">
        <div className="ahp-step-tag">
          <span className="ahp-step-badge">1</span>
          Definice kritérií
        </div>
        <div className="ahp-config-row">
          <div>
            <div className="ahp-field-label">Počet kriterií</div>
            <select className="ahp-select" value={size} onChange={(e) => setSize(Number(e.target.value))}>
              {[2, 3, 4, 5, 6, 7, 8].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <div className="ahp-name-grid">
            {names.map((name, i) => (
              <div key={i}>
                <div className="ahp-field-label">Kritérium {i + 1}</div>
                <input
                  className="ahp-name-input"
                  value={name}
                  onChange={(e) => {
                    const next = [...criteriaNames];
                    next[i] = e.target.value;
                    setCriteriaNames(next);
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="ahp-two-col">
        <div>
          <div className="ahp-step-tag">
            <span className="ahp-step-badge">2</span>
            Párové srovnání
            <span style={{ marginLeft: 'auto', fontSize: '0.58rem' }}>{comparisons.length} dvojic</span>
          </div>
          <div className="ahp-comp-grid">
            {comparisons.map(({ i, j }) => (
              <div key={`${i}-${j}`} className="ahp-comp-card">
                <SaatySlider
                  value={matrix[i][j]}
                  nameA={names[i]}
                  nameB={names[j]}
                  onChange={(v) => handleUpdate(i, j, v)}
                />
              </div>
            ))}
          </div>
          <button type="button" className="ahp-calc-btn" onClick={handleCalc} disabled={loading}>
            {loading ? 'Počítám...' : 'Vypočítat váhy'}
          </button>
        </div>

        <div className="ahp-sticky-col">
          <div className="ahp-step-tag">
            <span className="ahp-step-badge">3</span>
            Matice a výsledky
          </div>

          <div className="ahp-card ahp-matrix-wrap">
            <div className="ahp-field-label" style={{ marginBottom: 10 }}>Srovnávací matice</div>
            <table className="ahp-matrix-table">
              <thead>
                <tr>
                  <th className="ahp-matrix-top-left" />
                  {names.map((n, i) => (
                    <th key={i} className="ahp-matrix-th">{n.slice(0, 7)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrix.map((row, i) => (
                  <tr key={i}>
                    <td className="ahp-matrix-row-head">{names[i].slice(0, 7)}</td>
                    {row.map((cell, j) => {
                      const isDiag = i === j;
                      const isHigh = cell > 3;
                      return (
                        <td
                          key={j}
                          className="ahp-matrix-cell"
                          style={{
                            background: isDiag ? PANEL2 : isHigh ? `${ACCENT}0D` : 'transparent',
                            color: isDiag ? MUTED : cell > 1 ? ACCENT : cell < 1 ? ACCENT2 : TEXT,
                            fontWeight: isDiag ? 400 : 600,
                          }}
                        >
                          {isDiag ? '-' : cell < 1 ? `1/${Math.round(1 / cell)}` : Math.round(cell)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {results ? (
            <AHPResults results={results} criteriaNames={names} />
          ) : (
            <div className="ahp-placeholder">
              <span className="ahp-placeholder-icon">[]</span>
              Spusťte výpočet pro zobrazení vah
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

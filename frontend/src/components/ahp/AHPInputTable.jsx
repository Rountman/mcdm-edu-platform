import { useMemo, useRef, useState } from 'react';
import './AHPInputTable.css';
import AHPResults from './AHPResults';
import AHPStepAlternatives from './AHPStepAlternatives';
import AHPStepSetup from './AHPStepSetup';
import PairwiseEditor from './PairwiseEditor';
import { pairwiseConsistency } from './ahp.math';
import {
  altNamesOf,
  buildPayload,
  createInitialModel,
  critNamesOf,
  exportModel,
  importModel,
  setReciprocal,
  validateModel,
  withAltCount,
  withCritCount,
} from './ahp.model';
import { downloadJson } from '../../utils/downloadJson';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

const STEPS = [
  'Kritéria a alternativy',
  'Váhy kritérií',
  'Hodnocení alternativ',
  'Výsledky',
];

async function readApiError(res) {
  try {
    const body = await res.json();
    if (typeof body.detail === 'string') return body.detail;
    if (Array.isArray(body.detail)) return body.detail.map((d) => d.msg).join(' ');
  } catch {
    // tělo odpovědi není JSON
  }
  return `Server vrátil chybu ${res.status}.`;
}

function IssueList({ issues, onGoTo }) {
  if (issues.length === 0) return null;
  return (
    <div className="ahp-warning" role="status">
      <strong>Výpočet zatím nelze spustit:</strong>
      <ul className="ahp-issue-list">
        {issues.map((issue, k) => (
          <li key={k}>
            <button type="button" className="ahp-link-btn" onClick={() => onGoTo(issue.step, issue.criterion)}>
              {issue.message}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function AHPInputTable() {
  const [model, setModel] = useState(createInitialModel);
  const [step, setStep] = useState(0);
  const [activeCrit, setActiveCrit] = useState(0);
  const [results, setResults] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [importError, setImportError] = useState(null);
  const fileInputRef = useRef(null);
  const revision = useRef(0);

  const critNames = critNamesOf(model);
  const altNames = altNamesOf(model);
  const critIdx = Math.min(activeCrit, model.nCrit - 1);
  const issues = useMemo(() => validateModel(model), [model]);
  const invalidCriteria = useMemo(
    () => new Set(issues.filter((i) => i.criterion !== undefined).map((i) => i.criterion)),
    [issues],
  );
  const critLive = useMemo(() => pairwiseConsistency(model.critMatrix), [model.critMatrix]);
  const altInconsistent = model.evals.some(
    (ev) => ev.method === 'pairwise' && !pairwiseConsistency(ev.matrix).isConsistent,
  );

  // Každá změna vstupu jde tudy: zneplatní výsledky i rozpracovaný požadavek.
  const update = (fn) => {
    revision.current += 1;
    setModel(fn);
    setResults(null);
    setApiError(null);
  };

  const setName = (key) => (i, value) => update((m) => ({
    ...m,
    [key]: m[key].map((n, k) => (k === i ? value : n)),
  }));

  const goTo = (s, criterion) => {
    setStep(s);
    if (criterion !== undefined && criterion !== null) setActiveCrit(criterion);
  };

  const handleCalc = async () => {
    const rev = revision.current;
    setLoading(true);
    setApiError(null);
    try {
      const res = await fetch(`${API_URL}/api/calculate-ahp-full`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload(model)),
      });
      if (!res.ok) {
        const msg = await readApiError(res);
        if (rev === revision.current) setApiError(msg);
        return;
      }
      const data = await res.json();
      if (rev !== revision.current) return; // vstupy se mezitím změnily
      setResults(data);
      setStep(3);
    } catch {
      if (rev === revision.current) {
        setApiError('Nepodařilo se spojit se serverem. Zkontrolujte, že backend běží, a zkuste to znovu.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    downloadJson(exportModel(model, results), `ahp-session-${new Date().toISOString().slice(0, 10)}.json`);
  };

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const next = importModel(JSON.parse(ev.target.result));
        update(() => next);
        setActiveCrit(0);
        setStep(0);
        setImportError(null);
      } catch (err) {
        setImportError(err instanceof SyntaxError ? 'Soubor není platný JSON.' : err.message);
      }
    };
    reader.readAsText(file);
  };

  const stepWarn = [
    issues.some((i) => i.step === 0),
    !critLive.isConsistent,
    invalidCriteria.size > 0 || altInconsistent,
    false,
  ];

  const calcBlock = (
    <div className="ahp-calc-block">
      <IssueList issues={issues} onGoTo={goTo} />
      {apiError && <div className="ahp-error" role="alert">{apiError}</div>}
      <button
        type="button"
        className="ahp-calc-btn"
        onClick={handleCalc}
        disabled={loading || issues.length > 0}
      >
        {loading ? 'Počítám...' : 'Vypočítat výsledné pořadí'}
      </button>
    </div>
  );

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

      <nav className="ahp-stepper" aria-label="Kroky AHP">
        {STEPS.map((label, s) => (
          <button
            key={s}
            type="button"
            className={`ahp-stepper-btn${s === step ? ' ahp-stepper-btn--active' : ''}`}
            aria-current={s === step ? 'step' : undefined}
            onClick={() => setStep(s)}
          >
            <span className="ahp-step-badge">{s + 1}</span>
            <span className="ahp-stepper-label">{label}</span>
            {stepWarn[s] && <span className="ahp-stepper-warn" title="Vyžaduje pozornost">!</span>}
            {s === 3 && results && <span className="ahp-stepper-ok" title="Spočteno">✓</span>}
          </button>
        ))}
      </nav>

      <div className="ahp-step-tag">
        <span className="ahp-step-badge">{step + 1}</span>
        {STEPS[step]}
      </div>

      {step === 0 && (
        <AHPStepSetup
          critNames={critNames}
          altNames={altNames}
          onCritCount={(n) => update((m) => withCritCount(m, n))}
          onAltCount={(n) => update((m) => withAltCount(m, n))}
          onCritName={setName('critNames')}
          onAltName={setName('altNames')}
        />
      )}

      {step === 1 && (
        <PairwiseEditor
          names={critNames}
          matrix={model.critMatrix}
          priorityLabel="Váhy kritérií"
          onChange={(i, j, v) => update((m) => ({ ...m, critMatrix: setReciprocal(m.critMatrix, i, j, v) }))}
        />
      )}

      {step === 2 && (
        <>
          <AHPStepAlternatives
            critNames={critNames}
            altNames={altNames}
            evals={model.evals}
            critWeights={critLive.weights}
            critIdx={critIdx}
            setCritIdx={setActiveCrit}
            invalidCriteria={invalidCriteria}
            onEvalChange={(j, fn) => update((m) => ({
              ...m,
              evals: m.evals.map((ev, k) => (k === j ? fn(ev) : ev)),
            }))}
          />
          {calcBlock}
        </>
      )}

      {step === 3 && (
        results ? (
          <AHPResults
            results={results}
            critNames={critNames}
            altNames={altNames}
            evals={model.evals}
            onGoTo={goTo}
          />
        ) : (
          <>
            <div className="ahp-placeholder">
              <span className="ahp-placeholder-icon">[]</span>
              Spusťte výpočet pro zobrazení pořadí alternativ
            </div>
            {calcBlock}
          </>
        )
      )}

      <div className="ahp-step-nav">
        <button type="button" className="ahp-toolbar-btn" disabled={step === 0} onClick={() => setStep(step - 1)}>
          ← Zpět
        </button>
        {step < STEPS.length - 1 && (
          <button type="button" className="ahp-toolbar-btn ahp-toolbar-btn--primary" onClick={() => setStep(step + 1)}>
            Další krok: {STEPS[step + 1]} →
          </button>
        )}
      </div>
    </div>
  );
}

import PairwiseEditor from './PairwiseEditor';
import { ALT_METHODS, ACCENT2, METHOD_LABELS, SUCCESS } from './ahp.constants';
import { pairwiseConsistency, parseNum } from './ahp.math';
import { setReciprocal } from './ahp.model';

function isBadScore(s) {
  const x = parseNum(s);
  return !Number.isFinite(x) || x < 0 || x > 100;
}

function DirectInput({ altNames, scores, onChange }) {
  return (
    <div className="ahp-table-wrap">
      <table className="ahp-data-table">
        <thead>
          <tr>
            <th>Alternativa</th>
            <th>Body (0–100)</th>
          </tr>
        </thead>
        <tbody>
          {altNames.map((name, i) => {
            const x = parseNum(scores[i]);
            return (
              <tr key={i}>
                <td className="ahp-td-name">{name}</td>
                <td>
                  <div className="ahp-direct-row">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      className="ahp-range"
                      aria-label={`Body pro ${name}`}
                      value={Number.isFinite(x) ? Math.min(100, Math.max(0, x)) : 0}
                      onChange={(e) => onChange(i, e.target.value)}
                    />
                    <input
                      type="text"
                      inputMode="decimal"
                      className={`ahp-num-input${isBadScore(scores[i]) ? ' ahp-input--invalid' : ''}`}
                      aria-label={`Body pro ${name} (číslo)`}
                      value={scores[i]}
                      onChange={(e) => onChange(i, e.target.value)}
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function SmartInput({ altNames, values, type, onChange, onType }) {
  return (
    <>
      <div className="ahp-smart-type">
        <span className="ahp-field-label" style={{ margin: 0 }}>Typ kritéria</span>
        <div className="ahp-seg" role="group" aria-label="Typ kritéria">
          {[
            { id: 'benefit', label: '↑ Benefit (více = lépe)' },
            { id: 'cost', label: '↓ Cost (méně = lépe)' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              className={`ahp-seg-btn${type === t.id ? ' ahp-seg-btn--active' : ''}`}
              aria-pressed={type === t.id}
              onClick={() => onType(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="ahp-table-wrap">
        <table className="ahp-data-table">
          <thead>
            <tr>
              <th>Alternativa</th>
              <th>Skutečná hodnota</th>
            </tr>
          </thead>
          <tbody>
            {altNames.map((name, i) => (
              <tr key={i}>
                <td className="ahp-td-name">{name}</td>
                <td>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="např. 25 000"
                    className={`ahp-num-input ahp-num-input--wide${Number.isFinite(parseNum(values[i])) ? '' : ' ahp-input--invalid'}`}
                    aria-label={`Hodnota pro ${name}`}
                    value={values[i]}
                    onChange={(e) => onChange(i, e.target.value)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="ahp-hint">
        Hodnoty se převedou min-max hodnotovou funkcí na 0–1 (nejhorší = 0, nejlepší = 1) a pak normalizují na součet 1.
      </p>
    </>
  );
}

function critStatus(ev, invalid) {
  if (invalid) return { color: ACCENT2, text: '!' };
  if (ev.method === 'pairwise' && !pairwiseConsistency(ev.matrix).isConsistent) return { color: ACCENT2, text: 'CR' };
  return { color: SUCCESS, text: 'OK' };
}

export default function AHPStepAlternatives({
  critNames, altNames, evals, critWeights, critIdx, setCritIdx, invalidCriteria, onEvalChange,
}) {
  const ev = evals[critIdx];
  const update = (fn) => onEvalChange(critIdx, fn);
  const setListItem = (key) => (i, val) => update((e) => ({
    ...e,
    [key]: e[key].map((x, k) => (k === i ? val : x)),
  }));

  return (
    <>
      <div className="ahp-crit-tabs" role="tablist" aria-label="Kritéria">
        {critNames.map((name, j) => {
          const status = critStatus(evals[j], invalidCriteria.has(j));
          return (
            <button
              key={j}
              type="button"
              role="tab"
              aria-selected={j === critIdx}
              className={`ahp-crit-tab${j === critIdx ? ' ahp-crit-tab--active' : ''}`}
              onClick={() => setCritIdx(j)}
            >
              <span className="ahp-crit-tab-name">{name}</span>
              <span className="ahp-crit-tab-meta">
                {METHOD_LABELS[evals[j].method]}
                <span className="ahp-crit-tab-dot" style={{ color: status.color }}>{status.text}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="ahp-card" role="tabpanel">
        <div className="ahp-eval-head">
          <div>
            <div className="ahp-field-label">Hodnocení alternativ vůči kritériu</div>
            <div className="ahp-eval-title">
              {critNames[critIdx]}
              <span className="ahp-eval-weight">váha {(critWeights[critIdx] * 100).toFixed(1)}%</span>
            </div>
          </div>
          <div>
            <div className="ahp-field-label">Způsob hodnocení</div>
            <div className="ahp-seg" role="group" aria-label="Způsob hodnocení">
              {ALT_METHODS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  title={m.hint}
                  className={`ahp-seg-btn${ev.method === m.id ? ' ahp-seg-btn--active' : ''}`}
                  aria-pressed={ev.method === m.id}
                  onClick={() => update((e) => ({ ...e, method: m.id }))}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <p className="ahp-hint" style={{ marginTop: 0 }}>
          {ALT_METHODS.find((m) => m.id === ev.method).hint}.
        </p>

        {ev.method === 'pairwise' && (
          <PairwiseEditor
            names={altNames}
            matrix={ev.matrix}
            priorityLabel="Lokální priority"
            onChange={(i, j, v) => update((e) => ({ ...e, matrix: setReciprocal(e.matrix, i, j, v) }))}
          />
        )}
        {ev.method === 'direct' && (
          <DirectInput altNames={altNames} scores={ev.scores} onChange={setListItem('scores')} />
        )}
        {ev.method === 'smart' && (
          <SmartInput
            altNames={altNames}
            values={ev.values}
            type={ev.type}
            onChange={setListItem('values')}
            onType={(type) => update((e) => ({ ...e, type }))}
          />
        )}
      </div>

      <div className="ahp-crit-nav">
        <button
          type="button"
          className="ahp-toolbar-btn"
          disabled={critIdx === 0}
          onClick={() => setCritIdx(critIdx - 1)}
        >
          ← Předchozí kritérium
        </button>
        <button
          type="button"
          className="ahp-toolbar-btn"
          disabled={critIdx === critNames.length - 1}
          onClick={() => setCritIdx(critIdx + 1)}
        >
          Další kritérium →
        </button>
      </div>
    </>
  );
}

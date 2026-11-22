import PairwiseEditor from './PairwiseEditor';
import { ALT_METHODS, DANGER, METHOD_LABELS, METHOD_LABELS_EN, SUCCESS } from './ahp.constants';
import { useLang } from '../../i18n/lang';
import { pairwiseConsistency, parseNum } from './ahp.math';
import { setReciprocal } from './ahp.model';

function isBadScore(s) {
  const x = parseNum(s);
  return !Number.isFinite(x) || x < 0 || x > 100;
}

function DirectInput({ altNames, scores, onChange }) {
  const { tr } = useLang();
  return (
    <div className="ahp-table-wrap">
      <table className="ahp-data-table">
        <thead>
          <tr>
            <th>{tr('Alternativa', 'Alternative')}</th>
            <th>{tr('Body (0–100)', 'Points (0–100)')}</th>
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
                      aria-label={tr(`Body pro ${name}`, `Points for ${name}`)}
                      value={Number.isFinite(x) ? Math.min(100, Math.max(0, x)) : 0}
                      onChange={(e) => onChange(i, e.target.value)}
                    />
                    <input
                      type="text"
                      inputMode="decimal"
                      className={`ahp-num-input${isBadScore(scores[i]) ? ' ahp-input--invalid' : ''}`}
                      aria-label={tr(`Body pro ${name} (číslo)`, `Points for ${name} (number)`)}
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
  const { tr } = useLang();
  return (
    <>
      <div className="ahp-smart-type">
        <span className="ahp-field-label" style={{ margin: 0 }}>{tr('Typ kritéria', 'Criterion type')}</span>
        <div className="ahp-seg" role="group" aria-label={tr('Typ kritéria', 'Criterion type')}>
          {[
            { id: 'benefit', label: tr('↑ Benefit (více = lépe)', '↑ Benefit (more is better)') },
            { id: 'cost', label: tr('↓ Cost (méně = lépe)', '↓ Cost (less is better)') },
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
              <th>{tr('Alternativa', 'Alternative')}</th>
              <th>{tr('Skutečná hodnota', 'Actual value')}</th>
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
                    placeholder={tr('např. 25 000', 'e.g. 25000')}
                    className={`ahp-num-input ahp-num-input--wide${Number.isFinite(parseNum(values[i])) ? '' : ' ahp-input--invalid'}`}
                    aria-label={tr(`Hodnota pro ${name}`, `Value for ${name}`)}
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
        {tr(
          'Hodnoty se převedou min-max hodnotovou funkcí na 0–1 (nejhorší = 0, nejlepší = 1) a pak normalizují na součet 1.',
          'Values are converted by a min-max value function to 0–1 (worst = 0, best = 1) and then normalised to sum to 1.',
        )}
      </p>
    </>
  );
}

function critStatus(ev, invalid, tr) {
  if (invalid) return { color: DANGER, text: '!', label: tr('chybí nebo chybné údaje', 'missing or invalid data') };
  if (ev.method === 'pairwise' && !pairwiseConsistency(ev.matrix).isConsistent) return { color: DANGER, text: 'CR', label: tr('nekonzistentní', 'inconsistent') };
  return { color: SUCCESS, text: 'OK', label: tr('v pořádku', 'OK') };
}

export default function AHPStepAlternatives({
  critNames, altNames, evals, critWeights, critIdx, setCritIdx, invalidCriteria, onEvalChange,
}) {
  const { lang, tr } = useLang();
  const methodLabels = lang === 'en' ? METHOD_LABELS_EN : METHOD_LABELS;
  const ev = evals[critIdx];
  const update = (fn) => onEvalChange(critIdx, fn);
  const setListItem = (key) => (i, val) => update((e) => ({
    ...e,
    [key]: e[key].map((x, k) => (k === i ? val : x)),
  }));

  return (
    <>
      <div className="ahp-crit-tabs" role="tablist" aria-label={tr('Kritéria', 'Criteria')}>
        {critNames.map((name, j) => {
          const status = critStatus(evals[j], invalidCriteria.has(j), tr);
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
                {methodLabels[evals[j].method]}
                <span className="ahp-crit-tab-dot" style={{ color: status.color }}>
                  <span aria-hidden="true">{status.text}</span>
                  <span className="u-visually-hidden">, {status.label}</span>
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="ahp-card" role="tabpanel">
        <div className="ahp-eval-head">
          <div>
            <div className="ahp-field-label">{tr('Hodnocení alternativ vůči kritériu', 'Rating alternatives against criterion')}</div>
            <div className="ahp-eval-title">
              {critNames[critIdx]}
              <span className="ahp-eval-weight">{tr('váha', 'weight')} {(critWeights[critIdx] * 100).toFixed(1)}%</span>
            </div>
          </div>
          <div>
            <div className="ahp-field-label">{tr('Způsob hodnocení', 'Rating method')}</div>
            <div className="ahp-seg" role="group" aria-label={tr('Způsob hodnocení', 'Rating method')}>
              {ALT_METHODS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  title={tr(m.hint, m.hintEn)}
                  className={`ahp-seg-btn${ev.method === m.id ? ' ahp-seg-btn--active' : ''}`}
                  aria-pressed={ev.method === m.id}
                  onClick={() => update((e) => ({ ...e, method: m.id }))}
                >
                  {tr(m.label, m.labelEn)}
                </button>
              ))}
            </div>
          </div>
        </div>
        <p className="ahp-hint" style={{ marginTop: 0 }}>
          {(() => { const m = ALT_METHODS.find((x) => x.id === ev.method); return tr(m.hint, m.hintEn); })()}.
        </p>

        {ev.method === 'pairwise' && (
          <PairwiseEditor
            names={altNames}
            matrix={ev.matrix}
            priorityLabel={tr('Lokální priority', 'Local priorities')}
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
          ← {tr('Předchozí kritérium', 'Previous criterion')}
        </button>
        <button
          type="button"
          className="ahp-toolbar-btn"
          disabled={critIdx === critNames.length - 1}
          onClick={() => setCritIdx(critIdx + 1)}
        >
          {tr('Další kritérium', 'Next criterion')} →
        </button>
      </div>
    </>
  );
}

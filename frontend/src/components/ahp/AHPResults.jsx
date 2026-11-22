import ConsistencyBadge from './ConsistencyBadge';
import { ACCENT, BAR_NEUTRAL, DANGER, METHOD_LABELS, METHOD_LABELS_EN, SUCCESS, TEXT } from './ahp.constants';
import { useLang } from '../../i18n/lang';
import { fmt, parseNum } from './ahp.math';
import { tiedAtTop, tieNote } from '../../utils/ranking';

function WeightBars({ items }) {
  const max = Math.max(...items.map((it) => it.value));
  // Zvýraznit jen jednoznačné první místo (položky jsou seřazené sestupně)
  const uniqueTop = tiedAtTop(items.map((it) => it.value)) === 1;
  return items.map(({ name, value, prefix }, i) => (
    <div key={i} className="ahp-weight-row">
      {prefix}
      <span className="ahp-weight-name" title={name}>{name}</span>
      <div className="ahp-weight-track">
        <div
          className="ahp-weight-bar"
          style={{
            width: `${max > 0 ? (value / max) * 100 : 0}%`,
            background: i === 0 && uniqueTop ? ACCENT : BAR_NEUTRAL,
          }}
        />
      </div>
      <span className="ahp-weight-pct" style={{ color: i === 0 && uniqueTop ? ACCENT : TEXT }}>
        {(value * 100).toFixed(1)}%
      </span>
    </div>
  ));
}

function sortedDesc(names, values) {
  return values.map((value, i) => ({ name: names[i], value })).sort((a, b) => b.value - a.value);
}

// Hodnota před normalizací tak, jak ji student zadal / jak vyšla z metody.
function rawLabel(lp, ev, i, tr) {
  if (lp.method === 'pairwise') return null;
  if (lp.method === 'direct') return `${fmt(lp.raw[i], 1)} ${tr('b.', 'pts')}`;
  return `${parseNum(ev.values[i])} → v = ${fmt(lp.raw[i], 2)}`;
}

function ConsistencyOverview({ results, critNames, onGoTo }) {
  const { tr } = useLang();
  const rows = [{
    key: 'crit',
    label: tr('Kritéria (váhy)', 'Criteria (weights)'),
    n: critNames.length,
    c: results.criteria.consistency,
    step: 1,
    criterion: null,
    stepLabel: tr('krok 2', 'step 2'),
  }];
  results.local_priorities.forEach((lp, j) => {
    if (lp.method !== 'pairwise') return;
    rows.push({
      key: `alt-${j}`,
      label: tr(`Alternativy vůči ${critNames[j]}`, `Alternatives vs. ${critNames[j]}`),
      n: lp.raw.length,
      c: lp.consistency,
      step: 2,
      criterion: j,
      stepLabel: tr(`krok 3 – ${critNames[j]}`, `step 3 – ${critNames[j]}`),
    });
  });
  const bad = rows.filter((r) => !r.c.is_consistent);

  return (
    <div className="ahp-results-card ahp-results-block">
      <h3 className="ahp-card-title">{tr('Konzistence párových matic', 'Consistency of pairwise matrices')}</h3>
      {bad.length > 0 && (
        <div className="ahp-warning" role="alert">
          <strong>{tr('Pozor:', 'Warning:')}</strong> {bad.length === 1
            ? tr('jedna matice je nekonzistentní', 'one matrix is inconsistent')
            : tr(`${bad.length} matice jsou nekonzistentní`, `${bad.length} matrices are inconsistent`)} (CR ≥ {tr('0,1', '0.1')}).{' '}
          {tr('Výsledné pořadí může být nespolehlivé – upravte srovnání:', 'The final ranking may be unreliable – adjust the comparisons:')}
          <div className="ahp-warning-links">
            {bad.map((r) => (
              <button key={r.key} type="button" className="ahp-link-btn" onClick={() => onGoTo(r.step, r.criterion)}>
                {r.label} ({r.stepLabel}) →
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="ahp-table-wrap">
        <table className="ahp-data-table ahp-data-table--num">
          <thead>
            <tr>
              <th>{tr('Matice', 'Matrix')}</th>
              <th>n</th>
              <th>λmax</th>
              <th>CI</th>
              <th>RI</th>
              <th>CR</th>
              <th>{tr('Stav', 'Status')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key}>
                <td className="ahp-td-name">
                  <button type="button" className="ahp-link-btn" onClick={() => onGoTo(r.step, r.criterion)}>
                    {r.label}
                  </button>
                </td>
                <td>{r.n}</td>
                <td>{fmt(r.c.lambda_max)}</td>
                <td>{fmt(r.c.ci)}</td>
                <td>{fmt(r.c.ri, 2)}</td>
                <td style={{ color: r.c.is_consistent ? SUCCESS : DANGER, fontWeight: 700 }}>{fmt(r.c.cr)}</td>
                <td>
                  <ConsistencyBadge cr={r.c.cr} isConsistent={r.c.is_consistent} n={r.n} compact />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 1 && (
        <p className="ahp-hint">{tr('Žádné kritérium nepoužívá párové hodnocení alternativ.', 'No criterion uses pairwise rating of alternatives.')}</p>
      )}
    </div>
  );
}

export default function AHPResults({ results, critNames, altNames, evals, onGoTo }) {
  const weights = results.criteria.weights;
  const ranking = results.ranking;
  const scores = results.global_scores;
  const { lang, tr } = useLang();
  const methodLabels = lang === 'en' ? METHOD_LABELS_EN : METHOD_LABELS;
  const sortedScores = ranking.map((i) => scores[i]);
  const uniqueWinner = tiedAtTop(sortedScores) === 1;
  const tie = tieNote(sortedScores, lang);

  return (
    <div className="ahp-results">
      <div className="ahp-results-grid">
        <div className="ahp-results-card">
          <h3 className="ahp-card-title">{tr('Výsledné pořadí alternativ', 'Final ranking of alternatives')}</h3>
          <WeightBars
            items={ranking.map((i, r) => ({
              name: altNames[i],
              value: scores[i],
              prefix: <span className="ahp-rank-badge" style={{ background: r === 0 && uniqueWinner ? ACCENT : undefined }}>{r + 1}.</span>,
            }))}
          />
          {tie && <p className="u-alert u-alert--warning" style={{ marginTop: 12 }}>{tie}</p>}
          <p className="ahp-hint">{tr(
            'Globální skóre = Σ váha kritéria × normalizovaná lokální priorita; součet skóre = 100 %.',
            'Global score = Σ criterion weight × normalised local priority; scores sum to 100%.',
          )}</p>
        </div>

        <div className="ahp-results-card">
          <h3 className="ahp-card-title">{tr('Váhy kritérií', 'Criteria weights')}</h3>
          <WeightBars items={sortedDesc(critNames, weights)} />
          <ConsistencyBadge
            cr={results.criteria.consistency.cr}
            isConsistent={results.criteria.consistency.is_consistent}
            n={critNames.length}
          />
        </div>
      </div>

      <div className="ahp-results-card ahp-results-block">
        <h3 className="ahp-card-title">{tr('Lokální priority alternativ', 'Local priorities of alternatives')}</h3>
        <p className="ahp-hint" style={{ marginTop: 0 }}>
          {tr(
            'Každý sloupec se před syntézou normalizuje na součet 1. U metod Přímo a SMART je vidět hodnota před normalizací (body, resp. skutečná hodnota → hodnotová funkce v) a výsledná priorita.',
            'Each column is normalised to sum to 1 before synthesis. For the Direct and SMART methods the value before normalisation (points, or actual value → value function v) and the resulting priority are shown.',
          )}
        </p>
        <div className="ahp-table-wrap">
          <table className="ahp-data-table ahp-data-table--num">
            <thead>
              <tr>
                <th>{tr('Alternativa', 'Alternative')}</th>
                {critNames.map((name, j) => (
                  <th key={j}>
                    <div>{name}</div>
                    <div className="ahp-th-sub">
                      {methodLabels[results.local_priorities[j].method]}
                      {results.local_priorities[j].method === 'smart' && ` · ${evals[j].type}`}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {altNames.map((name, i) => (
                <tr key={i}>
                  <td className="ahp-td-name">{name}</td>
                  {results.local_priorities.map((lp, j) => {
                    const raw = rawLabel(lp, evals[j], i, tr);
                    return (
                      <td key={j}>
                        {raw && <div className="ahp-td-raw">{raw}</div>}
                        <div className="ahp-td-main">{fmt(lp.normalized[i])}</div>
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr className="ahp-tr-sum">
                <td className="ahp-td-name">{tr('Součet', 'Sum')}</td>
                {results.local_priorities.map((lp, j) => (
                  <td key={j}>{fmt(lp.normalized.reduce((s, x) => s + x, 0))}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="ahp-results-card ahp-results-block">
        <h3 className="ahp-card-title">{tr('Vážené příspěvky (váha × lokální priorita)', 'Weighted contributions (weight × local priority)')}</h3>
        <div className="ahp-table-wrap">
          <table className="ahp-data-table ahp-data-table--num">
            <thead>
              <tr>
                <th>{tr('Alternativa', 'Alternative')}</th>
                {critNames.map((name, j) => (
                  <th key={j}>
                    <div>{name}</div>
                    <div className="ahp-th-sub">w = {fmt(weights[j])}</div>
                  </th>
                ))}
                <th>{tr('Skóre', 'Score')}</th>
              </tr>
            </thead>
            <tbody>
              {altNames.map((name, i) => (
                <tr key={i}>
                  <td className="ahp-td-name">{name}</td>
                  {results.weighted_contributions[i].map((c, j) => <td key={j}>{fmt(c)}</td>)}
                  <td className="ahp-td-main">{fmt(scores[i])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConsistencyOverview results={results} critNames={critNames} onGoTo={onGoTo} />
    </div>
  );
}

import ConsistencyBadge from './ConsistencyBadge';
import { ACCENT, ACCENT2, METHOD_LABELS, SUCCESS } from './ahp.constants';
import { fmt, parseNum } from './ahp.math';

function WeightBars({ items }) {
  const max = Math.max(...items.map((it) => it.value));
  return items.map(({ name, value, prefix }, i) => (
    <div key={i} className="ahp-weight-row">
      {prefix}
      <span className="ahp-weight-name" title={name}>{name}</span>
      <div className="ahp-weight-track">
        <div
          className="ahp-weight-bar"
          style={{
            width: `${max > 0 ? (value / max) * 100 : 0}%`,
            background: i === 0
              ? `linear-gradient(90deg, ${ACCENT}, #60A5FA)`
              : `linear-gradient(90deg, ${ACCENT2}, #FB923C)`,
            opacity: i === 0 ? 1 : 0.7,
          }}
        />
      </div>
      <span className="ahp-weight-pct" style={{ color: i === 0 ? ACCENT : ACCENT2 }}>
        {(value * 100).toFixed(1)}%
      </span>
    </div>
  ));
}

function sortedDesc(names, values) {
  return values.map((value, i) => ({ name: names[i], value })).sort((a, b) => b.value - a.value);
}

// Hodnota před normalizací tak, jak ji student zadal / jak vyšla z metody.
function rawLabel(lp, ev, i) {
  if (lp.method === 'pairwise') return null;
  if (lp.method === 'direct') return `${fmt(lp.raw[i], 1)} b.`;
  return `${parseNum(ev.values[i])} → v = ${fmt(lp.raw[i], 2)}`;
}

function ConsistencyOverview({ results, critNames, onGoTo }) {
  const rows = [{
    key: 'crit',
    label: 'Kritéria (váhy)',
    n: critNames.length,
    c: results.criteria.consistency,
    step: 1,
    criterion: null,
    stepLabel: 'krok 2',
  }];
  results.local_priorities.forEach((lp, j) => {
    if (lp.method !== 'pairwise') return;
    rows.push({
      key: `alt-${j}`,
      label: `Alternativy vůči ${critNames[j]}`,
      n: lp.raw.length,
      c: lp.consistency,
      step: 2,
      criterion: j,
      stepLabel: `krok 3 – ${critNames[j]}`,
    });
  });
  const bad = rows.filter((r) => !r.c.is_consistent);

  return (
    <div className="ahp-results-card ahp-results-block">
      <div className="ahp-field-label ahp-results-title">Konzistence párových matic</div>
      {bad.length > 0 && (
        <div className="ahp-warning" role="alert">
          <strong>Pozor:</strong> {bad.length === 1 ? 'jedna matice je nekonzistentní' : `${bad.length} matice jsou nekonzistentní`} (CR ≥ 0,1).
          Výsledné pořadí může být nespolehlivé – upravte srovnání:
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
              <th>Matice</th>
              <th>n</th>
              <th>λmax</th>
              <th>CI</th>
              <th>RI</th>
              <th>CR</th>
              <th>Stav</th>
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
                <td style={{ color: r.c.is_consistent ? SUCCESS : ACCENT2, fontWeight: 700 }}>{fmt(r.c.cr)}</td>
                <td>
                  <ConsistencyBadge cr={r.c.cr} isConsistent={r.c.is_consistent} n={r.n} compact />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 1 && (
        <p className="ahp-hint">Žádné kritérium nepoužívá párové hodnocení alternativ.</p>
      )}
    </div>
  );
}

export default function AHPResults({ results, critNames, altNames, evals, onGoTo }) {
  const weights = results.criteria.weights;
  const ranking = results.ranking;
  const scores = results.global_scores;

  return (
    <div className="ahp-results">
      <div className="ahp-results-grid">
        <div className="ahp-results-card">
          <div className="ahp-field-label ahp-results-title">Výsledné pořadí alternativ</div>
          <WeightBars
            items={ranking.map((i, r) => ({
              name: altNames[i],
              value: scores[i],
              prefix: <span className="ahp-rank-badge" style={{ background: r === 0 ? ACCENT : undefined }}>{r + 1}.</span>,
            }))}
          />
          <p className="ahp-hint">Globální skóre = Σ váha kritéria × normalizovaná lokální priorita; součet skóre = 100 %.</p>
        </div>

        <div className="ahp-results-card">
          <div className="ahp-field-label ahp-results-title">Váhy kritérií</div>
          <WeightBars items={sortedDesc(critNames, weights)} />
          <ConsistencyBadge
            cr={results.criteria.consistency.cr}
            isConsistent={results.criteria.consistency.is_consistent}
            n={critNames.length}
          />
        </div>
      </div>

      <div className="ahp-results-card ahp-results-block">
        <div className="ahp-field-label ahp-results-title">Lokální priority alternativ</div>
        <p className="ahp-hint" style={{ marginTop: 0 }}>
          Každý sloupec se před syntézou normalizuje na součet 1. U metod Přímo a SMART je vidět hodnota před
          normalizací (body, resp. skutečná hodnota → hodnotová funkce v) a výsledná priorita.
        </p>
        <div className="ahp-table-wrap">
          <table className="ahp-data-table ahp-data-table--num">
            <thead>
              <tr>
                <th>Alternativa</th>
                {critNames.map((name, j) => (
                  <th key={j}>
                    <div>{name}</div>
                    <div className="ahp-th-sub">
                      {METHOD_LABELS[results.local_priorities[j].method]}
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
                    const raw = rawLabel(lp, evals[j], i);
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
                <td className="ahp-td-name">Součet</td>
                {results.local_priorities.map((lp, j) => (
                  <td key={j}>{fmt(lp.normalized.reduce((s, x) => s + x, 0))}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="ahp-results-card ahp-results-block">
        <div className="ahp-field-label ahp-results-title">Vážené příspěvky (váha × lokální priorita)</div>
        <div className="ahp-table-wrap">
          <table className="ahp-data-table ahp-data-table--num">
            <thead>
              <tr>
                <th>Alternativa</th>
                {critNames.map((name, j) => (
                  <th key={j}>
                    <div>{name}</div>
                    <div className="ahp-th-sub">w = {fmt(weights[j])}</div>
                  </th>
                ))}
                <th>Skóre</th>
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

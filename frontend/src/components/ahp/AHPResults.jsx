import { ACCENT, ACCENT2 } from './ahp.constants';

function consistencyBadgeStyle(ok) {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    marginTop: 14,
    padding: '7px 14px',
    borderRadius: 7,
    fontSize: '0.7rem',
    fontWeight: 600,
    background: ok ? '#EAF7F1' : '#FFF0F3',
    border: `1px solid ${ok ? '#34D399' : ACCENT2}50`,
    color: ok ? '#059669' : ACCENT2,
  };
}

export default function AHPResults({ results, criteriaNames }) {
  const max = Math.max(...results.weights);
  const sorted = results.weights
    .map((w, i) => ({ name: criteriaNames[i], w }))
    .sort((a, b) => b.w - a.w);

  return (
    <div className="ahp-results-card">
      <div className="ahp-field-label ahp-results-title">Vahy kriterii</div>
      {sorted.map(({ name, w }, i) => (
        <div key={i} className="ahp-weight-row">
          <span className="ahp-weight-name">{name}</span>
          <div className="ahp-weight-track">
            <div
              className="ahp-weight-bar"
              style={{
                width: `${(w / max) * 100}%`,
                background: i === 0
                  ? `linear-gradient(90deg, ${ACCENT}, #60A5FA)`
                  : `linear-gradient(90deg, ${ACCENT2}, #FB923C)`,
                opacity: i === 0 ? 1 : 0.7,
              }}
            />
          </div>
          <span className="ahp-weight-pct" style={{ color: i === 0 ? ACCENT : ACCENT2 }}>
            {(w * 100).toFixed(1)}%
          </span>
        </div>
      ))}
      <div style={consistencyBadgeStyle(results.is_consistent)}>
        <span>{results.is_consistent ? 'OK' : '!'}</span>
        CR = {results.consistency_ratio.toFixed(3)}
        {' - '}
        {results.is_consistent ? 'Konzistentní' : 'Nekonzistentní - upravte srovnání'}
      </div>
    </div>
  );
}

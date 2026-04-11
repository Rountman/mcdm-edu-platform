import { ACCENT, ACCENT2 } from '../ahp/ahp.constants';

export default function SMARTResults({ results, criteriaNames, altNames }) {
  const { scores, normalized_weights, ranking } = results;

  const maxScore = Math.max(...scores);
  const maxW = Math.max(...normalized_weights);

  return (
    <div className="smrt-results">
      {/* Criteria weights */}
      <div className="smrt-res-section">
        <div className="smrt-res-label">Váhy kritérií (normalizované)</div>
        {normalized_weights.map((w, j) => (
          <div key={j} className="smrt-res-row">
            <span className="smrt-res-name">{criteriaNames[j]}</span>
            <div className="smrt-res-track">
              <div
                className="smrt-res-bar smrt-res-bar--weight"
                style={{ width: `${(w / maxW) * 100}%` }}
              />
            </div>
            <span className="smrt-res-pct" style={{ color: ACCENT }}>
              {(w * 100).toFixed(1)} %
            </span>
          </div>
        ))}
      </div>

      {/* Alternative scores */}
      <div className="smrt-res-section">
        <div className="smrt-res-label">Celkové skóre alternativ</div>
        {ranking.map((altIdx, rank) => (
          <div key={altIdx} className="smrt-res-row">
            <span className="smrt-res-rank" style={{ color: rank === 0 ? ACCENT : ACCENT2 }}>
              #{rank + 1}
            </span>
            <span className="smrt-res-name">{altNames[altIdx]}</span>
            <div className="smrt-res-track">
              <div
                className="smrt-res-bar"
                style={{
                  width: `${(scores[altIdx] / maxScore) * 100}%`,
                  background: rank === 0
                    ? `linear-gradient(90deg, ${ACCENT}, #60A5FA)`
                    : `linear-gradient(90deg, ${ACCENT2}, #FB923C)`,
                  opacity: rank === 0 ? 1 : 0.75,
                }}
              />
            </div>
            <span className="smrt-res-pct" style={{ color: rank === 0 ? ACCENT : ACCENT2 }}>
              {(scores[altIdx] * 100).toFixed(1)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

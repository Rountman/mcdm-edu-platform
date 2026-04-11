import { ACCENT, ACCENT2 } from '../ahp/ahp.constants';

export default function PAPRIKAResults({ results, criteriaNames, altNames }) {
  const { weights, scores, ranking, criteria_wins } = results;

  const maxW = Math.max(...weights);
  const maxS = Math.max(...scores);

  return (
    <div className="pap-results">
      {/* Criteria weights from comparisons */}
      <div className="pap-res-section">
        <div className="pap-res-label">Odvozené váhy kritérií</div>
        {weights.map((w, j) => (
          <div key={j} className="pap-res-row">
            <span className="pap-res-name">{criteriaNames[j]}</span>
            <span className="pap-res-wins">
              {criteria_wins[j] > 0 ? `${criteria_wins[j]}× vítěz` : '—'}
            </span>
            <div className="pap-res-track">
              <div
                className="pap-res-bar pap-res-bar--w"
                style={{ width: `${(w / maxW) * 100}%` }}
              />
            </div>
            <span className="pap-res-pct" style={{ color: ACCENT }}>
              {(w * 100).toFixed(1)} %
            </span>
          </div>
        ))}
      </div>

      {/* Alternative scores */}
      <div className="pap-res-section">
        <div className="pap-res-label">Výsledné pořadí alternativ</div>
        {ranking.map((altIdx, rank) => (
          <div key={altIdx} className="pap-res-row">
            <span className="pap-res-rank" style={{ color: rank === 0 ? ACCENT : ACCENT2 }}>
              #{rank + 1}
            </span>
            <span className="pap-res-name">{altNames[altIdx]}</span>
            <div className="pap-res-track">
              <div
                className="pap-res-bar"
                style={{
                  width: `${(scores[altIdx] / maxS) * 100}%`,
                  background: rank === 0
                    ? `linear-gradient(90deg, ${ACCENT}, #60A5FA)`
                    : `linear-gradient(90deg, ${ACCENT2}, #FB923C)`,
                  opacity: rank === 0 ? 1 : 0.75,
                }}
              />
            </div>
            <span className="pap-res-pct" style={{ color: rank === 0 ? ACCENT : ACCENT2 }}>
              {(scores[altIdx] * 100).toFixed(1)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

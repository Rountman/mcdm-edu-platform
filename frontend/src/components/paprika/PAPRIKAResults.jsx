import { ACCENT, BAR_NEUTRAL, TEXT } from '../ahp/ahp.constants';
import { tiedAtTop, tieNote } from '../../utils/ranking';

export default function PAPRIKAResults({ results, criteriaNames, altNames }) {
  const { weights, scores, ranking, criteria_wins } = results;
  const sortedScores = ranking.map((i) => scores[i]);
  const uniqueWinner = tiedAtTop(sortedScores) === 1;
  const tie = tieNote(sortedScores);

  const maxW = Math.max(...weights);
  const maxS = Math.max(...scores);

  return (
    <div className="pap-results">
      {/* Alternative scores */}
      <div className="pap-res-section">
        <h3 className="pap-res-label">Výsledné pořadí alternativ <span className="pap-res-unit">(skóre 0–100)</span></h3>
        {ranking.map((altIdx, rank) => (
          <div key={altIdx} className="pap-res-row">
            <span className={`pap-res-rank${rank === 0 && uniqueWinner ? ' pap-res-rank--top' : ''}`}>
              {rank + 1}.
            </span>
            <span className="pap-res-name">{altNames[altIdx]}</span>
            <div className="pap-res-track" aria-hidden="true">
              <div
                className="pap-res-bar"
                style={{
                  width: `${(scores[altIdx] / maxS) * 100}%`,
                  background: rank === 0 && uniqueWinner ? ACCENT : BAR_NEUTRAL,
                }}
              />
            </div>
            <span className="pap-res-pct" style={{ color: rank === 0 && uniqueWinner ? ACCENT : TEXT }}>
              {(scores[altIdx] * 100).toFixed(1)}
            </span>
          </div>
        ))}
        {tie && <p className="u-alert u-alert--warning" style={{ marginTop: 12 }}>{tie}</p>}
      </div>

      {/* Criteria weights from comparisons */}
      <div className="pap-res-section">
        <h3 className="pap-res-label">Odvozené váhy kritérií <span className="pap-res-unit">(součet 100 %)</span></h3>
        {weights.map((w, j) => (
          <div key={j} className="pap-res-row">
            <span className="pap-res-name">{criteriaNames[j]}</span>
            <span className="pap-res-wins">
              {criteria_wins[j] > 0 ? `${criteria_wins[j]}× vítěz` : 'bez výhry'}
            </span>
            <div className="pap-res-track" aria-hidden="true">
              <div
                className="pap-res-bar pap-res-bar--w"
                style={{ width: `${(w / maxW) * 100}%` }}
              />
            </div>
            <span className="pap-res-pct" style={{ color: TEXT }}>
              {(w * 100).toFixed(1)} %
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

import { ACCENT, BAR_NEUTRAL, TEXT } from '../ahp/ahp.constants';
import { tiedAtTop, tieNote } from '../../utils/ranking';

export default function SMARTResults({ results, criteriaNames, altNames }) {
  const { scores, normalized_weights, ranking } = results;
  const sortedScores = ranking.map((i) => scores[i]);
  const uniqueWinner = tiedAtTop(sortedScores) === 1;
  const tie = tieNote(sortedScores);

  const maxScore = Math.max(...scores);
  const maxW = Math.max(...normalized_weights);

  return (
    <div className="smrt-results">
      {/* Alternative scores */}
      <div className="smrt-res-section">
        <h3 className="smrt-res-label">Celkové skóre alternativ <span className="smrt-res-unit">(0–100 bodů)</span></h3>
        {ranking.map((altIdx, rank) => (
          <div key={altIdx} className="smrt-res-row">
            <span className={`smrt-res-rank${rank === 0 && uniqueWinner ? ' smrt-res-rank--top' : ''}`}>
              {rank + 1}.
            </span>
            <span className="smrt-res-name">{altNames[altIdx]}</span>
            <div className="smrt-res-track" aria-hidden="true">
              <div
                className="smrt-res-bar"
                style={{
                  width: `${(scores[altIdx] / maxScore) * 100}%`,
                  background: rank === 0 && uniqueWinner ? ACCENT : BAR_NEUTRAL,
                }}
              />
            </div>
            <span className="smrt-res-pct" style={{ color: rank === 0 && uniqueWinner ? ACCENT : TEXT }}>
              {(scores[altIdx] * 100).toFixed(1)}
            </span>
          </div>
        ))}
        {tie && <p className="u-alert u-alert--warning" style={{ marginTop: 12 }}>{tie}</p>}
      </div>

      {/* Criteria weights */}
      <div className="smrt-res-section">
        <h3 className="smrt-res-label">Váhy kritérií <span className="smrt-res-unit">(normalizované, součet 100 %)</span></h3>
        {normalized_weights.map((w, j) => (
          <div key={j} className="smrt-res-row">
            <span className="smrt-res-name">{criteriaNames[j]}</span>
            <div className="smrt-res-track" aria-hidden="true">
              <div
                className="smrt-res-bar smrt-res-bar--weight"
                style={{ width: `${(w / maxW) * 100}%` }}
              />
            </div>
            <span className="smrt-res-pct" style={{ color: TEXT }}>
              {(w * 100).toFixed(1)} %
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

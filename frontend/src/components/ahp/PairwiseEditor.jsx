import { useMemo } from 'react';
import AHPMatrix from './AHPMatrix';
import ConsistencyBadge from './ConsistencyBadge';
import SaatySlider from './SaatySlider';
import { ACCENT, BAR_NEUTRAL, TEXT } from './ahp.constants';
import { fmt, pairwiseConsistency } from './ahp.math';

const pairWord = (n) => `${n} ${n === 1 ? 'dvojice' : n < 5 ? 'dvojice' : 'dvojic'} k porovnání`;

// Párové srovnání: posuvníky vlevo, vpravo živá matice, priority a CR.
export default function PairwiseEditor({ names, matrix, onChange, priorityLabel }) {
  const n = names.length;
  const pairs = useMemo(() => {
    const list = [];
    for (let i = 0; i < n; i += 1) {
      for (let j = i + 1; j < n; j += 1) list.push({ i, j });
    }
    return list;
  }, [n]);
  const live = pairwiseConsistency(matrix);
  const max = Math.max(...live.weights);

  return (
    <div className="ahp-two-col">
      <div>
        <p className="ahp-field-label" style={{ marginTop: 0, marginBottom: 10 }}>
          {pairWord(pairs.length)}. Posuňte jezdec ke straně, která je důležitější (myší, dotykem nebo šipkami).
        </p>
        <div className="ahp-comp-grid">
          {pairs.map(({ i, j }) => (
            <div key={`${i}-${j}`} className="ahp-comp-card">
              <SaatySlider
                value={matrix[i][j]}
                nameA={names[i]}
                nameB={names[j]}
                onChange={(v) => onChange(i, j, v)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="ahp-sticky-col">
        <AHPMatrix names={names} matrix={matrix} />
        <div className="ahp-results-card">
          <h3 className="ahp-card-title">{priorityLabel} (živý náhled)</h3>
          {live.weights.map((w, i) => (
            <div key={i} className="ahp-weight-row">
              <span className="ahp-weight-name" title={names[i]}>{names[i]}</span>
              <div className="ahp-weight-track">
                <div
                  className="ahp-weight-bar"
                  style={{
                    width: `${(w / max) * 100}%`,
                    background: w === max ? ACCENT : BAR_NEUTRAL,
                  }}
                />
              </div>
              <span className="ahp-weight-pct" style={{ color: w === max ? ACCENT : TEXT }}>
                {(w * 100).toFixed(1)}%
              </span>
            </div>
          ))}
          <div className="ahp-cons-stats">
            λmax = {fmt(live.lambdaMax)} · CI = {fmt(live.ci)} · RI = {fmt(live.ri, 2)}
          </div>
          <ConsistencyBadge cr={live.cr} isConsistent={live.isConsistent} n={n} />
        </div>
      </div>
    </div>
  );
}

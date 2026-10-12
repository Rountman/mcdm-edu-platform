import { ACCENT, ACCENT2, MUTED, PANEL2, TEXT } from './ahp.constants';
import { formatSaaty } from './ahp.math';

export default function AHPMatrix({ names, matrix, title = 'Srovnávací matice' }) {
  return (
    <div className="ahp-card ahp-matrix-wrap">
      <div className="ahp-field-label" style={{ marginBottom: 10 }}>{title}</div>
      <table className="ahp-matrix-table">
        <thead>
          <tr>
            <th className="ahp-matrix-top-left" />
            {names.map((n, i) => (
              <th key={i} className="ahp-matrix-th" title={n}>{n.slice(0, 7)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, i) => (
            <tr key={i}>
              <td className="ahp-matrix-row-head" title={names[i]}>{names[i].slice(0, 7)}</td>
              {row.map((cell, j) => {
                const isDiag = i === j;
                const isHigh = cell > 3;
                return (
                  <td
                    key={j}
                    className="ahp-matrix-cell"
                    style={{
                      background: isDiag ? PANEL2 : isHigh ? `${ACCENT}0D` : 'transparent',
                      color: isDiag ? MUTED : cell > 1 ? ACCENT : cell < 1 ? ACCENT2 : TEXT,
                      fontWeight: isDiag ? 400 : 600,
                    }}
                  >
                    {isDiag ? '-' : formatSaaty(cell)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

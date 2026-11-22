import { ACCENT, ACCENT2, MUTED, PANEL2, TEXT } from './ahp.constants';
import { formatSaaty } from './ahp.math';

export default function AHPMatrix({ names, matrix, title = 'Srovnávací matice' }) {
  return (
    <div className="ahp-card ahp-matrix-wrap">
      <table className="ahp-matrix-table">
        <caption>{title} <span className="ahp-matrix-caption-hint">(řádek vůči sloupci)</span></caption>
        <thead>
          <tr>
            <td className="ahp-matrix-top-left" />
            {names.map((n, i) => (
              <th key={i} scope="col" className="ahp-matrix-th">{n}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, i) => (
            <tr key={i}>
              <th scope="row" className="ahp-matrix-row-head">{names[i]}</th>
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
                    {isDiag ? '–' : formatSaaty(cell)}
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

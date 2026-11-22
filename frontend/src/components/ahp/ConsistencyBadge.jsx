import { DANGER, SUCCESS } from './ahp.constants';
import { fmt } from './ahp.math';

export default function ConsistencyBadge({ cr, isConsistent, n, compact = false }) {
  const color = isConsistent ? SUCCESS : DANGER;
  const note = n <= 2
    ? 'Konzistentní (pro n ≤ 2 vždy)'
    : isConsistent ? 'Konzistentní' : 'Nekonzistentní - upravte srovnání';
  return (
    <div
      className={`ahp-cr-badge${compact ? ' ahp-cr-badge--compact' : ''}`}
      style={{
        background: isConsistent ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
        borderColor: color,
        color,
      }}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" style={{ flexShrink: 0 }}>
        {isConsistent
          ? <path d="M3 8.5 6.5 12 13 4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          : <path d="M8 2.5v7M8 12.5v.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />}
      </svg>
      {compact ? (isConsistent ? 'Konzistentní' : 'Nekonzistentní') : <>CR = {fmt(cr)} - {note}</>}
    </div>
  );
}

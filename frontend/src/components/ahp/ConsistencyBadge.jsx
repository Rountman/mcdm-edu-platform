import { ACCENT2, SUCCESS } from './ahp.constants';
import { fmt } from './ahp.math';

export default function ConsistencyBadge({ cr, isConsistent, n, compact = false }) {
  const color = isConsistent ? SUCCESS : ACCENT2;
  const note = n <= 2
    ? 'Konzistentní (pro n ≤ 2 vždy)'
    : isConsistent ? 'Konzistentní' : 'Nekonzistentní - upravte srovnání';
  return (
    <div
      className={`ahp-cr-badge${compact ? ' ahp-cr-badge--compact' : ''}`}
      style={{
        background: isConsistent ? '#EAF7F1' : '#FFF0F3',
        borderColor: `${isConsistent ? '#34D399' : ACCENT2}50`,
        color,
      }}
    >
      <span>{isConsistent ? 'OK' : '!'}</span>
      {compact ? (isConsistent ? 'Konzistentní' : 'Nekonzistentní') : <>CR = {fmt(cr)} - {note}</>}
    </div>
  );
}

import { useRef } from 'react';
import {
  ACCENT,
  ACCENT2,
  MUTED,
  SAATY_STEPS,
  STEP_COUNT,
  CENTER_IDX,
} from './ahp.constants';
import { useLang } from '../../i18n/lang';

// Slovní význam stupňů Saatyho škály (sudé = mezistupeň)
const SAATY_WORDS_EN = {
  1: 'equally important',
  2: 'between equal and moderate',
  3: 'moderately more important',
  4: 'between moderate and strong',
  5: 'strongly more important',
  6: 'between strong and very strong',
  7: 'very strongly more important',
  8: 'between very strong and extreme',
  9: 'extremely more important',
};

const SAATY_WORDS_CS = {
  1: 'stejně důležité',
  2: 'mezi stejně a mírně',
  3: 'mírně důležitější',
  4: 'mezi mírně a silně',
  5: 'silně důležitější',
  6: 'mezi silně a velmi silně',
  7: 'velmi silně důležitější',
  8: 'mezi velmi silně a extrémně',
  9: 'extrémně důležitější',
};

function toSigned(v) {
  if (Math.abs(v - 1) < 0.01) return 0;
  return v >= 1 ? Math.round(v) : -Math.round(1 / v);
}

export default function SaatySlider({ value, nameA, nameB, onChange }) {
  const trackRef = useRef(null);
  const dragging = useRef(false);
  const signed = toSigned(value);
  const idx = SAATY_STEPS.includes(signed)
    ? SAATY_STEPS.indexOf(signed)
    : SAATY_STEPS.reduce((bestIdx, step, i) => (
      Math.abs(step - signed) < Math.abs(SAATY_STEPS[bestIdx] - signed) ? i : bestIdx
    ), 0);

  const pct = idx / (STEP_COUNT - 1);
  const { lang, tr } = useLang();
  const SAATY_WORDS = lang === 'en' ? SAATY_WORDS_EN : SAATY_WORDS_CS;
  const isEqual = signed === 0;
  const absVal = Math.abs(signed);
  const displayVal = signed > 0 ? `${absVal}:1` : signed < 0 ? `1:${absVal}` : '1:1';
  const winner = signed > 0 ? nameA : nameB;
  const loser = signed > 0 ? nameB : nameA;
  const fillColor = signed > 0 ? ACCENT : signed < 0 ? ACCENT2 : MUTED;
  const verdict = isEqual
    ? tr(`${nameA} a ${nameB} jsou stejně důležité`, `${nameA} and ${nameB} are equally important`)
    : tr(`${winner} je oproti ${loser}: ${SAATY_WORDS[absVal]}`, `${winner} compared to ${loser}: ${SAATY_WORDS[absVal]}`);

  const idxFromX = (clientX) => {
    const rect = trackRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return Math.round(x * (STEP_COUNT - 1));
  };

  const applyIdx = (i) => {
    const clamped = Math.max(0, Math.min(STEP_COUNT - 1, i));
    const raw = SAATY_STEPS[clamped];
    if (raw === 0) onChange(1);
    else onChange(raw > 0 ? raw : 1 / Math.abs(raw));
  };

  const handlePointerDown = (e) => {
    e.preventDefault();
    trackRef.current.focus();
    dragging.current = true;
    trackRef.current.setPointerCapture(e.pointerId);
    applyIdx(idxFromX(e.clientX));
  };

  const handlePointerMove = (e) => {
    if (dragging.current) applyIdx(idxFromX(e.clientX));
  };

  const handlePointerUp = () => {
    dragging.current = false;
  };

  // Klávesnice: šipky po jednom stupni, PageUp/Down po třech, Home/End krajní hodnoty
  const handleKeyDown = (e) => {
    const delta = {
      ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1, PageDown: -3, PageUp: 3,
    }[e.key];
    let next = null;
    if (delta !== undefined) {
      // Polohy −1, 0, +1 znamenají všechny 1:1 – přeskočit je, aby se jezdec opravdu posunul
      const dir = Math.sign(delta);
      next = idx + delta;
      while (next > 0 && next < STEP_COUNT - 1 && Math.abs(SAATY_STEPS[next]) <= 1
        && Math.abs(SAATY_STEPS[idx]) <= 1) next += dir;
    } else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = STEP_COUNT - 1;
    if (next === null) return;
    e.preventDefault();
    applyIdx(next);
  };

  const tickLabels = SAATY_STEPS.map((step) => (step === 0 ? '1' : String(Math.abs(step))));

  return (
    <div className="ahp-slider-wrap">
      <div className="ahp-slider-header-row">
        <span className="ahp-slider-name" title={nameB}>{nameB}</span>
        <span className="ahp-slider-badge" style={{ color: fillColor, borderColor: fillColor }}>
          {displayVal}
        </span>
        <span className="ahp-slider-name ahp-slider-name-right" title={nameA}>{nameA}</span>
      </div>

      <div className="ahp-slider-track-wrap">
        <div
          ref={trackRef}
          className="ahp-slider-track"
          role="slider"
          tabIndex={0}
          aria-label={tr(`Srovnání ${nameB} a ${nameA}`, `Comparison of ${nameB} and ${nameA}`)}
          aria-valuemin={0}
          aria-valuemax={STEP_COUNT - 1}
          aria-valuenow={idx}
          aria-valuetext={`${verdict} (${displayVal})`}
          onKeyDown={handleKeyDown}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <div className="ahp-slider-rail" />
          <div
            className="ahp-slider-fill"
            style={{
              left: pct < 0.5 ? `${pct * 100}%` : '50%',
              right: pct > 0.5 ? `${(1 - pct) * 100}%` : '50%',
              background: fillColor,
            }}
          />
          <div
            className="ahp-slider-thumb"
            style={{
              left: `${pct * 100}%`,
              background: fillColor,
            }}
          />
        </div>
      </div>

      <div className="ahp-slider-ticks" aria-hidden="true">
        {tickLabels.map((label, i) => {
          const p = (i / (STEP_COUNT - 1)) * 100;
          return (
            <span
              key={i}
              className={`ahp-slider-tick${i === idx ? ' ahp-slider-tick--active' : ''}`}
              style={{
                left: `${p}%`,
                color: i < CENTER_IDX ? ACCENT2 : i > CENTER_IDX ? ACCENT : MUTED,
              }}
            >
              {label}
            </span>
          );
        })}
      </div>

      <div className="ahp-winner-line" style={{ color: isEqual ? MUTED : fillColor }}>
        {isEqual ? tr('Rovnocenné', 'Equal') : `${winner}: ${SAATY_WORDS[absVal]}`}
      </div>
    </div>
  );
}

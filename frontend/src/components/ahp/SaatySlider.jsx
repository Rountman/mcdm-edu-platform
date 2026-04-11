import { useRef } from 'react';
import {
  ACCENT,
  ACCENT2,
  MUTED,
  SAATY_STEPS,
  STEP_COUNT,
  CENTER_IDX,
} from './ahp.constants';

function toSigned(v) {
  if (Math.abs(v - 1) < 0.01) return 0;
  return v >= 1 ? Math.round(v) : -Math.round(1 / v);
}

function sliderBadgeStyle(color) {
  return {
    fontSize: '0.68rem',
    fontWeight: 700,
    fontFamily: 'monospace',
    background: `${color}12`,
    border: `1px solid ${color}30`,
    color,
    padding: '2px 8px',
    borderRadius: 5,
  };
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
  const isEqual = signed === 0;
  const absVal = Math.abs(signed);
  const displayVal = signed > 0 ? `${absVal}:1` : signed < 0 ? `1:${absVal}` : '1:1';
  const winner = signed > 0 ? nameA : nameB;
  const fillColor = signed > 0 ? ACCENT : signed < 0 ? ACCENT2 : MUTED;

  const idxFromX = (clientX) => {
    const rect = trackRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return Math.round(x * (STEP_COUNT - 1));
  };

  const applyIdx = (i) => {
    const raw = SAATY_STEPS[i];
    if (raw === 0) onChange(1);
    else onChange(raw > 0 ? raw : 1 / Math.abs(raw));
  };

  const handlePointerDown = (e) => {
    e.preventDefault();
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

  const tickLabels = SAATY_STEPS.map((step) => (step === 0 ? '1' : String(Math.abs(step))));

  return (
    <div className="ahp-slider-wrap">
      <div className="ahp-slider-header-row">
        <span className="ahp-slider-name">{nameB}</span>
        <span style={sliderBadgeStyle(isEqual ? MUTED : fillColor)}>
          {isEqual ? '1:1' : displayVal}
        </span>
        <span className="ahp-slider-name ahp-slider-name-right">{nameA}</span>
      </div>

      <div className="ahp-slider-track-wrap">
        <div
          ref={trackRef}
          className="ahp-slider-track"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <div
            className="ahp-slider-fill"
            style={{
              left: pct < 0.5 ? `${pct * 100}%` : '50%',
              right: pct > 0.5 ? `${(1 - pct) * 100}%` : '50%',
              background: fillColor,
              opacity: 0.25,
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

      <div className="ahp-slider-ticks">
        {tickLabels.map((label, i) => {
          const p = (i / (STEP_COUNT - 1)) * 100;
          return (
            <span
              key={i}
              className="ahp-slider-tick"
              style={{
                left: `${p}%`,
                color: i < CENTER_IDX ? ACCENT2 : i > CENTER_IDX ? ACCENT : MUTED,
                fontWeight: i === CENTER_IDX ? 700 : 500,
              }}
            >
              {label}
            </span>
          );
        })}
      </div>

      <div className="ahp-winner-line" style={{ color: isEqual ? MUTED : fillColor }}>
        {isEqual ? 'Rovnocenné' : `${winner} je důležitějši`}
      </div>
    </div>
  );
}

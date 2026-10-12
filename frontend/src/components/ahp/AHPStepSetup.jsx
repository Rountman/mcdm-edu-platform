import { MAX_ALTS, MAX_CRIT, MIN_ALTS, MIN_CRIT } from './ahp.constants';

const range = (min, max) => Array.from({ length: max - min + 1 }, (_, i) => min + i);

function NameGrid({ names, prefix, onChange }) {
  return (
    <div className="ahp-name-grid">
      {names.map((name, i) => (
        <div key={i}>
          <label className="ahp-field-label" htmlFor={`${prefix}-${i}`} style={{ display: 'block' }}>
            {prefix === 'crit' ? 'Kritérium' : 'Alternativa'} {i + 1}
          </label>
          <input
            id={`${prefix}-${i}`}
            className={`ahp-name-input${name.trim() ? '' : ' ahp-input--invalid'}`}
            value={name}
            onChange={(e) => onChange(i, e.target.value)}
          />
        </div>
      ))}
    </div>
  );
}

export default function AHPStepSetup({ critNames, altNames, onCritCount, onAltCount, onCritName, onAltName }) {
  return (
    <>
      <div className="ahp-card">
        <div className="ahp-step-tag">Kritéria</div>
        <div className="ahp-config-row">
          <div>
            <label className="ahp-field-label" htmlFor="ahp-n-crit" style={{ display: 'block' }}>Počet kritérií</label>
            <select
              id="ahp-n-crit"
              className="ahp-select"
              value={critNames.length}
              onChange={(e) => onCritCount(Number(e.target.value))}
            >
              {range(MIN_CRIT, MAX_CRIT).map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <NameGrid names={critNames} prefix="crit" onChange={onCritName} />
        </div>
      </div>

      <div className="ahp-card">
        <div className="ahp-step-tag">Alternativy</div>
        <div className="ahp-config-row">
          <div>
            <label className="ahp-field-label" htmlFor="ahp-n-alts" style={{ display: 'block' }}>Počet alternativ</label>
            <select
              id="ahp-n-alts"
              className="ahp-select"
              value={altNames.length}
              onChange={(e) => onAltCount(Number(e.target.value))}
            >
              {range(MIN_ALTS, MAX_ALTS).map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <NameGrid names={altNames} prefix="alt" onChange={onAltName} />
        </div>
      </div>
    </>
  );
}

import { MAX_ALTS, MAX_CRIT, MIN_ALTS, MIN_CRIT } from './ahp.constants';
import { useLang } from '../../i18n/lang';

const range = (min, max) => Array.from({ length: max - min + 1 }, (_, i) => min + i);

function NameGrid({ names, prefix, onChange }) {
  const { tr } = useLang();
  return (
    <div className="ahp-name-grid">
      {names.map((name, i) => (
        <div key={i}>
          <label className="ahp-field-label" htmlFor={`${prefix}-${i}`} style={{ display: 'block' }}>
            {prefix === 'crit' ? tr('Kritérium', 'Criterion') : tr('Alternativa', 'Alternative')} {i + 1}
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
  const { tr } = useLang();
  return (
    <>
      <div className="ahp-card">
        <h3 className="ahp-card-title">{tr('Kritéria', 'Criteria')}</h3>
        <div className="ahp-config-row">
          <div>
            <label className="ahp-field-label" htmlFor="ahp-n-crit" style={{ display: 'block' }}>{tr('Počet kritérií', 'Number of criteria')}</label>
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
        <h3 className="ahp-card-title">{tr('Alternativy', 'Alternatives')}</h3>
        <div className="ahp-config-row">
          <div>
            <label className="ahp-field-label" htmlFor="ahp-n-alts" style={{ display: 'block' }}>{tr('Počet alternativ', 'Number of alternatives')}</label>
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

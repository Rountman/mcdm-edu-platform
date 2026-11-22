import { useState } from 'react';
import './SensitivityTheory.css';
import { useLang } from '../../i18n/lang';

const STEPS = [
  { n: 1, color: '#0057FF',
    title: { cs: 'Spusťte základní výpočet', en: 'Run the baseline calculation' },
    body: {
      cs: 'Nejprve proveďte standardní výpočet metodou dle vašeho výběru (AHP, SMART, PAPRIKA). Zaznamenejte výsledné pořadí alternativ a váhy kritérií — to je váš výchozí bod (baseline).',
      en: 'First run the standard calculation with the method of your choice (AHP, SMART, PAPRIKA). Note the resulting ranking of alternatives and the criteria weights — this is your baseline.',
    } },
  { n: 2, color: '#2563EB',
    title: { cs: 'Vyberte kritérium k analýze', en: 'Choose a criterion to analyse' },
    body: {
      cs: 'Zvolte jedno kritérium, jehož vliv chcete zkoumat. Typicky začněte od kritéria s nejvyšší váhou nebo od kritéria, o jehož hodnotě jste nejméně přesvědčeni.',
      en: 'Pick one criterion whose influence you want to examine. Typically start with the criterion with the highest weight, or the one whose value you are least sure about.',
    } },
  { n: 3, color: '#7C3AED',
    title: { cs: 'Variujte váhu v rozsahu 0–100 %', en: 'Vary the weight from 0 to 100%' },
    body: {
      cs: 'Postupně měňte váhu zvoleného kritéria od 0 % do 100 %. Ostatní váhy se proporcionálně škálují tak, aby součet vah zůstal 100 %. Pro každou hodnotu přepočítejte skóre alternativ.',
      en: 'Gradually change the weight of the chosen criterion from 0% to 100%. The other weights are scaled proportionally so that the weights still sum to 100%. Recalculate the scores of the alternatives for each value.',
    } },
  { n: 4, color: '#DB2777',
    title: { cs: 'Identifikujte přechodové body', en: 'Identify crossover points' },
    body: {
      cs: 'Přechodový bod (crossover point) nastane, když se dvě křivky skóre kříží — pořadí alternativ se změní. Pokud je váš aktuální výběr daleko od přechodových bodů, je rozhodnutí robustní.',
      en: 'A crossover point occurs where two score curves intersect — the ranking of alternatives changes. If your current choice is far from any crossover point, the decision is robust.',
    } },
  { n: 5, color: '#059669',
    title: { cs: 'Interpretujte výsledky', en: 'Interpret the results' },
    body: {
      cs: 'Pokud se optimální alternativa mění jen při extrémních hodnotách váhy, rozhodnutí je stabilní. Pokud se mění při malé změně váhy, je nutná hlubší diskuse o správnosti odhadnutých vah.',
      en: 'If the optimal alternative only changes at extreme weight values, the decision is stable. If it changes after a small change in weight, the estimated weights need closer discussion.',
    } },
];

const MUTED = '#4A5875';
const ALT_B = '#6D28D9';
const CROSS = '#B45309';

export default function SensitivityTheory() {
  const { lang, tr } = useLang();
  const [openStep, setOpenStep] = useState(null);

  return (
    <div className="snst-root">

      {/* INTRO */}
      <section className="snst-card snst-anim snst-intro" style={{ '--delay': '0s' }}>
        <div className="snst-intro-bar" />
        <div className="snst-intro-body">
          <span className="snst-badge">{tr('Nástroj pro ověření robustnosti', 'A tool for checking robustness')}</span>
          <h2 className="snst-h2">
            {tr('Analýza citlivosti', 'Sensitivity analysis')}{' '}
            {lang === 'cs' && <span className="snst-h2-muted">(Sensitivity Analysis)</span>}
          </h2>
          {tr(
            <p className="snst-lead">
              Analýza citlivosti zjišťuje, jak moc se výsledek rozhodovacího modelu změní, pokud se
              změní vstupní hodnoty — váhy kritérií nebo hodnocení alternativ. Odpovídá na otázku:
              <em> „Je naše rozhodnutí robustní, nebo záleží kriticky na jednom parametru?“</em>
            </p>,
            <p className="snst-lead">
              Sensitivity analysis examines how much the result of a decision model changes when the
              inputs change — criteria weights or ratings of alternatives. It answers the question:
              <em> “Is our decision robust, or does it depend critically on a single parameter?”</em>
            </p>,
          )}
          <div className="snst-highlight-row">
            <div className="snst-highlight snst-highlight--ok">
              <div className="snst-hl-icon">◆</div>
              <div>
                <div className="snst-hl-title">{tr('Robustní rozhodnutí', 'Robust decision')}</div>
                <div className="snst-hl-desc">{tr(
                  'Pořadí alternativ se nemění ani při výrazné změně vah — výsledek je spolehlivý.',
                  'The ranking does not change even after a large change in weights — the result is reliable.',
                )}</div>
              </div>
            </div>
            <div className="snst-highlight snst-highlight--warn">
              <div className="snst-hl-icon">◆</div>
              <div>
                <div className="snst-hl-title">{tr('Citlivé rozhodnutí', 'Sensitive decision')}</div>
                <div className="snst-hl-desc">{tr(
                  'Malá změna váhy způsobí změnu pořadí — nutno ověřit odhady vah.',
                  'A small change in weight changes the ranking — the weight estimates need to be checked.',
                )}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CHART EXPLANATION */}
      <section className="snst-card snst-anim" style={{ '--delay': '0.1s' }}>
        <span className="snst-badge">{tr('Jak číst graf', 'How to read the chart')}</span>
        <h3 className="snst-h3">{tr('Interpretace grafu citlivosti', 'Interpreting the sensitivity chart')}</h3>
        <div className="snst-chart-demo">
          {/*
            Coordinate system:
              x(pct)   = 65 + pct  * 4.5   (0 % → 65, 100 % → 515)
              y(score) = 210 - score * 1.9  (0 % → 210, 100 % → 20)

            Curve A scores: 75 % → 56 %   (gently declining)
            Curve B scores: 12 % → 69 %   (steeply rising)

            Intersection between 75 % and 100 % (x 403–515):
              y_A = 91 + k·12,  y_B = 101 − k·22   (k = (x−403)/112)
              91 + 12k = 101 − 22k  →  k = 10/34 ≈ 0.294
              x ≈ 436,  y ≈ 95   →  ~82 % weight
          */}
          <svg viewBox="0 0 560 248" className="snst-demo-svg" aria-hidden="true">
            {/* Axes */}
            <line x1="65" y1="210" x2="515" y2="210" stroke="#7A869C" strokeWidth="1.5"/>
            <line x1="65" y1="18"  x2="65"  y2="210" stroke="#7A869C" strokeWidth="1.5"/>
            {/* Grid lines at 25 %, 50 %, 75 % */}
            {[25, 50, 75].map(v => (
              <line key={v} x1="65" y1={Math.round(210 - v * 1.9)} x2="515" y2={Math.round(210 - v * 1.9)}
                stroke="#DDE3ED" strokeWidth="1" strokeDasharray="4 3"/>
            ))}
            {/* Axis labels */}
            <text x="290" y="244" textAnchor="middle" fontSize="12" fill={MUTED}>{tr('Váha kritéria K₁ (%)', 'Weight of criterion K₁ (%)')}</text>
            <text x="15" y="114" textAnchor="middle" fontSize="12" fill={MUTED} transform="rotate(-90,15,114)">{tr('Skóre alternativy (%)', 'Alternative score (%)')}</text>
            {/* X ticks */}
            {[0,25,50,75,100].map(v => (
              <text key={v} x={65 + v * 4.5} y="223" textAnchor="middle" fontSize="11" fill={MUTED}>{v}</text>
            ))}
            {/* Y ticks */}
            {[0,25,50,75,100].map(v => (
              <text key={v} x="59" y={Math.round(214 - v * 1.9)} textAnchor="end" fontSize="11" fill={MUTED}>{v}</text>
            ))}
            {/* Curve A — score: 75 % at 0 % weight → 56 % at 100 % weight */}
            <polyline points="65,68 178,73 290,82 403,91 515,103"
              fill="none" stroke="#0057FF" strokeWidth="2.5"/>
            {/* Curve B — score: 12 % at 0 % weight → 69 % at 100 % weight (přerušovaná – rozlišení i bez barvy) */}
            <polyline points="65,187 178,163 290,125 403,101 515,79"
              fill="none" stroke={ALT_B} strokeWidth="2.5" strokeDasharray="8 4"/>
            {/* Current weight line at 35 %  →  x = 65 + 35·4.5 = 222 */}
            <line x1="222" y1="20" x2="222" y2="210" stroke={MUTED} strokeWidth="1.5" strokeDasharray="5 4"/>
            <text x="222" y="14" textAnchor="middle" fontSize="11" fill={MUTED}>{tr('Aktuální', 'Current')}</text>
            {/* Crossover at x≈436, y≈95  (~82 % weight) — computed above */}
            <circle cx="436" cy="95" r="10" fill="rgba(180,83,9,0.08)" stroke={CROSS} strokeWidth="2.5"/>
            <text x="436" y="99" textAnchor="middle" fontSize="10" fill={CROSS} fontWeight="800">!</text>
            {/* Leader line + annotation above the circle */}
            <line x1="436" y1="85" x2="436" y2="73" stroke={CROSS} strokeWidth="1.5" strokeDasharray="2 2" opacity="0.7"/>
            <text x="436" y="68" textAnchor="middle" fontSize="11" fill={CROSS} fontWeight="700">{tr('Přechodový bod', 'Crossover point')}</text>
            <text x="436" y="56" textAnchor="middle" fontSize="10.5" fill={CROSS}>{tr('~ 82 % váhy', '~ 82% weight')}</text>
            {/* Curve labels */}
            <text x="520" y="106" fontSize="12" fill="#0057FF" fontWeight="700">A</text>
            <text x="520" y="82"  fontSize="12" fill={ALT_B} fontWeight="700">B</text>
          </svg>
          <div className="snst-chart-legend">
            <div className="snst-legend-item">
              <span className="snst-legend-dot" style={{ background: '#0057FF' }} />
              <div>
                <div className="snst-legend-title">{tr('Alternativa A', 'Alternative A')}</div>
                <div className="snst-legend-desc">{tr(
                  'V levé části grafu je A nejlepší. Křivka je relativně plochá — A je robustní vůči změně váhy K₁.',
                  'On the left side of the chart A is best. Its curve is fairly flat — A is robust to changes in the weight of K₁.',
                )}</div>
              </div>
            </div>
            <div className="snst-legend-item">
              <span className="snst-legend-dot" style={{ background: ALT_B }} />
              <div>
                <div className="snst-legend-title">{tr('Alternativa B', 'Alternative B')}</div>
                <div className="snst-legend-desc">{tr(
                  'B silně závisí na váze K₁ — při vyšší váze překoná A. To je přechodový bod (crossover).',
                  'B depends strongly on the weight of K₁ — at a higher weight it overtakes A. That is the crossover point.',
                )}</div>
              </div>
            </div>
            <div className="snst-legend-item">
              <span className="snst-legend-dot" style={{ background: CROSS }} />
              <div>
                <div className="snst-legend-title">{tr('Přechodový bod', 'Crossover point')}</div>
                <div className="snst-legend-desc">{tr(
                  'Váha kritéria, při které se změní pořadí alternativ. Čím dál od aktuální váhy, tím robustnější výsledek.',
                  'The criterion weight at which the ranking of alternatives changes. The further from the current weight, the more robust the result.',
                )}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STEPS */}
      <section className="snst-card snst-anim" style={{ '--delay': '0.2s' }}>
        <span className="snst-badge">{tr('Postup', 'Procedure')}</span>
        <h3 className="snst-h3">
          {tr('5 kroků analýzy citlivosti', '5 steps of sensitivity analysis')}{' '}
          <span className="snst-h3-hint">— {tr('klikněte pro detail', 'click for details')}</span>
        </h3>
        <div className="snst-steps">
          {STEPS.map((s, i) => (
            <button key={s.n} type="button"
              className={`snst-step${openStep === i ? ' snst-step--open' : ''}`}
              style={{ '--sc': s.color }}
              onClick={() => setOpenStep(openStep === i ? null : i)}
              aria-expanded={openStep === i}
            >
              <div className="snst-step-n" style={{ background: s.color }}>{s.n}</div>
              <div className="snst-step-inner">
                <div className="snst-step-title">{s.title[lang]}</div>
                {openStep === i && <p className="snst-step-body">{s.body[lang]}</p>}
              </div>
              <div className={`snst-step-chevron${openStep === i ? ' snst-step-chevron--open' : ''}`} style={{ color: s.color }}>›</div>
            </button>
          ))}
        </div>
      </section>

      {/* LOCAL vs GLOBAL */}
      <section className="snst-card snst-anim" style={{ '--delay': '0.3s' }}>
        <span className="snst-badge">{tr('Typy analýzy', 'Types of analysis')}</span>
        <h3 className="snst-h3">{tr('Lokální vs. globální citlivost', 'Local vs. global sensitivity')}</h3>
        <div className="snst-type-grid">
          <div className="snst-type-card snst-type-card--local">
            <div className="snst-type-title">{tr('Lokální', 'Local')}</div>
            <div className="snst-type-desc">
              {tr(
                'Mění se jeden parametr při zachování ostatních. Jednoduchá, rychlá, vhodná pro identifikaci klíčových kritérií. Používá se v této laboratoři.',
                'One parameter changes while the others stay fixed. Simple, fast and good for identifying key criteria. This is what the lab uses.',
              )}
            </div>
            <div className="snst-type-ex">{tr(
              'Příklad: „Co se stane, když váha Ceny vzroste z 30 % na 50 %?“',
              'Example: “What happens if the weight of Price rises from 30% to 50%?”',
            )}</div>
          </div>
          <div className="snst-type-card snst-type-card--global">
            <div className="snst-type-title">{tr('Globální', 'Global')}</div>
            <div className="snst-type-desc">
              {tr(
                'Mění se více parametrů současně — např. Monte Carlo simulace. Komplexnější, ale odhalí interakce mezi parametry. Využívá se v pokročilých DSS nástrojích.',
                'Several parameters change at once — e.g. a Monte Carlo simulation. More complex, but it reveals interactions between parameters. Used in advanced decision support (DSS) tools.',
              )}
            </div>
            <div className="snst-type-ex">{tr(
              'Příklad: Simultánní variace vah všech kritérií v zadaném rozsahu.',
              'Example: varying the weights of all criteria simultaneously within a given range.',
            )}</div>
          </div>
        </div>
      </section>

    </div>
  );
}

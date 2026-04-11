import { useState } from 'react';
import './SensitivityTheory.css';

const STEPS = [
  { n: 1, color: '#0057FF', title: 'Spusťte základní výpočet',
    body: 'Nejprve proveďte standardní výpočet metodou dle vašeho výběru (AHP, SMART, PAPRIKA). Zaznamenejte výsledné pořadí alternativ a váhy kritérií — to je váš výchozí bod (baseline).' },
  { n: 2, color: '#2563EB', title: 'Vyberte kritérium k analýze',
    body: 'Zvolte jedno kritérium, jehož vliv chcete zkoumat. Typicky začněte od kritéria s nejvyšší váhou nebo od kritéria, o jehož hodnotě jste nejméně přesvědčeni.' },
  { n: 3, color: '#7C3AED', title: 'Variujte váhu v rozsahu 0–100 %',
    body: 'Postupně měňte váhu zvoleného kritéria od 0 % do 100 %. Ostatní váhy se proporcionálně škálují tak, aby součet vah zůstal 100 %. Pro každou hodnotu přepočítejte skóre alternativ.' },
  { n: 4, color: '#DB2777', title: 'Identifikujte přechodové body',
    body: 'Přechodový bod (crossover point) nastane, když se dvě křivky skóre kříží — pořadí alternativ se změní. Pokud je váš aktuální výběr daleko od přechodových bodů, je rozhodnutí robustní.' },
  { n: 5, color: '#059669', title: 'Interpretujte výsledky',
    body: 'Pokud se optimální alternativa mění jen při extrémních hodnotách váhy, rozhodnutí je stabilní. Pokud se mění při malé změně váhy, je nutná hlubší diskuse o správnosti odhadnutých vah.' },
];

export default function SensitivityTheory() {
  const [openStep, setOpenStep] = useState(null);

  return (
    <div className="snst-root">

      {/* INTRO */}
      <section className="snst-card snst-anim snst-intro" style={{ '--delay': '0s' }}>
        <div className="snst-intro-bar" />
        <div className="snst-intro-body">
          <span className="snst-badge">Nástroj pro ověření robustnosti</span>
          <h2 className="snst-h2">Analýza citlivosti <span className="snst-h2-muted">(Sensitivity Analysis)</span></h2>
          <p className="snst-lead">
            Analýza citlivosti zjišťuje, jak moc se výsledek rozhodovacího modelu změní, pokud se
            změní vstupní hodnoty — váhy kritérií nebo hodnocení alternativ. Odpovídá na otázku:
            <em> „Je naše rozhodnutí robustní, nebo záleží kriticky na jednom parametru?"</em>
          </p>
          <div className="snst-highlight-row">
            <div className="snst-highlight snst-highlight--ok">
              <div className="snst-hl-icon">◆</div>
              <div>
                <div className="snst-hl-title">Robustní rozhodnutí</div>
                <div className="snst-hl-desc">Pořadí alternativ se nemění ani při výrazné změně vah — výsledek je spolehlivý.</div>
              </div>
            </div>
            <div className="snst-highlight snst-highlight--warn">
              <div className="snst-hl-icon">◆</div>
              <div>
                <div className="snst-hl-title">Citlivé rozhodnutí</div>
                <div className="snst-hl-desc">Malá změna váhy způsobí změnu pořadí — nutno ověřit odhady vah.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CHART EXPLANATION */}
      <section className="snst-card snst-anim" style={{ '--delay': '0.1s' }}>
        <span className="snst-badge">Jak číst graf</span>
        <h3 className="snst-h3">Interpretace grafu citlivosti</h3>
        <div className="snst-chart-demo">
          <svg viewBox="0 0 500 220" className="snst-demo-svg" aria-hidden="true">
            {/* Axes */}
            <line x1="60" y1="180" x2="460" y2="180" stroke="#DDE3ED" strokeWidth="1.5"/>
            <line x1="60" y1="20"  x2="60"  y2="180" stroke="#DDE3ED" strokeWidth="1.5"/>
            {/* Grid lines */}
            {[0.25, 0.5, 0.75].map((f, i) => (
              <line key={i} x1="60" y1={180 - f * 160} x2="460" y2={180 - f * 160}
                stroke="#EEF1F6" strokeWidth="1" strokeDasharray="4 3"/>
            ))}
            {/* Axis labels */}
            <text x="260" y="200" textAnchor="middle" fontSize="10" fill="#8896AE">Váha kritéria K₁ (%)</text>
            <text x="14" y="100" textAnchor="middle" fontSize="10" fill="#8896AE" transform="rotate(-90,14,100)">Skóre alternativy (%)</text>
            {/* X ticks */}
            {[0,25,50,75,100].map((v,i) => (
              <text key={i} x={60 + v * 4} y="192" textAnchor="middle" fontSize="9" fill="#8896AE">{v}</text>
            ))}
            {/* Y ticks */}
            {[0,25,50,75,100].map((v,i) => (
              <text key={i} x="54" y={183 - v * 1.6} textAnchor="end" fontSize="9" fill="#8896AE">{v}</text>
            ))}
            {/* Curve A - starts high, stays high */}
            <polyline points="60,60 160,65 260,72 360,80 460,90"
              fill="none" stroke="#0057FF" strokeWidth="2.5"/>
            {/* Curve B - starts low, rises */}
            <polyline points="60,160 160,140 260,108 360,88 460,70"
              fill="none" stroke="#FF3B5C" strokeWidth="2.5"/>
            {/* Crossover region marker */}
            <circle cx="325" cy="85" r="8" fill="none" stroke="#F59E0B" strokeWidth="2"/>
            <text x="325" y="75" textAnchor="middle" fontSize="9" fill="#F59E0B" fontWeight="700">!</text>
            {/* Current weight line */}
            <line x1="200" y1="20" x2="200" y2="180" stroke="#8896AE" strokeWidth="1.5" strokeDasharray="5 4"/>
            <text x="200" y="16" textAnchor="middle" fontSize="9" fill="#8896AE">Aktuální</text>
            {/* Labels */}
            <text x="465" y="92" fontSize="10" fill="#0057FF" fontWeight="700">A</text>
            <text x="465" y="73" fontSize="10" fill="#FF3B5C" fontWeight="700">B</text>
            {/* Annotation crossover */}
            <text x="336" y="105" fontSize="9" fill="#F59E0B">Přechodový</text>
            <text x="336" y="115" fontSize="9" fill="#F59E0B">bod</text>
          </svg>
          <div className="snst-chart-legend">
            <div className="snst-legend-item">
              <span className="snst-legend-dot" style={{ background: '#0057FF' }} />
              <div>
                <div className="snst-legend-title">Alternativa A</div>
                <div className="snst-legend-desc">V levé části grafu je A nejlepší. Křivka je relativně plochá — A je robustní vůči změně váhy K₁.</div>
              </div>
            </div>
            <div className="snst-legend-item">
              <span className="snst-legend-dot" style={{ background: '#FF3B5C' }} />
              <div>
                <div className="snst-legend-title">Alternativa B</div>
                <div className="snst-legend-desc">B silně závisí na váze K₁ — při vyšší váze překoná A. To je přechodový bod (crossover).</div>
              </div>
            </div>
            <div className="snst-legend-item">
              <span className="snst-legend-dot" style={{ background: '#F59E0B' }} />
              <div>
                <div className="snst-legend-title">Přechodový bod</div>
                <div className="snst-legend-desc">Váha kritéria, při které se změní pořadí alternativ. Čím dál od aktuální váhy, tím robustnější výsledek.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STEPS */}
      <section className="snst-card snst-anim" style={{ '--delay': '0.2s' }}>
        <span className="snst-badge">Postup</span>
        <h3 className="snst-h3">5 kroků analýzy citlivosti <span className="snst-h3-hint">— klikněte pro detail</span></h3>
        <div className="snst-steps">
          {STEPS.map((s, i) => (
            <div key={s.n}
              className={`snst-step${openStep === i ? ' snst-step--open' : ''}`}
              style={{ '--sc': s.color }}
              onClick={() => setOpenStep(openStep === i ? null : i)}
            >
              <div className="snst-step-n" style={{ background: s.color }}>{s.n}</div>
              <div className="snst-step-inner">
                <div className="snst-step-title">{s.title}</div>
                {openStep === i && <p className="snst-step-body">{s.body}</p>}
              </div>
              <div className={`snst-step-chevron${openStep === i ? ' snst-step-chevron--open' : ''}`} style={{ color: s.color }}>›</div>
            </div>
          ))}
        </div>
      </section>

      {/* LOCAL vs GLOBAL */}
      <section className="snst-card snst-anim" style={{ '--delay': '0.3s' }}>
        <span className="snst-badge">Typy analýzy</span>
        <h3 className="snst-h3">Lokální vs. globální citlivost</h3>
        <div className="snst-type-grid">
          <div className="snst-type-card snst-type-card--local">
            <div className="snst-type-title">Lokální</div>
            <div className="snst-type-desc">
              Mění se jeden parametr při zachování ostatních. Jednoduchá, rychlá, vhodná pro identifikaci
              klíčových kritérií. Používá se v tomto LABu.
            </div>
            <div className="snst-type-ex">Příklad: „Co se stane, když váha Ceny vzroste z 30 % na 50 %?"</div>
          </div>
          <div className="snst-type-card snst-type-card--global">
            <div className="snst-type-title">Globální</div>
            <div className="snst-type-desc">
              Mění se více parametrů současně — např. Monte Carlo simulace. Komplexnější, ale odhalí
              interakce mezi parametry. Využívá se v pokročilých DSS nástrojích.
            </div>
            <div className="snst-type-ex">Příklad: Simultánní variace vah všech kritérií v zadaném rozsahu.</div>
          </div>
        </div>
      </section>

    </div>
  );
}

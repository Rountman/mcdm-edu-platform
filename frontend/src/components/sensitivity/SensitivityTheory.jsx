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
            <line x1="65" y1="210" x2="515" y2="210" stroke="#DDE3ED" strokeWidth="1.5"/>
            <line x1="65" y1="18"  x2="65"  y2="210" stroke="#DDE3ED" strokeWidth="1.5"/>
            {/* Grid lines at 25 %, 50 %, 75 % */}
            {[25, 50, 75].map(v => (
              <line key={v} x1="65" y1={Math.round(210 - v * 1.9)} x2="515" y2={Math.round(210 - v * 1.9)}
                stroke="#EEF1F6" strokeWidth="1" strokeDasharray="4 3"/>
            ))}
            {/* Axis labels */}
            <text x="290" y="244" textAnchor="middle" fontSize="11" fill="#8896AE">Váha kritéria K₁ (%)</text>
            <text x="15" y="114" textAnchor="middle" fontSize="11" fill="#8896AE" transform="rotate(-90,15,114)">Skóre alternativy (%)</text>
            {/* X ticks */}
            {[0,25,50,75,100].map(v => (
              <text key={v} x={65 + v * 4.5} y="223" textAnchor="middle" fontSize="10" fill="#8896AE">{v}</text>
            ))}
            {/* Y ticks */}
            {[0,25,50,75,100].map(v => (
              <text key={v} x="59" y={Math.round(214 - v * 1.9)} textAnchor="end" fontSize="10" fill="#8896AE">{v}</text>
            ))}
            {/* Curve A — score: 75 % at 0 % weight → 56 % at 100 % weight */}
            <polyline points="65,68 178,73 290,82 403,91 515,103"
              fill="none" stroke="#0057FF" strokeWidth="2.5"/>
            {/* Curve B — score: 12 % at 0 % weight → 69 % at 100 % weight */}
            <polyline points="65,187 178,163 290,125 403,101 515,79"
              fill="none" stroke="#FF3B5C" strokeWidth="2.5"/>
            {/* Current weight line at 35 %  →  x = 65 + 35·4.5 = 222 */}
            <line x1="222" y1="20" x2="222" y2="210" stroke="#8896AE" strokeWidth="1.5" strokeDasharray="5 4"/>
            <text x="222" y="14" textAnchor="middle" fontSize="10" fill="#8896AE">Aktuální</text>
            {/* Crossover at x≈436, y≈95  (~82 % weight) — computed above */}
            <circle cx="436" cy="95" r="10" fill="rgba(245,158,11,0.08)" stroke="#F59E0B" strokeWidth="2.5"/>
            <text x="436" y="99" textAnchor="middle" fontSize="10" fill="#F59E0B" fontWeight="800">!</text>
            {/* Leader line + annotation above the circle */}
            <line x1="436" y1="85" x2="436" y2="73" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="2 2" opacity="0.7"/>
            <text x="436" y="68" textAnchor="middle" fontSize="10" fill="#F59E0B" fontWeight="700">Přechodový bod</text>
            <text x="436" y="57" textAnchor="middle" fontSize="9.5" fill="#F59E0B">~ 82 % váhy</text>
            {/* Curve labels */}
            <text x="520" y="106" fontSize="11" fill="#0057FF" fontWeight="700">A</text>
            <text x="520" y="82"  fontSize="11" fill="#FF3B5C" fontWeight="700">B</text>
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
            <button key={s.n} type="button"
              className={`snst-step${openStep === i ? ' snst-step--open' : ''}`}
              style={{ '--sc': s.color }}
              onClick={() => setOpenStep(openStep === i ? null : i)}
              aria-expanded={openStep === i}
            >
              <div className="snst-step-n" style={{ background: s.color }}>{s.n}</div>
              <div className="snst-step-inner">
                <div className="snst-step-title">{s.title}</div>
                {openStep === i && <p className="snst-step-body">{s.body}</p>}
              </div>
              <div className={`snst-step-chevron${openStep === i ? ' snst-step-chevron--open' : ''}`} style={{ color: s.color }}>›</div>
            </button>
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

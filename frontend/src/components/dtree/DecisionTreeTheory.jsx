import { useState } from 'react';
import './DecisionTreeTheory.css';

const STEPS = [
  { n: 1, color: '#0057FF', title: 'Definice problému',
    body: 'Identifikujte rozhodnutí, která musíte učinit, a nejistoty, se kterými se potýkáte. Rozlišujte mezi rozhodnutími (které ovládáte) a náhodými událostmi (které neovládáte, ale znáte jejich pravděpodobnosti).' },
  { n: 2, color: '#2563EB', title: 'Sestrojení stromu',
    body: 'Kreslete strom zleva doprava. Začněte rozhodovacím uzlem, větví pro každou možnou akci, pak náhodovými uzly pro každou nejistotu s jejími pravděpodobnostmi. Strom musí zahrnovat všechny relevantní možnosti.' },
  { n: 3, color: '#7C3AED', title: 'Ohodnocení terminálních uzlů',
    body: 'Přiřaďte každému terminálnímu uzlu (listu) peněžní hodnotu nebo utility — to je výsledná hodnota daného scénáře. Hodnoty mohou být pozitivní (zisky) i negativní (ztráty).' },
  { n: 4, color: '#DB2777', title: 'Zpětná indukce (fold-back)',
    body: 'Počítejte zprava doleva. Pro náhodový uzel: EMV = Σ(pravděpodobnost × hodnota potomka). Pro rozhodovací uzel: vyberte větev s nejvyšší EMV — to je optimální rozhodnutí.' },
  { n: 5, color: '#059669', title: 'Interpretace a analýza',
    body: 'Optimální strategie je cesta od kořene k listu přes uzly s nejvyšší EMV. Proveďte analýzu citlivosti — jak se změní rozhodnutí při jiných pravděpodobnostech nebo hodnotách výsledků?' },
];

export default function DecisionTreeTheory() {
  const [openStep, setOpenStep] = useState(null);

  return (
    <div className="dtt-root">

      {/* INTRO */}
      <section className="dtt-card dtt-anim dtt-intro" style={{ '--delay': '0s' }}>
        <div className="dtt-intro-bar" />
        <div className="dtt-intro-body">
          <span className="dtt-badge">Klasický DSS nástroj</span>
          <h2 className="dtt-h2">Rozhodovací stromy <span className="dtt-h2-muted">(Decision Trees)</span></h2>
          <p className="dtt-lead">
            Rozhodovací stromy jsou grafická metoda pro sekvenční rozhodování za nejistoty.
            Formalizoval je <strong>Howard Raiffa</strong> v 60. letech. Strom mapuje všechny
            možné scénáře a jejich pravděpodobnosti a pomocí kritéria <em>očekávané peněžní
            hodnoty (EMV)</em> identifikuje optimální strategii.
          </p>
          <div className="dtt-stats">
            {[['EMV', 'Kritérium volby'], ['←', 'Fold-back směr'], ['□ ○ ◊', 'Typy uzlů'], ['Σ p·v', 'Vzorec EMV']].map(([v, l]) => (
              <div key={l} className="dtt-stat"><span className="dtt-stat-val">{v}</span><span className="dtt-stat-lbl">{l}</span></div>
            ))}
          </div>
        </div>
      </section>

      {/* NODE TYPES */}
      <section className="dtt-card dtt-anim" style={{ '--delay': '0.1s' }}>
        <span className="dtt-badge">Stavební bloky</span>
        <h3 className="dtt-h3">Typy uzlů rozhodovacího stromu</h3>
        <div className="dtt-nodes-grid">
          <div className="dtt-node-card dtt-node-card--dec">
            <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true"><rect x="4" y="4" width="36" height="36" rx="6" fill="#0057FF"/><text x="22" y="27" textAnchor="middle" fontSize="18" fill="white" fontWeight="700">□</text></svg>
            <div className="dtt-nc-title">Rozhodovací uzel</div>
            <div className="dtt-nc-desc">Čtverec — zde rozhodujete vy. Vyberte větev s nejvyšší EMV. Výsledkem je maximalizace očekávané hodnoty.</div>
          </div>
          <div className="dtt-node-card dtt-node-card--chance">
            <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true"><circle cx="22" cy="22" r="18" fill="#F59E0B"/><text x="22" y="27" textAnchor="middle" fontSize="18" fill="white" fontWeight="700">○</text></svg>
            <div className="dtt-nc-title">Náhodový uzel</div>
            <div className="dtt-nc-desc">Kruh — příroda rozhoduje. Větve mají pravděpodobnosti, jejichž součet musí být 1. EMV = Σ(p·v).</div>
          </div>
          <div className="dtt-node-card dtt-node-card--term">
            <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true"><rect x="4" y="10" width="36" height="24" rx="6" fill="#059669"/><text x="22" y="27" textAnchor="middle" fontSize="11" fill="white" fontWeight="700">Kč</text></svg>
            <div className="dtt-nc-title">Terminální uzel</div>
            <div className="dtt-nc-desc">Listu stromu — konec scénáře. Obsahuje konkrétní výslednou hodnotu (výnos nebo ztrátu).</div>
          </div>
        </div>
      </section>

      {/* EXAMPLE TREE */}
      <section className="dtt-card dtt-anim" style={{ '--delay': '0.2s' }}>
        <span className="dtt-badge">Pracovní příklad</span>
        <h3 className="dtt-h3">Investiční rozhodnutí — zpětná indukce</h3>
        <div className="dtt-example-wrap">
          <svg viewBox="0 0 620 260" className="dtt-ex-svg" aria-hidden="true">
            {/* Branch lines */}
            <line x1="60" y1="130" x2="180" y2="65"  stroke="#DDE3ED" strokeWidth="1.5"/>
            <line x1="60" y1="130" x2="180" y2="195" stroke="#DDE3ED" strokeWidth="1.5"/>
            <line x1="240" y1="65"  x2="370" y2="30"  stroke="#DDE3ED" strokeWidth="1.5"/>
            <line x1="240" y1="65"  x2="370" y2="100" stroke="#DDE3ED" strokeWidth="1.5"/>
            {/* Optimal path highlight */}
            <line x1="60" y1="130" x2="180" y2="65"  stroke="#0057FF" strokeWidth="2.5" opacity="0.6"/>
            <line x1="240" y1="65"  x2="370" y2="30"  stroke="#0057FF" strokeWidth="2.5" opacity="0.6"/>
            <line x1="240" y1="65"  x2="370" y2="100" stroke="#0057FF" strokeWidth="2.5" opacity="0.6"/>
            {/* Branch labels */}
            <text x="106" y="85"  fontSize="10" fill="#8896AE" textAnchor="middle">Investovat</text>
            <text x="100" y="180" fontSize="10" fill="#8896AE" textAnchor="middle">Neinvestovat</text>
            <text x="295" y="35"  fontSize="10" fill="#8896AE" textAnchor="middle">Příznivý (0,7)</text>
            <text x="298" y="96"  fontSize="10" fill="#8896AE" textAnchor="middle">Nepříznivý (0,3)</text>
            {/* Decision node - root */}
            <rect x="22" y="110" width="76" height="40" rx="7" fill="#0057FF"/>
            <text x="60" y="133" textAnchor="middle" fontSize="11" fill="white" fontWeight="700">Rozhodnutí</text>
            <text x="60" y="162" textAnchor="middle" fontSize="10" fill="#0057FF" fontWeight="700">EMV = 290 000</text>
            {/* Chance node */}
            <circle cx="210" cy="65" r="28" fill="#F59E0B"/>
            <text x="210" y="69" textAnchor="middle" fontSize="10" fill="white" fontWeight="700">Vývoj trhu</text>
            <text x="210" y="105" textAnchor="middle" fontSize="10" fill="#F59E0B" fontWeight="700">EMV = 290 000</text>
            {/* Terminal nodes - from chance */}
            <rect x="370" y="12" width="130" height="36" rx="7" fill="#059669"/>
            <text x="435" y="32" textAnchor="middle" fontSize="10" fill="white" fontWeight="700">Zisk</text>
            <text x="435" y="44" textAnchor="middle" fontSize="10" fill="white">500 000 Kč</text>
            <rect x="370" y="82" width="130" height="36" rx="7" fill="#FF3B5C"/>
            <text x="435" y="102" textAnchor="middle" fontSize="10" fill="white" fontWeight="700">Ztráta</text>
            <text x="435" y="114" textAnchor="middle" fontSize="10" fill="white">−200 000 Kč</text>
            {/* Terminal - neinvestovat */}
            <rect x="180" y="177" width="140" height="36" rx="7" fill="#8896AE"/>
            <text x="250" y="196" textAnchor="middle" fontSize="10" fill="white" fontWeight="700">Status quo</text>
            <text x="250" y="208" textAnchor="middle" fontSize="10" fill="white">50 000 Kč</text>
            {/* EMV calculation annotation */}
            <rect x="370" y="160" width="220" height="80" rx="8" fill="#F5F7FA" stroke="#DDE3ED"/>
            <text x="380" y="178" fontSize="10" fill="#5c6f91" fontWeight="700">Zpětná indukce:</text>
            <text x="380" y="194" fontSize="9.5" fill="#5c6f91">EMV(trh) = 0,7×500 000 + 0,3×(−200 000)</text>
            <text x="380" y="209" fontSize="9.5" fill="#5c6f91">          = 350 000 − 60 000 = 290 000 Kč</text>
            <text x="380" y="227" fontSize="9.5" fill="#0057FF" fontWeight="700">→ Investovat (290 000 &gt; 50 000) ✓</text>
          </svg>
        </div>
        <p className="dtt-caption">
          Zpětnou indukcí (fold-back) od listů k&nbsp;výstupu: EMV náhodového uzlu = 290&nbsp;000&nbsp;Kč &gt; 50&nbsp;000&nbsp;Kč (neinvestovat).
          Optimální rozhodnutí je investovat — modrá zvýrazněná cesta.
        </p>
      </section>

      {/* STEPS */}
      <section className="dtt-card dtt-anim" style={{ '--delay': '0.3s' }}>
        <span className="dtt-badge">Postup</span>
        <h3 className="dtt-h3">5 kroků sestavení stromu <span className="dtt-h3-hint">— klikněte pro detail</span></h3>
        <div className="dtt-steps">
          {STEPS.map((s, i) => (
            <button key={s.n} type="button"
              className={`dtt-step${openStep===i?' dtt-step--open':''}`}
              style={{ '--sc': s.color }}
              onClick={() => setOpenStep(openStep===i?null:i)}
              aria-expanded={openStep === i}
            >
              <div className="dtt-step-n" style={{ background: s.color }}>{s.n}</div>
              <div className="dtt-step-inner">
                <div className="dtt-step-title">{s.title}</div>
                {openStep===i && <p className="dtt-step-body">{s.body}</p>}
              </div>
              <div className={`dtt-step-chev${openStep===i?' dtt-step-chev--open':''}`} style={{ color: s.color }}>›</div>
            </button>
          ))}
        </div>
      </section>

    </div>
  );
}

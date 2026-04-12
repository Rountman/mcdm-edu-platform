import { useState } from 'react';
import './PAPRIKATheory.css';

const STEPS = [
  {
    n: 1, color: '#0057FF', title: 'Definice kritérií a alternativ',
    body: 'Definujte 2–6 kritérií a 2–5 alternativ. Každé kritérium by mělo být hodnotitelné na numerické škále (například 1–10). Na rozdíl od AHP a SMART nepotřebujete předem znát váhy — ty se odvozují z vašich preferencí.',
  },
  {
    n: 2, color: '#2563EB', title: 'Hodnocení alternativ na kritériích',
    body: 'Přiřaďte každé alternativě hodnotu na každém kritériu (škála 1–10). Tato hodnocení představují výkonnost alternativy na daném kritériu. Metoda PAPRIKA předpokládá, že všechna kritéria jsou orientována jako benefit.',
  },
  {
    n: 3, color: '#7C3AED', title: 'Párová srovnání kompromisů',
    body: 'Pro každý pár kritérií (i, j) se vám zobrazí dvě hypotetické alternativy: Varianta A má kritérium i na maximu (10/10) a kritérium j na minimu (1/10). Varianta B naopak. Vyberte, která se vám líbí více — tím odhalujete relativní důležitost kritérií.',
  },
  {
    n: 4, color: '#DB2777', title: 'Odvození vah z kompromisů',
    body: 'Z vašich odpovědí se odvozují váhy kritérií. Kritérium, které "vyhraje" ve více kompromisních srovnáních, dostane vyšší váhu. Systém pracuje s Laplaceovým vyhlazením, aby předešel nulové váze.',
  },
  {
    n: 5, color: '#059669', title: 'Výpočet pořadí alternativ',
    body: 'Odvozené váhy se použijí ke spočítání váženého skóre každé alternativy. Alternativa s nejvyšším skóre je doporučená volba. Celý postup je transparentní — každá preferenční odpověď přímo ovlivňuje výsledek.',
  },
];

const NODE_CX = [100, 290, 480];

export default function PAPRIKATheory() {
  const [openStep, setOpenStep] = useState(null);
  const [demoChoice, setDemoChoice] = useState(null);

  return (
    <div className="papt-root">

      {/* ── INTRO ──────────────────────────────────────────── */}
      <section className="papt-card papt-anim papt-intro" style={{ '--delay': '0s' }}>
        <div className="papt-intro-bar" />
        <div className="papt-intro-body">
          <span className="papt-badge">Metoda vícekriteriálního rozhodování</span>
          <h2 className="papt-h2">
            Potentially All Pairwise RanKings of all possible Alternatives&ensp;
            <span className="papt-h2-muted">(PAPRIKA)</span>
          </h2>
          <p className="papt-lead">
            Metodu PAPRIKA vyvinuli <strong>Paul Hansen</strong> a <strong>Franz Ombler</strong> v&nbsp;roce 2008.
            Namísto přímého přiřazení vah nebo abstraktního srovnání kritérií se ptá na
            konkrétní <em>kompromisy</em>: „Co byste preferoval/a — alternativu s&nbsp;vysokou
            hodnotou kritéria A a nízkou hodnotou kritéria B, nebo naopak?"
            Z těchto odpovědí systém odvodí váhy kritérií a pořadí alternativ.
          </p>
          <div className="papt-stats">
            {[['2008', 'Rok vzniku'], ['n(n−1)/2', 'Počet srovnání'], ['1–10', 'Škála hodnot'], ['Kompromis', 'Klíčový princip']].map(([val, lbl]) => (
              <div key={lbl} className="papt-stat">
                <span className="papt-stat-val">{val}</span>
                <span className="papt-stat-lbl">{lbl}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── KEY CONCEPT ────────────────────────────────────── */}
      <section className="papt-card papt-anim" style={{ '--delay': '0.1s' }}>
        <span className="papt-badge">Klíčový princip</span>
        <h3 className="papt-h3">Jak funguje kompromisní srovnání?</h3>

        <p className="papt-desc">
          Pro každý pár kritérií se vám ukáže otázka jako níže. Vyberte variantu, která lépe odpovídá vašim preferencím.
          Vaše volba prozrazuje, které kritérium považujete za důležitější.
        </p>

        <div className="papt-demo">
          <div className="papt-demo-label">Příklad — výběr automobilu: Cena vs. Výkon</div>
          <div className="papt-demo-choices">
            <button
              className={`papt-demo-opt${demoChoice === 'A' ? ' papt-demo-opt--sel' : ''}`}
              onClick={() => setDemoChoice('A')}
            >
              <div className="papt-demo-opt-title">Varianta A</div>
              <div className="papt-demo-opt-rows">
                <div className="papt-demo-opt-hi">Cena: velmi příznivá (10/10)</div>
                <div className="papt-demo-opt-lo">Výkon: velmi slabý (1/10)</div>
                <div className="papt-demo-opt-mid">Ostatní kritéria: střední hodnota</div>
              </div>
              {demoChoice === 'A' && <div className="papt-demo-verdict">Vybráno — kritérium Cena je důležitější</div>}
            </button>
            <div className="papt-demo-vs">vs</div>
            <button
              className={`papt-demo-opt${demoChoice === 'B' ? ' papt-demo-opt--sel' : ''}`}
              onClick={() => setDemoChoice('B')}
            >
              <div className="papt-demo-opt-title">Varianta B</div>
              <div className="papt-demo-opt-rows">
                <div className="papt-demo-opt-lo">Cena: velmi vysoká (1/10)</div>
                <div className="papt-demo-opt-hi">Výkon: velmi výkonný (10/10)</div>
                <div className="papt-demo-opt-mid">Ostatní kritéria: střední hodnota</div>
              </div>
              {demoChoice === 'B' && <div className="papt-demo-verdict">Vybráno — kritérium Výkon je důležitější</div>}
            </button>
          </div>
          {!demoChoice && <p className="papt-demo-hint">Klikněte na variantu a vyzkoušejte si srovnání.</p>}
        </div>
      </section>

      {/* ── STEPS ──────────────────────────────────────────── */}
      <section className="papt-card papt-anim" style={{ '--delay': '0.2s' }}>
        <span className="papt-badge">Postup výpočtu</span>
        <h3 className="papt-h3">5 kroků metody PAPRIKA <span className="papt-h3-hint">— klikněte pro detail</span></h3>
        <div className="papt-steps">
          {STEPS.map((s, i) => (
            <button
              key={s.n}
              type="button"
              className={`papt-step${openStep === i ? ' papt-step--open' : ''}`}
              style={{ '--sc': s.color }}
              onClick={() => setOpenStep(openStep === i ? null : i)}
              aria-expanded={openStep === i}
            >
              <div className="papt-step-n" style={{ background: s.color }}>{s.n}</div>
              <div className="papt-step-inner">
                <div className="papt-step-title">{s.title}</div>
                {openStep === i && <p className="papt-step-body">{s.body}</p>}
              </div>
              <div className={`papt-step-chevron${openStep === i ? ' papt-step-chevron--open' : ''}`}
                style={{ color: s.color }}>›</div>
            </button>
          ))}
        </div>
      </section>

      {/* ── COMPARISON COUNT ────────────────────────────────── */}
      <section className="papt-card papt-anim" style={{ '--delay': '0.3s' }}>
        <span className="papt-badge">Počet otázek</span>
        <h3 className="papt-h3">Kolik srovnání je potřeba?</h3>
        <p className="papt-desc">Pro n kritérií je počet párových srovnání n(n−1)/2 — stejný vzorec jako u AHP, ale srovnáváte hypotetické varianty, nikoliv kritéria přímo.</p>
        <div className="papt-count-grid">
          {[2, 3, 4, 5, 6].map(n => (
            <div key={n} className="papt-count-card">
              <div className="papt-count-n">{n}</div>
              <div className="papt-count-label">kritéria</div>
              <div className="papt-count-q">{(n * (n - 1)) / 2}</div>
              <div className="papt-count-qlabel">srovnání</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── COMPARISON WITH OTHER METHODS ───────────────────── */}
      <section className="papt-card papt-anim" style={{ '--delay': '0.4s' }}>
        <span className="papt-badge">Srovnání metod</span>
        <h3 className="papt-h3">PAPRIKA vs. AHP vs. SMART</h3>
        <div className="papt-compare-wrap">
          <table className="papt-compare-table">
            <thead>
              <tr><th>Vlastnost</th><th>PAPRIKA</th><th>AHP</th><th>SMART</th></tr>
            </thead>
            <tbody>
              {[
                ['Zadávání vah',      'Odvozeno z kompromisů', 'Párová srovnání',   'Přímé zadání'],
                ['Typ otázek',        'Kompromisy variant',     'Důležitost kritérií', 'Bodové hodnocení'],
                ['Kognitivní typ',    'Konkrétní, intuitivní',  'Abstraktní',         'Přímý odhad'],
                ['Konzistence',       'Není testována',         'CR (Saaty)',          'Není testována'],
                ['Vhodné pro',        'Laiky a manažery',       'Experty s znalostmi', 'Rychlá analýza'],
              ].map(([prop, p, a, s]) => (
                <tr key={prop}>
                  <td className="papt-cmp-prop">{prop}</td>
                  <td className="papt-cmp-p">{p}</td>
                  <td className="papt-cmp-a">{a}</td>
                  <td className="papt-cmp-s">{s}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
}

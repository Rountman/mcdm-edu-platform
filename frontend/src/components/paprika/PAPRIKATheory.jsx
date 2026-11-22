import { useState } from 'react';
import './PAPRIKATheory.css';
import { useLang } from '../../i18n/lang';

const STEPS = [
  {
    n: 1, color: '#0057FF',
    title: { cs: 'Definice kritérií a alternativ', en: 'Define criteria and alternatives' },
    body: {
      cs: 'Definujte 2–6 kritérií a 2–5 alternativ. Každé kritérium by mělo být hodnotitelné na numerické škále (například 1–10). Na rozdíl od AHP a SMART nepotřebujete předem znát váhy — ty se odvozují z vašich preferencí.',
      en: 'Define 2–6 criteria and 2–5 alternatives. Each criterion should be measurable on a numeric scale (for example 1–10). Unlike AHP and SMART, you do not need to know the weights in advance — they are derived from your preferences.',
    },
  },
  {
    n: 2, color: '#2563EB',
    title: { cs: 'Hodnocení alternativ na kritériích', en: 'Rate alternatives on criteria' },
    body: {
      cs: 'Přiřaďte každé alternativě hodnotu na každém kritériu (škála 1–10). Tato hodnocení představují výkonnost alternativy na daném kritériu. Metoda PAPRIKA předpokládá, že všechna kritéria jsou orientována jako benefit.',
      en: 'Give each alternative a value on each criterion (scale 1–10). These ratings represent how well the alternative performs on that criterion. PAPRIKA assumes that all criteria are benefit-oriented.',
    },
  },
  {
    n: 3, color: '#7C3AED',
    title: { cs: 'Párová srovnání kompromisů', en: 'Pairwise trade-off comparisons' },
    body: {
      cs: 'Pro každý pár kritérií (i, j) se vám zobrazí dvě hypotetické alternativy: Varianta A má kritérium i na maximu (10/10) a kritérium j na minimu (1/10). Varianta B naopak. Vyberte, která se vám líbí více — tím odhalujete relativní důležitost kritérií.',
      en: 'For each pair of criteria (i, j) you see two hypothetical alternatives: Option A has criterion i at its maximum (10/10) and criterion j at its minimum (1/10). Option B is the other way round. Choose the one you prefer — this reveals the relative importance of the criteria.',
    },
  },
  {
    n: 4, color: '#DB2777',
    title: { cs: 'Odvození vah z kompromisů', en: 'Derive weights from trade-offs' },
    body: {
      cs: 'Z vašich odpovědí se odvozují váhy kritérií. Kritérium, které „vyhraje“ ve více kompromisních srovnáních, dostane vyšší váhu. Systém pracuje s Laplaceovým vyhlazením, aby předešel nulové váze.',
      en: 'Criteria weights are derived from your answers. A criterion that “wins” more trade-off comparisons gets a higher weight. Laplace smoothing is used to avoid a zero weight.',
    },
  },
  {
    n: 5, color: '#059669',
    title: { cs: 'Výpočet pořadí alternativ', en: 'Rank the alternatives' },
    body: {
      cs: 'Odvozené váhy se použijí ke spočítání váženého skóre každé alternativy. Alternativa s nejvyšším skóre je doporučená volba. Celý postup je transparentní — každá preferenční odpověď přímo ovlivňuje výsledek.',
      en: 'The derived weights are used to compute a weighted score for each alternative. The alternative with the highest score is the recommended choice. The whole procedure is transparent — every preference answer directly affects the result.',
    },
  },
];

export default function PAPRIKATheory() {
  const { lang, tr } = useLang();
  const [openStep, setOpenStep] = useState(null);
  const [demoChoice, setDemoChoice] = useState(null);

  return (
    <div className="papt-root">

      {/* ── INTRO ──────────────────────────────────────────── */}
      <section className="papt-card papt-anim papt-intro" style={{ '--delay': '0s' }}>
        <div className="papt-intro-bar" />
        <div className="papt-intro-body">
          <span className="papt-badge">{tr('Metoda vícekriteriálního rozhodování', 'Multi-criteria decision method')}</span>
          <h2 className="papt-h2">
            Potentially All Pairwise RanKings of all possible Alternatives&ensp;
            <span className="papt-h2-muted">(PAPRIKA)</span>
          </h2>
          {tr(
            <p className="papt-lead">
              Metodu PAPRIKA vyvinuli <strong>Paul Hansen</strong> a <strong>Franz Ombler</strong> v&nbsp;roce 2008.
              Namísto přímého přiřazení vah nebo abstraktního srovnání kritérií se ptá na
              konkrétní <em>kompromisy</em>: „Co byste preferoval/a — alternativu s&nbsp;vysokou
              hodnotou kritéria A a nízkou hodnotou kritéria B, nebo naopak?“
              Z těchto odpovědí systém odvodí váhy kritérií a pořadí alternativ.
            </p>,
            <p className="papt-lead">
              PAPRIKA was developed by <strong>Paul Hansen</strong> and <strong>Franz Ombler</strong> in 2008.
              Instead of assigning weights directly or comparing criteria in the abstract, it asks about
              concrete <em>trade-offs</em>: “Which would you prefer — an alternative with a high value on
              criterion A and a low value on criterion B, or the other way round?”
              From these answers the system derives the criteria weights and the ranking of alternatives.
            </p>,
          )}
          <div className="papt-stats">
            {[
              ['2008', tr('Rok vzniku', 'Year introduced')],
              ['n(n−1)/2', tr('Počet srovnání', 'Number of comparisons')],
              ['1–10', tr('Škála hodnot', 'Value scale')],
              [tr('Kompromis', 'Trade-off'), tr('Klíčový princip', 'Key principle')],
            ].map(([val, lbl]) => (
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
        <span className="papt-badge">{tr('Klíčový princip', 'Key principle')}</span>
        <h3 className="papt-h3">{tr('Jak funguje kompromisní srovnání?', 'How does a trade-off comparison work?')}</h3>

        <p className="papt-desc">
          {tr(
            'Pro každý pár kritérií se vám ukáže otázka jako níže. Vyberte variantu, která lépe odpovídá vašim preferencím. Vaše volba prozrazuje, které kritérium považujete za důležitější.',
            'For each pair of criteria you see a question like the one below. Choose the option that better matches your preferences. Your choice reveals which criterion you consider more important.',
          )}
        </p>

        <div className="papt-demo">
          <div className="papt-demo-label">{tr('Příklad — výběr automobilu: Cena vs. Výkon', 'Example — choosing a car: Price vs. Power')}</div>
          <div className="papt-demo-choices">
            <button
              type="button"
              aria-pressed={demoChoice === 'A'}
              className={`papt-demo-opt${demoChoice === 'A' ? ' papt-demo-opt--sel' : ''}`}
              onClick={() => setDemoChoice('A')}
            >
              <div className="papt-demo-opt-title">{tr('Varianta A', 'Option A')}</div>
              <div className="papt-demo-opt-rows">
                <div className="papt-demo-opt-hi">{tr('Cena: velmi příznivá (10/10)', 'Price: very favourable (10/10)')}</div>
                <div className="papt-demo-opt-lo">{tr('Výkon: velmi slabý (1/10)', 'Power: very weak (1/10)')}</div>
                <div className="papt-demo-opt-mid">{tr('Ostatní kritéria: střední hodnota', 'Other criteria: middle value')}</div>
              </div>
              {demoChoice === 'A' && <div className="papt-demo-verdict">{tr('Vybráno — kritérium Cena je důležitější', 'Selected — Price is the more important criterion')}</div>}
            </button>
            <div className="papt-demo-vs">vs</div>
            <button
              type="button"
              aria-pressed={demoChoice === 'B'}
              className={`papt-demo-opt${demoChoice === 'B' ? ' papt-demo-opt--sel' : ''}`}
              onClick={() => setDemoChoice('B')}
            >
              <div className="papt-demo-opt-title">{tr('Varianta B', 'Option B')}</div>
              <div className="papt-demo-opt-rows">
                <div className="papt-demo-opt-lo">{tr('Cena: velmi vysoká (1/10)', 'Price: very high (1/10)')}</div>
                <div className="papt-demo-opt-hi">{tr('Výkon: velmi výkonný (10/10)', 'Power: very powerful (10/10)')}</div>
                <div className="papt-demo-opt-mid">{tr('Ostatní kritéria: střední hodnota', 'Other criteria: middle value')}</div>
              </div>
              {demoChoice === 'B' && <div className="papt-demo-verdict">{tr('Vybráno — kritérium Výkon je důležitější', 'Selected — Power is the more important criterion')}</div>}
            </button>
          </div>
          {!demoChoice && <p className="papt-demo-hint">{tr('Klikněte na variantu a vyzkoušejte si srovnání.', 'Click an option to try the comparison.')}</p>}
        </div>
      </section>

      {/* ── STEPS ──────────────────────────────────────────── */}
      <section className="papt-card papt-anim" style={{ '--delay': '0.2s' }}>
        <span className="papt-badge">{tr('Postup výpočtu', 'Calculation procedure')}</span>
        <h3 className="papt-h3">
          {tr('5 kroků metody PAPRIKA', '5 steps of the PAPRIKA method')}{' '}
          <span className="papt-h3-hint">— {tr('klikněte pro detail', 'click for details')}</span>
        </h3>
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
                <div className="papt-step-title">{s.title[lang]}</div>
                {openStep === i && <p className="papt-step-body">{s.body[lang]}</p>}
              </div>
              <div className={`papt-step-chevron${openStep === i ? ' papt-step-chevron--open' : ''}`}
                style={{ color: s.color }}>›</div>
            </button>
          ))}
        </div>
      </section>

      {/* ── COMPARISON COUNT ────────────────────────────────── */}
      <section className="papt-card papt-anim" style={{ '--delay': '0.3s' }}>
        <span className="papt-badge">{tr('Počet otázek', 'Number of questions')}</span>
        <h3 className="papt-h3">{tr('Kolik srovnání je potřeba?', 'How many comparisons are needed?')}</h3>
        <p className="papt-desc">
          {tr(
            'Pro n kritérií je počet párových srovnání n(n−1)/2 — stejný vzorec jako u AHP, ale srovnáváte hypotetické varianty, nikoliv kritéria přímo.',
            'For n criteria there are n(n−1)/2 pairwise comparisons — the same formula as in AHP, but you compare hypothetical options, not the criteria directly.',
          )}
        </p>
        <div className="papt-count-grid">
          {[2, 3, 4, 5, 6].map(n => (
            <div key={n} className="papt-count-card">
              <div className="papt-count-n">{n}</div>
              <div className="papt-count-label">{tr(n < 5 ? 'kritéria' : 'kritérií', 'criteria')}</div>
              <div className="papt-count-q">{(n * (n - 1)) / 2}</div>
              <div className="papt-count-qlabel">{tr('srovnání', (n * (n - 1)) / 2 === 1 ? 'comparison' : 'comparisons')}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── COMPARISON WITH OTHER METHODS ───────────────────── */}
      <section className="papt-card papt-anim" style={{ '--delay': '0.4s' }}>
        <span className="papt-badge">{tr('Srovnání metod', 'Method comparison')}</span>
        <h3 className="papt-h3">PAPRIKA vs. AHP vs. SMART</h3>
        <div className="papt-compare-wrap">
          <table className="papt-compare-table">
            <thead>
              <tr><th>{tr('Vlastnost', 'Property')}</th><th>PAPRIKA</th><th>AHP</th><th>SMART</th></tr>
            </thead>
            <tbody>
              {[
                [tr('Zadávání vah', 'Weighting'), tr('Odvozeno z kompromisů', 'Derived from trade-offs'), tr('Párová srovnání', 'Pairwise comparisons'), tr('Přímé zadání', 'Direct input')],
                [tr('Typ otázek', 'Question type'), tr('Kompromisy variant', 'Trade-offs between options'), tr('Důležitost kritérií', 'Importance of criteria'), tr('Bodové hodnocení', 'Point rating')],
                [tr('Kognitivní typ', 'Cognitive style'), tr('Konkrétní, intuitivní', 'Concrete, intuitive'), tr('Abstraktní', 'Abstract'), tr('Přímý odhad', 'Direct estimate')],
                [tr('Konzistence', 'Consistency'), tr('Není testována', 'Not tested'), 'CR (Saaty)', tr('Není testována', 'Not tested')],
                [tr('Vhodné pro', 'Suitable for'), tr('Laiky a manažery', 'Non-experts and managers'), tr('Experty se znalostmi', 'Domain experts'), tr('Rychlá analýza', 'Quick analysis')],
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

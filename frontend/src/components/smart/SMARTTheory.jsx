import { useState } from 'react';
import './SMARTTheory.css';
import { useLang } from '../../i18n/lang';

const STEPS = [
  {
    n: 1, color: '#0057FF',
    title: { cs: 'Definice cíle a kritérií', en: 'Define the goal and criteria' },
    body: {
      cs: 'Stanovte jasný rozhodovací cíl a vyberte 3–7 kritérií, která ho popisují. Kritéria by měla být vzájemně nezávislá, měřitelná a pokrývat celý problém. Každé kritérium označte jako benefit (vyšší hodnota = lepší) nebo cost (nižší hodnota = lepší).',
      en: 'Set a clear decision goal and choose 3–7 criteria that describe it. Criteria should be mutually independent, measurable and cover the whole problem. Mark each criterion as benefit (higher value = better) or cost (lower value = better).',
    },
  },
  {
    n: 2, color: '#2563EB',
    title: { cs: 'Přiřazení vah kritériím', en: 'Assign weights to criteria' },
    body: {
      cs: 'Přímou metodou přiřaďte každému kritériu váhu 0–100 dle jeho důležitosti. Na rozdíl od AHP nepotřebujete párová srovnání — váhy zadáváte přímo z vlastního úsudku. Váhy se automaticky normalizují na součet 100 %.',
      en: 'Directly assign each criterion a weight of 0–100 according to its importance. Unlike AHP, no pairwise comparisons are needed — you enter the weights from your own judgement. The weights are normalised automatically to sum to 100%.',
    },
  },
  {
    n: 3, color: '#7C3AED',
    title: { cs: 'Hodnocení alternativ', en: 'Rate the alternatives' },
    body: {
      cs: 'Ohodnoťte každou alternativu na každém kritériu na škále 0–100. Například: cena 20 000 Kč = 80 bodů, cena 40 000 Kč = 30 bodů. Hodnocení odráží vaše preference — nezáleží na absolutní hodnotě, ale na relativním srovnání.',
      en: 'Rate each alternative on each criterion on a 0–100 scale. For example: price CZK 20,000 = 80 points, price CZK 40,000 = 30 points. Ratings reflect your preferences — what matters is the relative comparison, not the absolute value.',
    },
  },
  {
    n: 4, color: '#DB2777',
    title: { cs: 'Normalizace hodnocení', en: 'Normalise the ratings' },
    body: {
      cs: 'Pro každé kritérium se hodnocení přepočítá na škálu 0–1: benefit: v = (r – min) / (max – min), cost: v = (max – r) / (max – min). Tím jsou srovnatelné hodnoty napříč různými škálami a typy kritérií.',
      en: 'For each criterion the ratings are rescaled to 0–1: benefit: v = (r – min) / (max – min), cost: v = (max – r) / (max – min). This makes values comparable across different scales and criterion types.',
    },
  },
  {
    n: 5, color: '#059669',
    title: { cs: 'Výpočet celkového skóre', en: 'Compute the total score' },
    body: {
      cs: 'Výsledné skóre alternativy je vážený součet normalizovaných hodnocení: S_i = Σ(w_j · v_ij). Alternativa s nejvyšším S_i je nejlepší volba. Metoda SMART je transparentní — každou složku skóre lze snadno interpretovat.',
      en: 'The final score of an alternative is the weighted sum of its normalised ratings: S_i = Σ(w_j · v_ij). The alternative with the highest S_i is the best choice. SMART is transparent — every component of the score is easy to interpret.',
    },
  },
];

const EXAMPLE_CRITS = [
  { cs: 'Cena', en: 'Price' },
  { cs: 'Výkon', en: 'Power' },
  { cs: 'Spotřeba', en: 'Consumption' },
];
const EXAMPLE_TYPES = ['cost', 'benefit', 'cost'];
const EXAMPLE_W     = [0.50, 0.30, 0.20];
const EXAMPLE_ALTS  = [
  { name: { cs: 'Auto A', en: 'Car A' }, raw: [180, 140, 6.5], norm: [0.90, 0.33, 0.60] },
  { name: { cs: 'Auto B', en: 'Car B' }, raw: [250, 200, 5.0], norm: [0.00, 1.00, 1.00] },
  { name: { cs: 'Auto C', en: 'Car C' }, raw: [200, 90,  8.0], norm: [0.56, 0.00, 0.00] },
];

export default function SMARTTheory() {
  const { lang, tr } = useLang();
  const [openStep, setOpenStep] = useState(null);

  const scores = EXAMPLE_ALTS.map(a =>
    a.norm.reduce((s, v, j) => s + v * EXAMPLE_W[j], 0)
  );
  const maxScore = Math.max(...scores);

  return (
    <div className="smtt-root">

      {/* ── INTRO ──────────────────────────────────────────── */}
      <section className="smtt-card smtt-anim smtt-intro" style={{ '--delay': '0s' }}>
        <div className="smtt-intro-bar" />
        <div className="smtt-intro-body">
          <span className="smtt-badge">{tr('Metoda vícekriteriálního rozhodování', 'Multi-criteria decision method')}</span>
          <h2 className="smtt-h2">
            Simple Multi-Attribute Rating Technique&ensp;
            <span className="smtt-h2-muted">(SMART)</span>
          </h2>
          {tr(
            <p className="smtt-lead">
              Metodu SMART navrhl <strong>Ward Edwards</strong> v&nbsp;roce 1977 jako zjednodušení
              teorie víceattributové utility (MAUT). Hlavní výhodou SMART oproti AHP je přímé
              přiřazení vah bez párových srovnání — rozhodovatel jednoduše rozdělí 100&nbsp;bodů
              mezi kritéria a ohodnotí alternativy na bodové škále.
            </p>,
            <p className="smtt-lead">
              SMART was proposed by <strong>Ward Edwards</strong> in 1977 as a simplification of
              multi-attribute utility theory (MAUT). Its main advantage over AHP is direct weighting
              without pairwise comparisons — the decision maker simply distributes 100 points among
              the criteria and rates the alternatives on a point scale.
            </p>,
          )}
          <div className="smtt-stats">
            {[
              ['1977', tr('Rok vzniku', 'Year introduced')],
              ['0–100', tr('Hodnotící škála', 'Rating scale')],
              ['Σ wᵢ = 1', tr('Normalizace vah', 'Weight normalisation')],
              ['S = Σwv', tr('Vzorec skóre', 'Score formula')],
            ].map(([val, lbl]) => (
              <div key={val} className="smtt-stat">
                <span className="smtt-stat-val">{val}</span>
                <span className="smtt-stat-lbl">{lbl}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STEPS ──────────────────────────────────────────── */}
      <section className="smtt-card smtt-anim" style={{ '--delay': '0.1s' }}>
        <span className="smtt-badge">{tr('Postup výpočtu', 'Calculation procedure')}</span>
        <h3 className="smtt-h3">
          {tr('5 kroků metody SMART', '5 steps of the SMART method')}{' '}
          <span className="smtt-h3-hint">— {tr('klikněte pro detail', 'click for details')}</span>
        </h3>
        <div className="smtt-steps">
          {STEPS.map((s, i) => (
            <button
              key={s.n}
              type="button"
              className={`smtt-step${openStep === i ? ' smtt-step--open' : ''}`}
              style={{ '--sc': s.color }}
              onClick={() => setOpenStep(openStep === i ? null : i)}
              aria-expanded={openStep === i}
            >
              <div className="smtt-step-n" style={{ background: s.color }}>{s.n}</div>
              <div className="smtt-step-inner">
                <div className="smtt-step-title">{s.title[lang]}</div>
                {openStep === i && <p className="smtt-step-body">{s.body[lang]}</p>}
              </div>
              <div className={`smtt-step-chevron${openStep === i ? ' smtt-step-chevron--open' : ''}`}
                style={{ color: s.color }}>›</div>
            </button>
          ))}
        </div>
      </section>

      {/* ── FORMULA + EXAMPLE ──────────────────────────────── */}
      <section className="smtt-card smtt-anim" style={{ '--delay': '0.2s' }}>
        <span className="smtt-badge">{tr('Výpočet', 'Calculation')}</span>
        <h3 className="smtt-h3">{tr('Vzorec a pracovní příklad', 'Formula and worked example')}</h3>

        <div className="smtt-formula-row">
          <div className="smtt-formula-box">
            <div className="smtt-formula">
              <span className="smtt-fsym">S<sub>i</sub></span>
              <span className="smtt-feq">=</span>
              <span className="smtt-fsum">
                <span className="smtt-fsum-sig">Σ</span>
                <span className="smtt-fsum-body">w<sub>j</sub> · v<sub>ij</sub></span>
              </span>
            </div>
            <div className="smtt-formula-vars">
              {[
                ['Sᵢ', tr('Celkové skóre alternativy i', 'Total score of alternative i')],
                ['wⱼ', tr('Normalizovaná váha kritéria j', 'Normalised weight of criterion j')],
                ['vᵢⱼ', tr('Normalizované hodnocení alternativy i na kritériu j', 'Normalised rating of alternative i on criterion j')],
              ].map(([sym, desc]) => (
                <div key={sym} className="smtt-var-row">
                  <dt>{sym}</dt>
                  <dd>{desc}</dd>
                </div>
              ))}
            </div>
          </div>

          <div className="smtt-example">
            <div className="smtt-field-label">{tr('Příklad — výběr automobilu', 'Example — choosing a car')}</div>
            <div className="smtt-ex-table-wrap">
              <table className="smtt-ex-table">
                <thead>
                  <tr>
                    <th />
                    {EXAMPLE_CRITS.map((c, j) => (
                      <th key={j}>
                        {c[lang]}
                        <br />
                        <span className="smtt-ex-type">{EXAMPLE_TYPES[j] === 'cost' ? '↓ cost' : '↑ benefit'}</span>
                        <br />
                        <span className="smtt-ex-w">w={(EXAMPLE_W[j] * 100).toFixed(0)}{tr(' %', '%')}</span>
                      </th>
                    ))}
                    <th>{tr('Skóre', 'Score')}</th>
                  </tr>
                </thead>
                <tbody>
                  {EXAMPLE_ALTS.map((alt, ai) => (
                    <tr key={ai} className={scores[ai] === maxScore ? 'smtt-ex-best' : ''}>
                      <td className="smtt-ex-alt">{alt.name[lang]}</td>
                      {alt.norm.map((v, j) => (
                        <td key={j} className="smtt-ex-val">
                          <span className="smtt-ex-raw">{alt.raw[j]}</span>
                          <span className="smtt-ex-norm">({v.toFixed(2)})</span>
                        </td>
                      ))}
                      <td className="smtt-ex-score" style={{ color: scores[ai] === maxScore ? '#0057FF' : '#0D1526' }}>
                        {scores[ai].toFixed(3)}
                        {scores[ai] === maxScore && <span className="smtt-ex-star"> ★</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="smtt-caption">
              {tr(
                'Normalizované hodnoty v závorkách. Auto B má nejvyšší skóre díky silnému výkonu a nízké spotřebě, přestože je nejdražší.',
                'Normalised values in brackets. Car B has the highest score thanks to its high power and low consumption, even though it is the most expensive.',
              )}
            </p>
          </div>
        </div>
      </section>

      {/* ── BENEFIT vs COST ────────────────────────────────── */}
      <section className="smtt-card smtt-anim" style={{ '--delay': '0.3s' }}>
        <span className="smtt-badge">{tr('Typy kritérií', 'Criterion types')}</span>
        <h3 className="smtt-h3">Benefit vs. Cost</h3>
        <div className="smtt-bc-grid">
          <div className="smtt-bc-card smtt-bc-card--benefit">
            <div className="smtt-bc-icon">↑</div>
            <div className="smtt-bc-title">Benefit</div>
            <div className="smtt-bc-desc">{tr('Vyšší hodnota je lepší.', 'A higher value is better.')}<br />{tr('Normalizace', 'Normalisation')}: (r − min) / (max − min)</div>
            <div className="smtt-bc-ex">{tr('Příklady: výkon, kvalita, kapacita, hodnocení', 'Examples: performance, quality, capacity, rating')}</div>
          </div>
          <div className="smtt-bc-card smtt-bc-card--cost">
            <div className="smtt-bc-icon">↓</div>
            <div className="smtt-bc-title">Cost</div>
            <div className="smtt-bc-desc">{tr('Nižší hodnota je lepší.', 'A lower value is better.')}<br />{tr('Normalizace', 'Normalisation')}: (max − r) / (max − min)</div>
            <div className="smtt-bc-ex">{tr('Příklady: cena, spotřeba, doba dodávky, riziko', 'Examples: price, consumption, delivery time, risk')}</div>
          </div>
        </div>
      </section>

      {/* ── AHP vs SMART ───────────────────────────────────── */}
      <section className="smtt-card smtt-anim" style={{ '--delay': '0.4s' }}>
        <span className="smtt-badge">{tr('Srovnání metod', 'Method comparison')}</span>
        <h3 className="smtt-h3">SMART vs. AHP</h3>
        <div className="smtt-compare-wrap">
          <table className="smtt-compare-table">
            <thead>
              <tr><th>{tr('Vlastnost', 'Property')}</th><th>SMART</th><th>AHP</th></tr>
            </thead>
            <tbody>
              {[
                [tr('Přiřazení vah', 'Weighting'),        tr('Přímé (0–100)', 'Direct (0–100)'),             tr('Párová srovnání', 'Pairwise comparisons')],
                [tr('Počet vstupů', 'Number of inputs'),  tr('n vah + n×m hodnocení', 'n weights + n×m ratings'), tr('n(n−1)/2 srovnání', 'n(n−1)/2 comparisons')],
                [tr('Kontrola konzistence', 'Consistency check'), tr('Ne', 'No'),                           tr('Ano (CR < 0,10)', 'Yes (CR < 0.10)')],
                [tr('Kognitivní náročnost', 'Cognitive effort'),  tr('Nízká', 'Low'),                       tr('Střední', 'Medium')],
                [tr('Vhodné pro', 'Suitable for'),        tr('> 5 kritérií', '> 5 criteria'),                tr('3–8 kritérií', '3–8 criteria')],
              ].map(([prop, s, a]) => (
                <tr key={prop}>
                  <td className="smtt-cmp-prop">{prop}</td>
                  <td className="smtt-cmp-smart">{s}</td>
                  <td className="smtt-cmp-ahp">{a}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
}

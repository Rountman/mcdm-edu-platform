import { useState } from 'react';
import './SMARTTheory.css';

const STEPS = [
  {
    n: 1, color: '#0057FF', title: 'Definice cíle a kritérií',
    body: 'Stanovte jasný rozhodovací cíl a vyberte 3–7 kritérií, která ho popisují. Kritéria by měla být vzájemně nezávislá, měřitelná a pokrývat celý problém. Každé kritérium označte jako benefit (vyšší hodnota = lepší) nebo cost (nižší hodnota = lepší).',
  },
  {
    n: 2, color: '#2563EB', title: 'Přiřazení vah kritériím',
    body: 'Přímou metodou přiřaďte každému kritériu váhu 0–100 dle jeho důležitosti. Na rozdíl od AHP nepotřebujete párová srovnání — váhy zadáváte přímo z vlastního úsudku. Váhy se automaticky normalizují na součet 100 %.',
  },
  {
    n: 3, color: '#7C3AED', title: 'Hodnocení alternativ',
    body: 'Ohodnoťte každou alternativu na každém kritériu na škále 0–100. Například: cena 20 000 Kč = 80 bodů, cena 40 000 Kč = 30 bodů. Hodnocení odráží vaše preference — nezáleží na absolutní hodnotě, ale na relativním srovnání.',
  },
  {
    n: 4, color: '#DB2777', title: 'Normalizace hodnocení',
    body: 'Pro každé kritérium se hodnocení přepočítá na škálu 0–1: benefit: v = (r – min) / (max – min), cost: v = (max – r) / (max – min). Tím jsou srovnatelné hodnoty napříč různými škálami a typy kritérií.',
  },
  {
    n: 5, color: '#059669', title: 'Výpočet celkového skóre',
    body: 'Výsledné skóre alternativy je vážený součet normalizovaných hodnocení: S_i = Σ(w_j · v_ij). Alternativa s nejvyšším S_i je nejlepší volba. Metoda SMART je transparentní — každou složku skóre lze snadno interpretovat.',
  },
];

const EXAMPLE_CRITS = ['Cena', 'Výkon', 'Spotřeba'];
const EXAMPLE_TYPES = ['cost', 'benefit', 'cost'];
const EXAMPLE_W     = [0.50, 0.30, 0.20];
const EXAMPLE_ALTS  = [
  { name: 'Auto A', raw: [180, 140, 6.5], norm: [0.90, 0.33, 0.60] },
  { name: 'Auto B', raw: [250, 200, 5.0], norm: [0.00, 1.00, 1.00] },
  { name: 'Auto C', raw: [200, 90,  8.0], norm: [0.56, 0.00, 0.00] },
];

export default function SMARTTheory() {
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
          <span className="smtt-badge">Metoda vícekriteriálního rozhodování</span>
          <h2 className="smtt-h2">
            Simple Multi-Attribute Rating Technique&ensp;
            <span className="smtt-h2-muted">(SMART)</span>
          </h2>
          <p className="smtt-lead">
            Metodu SMART navrhl <strong>Ward Edwards</strong> v&nbsp;roce 1977 jako zjednodušení
            teorie víceattributové utility (MAUT). Hlavní výhodou SMART oproti AHP je přímé
            přiřazení vah bez párových srovnání — rozhodovatel jednoduše rozdělí 100&nbsp;bodů
            mezi kritéria a ohodnotí alternativy na bodové škále.
          </p>
          <div className="smtt-stats">
            {[['1977', 'Rok vzniku'], ['0–100', 'Hodnotící škála'], ['Σ wᵢ = 1', 'Normalizace vah'], ['S = Σwv', 'Vzorec skóre']].map(([val, lbl]) => (
              <div key={lbl} className="smtt-stat">
                <span className="smtt-stat-val">{val}</span>
                <span className="smtt-stat-lbl">{lbl}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STEPS ──────────────────────────────────────────── */}
      <section className="smtt-card smtt-anim" style={{ '--delay': '0.1s' }}>
        <span className="smtt-badge">Postup výpočtu</span>
        <h3 className="smtt-h3">5 kroků metody SMART <span className="smtt-h3-hint">— klikněte pro detail</span></h3>
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
                <div className="smtt-step-title">{s.title}</div>
                {openStep === i && <p className="smtt-step-body">{s.body}</p>}
              </div>
              <div className={`smtt-step-chevron${openStep === i ? ' smtt-step-chevron--open' : ''}`}
                style={{ color: s.color }}>›</div>
            </button>
          ))}
        </div>
      </section>

      {/* ── FORMULA + EXAMPLE ──────────────────────────────── */}
      <section className="smtt-card smtt-anim" style={{ '--delay': '0.2s' }}>
        <span className="smtt-badge">Výpočet</span>
        <h3 className="smtt-h3">Vzorec a pracovní příklad</h3>

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
                ['Sᵢ', 'Celkové skóre alternativy i'],
                ['wⱼ', 'Normalizovaná váha kritéria j'],
                ['vᵢⱼ', 'Normalizované hodnocení alternativy i na kritériu j'],
              ].map(([sym, desc]) => (
                <div key={sym} className="smtt-var-row">
                  <dt>{sym}</dt>
                  <dd>{desc}</dd>
                </div>
              ))}
            </div>
          </div>

          <div className="smtt-example">
            <div className="smtt-field-label">Příklad — výběr automobilu</div>
            <div className="smtt-ex-table-wrap">
              <table className="smtt-ex-table">
                <thead>
                  <tr>
                    <th />
                    {EXAMPLE_CRITS.map((c, j) => (
                      <th key={j}>
                        {c}
                        <br />
                        <span className="smtt-ex-type">{EXAMPLE_TYPES[j] === 'cost' ? '↓ cost' : '↑ benefit'}</span>
                        <br />
                        <span className="smtt-ex-w">w={( EXAMPLE_W[j]*100).toFixed(0)} %</span>
                      </th>
                    ))}
                    <th>Skóre</th>
                  </tr>
                </thead>
                <tbody>
                  {EXAMPLE_ALTS.map((alt, ai) => (
                    <tr key={ai} className={scores[ai] === maxScore ? 'smtt-ex-best' : ''}>
                      <td className="smtt-ex-alt">{alt.name}</td>
                      {alt.norm.map((v, j) => (
                        <td key={j} className="smtt-ex-val">
                          <span className="smtt-ex-raw">{alt.raw[j]}</span>
                          <span className="smtt-ex-norm">({v.toFixed(2)})</span>
                        </td>
                      ))}
                      <td className="smtt-ex-score" style={{ color: scores[ai] === maxScore ? '#0057FF' : '#FF3B5C' }}>
                        {scores[ai].toFixed(3)}
                        {scores[ai] === maxScore && <span className="smtt-ex-star"> ★</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="smtt-caption">
              Normalizované hodnoty v&nbsp;závorkách. Auto&nbsp;B má nejvyšší skóre díky silnému výkonu a nízké spotřebě, přestože je nejdražší.
            </p>
          </div>
        </div>
      </section>

      {/* ── BENEFIT vs COST ────────────────────────────────── */}
      <section className="smtt-card smtt-anim" style={{ '--delay': '0.3s' }}>
        <span className="smtt-badge">Typy kritérií</span>
        <h3 className="smtt-h3">Benefit vs. Cost</h3>
        <div className="smtt-bc-grid">
          <div className="smtt-bc-card smtt-bc-card--benefit">
            <div className="smtt-bc-icon">↑</div>
            <div className="smtt-bc-title">Benefit</div>
            <div className="smtt-bc-desc">Vyšší hodnota je lepší.<br />Normalizace: (r − min) / (max − min)</div>
            <div className="smtt-bc-ex">Příklady: výkon, kvalita, kapacita, hodnocení</div>
          </div>
          <div className="smtt-bc-card smtt-bc-card--cost">
            <div className="smtt-bc-icon">↓</div>
            <div className="smtt-bc-title">Cost</div>
            <div className="smtt-bc-desc">Nižší hodnota je lepší.<br />Normalizace: (max − r) / (max − min)</div>
            <div className="smtt-bc-ex">Příklady: cena, spotřeba, doba dodávky, riziko</div>
          </div>
        </div>
      </section>

      {/* ── AHP vs SMART ───────────────────────────────────── */}
      <section className="smtt-card smtt-anim" style={{ '--delay': '0.4s' }}>
        <span className="smtt-badge">Srovnání metod</span>
        <h3 className="smtt-h3">SMART vs. AHP</h3>
        <div className="smtt-compare-wrap">
          <table className="smtt-compare-table">
            <thead>
              <tr><th>Vlastnost</th><th>SMART</th><th>AHP</th></tr>
            </thead>
            <tbody>
              {[
                ['Přiřazení vah',       'Přímé (0–100)',       'Párová srovnání'],
                ['Počet vstupů',        'n vah + n×m hodnocení', 'n(n−1)/2 srovnání'],
                ['Kontrola konzistence','Ne',                  'Ano (CR < 0,10)'],
                ['Kognitivní náročnost','Nízká',               'Střední'],
                ['Vhodné pro',          '> 5 kritérií',        '3–8 kritérií'],
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

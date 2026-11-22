import { useState } from 'react';
import './AHPTheory.css';
import { useLang } from '../../i18n/lang';

const SAATY = [
  { v: 1, label: { cs: 'Stejná důležitost', en: 'Equal importance' },
    hint: { cs: 'Obě kritéria přispívají ke splnění cíle stejnou měrou.', en: 'Both criteria contribute equally to the goal.' } },
  { v: 3, label: { cs: 'Mírná převaha', en: 'Moderate importance' },
    hint: { cs: 'Mírná preference jednoho kritéria na základě zkušenosti.', en: 'Experience slightly favours one criterion.' } },
  { v: 5, label: { cs: 'Silná převaha', en: 'Strong importance' },
    hint: { cs: 'Silná preference — jedno kritérium je jasně dominantní.', en: 'Strong preference — one criterion clearly dominates.' } },
  { v: 7, label: { cs: 'Velmi silná převaha', en: 'Very strong importance' },
    hint: { cs: 'Velmi silné upřednostnění prokázané praxí nebo analýzou.', en: 'Very strong preference demonstrated in practice or by analysis.' } },
  { v: 9, label: { cs: 'Extrémní převaha', en: 'Extreme importance' },
    hint: { cs: 'Nejvyšší možná úroveň preference jednoho kritéria nad druhým.', en: 'The highest possible preference of one criterion over another.' } },
];

const STEPS = [
  {
    n: 1,
    title: { cs: 'Definice cíle', en: 'Define the goal' },
    body: {
      cs: 'Jasně formulujte rozhodovací problém a stanovte hlavní cíl. Příklad: „Výběr nejlepšího dodavatele softwaru pro naši firmu.“ Čím konkrétněji je cíl popsán, tím přesnější výsledky AHP poskytne.',
      en: 'State the decision problem clearly and set the main goal. Example: “Selecting the best software supplier for our company.” The more specific the goal, the more precise the AHP results.',
    },
    color: '#0057FF',
  },
  {
    n: 2,
    title: { cs: 'Sestavení hierarchie', en: 'Build the hierarchy' },
    body: {
      cs: 'Rozložte problém do tříúrovňové hierarchie: Cíl → Kritéria → Alternativy. Vyberte 3–8 klíčových kritérií — měla by být měřitelná, vzájemně nezávislá a pokrývat celý problém.',
      en: 'Break the problem into a three-level hierarchy: Goal → Criteria → Alternatives. Choose 3–8 key criteria — they should be measurable, mutually independent and cover the whole problem.',
    },
    color: '#2563EB',
  },
  {
    n: 3,
    title: { cs: 'Párové srovnání kritérií', en: 'Pairwise comparison of criteria' },
    body: {
      cs: 'Každé kritérium porovnejte s každým jiným pomocí Saatyho stupnice (1–9). Pro n kritérií je potřeba n(n−1)/2 srovnání. Výsledkem je čtvercová reciproká matice: pokud a_ij = 3, pak a_ji = 1/3.',
      en: 'Compare every criterion with every other one using the Saaty scale (1–9). For n criteria you need n(n−1)/2 comparisons. The result is a square reciprocal matrix: if a_ij = 3, then a_ji = 1/3.',
    },
    color: '#7C3AED',
  },
  {
    n: 4,
    title: { cs: 'Výpočet prioritního vektoru', en: 'Compute the priority vector' },
    body: {
      cs: 'Z matice srovnání vypočítejte váhy (priority) jednotlivých kritérií. Nejpřesnější metodou je výpočet hlavního vlastního vektoru. Aproximaci lze získat geometrickým průměrem každého řádku a následnou normalizací.',
      en: 'Derive the weights (priorities) of the criteria from the comparison matrix. The most precise method is the principal eigenvector. An approximation is the geometric mean of each row followed by normalisation.',
    },
    color: '#DB2777',
  },
  {
    n: 5,
    title: { cs: 'Ověření konzistence', en: 'Check consistency' },
    body: {
      cs: 'Vypočítejte Consistency Ratio (CR). Pokud CR < 0,10, jsou srovnání přijatelně konzistentní. Pokud CR ≥ 0,10, přehodnoťte nejpochybnější srovnání — logická nekonzistence snižuje důvěryhodnost výsledků.',
      en: 'Compute the Consistency Ratio (CR). If CR < 0.10, the comparisons are acceptably consistent. If CR ≥ 0.10, revisit the most doubtful comparisons — logical inconsistency reduces the credibility of the results.',
    },
    color: '#FF3B5C',
  },
  {
    n: 6,
    title: { cs: 'Syntéza výsledků', en: 'Synthesise the results' },
    body: {
      cs: 'Výsledné skóre každé alternativy je vážený součet hodnocení vůči každému kritériu. Alternativa s nejvyšším celkovým skóre je doporučená volba. AHP umožňuje i analýzu citlivosti — co se stane, když změníte váhu kritéria?',
      en: 'The final score of each alternative is the weighted sum of its ratings on every criterion. The alternative with the highest total score is the recommended choice. AHP also allows sensitivity analysis — what happens if you change a criterion weight?',
    },
    color: '#059669',
  },
];

const RI = [
  { n: 1, v: 0 }, { n: 2, v: 0 }, { n: 3, v: 0.58 }, { n: 4, v: 0.9 },
  { n: 5, v: 1.12 }, { n: 6, v: 1.24 }, { n: 7, v: 1.32 }, { n: 8, v: 1.41 },
];

const NODE_CX = [100, 290, 480];

export default function AHPTheory() {
  const { lang, tr } = useLang();
  const [openStep, setOpenStep]       = useState(null);
  const [hoveredSaaty, setHoveredSaaty] = useState(null);
  // Desetinná čárka v češtině, tečka v angličtině
  const num = (v, d = 2) => (lang === 'en' ? v.toFixed(d) : v.toFixed(d).replace('.', ','));

  const critLabels = [1, 2, 3].map((i) => `${tr('Kritérium', 'Criterion')} ${i}`);
  const altLabels = ['A', 'B', 'C'].map((c) => `${tr('Alternativa', 'Alternative')} ${c}`);

  return (
    <div className="ahpt-root">

      {/* ── INTRO ───────────────────────────────────────── */}
      <section className="ahpt-card ahpt-anim ahpt-intro" style={{ '--delay': '0s' }}>
        <div className="ahpt-intro-bar" />
        <div className="ahpt-intro-body">
          <span className="ahpt-badge">{tr('Metoda vícekriteriálního rozhodování', 'Multi-criteria decision method')}</span>
          <h2 className="ahpt-h2">
            {tr('Analytický hierarchický proces', 'Analytic Hierarchy Process')}&ensp;
            <span className="ahpt-h2-muted">(AHP)</span>
          </h2>
          {tr(
            <p className="ahpt-lead">
              Metodu AHP vyvinul matematik <strong>Thomas L. Saaty</strong> v&nbsp;roce 1977 původně
              pro americké ministerstvo obrany. Dnes patří k&nbsp;nejpoužívanějším metodám
              vícekriteriálního rozhodování (MCDM) v&nbsp;oblastech managementu, inženýrství
              i&nbsp;zdravotnictví. Umožňuje strukturovaně porovnávat varianty s&nbsp;ohledem
              na více kritérií zároveň.
            </p>,
            <p className="ahpt-lead">
              AHP was developed by the mathematician <strong>Thomas L. Saaty</strong> in 1977, originally
              for the US Department of Defense. Today it is one of the most widely used multi-criteria
              decision-making (MCDM) methods in management, engineering and healthcare. It lets you
              compare options in a structured way against several criteria at once.
            </p>,
          )}
          <div className="ahpt-stats">
            {[
              ['1977', tr('Rok vzniku', 'Year introduced')],
              ['1–9', tr('Saatyho stupnice', 'Saaty scale')],
              [`< ${num(0.1)}`, tr('Přijatelné CR', 'Acceptable CR')],
              ['n × n', tr('Matice srovnání', 'Comparison matrix')],
            ].map(([val, lbl]) => (
              <div key={val} className="ahpt-stat">
                <span className="ahpt-stat-val">{val}</span>
                <span className="ahpt-stat-lbl">{lbl}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HIERARCHY DIAGRAM ───────────────────────────── */}
      <section className="ahpt-card ahpt-anim" style={{ '--delay': '0.1s' }}>
        <span className="ahpt-badge">{tr('Struktura problému', 'Problem structure')}</span>
        <h3 className="ahpt-h3">{tr('Tříúrovňová hierarchie', 'Three-level hierarchy')}</h3>
        <div className="ahpt-hier-wrap">
          <svg className="ahpt-hier-svg" viewBox="0 0 700 275" aria-hidden="true">
            {/* Goal → Criteria lines */}
            <line className="ahpt-svgl ahpt-svgl--main" x1="290" y1="56" x2="100" y2="118" style={{ '--dl': '0.15s' }} />
            <line className="ahpt-svgl ahpt-svgl--main" x1="290" y1="56" x2="290" y2="118" style={{ '--dl': '0.25s' }} />
            <line className="ahpt-svgl ahpt-svgl--main" x1="290" y1="56" x2="480" y2="118" style={{ '--dl': '0.35s' }} />

            {/* Criteria → Alternatives (all 9, dashed fade-in) */}
            {NODE_CX.flatMap((kx, ki) =>
              NODE_CX.map((ax, ai) => (
                <line
                  key={`${ki}-${ai}`}
                  className="ahpt-svgl ahpt-svgl--sub"
                  x1={kx} y1="156" x2={ax} y2="215"
                  style={{ '--dl': `${0.5 + (ki * 3 + ai) * 0.04}s` }}
                />
              ))
            )}

            {/* Level labels */}
            <text className="ahpt-svgt--level" x="694" y="40"  textAnchor="end">{tr('Úroveň', 'Level')} 1</text>
            <text className="ahpt-svgt--level" x="694" y="140" textAnchor="end">{tr('Úroveň', 'Level')} 2</text>
            <text className="ahpt-svgt--level" x="694" y="238" textAnchor="end">{tr('Úroveň', 'Level')} 3</text>

            {/* Goal node */}
            <g className="ahpt-svg-ng" style={{ '--dl': '0.08s' }}>
              <rect className="ahpt-svgr--goal" x="188" y="18" width="204" height="38" rx="9" />
              <text className="ahpt-svgt--goal" x="290" y="37" textAnchor="middle" dominantBaseline="middle">
                {tr('Cíl rozhodnutí', 'Decision goal')}
              </text>
            </g>

            {/* Criteria nodes */}
            {critLabels.map((lbl, i) => (
              <g key={i} className="ahpt-svg-ng" style={{ '--dl': `${0.3 + i * 0.08}s` }}>
                <rect className="ahpt-svgr--crit" x={NODE_CX[i] - 68} y="118" width="136" height="38" rx="8" />
                <text className="ahpt-svgt--crit" x={NODE_CX[i]} y="137" textAnchor="middle" dominantBaseline="middle">
                  {lbl}
                </text>
              </g>
            ))}

            {/* Alternative nodes */}
            {altLabels.map((lbl, i) => (
              <g key={i} className="ahpt-svg-ng" style={{ '--dl': `${0.6 + i * 0.08}s` }}>
                <rect className="ahpt-svgr--alt" x={NODE_CX[i] - 60} y="215" width="120" height="34" rx="7" />
                <text className="ahpt-svgt--alt" x={NODE_CX[i]} y="232" textAnchor="middle" dominantBaseline="middle">
                  {lbl}
                </text>
              </g>
            ))}
          </svg>
        </div>
        {tr(
          <p className="ahpt-caption">
            Všechny alternativy jsou hodnoceny vůči <em>každému</em> kritériu zvlášť — pro 3 kritéria
            a 3 alternativy vzniknou 3 srovnávací matice 3×3 (plus matice kritérií 3×3 na úrovni 2).
          </p>,
          <p className="ahpt-caption">
            All alternatives are rated against <em>each</em> criterion separately — 3 criteria and
            3 alternatives give three 3×3 comparison matrices (plus the 3×3 criteria matrix at level 2).
          </p>,
        )}
      </section>

      {/* ── 6 STEPS ─────────────────────────────────────── */}
      <section className="ahpt-card ahpt-anim" style={{ '--delay': '0.2s' }}>
        <span className="ahpt-badge">{tr('Postup výpočtu', 'Calculation procedure')}</span>
        <h3 className="ahpt-h3">
          {tr('6 kroků metody AHP', '6 steps of the AHP method')}&ensp;
          <span className="ahpt-h3-hint">— {tr('klikněte na krok pro detail', 'click a step for details')}</span>
        </h3>
        <div className="ahpt-steps">
          {STEPS.map((s, i) => (
            <button
              key={s.n}
              type="button"
              className={`ahpt-step${openStep === i ? ' ahpt-step--open' : ''}`}
              style={{ '--sc': s.color }}
              onClick={() => setOpenStep(openStep === i ? null : i)}
              aria-expanded={openStep === i}
            >
              <div className="ahpt-step-n" style={{ background: s.color }}>{s.n}</div>
              <div className="ahpt-step-inner">
                <div className="ahpt-step-title">{s.title[lang]}</div>
                {openStep === i && <p className="ahpt-step-body">{s.body[lang]}</p>}
              </div>
              <div className={`ahpt-step-chevron${openStep === i ? ' ahpt-step-chevron--open' : ''}`}
                style={{ color: s.color }}>›</div>
            </button>
          ))}
        </div>
      </section>

      {/* ── SAATY SCALE ─────────────────────────────────── */}
      <section className="ahpt-card ahpt-anim" style={{ '--delay': '0.3s' }}>
        <span className="ahpt-badge">{tr('Hodnotící stupnice', 'Rating scale')}</span>
        <h3 className="ahpt-h3">{tr('Saatyho škála 1–9', 'Saaty scale 1–9')}</h3>
        <div className="ahpt-saaty">
          {SAATY.map((row, i) => (
            <div
              key={row.v}
              className={`ahpt-saaty-row${hoveredSaaty === i ? ' ahpt-saaty-row--hl' : ''}`}
              onMouseEnter={() => setHoveredSaaty(i)}
              onMouseLeave={() => setHoveredSaaty(null)}
            >
              <div
                className="ahpt-saaty-num"
                style={{ background: `hsl(${220 - i * 22}, 88%, ${55 - i * 4}%)` }}
              >{row.v}</div>
              <div className="ahpt-saaty-lbl">{row.label[lang]}</div>
              <div className="ahpt-saaty-track">
                <div
                  className="ahpt-saaty-fill"
                  style={{
                    '--bw': `${(row.v / 9) * 100}%`,
                    background: `hsl(${220 - i * 22}, 80%, ${52 - i * 4}%)`,
                    animationDelay: `${0.45 + i * 0.08}s`,
                  }}
                />
              </div>
              {hoveredSaaty === i && (
                <div className="ahpt-saaty-tooltip">{row.hint[lang]}</div>
              )}
            </div>
          ))}
          <p className="ahpt-saaty-note">
            {tr(
              'Sudá čísla (2, 4, 6, 8) slouží jako mezistupeň. Reciproká hodnota 1/n se automaticky přiřadí opačné relaci — pokud je A třikrát důležitější než B, pak B má hodnotu 1/3 vůči A.',
              'Even numbers (2, 4, 6, 8) are intermediate values. The reciprocal 1/n is assigned automatically to the opposite relation — if A is three times as important as B, then B has the value 1/3 relative to A.',
            )}
          </p>
        </div>
      </section>

      {/* ── CONSISTENCY ─────────────────────────────────── */}
      <section className="ahpt-card ahpt-anim" style={{ '--delay': '0.4s' }}>
        <span className="ahpt-badge">{tr('Kontrola kvality', 'Quality check')}</span>
        <h3 className="ahpt-h3">{tr('Index konzistence (CR)', 'Consistency ratio (CR)')}</h3>

        <div className="ahpt-cr">
          <div className="ahpt-cr-formulas">
            <div className="ahpt-formula">
              <span className="ahpt-fsym">CR</span>
              <span className="ahpt-feq">=</span>
              <div className="ahpt-ffrac">
                <span>CI</span>
                <span className="ahpt-fbar" />
                <span>RI</span>
              </div>
            </div>
            <div className="ahpt-formula ahpt-formula--sm">
              <span className="ahpt-fsym ahpt-fsym--sm">CI</span>
              <span className="ahpt-feq">=</span>
              <div className="ahpt-ffrac">
                <span>λ<sub>max</sub> − n</span>
                <span className="ahpt-fbar" />
                <span>n − 1</span>
              </div>
            </div>
          </div>
          <dl className="ahpt-cr-vars">
            {[
              ['λmax', tr('Největší vlastní číslo (eigenvalue) matice srovnání', 'Largest eigenvalue of the comparison matrix')],
              ['n',    tr('Počet kritérií — rozměr matice n × n', 'Number of criteria — size of the n × n matrix')],
              ['CI',   tr('Consistency Index — odchylka od ideální konzistence', 'Consistency Index — deviation from perfect consistency')],
              ['RI',   tr('Random Index — tabulková hodnota závislá na n', 'Random Index — tabulated value depending on n')],
            ].map(([sym, desc]) => (
              <div key={sym} className="ahpt-cr-var">
                <dt>{sym}</dt>
                <dd>{desc}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="ahpt-bands">
          {[
            { range: `CR < ${num(0.1)}`, title: tr('Konzistentní', 'Consistent'),
              desc: tr('Srovnání je přijatelné — pokračujte výpočtem.', 'The comparisons are acceptable — continue with the calculation.'), cls: 'ok' },
            { range: `CR ${num(0.1)}–${num(0.2)}`, title: tr('Hraniční', 'Borderline'),
              desc: tr('Doporučuje se přehodnotit nejspornější srovnání.', 'Consider revisiting the most questionable comparisons.'), cls: 'warn' },
            { range: `CR > ${num(0.2)}`, title: tr('Nekonzistentní', 'Inconsistent'),
              desc: tr('Srovnání je příliš rozporné — nutné opravit před výpočtem.', 'The comparisons are too contradictory — fix them before calculating.'), cls: 'bad' },
          ].map(b => (
            <div key={b.cls} className={`ahpt-band ahpt-band--${b.cls}`}>
              <div className="ahpt-band-range">{b.range}</div>
              <div className="ahpt-band-title">{b.title}</div>
              <div className="ahpt-band-desc">{b.desc}</div>
            </div>
          ))}
        </div>

        <div className="ahpt-ri-wrap">
          <div className="ahpt-field-label">{tr('Tabulka Random Index (RI) dle Saaty', 'Saaty Random Index (RI) table')}</div>
          <div className="ahpt-ri-scroll">
            <table className="ahpt-ri-table">
              <thead>
                <tr><th>n</th>{RI.map(r => <th key={r.n}>{r.n}</th>)}</tr>
              </thead>
              <tbody>
                <tr><td>RI</td>{RI.map(r => <td key={r.n}>{num(r.v)}</td>)}</tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

    </div>
  );
}

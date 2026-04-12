import { useState } from 'react';
import './AHPTheory.css';

const SAATY = [
  { v: 1, label: 'Stejná důležitost',    hint: 'Obě kritéria přispívají ke splnění cíle stejnou měrou.' },
  { v: 3, label: 'Mírná převaha',        hint: 'Mírná preference jednoho kritéria na základě zkušenosti.' },
  { v: 5, label: 'Silná převaha',        hint: 'Silná preference — jedno kritérium je jasně dominantní.' },
  { v: 7, label: 'Velmi silná převaha',  hint: 'Velmi silné upřednostnění prokázané praxí nebo analýzou.' },
  { v: 9, label: 'Extrémní převaha',     hint: 'Nejvyšší možná úroveň preference jednoho kritéria nad druhým.' },
];

const STEPS = [
  {
    n: 1,
    title: 'Definice cíle',
    body: 'Jasně formulujte rozhodovací problém a stanovte hlavní cíl. Příklad: „Výběr nejlepšího dodavatele softwaru pro naši firmu." Čím konkrétněji je cíl popsán, tím přesnější výsledky AHP poskytne.',
    color: '#0057FF',
  },
  {
    n: 2,
    title: 'Sestavení hierarchie',
    body: 'Rozložte problém do tříúrovňové hierarchie: Cíl → Kritéria → Alternativy. Vyberte 3–8 klíčových kritérií — měla by být měřitelná, vzájemně nezávislá a pokrývat celý problém.',
    color: '#2563EB',
  },
  {
    n: 3,
    title: 'Párové srovnání kritérií',
    body: 'Každé kritérium porovnejte s každým jiným pomocí Saatyho stupnice (1–9). Pro n kritérií je potřeba n(n−1)/2 srovnání. Výsledkem je čtvercová reciproká matice: pokud a_ij = 3, pak a_ji = 1/3.',
    color: '#7C3AED',
  },
  {
    n: 4,
    title: 'Výpočet prioritního vektoru',
    body: 'Z matice srovnání vypočítejte váhy (priority) jednotlivých kritérií. Nejpřesnější metodou je výpočet hlavního vlastního vektoru. Aproximaci lze získat geometrickým průměrem každého řádku a následnou normalizací.',
    color: '#DB2777',
  },
  {
    n: 5,
    title: 'Ověření konzistence',
    body: 'Vypočítejte Consistency Ratio (CR). Pokud CR < 0,10, jsou srovnání přijatelně konzistentní. Pokud CR ≥ 0,10, přehodnoťte nejpochybnější srovnání — logická nekonzistence snižuje důvěryhodnost výsledků.',
    color: '#FF3B5C',
  },
  {
    n: 6,
    title: 'Syntéza výsledků',
    body: 'Výsledné skóre každé alternativy je vážený součet hodnocení vůči každému kritériu. Alternativa s nejvyšším celkovým skóre je doporučená volba. AHP umožňuje i analýzu citlivosti — co se stane, když změníte váhu kritéria?',
    color: '#059669',
  },
];

const RI = [
  { n: 1, v: '0,00' }, { n: 2, v: '0,00' }, { n: 3, v: '0,58' }, { n: 4, v: '0,90' },
  { n: 5, v: '1,12' }, { n: 6, v: '1,24' }, { n: 7, v: '1,32' }, { n: 8, v: '1,41' },
];

const CRIT_LABELS = ['Kritérium 1', 'Kritérium 2', 'Kritérium 3'];
const ALT_LABELS  = ['Alternativa A', 'Alternativa B', 'Alternativa C'];
const NODE_CX     = [100, 290, 480];

export default function AHPTheory() {
  const [openStep, setOpenStep]       = useState(null);
  const [hoveredSaaty, setHoveredSaaty] = useState(null);

  return (
    <div className="ahpt-root">

      {/* ── INTRO ───────────────────────────────────────── */}
      <section className="ahpt-card ahpt-anim ahpt-intro" style={{ '--delay': '0s' }}>
        <div className="ahpt-intro-bar" />
        <div className="ahpt-intro-body">
          <span className="ahpt-badge">Metoda vícekriteriálního rozhodování</span>
          <h2 className="ahpt-h2">
            Analytický hierarchický proces&ensp;
            <span className="ahpt-h2-muted">(AHP)</span>
          </h2>
          <p className="ahpt-lead">
            Metodu AHP vyvinul matematik <strong>Thomas L. Saaty</strong> v&nbsp;roce 1977 původně
            pro americké ministerstvo obrany. Dnes patří k&nbsp;nejpoužívanějším metodám
            vícekriteriálního rozhodování (MCDM) v&nbsp;oblastech managementu, inženýrství
            i&nbsp;zdravotnictví. Umožňuje strukturovaně porovnávat varianty s&nbsp;ohledem
            na více kritérií zároveň.
          </p>
          <div className="ahpt-stats">
            {[['1977', 'Rok vzniku'], ['1–9', 'Saatyho stupnice'], ['< 0,10', 'Přijatelné CR'], ['n × n', 'Matice srovnání']].map(([val, lbl]) => (
              <div key={lbl} className="ahpt-stat">
                <span className="ahpt-stat-val">{val}</span>
                <span className="ahpt-stat-lbl">{lbl}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HIERARCHY DIAGRAM ───────────────────────────── */}
      <section className="ahpt-card ahpt-anim" style={{ '--delay': '0.1s' }}>
        <span className="ahpt-badge">Struktura problému</span>
        <h3 className="ahpt-h3">Tříúrovňová hierarchie</h3>
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
            <text className="ahpt-svgt--level" x="694" y="40"  textAnchor="end">Úroveň 1</text>
            <text className="ahpt-svgt--level" x="694" y="140" textAnchor="end">Úroveň 2</text>
            <text className="ahpt-svgt--level" x="694" y="238" textAnchor="end">Úroveň 3</text>

            {/* Goal node */}
            <g className="ahpt-svg-ng" style={{ '--dl': '0.08s' }}>
              <rect className="ahpt-svgr--goal" x="188" y="18" width="204" height="38" rx="9" />
              <text className="ahpt-svgt--goal" x="290" y="37" textAnchor="middle" dominantBaseline="middle">
                Cíl rozhodnutí
              </text>
            </g>

            {/* Criteria nodes */}
            {CRIT_LABELS.map((lbl, i) => (
              <g key={i} className="ahpt-svg-ng" style={{ '--dl': `${0.3 + i * 0.08}s` }}>
                <rect className="ahpt-svgr--crit" x={NODE_CX[i] - 68} y="118" width="136" height="38" rx="8" />
                <text className="ahpt-svgt--crit" x={NODE_CX[i]} y="137" textAnchor="middle" dominantBaseline="middle">
                  {lbl}
                </text>
              </g>
            ))}

            {/* Alternative nodes */}
            {ALT_LABELS.map((lbl, i) => (
              <g key={i} className="ahpt-svg-ng" style={{ '--dl': `${0.6 + i * 0.08}s` }}>
                <rect className="ahpt-svgr--alt" x={NODE_CX[i] - 60} y="215" width="120" height="34" rx="7" />
                <text className="ahpt-svgt--alt" x={NODE_CX[i]} y="232" textAnchor="middle" dominantBaseline="middle">
                  {lbl}
                </text>
              </g>
            ))}
          </svg>
        </div>
        <p className="ahpt-caption">
          Všechny alternativy jsou hodnoceny vůči <em>každému</em> kritériu zvlášť — pro 3 kritéria
          a 3 alternativy vzniknou 3 srovnávací matice 3×3 (plus matice kritérií 3×3 na úrovni 2).
        </p>
      </section>

      {/* ── 6 STEPS ─────────────────────────────────────── */}
      <section className="ahpt-card ahpt-anim" style={{ '--delay': '0.2s' }}>
        <span className="ahpt-badge">Postup výpočtu</span>
        <h3 className="ahpt-h3">
          6 kroků metody AHP&ensp;
          <span className="ahpt-h3-hint">— klikněte na krok pro detail</span>
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
                <div className="ahpt-step-title">{s.title}</div>
                {openStep === i && <p className="ahpt-step-body">{s.body}</p>}
              </div>
              <div className={`ahpt-step-chevron${openStep === i ? ' ahpt-step-chevron--open' : ''}`}
                style={{ color: s.color }}>›</div>
            </button>
          ))}
        </div>
      </section>

      {/* ── SAATY SCALE ─────────────────────────────────── */}
      <section className="ahpt-card ahpt-anim" style={{ '--delay': '0.3s' }}>
        <span className="ahpt-badge">Hodnotící stupnice</span>
        <h3 className="ahpt-h3">Saatyho škála 1–9</h3>
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
              <div className="ahpt-saaty-lbl">{row.label}</div>
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
                <div className="ahpt-saaty-tooltip">{row.hint}</div>
              )}
            </div>
          ))}
          <p className="ahpt-saaty-note">
            Sudá čísla (2, 4, 6, 8) slouží jako mezistupeň. Reciproká hodnota 1/n se
            automaticky přiřadí opačné relaci — pokud je A třikrát důležitější než B,
            pak B má hodnotu 1/3 vůči A.
          </p>
        </div>
      </section>

      {/* ── CONSISTENCY ─────────────────────────────────── */}
      <section className="ahpt-card ahpt-anim" style={{ '--delay': '0.4s' }}>
        <span className="ahpt-badge">Kontrola kvality</span>
        <h3 className="ahpt-h3">Index konzistence (CR)</h3>

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
              ['λmax', 'Největší vlastní číslo (eigenvalue) matice srovnání'],
              ['n',    'Počet kritérií — rozměr matice n × n'],
              ['CI',   'Consistency Index — odchylka od ideální konzistence'],
              ['RI',   'Random Index — tabulková hodnota závislá na n'],
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
            { range: 'CR < 0,10',     title: 'Konzistentní',    desc: 'Srovnání je přijatelné — pokračujte výpočtem.',          cls: 'ok'   },
            { range: 'CR 0,10–0,20',  title: 'Hraniční',        desc: 'Doporučuje se přehodnotit nejspornější srovnání.',        cls: 'warn' },
            { range: 'CR > 0,20',     title: 'Nekonzistentní',  desc: 'Srovnání je příliš rozporné — nutné opravit před výpočtem.', cls: 'bad'  },
          ].map(b => (
            <div key={b.cls} className={`ahpt-band ahpt-band--${b.cls}`}>
              <div className="ahpt-band-range">{b.range}</div>
              <div className="ahpt-band-title">{b.title}</div>
              <div className="ahpt-band-desc">{b.desc}</div>
            </div>
          ))}
        </div>

        <div className="ahpt-ri-wrap">
          <div className="ahpt-field-label">Tabulka Random Index (RI) dle Saaty</div>
          <div className="ahpt-ri-scroll">
            <table className="ahpt-ri-table">
              <thead>
                <tr><th>n</th>{RI.map(r => <th key={r.n}>{r.n}</th>)}</tr>
              </thead>
              <tbody>
                <tr><td>RI</td>{RI.map(r => <td key={r.n}>{r.v}</td>)}</tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

    </div>
  );
}

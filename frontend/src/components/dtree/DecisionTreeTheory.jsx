import { useState } from 'react';
import './DecisionTreeTheory.css';
import { useLang } from '../../i18n/lang';

const STEPS = [
  { n: 1, color: '#0057FF',
    title: { cs: 'Definice problému', en: 'Define the problem' },
    body: {
      cs: 'Identifikujte rozhodnutí, která musíte učinit, a nejistoty, se kterými se potýkáte. Rozlišujte mezi rozhodnutími (které ovládáte) a náhodnými událostmi (které neovládáte, ale znáte jejich pravděpodobnosti).',
      en: 'Identify the decisions you have to make and the uncertainties you face. Distinguish between decisions (which you control) and chance events (which you do not control, but whose probabilities you know).',
    } },
  { n: 2, color: '#2563EB',
    title: { cs: 'Sestrojení stromu', en: 'Build the tree' },
    body: {
      cs: 'Kreslete strom zleva doprava. Začněte rozhodovacím uzlem, větví pro každou možnou akci, pak náhodovými uzly pro každou nejistotu s jejími pravděpodobnostmi. Strom musí zahrnovat všechny relevantní možnosti.',
      en: 'Draw the tree from left to right. Start with a decision node and a branch for each possible action, then chance nodes for each uncertainty with its probabilities. The tree must include all relevant possibilities.',
    } },
  { n: 3, color: '#7C3AED',
    title: { cs: 'Ohodnocení terminálních uzlů', en: 'Value the terminal nodes' },
    body: {
      cs: 'Přiřaďte každému terminálnímu uzlu (listu) peněžní hodnotu nebo utility — to je výsledná hodnota daného scénáře. Hodnoty mohou být pozitivní (zisky) i negativní (ztráty).',
      en: 'Assign each terminal node (leaf) a monetary value or utility — the outcome of that scenario. Values can be positive (gains) or negative (losses).',
    } },
  { n: 4, color: '#DB2777',
    title: { cs: 'Zpětná indukce (fold-back)', en: 'Backward induction (fold-back)' },
    body: {
      cs: 'Počítejte zprava doleva. Pro náhodový uzel: EMV = Σ(pravděpodobnost × hodnota potomka). Pro rozhodovací uzel: vyberte větev s nejvyšší EMV — to je optimální rozhodnutí.',
      en: 'Work from right to left. For a chance node: EMV = Σ(probability × value of child). For a decision node: choose the branch with the highest EMV — that is the optimal decision.',
    } },
  { n: 5, color: '#059669',
    title: { cs: 'Interpretace a analýza', en: 'Interpret and analyse' },
    body: {
      cs: 'Optimální strategie je cesta od kořene k listu přes uzly s nejvyšší EMV. Proveďte analýzu citlivosti — jak se změní rozhodnutí při jiných pravděpodobnostech nebo hodnotách výsledků?',
      en: 'The optimal strategy is the path from the root to a leaf through the nodes with the highest EMV. Run a sensitivity analysis — how does the decision change with different probabilities or outcome values?',
    } },
];

const MUTED = '#4A5875';

export default function DecisionTreeTheory() {
  const { lang, tr } = useLang();
  const [openStep, setOpenStep] = useState(null);
  // Čísla v příkladu: české mezery a desetinná čárka vs. anglické čárky a tečka
  const money = (v) => (lang === 'en' ? `CZK ${v.toLocaleString('en-US')}` : `${v.toLocaleString('cs-CZ')} Kč`);
  const n = (v) => v.toLocaleString(lang === 'en' ? 'en-US' : 'cs-CZ');

  return (
    <div className="dtt-root">

      {/* INTRO */}
      <section className="dtt-card dtt-anim dtt-intro" style={{ '--delay': '0s' }}>
        <div className="dtt-intro-bar" />
        <div className="dtt-intro-body">
          <span className="dtt-badge">{tr('Klasický DSS nástroj', 'A classic decision support tool')}</span>
          <h2 className="dtt-h2">
            {tr('Rozhodovací stromy', 'Decision trees')}{' '}
            {lang === 'cs' && <span className="dtt-h2-muted">(Decision Trees)</span>}
          </h2>
          {tr(
            <p className="dtt-lead">
              Rozhodovací stromy jsou grafická metoda pro sekvenční rozhodování za nejistoty.
              Formalizoval je <strong>Howard Raiffa</strong> v 60. letech. Strom mapuje všechny
              možné scénáře a jejich pravděpodobnosti a pomocí kritéria <em>očekávané peněžní
              hodnoty (EMV)</em> identifikuje optimální strategii.
            </p>,
            <p className="dtt-lead">
              Decision trees are a graphical method for sequential decision making under uncertainty.
              They were formalised by <strong>Howard Raiffa</strong> in the 1960s. A tree maps all
              possible scenarios and their probabilities and uses the <em>expected monetary value
              (EMV)</em> criterion to identify the optimal strategy.
            </p>,
          )}
          <div className="dtt-stats">
            {[
              ['EMV', tr('Kritérium volby', 'Choice criterion')],
              ['←', tr('Fold-back směr', 'Fold-back direction')],
              ['□ ○ ◊', tr('Typy uzlů', 'Node types')],
              ['Σ p·v', tr('Vzorec EMV', 'EMV formula')],
            ].map(([v, l]) => (
              <div key={v} className="dtt-stat"><span className="dtt-stat-val">{v}</span><span className="dtt-stat-lbl">{l}</span></div>
            ))}
          </div>
        </div>
      </section>

      {/* NODE TYPES */}
      <section className="dtt-card dtt-anim" style={{ '--delay': '0.1s' }}>
        <span className="dtt-badge">{tr('Stavební bloky', 'Building blocks')}</span>
        <h3 className="dtt-h3">{tr('Typy uzlů rozhodovacího stromu', 'Decision tree node types')}</h3>
        <div className="dtt-nodes-grid">
          <div className="dtt-node-card dtt-node-card--dec">
            <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true"><rect x="4" y="4" width="36" height="36" rx="6" fill="#0057FF"/><text x="22" y="27" textAnchor="middle" fontSize="18" fill="white" fontWeight="700">□</text></svg>
            <div className="dtt-nc-title">{tr('Rozhodovací uzel', 'Decision node')}</div>
            <div className="dtt-nc-desc">{tr(
              'Čtverec — zde rozhodujete vy. Vyberte větev s nejvyšší EMV. Výsledkem je maximalizace očekávané hodnoty.',
              'Square — this is where you decide. Choose the branch with the highest EMV, maximising the expected value.',
            )}</div>
          </div>
          <div className="dtt-node-card dtt-node-card--chance">
            <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true"><circle cx="22" cy="22" r="18" fill="#B45309"/><text x="22" y="27" textAnchor="middle" fontSize="18" fill="white" fontWeight="700">○</text></svg>
            <div className="dtt-nc-title">{tr('Náhodový uzel', 'Chance node')}</div>
            <div className="dtt-nc-desc">{tr(
              'Kruh — příroda rozhoduje. Větve mají pravděpodobnosti, jejichž součet musí být 1. EMV = Σ(p·v).',
              'Circle — nature decides. The branches have probabilities that must sum to 1. EMV = Σ(p·v).',
            )}</div>
          </div>
          <div className="dtt-node-card dtt-node-card--term">
            <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true"><rect x="4" y="10" width="36" height="24" rx="6" fill="#047857"/><text x="22" y="27" textAnchor="middle" fontSize="10" fill="white" fontWeight="700">{tr('Kč', 'CZK')}</text></svg>
            <div className="dtt-nc-title">{tr('Terminální uzel', 'Terminal node')}</div>
            <div className="dtt-nc-desc">{tr(
              'List stromu — konec scénáře. Obsahuje konkrétní výslednou hodnotu (výnos nebo ztrátu).',
              'A leaf of the tree — the end of a scenario. It holds the concrete outcome value (gain or loss).',
            )}</div>
          </div>
        </div>
      </section>

      {/* EXAMPLE TREE */}
      <section className="dtt-card dtt-anim" style={{ '--delay': '0.2s' }}>
        <span className="dtt-badge">{tr('Pracovní příklad', 'Worked example')}</span>
        <h3 className="dtt-h3">{tr('Investiční rozhodnutí — zpětná indukce', 'Investment decision — backward induction')}</h3>
        <div className="dtt-example-wrap">
          <svg viewBox="0 0 620 260" className="dtt-ex-svg" aria-hidden="true">
            {/* Branch lines */}
            <line x1="60" y1="130" x2="180" y2="65"  stroke="#7A869C" strokeWidth="1.5"/>
            <line x1="60" y1="130" x2="180" y2="195" stroke="#7A869C" strokeWidth="1.5" strokeDasharray="5 4"/>
            <line x1="240" y1="65"  x2="370" y2="30"  stroke="#7A869C" strokeWidth="1.5"/>
            <line x1="240" y1="65"  x2="370" y2="100" stroke="#7A869C" strokeWidth="1.5"/>
            {/* Optimal path highlight */}
            <line x1="60" y1="130" x2="180" y2="65"  stroke="#0057FF" strokeWidth="2.5" opacity="0.8"/>
            <line x1="240" y1="65"  x2="370" y2="30"  stroke="#0057FF" strokeWidth="2.5" opacity="0.8"/>
            <line x1="240" y1="65"  x2="370" y2="100" stroke="#0057FF" strokeWidth="2.5" opacity="0.8"/>
            {/* Branch labels */}
            <text x="106" y="85"  fontSize="11" fill={MUTED} textAnchor="middle">{tr('Investovat', 'Invest')}</text>
            <text x="100" y="180" fontSize="11" fill={MUTED} textAnchor="middle">{tr('Neinvestovat', 'Do not invest')}</text>
            <text x="295" y="35"  fontSize="11" fill={MUTED} textAnchor="middle">{tr('Příznivý (0,7)', 'Favourable (0.7)')}</text>
            <text x="298" y="96"  fontSize="11" fill={MUTED} textAnchor="middle">{tr('Nepříznivý (0,3)', 'Unfavourable (0.3)')}</text>
            {/* Decision node - root */}
            <rect x="22" y="110" width="76" height="40" rx="7" fill="#0057FF"/>
            <text x="60" y="133" textAnchor="middle" fontSize="11" fill="white" fontWeight="700">{tr('Rozhodnutí', 'Decision')}</text>
            <text x="60" y="162" textAnchor="middle" fontSize="10.5" fill="#0046CC" fontWeight="700">EMV = {n(290000)}</text>
            {/* Chance node */}
            <circle cx="210" cy="65" r="28" fill="#B45309"/>
            <text x="210" y="69" textAnchor="middle" fontSize="10" fill="white" fontWeight="700">{tr('Vývoj trhu', 'Market')}</text>
            <text x="210" y="105" textAnchor="middle" fontSize="10.5" fill="#B45309" fontWeight="700">EMV = {n(290000)}</text>
            {/* Terminal nodes - from chance */}
            <rect x="370" y="12" width="130" height="36" rx="7" fill="#047857"/>
            <text x="435" y="32" textAnchor="middle" fontSize="10.5" fill="white" fontWeight="700">{tr('Zisk', 'Profit')}</text>
            <text x="435" y="44" textAnchor="middle" fontSize="10.5" fill="white">{money(500000)}</text>
            <rect x="370" y="82" width="130" height="36" rx="7" fill="#C8102E"/>
            <text x="435" y="102" textAnchor="middle" fontSize="10.5" fill="white" fontWeight="700">{tr('Ztráta', 'Loss')}</text>
            <text x="435" y="114" textAnchor="middle" fontSize="10.5" fill="white">−{money(200000)}</text>
            {/* Terminal - neinvestovat */}
            <rect x="180" y="177" width="140" height="36" rx="7" fill="#4A5875"/>
            <text x="250" y="196" textAnchor="middle" fontSize="10.5" fill="white" fontWeight="700">Status quo</text>
            <text x="250" y="208" textAnchor="middle" fontSize="10.5" fill="white">{money(50000)}</text>
            {/* EMV calculation annotation */}
            <rect x="370" y="160" width="240" height="80" rx="8" fill="#F5F7FA" stroke="#DDE3ED"/>
            <text x="380" y="178" fontSize="10.5" fill={MUTED} fontWeight="700">{tr('Zpětná indukce:', 'Backward induction:')}</text>
            <text x="380" y="194" fontSize="10" fill={MUTED}>{tr('EMV(trh)', 'EMV(market)')} = {tr('0,7', '0.7')}×{n(500000)} + {tr('0,3', '0.3')}×(−{n(200000)})</text>
            <text x="380" y="209" fontSize="10" fill={MUTED}>          = {n(350000)} − {n(60000)} = {money(290000)}</text>
            <text x="380" y="227" fontSize="10" fill="#0046CC" fontWeight="700">→ {tr('Investovat', 'Invest')} ({n(290000)} &gt; {n(50000)}) ✓</text>
          </svg>
        </div>
        <p className="dtt-caption">
          {tr(
            <>Zpětnou indukcí (fold-back) od listů k&nbsp;výstupu: EMV náhodového uzlu = 290&nbsp;000&nbsp;Kč &gt; 50&nbsp;000&nbsp;Kč (neinvestovat).
            Optimální rozhodnutí je investovat — modrá zvýrazněná cesta.</>,
            <>Backward induction (fold-back) from the leaves to the root: EMV of the chance node = CZK 290,000 &gt; CZK 50,000 (do not invest).
            The optimal decision is to invest — the highlighted blue path.</>,
          )}
        </p>
      </section>

      {/* STEPS */}
      <section className="dtt-card dtt-anim" style={{ '--delay': '0.3s' }}>
        <span className="dtt-badge">{tr('Postup', 'Procedure')}</span>
        <h3 className="dtt-h3">
          {tr('5 kroků sestavení stromu', '5 steps to build a tree')}{' '}
          <span className="dtt-h3-hint">— {tr('klikněte pro detail', 'click for details')}</span>
        </h3>
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
                <div className="dtt-step-title">{s.title[lang]}</div>
                {openStep===i && <p className="dtt-step-body">{s.body[lang]}</p>}
              </div>
              <div className={`dtt-step-chev${openStep===i?' dtt-step-chev--open':''}`} style={{ color: s.color }}>›</div>
            </button>
          ))}
        </div>
      </section>

    </div>
  );
}

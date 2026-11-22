import { useRef, useState, useMemo } from 'react';
import './DecisionTreeLab.css';
import { useLang } from '../../i18n/lang';

// ── Layout constants ───────────────────────────────────────
const DEPTH_W = 200;
const LEAF_H  = 86;
const TOP_M   = 44;
const LEFT_M  = 22;
const RIGHT_M = 90;
const NODE_W  = 134;
const NODE_H  = 42;
const CR      = 31; // chance circle radius

const INITIAL_TREE = {
  nodes: {
    n0: { type: 'decision', label: 'Rozhodnutí' },
    n1: { type: 'chance',   label: 'Vývoj trhu' },
    n2: { type: 'terminal', label: 'Zisk',       value:  500000 },
    n3: { type: 'terminal', label: 'Ztráta',     value: -200000 },
    n4: { type: 'terminal', label: 'Status quo', value:   50000 },
  },
  edges: [
    { id: 'e0', from: 'n0', to: 'n1', label: 'Investovat' },
    { id: 'e1', from: 'n0', to: 'n4', label: 'Neinvestovat' },
    { id: 'e2', from: 'n1', to: 'n2', label: 'Příznivý',   prob: 0.7 },
    { id: 'e3', from: 'n1', to: 'n3', label: 'Nepříznivý', prob: 0.3 },
  ],
  nextId: 5,
};

// Stejný ukázkový strom v angličtině (struktura i hodnoty shodné)
const INITIAL_TREE_EN = {
  ...INITIAL_TREE,
  nodes: {
    n0: { ...INITIAL_TREE.nodes.n0, label: 'Decision' },
    n1: { ...INITIAL_TREE.nodes.n1, label: 'Market' },
    n2: { ...INITIAL_TREE.nodes.n2, label: 'Profit' },
    n3: { ...INITIAL_TREE.nodes.n3, label: 'Loss' },
    n4: { ...INITIAL_TREE.nodes.n4, label: 'Status quo' },
  },
  edges: INITIAL_TREE.edges.map((e) => ({
    ...e,
    label: { e0: 'Invest', e1: 'Do not invest', e2: 'Favourable', e3: 'Unfavourable' }[e.id],
  })),
};
const initialTree = (lang) => (lang === 'en' ? INITIAL_TREE_EN : INITIAL_TREE);

// ── Pure helpers ───────────────────────────────────────────

function buildChildren(nodes, edges) {
  const ch = {};
  for (const id of Object.keys(nodes)) ch[id] = [];
  for (const e of edges) if (ch[e.from] !== undefined) ch[e.from].push(e.to);
  return ch;
}

function countLeaves(id, ch) {
  return ch[id].length === 0 ? 1 : ch[id].reduce((s, c) => s + countLeaves(c, ch), 0);
}

function findRoot(nodes, edges) {
  return Object.keys(nodes).find(id => !edges.some(e => e.to === id));
}

function computeLayout(nodes, edges) {
  const ch  = buildChildren(nodes, edges);
  const pos = {};

  function assign(id, depth, yStart) {
    const leaves = countLeaves(id, ch);
    pos[id] = { cx: LEFT_M + depth * DEPTH_W + NODE_W / 2, cy: yStart + (leaves * LEAF_H) / 2 };
    let yOff = yStart;
    for (const cid of ch[id]) { assign(cid, depth + 1, yOff); yOff += countLeaves(cid, ch) * LEAF_H; }
  }

  const root = findRoot(nodes, edges);
  if (!root) return { pos: {}, width: 400, height: 220, root: null };

  const totalLeaves = countLeaves(root, ch);
  assign(root, 0, TOP_M);

  let maxDepth = 0;
  for (const { cx } of Object.values(pos)) {
    const d = (cx - LEFT_M - NODE_W / 2) / DEPTH_W;
    if (d > maxDepth) maxDepth = d;
  }

  return {
    pos,
    width:  LEFT_M + (maxDepth + 1) * DEPTH_W - (DEPTH_W - NODE_W) + RIGHT_M,
    height: totalLeaves * LEAF_H + TOP_M * 2,
    root,
  };
}

function calcEMV(nodes, edges) {
  const ch = buildChildren(nodes, edges);
  const emv = {}, optimal = {};

  function fold(id) {
    const node = nodes[id];
    if (node.type === 'terminal') { emv[id] = node.value ?? 0; return emv[id]; }
    const kids = ch[id].map(cid => {
      const edge = edges.find(e => e.from === id && e.to === cid);
      return { cid, prob: edge?.prob ?? 0, val: fold(cid) };
    });
    if (node.type === 'chance') {
      emv[id] = kids.reduce((s, k) => s + k.prob * k.val, 0);
    } else {
      if (!kids.length) { emv[id] = 0; return 0; }
      const best = kids.reduce((b, k) => k.val > b.val ? k : b, kids[0]);
      emv[id] = best.val; optimal[id] = best.cid;
    }
    return emv[id];
  }
  const root = findRoot(nodes, edges);
  if (root) fold(root);
  return { emv, optimal };
}

function optimalEdgeSet(nodes, edges, optimal) {
  const set = new Set();
  function walk(id) {
    const node = nodes[id];
    if (node.type === 'decision') {
      const best = optimal[id];
      if (best) { const e = edges.find(e => e.from === id && e.to === best); if (e) { set.add(e.id); walk(best); } }
    } else if (node.type === 'chance') {
      edges.filter(e => e.from === id).forEach(e => { set.add(e.id); walk(e.to); });
    }
  }
  const root = findRoot(nodes, edges);
  if (root) walk(root);
  return set;
}

function removeSubtree(tree, nodeId) {
  const toRemove = new Set([nodeId]);
  function collect(id) {
    for (const e of tree.edges) if (e.from === id && !toRemove.has(e.to)) { toRemove.add(e.to); collect(e.to); }
  }
  collect(nodeId);
  const newNodes = { ...tree.nodes };
  for (const id of toRemove) delete newNodes[id];
  return { ...tree, nodes: newNodes, edges: tree.edges.filter(e => !toRemove.has(e.to) && !toRemove.has(e.from)) };
}

function edgePath(x1, y1, x2, y2) {
  const cx = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`;
}

function nodeExit(p, type)  { return type === 'chance' ? { x: p.cx + CR, y: p.cy } : { x: p.cx + NODE_W / 2, y: p.cy }; }
function nodeEnter(p, type) { return type === 'chance' ? { x: p.cx - CR, y: p.cy } : { x: p.cx - NODE_W / 2, y: p.cy }; }

function fmtVal(v, lang = 'cs') {
  if (v == null) return '—';
  const abs = Math.abs(v);
  if (lang === 'en') {
    if (abs >= 1e6) return `${(v / 1e6).toFixed(2)}M CZK`;
    if (abs >= 1e3) return `${(v / 1e3).toFixed(0)}k CZK`;
    return `${v} CZK`;
  }
  if (abs >= 1e6) return `${(v / 1e6).toFixed(2)} M Kč`;
  if (abs >= 1e3) return `${(v / 1e3).toFixed(0)} tis. Kč`;
  return `${v} Kč`;
}

// ── Component ──────────────────────────────────────────────

export default function DecisionTreeLab() {
  const { lang, tr } = useLang();
  const fmt = (v) => fmtVal(v, lang);
  const [tree, setTree]       = useState(() => initialTree(lang));
  // Neupravený ukázkový strom se přepne s jazykem; strom upravený studentem zůstane beze změny
  const [treeLang, setTreeLang] = useState(lang);
  if (treeLang !== lang) {
    setTreeLang(lang);
    if (tree === INITIAL_TREE || tree === INITIAL_TREE_EN) setTree(initialTree(lang));
  }
  const [sel, setSel]         = useState(null);
  const [selKind, setSelKind] = useState(null); // 'node' | 'edge'

  const layout   = useMemo(() => computeLayout(tree.nodes, tree.edges), [tree]);
  const emvData  = useMemo(() => calcEMV(tree.nodes, tree.edges), [tree]);
  const optEdges = useMemo(() => optimalEdgeSet(tree.nodes, tree.edges, emvData.optimal), [tree, emvData.optimal]);

  const probWarns = useMemo(() => {
    const warns = [];
    for (const [id, node] of Object.entries(tree.nodes)) {
      if (node.type !== 'chance') continue;
      const ces = tree.edges.filter(e => e.from === id);
      if (!ces.length) continue;
      const sum = ces.reduce((s, e) => s + (e.prob ?? 0), 0);
      if (Math.abs(sum - 1) > 0.005) warns.push({ id, label: node.label, sum: sum.toFixed(3) });
    }
    return warns;
  }, [tree]);

  const { pos, width, height, root } = layout;
  const svgW = Math.max(width, 400);
  const svgH = Math.max(height, 200);

  const selNode = selKind === 'node' ? tree.nodes[sel] : null;
  const selEdge = selKind === 'edge' ? tree.edges.find(e => e.id === sel) : null;
  const isRoot  = sel === root;

  const opener = useRef(null);
  function pick(id, kind, ev) { ev.stopPropagation(); opener.current = ev.currentTarget; setSel(id); setSelKind(kind); }
  function deselect() { setSel(null); setSelKind(null); }
  // Zavření popoveru vrátí focus na uzel/hranu, ze které se otevřel (ovládání klávesnicí)
  function closePopover() { deselect(); opener.current?.focus?.(); }
  // Uzly a hrany v SVG: Enter / mezerník = stejné jako kliknutí
  const keyPick = (id, kind) => (ev) => {
    if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); pick(id, kind, ev); }
  };
  const TYPE_NAMES = {
    decision: tr('Rozhodovací uzel', 'Decision node'),
    chance: tr('Náhodový uzel', 'Chance node'),
    terminal: tr('Terminální uzel', 'Terminal node'),
  };

  function updNode(id, patch) {
    setTree(t => ({ ...t, nodes: { ...t.nodes, [id]: { ...t.nodes[id], ...patch } } }));
  }
  function updEdge(id, patch) {
    setTree(t => ({ ...t, edges: t.edges.map(e => e.id === id ? { ...e, ...patch } : e) }));
  }

  function addBranch(parentId) {
    const parent = tree.nodes[parentId];
    if (parent.type === 'terminal') return;
    const nid = `n${tree.nextId}`, eid = `e${tree.nextId}`;
    setTree(t => ({
      ...t,
      nodes: { ...t.nodes, [nid]: { type: 'terminal', label: `${tr('Uzel', 'Node')} ${t.nextId}`, value: 0 } },
      edges: [...t.edges, {
        id: eid, from: parentId, to: nid, label: `${tr('Větev', 'Branch')} ${t.nextId}`,
        ...(parent.type === 'chance' ? { prob: 0.1 } : {}),
      }],
      nextId: t.nextId + 1,
    }));
    setSel(nid); setSelKind('node');
  }

  function delNode(id) { setTree(t => removeSubtree(t, id)); deselect(); }

  function convertType(id, newType) {
    setTree(t => {
      let nt = t;
      if (newType === 'terminal')
        for (const e of t.edges.filter(e2 => e2.from === id)) nt = removeSubtree(nt, e.to);
      if (newType === 'chance')
        nt = { ...nt, edges: nt.edges.map(e => e.from === id && e.prob == null ? { ...e, prob: 0.5 } : e) };
      if (newType === 'decision')
        nt = { ...nt, edges: nt.edges.map(e => { if (e.from !== id) return e; const rest = { ...e }; delete rest.prob; return rest; }) };
      return { ...nt, nodes: { ...nt.nodes, [id]: { ...nt.nodes[id], type: newType, ...(newType === 'terminal' ? { value: 0 } : {}) } } };
    });
  }

  // Popover position helpers (percentage of SVG dimensions → CSS %)
  function pctX(cx)  { return `${((cx  / svgW) * 100).toFixed(2)}%`; }
  function pctY(cy)  { return `${((cy  / svgH) * 100).toFixed(2)}%`; }
  // Show popover above node unless node is in top 35% of SVG
  function popoverTransform(cy) {
    return cy < svgH * 0.35
      ? 'translate(-50%, 10px)'                // below
      : 'translate(-50%, calc(-100% - 10px))'; // above
  }

  // Build edge midpoints for edge popovers
  function edgeMid(edge) {
    const fn = tree.nodes[edge.from], tn = tree.nodes[edge.to];
    const fp = pos[edge.from], tp = pos[edge.to];
    if (!fp || !tp) return null;
    const s = nodeExit(fp, fn.type), d = nodeEnter(tp, tn.type);
    return { mx: (s.x + d.x) / 2, my: (s.y + d.y) / 2 };
  }

  return (
    <div className="dtl-root" onClick={deselect}>

      {/* Toolbar */}
      <div className="dtl-toolbar">
        <span className="dtl-toolbar-title">{tr('Interaktivní stavba stromu', 'Interactive tree builder')}</span>
        <div className="dtl-toolbar-legend">
          <span className="dtl-legend-item"><span className="dtl-ldot dtl-ldot--dec" />{tr('Rozhodovací', 'Decision')} □</span>
          <span className="dtl-legend-item"><span className="dtl-ldot dtl-ldot--chance" />{tr('Náhodový', 'Chance')} ○</span>
          <span className="dtl-legend-item"><span className="dtl-ldot dtl-ldot--term" />{tr('Terminální', 'Terminal')}</span>
        </div>
        <button type="button" className="dtl-btn dtl-btn--ghost" onClick={() => { setTree(initialTree(lang)); deselect(); }}>↺ {tr('Obnovit', 'Reset')}</button>
      </div>

      {/* SVG tree with inline popovers */}
      <div className="dtl-card">
        <h2 className="dtl-step-tag"><span className="dtl-badge-n" aria-hidden="true">1</span>{tr('Strom', 'Tree')}</h2>
        <p className="dtl-hint" data-scroll-hint={tr(' Strom lze posouvat do stran.', ' The tree can be scrolled sideways.')}>{tr(
          'Uzel nebo větev upravíte kliknutím, případně klávesou Tab a Enter. Escape úpravu zavře.',
          'Edit a node or branch by clicking it, or with Tab and Enter. Escape closes the editor.',
        )}</p>

        {/* Aspect-ratio container so absolute popovers align with SVG nodes */}
        <div className="dtl-tree-scroll">
        <div
          className="dtl-tree-container"
          style={{ aspectRatio: `${svgW} / ${svgH}` }}
          onClick={deselect}
        >
          <svg
            viewBox={`0 0 ${svgW} ${svgH}`}
            className="dtl-svg"
          >
            {/* Edges */}
            {tree.edges.map(e => {
              const fn = tree.nodes[e.from], tn = tree.nodes[e.to];
              const fp = pos[e.from], tp = pos[e.to];
              if (!fp || !tp) return null;
              const s = nodeExit(fp, fn.type), d = nodeEnter(tp, tn.type);
              const isOpt = optEdges.has(e.id);
              const isSel = sel === e.id && selKind === 'edge';
              const path  = edgePath(s.x, s.y, d.x, d.y);
              const mx    = (s.x + d.x) / 2, my = (s.y + d.y) / 2;
              return (
                <g key={e.id} className="dtl-hit" role="button" tabIndex={0}
                  aria-label={tr(
                    `Větev ${e.label}${e.prob != null ? `, pravděpodobnost ${e.prob}` : ''}${isOpt ? ', optimální' : ''}. Upravit.`,
                    `Branch ${e.label}${e.prob != null ? `, probability ${e.prob}` : ''}${isOpt ? ', optimal' : ''}. Edit.`,
                  )}
                  onClick={ev => pick(e.id, 'edge', ev)} onKeyDown={keyPick(e.id, 'edge')} style={{ cursor: 'pointer' }}>
                  <path d={path} fill="none" stroke={isSel ? '#0057FF' : isOpt ? '#0057FF' : '#8A94A6'} strokeWidth={isSel ? 3.5 : isOpt ? 3 : 1.5} strokeDasharray={isOpt || isSel ? undefined : '5 4'} />
                  <path d={path} fill="none" stroke="transparent" strokeWidth={14} />
                  <text x={mx} y={my - 7} textAnchor="middle" fontSize="10" fill={isSel || isOpt ? '#0046CC' : '#4A5875'} fontWeight={isOpt ? '700' : '500'}>
                    {e.label}{e.prob != null ? ` (${e.prob})` : ''}
                  </text>
                </g>
              );
            })}

            {/* Nodes */}
            {Object.entries(tree.nodes).map(([id, node]) => {
              const p = pos[id];
              if (!p) return null;
              const isSel = sel === id && selKind === 'node';
              const ev_val = emvData.emv[id];

              if (node.type === 'chance') return (
                <g key={id} className="dtl-hit" role="button" tabIndex={0}
                  aria-label={`${TYPE_NAMES[node.type]} ${node.label}${node.type === 'terminal' ? `, ${tr('hodnota', 'value')} ${fmt(node.value)}` : ev_val != null ? `, EMV ${fmt(ev_val)}` : ''}. ${tr('Upravit', 'Edit')}.`}
                  onClick={ev => pick(id, 'node', ev)} onKeyDown={keyPick(id, 'node')} style={{ cursor: 'pointer' }}>
                  <circle cx={p.cx} cy={p.cy} r={CR + (isSel ? 3 : 0)}
                    fill={isSel ? '#FEF3C7' : '#FFFBEB'} stroke="#B45309" strokeWidth={isSel ? 2.5 : 1.5} />
                  <text x={p.cx} y={p.cy - 4} textAnchor="middle" fontSize="10" fill="#92400E" fontWeight="700">{node.label}</text>
                  {ev_val != null && <text x={p.cx} y={p.cy + 11} textAnchor="middle" fontSize="9.5" fill="#92400E" fontWeight="700">{fmt(ev_val)}</text>}
                </g>
              );

              if (node.type === 'terminal') {
                const pos_val = (node.value ?? 0) >= 0;
                return (
                  <g key={id} className="dtl-hit" role="button" tabIndex={0}
                  aria-label={`${TYPE_NAMES[node.type]} ${node.label}${node.type === 'terminal' ? `, ${tr('hodnota', 'value')} ${fmt(node.value)}` : ev_val != null ? `, EMV ${fmt(ev_val)}` : ''}. ${tr('Upravit', 'Edit')}.`}
                  onClick={ev => pick(id, 'node', ev)} onKeyDown={keyPick(id, 'node')} style={{ cursor: 'pointer' }}>
                    <rect x={p.cx - NODE_W / 2} y={p.cy - NODE_H / 2} width={NODE_W} height={NODE_H} rx={7}
                      fill={isSel ? (pos_val ? '#DCFCE7' : '#FEE2E2') : (pos_val ? '#ECFDF5' : '#FFF5F5')}
                      stroke={pos_val ? '#047857' : '#C8102E'} strokeWidth={isSel ? 2.5 : 1.5} />
                    <text x={p.cx} y={p.cy - 5} textAnchor="middle" fontSize="10" fill={pos_val ? '#065F46' : '#991B1B'} fontWeight="600">{node.label}</text>
                    <text x={p.cx} y={p.cy + 9} textAnchor="middle" fontSize="9.5" fill={pos_val ? '#047857' : '#C8102E'} fontWeight="700">{fmt(node.value)}</text>
                  </g>
                );
              }

              // decision
              return (
                <g key={id} className="dtl-hit" role="button" tabIndex={0}
                  aria-label={`${TYPE_NAMES[node.type]} ${node.label}${node.type === 'terminal' ? `, ${tr('hodnota', 'value')} ${fmt(node.value)}` : ev_val != null ? `, EMV ${fmt(ev_val)}` : ''}. ${tr('Upravit', 'Edit')}.`}
                  onClick={ev => pick(id, 'node', ev)} onKeyDown={keyPick(id, 'node')} style={{ cursor: 'pointer' }}>
                  <rect x={p.cx - NODE_W / 2} y={p.cy - NODE_H / 2} width={NODE_W} height={NODE_H} rx={7}
                    fill={isSel ? '#DBEAFE' : '#EFF6FF'} stroke={isSel ? '#0057FF' : '#5B8DEF'} strokeWidth={isSel ? 2.5 : 1.5} />
                  <text x={p.cx} y={p.cy - 5} textAnchor="middle" fontSize="10" fill="#1E40AF" fontWeight="700">{node.label}</text>
                  {ev_val != null && <text x={p.cx} y={p.cy + 9} textAnchor="middle" fontSize="9.5" fill="#0046CC" fontWeight="700">{fmt(ev_val)}</text>}
                </g>
              );
            })}
          </svg>

          {/* ── NODE POPOVER ── */}
          {selNode && pos[sel] && (
            <div
              className="dtl-popover"
              role="dialog" aria-label={`${tr('Úprava', 'Edit')}: ${selNode.label}`}
              style={{ left: pctX(pos[sel].cx), top: pctY(pos[sel].cy), transform: popoverTransform(pos[sel].cy) }}
              onClick={e => e.stopPropagation()}
              onKeyDown={e => { if (e.key === 'Escape') { e.stopPropagation(); closePopover(); } }}
            >
              <div className="dtl-popover-header">
                <span className="dtl-popover-icon" aria-hidden="true">
                  {selNode.type === 'decision' ? '□' : selNode.type === 'chance' ? '○' : '◼'}
                </span>
                <span className="dtl-popover-title">
                  {TYPE_NAMES[selNode.type]}
                </span>
                <button type="button" className="dtl-popover-close" aria-label={tr('Zavřít', 'Close')} onClick={closePopover}>✕</button>
              </div>

              <div className="dtl-popover-field">
                <label className="dtl-popover-label" htmlFor="dtl-node-name">{tr('Název', 'Name')}</label>
                <input id="dtl-node-name" className="dtl-popover-input" value={selNode.label} autoFocus
                  onChange={e => updNode(sel, { label: e.target.value })} />
              </div>

              {selNode.type === 'terminal' && (
                <div className="dtl-popover-field">
                  <label className="dtl-popover-label" htmlFor="dtl-node-value">{tr('Hodnota (Kč)', 'Value (CZK)')}</label>
                  <input id="dtl-node-value" type="number" className="dtl-popover-input dtl-popover-input--mono"
                    value={selNode.value ?? 0}
                    onChange={e => updNode(sel, { value: Number(e.target.value) })} />
                </div>
              )}

              {!isRoot && (
                <div className="dtl-popover-types" role="group" aria-label="Typ uzlu">
                  {[['decision', '□', tr('Rozh.', 'Decision')], ['chance', '○', tr('Náhoda', 'Chance')], ['terminal', '◼', tr('Terminál', 'Terminal')]].map(([t, icon, label]) => (
                    <button type="button" key={t}
                      className={`dtl-chip dtl-chip--${t}${selNode.type === t ? ' dtl-chip--active' : ''}`}
                      aria-pressed={selNode.type === t}
                      onClick={() => convertType(sel, t)}>
                      {icon} {label}
                    </button>
                  ))}
                </div>
              )}

              <div className="dtl-popover-actions">
                {selNode.type !== 'terminal' && (
                  <button type="button" className="dtl-btn dtl-btn--primary dtl-btn--sm" onClick={() => addBranch(sel)}>+ {tr('Větev', 'Branch')}</button>
                )}
                {!isRoot && (
                  <button type="button" className="dtl-btn dtl-btn--danger dtl-btn--sm" onClick={() => delNode(sel)}>{tr('Odstranit', 'Delete')}</button>
                )}
              </div>
            </div>
          )}

          {/* ── EDGE POPOVER ── */}
          {selEdge && (() => {
            const mid = edgeMid(selEdge);
            if (!mid) return null;
            return (
              <div
                className="dtl-popover dtl-popover--edge"
                role="dialog" aria-label={`${tr('Úprava větve', 'Edit branch')} ${selEdge.label}`}
                style={{ left: pctX(mid.mx), top: pctY(mid.my), transform: popoverTransform(mid.my) }}
                onClick={e => e.stopPropagation()}
                onKeyDown={e => { if (e.key === 'Escape') { e.stopPropagation(); closePopover(); } }}
              >
                <div className="dtl-popover-header">
                  <span className="dtl-popover-title">{tr('Hrana / větev', 'Edge / branch')}</span>
                  <button type="button" className="dtl-popover-close" aria-label={tr('Zavřít', 'Close')} onClick={closePopover}>✕</button>
                </div>

                <div className="dtl-popover-field">
                  <label className="dtl-popover-label" htmlFor="dtl-edge-name">{tr('Název větve', 'Branch name')}</label>
                  <input id="dtl-edge-name" className="dtl-popover-input" value={selEdge.label} autoFocus
                    onChange={e => updEdge(sel, { label: e.target.value })} />
                </div>

                {selEdge.prob != null && (
                  <div className="dtl-popover-field">
                    <label className="dtl-popover-label" htmlFor="dtl-edge-prob">{tr('Pravděpodobnost (0–1)', 'Probability (0–1)')}</label>
                    <input id="dtl-edge-prob" type="number" min={0} max={1} step={0.05} className="dtl-popover-input dtl-popover-input--mono"
                      value={selEdge.prob}
                      onChange={e => updEdge(sel, { prob: Number(e.target.value) })} />
                  </div>
                )}
              </div>
            );
          })()}
        </div>
        </div>
      </div>

      {/* Warnings */}
      {probWarns.length > 0 && (
        <div className="dtl-card dtl-warn-panel" role="alert">
          {probWarns.map((w, i) => (
            <div key={i} className="dtl-warn-item">
              ⚠ {tr('Uzel', 'Node')} „{w.label}“: {tr('součet pravděpodobností', 'sum of probabilities')} = <strong>{w.sum}</strong> ({tr('musí být 1.00', 'must be 1.00')})
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      <div className="dtl-card">
        <h2 className="dtl-step-tag"><span className="dtl-badge-n" aria-hidden="true">2</span>{tr('Výsledek zpětné indukce (fold-back)', 'Backward induction result (fold-back)')}</h2>
        <div className="dtl-results-grid">
          {root && emvData.emv[root] != null && (
            <div className="dtl-result-item dtl-result-item--primary">
              <span className="dtl-result-label">{tr('EMV kořene', 'Root EMV')}</span>
              <span className="dtl-result-val">{fmt(emvData.emv[root])}</span>
            </div>
          )}
          {Object.entries(tree.nodes).filter(([, n]) => n.type === 'decision').map(([id, node]) => {
            const bestCid  = emvData.optimal[id];
            const bestEdge = tree.edges.find(e => e.from === id && e.to === bestCid);
            if (!bestEdge) return null;
            return (
              <div key={id} className="dtl-result-item">
                <span className="dtl-result-label">{node.label}</span>
                <span className="dtl-result-val dtl-result-val--dec">→ {bestEdge.label} ({fmt(emvData.emv[bestCid])})</span>
              </div>
            );
          })}
        </div>
        {probWarns.length === 0 && root && (
          <div className="dtl-result-note">
            {tr(
              'Plná modrá cesta označuje optimální akci v každém rozhodovacím uzlu (maximalizace EMV), ostatní větve jsou přerušované.',
              'The solid blue path marks the optimal action at each decision node (EMV maximisation); other branches are dashed.',
            )}
          </div>
        )}
      </div>

    </div>
  );
}

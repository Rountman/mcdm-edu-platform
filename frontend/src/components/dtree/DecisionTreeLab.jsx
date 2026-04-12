import { useState, useMemo } from 'react';
import './DecisionTreeLab.css';

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

function fmtVal(v) {
  if (v == null) return '—';
  const abs = Math.abs(v);
  if (abs >= 1e6) return `${(v / 1e6).toFixed(2)} M Kč`;
  if (abs >= 1e3) return `${(v / 1e3).toFixed(0)} tis. Kč`;
  return `${v} Kč`;
}

// ── Component ──────────────────────────────────────────────

export default function DecisionTreeLab() {
  const [tree, setTree]       = useState(INITIAL_TREE);
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

  function pick(id, kind, ev) { ev.stopPropagation(); setSel(id); setSelKind(kind); }
  function deselect() { setSel(null); setSelKind(null); }

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
      nodes: { ...t.nodes, [nid]: { type: 'terminal', label: `Uzel ${t.nextId}`, value: 0 } },
      edges: [...t.edges, {
        id: eid, from: parentId, to: nid, label: `Větev ${t.nextId}`,
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
        nt = { ...nt, edges: nt.edges.map(e => { if (e.from !== id) return e; const { prob, ...rest } = e; return rest; }) };
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
        <span className="dtl-toolbar-title">Rozhodovací strom — interaktivní stavba</span>
        <div className="dtl-toolbar-legend">
          <span className="dtl-legend-item"><span className="dtl-ldot dtl-ldot--dec" />Rozhodovací □</span>
          <span className="dtl-legend-item"><span className="dtl-ldot dtl-ldot--chance" />Náhodový ○</span>
          <span className="dtl-legend-item"><span className="dtl-ldot dtl-ldot--term" />Terminální</span>
        </div>
        <button type="button" className="dtl-btn dtl-btn--ghost" onClick={() => { setTree(INITIAL_TREE); deselect(); }}>↺ Reset</button>
      </div>

      {/* SVG tree with inline popovers */}
      <div className="dtl-card">
        <div className="dtl-step-tag"><span className="dtl-badge-n">1</span>Strom — klikněte na uzel nebo hranu pro editaci</div>

        {/* Aspect-ratio container so absolute popovers align with SVG nodes */}
        <div
          className="dtl-tree-container"
          style={{ paddingBottom: `${((svgH / svgW) * 100).toFixed(1)}%` }}
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
                <g key={e.id} onClick={ev => pick(e.id, 'edge', ev)} style={{ cursor: 'pointer' }}>
                  <path d={path} fill="none" stroke={isSel ? '#0057FF' : isOpt ? '#4D88FF' : '#DDE3ED'} strokeWidth={isSel ? 3 : isOpt ? 2.5 : 1.5} />
                  <path d={path} fill="none" stroke="transparent" strokeWidth={14} />
                  <text x={mx} y={my - 7} textAnchor="middle" fontSize="9" fill={isSel ? '#0057FF' : isOpt ? '#0057FF' : '#8896AE'} fontWeight={isOpt ? '700' : '400'}>
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
                <g key={id} onClick={ev => pick(id, 'node', ev)} style={{ cursor: 'pointer' }}>
                  <circle cx={p.cx} cy={p.cy} r={CR + (isSel ? 3 : 0)}
                    fill={isSel ? '#FEF3C7' : '#FFFBEB'} stroke="#F59E0B" strokeWidth={isSel ? 2.5 : 1.5} />
                  <text x={p.cx} y={p.cy - 4} textAnchor="middle" fontSize="9.5" fill="#92400E" fontWeight="700">{node.label}</text>
                  {ev_val != null && <text x={p.cx} y={p.cy + 11} textAnchor="middle" fontSize="8.5" fill="#F59E0B" fontWeight="700">{fmtVal(ev_val)}</text>}
                </g>
              );

              if (node.type === 'terminal') {
                const pos_val = (node.value ?? 0) >= 0;
                return (
                  <g key={id} onClick={ev => pick(id, 'node', ev)} style={{ cursor: 'pointer' }}>
                    <rect x={p.cx - NODE_W / 2} y={p.cy - NODE_H / 2} width={NODE_W} height={NODE_H} rx={7}
                      fill={isSel ? (pos_val ? '#DCFCE7' : '#FEE2E2') : (pos_val ? '#ECFDF5' : '#FFF5F5')}
                      stroke={pos_val ? '#34D399' : '#FCA5A5'} strokeWidth={isSel ? 2.5 : 1.5} />
                    <text x={p.cx} y={p.cy - 5} textAnchor="middle" fontSize="9.5" fill={pos_val ? '#065F46' : '#991B1B'} fontWeight="600">{node.label}</text>
                    <text x={p.cx} y={p.cy + 9} textAnchor="middle" fontSize="9" fill={pos_val ? '#059669' : '#FF3B5C'} fontWeight="700">{fmtVal(node.value)}</text>
                  </g>
                );
              }

              // decision
              return (
                <g key={id} onClick={ev => pick(id, 'node', ev)} style={{ cursor: 'pointer' }}>
                  <rect x={p.cx - NODE_W / 2} y={p.cy - NODE_H / 2} width={NODE_W} height={NODE_H} rx={7}
                    fill={isSel ? '#DBEAFE' : '#EFF6FF'} stroke={isSel ? '#0057FF' : '#93C5FD'} strokeWidth={isSel ? 2.5 : 1.5} />
                  <text x={p.cx} y={p.cy - 5} textAnchor="middle" fontSize="9.5" fill="#1E40AF" fontWeight="700">{node.label}</text>
                  {ev_val != null && <text x={p.cx} y={p.cy + 9} textAnchor="middle" fontSize="8.5" fill="#0057FF" fontWeight="700">{fmtVal(ev_val)}</text>}
                </g>
              );
            })}
          </svg>

          {/* ── NODE POPOVER ── */}
          {selNode && pos[sel] && (
            <div
              className="dtl-popover"
              style={{ left: pctX(pos[sel].cx), top: pctY(pos[sel].cy), transform: popoverTransform(pos[sel].cy) }}
              onClick={e => e.stopPropagation()}
            >
              <div className="dtl-popover-header">
                <span className="dtl-popover-icon">
                  {selNode.type === 'decision' ? '□' : selNode.type === 'chance' ? '○' : '◼'}
                </span>
                <span className="dtl-popover-title">
                  {selNode.type === 'decision' ? 'Rozhodovací uzel' : selNode.type === 'chance' ? 'Náhodový uzel' : 'Terminální uzel'}
                </span>
                <button type="button" className="dtl-popover-close" onClick={deselect}>✕</button>
              </div>

              <div className="dtl-popover-field">
                <div className="dtl-popover-label">Název</div>
                <input className="dtl-popover-input" value={selNode.label}
                  onChange={e => updNode(sel, { label: e.target.value })}
                  onKeyDown={e => e.key === 'Escape' && deselect()} />
              </div>

              {selNode.type === 'terminal' && (
                <div className="dtl-popover-field">
                  <div className="dtl-popover-label">Hodnota (Kč)</div>
                  <input type="number" className="dtl-popover-input dtl-popover-input--mono"
                    value={selNode.value ?? 0}
                    onChange={e => updNode(sel, { value: Number(e.target.value) })} />
                </div>
              )}

              {!isRoot && (
                <div className="dtl-popover-types">
                  {[['decision', '□', 'Rozh.'], ['chance', '○', 'Náhoda'], ['terminal', '◼', 'Terminál']].map(([t, icon, label]) => (
                    <button type="button" key={t}
                      className={`dtl-chip dtl-chip--${t}${selNode.type === t ? ' dtl-chip--active' : ''}`}
                      onClick={() => convertType(sel, t)}>
                      {icon} {label}
                    </button>
                  ))}
                </div>
              )}

              <div className="dtl-popover-actions">
                {selNode.type !== 'terminal' && (
                  <button type="button" className="dtl-btn dtl-btn--primary dtl-btn--sm" onClick={() => addBranch(sel)}>+ Větev</button>
                )}
                {!isRoot && (
                  <button type="button" className="dtl-btn dtl-btn--danger dtl-btn--sm" onClick={() => delNode(sel)}>Odstranit</button>
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
                style={{ left: pctX(mid.mx), top: pctY(mid.my), transform: popoverTransform(mid.my) }}
                onClick={e => e.stopPropagation()}
              >
                <div className="dtl-popover-header">
                  <span className="dtl-popover-title">Hrana / větev</span>
                  <button type="button" className="dtl-popover-close" onClick={deselect}>✕</button>
                </div>

                <div className="dtl-popover-field">
                  <div className="dtl-popover-label">Název větve</div>
                  <input className="dtl-popover-input" value={selEdge.label}
                    onChange={e => updEdge(sel, { label: e.target.value })} />
                </div>

                {selEdge.prob != null && (
                  <div className="dtl-popover-field">
                    <div className="dtl-popover-label">Pravděpodobnost (0–1)</div>
                    <input type="number" min={0} max={1} step={0.05} className="dtl-popover-input dtl-popover-input--mono"
                      value={selEdge.prob}
                      onChange={e => updEdge(sel, { prob: Number(e.target.value) })} />
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Warnings */}
      {probWarns.length > 0 && (
        <div className="dtl-card dtl-warn-panel">
          {probWarns.map((w, i) => (
            <div key={i} className="dtl-warn-item">
              ⚠ Uzel „{w.label}": součet pravděpodobností = <strong>{w.sum}</strong> (musí být 1.00)
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      <div className="dtl-card">
        <div className="dtl-step-tag"><span className="dtl-badge-n">2</span>Výsledek zpětné indukce (fold-back)</div>
        <div className="dtl-results-grid">
          {root && emvData.emv[root] != null && (
            <div className="dtl-result-item dtl-result-item--primary">
              <span className="dtl-result-label">EMV kořene</span>
              <span className="dtl-result-val">{fmtVal(emvData.emv[root])}</span>
            </div>
          )}
          {Object.entries(tree.nodes).filter(([, n]) => n.type === 'decision').map(([id, node]) => {
            const bestCid  = emvData.optimal[id];
            const bestEdge = tree.edges.find(e => e.from === id && e.to === bestCid);
            if (!bestEdge) return null;
            return (
              <div key={id} className="dtl-result-item">
                <span className="dtl-result-label">{node.label}</span>
                <span className="dtl-result-val dtl-result-val--dec">→ {bestEdge.label} ({fmtVal(emvData.emv[bestCid])})</span>
              </div>
            );
          })}
        </div>
        {probWarns.length === 0 && root && (
          <div className="dtl-result-note">
            Modrá cesta označuje optimální akci v každém rozhodovacím uzlu (maximalizace EMV).
          </div>
        )}
      </div>

    </div>
  );
}

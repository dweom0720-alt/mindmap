'use strict';
/* =========================================================
   마인드맵 — 1단계: 편집 + 기기 저장
   ========================================================= */

const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const SANS = "'IBM Plex Sans KR', system-ui, sans-serif";
const SERIF = "'Noto Serif KR', 'IBM Plex Sans KR', serif";

/* ---------- 테마 ---------- */
const THEMES = {
  business: {
    name: '비즈니스', bg: '#F1F2F5', ink: '#13203A', ink2: '#3A4560', muted: '#5A6478', surface: '#FFFFFF', line: '#DCDFE6',
    root: '#13274A', rootInk: '#FFFFFF', gold: '#B8923A', goldText: '#8F6B1F', header: '#13274A', headerInk: '#FFFFFF',
    headerMuted: '#B9C3D6', headerGold: '#D9BC72', sel: 'rgba(184,146,58,.20)', fab: '#13274A', fabInk: '#D9BC72', shadow: 'rgba(19,39,74,.14)',
    branches: ['#13274A', '#1F5E5B', '#7A2E3A', '#8F6B1F', '#4E3A6B', '#4A5466'],
  },
  dark: {
    name: '다크', bg: '#0B1526', ink: '#EDEFF4', ink2: '#C3CADA', muted: '#9AA6BD', surface: '#13213A', line: '#22314D',
    root: '#13213A', rootInk: '#EDEFF4', gold: '#D9BC72', goldText: '#D9BC72', header: '#13213A', headerInk: '#EDEFF4',
    headerMuted: '#9AA6BD', headerGold: '#D9BC72', sel: 'rgba(217,188,114,.20)', fab: '#D9BC72', fabInk: '#0B1526', shadow: 'rgba(0,0,0,.4)',
    branches: ['#D9BC72', '#8FC1BC', '#E09AA5', '#9FB6E6', '#C2ACE6', '#B4BECF'],
  },
  light: {
    name: '라이트', bg: '#FAFAFB', ink: '#1B1E28', ink2: '#3D4250', muted: '#5B6170', surface: '#FFFFFF', line: '#E3E5EA',
    root: '#1B1E28', rootInk: '#FFFFFF', gold: '#2F5FD0', goldText: '#2F5FD0', header: '#1B1E28', headerInk: '#FFFFFF',
    headerMuted: '#B5BAC6', headerGold: '#8FB0FF', sel: 'rgba(47,95,208,.14)', fab: '#1B1E28', fabInk: '#FFFFFF', shadow: 'rgba(27,30,40,.12)',
    branches: ['#2F5FD0', '#C45A1C', '#1E7A5F', '#7247C9', '#C23B4A', '#0E7C86'],
  },
  pastel: {
    name: '파스텔', bg: '#FBF7F4', ink: '#3A3340', ink2: '#544A5C', muted: '#786E80', surface: '#FFFFFF', line: '#EADFE3',
    root: '#5B4B6B', rootInk: '#FFFFFF', gold: '#C97B8E', goldText: '#A4566A', header: '#5B4B6B', headerInk: '#FFFFFF',
    headerMuted: '#D9CDE0', headerGold: '#F2C6D0', sel: 'rgba(201,123,142,.18)', fab: '#5B4B6B', fabInk: '#F2C6D0', shadow: 'rgba(91,75,107,.14)',
    branches: ['#B5607A', '#4F84AE', '#4E9068', '#B07A2E', '#7B63AE', '#3E8F8F'],
  },
};
const ICONS = ['⭐', '🚩', '❗', '✅', '💡', '📅', '👤', '💰', '🎯', '🔥', '📌', '❓'];
const CATS = ['업무', '개인', '공부'];
const LAYOUT_NAMES = { radial: '방사형', tree: '트리', org: '조직도', free: '자유 배치' };

const settings = loadJSON('mm.settings', { theme: 'auto' });
let T = THEMES.business;
const darkMQ = window.matchMedia('(prefers-color-scheme: dark)');

function themeKey() {
  if (settings.theme === 'auto') return darkMQ.matches ? 'dark' : 'business';
  return THEMES[settings.theme] ? settings.theme : 'business';
}
function applyTheme() {
  T = THEMES[themeKey()];
  const r = document.documentElement.style;
  for (const k of ['bg', 'ink', 'ink2', 'muted', 'surface', 'line', 'root', 'rootInk', 'gold', 'goldText', 'header', 'headerInk', 'headerMuted', 'headerGold', 'sel', 'fab', 'fabInk', 'shadow']) r.setProperty('--' + k, T[k]);
  $('meta[name=theme-color]').setAttribute('content', state.view === 'editor' ? T.bg : T.header);
  if (state.view === 'editor') render(); else renderHome();
}
darkMQ.addEventListener?.('change', () => settings.theme === 'auto' && applyTheme());

/* ---------- 저장소 ---------- */
function loadJSON(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch (e) { return d; } }
function saveJSON(k, v) {
  try { localStorage.setItem(k, JSON.stringify(v)); return true; }
  catch (e) { toast('저장 공간이 부족합니다. 오래된 맵을 정리해 주세요.'); return false; }
}
const store = {
  index() { return loadJSON('mm.index', []); },
  get(id) { return loadJSON('mm.map.' + id, null); },
  put(map) {
    map.updated = Date.now();
    if (!saveJSON('mm.map.' + map.id, map)) return;
    const idx = store.index().filter((m) => m.id !== map.id);
    idx.unshift({ id: map.id, title: map.root.text || '제목 없음', category: map.category || '', updated: map.updated, count: countNodes(map.root) - 1, search: flatText(map.root) });
    saveJSON('mm.index', idx);
  },
  del(id) { localStorage.removeItem('mm.map.' + id); saveJSON('mm.index', store.index().filter((m) => m.id !== id)); },
};
function countNodes(n) { return 1 + (n.children || []).reduce((s, c) => s + countNodes(c), 0); }
function flatText(n) { return [n.text, n.note || '', ...(n.children || []).map(flatText)].join(' ').toLowerCase().slice(0, 4000); }

function newNode(text = '') { return { id: uid(), text, children: [] }; }
function newMap(title = '새 마인드맵') {
  return { id: uid(), category: '', layout: 'radial', updated: Date.now(), root: newNode(title) };
}
function sampleMap() {
  const m = newMap('마인드맵 사용법');
  const mk = (t, kids = [], extra = {}) => Object.assign(newNode(t), { children: kids.map((k) => (typeof k === 'string' ? newNode(k) : k)) }, extra);
  m.root.children = [
    mk('가지 만들기', ['아래 + 버튼 누르기', '가지 누르고 하위·형제', 'PC: Tab 하위, Enter 형제']),
    mk('글 고치기', ['가지를 두 번 누르기', 'PC: 바로 타이핑']),
    mk('옮기기', ['가지를 끌어 다른 가지에 놓기', '두 손가락으로 확대·축소'], {}),
    mk('꾸미기', [mk('색상·아이콘·메모', [], { icon: '💡' }), mk('할 일 체크', [], { done: true })]),
  ];
  return m;
}
function findNode(root, id, parent = null) {
  if (root.id === id) return { node: root, parent };
  for (const c of root.children) { const r = findNode(c, id, root); if (r) return r; }
  return null;
}
function isDescendant(node, id) { return node.children.some((c) => c.id === id || isDescendant(c, id)); }

/* ---------- 상태 ---------- */
const state = {
  view: 'home', map: null, sel: null, L: new Map(),
  vp: { x: 0, y: 0, k: 1 }, undo: [], redo: [],
  editing: null, drag: null, dropTarget: null, cat: '전체', query: '',
};

/* ---------- 글자 측정 ---------- */
const mctx = document.createElement('canvas').getContext('2d');
const mcache = new Map();
function tw(text, font) {
  const key = font + '|' + text;
  if (mcache.has(key)) return mcache.get(key);
  mctx.font = font; const w = mctx.measureText(text).width; mcache.set(key, w); return w;
}

/* =========================================================
   배치 계산
   ========================================================= */
function fontFor(depth, layout) {
  if (depth === 0) return { font: `700 18px ${SERIF}`, size: 18, lh: 26, weight: 700 };
  if (depth === 1) return { font: `700 ${layout === 'org' ? 15 : 16}px ${SANS}`, size: layout === 'org' ? 15 : 16, lh: 22, weight: 700 };
  return { font: `400 14px ${SANS}`, size: 14, lh: 20, weight: 400 };
}
const NUM_FONT = `600 11px ${SANS}`;

function computeLayout(map) {
  const L = new Map();
  const layout = map.layout;
  // 1) 트리 순회 + 측정
  (function walk(n, depth, parent, color, idx) {
    const e = { id: n.id, n, depth, parent, kids: [], idx };
    if (depth === 1) e.color = T.branches[(n.color ?? idx) % T.branches.length];
    else if (depth > 1) e.color = n.color != null ? T.branches[n.color % T.branches.length] : color;
    else e.color = T.root;
    e.style = depth === 0 ? 'root' : layout === 'org' ? (depth === 1 ? 'card' : 'plain') : 'line';
    const f = fontFor(depth, layout);
    e.f = f;
    e.lines = (n.text || '').split('\n');
    if (!n.text) e.lines = ['　'];
    const textW = Math.max(...e.lines.map((l) => tw(l || ' ', f.font)));
    let extra = 0;
    if (depth > 0 && n.done !== undefined) extra += 22;
    if (n.icon) extra += 24;
    if (depth === 1) { e.num = String(idx + 1).padStart(2, '0'); extra += tw(e.num, NUM_FONT) + 6; }
    if (n.note) extra += 18;
    if (n.link) extra += 18;
    e.textW = textW; e.contentW = textW + extra;
    const lines = e.lines.length;
    if (e.style === 'root') { e.w = Math.max(e.contentW + 48, 130); e.h = Math.max(lines * f.lh + 34, 62); }
    else if (e.style === 'line') { e.w = e.contentW + 10; e.h = lines * f.lh + 12; }
    else if (e.style === 'card') { e.w = Math.max(e.contentW + 30, 132); e.h = lines * f.lh + 26; }
    else { e.w = e.contentW + 22; e.h = lines * f.lh + 8; }
    L.set(n.id, e);
    if (parent) L.get(parent).kids.push(e);
    if (!n.collapsed) n.children.forEach((c, i) => walk(c, depth + 1, n.id, e.color, i));
  })(map.root, 0, null, null, 0);

  const root = L.get(map.root.id);
  const lay = layout === 'free' ? 'radial' : layout;
  if (lay === 'org') layoutOrg(root); else layoutTreeish(root, lay);

  if (layout === 'free') {
    // 저장된 위치 우선, 없으면 자동 배치 결과 사용
    for (const e of L.values()) {
      if (e.n.fx == null) { e.n.fx = Math.round(e.x); e.n.fy = Math.round(e.y); }
      e.x = e.n.fx; e.y = e.n.fy;
    }
    for (const e of L.values()) {
      if (!e.parent) { e.dir = 1; continue; }
      const p = L.get(e.parent);
      e.dir = e.x + e.w / 2 >= p.x + p.w / 2 ? 1 : -1;
    }
  }
  return L;
}

function subH(e) {
  const g = gapY(e.depth);
  const t = e.kids.reduce((s, k) => s + subH(k), 0) + g * Math.max(0, e.kids.length - 1);
  e.sub = Math.max(e.h, t);
  return e.sub;
}
function gapY(d) { return d === 0 ? 26 : d === 1 ? 12 : 8; }
function gapX(d) { return d === 0 ? 70 : 36; }
function placeTree(e, x, yTop, dir) {
  e.dir = dir;
  e.x = dir > 0 ? x : x - e.w;
  e.y = yTop + (e.sub - e.h) / 2;
  const total = e.kids.reduce((s, k) => s + k.sub, 0) + gapY(e.depth) * Math.max(0, e.kids.length - 1);
  let cy = yTop + (e.sub - total) / 2;
  const cx = dir > 0 ? e.x + e.w + gapX(e.depth) : e.x - gapX(e.depth);
  for (const k of e.kids) { placeTree(k, cx, cy, dir); cy += k.sub + gapY(e.depth); }
}
function layoutTreeish(root, lay) {
  root.kids.forEach(subH);
  root.x = -root.w / 2; root.y = -root.h / 2; root.dir = 1;
  let R = [], Lf = [];
  if (lay === 'tree') R = root.kids;
  else {
    let hR = 0, hL = 0;
    for (const k of root.kids) {
      const side = k.n.side || (hR <= hL ? 'R' : 'L');
      if (side === 'R') { R.push(k); hR += k.sub + 26; } else { Lf.push(k); hL += k.sub + 26; }
    }
  }
  const tot = (arr) => arr.reduce((s, k) => s + k.sub, 0) + gapY(0) * Math.max(0, arr.length - 1);
  let y = -tot(R) / 2;
  for (const k of R) { placeTree(k, root.x + root.w + gapX(0), y, 1); y += k.sub + gapY(0); }
  y = -tot(Lf) / 2;
  for (const k of Lf) { placeTree(k, root.x - gapX(0), y, -1); y += k.sub + gapY(0); }
}
function listSize(e) {
  e.lw = e.w; e.lh = e.h;
  for (const c of e.kids) { listSize(c); e.lw = Math.max(e.lw, 20 + c.lw); e.lh += 8 + c.lh; }
}
function placeList(e, x, y) {
  e.x = x; e.y = y; e.dir = 1;
  let cy = y + e.h + 8;
  for (const c of e.kids) { placeList(c, x + 20, cy); cy += c.lh + 8; }
}
function layoutOrg(root) {
  root.kids.forEach(listSize);
  root.x = -root.w / 2; root.y = 0; root.dir = 1;
  const total = root.kids.reduce((s, k) => s + k.lw, 0) + 28 * Math.max(0, root.kids.length - 1);
  let x = -total / 2;
  for (const k of root.kids) { placeList(k, x, root.h + 64); x += k.lw + 28; }
}

/* =========================================================
   그리기
   ========================================================= */
function edgeSVG(L, layout) {
  let out = '';
  const root = [...L.values()].find((e) => e.depth === 0);
  if (layout === 'org') {
    const kids = root.kids;
    if (kids.length) {
      const rx = root.x + root.w / 2, ry = root.y + root.h, by = ry + 30;
      const xs = kids.map((k) => k.x + k.w / 2);
      out += `<path d="M${rx},${ry} V${by} M${Math.min(...xs, rx)},${by} H${Math.max(...xs, rx)}" stroke="${T.muted}" stroke-width="2" fill="none" opacity=".6"/>`;
      for (const k of kids) out += `<path d="M${k.x + k.w / 2},${by} V${k.y}" stroke="${k.color}" stroke-width="2.5" fill="none"/>`;
    }
    for (const e of L.values()) {
      if (e.depth < 1) continue;
      for (const c of e.kids) {
        const x0 = e.x + 9, y0 = e.y + e.h, cy = c.y + c.h / 2;
        out += `<path d="M${x0},${y0} V${cy} H${c.x}" stroke="${c.color}" stroke-width="1.5" fill="none" opacity=".55"/>`;
      }
    }
    return out;
  }
  for (const e of L.values()) {
    for (const c of e.kids) {
      const p = outAnchor(e, c), q = inAnchor(c);
      if (e.depth === 0) {
        const px = p.x - c.dir * 14, w0 = 6.5, w1 = 1.5, mx = (px + q.x) / 2;
        out += `<path d="M${px},${p.y - w0} C${mx},${p.y - w0} ${mx},${q.y - w1} ${q.x},${q.y - w1} L${q.x},${q.y + w1} C${mx},${q.y + w1} ${mx},${p.y + w0} ${px},${p.y + w0} Z" fill="${c.color}"/>`;
      } else {
        const mx = (p.x + q.x) / 2;
        out += `<path d="M${p.x},${p.y} C${mx},${p.y} ${mx},${q.y} ${q.x},${q.y}" stroke="${c.color}" stroke-width="${c.depth === 2 ? 2 : 1.5}" fill="none" opacity=".75"/>`;
      }
    }
  }
  return out;
}
function outAnchor(e, child) {
  if (e.depth === 0) return { x: child.dir > 0 ? e.x + e.w : e.x, y: e.y + e.h / 2 };
  return { x: e.dir > 0 ? e.x + e.w : e.x, y: e.y + e.h };
}
function inAnchor(c) { return { x: c.dir > 0 ? c.x : c.x + c.w, y: c.y + c.h }; }

function nodeSVG(e, L, layout) {
  const n = e.n, sel = state.sel === e.id, f = e.f;
  const isDrag = state.drag && state.drag.mode === 'ghost' && (state.drag.id === e.id || state.drag.desc.has(e.id));
  let s = `<g data-id="${e.id}" class="hit"${isDrag ? ' opacity=".3"' : ''}>`;
  s += `<rect x="${e.x - 4}" y="${e.y - 4}" width="${e.w + 8}" height="${e.h + 8}" fill="transparent"/>`;
  if (state.dropTarget === e.id) s += `<rect x="${e.x - 6}" y="${e.y - 6}" width="${e.w + 12}" height="${e.h + 12}" rx="10" fill="${T.sel}" stroke="${T.gold}" stroke-width="2" stroke-dasharray="5 4"/>`;
  const textColor = e.depth === 1 ? e.color : e.style === 'root' ? T.rootInk : T.ink2;
  const done = n.done === true;

  if (e.style === 'root') {
    s += `<rect x="${e.x}" y="${e.y}" width="${e.w}" height="${e.h}" rx="12" fill="${T.root}" ${T === THEMES.dark ? `stroke="${T.line}"` : ''}/>`;
    s += `<rect x="${e.x + 6}" y="${e.y + 6}" width="${e.w - 12}" height="${e.h - 12}" rx="8" fill="none" stroke="${T.gold}" stroke-opacity=".55"/>`;
    if (sel) s += `<rect x="${e.x - 5}" y="${e.y - 5}" width="${e.w + 10}" height="${e.h + 10}" rx="16" fill="none" stroke="${T.gold}" stroke-width="2.5"/>`;
    const cx = e.x + e.w / 2;
    const top = e.y + (e.h - e.lines.length * f.lh) / 2;
    let ix = cx - e.contentW / 2;
    if (n.icon) { s += `<text x="${ix}" y="${top + f.lh * 0.74}" font-size="17">${esc(n.icon)}</text>`; ix += 24; }
    e.lines.forEach((l, i) => { s += `<text x="${ix}" y="${top + f.lh * (i + 0.74)}" font-family="${esc(SERIF)}" font-weight="700" font-size="${f.size}" fill="${T.rootInk}">${esc(l)}</text>`; });
    let mx = ix + e.textW + 6;
    s += markers(n, mx, top + f.lh * 0.5, T.gold);
    s += '</g>';
    return s;
  }

  let x0 = e.x, top = e.y;
  if (e.style === 'line') {
    if (sel) s += `<rect x="${e.x - 3}" y="${e.y - 2}" width="${e.w + 6}" height="${e.h + 2}" rx="6" fill="${T.sel}"/>`;
    x0 += 5; top += 3;
    const uh = e.depth === 1 ? 3 : e.depth === 2 ? 2 : 1.5;
    s += `<rect x="${e.x}" y="${e.y + e.h - uh}" width="${e.w}" height="${uh}" rx="${uh / 2}" fill="${e.color}"/>`;
  } else if (e.style === 'card') {
    s += `<rect x="${e.x}" y="${e.y}" width="${e.w}" height="${e.h}" rx="9" fill="${T.surface}" stroke="${sel ? T.gold : T.line}" stroke-width="${sel ? 2.5 : 1}"/>`;
    s += `<rect x="${e.x}" y="${e.y}" width="${e.w}" height="5" rx="2.5" fill="${e.color}"/>`;
    x0 += 15; top += 13;
  } else {
    if (sel) s += `<rect x="${e.x - 3}" y="${e.y - 2}" width="${e.w + 6}" height="${e.h + 4}" rx="6" fill="${T.sel}"/>`;
    s += `<circle cx="${e.x + 5}" cy="${e.y + 4 + f.lh / 2}" r="3" fill="${e.color}"/>`;
    x0 += 16; top += 4;
  }
  const mid = top + f.lh / 2;
  if (n.done !== undefined) {
    s += `<g data-check="${e.id}"><rect x="${x0 - 3}" y="${mid - 11}" width="22" height="22" fill="transparent"/>`;
    s += done
      ? `<rect x="${x0}" y="${mid - 7.5}" width="15" height="15" rx="4" fill="${e.color}"/><path d="M${x0 + 4},${mid} l3,3 l5,-6" stroke="${T.surface}" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
      : `<rect x="${x0 + .75}" y="${mid - 6.75}" width="13.5" height="13.5" rx="3.5" fill="none" stroke="${e.color}" stroke-width="1.6"/>`;
    s += '</g>';
    x0 += 22;
  }
  if (n.icon) { s += `<text x="${x0}" y="${top + f.lh * 0.76}" font-size="${f.size + 1}">${esc(n.icon)}</text>`; x0 += 24; }
  if (e.num) { s += `<text x="${x0}" y="${top + f.lh * 0.72}" font-size="11" font-weight="600" fill="${T.goldText}">${e.num}</text>`; x0 += tw(e.num, NUM_FONT) + 6; }
  e.textX = x0; e.textTop = top;
  e.lines.forEach((l, i) => {
    s += `<text x="${x0}" y="${top + f.lh * (i + 0.74)}" font-size="${f.size}" font-weight="${f.weight}" fill="${textColor}"${done ? ' opacity=".55"' : ''}>${esc(l)}</text>`;
  });
  if (done) e.lines.forEach((l, i) => { const lw = tw(l || ' ', f.font); s += `<line x1="${x0}" x2="${x0 + lw}" y1="${top + f.lh * (i + 0.45)}" y2="${top + f.lh * (i + 0.45)}" stroke="${textColor}" stroke-opacity=".55" stroke-width="1.2"/>`; });
  s += markers(n, x0 + e.textW + 5, mid, e.color);
  s += '</g>';
  // 접힌 가지 표시
  if (n.collapsed && n.children.length) {
    const a = layout === 'org' ? { x: e.x + e.w / 2, y: e.y + e.h + 12 } : outAnchor(e, { dir: e.dir });
    const bx = layout === 'org' ? a.x : a.x + (e.dir > 0 ? 12 : -12);
    s += `<g data-toggle="${e.id}" class="hit"><circle cx="${bx}" cy="${a.y}" r="14" fill="transparent"/><circle cx="${bx}" cy="${a.y}" r="10" fill="${T.surface}" stroke="${e.color}" stroke-width="1.5"/><text x="${bx}" y="${a.y + 3.5}" text-anchor="middle" font-size="10" font-weight="700" fill="${e.color}">${countNodes(n) - 1}</text></g>`;
  }
  return s;
}
function markers(n, x, y, color) {
  let s = '';
  if (n.note) { s += `<path d="M${x},${y - 5} h10 v7 h-6 l-3,3 v-3 h-1 z" fill="none" stroke="${color}" stroke-width="1.4" stroke-linejoin="round"/>`; x += 18; }
  if (n.link) { s += `<g transform="translate(${x},${y - 6}) scale(.5)" fill="none" stroke="${color}" stroke-width="2.6" stroke-linecap="round"><path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></g>`; }
  return s;
}

function mapSVGInner(L, layout) {
  let s = edgeSVG(L, layout);
  // 루트를 가장 나중에(가지 위로)
  const list = [...L.values()];
  for (const e of list) if (e.depth > 0) s += nodeSVG(e, L, layout);
  s += nodeSVG(list[0], L, layout);
  return s;
}
function bounds(L) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const e of L.values()) { x0 = Math.min(x0, e.x); y0 = Math.min(y0, e.y); x1 = Math.max(x1, e.x + e.w); y1 = Math.max(y1, e.y + e.h); }
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 };
}

/* =========================================================
   편집 화면
   ========================================================= */
const svg = $('#canvas'), world = $('#world'), stage = $('#stage'), pill = $('#pill'), editInput = $('#editInput');

function render() {
  if (!state.map) return;
  const map = state.map;
  state.L = computeLayout(map);
  world.innerHTML = mapSVGInner(state.L, map.layout);
  svg.style.background = T.bg;
  $('#titleBtn').textContent = map.root.text || '제목 없음';
  document.querySelectorAll('#layoutTabs button').forEach((b) => b.classList.toggle('on', b.dataset.layout === map.layout));
  $('#undoBtn').disabled = !state.undo.length;
  $('#redoBtn').disabled = !state.redo.length;
  renderOutline();
  applyView();
}
function applyView() {
  const { x, y, k } = state.vp;
  world.setAttribute('transform', `translate(${x},${y}) scale(${k})`);
  placePill();
  if (state.editing) placeEditor();
}
function toScreen(wx, wy) { return { x: wx * state.vp.k + state.vp.x, y: wy * state.vp.k + state.vp.y }; }
function toWorld(sx, sy) { const r = svg.getBoundingClientRect(); return { x: (sx - r.left - state.vp.x) / state.vp.k, y: (sy - r.top - state.vp.y) / state.vp.k }; }

function fit(animate) {
  const b = bounds(state.L), W = stage.clientWidth, H = stage.clientHeight;
  let k = clamp(Math.min((W - 48) / b.w, (H - 200) / b.h), 0.25, 1.25);
  const minK = W < 600 ? 0.62 : 0.3;
  if (k >= minK) {
    state.vp = { k, x: W / 2 - (b.x0 + b.w / 2) * k, y: (H - 90) / 2 - (b.y0 + b.h / 2) * k + 10 };
  } else {
    // 작은 화면: 글씨가 너무 작아지지 않게, 중심 주제를 기준으로 맞춤
    k = minK;
    const r = [...state.L.values()].find((e) => e.depth === 0);
    const x = W / 2 - (r.x + r.w / 2) * k;
    const y = b.h * k < H - 200 ? (H - 90) / 2 - (b.y0 + b.h / 2) * k + 10 : 24 - b.y0 * k;
    state.vp = { k, x, y };
  }
  applyView();
}
function ensureVisible(id) {
  const e = state.L.get(id); if (!e) return;
  const W = stage.clientWidth, H = stage.clientHeight, m = 40;
  const a = toScreen(e.x, e.y), b = toScreen(e.x + e.w, e.y + e.h);
  let dx = 0, dy = 0;
  if (a.x < m) dx = m - a.x; else if (b.x > W - m) dx = W - m - b.x;
  if (a.y < m) dy = m - a.y; else if (b.y > H - 170) dy = H - 170 - b.y;
  if (dx || dy) { state.vp.x += dx; state.vp.y += dy; applyView(); }
}

function placePill() {
  const e = state.sel && state.L.get(state.sel);
  if (!e || state.editing || state.drag || $('#sheet').hidden === false && !$('#sheet').classList.contains('side')) { pill.hidden = true; return; }
  pill.hidden = false;
  pill.querySelector('[data-act=delete]').hidden = e.depth === 0;
  pill.querySelector('[data-act=sibling]').hidden = e.depth === 0;
  const W = stage.clientWidth, H = stage.clientHeight;
  const pw = pill.offsetWidth, ph = pill.offsetHeight;
  const a = toScreen(e.x, e.y), b = toScreen(e.x + e.w, e.y + e.h);
  let x = (a.x + b.x) / 2 - pw / 2, y = b.y + 12;
  if (y + ph > H - 110) y = a.y - ph - 12;
  pill.style.left = clamp(x, 8, W - pw - 8) + 'px';
  pill.style.top = clamp(y, 8, H - ph - 8) + 'px';
}

/* ---------- 변경 + 되돌리기 ---------- */
let saveTimer = null;
function snapshot() { return JSON.stringify({ root: state.map.root, layout: state.map.layout }); }
function mutate(fn, opts = {}) {
  state.undo.push(snapshot()); if (state.undo.length > 120) state.undo.shift();
  state.redo = [];
  fn();
  commit(opts);
}
function commit(opts = {}) {
  render();
  if (opts.fit) fit();
  if (state.sel) ensureVisible(state.sel);
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => store.put(state.map), 250);
}
function undo() {
  if (!state.undo.length) return;
  state.redo.push(snapshot());
  Object.assign(state.map, JSON.parse(state.undo.pop()));
  if (state.sel && !findNode(state.map.root, state.sel)) state.sel = null;
  commit();
}
function redo() {
  if (!state.redo.length) return;
  state.undo.push(snapshot());
  Object.assign(state.map, JSON.parse(state.redo.pop()));
  if (state.sel && !findNode(state.map.root, state.sel)) state.sel = null;
  commit();
}

/* ---------- 가지 조작 ---------- */
function freePosFor(parentId, node) {
  const pe = state.L.get(parentId); if (!pe) return;
  const dir = pe.depth === 0 ? 1 : pe.dir || 1;
  const pn = findNode(state.map.root, parentId).node;
  const n = pn.children.length;
  node.fx = Math.round(dir > 0 ? pe.x + pe.w + 50 : pe.x - 50 - 90);
  node.fy = Math.round(pe.y + (n - 1) * 38 - (pe.depth === 0 ? 20 : 0));
}
function addChild(parentId) {
  const r = findNode(state.map.root, parentId || state.map.root.id); if (!r) return;
  const node = newNode('');
  mutate(() => {
    r.node.collapsed = false;
    r.node.children.push(node);
    if (state.map.layout === 'free') freePosFor(r.node.id, node);
    state.sel = node.id;
  });
  startEdit(node.id, true);
}
function addSibling(id) {
  const r = findNode(state.map.root, id); if (!r || !r.parent) return addChild(id);
  const node = newNode('');
  mutate(() => {
    const i = r.parent.children.indexOf(r.node);
    r.parent.children.splice(i + 1, 0, node);
    if (r.node.side) node.side = r.node.side;
    if (state.map.layout === 'free') { node.fx = r.node.fx; node.fy = (r.node.fy || 0) + 44; }
    state.sel = node.id;
  });
  startEdit(node.id, true);
}
function deleteNode(id) {
  const r = findNode(state.map.root, id); if (!r || !r.parent) return;
  mutate(() => {
    const i = r.parent.children.indexOf(r.node);
    r.parent.children.splice(i, 1);
    const sib = r.parent.children[i] || r.parent.children[i - 1];
    state.sel = sib ? sib.id : r.parent.id;
  });
  if (countNodes(r.node) > 1) toast('가지를 삭제했습니다 · 되돌리기 가능', '되돌리기', undo);
}
function setProp(id, fn, live) {
  const r = findNode(state.map.root, id); if (!r) return;
  if (live) { fn(r.node); commit(); } else mutate(() => fn(r.node));
}

/* ---------- 글 편집 ---------- */
function startEdit(id, isNew = false) {
  const e = state.L.get(id); if (!e) return;
  state.editing = { id, isNew, before: e.n.text };
  editInput.value = e.n.text;
  editInput.hidden = false;
  pill.hidden = true;
  placeEditor();
  editInput.focus();
  editInput.select();
}
function placeEditor() {
  const e = state.L.get(state.editing.id); if (!e) return;
  const k = state.vp.k;
  const fs = Math.max(14, e.f.size * k);
  editInput.style.fontSize = fs + 'px';
  editInput.style.fontWeight = e.f.weight;
  editInput.style.fontFamily = e.depth === 0 ? SERIF : SANS;
  const a = toScreen(e.x, e.y);
  const W = stage.clientWidth;
  const w = clamp(Math.max(e.w * k + 40, 180), 160, W - 16);
  editInput.style.width = w + 'px';
  editInput.style.height = 'auto';
  editInput.style.height = editInput.scrollHeight + 'px';
  editInput.style.left = clamp(a.x - 10, 8, W - w - 8) + 'px';
  editInput.style.top = Math.max(8, a.y - 8) + 'px';
}
editInput.addEventListener('input', () => { editInput.style.height = 'auto'; editInput.style.height = editInput.scrollHeight + 'px'; });
editInput.addEventListener('keydown', (ev) => {
  if (ev.isComposing || ev.keyCode === 229) return;
  if (ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); finishEdit(true); }
  else if (ev.key === 'Escape') { ev.preventDefault(); finishEdit(false); }
  else if (ev.key === 'Tab') { ev.preventDefault(); const id = state.editing.id; finishEdit(true); if (findNode(state.map.root, id)) addChild(id); }
});
editInput.addEventListener('blur', () => { if (state.editing) finishEdit(true); });

function finishEdit(save) {
  const ed = state.editing; if (!ed) return;
  state.editing = null;
  editInput.blur();
  editInput.hidden = true;
  const text = editInput.value.replace(/\s+$/, '').replace(/^\s+/, '');
  const r = findNode(state.map.root, ed.id);
  if (!r) { render(); return; }
  if (ed.isNew && (!save || !text)) {
    // 새 가지인데 비어 있으면 없던 일로
    state.undo.pop();
    const i = r.parent.children.indexOf(r.node);
    r.parent.children.splice(i, 1);
    state.sel = r.parent.id;
    commit();
    return;
  }
  if (!save || text === ed.before || (!text && r.parent)) { render(); return; }
  if (ed.isNew) { r.node.text = text; commit(); }
  else mutate(() => { r.node.text = text || '제목 없음'; });
}

/* ---------- 포인터: 이동·확대·선택·끌기 ---------- */
const ptrs = new Map();
let gest = null, lastTap = { id: null, t: 0 };

svg.addEventListener('pointerdown', (ev) => {
  if (state.editing) { finishEdit(true); }
  svg.setPointerCapture(ev.pointerId);
  ptrs.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
  if (ptrs.size === 2) {
    if (state.drag) cancelDrag();
    const [p1, p2] = [...ptrs.values()];
    gest = { type: 'pinch', d0: Math.hypot(p1.x - p2.x, p1.y - p2.y), k0: state.vp.k, m0: { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 }, vp0: { ...state.vp } };
    return;
  }
  if (ptrs.size > 2) return;
  const t = ev.target;
  const tog = t.closest('[data-toggle]'), chk = t.closest('[data-check]'), g = t.closest('[data-id]');
  gest = { type: g || tog ? 'node' : 'pan', id: g?.dataset.id, toggle: tog?.dataset.toggle, check: chk?.dataset.check, sx: ev.clientX, sy: ev.clientY, vx: state.vp.x, vy: state.vp.y, moved: false };
});
svg.addEventListener('pointermove', (ev) => {
  if (!ptrs.has(ev.pointerId)) return;
  ptrs.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
  if (!gest) return;
  if (gest.type === 'pinch' && ptrs.size === 2) {
    const [p1, p2] = [...ptrs.values()];
    const d = Math.hypot(p1.x - p2.x, p1.y - p2.y), m = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
    const k = clamp(gest.k0 * d / gest.d0, 0.2, 3);
    const r = svg.getBoundingClientRect();
    const wx = (gest.m0.x - r.left - gest.vp0.x) / gest.vp0.k, wy = (gest.m0.y - r.top - gest.vp0.y) / gest.vp0.k;
    state.vp = { k, x: m.x - r.left - wx * k, y: m.y - r.top - wy * k };
    applyView();
    return;
  }
  const dx = ev.clientX - gest.sx, dy = ev.clientY - gest.sy;
  if (!gest.moved && Math.hypot(dx, dy) < 7) return;
  const first = !gest.moved;
  gest.moved = true;
  const isRoot = gest.id === state.map.root.id;
  if (gest.type === 'pan' || gest.toggle || (isRoot && state.map.layout !== 'free')) {
    state.vp.x = gest.vx + dx; state.vp.y = gest.vy + dy; applyView();
    return;
  }
  if (first) beginDrag(gest.id, ev);
  moveDrag(ev);
});
function endPointer(ev) {
  if (!ptrs.has(ev.pointerId)) return;
  ptrs.delete(ev.pointerId);
  if (!gest) return;
  if (gest.type === 'pinch') { if (ptrs.size === 0) gest = null; return; }
  const g = gest; gest = null;
  if (ev.type === 'pointercancel') { if (state.drag) cancelDrag(); return; }
  if (g.moved) { if (state.drag) endDrag(ev); return; }
  // 탭
  if (g.toggle) { setProp(g.toggle, (n) => { n.collapsed = false; }); return; }
  if (g.check) { setProp(g.check, (n) => { n.done = !n.done; }); return; }
  if (g.type === 'node') {
    const now = Date.now();
    if (lastTap.id === g.id && now - lastTap.t < 380) { lastTap = { id: null, t: 0 }; select(g.id); startEdit(g.id); return; }
    lastTap = { id: g.id, t: now };
    select(g.id);
  } else {
    select(null);
  }
}
svg.addEventListener('pointerup', endPointer);
svg.addEventListener('pointercancel', endPointer);
svg.addEventListener('wheel', (ev) => {
  ev.preventDefault();
  if (state.editing) finishEdit(true);
  const r = svg.getBoundingClientRect();
  const mouseWheel = ev.deltaX === 0 && (ev.deltaMode === 1 || Math.abs(ev.deltaY) >= 50);
  if (ev.ctrlKey || mouseWheel) {
    const k = clamp(state.vp.k * Math.exp(-ev.deltaY * 0.0018), 0.2, 3);
    const wx = (ev.clientX - r.left - state.vp.x) / state.vp.k, wy = (ev.clientY - r.top - state.vp.y) / state.vp.k;
    state.vp = { k, x: ev.clientX - r.left - wx * k, y: ev.clientY - r.top - wy * k };
  } else {
    state.vp.x -= ev.deltaX; state.vp.y -= ev.deltaY;
  }
  applyView();
}, { passive: false });

function select(id) {
  state.sel = id;
  render();
  if (id) ensureVisible(id);
  if (!$('#sheet').hidden && sheetKind === 'props') { if (id) openProps(); else closeSheet(); }
}

/* 끌어서 옮기기 */
function descendantsOf(node, set = new Set()) { for (const c of node.children) { set.add(c.id); descendantsOf(c, set); } return set; }
function beginDrag(id, ev) {
  const r = findNode(state.map.root, id); if (!r) return;
  select(id);
  const free = state.map.layout === 'free';
  state.undo.push(snapshot()); state.redo = [];
  state.drag = { id, mode: free ? 'free' : 'ghost', desc: descendantsOf(r.node), last: toWorld(ev.clientX, ev.clientY), node: r.node };
  pill.hidden = true;
  if (!free) { const gh = $('#ghost'); gh.textContent = r.node.text || '가지'; gh.hidden = false; }
}
function moveDrag(ev) {
  const d = state.drag; if (!d) return;
  const w = toWorld(ev.clientX, ev.clientY);
  if (d.mode === 'free') {
    const dx = w.x - d.last.x, dy = w.y - d.last.y; d.last = w;
    const moveTree = (n) => { n.fx = (n.fx ?? 0) + dx; n.fy = (n.fy ?? 0) + dy; if (!n.collapsed) n.children.forEach(moveTree); };
    moveTree(d.node);
  }
  const gh = $('#ghost'); gh.style.left = ev.clientX + 'px'; gh.style.top = ev.clientY + 'px';
  // 놓을 대상 찾기
  const el = document.elementFromPoint(ev.clientX, ev.clientY);
  const g = el && el.closest && el.closest('#canvas [data-id]');
  const tid = g && g.dataset.id;
  state.dropTarget = tid && tid !== d.id && !d.desc.has(tid) ? tid : null;
  render();
  // 가장자리 자동 스크롤
  const r = svg.getBoundingClientRect(), m = 36;
  let sx = 0, sy = 0;
  if (ev.clientX < r.left + m) sx = 8; else if (ev.clientX > r.right - m) sx = -8;
  if (ev.clientY < r.top + m) sy = 8; else if (ev.clientY > r.bottom - m) sy = -8;
  if (sx || sy) { state.vp.x += sx; state.vp.y += sy; applyView(); }
}
function endDrag(ev) {
  const d = state.drag; state.drag = null; $('#ghost').hidden = true;
  const target = state.dropTarget; state.dropTarget = null;
  const r = findNode(state.map.root, d.id);
  let changed = d.mode === 'free';
  if (target) {
    const t = findNode(state.map.root, target);
    if (t && r && t.node !== r.parent) {
      r.parent.children.splice(r.parent.children.indexOf(r.node), 1);
      t.node.children.push(r.node); t.node.collapsed = false;
      delete r.node.side;
      if (state.map.layout === 'free') { const clearFree = (n) => { delete n.fx; delete n.fy; n.children.forEach(clearFree); }; clearFree(r.node); }
      changed = true;
    } else if (t && r && t.node === r.parent && d.mode === 'free') changed = true;
  } else if (d.mode === 'ghost' && r && r.parent) {
    // 같은 부모 안에서 순서 바꾸기 / 방사형 좌우 바꾸기
    const w = toWorld(ev.clientX, ev.clientY);
    const pe = state.L.get(r.parent.id);
    const layout = state.map.layout;
    const sibs = r.parent.children.filter((c) => c !== r.node);
    if (layout === 'radial' && pe.depth === 0) {
      const newSide = w.x >= pe.x + pe.w / 2 ? 'R' : 'L';
      const oldE = state.L.get(r.node.id);
      if ((oldE.dir > 0 ? 'R' : 'L') !== newSide) { r.node.side = newSide; changed = true; }
    }
    const radialRoot = layout === 'radial' && pe.depth === 0;
    if (radialRoot) {
      // 좌우 자동 배분을 고정해서 다른 가지가 뒤섞이지 않게
      for (const c of r.parent.children) if (!c.side) { const ce = state.L.get(c.id); if (ce) c.side = ce.dir > 0 ? 'R' : 'L'; }
    }
    const key = layout === 'org' && pe.depth === 0 ? 'x' : 'y';
    const mySide = r.node.side;
    const cands = sibs
      .filter((c) => !radialRoot || c.side === mySide)
      .map((c) => ({ c, ce: state.L.get(c.id) }))
      .filter((o) => o.ce);
    const pos = key === 'x' ? w.x : w.y;
    const before = cands.find((o) => pos < (key === 'x' ? o.ce.x + o.ce.w / 2 : o.ce.y + o.ce.h / 2));
    const newArr = [...sibs];
    if (before) newArr.splice(newArr.indexOf(before.c), 0, r.node);
    else if (cands.length) newArr.splice(newArr.indexOf(cands[cands.length - 1].c) + 1, 0, r.node);
    else newArr.push(r.node);
    const oldIdx = r.parent.children.indexOf(r.node);
    if (newArr.indexOf(r.node) !== oldIdx || changed || radialRoot) { r.parent.children = newArr; changed = true; }
  }
  if (!changed) state.undo.pop();
  else if (d.mode === 'free') { const round = (n) => { if (n.fx != null) { n.fx = Math.round(n.fx); n.fy = Math.round(n.fy); } n.children.forEach(round); }; round(state.map.root); }
  commit();
}
function cancelDrag() {
  const d = state.drag; state.drag = null; state.dropTarget = null; $('#ghost').hidden = true;
  if (d) { Object.assign(state.map, JSON.parse(state.undo.pop())); }
  render();
}

/* ---------- 키보드 (PC·키보드 연결 태블릿) ---------- */
document.addEventListener('keydown', (ev) => {
  if (state.view !== 'editor' || state.editing || (!$('#sheet').hidden && sheetKind !== 'props') || $('#dlg').open) return;
  if (ev.target.matches('input, textarea')) return;
  const mod = ev.ctrlKey || ev.metaKey;
  if (mod && ev.key.toLowerCase() === 'z') { ev.preventDefault(); ev.shiftKey ? redo() : undo(); return; }
  if (mod && ev.key.toLowerCase() === 'y') { ev.preventDefault(); redo(); return; }
  const id = state.sel;
  if (!id) { if (ev.key === 'Tab' || ev.key === 'Enter') { ev.preventDefault(); select(state.map.root.id); } return; }
  const e = state.L.get(id);
  switch (ev.key) {
    case 'Tab': ev.preventDefault(); addChild(id); return;
    case 'Enter': ev.preventDefault(); e.depth === 0 ? addChild(id) : addSibling(id); return;
    case 'F2': ev.preventDefault(); startEdit(id); return;
    case 'Delete': case 'Backspace': ev.preventDefault(); deleteNode(id); return;
    case 'Escape': select(null); return;
    case ' ': ev.preventDefault(); if (e.n.children.length) setProp(id, (n) => { n.collapsed = !n.collapsed; }); return;
  }
  if (ev.key.startsWith('Arrow')) { ev.preventDefault(); navigate(e, ev.key); return; }
  if (ev.key.length === 1 && !mod && !ev.altKey) {
    // 바로 타이핑하면 글 바꾸기
    startEdit(id); editInput.value = '';
  }
});
function navigate(e, key) {
  const L = state.L, layout = state.map.layout;
  const parent = e.parent && L.get(e.parent);
  const sibs = parent ? parent.kids : [];
  const i = sibs.indexOf(e);
  let target = null;
  const vertical = layout === 'org';
  const toChild = () => e.depth === 0 && layout === 'radial' ? null : e.kids[0];
  if (vertical) {
    if (key === 'ArrowDown') target = e.kids[0] || (e.depth > 1 ? sibs[i + 1] : null);
    if (key === 'ArrowUp') target = e.depth > 1 && i > 0 ? sibs[i - 1] : parent;
    if (key === 'ArrowRight') target = e.depth === 1 ? sibs[i + 1] : null;
    if (key === 'ArrowLeft') target = e.depth === 1 ? sibs[i - 1] : null;
  } else {
    const fwd = key === 'ArrowRight' ? 1 : key === 'ArrowLeft' ? -1 : 0;
    if (fwd) {
      if (e.depth === 0) target = e.kids.find((k) => k.dir === fwd);
      else target = fwd === e.dir ? e.kids[0] : parent;
    }
    if (key === 'ArrowDown' || key === 'ArrowUp') {
      const same = sibs.filter((s) => s.dir === e.dir);
      const j = same.indexOf(e) + (key === 'ArrowDown' ? 1 : -1);
      target = same[j];
    }
    void toChild;
  }
  if (target) select(target.id);
}

/* ---------- 개요 패널 (넓은 화면) ---------- */
function renderOutline() {
  const box = $('#outline');
  if (getComputedStyle(box).display === 'none') return;
  let h = '<div class="o-head">개요 · 목차</div>';
  (function walk(n, d, i) {
    const pad = d <= 1 ? 8 : 8 + (d - 1) * 16;
    const num = d === 1 ? `<span class="num">${String(i + 1).padStart(2, '0')}</span>` : '';
    h += `<button data-oid="${n.id}" class="d${Math.min(d, 2)}${state.sel === n.id ? ' on' : ''}${n.done ? ' done' : ''}" style="padding-left:${pad}px">${num}<span>${n.icon ? esc(n.icon) + ' ' : ''}${esc(n.text || '제목 없음')}</span></button>`;
    n.children.forEach((c, j) => walk(c, d + 1, j));
  })(state.map.root, 0, 0);
  box.innerHTML = h;
}
$('#outline').addEventListener('click', (ev) => {
  const b = ev.target.closest('[data-oid]'); if (!b) return;
  // 접혀 있는 조상 펼치기
  const path = []; (function find(n) { if (n.id === b.dataset.oid) return true; for (const c of n.children) if (find(c)) { path.push(n); return true; } return false; })(state.map.root);
  if (path.some((p) => p.collapsed)) { path.forEach((p) => { p.collapsed = false; }); }
  select(b.dataset.oid);
});

/* ---------- 상단·하단 버튼 ---------- */
pill.addEventListener('click', (ev) => {
  const b = ev.target.closest('[data-act]'); if (!b || !state.sel) return;
  const id = state.sel;
  ({ child: () => addChild(id), sibling: () => addSibling(id), edit: () => startEdit(id), props: openProps, delete: () => deleteNode(id) })[b.dataset.act]();
});
$('#fab').addEventListener('click', () => addChild(state.sel || state.map.root.id));
$('#fitBtn').addEventListener('click', () => fit());
$('#aiBtn').addEventListener('click', () => toast('AI 기능(가지 뻗기·글→맵·맵→글)은 2단계에서 추가됩니다'));
$('#undoBtn').addEventListener('click', undo);
$('#redoBtn').addEventListener('click', redo);
$('#backBtn').addEventListener('click', () => {
  if (state.pushed) history.back();
  else { history.replaceState(null, '', location.pathname); showHome(); }
});
$('#titleBtn').addEventListener('click', () => { select(state.map.root.id); startEdit(state.map.root.id); });
$('#layoutTabs').addEventListener('click', (ev) => {
  const b = ev.target.closest('[data-layout]'); if (!b || b.dataset.layout === state.map.layout) return;
  const to = b.dataset.layout;
  mutate(() => {
    if (to === 'free') {
      // 지금 보이는 모양 그대로 자유 배치 시작
      const clear = (n) => { delete n.fx; delete n.fy; n.children.forEach(clear); }; clear(state.map.root);
      for (const e of state.L.values()) { e.n.fx = Math.round(e.x); e.n.fy = Math.round(e.y); }
    }
    state.map.layout = to;
  }, { fit: true });
});
$('#edMenuBtn').addEventListener('click', openMapMenu);
window.addEventListener('resize', () => { if (state.view === 'editor') { renderOutline(); applyView(); } });

/* =========================================================
   시트: 꾸미기 / 메뉴
   ========================================================= */
let sheetKind = null;
function openSheet(html, kind, side = false) {
  sheetKind = kind;
  const sh = $('#sheet');
  $('#sheetBody').innerHTML = html;
  sh.classList.toggle('side', side);
  sh.hidden = false;
  $('#scrim').hidden = side && window.innerWidth >= 960;
  placePill();
}
function closeSheet() {
  $('#sheet').hidden = true; $('#scrim').hidden = true; sheetKind = null;
  if (state.view === 'editor') placePill();
}
$('#scrim').addEventListener('click', closeSheet);

function openProps() {
  const r = state.sel && findNode(state.map.root, state.sel); if (!r) return;
  const n = r.node, e = state.L.get(n.id), isRoot = !r.parent;
  const sw = T.branches.map((c, i) => `<button class="swatch${n.color === i ? ' on' : ''}" style="background:${c}" data-color="${i}" aria-label="색상 ${i + 1}"></button>`).join('');
  const ic = ICONS.map((x) => `<button data-icon="${x}" class="${n.icon === x ? 'on' : ''}">${x}</button>`).join('');
  openSheet(`
    <div class="sh-eyebrow">선택한 가지</div>
    <div class="sh-title">${esc(n.text || '제목 없음')}</div>
    ${isRoot ? '' : `<div class="sh-sec"><div class="sh-label">색상</div><div class="swatches"><button class="swatch auto${n.color == null ? ' on' : ''}" data-color="auto" aria-label="기본 색">기본</button>${sw}</div></div>`}
    <div class="sh-sec"><div class="sh-label">아이콘</div><div class="icons">${ic}</div>${n.icon ? '<button class="row-btn" data-icon="" style="align-self:flex-start">아이콘 빼기</button>' : ''}</div>
    <div class="sh-sec"><label class="sh-label" for="noteInput">메모</label><textarea id="noteInput" placeholder="가지에 덧붙일 설명">${esc(n.note || '')}</textarea></div>
    <div class="sh-sec"><label class="sh-label" for="linkInput">링크</label><div class="row"><input id="linkInput" type="url" inputmode="url" placeholder="https://" value="${esc(n.link || '')}"><button class="row-btn" id="openLink">열기</button></div></div>
    <div class="sh-sec">
      ${isRoot ? '' : `<div class="toggle-row"><span>할 일 체크박스</span><button class="switch${n.done !== undefined ? ' on' : ''}" id="tgCheck" aria-label="할 일 체크박스"></button></div>`}
      ${n.children.length ? `<div class="toggle-row"><span>하위 가지 접기</span><button class="switch${n.collapsed ? ' on' : ''}" id="tgCollapse" aria-label="하위 가지 접기"></button></div>` : ''}
    </div>
    ${isRoot ? '' : '<button class="danger-btn" id="delNode">이 가지 삭제</button>'}
  `, 'props', true);
  const body = $('#sheetBody');
  body.querySelectorAll('[data-color]').forEach((b) => b.addEventListener('click', () => { setProp(n.id, (x) => { if (b.dataset.color === 'auto') delete x.color; else x.color = +b.dataset.color; }); openProps(); }));
  body.querySelectorAll('[data-icon]').forEach((b) => b.addEventListener('click', () => { setProp(n.id, (x) => { if (!b.dataset.icon || x.icon === b.dataset.icon) delete x.icon; else x.icon = b.dataset.icon; }); openProps(); }));
  let noteSnap = false;
  $('#noteInput').addEventListener('input', (ev) => { if (!noteSnap) { state.undo.push(snapshot()); state.redo = []; noteSnap = true; } setProp(n.id, (x) => { x.note = ev.target.value || undefined; if (!x.note) delete x.note; }, true); });
  let linkSnap = false;
  $('#linkInput').addEventListener('input', (ev) => { if (!linkSnap) { state.undo.push(snapshot()); state.redo = []; linkSnap = true; } setProp(n.id, (x) => { const v = ev.target.value.trim(); if (v) x.link = v; else delete x.link; }, true); });
  $('#openLink').addEventListener('click', () => {
    let v = $('#linkInput').value.trim(); if (!v) return toast('링크를 먼저 넣어 주세요');
    if (!/^https?:\/\//i.test(v)) v = 'https://' + v;
    window.open(v, '_blank', 'noopener');
  });
  $('#tgCheck')?.addEventListener('click', () => { setProp(n.id, (x) => { if (x.done === undefined) x.done = false; else delete x.done; }); openProps(); });
  $('#tgCollapse')?.addEventListener('click', () => { setProp(n.id, (x) => { x.collapsed = !x.collapsed; }); openProps(); });
  $('#delNode')?.addEventListener('click', () => { closeSheet(); deleteNode(n.id); });
}

const ICO = {
  theme: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 0 0 18z" fill="currentColor"/></svg>',
  tag: '<svg viewBox="0 0 24 24"><path d="M3 12V4h8l9 9-8 8z"/><circle cx="7.5" cy="8.5" r="1.3"/></svg>',
  copy: '<svg viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/></svg>',
  save: '<svg viewBox="0 0 24 24"><path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 19h14"/></svg>',
  open: '<svg viewBox="0 0 24 24"><path d="M12 15V3M7 8l5-5 5 5"/><path d="M5 19h14"/></svg>',
  trash: '<svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
  dup: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="11" height="11" rx="2"/><rect x="9" y="9" width="11" height="11" rx="2"/></svg>',
  pen: '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>',
  expand: '<svg viewBox="0 0 24 24"><path d="M7 10l5 5 5-5"/></svg>',
  collapse: '<svg viewBox="0 0 24 24"><path d="M7 14l5-5 5 5"/></svg>',
};
function themePicker() {
  const opts = [['auto', '자동', `linear-gradient(135deg, ${THEMES.business.root} 50%, ${THEMES.dark.bg} 50%)`], ...Object.entries(THEMES).map(([k, t]) => [k, t.name, t.root === t.bg ? t.surface : t.root])];
  return `<div class="theme-grid">${opts.map(([k, name, bg]) => `<button data-theme="${k}" class="${settings.theme === k ? 'on' : ''}"><span class="sw" style="background:${bg}"></span>${name}</button>`).join('')}</div><div class="sh-label" style="font-weight:400;font-size:12px;color:var(--muted)">자동: 폰 설정에 따라 비즈니스(밝게)·다크로 바뀝니다</div>`;
}
function bindThemePicker(after) {
  $('#sheetBody').querySelectorAll('[data-theme]').forEach((b) => b.addEventListener('click', () => {
    settings.theme = b.dataset.theme; saveJSON('mm.settings', settings); applyTheme(); after();
  }));
}
function openMapMenu() {
  const m = state.map;
  openSheet(`
    <div class="sh-title">${esc(m.root.text || '제목 없음')}</div>
    <div class="sh-sec"><div class="sh-label">테마</div>${themePicker()}</div>
    <div class="sh-sec"><div class="sh-label">분류</div><div class="chips">${['', ...CATS].map((c) => `<button class="chip${(m.category || '') === c ? ' on' : ''}" data-cat="${c}">${c || '없음'}</button>`).join('')}</div></div>
    <div class="menu-list">
      <button id="mExpand">${ICO.expand}<span>모든 가지 펼치기</span></button>
      <button id="mCollapse">${ICO.collapse}<span>큰 가지만 보기 (접기)</span></button>
      <button id="mCopy">${ICO.copy}<span>개요(목차) 텍스트 복사</span></button>
      <button id="mSave">${ICO.save}<span>파일로 저장 (.json)</span></button>
      <button id="mDel" class="danger">${ICO.trash}<span>이 마인드맵 삭제</span></button>
    </div>`, 'menu');
  bindThemePicker(openMapMenu);
  $('#sheetBody').querySelectorAll('[data-cat]').forEach((b) => b.addEventListener('click', () => { m.category = b.dataset.cat; store.put(m); openMapMenu(); }));
  $('#mExpand').onclick = () => { closeSheet(); mutate(() => { const f = (n) => { delete n.collapsed; n.children.forEach(f); }; f(m.root); }, { fit: true }); };
  $('#mCollapse').onclick = () => { closeSheet(); mutate(() => { m.root.children.forEach((c) => { if (c.children.length) c.collapsed = true; }); state.sel = null; }, { fit: true }); };
  $('#mCopy').onclick = async () => { closeSheet(); await copyText(outlineText(m.root)); };
  $('#mSave').onclick = () => { closeSheet(); download(fileName(m.root.text) + '.json', JSON.stringify({ app: 'mindmap', version: 1, maps: [m] }, null, 1)); };
  $('#mDel').onclick = async () => {
    closeSheet();
    if (await confirmDlg('마인드맵 삭제', `‘${m.root.text}’을(를) 삭제할까요? 되돌릴 수 없습니다.`)) { store.del(m.id); showHome(); history.replaceState(null, '', location.pathname); toast('삭제했습니다'); }
  };
}
function outlineText(root) {
  const out = [];
  (function w(n, d, num) {
    const pre = d === 0 ? '' : '  '.repeat(d - 1) + (d === 1 ? num + '. ' : '- ');
    out.push(pre + (n.done === true ? '[완료] ' : n.done === false ? '[ ] ' : '') + (n.text || '') + (n.note ? `  (메모: ${n.note.replace(/\n/g, ' ')})` : '') + (n.link ? `  <${n.link}>` : ''));
    n.children.forEach((c, i) => w(c, d + 1, i + 1));
  })(root, 0, 0);
  return out.join('\n');
}
async function copyText(t) {
  try { await navigator.clipboard.writeText(t); toast('개요를 복사했습니다. 메모·카톡에 붙여넣기 하세요'); }
  catch (e) { const ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); toast('개요를 복사했습니다'); }
}
function fileName(s) { return (s || '마인드맵').replace(/[\\/:*?"<>|\n]/g, ' ').trim().slice(0, 40) || '마인드맵'; }
function download(name, text) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  toast('파일로 저장했습니다 (다운로드 폴더)');
}

/* ---------- 대화상자 / 토스트 ---------- */
function dialogAsk({ title, msg = '', value = null, ok = '확인' }) {
  const d = $('#dlg');
  $('#dlgTitle').textContent = title; $('#dlgMsg').textContent = msg; $('#dlgOk').textContent = ok;
  const inp = $('#dlgInput'); inp.hidden = value === null; inp.value = value ?? '';
  d.returnValue = '';
  d.showModal();
  if (value !== null) setTimeout(() => { inp.focus(); inp.select(); }, 50);
  return new Promise((res) => d.addEventListener('close', () => res(d.returnValue === 'ok' ? (value === null ? true : inp.value.trim()) : null), { once: true }));
}
const confirmDlg = (title, msg) => dialogAsk({ title, msg, ok: '삭제' });
let toastTimer;
function toast(msg, actLabel, act) {
  const t = $('#toast');
  t.innerHTML = esc(msg) + (actLabel ? ` <button style="margin-left:10px;border:0;background:transparent;color:var(--headerGold);font-weight:700;font-size:14px;padding:4px">${esc(actLabel)}</button>` : '');
  if (actLabel) t.querySelector('button').onclick = () => { t.hidden = true; act(); };
  t.style.pointerEvents = actLabel ? 'auto' : 'none';
  t.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, actLabel ? 4500 : 2600);
}

/* =========================================================
   홈 화면
   ========================================================= */
function renderHome() {
  const idx = store.index();
  const counts = { 전체: idx.length };
  CATS.forEach((c) => { counts[c] = idx.filter((m) => m.category === c).length; });
  $('#catTabs').innerHTML = ['전체', ...CATS].map((c) => `<button data-cat="${c}" class="${state.cat === c ? 'on' : ''}">${c} ${counts[c]}</button>`).join('');
  const q = state.query.trim().toLowerCase();
  const list = idx.filter((m) => (state.cat === '전체' || m.category === state.cat) && (!q || (m.search || m.title.toLowerCase()).includes(q)));
  const box = $('#mapList');
  if (!list.length) {
    box.innerHTML = `<div class="empty">${q ? '찾는 마인드맵이 없습니다' : '아직 마인드맵이 없습니다.<br>위의 ‘새 마인드맵’을 눌러 시작하세요.'}</div>`;
    return;
  }
  box.innerHTML = list.map((m) => {
    const full = store.get(m.id);
    return `<div class="card" data-open="${m.id}" role="button" tabindex="0">
      <div class="thumb">${full ? thumbSVG(full) : ''}</div>
      <div class="card-info"><div class="card-title">${esc(m.title)}</div><div class="card-meta">${m.category ? esc(m.category) + ' · ' : ''}가지 ${m.count} · ${fmtDate(m.updated)}</div></div>
      <button class="icon-btn more" data-more="${m.id}" aria-label="더보기"><svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/></svg></button>
    </div>`;
  }).join('');
}
function thumbSVG(map) {
  try {
    const L = computeLayout(map);
    const b = bounds(L), pad = 20;
    const save = state.sel; state.sel = null;
    const inner = mapSVGInner(L, map.layout);
    state.sel = save;
    return `<svg viewBox="${b.x0 - pad} ${b.y0 - pad} ${b.w + pad * 2} ${b.h + pad * 2}" preserveAspectRatio="xMidYMid meet" style="background:${T.bg};stroke:none">${inner}</svg>`;
  } catch (e) { return ''; }
}
function fmtDate(t) {
  const d = new Date(t), now = new Date();
  const p = (x) => String(x).padStart(2, '0');
  if (d.toDateString() === now.toDateString()) return `오늘 ${p(d.getHours())}:${p(d.getMinutes())}`;
  const y = new Date(now); y.setDate(now.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return '어제';
  return d.getFullYear() === now.getFullYear() ? `${d.getMonth() + 1}월 ${d.getDate()}일` : `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
}
$('#catTabs').addEventListener('click', (ev) => { const b = ev.target.closest('[data-cat]'); if (b) { state.cat = b.dataset.cat; renderHome(); } });
$('#searchInput').addEventListener('input', (ev) => { state.query = ev.target.value; renderHome(); });
$('#mapList').addEventListener('click', (ev) => {
  const more = ev.target.closest('[data-more]');
  if (more) { ev.stopPropagation(); openCardMenu(more.dataset.more); return; }
  const c = ev.target.closest('[data-open]'); if (c) openMap(c.dataset.open);
});
$('#mapList').addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { const c = ev.target.closest('[data-open]'); if (c) openMap(c.dataset.open); } });
$('#newMapBtn').addEventListener('click', async () => {
  const title = await dialogAsk({ title: '새 마인드맵', msg: '가운데에 들어갈 주제를 적어 주세요', value: '' , ok: '만들기' });
  if (title === null) return;
  const m = newMap(title || '새 마인드맵');
  if (state.cat !== '전체') m.category = state.cat;
  store.put(m); openMap(m.id);
});
$('#aiMakeBtn').addEventListener('click', () => toast('AI로 만들기는 2단계에서 추가됩니다'));
$('#homeMenuBtn').addEventListener('click', openHomeMenu);

function openCardMenu(id) {
  const meta = store.index().find((m) => m.id === id); if (!meta) return;
  openSheet(`
    <div class="sh-title">${esc(meta.title)}</div>
    <div class="sh-sec"><div class="sh-label">분류</div><div class="chips">${['', ...CATS].map((c) => `<button class="chip${(meta.category || '') === c ? ' on' : ''}" data-cat="${c}">${c || '없음'}</button>`).join('')}</div></div>
    <div class="menu-list">
      <button id="cRename">${ICO.pen}<span>이름 바꾸기</span></button>
      <button id="cDup">${ICO.dup}<span>복제</span></button>
      <button id="cSave">${ICO.save}<span>파일로 저장 (.json)</span></button>
      <button id="cDel" class="danger">${ICO.trash}<span>삭제</span></button>
    </div>`, 'card');
  const m = store.get(id);
  $('#sheetBody').querySelectorAll('[data-cat]').forEach((b) => b.addEventListener('click', () => { m.category = b.dataset.cat; store.put(m); renderHome(); openCardMenu(id); }));
  $('#cRename').onclick = async () => { closeSheet(); const t = await dialogAsk({ title: '이름 바꾸기', value: m.root.text }); if (t) { m.root.text = t; store.put(m); renderHome(); } };
  $('#cDup').onclick = () => {
    closeSheet();
    const copy = JSON.parse(JSON.stringify(m)); copy.id = uid(); copy.root.text += ' (사본)';
    const reid = (n) => { n.id = uid(); n.children.forEach(reid); }; reid(copy.root);
    store.put(copy); renderHome(); toast('복제했습니다');
  };
  $('#cSave').onclick = () => { closeSheet(); download(fileName(m.root.text) + '.json', JSON.stringify({ app: 'mindmap', version: 1, maps: [m] }, null, 1)); };
  $('#cDel').onclick = async () => { closeSheet(); if (await confirmDlg('마인드맵 삭제', `‘${m.root.text}’을(를) 삭제할까요? 되돌릴 수 없습니다.`)) { store.del(id); renderHome(); toast('삭제했습니다'); } };
}
function openHomeMenu() {
  openSheet(`
    <div class="sh-title">설정</div>
    <div class="sh-sec"><div class="sh-label">테마</div>${themePicker()}</div>
    <div class="menu-list">
      <button id="hBackup">${ICO.save}<span>전체 백업 파일로 저장</span><span class="sub">${store.index().length}개</span></button>
      <button id="hRestore">${ICO.open}<span>백업 파일 불러오기</span></button>
    </div>
    <div class="sh-label" style="font-weight:400;font-size:12px;color:var(--muted);margin-top:8px;line-height:1.5">지금은 이 기기에만 저장됩니다. 폰을 바꾸거나 브라우저 데이터를 지우기 전에 백업해 두세요. 구글 드라이브 동기화는 다음 단계에서 추가됩니다.</div>`, 'home');
  bindThemePicker(openHomeMenu);
  $('#hBackup').onclick = () => {
    closeSheet();
    const maps = store.index().map((m) => store.get(m.id)).filter(Boolean);
    const d = new Date();
    download(`마인드맵 백업 ${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}.json`, JSON.stringify({ app: 'mindmap', version: 1, maps }, null, 1));
  };
  $('#hRestore').onclick = () => { closeSheet(); $('#fileInput').click(); };
}
$('#fileInput').addEventListener('change', async (ev) => {
  const f = ev.target.files[0]; ev.target.value = '';
  if (!f) return;
  try {
    const data = JSON.parse(await f.text());
    const maps = Array.isArray(data.maps) ? data.maps : data.root ? [data] : [];
    let n = 0;
    for (const m of maps) {
      if (!m || !m.root || typeof m.root.text !== 'string') continue;
      const fix = (x) => { x.id = x.id || uid(); x.text = String(x.text ?? ''); x.children = Array.isArray(x.children) ? x.children : []; x.children.forEach(fix); };
      fix(m.root);
      m.id = m.id || uid(); m.layout = LAYOUT_NAMES[m.layout] ? m.layout : 'radial';
      store.put(m); n++;
    }
    renderHome();
    toast(n ? `${n}개 마인드맵을 불러왔습니다` : '불러올 마인드맵이 없는 파일입니다');
  } catch (e) { toast('파일을 읽지 못했습니다. 이 앱의 백업 파일인지 확인해 주세요'); }
});

/* =========================================================
   화면 전환
   ========================================================= */
function showHome() {
  if (state.editing) finishEdit(true);
  if (state.map) { clearTimeout(saveTimer); store.put(state.map); }
  closeSheet();
  state.view = 'home'; state.map = null; state.sel = null;
  $('#editor').hidden = true; $('#home').hidden = false;
  $('meta[name=theme-color]').setAttribute('content', T.header);
  renderHome();
}
function openMap(id, push = true) {
  const m = store.get(id); if (!m) { toast('마인드맵을 찾지 못했습니다'); return showHome(); }
  if (!LAYOUT_NAMES[m.layout]) m.layout = 'radial';
  closeSheet();
  state.view = 'editor'; state.map = m; state.sel = null; state.undo = []; state.redo = [];
  $('#home').hidden = true; $('#editor').hidden = false;
  $('meta[name=theme-color]').setAttribute('content', T.bg);
  if (push && location.hash !== '#/map/' + id) { history.pushState(null, '', '#/map/' + id); state.pushed = true; }
  else if (!push) state.pushed = false;
  render(); fit();
}
window.addEventListener('popstate', route);
function route() {
  const m = location.hash.match(/^#\/map\/(.+)$/);
  if (m) openMap(m[1], false); else showHome();
}
window.addEventListener('pagehide', () => { if (state.map) store.put(state.map); });
document.addEventListener('visibilitychange', () => { if (document.hidden && state.map) store.put(state.map); });

/* ---------- 시작 ---------- */
(function init() {
  if (!localStorage.getItem('mm.index')) store.put(sampleMap());
  applyTheme();
  route();
  if (document.fonts) document.fonts.ready.then(() => { mcache.clear(); if (state.view === 'editor') { render(); } else renderHome(); });
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
})();

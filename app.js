'use strict';
/* =========================================================
   마인드맵 — 편집·저장·템플릿·스타일(선·글꼴·상자)·레이아웃 9종·공유
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
    grid: 'rgba(19,39,74,.09)', danger: '#B3261E', dark: false,
    branches: ['#13274A', '#1F5E5B', '#7A2E3A', '#8F6B1F', '#4E3A6B', '#4A5466', '#1D5E8C', '#5C6B2E'],
  },
  dark: {
    name: '다크', bg: '#0B1526', ink: '#EDEFF4', ink2: '#C3CADA', muted: '#9AA6BD', surface: '#13213A', line: '#22314D',
    root: '#1B2D4D', rootInk: '#EDEFF4', gold: '#D9BC72', goldText: '#D9BC72', header: '#13213A', headerInk: '#EDEFF4',
    headerMuted: '#9AA6BD', headerGold: '#D9BC72', sel: 'rgba(217,188,114,.20)', fab: '#D9BC72', fabInk: '#0B1526', shadow: 'rgba(0,0,0,.4)',
    grid: 'rgba(255,255,255,.07)', danger: '#F2A3AE', dark: true,
    branches: ['#D9BC72', '#8FC1BC', '#E09AA5', '#9FB6E6', '#C2ACE6', '#B4BECF', '#8FCBE8', '#C5D48F'],
  },
  light: {
    name: '라이트', bg: '#FAFAFB', ink: '#1B1E28', ink2: '#3D4250', muted: '#5B6170', surface: '#FFFFFF', line: '#E3E5EA',
    root: '#1B1E28', rootInk: '#FFFFFF', gold: '#2F5FD0', goldText: '#2F5FD0', header: '#1B1E28', headerInk: '#FFFFFF',
    headerMuted: '#B5BAC6', headerGold: '#8FB0FF', sel: 'rgba(47,95,208,.14)', fab: '#1B1E28', fabInk: '#FFFFFF', shadow: 'rgba(27,30,40,.12)',
    grid: 'rgba(27,30,40,.08)', danger: '#B3261E', dark: false,
    branches: ['#2F5FD0', '#C45A1C', '#1E7A5F', '#7247C9', '#C23B4A', '#0E7C86', '#8A6D1A', '#4A5466'],
  },
  pastel: {
    name: '파스텔', bg: '#FBF7F4', ink: '#3A3340', ink2: '#544A5C', muted: '#786E80', surface: '#FFFFFF', line: '#EADFE3',
    root: '#5B4B6B', rootInk: '#FFFFFF', gold: '#C97B8E', goldText: '#A4566A', header: '#5B4B6B', headerInk: '#FFFFFF',
    headerMuted: '#D9CDE0', headerGold: '#F2C6D0', sel: 'rgba(201,123,142,.18)', fab: '#5B4B6B', fabInk: '#F2C6D0', shadow: 'rgba(91,75,107,.14)',
    grid: 'rgba(91,75,107,.09)', danger: '#B3261E', dark: false,
    branches: ['#B5607A', '#4F84AE', '#4E9068', '#B07A2E', '#7B63AE', '#3E8F8F', '#A0617A', '#6B7A3E'],
  },
};
const ICONS = ['⭐', '🚩', '❗', '❓', '✅', '❌', '💡', '🎯', '📅', '⏰', '👤', '👥', '💰', '📈', '📉', '🔥', '📌', '📎', '📝', '📞', '🏆', '⚠️', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '👍'];
const CATS = ['업무', '개인', '공부'];

/* ---------- 레이아웃·스타일 정의 ---------- */
const LAYOUTS = [
  ['radial', '방사형'], ['tree', '오른쪽'], ['left', '왼쪽'], ['down', '하향 트리'], ['org', '조직도'],
  ['list', '개요형'], ['timeline', '타임라인'], ['fishbone', '피시본'], ['free', '자유 배치'],
];
const LAYOUT_NAMES = Object.fromEntries(LAYOUTS);
const HFAM = new Set(['radial', 'tree', 'left', 'free']);
const FONTS = {
  auto: { name: '기본', fam: null },
  sans: { name: '고딕', fam: SANS },
  noto: { name: '본고딕', fam: "'Noto Sans KR', sans-serif", g: 'Noto+Sans+KR:wght@400;700' },
  serif: { name: '명조', fam: SERIF },
  myeongjo: { name: '나눔명조', fam: "'Nanum Myeongjo', serif", g: 'Nanum+Myeongjo:wght@400;700' },
  round: { name: '고운돋움', fam: "'Gowun Dodum', sans-serif", g: 'Gowun+Dodum' },
  jua: { name: '주아', fam: "'Jua', sans-serif", g: 'Jua' },
  dohyeon: { name: '도현', fam: "'Do Hyeon', sans-serif", g: 'Do+Hyeon' },
  pen: { name: '손글씨', fam: "'Nanum Pen Script', cursive", g: 'Nanum+Pen+Script', scale: 1.3 },
  gaegu: { name: '개구', fam: "'Gaegu', cursive", g: 'Gaegu:wght@400;700', scale: 1.12 },
};
const SHAPES = [['auto', '자동'], ['round', '둥근 상자'], ['pill', '알약'], ['box', '사각'], ['ellipse', '타원'], ['hex', '육각'], ['line', '밑줄'], ['none', '글자만']];
const FILLS = [['auto', '자동'], ['tint', '연하게'], ['solid', '진하게'], ['white', '흰색'], ['none', '없음']];
const STYLE_DEFAULT = {
  numbering: 'none', rollup: false, optIn: true, bg: 'plain', shape: 'auto', fill: 'auto', shadow: false,
  lineShape: 'curve', lineWidth: 'normal', lineDash: 'solid', lineColor: 'branch', taper: true,
  font: 'auto', fontScale: 'm', spacing: 'normal',
};
const PRESETS = [
  { key: 'classic', name: '클래식', s: { shape: 'auto', fill: 'auto', lineShape: 'curve', lineWidth: 'normal', lineDash: 'solid', lineColor: 'branch', taper: true, font: 'auto', shadow: false } },
  { key: 'pill', name: '컬러 알약', s: { shape: 'pill', fill: 'solid', lineShape: 'curve', lineWidth: 'normal', lineDash: 'solid', lineColor: 'branch', taper: true, font: 'auto', shadow: false } },
  { key: 'soft', name: '부드러운 카드', s: { shape: 'round', fill: 'tint', lineShape: 'relbow', lineWidth: 'normal', lineDash: 'solid', lineColor: 'branch', taper: false, font: 'noto', shadow: true } },
  { key: 'biz', name: '비즈니스 박스', s: { shape: 'box', fill: 'white', lineShape: 'elbow', lineWidth: 'normal', lineDash: 'solid', lineColor: 'gray', taper: false, font: 'noto', shadow: true } },
  { key: 'minimal', name: '미니멀', s: { shape: 'none', fill: 'none', lineShape: 'straight', lineWidth: 'thin', lineDash: 'solid', lineColor: 'gray', taper: false, font: 'noto', shadow: false } },
  { key: 'hand', name: '손글씨 노트', s: { shape: 'line', fill: 'none', lineShape: 'curve', lineWidth: 'normal', lineDash: 'solid', lineColor: 'branch', taper: true, font: 'pen', shadow: false, bg: 'grid' } },
  { key: 'fun', name: '귀여운 타원', s: { shape: 'ellipse', fill: 'tint', lineShape: 'curve', lineWidth: 'thick', lineDash: 'solid', lineColor: 'branch', taper: true, font: 'jua', shadow: false } },
  { key: 'dash', name: '점선 스케치', s: { shape: 'round', fill: 'none', lineShape: 'curve', lineWidth: 'normal', lineDash: 'dash', lineColor: 'branch', taper: false, font: 'gaegu', shadow: false } },
];

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

/* ---------- 글꼴 불러오기 ---------- */
const fontLoaded = new Set(['auto', 'sans', 'serif']);
function ensureFont(key) {
  const f = FONTS[key];
  if (!f || fontLoaded.has(key)) return;
  fontLoaded.add(key);
  if (f.g) {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = `https://fonts.googleapis.com/css2?family=${f.g}&display=swap`;
    document.head.appendChild(l);
  }
  const fam = f.fam.split(',')[0];
  Promise.all([document.fonts.load(`400 16px ${fam}`, '가나다abc'), document.fonts.load(`700 16px ${fam}`, '가나다abc')])
    .then(() => { mcache.clear(); if (state.view === 'editor') render(); else renderHome(); })
    .catch(() => {});
}
function ensureMapFonts(m) {
  ensureFont(m.style.font);
  (function w(n) { if (n.font) ensureFont(n.font); n.children.forEach(w); })(m.root);
}

/* ---------- 저장소 ---------- */
function loadJSON(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch (e) { return d; } }
function saveJSON(k, v) {
  try { localStorage.setItem(k, JSON.stringify(v)); return true; }
  catch (e) { toast('저장 공간이 부족합니다. 큰 사진이나 오래된 맵을 정리해 주세요.'); return false; }
}
const store = {
  index() { return loadJSON('mm.index', []); },
  get(id) { const m = loadJSON('mm.map.' + id, null); return m && normalizeMap(m); },
  put(map) {
    map.updated = Date.now();
    delete map.sample;
    if (!saveJSON('mm.map.' + map.id, map)) return;
    const idx = store.index().filter((m) => m.id !== map.id);
    idx.unshift(store.meta(map));
    saveJSON('mm.index', idx);
    if (window.Sync) Sync.changed();
  },
  meta(map) { return { id: map.id, title: map.root.text || '제목 없음', category: map.category || '', updated: map.updated, count: countNodes(map.root) - 1, search: flatText(map.root) }; },
  /* 동기화로 받은 맵: 수정 시각을 그대로 둔 채 저장 */
  putRaw(map) {
    if (!saveJSON('mm.map.' + map.id, map)) return;
    const idx = store.index().filter((m) => m.id !== map.id);
    idx.push(store.meta(map));
    idx.sort((a, b) => (b.updated || 0) - (a.updated || 0));
    saveJSON('mm.index', idx);
  },
  removeRaw(id) { localStorage.removeItem('mm.map.' + id); saveJSON('mm.index', store.index().filter((m) => m.id !== id)); },
  del(id) {
    store.removeRaw(id);
    const t = loadJSON('mm.tomb', {}); t[id] = Date.now(); saveJSON('mm.tomb', t);
    if (window.Sync) Sync.changed();
  },
};
function countNodes(n) { return 1 + (n.children || []).reduce((s, c) => s + countNodes(c), 0); }
function flatText(n) { return [n.text, n.note || '', ...(n.children || []).map(flatText)].join(' ').toLowerCase().slice(0, 4000); }

function newNode(text = '') { return { id: uid(), text, children: [] }; }
function newMap(title = '새 마인드맵', layout = 'radial', style = {}) {
  return { id: uid(), category: '', layout, updated: Date.now(), root: newNode(title), links: [], style: { ...STYLE_DEFAULT, ...style } };
}
function normalizeMap(m) {
  const chosen = m.style && m.style.optIn;
  m.style = Object.assign({ ...STYLE_DEFAULT }, m.style || {});
  // 예전 맵: 번호(01·02)·진행률(0/2)이 자동으로 붙던 것을 끄고, 필요할 때 직접 켜도록
  if (!chosen) { m.style.numbering = 'none'; m.style.rollup = false; m.style.optIn = true; }
  m.links = Array.isArray(m.links) ? m.links : [];
  if (!LAYOUT_NAMES[m.layout]) m.layout = 'radial';
  return m;
}
const mk = (t, kids = [], extra = {}) => Object.assign(newNode(t), { children: kids.map((k) => (typeof k === 'string' ? newNode(k) : k)) }, extra);
const todo = (t) => mk(t, [], { done: false });
const pstyle = (key) => ({ ...PRESETS.find((p) => p.key === key).s });

function sampleMap() {
  const m = newMap('마인드맵 사용법');
  m.sample = true;
  m.root.children = [
    mk('가지 만들기', ['아래 + 버튼 누르기', '가지 누르고 하위·형제', 'PC: Tab 하위, Enter 형제', '글을 붙여넣어 한 번에 만들기']),
    mk('글 고치기', ['가지를 두 번 누르기', 'PC: 바로 타이핑']),
    mk('옮기기', ['가지를 끌어 다른 가지에 놓기', '두 손가락으로 확대·축소']),
    mk('꾸미기', [mk('위쪽 팔레트: 맵 전체 스타일', [], { icon: '🎯' }), mk('가지를 길게 누르면 더보기', [], { icon: '👍' }), todo('할 일 체크'), mk('날짜·사진·음성 입력', [], { done: true })]),
  ];
  return m;
}

/* ---------- 템플릿 ---------- */
const TPL_CATS = ['전체', '기본', '업무', '계획', '분석', '개인'];
const TEMPLATES = [
  // 기본
  { key: 'blank', cat: '기본', name: '빈 마인드맵', build: () => newMap('새 마인드맵') },
  { key: 'color', cat: '기본', name: '컬러 마인드맵', build: () => { const m = newMap('중심 주제', 'radial', pstyle('pill')); m.root.children = [1, 2, 3, 4].map((i) => mk(`주제 ${i}`, ['세부 내용', '세부 내용'])); return m; } },
  { key: 'brain', cat: '기본', name: '브레인스토밍', build: () => { const m = newMap('아이디어 주제', 'radial', pstyle('soft')); m.root.children = [1, 2, 3, 4, 5, 6].map((i) => mk(`아이디어 ${i}`)); return m; } },
  { key: 'outline', cat: '기본', name: '개요 노트', build: () => { const m = newMap('문서 제목', 'list'); m.root.children = [mk('1장', ['요점', '요점']), mk('2장', ['요점', '요점']), mk('3장', ['요점'])]; return m; } },
  // 업무
  { key: 'meeting', cat: '업무', name: '회의', build: () => { const m = newMap('회의'); m.root.children = [
    mk('회의 정보', ['일시', '장소', '참석자']), mk('안건', ['안건 1', '안건 2', '안건 3']),
    mk('논의 내용', ['주요 의견']), mk('결정 사항', ['결정 1']), mk('할 일', [todo('담당자 · 할 일'), todo('담당자 · 할 일')])]; return m; } },
  { key: 'report', cat: '업무', name: '보고서 구성', build: () => { const m = newMap('보고서 제목', 'tree', pstyle('biz')); m.root.children = [
    mk('배경·목적'), mk('현황', ['수치', '사례']), mk('문제점'), mk('개선 방안', ['방안 1', '방안 2']), mk('기대 효과'), mk('일정·예산')]; return m; } },
  { key: 'project', cat: '업무', name: '프로젝트 계획', build: () => { const m = newMap('프로젝트명', 'down'); m.root.children = [
    mk('목표', ['측정 지표']), mk('범위', ['포함', '제외']), mk('일정', [todo('착수'), todo('중간 점검'), todo('완료')]), mk('담당', ['책임자']), mk('위험 요소', ['대응 방안'])]; return m; } },
  { key: 'roles', cat: '업무', name: '업무 분장', build: () => { const m = newMap('조직명', 'org', pstyle('biz')); m.root.children = [
    mk('팀 1', ['담당자 · 업무', '담당자 · 업무']), mk('팀 2', ['담당자 · 업무', '담당자 · 업무']), mk('팀 3', ['담당자 · 업무'])]; return m; } },
  { key: 'lecture', cat: '업무', name: '강의 구상', build: () => { const m = newMap('강의 제목', 'tree'); m.root.children = [
    mk('도입', ['강의 목적', '아이스브레이킹']), mk('본론 1', ['핵심 메시지', '사례']), mk('본론 2', ['핵심 메시지', '사례']),
    mk('실습', ['롤플레이']), mk('마무리', ['요약', '질의응답'])]; return m; } },
  { key: 'curriculum', cat: '업무', name: '교육 커리큘럼', build: () => { const m = newMap('교육 과정명', 'timeline'); m.root.children = [1, 2, 3, 4].map((i) => mk(`${i}주차`, ['주제', '실습', todo('과제')])); return m; } },
  { key: 'consult', cat: '업무', name: '고객 상담 준비', build: () => { const m = newMap('고객명', 'radial', pstyle('soft')); m.root.children = [
    mk('고객 정보', ['가족', '직업', '관심사']), mk('현재 보장', ['가입 상품', '부족한 부분']), mk('니즈'), mk('제안할 내용'),
    mk('예상 질문·답변'), mk('다음 약속', [todo('연락 일정')])]; return m; } },
  { key: 'interview', cat: '업무', name: '면담 준비', build: () => { const m = newMap('면담 대상'); m.root.children = [
    mk('면담 목적'), mk('질문 목록', ['질문 1', '질문 2', '질문 3']), mk('확인할 점'), mk('후속 조치', [todo('할 일')])]; return m; } },
  // 계획
  { key: 'todo', cat: '계획', name: '할 일', build: () => { const m = newMap('할 일', 'org'); m.root.children = [
    mk('오늘', [todo('할 일'), todo('할 일')]), mk('이번 주', [todo('할 일'), todo('할 일')]), mk('나중에', [todo('할 일')])]; return m; } },
  { key: 'week', cat: '계획', name: '주간 계획', build: () => { const m = newMap('이번 주', 'org'); m.root.children = ['월', '화', '수', '목', '금', '토', '일'].map((d) => mk(d, [todo('일정')])); return m; } },
  { key: 'month', cat: '계획', name: '월간 계획', build: () => { const m = newMap('이번 달', 'org', pstyle('soft')); m.root.children = [1, 2, 3, 4].map((i) => mk(`${i}주`, [todo('목표'), todo('일정')])); return m; } },
  { key: 'year', cat: '계획', name: '연간 목표', build: () => { const m = newMap('올해 목표', 'timeline'); m.root.children = [1, 2, 3, 4].map((i) => mk(`${i}분기`, [todo('목표'), todo('목표')])); return m; } },
  { key: 'plan', cat: '계획', name: '추진 일정', build: () => { const m = newMap('프로젝트', 'timeline'); m.root.children = [
    mk('1단계 준비', [todo('세부 업무')]), mk('2단계 실행', [todo('세부 업무')]), mk('3단계 점검', [todo('세부 업무')]), mk('4단계 마무리', [todo('세부 업무')])]; return m; } },
  { key: 'trip', cat: '계획', name: '여행 계획', build: () => { const m = newMap('여행지', 'radial', pstyle('fun')); m.root.children = [
    mk('일정', ['1일차', '2일차']), mk('교통'), mk('숙소'), mk('가볼 곳'), mk('예산'), mk('준비물', [todo('준비물'), todo('준비물')])]; return m; } },
  // 분석
  { key: 'swot', cat: '분석', name: 'SWOT 분석', build: () => { const m = newMap('분석 대상', 'radial', pstyle('pill')); m.root.children = [
    mk('S 강점', ['항목'], { color: 1, side: 'L' }), mk('W 약점', ['항목'], { color: 2, side: 'R' }),
    mk('O 기회', ['항목'], { color: 6, side: 'L' }), mk('T 위협', ['항목'], { color: 3, side: 'R' })]; return m; } },
  { key: 'smart', cat: '분석', name: 'SMART 목표', build: () => { const m = newMap('목표'); m.root.children = [
    mk('S 구체적으로', ['무엇을?']), mk('M 측정 가능하게', ['숫자 목표는?']), mk('A 달성 가능하게', ['필요한 자원은?']),
    mk('R 관련 있게', ['왜 중요한가?']), mk('T 기한 정하기', ['언제까지?'])]; return m; } },
  { key: 'fishbone', cat: '분석', name: '원인 분석 (피시본)', build: () => { const m = newMap('문제 (결과)', 'fishbone'); m.root.children = [
    mk('사람', ['원인']), mk('방법', ['원인']), mk('제도·환경', ['원인']), mk('도구·시스템', ['원인'])]; return m; } },
  { key: 'problem', cat: '분석', name: '문제 해결', build: () => { const m = newMap('해결할 문제', 'tree'); m.root.children = [
    mk('현상'), mk('원인', ['원인 1', '원인 2']), mk('해결 방안', ['방안 1', '방안 2']), mk('실행 계획', [todo('누가 · 언제까지')])]; return m; } },
  { key: 'decision', cat: '분석', name: '의사 결정', build: () => { const m = newMap('결정할 문제', 'down', pstyle('soft')); m.root.children = [
    mk('선택지 A', ['장점', '단점']), mk('선택지 B', ['장점', '단점']), mk('판단 기준'), mk('결론')]; return m; } },
  { key: '5w1h', cat: '분석', name: '육하원칙', build: () => { const m = newMap('주제', 'radial', pstyle('pill')); m.root.children = ['누가', '언제', '어디서', '무엇을', '어떻게', '왜'].map((t) => mk(t)); return m; } },
  { key: 'kpt', cat: '분석', name: 'KPT 회고', build: () => { const m = newMap('회고 · 기간', 'org'); m.root.children = [
    mk('Keep 유지할 점', ['항목'], { color: 1 }), mk('Problem 문제점', ['항목'], { color: 2 }), mk('Try 시도할 점', [todo('항목')], { color: 6 })]; return m; } },
  { key: 'compare', cat: '분석', name: '비교 분석', build: () => { const m = newMap('비교 주제', 'down', pstyle('biz')); m.root.children = [
    mk('대안 A', ['비용', '장점', '단점']), mk('대안 B', ['비용', '장점', '단점']), mk('대안 C', ['비용', '장점', '단점'])]; return m; } },
  // 개인
  { key: 'book', cat: '개인', name: '독서 정리', build: () => { const m = newMap('책 제목', 'radial', pstyle('hand')); m.root.children = [
    mk('핵심 주장'), mk('인상 깊은 문장'), mk('나에게 적용할 점'), mk('더 알고 싶은 것')]; return m; } },
  { key: 'study', cat: '개인', name: '공부 노트', build: () => { const m = newMap('과목·주제', 'list'); m.root.children = [
    mk('핵심 개념', ['개념 1', '개념 2']), mk('예시'), mk('헷갈린 점'), mk('복습', [todo('복습 1'), todo('복습 2')])]; return m; } },
  { key: 'daily', cat: '개인', name: '하루 회고', build: () => { const m = newMap('오늘', 'radial', pstyle('soft')); m.root.children = [
    mk('잘한 일'), mk('아쉬운 일'), mk('배운 것'), mk('내일 할 일', [todo('할 일')])]; return m; } },
  { key: 'bucket', cat: '개인', name: '버킷리스트', build: () => { const m = newMap('버킷리스트', 'radial', pstyle('fun')); m.root.children = [
    mk('여행', [todo('항목')]), mk('배우기', [todo('항목')]), mk('도전', [todo('항목')]), mk('함께하기', [todo('항목')])]; return m; } },
];
const myTemplates = {
  list: () => loadJSON('mm.tpl', []),
  save: (l) => { const ok = saveJSON('mm.tpl', l); if (ok && window.Sync) Sync.changed(); return ok; },
  remove(id) { const t = loadJSON('mm.tpltomb', {}); t[id] = Date.now(); saveJSON('mm.tpltomb', t); return this.save(this.list().filter((x) => x.id !== id)); },
};

/* 복제할 때 id 새로 붙이기 (연결선 id도 함께) */
function cloneTree(node, idMap = new Map()) {
  const c = JSON.parse(JSON.stringify(node));
  (function re(n) { const nid = uid(); idMap.set(n.id, nid); n.id = nid; n.children = n.children || []; n.children.forEach(re); })(c);
  return c;
}
function cloneMap(m) {
  const idMap = new Map();
  const copy = normalizeMap(JSON.parse(JSON.stringify(m)));
  copy.id = uid();
  copy.root = cloneTree(m.root, idMap);
  copy.links = (m.links || []).filter((l) => idMap.has(l.from) && idMap.has(l.to)).map((l) => ({ ...l, id: uid(), from: idMap.get(l.from), to: idMap.get(l.to) }));
  return copy;
}
function findNode(root, id, parent = null) {
  if (root.id === id) return { node: root, parent };
  for (const c of root.children) { const r = findNode(c, id, root); if (r) return r; }
  return null;
}
function idsOf(node, set = new Set()) { set.add(node.id); node.children.forEach((c) => idsOf(c, set)); return set; }
function depthOf(id) { let d = -1; (function w(n, k) { if (n.id === id) { d = k; return true; } return n.children.some((c) => w(c, k + 1)); })(state.map.root, 0); return d; }

/* ---------- 글 → 마인드맵 ---------- */
function parseOutline(text) {
  const items = []; let headBase = 0; const indents = [];
  for (const raw of String(text).replace(/\r/g, '').split('\n')) {
    if (!raw.trim()) continue;
    const ex = raw.replace(/\t/g, '    ').replace(/　/g, '  ');
    const ind = ex.match(/^ */)[0].length;
    let s = ex.trim(), depth;
    const h = s.match(/^(#{1,6})\s+(.*)$/);
    if (h) { depth = h[1].length - 1; headBase = h[1].length; s = h[2]; indents.length = 0; }
    else {
      while (indents.length && indents[indents.length - 1] > ind) indents.pop();
      if (!indents.length || indents[indents.length - 1] < ind) indents.push(ind);
      depth = headBase + indents.length - 1;
    }
    s = s.replace(/^([-*+•·○●◦▪■□▶►▷→]|\d{1,2}[.)](?=\s)|\(\d{1,2}\)|[①-⑳]|[a-zA-Z][.)](?=\s)|[가나다라마바사아자차카타파하][.)](?=\s))\s*/, '');
    let done;
    const cb = s.match(/^\[( |x|X|v|V|완료)?\]\s*/);
    if (cb) { done = !!(cb[1] && cb[1].trim()); s = s.slice(cb[0].length); }
    s = s.replace(/^\*\*(.*)\*\*$/, '$1').trim();
    if (s) items.push({ depth, text: s, done });
  }
  if (!items.length) return null;
  const minD = Math.min(...items.map((i) => i.depth));
  let prev = -1;
  for (const it of items) { it.depth -= minD; if (it.depth > prev + 1) it.depth = prev + 1; prev = it.depth; }
  const tops = items.filter((i) => i.depth === 0).length;
  let root, offset, synthetic = false;
  if (tops === 1) { root = newNode(items.shift().text); offset = 1; }
  else { root = newNode('새 마인드맵'); offset = 0; synthetic = true; }
  const stack = [root];
  for (const it of items) {
    const d = it.depth - offset + 1;
    const node = newNode(it.text); if (it.done !== undefined) node.done = it.done;
    stack.length = Math.max(1, Math.min(d, stack.length));
    stack[stack.length - 1].children.push(node); stack.push(node);
  }
  return { root, synthetic };
}

/* ---------- 상태 ---------- */
const state = {
  view: 'home', map: null, sel: null, selLink: null, L: new Map(),
  vp: { x: 0, y: 0, k: 1 }, undo: [], redo: [],
  editing: null, drag: null, dropTarget: null, cat: '전체', query: '', linking: null, voice: null,
  styleClip: null, propTab: '글자', tplCat: '전체',
};

/* ---------- 글자 측정 ---------- */
const mctx = document.createElement('canvas').getContext('2d');
const mcache = new Map();
function tw(text, font) {
  const key = font + '|' + text;
  if (mcache.has(key)) return mcache.get(key);
  mctx.font = font; const w = mctx.measureText(text).width; mcache.set(key, w); return w;
}
function wrapText(text, font, maxW) {
  const out = [];
  for (const para of String(text || '').split('\n')) {
    let line = '';
    const push = () => { out.push(line.trim()); line = ''; };
    for (const tok of para.split(/(\s+)/)) {
      if (!tok) continue;
      if (tw(line + tok, font) <= maxW) { line += tok; continue; }
      if (/^\s+$/.test(tok)) { push(); continue; }
      if (line.trim()) push(); else line = '';
      if (tw(tok, font) <= maxW) { line = tok; continue; }
      for (const ch of tok) { if (line && tw(line + ch, font) > maxW) push(); line += ch; }
    }
    out.push(line.trim());
  }
  return out;
}

/* =========================================================
   배치 계산
   ========================================================= */
const BADGE_FONT = `600 11px ${SANS}`;
const SCALE = { s: 0.88, m: 1, l: 1.15, xl: 1.32 };
const WRAP = { narrow: 140, normal: 230, wide: 360, none: 3000 };
const SPACING = { tight: 0.7, normal: 1, wide: 1.45 };
let LSP = 1;

function fontFor(depth, layout, n, style) {
  const key = n.font || style.font || 'auto';
  const F = FONTS[key] || FONTS.auto;
  const fam = F.fam || (depth === 0 ? SERIF : SANS);
  let size;
  if (n.fs) size = n.fs;
  else {
    let base = depth === 0 ? 18 : depth === 1 ? (layout === 'org' ? 15 : 16) : 14;
    if (n.size === 's') base -= 2; else if (n.size === 'l') base += depth === 0 ? 5 : 3;
    size = Math.round(base * (SCALE[style.fontScale] || 1) * (F.scale || 1));
  }
  let weight = depth <= 1 ? 700 : 400;
  if (n.bold === true) weight = 700; else if (n.bold === false) weight = 400;
  const italic = !!n.italic;
  return { font: `${italic ? 'italic ' : ''}${weight} ${size}px ${fam}`, size, lh: Math.round(size * 1.42), weight, italic, fam };
}
function numLabel(style, depth, path) {
  if (style.numbering === 'top') return depth === 1 ? String(path[0] + 1).padStart(2, '0') : '';
  if (style.numbering === 'outline') return depth >= 1 ? path.map((i) => i + 1).join('.') : '';
  return '';
}
function checkStats(n, out = new Map()) {
  let t = 0, d = 0;
  for (const c of n.children) {
    if (c.done !== undefined) { t++; if (c.done) d++; }
    const s = checkStats(c, out); t += s.t; d += s.d;
  }
  out.set(n.id, { t, d });
  return { t, d, map: out };
}
function dateInfo(iso, done) {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  if (!y) return null;
  const day = new Date(y, m - 1, d), today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.round((day - today) / 86400000);
  const label = diff === 0 ? '오늘' : diff === 1 ? '내일' : `${m}/${d}`;
  const tone = done ? 'muted' : diff < 0 ? 'late' : diff <= 2 ? 'soon' : 'muted';
  return { label, tone };
}
function defaultShape(layout, depth) {
  switch (layout) {
    case 'down': return depth === 1 ? 'card' : 'box';
    case 'org': return depth === 1 ? 'card' : 'plain';
    case 'list': return depth === 1 ? 'line' : 'plain';
    case 'timeline': return depth === 1 ? 'pill' : 'plain';
    case 'fishbone': return depth === 1 ? 'box' : 'plain';
    default: return 'line';
  }
}
const BOXY = new Set(['round', 'pill', 'box', 'ellipse', 'hex']);
const SHAPE_PAD = {
  root: { l: 24, r: 24, t: 17, b: 17 }, line: { l: 5, r: 5, t: 3, b: 9 }, card: { l: 15, r: 15, t: 13, b: 13 },
  plain: { l: 16, r: 6, t: 4, b: 4 }, round: { l: 14, r: 14, t: 8, b: 8 }, pill: { l: 18, r: 18, t: 8, b: 8 },
  box: { l: 12, r: 12, t: 8, b: 8 }, ellipse: { l: 26, r: 26, t: 14, b: 14 }, hex: { l: 22, r: 22, t: 9, b: 9 }, none: { l: 4, r: 4, t: 3, b: 3 },
};

function computeLayout(map) {
  const L = new Map();
  const layout = map.layout, style = map.style || STYLE_DEFAULT;
  LSP = SPACING[style.spacing] || 1;
  const stats = style.rollup ? checkStats(map.root).map : null;
  (function walk(n, depth, parent, color, idx, path) {
    const e = { id: n.id, n, depth, parent, kids: [], idx };
    if (depth === 1) e.color = T.branches[(n.color ?? idx) % T.branches.length];
    else if (depth > 1) e.color = n.color != null ? T.branches[n.color % T.branches.length] : color;
    else e.color = n.color != null ? T.branches[n.color % T.branches.length] : T.root;
    let shape = n.shape && n.shape !== 'auto' ? n.shape : null;
    if (depth === 0) shape = shape && BOXY.has(shape) ? shape : 'root';
    else if (!shape) shape = style.shape !== 'auto' ? style.shape : defaultShape(layout, depth);
    e.shape = shape;
    let fill = n.fill && n.fill !== 'auto' ? n.fill : null;
    if (!fill) {
      if (depth === 0) fill = 'solid';
      else if (shape === 'card') fill = 'white';
      else if (BOXY.has(shape)) fill = style.fill !== 'auto' ? style.fill : (layout === 'timeline' && depth === 1 ? 'solid' : 'tint');
      else fill = 'none';
    }
    e.fill = fill;
    const f = fontFor(depth, layout, n, style);
    e.f = f;
    const maxW = n.wrap ? WRAP[n.wrap] : depth === 0 ? 260 : 230;
    e.lines = n.text ? wrapText(n.text, f.font, maxW) : ['　'];
    e.lineW = e.lines.map((l) => tw(l || ' ', f.font));
    e.textW = Math.max(...e.lineW);
    e.align = n.align || (shape === 'root' || shape === 'card' || BOXY.has(shape) ? 'center' : 'left');
    let pre = 0;
    if (depth > 0 && n.done !== undefined) pre += 22;
    if (n.icon) pre += f.size + 8;
    e.num = numLabel(style, depth, path);
    if (e.num) pre += tw(e.num, BADGE_FONT) + 6;
    let post = 0;
    if (n.note) post += 18;
    if (n.link) post += 18;
    e.badges = [];
    const st = stats && stats.get(n.id);
    if (st && st.t) e.badges.push({ kind: 'prog', text: `${st.d}/${st.t}`, full: st.d === st.t });
    const di = dateInfo(n.date, n.done === true);
    if (di) e.badges.push({ kind: 'date', text: di.label, tone: di.tone });
    for (const b of e.badges) { b.w = tw(b.text, BADGE_FONT) + (b.kind === 'date' ? 24 : 14); post += b.w + 5; }
    if (post) post += 5;
    e.pre = pre; e.post = post;
    e.contentW = pre + e.textW + post;
    e.imgW = 0; e.imgH = 0;
    if (n.img) { const w = Math.min(n.imgW || 160, depth === 0 ? 200 : 160); e.imgW = w; e.imgH = Math.round(w * ((n.imgH || 120) / (n.imgW || 160))); }
    const pad = SHAPE_PAD[shape];
    e.pad = pad;
    const innerW = Math.max(e.contentW, e.imgW);
    const innerH = (e.imgH ? e.imgH + 6 : 0) + e.lines.length * f.lh;
    e.w = innerW + pad.l + pad.r; e.h = innerH + pad.t + pad.b;
    if (shape === 'root') { e.w = Math.max(e.w, 130); e.h = Math.max(e.h, 62); }
    if (shape === 'card') e.w = Math.max(e.w, 132);
    if (shape === 'ellipse') e.w = Math.max(e.w, e.h * 1.4);
    L.set(n.id, e);
    if (parent) L.get(parent).kids.push(e);
    if (!n.collapsed) n.children.forEach((c, i) => walk(c, depth + 1, n.id, e.color, i, [...path, i]));
  })(map.root, 0, null, null, 0, []);

  const root = L.get(map.root.id);
  switch (layout) {
    case 'org': layoutOrg(root); break;
    case 'down': layoutDown(root); break;
    case 'list': layoutList(root); break;
    case 'timeline': layoutTimeline(root); break;
    case 'fishbone': layoutFishbone(root); break;
    case 'free': layoutTreeish(root, 'radial'); break;
    default: layoutTreeish(root, layout);
  }
  if (layout === 'free') {
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
  for (const e of L.values()) e.ay = e.shape === 'line' ? e.y + e.h : e.y + e.h / 2;
  return L;
}

/* 좌우 트리 (방사형·오른쪽·왼쪽) */
function gapY(d) { return (d === 0 ? 26 : d === 1 ? 12 : 8) * LSP; }
function gapX(d) { return (d === 0 ? 70 : 36) * LSP; }
function subH(e) {
  const g = gapY(e.depth);
  const t = e.kids.reduce((s, k) => s + subH(k), 0) + g * Math.max(0, e.kids.length - 1);
  e.sub = Math.max(e.h, t);
  return e.sub;
}
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
  else if (lay === 'left') Lf = root.kids;
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
/* 목록 (조직도 아래쪽·개요형·타임라인·피시본 세부) */
function listSize(e) {
  e.lw = e.w; e.lh = e.h;
  for (const c of e.kids) { listSize(c); e.lw = Math.max(e.lw, 22 * LSP + c.lw); e.lh += 8 * LSP + c.lh; }
}
function placeList(e, x, y) {
  e.x = x; e.y = y; e.dir = 1;
  let cy = y + e.h + 8 * LSP;
  for (const c of e.kids) { placeList(c, x + 22 * LSP, cy); cy += c.lh + 8 * LSP; }
}
function layoutOrg(root) {
  root.kids.forEach(listSize);
  root.x = -root.w / 2; root.y = 0; root.dir = 1;
  const g = 28 * LSP;
  const total = root.kids.reduce((s, k) => s + k.lw, 0) + g * Math.max(0, root.kids.length - 1);
  let x = -total / 2;
  for (const k of root.kids) { placeList(k, x, root.h + 64 * LSP); x += k.lw + g; }
}
function layoutList(root) { listSize(root); placeList(root, 0, 0); }
/* 하향 트리 */
function subWd(e) {
  const g = 22 * LSP;
  const t = e.kids.reduce((s, k) => s + subWd(k), 0) + g * Math.max(0, e.kids.length - 1);
  e.subw = Math.max(e.w, t);
  return e.subw;
}
function placeDown(e, xLeft, y) {
  e.dir = 1; e.x = xLeft + (e.subw - e.w) / 2; e.y = y;
  const g = 22 * LSP;
  const total = e.kids.reduce((s, k) => s + k.subw, 0) + g * Math.max(0, e.kids.length - 1);
  let cx = xLeft + (e.subw - total) / 2;
  const ny = y + e.h + 48 * LSP;
  for (const k of e.kids) { placeDown(k, cx, ny); cx += k.subw + g; }
}
function layoutDown(root) { subWd(root); placeDown(root, -root.subw / 2, -root.h / 2); }
/* 타임라인: 큰 가지가 가로축 위에, 세부는 위·아래 번갈아 */
function layoutTimeline(root) {
  root.x = 0; root.y = -root.h / 2; root.dir = 1;
  let axis = root.w + 70 * LSP;
  const lastRight = { up: -Infinity, down: -Infinity };
  root.kids.forEach((k, i) => {
    k.dir = 1; k.tl = i % 2 === 0 ? 'down' : 'up';
    k.kids.forEach(listSize);
    const bw = Math.max(0, ...k.kids.map((c) => c.lw + 16));
    const bh = k.kids.reduce((s, c) => s + c.lh, 0) + 8 * LSP * Math.max(0, k.kids.length - 1);
    k.x = Math.max(axis, lastRight[k.tl] + 30 * LSP);
    k.y = -k.h / 2;
    let cy = k.tl === 'down' ? k.y + k.h + 18 * LSP : k.y - 18 * LSP - bh;
    for (const c of k.kids) { placeList(c, k.x + 16, cy); cy += c.lh + 8 * LSP; }
    lastRight[k.tl] = k.x + Math.max(k.w, bw);
    axis = k.x + k.w + 28 * LSP;
  });
  root.axisEnd = Math.max(axis, root.x + root.w + 40);
}
/* 피시본: 오른쪽 머리(주제), 가시가 위·아래로 */
function layoutFishbone(root) {
  root.x = 0; root.y = -root.h / 2; root.dir = 1;
  const bs = 46 * LSP, kids = root.kids;
  kids.forEach((k) => {
    k.kids.forEach(listSize);
    k.bh = k.kids.reduce((s, c) => s + c.lh, 0) + 8 * LSP * Math.max(0, k.kids.length - 1);
    k.bw = Math.max(k.w, ...k.kids.map((c) => c.lw + 30 + bs));
  });
  let right = root.x - 50 * LSP;
  for (let col = 0; col * 2 < kids.length; col++) {
    const pair = kids.slice(col * 2, col * 2 + 2);
    const cw = Math.max(...pair.map((k) => k.bw)) + 30 * LSP;
    const left = right - cw;
    pair.forEach((k, j) => {
      const top = j === 0;
      k.dir = 1; k.fbTop = top;
      k.x = left;
      const near = 34 * LSP;
      if (top) {
        k.y = -(near + k.bh + 10 * LSP + k.h);
        const y0 = k.y + k.h, x0 = k.x + 14;
        k.bone = { x0, y0, x1: x0 + bs, y1: 0 };
        let cy = y0 + 10 * LSP;
        for (const c of k.kids) { const bx = boneX(k.bone, cy + c.h / 2); placeList(c, bx + 14, cy); cy += c.lh + 8 * LSP; }
      } else {
        k.y = near + k.bh + 10 * LSP;
        const y0 = k.y, x0 = k.x + 14;
        k.bone = { x0, y0, x1: x0 + bs, y1: 0 };
        let cy = near;
        for (const c of k.kids) { const bx = boneX(k.bone, cy + c.h / 2); placeList(c, bx + 14, cy); cy += c.lh + 8 * LSP; }
      }
    });
    right = left - 10 * LSP;
  }
  root.spineStart = Math.min(right, root.x - 60);
}
function boneX(b, y) { return b.x0 + (b.x1 - b.x0) * (y - b.y0) / ((b.y1 - b.y0) || 1); }

/* =========================================================
   그리기
   ========================================================= */
const LW = { thin: 0.6, normal: 1, thick: 1.7 };
const DASH = { solid: '', dash: '7 5', dot: '1.5 4.5' };
function lineAttrs(c, style, baseW) {
  const k = LW[c.n.lw || style.lineWidth] || 1;
  const dash = DASH[c.n.ld || style.lineDash] || '';
  const color = style.lineColor === 'gray' ? T.muted : c.color;
  return { w: baseW * k, dash, color, attr: `stroke="${color}" stroke-width="${(baseW * k).toFixed(2)}" fill="none" stroke-linecap="round" stroke-linejoin="round"${dash ? ` stroke-dasharray="${dash}"` : ''}` };
}
function edgePath(p, q, o, shape) {
  if (shape === 'straight') return `M${p.x},${p.y} L${q.x},${q.y}`;
  if (o === 'h') {
    const mx = (p.x + q.x) / 2;
    if (shape === 'elbow') return `M${p.x},${p.y} H${mx} V${q.y} H${q.x}`;
    if (shape === 'relbow') {
      const r = Math.min(12, Math.abs(q.y - p.y) / 2, Math.abs(q.x - p.x) / 2);
      if (r < 1) return `M${p.x},${p.y} H${q.x}`;
      const sx = Math.sign(q.x - p.x), sy = Math.sign(q.y - p.y);
      return `M${p.x},${p.y} H${mx - sx * r} Q${mx},${p.y} ${mx},${p.y + sy * r} V${q.y - sy * r} Q${mx},${q.y} ${mx + sx * r},${q.y} H${q.x}`;
    }
    return `M${p.x},${p.y} C${mx},${p.y} ${mx},${q.y} ${q.x},${q.y}`;
  }
  const my = (p.y + q.y) / 2;
  if (shape === 'elbow') return `M${p.x},${p.y} V${my} H${q.x} V${q.y}`;
  if (shape === 'relbow') {
    const r = Math.min(12, Math.abs(q.x - p.x) / 2, Math.abs(q.y - p.y) / 2);
    if (r < 1) return `M${p.x},${p.y} V${q.y}`;
    const sx = Math.sign(q.x - p.x), sy = Math.sign(q.y - p.y);
    return `M${p.x},${p.y} V${my - sy * r} Q${p.x},${my} ${p.x + sx * r},${my} H${q.x - sx * r} Q${q.x},${my} ${q.x},${my + sy * r} V${q.y}`;
  }
  return `M${p.x},${p.y} C${p.x},${my} ${q.x},${my} ${q.x},${q.y}`;
}
function ribbonPath(p, q, o, shape, w0, w1) {
  if (shape === 'straight') {
    const dx = q.x - p.x, dy = q.y - p.y, l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
    return `M${p.x + nx * w0},${p.y + ny * w0} L${q.x + nx * w1},${q.y + ny * w1} L${q.x - nx * w1},${q.y - ny * w1} L${p.x - nx * w0},${p.y - ny * w0} Z`;
  }
  if (o === 'h') {
    const mx = (p.x + q.x) / 2;
    return `M${p.x},${p.y - w0} C${mx},${p.y - w0} ${mx},${q.y - w1} ${q.x},${q.y - w1} L${q.x},${q.y + w1} C${mx},${q.y + w1} ${mx},${p.y + w0} ${p.x},${p.y + w0} Z`;
  }
  const my = (p.y + q.y) / 2;
  return `M${p.x - w0},${p.y} C${p.x - w0},${my} ${q.x - w1},${my} ${q.x - w1},${q.y} L${q.x + w1},${q.y} C${q.x + w1},${my} ${p.x + w0},${my} ${p.x + w0},${p.y} Z`;
}
function listEdge(x0, y0, cx, cy, shape) {
  if (shape === 'straight') return `M${x0},${y0} L${cx},${cy}`;
  if (shape === 'elbow') return `M${x0},${y0} V${cy} H${cx}`;
  const r = Math.min(9, Math.abs(cy - y0) / 2, Math.abs(cx - x0) / 2), sy = Math.sign(cy - y0) || 1;
  return `M${x0},${y0} V${cy - sy * r} Q${x0},${cy} ${x0 + r},${cy} H${cx}`;
}
function rootEdge(p, q, o, c, style) {
  const shape = style.lineShape;
  const la = lineAttrs(c, style, 3.2);
  const k = LW[c.n.lw || style.lineWidth] || 1;
  if (style.taper !== false && !la.dash && (shape === 'curve' || shape === 'straight')) {
    const pp = o === 'h' ? { x: p.x - c.dir * 14, y: p.y } : p;
    return `<path d="${ribbonPath(pp, q, o, shape, 6.5 * k, 1.5 * k)}" fill="${la.color}"/>`;
  }
  return `<path d="${edgePath(p, q, o, shape)}" ${la.attr}/>`;
}
function outAnchor(e, child) {
  if (e.depth === 0) return { x: child.dir > 0 ? e.x + e.w : e.x, y: e.y + e.h / 2 };
  return { x: e.dir > 0 ? e.x + e.w : e.x, y: e.ay };
}
function inAnchor(c) { return { x: c.dir > 0 ? c.x : c.x + c.w, y: c.ay }; }

function edgeSVG(L, map) {
  const layout = map.layout, style = map.style;
  let out = '';
  const root = [...L.values()].find((e) => e.depth === 0);
  const listKids = (e) => {
    for (const c of e.kids) {
      const la = lineAttrs(c, style, 1.5);
      out += `<path d="${listEdge(e.x + 9, e.y + e.h, c.x, c.y + c.h / 2, style.lineShape)}" ${la.attr} opacity=".7"/>`;
    }
  };
  const deep = (e) => { listKids(e); e.kids.forEach(deep); };
  const grayOf = (w) => lineAttrs({ n: {}, color: T.muted }, { ...style, lineColor: 'gray' }, w);
  if (HFAM.has(layout)) {
    for (const e of L.values()) for (const c of e.kids) {
      const p = outAnchor(e, c), q = inAnchor(c);
      if (e.depth === 0) out += rootEdge(p, q, 'h', c, style);
      else { const la = lineAttrs(c, style, c.depth === 2 ? 2 : 1.5); out += `<path d="${edgePath(p, q, 'h', style.lineShape)}" ${la.attr} opacity=".8"/>`; }
    }
  } else if (layout === 'down') {
    for (const e of L.values()) for (const c of e.kids) {
      const p = { x: e.x + e.w / 2, y: e.y + e.h }, q = { x: c.x + c.w / 2, y: c.y };
      if (e.depth === 0) out += rootEdge(p, q, 'v', c, style);
      else { const la = lineAttrs(c, style, c.depth === 2 ? 2 : 1.5); out += `<path d="${edgePath(p, q, 'v', style.lineShape)}" ${la.attr} opacity=".8"/>`; }
    }
  } else if (layout === 'org') {
    const kids = root.kids;
    if (kids.length) {
      const rx = root.x + root.w / 2, ry = root.y + root.h, by = ry + 30 * LSP;
      const xs = kids.map((k) => k.x + k.w / 2);
      out += `<path d="M${rx},${ry} V${by} M${Math.min(...xs, rx)},${by} H${Math.max(...xs, rx)}" ${grayOf(2).attr} opacity=".6"/>`;
      for (const k of kids) { const la = lineAttrs(k, style, 2.5); out += `<path d="M${k.x + k.w / 2},${by} V${k.y}" ${la.attr}/>`; }
    }
    for (const e of L.values()) if (e.depth >= 1) listKids(e);
  } else if (layout === 'list') {
    for (const e of L.values()) listKids(e);
  } else if (layout === 'timeline') {
    const ax = grayOf(3);
    out += `<path d="M${root.x + root.w},0 H${root.axisEnd}" ${ax.attr} opacity=".55"/>`;
    out += `<path d="M${root.axisEnd - 2},-6 l9,6 l-9,6" ${ax.attr} stroke-dasharray="" opacity=".55"/>`;
    for (const k of root.kids) {
      for (const c of k.kids) {
        const la = lineAttrs(c, style, 1.6);
        const y0 = k.tl === 'down' ? k.y + k.h : k.y;
        out += `<path d="${listEdge(k.x + 10, y0, c.x, c.y + c.h / 2, style.lineShape)}" ${la.attr} opacity=".75"/>`;
        deep(c);
      }
    }
  } else if (layout === 'fishbone') {
    out += `<path d="M${root.spineStart},0 H${root.x}" stroke="${T.dark ? T.muted : T.root}" stroke-width="${(4 * (LW[style.lineWidth] || 1)).toFixed(1)}" stroke-linecap="round"/>`;
    for (const k of root.kids) {
      const b = k.bone, la = lineAttrs(k, style, 2.4);
      out += `<path d="M${b.x0},${b.y0} L${b.x1},${b.y1}" ${la.attr}/>`;
      for (const c of k.kids) {
        const cy = c.y + c.h / 2, bx = boneX(b, cy), lc = lineAttrs(c, style, 1.4);
        out += `<path d="M${bx},${cy} H${c.x}" ${lc.attr} opacity=".75"/>`;
        deep(c);
      }
    }
  }
  return out;
}

/* 연결선 (가지와 가지를 잇는 관계선) */
function rectEdge(e, fx, fy) {
  const cx = e.x + e.w / 2, cy = e.y + e.h / 2;
  const dx = fx - cx, dy = fy - cy;
  if (!dx && !dy) return { x: cx, y: cy };
  const s = Math.min(Math.abs((e.w / 2 + 4) / (dx || 1e-9)), Math.abs((e.h / 2 + 4) / (dy || 1e-9)));
  return { x: cx + dx * s, y: cy + dy * s };
}
function linksSVG(L, map) {
  let out = '';
  for (const lk of map.links || []) {
    const a = L.get(lk.from), b = L.get(lk.to);
    if (!a || !b) continue;
    const ac = { x: a.x + a.w / 2, y: a.y + a.h / 2 }, bc = { x: b.x + b.w / 2, y: b.y + b.h / 2 };
    const mx = (ac.x + bc.x) / 2, my = (ac.y + bc.y) / 2;
    const dx = bc.x - ac.x, dy = bc.y - ac.y, len = Math.hypot(dx, dy) || 1;
    const bend = Math.min(80, len * 0.28) * (lk.flip ? -1 : 1);
    const c = { x: mx - (dy / len) * bend, y: my + (dx / len) * bend };
    const p = rectEdge(a, c.x, c.y), q = rectEdge(b, c.x, c.y);
    const ang = Math.atan2(q.y - c.y, q.x - c.x), ah = 9;
    const sel = state.selLink === lk.id;
    const col = sel ? T.gold : T.muted;
    const d = `M${p.x},${p.y} Q${c.x},${c.y} ${q.x},${q.y}`;
    out += `<g data-link="${lk.id}" class="hit"><path d="${d}" stroke="transparent" stroke-width="18" fill="none"/>`;
    out += `<path d="${d}" stroke="${col}" stroke-width="${sel ? 2.5 : 1.8}" fill="none" stroke-dasharray="6 5" stroke-linecap="round"/>`;
    out += `<path d="M${q.x},${q.y} L${q.x - ah * Math.cos(ang - 0.45)},${q.y - ah * Math.sin(ang - 0.45)} L${q.x - ah * Math.cos(ang + 0.45)},${q.y - ah * Math.sin(ang + 0.45)} Z" fill="${col}"/>`;
    if (lk.label) {
      const tx = 0.25 * p.x + 0.5 * c.x + 0.25 * q.x, ty = 0.25 * p.y + 0.5 * c.y + 0.25 * q.y;
      const lw = tw(lk.label, `500 12px ${SANS}`) + 14;
      out += `<rect x="${tx - lw / 2}" y="${ty - 11}" width="${lw}" height="22" rx="11" fill="${T.bg}" stroke="${col}" stroke-width="1"/>`;
      out += `<text x="${tx}" y="${ty + 4}" text-anchor="middle" font-family="${esc(SANS)}" font-size="12" font-weight="500" fill="${T.ink2}">${esc(lk.label)}</text>`;
    }
    out += '</g>';
  }
  return out;
}

function badgeSVG(b, x, y, color) {
  let s = '';
  if (b.kind === 'prog') {
    const fill = b.full ? color : 'none';
    s += `<rect x="${x}" y="${y - 9}" width="${b.w}" height="18" rx="9" fill="${fill}" stroke="${color}" stroke-width="1.2"${b.full ? '' : ' stroke-opacity=".7"'}/>`;
    s += `<text x="${x + b.w / 2}" y="${y + 4}" text-anchor="middle" font-family="${esc(SANS)}" font-size="11" font-weight="600" fill="${b.full ? T.surface : color}">${esc(b.text)}</text>`;
  } else {
    const c = b.tone === 'late' ? T.danger : b.tone === 'soon' ? T.goldText : T.muted;
    s += `<rect x="${x}" y="${y - 9}" width="${b.w}" height="18" rx="5" fill="none" stroke="${c}" stroke-width="1.2"/>`;
    s += `<rect x="${x + 5}" y="${y - 4.5}" width="10" height="9" rx="1.5" fill="none" stroke="${c}" stroke-width="1.2"/><path d="M${x + 5},${y - 1.5} h10" stroke="${c}" stroke-width="1.2"/>`;
    s += `<text x="${x + 19}" y="${y + 4}" font-family="${esc(SANS)}" font-size="11" font-weight="600" fill="${c}">${esc(b.text)}</text>`;
  }
  return s;
}
function markers(n, x, y, color) {
  let s = '';
  if (n.note) { s += `<path d="M${x},${y - 5} h10 v7 h-6 l-3,3 v-3 h-1 z" fill="none" stroke="${color}" stroke-width="1.4" stroke-linejoin="round"/>`; x += 18; }
  if (n.link) { s += `<g transform="translate(${x},${y - 6}) scale(.5)" fill="none" stroke="${color}" stroke-width="2.6" stroke-linecap="round"><path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></g>`; x += 18; }
  return { s, x };
}
function shapeEl(shape, x, y, w, h, attrs) {
  if (shape === 'ellipse') return `<ellipse cx="${x + w / 2}" cy="${y + h / 2}" rx="${w / 2}" ry="${h / 2}" ${attrs}/>`;
  if (shape === 'hex') { const i = Math.min(14, h / 2); return `<polygon points="${x + i},${y} ${x + w - i},${y} ${x + w},${y + h / 2} ${x + w - i},${y + h} ${x + i},${y + h} ${x},${y + h / 2}" ${attrs}/>`; }
  const rx = { round: Math.min(10, h / 2), pill: h / 2, box: 3, card: 9, root: 12 }[shape] ?? 6;
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" ${attrs}/>`;
}
function textColorFor(e) {
  const tc = e.n.tc;
  if (tc && tc !== 'auto') {
    if (tc === 'ink') return T.ink; if (tc === 'muted') return T.muted; if (tc === 'white') return '#FFFFFF';
    if (tc[0] === 'b') return T.branches[+tc.slice(1) % T.branches.length];
  }
  if (e.depth === 0) return e.fill === 'solid' ? T.rootInk : T.ink;
  if (e.fill === 'solid') return T.dark ? T.bg : '#FFFFFF';
  if (e.depth === 1 && ['line', 'card', 'none'].includes(e.shape)) return e.color;
  return e.depth === 1 ? T.ink : T.ink2;
}

function nodeSVG(e, map, opts = {}) {
  const layout = map.layout, style = map.style;
  const n = e.n, sel = !opts.plain && state.sel === e.id, f = e.f, pad = e.pad;
  const isDrag = state.drag && state.drag.mode === 'ghost' && (state.drag.id === e.id || state.drag.desc.has(e.id));
  let s = `<g data-id="${e.id}" class="hit"${isDrag ? ' opacity=".3"' : ''}>`;
  s += `<rect x="${e.x - 4}" y="${e.y - 4}" width="${e.w + 8}" height="${e.h + 8}" fill="transparent"/>`;
  if (state.dropTarget === e.id) s += `<rect x="${e.x - 6}" y="${e.y - 6}" width="${e.w + 12}" height="${e.h + 12}" rx="10" fill="${T.sel}" stroke="${T.gold}" stroke-width="2" stroke-dasharray="5 4"/>`;
  if (state.linking && state.linking !== e.id && !opts.plain) s += `<rect x="${e.x - 5}" y="${e.y - 5}" width="${e.w + 10}" height="${e.h + 10}" rx="9" fill="none" stroke="${T.gold}" stroke-width="1.5" stroke-dasharray="3 4" opacity=".7"/>`;
  const done = n.done === true;
  const isRoot = e.depth === 0;
  const textColor = textColorFor(e);
  const shadow = (n.shadow ?? style.shadow) ? ` filter="url(#${opts.fid})"` : '';
  const accent = isRoot ? T.gold : e.color;

  if (e.shape === 'root') {
    s += `<rect x="${e.x}" y="${e.y}" width="${e.w}" height="${e.h}" rx="12" fill="${n.color != null ? e.color : T.root}"${T.dark ? ` stroke="${T.line}"` : ''}${shadow}/>`;
    s += `<rect x="${e.x + 6}" y="${e.y + 6}" width="${e.w - 12}" height="${e.h - 12}" rx="8" fill="none" stroke="${T.gold}" stroke-opacity=".55"/>`;
    if (sel) s += `<rect x="${e.x - 5}" y="${e.y - 5}" width="${e.w + 10}" height="${e.h + 10}" rx="16" fill="none" stroke="${T.gold}" stroke-width="2.5"/>`;
  } else if (e.shape === 'line') {
    if (sel) s += `<rect x="${e.x - 3}" y="${e.y - 2}" width="${e.w + 6}" height="${e.h + 2}" rx="6" fill="${T.sel}"/>`;
    const uh = (e.depth === 1 ? 3 : e.depth === 2 ? 2 : 1.5);
    const la = lineAttrs(e, style, uh);
    if (la.dash) s += `<path d="M${e.x},${e.y + e.h - la.w / 2} H${e.x + e.w}" ${la.attr}/>`;
    else s += `<rect x="${e.x}" y="${e.y + e.h - la.w}" width="${e.w}" height="${la.w}" rx="${la.w / 2}" fill="${la.color}"/>`;
  } else if (e.shape === 'plain' || e.shape === 'none') {
    if (sel) s += `<rect x="${e.x - 3}" y="${e.y - 2}" width="${e.w + 6}" height="${e.h + 4}" rx="6" fill="${T.sel}"/>`;
    if (e.shape === 'plain') s += `<circle cx="${e.x + 5}" cy="${e.y + pad.t + (e.imgH ? e.imgH + 6 : 0) + f.lh / 2}" r="3" fill="${e.color}"/>`;
  } else {
    const color = isRoot ? (n.color != null ? e.color : T.root) : e.color;
    let fill = 'none', fop = '';
    if (e.fill === 'tint') { fill = color; fop = ` fill-opacity="${T.dark ? .24 : .13}"`; }
    else if (e.fill === 'solid') fill = color;
    else if (e.fill === 'white') fill = T.surface;
    let bmode = n.border || 'auto';
    if (bmode === 'auto') bmode = e.shape === 'card' ? 'card' : e.fill === 'solid' ? 'none' : 'solid';
    let stroke = 'none', sw = n.bw ?? (e.shape === 'box' ? 1.6 : 1.3), dash = '';
    if (bmode === 'card') { stroke = T.line; sw = n.bw ?? 1; }
    else if (bmode !== 'none') { stroke = color; dash = DASH[bmode] || ''; }
    s += shapeEl(e.shape, e.x, e.y, e.w, e.h, `fill="${fill}"${fop} stroke="${stroke}" stroke-width="${sw}"${dash ? ` stroke-dasharray="${dash}"` : ''}${shadow}`);
    if (e.shape === 'card') s += `<rect x="${e.x}" y="${e.y}" width="${e.w}" height="5" rx="2.5" fill="${color}"/>`;
    if (sel) s += shapeEl(e.shape, e.x - 4, e.y - 4, e.w + 8, e.h + 8, `fill="none" stroke="${T.gold}" stroke-width="2.5"`);
  }

  const innerW = e.w - pad.l - pad.r;
  const imgTop = e.y + pad.t;
  if (e.imgH) {
    const ix = e.align === 'center' ? e.x + (e.w - e.imgW) / 2 : e.align === 'right' ? e.x + e.w - pad.r - e.imgW : e.x + pad.l;
    s += `<image href="${n.img}" x="${ix}" y="${imgTop}" width="${e.imgW}" height="${e.imgH}" preserveAspectRatio="xMidYMid slice"/>`;
  }
  const top = imgTop + (e.imgH ? e.imgH + 6 : 0);
  let x0 = e.x + pad.l + (e.align === 'center' ? Math.max(0, (innerW - e.contentW) / 2) : e.align === 'right' ? Math.max(0, innerW - e.contentW) : 0);
  const mid = top + f.lh / 2;
  if (!isRoot && n.done !== undefined) {
    s += `<g data-check="${e.id}"><rect x="${x0 - 4}" y="${mid - 12}" width="24" height="24" fill="transparent"/>`;
    s += done
      ? `<rect x="${x0}" y="${mid - 7.5}" width="15" height="15" rx="4" fill="${e.fill === 'solid' ? T.surface : accent}"/><path d="M${x0 + 4},${mid} l3,3 l5,-6" stroke="${e.fill === 'solid' ? accent : T.surface}" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
      : `<rect x="${x0 + .75}" y="${mid - 6.75}" width="13.5" height="13.5" rx="3.5" fill="none" stroke="${e.fill === 'solid' ? textColor : accent}" stroke-width="1.6"/>`;
    s += '</g>';
    x0 += 22;
  }
  if (n.icon) { s += `<text x="${x0}" y="${top + f.lh * 0.76}" font-size="${f.size + 1}">${esc(n.icon)}</text>`; x0 += f.size + 8; }
  if (e.num) { s += `<text x="${x0}" y="${top + f.lh * 0.72}" font-family="${esc(SANS)}" font-size="11" font-weight="600" fill="${e.fill === 'solid' ? textColor : isRoot ? T.gold : T.goldText}" opacity="${e.fill === 'solid' ? .8 : 1}">${esc(e.num)}</text>`; x0 += tw(e.num, BADGE_FONT) + 6; }
  e.lines.forEach((l, i) => {
    const lw = e.lineW[i];
    const lx = x0 + (e.align === 'center' ? (e.textW - lw) / 2 : e.align === 'right' ? e.textW - lw : 0);
    const by = top + f.lh * (i + 0.74);
    s += `<text x="${lx}" y="${by}" font-family="${esc(f.fam)}" font-size="${f.size}" font-weight="${f.weight}"${f.italic ? ' font-style="italic"' : ''} fill="${textColor}"${done ? ' opacity=".55"' : ''}>${esc(l)}</text>`;
    if (n.underline) s += `<line x1="${lx}" x2="${lx + lw}" y1="${by + 3}" y2="${by + 3}" stroke="${textColor}" stroke-width="1.2"/>`;
    if (n.strike || done) s += `<line x1="${lx}" x2="${lx + lw}" y1="${top + f.lh * (i + 0.47)}" y2="${top + f.lh * (i + 0.47)}" stroke="${textColor}" stroke-opacity="${done ? .55 : 1}" stroke-width="1.3"/>`;
  });
  let mx = x0 + e.textW + 5;
  const mcol = e.fill === 'solid' ? textColor : accent;
  const mk2 = markers(n, mx, mid, mcol);
  s += mk2.s; mx = mk2.x;
  for (const b of e.badges) { s += badgeSVG(b, mx, mid, mcol); mx += b.w + 5; }
  s += '</g>';

  const showHandle = !isRoot && n.children.length && (n.collapsed || (sel && !opts.plain));
  if (showHandle) {
    let hx, hy;
    if (HFAM.has(layout)) { const a = outAnchor(e, { dir: e.dir }); hx = a.x + (e.dir > 0 ? 13 : -13); hy = a.y; }
    else if (layout === 'down') { hx = e.x + e.w / 2; hy = e.y + e.h + 13; }
    else { hx = e.x + e.w + 13; hy = e.y + e.h / 2; }
    s += `<g${opts.plain ? '' : ` data-toggle="${e.id}" class="hit"`}><circle cx="${hx}" cy="${hy}" r="16" fill="transparent"/><circle cx="${hx}" cy="${hy}" r="10" fill="${T.surface}" stroke="${e.color}" stroke-width="1.5"/>`;
    s += n.collapsed
      ? `<text x="${hx}" y="${hy + 3.5}" text-anchor="middle" font-family="${esc(SANS)}" font-size="10" font-weight="700" fill="${e.color}">${countNodes(n) - 1}</text>`
      : `<path d="M${hx - 4.5},${hy} h9" stroke="${e.color}" stroke-width="1.8" stroke-linecap="round"/>`;
    s += '</g>';
  }
  return s;
}

let filterSeq = 0;
function mapSVGInner(L, map, opts = {}) {
  opts = { ...opts, fid: 'mmsh' + (++filterSeq) };
  let s = `<defs><filter id="${opts.fid}" x="-20%" y="-20%" width="140%" height="170%"><feDropShadow dx="0" dy="2.5" stdDeviation="2.6" flood-color="#0B1526" flood-opacity=".2"/></filter></defs>` + edgeSVG(L, map);
  s += linksSVG(L, map);
  const list = [...L.values()];
  for (const e of list) if (e.depth > 0) s += nodeSVG(e, map, opts);
  s += nodeSVG(list[0], map, opts);
  return s;
}
function bounds(L) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const e of L.values()) { x0 = Math.min(x0, e.x); y0 = Math.min(y0, e.y); x1 = Math.max(x1, e.x + e.w); y1 = Math.max(y1, e.y + e.h); }
  const r = [...L.values()][0];
  if (r && r.spineStart != null) x0 = Math.min(x0, r.spineStart);
  if (r && r.axisEnd != null) x1 = Math.max(x1, r.axisEnd + 12);
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 };
}

/* =========================================================
   편집 화면
   ========================================================= */
const svg = $('#canvas'), world = $('#world'), stage = $('#stage'), pill = $('#pill'), editInput = $('#editInput');
$('#layoutTabs').innerHTML = LAYOUTS.map(([k, l]) => `<button data-layout="${k}">${l}</button>`).join('');

function render() {
  if (!state.map) return;
  const map = state.map;
  state.L = computeLayout(map);
  world.innerHTML = mapSVGInner(state.L, map);
  $('#titleBtn').textContent = map.root.text || '제목 없음';
  document.querySelectorAll('#layoutTabs button').forEach((b) => b.classList.toggle('on', b.dataset.layout === map.layout));
  $('#undoBtn').disabled = !state.undo.length;
  $('#redoBtn').disabled = !state.redo.length;
  document.body.classList.toggle('linking', !!state.linking);
  renderOutline();
  applyView();
}
let lastGoodVp = { x: 0, y: 0, k: 1 };
function applyView() {
  if (![state.vp.x, state.vp.y, state.vp.k].every(Number.isFinite) || state.vp.k <= 0) state.vp = { ...lastGoodVp };
  else lastGoodVp = { ...state.vp };
  const { x, y, k } = state.vp;
  world.setAttribute('transform', `translate(${x},${y}) scale(${k})`);
  const bg = state.map?.style?.bg || 'plain', g = 24 * k;
  svg.style.backgroundColor = T.bg;
  if (bg === 'dots') { const r = Math.max(1, 1.2 * k); svg.style.backgroundImage = `radial-gradient(${T.dark ? 'rgba(255,255,255,.16)' : 'rgba(19,39,74,.22)'} ${r}px, transparent ${r + .5}px)`; svg.style.backgroundSize = `${g}px ${g}px`; }
  else if (bg === 'grid') { svg.style.backgroundImage = `linear-gradient(${T.grid} 1px, transparent 1px), linear-gradient(90deg, ${T.grid} 1px, transparent 1px)`; svg.style.backgroundSize = `${g}px ${g}px`; }
  else svg.style.backgroundImage = 'none';
  svg.style.backgroundPosition = `${x}px ${y}px`;
  placePill();
  if (state.editing) placeEditor();
}
function toScreen(wx, wy) { return { x: wx * state.vp.k + state.vp.x, y: wy * state.vp.k + state.vp.y }; }
function toWorld(sx, sy) { const r = svg.getBoundingClientRect(); return { x: (sx - r.left - state.vp.x) / state.vp.k, y: (sy - r.top - state.vp.y) / state.vp.k }; }

function fit() {
  const b = bounds(state.L), W = stage.clientWidth, H = stage.clientHeight;
  let k = clamp(Math.min((W - 48) / b.w, (H - 200) / b.h), 0.25, 1.25);
  const minK = W < 600 ? 0.62 : 0.3;
  if (k >= minK) {
    state.vp = { k, x: W / 2 - (b.x0 + b.w / 2) * k, y: (H - 90) / 2 - (b.y0 + b.h / 2) * k + 10 };
  } else {
    k = minK;
    const r = [...state.L.values()].find((e) => e.depth === 0);
    const lay = state.map.layout;
    let x = W / 2 - (r.x + r.w / 2) * k;
    if (lay === 'list' || lay === 'timeline') x = 20 - b.x0 * k;
    if (lay === 'fishbone') x = W - 20 - b.x1 * k;
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

function placeNotePeek() {
  const np = $('#notePeek'); if (!np) return;
  const e = state.sel && state.L.get(state.sel);
  const sh = $('#sheet');
  if (!e || !e.n.note || state.editing || state.drag || (!sh.hidden && !sh.classList.contains('side'))) { np.hidden = true; return; }
  np.innerHTML = `<b>메모</b>${esc(e.n.note)}`;
  np.hidden = false;
}
function placePill() {
  placeNotePeek();
  const e = state.sel && state.L.get(state.sel);
  const sh = $('#sheet');
  if (!e || state.editing || state.drag || state.linking || state.voice || (!sh.hidden && !sh.classList.contains('side'))) { pill.hidden = true; return; }
  pill.hidden = false;
  pill.querySelector('[data-act=delete]').hidden = e.depth === 0;
  pill.querySelector('[data-act=sibling]').hidden = e.depth === 0;
  const W = stage.clientWidth, H = stage.clientHeight;
  const pw = pill.offsetWidth, ph = pill.offsetHeight;
  const a = toScreen(e.x, e.y), b = toScreen(e.x + e.w, e.y + e.h);
  let x = (a.x + b.x) / 2 - pw / 2, y = b.y + 14;
  if (y + ph > H - 110) y = a.y - ph - 12;
  pill.style.left = clamp(x, 8, W - pw - 8) + 'px';
  pill.style.top = clamp(y, 8, H - ph - 8) + 'px';
}

/* ---------- 변경 + 되돌리기 ---------- */
let saveTimer = null;
function snapshot() { const m = state.map; return JSON.stringify({ root: m.root, layout: m.layout, links: m.links, style: m.style }); }
function restore(json) { Object.assign(state.map, JSON.parse(json)); }
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
  saveTimer = setTimeout(flushPending, 250);
}
/* 고친 내용이 있을 때만 저장 (열어 보기만 한 맵은 수정 시각이 바뀌지 않음) */
function flushPending() {
  if (!saveTimer) return;
  clearTimeout(saveTimer); saveTimer = null;
  if (state.map) store.put(state.map);
}
function afterRestore() {
  if (state.sel && !findNode(state.map.root, state.sel)) state.sel = null;
  if (state.selLink && !state.map.links.some((l) => l.id === state.selLink)) state.selLink = null;
  ensureMapFonts(state.map);
  commit();
  if (!$('#sheet').hidden) {
    if (sheetKind === 'props') { if (state.sel) openProps(); else closeSheet(); }
    else if (sheetKind === 'style') openStyleSheet();
  }
}
function undo() { if (!state.undo.length) return; state.redo.push(snapshot()); restore(state.undo.pop()); afterRestore(); }
function redo() { if (!state.redo.length) return; state.undo.push(snapshot()); restore(state.redo.pop()); afterRestore(); }

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
    if (r.node.done !== undefined && r.parent) node.done = false;
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
    if (r.node.done !== undefined) node.done = false;
    if (state.map.layout === 'free') { node.fx = r.node.fx; node.fy = (r.node.fy || 0) + 44; }
    state.sel = node.id;
  });
  startEdit(node.id, true);
}
function removeNode(r) {
  const gone = idsOf(r.node);
  const i = r.parent.children.indexOf(r.node);
  r.parent.children.splice(i, 1);
  state.map.links = state.map.links.filter((l) => !gone.has(l.from) && !gone.has(l.to));
  const sib = r.parent.children[i] || r.parent.children[i - 1];
  state.sel = sib ? sib.id : r.parent.id;
}
function deleteNode(id) {
  const r = findNode(state.map.root, id); if (!r || !r.parent) return;
  mutate(() => removeNode(r));
  if (countNodes(r.node) > 1) toast('가지를 삭제했습니다', '되돌리기', undo);
}
function setProp(id, fn, live) {
  const r = findNode(state.map.root, id); if (!r) return;
  if (live) { fn(r.node); commit(); } else mutate(() => fn(r.node));
}

/* ---------- 복사·잘라내기·붙여넣기·서식 ---------- */
function clipGet() { return loadJSON('mm.clip', null); }
async function copyNode(id, cut = false) {
  const r = findNode(state.map.root, id); if (!r) return;
  const text = outlineText(r.node);
  saveJSON('mm.clip', { node: r.node, text });
  try { await navigator.clipboard.writeText(text); } catch (e) { /* 앱 안에서는 그대로 붙여넣기 가능 */ }
  if (cut && r.parent) { mutate(() => removeNode(r)); toast('잘라냈습니다 · 원하는 가지에서 붙여넣기'); }
  else toast('복사했습니다 · 다른 가지나 다른 맵에 붙여넣기 할 수 있습니다');
}
async function pasteInto(id) {
  const target = findNode(state.map.root, id || state.map.root.id); if (!target) return;
  const clip = clipGet();
  let sys = null;
  try { sys = await navigator.clipboard.readText(); } catch (e) { sys = null; }
  let nodes = [];
  if (clip && (!sys || sys.trim() === clip.text.trim())) nodes = [cloneTree(clip.node)];
  else if (sys && sys.trim()) {
    const p = parseOutline(sys);
    if (p) nodes = p.synthetic ? p.root.children : [p.root];
  } else if (clip) nodes = [cloneTree(clip.node)];
  if (!nodes.length) return toast('붙여넣을 내용이 없습니다');
  const clear = (n) => { delete n.fx; delete n.fy; delete n.side; n.children.forEach(clear); };
  mutate(() => {
    target.node.collapsed = false;
    for (const n of nodes) { clear(n); target.node.children.push(n); }
    state.sel = nodes[0].id;
  });
  toast(`${nodes.length > 1 ? nodes.length + '개 가지를 ' : ''}붙여넣었습니다`);
}
const STYLE_KEYS = ['color', 'shape', 'fill', 'border', 'bw', 'shadow', 'font', 'fs', 'size', 'bold', 'italic', 'underline', 'strike', 'align', 'tc', 'wrap', 'ld', 'lw'];
function pickStyle(n) { return Object.fromEntries(STYLE_KEYS.map((k) => [k, n[k]])); }
function putStyle(n, st, keys = STYLE_KEYS) { for (const k of keys) { if (st[k] === undefined) delete n[k]; else n[k] = st[k]; } }
function copyStyle(id) {
  const r = findNode(state.map.root, id); if (!r) return;
  state.styleClip = pickStyle(r.node);
  toast('서식을 복사했습니다 · 다른 가지에서 ‘서식 붙여넣기’');
}
function pasteStyle(id) {
  if (!state.styleClip) return toast('먼저 ‘서식 복사’를 해 주세요');
  setProp(id, (n) => putStyle(n, state.styleClip));
}
function applyToSameDepth(id) {
  const r = findNode(state.map.root, id); if (!r) return;
  const d = depthOf(id), st = pickStyle(r.node);
  const keys = STYLE_KEYS.filter((k) => k !== 'color');
  let cnt = 0;
  mutate(() => { (function w(n, k) { if (k === d && n !== r.node) { putStyle(n, st, keys); cnt++; } n.children.forEach((c) => w(c, k + 1)); })(state.map.root, 0); });
  toast(`같은 단계 가지 ${cnt}개에 적용했습니다`);
}
function resetStyle(id) { setProp(id, (n) => { for (const k of STYLE_KEYS) delete n[k]; }); }
function sortChildren(id, how) {
  setProp(id, (n) => {
    const arr = [...n.children];
    if (how === 'abc') arr.sort((a, b) => (a.text || '').localeCompare(b.text || '', 'ko', { numeric: true }));
    else if (how === 'date') arr.sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999'));
    else if (how === 'done') arr.sort((a, b) => (a.done === true) - (b.done === true));
    else if (how === 'rev') arr.reverse();
    n.children = arr;
  });
}

/* ---------- 연결선 ---------- */
function startLinking(id) {
  state.linking = id; state.selLink = null;
  render();
  toast('연결할 가지를 누르세요', '취소', cancelLinking, 0);
}
function cancelLinking() { state.linking = null; $('#toast').hidden = true; render(); }
function finishLinking(toId) {
  const from = state.linking; state.linking = null; $('#toast').hidden = true;
  if (!toId || toId === from) { render(); return; }
  const id = uid();
  mutate(() => { state.map.links.push({ id, from, to: toId }); state.selLink = id; state.sel = null; });
  openLinkSheet(id);
}

/* ---------- 사진 ---------- */
let imgTarget = null;
function pickImage(id) { imgTarget = id; $('#imgInput').click(); }
$('#imgInput').addEventListener('change', async (ev) => {
  const f = ev.target.files[0]; ev.target.value = '';
  if (!f || !imgTarget) return;
  try {
    const url = URL.createObjectURL(f);
    const img = new Image(); img.src = url; await img.decode();
    const max = 360, s = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.round(img.naturalWidth * s), h = Math.round(img.naturalHeight * s);
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    c.getContext('2d').drawImage(img, 0, 0, w, h);
    URL.revokeObjectURL(url);
    const data = c.toDataURL('image/jpeg', 0.78);
    setProp(imgTarget, (n) => { n.img = data; n.imgW = Math.min(160, w); n.imgH = Math.round(Math.min(160, w) * h / w); });
    if (sheetKind === 'props') openProps();
  } catch (e) { toast('사진을 불러오지 못했습니다'); }
});

/* ---------- 음성 입력 ---------- */
function startVoice(parentId) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return toast('이 브라우저는 음성 입력을 지원하지 않습니다. 키보드의 마이크 버튼을 이용해 주세요');
  if (state.voice) return;
  const rec = new SR();
  rec.lang = 'ko-KR'; rec.interimResults = true; rec.continuous = true;
  let added = 0;
  state.voice = rec;
  const bar = $('#voiceBar'), txt = $('#voiceText');
  bar.hidden = false; txt.textContent = '듣는 중… 한 문장씩 말하면 가지가 됩니다';
  pill.hidden = true;
  rec.onresult = (ev) => {
    let interim = '';
    for (let i = ev.resultIndex; i < ev.results.length; i++) {
      const r = ev.results[i], t = r[0].transcript.trim();
      if (r.isFinal) {
        if (!t) continue;
        const node = newNode(t);
        mutate(() => {
          const p = findNode(state.map.root, parentId); if (!p) return;
          p.node.collapsed = false; p.node.children.push(node);
          if (state.map.layout === 'free') freePosFor(p.node.id, node);
        });
        added++;
      } else interim += t;
    }
    txt.textContent = interim || (added ? `${added}개 추가됨 · 계속 말씀하세요` : '듣는 중…');
  };
  rec.onerror = (e) => { if (e.error === 'not-allowed' || e.error === 'service-not-allowed') toast('마이크 사용을 허용해 주세요 (주소창 왼쪽 자물쇠 → 권한)'); };
  rec.onend = () => { state.voice = null; bar.hidden = true; placePill(); toast(added ? `음성으로 ${added}개 가지를 추가했습니다` : '음성 입력을 마쳤습니다'); };
  try { rec.start(); } catch (e) { state.voice = null; bar.hidden = true; toast('음성 입력을 시작하지 못했습니다'); }
}
$('#voiceStop').addEventListener('click', () => state.voice && state.voice.stop());

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
  editInput.style.fontStyle = e.f.italic ? 'italic' : 'normal';
  editInput.style.fontFamily = e.f.fam;
  editInput.style.textAlign = e.align;
  const a = toScreen(e.x, e.y + (e.imgH ? e.imgH + 6 : 0));
  const W = stage.clientWidth;
  const w = clamp(Math.max(e.w * k + 40, 200), 160, W - 16);
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
editInput.addEventListener('paste', (ev) => {
  const text = ev.clipboardData && ev.clipboardData.getData('text');
  if (!text || !/\n/.test(text.trim()) || !state.editing) return;
  ev.preventDefault();
  const p = parseOutline(text); if (!p) return;
  const ed = state.editing;
  const nodes = p.synthetic ? p.root.children : [p.root];
  const first = nodes.shift();
  editInput.value = first.text;
  finishEdit(true);
  const r = findNode(state.map.root, ed.id); if (!r) return;
  mutate(() => {
    r.node.children.push(...first.children);
    if (r.parent) { const i = r.parent.children.indexOf(r.node); r.parent.children.splice(i + 1, 0, ...nodes); }
    else r.node.children.push(...nodes);
  });
  toast(`${countNodes(first) + nodes.reduce((s, n) => s + countNodes(n), 0)}개 가지로 붙여넣었습니다`);
});
function finishEdit(save) {
  const ed = state.editing; if (!ed) return;
  state.editing = null;
  editInput.blur();
  editInput.hidden = true;
  const text = editInput.value.replace(/\s+$/, '').replace(/^\s+/, '');
  const r = findNode(state.map.root, ed.id);
  if (!r) { render(); return; }
  if (ed.isNew && (!save || !text)) {
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

/* ---------- 포인터: 이동·확대·선택·끌기·길게 누르기 ---------- */
const ptrs = new Map();
let gest = null, lastTap = { id: null, t: 0 };

svg.addEventListener('pointerdown', (ev) => {
  if (state.editing) finishEdit(true);
  try { svg.setPointerCapture(ev.pointerId); } catch (e) { /* 무시 */ }
  ptrs.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
  if (ptrs.size === 2) {
    if (gest && gest.lp) clearTimeout(gest.lp);
    if (state.drag) cancelDrag();
    const [p1, p2] = [...ptrs.values()];
    gest = { type: 'pinch', d0: Math.hypot(p1.x - p2.x, p1.y - p2.y), k0: state.vp.k, m0: { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 }, vp0: { ...state.vp } };
    return;
  }
  if (ptrs.size > 2) return;
  const t = ev.target;
  const tog = t.closest('[data-toggle]'), chk = t.closest('[data-check]'), g = t.closest('[data-id]'), lk = t.closest('[data-link]');
  gest = { type: g || tog ? 'node' : lk ? 'link' : 'pan', id: g?.dataset.id, link: lk?.dataset.link, toggle: tog?.dataset.toggle, check: chk?.dataset.check, sx: ev.clientX, sy: ev.clientY, vx: state.vp.x, vy: state.vp.y, moved: false };
  if (gest.type === 'node' && gest.id && !gest.toggle && !state.linking) {
    const gg = gest;
    gg.lp = setTimeout(() => {
      if (gest !== gg || gg.moved) return;
      gg.long = true;
      navigator.vibrate?.(12);
      select(gg.id); openMore();
    }, 520);
  }
});
svg.addEventListener('pointermove', (ev) => {
  if (!ptrs.has(ev.pointerId)) return;
  ptrs.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
  if (!gest || gest.long) return;
  if (gest.type === 'pinch') {
    if (ptrs.size !== 2) return;
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
  if (gest.lp) clearTimeout(gest.lp);
  const isRoot = gest.id === state.map.root.id;
  if (gest.type !== 'node' || gest.toggle || state.linking || (isRoot && state.map.layout !== 'free')) {
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
  if (gest.type === 'pinch') {
    // 두 손가락 중 하나를 먼저 떼면 남은 손가락으로 자연스럽게 이어서 이동
    if (ptrs.size === 1) { const [p] = [...ptrs.values()]; gest = { type: 'pan', sx: p.x, sy: p.y, vx: state.vp.x, vy: state.vp.y, moved: true }; }
    else if (ptrs.size === 0) gest = null;
    return;
  }
  const g = gest; gest = null;
  if (g.lp) clearTimeout(g.lp);
  if (g.long) return;
  if (ev.type === 'pointercancel') { if (state.drag) cancelDrag(); return; }
  if (g.moved) { if (state.drag) endDrag(ev); return; }
  if (state.linking) { finishLinking(g.type === 'node' ? g.id : null); return; }
  if (g.toggle) { setProp(g.toggle, (n) => { n.collapsed = !n.collapsed; }); return; }
  if (g.check) { setProp(g.check, (n) => { n.done = !n.done; }); return; }
  if (g.type === 'link') { state.sel = null; state.selLink = g.link; render(); openLinkSheet(g.link); return; }
  if (g.type === 'node') {
    const now = Date.now();
    if (lastTap.id === g.id && now - lastTap.t < 380) { lastTap = { id: null, t: 0 }; select(g.id); startEdit(g.id); return; }
    lastTap = { id: g.id, t: now };
    select(g.id);
  } else select(null);
}
svg.addEventListener('pointerup', endPointer);
svg.addEventListener('pointercancel', endPointer);
svg.addEventListener('contextmenu', (ev) => {
  ev.preventDefault();
  const g = ev.target.closest('[data-id]');
  if (g && !state.linking) { if (gest?.lp) clearTimeout(gest.lp); if (gest) gest.long = true; select(g.dataset.id); openMore(); }
});
svg.addEventListener('wheel', (ev) => {
  ev.preventDefault();
  if (state.editing) finishEdit(true);
  const r = svg.getBoundingClientRect();
  const mouseWheel = ev.deltaX === 0 && (ev.deltaMode === 1 || Math.abs(ev.deltaY) >= 50);
  if (ev.ctrlKey || mouseWheel) {
    const k = clamp(state.vp.k * Math.exp(-ev.deltaY * 0.0018), 0.2, 3);
    const wx = (ev.clientX - r.left - state.vp.x) / state.vp.k, wy = (ev.clientY - r.top - state.vp.y) / state.vp.k;
    state.vp = { k, x: ev.clientX - r.left - wx * k, y: ev.clientY - r.top - wy * k };
  } else { state.vp.x -= ev.deltaX; state.vp.y -= ev.deltaY; }
  applyView();
}, { passive: false });

function select(id) {
  state.sel = id;
  if (id) state.selLink = null;
  render();
  if (id) ensureVisible(id);
  if (!$('#sheet').hidden) {
    if (sheetKind === 'props') { if (id) openProps(); else closeSheet(); }
    else if (sheetKind === 'link' && id) closeSheet();
  }
  if (!id && state.selLink) { state.selLink = null; render(); }
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
  const el = document.elementFromPoint(ev.clientX, ev.clientY);
  const g = el && el.closest && el.closest('#canvas [data-id]');
  const tid = g && g.dataset.id;
  state.dropTarget = tid && tid !== d.id && !d.desc.has(tid) ? tid : null;
  render();
  const r = svg.getBoundingClientRect(), m = 36;
  let sx = 0, sy = 0;
  if (ev.clientX < r.left + m) sx = 8; else if (ev.clientX > r.right - m) sx = -8;
  if (ev.clientY < r.top + m) sy = 8; else if (ev.clientY > r.bottom - m) sy = -8;
  if (sx || sy) { state.vp.x += sx; state.vp.y += sy; applyView(); }
}
function sibAxis(layout, pd) {
  if (layout === 'down') return 'x';
  if (pd === 0 && (layout === 'org' || layout === 'timeline')) return 'x';
  if (pd === 0 && layout === 'fishbone') return '-x';
  return 'y';
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
    }
  } else if (d.mode === 'ghost' && r && r.parent) {
    const w = toWorld(ev.clientX, ev.clientY);
    const pe = state.L.get(r.parent.id);
    const layout = state.map.layout;
    const sibs = r.parent.children.filter((c) => c !== r.node);
    const radialRoot = layout === 'radial' && pe.depth === 0;
    if (radialRoot) {
      for (const c of r.parent.children) if (!c.side) { const ce = state.L.get(c.id); if (ce) c.side = ce.dir > 0 ? 'R' : 'L'; }
      const newSide = w.x >= pe.x + pe.w / 2 ? 'R' : 'L';
      if (r.node.side !== newSide) { r.node.side = newSide; changed = true; }
    }
    const ax = sibAxis(layout, pe.depth);
    const val = (o) => ax === 'x' ? o.x + o.w / 2 : ax === '-x' ? -(o.x + o.w / 2) : o.y + o.h / 2;
    const pos = ax === 'x' ? w.x : ax === '-x' ? -w.x : w.y;
    const cands = sibs.filter((c) => !radialRoot || c.side === r.node.side).map((c) => ({ c, ce: state.L.get(c.id) })).filter((o) => o.ce);
    const before = cands.find((o) => pos < val(o.ce));
    const newArr = [...sibs];
    if (before) newArr.splice(newArr.indexOf(before.c), 0, r.node);
    else if (cands.length) newArr.splice(newArr.indexOf(cands[cands.length - 1].c) + 1, 0, r.node);
    else newArr.push(r.node);
    const oldIdx = r.parent.children.indexOf(r.node);
    if (newArr.indexOf(r.node) !== oldIdx || changed) { r.parent.children = newArr; changed = true; }
  }
  if (!changed) state.undo.pop();
  else if (d.mode === 'free') { const round = (n) => { if (n.fx != null) { n.fx = Math.round(n.fx); n.fy = Math.round(n.fy); } n.children.forEach(round); }; round(state.map.root); }
  commit();
}
function cancelDrag() {
  const d = state.drag; state.drag = null; state.dropTarget = null; $('#ghost').hidden = true;
  if (d) restore(state.undo.pop());
  render();
}

/* ---------- 키보드 ---------- */
document.addEventListener('keydown', (ev) => {
  if (state.view !== 'editor' || state.editing || (!$('#sheet').hidden && sheetKind !== 'props') || $('#dlg').open) return;
  if (ev.target.matches('input, textarea')) return;
  const mod = ev.ctrlKey || ev.metaKey;
  const key = ev.key.toLowerCase();
  if (mod && key === 'z') { ev.preventDefault(); ev.shiftKey ? redo() : undo(); return; }
  if (mod && key === 'y') { ev.preventDefault(); redo(); return; }
  if (ev.key === 'Escape' && state.linking) { cancelLinking(); return; }
  const id = state.sel;
  if (mod && key === 'v') { ev.preventDefault(); pasteInto(id); return; }
  if (!id) {
    if (state.selLink && (ev.key === 'Delete' || ev.key === 'Backspace')) { ev.preventDefault(); deleteLink(state.selLink); return; }
    if (ev.key === 'Tab' || ev.key === 'Enter') { ev.preventDefault(); select(state.map.root.id); }
    return;
  }
  if (mod && key === 'c') { ev.preventDefault(); copyNode(id); return; }
  if (mod && key === 'x') { ev.preventDefault(); copyNode(id, true); return; }
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
  if (ev.key.length === 1 && !mod && !ev.altKey) { startEdit(id); editInput.value = ''; }
});
function navigate(e, key) {
  const L = state.L, layout = state.map.layout;
  const parent = e.parent && L.get(e.parent);
  const sibs = parent ? parent.kids : [];
  const i = sibs.indexOf(e);
  let target = null;
  if (HFAM.has(layout)) {
    const fwd = key === 'ArrowRight' ? 1 : key === 'ArrowLeft' ? -1 : 0;
    if (fwd) target = e.depth === 0 ? e.kids.find((k) => k.dir === fwd) || e.kids[0] : fwd === e.dir ? e.kids[0] : parent;
    if (key === 'ArrowDown' || key === 'ArrowUp') { const same = sibs.filter((s) => s.dir === e.dir); target = same[same.indexOf(e) + (key === 'ArrowDown' ? 1 : -1)]; }
  } else if (layout === 'down') {
    if (key === 'ArrowDown') target = e.kids[0]; if (key === 'ArrowUp') target = parent;
    if (key === 'ArrowRight') target = sibs[i + 1]; if (key === 'ArrowLeft') target = sibs[i - 1];
  } else {
    const rowTop = e.depth === 1 && layout !== 'list';
    if (key === 'ArrowDown') target = e.kids[0] || (!rowTop ? sibs[i + 1] : null);
    if (key === 'ArrowUp') target = !rowTop && i > 0 ? sibs[i - 1] : parent;
    if (key === 'ArrowRight') target = rowTop ? sibs[layout === 'fishbone' ? i - 1 : i + 1] : null;
    if (key === 'ArrowLeft') target = rowTop ? sibs[layout === 'fishbone' ? i + 1 : i - 1] : null;
  }
  if (target) select(target.id);
}

/* ---------- 개요 패널 (넓은 화면) ---------- */
function renderOutline() {
  const box = $('#outline');
  if (getComputedStyle(box).display === 'none') return;
  const style = state.map.style;
  let h = '<div class="o-head">개요 · 목차</div>';
  (function walk(n, d, path) {
    const pad = d <= 1 ? 8 : 8 + (d - 1) * 16;
    const num = numLabel(style, d, path);
    const chk = n.done === true ? '☑ ' : n.done === false ? '☐ ' : '';
    h += `<button data-oid="${n.id}" class="d${Math.min(d, 2)}${state.sel === n.id ? ' on' : ''}${n.done ? ' done' : ''}" style="padding-left:${pad}px">${num ? `<span class="num">${num}</span>` : ''}<span>${chk}${n.icon ? esc(n.icon) + ' ' : ''}${esc(n.text || '제목 없음')}</span></button>`;
    n.children.forEach((c, j) => walk(c, d + 1, [...path, j]));
  })(state.map.root, 0, []);
  box.innerHTML = h;
}
$('#outline').addEventListener('click', (ev) => {
  const b = ev.target.closest('[data-oid]'); if (!b) return;
  const path = []; (function find(n) { if (n.id === b.dataset.oid) return true; for (const c of n.children) if (find(c)) { path.push(n); return true; } return false; })(state.map.root);
  path.forEach((p) => { p.collapsed = false; });
  select(b.dataset.oid);
});

/* ---------- 상단·하단 버튼 ---------- */
pill.addEventListener('click', (ev) => {
  const b = ev.target.closest('[data-act]'); if (!b || !state.sel) return;
  const id = state.sel;
  ({ child: () => addChild(id), sibling: () => addSibling(id), edit: () => startEdit(id), props: () => openProps(), more: openMore, delete: () => deleteNode(id) })[b.dataset.act]();
});
$('#notePeek').addEventListener('click', () => { if (!state.sel) return; state.propTab = '기타'; openProps('note'); });
$('#fab').addEventListener('click', () => addChild(state.sel || state.map.root.id));
$('#fitBtn').addEventListener('click', () => fit());
$('#undoBtn').addEventListener('click', undo);
$('#redoBtn').addEventListener('click', redo);
$('#backBtn').addEventListener('click', () => {
  if (state.pushed) history.back();
  else { history.replaceState(null, '', location.pathname); showHome(); }
});
$('#titleBtn').addEventListener('click', () => { select(state.map.root.id); startEdit(state.map.root.id); });
$('#layoutTabs').addEventListener('click', (ev) => { const b = ev.target.closest('[data-layout]'); if (b) setLayout(b.dataset.layout); });
function setLayout(to) {
  if (to === state.map.layout) return;
  mutate(() => {
    if (to === 'free') {
      const clear = (n) => { delete n.fx; delete n.fy; n.children.forEach(clear); }; clear(state.map.root);
      for (const e of state.L.values()) { e.n.fx = Math.round(e.x); e.n.fy = Math.round(e.y); }
    }
    state.map.layout = to;
  }, { fit: true });
  document.querySelector(`#layoutTabs [data-layout="${to}"]`)?.scrollIntoView({ inline: 'center', block: 'nearest' });
}
$('#styleBtn').addEventListener('click', openStyleSheet);
$('#edMenuBtn').addEventListener('click', openMapMenu);
window.addEventListener('resize', () => { if (state.view === 'editor') { renderOutline(); applyView(); } });

/* =========================================================
   시트
   ========================================================= */
let sheetKind = null;
function openSheet(html, kind, side = false) {
  const sh = $('#sheet');
  const keep = !sh.hidden && sheetKind === kind ? sh.scrollTop : 0;
  sheetKind = kind;
  $('#sheetBody').innerHTML = html;
  sh.classList.toggle('side', side);
  sh.hidden = false;
  sh.scrollTop = keep;
  $('#scrim').hidden = side && window.innerWidth >= 960;
  placePill();
}
function closeSheet() {
  $('#sheet').hidden = true; $('#scrim').hidden = true; sheetKind = null;
  if (state.view === 'editor') placePill();
}
$('#scrim').addEventListener('click', closeSheet);

const ICO = {
  copy: '<svg viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/></svg>',
  cut: '<svg viewBox="0 0 24 24"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.1 15.9M14.5 14.5 20 20M8.1 8.1 12 12"/></svg>',
  paste: '<svg viewBox="0 0 24 24"><path d="M9 4h6v3H9z"/><path d="M15 5h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2"/></svg>',
  brush: '<svg viewBox="0 0 24 24"><path d="M14 4l6 6-8 8H6v-6z"/><path d="M10 8l6 6"/><path d="M6 18l-2 2"/></svg>',
  brushIn: '<svg viewBox="0 0 24 24"><path d="M14 4l6 6-8 8H6v-6z"/><path d="M3 21h8"/></svg>',
  smile: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><path d="M9 9.5h.01M15 9.5h.01"/></svg>',
  image: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="m21 16-5-5-9 8"/></svg>',
  cal: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
  check: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="m8 12 3 3 5-6"/></svg>',
  mic: '<svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>',
  sort: '<svg viewBox="0 0 24 24"><path d="M4 6h10M4 12h7M4 18h4M17 5v14M14 16l3 3 3-3"/></svg>',
  relation: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="6" height="5" rx="1.5"/><rect x="15" y="16" width="6" height="5" rx="1.5"/><path d="M6 8c0 7 6 10 9 10" stroke-dasharray="2.5 2.5"/></svg>',
  fold: '<svg viewBox="0 0 24 24"><path d="M7 10l5 5 5-5"/><path d="M5 20h14"/></svg>',
  note: '<svg viewBox="0 0 24 24"><path d="M4 4h16v12H8l-4 4z"/></svg>',
  style: '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13 7l4 4"/></svg>',
  save: '<svg viewBox="0 0 24 24"><path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 19h14"/></svg>',
  open: '<svg viewBox="0 0 24 24"><path d="M12 15V3M7 8l5-5 5 5"/><path d="M5 19h14"/></svg>',
  share: '<svg viewBox="0 0 24 24"><circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.6M8.2 13.2l7.6 4.6"/></svg>',
  trash: '<svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
  dup: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="11" height="11" rx="2"/><rect x="9" y="9" width="11" height="11" rx="2"/></svg>',
  pen: '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>',
  expand: '<svg viewBox="0 0 24 24"><path d="M7 10l5 5 5-5"/></svg>',
  collapse: '<svg viewBox="0 0 24 24"><path d="M7 14l5-5 5 5"/></svg>',
  tpl: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><path d="M17 14v6M14 17h6"/></svg>',
  png: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="m21 16-5-5-9 8"/></svg>',
  text: '<svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h12M4 18h8"/></svg>',
};

/* 더보기 (길게 누르기 메뉴) */
function openMore() {
  const r = state.sel && findNode(state.map.root, state.sel); if (!r) return;
  const n = r.node, isRoot = !r.parent;
  const items = [
    ['cut', '잘라내기', ICO.cut, isRoot], ['copy', '복사', ICO.copy], ['paste', '붙여넣기', ICO.paste],
    ['cstyle', '서식 복사', ICO.brush], ['pstyle', '서식 붙여넣기', ICO.brushIn, !state.styleClip],
    ['style', '글자·상자·선', ICO.style], ['icon', '아이콘', ICO.smile], ['image', n.img ? '사진 바꾸기' : '사진', ICO.image],
    ['note', '메모·링크', ICO.note], ['date', '날짜', ICO.cal], ['check', n.done !== undefined ? '체크 빼기' : '할 일 체크', ICO.check, isRoot],
    ['voice', '음성 입력', ICO.mic], ['sort', '하위 정렬', ICO.sort, n.children.length < 2],
    ['relation', '연결선', ICO.relation], ['fold', n.collapsed ? '펼치기' : '접기', ICO.fold, !n.children.length],
    ['delete', '삭제', ICO.trash, isRoot, 'danger'],
  ];
  openSheet(`
    <div class="sh-eyebrow">선택한 가지</div>
    <div class="sh-title">${esc(n.text || '제목 없음')}</div>
    <div class="grid-menu">${items.map(([k, label, ic, dis, cls]) => `<button data-m="${k}"${dis ? ' disabled' : ''}${cls ? ` class="${cls}"` : ''}>${ic}<span>${label}</span></button>`).join('')}</div>`, 'more');
  $('#sheetBody').querySelector('.grid-menu').addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-m]'); if (!b || b.disabled) return;
    const id = n.id, act = b.dataset.m;
    if (!['icon', 'note', 'date', 'sort', 'style'].includes(act)) closeSheet();
    ({
      cut: () => copyNode(id, true), copy: () => copyNode(id), paste: () => pasteInto(id),
      cstyle: () => copyStyle(id), pstyle: () => pasteStyle(id),
      style: () => { state.propTab = '글자'; openProps(); },
      icon: () => { state.propTab = '기타'; openProps('icon'); }, image: () => pickImage(id),
      note: () => { state.propTab = '기타'; openProps('note'); }, date: () => { state.propTab = '기타'; openProps('date'); },
      check: () => setProp(id, (x) => { if (x.done === undefined) x.done = false; else delete x.done; }),
      voice: () => startVoice(id), sort: () => openSort(id), relation: () => startLinking(id),
      fold: () => setProp(id, (x) => { x.collapsed = !x.collapsed; }), delete: () => deleteNode(id),
    })[act]();
  });
}
function openSort(id) {
  openSheet(`
    <div class="sh-title">하위 가지 정렬</div>
    <div class="menu-list">
      <button data-s="abc">${ICO.sort}<span>가나다순</span></button>
      <button data-s="date">${ICO.cal}<span>날짜 빠른 순</span></button>
      <button data-s="done">${ICO.check}<span>완료한 일은 아래로</span></button>
      <button data-s="rev">${ICO.sort}<span>순서 뒤집기</span></button>
    </div>`, 'sort');
  $('#sheetBody').querySelectorAll('[data-s]').forEach((b) => b.addEventListener('click', () => { closeSheet(); sortChildren(id, b.dataset.s); }));
}
function openLinkSheet(linkId) {
  const lk = state.map.links.find((l) => l.id === linkId); if (!lk) return;
  const a = findNode(state.map.root, lk.from), b = findNode(state.map.root, lk.to);
  openSheet(`
    <div class="sh-eyebrow">연결선</div>
    <div class="sh-title">${esc(a?.node.text || '')} → ${esc(b?.node.text || '')}</div>
    <div class="sh-sec"><label class="sh-label" for="lkLabel">선 위에 쓸 말</label><input id="lkLabel" type="text" placeholder="예: 영향, 원인, 연결" value="${esc(lk.label || '')}"></div>
    <div class="menu-list">
      <button id="lkFlip">${ICO.relation}<span>곡선 방향 바꾸기</span></button>
      <button id="lkRev">${ICO.sort}<span>화살표 방향 바꾸기</span></button>
      <button id="lkDel" class="danger">${ICO.trash}<span>연결선 삭제</span></button>
    </div>`, 'link', true);
  let snap = false;
  $('#lkLabel').addEventListener('input', (ev) => {
    if (!snap) { state.undo.push(snapshot()); state.redo = []; snap = true; }
    const l = state.map.links.find((x) => x.id === linkId); if (!l) return;
    if (ev.target.value.trim()) l.label = ev.target.value.trim(); else delete l.label; commit();
  });
  $('#lkFlip').onclick = () => mutate(() => { const l = state.map.links.find((x) => x.id === linkId); if (l) l.flip = !l.flip; });
  $('#lkRev').onclick = () => mutate(() => { const l = state.map.links.find((x) => x.id === linkId); if (l) [l.from, l.to] = [l.to, l.from]; });
  $('#lkDel').onclick = () => { closeSheet(); deleteLink(linkId); };
}
function deleteLink(id) { mutate(() => { state.map.links = state.map.links.filter((l) => l.id !== id); state.selLink = null; }); }

/* 꾸미기 (선택한 가지): 글자 · 상자 · 선 · 기타 */
const chipRow = (name, cur, opts) => `<div class="chips sm">${opts.map(([k, l]) => `<button class="chip${(cur ?? 'auto') === k ? ' on' : ''}" data-${name}="${k}">${l}</button>`).join('')}</div>`;
const seg = (name, cur, opts) => `<div class="seg">${opts.map(([k, l]) => `<button data-${name}="${k}" class="${cur === k ? 'on' : ''}">${l}</button>`).join('')}</div>`;
const shapeIcon = (k) => ({
  round: '<svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="4"/></svg>',
  pill: '<svg viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="10" rx="5"/></svg>',
  box: '<svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="1"/></svg>',
  ellipse: '<svg viewBox="0 0 24 24"><ellipse cx="12" cy="12" rx="10" ry="6"/></svg>',
  hex: '<svg viewBox="0 0 24 24"><path d="M6 6h12l4 6-4 6H6l-4-6z"/></svg>',
  line: '<svg viewBox="0 0 24 24"><path d="M3 17h18"/><path d="M6 12h9"/></svg>',
  none: '<svg viewBox="0 0 24 24"><path d="M6 9h12M9 9v8M15 9v8"/></svg>',
}[k] || '');

function openProps(focus) {
  const r = state.sel && findNode(state.map.root, state.sel); if (!r) return;
  const n = r.node, isRoot = !r.parent, e = state.L.get(n.id);
  const tabs = ['글자', '상자', '선', '기타'].filter((t) => !(isRoot && t === '선'));
  if (!tabs.includes(state.propTab)) state.propTab = '글자';
  const tab = state.propTab;
  if (tab === '글자') Object.keys(FONTS).forEach(ensureFont);
  let body = '';
  if (tab === '글자') {
    const curSize = n.fs || (e ? e.f.size : 14);
    const tcs = [['auto', '자동'], ['ink', '진하게'], ['muted', '회색'], ['white', '흰색'], ...T.branches.map((c, i) => [`b${i}`, ''])];
    body = `
      <div class="sh-sec"><div class="sh-label">글꼴</div><div class="chips sm">${Object.entries(FONTS).map(([k, f]) => `<button class="chip font-chip${(n.font || 'auto') === k ? ' on' : ''}" data-font="${k}" style="${f.fam ? `font-family:${esc(f.fam)}` : ''}">${f.name}</button>`).join('')}</div><p class="hint">‘기본’은 맵 전체 글꼴(위쪽 팔레트)을 따릅니다.</p></div>
      <div class="sh-sec"><div class="sh-label">크기</div><div class="seg-row"><div class="stepper"><button id="fsDn" aria-label="작게">−</button><span>${curSize}pt</span><button id="fsUp" aria-label="크게">+</button></div>${n.fs || n.size ? '<button class="row-btn" id="fsReset">기본 크기</button>' : ''}</div></div>
      <div class="sh-sec"><div class="sh-label">모양</div><div class="seg-row">
        <button class="tog${n.bold === true ? ' on' : ''}" id="tgBold" aria-label="굵게" style="font-weight:800">B</button>
        <button class="tog${n.italic ? ' on' : ''}" id="tgItalic" aria-label="기울임" style="font-style:italic;font-family:serif">I</button>
        <button class="tog${n.underline ? ' on' : ''}" id="tgUnder" aria-label="밑줄" style="text-decoration:underline">U</button>
        <button class="tog${n.strike ? ' on' : ''}" id="tgStrike" aria-label="취소선" style="text-decoration:line-through">S</button>
        <button class="tog${n.bold === false ? ' on' : ''}" id="tgThin" aria-label="가늘게" style="font-size:12px;width:52px">얇게</button>
      </div></div>
      <div class="sh-sec"><div class="sh-label">정렬</div>${seg('align', n.align || 'auto', [['auto', '자동'], ['left', '왼쪽'], ['center', '가운데'], ['right', '오른쪽']])}</div>
      <div class="sh-sec"><div class="sh-label">글자색</div><div class="swatches">${tcs.map(([k, l]) => k[0] === 'b' ? `<button class="swatch${n.tc === k ? ' on' : ''}" style="background:${T.branches[+k.slice(1)]}" data-tc="${k}" aria-label="글자색"></button>` : `<button class="swatch auto${(n.tc || 'auto') === k ? ' on' : ''}" data-tc="${k}" style="${k === 'ink' ? `background:${T.ink};color:${T.surface};border:0` : k === 'muted' ? `background:${T.muted};color:#fff;border:0` : k === 'white' ? 'background:#fff;color:#333' : ''}">${l}</button>`).join('')}</div></div>
      <div class="sh-sec"><div class="sh-label">줄바꿈 폭</div>${seg('wrap', n.wrap || 'auto', [['auto', '자동'], ['narrow', '좁게'], ['wide', '넓게'], ['none', '한 줄']])}</div>`;
  } else if (tab === '상자') {
    const shapes = isRoot ? [['auto', '기본'], ['round', '둥근 상자'], ['pill', '알약'], ['box', '사각'], ['ellipse', '타원'], ['hex', '육각']] : SHAPES;
    body = `
      <div class="sh-sec"><div class="sh-label">상자 모양</div><div class="chips sm">${shapes.map(([k, l]) => `<button class="chip${(n.shape || 'auto') === k ? ' on' : ''}" data-shape="${k}">${shapeIcon(k)}${l}</button>`).join('')}</div></div>
      <div class="sh-sec"><div class="sh-label">색상</div><div class="swatches"><button class="swatch auto${n.color == null ? ' on' : ''}" data-color="auto" aria-label="기본 색">기본</button>${T.branches.map((c, i) => `<button class="swatch${n.color === i ? ' on' : ''}" style="background:${c}" data-color="${i}" aria-label="색상 ${i + 1}"></button>`).join('')}</div><p class="hint">상자·선·글자에 함께 쓰이는 가지 색입니다.</p></div>
      <div class="sh-sec"><div class="sh-label">채우기</div>${chipRow('fill', n.fill, FILLS)}</div>
      <div class="sh-sec"><div class="sh-label">테두리</div>${chipRow('border', n.border, [['auto', '자동'], ['solid', '실선'], ['dash', '파선'], ['dot', '점선'], ['none', '없음']])}
        <div class="seg-row" style="margin-top:6px"><span class="hint" style="margin:0">굵기</span><div class="stepper"><button id="bwDn" aria-label="가늘게">−</button><span>${(n.bw ?? 1.3).toFixed(1)}</span><button id="bwUp" aria-label="굵게">+</button></div></div></div>
      <div class="sh-sec"><div class="toggle-row"><span>그림자</span><button class="switch${(n.shadow ?? state.map.style.shadow) ? ' on' : ''}" id="tgShadow" aria-label="그림자"></button></div></div>`;
  } else if (tab === '선') {
    body = `
      <div class="sh-sec"><div class="sh-label">이 가지로 이어지는 선</div><p class="hint">선 모양(곡선·직선·꺾은선)은 맵 전체 설정(위쪽 팔레트)에서 바꿉니다.</p></div>
      <div class="sh-sec"><div class="sh-label">선 종류</div>${chipRow('ld', n.ld, [['auto', '자동'], ['solid', '실선'], ['dash', '파선'], ['dot', '점선']])}</div>
      <div class="sh-sec"><div class="sh-label">선 굵기</div>${chipRow('lw', n.lw, [['auto', '자동'], ['thin', '가늘게'], ['normal', '보통'], ['thick', '굵게']])}</div>
      <div class="sh-sec"><div class="sh-label">선 색 (가지 색)</div><div class="swatches"><button class="swatch auto${n.color == null ? ' on' : ''}" data-color="auto">기본</button>${T.branches.map((c, i) => `<button class="swatch${n.color === i ? ' on' : ''}" style="background:${c}" data-color="${i}" aria-label="색상 ${i + 1}"></button>`).join('')}</div></div>`;
  } else {
    body = `
      <div class="sh-sec" id="secIcon"><div class="sh-label">아이콘</div><div class="icons">${ICONS.map((x) => `<button data-icon="${x}" class="${n.icon === x ? 'on' : ''}">${x}</button>`).join('')}</div>${n.icon ? '<button class="row-btn" data-icon="" style="align-self:flex-start">아이콘 빼기</button>' : ''}</div>
      <div class="sh-sec" id="secDate"><label class="sh-label" for="dateInput">날짜 (마감일)</label><div class="row"><input id="dateInput" type="date" value="${esc(n.date || '')}">${n.date ? '<button class="row-btn" id="dateClear">지우기</button>' : ''}</div><p class="hint">지난 날짜는 빨간색, 2일 안은 금색으로 표시됩니다.</p></div>
      <div class="sh-sec"><div class="sh-label">사진</div>${n.img ? `<img class="img-prev" src="${n.img}" alt="첨부 사진">` : ''}<div class="row"><button class="row-btn" id="imgPick">${n.img ? '사진 바꾸기' : '사진 넣기'}</button>${n.img ? '<button class="row-btn" id="imgDel">사진 빼기</button>' : ''}</div></div>
      <div class="sh-sec" id="secNote"><label class="sh-label" for="noteInput">메모</label><textarea id="noteInput" placeholder="가지에 덧붙일 설명">${esc(n.note || '')}</textarea></div>
      <div class="sh-sec"><label class="sh-label" for="linkInput">링크</label><div class="row"><input id="linkInput" type="url" inputmode="url" placeholder="https://" value="${esc(n.link || '')}"><button class="row-btn" id="openLink">열기</button></div></div>
      <div class="sh-sec">
        ${isRoot ? '' : `<div class="toggle-row"><span>할 일 체크박스</span><button class="switch${n.done !== undefined ? ' on' : ''}" id="tgCheck" aria-label="할 일 체크박스"></button></div>`}
        ${n.children.length ? `<div class="toggle-row"><span>하위 가지 접기</span><button class="switch${n.collapsed ? ' on' : ''}" id="tgCollapse" aria-label="하위 가지 접기"></button></div>` : ''}
      </div>
      ${isRoot ? '' : '<button class="danger-btn" id="delNode">이 가지 삭제</button>'}`;
  }
  const foot = tab === '기타' ? '' : `<div class="apply-row">${isRoot ? '' : '<button class="row-btn" id="applyDepth">같은 단계에 모두 적용</button>'}<button class="row-btn" id="resetStyle">서식 초기화</button></div>`;
  openSheet(`
    <div class="sh-eyebrow">선택한 가지</div>
    <div class="sh-title">${esc(n.text || '제목 없음')}</div>
    <div class="ptabs">${tabs.map((t) => `<button data-ptab="${t}" class="${tab === t ? 'on' : ''}">${t}</button>`).join('')}</div>
    ${body}${foot}`, 'props', true);
  const B = $('#sheetBody');
  const re = () => openProps();
  const on = (sel, fn) => B.querySelectorAll(sel).forEach((b) => b.addEventListener('click', () => { fn(b); re(); }));
  const set = (key, v) => setProp(n.id, (x) => { if (v === 'auto' || v === '' || v == null) delete x[key]; else x[key] = v; });
  B.querySelectorAll('[data-ptab]').forEach((b) => b.addEventListener('click', () => { state.propTab = b.dataset.ptab; re(); $('#sheet').scrollTop = 0; }));
  on('[data-font]', (b) => { ensureFont(b.dataset.font); set('font', b.dataset.font); });
  $('#fsDn')?.addEventListener('click', () => { set('fs', clamp((n.fs || e.f.size) - 1, 9, 60)); re(); });
  $('#fsUp')?.addEventListener('click', () => { set('fs', clamp((n.fs || e.f.size) + 1, 9, 60)); re(); });
  $('#fsReset')?.addEventListener('click', () => { setProp(n.id, (x) => { delete x.fs; delete x.size; }); re(); });
  $('#tgBold')?.addEventListener('click', () => { setProp(n.id, (x) => { if (x.bold === true) delete x.bold; else x.bold = true; }); re(); });
  $('#tgThin')?.addEventListener('click', () => { setProp(n.id, (x) => { if (x.bold === false) delete x.bold; else x.bold = false; }); re(); });
  $('#tgItalic')?.addEventListener('click', () => { setProp(n.id, (x) => { if (x.italic) delete x.italic; else x.italic = true; }); re(); });
  $('#tgUnder')?.addEventListener('click', () => { setProp(n.id, (x) => { if (x.underline) delete x.underline; else x.underline = true; }); re(); });
  $('#tgStrike')?.addEventListener('click', () => { setProp(n.id, (x) => { if (x.strike) delete x.strike; else x.strike = true; }); re(); });
  on('[data-align]', (b) => set('align', b.dataset.align));
  on('[data-tc]', (b) => set('tc', b.dataset.tc));
  on('[data-wrap]', (b) => set('wrap', b.dataset.wrap));
  on('[data-shape]', (b) => set('shape', b.dataset.shape));
  on('[data-color]', (b) => set('color', b.dataset.color === 'auto' ? 'auto' : +b.dataset.color));
  on('[data-fill]', (b) => set('fill', b.dataset.fill));
  on('[data-border]', (b) => set('border', b.dataset.border));
  $('#bwDn')?.addEventListener('click', () => { set('bw', Math.round(clamp((n.bw ?? 1.3) - 0.5, 0.5, 6) * 10) / 10); re(); });
  $('#bwUp')?.addEventListener('click', () => { set('bw', Math.round(clamp((n.bw ?? 1.3) + 0.5, 0.5, 6) * 10) / 10); re(); });
  $('#tgShadow')?.addEventListener('click', () => { const cur = n.shadow ?? state.map.style.shadow; setProp(n.id, (x) => { x.shadow = !cur; }); re(); });
  on('[data-ld]', (b) => set('ld', b.dataset.ld));
  on('[data-lw]', (b) => set('lw', b.dataset.lw));
  on('[data-icon]', (b) => setProp(n.id, (x) => { if (!b.dataset.icon || x.icon === b.dataset.icon) delete x.icon; else x.icon = b.dataset.icon; }));
  $('#dateInput')?.addEventListener('change', (ev) => { set('date', ev.target.value); re(); });
  $('#dateClear')?.addEventListener('click', () => { set('date', null); re(); });
  $('#imgPick')?.addEventListener('click', () => pickImage(n.id));
  $('#imgDel')?.addEventListener('click', () => { setProp(n.id, (x) => { delete x.img; delete x.imgW; delete x.imgH; }); re(); });
  let noteSnap = false;
  $('#noteInput')?.addEventListener('input', (ev) => { if (!noteSnap) { state.undo.push(snapshot()); state.redo = []; noteSnap = true; } setProp(n.id, (x) => { if (ev.target.value) x.note = ev.target.value; else delete x.note; }, true); });
  let linkSnap = false;
  $('#linkInput')?.addEventListener('input', (ev) => { if (!linkSnap) { state.undo.push(snapshot()); state.redo = []; linkSnap = true; } setProp(n.id, (x) => { const v = ev.target.value.trim(); if (v) x.link = v; else delete x.link; }, true); });
  $('#openLink')?.addEventListener('click', () => {
    let v = $('#linkInput').value.trim(); if (!v) return toast('링크를 먼저 넣어 주세요');
    if (!/^https?:\/\//i.test(v)) v = 'https://' + v;
    window.open(v, '_blank', 'noopener');
  });
  $('#tgCheck')?.addEventListener('click', () => { setProp(n.id, (x) => { if (x.done === undefined) x.done = false; else delete x.done; }); re(); });
  $('#tgCollapse')?.addEventListener('click', () => { setProp(n.id, (x) => { x.collapsed = !x.collapsed; }); re(); });
  $('#delNode')?.addEventListener('click', () => { closeSheet(); deleteNode(n.id); });
  $('#applyDepth')?.addEventListener('click', () => applyToSameDepth(n.id));
  $('#resetStyle')?.addEventListener('click', () => { resetStyle(n.id); re(); });
  if (typeof focus === 'string') {
    const el = { icon: '#secIcon', note: '#secNote', date: '#secDate' }[focus];
    if (el) setTimeout(() => { $(el)?.scrollIntoView({ block: 'start' }); if (focus === 'note') $('#noteInput')?.focus(); if (focus === 'date') $('#dateInput')?.showPicker?.(); }, 30);
  }
}

/* 맵 전체 스타일 (팔레트 버튼) */
function previewMap(style, layout = 'radial') {
  const m = newMap('주제', layout, style);
  m.root.children = [mk('가지', ['내용']), mk('가지', ['내용']), mk('가지'), mk('가지')];
  m.style.numbering = 'none'; m.style.rollup = false;
  return m;
}
function openStyleSheet() {
  const m = state.map, st = m.style;
  Object.keys(FONTS).forEach(ensureFont);
  const isPreset = (p) => Object.entries(p.s).every(([k, v]) => st[k] === v);
  const H = (t) => `<div class="ptabs" style="position:static"><button class="on" style="cursor:default">${t}</button></div>`;
  openSheet(`
    <div class="sh-eyebrow">맵 전체</div>
    <div class="sh-title">스타일</div>
    <div class="sh-sec"><div class="sh-label">빠른 스타일</div><div class="preset-grid">${PRESETS.map((p) => `<button data-preset="${p.key}" class="${isPreset(p) ? 'on' : ''}"><div class="pv">${thumbSVG(previewMap(p.s))}</div>${p.name}</button>`).join('')}</div></div>
    <div class="sh-sec"><div class="sh-label">레이아웃</div><div class="layout-grid">${LAYOUTS.map(([k, l]) => `<button data-lay="${k}" class="${m.layout === k ? 'on' : ''}"><div class="pv">${thumbSVG(previewMap({ ...st }, k))}</div>${l}</button>`).join('')}</div></div>
    ${H('선')}
    <div class="sh-sec"><div class="sh-label">선 모양</div>${chipRow('lshape', st.lineShape, [['curve', '곡선'], ['straight', '직선'], ['elbow', '꺾은선'], ['relbow', '둥근 꺾은선']])}</div>
    <div class="sh-sec"><div class="sh-label">굵기</div>${seg('lwid', st.lineWidth, [['thin', '가늘게'], ['normal', '보통'], ['thick', '굵게']])}</div>
    <div class="sh-sec"><div class="sh-label">종류</div>${seg('ldash', st.lineDash, [['solid', '실선'], ['dash', '파선'], ['dot', '점선']])}</div>
    <div class="sh-sec"><div class="sh-label">색</div>${seg('lcol', st.lineColor, [['branch', '가지 색'], ['gray', '회색 한 가지']])}</div>
    <div class="sh-sec"><div class="toggle-row"><span>중심 가지를 굵게 시작해 점점 가늘게</span><button class="switch${st.taper ? ' on' : ''}" id="tgTaper" aria-label="선 끝 가늘게"></button></div></div>
    ${H('글꼴')}
    <div class="sh-sec"><div class="sh-label">글꼴</div><div class="chips sm">${Object.entries(FONTS).map(([k, f]) => `<button class="chip font-chip${st.font === k ? ' on' : ''}" data-mfont="${k}" style="${f.fam ? `font-family:${esc(f.fam)}` : ''}">${f.name}</button>`).join('')}</div><p class="hint">기본: 가운데 주제는 명조, 가지는 고딕</p></div>
    <div class="sh-sec"><div class="sh-label">글자 크기</div>${seg('fscale', st.fontScale, [['s', '작게'], ['m', '보통'], ['l', '크게'], ['xl', '아주 크게']])}</div>
    ${H('글자 상자')}
    <div class="sh-sec"><div class="sh-label">가지 모양</div><div class="chips sm">${SHAPES.map(([k, l]) => `<button class="chip${st.shape === k ? ' on' : ''}" data-mshape="${k}">${shapeIcon(k)}${l}</button>`).join('')}</div></div>
    <div class="sh-sec"><div class="sh-label">채우기</div>${chipRow('mfill', st.fill, FILLS)}</div>
    <div class="sh-sec"><div class="toggle-row"><span>그림자</span><button class="switch${st.shadow ? ' on' : ''}" id="tgMShadow" aria-label="그림자"></button></div></div>
    ${H('배치·기타')}
    <div class="sh-sec"><div class="sh-label">가지 간격</div>${seg('spc', st.spacing, [['tight', '좁게'], ['normal', '보통'], ['wide', '넓게']])}</div>
    <div class="sh-sec"><div class="sh-label">번호 매기기</div>${seg('num', st.numbering, [['none', '없음'], ['top', '큰 가지 01'], ['outline', '모두 1.2.3']])}</div>
    <div class="sh-sec"><div class="sh-label">배경</div>${seg('bg', st.bg, [['plain', '단색'], ['dots', '점'], ['grid', '모눈']])}</div>
    <div class="sh-sec"><div class="toggle-row"><span>할 일 진행률 자동 표시 (예: 2/4)</span><button class="switch${st.rollup ? ' on' : ''}" id="tgRollup" aria-label="진행률 표시"></button></div></div>
    <div class="sh-sec"><div class="sh-label">테마</div>${themePicker()}</div>
    <div class="apply-row"><button class="row-btn" id="clearAll">가지별 개별 서식 모두 지우기</button></div>
  `, 'style', true);
  const B = $('#sheetBody');
  const setS = (patch, fitAfter) => { mutate(() => Object.assign(m.style, patch), { fit: fitAfter }); ensureMapFonts(m); openStyleSheet(); };
  const bind = (sel, key, fitAfter) => B.querySelectorAll(`[data-${sel}]`).forEach((b) => b.addEventListener('click', () => setS({ [key]: b.dataset[sel] }, fitAfter)));
  B.querySelectorAll('[data-preset]').forEach((b) => b.addEventListener('click', () => setS(PRESETS.find((p) => p.key === b.dataset.preset).s, true)));
  B.querySelectorAll('[data-lay]').forEach((b) => b.addEventListener('click', () => { setLayout(b.dataset.lay); openStyleSheet(); }));
  bind('lshape', 'lineShape'); bind('lwid', 'lineWidth'); bind('ldash', 'lineDash'); bind('lcol', 'lineColor');
  bind('mfont', 'font', true); bind('fscale', 'fontScale', true); bind('mshape', 'shape', true); bind('mfill', 'fill');
  bind('spc', 'spacing', true); bind('num', 'numbering'); bind('bg', 'bg');
  $('#tgTaper').onclick = () => setS({ taper: !st.taper });
  $('#tgMShadow').onclick = () => setS({ shadow: !st.shadow });
  $('#tgRollup').onclick = () => setS({ rollup: !st.rollup });
  bindThemePicker(openStyleSheet);
  $('#clearAll').onclick = () => { mutate(() => { (function w(n) { for (const k of STYLE_KEYS) if (k !== 'color') delete n[k]; n.children.forEach(w); })(m.root); }, { fit: true }); toast('개별 서식을 지웠습니다'); openStyleSheet(); };
}

function themePicker() {
  const opts = [['auto', '자동', `linear-gradient(135deg, ${THEMES.business.root} 50%, ${THEMES.dark.bg} 50%)`], ...Object.entries(THEMES).map(([k, t]) => [k, t.name, t.root])];
  return `<div class="theme-grid">${opts.map(([k, name, bg]) => `<button data-theme="${k}" class="${settings.theme === k ? 'on' : ''}"><span class="sw" style="background:${bg}"></span>${name}</button>`).join('')}</div><p class="hint">자동: 폰 설정에 따라 비즈니스(밝게)·다크로 바뀝니다</p>`;
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
    <div class="sh-sec"><div class="sh-label">공유·내보내기</div>
      <div class="grid-menu">
        <button id="xPng">${ICO.png}<span>이미지 저장</span></button>
        <button id="xShare">${ICO.share}<span>이미지 보내기</span></button>
        <button id="xText">${ICO.text}<span>개요 보내기</span></button>
        <button id="xJson">${ICO.save}<span>파일 저장</span></button>
        <button id="xTpl">${ICO.tpl}<span>템플릿 저장</span></button>
      </div>
    </div>
    <div class="sh-sec"><div class="sh-label">가지에 번호 붙이기 (선택)</div>${seg('mnum', m.style.numbering, [['none', '안 붙임'], ['top', '큰 가지 01'], ['outline', '모두 1.2.3']])}</div>
    <div class="sh-sec"><div class="toggle-row"><span>할 일 진행률 표시 (예: 2/4)</span><button class="switch${m.style.rollup ? ' on' : ''}" id="mRollup" aria-label="진행률 표시"></button></div></div>
    <div class="sh-sec"><div class="sh-label">분류</div><div class="chips">${['', ...CATS].map((c) => `<button class="chip${(m.category || '') === c ? ' on' : ''}" data-cat="${c}">${c || '없음'}</button>`).join('')}</div></div>
    <div class="menu-list">
      <button id="mStyle">${ICO.style}<span>맵 스타일 (선·글꼴·상자·레이아웃)</span></button>
      <button id="mExpand">${ICO.expand}<span>모든 가지 펼치기</span></button>
      <button id="mCollapse">${ICO.collapse}<span>큰 가지만 보기 (접기)</span></button>
      <button id="mDel" class="danger">${ICO.trash}<span>이 마인드맵 삭제</span></button>
    </div>`, 'menu');
  const body = $('#sheetBody');
  body.querySelectorAll('[data-cat]').forEach((b) => b.addEventListener('click', () => { m.category = b.dataset.cat; store.put(m); openMapMenu(); }));
  body.querySelectorAll('[data-mnum]').forEach((b) => b.addEventListener('click', () => { mutate(() => { m.style.numbering = b.dataset.mnum; }); openMapMenu(); }));
  $('#mRollup').onclick = () => { mutate(() => { m.style.rollup = !m.style.rollup; }); openMapMenu(); };
  $('#xPng').onclick = () => { closeSheet(); exportPNG(m, false); };
  $('#xShare').onclick = () => { closeSheet(); exportPNG(m, true); };
  $('#xText').onclick = () => { closeSheet(); shareText(m); };
  $('#xJson').onclick = () => { closeSheet(); downloadBlob(fileName(m.root.text) + '.json', new Blob([JSON.stringify({ app: 'mindmap', version: 3, maps: [m] }, null, 1)], { type: 'application/json' })); };
  $('#xTpl').onclick = () => { closeSheet(); saveAsTemplate(m); };
  $('#mStyle').onclick = openStyleSheet;
  $('#mExpand').onclick = () => { closeSheet(); mutate(() => { const f = (n) => { delete n.collapsed; n.children.forEach(f); }; f(m.root); }, { fit: true }); };
  $('#mCollapse').onclick = () => { closeSheet(); mutate(() => { m.root.children.forEach((c) => { if (c.children.length) c.collapsed = true; }); state.sel = null; }, { fit: true }); };
  $('#mDel').onclick = async () => {
    closeSheet();
    if (await confirmDlg('마인드맵 삭제', `‘${m.root.text}’을(를) 삭제할까요? 되돌릴 수 없습니다.`)) { store.del(m.id); history.replaceState(null, '', location.pathname); showHome(); toast('삭제했습니다'); }
  };
}

/* ---------- 내보내기·공유 ---------- */
function outlineText(root) {
  const out = [];
  (function w(n, d, num) {
    const pre = d === 0 ? '' : '  '.repeat(d - 1) + (d === 1 ? num + '. ' : '- ');
    out.push(pre + (n.done === true ? '[완료] ' : n.done === false ? '[ ] ' : '') + (n.text || '') + (n.date ? ` (~${n.date.slice(5).replace('-', '/')})` : '') + (n.note ? `  (메모: ${n.note.replace(/\n/g, ' ')})` : '') + (n.link ? `  <${n.link}>` : ''));
    n.children.forEach((c, i) => w(c, d + 1, i + 1));
  })(root, 0, 0);
  return out.join('\n');
}
async function shareText(m) {
  const text = outlineText(m.root);
  if (navigator.share) { try { await navigator.share({ title: m.root.text, text }); return; } catch (e) { if (e.name === 'AbortError') return; } }
  await copyText(text);
}
async function copyText(t) {
  try { await navigator.clipboard.writeText(t); toast('개요를 복사했습니다. 메모·카톡에 붙여넣기 하세요'); }
  catch (e) { const ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); toast('개요를 복사했습니다'); }
}
async function exportPNG(m, share) {
  toast('이미지를 만드는 중…');
  try {
    const save = { sel: state.sel, selLink: state.selLink, linking: state.linking };
    state.sel = null; state.selLink = null; state.linking = null;
    const L = computeLayout(m);
    const inner = mapSVGInner(L, m, { plain: true });
    Object.assign(state, save);
    const b = bounds(L), pad = 48;
    const vw = b.w + pad * 2, vh = b.h + pad * 2;
    const scale = clamp(Math.min(2.5, 7000 / Math.max(vw, vh)), 0.5, 2.5);
    const W = Math.round(vw * scale), H = Math.round(vh * scale);
    const xml = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="${b.x0 - pad} ${b.y0 - pad} ${vw} ${vh}"><rect x="${b.x0 - pad}" y="${b.y0 - pad}" width="${vw}" height="${vh}" fill="${T.bg}"/>${inner}</svg>`;
    const img = new Image();
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
    await img.decode();
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    c.getContext('2d').drawImage(img, 0, 0, W, H);
    const blob = await new Promise((res) => c.toBlob(res, 'image/png'));
    if (!blob) throw new Error('blob');
    const name = fileName(m.root.text) + '.png';
    if (share) {
      const file = new File([blob], name, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try { await navigator.share({ files: [file], title: m.root.text }); $('#toast').hidden = true; return; } catch (e) { if (e.name === 'AbortError') { $('#toast').hidden = true; return; } }
      }
      toast('이 기기에서는 바로 보내기가 안 되어 이미지로 저장합니다');
    }
    downloadBlob(name, blob);
  } catch (e) { toast('이미지를 만들지 못했습니다'); }
}
function fileName(s) { return (s || '마인드맵').replace(/[\\/:*?"<>|\n]/g, ' ').trim().slice(0, 40) || '마인드맵'; }
function downloadBlob(name, blob) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 3000);
  toast('저장했습니다 (다운로드 폴더)');
}
async function saveAsTemplate(m) {
  const name = await dialogAsk({ title: '템플릿으로 저장', msg: '새 마인드맵을 만들 때 이 구조와 스타일을 그대로 쓸 수 있습니다', value: m.root.text, ok: '저장' });
  if (!name) return;
  const list = myTemplates.list();
  const copy = cloneMap(m); delete copy.category;
  list.unshift({ id: uid(), name, map: copy });
  if (myTemplates.save(list)) toast(`‘${name}’ 템플릿을 저장했습니다`);
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
function toast(msg, actLabel, act, ms) {
  const t = $('#toast');
  t.innerHTML = esc(msg) + (actLabel ? ` <button style="margin-left:10px;border:0;background:transparent;color:var(--headerGold);font-weight:700;font-size:14px;padding:4px">${esc(actLabel)}</button>` : '');
  if (actLabel) t.querySelector('button').onclick = () => { t.hidden = true; act(); };
  t.style.pointerEvents = actLabel ? 'auto' : 'none';
  t.hidden = false;
  clearTimeout(toastTimer);
  if (ms !== 0) toastTimer = setTimeout(() => { t.hidden = true; }, ms || (actLabel ? 4500 : 2600));
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
    if (full) ensureMapFonts(full);
    return `<div class="card" data-open="${m.id}" role="button" tabindex="0">
      <div class="thumb">${full ? thumbSVG(full) : ''}</div>
      <div class="card-info"><div class="card-title">${esc(m.title)}</div><div class="card-meta">${m.category ? esc(m.category) + ' · ' : ''}가지 ${m.count} · ${fmtDate(m.updated)}</div></div>
      <button class="icon-btn more" data-more="${m.id}" aria-label="더보기"><svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/></svg></button>
    </div>`;
  }).join('');
}
function thumbSVG(map) {
  try {
    const save = { sel: state.sel, selLink: state.selLink, linking: state.linking, drag: state.drag, dropTarget: state.dropTarget };
    state.sel = null; state.selLink = null; state.linking = null; state.drag = null; state.dropTarget = null;
    const keepLSP = LSP;
    const L = computeLayout(normalizeMap(map));
    const inner = mapSVGInner(L, map, { plain: true });
    LSP = keepLSP;
    Object.assign(state, save);
    const b = bounds(L), pad = 20;
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
$('#newMapBtn').addEventListener('click', openTemplates);
$('#pasteMapBtn').addEventListener('click', openPasteSheet);
$('#homeMenuBtn').addEventListener('click', openHomeMenu);

/* 새로 만들기: 템플릿 */
function createFrom(map, editRoot = true) {
  const m = normalizeMap(map);
  m.id = uid(); m.updated = Date.now();
  if (state.cat !== '전체') m.category = state.cat;
  store.put(m);
  openMap(m.id);
  if (editRoot) { select(m.root.id); startEdit(m.root.id); }
}
function openTemplates() {
  const mine = myTemplates.list();
  ['pen', 'jua', 'gaegu', 'noto'].forEach(ensureFont);
  const cat = state.tplCat;
  const list = TEMPLATES.filter((t) => cat === '전체' || t.cat === cat);
  openSheet(`
    <div class="sh-title">새 마인드맵</div>
    <button class="paste-new" id="tplPaste">${ICO.paste}<span>글을 붙여넣어 만들기</span></button>
    <div class="tpl-cats">${[...TPL_CATS, ...(mine.length ? ['내 템플릿'] : [])].map((c) => `<button class="chip${cat === c ? ' on' : ''}" data-tcat="${c}">${c}</button>`).join('')}</div>
    ${cat === '내 템플릿' ? '' : `<div class="tpl-grid">${list.map((t) => `<button class="tpl" data-tpl="${t.key}"><div class="tpl-thumb">${t.key === 'blank' ? '' : thumbSVG(t.build())}</div><span>${t.name}</span></button>`).join('')}</div>`}
    ${(cat === '내 템플릿' || cat === '전체') && mine.length ? `<div class="sh-sec"><div class="sh-label">내 템플릿</div></div><div class="tpl-grid">${mine.map((t) => `<div class="tpl" data-mytpl="${t.id}" role="button" tabindex="0"><div class="tpl-thumb">${thumbSVG(JSON.parse(JSON.stringify(t.map)))}</div><span>${esc(t.name)}</span><button class="x" data-deltpl="${t.id}" aria-label="템플릿 삭제">×</button></div>`).join('')}</div>` : ''}
    ${mine.length ? '' : '<p class="hint" style="margin-top:14px">자주 쓰는 맵은 맵의 ⋯ 메뉴 → ‘템플릿 저장’으로 ‘내 템플릿’에 추가할 수 있습니다.</p>'}
  `, 'tpl');
  const body = $('#sheetBody');
  $('#tplPaste').onclick = openPasteSheet;
  body.querySelectorAll('[data-tcat]').forEach((b) => b.addEventListener('click', () => { state.tplCat = b.dataset.tcat; openTemplates(); $('#sheet').scrollTop = 0; }));
  body.querySelectorAll('[data-tpl]').forEach((b) => b.addEventListener('click', () => {
    const t = TEMPLATES.find((x) => x.key === b.dataset.tpl);
    closeSheet(); createFrom(t.build());
  }));
  body.querySelectorAll('[data-mytpl]').forEach((b) => b.addEventListener('click', async (ev) => {
    const del = ev.target.closest('[data-deltpl]');
    if (del) {
      ev.stopPropagation();
      if (await confirmDlg('템플릿 삭제', '이 템플릿을 삭제할까요?')) { myTemplates.remove(del.dataset.deltpl); openTemplates(); }
      return;
    }
    const t = myTemplates.list().find((x) => x.id === b.dataset.mytpl); if (!t) return;
    closeSheet(); createFrom(cloneMap(t.map));
  }));
}
function openPasteSheet() {
  openSheet(`
    <div class="sh-title">글에서 마인드맵 만들기</div>
    <p class="hint">들여쓰기, 글머리(-, •, 1.), # 제목으로 단계가 나뉩니다. 메모·카톡·문서의 목차를 그대로 붙여넣으세요. 첫 줄이 하나뿐이면 가운데 주제가 됩니다.</p>
    <div class="sh-sec"><textarea id="pasteArea" class="big" placeholder="예)&#10;2027 리쿠르팅 전략&#10;- 모객 루트&#10;  - 지인 소개&#10;  - SNS&#10;- 신인 육성&#10;  - [ ] 보험스쿨 일정 확정"></textarea></div>
    <div class="sh-sec"><div class="sh-label">레이아웃</div><div class="chips sm">${LAYOUTS.filter(([k]) => k !== 'free').map(([k, l], i) => `<button class="chip${i === 0 ? ' on' : ''}" data-play="${k}">${l}</button>`).join('')}</div></div>
    <div class="btn-row"><button class="row-btn" id="pasteClip">클립보드에서 가져오기</button><button class="btn-primary small" id="pasteMake">만들기</button></div>
  `, 'paste');
  let lay = 'radial';
  $('#sheetBody').querySelectorAll('[data-play]').forEach((b) => b.addEventListener('click', () => {
    lay = b.dataset.play; $('#sheetBody').querySelectorAll('[data-play]').forEach((x) => x.classList.toggle('on', x === b));
  }));
  $('#pasteClip').onclick = async () => {
    try { const t = await navigator.clipboard.readText(); if (t) $('#pasteArea').value = t; else toast('클립보드가 비어 있습니다'); }
    catch (e) { toast('글 상자를 길게 눌러 ‘붙여넣기’를 해 주세요'); }
  };
  $('#pasteMake').onclick = () => {
    const p = parseOutline($('#pasteArea').value);
    if (!p) return toast('먼저 글을 붙여넣어 주세요');
    const m = newMap(p.root.text, lay);
    m.root = p.root;
    closeSheet();
    createFrom(m, p.synthetic);
    toast(`가지 ${countNodes(p.root) - 1}개로 만들었습니다`);
  };
}

function openCardMenu(id) {
  const meta = store.index().find((m) => m.id === id); if (!meta) return;
  openSheet(`
    <div class="sh-title">${esc(meta.title)}</div>
    <div class="sh-sec"><div class="sh-label">분류</div><div class="chips">${['', ...CATS].map((c) => `<button class="chip${(meta.category || '') === c ? ' on' : ''}" data-cat="${c}">${c || '없음'}</button>`).join('')}</div></div>
    <div class="menu-list">
      <button id="cRename">${ICO.pen}<span>이름 바꾸기</span></button>
      <button id="cDup">${ICO.dup}<span>복제</span></button>
      <button id="cTpl">${ICO.tpl}<span>템플릿으로 저장</span></button>
      <button id="cPng">${ICO.png}<span>이미지 저장</span></button>
      <button id="cSave">${ICO.save}<span>파일로 저장 (.json)</span></button>
      <button id="cDel" class="danger">${ICO.trash}<span>삭제</span></button>
    </div>`, 'card');
  const m = store.get(id);
  $('#sheetBody').querySelectorAll('[data-cat]').forEach((b) => b.addEventListener('click', () => { m.category = b.dataset.cat; store.put(m); renderHome(); openCardMenu(id); }));
  $('#cRename').onclick = async () => { closeSheet(); const t = await dialogAsk({ title: '이름 바꾸기', value: m.root.text }); if (t) { m.root.text = t; store.put(m); renderHome(); } };
  $('#cDup').onclick = () => { closeSheet(); const copy = cloneMap(m); copy.root.text += ' (사본)'; store.put(copy); renderHome(); toast('복제했습니다'); };
  $('#cTpl').onclick = () => { closeSheet(); saveAsTemplate(m); };
  $('#cPng').onclick = () => { closeSheet(); exportPNG(m, false); };
  $('#cSave').onclick = () => { closeSheet(); downloadBlob(fileName(m.root.text) + '.json', new Blob([JSON.stringify({ app: 'mindmap', version: 3, maps: [m] }, null, 1)], { type: 'application/json' })); };
  $('#cDel').onclick = async () => { closeSheet(); if (await confirmDlg('마인드맵 삭제', `‘${m.root.text}’을(를) 삭제할까요? 되돌릴 수 없습니다.`)) { store.del(id); renderHome(); toast('삭제했습니다'); } };
}
function openHomeMenu() {
  openSheet(`
    <div class="sh-title">설정</div>
    ${window.Sync ? Sync.settingsHTML() : ''}
    ${window.AI ? AI.settingsHTML() : ''}
    <div class="sh-sec"><div class="sh-label">테마</div>${themePicker()}</div>
    <div class="menu-list">
      <button id="hBackup">${ICO.save}<span>전체 백업 파일로 저장</span><span class="sub">${store.index().length}개</span></button>
      <button id="hRestore">${ICO.open}<span>백업 파일 불러오기</span></button>
      <a class="menu-a" href="https://github.com/dweom0720-alt/mindmap/releases/latest/download/mindmap.apk" target="_blank" rel="noopener">${ICO.save}<span>안드로이드 앱(APK) 받기</span></a>
    </div>
    <p class="hint">구글 드라이브를 연결하지 않으면 이 기기에만 저장됩니다. 폰을 바꾸거나 브라우저 데이터를 지우기 전에 백업해 두세요.</p>`, 'home');
  bindThemePicker(openHomeMenu);
  if (window.Sync) Sync.bindSettings(openHomeMenu);
  if (window.AI) AI.bindSettings(openHomeMenu);
  $('#hBackup').onclick = () => {
    closeSheet();
    const maps = store.index().map((m) => store.get(m.id)).filter(Boolean);
    const d = new Date();
    downloadBlob(`마인드맵 백업 ${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}.json`, new Blob([JSON.stringify({ app: 'mindmap', version: 3, maps, templates: myTemplates.list() }, null, 1)], { type: 'application/json' }));
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
      m.id = m.id || uid();
      store.put(normalizeMap(m)); n++;
    }
    if (Array.isArray(data.templates) && data.templates.length) {
      const have = new Set(myTemplates.list().map((t) => t.id));
      myTemplates.save([...myTemplates.list(), ...data.templates.filter((t) => t && t.map && !have.has(t.id))]);
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
  if (state.voice) state.voice.abort();
  flushPending();
  closeSheet();
  state.view = 'home'; state.map = null; state.sel = null; state.selLink = null; state.linking = null;
  $('#editor').hidden = true; $('#home').hidden = false;
  $('meta[name=theme-color]').setAttribute('content', T.header);
  renderHome();
}
function openMap(id, push = true) {
  const m = store.get(id); if (!m) { toast('마인드맵을 찾지 못했습니다'); return showHome(); }
  closeSheet();
  state.view = 'editor'; state.map = m; state.sel = null; state.selLink = null; state.linking = null; state.undo = []; state.redo = [];
  $('#home').hidden = true; $('#editor').hidden = false;
  $('meta[name=theme-color]').setAttribute('content', T.bg);
  if (push && location.hash !== '#/map/' + id) { history.pushState(null, '', '#/map/' + id); state.pushed = true; }
  else if (!push) state.pushed = false;
  ensureMapFonts(m);
  render(); fit();
  document.querySelector(`#layoutTabs [data-layout="${m.layout}"]`)?.scrollIntoView({ inline: 'center', block: 'nearest' });
}
window.addEventListener('popstate', route);
function route() {
  const m = location.hash.match(/^#\/map\/(.+)$/);
  if (m) openMap(m[1], false); else showHome();
}
window.addEventListener('pagehide', flushPending);
document.addEventListener('visibilitychange', () => { if (document.hidden) flushPending(); });

/* ---------- 시작 ---------- */
(function init() {
  if (!localStorage.getItem('mm.index')) store.putRaw(sampleMap());
  applyTheme();
  route();
  if (document.fonts) document.fonts.ready.then(() => { mcache.clear(); if (state.view === 'editor') render(); else renderHome(); });
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
})();

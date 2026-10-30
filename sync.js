'use strict';
/* =========================================================
   구글 드라이브 동기화
   - 내 드라이브에 '마인드맵 앱 동기화.json' 파일 1개를 두고 기기끼리 맞춤
   - 맵마다 최근에 고친 쪽이 이김, 지운 맵은 기록(tomb)으로 다른 기기에서도 지움
   - 권한: drive.file (이 앱이 만든 파일만 볼 수 있음)
   ========================================================= */
const Sync = {
  CLIENT_ID: '4615838843-laverhqgq4mloavthdmtpjo1mvdvisll.apps.googleusercontent.com',
  FILE: '마인드맵 앱 동기화.json',
  SCOPE: 'https://www.googleapis.com/auth/drive.file',
  st: 'off', msg: '', timer: null, busy: false, again: false, tokenClient: null,

  clientId() { let v = ''; try { v = localStorage.getItem('mm.gclient') || ''; } catch (e) { /* 무시 */ } return v || Sync.CLIENT_ID; },
  on() { try { return localStorage.getItem('mm.syncOn') === '1'; } catch (e) { return false; } },
  token() { return loadJSON('mm.gtoken', null); },
  valid() { const t = Sync.token(); return !!(t && t.access && t.exp > Date.now() + 60000); },
  last() { return +(localStorage.getItem('mm.syncLast') || 0); },

  /* ---------- 상태 표시 ---------- */
  set(st, msg = '') {
    Sync.st = st; Sync.msg = msg;
    const el = $('#syncLine'), tx = $('#syncText');
    if (!el) return;
    el.classList.remove('off', 'need', 'err', 'busy');
    let text;
    if (!Sync.on()) { el.classList.add('off'); text = '이 기기에만 저장됨 · 구글 드라이브 연결하기'; }
    else if (st === 'busy') { el.classList.add('busy'); text = '구글 드라이브와 동기화 중…'; }
    else if (st === 'need') { el.classList.add('need'); text = '구글 드라이브 · 눌러서 동기화'; }
    else if (st === 'err') { el.classList.add('err'); text = '동기화 실패 · 눌러서 다시 시도' + (msg ? ` (${msg})` : ''); }
    else { const l = Sync.last(); text = '구글 드라이브와 동기화됨' + (l ? ' · ' + Sync.ago(l) : ''); }
    tx.textContent = text;
  },
  ago(t) {
    const s = Math.round((Date.now() - t) / 1000);
    if (s < 60) return '방금'; if (s < 3600) return `${Math.floor(s / 60)}분 전`;
    if (s < 86400) return `${Math.floor(s / 3600)}시간 전`; return fmtDate(t);
  },

  /* ---------- 구글 로그인 (Google Identity Services) ---------- */
  loadGIS() {
    if (window.google?.accounts?.oauth2) return Promise.resolve();
    if (Sync._gis) return Sync._gis;
    Sync._gis = new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client'; s.async = true;
      s.onload = () => res(); s.onerror = () => { Sync._gis = null; rej(new Error('구글 로그인 모듈을 불러오지 못했습니다')); };
      document.head.appendChild(s);
    });
    return Sync._gis;
  },
  async login(first) {
    if (!Sync.clientId()) throw new Error('먼저 OAuth 클라이언트 ID를 넣어 주세요');
    await Sync.loadGIS();
    return new Promise((res, rej) => {
      const tc = google.accounts.oauth2.initTokenClient({
        client_id: Sync.clientId(), scope: Sync.SCOPE,
        callback: (r) => {
          if (r.error || !r.access_token) return rej(new Error(r.error_description || r.error || '로그인이 취소되었습니다'));
          saveJSON('mm.gtoken', { access: r.access_token, exp: Date.now() + (+r.expires_in || 3600) * 1000 });
          res();
        },
        error_callback: (e) => rej(new Error(e?.type === 'popup_closed' ? '로그인 창이 닫혔습니다' : e?.type === 'popup_failed_to_open' ? '로그인 창이 차단되었습니다. 팝업을 허용해 주세요' : '로그인하지 못했습니다')),
      });
      tc.requestAccessToken({ prompt: first ? 'consent' : '' });
    });
  },
  async connect() {
    try {
      Sync.set('busy');
      await Sync.login(!Sync.on());
      localStorage.setItem('mm.syncOn', '1');
      await Sync.run();
      toast('구글 드라이브와 연결했습니다. 이제 다른 기기에서도 같은 맵이 보입니다');
    } catch (e) { Sync.set(Sync.on() ? 'need' : 'off'); toast(e.message); }
  },
  disconnect() {
    const t = Sync.token();
    try { if (t && window.google?.accounts?.oauth2) google.accounts.oauth2.revoke(t.access, () => {}); } catch (e) { /* 무시 */ }
    ['mm.syncOn', 'mm.gtoken', 'mm.gfile'].forEach((k) => localStorage.removeItem(k));
    Sync.set('off');
    toast('구글 드라이브 연결을 끊었습니다. 맵은 이 기기에 그대로 있습니다');
  },

  /* ---------- 드라이브 API ---------- */
  async api(url, opt = {}) {
    const t = Sync.token();
    const res = await fetch(url, { ...opt, headers: { ...(opt.headers || {}), Authorization: `Bearer ${t.access}` } });
    if (res.status === 401) { localStorage.removeItem('mm.gtoken'); const e = new Error('다시 로그인이 필요합니다'); e.code = 401; throw e; }
    return res;
  },
  async findFile() {
    let id = localStorage.getItem('mm.gfile');
    if (id) return id;
    const q = encodeURIComponent(`name='${Sync.FILE}' and trashed=false`);
    const r = await Sync.api(`https://www.googleapis.com/drive/v3/files?q=${q}&orderBy=modifiedTime desc&fields=files(id,modifiedTime)&pageSize=5`);
    if (!r.ok) throw new Error('드라이브 파일을 찾지 못했습니다');
    id = (await r.json()).files?.[0]?.id || null;
    if (id) localStorage.setItem('mm.gfile', id);
    return id;
  },
  async download(id) {
    const r = await Sync.api(`https://www.googleapis.com/drive/v3/files/${id}?alt=media`);
    if (r.status === 404) { localStorage.removeItem('mm.gfile'); return null; }
    if (!r.ok) throw new Error('드라이브에서 받지 못했습니다');
    try { return await r.json(); } catch (e) { return null; }
  },
  async upload(id, data) {
    const body = JSON.stringify(data);
    if (id) {
      const r = await Sync.api(`https://www.googleapis.com/upload/drive/v3/files/${id}?uploadType=media`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body });
      if (r.status === 404) { localStorage.removeItem('mm.gfile'); return Sync.upload(null, data); }
      if (!r.ok) throw new Error('드라이브에 올리지 못했습니다');
      return id;
    }
    const b = 'mmsync' + Date.now();
    const multi = `--${b}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify({ name: Sync.FILE, mimeType: 'application/json', description: '마인드맵 앱이 기기 간 동기화에 쓰는 파일입니다. 지우지 마세요.' })}\r\n--${b}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${body}\r\n--${b}--`;
    const r = await Sync.api('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', { method: 'POST', headers: { 'Content-Type': `multipart/related; boundary=${b}` }, body: multi });
    if (!r.ok) throw new Error('드라이브에 파일을 만들지 못했습니다');
    const nid = (await r.json()).id;
    localStorage.setItem('mm.gfile', nid);
    return nid;
  },

  /* ---------- 병합 ---------- */
  localData() {
    const maps = {};
    for (const m of store.index()) { const full = store.get(m.id); if (full) maps[m.id] = full; }
    return { maps, tomb: loadJSON('mm.tomb', {}), tpl: myTemplates.list(), tpltomb: loadJSON('mm.tpltomb', {}) };
  },
  merge(L, R) {
    R = { maps: {}, tomb: {}, tpl: [], tpltomb: {}, ...(R || {}) };
    const out = { maps: {}, tomb: { ...R.tomb }, tpl: [], tpltomb: { ...R.tpltomb } };
    let pushUp = false;
    const put = [], del = [];
    for (const [k, v] of Object.entries(L.tomb)) if (!(out.tomb[k] >= v)) { out.tomb[k] = v; pushUp = true; }
    for (const [k, v] of Object.entries(L.tpltomb)) if (!(out.tpltomb[k] >= v)) { out.tpltomb[k] = v; pushUp = true; }
    const ids = new Set([...Object.keys(L.maps), ...Object.keys(R.maps)]);
    for (const id of ids) {
      const l = L.maps[id], r = R.maps[id];
      let win;
      if (l && r) win = (r.updated || 0) > (l.updated || 0) ? r : l;
      else win = l || r;
      const dead = out.tomb[id] && out.tomb[id] >= (win.updated || 0);
      if (dead) { if (l) del.push(id); if (r) pushUp = true; continue; }
      out.maps[id] = win;
      if (win === l && (!r || (r.updated || 0) !== (l.updated || 0))) pushUp = true;
      if (win === r && (!l || (l.updated || 0) !== (r.updated || 0))) put.push(r);
    }
    const tplIds = new Map();
    for (const t of [...(R.tpl || []), ...(L.tpl || [])]) if (t && t.id && !out.tpltomb[t.id]) tplIds.set(t.id, t);
    out.tpl = [...tplIds.values()];
    const rIds = new Set((R.tpl || []).map((t) => t.id)), lIds = new Set((L.tpl || []).map((t) => t.id));
    if (out.tpl.some((t) => !rIds.has(t.id)) || (R.tpl || []).some((t) => !tplIds.has(t.id))) pushUp = true;
    const tplChanged = out.tpl.length !== lIds.size || out.tpl.some((t) => !lIds.has(t.id));
    return { out, put, del, pushUp, tplChanged };
  },
  apply(res) {
    for (const id of res.del) store.removeRaw(id);
    for (const m of res.put) store.putRaw(normalizeMap(m));
    saveJSON('mm.tomb', res.out.tomb);
    saveJSON('mm.tpltomb', res.out.tpltomb);
    if (res.tplChanged) saveJSON('mm.tpl', res.out.tpl);
    // 열려 있는 맵이 바뀌었으면 다시 그리기
    if (state.view === 'editor' && state.map) {
      if (res.del.includes(state.map.id)) { toast('다른 기기에서 이 맵을 삭제했습니다'); history.replaceState(null, '', location.pathname); showHome(); return; }
      const nm = res.put.find((m) => m.id === state.map.id);
      if (nm && !state.editing && !state.drag) {
        state.map = normalizeMap(JSON.parse(JSON.stringify(nm)));
        state.undo = []; state.redo = [];
        if (state.sel && !findNode(state.map.root, state.sel)) state.sel = null;
        ensureMapFonts(state.map); render();
        toast('다른 기기에서 고친 내용을 반영했습니다');
      }
    } else if (state.view === 'home' && (res.put.length || res.del.length)) renderHome();
  },
  async run() {
    if (!Sync.on()) return Sync.set('off');
    if (!Sync.valid()) return Sync.set('need');
    if (Sync.busy) { Sync.again = true; return; }
    Sync.busy = true; Sync.set('busy');
    try {
      flushPending();
      const id = await Sync.findFile();
      const remote = id ? await Sync.download(id) : null;
      // 새 기기의 손대지 않은 ‘사용법’ 예시 맵은 드라이브에 맵이 있으면 올리지 않음
      if (remote && Object.keys(remote.maps || {}).length) {
        for (const m of store.index()) { const f = store.get(m.id); if (f && f.sample) store.removeRaw(m.id); }
      }
      const res = Sync.merge(Sync.localData(), remote);
      Sync.apply(res);
      if (res.pushUp || !id || !remote) await Sync.upload(remote ? id : null, { app: 'mindmap', v: 1, saved: Date.now(), ...res.out });
      localStorage.setItem('mm.syncLast', String(Date.now()));
      Sync.set('ok');
    } catch (e) {
      if (e.code === 401) Sync.set('need'); else Sync.set('err', e.message && e.message.length < 30 ? e.message : '');
    } finally {
      Sync.busy = false;
      if (Sync.again) { Sync.again = false; setTimeout(Sync.run, 500); }
    }
  },
  changed() {
    if (!Sync.on()) return;
    clearTimeout(Sync.timer);
    if (!Sync.valid()) { Sync.set('need'); return; }
    Sync.timer = setTimeout(Sync.run, 4000);
  },
  async tap() {
    if (!Sync.on()) { openHomeMenu(); return; }
    if (!Sync.valid()) { try { Sync.set('busy'); await Sync.login(false); } catch (e) { Sync.set('need'); toast(e.message); return; } }
    await Sync.run();
  },

  /* ---------- 설정 화면 ---------- */
  settingsHTML() {
    const on = Sync.on();
    const pill = !on ? '<span class="status-pill"><span class="d"></span>연결 안 됨</span>'
      : Sync.valid() ? `<span class="status-pill ok"><span class="d"></span>연결됨${Sync.last() ? ' · ' + Sync.ago(Sync.last()) + ' 동기화' : ''}</span>`
      : '<span class="status-pill need"><span class="d"></span>연결됨 · 로그인 시간이 지나 다시 눌러야 합니다</span>';
    return `<div class="sh-sec"><div class="sh-label">구글 드라이브 동기화</div>
      <div class="row">${pill}</div>
      <div class="row">${on ? '<button class="row-btn" id="gSyncNow">지금 동기화</button><button class="row-btn" id="gOff">연결 끊기</button>' : '<button class="btn-primary small" id="gOn">구글 드라이브 연결</button>'}</div>
      <p class="hint">폰·탭·PC에서 같은 구글 계정으로 연결하면 맵이 자동으로 맞춰집니다. 내 드라이브에 ‘${Sync.FILE}’ 파일 하나만 만들어집니다.</p>
      ${`<details><summary class="hint" style="cursor:pointer">고급: OAuth 클라이언트 ID 직접 넣기 (보통은 필요 없음)</summary>
        <div class="row" style="margin-top:6px"><input id="gClient" type="text" spellcheck="false" placeholder="xxxx.apps.googleusercontent.com" value="${esc(localStorage.getItem('mm.gclient') || '')}"><button class="row-btn" id="gClientSave">저장</button></div><p class="hint">비워 두면 앱에 들어 있는 ID를 씁니다.</p></details>`}
    </div>`;
  },
  bindSettings(back) {
    $('#gOn')?.addEventListener('click', async () => { if (!Sync.clientId()) return toast('먼저 OAuth 클라이언트 ID를 넣어 주세요'); closeSheet(); await Sync.connect(); });
    $('#gSyncNow')?.addEventListener('click', async () => { closeSheet(); await Sync.tap(); });
    $('#gOff')?.addEventListener('click', async () => { if (await dialogAsk({ title: '연결 끊기', msg: '이 기기의 동기화를 끕니다. 드라이브와 이 기기의 맵은 지워지지 않습니다.', ok: '끊기' })) { Sync.disconnect(); back(); } });
    $('#gClientSave')?.addEventListener('click', () => {
      const v = $('#gClient').value.trim();
      if (v && !/\.apps\.googleusercontent\.com$/.test(v)) return toast('클라이언트 ID는 .apps.googleusercontent.com 으로 끝납니다');
      if (v) localStorage.setItem('mm.gclient', v); else localStorage.removeItem('mm.gclient');
      toast('저장했습니다'); back();
    });
  },
};

/* 편집 중 저장(자동 저장 타이머)과 별개로, 동기화 직전에 조용히 저장 */
store.putQuiet = (map) => {
  map.updated = map.updated || Date.now();
  saveJSON('mm.map.' + map.id, map);
  const idx = store.index().filter((m) => m.id !== map.id); idx.unshift(store.meta(map)); saveJSON('mm.index', idx);
};

window.Sync = Sync;
$('#syncLine').addEventListener('click', () => Sync.tap());
document.addEventListener('visibilitychange', () => {
  if (!Sync.on()) return;
  if (document.hidden) { if (Sync.timer) { clearTimeout(Sync.timer); Sync.timer = null; if (Sync.valid()) Sync.run(); } }
  else if (Sync.valid() && Date.now() - Sync.last() > 30000) Sync.run();
  else Sync.set(Sync.valid() ? 'ok' : 'need');
});
setInterval(() => { if (state.view === 'home') Sync.set(Sync.st); }, 30000);
Sync.set(Sync.on() ? (Sync.valid() ? 'busy' : 'need') : 'off');
if (Sync.on() && Sync.valid()) Sync.run();

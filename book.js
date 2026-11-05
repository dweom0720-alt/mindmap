/* 생각서재 → 마인드맵 연결
   생각서재의 '🧠 마인드맵' 버튼이 #bk=<압축된 책 정리> 로 이 앱을 엽니다.
   - 이미 연결된 책이면 그 가지를 새 내용으로 고칩니다 (내가 직접 단 가지는 그대로 둡니다).
   - 처음이면 새 맵으로 만들지, 내 맵에 가지로 붙일지 고릅니다. */
(function () {
  async function decode(b64) {
    const bin = atob(b64.replace(/-/g, '+').replace(/_/g, '/'));
    const buf = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    const ds = new DecompressionStream('deflate-raw');
    const txt = await new Response(new Blob([buf]).stream().pipeThrough(ds)).text();
    return JSON.parse(txt);
  }
  const item = (x) => { const n = newNode(x.t || ''); if (x.n) n.note = x.n; n.bki = 1; return n; };
  function groups(d) {
    const g = [];
    const grp = (key, text, icon, kids, extra = {}) => { if (!kids.length) return; g.push(Object.assign(newNode(text), { icon, bkg: key, children: kids }, extra)); };
    grp('one', '핵심 한 줄', '🎯', d.one ? [item({ t: d.one })] : [], d.big ? { note: d.big } : {});
    grp('flow', '생각의 흐름', '🗺', (d.flow || []).map(item));
    grp('ch', '장별 요약', '📖', (d.chapters || []).map(item), { collapsed: (d.chapters || []).length > 8 });
    grp('keys', '꼭 남길 핵심', '💡', (d.keys || []).map((t) => item({ t })));
    grp('pilsa', '필사', '✍️', (d.pilsa || []).map(item));
    grp('hl', '형광펜', '🖍️', (d.hl || []).map(item));
    return g;
  }
  /* 연결된 책 가지를 새 내용으로: 생성 가지는 갈아 끼우고, 내가 단 가지·꾸밈은 지킨다 */
  function refresh(bookNode, d) {
    const fresh = groups(d), old = bookNode.children;
    const out = [];
    for (const f of fresh) {
      const o = old.find((c) => c.bkg === f.bkg);
      if (o) { o.children = [...f.children, ...o.children.filter((c) => !c.bki)]; if (f.note) o.note = f.note; out.push(o); }
      else out.push(f);
    }
    // 이번엔 비어 있는 생성 가지라도 내가 단 가지가 있으면 남긴다
    for (const o of old) {
      if (out.includes(o)) continue;
      if (o.bkg) { o.children = o.children.filter((c) => !c.bki); if (!o.children.length) continue; }
      out.push(o);
    }
    bookNode.children = out;
    bookNode.bookAt = d.at;
  }
  function findBook(root, id) {
    if (root.bookLink === id) return root;
    for (const c of root.children || []) { const r = findBook(c, id); if (r) return r; }
    return null;
  }
  function linkedMaps(id) {
    const out = [];
    for (const meta of store.index()) { const m = store.get(meta.id); if (!m) continue; const n = findBook(m.root, id); if (n) out.push({ m, n }); }
    return out;
  }
  const count = (d) => `필사 ${(d.pilsa || []).length} · 형광펜 ${(d.hl || []).length}`;
  function update(d, hit) {
    refresh(hit.n, d); store.put(hit.m); openMap(hit.m.id);
    toast(`『${d.title}』 가지를 새로 고쳤습니다 · ${count(d)}`);
  }
  function newBookMap(d) {
    const m = newMap(d.title, 'radial');
    m.root.bookLink = d.id; if (d.author) m.root.note = d.author;
    m.root.children = groups(d); m.root.bookAt = d.at;
    m.category = '공부';
    closeSheet(); createFrom(m, false);
    toast(`『${d.title}』 마인드맵을 만들었습니다 · ${count(d)}`);
  }
  function attach(d, mapId) {
    const m = store.get(mapId); if (!m) return;
    const b = Object.assign(newNode(d.title), { icon: '📚', bookLink: d.id, children: groups(d), bookAt: d.at, collapsed: false });
    if (d.author) b.note = d.author;
    m.root.children.push(b); m.root.collapsed = false;
    store.put(m); closeSheet(); openMap(m.id);
    toast(`‘${m.root.text}’에 『${d.title}』 가지를 붙였습니다`);
  }
  function chooser(d, hits) {
    const maps = store.index().filter((x) => !hits.some((h) => h.m.id === x.id));
    openSheet(`
      <div class="sh-title">『${esc(d.title)}』 마인드맵에 연결</div>
      <p class="hint">요약(핵심 한 줄·생각의 흐름·장별 요약·꼭 남길 핵심)과 함께 필사·형광펜 문장을 새 가지로 정리합니다. ${esc(count(d))}</p>
      ${hits.length ? `<div class="sh-sec"><div class="sh-label">이미 연결된 맵 — 새 내용으로 고치기</div>${hits.map((h) => `<button class="row-btn bk-row" data-up="${h.m.id}">↻ ${esc(h.m.root.text || '제목 없음')}</button>`).join('')}</div>` : ''}
      <div class="sh-sec"><button class="btn-primary small" id="bkNew">새 마인드맵으로 만들기</button></div>
      ${maps.length ? `<div class="sh-sec"><div class="sh-label">내 맵에 가지로 붙이기</div>${maps.slice(0, 30).map((x) => `<button class="row-btn bk-row" data-at="${x.id}">＋ ${esc(x.title)} <span class="muted">· 가지 ${x.count}</span></button>`).join('')}</div>` : ''}
    `, 'book');
    $('#bkNew').onclick = () => newBookMap(d);
    $('#sheetBody').querySelectorAll('[data-at]').forEach((b) => b.addEventListener('click', () => attach(d, b.dataset.at)));
    $('#sheetBody').querySelectorAll('[data-up]').forEach((b) => b.addEventListener('click', () => { closeSheet(); update(d, hits.find((h) => h.m.id === b.dataset.up)); }));
  }
  async function handle() {
    const mt = location.hash.match(/[#&]bk=([A-Za-z0-9_-]+)/); if (!mt) return;
    let d;
    try { d = await decode(mt[1]); } catch (e) { toast('생각서재에서 보낸 내용을 읽지 못했습니다'); return; }
    history.replaceState(null, '', location.pathname + location.search);
    if (!d || !d.id || !d.title) return;
    const hits = linkedMaps(d.id);
    if (hits.length === 1) {
      showHome(); update(d, hits[0]);
      toast(`『${d.title}』 가지를 새로 고쳤습니다 · ${count(d)}`, '다른 맵에 연결', () => chooser(d, hits), 6000);
    } else { showHome(); chooser(d, hits); }
  }
  window.addEventListener('hashchange', handle);
  handle();
})();

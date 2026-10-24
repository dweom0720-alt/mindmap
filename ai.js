'use strict';
/* =========================================================
   AI (Google Gemini 무료 API)
   - 주제로 마인드맵 만들기 · 글/회의록 정리 · 가지 뻗기 · 맵 → 글
   - API 키는 이 기기에만 저장 (동기화하지 않음)
   ========================================================= */
const AI = {
  MODELS: ['gemini-flash-latest', 'gemini-2.5-flash', 'gemini-2.0-flash'],
  key() { try { return localStorage.getItem('mm.gemini') || ''; } catch (e) { return ''; } },
  setKey(k) { try { if (k) localStorage.setItem('mm.gemini', k.trim()); else localStorage.removeItem('mm.gemini'); } catch (e) { /* 무시 */ } },

  /* 간단 호출: 글만 돌려줌 */
  async call(prompt, json = true) { return (await AI.ask(prompt, { json })).text; },
  /* 자세한 호출: { json, search } → { text, sources, searched } */
  async ask(prompt, opt = {}) {
    const key = AI.key();
    if (!key) { const e = new Error('nokey'); e.code = 'nokey'; throw e; }
    const json = opt.json !== false;
    let search = !!opt.search;
    let saved = ''; try { saved = localStorage.getItem('mm.geminiModel') || ''; } catch (e) { /* 무시 */ }
    const models = saved ? [saved, ...AI.MODELS.filter((m) => m !== saved)] : AI.MODELS;
    let lastErr = null;
    for (let i = 0; i < models.length; i++) {
      const model = models[i];
      const gen = { temperature: opt.temperature ?? 0.6, maxOutputTokens: 8192 };
      // 구글 검색을 쓸 때는 JSON 고정 출력을 함께 쓸 수 없어 글로 받아 JSON을 꺼냄
      if (json && !search) gen.responseMimeType = 'application/json';
      const payload = { contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: gen };
      if (search) payload.tools = [{ google_search: {} }];
      let res;
      try {
        res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key }, body: JSON.stringify(payload),
        });
      } catch (e) { const er = new Error('인터넷 연결을 확인해 주세요'); er.code = 'net'; throw er; }
      let body = {};
      try { body = await res.json(); } catch (e) { /* 무시 */ }
      if (res.status === 404) { lastErr = body; continue; }
      if (!res.ok) {
        const msg = body.error?.message || '';
        const keyErr = (res.status === 400 || res.status === 403) && /API key|API_KEY|permission denied/i.test(msg);
        // 검색 사용 한도·미지원이면 검색 없이 한 번 더
        if (search && !keyErr) { search = false; i--; AI.searchFailed = true; continue; }
        const er = new Error(
          res.status === 429 ? '무료 사용량을 잠시 넘었습니다. 1분쯤 뒤에 다시 해 주세요'
          : keyErr ? 'API 키가 맞지 않습니다. 설정에서 키를 확인해 주세요'
          : res.status >= 500 ? 'AI 서버가 바쁩니다. 잠시 뒤 다시 해 주세요'
          : 'AI 요청이 실패했습니다' + (msg ? ` (${msg.slice(0, 80)})` : ''));
        er.code = res.status; throw er;
      }
      try { localStorage.setItem('mm.geminiModel', model); } catch (e) { /* 무시 */ }
      const cand = body.candidates?.[0] || {};
      const text = (cand.content?.parts || []).map((p) => p.text || '').join('');
      if (!text) { const er = new Error('AI가 답을 주지 않았습니다. 표현을 바꿔 다시 해 주세요'); er.code = 'empty'; throw er; }
      const seen = new Set(), sources = [];
      for (const c of cand.groundingMetadata?.groundingChunks || []) {
        const w = c.web; if (!w || !w.uri) continue;
        const title = (w.title || w.uri).trim();
        if (seen.has(title)) continue; seen.add(title); sources.push({ title, uri: w.uri });
      }
      return { text, sources: sources.slice(0, 8), searched: search };
    }
    const er = new Error('사용할 수 있는 AI 모델을 찾지 못했습니다' + (lastErr?.error?.message ? ` (${lastErr.error.message.slice(0, 60)})` : ''));
    er.code = 'model'; throw er;
  },
  parse(text) {
    let t = String(text).trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
    try { return JSON.parse(t); } catch (e) { /* 아래에서 다시 */ }
    const a = t.indexOf('{'), b = t.lastIndexOf('}');
    if (a >= 0 && b > a) return JSON.parse(t.slice(a, b + 1));
    throw new Error('AI 답을 읽지 못했습니다. 다시 해 주세요');
  },
  toNode(o) {
    if (typeof o === 'string') o = { text: o };
    const n = newNode(String(o.text || o.title || '').trim().slice(0, 300) || '가지');
    if (o.todo === true) n.done = false;
    if (o.note) n.note = String(o.note).slice(0, 1000);
    n.children = (Array.isArray(o.children) ? o.children : []).filter((c) => c && (typeof c === 'string' ? c.trim() : (c.text || c.title))).map((c) => AI.toNode(c));
    return n;
  },

  /* ---------- 프롬프트 ---------- */
  RULES: `규칙:
- 한국어로 작성.
- 각 가지는 짧은 핵심어나 구절(25자 이내). 완전한 문장, 번호, 글머리 기호를 붙이지 말 것.
- 같은 단계의 가지끼리 겹치지 않게(MECE), 실무에 바로 쓸 수 있게 구체적으로.
- 사실·수치를 지어내지 말 것. 모르는 값은 "[ ]"로 비워 둘 것.`,
  SHAPE: '출력은 JSON 하나만: {"title":"가운데 주제","children":[{"text":"가지","children":[{"text":"세부","children":[]}]}]}',
  todoRule(on) { return on ? '- 할 일·실행 항목은 "todo": true 로 표시.' : '- todo 필드는 넣지 말 것.'; },
  promptTopic(topic, opt) {
    return `너는 마인드맵 작성 도우미다. 아래 주제로 마인드맵을 만들어라.
- 가운데 주제(title)는 20자 이내.
- 큰 가지 약 ${opt.count}개, 각 큰 가지 아래 세부 가지 2~4개${opt.depth === 3 ? ', 필요한 곳은 그 아래 한 단계 더(2~3개)' : ''}.
${AI.RULES}
${AI.SHAPE}

주제: ${topic}${opt.extra ? `\n추가 요청: ${opt.extra}` : ''}`;
  },
  LEVELS: { simple: ['4~5', '2~3', '2단계까지', '1문장'], normal: ['5~7', '2~4', '필요한 곳은 3단계까지', '1~2문장'], deep: ['6~8', '3~5', '대부분 3단계까지', '2~3문장'] },
  promptPlan(req, opt) {
    const [big, sub, dep, noteLen] = AI.LEVELS[opt.level] || AI.LEVELS.normal;
    return `너는 이 요청 분야의 경험 많은 전문가이자 기획자다. 사용자의 요청을 받아 네가 아는 지식${opt.search ? '과 구글 검색으로 찾은 최신 자료' : ''}, 그리고 너의 판단과 추천 의견을 적극 반영해 실제로 쓸 수 있는 기획 마인드맵을 만들어라.
- 요청이 짧아도 필요한 관점(예: 목표와 방향, 현재 상황 점검, 선택지 비교, 단계별 실행 계획, 필요한 자원·비용, 위험과 대비책, 바로 할 일)을 스스로 골라 구성하라. 요청 성격에 맞지 않는 관점은 빼라.
- 한국 실정(제도·문화·생활 방식)에 맞게 구체적으로. 막연한 말 대신 실제 방법·예시·추천을 담아라.
- 큰 가지 ${big}개, 각 큰 가지 아래 세부 가지 ${sub}개, ${dep}.
- 가지 글은 25자 이내 핵심어·구절. 문장·번호·글머리 기호 금지.
${opt.notes ? `- 큰 가지와 중요한 세부 가지에는 "note"에 ${noteLen}로 이유·구체적 방법·추천 의견을 적어라.` : '- note는 넣지 말 것.'}
- 수치·제도·금액은 일반적으로 알려진 범위에서만 쓰고, 바뀌었을 수 있거나 불확실하면 note에 "최신 기준 확인 필요"라고 적어라.
${AI.todoRule(opt.todo)}
- 가운데 주제(title)는 요청을 20자 이내로 다듬은 제목.
출력은 코드블록 없이 JSON 하나만: {"title":"가운데 주제","children":[{"text":"가지","note":"설명","children":[{"text":"세부","note":"","children":[]}]}]}

요청: ${req}`;
  },
  /* 출처 가지 붙이기 */
  addSources(root, sources) {
    if (!sources || !sources.length) return;
    root.children.push(Object.assign(newNode('참고 자료'), { icon: '📎', children: sources.map((s) => Object.assign(newNode(s.title.slice(0, 60)), { link: s.uri })) }));
  },
  promptText(text, opt = {}) {
    return `너는 마인드맵 정리 도우미다. 아래 글(회의록·메모·문서)을 마인드맵 구조로 정리하라.
- 원문에 있는 내용만 사용하고 없는 내용을 덧붙이지 말 것.
- 비슷한 내용끼리 묶어 큰 가지 3~7개로 만들고, 핵심만 짧게.
- 결정 사항과 할 일이 있으면 각각 별도 큰 가지로 모으기. 담당자·기한이 있으면 가지 글에 함께 적기.
${AI.todoRule(opt.todo)}
- 가운데 주제(title)는 글의 주제를 20자 이내로.
${AI.RULES}
${AI.SHAPE}

글:
"""
${text.slice(0, 12000)}
"""`;
  },
  promptExpand(map, node, path, opt) {
    const outline = outlineText(map.root).slice(0, 3500);
    const existing = node.children.map((c) => c.text).filter(Boolean);
    return `너는 이 분야의 경험 많은 전문가다. 아래 마인드맵에서 [대상 가지]에 붙일 하위 가지를, 네 지식${opt.search ? '과 검색한 최신 자료' : ''}과 추천 의견을 반영해 제안하라.
- 제안 ${opt.count}개.${opt.deep ? ' 각 제안마다 세부 가지 2~3개를 children으로 포함.' : ' children은 빈 배열.'}
- 이미 있는 하위 가지와 겹치지 말 것: ${existing.length ? existing.join(', ') : '(없음)'}
- 맵 전체 흐름과 다른 가지 내용에 맞출 것.
${AI.RULES}
출력은 코드블록 없이 JSON 하나만: {"items":[{"text":"제안","note":"이유·방법 한 줄","children":[{"text":"세부","children":[]}]}]}

마인드맵 개요:
${outline}

대상 가지 경로: ${path.join(' > ')}${opt.extra ? `\n추가 요청: ${opt.extra}` : ''}`;
  },
  FORMATS: [
    ['summary', '핵심 요약'], ['report', '보고서'], ['lecture', '강의 대본'], ['email', '공유 이메일'], ['plan', '실행 계획표'], ['kakao', '카톡 공지'],
  ],
  promptWrite(map, fmt, extra) {
    const guide = {
      summary: '핵심만 5~8줄로 요약. 각 줄은 "• "로 시작.',
      report: '임원 보고용 보고서. 제목 / 1. 배경·목적 / 2. 현황 / 3. 문제점 / 4. 개선 방안 / 5. 기대 효과·일정 순서. 개조식(~함, ~필요) 문체, 군더더기 없이.',
      lecture: '말로 하는 강의 대본. 도입(인사·목적) → 본론(가지 순서대로, 예시 질문 포함) → 마무리(요약·당부). 청중에게 말하듯 자연스럽게. 각 부분 앞에 [도입] [본론 1] 같은 표시.',
      email: '팀에 공유하는 이메일. 첫 줄은 "제목: ...". 인사 → 요지 → 세부 내용(항목별) → 요청 사항 → 마무리 인사.',
      plan: '실행 계획표. 한 줄에 하나씩 "번호. 할 일 | 담당: [ ] | 기한: [ ] | 상태" 형식. 맵에 담당·기한이 있으면 채우고 없으면 [ ]로.',
      kakao: '단체 카톡방 공지. 짧고 읽기 쉽게, 이모지는 2~3개 이내, 핵심 항목은 줄바꿈으로.',
    }[fmt];
    return `아래 마인드맵 개요를 바탕으로 글을 써라.
형식: ${guide}
- 한국어로 작성.
- 맵에 없는 사실·수치를 지어내지 말 것. 필요한 값은 [ ]로 비워 둘 것.
- 마크다운 기호(#, **, 표)는 쓰지 말고 일반 텍스트로.${extra ? `\n추가 요청: ${extra}` : ''}

마인드맵 개요:
${outlineText(map.root).slice(0, 8000)}`;
  },

  /* ---------- 키 설정 ---------- */
  settingsHTML() {
    const k = AI.key();
    return `<div class="sh-sec"><div class="sh-label">AI (Gemini 무료 API 키)</div>
      <div class="row"><span class="status-pill ${k ? 'ok' : ''}"><span class="d"></span>${k ? `등록됨 <span class="key-mask">••••${esc(k.slice(-4))}</span>` : '등록 안 됨'}</span></div>
      <div class="row"><button class="row-btn" id="aiKeyBtn">${k ? '키 바꾸기' : '키 등록하기'}</button>${k ? '<button class="row-btn" id="aiKeyDel">키 지우기</button>' : ''}</div></div>`;
  },
  bindSettings(back) {
    $('#aiKeyBtn')?.addEventListener('click', () => AI.openKeySheet(back));
    $('#aiKeyDel')?.addEventListener('click', () => { AI.setKey(''); toast('AI 키를 지웠습니다'); back(); });
  },
  openKeySheet(after) {
    openSheet(`
      <div class="sh-eyebrow">AI 설정</div>
      <div class="sh-title">Gemini API 키 등록</div>
      <p class="hint">구글 Gemini 무료 API로 AI 기능을 씁니다. 키는 이 기기에만 저장됩니다.</p>
      <ol class="steps">
        <li><a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">aistudio.google.com/apikey</a> 를 엽니다 (구글 계정 로그인)</li>
        <li><b>API 키 만들기(Create API key)</b>를 누릅니다</li>
        <li>만들어진 키(AIza…로 시작)를 복사해 아래에 붙여넣습니다</li>
      </ol>
      <div class="sh-sec"><label class="sh-label" for="aiKeyInput">API 키</label><input id="aiKeyInput" type="text" autocomplete="off" spellcheck="false" placeholder="AIza..." value="${esc(AI.key())}"></div>
      <div class="btn-row"><button class="row-btn" id="aiKeyTest">저장하고 시험하기</button></div>
    `, 'aikey');
    $('#aiKeyTest').onclick = async (ev) => {
      const v = $('#aiKeyInput').value.trim();
      if (!v) return toast('키를 붙여넣어 주세요');
      AI.setKey(v);
      const b = ev.currentTarget; b.disabled = true; b.innerHTML = '<span class="spin"></span>확인 중…';
      try { await AI.call('"확인"이라고만 답해.', false); toast('AI 키가 정상 작동합니다'); closeSheet(); if (after) after(); }
      catch (e) { toast(e.message); b.disabled = false; b.textContent = '저장하고 시험하기'; }
    };
  },
  needKey(after) { if (AI.key()) return false; AI.openKeySheet(after); toast('먼저 무료 AI 키를 등록해 주세요'); return true; },

  /* ---------- 홈: AI로 만들기 ---------- */
  homeTab: 'plan',
  mk: { level: 'normal', search: true, notes: true, todo: false, lay: 'radial' },
  openMake() {
    if (AI.needKey(AI.openMake)) return;
    const tab = AI.homeTab === 'text' ? 'text' : 'plan';
    const o = AI.mk;
    const sw = (id, on, label) => `<div class="toggle-row"><span>${label}</span><button class="switch${on ? ' on' : ''}" id="${id}" aria-label="${label}"></button></div>`;
    openSheet(`
      <div class="sh-eyebrow">AI</div>
      <div class="sh-title">AI로 마인드맵 만들기</div>
      <div class="ptabs"><button data-mt="plan" class="${tab === 'plan' ? 'on' : ''}">AI가 기획해 주기</button><button data-mt="text" class="${tab === 'text' ? 'on' : ''}">내 글·회의록 정리</button></div>
      ${tab === 'plan' ? `
        <div class="sh-sec"><label class="sh-label" for="aiReq">무엇을 만들어 드릴까요?</label>
          <textarea id="aiReq" placeholder="예) 은퇴 이후 제2의 삶을 기획해줘&#10;예) 지방권 신인 설계사 리쿠르팅을 2배로 늘리는 방법&#10;예) 60대 부부 제주 한 달 살기 계획&#10;예) 신인 설계사 4주 교육 과정 만들어줘">${esc(AI.req || '')}</textarea>
          <p class="hint">AI가 자기 지식과 판단으로 필요한 내용을 알아서 채웁니다. 원하는 점(대상·기간·예산·강조할 것)을 함께 적으면 더 잘 맞춰 줍니다.</p></div>
        <div class="sh-sec"><div class="sh-label">얼마나 자세히</div>${seg('lv', o.level, [['simple', '간단히'], ['normal', '보통'], ['deep', '자세히']])}</div>
        <div class="sh-sec">
          ${sw('aiSearch', o.search, '최신 자료 검색해서 반영 (구글 검색)')}
          ${sw('aiNotes', o.notes, '가지마다 설명·추천 의견을 메모로 달기')}
          ${sw('aiTodo', o.todo, '할 일 체크박스 넣기')}
        </div>
      ` : `
        <div class="sh-sec"><label class="sh-label" for="aiText">정리할 글</label><textarea id="aiText" class="big" placeholder="회의록, 메모, 카톡 대화, 문서 내용을 붙여넣으세요"></textarea>
        <div class="row"><button class="row-btn" id="aiClip">클립보드에서 가져오기</button></div><p class="hint">붙여넣은 내용만으로 정리하고, 없는 내용은 덧붙이지 않습니다.</p></div>
        <div class="sh-sec">${sw('aiTodo', o.todo, '할 일은 체크박스로 넣기')}</div>
      `}
      <div class="sh-sec"><div class="sh-label">레이아웃</div><div class="chips sm">${LAYOUTS.filter(([k]) => k !== 'free').map(([k, l]) => `<button class="chip${k === o.lay ? ' on' : ''}" data-alay="${k}">${l}</button>`).join('')}</div></div>
      <div class="btn-row"><button class="btn-primary small" id="aiGo">AI로 만들기</button></div>
    `, 'aimake');
    const B = $('#sheetBody');
    B.querySelectorAll('[data-mt]').forEach((b) => b.addEventListener('click', () => { if ($('#aiReq')) AI.req = $('#aiReq').value; AI.homeTab = b.dataset.mt; AI.openMake(); }));
    B.querySelectorAll('[data-lv]').forEach((b) => b.addEventListener('click', () => { o.level = b.dataset.lv; B.querySelectorAll('[data-lv]').forEach((x) => x.classList.toggle('on', x === b)); }));
    B.querySelectorAll('[data-alay]').forEach((b) => b.addEventListener('click', () => { o.lay = b.dataset.alay; B.querySelectorAll('[data-alay]').forEach((x) => x.classList.toggle('on', x === b)); }));
    const tog = (id, key) => $(id)?.addEventListener('click', (ev) => { o[key] = !o[key]; ev.currentTarget.classList.toggle('on', o[key]); });
    tog('#aiSearch', 'search'); tog('#aiNotes', 'notes'); tog('#aiTodo', 'todo');
    $('#aiReq')?.addEventListener('input', (ev) => { AI.req = ev.target.value; });
    $('#aiClip')?.addEventListener('click', async () => { try { const t = await navigator.clipboard.readText(); if (t) $('#aiText').value = t; } catch (e) { toast('글 상자를 길게 눌러 붙여넣기 해 주세요'); } });
    $('#aiGo').onclick = async (ev) => {
      const b = ev.currentTarget;
      let prompt, search = false;
      if (tab === 'plan') {
        const req = $('#aiReq').value.trim(); if (!req) return toast('무엇을 만들지 적어 주세요');
        search = o.search;
        prompt = AI.promptPlan(req, o);
      } else {
        const text = $('#aiText').value.trim(); if (text.length < 10) return toast('정리할 글을 붙여넣어 주세요');
        prompt = AI.promptText(text, o);
      }
      b.disabled = true; b.innerHTML = `<span class="spin"></span>${search ? 'AI가 자료를 찾고 기획하는 중…' : 'AI가 만드는 중…'}`;
      AI.searchFailed = false;
      try {
        const r = await AI.ask(prompt, { json: true, search, temperature: tab === 'plan' ? 0.75 : 0.4 });
        const data = AI.parse(r.text);
        const root = AI.toNode({ text: data.title || '새 마인드맵', children: data.children || [] });
        if (!root.children.length) throw new Error('AI가 가지를 만들지 못했습니다. 요청을 조금 더 자세히 적어 주세요');
        if (r.searched) AI.addSources(root, r.sources);
        const m = newMap(root.text, o.lay); m.root = root;
        AI.req = '';
        closeSheet(); createFrom(m, false);
        toast(`AI가 가지 ${countNodes(root) - 1}개를 만들었습니다` + (search && AI.searchFailed ? ' (검색은 한도 초과로 빼고 만들었습니다)' : '') + (o.notes && tab === 'plan' ? ' · 가지를 누르면 아래에 설명이 보입니다' : ''), null, null, 5000);
      } catch (e) { toast(e.message); b.disabled = false; b.textContent = 'AI로 만들기'; }
    };
  },

  /* ---------- 편집 화면: AI 도우미 ---------- */
  tab: 'expand', last: null,
  openHelper() {
    if (AI.needKey(AI.openHelper)) return;
    const m = state.map; if (!m) return;
    const target = (state.sel && findNode(m.root, state.sel)?.node) || m.root;
    const tab = AI.tab;
    let body = '';
    if (tab === 'expand') {
      const sug = AI.last && AI.last.target === target.id ? AI.last.items : null;
      body = `
        <div class="sh-sec"><div class="sh-label">‘${esc(target.text || '제목 없음')}’ 아래에 가지 뻗기</div><p class="hint">다른 가지를 먼저 누르고 이 버튼을 누르면 그 가지 아래로 뻗습니다.</p></div>
        <div class="sh-sec"><div class="sh-label">제안 개수</div>${seg('ecnt', String(AI.ecnt || 5), [['3', '3개'], ['5', '5개'], ['8', '8개']])}</div>
        <div class="sh-sec"><div class="toggle-row"><span>세부 가지까지 함께</span><button class="switch${AI.deep ? ' on' : ''}" id="aiDeep" aria-label="세부 가지까지"></button></div>
          <div class="toggle-row"><span>최신 자료 검색해서 반영</span><button class="switch${AI.esearch ? ' on' : ''}" id="aiESearch" aria-label="자료 검색"></button></div></div>
        <div class="sh-sec"><label class="sh-label" for="aiEx">추가 요청 (선택)</label><input id="aiEx" type="text" placeholder="예) 현장 사례 위주로, 숫자 목표 포함" value="${esc(AI.ex || '')}"></div>
        <div class="btn-row"><button class="${sug ? 'row-btn' : 'btn-primary small'}" id="aiSuggest">${sug ? '다시 제안받기' : 'AI 제안 받기'}</button></div>
        ${sug ? `<div class="ai-res" id="aiRes">${sug.map((it, i) => `<label><input type="checkbox" data-i="${i}" checked><span>${esc(it.text)}${it.children.length ? `<span class="sub">${it.children.map((c) => esc(c.text)).join(' · ')}</span>` : ''}</span></label>`).join('')}</div>
          <div class="btn-row"><button class="btn-primary small" id="aiAdd">선택한 가지 추가</button></div>` : ''}`;
    } else if (tab === 'text') {
      body = `
        <div class="sh-sec"><label class="sh-label" for="aiText2">정리할 글</label><textarea id="aiText2" class="big" placeholder="회의록, 메모, 문서 내용을 붙여넣으세요"></textarea></div>
        <div class="sh-sec"><div class="sh-label">넣을 곳</div>${seg('dest', 'here', [['here', `‘${esc((target.text || '').slice(0, 10))}’ 아래`], ['new', '새 마인드맵']])}</div>
        <div class="btn-row"><button class="btn-primary small" id="aiConv">AI로 정리하기</button></div>`;
    } else {
      body = `
        <div class="sh-sec"><div class="sh-label">어떤 글로 쓸까요?</div><div class="chips sm">${AI.FORMATS.map(([k, l]) => `<button class="chip${(AI.fmt || 'summary') === k ? ' on' : ''}" data-fmt="${k}">${l}</button>`).join('')}</div></div>
        <div class="sh-sec"><label class="sh-label" for="aiEx2">추가 요청 (선택)</label><input id="aiEx2" type="text" placeholder="예) 10분 분량으로, 존댓말로" value="${esc(AI.ex2 || '')}"></div>
        <div class="btn-row"><button class="btn-primary small" id="aiWrite">글 만들기</button></div>
        ${AI.out ? `<div class="sh-sec"><textarea id="aiOut" class="ai-out">${esc(AI.out)}</textarea></div>
          <div class="btn-row"><button class="row-btn" id="aiCopy">복사</button><button class="row-btn" id="aiShare">보내기</button><button class="row-btn" id="aiNote">가운데 주제 메모로 저장</button></div>` : ''}`;
    }
    openSheet(`
      <div class="sh-eyebrow">AI 도우미</div>
      <div class="sh-title">${esc(m.root.text || '제목 없음')}</div>
      <div class="ptabs"><button data-at="expand" class="${tab === 'expand' ? 'on' : ''}">가지 뻗기</button><button data-at="text" class="${tab === 'text' ? 'on' : ''}">글 → 맵</button><button data-at="write" class="${tab === 'write' ? 'on' : ''}">맵 → 글</button></div>
      ${body}`, 'ai', true);
    const B = $('#sheetBody');
    B.querySelectorAll('[data-at]').forEach((b) => b.addEventListener('click', () => { AI.tab = b.dataset.at; AI.openHelper(); $('#sheet').scrollTop = 0; }));
    const busy = (b, label) => { b.disabled = true; b.innerHTML = `<span class="spin"></span>${label}`; };
    if (tab === 'expand') {
      B.querySelectorAll('[data-ecnt]').forEach((b) => b.addEventListener('click', () => { AI.ecnt = +b.dataset.ecnt; B.querySelectorAll('[data-ecnt]').forEach((x) => x.classList.toggle('on', x === b)); }));
      $('#aiDeep').onclick = (ev) => { AI.deep = !AI.deep; ev.currentTarget.classList.toggle('on', AI.deep); };
      $('#aiESearch').onclick = (ev) => { AI.esearch = !AI.esearch; ev.currentTarget.classList.toggle('on', AI.esearch); };
      $('#aiEx').oninput = (ev) => { AI.ex = ev.target.value; };
      $('#aiSuggest').onclick = async (ev) => {
        busy(ev.currentTarget, 'AI가 생각하는 중…');
        const path = []; (function f(n) { if (n.id === target.id) { path.unshift(n.text); return true; } if (n.children.some(f)) { path.unshift(n.text); return true; } return false; })(m.root);
        try {
          const r = await AI.ask(AI.promptExpand(m, target, path, { count: AI.ecnt || 5, deep: !!AI.deep, extra: (AI.ex || '').trim(), search: !!AI.esearch }), { json: true, search: !!AI.esearch });
          const data = AI.parse(r.text);
          const items = (data.items || data.children || []).map((x) => AI.toNode(x)).filter((x) => x.text);
          if (!items.length) throw new Error('제안을 받지 못했습니다. 다시 해 주세요');
          AI.last = { target: target.id, items };
          AI.openHelper();
        } catch (e) { toast(e.message); AI.openHelper(); }
      };
      $('#aiAdd')?.addEventListener('click', () => {
        const picks = [...B.querySelectorAll('#aiRes input:checked')].map((c) => AI.last.items[+c.dataset.i]);
        if (!picks.length) return toast('추가할 가지를 골라 주세요');
        mutate(() => {
          const t = findNode(state.map.root, target.id); if (!t) return;
          t.node.collapsed = false;
          for (const p of picks) { const c = cloneTree(p); if (t.node.done !== undefined && t.parent && c.done === undefined) c.done = false; t.node.children.push(c); }
        }, { fit: false });
        AI.last = null;
        toast(`가지 ${picks.length}개를 추가했습니다`);
        AI.openHelper();
      });
    } else if (tab === 'text') {
      let dest = 'here';
      B.querySelectorAll('[data-dest]').forEach((b) => b.addEventListener('click', () => { dest = b.dataset.dest; B.querySelectorAll('[data-dest]').forEach((x) => x.classList.toggle('on', x === b)); }));
      $('#aiConv').onclick = async (ev) => {
        const text = $('#aiText2').value.trim(); if (text.length < 10) return toast('정리할 글을 붙여넣어 주세요');
        const btn = ev.currentTarget; busy(btn, 'AI가 정리하는 중…');
        try {
          const data = AI.parse(await AI.call(AI.promptText(text)));
          const root = AI.toNode({ text: data.title || '정리', children: data.children || [] });
          if (dest === 'new') {
            const nm = newMap(root.text, 'radial'); nm.root = root;
            closeSheet(); createFrom(nm, false);
          } else {
            mutate(() => { const t = findNode(state.map.root, target.id); if (t) { t.node.collapsed = false; t.node.children.push(root); state.sel = root.id; } }, { fit: true });
            closeSheet();
          }
          toast(`가지 ${countNodes(root)}개로 정리했습니다`);
        } catch (e) { toast(e.message); btn.disabled = false; btn.textContent = 'AI로 정리하기'; }
      };
    } else {
      B.querySelectorAll('[data-fmt]').forEach((b) => b.addEventListener('click', () => { AI.fmt = b.dataset.fmt; B.querySelectorAll('[data-fmt]').forEach((x) => x.classList.toggle('on', x === b)); }));
      $('#aiEx2').oninput = (ev) => { AI.ex2 = ev.target.value; };
      $('#aiWrite').onclick = async (ev) => {
        busy(ev.currentTarget, 'AI가 쓰는 중…');
        try { AI.out = (await AI.call(AI.promptWrite(m, AI.fmt || 'summary', (AI.ex2 || '').trim()), false)).trim(); AI.openHelper(); }
        catch (e) { toast(e.message); AI.openHelper(); }
      };
      $('#aiOut')?.addEventListener('input', (ev) => { AI.out = ev.target.value; });
      $('#aiCopy')?.addEventListener('click', async () => { try { await navigator.clipboard.writeText(AI.out); toast('복사했습니다'); } catch (e) { $('#aiOut').select(); document.execCommand('copy'); toast('복사했습니다'); } });
      $('#aiShare')?.addEventListener('click', async () => { if (navigator.share) { try { await navigator.share({ title: m.root.text, text: AI.out }); } catch (e) { /* 취소 */ } } else { await navigator.clipboard.writeText(AI.out); toast('복사했습니다'); } });
      $('#aiNote')?.addEventListener('click', () => { setProp(m.root.id, (n) => { n.note = AI.out; }); toast('가운데 주제의 메모에 저장했습니다'); });
    }
  },
};

$('#aiBtn').addEventListener('click', () => AI.openHelper());
$('#aiMakeBtn').addEventListener('click', () => AI.openMake());
window.AI = AI;

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

  async call(prompt, json = true) {
    const key = AI.key();
    if (!key) { const e = new Error('nokey'); e.code = 'nokey'; throw e; }
    let saved = ''; try { saved = localStorage.getItem('mm.geminiModel') || ''; } catch (e) { /* 무시 */ }
    const models = saved ? [saved, ...AI.MODELS.filter((m) => m !== saved)] : AI.MODELS;
    let lastErr = null;
    for (const model of models) {
      let res;
      try {
        res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.6, ...(json ? { responseMimeType: 'application/json' } : {}) },
          }),
        });
      } catch (e) { const er = new Error('인터넷 연결을 확인해 주세요'); er.code = 'net'; throw er; }
      let body = {};
      try { body = await res.json(); } catch (e) { /* 무시 */ }
      if (res.status === 404) { lastErr = body; continue; }
      if (!res.ok) {
        const msg = body.error?.message || '';
        const er = new Error(
          res.status === 429 ? '무료 사용량을 잠시 넘었습니다. 1분쯤 뒤에 다시 해 주세요'
          : (res.status === 400 || res.status === 403) && /key|API_KEY|permission/i.test(msg) ? 'API 키가 맞지 않습니다. 설정에서 키를 확인해 주세요'
          : res.status >= 500 ? 'AI 서버가 바쁩니다. 잠시 뒤 다시 해 주세요'
          : 'AI 요청이 실패했습니다' + (msg ? ` (${msg.slice(0, 80)})` : ''));
        er.code = res.status; throw er;
      }
      try { localStorage.setItem('mm.geminiModel', model); } catch (e) { /* 무시 */ }
      const text = (body.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('');
      if (!text) { const er = new Error('AI가 답을 주지 않았습니다. 표현을 바꿔 다시 해 주세요'); er.code = 'empty'; throw er; }
      return text;
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
- 할 일·실행 항목은 "todo": true 로 표시. 그 외에는 생략하거나 false.
- 사실·수치를 지어내지 말 것. 모르는 값은 "[ ]"로 비워 둘 것.`,
  SHAPE: '출력은 JSON 하나만: {"title":"가운데 주제","children":[{"text":"가지","todo":false,"children":[{"text":"세부","children":[]}]}]}',
  promptTopic(topic, opt) {
    return `너는 마인드맵 작성 도우미다. 아래 주제로 마인드맵을 만들어라.
- 가운데 주제(title)는 20자 이내.
- 큰 가지 약 ${opt.count}개, 각 큰 가지 아래 세부 가지 2~4개${opt.depth === 3 ? ', 필요한 곳은 그 아래 한 단계 더(2~3개)' : ''}.
${AI.RULES}
${AI.SHAPE}

주제: ${topic}${opt.extra ? `\n추가 요청: ${opt.extra}` : ''}`;
  },
  promptText(text) {
    return `너는 마인드맵 정리 도우미다. 아래 글(회의록·메모·문서)을 마인드맵 구조로 정리하라.
- 원문에 있는 내용만 사용하고 없는 내용을 덧붙이지 말 것.
- 비슷한 내용끼리 묶어 큰 가지 3~7개로 만들고, 핵심만 짧게.
- 결정 사항과 할 일이 있으면 각각 별도 큰 가지로 모으고, 할 일은 todo:true. 담당자·기한이 있으면 가지 글에 함께 적기.
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
    return `너는 마인드맵 작성 도우미다. 아래 마인드맵에서 [대상 가지]에 붙일 하위 가지를 제안하라.
- 제안 ${opt.count}개.${opt.deep ? ' 각 제안마다 세부 가지 2~3개를 children으로 포함.' : ' children은 빈 배열.'}
- 이미 있는 하위 가지와 겹치지 말 것: ${existing.length ? existing.join(', ') : '(없음)'}
- 맵 전체 흐름과 다른 가지 내용에 맞출 것.
${AI.RULES}
출력은 JSON 하나만: {"items":[{"text":"제안","todo":false,"children":[{"text":"세부","children":[]}]}]}

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
  homeTab: 'topic',
  openMake() {
    if (AI.needKey(AI.openMake)) return;
    const tab = AI.homeTab;
    openSheet(`
      <div class="sh-eyebrow">AI</div>
      <div class="sh-title">AI로 마인드맵 만들기</div>
      <div class="ptabs"><button data-mt="topic" class="${tab === 'topic' ? 'on' : ''}">주제로 만들기</button><button data-mt="text" class="${tab === 'text' ? 'on' : ''}">글·회의록 정리</button></div>
      ${tab === 'topic' ? `
        <div class="sh-sec"><label class="sh-label" for="aiTopic">주제</label><textarea id="aiTopic" placeholder="예) 2027년 지방권 신인 리쿠르팅 확대 전략&#10;예) 신인 설계사 4주 교육 과정&#10;예) 이번 주 지점장 회의 안건"></textarea></div>
        <div class="sh-sec"><div class="sh-label">큰 가지 수</div>${seg('cnt', '5', [['4', '4개'], ['5', '5개'], ['6', '6개'], ['8', '8개']])}</div>
        <div class="sh-sec"><div class="sh-label">깊이</div>${seg('dep', '2', [['2', '2단계'], ['3', '3단계 (자세히)']])}</div>
        <div class="sh-sec"><label class="sh-label" for="aiExtra">추가 요청 (선택)</label><input id="aiExtra" type="text" placeholder="예) 임원 보고용으로, 실행 항목 위주로"></div>
      ` : `
        <div class="sh-sec"><label class="sh-label" for="aiText">정리할 글</label><textarea id="aiText" class="big" placeholder="회의록, 메모, 카톡 대화, 문서 내용을 붙여넣으세요"></textarea>
        <div class="row"><button class="row-btn" id="aiClip">클립보드에서 가져오기</button></div></div>
      `}
      <div class="sh-sec"><div class="sh-label">레이아웃</div><div class="chips sm">${LAYOUTS.filter(([k]) => k !== 'free').map(([k, l]) => `<button class="chip${k === 'radial' ? ' on' : ''}" data-alay="${k}">${l}</button>`).join('')}</div></div>
      <div class="btn-row"><button class="btn-primary small" id="aiGo">AI로 만들기</button></div>
    `, 'aimake');
    const B = $('#sheetBody');
    const pick = { cnt: '5', dep: '2', lay: 'radial' };
    B.querySelectorAll('[data-mt]').forEach((b) => b.addEventListener('click', () => { AI.homeTab = b.dataset.mt; AI.openMake(); }));
    const segBind = (name, key) => B.querySelectorAll(`[data-${name}]`).forEach((b) => b.addEventListener('click', () => {
      pick[key] = b.dataset[name]; B.querySelectorAll(`[data-${name}]`).forEach((x) => x.classList.toggle('on', x === b));
    }));
    segBind('cnt', 'cnt'); segBind('dep', 'dep'); segBind('alay', 'lay');
    $('#aiClip')?.addEventListener('click', async () => { try { const t = await navigator.clipboard.readText(); if (t) $('#aiText').value = t; } catch (e) { toast('글 상자를 길게 눌러 붙여넣기 해 주세요'); } });
    $('#aiGo').onclick = async (ev) => {
      let prompt;
      if (tab === 'topic') {
        const topic = $('#aiTopic').value.trim(); if (!topic) return toast('주제를 적어 주세요');
        prompt = AI.promptTopic(topic, { count: +pick.cnt, depth: +pick.dep, extra: $('#aiExtra').value.trim() });
      } else {
        const text = $('#aiText').value.trim(); if (text.length < 10) return toast('정리할 글을 붙여넣어 주세요');
        prompt = AI.promptText(text);
      }
      const b = ev.currentTarget; b.disabled = true; b.innerHTML = '<span class="spin"></span>AI가 만드는 중…';
      try {
        const data = AI.parse(await AI.call(prompt));
        const root = AI.toNode({ text: data.title || '새 마인드맵', children: data.children || [] });
        if (!root.children.length) throw new Error('AI가 가지를 만들지 못했습니다. 주제를 조금 더 자세히 적어 주세요');
        const m = newMap(root.text, pick.lay); m.root = root;
        closeSheet(); createFrom(m, false);
        toast(`AI가 가지 ${countNodes(root) - 1}개를 만들었습니다`);
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
        <div class="sh-sec"><div class="toggle-row"><span>세부 가지까지 함께</span><button class="switch${AI.deep ? ' on' : ''}" id="aiDeep" aria-label="세부 가지까지"></button></div></div>
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
      $('#aiEx').oninput = (ev) => { AI.ex = ev.target.value; };
      $('#aiSuggest').onclick = async (ev) => {
        busy(ev.currentTarget, 'AI가 생각하는 중…');
        const path = []; (function f(n) { if (n.id === target.id) { path.unshift(n.text); return true; } if (n.children.some(f)) { path.unshift(n.text); return true; } return false; })(m.root);
        try {
          const data = AI.parse(await AI.call(AI.promptExpand(m, target, path, { count: AI.ecnt || 5, deep: !!AI.deep, extra: (AI.ex || '').trim() })));
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

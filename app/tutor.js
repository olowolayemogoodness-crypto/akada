// "Ask Edu": a full-screen study room. Edu knows the student's strengths, weaknesses and habits.
// With the offline AI it answers freely; without it, Edu can still quiz, plan and point to notes.
import { chat, warmUp, mdLite } from './ai.js';

const LETTERS = ['A', 'B', 'C', 'D'];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const AVATAR = (s = 36) => `<svg viewBox="0 0 48 48" width="${s}" height="${s}" aria-hidden="true" style="flex:none"><circle cx="24" cy="26" r="19" fill="#F97316"/><ellipse cx="24" cy="34" rx="10" ry="8" fill="#FDBA74"/><ellipse cx="18" cy="24" rx="4" ry="4.6" fill="#fff"/><ellipse cx="30" cy="24" rx="4" ry="4.6" fill="#fff"/><circle cx="18.5" cy="25" r="2.2" fill="#1C1917"/><circle cx="30.5" cy="25" r="2.2" fill="#1C1917"/><path d="M20 31q4 3.5 8 0" stroke="#1C1917" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M24 3l15 5-15 5-15-5z" fill="#1C1917"/></svg>`;
const SEND = '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg>';
const STOP = '<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="5" width="14" height="14" rx="3"/></svg>';
const SPARK = '<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/></svg>';
const ICONS = {
  quiz: '<path d="M9 9a3 3 0 115 2c-1 .8-2 1.3-2 3"/><path d="M12 18h.01"/><circle cx="12" cy="12" r="9"/>',
  today: '<rect x="4" y="5" width="16" height="16" rx="3"/><path d="M4 10h16M9 3v4M15 3v4"/><path d="M9 15l2 2 4-4"/>',
  insight: '<path d="M12 3a6 6 0 00-4 10.5V17h8v-3.5A6 6 0 0012 3z"/><path d="M9 21h6"/>',
  plan: '<path d="M4 6h16M4 12h10M4 18h7"/><path d="M17 15l2 2 3-4"/>',
};
const icon = (k) => `<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[k]}</svg>`;

// Words that point to a topic, so Edu can pull in the right note.
const TOPIC_WORDS = {
  waves: /wave|sound|light|echo|refract|reflect|frequen|wavelength|mirror|lens|pitch/i,
  induction: /induc|faraday|lenz|transformer|generator|dynamo|flux|fleming/i,
  projectiles: /projectile|trajector|range|maximum height|time of flight|thrown|launch/i,
  density: /densit|upthrust|archimedes|float|sink|relative density|buoyan/i,
  organic: /organic|alkane|alkene|alkyne|alkanol|hydrocarbon|homologous|isomer|ester|ethanol|polymer/i,
  electrochem: /electroly|electrode|anode|cathode|redox|electrochem/i,
  equilibrium: /equilibri|le chatelier|reversible|haber|catalyst/i,
  mole: /\bmole|molar|avogadro|stoichiom|empirical|molecular formula|concentration/i,
  indices: /indic|index|logarithm|\blog\b|exponent|power/i,
  quadratics: /quadratic|roots|discriminant|factori[sz]|completing the square/i,
  differentiation: /differentia|derivative|gradient|dy\/dx|turning point|rate of change/i,
  probability: /probab|dice|coin|chance|outcome/i,
  lexis: /lexis|synonym|antonym|vocabular|nearest in meaning|opposite in meaning/i,
  concord: /concord|subject.verb|agreement|neither|either/i,
  oral: /oral|stress|vowel|consonant|phonetic|pronounc|rhyme|syllable/i,
  idioms: /idiom|figure of speech|simile|metaphor|personification|hyperbole|proverb/i,
};

export function createTutor(ctx) {
  // ctx: { P(), save(), E, NOTES, ai(), refreshAi(), days() }
  let el = null, busy = null, ctxQ = null, profile = null;
  const shown = new Map();

  // ------------------------------------------------------------ chat threads
  function store() {
    const P = ctx.P();
    P.chats ||= [];
    if (P.chat?.length) { P.chats.push({ id: 'c' + Date.now(), title: titleOf(P.chat), at: Date.now(), msgs: P.chat }); P.chat = []; }
    return P;
  }
  const titleOf = (ms) => (ms.find((m) => m.role === 'user')?.content || 'Quiz session').slice(0, 48);
  const thread = () => { const P = store(); return P.chats.find((c) => c.id === P.chatId) || null; };
  function ensureThread() {
    let t = thread();
    if (!t) { const P = store(); t = { id: 'c' + Date.now(), title: 'New chat', at: Date.now(), msgs: [] }; P.chats.push(t); P.chatId = t.id; }
    return t;
  }
  const msgs = () => thread()?.msgs || [];
  const model = () => ctx.P().settings.aiModel;
  const name = () => ctx.P().settings.name.trim();
  function persist() {
    const P = store(), t = thread();
    if (t) { t.at = Date.now(); if (t.title === 'New chat' || t.title === 'Quiz session') t.title = titleOf(t.msgs); if (t.msgs.length > 80) t.msgs = t.msgs.slice(-80); }
    P.chats = P.chats.filter((c) => c.msgs.length).sort((a, b) => a.at - b.at).slice(-20);
    ctx.save();
  }

  function detectTopic(text) {
    for (const t of ctx.E.allTopics()) if (text.toLowerCase().includes(t.name.toLowerCase())) return t.id;
    for (const [id, re] of Object.entries(TOPIC_WORDS)) if (re.test(text)) return id;
    return null;
  }

  // ------------------------------------------------------------ mount / unmount
  async function mount(container, opts = {}) {
    unmount();
    el = container;
    profile = ctx.E.learnerProfile(ctx.P());
    const top = document.querySelector('.topbar');
    document.documentElement.style.setProperty('--tb', (top?.offsetHeight || 69) + 'px');
    el.addEventListener('click', onClick);
    el.addEventListener('keydown', onKey);
    el.addEventListener('submit', (e) => { e.preventDefault(); send(); });
    el.addEventListener('input', (e) => { if (e.target.tagName === 'TEXTAREA') grow(e.target); });
    if (opts.fresh) store().chatId = null;
    if (opts.qid) {
      ctxQ = { qid: opts.qid, choice: opts.choice ?? null };
      ensureThread().msgs.push({ role: 'about', qid: opts.qid, choice: opts.choice ?? null, at: Date.now() });
      persist();
    } else ctxQ = null;
    paint();
    await ctx.refreshAi();
    if (el !== container) return;
    paintStatus();
    if (ctx.ai().hasModel) warmUp(model());
    el.querySelector('textarea')?.focus();
    if (opts.ask) send(opts.ask);
  }
  function unmount() { busy?.abort(); busy = null; el = null; }

  // ------------------------------------------------------------ rendering
  function paint() {
    const P = store();
    const threads = P.chats.slice().reverse();
    el.innerHTML = `<div class="room">
      <aside class="room-rail">
        <button class="btn primary" data-tact="new" style="justify-content:center">${SPARK}New chat</button>
        ${patternCard()}
        ${profile.insights.length ? `<div class="rail-h">Edu noticed</div>
          <div class="rail-list">${profile.insights.map((i) => `<button class="rins k-${i.kind}" data-ask="${esc(i.ask)}" title="Ask Edu about this">${esc(i.text)}</button>`).join('')}</div>` : ''}
        ${threads.length ? `<div class="rail-h">Recent chats</div>
          <div class="rail-threads">${threads.map((t) => `<button class="rthread ${t.id === P.chatId ? 'on' : ''}" data-thread="${t.id}"><span>${esc(t.title)}</span><small>${when(t.at)}</small></button>`).join('')}</div>` : ''}
      </aside>
      <section class="room-main">
        <div class="room-top"><button class="btn ghost sm" data-go="home">‹ Back to home</button><span class="room-status small" id="roomStatus"></span></div>
        <div class="room-conv" id="tbody"><div class="room-col" id="tcol">${msgs().length ? msgs().map(msgHtml).join('') : hello()}</div></div>
        <form class="room-input">
          <textarea rows="1" placeholder="Ask Edu about any topic, or say “quiz me”…" aria-label="Message Edu"></textarea>
          <div class="room-input-row"><div class="room-chips" id="tchips">${chipsHtml()}</div><button class="send" type="submit" aria-label="Send">${SEND}</button></div>
        </form>
      </section></div>`;
    paintStatus();
    scrollDown(true);
  }
  function paintStatus() {
    const s = el?.querySelector('#roomStatus');
    if (!s) return;
    const ai = ctx.ai();
    s.innerHTML = ai.hasModel ? '<span class="dot-live"></span>Offline AI · private to this Mac'
      : ai.running ? `AI model missing · run <code>ollama pull ${esc(model())}</code>` : '<span class="dot-off"></span>AI is off · Edu can still quiz you and plan';
  }
  const when = (t) => { const d = (Date.now() - t) / 864e5; return d < 1 ? new Date(t).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : d < 7 ? new Date(t).toLocaleDateString(undefined, { weekday: 'short' }) : new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }); };

  function patternCard() {
    const p = profile, t = p.type;
    const s = t.id === 'rusher' ? [[p.speed.fastAcc + '%', 'when fast', 'o'], [p.speed.calmAcc + '%', 'when calm', 'g']]
      : t.id === 'doubter' ? [[p.changes.toWrong, 'right → wrong', 'o'], [p.changes.toRight, 'wrong → right', 'g']]
        : t.id === 'fader' ? [[p.fatigue.early + '%', 'early in a section', 'g'], [p.fatigue.late + '%', 'near the end', 'o']]
          : t.id === 'careful' ? [[Math.round(p.avgMs / 1000) + ' s', 'per question', 'o'], ['36 s', 'JAMB pace', 'g']]
            : t.id === 'new' ? [[p.n, 'answered', 'o'], [Math.max(0, 15 - p.n), 'more to unlock', 'g']]
              : [[p.acc + '%', 'right overall', 'g'], [p.n, 'answered', 'o']];
    return `<div class="rpattern">
      <div class="row gap" style="align-items:center">${AVATAR(46)}<div><div class="rp-k">How you learn</div><div class="rp-name">${esc(t.name)}</div></div></div>
      <div class="rp-stats">${s.map(([v, l, c]) => `<div><b class="${c}">${esc(v)}</b><span>${esc(l)}</span></div>`).join('')}</div>
      <div class="rp-tip"><b>Try this:</b> ${esc(t.tip)}</div></div>`;
  }

  function starters() {
    const p = profile, w = p.weak[0] || p.untried[0];
    const list = [
      ['quiz', w ? `Quiz me on ${w.name.toLowerCase()}` : 'Quiz me', w ? 'Questions from your weakest topic' : 'A quick question to start'],
      ['today', 'What should I study today?', 'A plan built from your results'],
      p.insights[0] ? ['insight', p.insights[0].ask, 'Something Edu noticed'] : ['insight', w ? `Explain ${w.name.toLowerCase()} simply` : 'How should I prepare for JAMB?', 'Simple explanation'],
      ['plan', 'Make me a 7-day study plan', 'Day by day, around your weak spots'],
    ];
    return list;
  }
  function hello() {
    const n = name();
    return `<div class="room-hello">
      <div class="hello-av">${AVATAR(76)}</div>
      <h1>Hi${n ? ' ' + esc(n) : ''}, what are we studying today?</h1>
      <p>${profile.n ? `I've studied your ${profile.n} answers, so I know your strong and weak topics. Ask me anything.` : 'Ask me about any JAMB topic, or let me quiz you so I can learn how you learn.'}</p>
      <div class="hello-grid">${starters().map(([ic, q, sub]) => `<button class="hello-card" data-ask="${esc(q)}"><span class="hc-ic">${icon(ic)}</span><b>${esc(q)}</b><small>${esc(sub)}</small></button>`).join('')}</div>
    </div>`;
  }

  // AI text, with "Day 1: …" lines turned into plan cards.
  function rich(text, i) {
    const lines = String(text).split('\n');
    const re = /^\s*(?:[-*•]\s*)?\**\s*Day\s*(\d+)\s*\**\s*[:.\-–—]\s*\**\s*(.+?)\s*\**\s*$/i;
    const days = lines.map((l) => l.match(re));
    if (days.filter(Boolean).length < 2) return mdLite(text);
    const out = []; let buf = [], grid = [];
    const flushText = () => { if (buf.length) { out.push(mdLite(buf.join('\n'))); buf = []; } };
    const flushGrid = () => {
      if (!grid.length) return;
      const topic = detectTopic(grid[0][2]);
      out.push(`<div class="eyebrow" style="margin-top:6px">Your ${grid.length}-day plan</div><div class="plan-grid">${grid.map(([, d, txt]) => `<div class="plan-day"><small>Day ${d}</small>${mdLite(txt)}</div>`).join('')}</div>
        ${topic ? `<div class="row gap wrap" style="margin-top:10px"><button class="btn primary sm" data-note="${topic}">${SPARK}Start day 1</button><button class="btn ghost sm" data-tact="quiz" data-topic="${topic}">Quiz me now</button></div>` : ''}`);
      grid = [];
    };
    lines.forEach((l, k) => { if (days[k]) { flushText(); grid.push(days[k]); } else { if (grid.length && l.trim()) flushGrid(); buf.push(l); } });
    flushGrid(); flushText();
    return out.join('');
  }

  function msgHtml(m, i) {
    if (m.role === 'user') return `<div class="rmsg me">${esc(m.content)}</div>`;
    if (m.role === 'assistant') return `<div class="rmsg edu"><div class="r-av">${AVATAR(34)}</div><div class="r-txt" data-i="${i}">${rich(m.content, i)}${m.actions ? actionsHtml(m.actions) : ''}</div></div>`;
    if (m.role === 'about') {
      const q = ctx.E.qById(m.qid);
      return q ? `<div class="rabout"><div class="tiny muted" style="font-weight:700">Asking about · ${esc(ctx.E.topicName(q.topic))}</div><div style="font-weight:600;margin-top:4px;line-height:1.5">${esc(q.question)}</div>
        <div class="small" style="margin-top:6px">Answer: <b>${LETTERS[q.answer]}. ${esc(q.options[q.answer])}</b>${m.choice != null && m.choice !== q.answer ? ` · you chose ${LETTERS[m.choice]}. ${esc(q.options[m.choice])}` : ''}</div></div>` : '';
    }
    if (m.role === 'quiz') return `<div class="rmsg edu"><div class="r-av">${AVATAR(34)}</div>${quizHtml(m, i)}</div>`;
    return '';
  }
  const actionsHtml = (acts) => `<div class="row gap wrap" style="margin-top:12px">${acts.map((a) =>
    a.note ? `<button class="btn ghost sm" data-note="${a.note}">Read the note</button>`
      : a.practise ? `<button class="btn ghost sm" data-practise="${a.practise}">Practise ${esc(ctx.E.topicName(a.practise).toLowerCase())}</button>`
        : a.quiz ? `<button class="btn primary sm" data-tact="quiz" data-topic="${a.quiz}">${SPARK}Quiz me</button>` : '').join('')}</div>`;

  function quizHtml(m, i) {
    const q = ctx.E.qById(m.qid);
    if (!q) return '';
    const done = m.choice != null;
    if (!done && !shown.has(i)) shown.set(i, Date.now());
    return `<div class="rquiz" data-i="${i}">
      <div class="tiny" style="font-weight:800;color:var(--orange-ink)">Quiz · ${esc(ctx.E.topicName(q.topic))}</div>
      <div style="font-weight:700;font-size:16px;line-height:1.5;margin-top:6px">${esc(q.question)}</div>
      <div class="topts">${q.options.map((o, k) => `<button class="topt ${done ? (k === q.answer ? 'ok' : k === m.choice ? 'bad' : 'dim') : ''}" data-tm="${i}" data-tk="${k}" ${done ? 'disabled' : ''}><b>${LETTERS[k]}</b><span>${esc(o)}</span></button>`).join('')}</div>
      ${done ? `<div class="why" style="margin-top:10px"><b>${m.choice === q.answer ? 'Correct!' : `Not quite. The answer is ${LETTERS[q.answer]}.`}</b> ${esc(q.explanation)}</div>
        <div class="row gap wrap" style="margin-top:10px">${ctx.ai().hasModel ? `<button class="btn ghost sm" data-tact="explain" data-i="${i}">Explain more</button>` : ''}<button class="btn primary sm" data-tact="quiz" data-topic="${q.topic}">Another one</button><button class="btn ghost sm" data-note="${q.topic}">Read the note</button></div>` : ''}
    </div>`;
  }

  function chips() {
    const p = profile, w = p.weak[0] || p.untried[0];
    if (!msgs().length) return ['Quiz me', 'Plan my week', 'Explain simpler'];
    if (ctxQ && msgs().at(-1)?.role === 'about') return ['Explain it more simply', 'Give me a similar question', "What's the trick for this type?"];
    const lastA = msgs().at(-1);
    if (lastA?.role === 'assistant' && lastA.mode && lastA.mode !== 'coach') return ['Give me another worked example', 'Explain it more simply', 'Why does that work?', lastA.topic ? `Quiz me on ${ctx.E.topicName(lastA.topic).toLowerCase()}` : 'Quiz me'];
    const c = [w ? `Quiz me on ${w.name.toLowerCase()}` : 'Quiz me', 'What should I study today?'];
    if (p.insights[0]) c.push(p.insights[0].ask);
    if (ctx.ai().hasModel) c.push('Explain it simpler');
    return [...new Set(c)].slice(0, 4);
  }
  const chipsHtml = () => chips().map((c) => `<button type="button" class="tchip" data-ask="${esc(c)}">${esc(c)}</button>`).join('');

  function scrollDown(force) {
    const b = el?.querySelector('#tbody');
    if (!b) return;
    if (force || b.scrollHeight - b.scrollTop - b.clientHeight < 160) b.scrollTop = b.scrollHeight;
  }
  function grow(t) { t.style.height = 'auto'; t.style.height = Math.min(160, t.scrollHeight) + 'px'; }
  function append(m) {
    const t = ensureThread();
    const col = el.querySelector('#tcol');
    if (!t.msgs.length) col.innerHTML = '';
    t.msgs.push(m);
    const i = t.msgs.length - 1;
    col.insertAdjacentHTML('beforeend', msgHtml(m, i));
    el.querySelector('#tchips').innerHTML = chipsHtml();
    scrollDown(true);
    return i;
  }
  function bounce(node) { const a = node?.closest('.rmsg')?.querySelector('.r-av'); if (a) { a.classList.remove('hop'); void a.offsetWidth; a.classList.add('hop'); } }

  // ------------------------------------------------------------ actions
  function onClick(e) {
    const t = e.target.closest('button');
    if (!t) return;
    const d = t.dataset;
    if (d.ask) return send(d.ask);
    if (d.tk !== undefined) return answerQuiz(+d.tm, +d.tk);
    if (d.thread) { busy?.abort(); store().chatId = d.thread; ctxQ = null; return paint(); }
    if (d.tact === 'new') { busy?.abort(); store().chatId = null; ctxQ = null; profile = ctx.E.learnerProfile(ctx.P()); paint(); return el.querySelector('textarea').focus(); }
    if (d.tact === 'quiz') return quiz(d.topic);
    if (d.tact === 'explain') { const m = msgs()[+d.i]; ctxQ = { qid: m.qid, choice: m.choice }; return send('Explain that quiz question more simply, step by step.'); }
  }
  function onKey(e) {
    if (e.target.tagName === 'TEXTAREA' && e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  }

  function quiz(topic) {
    const p = profile;
    topic = topic || p.weak[0]?.id || p.untried[0]?.id || ctx.E.allTopics()[Math.floor(Math.random() * 16)].id;
    const recent = msgs().filter((m) => m.role === 'quiz').slice(-12).map((m) => m.qid);
    const q = ctx.E.pickQuizQuestion(ctx.P(), topic, recent) || ctx.E.pickQuizQuestion(ctx.P(), topic);
    if (!q) return;
    ctxQ = null;
    append({ role: 'quiz', qid: q.id, choice: null, at: Date.now() });
    persist();
  }
  function answerQuiz(i, k) {
    const m = msgs()[i];
    if (!m || m.choice != null) return;
    const q = ctx.E.qById(m.qid);
    m.choice = k;
    const ms = Date.now() - (shown.get(i) || m.at);
    ctx.P().attempts.push({ qid: q.id, subject: q.subject, topic: q.topic, correct: k === q.answer, ms, at: Date.now(), via: 'edu' });
    persist();
    profile = ctx.E.learnerProfile(ctx.P());
    const node = el.querySelector(`.rquiz[data-i="${i}"]`);
    node.outerHTML = quizHtml(m, i);
    if (k === q.answer) bounce(el.querySelector(`.rquiz[data-i="${i}"]`));
    scrollDown(true);
  }

  // Answers Edu can give without the AI.
  function localReply(text) {
    const p = profile, topic = detectTopic(text);
    const cq = ctxQ && ctx.E.qById(ctxQ.qid);
    if (cq && /explain|trick|why|how|simpl/i.test(text)) {
      const n = ctx.NOTES[cq.topic];
      return { content: `**The answer is ${LETTERS[cq.answer]}: ${cq.options[cq.answer]}.**\n\n${cq.explanation}\n\n**Common trap in ${n.title.toLowerCase()}:** ${n.trap}`, actions: [{ note: cq.topic }, { quiz: cq.topic }] };
    }
    if (/plan|study today|what should i (study|read|do|revise)|where do i start/i.test(text)) {
      if (!p.n) return { content: "Let's find out what you need first. Take a **full mock exam**, or tap **Quiz me** for a quick start. Then I'll know your weak topics and can plan your days.", actions: [{ quiz: ctx.E.allTopics()[0].id }] };
      const list = [...p.weak, ...p.untried, ...p.topics.filter((t) => t.p != null).sort((a, b) => a.p - b.p)].filter((t, k, a) => a.findIndex((x) => x.id === t.id) === k);
      const days = /7|week/.test(text) ? 7 : 3;
      return { content: `Here's your plan, built from your results:\n${list.slice(0, days).map((t, n) => `Day ${n + 1}: **${t.name}**${t.p != null ? ` (${Math.round(t.p * 100)}%)` : ''}. Read the note, then practise 10 questions.`).join('\n')}\n\n**Tip for you:** ${p.type.tip}` };
    }
    if (topic) {
      const n = ctx.NOTES[topic];
      return { content: `**${n.title}.** ${n.intro}\n\n**Common trap:** ${n.trap}`, actions: [{ note: topic }, { quiz: topic }] };
    }
    const ai = ctx.ai();
    return { content: ai.running ? `I need my AI model to answer that. In Terminal, run \`ollama pull ${model()}\`, then come back.` : `My AI brain is off, so for now I can quiz you, plan your days and show notes. To chat freely, install Ollama (free, works offline) and run \`ollama pull ${model()}\`.` };
  }

  // Which kind of help is wanted: a full lesson, help with one question, or personal coaching.
  function modeFor(text) {
    if (/plan|schedule|timetable|what should i (study|read|do|revise|focus)|where (do|should) i start|how am i doing|my (progress|weak|strong|score|result|pattern|habit)|why do i keep|how (do|can) i (stop|improve|avoid|get better|focus|manage|prepare)|motivat|tired|scared|nervous|lazy/i.test(text)) return 'coach';
    if (ctxQ) return 'question';
    return 'teach';
  }
  // The topic being discussed: from this message, else from the recent conversation.
  function convTopic(text) {
    const direct = detectTopic(text);
    if (direct) return direct;
    if (ctxQ) return ctx.E.qById(ctxQ.qid)?.topic;
    for (const m of msgs().slice().reverse()) {
      if (m.role === 'user') { const t = detectTopic(m.content); if (t) return t; }
      if ((m.role === 'quiz' || m.role === 'about') && m.qid) return ctx.E.qById(m.qid)?.topic;
      if (m.role === 'assistant' && m.topic) return m.topic;
    }
    return null;
  }

  function systemPrompt(lastUser) {
    const mode = modeFor(lastUser);
    const ctxQuestion = ctxQ ? ctx.E.qById(ctxQ.qid) : null;
    const topic = convTopic(lastUser) || (mode === 'coach' ? profile.weak[0]?.id : null);
    const n = topic && ctx.NOTES[topic];
    const note = n ? `${n.title}\n${n.intro}\nKey points:\n${n.points.map(([h, x]) => `- ${h}: ${x}`).join('\n')}\nFormulas: ${n.formulas.map(([k, v]) => `${k}: ${v}`).join('; ')}\nWorked example: ${n.example.q}\n${n.example.steps.map((x, i) => `${i + 1}. ${x}`).join('\n')}\nCommon trap: ${n.trap}` : '';
    const qtext = ctxQuestion ? `${ctxQuestion.question}\nOptions: ${ctxQuestion.options.map((o, k) => `${LETTERS[k]}. ${o}`).join('   ')}\nCorrect answer: ${LETTERS[ctxQuestion.answer]}. ${ctxQuestion.options[ctxQuestion.answer]}\nStudent chose: ${ctxQ.choice == null ? 'nothing' : `${LETTERS[ctxQ.choice]}. ${ctxQuestion.options[ctxQ.choice]}`}\nOfficial explanation: ${ctxQuestion.explanation}` : '';
    const who = `a Nigerian secondary school student${name() ? ` called ${name()}` : ''} preparing for JAMB`;
    const oneLine = profile.n ? `${profile.type.name}. ${profile.type.tip}` : '';
    const common = `
Always:
- Simple, clear English. Warm and encouraging, like the best teacher in a Nigerian school.
- Use **bold** labels and "- " bullets or "1." numbered steps. No tables, no # headings.
- Show every calculation with numbers and units. Never skip steps.
- Use the NOTE below as your source of truth for facts and formulas. If you are unsure, say so instead of guessing.
- Stay on studying. Gently bring other topics back to studying.
- If the student is replying to your "Quick check" question, first tell them clearly if they are right, then explain the correct working.
- If the student asks a follow-up (simpler, another example, why, what about...), answer that fully and directly. Do not repeat the whole lesson.`;

    if (mode === 'teach') return `You are Edu, a patient and brilliant JAMB tutor teaching ${who}. Your job is to TEACH so they truly understand. Explain the why, not just the what. Be detailed: 300 to 500 words.

For a new topic or concept, write the lesson in this order, using these exact bold labels:
**In simple words:** 2 to 3 sentences that explain the idea plainly.
**Picture it:** an everyday example from Nigerian life (a danfo braking, a generator, NEPA light, a borehole pump, frying akara...) that makes the idea click.
**Key points:** 3 to 6 bullets with the rules, laws and definitions. Write every formula and say what each symbol means and its unit.
**Worked example:** one JAMB-style question, then solve it in numbered steps. For English topics, give example sentences and explain the correct choice.
**Watch out:** the traps JAMB uses to catch students.
**Quick check:** one short question for the student to try. Do not give the answer.
${common}
- Do not talk about the student's scores, past questions or habits. ${oneLine ? `You may add one short final sentence of advice for their habit: ${oneLine}` : ''}
${note ? `\nNOTE FROM THE APP (accurate):\n${note}` : '\nNo note for this topic. Teach from standard JAMB syllabus knowledge and be careful with facts.'}`;

    if (mode === 'question') return `You are Edu, a patient and brilliant JAMB tutor helping ${who} understand one exam question completely. Be detailed: 200 to 400 words.

Use these bold labels:
${ctxQ.choice != null && ctxQuestion && ctxQ.choice !== ctxQuestion.answer ? '**Where it went wrong:** the likely thinking behind their wrong choice, kindly.\n' : ''}**Step by step:** solve it in numbered steps with every calculation or reason.
**The idea behind it:** the concept this question tests, explained simply, so they can answer any question like it.
**Watch out:** the trap in this question.
**Try this:** one similar question for them to try, without the answer.
Never change the correct answer.
${common}
${note ? `\nNOTE FROM THE APP (accurate):\n${note}` : ''}
\nQUESTION:\n${qtext}`;

    return `You are Edu, a warm study coach for ${who}. They are asking about their own progress, habits or plans, so use their real study record below and be specific. Never invent numbers that are not given.
- Keep it practical: 120 to 250 words.
- For a study plan, write one line per day exactly like "Day 1: Projectiles — read the note, watch the video, then do 10 questions", built around their weakest topics and their learning pattern.
- If they ask why they keep failing a topic, first say briefly what their record shows, then actually teach the 2 or 3 ideas they are probably missing, with a short worked example.
- End with one next step in the app: read a note, watch the video lesson, play with the 3D explainer, practise a topic, take a mock, or tap "Quiz me".
${common}

STUDENT RECORD
${ctx.E.profileText(profile, { name: name(), days: ctx.days() })}
${note ? `\nNOTE FROM THE APP (accurate):\n${note}` : ''}`;
  }

  function history() {
    const out = [];
    for (const m of msgs().slice(-14)) {
      if (m.role === 'user') out.push({ role: 'user', content: m.content });
      else if (m.role === 'assistant') out.push({ role: 'assistant', content: m.content.length > 1400 ? m.content.slice(0, 1400) + ' …' : m.content });
      else if (m.role === 'quiz' && m.choice != null) {
        const q = ctx.E.qById(m.qid);
        out.push({ role: 'assistant', content: `(Quiz) ${q.question} Options: ${q.options.map((o, k) => `${LETTERS[k]}. ${o}`).join(' ')}. The student chose ${LETTERS[m.choice]}, which is ${m.choice === q.answer ? 'correct' : `wrong; the answer is ${LETTERS[q.answer]}`}.` });
      }
    }
    return out.slice(-7);
  }

  async function send(text) {
    if (!el) return;
    const box = el.querySelector('textarea');
    text = (text ?? box.value).trim();
    if (!text) return;
    busy?.abort();
    box.value = ''; grow(box);
    const wantsQuiz = /similar question|another (one|question)|quiz me|test me|ask me a question|give me a question/i.test(text);
    append({ role: 'user', content: text, at: Date.now() });
    if (wantsQuiz) {
      const topic = detectTopic(text.replace(/quiz me( on)?/i, '')) || (ctxQ && ctx.E.qById(ctxQ.qid)?.topic) || null;
      persist();
      return quiz(topic);
    }
    if (!ctx.ai().hasModel) { append({ role: 'assistant', ...localReply(text), at: Date.now() }); return persist(); }

    const i = append({ role: 'assistant', content: '', at: Date.now() });
    const node = el.querySelector(`.r-txt[data-i="${i}"]`);
    node.innerHTML = '<span class="typing"><i></i><i></i><i></i></span>';
    const sendBtn = el.querySelector('.send');
    sendBtn.innerHTML = STOP; sendBtn.classList.add('stop'); sendBtn.type = 'button';
    const ctrl = new AbortController(); busy = ctrl;
    sendBtn.onclick = () => ctrl.abort();
    const sys = systemPrompt(text), hist = history().slice(0, -1);
    const m = msgs()[i];
    try {
      const reply = await chat({ model: model(), system: sys, messages: hist, signal: ctrl.signal, onToken: (t) => { node.innerHTML = mdLite(t) + '<span class="caret"></span>'; scrollDown(); } });
      m.content = reply || "Sorry, I couldn't think of an answer. Try asking another way.";
      const topic = convTopic(text);
      m.topic = topic; m.mode = modeFor(text);
      if (topic && !/Day\s*\d/i.test(m.content)) m.actions = [{ note: topic }, { quiz: topic }];
    } catch (err) {
      const partial = node.textContent;
      m.content = err.name === 'AbortError' ? (partial ? partial + ' …' : '(Stopped.)')
        : 'I couldn\'t reach my AI brain. Check that Ollama is running (in Terminal: `brew services start ollama`), then try again.';
    } finally {
      if (busy === ctrl) busy = null;
      if (node.isConnected) {
        node.innerHTML = rich(m.content, i) + (m.actions ? actionsHtml(m.actions) : '');
        bounce(node);
        sendBtn.innerHTML = SEND; sendBtn.classList.remove('stop'); sendBtn.type = 'submit'; sendBtn.onclick = null;
        el.querySelector('#tchips').innerHTML = chipsHtml();
        scrollDown();
      }
      persist();
    }
  }

  return { mount, unmount };
}

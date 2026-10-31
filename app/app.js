// Edu: screens and navigation.
import * as E from './engine.js';
import { NOTES } from './data/notes.js';
import { aiStatus, explain, mdLite } from './ai.js';
import { createTutor } from './tutor.js';
import { createMascot } from './anim/mascot.js';
import { mountSteps } from './anim/steps.js';
import { MATH_SCENES } from './anim/mathscenes.js';
import { mountVideo } from './anim/videoplayer.js';
import { KINETIC } from './anim/kinetic.js';
import { ipaFor, questionWords, soundsIn } from './data/phonetics.js';

// Animated "watch it" scenes for topics (Manim-style maths and kinetic typography for English).
const WATCH = { differentiation: ['math', 'deriv'], quadratics: ['math', 'square'], indices: ['math', 'powers'], concord: ['kin', 'concord'], oral: ['kin', 'oral'], idioms: ['kin', 'idioms'], lexis: ['kin', 'lexis'] };

const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const LETTERS = ['A', 'B', 'C', 'D'];
// Oral English: phonetic transcription shown after answering, with tap-to-hear.
const isSound = (q) => q.topic === 'oral';
const optIpa = (o) => (o === o.toLowerCase() ? ipaTag(o) : '');
const ipaTag = (w) => { const t = ipaFor(w); return t ? ` <span class="ipa">/${esc(t)}/</span>` : ''; };
function speakWord(w) {
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(String(w).replace(/\s*\(.*\)/, ''));
  u.rate = 0.75; u.lang = 'en-GB'; speechSynthesis.speak(u);
}
function soundsPanel(q) {
  if (!isSound(q)) return '';
  const words = [...questionWords(q), ...q.options.filter((o) => ipaFor(o) && !/^[A-Z]/.test(o) || (ipaFor(o) && o === o.toLowerCase()))];
  const uniq = [...new Set(words.map((w) => w.toLowerCase()))].filter((w) => ipaFor(w));
  if (!uniq.length) return '';
  const keys = soundsIn(uniq.map(ipaFor));
  return `<div class="sounds"><div class="eyebrow" style="margin-bottom:8px">Sounds · tap a word to hear it</div>
    <div class="row gap wrap">${uniq.map((w) => `<button class="ipa-chip" data-say="${esc(w)}"><b>${esc(w)}</b><span>/${esc(ipaFor(w))}/</span></button>`).join('')}</div>
    ${keys.length ? `<div class="tiny muted" style="margin-top:10px;line-height:1.7">${keys.map(([s, d]) => `<b class="ipa">${esc(s)}</b> ${esc(d)}`).join(' · ')}</div>` : ''}</div>`;
}
const fmtClock = (s) => { s = Math.max(0, Math.round(s)); return `${Math.floor(s / 3600)}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };
const fmtDur = (ms) => { const m = Math.round(ms / 60000); return m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min`; };
const fmtDate = (t) => new Date(t).toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

const I = {
  logo: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24"><path d="M12 3.5L21 7.6 12 11.7 3 7.6z" fill="#1C0A00"/><path d="M7 9.5v3.4c3.3 2.2 6.7 2.2 10 0V9.5L12 12z" fill="#1C0A00" opacity=".7"/><path d="M9 19.5l3-2.3 3 2.3" fill="none" stroke="#1C0A00" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  arrow: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg>',
  back: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
  next: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',
  flame: '<svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="#F97316"><path d="M12 2c1 4 5 5.5 5 10a5 5 0 01-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3-1-3 0-6 1-8.5z"/></svg>',
  flag: '<svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/></svg>',
  clock: '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2"/><path d="M9 2h6"/></svg>',
  bulb: '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C2410C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 00-4 10.5V17h8v-3.5A6 6 0 0012 3z"/><path d="M9 21h6"/></svg>',
  check: '<svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg>',
  gear: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>',
  calc: '<svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M8 6h8"/><path d="M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 19h.01M12 19h.01M16 19h.01"/></svg>',
  spark: '<svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/></svg>',
};

// ---------------------------------------------------------------- state & storage
const DEFAULT = { v: 1, attempts: [], exams: [], chats: [], chatId: null, settings: { name: '', jambDate: '', aiModel: 'llama3.2:3b', mascot: true } };
let P = structuredClone(DEFAULT);
let route = { name: 'home' };
let exam = null;        // exam in progress
let viewed = null;      // { exam, result } shown on results/review
let tick = null, qStart = 0, cleanups = [], ai = { running: false, hasModel: false };
let edu = null, greeted = false, warnedLow = false;
const tutor = createTutor({
  P: () => P, save: () => save(), E, NOTES, ai: () => ai, days: () => daysToJamb(),
  refreshAi: async () => { ai = await aiStatus(P.settings.aiModel); },
});
const openEdu = (opts = {}) => { if (route.name !== 'exam') go('edu', { edu: opts }); };
const draft = { mode: 'mock', subjects: ['english', 'physics', 'chemistry', 'mathematics'], topic: 'projectiles', timer: true, instant: true, calc: true };

async function load() {
  try {
    const d = window.prepStore ? await window.prepStore.load() : JSON.parse(localStorage.getItem('edulink-prep') || 'null');
    if (d) P = { ...structuredClone(DEFAULT), ...d, settings: { ...DEFAULT.settings, ...(d.settings || {}) } };
  } catch { /* first run */ }
}
async function save() {
  try {
    if (window.prepStore) await window.prepStore.save(P);
    else localStorage.setItem('edulink-prep', JSON.stringify(P));
  } catch { toast('Could not save your progress.'); }
}
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.hidden = false;
  clearTimeout(toast.t); toast.t = setTimeout(() => (t.hidden = true), 3200);
}

// ---------------------------------------------------------------- shell
function go(name, params = {}) {
  cleanups.forEach((f) => { try { f(); } catch { /* already gone */ } }); cleanups = [];
  if (name !== 'exam') { clearInterval(tick); tick = null; }
  route = { name, ...params };
  tutor.unmount();
  $('#mascot-root').classList.toggle('locked', name === 'exam');
  if (edu) $('#mascot-root').hidden = name === 'edu';
  render();
  window.scrollTo(0, 0);
}
function topbar(active) {
  const s = E.streak(P);
  const nav = [['home', 'Home'], ['setup', 'Mock exam'], ['notes', 'Note bank'], ['reports', 'Reports'], ['edu', 'Ask Edu']];
  const name = P.settings.name.trim();
  return `<header class="topbar">
    <div class="brand"><span class="mark">${I.logo}</span>Edu</div>
    <nav class="nav" aria-label="Main">${nav.map(([id, label]) => `<button data-go="${id}" class="${active === id ? 'on' : ''}">${label}</button>`).join('')}</nav>
    <div class="grow"></div>
    ${s ? `<span class="pill orange">${I.flame}${s}-day streak</span>` : ''}
    <button class="btn ghost sm" data-act="settings" aria-label="Settings">${I.gear}${name ? esc(name) : ''}</button>
  </header>`;
}
function render() {
  const app = $('#app');
  const r = route.name;
  if (r === 'home') {
    app.innerHTML = topbar('home') + homeView();
    if (!greeted) { greeted = true; setTimeout(() => eduSay('wave', P.exams.length ? `Welcome back${P.settings.name ? ', ' + P.settings.name : ''}! Tap me if you want to ask anything.` : "Hi, I'm Edu! Tap me any time to ask a question."), 600); }
  }
  else if (r === 'setup') app.innerHTML = topbar('setup') + setupView();
  else if (r === 'exam') { app.innerHTML = examView(); startTick(); }
  else if (r === 'results') app.innerHTML = topbar('reports') + resultsView();
  else if (r === 'review') app.innerHTML = topbar('reports') + reviewView();
  else if (r === 'notes') { app.innerHTML = topbar('notes') + notesView(); mountNoteVideo(); mountVisual(); mountNoteAnims(); }
  else if (r === 'reports') app.innerHTML = topbar('reports') + reportsView();
  else if (r === 'edu') { app.innerHTML = topbar('edu') + '<div id="eduMount"></div>'; tutor.mount($('#eduMount'), route.edu || {}); route.edu = {}; }
}

// ---------------------------------------------------------------- home
function greeting() {
  const h = new Date().getHours();
  const part = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  return P.settings.name.trim() ? `${part}, ${esc(P.settings.name.trim())}` : part;
}
function daysToJamb() {
  if (!P.settings.jambDate) return null;
  const d = Math.ceil((new Date(P.settings.jambDate) - new Date()) / 86400000);
  return d > 0 ? d : null;
}
function ringSvg(value, max, size = 168, stroke = 14) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, f = value == null ? 0 : Math.min(1, value / max);
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true">
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="#F5EFE9" stroke-width="${stroke}"/>
    ${f > 0 ? `<circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="#F97316" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${(c * f).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 ${size / 2} ${size / 2})"/>` : ''}</svg>`;
}
function homeView() {
  const avg = E.averageMockScore(P);
  const pred = avg ? avg.score : null;
  const weak = E.weakestTopics(P, 2);
  const days = daysToJamb();
  const fresh = !P.exams.length;
  const head = fresh
    ? `Find your weak topics<br><span>in one mock exam.</span>`
    : weak.length ? `${days ? `You're ${days} days from JAMB.` : 'Keep the streak going.'}<br><span>Let's fix ${esc(weak[0].name.toLowerCase())} today.</span>`
      : `Nice work.<br><span>Keep practising.</span>`;
  const subjects = E.bank().subjects.map((s) => {
    const m = E.subjectMastery(P, s.id);
    const L = E.level(m);
    return `<article class="subject-card">
      <div class="row between"><div><div style="font-weight:800;font-size:17px">${s.name}</div><div class="tiny muted" style="margin-top:2px">${s.id === 'english' ? 'Compulsory · ' : ''}50 questions</div></div>
      <div class="num" style="font-weight:800;font-size:15px;padding:6px 10px;border-radius:10px;background:var(--soft)"><span class="lvl-${L.id}">${m == null ? '—' : Math.round(m * 100) + '%'}</span></div></div>
      <div style="display:flex;flex-direction:column;gap:10px">${s.topics.map((t) => {
        const st = E.topicStats(P, t.id), l = E.level(st.p);
        return `<button class="topic-line" data-note="${t.id}" title="Open the note on ${esc(t.name)}"><span>${esc(t.name)}</span><span class="lvl-${l.id}" style="font-size:12px;font-weight:700;white-space:nowrap">${l.label}</span></button>
          <div class="bar" style="margin-top:-4px"><i style="width:${st.p == null ? 0 : Math.round(st.p * 100)}%;background:${l.color}"></i></div>`;
      }).join('')}</div></article>`;
  }).join('');
  const focus = weak.length
    ? `<section class="focus-strip"><div class="icon-tile">${I.bulb}</div>
        <div class="grow" style="min-width:240px"><div style="font-weight:700">Today's focus: ${esc(weak[0].name)}${weak[1] ? `, then ${esc(weak[1].name)}` : ''}</div>
        <div class="small" style="color:#57534E;margin-top:2px">Read the note, play with the explainer, then answer the practice questions. About 20 minutes.</div></div>
        <button class="btn dark" data-act="focus" data-topic="${weak[0].id}">Start focus session</button></section>`
    : `<section class="focus-strip"><div class="icon-tile">${I.bulb}</div><div class="grow"><div style="font-weight:700">How this works</div><div class="small" style="color:#57534E;margin-top:2px">Take a mock exam. Edu marks it, finds the topics where you lose marks and builds you a study plan with notes.</div></div></section>`;
  return `<main class="page rise">
    <section class="hero">
      <div class="hero-dark">
        <div><div style="font-size:14px;font-weight:600;color:#D6D3D1">${greeting()}</div><h1 style="margin-top:8px">${head}</h1></div>
        <div class="row gap wrap">
          <button class="btn primary lg" data-go="setup">Start a mock exam ${I.arrow}</button>
          ${weak.length ? `<button class="btn ghost-dark lg" data-act="focus" data-topic="${weak[0].id}">Practise weak topics</button>` : `<button class="btn ghost-dark lg" data-go="notes">Browse notes</button>`}
        </div>
      </div>
      <div class="score-card">
        <div class="ring">${ringSvg(pred, 400)}<div class="val"><b class="num">${pred ?? '—'}</b><span class="small muted" style="font-weight:600">of 400</span></div></div>
        <div><div style="font-weight:700">Average mock score</div><div class="small muted" style="margin-top:2px">${avg == null ? 'Take a full mock to see it' : avg.count > 1 ? `Across your ${avg.count} mock exams` : 'From your first mock exam'}</div></div>
      </div>
    </section>
    <section><div class="row between wrap gap"><h2 class="section-title">Your subjects</h2><span class="small muted">Mastery by topic. Tap a topic to open its note.</span></div>
      <div class="grid-subjects" style="margin-top:14px">${subjects}</div></section>
    ${eduStrip()}
    ${focus}
  </main>`;
}
function eduStrip() {
  const prof = E.learnerProfile(P);
  const top = prof.insights[0];
  return `<section class="edu-strip">
    <div class="edu-face" data-act="edu" title="Ask Edu">${EDU_FACE}</div>
    <div class="grow" style="min-width:240px">
      <div class="eyebrow" style="color:var(--orange-ink)">${prof.n >= 15 ? `Edu noticed · ${esc(prof.type.name)}` : 'Ask Edu'}</div>
      <div style="font-weight:700;margin-top:4px;line-height:1.5">${top ? esc(top.text) : prof.n >= 15 ? esc(prof.type.text) : 'Your study buddy learns how you learn. Ask about any topic, get a study plan, or let Edu quiz you on your weak spots.'}</div>
    </div>
    <div class="row gap wrap">
      ${top ? `<button class="btn ghost" data-act="edu" data-edu-ask="${esc(top.ask)}">Ask about this</button>` : ''}
      <button class="btn primary" data-act="edu">${I.spark}Chat with Edu</button>
    </div></section>`;
}
const EDU_FACE = `<svg viewBox="0 0 48 48" width="100%" height="100%" aria-hidden="true"><circle cx="24" cy="26" r="19" fill="#F97316"/><ellipse cx="24" cy="34" rx="10" ry="8" fill="#FDBA74"/><ellipse cx="18" cy="24" rx="4" ry="4.6" fill="#fff"/><ellipse cx="30" cy="24" rx="4" ry="4.6" fill="#fff"/><circle cx="18.5" cy="25" r="2.2" fill="#1C1917"/><circle cx="30.5" cy="25" r="2.2" fill="#1C1917"/><path d="M20 31q4 3.5 8 0" stroke="#1C1917" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M24 3l15 5-15 5-15-5z" fill="#1C1917"/></svg>`;

// ---------------------------------------------------------------- setup
function setupView() {
  const modes = [
    ['mock', 'Full mock', 'Like the real exam: all your subjects, one timer, results at the end.', '50 per subject'],
    ['topic', 'Topic practice', 'Drill one topic. See the answer and explanation after each question.', 'All questions in a topic'],
    ['quick', 'Quick quiz', 'A short mixed set, weighted towards your weak topics.', '20 questions · 15 min'],
  ];
  const subs = E.bank().subjects;
  const count = draft.mode === 'mock' ? draft.subjects.length * 50 : draft.mode === 'topic' ? E.bank().questions.filter((q) => q.topic === draft.topic).length : 20;
  const secs = draft.mode === 'mock' ? count * 36 : draft.mode === 'quick' ? 900 : count * 60;
  const instantAllowed = draft.mode !== 'mock';
  const opts = [
    ['timer', 'Timer', 'Count down like the real exam.', true],
    ['instant', 'Show answers as I go', instantAllowed ? 'See the right answer and why after each question.' : 'Off in a full mock, like the real exam.', instantAllowed],
    ['calc', 'On-screen calculator', 'The basic calculator allowed in the exam hall.', true],
  ];
  return `<main class="page rise"><div class="row gap wrap" style="align-items:flex-start;gap:28px">
    <div style="flex:999 1 560px;min-width:0;display:flex;flex-direction:column;gap:32px">
      <section><h2 style="font-size:16px;font-weight:800;margin-bottom:14px">1. Choose a mode</h2>
        <div class="choice-grid">${modes.map(([id, n, d, m]) => `<button class="choice ${draft.mode === id ? 'on' : ''}" data-mode="${id}"><b>${n}</b><span>${d}</span><em>${m}</em></button>`).join('')}</div></section>
      ${draft.mode === 'topic'
        ? `<section><h2 style="font-size:16px;font-weight:800;margin-bottom:14px">2. Topic</h2>
            <select class="select" id="topicSel">${subs.map((s) => `<optgroup label="${s.name}">${s.topics.map((t) => `<option value="${t.id}" ${draft.topic === t.id ? 'selected' : ''}>${esc(t.name)}${(() => { const l = E.level(E.topicStats(P, t.id).p); return l.id === 'new' ? '' : ' · ' + l.label; })()}</option>`).join('')}</optgroup>`).join('')}</select></section>`
        : `<section><h2 style="font-size:16px;font-weight:800;margin-bottom:14px">2. Subjects</h2>
            <div class="row gap wrap">${subs.map((s) => { const on = draft.subjects.includes(s.id); return `<button class="chip-btn ${on ? 'on' : ''}" data-sub="${s.id}" aria-pressed="${on}"><span class="check">${on ? I.check : ''}</span>${s.name}${s.id === 'english' ? '<span class="tiny muted" style="font-weight:600">Compulsory</span>' : ''}</button>`; }).join('')}</div></section>`}
      <section><h2 style="font-size:16px;font-weight:800;margin-bottom:14px">3. Options</h2>
        <div style="border:1px solid var(--line);border-radius:18px">${opts.map(([id, n, d, enabled]) => { const on = enabled && draft[id]; return `<div class="opt-row"><div class="grow"><div style="font-weight:700">${n}</div><div class="small muted" style="margin-top:2px">${d}</div></div><button class="switch ${on ? 'on' : ''}" data-opt="${id}" ${enabled ? '' : 'disabled'} aria-label="${n}" aria-pressed="${on}"><i></i></button></div>`; }).join('')}</div></section>
    </div>
    <aside class="summary">
      <div class="tiny" style="font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em">Summary</div>
      <div><div class="num" style="font-size:44px;font-weight:800;letter-spacing:-.03em;line-height:1">${count}</div><div style="color:#57534E;margin-top:4px">questions</div></div>
      <div style="display:flex;flex-direction:column;gap:10px;font-size:14px">
        <div class="row between"><span style="color:#57534E">Time</span><b>${draft.timer ? fmtDur(secs * 1000) : 'No timer'}</b></div>
        <div class="row between gap"><span style="color:#57534E">${draft.mode === 'topic' ? 'Topic' : 'Subjects'}</span><b style="text-align:right">${draft.mode === 'topic' ? esc(E.topicName(draft.topic)) : draft.subjects.map(E.subjectName).join(', ')}</b></div>
        <div class="row between"><span style="color:#57534E">Scored out of</span><b>${draft.mode === 'mock' ? draft.subjects.length * 100 : 100}</b></div>
      </div>
      <button class="btn primary lg" data-act="start">Start ${draft.mode === 'mock' ? 'exam' : draft.mode === 'topic' ? 'practice' : 'quiz'} ${I.arrow}</button>
      <div class="tiny muted" style="line-height:1.5">Keyboard: A–D to answer, ← → to move, F to flag.</div>
    </aside></div></main>`;
}
function startExam() {
  exam = E.buildExam(P, { mode: draft.mode, subjects: draft.subjects, topic: draft.topic, timer: draft.timer, instant: draft.instant });
  exam.idx = 0;
  exam.calc = draft.calc;
  qStart = Date.now();
  warnedLow = false;
  go('exam');
  eduSay('wave', exam.instant ? "Let's practise! I'll tell you how you're doing." : 'Good luck! Read each question carefully.');
}

// ---------------------------------------------------------------- exam
function curQ() { return E.qById(exam.questions[exam.idx]); }
function subjectRange(subject) {
  const idxs = exam.questions.map((id, i) => [id, i]).filter(([id]) => E.qById(id).subject === subject).map(([, i]) => i);
  return idxs;
}
function examView() {
  const q = curQ();
  const a = exam.answers[q.id] || {};
  const range = subjectRange(q.subject);
  const pos = range.indexOf(exam.idx) + 1;
  const locked = exam.instant && a.choice != null;
  const title = exam.mode === 'mock' ? 'Mock exam' : exam.mode === 'topic' ? E.topicName(exam.topic) : 'Quick quiz';
  const tabs = exam.subjects.map((s) => {
    const r = subjectRange(s);
    const done = r.filter((i) => exam.answers[exam.questions[i]]?.choice != null).length;
    return `<button class="${s === q.subject ? 'on' : ''}" data-tab="${s}">${E.subjectName(s)} <small class="num">${done}/${r.length}</small></button>`;
  }).join('');
  const left = exam.deadline ? (exam.deadline - Date.now()) / 1000 : null;
  const options = q.options.map((o, k) => {
    let cls = a.choice === k ? 'on' : '';
    if (locked) cls = k === q.answer ? 'right' : a.choice === k ? 'wrong' : '';
    return `<button class="option ${cls}" data-choice="${k}" ${locked ? 'disabled' : ''}><span class="key">${LETTERS[k]}</span><span class="grow">${esc(o)}${locked && isSound(q) ? optIpa(o) : ''}</span></button>`;
  }).join('');
  const feedback = locked ? `<div class="feedback ${a.choice === q.answer ? 'good' : 'bad'} rise"><b>${a.choice === q.answer ? 'Correct.' : `Not quite. The answer is ${LETTERS[q.answer]}.`}</b> ${esc(q.explanation)}</div>${soundsPanel(q)}` : '';
  const palette = range.map((i, n) => {
    const qa = exam.answers[exam.questions[i]] || {};
    const cls = [qa.flagged ? 'flag' : qa.choice != null ? 'ans' : '', i === exam.idx ? 'cur' : ''].join(' ');
    return `<button class="${cls}" data-jump="${i}" aria-label="Question ${n + 1}">${n + 1}</button>`;
  }).join('');
  const answeredHere = range.filter((i) => exam.answers[exam.questions[i]]?.choice != null).length;
  return `<div class="exam-wrap">
    <header class="topbar" style="background:#fff">
      <div style="font-weight:800;font-size:16px">${esc(title)}</div>
      ${exam.subjects.length > 1 ? `<nav class="tabs" aria-label="Subjects">${tabs}</nav>` : ''}
      <div class="grow"></div>
      ${left != null ? `<div class="timer num ${left < 600 ? 'low' : ''}" id="clock">${I.clock}<span>${fmtClock(left)}</span></div>` : ''}
      <button class="btn dark" data-act="submit">${exam.instant ? 'Finish' : 'Submit'}</button>
    </header>
    <div class="exam-body">
      <main class="qcard">
        <div class="row between gap"><div style="font-size:14px;font-weight:700;color:var(--muted)">${E.subjectName(q.subject)} · Question ${pos} of ${range.length}</div>
          <button class="btn sm ${a.flagged ? '' : 'ghost'}" style="${a.flagged ? 'background:var(--orange-soft);color:var(--orange-deep);border:1px solid var(--orange)' : ''}" data-act="flag">${I.flag}${a.flagged ? 'Flagged' : 'Flag for review'}</button></div>
        <p class="qtext">${esc(q.question)}</p>
        <div style="display:flex;flex-direction:column;gap:10px">${options}</div>
        ${feedback}
        <div class="row between gap wrap" style="margin-top:auto">
          <button class="btn ghost lg" data-act="prev" ${exam.idx === 0 ? 'disabled' : ''}>${I.back}Previous</button>
          <span class="tiny muted">A–D to answer · ← → to move · F to flag</span>
          ${exam.idx === exam.questions.length - 1
            ? `<button class="btn primary lg" data-act="submit">${exam.instant ? 'Finish' : 'Submit'} ${I.arrow}</button>`
            : `<button class="btn primary lg" data-act="next">Next ${I.next}</button>`}
        </div>
      </main>
      <aside class="palette-card">
        <div class="card" style="border-radius:24px;padding:22px">
          <div class="row between"><h2 style="font-size:15px;font-weight:800">${E.subjectName(q.subject)} questions</h2><span class="small muted">${answeredHere} of ${range.length} answered</span></div>
          <div class="palette" style="margin-top:16px">${palette}</div>
          <div class="legend" style="margin-top:16px"><span><i style="background:var(--ink)"></i>Answered</span><span><i style="background:var(--orange-soft);border:2px solid var(--orange)"></i>Flagged</span><span><i style="background:#fff;border:1px solid #D6D3D1"></i>Not yet</span></div>
        </div>
        ${exam.calc ? `<button class="btn ghost lg" style="border-radius:16px" data-act="calc">${I.calc}Calculator</button><div id="calcSlot"></div>` : ''}
      </aside>
    </div></div>`;
}
function logTime() {
  const q = curQ(); if (!q) return;
  const a = (exam.answers[q.id] ||= { choice: null, first: null, ms: 0, changes: 0, flagged: false });
  a.ms += Date.now() - qStart;
  qStart = Date.now();
}
function moveTo(i) {
  if (i < 0 || i >= exam.questions.length) return;
  logTime(); exam.idx = i; render();
}
function choose(k) {
  const q = curQ();
  const a = (exam.answers[q.id] ||= { choice: null, first: null, ms: 0, changes: 0, flagged: false });
  if (exam.instant && a.choice != null) return;
  if (a.choice != null && a.choice !== k) a.changes++;
  if (a.first == null) a.first = k;
  a.choice = k;
  logTime();
  render();
  if (exam.instant) {
    const right = k === q.answer;
    const cheers = ['Correct!', 'Yes! Nailed it.', 'Well done!', 'Spot on!'];
    const comfort = ['Not quite. Read why below.', 'Close! Check the explanation.', "That's how we learn. Look at the answer."];
    eduSay(right ? 'happy' : 'sad', right ? cheers[Math.floor(Math.random() * cheers.length)] : comfort[Math.floor(Math.random() * comfort.length)]);
  } else eduSay('nod');
}
function startTick() {
  clearInterval(tick);
  if (!exam.deadline) return;
  tick = setInterval(() => {
    const left = (exam.deadline - Date.now()) / 1000;
    const el = $('#clock');
    if (el) { el.querySelector('span').textContent = fmtClock(left); el.classList.toggle('low', left < 600); }
    if (left < 600 && left > 0 && !warnedLow) { warnedLow = true; eduSay('think', 'About 10 minutes left. Check your flagged questions!'); }
    if (left <= 0) { clearInterval(tick); toast('Time is up. Your exam has been submitted.'); finishExam(); }
  }, 500);
}
function confirmSubmit() {
  const unanswered = exam.questions.filter((id) => exam.answers[id]?.choice == null).length;
  const flagged = exam.questions.filter((id) => exam.answers[id]?.flagged).length;
  modal(`<h2 style="font-size:20px;font-weight:800">${exam.instant ? 'Finish practice?' : 'Submit your exam?'}</h2>
    <p style="margin:0;color:#57534E;line-height:1.55">${unanswered ? `You have <b>${unanswered}</b> unanswered question${unanswered > 1 ? 's' : ''}. ` : 'You have answered every question. '}${flagged ? `<b>${flagged}</b> flagged for review.` : ''}</p>
    <div class="row gap" style="justify-content:flex-end"><button class="btn ghost" data-act="close-modal">Keep going</button><button class="btn primary" data-act="confirm-submit">${exam.instant ? 'Finish' : 'Submit'}</button></div>`);
}
async function finishExam() {
  logTime();
  clearInterval(tick); tick = null;
  exam.finishedAt = Date.now();
  const result = E.scoreExam(exam);
  E.commitExam(P, exam, result);
  await save();
  viewed = { exam, result };
  exam = null;
  closeModal();
  go('results');
  const pct = result.max ? result.total / result.max : 0;
  const prev = P.exams.filter((e) => e.mode === viewed.exam.mode && e.id !== viewed.exam.id).slice(-1)[0];
  const weakest = result.topics.find((t) => t.pct < 70);
  if (pct >= 0.7 || (prev && result.total > prev.total)) eduSay('celebrate', pct >= 0.7 ? 'Brilliant result! Keep it up.' : `You improved by ${result.total - prev.total} marks!`);
  else eduSay('wave', weakest ? `Every exam teaches us something. Let's fix ${E.topicName(weakest.topic).toLowerCase()} next.` : 'Good effort! Let\'s keep going.');
}

// simple exam-hall calculator
let calcExpr = '';
function calcView() {
  const keys = ['7', '8', '9', '÷', '4', '5', '6', '×', '1', '2', '3', '−', '0', '.', '=', '+'];
  return `<div class="card" style="border-radius:20px;margin-top:4px"><div class="num" style="font-size:24px;font-weight:800;text-align:right;padding:8px 6px;min-height:44px;overflow:hidden" id="calcOut">${esc(calcExpr || '0')}</div>
    <div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px">${keys.map((k) => `<button class="btn ${'÷×−+='.includes(k) ? 'primary' : 'ghost'} sm" data-key="${k}">${k}</button>`).join('')}
    <button class="btn ghost sm" style="grid-column:span 4" data-key="C">Clear</button></div></div>`;
}
function calcPress(k) {
  if (k === 'C') calcExpr = '';
  else if (k === '=') {
    try {
      const js = calcExpr.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
      if (!/^[\d.+\-*/() ]+$/.test(js)) throw 0;
      const v = Function(`"use strict";return (${js})`)();
      calcExpr = Number.isFinite(v) ? String(+v.toFixed(8)) : 'Error';
    } catch { calcExpr = 'Error'; }
  } else calcExpr = (calcExpr === 'Error' ? '' : calcExpr) + k;
  const out = $('#calcOut'); if (out) out.textContent = calcExpr || '0';
}

// ---------------------------------------------------------------- results
function pieStyle(pct) { const c = pct < 45 ? '#F97316' : pct < 70 ? '#F59E0B' : '#22C55E'; return `background:conic-gradient(${c} ${pct}%, #F5EFE9 0)`; }
function resultsView() {
  if (!viewed) return `<main class="page"><div class="empty">No results yet. Take a mock exam first.</div></main>`;
  const { exam: ex, result: R } = viewed;
  const prev = P.exams.filter((e) => e.mode === ex.mode && e.at < ex.finishedAt && e.subjects.join() === ex.subjects.join()).slice(-1)[0];
  const diff = prev ? R.total - prev.total : null;
  const plan = E.studyPlan(R);
  const filt = route.filter || 'all';
  const topics = R.topics.filter((t) => filt === 'all' || t.subject === filt);
  const title = ex.mode === 'mock' ? 'Mock exam results' : ex.mode === 'topic' ? `${E.topicName(ex.topic)}: practice results` : 'Quick quiz results';
  const wrongTopics = R.topics.filter((t) => t.pct < 100);
  return `<main class="page rise">
    <div class="row gap wrap"><div class="grow"><h1 style="font-size:24px;font-weight:800">${title}</h1><div class="small muted">${fmtDate(ex.finishedAt)} · ${R.count} questions · ${fmtDur(R.durationMs)}</div></div>
      <button class="btn ghost" data-wrong="">See what I got wrong</button><button class="btn ghost" data-allans="1">All answers</button><button class="btn primary" data-go="setup">New exam</button></div>
    <section class="hero">
      <div class="score-dark"><div style="font-size:14px;font-weight:600;color:#D6D3D1">Your score</div>
        <div class="row" style="align-items:baseline;gap:10px"><span class="big num">${R.total}</span><span style="font-size:20px;font-weight:700;color:#A8A29E">/ ${R.max}</span></div>
        ${diff != null ? `<span class="pill" style="align-self:flex-start;background:#292524;color:${diff >= 0 ? '#FDBA74' : '#FCA5A5'}">${diff >= 0 ? '▲' : '▼'} ${Math.abs(diff)} ${diff >= 0 ? 'more' : 'less'} than last time</span>` : `<span class="small" style="color:#A8A29E">${R.answered} of ${R.count} answered</span>`}
        ${R.count - R.subjects.reduce((s, x) => s + x.right, 0) ? `<button class="btn primary sm" style="align-self:flex-start" data-wrong="">Review ${R.count - R.subjects.reduce((s, x) => s + x.right, 0)} wrong and skipped</button>` : ''}
      </div>
      <div style="flex:999 1 520px;min-width:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px">
        ${R.subjects.map((s) => { const L = E.level(s.score / 100); const worst = R.topics.filter((t) => t.subject === s.id)[0]; return `<div class="card" style="display:flex;flex-direction:column;gap:12px"><div style="font-weight:700">${E.subjectName(s.id)}</div>
          <div class="row" style="align-items:baseline;gap:4px"><span class="num" style="font-size:34px;font-weight:800;letter-spacing:-.03em">${s.score}</span><span class="small muted" style="font-weight:600">/100</span></div>
          <div class="bar"><i style="width:${s.score}%;background:${L.color}"></i></div>
          <div class="tiny muted">${s.right} of ${s.total} right${worst && worst.pct < 70 ? ` · weakest: ${esc(E.topicName(worst.topic))}` : ''}</div></div>`; }).join('')}
      </div>
    </section>
    <section>
      <div class="row between wrap gap"><div><h2 class="section-title">${wrongTopics.length ? 'Where you lost marks' : 'Perfect score'}</h2><div class="small muted" style="margin-top:2px">Weakest topics first, with the likely reason</div></div>
        ${ex.subjects.length > 1 ? `<div class="seg">${[['all', 'All'], ...ex.subjects.map((s) => [s, E.subjectName(s)])].map(([id, n]) => `<button class="${filt === id ? 'on' : ''}" data-filter="${id}">${n}</button>`).join('')}</div>` : ''}</div>
      <div style="display:flex;flex-direction:column;gap:10px;margin-top:16px">${topics.map((t) => `<div class="topic-row">
          <div class="pie" style="${pieStyle(t.pct)}"><span>${t.pct}%</span></div>
          <div class="grow" style="min-width:200px"><div style="font-weight:700">${esc(E.topicName(t.topic))}</div><div class="small muted" style="margin-top:2px">${E.subjectName(t.subject)} · ${t.right} of ${t.total} right${t.reason ? ` · ${E.reasonText(t.reason)}` : ''}</div></div>
          ${t.reason ? `<button class="tag tag-btn ${t.reason === 'Rushed' ? 'blue' : ''}" data-wrong="${t.topic}" data-wrong-reason="${t.reason}" title="See these questions">${t.reason}</button>` : `<span class="tag green">All correct</span>`}
          <div class="row gap">${t.total - t.right ? `<button class="btn ghost sm" data-wrong="${t.topic}">See ${t.total - t.right} wrong</button>` : ''}<button class="btn ghost sm" data-note="${t.topic}">Read note</button>${t.pct < 100 ? `<button class="btn primary sm" data-practise="${t.topic}">Practise</button>` : ''}</div>
        </div>`).join('')}</div>
    </section>
    <section style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px">
      <div class="soft"><div class="small" style="font-weight:700;color:var(--muted)">Average time per question</div><div class="num" style="font-size:28px;font-weight:800;margin-top:6px">${Math.round(R.avgMs / 1000)} s</div>
        <div class="small" style="color:#57534E;margin-top:4px">${R.calcAvgMs > 60000 ? `Calculations took ${Math.round(R.calcAvgMs / 1000)} s on average. Learning the formulas will speed you up.` : 'A good pace. In JAMB you have about 40 seconds per question.'}</div></div>
      <button class="soft stat-btn" ${R.rushedWrong ? 'data-wrong="" data-wrong-reason="Rushed"' : 'disabled'}><div class="small" style="font-weight:700;color:var(--muted)">Rushed answers</div><div class="num" style="font-size:28px;font-weight:800;margin-top:6px">${R.rushedWrong} wrong</div>
        <div class="small" style="color:#57534E;margin-top:4px">${R.rushedWrong ? 'Answered in under 8 seconds and got wrong. Tap to see them.' : 'You took your time. Well done.'}</div></button>
      <div class="soft"><div class="small" style="font-weight:700;color:var(--muted)">Changed answers</div><div class="num" style="font-size:28px;font-weight:800;margin-top:6px">${R.changedRight - R.changedWrong >= 0 ? '+' : ''}${R.changedRight - R.changedWrong} net</div>
        <div class="small" style="color:#57534E;margin-top:4px">${R.changedRight} changed to right, ${R.changedWrong} changed to wrong.${R.changedWrong > R.changedRight ? ' Trust your first answer more.' : ''}</div></div>
    </section>
    ${plan.length ? `<section class="plan"><div class="row between wrap gap"><div><h2 class="section-title">Your ${plan.length}-day plan</h2><div class="small" style="color:#57534E;margin-top:2px">Built from this exam. About 30 minutes a day.</div></div>
        <button class="btn dark" data-note="${plan[0].topic}">Start day 1</button></div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px">${plan.map((d) => `<div class="plan-day"><small>DAY ${d.day}</small><div style="font-weight:700;margin-top:6px">${esc(E.topicName(d.topic))}</div><div class="small" style="color:#57534E;margin-top:4px">${NOTES[d.topic]?.visual ? 'Read the note and try the interactive explainer' : 'Read the note and the worked example'}, then practise the questions again.</div></div>`).join('')}</div></section>` : ''}
  </main>`;
}

// ---------------------------------------------------------------- review
function reviewView() {
  if (!viewed) return `<main class="page"><div class="empty">Nothing to review yet.</div></main>`;
  const { exam: ex } = viewed;
  const only = route.only !== false;
  const all = ex.questions.map((id) => { const q = E.qById(id), a = ex.answers[id] || {}; return { q, a, reason: E.reasonFor(q, a) }; });
  const wrongAll = all.filter((x) => x.a.choice !== x.q.answer);
  let items = only ? wrongAll : all;
  if (route.topicF) items = items.filter((x) => x.q.topic === route.topicF);
  if (route.reasonF) items = items.filter((x) => x.reason === route.reasonF);
  const topicCounts = {};
  wrongAll.forEach((x) => (topicCounts[x.q.topic] = (topicCounts[x.q.topic] || 0) + 1));
  const reasons = {};
  wrongAll.forEach((x) => x.reason && (reasons[x.reason] = (reasons[x.reason] || 0) + 1));
  const skipped = wrongAll.filter((x) => x.a.choice == null).length;
  const chip = (label, active, data) => `<button class="fchip ${active ? 'on' : ''}" ${data}>${label}</button>`;
  return `<main class="page narrow rise">
    <div class="row gap wrap"><button class="btn ghost" data-go="results">${I.back}Results</button>
      <div class="grow"><h1 style="font-size:24px;font-weight:800">${only ? 'What you got wrong' : 'All answers'}</h1>
        <div class="small muted">${wrongAll.length - skipped} wrong · ${skipped} skipped · ${all.length - wrongAll.length} right</div></div>
      <div class="seg"><button class="${only ? 'on' : ''}" data-only="1">Wrong and skipped</button><button class="${only ? '' : 'on'}" data-only="0">All questions</button></div></div>
    ${only && wrongAll.length ? `<div class="filters">
      <div class="row gap wrap"><span class="tiny muted" style="font-weight:700;width:58px">Topic</span>${chip('All', !route.topicF, 'data-topicf=""')}${Object.entries(topicCounts).sort((a, b) => b[1] - a[1]).map(([t, n]) => chip(`${esc(E.topicName(t))} <span>${n}</span>`, route.topicF === t, `data-topicf="${t}"`)).join('')}</div>
      <div class="row gap wrap"><span class="tiny muted" style="font-weight:700;width:58px">Reason</span>${chip('All', !route.reasonF, 'data-reasonf=""')}${Object.entries(reasons).map(([r, n]) => chip(`${r} <span>${n}</span>`, route.reasonF === r, `data-reasonf="${r}"`)).join('')}</div>
    </div>` : ''}
    ${!ai.hasModel ? `<div class="soft small" style="color:#57534E">${I.spark} <b>AI tutor:</b> ${ai.running ? `install the model with <code>ollama pull ${esc(P.settings.aiModel)}</code> to get step-by-step help.` : 'install <b>Ollama</b> (free, works offline) to get step-by-step explanations here. See Settings.'}</div>` : ''}
    ${items.length ? items.map(({ q, a, reason }, n) => {
      const right = a.choice === q.answer;
      return `<article class="review-item rise" style="animation-delay:${Math.min(n, 8) * 40}ms">
      <div class="row between gap wrap"><span class="tiny" style="font-weight:700;color:var(--muted)">${n + 1}. ${E.subjectName(q.subject)} · ${esc(E.topicName(q.topic))}${a.ms ? ` · ${Math.round(a.ms / 1000)} s` : ''}</span>
        <span class="row gap">${reason && reason !== 'Skipped' ? `<span class="tag ${reason === 'Rushed' ? 'blue' : ''}">${reason}</span>` : ''}<span class="tag ${right ? 'green' : ''}">${a.choice == null ? 'Skipped' : right ? 'Correct' : 'Wrong'}</span></span></div>
      <div style="font-weight:600;font-size:17px;line-height:1.5">${esc(q.question)}</div>
      <div style="display:grid;gap:6px">${q.options.map((o, k) => `<div class="row gap small" style="padding:9px 12px;border-radius:10px;${k === q.answer ? 'background:#F0FDF4;color:#14532D;font-weight:700' : k === a.choice ? 'background:#FEF2F2;color:#7F1D1D' : 'background:var(--soft)'}"><b style="width:18px">${LETTERS[k]}</b><span class="grow">${esc(o)}${isSound(q) ? optIpa(o) : ''}</span>${k === q.answer ? '<span>Correct answer</span>' : k === a.choice ? '<span>Your answer</span>' : ''}</div>`).join('')}</div>
      <div class="why"><b>Why ${LETTERS[q.answer]} is right:</b> ${esc(q.explanation)}${!right && a.choice != null ? `<div style="margin-top:6px"><b>Your choice:</b> ${esc(q.options[a.choice])} is not correct.${reason === 'Rushed' ? ' You answered in under 8 seconds. Read the question slowly next time.' : reason === 'Changed a right answer' ? ' You first picked the right answer, then changed it. Trust your first instinct when you are sure.' : ''}</div>` : ''}</div>
      ${soundsPanel(q)}
      <div class="row gap wrap"><button class="btn ghost sm" data-note="${q.topic}">Read the note</button><button class="btn ghost sm" data-practise="${q.topic}">Practise this topic</button>${ai.hasModel ? `<button class="btn primary sm" data-ai="${q.id}">${I.spark}Explain with AI</button>` : ''}</div>
      <div class="ai-box" id="ai-${q.id}" hidden></div>
    </article>`;
    }).join('') : `<div class="empty">${only ? 'Nothing wrong here. Excellent!' : 'No questions.'}</div>`}
  </main>`;
}
async function askAi(qid) {
  const q = E.qById(qid), a = viewed.exam.answers[qid] || {};
  const box = $(`#ai-${qid}`);
  if (box.dataset.busy) return;
  box.dataset.busy = '1';
  box.hidden = false; box.innerHTML = '<span class="typing"><i></i><i></i><i></i></span>';
  // Tell the AI how this student is doing on the topic and what habit caused the miss.
  const st = E.topicStats(P, q.topic);
  const prof = E.learnerProfile(P);
  const reason = E.reasonFor(q, a);
  const mastery = st.p == null ? `This is new to them.` : `Their mastery of ${E.topicName(q.topic)} is ${Math.round(st.p * 100)}% (${E.level(st.p).label.toLowerCase()}).`;
  const habit = reason === 'Rushed' ? `They answered in ${Math.round((a.ms || 0) / 1000)} seconds, which is rushing.${prof.type.id === 'rusher' ? ' Rushing is their usual pattern.' : ''}`
    : reason === 'Changed a right answer' ? `They first chose the right answer, then changed it.${prof.type.id === 'doubter' ? ' They often second-guess themselves.' : ''}`
      : reason === 'Ran out of steam' ? 'They spent over 90 seconds on it.' : reason === 'Skipped' ? 'They skipped it.' : '';
  let text = '';
  try {
    text = await explain({ model: P.settings.aiModel, question: q.question, options: q.options, answer: q.answer, choice: a.choice ?? null, explanation: q.explanation, subject: E.subjectName(q.subject), topic: E.topicName(q.topic), mastery, habit, ms: a.ms, onToken: (t) => { box.innerHTML = mdLite(t) + '<span class="caret"></span>'; } });
    box.innerHTML = mdLite(text) + `<div class="row gap wrap" style="margin-top:10px"><button class="btn ghost sm" data-act="edu-q" data-qid="${q.id}">${I.spark}Ask Edu a follow-up</button></div>`;
  } catch (e) { box.textContent = `The AI tutor isn't available right now. ${e.message || ''}`; }
  delete box.dataset.busy;
}

// ---------------------------------------------------------------- notes
function notesView() {
  const topic = route.topic || E.weakestTopics(P, 1)[0]?.id || 'projectiles';
  route.topic = topic;
  const n = NOTES[topic];
  const st = E.topicStats(P, topic);
  const nav = E.bank().subjects.map((s) => `<div><h4>${s.name}</h4>${s.topics.map((t) => `<button data-note="${t.id}" class="${t.id === topic ? 'on' : ''}"><span>${esc(t.name)}${NOTES[t.id]?.video ? ' <span class="vbadge" title="Has a video lesson">▶</span>' : ''}</span><span class="dot" style="background:${E.level(E.topicStats(P, t.id).p).color}"></span></button>`).join('')}</div>`).join('');
  return `<div class="notes-layout rise">
    <nav class="notes-nav" aria-label="Topics">${nav}</nav>
    <article class="note">
      <div><div class="small" style="font-weight:700;color:var(--orange-ink)">${E.subjectName(n.subject)} · ${n.mins} min read${st.p != null ? ` · your mastery ${Math.round(st.p * 100)}%` : ''}</div>
        <h2 style="margin-top:6px">${esc(n.title)}</h2>
        <p class="intro" style="margin-top:10px">${esc(n.intro)}</p></div>
      ${n.video ? `<section class="vnote"><div class="row between wrap gap" style="margin-bottom:12px"><div><div class="eyebrow">Video lesson</div><div style="font-weight:800;font-size:18px;margin-top:4px">Watch it explained in about 3 minutes</div></div><span class="small muted">Narrated · captions · chapters</span></div><div id="video"></div></section>` : ''}
      ${n.visual ? `<section class="visual" id="visual"><div class="stage" id="stage"></div></section>` : ''}
      ${WATCH[topic] ? `<section class="visual watch" id="watch"></section>` : ''}
      <section class="points">${n.points.map(([h, p]) => `<div class="point"><b>${esc(h)}</b><p>${esc(p)}</p></div>`).join('')}</section>
      <section class="formulas">${n.formulas.map(([k, v]) => `<div class="formula"><small>${esc(k)}</small><div>${esc(v)}</div></div>`).join('')}</section>
      <section class="soft example" id="example"><div class="eyebrow">Worked example</div><div style="font-weight:700;font-size:16px;margin-top:8px">${esc(n.example.q)}</div><ol>${n.example.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol></section>
      <section class="row wrap gap" style="padding:20px;border-radius:20px;border:1px solid var(--orange-line);background:var(--orange-tint)">
        <div class="grow" style="min-width:240px"><div style="font-weight:800">Common trap</div><div style="font-size:14px;color:var(--ink2);margin-top:2px">${esc(n.trap)}</div></div>
        <button class="btn primary lg" data-practise="${topic}">Practise ${E.bank().questions.filter((q) => q.topic === topic).length} questions</button>
      </section>
    </article></div>`;
}
async function mountVisual() {
  const n = NOTES[route.topic];
  if (!n?.visual) return;
  const el = $('#visual');
  try {
    const mod = await import(`./visuals/${n.visual}.js`);
    if (route.name !== 'notes' || NOTES[route.topic]?.visual !== n.visual) return;
    cleanups.push(mod.mount(el));
  } catch (e) {
    console.error(e);
    el.innerHTML = '<div class="empty" style="margin:20px">The interactive explainer could not load.</div>';
  }
}

async function mountNoteVideo() {
  const n = NOTES[route.topic];
  if (!n?.video) return;
  try {
    const mod = await import(`./videos/${n.video}.js`);
    if (route.name !== 'notes' || NOTES[route.topic]?.video !== n.video) return;
    cleanups.push(mountVideo($('#video'), mod.default, { practiseTopic: route.topic }));
  } catch (e) { console.error(e); $('#video').innerHTML = '<div class="empty">The video lesson could not load.</div>'; }
}
function mountNoteAnims() {
  const topic = route.topic, n = NOTES[topic];
  try {
    const ex = $('#example');
    if (ex) cleanups.push(mountSteps(ex, n.example));
    const w = $('#watch');
    if (w && WATCH[topic]) {
      const [kind, key] = WATCH[topic];
      cleanups.push(kind === 'math' ? MATH_SCENES[key](w) : KINETIC[key](w));
    }
  } catch (e) { console.error(e); }
  if (n.video) eduSay('wave', 'Start with the video lesson, then play with the 3D model.');
  else if (n.visual) eduSay('think', 'Play with it! Drag the sliders and turn it around.');
  else if (WATCH[topic]) eduSay('wave', 'Watch this first, then try the questions.');
}

// ---------------------------------------------------------------- Edu the mascot
function ensureEdu() {
  const host = $('#mascot-root');
  if (P.settings.mascot === false) { edu?.destroy(); edu = null; host.hidden = true; return null; }
  if (!edu) {
    host.hidden = false; edu = createMascot(host);
    const fig = host.querySelector('.mascot-figure');
    fig.title = 'Ask Edu'; fig.setAttribute('role', 'button'); fig.setAttribute('aria-label', 'Ask Edu');
    fig.addEventListener('click', () => openEdu());
  }
  host.classList.toggle('locked', route.name === 'exam');
  return edu;
}
function eduSay(state, text) { const m = ensureEdu(); if (m) m.react(state, text); }

// ---------------------------------------------------------------- reports
function reportsView() {
  const exams = P.exams.slice().reverse();
  const rows = E.allTopics().map((t) => ({ ...t, ...E.topicStats(P, t.id) }));
  return `<main class="page rise">
    <h1 style="font-size:24px;font-weight:800">Reports</h1>
    <section><h2 class="section-title" style="font-size:17px">Topic mastery</h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:10px;margin-top:12px">${rows.map((t) => { const l = E.level(t.p); return `<button class="card topic-line" style="display:flex;flex-direction:column;gap:8px;align-items:stretch" data-note="${t.id}">
        <span class="row between" style="width:100%"><span style="font-weight:700">${esc(t.name)}</span><span class="lvl-${l.id}" style="font-size:12px;font-weight:700">${l.label}</span></span>
        <span class="tiny muted">${E.subjectName(t.subject)} · ${t.n} answered</span><span class="bar"><i style="width:${t.p == null ? 0 : Math.round(t.p * 100)}%;background:${l.color}"></i></span></button>`; }).join('')}</div></section>
    <section><h2 class="section-title" style="font-size:17px">Past exams</h2>
      ${exams.length ? `<div style="display:flex;flex-direction:column;gap:10px;margin-top:12px">${exams.map((e) => `<button class="topic-row" style="background:#fff;width:100%;text-align:left" data-exam="${e.id}">
        <div class="pie" style="${pieStyle(Math.round((e.total / e.max) * 100))}"><span>${Math.round((e.total / e.max) * 100)}%</span></div>
        <div class="grow"><div style="font-weight:700">${e.mode === 'mock' ? 'Mock exam' : e.mode === 'topic' ? `Practice: ${esc(E.topicName(e.topic))}` : 'Quick quiz'}</div><div class="small muted">${fmtDate(e.at)} · ${e.subjects.map(E.subjectName).join(', ')}</div></div>
        <div class="num" style="font-weight:800;font-size:18px">${e.total}<span class="small muted"> / ${e.max}</span></div></button>`).join('')}</div>` : `<div class="empty" style="margin-top:12px">Your exams will show here.</div>`}</section>
  </main>`;
}
function openExam(id) {
  const e = P.exams.find((x) => x.id === id);
  if (!e) return;
  const ex = { ...e, finishedAt: e.at, startedAt: e.at - e.durationMs };
  viewed = { exam: ex, result: E.scoreExam(ex) };
  go('results');
}

// ---------------------------------------------------------------- settings
async function openSettings() {
  ai = await aiStatus(P.settings.aiModel);
  const aiLine = ai.hasModel ? `<span class="tag green">AI tutor ready</span>`
    : ai.running ? `<span class="tag">Ollama is running. Now run: <code>ollama pull ${esc(P.settings.aiModel)}</code></span>`
      : `<span class="tag">Not installed. Get Ollama free from ollama.com, then run <code>ollama pull ${esc(P.settings.aiModel)}</code></span>`;
  modal(`<h2 style="font-size:20px;font-weight:800">Settings</h2>
    <label class="small" style="display:flex;flex-direction:column;gap:6px;font-weight:700;color:#57534E">Your first name<input id="setName" class="select" value="${esc(P.settings.name)}" maxlength="30" placeholder="e.g. Goodness"></label>
    <label class="small" style="display:flex;flex-direction:column;gap:6px;font-weight:700;color:#57534E">Your JAMB date (optional)<input id="setDate" type="date" class="select" value="${esc(P.settings.jambDate)}"></label>
    <label class="small" style="display:flex;flex-direction:column;gap:6px;font-weight:700;color:#57534E">Offline AI tutor model<input id="setModel" class="select" value="${esc(P.settings.aiModel)}"></label>
    <label class="row gap small" style="font-weight:700;color:#57534E"><input type="checkbox" id="setMascot" ${P.settings.mascot !== false ? 'checked' : ''}> Show Edu, the study buddy</label>
    <div class="small" style="line-height:1.6">${aiLine}</div>
    <div class="row gap between wrap" style="margin-top:6px"><button class="btn ghost sm" data-act="reset" style="color:#B91C1C">Reset all progress</button>
      <div class="row gap"><button class="btn ghost" data-act="close-modal">Cancel</button><button class="btn primary" data-act="save-settings">Save</button></div></div>`);
}

// ---------------------------------------------------------------- modal
function modal(html) { $('#modal-root').innerHTML = `<div class="modal-back" data-act="close-modal-back"><div class="modal" role="dialog" aria-modal="true">${html}</div></div>`; }
function closeModal() { $('#modal-root').innerHTML = ''; }

// ---------------------------------------------------------------- events
document.addEventListener('click', async (e) => {
  const t = e.target.closest('button, [data-act]');
  if (!t) return;
  const d = t.dataset;
  if (d.go) return go(d.go);
  if (d.note) return go('notes', { topic: d.note });
  if (d.practise) { Object.assign(draft, { mode: 'topic', topic: d.practise, instant: true }); return startExam(); }
  if (d.exam) return openExam(d.exam);
  if (d.mode) { draft.mode = d.mode; return render(); }
  if (d.sub) { if (d.sub !== 'english') draft.subjects = draft.subjects.includes(d.sub) ? draft.subjects.filter((s) => s !== d.sub) : [...draft.subjects, d.sub]; return render(); }
  if (d.opt) { draft[d.opt] = !draft[d.opt]; return render(); }
  if (d.filter) { route.filter = d.filter; return render(); }
  if (d.only) { route.only = d.only === '1'; route.topicF = ''; route.reasonF = ''; return render(); }
  if (d.topicf !== undefined) { route.topicF = d.topicf; return render(); }
  if (d.reasonf !== undefined) { route.reasonF = d.reasonf; return render(); }
  if (d.say) return speakWord(d.say);
  if (d.allans) return go('review', { only: false });
  if (d.wrong !== undefined) return go('review', { only: true, topicF: d.wrong || '', reasonF: d.wrongReason || '' });
  if (d.choice) return choose(+d.choice);
  if (d.jump) return moveTo(+d.jump);
  if (d.tab) return moveTo(subjectRange(d.tab)[0]);
  if (d.key) return calcPress(d.key);
  if (d.ai) return askAi(d.ai);
  switch (d.act) {
    case 'start': return startExam();
    case 'focus': Object.assign(draft, { mode: 'topic', topic: d.topic, instant: true }); return go('notes', { topic: d.topic });
    case 'next': return moveTo(exam.idx + 1);
    case 'prev': return moveTo(exam.idx - 1);
    case 'flag': { const q = curQ(); const a = (exam.answers[q.id] ||= { choice: null, first: null, ms: 0, changes: 0, flagged: false }); a.flagged = !a.flagged; return render(); }
    case 'submit': return confirmSubmit();
    case 'confirm-submit': return finishExam();
    case 'calc': { const slot = $('#calcSlot'); slot.innerHTML = slot.innerHTML ? '' : calcView(); return; }
    case 'settings': return openSettings();
    case 'edu': return openEdu(d.eduAsk ? { ask: d.eduAsk } : {});
    case 'edu-q': { const a = viewed?.exam.answers[d.qid] || {}; return openEdu({ qid: d.qid, choice: a.choice ?? null }); }
    case 'close-modal': return closeModal();
    case 'close-modal-back': if (e.target === t) closeModal(); return;
    case 'save-settings':
      P.settings.name = $('#setName').value.trim();
      P.settings.jambDate = $('#setDate').value;
      P.settings.aiModel = $('#setModel').value.trim() || 'llama3.2:3b';
      P.settings.mascot = $('#setMascot').checked;
      ensureEdu();
      await save(); closeModal(); ai = await aiStatus(P.settings.aiModel); return render();
    case 'reset':
      if (t.dataset.sure) { P = structuredClone(DEFAULT); await save(); closeModal(); toast('Progress reset.'); return go('home'); }
      t.dataset.sure = '1'; t.textContent = 'Click again to confirm'; return;
  }
});
document.addEventListener('change', (e) => { if (e.target.id === 'topicSel') { draft.topic = e.target.value; render(); } });
document.addEventListener('keydown', (e) => {
  if (e.target.matches('input, select, textarea')) return;
  if (e.key === 'Escape') return closeModal();
  if (route.name !== 'exam' || !exam || $('#modal-root').innerHTML) return;
  const k = e.key.toLowerCase();
  if (['a', 'b', 'c', 'd'].includes(k)) { e.preventDefault(); choose('abcd'.indexOf(k)); }
  else if (e.key === 'ArrowRight') moveTo(exam.idx + 1);
  else if (e.key === 'ArrowLeft') moveTo(exam.idx - 1);
  else if (k === 'f') { const q = curQ(); const a = (exam.answers[q.id] ||= { choice: null, first: null, ms: 0, changes: 0, flagged: false }); a.flagged = !a.flagged; render(); }
});

// ---------------------------------------------------------------- start
(async () => {
  await Promise.all([load(), E.loadBank()]);
  render();
  ai = await aiStatus(P.settings.aiModel);
})();

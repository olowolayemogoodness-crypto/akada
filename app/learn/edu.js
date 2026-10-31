// Edu: the phone-first app shell. Learn (map) · Shorts · Practise · Me.
import { SUBJECTS, LESSONS, curriculum } from './content.js';
import { nextUp } from './map.js';
import { renderLesson, renderPractice, shortsFor, injectShortsCSS, bank } from './lesson.js';
import { progress, BADGES } from './store.js';
import { todaysPlan, lessonTitle } from './guide.js';
import { mountShorts } from '../anim/shorts.js';

const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const app = $('#edu');
let subject = 'chemistry';
try { subject = localStorage.getItem('edu-subject') || 'chemistry'; } catch { /* storage off */ }
let cleanup = null;

const FLAME = '<svg width="18" height="18" viewBox="0 0 24 24" fill="#F97316" aria-hidden="true"><path d="M12 2c1 4 5 6 5 11a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-4-1-6 1-10z"/></svg>';
const BOLT = '<svg width="18" height="18" viewBox="0 0 24 24" fill="#EAB308" aria-hidden="true"><path d="M13 2L4 14h6l-1 8 9-12h-6z"/></svg>';
const TICK = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1C0A00" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const ringSvg = (v, max, size = 52, st = 6) => { const r = (size - st) / 2, c = 2 * Math.PI * r, f = Math.max(0, Math.min(1, v / max)); return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="#3A332E" stroke-width="${st}"/><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${v >= max ? '#22C55E' : '#F97316'}" stroke-width="${st}" stroke-linecap="round" stroke-dasharray="${(c * f).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 ${size / 2} ${size / 2})"/></svg>`; };

const NAV = [
  ['learn', 'Home', '<path d="M4 11l8-7 8 7v9H4z"/><path d="M10 20v-6h4v6"/>'],
  ['shorts', 'Shorts', '<rect x="6" y="3" width="12" height="18" rx="3"/><path d="M10.5 9.5v5l4-2.5z" fill="currentColor"/>'],
  ['practise', 'Practise', '<path d="M5 4h14v16H5z"/><path d="M8.5 9.5l2 2 4-4M8.5 15.5h7"/>'],
  ['me', 'Me', '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>'],
];
const shell = (tab, inner, { top = true } = {}) => `
  ${top ? `<header class="edu-top">
    <button class="subj" data-act="subject"><span>${SUBJECTS.find((s) => s.id === subject).icon}</span>${SUBJECTS.find((s) => s.id === subject).name} <em>▾</em></button>
    <div class="stats"><span class="chip fire" title="Day streak">${FLAME}${progress.streak()}</span><span class="chip bolt" title="XP">${BOLT}${progress.get().xp}</span></div></header>` : ''}
  <main class="edu-main ${tab}">${inner}</main>
  <nav class="edu-nav">${NAV.map(([k, l, ic]) => `<a href="#/${k}" class="${k === tab ? 'on' : ''}"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ic}</svg><span>${l}</span></a>`).join('')}</nav>`;

async function route() {
  cleanup?.(); cleanup = null;
  const [, tab = 'learn', arg] = location.hash.split('/');
  document.body.dataset.tab = tab;
  if (tab === 'lesson' || tab === 'checkpoint') {
    app.innerHTML = '<div class="edu-full"></div>';
    cleanup = await renderLesson($('.edu-full'), subject, tab === 'checkpoint' ? `cp:${arg}` : arg, { back: () => { location.hash = '#/learn'; } });
    return;
  }
  if (tab === 'stop') { document.body.dataset.tab = 'learn'; await stopView(arg); return; }
  if (tab === 'quiz') {
    app.innerHTML = '<div class="edu-full"></div>';
    await renderPractice($('.edu-full'), arg, { back: () => { location.hash = '#/practise'; } });
    return;
  }
  if (tab === 'shorts') {
    injectShortsCSS();
    const list = await shortsFor(subject);
    app.innerHTML = shell('shorts', list.length ? '<div class="edu-feed"></div>' : '<div class="empty">No shorts for this subject yet.</div>', { top: false });
    if (list.length) cleanup = mountShorts($('.edu-feed'), list, {
      onNote: (s) => { location.hash = `#/lesson/${lessonOfShort(s.id)}`; },
      onPractise: (s) => { location.hash = `#/lesson/${lessonOfShort(s.id)}`; },
      onAnswer: (s, ok) => progress.answer(`short:${s.id}`, ok),
    });
    return;
  }
  if (tab === 'practise') {
    const B = await bank();
    const subs = B.subjects.map((s) => `<section class="prac"><h3>${esc(s.name)}</h3><div class="prac-grid">${s.topics.map((t) => {
      const n = B.questions.filter((q) => q.topic === t.id).length;
      return `<a class="prac-card" href="#/quiz/${t.id}"><b>${esc(t.name)}</b><small>${n} questions</small></a>`;
    }).join('')}</div></section>`).join('');
    const cbtPage = location.pathname.endsWith('edu.html') ? 'index.html' : 'cbt.html';
    app.innerHTML = shell('practise', `<div class="pad"><h2 class="h">Practise</h2><p class="sub">Ten quick questions on a topic.</p>
      <a class="mock" href="${cbtPage}"><b>📝 Full JAMB mock exam</b><small>Timed CBT, just like the real thing. Best on a computer.</small></a>${subs}</div>`);
    return;
  }
  if (tab === 'me') {
    const p = progress.get(), acc = progress.accuracy(), lv = progress.level(), wk = progress.week(), due = progress.dueList().length;
    const mast = progress.topicMastery();
    const label = (x) => (x >= 0.8 ? ['Strong', '#22C55E'] : x >= 0.5 ? ['Okay', '#F59E0B'] : ['Weak', '#F97316']);
    app.innerHTML = shell('me', `<div class="pad">
      <h2 class="h">Your progress</h2>
      <section class="me-hero"><div class="me-lv">${lv.n}</div><div class="me-hero-t"><b>${esc(lv.name)}</b><div class="me-bar"><i style="width:${Math.max(3, Math.round(lv.pct * 100))}%"></i></div><small>${lv.need - lv.into} XP to level ${lv.n + 1} · ${p.xp} XP total</small></div></section>
      <section class="me-card wide"><div class="me-row"><b>${progress.streak()}-day streak</b></div>
        <div class="me-week">${wk.map((d) => `<div class="${d.today ? 'today' : ''}"><span class="dot ${d.xp ? 'on' : ''}">${d.xp ? TICK : d.today ? FLAME : ''}</span><small>${d.label}</small></div>`).join('')}</div></section>
      <section class="me-card wide"><div class="me-row"><b>What you remember</b>${due ? `<em>${due} review${due > 1 ? 's' : ''} due</em>` : ''}</div>
        ${mast.length ? mast.slice(0, 6).map((t) => { const [w, c] = label(t.pct); return `<div class="mast"><span>${esc(t.name || t.id)}</span><div class="mast-bar"><i style="width:${Math.round(t.pct * 100)}%;background:${c}"></i></div><small>${w}</small></div>`; }).join('') : '<p class="sub">Answer some questions and your strong and weak topics show up here.</p>'}
        ${due ? '<a class="rev-btn" href="#/learn">Review now</a>' : ''}</section>
      <div class="me-grid three">
        <div class="me-card"><b>${Object.keys(p.done).length}</b><small>lessons done</small></div>
        <div class="me-card"><b>${acc == null ? '–' : acc + '%'}</b><small>answers right</small></div>
        <div class="me-card"><b>${Object.keys(p.badges).length}/${BADGES.length}</b><small>badges</small></div>
      </div>
      <section class="me-card wide"><div class="me-row"><b>Badges</b></div><div class="badges">${BADGES.map((b) => `<div class="badge ${progress.hasBadge(b.id) ? 'got' : ''}" title="${esc(b.desc)}"><i>${b.icon}</i><span>${esc(b.name)}</span></div>`).join('')}</div></section>
      <p class="sub">Your progress is saved on this phone only. No account needed, and it works offline.</p>
      <div class="me-links">
        <a href="https://github.com/olowolayemogoodness-crypto/edu" target="_blank" rel="noopener">Edu is free and open source ↗</a>
        <button data-act="reset">Reset my progress</button>
      </div>
      <p class="tiny">Made in Nigeria by Edulink · Not affiliated with JAMB</p></div>`);
    return;
  }
  // home: resume card, today, all stops
  const cur = await curriculum(subject);
  const onAndroidWeb = /Android/i.test(navigator.userAgent) && !window.Capacitor && location.protocol.startsWith('http');
  let hideBanner = false; try { hideBanner = !!localStorage.getItem('edu-apk-banner'); } catch { /* */ }
  const banner = onAndroidWeb && !hideBanner ? `<div class="apk"><span>📲</span><div><b>Get the Edu app</b><small>Works offline. Free. About 10 MB.</small></div><a href="downloads/edu.apk" download>Download</a><button data-act="nobanner" aria-label="Close">✕</button></div>` : '';
  app.innerHTML = shell('learn', banner + homeHTML(cur));
}

const BUS = '<svg width="40" height="23" viewBox="0 0 52 30" aria-hidden="true"><rect x="2" y="3" width="46" height="21" rx="5" fill="#FACC15"/><rect x="2" y="13" width="46" height="4" fill="#1C1917"/><rect x="8" y="6" width="9" height="6" rx="1.5" fill="#1E2A5E"/><rect x="20" y="6" width="9" height="6" rx="1.5" fill="#1E2A5E"/><rect x="32" y="6" width="9" height="6" rx="1.5" fill="#1E2A5E"/><rect x="44" y="9" width="6" height="8" rx="2" fill="#FFF3B0"/><circle cx="13" cy="25" r="4.5" fill="#0B1030" stroke="#CBD5E1" stroke-width="1.5"/><circle cx="37" cy="25" r="4.5" fill="#0B1030" stroke="#CBD5E1" stroke-width="1.5"/></svg>';
const CHEV = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#78716C" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';
const LOCK = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#78716C" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
const unitIds = (u) => u.lessons.map((_, i) => `${u.id}-${i + 1}`);
const readyIds = (u) => unitIds(u).filter((id) => LESSONS[id]);
// A stop is passed when its assessment is passed. It is "now" while it is the first stop with lessons not yet passed.
const stopState = (u, curStop) => (progress.isDone(`cp:${u.id}`) ? 'done' : readyIds(u).length === 0 ? 'soon' : u === curStop ? 'now' : 'open');
const currentStop = (cur) => cur.units.find((u) => readyIds(u).length && !progress.isDone(`cp:${u.id}`)) || null;
const ringSmall = (pct, col) => { const r = 18, c = 2 * Math.PI * r; return `<svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true"><circle cx="22" cy="22" r="${r}" fill="none" stroke="#EDE5DA" stroke-width="5"/><circle cx="22" cy="22" r="${r}" fill="none" stroke="${col}" stroke-width="5" stroke-linecap="round" stroke-dasharray="${(c * pct).toFixed(0)} ${c.toFixed(0)}" transform="rotate(-90 22 22)"/></svg>`; };

function jambDays() {
  try { const d = localStorage.getItem('edu-jamb'); if (!d) return null; const n = Math.ceil((new Date(d) - new Date()) / 86400000); return n > 0 ? n : null; } catch { return null; }
}

function homeHTML(cur) {
  const stop = currentStop(cur), nextId = nextUp(cur), t = nextId && lessonTitle(cur, nextId);
  const total = cur.units.length;
  const passed = cur.units.filter((u) => progress.isDone(`cp:${u.id}`)).length;
  let frac = 0;
  if (stop) { const ids = readyIds(stop); frac = ids.filter((i) => progress.isDone(i)).length / Math.max(1, ids.length) * 0.8; }
  const pct = Math.max(2, Math.round(((passed + frac) / total) * 100));
  const stopNo = stop ? cur.units.indexOf(stop) + 1 : passed;
  const days = jambDays();
  const info = nextId ? LESSONS[nextId] : null;
  const meta = info ? [info.shorts?.length ? `${info.shorts.length} short${info.shorts.length > 1 ? 's' : ''}` : '', info.note ? '1 note' : '', 'quiz at the end'].filter(Boolean).join(' · ') : '';
  const resume = nextId
    ? `<section class="resume"><small>${progress.doneCount() ? 'CONTINUE' : 'START HERE'} · STOP ${stopNo}</small><h2>${esc(t.lesson)}</h2><p>${meta}</p>
        <button class="go" data-act="open" data-id="${nextId}"><svg width="20" height="20" viewBox="0 0 24 24" fill="#1C0A00" aria-hidden="true"><path d="M8 5.2v13.6a1 1 0 0 0 1.5.86l11-6.8a1 1 0 0 0 0-1.72l-11-6.8A1 1 0 0 0 8 5.2z"/></svg>Start swiping</button>
        <div class="road"><div class="road-bar"><i style="width:${pct}%"></i></div><span class="bus" style="left:calc(${pct}% - 20px)">${BUS}</span></div>
        <div class="road-t"><button class="linkish" data-act="jamb">${days ? `Road to JAMB · ${days} days` : 'Set your JAMB date'}</button><span>Stop ${stopNo} of ${total}</span></div></section>`
    : `<section class="resume"><small>ALL CAUGHT UP</small><h2>You finished every lesson we have</h2><p>More arrive every week. Try a mock exam while you wait.</p></section>`;
  const weak = progress.topicMastery().filter((m) => m.pct < 0.6 && m.n >= 3).slice(0, 2).map((m) => ({ id: m.id, name: m.name || m.id }));
  const plan = todaysPlan(cur, weak).filter((p) => p.kind !== 'next');
  const today = plan.length ? `<section class="blk"><h3>Today</h3>${plan.map((p) => `<button class="tcard ${p.kind}" data-act="open" data-id="${p.id}"><div><b>${p.kind === 'review' ? 'Review: ' : ''}${esc(p.head.replace(/^Fix a weak spot: /, 'Fix a weak spot: '))}</b><small>${esc(p.sub)}</small></div>${CHEV}</button>`).join('')}</section>` : '';
  const rows = cur.units.map((u, i) => {
    const st = stopState(u, stop), ids = readyIds(u), done = ids.filter((x) => progress.isDone(x)).length;
    const badge = st === 'done' ? `<div class="sb">${ringSmall(1, '#F59E0B')}<span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#78350F" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span></div>`
      : st === 'soon' ? `<div class="sb lockb">${LOCK}</div>`
      : `<div class="sb">${ringSmall(ids.length ? done / ids.length : 0, '#F97316')}<span>${i + 1}</span></div>`;
    const sub = st === 'done' ? `${ids.length} lessons · assessment passed` : st === 'soon' ? `${u.lessons.length} lessons · coming soon` : `${done} of ${ids.length} lessons · assessment ${done === ids.length ? 'ready' : 'locked'}`;
    return `<a class="stop ${st}" ${st === 'soon' ? 'aria-disabled="true"' : ''} href="#/stop/${u.id}">${badge}<div class="st-t"><b>${esc(u.title)}</b><small>${sub}</small></div>${st === 'soon' ? '' : CHEV}</a>`;
  }).join('');
  return `${resume}${today}<section class="blk"><div class="blk-h"><h3>All stops</h3><small>${total} stops</small></div><div class="stops">${rows}</div></section>`;
}

// One stop: its lessons and its assessment gate.
async function stopView(unitId) {
  const cur = await curriculum(subject);
  const u = cur.units.find((x) => x.id === unitId);
  if (!u) { location.hash = '#/learn'; return; }
  const ids = unitIds(u), ready = readyIds(u), allDone = ready.length > 0 && ready.every((x) => progress.isDone(x)), passed = progress.isDone(`cp:${u.id}`);
  const next = nextUp(cur);
  const lessons = u.lessons.map((title, i) => {
    const id = ids[i], info = LESSONS[id];
    const st = !info ? 'soon' : progress.isDone(id) ? (progress.isDue(id) ? 'due' : 'done') : id === next ? 'next' : 'open';
    const label = { done: 'Remembered', due: 'Review due', next: 'Up next', open: 'Ready', soon: 'Coming soon' }[st];
    const ic = st === 'done' ? '✓' : st === 'due' ? '↻' : st === 'soon' ? '' : '▶';
    return `<${info ? 'a' : 'div'} class="les ${st}" ${info ? `href="#/lesson/${id}"` : ''}><span class="les-i">${st === 'soon' ? LOCK : ic}</span><div><b>${esc(title)}</b><small>${label}${info ? ` · ${[info.shorts?.length ? info.shorts.length + ' shorts' : '', info.note ? 'note' : ''].filter(Boolean).join(' · ')}` : ''}</small></div></${info ? 'a' : 'div'}>`;
  }).join('');
  const gateState = passed ? 'passed' : allDone ? 'ready' : 'locked';
  const gate = `<${gateState === 'locked' ? 'div' : 'a'} class="gate ${gateState}" ${gateState === 'locked' ? '' : `href="#/checkpoint/${u.id}"`}><span class="gate-b"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1C1917" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/></svg></span><div><b>Stop ${cur.units.indexOf(u) + 1} assessment</b><small>${passed ? 'Passed. Tap to try again' : allDone ? 'Ready. 10 questions, pass with 7' : 'Finish the lessons in this stop first'}</small></div></${gateState === 'locked' ? 'div' : 'a'}>`;
  app.innerHTML = shell('learn', `<div class="pad"><a class="back" href="#/learn">‹ All stops</a><small class="eyebrow">${esc(u.class)} · STOP ${cur.units.indexOf(u) + 1}</small><h2 class="h">${esc(u.title)}</h2><div class="lessons">${lessons}</div>${gate}</div>`, { top: false });
}

// Which lesson a short belongs to (for its Notes and Practise buttons).
const lessonOfShort = (sid) => Object.keys(LESSONS).find((k) => LESSONS[k].shorts?.includes(sid)) || '';

app.addEventListener('click', async (e) => {
  const node = e.target.closest('.node');
  if (node && !node.classList.contains('soon')) {
    location.hash = node.dataset.checkpoint ? `#/checkpoint/${node.dataset.checkpoint}` : `#/lesson/${node.dataset.lesson}`;
    return;
  }
  if (node) { toast(node.dataset.checkpoint ? 'Finish the lessons in this unit first.' : 'Coming soon. We are writing this lesson.'); return; }
  const act = e.target.closest('[data-act]')?.dataset.act;
  if (act === 'subject') pickSubject();
  if (act === 'open') { const id = e.target.closest('[data-id]').dataset.id; location.hash = `#/lesson/${id}`; }
  if (act === 'jamb') setJamb();
  if (act === 'nobanner') { try { localStorage.setItem('edu-apk-banner', '1'); } catch { /* */ } e.target.closest('.apk').remove(); }
  if (act === 'reset' && confirmReset()) { progress.reset(); route(); }
});

function setJamb() {
  const sheet = document.createElement('div'); sheet.className = 'sheet';
  let cur = ''; try { cur = localStorage.getItem('edu-jamb') || ''; } catch { /* */ }
  sheet.innerHTML = `<div class="sheet-in"><h3>When is your JAMB?</h3><p class="sub">We count the days on your road. It stays on this phone.</p><input type="date" id="jambDate" value="${cur}" style="width:100%;height:48px;border:2px solid var(--line);border-radius:14px;padding:0 12px;font:inherit;margin-bottom:12px"><button data-save style="justify-content:center;background:var(--orange);border-color:var(--orange);color:#1C0A00">Save</button></div>`;
  sheet.addEventListener('click', (e) => {
    if (e.target.closest('[data-save]')) { try { localStorage.setItem('edu-jamb', sheet.querySelector('#jambDate').value); } catch { /* */ } sheet.remove(); route(); }
    else if (e.target === sheet) sheet.remove();
  });
  document.body.appendChild(sheet);
}

function confirmReset() { return window.confirm('Delete all your progress on this device?'); }

function toast(msg) {
  const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg;
  document.body.appendChild(t); setTimeout(() => t.remove(), 2200);
}

function pickSubject() {
  const sheet = document.createElement('div');
  sheet.className = 'sheet';
  sheet.innerHTML = `<div class="sheet-in"><h3>Choose a subject</h3>${SUBJECTS.map((s) => `<button data-s="${s.id}" ${s.ready ? '' : 'disabled'} class="${s.id === subject ? 'on' : ''}"><span>${s.icon}</span>${s.name}${s.ready ? '' : '<em>Coming soon</em>'}</button>`).join('')}</div>`;
  sheet.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-s]');
    if (b) { subject = b.dataset.s; try { localStorage.setItem('edu-subject', subject); } catch { /* */ } route(); }
    if (b || e.target === sheet) sheet.remove();
  });
  document.body.appendChild(sheet);
}

window.addEventListener('hashchange', route);
curriculum(subject).catch(() => { subject = 'chemistry'; });
route();

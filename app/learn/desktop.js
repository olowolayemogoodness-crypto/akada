// The Learn tab inside the desktop app: subject tabs, the learning map, and a sidebar with
// level, streak, daily goal, today's plan, badges and a short guide on how to study.
import { SUBJECTS, curriculum } from './content.js';
import { renderMap } from './map.js';
import { renderLesson, injectShortsCSS } from './lesson.js';
import { progress, BADGES } from './store.js';
import { ROUTINE, MAP_GUIDE, todaysPlan } from './guide.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const GOALS = [10, 20, 30, 50];

function ring(value, max, size = 92, stroke = 10) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, f = Math.max(0, Math.min(1, value / max));
  const done = value >= max;
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true">
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="#F1E9DF" stroke-width="${stroke}"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${done ? '#16A34A' : '#F97316'}" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${(c * f).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 ${size / 2} ${size / 2})"/></svg>`;
}

// ctx: { weak: () => [{id, name}], toast: (msg) => void, openMock: () => void }
export function mountLearn(host, ctx = {}) {
  let subject = 'chemistry';
  try { subject = localStorage.getItem('edu-subject') || 'chemistry'; } catch { /* storage off */ }
  if (!SUBJECTS.find((s) => s.id === subject && s.ready)) subject = 'chemistry';
  let overlay = null, stopLesson = null, alive = true;

  host.innerHTML = `<div class="lrn lrn-d">
    <div class="ld-main">
      <div class="ld-tabs" role="tablist"></div>
      <div class="ld-guide"></div>
      <div class="ld-jump"></div>
      <div class="ld-map"></div>
    </div>
    <aside class="ld-side" aria-label="Your progress"></aside></div>`;
  const $ = (s) => host.querySelector(s);

  const tabs = () => {
    $('.ld-tabs').innerHTML = SUBJECTS.map((s) => `<button role="tab" data-l="subject" data-id="${s.id}" ${s.ready ? '' : 'disabled'} class="${s.id === subject ? 'on' : ''}" aria-selected="${s.id === subject}"><span>${s.icon}</span>${esc(s.name)}${s.ready ? '' : '<em>Soon</em>'}</button>`).join('');
  };

  const guide = () => {
    const el = $('.ld-guide');
    if (progress.seenGuide()) {
      el.innerHTML = '<button class="ld-linkbtn" data-l="showguide">How does this work?</button>';
      return;
    }
    el.innerHTML = `<section class="ld-card ld-guidecard"><div class="ld-row"><h3>How the map works</h3><button class="ld-x" data-l="hideguide" aria-label="Close guide">✕</button></div>
      <div class="ld-guidegrid">${MAP_GUIDE.map(([h, t]) => `<div><b>${esc(h)}</b><p>${esc(t)}</p></div>`).join('')}</div>
      <button class="btn dark sm" data-l="hideguide">Got it</button></section>`;
  };

  const jump = async () => {
    const cur = await curriculum(subject);
    if (!alive) return;
    $('.ld-jump').innerHTML = `<label class="ld-jumplabel">Jump to <select data-l="jump">${cur.units.map((u, i) => `<option value="${u.id}">${esc(u.class)} · ${i + 1}. ${esc(u.title)}</option>`).join('')}</select></label>`;
  };

  const side = async () => {
    const cur = await curriculum(subject);
    if (!alive) return;
    const lv = progress.level(), dxp = progress.dailyXP(), goal = progress.goal();
    const plan = todaysPlan(cur, ctx.weak ? ctx.weak() : []);
    const streak = progress.streak();
    $('.ld-side').innerHTML = `
      <section class="ld-card ld-level">
        <div class="ld-row"><div><small>Level ${lv.n}</small><h3>${esc(lv.name)}</h3></div><div class="ld-xp">⚡ ${lv.xp} XP</div></div>
        <div class="ld-bar" role="progressbar" aria-valuenow="${Math.round(lv.pct * 100)}" aria-valuemin="0" aria-valuemax="100"><i style="width:${Math.max(3, Math.round(lv.pct * 100))}%"></i></div>
        <small>${lv.need - lv.into} XP to level ${lv.n + 1}</small>
      </section>
      <section class="ld-card ld-today">
        <div class="ld-ring">${ring(dxp, goal)}<div class="ld-ringval"><b>${Math.min(dxp, goal)}</b><span>/ ${goal} XP</span></div></div>
        <div class="ld-todaytext">
          <h3>${dxp >= goal ? 'Daily goal done! 🎯' : 'Daily goal'}</h3>
          <p>${streak ? `🔥 ${streak}-day streak` : 'Learn today to start a streak'}</p>
          <div class="ld-goals" role="group" aria-label="Choose a daily goal">${GOALS.map((g) => `<button data-l="goal" data-n="${g}" class="${g === goal ? 'on' : ''}">${g}</button>`).join('')}</div>
        </div>
      </section>
      <section class="ld-card"><h3>Today's plan</h3>
        ${plan.length ? plan.map((p) => `<button class="ld-plan ${p.kind}" data-l="open" data-id="${p.id}"><span>${p.icon}</span><div><b>${esc(p.head)}</b><small>${esc(p.sub)}</small></div></button>`).join('') : '<p class="ld-muted">You are all caught up. More lessons are on the way.</p>'}
      </section>
      <section class="ld-card"><h3>Badges <small>${Object.keys(progress.get().badges).length}/${BADGES.length}</small></h3>
        <div class="ld-badges">${BADGES.map((b) => `<div class="ld-badge ${progress.hasBadge(b.id) ? 'got' : ''}" title="${esc(b.name)}: ${esc(b.desc)}"><i>${b.icon}</i><span>${esc(b.name)}</span></div>`).join('')}</div>
      </section>
      <section class="ld-card"><h3>How to study</h3>
        <ol class="ld-routine">${ROUTINE.map((r) => `<li><span>${r.icon}</span><div><b>${esc(r.title)} <em>${esc(r.time)}</em></b><p>${esc(r.text)}</p></div></li>`).join('')}</ol>
      </section>
      <button class="ld-mock" data-l="mock"><b>📝 Full JAMB mock exam</b><small>Timed, like the real thing. Finds your weak topics.</small></button>`;
  };

  const drawMap = () => renderMap($('.ld-map'), subject);
  const refresh = () => { if (!alive) return; tabs(); guide(); side(); drawMap(); jump(); };

  const close = () => {
    stopLesson?.(); stopLesson = null;
    overlay?.remove(); overlay = null;
    document.body.classList.remove('lrn-lock');
    document.removeEventListener('keydown', onKey);
    if (alive) { side(); drawMap(); }
  };
  const onKey = (e) => { if (e.key === 'Escape' && overlay) close(); };
  const open = async (id) => {
    if (overlay) return;
    injectShortsCSS();
    overlay = document.createElement('div');
    overlay.className = 'lrn lrn-ov';
    overlay.innerHTML = '<div class="lrn-sheet"></div>';
    document.body.appendChild(overlay);
    document.body.classList.add('lrn-lock');
    document.addEventListener('keydown', onKey);
    stopLesson = await renderLesson(overlay.firstChild, subject, id, { back: close });
  };

  // A badge or level can change while a lesson is open; the sidebar catches up when it closes.
  const off = progress.onChange(() => { if (!overlay && alive) side(); });

  host.addEventListener('click', (e) => {
    const node = e.target.closest('.node');
    if (node) {
      e.stopPropagation();
      if (node.classList.contains('soon')) return ctx.toast?.(node.dataset.checkpoint ? 'Finish the lessons in this unit first.' : 'Coming soon. We are writing this lesson.');
      return open(node.dataset.checkpoint ? `cp:${node.dataset.checkpoint}` : node.dataset.lesson);
    }
    const b = e.target.closest('[data-l]');
    if (!b) return;
    e.stopPropagation(); // keep the app's own click handler out of it
    const a = b.dataset.l;
    if (a === 'subject') { subject = b.dataset.id; try { localStorage.setItem('edu-subject', subject); } catch { /* */ } refresh(); }
    else if (a === 'open') open(b.dataset.id);
    else if (a === 'goal') { progress.setGoal(+b.dataset.n); }
    else if (a === 'hideguide') { progress.markGuideSeen(); guide(); }
    else if (a === 'showguide') { const p = progress.get(); p.seenGuide = false; guide(); }
    else if (a === 'mock') ctx.openMock?.();
  }, true);
  host.addEventListener('change', (e) => {
    const s = e.target.closest('select[data-l="jump"]');
    if (s) document.getElementById(`unit-${s.value}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  refresh();
  return () => { alive = false; off(); close(); };
}

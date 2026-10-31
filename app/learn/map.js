// The learning map: a winding path of lessons, unit by unit, like a game level map.
import { LESSONS, curriculum } from './content.js';
import { progress } from './store.js';

const UNIT_COLORS = ['#F97316', '#3B7DDD', '#16A34A', '#9333EA', '#DB2777', '#0D9488', '#CA8A04'];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export const lessonInfo = (id) => LESSONS[id] || null;

// The first lesson that is ready and not finished yet.
export function nextUp(cur) {
  for (const u of cur.units) for (let i = 0; i < u.lessons.length; i++) {
    const id = `${u.id}-${i + 1}`;
    if (LESSONS[id] && !progress.isDone(id)) return id;
  }
  return null;
}

export async function renderMap(el, subject) {
  const cur = await curriculum(subject);
  const next = nextUp(cur);
  const ICON = {
    done: '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    play: '<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M8 5.2v13.6a1 1 0 001.5.86l11-6.8a1 1 0 000-1.72l-11-6.8A1 1 0 008 5.2z"/></svg>',
    book: '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"><path d="M3 5.5C6 4 9 4 12 6c3-2 6-2 9-.5V19c-3-1.5-6-1.5-9 .5-3-2-6-2-9-.5z"/><path d="M12 6v13.5"/></svg>',
    lock: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>',
    redo: '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11a8 8 0 10-2.3 5.7"/><path d="M20 4v7h-7"/></svg>',
    trophy: '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4h10v5a5 5 0 01-10 0z"/><path d="M7 6H4a3 3 0 003 4M17 6h3a3 3 0 01-3 4M12 14v4M8 21h8"/></svg>',
  };
  // The memory ring around a node: full gold = fresh, faded blue = a review is due.
  const RING = {
    done: '<circle cx="50" cy="50" r="46" fill="none" stroke="#F59E0B" stroke-width="5"/>',
    due: '<circle cx="50" cy="50" r="46" fill="none" stroke="#E5E7EB" stroke-width="5"/><circle cx="50" cy="50" r="46" fill="none" stroke="#93C5FD" stroke-width="5" stroke-linecap="round" stroke-dasharray="95 290" transform="rotate(-90 50 50)"/>',
    next: '<circle cx="50" cy="50" r="46" fill="none" stroke="#FFE3CC" stroke-width="5"/>',
  };
  const ring = (st) => (RING[st] ? `<svg class="ring" viewBox="0 0 100 100" aria-hidden="true">${RING[st]}</svg>` : '');
  let html = '';
  cur.units.forEach((u, ui) => {
    const color = UNIT_COLORS[ui % UNIT_COLORS.length];
    const ids = u.lessons.map((_, i) => `${u.id}-${i + 1}`);
    const ready = ids.filter((id) => LESSONS[id]);
    const done = ready.filter((id) => progress.isDone(id)).length;
    html += `<section class="unit" id="unit-${u.id}" style="--uc:${color}">
      <header class="unit-head"><div><small>${u.class} · Unit ${ui + 1}</small><h3>${esc(u.title)}</h3></div>
        <div class="unit-count">${ready.length ? `${done}/${ready.length}` : 'Soon'}</div></header>
      <div class="path">`;
    u.lessons.forEach((title, i) => {
      const id = ids[i], info = LESSONS[id];
      const state = !info ? 'soon' : progress.isDone(id) ? (progress.isDue(id) ? 'due' : 'done') : id === next ? 'next' : 'open';
      const x = Math.round(Math.sin((i + ui * 2) * 0.9) * 70); // the winding path
      const icon = state === 'done' ? ICON.done : state === 'due' ? ICON.redo : state === 'soon' ? ICON.lock : info.shorts ? ICON.play : ICON.book;
      html += `<div class="node-row" style="--x:${x}px">
        <button class="node ${state}" data-lesson="${id}" ${state === 'soon' ? 'aria-disabled="true"' : ''} aria-label="${esc(title)}${state === 'soon' ? ' (coming soon)' : state === 'due' ? ' (review due)' : ''}">
          ${state === 'next' ? '<span class="start">START</span>' : state === 'due' ? '<span class="start review">REVIEW</span>' : ''}${ring(state)}<span class="disc">${icon}</span></button>
        <span class="node-label ${state}">${esc(title)}</span></div>`;
    });
    const cpState = progress.isDone(`cp:${u.id}`) ? 'done' : ready.length && ready.every((id) => progress.isDone(id)) ? 'next' : 'soon';
    html += `<div class="node-row" style="--x:0px"><button class="node checkpoint ${cpState}" data-checkpoint="${u.id}" aria-label="Unit ${ui + 1} checkpoint${cpState === 'soon' ? ' (finish the lessons first)' : ''}">${cpState === 'next' ? '<span class="start">CHECKPOINT</span>' : ''}<span class="disc">${cpState === 'done' ? ICON.done : ICON.trophy}</span></button><span class="node-label ${cpState}">Unit checkpoint</span></div>`;
    html += '</div></section>';
  });
  el.innerHTML = `<div class="map">${html}<div class="map-end">More lessons are added every week. 💪</div></div>`;
  // Bring the next lesson into view.
  const n = el.querySelector('.node.next');
  if (n) requestAnimationFrame(() => n.scrollIntoView({ block: 'center' }));
}

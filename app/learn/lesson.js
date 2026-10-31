// A lesson: watch the shorts, read the note, then check yourself with a few questions.
import { NOTES } from '../data/notes.js';
import { LESSONS, curriculum } from './content.js';
import { progress } from './store.js';
import { TIPS } from './guide.js';
import { mountShorts, SHORTS_CSS } from '../anim/shorts.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let BANK = null;
export const bank = async () => (BANK ||= await (await fetch('data/questions.json')).json());
const SHORTS = {};
export async function shortsFor(subject) {
  if (!SHORTS[subject]) { try { SHORTS[subject] = (await import(`../shorts/${subject}.js`)).default; } catch { SHORTS[subject] = []; } }
  return SHORTS[subject];
}
export function injectShortsCSS() {
  if (document.getElementById('shorts-css')) return;
  const st = document.createElement('style'); st.id = 'shorts-css'; st.textContent = SHORTS_CSS; document.head.appendChild(st);
}
const shuffle = (a) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

// Questions for a set of lessons: each short's quick check, plus question-bank questions on the same topic.
async function questionsFor(subject, ids, max) {
  const all = await shortsFor(subject), B = await bank();
  const names = Object.fromEntries(B.subjects.flatMap((x) => x.topics.map((t) => [t.id, t.name])));
  const qs = [];
  for (const id of ids) {
    const info = LESSONS[id]; if (!info) continue;
    (info.shorts || []).forEach((sid) => { const s = all.find((x) => x.id === sid); if (s?.quiz) qs.push({ id: `short:${sid}`, ...s.quiz, subject, topic: info.topic, topicName: names[info.topic], lesson: id }); });
    if (info.topic) shuffle(B.questions.filter((q) => q.topic === info.topic)).slice(0, max).forEach((q) => qs.push({ id: q.id, q: q.question, options: q.options, answer: q.answer, why: q.explanation, subject: q.subject || subject, topic: q.topic, topicName: names[q.topic], lesson: id }));
  }
  return shuffle(qs).slice(0, max);
}

function noteHTML(n) {
  return `<article class="lnote">
    <div class="lnote-k">${n.mins} min read</div>
    <h2>${esc(n.title)}</h2>
    <p class="lnote-intro">${esc(n.intro)}</p>
    ${n.points.map(([h, p]) => `<div class="lpoint"><b>${esc(h)}</b><p>${esc(p)}</p></div>`).join('')}
    ${n.formulas?.length ? `<h4>${n.subject === 'chemistry' ? 'Equations' : 'Formulas'}</h4><div class="lforms">${n.formulas.map(([k, v]) => `<div class="lform"><small>${esc(k)}</small><div>${esc(v)}</div></div>`).join('')}</div>` : ''}
    ${n.example ? `<div class="lex"><div class="lnote-k">Worked example</div><b>${esc(n.example.q)}</b><ol>${n.example.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol></div>` : ''}
    ${n.trap ? `<div class="ltrap"><b>Common trap</b><p>${esc(n.trap)}</p></div>` : ''}
  </article>`;
}

// A short quiz. Calls done(score, total) at the end.
// Every question you got wrong: what you picked, the right answer, and why.
export function corrections(results) {
  const bad = (results || []).filter((r) => !r.ok);
  if (!bad.length) return '';
  return `<div class="lcorr"><b>Review your mistakes (${bad.length})</b>${bad.map(({ q, k }) => `<div class="lc-i"><p>${esc(q.q)}</p><div class="lc-x"><i>✗</i><span>You picked: ${esc(q.options[k])}</span></div><div class="lc-v"><i>✓</i><span>Correct: ${esc(q.options[q.answer])}</span></div><small>${esc(q.why)}</small></div>`).join('')}</div>`;
}

export function runQuiz(el, qs, done) {
  let i = 0, score = 0;
  const results = [];
  const show = () => {
    const q = qs[i];
    el.innerHTML = `<div class="lquiz">
      <div class="lquiz-n">Question ${i + 1} of ${qs.length}</div>
      <div class="lquiz-q">${esc(q.q)}</div>
      <div class="lquiz-o">${q.options.map((o, k) => `<button data-k="${k}"><i>${'ABCD'[k]}</i><span>${esc(o)}</span></button>`).join('')}</div>
      <div class="lquiz-why" hidden></div></div>`;
    el.querySelectorAll('.lquiz-o button').forEach((b) => b.addEventListener('click', () => {
      const k = +b.dataset.k, ok = k === q.answer;
      if (ok) score++;
      results.push({ q, ok, k });
      progress.answer(q.id, ok, q);
      el.querySelectorAll('.lquiz-o button').forEach((x, j) => { x.disabled = true; x.classList.toggle('right', j === q.answer); x.classList.toggle('wrong', j === k && !ok); });
      const w = el.querySelector('.lquiz-why');
      w.hidden = false; w.className = 'lquiz-why ' + (ok ? 'ok' : 'no');
      w.innerHTML = `<b>${ok ? 'Correct! 🎉' : 'Not quite.'}</b> ${esc(q.why)}`;
      footer(i < qs.length - 1 ? 'Next question' : 'See my score', () => { i++; i < qs.length ? show() : done(score, qs.length, results); });
    }));
    footer(null);
  };
  let footer = () => {};
  return { start(f) { footer = f; show(); } };
}

export async function renderLesson(root, subject, id, { back }) {
  const cur = await curriculum(subject);
  const isCheckpoint = id.startsWith('cp:');
  const unit = cur.units.find((u) => (isCheckpoint ? u.id === id.slice(3) : id.startsWith(u.id + '-') && /^\d+$/.test(id.slice(u.id.length + 1))));
  const title = isCheckpoint ? `${unit.title}: assessment` : unit.lessons[+id.split('-').pop() - 1];
  const info = LESSONS[id] || {};
  const review = !isCheckpoint && progress.isDone(id) && progress.isDue(id); // a quick memory check, quiz only
  const steps = [];
  if (!isCheckpoint && !review) {
    if (info.shorts?.length) steps.push({ k: 'watch', label: 'Watch' });
    if (info.note && NOTES[info.note]) steps.push({ k: 'read', label: 'Read' });
  }
  const ids = isCheckpoint ? unit.lessons.map((_, i) => `${unit.id}-${i + 1}`) : [id];
  const qs = await questionsFor(subject, ids, isCheckpoint ? 10 : 5);
  if (isCheckpoint && qs.length) steps.push({ k: 'intro', label: 'Gate' });
  if (qs.length) steps.push({ k: 'check', label: isCheckpoint ? 'Assessment' : review ? 'Review' : 'Check' });

  root.innerHTML = `<div class="lesson">
    <header class="lesson-top"><button class="lesson-x" aria-label="Close">✕</button>
      <div class="lesson-bar">${steps.map((s) => `<i data-s="${s.k}"><b></b></i>`).join('')}</div></header>
    <div class="lesson-title"><small>${esc(unit.title)}</small><div>${esc(title)}</div></div>
    <main class="lesson-body"></main>
    <footer class="lesson-foot"><button class="btn-go" hidden></button></footer></div>`;
  const body = root.querySelector('.lesson-body'), go = root.querySelector('.btn-go');
  let cleanup = null;
  const footer = (label, fn) => { go.hidden = !label; if (label) { go.textContent = label; go.onclick = fn; } };
  root.querySelector('.lesson-x').onclick = () => { cleanup?.(); back(); };

  const step = async (n) => {
    cleanup?.(); cleanup = null;
    root.querySelectorAll('.lesson-bar i').forEach((b, j) => b.classList.toggle('on', j <= n));
    body.scrollTop = 0;
    const s = steps[n];
    const nextLabel = n < steps.length - 1 ? `Continue: ${steps[n + 1].label}` : 'Finish lesson';
    const next = () => (n < steps.length - 1 ? step(n + 1) : finish(null));
    if (!s) return finish(null);
    body.className = 'lesson-body ' + s.k;
    if (s.k === 'watch') {
      injectShortsCSS();
      const all = await shortsFor(subject);
      const list = info.shorts.map((sid) => all.find((x) => x.id === sid)).filter(Boolean);
      body.innerHTML = '<div class="lesson-feed"></div>';
      cleanup = mountShorts(body.firstChild, list, { onNote: () => step(steps.findIndex((x) => x.k === 'read')), onPractise: () => step(steps.findIndex((x) => x.k === 'check')) });
      footer(nextLabel, next);
    } else if (s.k === 'intro') {
      const stopNo = cur.units.indexOf(unit) + 1;
      body.innerHTML = `<div class="gate-intro"><div class="gate-art"><span class="gate-bar"></span><span class="gate-badge"><svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#1C1917" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/></svg></span></div>
        <h2>Open the road to Stop ${stopNo + 1}</h2><p>${qs.length} questions on ${esc(unit.title)}. Pass and the gate lifts.</p>
        <ul class="gate-rules"><li><b>${qs.length}</b><span>JAMB-style questions mixed from every lesson in this stop</span></li><li><b>${Math.ceil(qs.length * 0.7)}</b><span>correct to pass. Miss it and you see what to fix, then try again</span></li><li><b>+30</b><span>XP, plus the Unit master badge</span></li></ul></div>`;
      footer('Start assessment', () => step(n + 1));
    } else if (s.k === 'read') {
      body.innerHTML = noteHTML(NOTES[info.note]) + `<div class="ltip">${TIPS.read}</div>`;
      footer(nextLabel, next);
    } else {
      const quiz = runQuiz(body, qs, (score, total, results) => finish({ score, total, results }));
      quiz.start(footer);
      body.insertAdjacentHTML('afterbegin', `<div class="ltip">${review ? TIPS.review : TIPS.check}</div>`);
    }
  };

  // Score per lesson after an assessment, with the weakest lesson called out.
  const breakdown = (results) => {
    const by = {};
    results.forEach(({ q, ok }) => { const b = (by[q.lesson] ||= { right: 0, n: 0 }); b.n++; if (ok) b.right++; });
    const rows = Object.entries(by).map(([lid, b]) => ({ name: unit.lessons[+lid.split('-').pop() - 1] || lid, ...b }));
    const worst = rows.filter((r) => r.right < r.n).sort((a, b) => a.right / a.n - b.right / b.n)[0];
    return `<div class="lbreak"><b>Your score by lesson</b>${rows.map((r) => `<div class="lb-row"><span>${esc(r.name)}</span><div class="lb-bar"><i style="width:${Math.round((r.right / r.n) * 100)}%;background:${r.right === r.n ? '#22C55E' : r.right / r.n >= 0.5 ? '#F59E0B' : '#F97316'}"></i></div><small>${r.right}/${r.n}</small></div>`).join('')}${worst ? `<p>Revisit <b>${esc(worst.name)}</b>. It will come back as a review.</p>` : ''}</div>`;
  };
  const finish = (res) => {
    cleanup?.(); cleanup = null;
    const pass = !res || res.score / res.total >= (isCheckpoint ? 0.7 : 0.5);
    const perfect = !!res && res.score === res.total;
    const r = pass ? progress.complete(id, { xp: isCheckpoint ? 30 : 10, perfect, checkpoint: isCheckpoint, review }) : null;
    root.querySelectorAll('.lesson-bar i').forEach((b) => b.classList.add('on'));
    body.className = 'lesson-body done';
    const goal = progress.dailyXP() >= progress.goal();
    body.innerHTML = `<div class="ldone ${pass ? 'pass' : 'retry'}">
      ${pass ? '<div class="lcf">' + Array.from({ length: 24 }, (_, k) => `<i style="--k:${k}"></i>`).join('') + '</div>' : ''}
      <div class="ldone-big">${pass ? (perfect ? '🌟' : '🎉') : '💪'}</div>
      <h2>${pass ? (review ? 'Memory refreshed!' : isCheckpoint ? 'Gate open!' : 'Lesson complete!') : 'Almost there!'}</h2>
      ${res ? `<div class="ldone-score">${res.score} / ${res.total} correct${perfect ? ' · perfect!' : ''}</div>` : ''}
      ${isCheckpoint && res?.results ? breakdown(res.results) : ''}
      ${res?.results ? corrections(res.results) : ''}
      ${pass ? `<div class="lreward"><span>⚡ +${r.xp} XP</span><span>🔥 ${progress.streak()} day streak</span>${goal ? '<span>🎯 Daily goal reached</span>' : ''}</div>
        ${r.levelUp ? `<div class="lvl">⬆️ Level ${r.levelUp.n}: ${r.levelUp.name}</div>` : ''}
        ${r.badges.map((b) => `<div class="lbadge"><i>${b.icon}</i><div><b>${esc(b.name)}</b><small>${esc(b.desc)}</small></div></div>`).join('')}`
        : '<p>Read the note again and have another go. You will get it.</p>'}</div>`;
    footer(pass ? 'Back home' : 'Try again', pass ? back : () => step(0));
  };

  if (!steps.length) {
    body.innerHTML = '<div class="ldone"><div class="ldone-big">🛠️</div><h2>Coming soon</h2><p>This lesson is still being written.</p></div>';
    footer('Back home', back);
  } else step(0);
  return () => cleanup?.();
}

// Practice: 10 questions on one question-bank topic.
export async function renderPractice(root, topic, { back }) {
  const B = await bank();
  const t = B.subjects.flatMap((s) => s.topics).find((x) => x.id === topic);
  const qs = shuffle(B.questions.filter((q) => q.topic === topic)).slice(0, 10).map((q) => ({ id: q.id, q: q.question, options: q.options, answer: q.answer, why: q.explanation, subject: q.subject, topic: q.topic, topicName: t?.name }));
  root.innerHTML = `<div class="lesson"><header class="lesson-top"><button class="lesson-x" aria-label="Close">✕</button><div class="lesson-bar"><i class="on"><b></b></i></div></header>
    <div class="lesson-title"><small>Practice</small><div>${esc(t?.name || topic)}</div></div><main class="lesson-body check"></main><footer class="lesson-foot"><button class="btn-go" hidden></button></footer></div>`;
  const body = root.querySelector('.lesson-body'), go = root.querySelector('.btn-go');
  root.querySelector('.lesson-x').onclick = back;
  const footer = (label, fn) => { go.hidden = !label; if (label) { go.textContent = label; go.onclick = fn; } };
  runQuiz(body, qs, (score, total, results) => {
    body.innerHTML = `<div class="ldone pass"><div class="ldone-big">${score / total >= 0.7 ? '🏆' : '📚'}</div><h2>${score} / ${total}</h2><p>${score / total >= 0.7 ? 'Great work! Keep the streak going.' : 'Review the note for this topic, then try again.'}</p>${corrections(results)}</div>`;
    footer('Done', back);
  }).start(footer);
}

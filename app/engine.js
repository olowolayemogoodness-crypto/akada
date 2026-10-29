// Learning engine: builds exams, scores them, tracks mastery per topic and makes study plans.
export const SUBJECT_ORDER = ['english', 'physics', 'chemistry', 'mathematics'];
const RUSHED_MS = 8000;
const SLOW_MS = 90000;

let BANK = null;
export async function loadBank() {
  if (!BANK) BANK = await (await fetch('./data/questions.json')).json();
  return BANK;
}
export const bank = () => BANK;
export const subjectName = (id) => BANK.subjects.find((s) => s.id === id)?.name || id;
export const topicName = (id) => { for (const s of BANK.subjects) for (const t of s.topics) if (t.id === id) return t.name; return id; };
export const topicSubject = (id) => BANK.subjects.find((s) => s.topics.some((t) => t.id === id))?.id;
export const allTopics = () => BANK.subjects.flatMap((s) => s.topics.map((t) => ({ ...t, subject: s.id })));

function shuffle(a, seed = Date.now()) {
  let s = seed % 2147483647 || 1;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; }
  return b;
}

// ---------------------------------------------------------------- mastery
// Recent answers count more. With no answers a topic is "new".
export function topicStats(progress, topic) {
  const att = progress.attempts.filter((a) => a.topic === topic);
  if (!att.length) return { p: null, n: 0 };
  let w = 1, sw = 0, sc = 0;
  for (let i = att.length - 1; i >= 0; i--) { sw += w; sc += att[i].correct ? w : 0; w *= 0.93; }
  return { p: (sc + 1) / (sw + 2), n: att.length };
}
export function level(p) {
  if (p == null) return { id: 'new', label: 'Not tried', color: '#D6D3D1' };
  if (p >= 0.7) return { id: 'strong', label: 'Strong', color: '#22C55E' };
  if (p >= 0.45) return { id: 'mid', label: 'Getting there', color: '#F59E0B' };
  return { id: 'weak', label: 'Weak', color: '#F97316' };
}
export function subjectMastery(progress, subject) {
  const ps = BANK.subjects.find((s) => s.id === subject).topics.map((t) => topicStats(progress, t.id).p).filter((p) => p != null);
  return ps.length ? ps.reduce((a, b) => a + b, 0) / ps.length : null;
}
export function averageMockScore(progress) {
  const mocks = progress.exams.filter((e) => e.mode === 'mock');
  if (!mocks.length) return null;
  // Average of every full mock, scaled to four subjects (out of 400).
  const per = mocks.map((e) => (e.total / (e.subjects.length * 100)) * 400);
  return { score: Math.round(per.reduce((a, b) => a + b, 0) / per.length), count: mocks.length };
}
export function weakestTopics(progress, k = 3) {
  return allTopics()
    .map((t) => ({ ...t, ...topicStats(progress, t.id) }))
    .filter((t) => t.p != null)
    .sort((a, b) => a.p - b.p)
    .slice(0, k);
}
export function streak(progress) {
  const days = new Set(progress.exams.map((e) => new Date(e.at).toDateString()));
  let n = 0;
  const d = new Date();
  if (!days.has(d.toDateString())) d.setDate(d.getDate() - 1);
  while (days.has(d.toDateString())) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

// ---------------------------------------------------------------- exams
export function buildExam(progress, { mode, subjects, topic, timer, instant }) {
  const qs = BANK.questions;
  let list = [];
  let order = SUBJECT_ORDER.filter((s) => subjects.includes(s));
  if (mode === 'mock') {
    for (const s of order) list.push(...shuffle(qs.filter((q) => q.subject === s)));
  } else if (mode === 'topic') {
    list = shuffle(qs.filter((q) => q.topic === topic));
    order = [topicSubject(topic)];
  } else {
    // Quick quiz: 20 questions, weighted towards weaker topics.
    const pool = qs.filter((q) => order.includes(q.subject)).map((q) => {
      const p = topicStats(progress, q.topic).p;
      return { q, w: (p == null ? 0.6 : 1 - p) + 0.15 + Math.random() * 0.5 };
    });
    list = pool.sort((a, b) => b.w - a.w).slice(0, 20).map((x) => x.q);
    list = order.flatMap((s) => list.filter((q) => q.subject === s));
  }
  const seconds = mode === 'mock' ? list.length * 36 : mode === 'quick' ? 15 * 60 : list.length * 60;
  return {
    id: 'ex' + Date.now(), mode, subjects: order, topic: topic || null,
    instant: mode !== 'mock' && instant, timer,
    questions: list.map((q) => q.id), startedAt: Date.now(),
    deadline: timer ? Date.now() + seconds * 1000 : null, seconds,
    answers: {}, // qid → {choice, first, ms, changes, flagged}
  };
}
export const qById = (id) => BANK.questions.find((q) => q.id === id);

// ---------------------------------------------------------------- results
export function reasonFor(q, a) {
  if (!a || a.choice == null) return 'Skipped';
  if (a.choice === q.answer) return null;
  if (a.first === q.answer) return 'Changed a right answer';
  if (a.ms < RUSHED_MS) return 'Rushed';
  if (a.ms > SLOW_MS) return 'Ran out of steam';
  return 'Concept gap';
}

export function scoreExam(exam) {
  const per = {}, topics = {};
  let rushedWrong = 0, slowCalc = { ms: 0, n: 0 }, changedRight = 0, changedWrong = 0, totalMs = 0, answered = 0;
  for (const id of exam.questions) {
    const q = qById(id), a = exam.answers[id];
    const ok = a && a.choice === q.answer;
    per[q.subject] ??= { right: 0, total: 0, ms: 0 };
    per[q.subject].total++; if (ok) per[q.subject].right++;
    topics[q.topic] ??= { topic: q.topic, subject: q.subject, right: 0, total: 0, reasons: {} };
    const t = topics[q.topic];
    t.total++; if (ok) t.right++;
    const r = reasonFor(q, a);
    if (r) t.reasons[r] = (t.reasons[r] || 0) + 1;
    if (a) {
      totalMs += a.ms || 0; per[q.subject].ms += a.ms || 0;
      if (a.choice != null) answered++;
      if (r === 'Rushed') rushedWrong++;
      if (a.changes > 0 && a.first != null) {
        if (a.first !== q.answer && ok) changedRight++;
        if (a.first === q.answer && !ok) changedWrong++;
      }
      if (q.subject === 'physics' || q.subject === 'mathematics' || q.subject === 'chemistry') { slowCalc.ms += a.ms || 0; slowCalc.n++; }
    }
  }
  const subjects = exam.subjects.map((s) => {
    const p = per[s] || { right: 0, total: 0, ms: 0 };
    return { id: s, right: p.right, total: p.total, score: p.total ? Math.round((p.right / p.total) * 100) : 0, avgMs: p.total ? p.ms / p.total : 0 };
  });
  const topicList = Object.values(topics).map((t) => {
    const reason = Object.entries(t.reasons).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
    return { ...t, pct: Math.round((t.right / t.total) * 100), reason };
  }).sort((a, b) => a.pct - b.pct);
  const total = subjects.reduce((s, x) => s + x.score, 0);
  return {
    subjects, topics: topicList, total, max: subjects.length * 100,
    answered, count: exam.questions.length,
    avgMs: exam.questions.length ? totalMs / exam.questions.length : 0,
    calcAvgMs: slowCalc.n ? slowCalc.ms / slowCalc.n : 0,
    rushedWrong, changedRight, changedWrong,
    durationMs: (exam.finishedAt || Date.now()) - exam.startedAt,
  };
}

// Record answers into the learning history and keep the exam summary.
export function commitExam(progress, exam, result) {
  for (const id of exam.questions) {
    const q = qById(id), a = exam.answers[id];
    if (!a || a.choice == null) continue;
    progress.attempts.push({ qid: id, subject: q.subject, topic: q.topic, correct: a.choice === q.answer, ms: a.ms, at: exam.finishedAt });
  }
  progress.exams.push({
    id: exam.id, at: exam.finishedAt, mode: exam.mode, subjects: exam.subjects, topic: exam.topic,
    total: result.total, max: result.max, per: Object.fromEntries(result.subjects.map((s) => [s.id, s.score])),
    durationMs: result.durationMs, answers: exam.answers, questions: exam.questions,
  });
  if (progress.attempts.length > 5000) progress.attempts = progress.attempts.slice(-5000);
  if (progress.exams.length > 60) progress.exams = progress.exams.slice(-60);
}

export function studyPlan(result) {
  const weak = result.topics.filter((t) => t.total >= 3 && t.pct < 70).slice(0, 3);
  return weak.map((t, i) => ({ day: i + 1, topic: t.topic, subject: t.subject, reason: t.reason }));
}

export function reasonText(r) {
  return {
    'Concept gap': 'the idea needs another look',
    'Rushed': 'answered too fast',
    'Changed a right answer': 'changed a right answer',
    'Skipped': 'left unanswered',
    'Ran out of steam': 'spent a long time',
  }[r] || '';
}

// ---------------------------------------------------------------- learner profile
// Reads the whole study history and works out how this student learns: where they are
// strong or weak, why they lose marks, how speed and second thoughts affect them, when
// they study best and whether they fade towards the end of a section.
const pctOf = (r, n) => (n ? Math.round((r / n) * 100) : null);
const accOf = (xs) => pctOf(xs.filter((a) => a.correct).length, xs.length);
const avgMsOf = (xs) => (xs.length ? xs.reduce((s, a) => s + (a.ms || 0), 0) / xs.length : 0);
const PARTS = [['morning', 5, 12], ['afternoon', 12, 17], ['evening', 17, 21], ['night', 21, 29]];

export function learnerProfile(progress) {
  const at = progress.attempts;
  const n = at.length;
  const fast = at.filter((a) => a.ms && a.ms < RUSHED_MS), calm = at.filter((a) => a.ms >= RUSHED_MS);
  const subjects = SUBJECT_ORDER.map((s) => { const xs = at.filter((a) => a.subject === s); return { id: s, name: subjectName(s), n: xs.length, acc: accOf(xs), avgMs: avgMsOf(xs) }; });
  const topics = allTopics().map((t) => {
    const xs = at.filter((a) => a.topic === t.id), st = topicStats(progress, t.id);
    let trend = null;
    if (xs.length >= 8) { const h = Math.floor(xs.length / 2); trend = { from: accOf(xs.slice(0, h)), to: accOf(xs.slice(-h)) }; }
    return { id: t.id, name: t.name, subject: t.subject, p: st.p, n: st.n, acc: accOf(xs), level: level(st.p), trend, avgMs: avgMsOf(xs) };
  });

  // From the saved exams: reasons for each miss, changed answers, and early vs late in a section.
  const reasons = {}, topicReasons = {};
  let toWrong = 0, toRight = 0;
  const early = [0, 0], late = [0, 0];
  for (const e of progress.exams) {
    const blocks = {};
    (e.questions || []).forEach((id) => { const q = qById(id); if (q) (blocks[q.subject] ||= []).push(q); });
    for (const qs of Object.values(blocks)) {
      qs.forEach((q, i) => {
        const a = e.answers?.[q.id];
        const r = reasonFor(q, a);
        if (r) { reasons[r] = (reasons[r] || 0) + 1; (topicReasons[q.topic] ||= {})[r] = (topicReasons[q.topic][r] || 0) + 1; }
        if (a && a.changes > 0 && a.first != null && a.choice != null) {
          if (a.first === q.answer && a.choice !== q.answer) toWrong++;
          else if (a.first !== q.answer && a.choice === q.answer) toRight++;
        }
        if (qs.length >= 10 && a && a.choice != null) {
          const b = i < qs.length * 0.4 ? early : i >= qs.length * 0.7 ? late : null;
          if (b) { b[1]++; if (a.choice === q.answer) b[0]++; }
        }
      });
    }
  }
  const fatigue = early[1] >= 12 && late[1] >= 12 ? { early: pctOf(...early), late: pctOf(...late) } : null;

  const byPart = PARTS.map(([id, from, to]) => {
    const xs = at.filter((a) => { let h = new Date(a.at).getHours(); if (h < 5) h += 24; return h >= from && h < to; });
    return { id, n: xs.length, acc: accOf(xs) };
  }).filter((x) => x.n >= 15);

  const mocks = progress.exams.filter((e) => e.mode === 'mock').map((e) => Math.round((e.total / (e.subjects.length * 100)) * 400));
  const days14 = new Set(progress.exams.filter((e) => Date.now() - e.at < 14 * 864e5).map((e) => new Date(e.at).toDateString())).size;
  const recentWrong = at.filter((a) => !a.correct).slice(-5).reverse().map((a) => ({ ...a, q: qById(a.qid) })).filter((x) => x.q);

  const tried = topics.filter((t) => t.p != null).sort((a, b) => a.p - b.p);
  const prof = {
    n, acc: accOf(at), avgMs: avgMsOf(at), exams: progress.exams.length, mocks, days14,
    speed: { fastN: fast.length, fastAcc: accOf(fast), calmAcc: accOf(calm), rushShare: n ? fast.length / n : 0 },
    changes: { toWrong, toRight }, fatigue, byPart, reasons, topicReasons, subjects, topics,
    weak: tried.filter((t) => t.p < 0.6).slice(0, 3), strong: tried.filter((t) => t.p >= 0.7).reverse().slice(0, 3),
    untried: topics.filter((t) => t.p == null), recentWrong,
  };
  prof.type = learnerType(prof);
  prof.insights = insights(prof);
  return prof;
}

// A one-line description of how this student learns.
export function learnerType(p) {
  if (p.n < 15) return { id: 'new', name: 'Just getting started', text: 'Answer a few more questions and Edu will work out how you learn.', tip: 'Take a full mock exam. It gives Edu the most to learn from.' };
  const { speed, changes, fatigue } = p;
  if (speed.rushShare > 0.2 && speed.fastN >= 6 && speed.fastAcc != null && speed.calmAcc != null && speed.fastAcc < speed.calmAcc - 15)
    return { id: 'rusher', name: 'Quick, but rushes', text: `You answer fast, but your quick answers (under 8 seconds) are right only ${speed.fastAcc}% of the time, against ${speed.calmAcc}% when you take your time.`, tip: 'Read the whole question and every option before you tap. Count to five.' };
  if (changes.toWrong >= 3 && changes.toWrong > changes.toRight * 1.5)
    return { id: 'doubter', name: 'Second-guesser', text: `You changed ${changes.toWrong} right answers to wrong ones, and only ${changes.toRight} wrong ones to right.`, tip: 'Only change an answer when you find a clear mistake in your working, not because of a feeling.' };
  if (fatigue && fatigue.early - fatigue.late >= 15)
    return { id: 'fader', name: 'Strong starter, fades later', text: `You get ${fatigue.early}% right early in a section, but only ${fatigue.late}% near the end.`, tip: 'Practise full timed mocks to build stamina, and take a 10-second breath between sections.' };
  if (p.avgMs > 60000)
    return { id: 'careful', name: 'Careful and slow', text: `You spend about ${Math.round(p.avgMs / 1000)} seconds per question. JAMB gives you about 36.`, tip: 'Do quick quizzes with the timer on, and skip and flag hard questions to come back to.' };
  const ps = p.topics.filter((t) => t.p != null).map((t) => t.p);
  if (ps.length >= 4 && Math.max(...ps) - Math.min(...ps) > 0.4)
    return { id: 'uneven', name: 'Strong in some topics, shaky in others', text: 'Your scores swing a lot between topics. Fixing the weak ones is the fastest way to raise your total.', tip: 'Spend most of your time on your bottom three topics this week.' };
  return { id: 'steady', name: 'Steady learner', text: `You are consistent, with ${p.acc}% right overall.`, tip: 'Keep a daily streak and push your strong topics to 90%.' };
}

// Plain-English patterns Edu has noticed, most important first. `ask` is what to ask Edu about it.
export function insights(p) {
  const out = [];
  if (p.n < 15) return out;
  const { speed, changes, fatigue } = p;
  if (speed.fastN >= 6 && speed.fastAcc != null && speed.calmAcc != null && speed.calmAcc - speed.fastAcc >= 15)
    out.push({ w: speed.calmAcc - speed.fastAcc, kind: 'speed', text: `Answers you give in under 8 seconds are right ${speed.fastAcc}% of the time. When you slow down, it's ${speed.calmAcc}%.`, ask: 'How do I stop rushing questions?' });
  if (changes.toWrong >= 2 && changes.toWrong > changes.toRight)
    out.push({ w: Math.min(40, 10 + changes.toWrong * 3), kind: 'doubt', text: `Second thoughts are costing you: ${changes.toWrong} right answers changed to wrong, ${changes.toRight} wrong to right.`, ask: 'When should I change an answer in an exam?' });
  if (fatigue && fatigue.early - fatigue.late >= 12)
    out.push({ w: fatigue.early - fatigue.late, kind: 'fatigue', text: `You get tired: ${fatigue.early}% right early in a section, ${fatigue.late}% near the end.`, ask: 'How can I keep my focus till the end of an exam?' });
  if (p.byPart.length >= 2) {
    const s = p.byPart.slice().sort((a, b) => b.acc - a.acc);
    if (s[0].acc - s.at(-1).acc >= 12) out.push({ w: s[0].acc - s.at(-1).acc, kind: 'time', text: `You do best in the ${s[0].id} (${s[0].acc}% right) and worst at ${s.at(-1).id === 'night' ? 'night' : 'in the ' + s.at(-1).id} (${s.at(-1).acc}%).`, ask: `Help me plan my study time. I do best in the ${s[0].id}.` });
  }
  const w = p.weak[0];
  if (w) {
    const r = Object.entries(p.topicReasons[w.id] || {}).sort((a, b) => b[1] - a[1])[0];
    out.push({ w: 30, kind: 'weak', topic: w.id, text: `${w.name} is your weakest topic (${Math.round(w.p * 100)}%)${r ? `, mostly from ${r[0] === 'Concept gap' ? 'not knowing the idea' : r[0].toLowerCase()}` : ''}.`, ask: `Why do I keep getting ${w.name.toLowerCase()} questions wrong, and how do I fix it?` });
  }
  const slowSub = p.subjects.filter((s) => s.n >= 10 && s.avgMs > 55000).sort((a, b) => b.avgMs - a.avgMs)[0];
  if (slowSub) out.push({ w: 14, kind: 'slow', text: `${slowSub.name} takes you ${Math.round(slowSub.avgMs / 1000)} seconds a question. The real exam allows about 36.`, ask: `How can I answer ${slowSub.name.toLowerCase()} questions faster?` });
  const up = p.topics.filter((t) => t.trend && t.trend.to - t.trend.from >= 15).sort((a, b) => (b.trend.to - b.trend.from) - (a.trend.to - a.trend.from))[0];
  if (up) out.push({ w: 12, kind: 'up', topic: up.id, text: `${up.name} is improving: ${up.trend.from}% to ${up.trend.to}%. Keep going!`, ask: `What should I learn next in ${up.name.toLowerCase()}?` });
  const down = p.topics.filter((t) => t.trend && t.trend.from - t.trend.to >= 15)[0];
  if (down) out.push({ w: 20, kind: 'down', topic: down.id, text: `${down.name} is slipping: ${down.trend.from}% down to ${down.trend.to}%.`, ask: `I'm getting worse at ${down.name.toLowerCase()}. What should I revise?` });
  if (p.mocks.length >= 2) {
    const d = p.mocks.at(-1) - p.mocks.at(-2);
    if (Math.abs(d) >= 10) out.push({ w: 11, kind: d > 0 ? 'up' : 'down', text: d > 0 ? `Your last mock was ${d} marks higher than the one before.` : `Your last mock dropped ${-d} marks.`, ask: d > 0 ? 'How do I keep improving my mock score?' : 'Why did my mock score drop?' });
  }
  if (p.untried.length && p.untried.length <= 8) out.push({ w: 8, kind: 'gap', topic: p.untried[0].id, text: `You haven't tried ${p.untried.length === 1 ? p.untried[0].name : `${p.untried.length} topics yet, like ${p.untried[0].name}`}.`, ask: `Teach me the basics of ${p.untried[0].name.toLowerCase()}.` });
  return out.sort((a, b) => b.w - a.w).slice(0, 5);
}

// The profile as short text for the AI tutor.
export function profileText(p, { name, days } = {}) {
  const pc = (x) => (x == null ? 'not tried' : `${Math.round(x * 100)}%`);
  const L = [];
  L.push(`Student: ${name || 'the student'}.${days ? ` JAMB is in ${days} days.` : ''}`);
  if (!p.n) { L.push('No questions answered yet. Encourage them to take a mock exam or a quick quiz first.'); return L.join('\n'); }
  L.push(`Answered ${p.n} questions, ${p.acc}% right, in ${p.exams} exams. Studied on ${p.days14} of the last 14 days.`);
  if (p.mocks.length) L.push(`Full mock scores out of 400: ${p.mocks.slice(-5).join(', ')} (latest last).`);
  L.push(`Learning pattern: ${p.type.name}. ${p.type.text}`);
  L.push('Subjects: ' + p.subjects.filter((s) => s.n).map((s) => `${s.name} ${s.acc}% (${Math.round(s.avgMs / 1000)} s per question)`).join('; ') + '.');
  if (p.weak.length) L.push('Weakest topics: ' + p.weak.map((t) => `${t.name} ${pc(t.p)}`).join('; ') + '.');
  if (p.strong.length) L.push('Strongest topics: ' + p.strong.map((t) => `${t.name} ${pc(t.p)}`).join('; ') + '.');
  if (p.untried.length) L.push('Not tried yet: ' + p.untried.map((t) => t.name).join(', ') + '.');
  const r = Object.entries(p.reasons).sort((a, b) => b[1] - a[1]);
  if (r.length) L.push('Why marks are lost: ' + r.map(([k, v]) => `${k} ${v}`).join(', ') + '.');
  if (p.insights.length) L.push('Patterns noticed:\n' + p.insights.map((i) => `- ${i.text}`).join('\n'));
  if (p.recentWrong.length) L.push('Recent mistakes:\n' + p.recentWrong.slice(0, 3).map((x) => `- [${topicName(x.q.topic)}] ${x.q.question.slice(0, 110)} (answer: ${x.q.options[x.q.answer]})`).join('\n'));
  return L.join('\n');
}

// Pick a question for "Quiz me": never-seen first, then ones they got wrong.
export function pickQuizQuestion(progress, topic, avoid = []) {
  const pool = BANK.questions.filter((q) => q.topic === topic && !avoid.includes(q.id));
  if (!pool.length) return null;
  const hist = {};
  progress.attempts.forEach((a) => { if (a.topic === topic) hist[a.qid] = a.correct; });
  const score = (q) => (!(q.id in hist) ? 0 : hist[q.id] ? 2 : 1) + Math.random() * 0.9;
  return pool.sort((a, b) => score(a) - score(b))[0];
}

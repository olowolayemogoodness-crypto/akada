// Learner progress, XP, levels, streak, daily goal, badges and spaced review.
// Phone and website keep it in localStorage; the desktop app keeps it inside its own save file
// by calling progress.use({ read, write }).
const KEY = 'edu-progress-v1';
const DAY = 86400000;
const REVIEW_AFTER = [1, 3, 7, 14, 30]; // days until a finished lesson comes back for a quick check

const fresh = () => ({ done: {}, xp: 0, streak: { count: 0, last: '' }, answers: {}, daily: { date: '', xp: 0 }, goal: 20, badges: {}, reviews: {}, seenGuide: false, perfect: 0, days: {}, topics: {} });

export const LEVELS = ['Fresher', 'Scholar', 'Sharp', 'Ace', 'Champion', 'Distinction', 'Legend'];
export const BADGES = [
  { id: 'first', icon: '🌱', name: 'First step', desc: 'Finish your first lesson' },
  { id: 'five', icon: '📚', name: 'On a roll', desc: 'Finish 5 lessons' },
  { id: 'perfect', icon: '🎯', name: 'Sharp shooter', desc: 'Get every question right in a lesson' },
  { id: 'streak3', icon: '🔥', name: 'Three in a row', desc: 'Learn 3 days in a row' },
  { id: 'streak7', icon: '🏆', name: 'Week warrior', desc: 'Learn 7 days in a row' },
  { id: 'unit', icon: '⭐', name: 'Unit master', desc: 'Pass a unit checkpoint' },
  { id: 'xp100', icon: '⚡', name: 'Century', desc: 'Earn 100 XP' },
  { id: 'review', icon: '🔁', name: 'Memory keeper', desc: 'Pass a review lesson' },
];

const backend = {
  read() { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; } },
  write(o) { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch { /* private window: progress lasts this session */ } },
};
let io = backend;
let state = { ...fresh(), ...(io.read() || {}) };
const listeners = new Set(), answerHooks = new Set();
const save = () => { io.write(state); listeners.forEach((f) => { try { f(); } catch { /* a listener failed */ } }); };

const dayKey = (d = new Date()) => { const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000); return z.toISOString().slice(0, 10); };
const needFor = (n) => 20 * n * (n - 1); // total XP needed to reach level n

export const progress = {
  // The desktop app stores progress inside its own save file.
  use(adapter) { io = adapter; state = { ...fresh(), ...(io.read() || {}) }; },
  onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  onAnswer(fn) { answerHooks.add(fn); return () => answerHooks.delete(fn); },
  get: () => state,
  isDone: (id) => !!state.done[id],
  doneCount: () => Object.keys(state.done).length,

  streak() {
    const y = new Date(); y.setDate(y.getDate() - 1);
    return state.streak.last === dayKey() || state.streak.last === dayKey(y) ? state.streak.count : 0;
  },
  touch() {
    const today = dayKey();
    if (state.streak.last === today) return;
    const y = new Date(); y.setDate(y.getDate() - 1);
    state.streak.count = state.streak.last === dayKey(y) ? state.streak.count + 1 : 1;
    state.streak.last = today;
  },

  // ---- XP, levels, daily goal
  addXP(n) {
    state.xp += n;
    const today = dayKey();
    if (state.daily.date !== today) state.daily = { date: today, xp: 0 };
    state.daily.xp += n;
    state.days = state.days || {};
    state.days[today] = (state.days[today] || 0) + n;
    const keys = Object.keys(state.days).sort();
    while (keys.length > 60) delete state.days[keys.shift()];
  },
  // The last seven days, oldest first: { label, xp, today }.
  week() {
    const out = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      out.push({ label: i === 0 ? 'Today' : d.toLocaleDateString('en-GB', { weekday: 'short' }), xp: (state.days || {})[dayKey(d)] || 0, today: i === 0 });
    }
    return out;
  },
  dailyXP: () => (state.daily.date === dayKey() ? state.daily.xp : 0),
  goal: () => state.goal,
  setGoal(n) { state.goal = n; save(); },
  level() {
    let n = 1;
    while (state.xp >= needFor(n + 1)) n++;
    const from = needFor(n), to = needFor(n + 1);
    return { n, name: LEVELS[Math.min(n - 1, LEVELS.length - 1)], xp: state.xp, into: state.xp - from, need: to - from, pct: (state.xp - from) / (to - from) };
  },

  // ---- lessons
  // Returns what changed, so the lesson screen can celebrate it: { xp, levelUp, badges }.
  complete(id, { xp = 10, perfect = false, checkpoint = false, review = false } = {}) {
    const before = this.level().n, firstTime = !state.done[id];
    let gained = 0;
    if (firstTime) { state.done[id] = Date.now(); gained += xp + (perfect ? 5 : 0); }
    if (review) gained += 5;
    if (perfect) state.perfect++;
    this.addXP(gained);
    this.touch();
    const r = state.reviews[id] || { stage: -1, last: 0 };
    if (firstTime || review) { r.stage = Math.min(r.stage + 1, REVIEW_AFTER.length - 1); r.last = Date.now(); state.reviews[id] = r; }
    const badges = this._award({ checkpoint, perfect, review });
    save();
    return { xp: gained, levelUp: this.level().n > before ? this.level() : null, badges };
  },
  answer(qid, ok, q) {
    const a = state.answers[qid] || { right: 0, wrong: 0 };
    ok ? a.right++ : a.wrong++;
    state.answers[qid] = a;
    if (q?.topic) { state.topics = state.topics || {}; const t = state.topics[q.topic] || { right: 0, wrong: 0, name: q.topicName || q.topic }; ok ? t.right++ : t.wrong++; state.topics[q.topic] = t; }
    if (ok) this.addXP(2);
    this.touch();
    save();
    answerHooks.forEach((f) => { try { f(q || { id: qid }, ok); } catch { /* hook failed */ } });
  },

  // ---- spaced review: a finished lesson comes back after 1, 3, 7, 14, 30 days
  dueIn(id) {
    const r = state.reviews[id];
    if (!state.done[id] || !r) return null;
    return r.last + REVIEW_AFTER[Math.max(0, Math.min(r.stage, REVIEW_AFTER.length - 1))] * DAY - Date.now();
  },
  isDue(id) { const d = this.dueIn(id); return d != null && d <= 0; },
  dueList() { return Object.keys(state.done).filter((id) => this.isDue(id)); },

  // ---- badges
  _award(ctx) {
    const earned = [], has = (k) => !!state.badges[k], give = (k) => { if (!has(k)) { state.badges[k] = Date.now(); earned.push(BADGES.find((b) => b.id === k)); } };
    const n = this.doneCount();
    if (n >= 1) give('first');
    if (n >= 5) give('five');
    if (ctx.perfect) give('perfect');
    if (state.streak.count >= 3) give('streak3');
    if (state.streak.count >= 7) give('streak7');
    if (ctx.checkpoint) give('unit');
    if (state.xp >= 100) give('xp100');
    if (ctx.review) give('review');
    return earned;
  },
  hasBadge: (id) => !!state.badges[id],

  // How well each topic is remembered, weakest first: { id, name, pct }.
  topicMastery() {
    return Object.entries(state.topics || {}).map(([id, t]) => ({ id, name: t.name, pct: t.right / Math.max(1, t.right + t.wrong), n: t.right + t.wrong })).sort((a, b) => a.pct - b.pct);
  },
  accuracy() {
    let r = 0, w = 0;
    Object.values(state.answers).forEach((a) => { r += a.right; w += a.wrong; });
    return r + w ? Math.round((r / (r + w)) * 100) : null;
  },
  seenGuide: () => state.seenGuide,
  markGuideSeen() { state.seenGuide = true; save(); },
  reset() { state = fresh(); save(); },
};

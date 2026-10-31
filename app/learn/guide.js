// How to study with Edu: the routine, tips for each step, and "today's plan".
import { LESSONS } from './content.js';
import { progress } from './store.js';
import { nextUp } from './map.js';

export const ROUTINE = [
  { icon: '🎬', title: 'Watch', time: '2 min', text: 'Swipe through the shorts. Before each one ends, guess what happens next.' },
  { icon: '📖', title: 'Read', time: '5 min', text: 'Read the note slowly. Cover the page, then say the main idea out loud in your own words.' },
  { icon: '✅', title: 'Check', time: '3 min', text: 'Answer the questions. When you get one wrong, read the reason. That is where the learning happens.' },
  { icon: '🔁', title: 'Review', time: '1 min', text: 'Finished lessons come back after 1, 3, 7 and 14 days for a quick check. That is how you remember it on exam day.' },
];

export const TIPS = {
  watch: 'Tip: pause after each short and say what you just saw, in one sentence.',
  read: 'Tip: read the bold idea first, then the detail. Then close your eyes and say it back.',
  check: 'Tip: do not guess fast. If you are unsure, think first, then read the reason.',
  review: 'Tip: this is a quick check. Getting it right pushes the next review further away.',
};

export const MAP_GUIDE = [
  ['The path', 'Lessons run from the top down. Your next lesson has a START label.'],
  ['Gold ticks', 'A gold tick means you finished the lesson. A blue ring with R means a review is due.'],
  ['Checkpoint', 'The trophy at the end of a unit mixes questions from the whole unit. Pass it to move on in style.'],
  ['XP and streak', 'Every lesson earns XP. Learn every day to keep your streak. Reach your daily goal to fill the ring.'],
];

const title = (cur, id) => {
  for (const u of cur.units) for (let i = 0; i < u.lessons.length; i++) if (`${u.id}-${i + 1}` === id) return { unit: u.title, lesson: u.lessons[i] };
  return null;
};
export const lessonTitle = title;

// Up to three things to do today. `weak` is the weakest topics from the mock exams, if there are any.
export function todaysPlan(cur, weak = []) {
  const plan = [];
  const due = progress.dueList().filter((id) => title(cur, id));
  if (due.length) {
    const t = title(cur, due[0]);
    plan.push({ kind: 'review', icon: '🔁', head: due.length > 1 ? `Review ${due.length} lessons` : 'Review one lesson', sub: due.length > 1 ? `Start with: ${t.lesson}` : t.lesson, id: due[0] });
  }
  const next = nextUp(cur);
  if (next) {
    const t = title(cur, next);
    plan.push({ kind: 'next', icon: '▶️', head: progress.doneCount() ? 'Next lesson' : 'Start here', sub: `${t.lesson} · ${t.unit}`, id: next });
  }
  // A weak topic from the mock exams that has a lesson on the map
  for (const w of weak) {
    const id = Object.keys(LESSONS).find((k) => LESSONS[k].topic === w.id && title(cur, k));
    if (id && !plan.some((p) => p.id === id)) { plan.push({ kind: 'weak', icon: '🎯', head: `Fix a weak spot: ${w.name}`, sub: title(cur, id).lesson, id }); break; }
  }
  return plan.slice(0, 3);
}

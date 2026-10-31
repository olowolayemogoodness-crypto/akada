// What is ready to learn. The curriculum (app/data/curriculum/<subject>.json) lists every lesson;
// this file says which lessons already have a note, shorts or questions.
// Lesson ids are "<unit id>-<lesson number from 1>", e.g. "nonmetals-3".

export const SUBJECTS = [
  { id: 'chemistry', name: 'Chemistry', icon: '⚗️', color: '#F97316', ready: true },
  { id: 'physics', name: 'Physics', icon: '🧲', color: '#3B7DDD', ready: false },
  { id: 'mathematics', name: 'Mathematics', icon: '📐', color: '#16A34A', ready: false },
  { id: 'english', name: 'English', icon: '📝', color: '#9333EA', ready: false },
  { id: 'biology', name: 'Biology', icon: '🧬', color: '#DB2777', ready: false },
];

// note: key in data/notes.js · shorts: ids in shorts/<subject>.js · topic: question-bank topic for practice
export const LESSONS = {
  'mole-2': { note: 'mole', topic: 'mole' },
  'electrolysis-3': { note: 'electrochem', topic: 'electrochem' },
  'equilibrium-2': { note: 'equilibrium', topic: 'equilibrium' },
  'nonmetals-4': { note: 'hcl', shorts: ['chem-hcl-1', 'chem-hcl-2', 'chem-hcl-3'] },
  'qualitative-2': { note: 'cations', shorts: ['chem-ions-1', 'chem-ions-2', 'chem-ions-3'] },
  'organic1-3': { note: 'organic', topic: 'organic' },
};

const cache = {};
export async function curriculum(subject) {
  if (!cache[subject]) {
    const r = await fetch(`data/curriculum/${subject}.json`);
    cache[subject] = await r.json();
  }
  return cache[subject];
}

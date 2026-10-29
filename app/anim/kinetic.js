// Kinetic typography for English: words move, light up and swap places to show the rule.
import gsap from 'gsap';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function shell(el, title, extra = '') {
  el.innerHTML = `<div class="kstage"></div>
    <div class="controls"><div class="small" style="font-weight:800;flex:1">${title}</div>${extra}
      <button class="btn ghost sm" data-k="prev">Previous</button><button class="btn ghost sm" data-k="next">Next</button></div>`;
  return el.querySelector('.kstage');
}
// Runs a list of examples one after another, looping, with Previous/Next.
function cycle(el, items, play) {
  let i = 0, tl = null, pending = null, stopped = false;
  const run = () => {
    tl?.kill(); pending?.kill();
    tl = play(items[i], i);
    tl.eventCallback('onComplete', () => { if (!stopped) pending = gsap.delayedCall(1.2, () => { if (!stopped) { i = (i + 1) % items.length; run(); } }); });
  };
  el.querySelector('[data-k="next"]').addEventListener('click', () => { i = (i + 1) % items.length; run(); });
  el.querySelector('[data-k="prev"]').addEventListener('click', () => { i = (i - 1 + items.length) % items.length; run(); });
  run();
  return { get index() { return i; }, stop() { stopped = true; tl?.kill(); pending?.kill(); } };
}

// ---------------------------------------------------------------- concord
const CONCORD = [
  { before: ['Neither', 'the', 'teacher', 'nor', 'the'], subject: 'students', after: ['present.'], wrong: 'was', right: 'were', rule: 'Neither … nor: the verb agrees with the NEARER subject (students → plural).' },
  { before: ['Each', 'of', 'the', 'boys'], subject: 'Each', after: ['a', 'bicycle.'], wrong: 'have', right: 'has', rule: '"Each" is singular, even when a plural noun follows it.', subjectIndex: 0 },
  { before: ['The'], subject: 'news', after: ['shocking.'], wrong: 'were', right: 'was', rule: '"News" looks plural but is uncountable: singular verb.' },
  { before: ['Either', 'John', 'or', 'his'], subject: 'brothers', after: ['coming.'], wrong: 'is', right: 'are', rule: 'Either … or: agree with the nearer subject (brothers → plural).' },
  { before: ['The', 'number', 'of', 'students'], subject: 'number', after: ['increased.'], wrong: 'have', right: 'has', rule: '"The number of" is singular. ("A number of" is plural.)', subjectIndex: 1 },
];
function concord(el) {
  const stage = shell(el, 'Watch the verb find its subject');
  const c = cycle(el, CONCORD, (ex) => {
    const words = [...ex.before];
    const sIdx = ex.subjectIndex ?? words.length;
    if (ex.subjectIndex == null) words.push(ex.subject);
    stage.innerHTML = `<div class="ksent">${words.map((w, k) => `<span class="kw${k === sIdx ? ' ksub' : ''}">${esc(w)}</span>`).join('')}<span class="kslot"><span class="kverb kwrong">${ex.wrong}</span><span class="kverb kright">${ex.right}</span></span>${ex.after.map((w) => `<span class="kw">${esc(w)}</span>`).join('')}</div>
      <svg class="karrow" aria-hidden="true"><path fill="none" stroke="#F97316" stroke-width="3" stroke-linecap="round" marker-end="url(#ah)"/><defs><marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="#F97316"/></marker></defs></svg>
      <div class="krule">${esc(ex.rule)}</div>`;
    const kw = stage.querySelectorAll('.kw'), sub = stage.querySelector('.ksub'), slot = stage.querySelector('.kslot');
    const wrong = stage.querySelector('.kwrong'), right = stage.querySelector('.kright'), rule = stage.querySelector('.krule');
    const svg = stage.querySelector('.karrow'), path = svg.querySelector('path');
    const tl = gsap.timeline();
    tl.from(kw, { y: 30, opacity: 0, duration: 0.45, stagger: 0.07, ease: 'back.out(2)' });
    tl.from(slot, { scaleX: 0, duration: 0.3 }, '<0.3');
    tl.call(() => {
      const r = stage.getBoundingClientRect(), a = sub.getBoundingClientRect(), b = slot.getBoundingClientRect();
      svg.setAttribute('width', r.width); svg.setAttribute('height', r.height);
      const x1 = a.left + a.width / 2 - r.left, y1 = a.top - r.top - 4, x2 = b.left + b.width / 2 - r.left, y2 = b.top - r.top - 4;
      const lift = Math.min(70, 30 + Math.abs(x2 - x1) * 0.15);
      path.setAttribute('d', `M${x1} ${y1} C${x1} ${y1 - lift} ${x2} ${y2 - lift} ${x2} ${y2 - 6}`);
      const len = path.getTotalLength();
      gsap.fromTo(path, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 0.7, ease: 'power2.inOut' });
    });
    tl.to(sub, { color: '#C2410C', backgroundColor: '#FFF1E6', duration: 0.3 }, '+=0.1');
    tl.fromTo(wrong, { y: -40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: 'bounce.out' }, '+=0.6');
    tl.to(wrong, { x: -6, duration: 0.06, yoyo: true, repeat: 5, color: '#DC2626' }, '+=0.3');
    tl.to(wrong, { y: 40, opacity: 0, rotation: -20, duration: 0.4, ease: 'power2.in' });
    tl.fromTo(right, { y: -40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'bounce.out' });
    tl.to(slot, { backgroundColor: '#DCFCE7', duration: 0.3 }, '<0.2');
    tl.fromTo(rule, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4 });
    tl.to({}, { duration: 2.2 });
    return tl;
  });
  return () => c.stop();
}

// ---------------------------------------------------------------- oral English: stress
const ORAL = [
  { word: 'photograph', syl: ['PHO', 'to', 'graph'], s: 0 },
  { word: 'photographer', syl: ['pho', 'TO', 'gra', 'pher'], s: 1 },
  { word: 'interpret', syl: ['in', 'TER', 'pret'], s: 1 },
  { word: 'education', syl: ['e', 'du', 'CA', 'tion'], s: 2 },
  { word: 'present (a gift)', syl: ['PRE', 'sent'], s: 0, say: 'present', note: 'Noun: stress the first syllable' },
  { word: 'present (to give)', syl: ['pre', 'SENT'], s: 1, say: 'present', note: 'Verb: stress the second syllable' },
];
function oral(el) {
  const canSpeak = 'speechSynthesis' in window;
  const stage = shell(el, 'Stress patterns: the big syllable is the loud one', canSpeak ? '<button class="btn primary sm" data-k="say">Hear it</button>' : '');
  let currentWord = ORAL[0];
  const speak = () => {
    if (!canSpeak) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(currentWord.say || currentWord.word.replace(/\s*\(.*\)/, ''));
    u.rate = 0.75; u.lang = 'en-GB';
    speechSynthesis.speak(u);
  };
  el.querySelector('[data-k="say"]')?.addEventListener('click', speak);
  const c = cycle(el, ORAL, (w) => {
    currentWord = w;
    stage.innerHTML = `<div class="kword">${esc(w.word)}</div>
      <div class="ksyls">${w.syl.map((s, k) => `<span class="ksyl${k === w.s ? ' kstress' : ''}">${esc(s.toLowerCase())}</span>`).join('<span class="kdot">·</span>')}</div>
      <div class="krule">${esc(w.note || `${w.syl.length} syllables · stress on syllable ${w.s + 1}: ${w.syl.join('-')}`)}</div>`;
    const syls = stage.querySelectorAll('.ksyl'), st = stage.querySelector('.kstress');
    const tl = gsap.timeline();
    tl.from(stage.querySelector('.kword'), { opacity: 0, y: -10, duration: 0.35 });
    tl.from(syls, { y: 40, opacity: 0, duration: 0.4, stagger: 0.12, ease: 'back.out(2)' });
    // "say" it: each syllable pulses in time, the stressed one bigger
    syls.forEach((s, k) => {
      tl.to(s, { scale: k === w.s ? 1.5 : 1.12, color: k === w.s ? '#C2410C' : '#1C1917', duration: 0.18, ease: 'power2.out' }, k === 0 ? '+=0.4' : '+=0.05')
        .to(s, { scale: k === w.s ? 1.3 : 1, duration: 0.25 });
    });
    tl.to(st, { backgroundColor: '#FFF1E6', duration: 0.3 }, '<');
    tl.fromTo(stage.querySelector('.krule'), { opacity: 0 }, { opacity: 1, duration: 0.4 });
    tl.to({}, { duration: 2 });
    return tl;
  });
  return () => { c.stop(); if (canSpeak) speechSynthesis.cancel(); };
}

// ---------------------------------------------------------------- idioms: literal vs real meaning
const IDIOMS = [
  { idiom: 'spill the beans', meaning: 'reveal a secret' },
  { idiom: 'bury the hatchet', meaning: 'make peace' },
  { idiom: 'a wet blanket', meaning: 'someone who spoils the fun' },
  { idiom: 'burn the midnight oil', meaning: 'work or study late into the night' },
  { idiom: 'take the bull by the horns', meaning: 'face a problem boldly' },
];
function idioms(el) {
  const stage = shell(el, "Don't take idioms literally");
  const c = cycle(el, IDIOMS, (it) => {
    stage.innerHTML = `<div class="ktag">Says</div><div class="kidiom">${[...it.idiom].map((ch) => `<span class="kch">${ch === ' ' ? '&nbsp;' : esc(ch)}</span>`).join('')}</div>
      <div class="ktag korange">Means</div><div class="kmean">${it.meaning.split(' ').map((w) => `<span class="kmw">${esc(w)}</span>`).join(' ')}</div>`;
    const chars = stage.querySelectorAll('.kch'), mw = stage.querySelectorAll('.kmw'), tags = stage.querySelectorAll('.ktag');
    const tl = gsap.timeline();
    tl.from(tags[0], { opacity: 0, duration: 0.3 });
    tl.from(chars, { opacity: 0, y: -20, duration: 0.3, stagger: 0.03 });
    tl.to({}, { duration: 0.8 });
    tl.to(chars, { y: () => 160 + Math.random() * 80, x: () => (Math.random() - 0.5) * 80, rotation: () => (Math.random() - 0.5) * 160, opacity: 0, duration: 0.9, stagger: 0.015, ease: 'power2.in' });
    tl.to(stage.querySelector('.kidiom'), { height: 0, marginTop: -10, duration: 0.3 }, '-=0.3');
    tl.set(tags[0], { textContent: 'Says: ' + it.idiom });
    tl.to(tags[0], { opacity: 1, duration: 0.2 });
    tl.from(tags[1], { opacity: 0, duration: 0.3 });
    tl.from(mw, { opacity: 0, y: 24, scale: 0.8, duration: 0.45, stagger: 0.1, ease: 'back.out(2)' });
    tl.to({}, { duration: 2.2 });
    return tl;
  });
  return () => c.stop();
}

// ---------------------------------------------------------------- lexis: synonyms vs antonyms
const LEXIS = [
  { word: 'ADAMANT', syn: ['firm', 'unyielding', 'resolute'], ant: ['flexible', 'yielding'] },
  { word: 'VERBOSE', syn: ['wordy', 'long-winded'], ant: ['concise', 'brief'] },
  { word: 'CANDID', syn: ['frank', 'honest', 'open'], ant: ['evasive', 'guarded'] },
  { word: 'TRANSIENT', syn: ['brief', 'fleeting', 'short-lived'], ant: ['lasting', 'permanent'] },
  { word: 'AMBIVALENT', syn: ['unsure', 'in two minds'], ant: ['certain', 'decided'] },
];
function lexis(el) {
  const stage = shell(el, 'Nearest in meaning or opposite? Watch them sort');
  const c = cycle(el, LEXIS, (it) => {
    stage.innerHTML = `<div class="klex">
      <div class="kcol"><div class="ktag kgreen">Nearest in meaning</div><div class="kpile kpile-l"></div></div>
      <div class="kcentre">${esc(it.word)}</div>
      <div class="kcol"><div class="ktag korange">Opposite</div><div class="kpile kpile-r"></div></div></div>`;
    const centre = stage.querySelector('.kcentre');
    const L = stage.querySelector('.kpile-l'), R = stage.querySelector('.kpile-r');
    it.syn.forEach((w) => L.insertAdjacentHTML('beforeend', `<span class="kchip kchip-g">${esc(w)}</span>`));
    it.ant.forEach((w) => R.insertAdjacentHTML('beforeend', `<span class="kchip kchip-o">${esc(w)}</span>`));
    const tl = gsap.timeline();
    tl.from(centre, { scale: 0.4, opacity: 0, duration: 0.5, ease: 'back.out(2.5)' });
    tl.from(L.children, { x: 140, opacity: 0, duration: 0.5, stagger: 0.18, ease: 'power3.out' }, '+=0.3');
    tl.from(R.children, { x: -140, opacity: 0, duration: 0.5, stagger: 0.18, ease: 'power3.out' }, '+=0.2');
    tl.to(centre, { scale: 1.06, duration: 0.25, yoyo: true, repeat: 1 });
    tl.to({}, { duration: 2.2 });
    return tl;
  });
  return () => c.stop();
}

export const KINETIC = { concord, oral, idioms, lexis };

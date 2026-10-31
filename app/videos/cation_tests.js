// Video lesson (practical): identifying metal ions with sodium hydroxide solution.
import { S, C, clamp, lerp, ease, easeOut, backOut } from '../anim/videoplayer.js';
import { bench, testTube, dropper, label, equation } from '../anim/labkit.js';

const FONT = "'Plus Jakarta Sans', system-ui, sans-serif";
const T = (parent, x, y, text, o = {}) => {
  const n = S('text', { x, y, fill: o.fill || C.ink, 'font-family': FONT, 'font-size': o.size || 24, 'font-weight': o.weight || 700, 'text-anchor': o.anchor || 'start', opacity: o.opacity }, parent);
  n.textContent = text; return n;
};
const fade = (n, a) => n.setAttribute('opacity', clamp(a).toFixed(3));

// Each ion: the colour of its solution, its precipitate, and what excess NaOH does.
const ION = {
  cu: { name: 'Copper(II)', sym: 'Cu²⁺', sol: '#2563EB', solA: 0.5, ppt: '#7DB4F5', result: 'Pale blue precipitate', excess: 'Insoluble in excess', eq: 'Cu²⁺ + 2OH⁻  →  Cu(OH)₂(s)' },
  fe2: { name: 'Iron(II)', sym: 'Fe²⁺', sol: '#A3E635', solA: 0.3, ppt: '#5F7F3A', result: 'Dirty green precipitate', excess: 'Insoluble; browns on standing', eq: 'Fe²⁺ + 2OH⁻  →  Fe(OH)₂(s)' },
  fe3: { name: 'Iron(III)', sym: 'Fe³⁺', sol: '#D97706', solA: 0.42, ppt: '#9A3412', result: 'Reddish-brown precipitate', excess: 'Insoluble in excess', eq: 'Fe³⁺ + 3OH⁻  →  Fe(OH)₃(s)' },
  zn: { name: 'Zinc', sym: 'Zn²⁺', sol: '#E0F2FE', solA: 0.14, ppt: '#F5F5F4', result: 'White precipitate', excess: 'Dissolves in excess', eq: 'Zn(OH)₂ + 2OH⁻  →  [Zn(OH)₄]²⁻' },
};

// A big tube under a dropper, with labels, for one ion.
function station(g, x, ion, { yTop = 190, h = 330 } = {}) {
  const st = { ion: ION[ion] };
  st.tube = testTube(g, x, yTop, { w: 74, h });
  st.drop = dropper(g, '#E0F2FE');
  st.name = T(g, x, yTop + h + 52, `${st.ion.name}  ${st.ion.sym}`, { size: 26, weight: 800, anchor: 'middle', opacity: 0 });
  st.res = label(g, x, yTop + h + 94, st.ion.result, { anchor: 'middle', size: 22, fill: C.ink, weight: 800 });
  st.exc = label(g, x, yTop + h + 124, st.ion.excess, { anchor: 'middle', size: 18, fill: C.muted });
  // Draw it: show (0..1), drops falling, how much precipitate, settle, dissolve, brown skin, extra liquid.
  st.set = ({ show = 1, drip = 0, ppt = 0, settle = 0, dissolve = 0, skin = 0, add = 0, lt = 0, res = 0, exc = 0 }) => {
    fade(st.tube.g, show); fade(st.name, show);
    const level = 0.38 + add * 0.18;
    st.tube.set({ level, solColor: st.ion.sol, solA: st.ion.solA * (1 - 0.15 * ppt) + 0.12 * ppt * (1 - dissolve), ppt, settle, pptColor: st.ion.ppt, dissolve, skin, skinColor: '#92400E' });
    const surface = yTop + h * (1 - level);
    st.drop.set({ x, y: yTop - 30, show: drip > 0 ? Math.min(1, show) : 0, on: drip, t: lt, fall: surface - (yTop - 30) });
    st.res.set(res * show); st.exc.set(exc * show);
  };
  return st;
}

const intro = {
  chapter: 'Introduction',
  beats: [
    'How can we tell which metal ion is in a solution? One simple test is to add sodium hydroxide solution, drop by drop, and then in excess.',
    'Many metal ions form a precipitate: an insoluble solid that suddenly appears in the solution. Its colour, and what happens in excess, tell us the ion.',
  ],
  build(g) {
    bench(g, 600);
    const k = T(g, 640, 120, 'PRACTICAL CHEMISTRY · QUALITATIVE ANALYSIS', { size: 20, weight: 800, anchor: 'middle', fill: C.orange, opacity: 0 });
    const h = T(g, 640, 185, 'Testing for metal ions with NaOH', { size: 50, weight: 800, anchor: 'middle', opacity: 0 });
    const keys = ['cu', 'fe2', 'fe3', 'zn'];
    const tubes = keys.map((key, i) => ({ key, t: testTube(g, 340 + i * 200, 300, { w: 60, h: 260 }), q: T(g, 340 + i * 200, 286, '?', { size: 34, weight: 800, anchor: 'middle', fill: C.peach, opacity: 0 }) }));
    return (lt, B, P) => {
      fade(k, easeOut(P(0, 0, 0.1))); fade(h, easeOut(P(0, 0.04, 0.18)));
      tubes.forEach((tb, i) => {
        const a = easeOut(P(0, 0.2 + i * 0.08, 0.35 + i * 0.08));
        fade(tb.t.g, a); fade(tb.q, a * (1 - P(1, 0.2, 0.4)));
        const p = clamp(P(1, 0.25 + i * 0.1, 0.6 + i * 0.1));
        tb.t.set({ level: 0.45, solColor: ION[tb.key].sol, solA: ION[tb.key].solA, ppt: p, settle: clamp(P(1, 0.5, 1)) * 0.6, pptColor: ION[tb.key].ppt });
      });
    };
  },
};

const method = {
  chapter: 'The method',
  beats: [
    'Pour about two centimetres depth of the test solution into a clean test tube.',
    'Add sodium hydroxide solution a few drops at a time, and watch closely. Note the colour of any precipitate.',
    'Then keep adding sodium hydroxide until it is in excess, and shake. Does the precipitate stay, or dissolve?',
  ],
  build(g) {
    bench(g, 600);
    const tb = testTube(g, 520, 190, { w: 74, h: 330 });
    const dr = dropper(g, '#E0F2FE');
    const steps = [['1', 'About 2 cm³ of solution'], ['2', 'NaOH(aq) drop by drop'], ['3', 'Then in excess, and shake']].map(([n, s], i) => {
      const cg = S('g', { opacity: 0 }, g);
      S('circle', { cx: 760, cy: 230 + i * 100, r: 24, fill: C.orange }, cg);
      T(cg, 760, 239, n, { size: 24, weight: 800, anchor: 'middle', fill: '#1C0A00' }).setAttribute('y', 239 + i * 100);
      T(cg, 800, 239 + i * 100, s, { size: 26, weight: 700 });
      return cg;
    });
    return (lt, B, P) => {
      const pour = ease(P(0, 0.1, 0.6));
      fade(tb.g, easeOut(P(0, 0, 0.15)));
      const level = 0.05 + pour * 0.33 + P(2, 0, 0.8) * 0.18;
      tb.set({ level, solColor: '#E0F2FE', solA: 0.16 });
      const surf = 190 + 330 * (1 - level);
      const on = (P(1, 0.15, 1) > 0 && P(1, 0, 1) < 1 ? 1 : 0) || (P(2, 0, 0.8) > 0 && P(2, 0, 1) < 0.8 ? 1 : 0);
      dr.set({ x: 520, y: 160, show: easeOut(P(1, 0, 0.15)), on, t: lt, fall: surf - 160 });
      steps.forEach((s, i) => fade(s, easeOut(P(i, 0.05, 0.25))));
    };
  },
};

function ionScene(chapter, key, beats, timeline) {
  return {
    chapter,
    beats,
    build(g) {
      bench(g, 600);
      const st = station(g, 460, key);
      const eq = equation(g, ION[key].eq, 300);
      eq.g.setAttribute('transform', 'translate(0 0)');
      const eqHost = S('g', {}, g);
      eqHost.appendChild(eq.g);
      return (lt, B, P) => {
        const s = timeline(P);
        st.set({ ...s, lt });
        eq.set(s.eq || 0);
        eqHost.setAttribute('transform', 'translate(300 0)');
      };
    },
  };
}

const copper = ionScene('Copper(II) ions, Cu²⁺', 'cu', [
  'Copper(II) solutions are blue. Add sodium hydroxide, and a pale blue precipitate forms at once.',
  { say: 'This is copper(II) hydroxide.  Cu²⁺ + 2OH⁻ → Cu(OH)₂', speak: 'This is copper two hydroxide. One copper ion and two hydroxide ions form copper hydroxide.' },
  'Add excess sodium hydroxide and shake. The precipitate does not dissolve. It is insoluble in excess.',
], (P) => ({
  show: easeOut(P(0, 0, 0.12)),
  drip: (P(0, 0.2, 0.7) > 0 && P(0, 0, 1) < 0.7) || (P(2, 0.1, 0.6) > 0 && P(2, 0, 1) < 0.6) ? 1 : 0,
  ppt: clamp(P(0, 0.3, 0.75)), settle: clamp(P(1, 0, 1)) * 0.5 + clamp(P(2, 0.6, 1)) * 0.4,
  add: clamp(P(2, 0.1, 0.6)), res: easeOut(P(0, 0.6, 0.8)), exc: easeOut(P(2, 0.6, 0.8)), eq: easeOut(P(1, 0.1, 0.3)),
}));

// Iron: two stations side by side.
const iron = {
  chapters: [[0, 'Iron(II) ions, Fe²⁺'], [2, 'Iron(III) ions, Fe³⁺']],
  beats: [
    'Iron(II) solutions are pale green. Sodium hydroxide gives a dirty green precipitate of iron(II) hydroxide. It is insoluble in excess.',
    'Leave it to stand, and it slowly turns brown at the surface, as oxygen in the air oxidises it to iron(III).',
    'Iron(III) solutions are yellow-brown. Sodium hydroxide gives a reddish-brown precipitate of iron(III) hydroxide, also insoluble in excess.',
    'So: green means iron(II), and reddish-brown means iron(III).',
  ],
  build(g) {
    bench(g, 600);
    const a = station(g, 380, 'fe2'), b = station(g, 900, 'fe3');
    return (lt, B, P) => {
      const d1 = P(0, 0.15, 0.55) > 0 && P(0, 0, 1) < 0.55 ? 1 : 0;
      a.set({ show: easeOut(P(0, 0, 0.1)), drip: d1, ppt: clamp(P(0, 0.25, 0.6)), settle: clamp(P(0, 0.6, 1)) * 0.5 + clamp(P(1, 0, 0.5)) * 0.4,
        add: clamp(P(0, 0.15, 0.55)), skin: clamp(P(1, 0.15, 0.85)), res: easeOut(P(0, 0.45, 0.65)), exc: easeOut(P(1, 0.4, 0.6)), lt });
      const d2 = P(2, 0.15, 0.55) > 0 && P(2, 0, 1) < 0.55 ? 1 : 0;
      b.set({ show: easeOut(P(2, 0, 0.12)), drip: d2, ppt: clamp(P(2, 0.25, 0.6)), settle: clamp(P(2, 0.6, 1)) * 0.5 + clamp(P(3, 0, 1)) * 0.4,
        add: clamp(P(2, 0.15, 0.55)), res: easeOut(P(2, 0.45, 0.65)), exc: easeOut(P(2, 0.7, 0.9)), lt });
    };
  },
};

const zinc = ionScene('Zinc ions, Zn²⁺', 'zn', [
  'Zinc ions are colourless. Sodium hydroxide gives a white precipitate of zinc hydroxide.',
  'But keep adding sodium hydroxide, and the white precipitate dissolves, leaving a clear, colourless solution again.',
  { say: 'Zinc hydroxide is amphoteric: it reacts with the excess alkali to form a soluble zincate ion.', speak: 'Zinc hydroxide is amphoteric. It reacts with the excess alkali to form a soluble zincate ion.' },
  'Careful: aluminium and lead ions also give a white precipitate that dissolves in excess. A second test, with ammonia solution, tells them apart.',
], (P) => ({
  show: easeOut(P(0, 0, 0.12)),
  drip: (P(0, 0.2, 0.7) > 0 && P(0, 0, 1) < 0.7) || (P(1, 0.05, 0.7) > 0 && P(1, 0, 1) < 0.7) ? 1 : 0,
  ppt: clamp(P(0, 0.3, 0.75)), settle: clamp(P(0, 0.75, 1)) * 0.3,
  dissolve: ease(P(1, 0.2, 0.75)), add: clamp(P(1, 0.05, 0.7)),
  res: easeOut(P(0, 0.6, 0.8)), exc: easeOut(P(1, 0.6, 0.8)), eq: easeOut(P(2, 0.1, 0.3)) * (1 - P(3, 0, 0.15)),
}));

const summary = {
  chapter: 'Summary',
  beats: [
    'Here is the summary to learn. Pale blue for copper. Dirty green for iron two. Reddish-brown for iron three. And white that dissolves in excess for zinc.',
    'In an exam, always write two things: the colour of the precipitate, and whether it dissolves in excess. Now try the practice questions!',
  ],
  build(g) {
    T(g, 640, 100, 'Adding NaOH(aq): the results', { size: 44, weight: 800, anchor: 'middle' });
    const head = S('g', { opacity: 0 }, g);
    [['Ion', 170], ['Few drops of NaOH', 430], ['Excess NaOH', 790]].forEach(([s, x]) => T(head, x, 175, s, { size: 20, weight: 800, fill: C.peach }));
    const rows = ['cu', 'fe2', 'fe3', 'zn'].map((key, i) => {
      const I = ION[key], y = 205 + i * 95;
      const rg = S('g', { opacity: 0 }, g);
      S('rect', { x: 140, y, width: 1000, height: 80, rx: 18, fill: '#221D19', stroke: '#3A332E', 'stroke-width': 2 }, rg);
      T(rg, 170, y + 50, I.sym, { size: 30, weight: 800 });
      S('circle', { cx: 448, cy: y + 40, r: 18, fill: I.ppt, stroke: '#fff', 'stroke-opacity': 0.2 }, rg);
      T(rg, 480, y + 48, I.result.replace(' precipitate', ''), { size: 24, weight: 700 });
      T(rg, 790, y + 48, I.excess, { size: 21, weight: 700, fill: key === 'zn' ? C.green : C.muted });
      return rg;
    });
    return (lt, B, P) => {
      fade(head, easeOut(P(0, 0, 0.1)));
      rows.forEach((r, i) => {
        const a = backOut(P(0, 0.12 + i * 0.2, 0.3 + i * 0.2));
        fade(r, a); r.setAttribute('transform', `translate(${((1 - clamp(a)) * 40).toFixed(1)} 0)`);
      });
    };
  },
};

export default { title: 'Testing for metal ions with NaOH', poster: 30, scenes: [intro, method, copper, iron, zinc, summary] };

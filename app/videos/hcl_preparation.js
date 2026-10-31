// Video lesson (practical): preparing and testing hydrogen chloride gas.
import { S, C, clamp, lerp, ease, easeOut, backOut } from '../anim/videoplayer.js';
import { bench, burner, flask, tapFunnel, tube, gasJar, fumes, litmus, glassRod, label, equation } from '../anim/labkit.js';

const FONT = "'Plus Jakarta Sans', system-ui, sans-serif";
const T = (parent, x, y, text, o = {}) => {
  const n = S('text', { x, y, fill: o.fill || C.ink, 'font-family': FONT, 'font-size': o.size || 24, 'font-weight': o.weight || 700, 'text-anchor': o.anchor || 'start' }, parent);
  n.textContent = text; return n;
};
const fade = (n, a) => n.setAttribute('opacity', clamp(a).toFixed(3));

// The full apparatus, used by the set-up and reaction scenes.
function rig(g) {
  bench(g);
  const R = {};
  R.stand = S('g', {}, g);
  S('rect', { x: 150, y: 596, width: 120, height: 14, rx: 3, fill: '#57534E' }, R.stand);
  S('rect', { x: 196, y: 150, width: 10, height: 450, fill: '#78716C' }, R.stand);
  S('rect', { x: 200, y: 282, width: 118, height: 8, rx: 3, fill: '#78716C' }, R.stand);
  R.flame = burner(g, 330, 610);
  R.flask = flask(g, 330, 420, 78);
  R.funnel = tapFunnel(g, 330, 300, '#FDE68A');
  R.pipe = S('g', {}, g);
  R.flow = tube(R.pipe, 'M346 268 H790 Q820 268 820 298 V580', 10);
  R.jar = gasJar(g, 820, 610, 130, 220);
  R.air = S('g', { opacity: 0 }, g);
  for (const dx of [-36, 36]) S('path', { d: `M${820 + dx} 380 V330 M${820 + dx - 9} 342 L${820 + dx} 330 L${820 + dx + 9} 342`, stroke: C.sky, 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'round' }, R.air);
  T(R.air, 880, 352, 'air out', { size: 18, fill: C.sky });
  R.labels = {
    salt: label(g, 470, 470, 'Sodium chloride (salt)', { line: 'M465 464 H400' }),
    acid: label(g, 400, 150, 'Concentrated sulphuric acid', { line: 'M395 144 H370' }),
    tube: label(g, 520, 250, 'Delivery tube'),
    jar: label(g, 900, 560, 'Gas jar', {}),
    heat: label(g, 400, 590, 'Heat gently', { fill: C.peach }),
  };
  return R;
}

const intro = {
  chapter: 'Introduction',
  beats: [
    'Hydrogen chloride is a colourless gas with a sharp, choking smell. In this practical we prepare it in the lab and test it.',
    { say: 'We warm sodium chloride, common salt, with concentrated sulphuric acid.', speak: 'We warm sodium chloride, common salt, with concentrated sulphuric acid.' },
  ],
  build(g) {
    const k = T(g, 640, 220, 'PRACTICAL CHEMISTRY', { size: 20, weight: 800, anchor: 'middle', fill: C.orange });
    const h = T(g, 640, 290, 'Preparing hydrogen chloride', { size: 58, weight: 800, anchor: 'middle' });
    const f = T(g, 640, 345, 'HCl gas', { size: 30, weight: 700, anchor: 'middle', fill: C.muted });
    const cards = [['NaCl', 'sodium chloride', 440, '#F5F5F4'], ['conc. H₂SO₄', 'sulphuric acid', 840, '#FDE68A']].map(([a, b, x, col]) => {
      const cg = S('g', { opacity: 0 }, g);
      S('rect', { x: x - 150, y: 420, width: 300, height: 150, rx: 24, fill: '#221D19', stroke: '#3A332E', 'stroke-width': 2 }, cg);
      S('circle', { cx: x - 100, cy: 495, r: 22, fill: col, opacity: 0.85 }, cg);
      T(cg, x - 60, 488, a, { size: 32, weight: 800 });
      T(cg, x - 60, 522, b, { size: 20, weight: 600, fill: C.muted });
      return cg;
    });
    const plus = T(g, 640, 508, '+', { size: 48, weight: 800, anchor: 'middle', fill: C.peach, opacity: 0 });
    return (lt, B, P) => {
      fade(k, easeOut(P(0, 0, 0.12))); fade(h, easeOut(P(0, 0.05, 0.2))); fade(f, easeOut(P(0, 0.15, 0.3)));
      fade(cards[0], easeOut(P(1, 0.05, 0.25))); fade(plus, easeOut(P(1, 0.2, 0.35))); fade(cards[1], easeOut(P(1, 0.3, 0.5)));
    };
  },
};

const setup = {
  chapter: 'The apparatus',
  beats: [
    'Put some sodium chloride crystals in a round-bottomed flask.',
    'The concentrated sulphuric acid goes in a tap funnel above it, so we can add it a little at a time.',
    'A delivery tube carries the gas to a gas jar. A Bunsen burner will warm the flask gently.',
    'Safety first. Concentrated sulphuric acid is corrosive and hydrogen chloride is poisonous, so work in a fume cupboard and wear goggles.',
  ],
  build(g) {
    const R = rig(g);
    const warn = S('g', { opacity: 0 }, g);
    S('rect', { x: 930, y: 120, width: 300, height: 120, rx: 20, fill: '#3B1D12', stroke: C.orange, 'stroke-width': 2 }, warn);
    S('path', { d: 'M975 150 L1000 195 H950 Z', fill: 'none', stroke: C.orange, 'stroke-width': 4, 'stroke-linejoin': 'round' }, warn);
    T(warn, 975, 189, '!', { size: 26, weight: 800, anchor: 'middle', fill: C.orange });
    T(warn, 1020, 165, 'Fume cupboard', { size: 21, weight: 800 });
    T(warn, 1020, 195, 'Goggles on', { size: 21, weight: 800 });
    T(warn, 1020, 222, 'Corrosive · toxic gas', { size: 16, weight: 600, fill: C.peach });
    return (lt, B, P) => {
      const a0 = easeOut(P(0, 0, 0.3)), a1 = easeOut(P(1, 0, 0.3)), a2 = easeOut(P(2, 0, 0.3));
      fade(R.flask.g, a0); fade(R.stand, a0); R.flask.set({ t: lt });
      R.labels.salt.set(easeOut(P(0, 0.3, 0.5)) * (1 - P(3, 0, 0.2) * 0.5));
      fade(R.funnel.g, a1); R.funnel.set({ level: 1 }); R.funnel.g.setAttribute('transform', `translate(0 ${((1 - a1) * -40).toFixed(1)})`);
      R.labels.acid.set(easeOut(P(1, 0.3, 0.5)));
      fade(R.pipe, a2); fade(R.jar.g, a2); fade(R.flame.g, easeOut(P(2, 0.3, 0.6)));
      R.flame.set(0, lt); R.jar.set(0);
      R.labels.tube.set(easeOut(P(2, 0.15, 0.35))); R.labels.jar.set(easeOut(P(2, 0.25, 0.45)));
      fade(warn, backOut(P(3, 0, 0.2)));
    };
  },
};

const reaction = {
  chapters: [[0, 'The reaction'], [3, 'Collecting the gas']],
  beats: [
    'Open the tap. The acid drips onto the salt, and the mixture froths.',
    'Warm the flask gently. Hydrogen chloride gas is given off, and sodium hydrogensulphate is left in the flask.',
    { say: 'NaCl + H₂SO₄ → NaHSO₄ + HCl', speak: 'Sodium chloride plus sulphuric acid gives sodium hydrogensulphate plus hydrogen chloride.' },
    'Hydrogen chloride is denser than air. It sinks to the bottom of the jar and pushes the air up and out. This is called downward delivery.',
    "We cannot collect it over water, because hydrogen chloride is extremely soluble in water.",
    'If dry gas is needed, pass it through concentrated sulphuric acid first, which removes the water vapour.',
  ],
  build(g) {
    const R = rig(g);
    const eq = equation(g, 'NaCl + H₂SO₄  →  NaHSO₄ + HCl↑', 70);
    const why = S('g', { opacity: 0 }, g);
    S('rect', { x: 960, y: 140, width: 280, height: 150, rx: 20, fill: '#221D19', stroke: '#3A332E', 'stroke-width': 2 }, why);
    T(why, 984, 180, 'Why downward delivery?', { size: 19, weight: 800, fill: C.peach });
    T(why, 984, 214, 'HCl: vapour density 18.25', { size: 17, weight: 600 });
    T(why, 984, 242, 'Air: about 14.4', { size: 17, weight: 600 });
    T(why, 984, 272, 'So HCl is denser and sinks.', { size: 17, weight: 600, fill: C.muted });
    const sol = S('g', { opacity: 0 }, g);
    S('rect', { x: 960, y: 310, width: 280, height: 74, rx: 20, fill: '#221D19', stroke: '#3A332E', 'stroke-width': 2 }, sol);
    T(sol, 984, 343, 'Very soluble in water:', { size: 17, weight: 800, fill: C.red });
    T(sol, 984, 368, 'never collect over water', { size: 17, weight: 600 });
    const dry = label(g, 960, 420, 'Drying agent: conc. H₂SO₄', { size: 18, fill: C.gold });
    return (lt, B, P) => {
      [R.flask.g, R.stand, R.funnel.g, R.pipe, R.jar.g, R.flame.g].forEach((n) => fade(n, 1));
      const tap = P(0, 0.1, 0.25) > 0 ? 1 : 0;
      const added = clamp(P(0, 0.1, 1) * 0.5 + P(1, 0, 1) * 0.5);
      R.funnel.set({ level: 1 - added * 0.75, open: tap * (1 - P(4, 0, 0.1)), t: lt, fall: 150 });
      const heat = ease(P(1, 0, 0.2));
      R.flame.set(heat, lt);
      const froth = clamp(P(0, 0.3, 0.7)) * (0.4 + 0.6 * heat);
      R.flask.set({ level: 0.18 + added * 0.22, color: '#FEF3C7', froth, t: lt });
      const gas = clamp(P(1, 0.4, 1) * 3);
      R.flow.setAttribute('opacity', (0.85 * gas).toFixed(3));
      R.flow.setAttribute('stroke-dashoffset', (-lt * 60).toFixed(1));
      const fill = clamp(P(1, 0.6, 1) * 0.15 + P(2, 0, 1) * 0.2 + P(3, 0, 1) * 0.5 + P(4, 0, 1) * 0.15);
      R.jar.set(fill);
      fade(R.air, clamp(P(3, 0.15, 0.3)) * (1 - P(4, 0.6, 1)));
      R.labels.heat.set(easeOut(P(1, 0, 0.2)) * (1 - P(3, 0, 0.2)));
      eq.set(easeOut(P(1, 0.6, 0.9)) * (P(2, 0, 1) > 0 ? 1 : 1), 0);
      eq.text.setAttribute('fill', P(2, 0, 0.01) > 0 && P(3, 0, 0.01) === 0 ? C.gold : C.peach);
      fade(why, easeOut(P(3, 0.25, 0.45)));
      fade(sol, easeOut(P(4, 0.1, 0.3)));
      dry.set(easeOut(P(5, 0.1, 0.3)));
    };
  },
};

const tests = {
  chapter: 'Testing the gas',
  beats: [
    'Now the tests. At the mouth of the jar, the gas fumes in moist air, giving white, misty fumes.',
    'Damp blue litmus paper turns red. The gas dissolves in the water on the paper to form hydrochloric acid.',
    'The best test: hold a glass rod dipped in concentrated ammonia solution near the gas. Dense white smoke forms.',
    { say: 'The smoke is tiny solid particles of ammonium chloride.  NH₃ + HCl → NH₄Cl', speak: 'The smoke is tiny solid particles of ammonium chloride. Ammonia plus hydrogen chloride gives ammonium chloride.' },
  ],
  build(g) {
    bench(g);
    const jar = gasJar(g, 640, 610, 200, 300);
    const mist = fumes(g, 22, 40);
    const smoke = fumes(g, 34, 90);
    const paper = litmus(g);
    const rod = glassRod(g);
    const l1 = label(g, 770, 270, 'White misty fumes', { fill: C.ink });
    const l2 = label(g, 300, 250, 'Blue → red: acidic', { fill: C.red, anchor: 'middle' });
    const l3 = label(g, 980, 240, 'Dense white smoke', { fill: C.ink, anchor: 'middle' });
    const l4 = label(g, 980, 270, 'ammonium chloride', { fill: C.muted, anchor: 'middle' });
    const eq = equation(g, 'NH₃ + HCl  →  NH₄Cl', 90);
    return (lt, B, P) => {
      jar.set(0.92);
      const m = easeOut(P(0, 0.1, 0.4)) * (1 - 0.6 * P(2, 0, 0.3));
      mist.set({ x: 640, y: 300, amount: m, t: lt, rise: 90, spread: 70, dense: 0.25 });
      l1.set(easeOut(P(0, 0.35, 0.55)) * (1 - P(1, 0, 0.15)));
      // litmus comes in from the left, dips into the jar, goes red
      const pin = ease(P(1, 0, 0.25)), pout = ease(P(2, 0, 0.2));
      paper.set({ x: lerp(300, 580, pin) - pout * 280, y: lerp(260, 380, pin) - pout * 120, show: pin * (1 - pout), red: clamp(P(1, 0.3, 0.6)) });
      l2.set(easeOut(P(1, 0.55, 0.75)) * (1 - pout));
      // ammonia rod from the right, smoke grows where it meets the gas
      const rin = ease(P(2, 0.05, 0.3));
      rod.set({ x: lerp(1040, 730, rin), y: lerp(250, 300, rin), show: rin, tilt: -20 });
      const sm = clamp(P(2, 0.3, 0.7)) + P(3, 0, 1) * 0;
      smoke.set({ x: 712, y: 300, amount: sm, t: lt, rise: 150, spread: 110, dense: 0.7 });
      l3.set(easeOut(P(2, 0.55, 0.75))); l4.set(easeOut(P(3, 0, 0.2)));
      eq.set(easeOut(P(3, 0.2, 0.45)));
    };
  },
};

const recap = {
  chapter: 'Recap',
  beats: [
    'Quick recap. One: warm sodium chloride with concentrated sulphuric acid to make hydrogen chloride.',
    'Two: collect it by downward delivery, because it is denser than air and too soluble to collect over water.',
    'Three: it forms misty fumes in moist air and turns damp blue litmus red.',
    'And four: with ammonia, it gives dense white smoke of ammonium chloride. That is the key test. Now try the practice questions!',
  ],
  build(g) {
    T(g, 640, 110, 'Recap', { size: 52, weight: 800, anchor: 'middle' });
    const cards = [
      ['1', 'NaCl + conc. H₂SO₄', 'Warm gently → HCl + NaHSO₄', C.orange],
      ['2', 'Downward delivery', 'Denser than air; very soluble', C.sky],
      ['3', 'Fumes, litmus red', 'Misty in moist air; acidic', C.red],
      ['4', 'NH₃ → white smoke', 'NH₄Cl: the key test', C.green],
    ].map(([n, h, p, c], i) => {
      const x = i % 2 ? 660 : 160, y = i < 2 ? 160 : 400;
      const cg = S('g', { opacity: 0 }, g);
      S('rect', { x, y, width: 460, height: 200, rx: 26, fill: '#221D19', stroke: '#3A332E', 'stroke-width': 2 }, cg);
      S('circle', { cx: x + 52, cy: y + 56, r: 26, fill: c }, cg);
      T(cg, x + 52, y + 66, n, { size: 26, weight: 800, anchor: 'middle', fill: '#1C0A00' });
      T(cg, x + 36, y + 130, h, { size: 32, weight: 800 });
      T(cg, x + 36, y + 170, p, { size: 21, weight: 600, fill: C.muted });
      return { cg, x, y };
    });
    return (lt, B, P) => {
      cards.forEach((c, i) => {
        const a = backOut(P(i, 0, 0.18));
        c.cg.setAttribute('opacity', clamp(a).toFixed(3));
        const sc = 0.85 + 0.15 * a;
        c.cg.setAttribute('transform', `translate(${(c.x + 230) * (1 - sc)} ${(c.y + 100) * (1 - sc)}) scale(${sc.toFixed(4)})`);
      });
    };
  },
};

export default { title: 'Preparing hydrogen chloride', poster: 40, scenes: [intro, setup, reaction, tests, recap] };

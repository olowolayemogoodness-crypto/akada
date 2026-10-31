// Chemistry shorts: practicals in 20 to 40 seconds each. The notes carry the full detail.
// Words in *stars* are highlighted in the captions.
import { S, C, clamp, lerp, ease, easeOut } from '../anim/videoplayer.js';
import { bench, burner, flask, tapFunnel, tube, gasJar, fumes, litmus, glassRod, testTube, dropper, equation, seeded } from '../anim/labkit.js';

const BENCH = 880;
const during = (P, i) => P(i, 0, 0.0001) > 0 && P(i, 0, 1) < 1;

// ============================================================ Series 1: Hydrogen chloride
const hcl1 = {
  id: 'chem-hcl-1', series: 'Hydrogen chloride', part: 1, of: 3, topic: 'nonmetals',
  title: 'Salt + acid = poison gas?',
  beats: [
    'Ordinary *table salt* can give off a *poisonous gas*. Watch this.',
    'Salt in a flask. Add *concentrated sulphuric acid*.',
    { say: 'Warm it small small… and *hydrogen chloride* gas comes out.', speak: 'Warm it small small, and hydrogen chloride gas comes out.' },
    { say: 'NaCl + H₂SO₄ → NaHSO₄ + *HCl*', speak: 'Salt plus sulphuric acid gives sodium hydrogensulphate, and H C L. Simple.', d: 4.6 },
    'But how do you catch a gas you *can’t even see*?',
  ],
  next: 'Part 2: Catching an invisible gas',
  quiz: {q: "Hydrogen chloride is made in the lab by warming sodium chloride with…", options: ["Dilute hydrochloric acid", "Concentrated sulphuric acid", "Sodium hydroxide solution", "Distilled water"], answer: 1, why: "NaCl + H₂SO₄ (conc.) → NaHSO₄ + HCl. Warm gently."},
  build(g, fx) {
    bench(g, BENCH);
    const fl = burner(g, 300, BENCH);
    const fk = flask(g, 300, 650, 92);
    const fn = tapFunnel(g, 300, 488, '#FDE68A');
    const pipe = S('g', {}, g);
    const flow = tube(pipe, 'M316 486 H500 Q540 486 540 526 V600', 11);
    const gas = fumes(g, 24, 7);
    const st = fx.sticker(fx.ui, 360, 220, 'SALT → POISON GAS?!', { size: 46 });
    const salt = fx.text(fx.ui, 360, 300, 'NaCl  ·  table salt', { size: 30, fill: C.muted, weight: 700 });
    const eq = equation(fx.ui, 'NaCl + H₂SO₄ → NaHSO₄ + HCl', 240, 360, 30);
    const q = fx.sticker(fx.ui, 360, 230, 'HOW DO YOU CATCH IT?', { color: C.sky, size: 42, rot: 3 });
    return (t, P) => {
      st.set(P(0, 0, 0.25) * (1 - P(1, 0, 0.15)));
      salt.set(easeOut(P(0, 0.3, 0.5)) * (1 - P(1, 0, 0.15)), 12);
      const appear = easeOut(P(0, 0.2, 0.6));
      [fk.g, fl.g].forEach((n) => n.setAttribute('opacity', appear.toFixed(3)));
      fn.g.setAttribute('opacity', easeOut(P(1, 0, 0.25)).toFixed(3));
      pipe.setAttribute('opacity', easeOut(P(2, 0, 0.2)).toFixed(3));
      const drip = P(1, 0.3, 1) > 0 ? 1 : 0;
      fn.set({ level: 1 - clamp(P(1, 0.3, 1) + P(2, 0, 1)) * 0.6, open: drip * (1 - P(3, 0, 0.1)), t, fall: 170 });
      const heat = easeOut(P(2, 0, 0.2));
      fl.set(heat, t);
      fk.set({ level: 0.2 + clamp(P(1, 0.3, 1) + P(2, 0, 1)) * 0.15, color: '#FEF3C7', froth: clamp(P(1, 0.5, 0.9)) * (0.5 + heat * 0.5), t });
      const g2 = clamp(P(2, 0.3, 0.6));
      flow.setAttribute('opacity', (0.9 * g2).toFixed(3)); flow.setAttribute('stroke-dashoffset', (-t * 70).toFixed(1));
      gas.set({ x: 540, y: 610, amount: g2 * (1 - 0.5 * P(4, 0, 1)), t, rise: 140, spread: 60, dense: 0.4 });
      eq.set(easeOut(P(3, 0, 0.15)) * (1 - P(4, 0, 0.15)));
      fx.flash(fx.pulse(P(3, 0, 1), 0, 0.08));
      q.set(P(4, 0.1, 0.35));
      // camera: punch into the flask while the acid goes in, pull back for the gas, push to the empty end of the tube at the end
      const k = 1 + 0.22 * ease(P(1, 0, 0.3)) * (1 - ease(P(2, 0.2, 0.5))) + 0.12 * ease(P(4, 0, 0.4));
      const cx = lerp(300, 540, ease(P(4, 0, 0.4)));
      fx.camera(fx.root, k, cx, 620, fx.pulse(P(3, 0, 1), 0, 0.1) * 6, t);
    };
  },
};

const hcl2 = {
  id: 'chem-hcl-2', series: 'Hydrogen chloride', part: 2, of: 3, topic: 'nonmetals',
  title: 'Catching an invisible gas',
  beats: [
    'Can we collect hydrogen chloride *over water*? Let’s try.',
    { say: '*Omo!* The water rushes up. HCl *dissolves* in water, very, very fast.', speak: 'Omo! The water rushes up. H C L dissolves in water, very, very fast.' },
    { say: 'So we use *downward delivery*. HCl is *heavier than air*.', speak: 'So we use downward delivery. H C L is heavier than air.' },
    'It sinks to the bottom and pushes the air *out the top*.',
    'Jar is full. But how do you *prove* it’s HCl?',
  ],
  next: 'Part 3: The white smoke test',
  quiz: {q: "A gas is denser than air and very soluble in water. How is it collected?", options: ["Over water", "Upward delivery", "Downward delivery", "Over concentrated acid"], answer: 2, why: "Denser than air, so it sinks and pushes the air out. Too soluble to collect over water."},
  build(g, fx) {
    // Cut 1: trying to collect over water
    const a = S('g', {}, g);
    bench(a, BENCH);
    S('rect', { x: 110, y: 690, width: 500, height: 190, rx: 10, fill: 'rgba(125,180,245,0.10)', stroke: 'rgba(220,235,255,0.6)', 'stroke-width': 3 }, a);
    S('rect', { x: 113, y: 730, width: 494, height: 147, fill: '#60A5FA', opacity: 0.32 }, a);
    const jarX = 380, jarTop = 420, jarBot = 800, jw = 150;
    const inside = S('rect', { x: jarX - jw / 2 + 3, y: 760, width: jw - 6, height: 40, fill: '#60A5FA', opacity: 0.4 }, a);
    S('path', { d: `M${jarX - jw / 2} ${jarBot} V${jarTop + 10} Q${jarX - jw / 2} ${jarTop} ${jarX - jw / 2 + 10} ${jarTop} H${jarX + jw / 2 - 10} Q${jarX + jw / 2} ${jarTop} ${jarX + jw / 2} ${jarTop + 10} V${jarBot}`, fill: 'rgba(220,235,255,0.08)', stroke: 'rgba(220,235,255,0.75)', 'stroke-width': 3 }, a);
    tube(a, 'M40 560 H200 Q240 560 240 600 V840 Q240 860 300 840 L360 815', 11);
    const bub = Array.from({ length: 10 }, (_, i) => { const r = seeded(60 + i); return { dx: (r() - 0.5) * 60, ph: r(), el: S('circle', { r: 7, fill: 'none', stroke: '#fff', 'stroke-width': 2, opacity: 0 }, a) }; });
    const omo = fx.sticker(fx.ui, 380, 250, 'OMO! IT DISSOLVED', { color: C.red, ink: '#fff', size: 44 });
    const x1 = fx.text(fx.ui, 380, 330, '✗  not over water', { size: 34, fill: C.red });
    // Cut 2: downward delivery
    const b = S('g', { opacity: 0 }, g);
    bench(b, BENCH);
    const jar = gasJar(b, 380, BENCH, 190, 380);
    const flow = tube(b, 'M60 400 H340 Q380 400 380 440 V850', 11);
    const air = S('g', { opacity: 0 }, b);
    for (const dx of [-55, 55]) S('path', { d: `M${380 + dx} 520 V440 M${380 + dx - 12} 456 L${380 + dx} 440 L${380 + dx + 12} 456`, stroke: C.sky, 'stroke-width': 5, fill: 'none', 'stroke-linecap': 'round' }, air);
    const airT = fx.text(fx.ui, 560, 470, 'air out', { size: 30, fill: C.sky, anchor: 'start' });
    const heavy = fx.sticker(fx.ui, 360, 250, 'HEAVIER THAN AIR ↓', { size: 42 });
    const q = fx.sticker(fx.ui, 360, 250, 'PROVE IT!', { color: C.sky, size: 50, rot: 3 });
    return (t, P) => {
      const cut = P(2, 0, 0.0001) > 0;
      a.setAttribute('opacity', cut ? 0 : 1); b.setAttribute('opacity', cut ? 1 : 0);
      if (!cut) {
        heavy.set(0); q.set(0); airT.set(0);
        const rise = ease(P(1, 0, 0.6));
        const lvl = lerp(760, jarTop + 30, rise);
        inside.setAttribute('y', lvl.toFixed(1)); inside.setAttribute('height', (jarBot - lvl).toFixed(1));
        bub.forEach((bb) => { const p = (t * 0.9 + bb.ph) % 1; const y = 800 - p * 300; bb.el.setAttribute('cx', (jarX + bb.dx).toFixed(1)); bb.el.setAttribute('cy', y.toFixed(1)); bb.el.setAttribute('r', (7 * (1 - p)).toFixed(1)); bb.el.setAttribute('opacity', (P(0, 0.3, 0.5) * (y > lvl ? 0 : 0.8) * (1 - p)).toFixed(3)); });
        omo.set(P(1, 0.1, 0.35)); x1.set(easeOut(P(1, 0.5, 0.7)), 12);
        fx.camera(fx.root, 1 + 0.15 * ease(P(0, 0.2, 0.8)), jarX, 640, fx.pulse(P(1, 0, 1), 0.05, 0.25) * 9, t);
        fx.flash(0);
      } else {
        omo.set(0); x1.set(0);
        const g2 = clamp(P(2, 0.2, 0.5));
        flow.setAttribute('opacity', (0.9 * g2).toFixed(3)); flow.setAttribute('stroke-dashoffset', (-t * 70).toFixed(1));
        jar.set(clamp(P(2, 0.4, 1) * 0.2 + P(3, 0, 1) * 0.7 + P(4, 0, 0.3) * 0.08));
        air.setAttribute('opacity', (clamp(P(3, 0.1, 0.3)) * (1 - P(4, 0, 0.2))).toFixed(3));
        airT.set(clamp(P(3, 0.2, 0.4)) * (1 - P(4, 0, 0.2)));
        heavy.set(P(2, 0.1, 0.35) * (1 - P(4, 0, 0.15)));
        q.set(P(4, 0.15, 0.4));
        fx.flash(fx.pulse(P(2, 0, 1), 0, 0.06));
        fx.camera(fx.root, 1.0 + 0.1 * ease(P(4, 0, 0.5)), 380, 500, 0, t);
      }
    };
  },
};

const hcl3 = {
  id: 'chem-hcl-3', series: 'Hydrogen chloride', part: 3, of: 3, topic: 'nonmetals',
  title: 'The white smoke test',
  beats: [
    'Test one: *damp blue litmus* paper…',
    '*Red!* It’s an acidic gas.',
    'Test two, the famous one: *ammonia* on a glass rod…',
    '*Dense white smoke!* That’s *ammonium chloride*.',
    { say: 'NH₃ + HCl → NH₄Cl', speak: 'Ammonia plus H C L gives ammonium chloride. Exam favourite!', d: 3.8 },
  ],
  next: 'The full method is in your note. Next series: what colour is your metal?',
  quiz: {q: "Which result confirms that a gas is hydrogen chloride?", options: ["Dense white smoke with ammonia", "It turns limewater milky", "It relights a glowing splint", "It bleaches damp litmus paper"], answer: 0, why: "NH₃ + HCl → NH₄Cl, the dense white smoke. Limewater is the test for CO₂, and a glowing splint is the test for O₂."},
  build(g, fx) {
    bench(g, BENCH);
    const jar = gasJar(g, 360, BENCH, 220, 380);
    const mist = fumes(g, 20, 41), smoke = fumes(g, 40, 93);
    const paper = litmus(g), rod = glassRod(g);
    const red = fx.sticker(fx.ui, 360, 250, 'RED = ACIDIC', { color: C.red, ink: '#fff', size: 46 });
    const wow = fx.sticker(fx.ui, 360, 230, 'WHITE SMOKE!', { color: '#F5F5F4', size: 56, rot: -5 });
    const eq = equation(fx.ui, 'NH₃ + HCl → NH₄Cl', 240, 360, 38);
    return (t, P) => {
      jar.set(0.92);
      mist.set({ x: 360, y: 500, amount: 0.6 * (1 - P(3, 0, 0.3)), t, rise: 80, spread: 70, dense: 0.25 });
      const pin = ease(P(0, 0.1, 0.6)), pout = ease(P(2, 0, 0.25));
      paper.set({ x: lerp(120, 330, pin) - pout * 300, y: lerp(420, 590, pin), show: Math.max(pin * (1 - pout), 0), red: clamp(P(1, 0, 0.25)) });
      red.set(P(1, 0.1, 0.35) * (1 - P(2, 0, 0.15)));
      const rin = ease(P(2, 0.15, 0.7));
      rod.set({ x: lerp(700, 430, rin), y: lerp(420, 500, rin), show: rin, tilt: -20 });
      const sm = clamp(P(3, 0, 0.35));
      smoke.set({ x: 420, y: 500, amount: sm, t, rise: 200, spread: 140, dense: 0.8 });
      wow.set(P(3, 0.15, 0.4) * (1 - P(4, 0, 0.15)));
      eq.set(easeOut(P(4, 0, 0.2)));
      fx.flash(fx.pulse(P(1, 0, 1), 0, 0.08) * 0.6 + fx.pulse(P(3, 0, 1), 0, 0.1));
      fx.camera(fx.root, 1 + 0.25 * ease(P(0, 0.2, 0.8)) * (1 - ease(P(2, 0, 0.3))) + 0.18 * ease(P(2, 0.3, 0.9)) * (1 - ease(P(4, 0, 0.3))),
        lerp(330, 430, ease(P(2, 0, 0.5))), 560, fx.pulse(P(3, 0, 1), 0, 0.15) * 10, t);
    };
  },
};

// ============================================================ Series 2: Metal ions with NaOH
const ION = {
  cu: { sol: '#2563EB', a: 0.5, ppt: '#7DB4F5' },
  fe2: { sol: '#A3E635', a: 0.3, ppt: '#5F7F3A' },
  fe3: { sol: '#D97706', a: 0.42, ppt: '#9A3412' },
  zn: { sol: '#E0F2FE', a: 0.14, ppt: '#F5F5F4' },
};
function rig(g, x, ion, yTop = 380, h = 440) {
  const tb = testTube(g, x, yTop, { w: 96, h });
  const dr = dropper(g, '#E0F2FE');
  return {
    tb, dr,
    set({ t, drip = 0, ppt = 0, settle = 0, dissolve = 0, skin = 0, add = 0, show = 1 }) {
      tb.g.setAttribute('opacity', show.toFixed(3));
      const level = 0.4 + add * 0.16;
      tb.set({ level, solColor: ION[ion].sol, solA: ION[ion].a, ppt, settle, pptColor: ION[ion].ppt, dissolve, skin });
      const surf = yTop + h * (1 - level);
      dr.set({ x, y: yTop - 30, show: drip ? show : 0, on: drip, t, fall: surf - yTop + 30 });
    },
  };
}

const ions1 = {
  id: 'chem-ions-1', series: 'Metal ion colours', part: 1, of: 3, topic: 'qualitative',
  title: 'One drop exposes a metal',
  beats: [
    'One drop of *sodium hydroxide* can expose a metal. Watch.',
    'Blue solution: *copper(II)* ions. Drop it in…',
    '*Pale blue* solid! That’s a *precipitate*.',
    { say: 'Add plenty more NaOH… it *stays*.', speak: 'Add plenty more sodium hydroxide. It stays.' },
    'Blue precipitate? Think *copper*.',
  ],
  next: 'Part 2: Iron has two faces, and one changes colour while you watch',
  quiz: {q: "NaOH solution gives a pale blue precipitate that does not dissolve in excess. The ion is…", options: ["Zn²⁺", "Fe³⁺", "Fe²⁺", "Cu²⁺"], answer: 3, why: "Copper(II) hydroxide, Cu(OH)₂, is pale blue and insoluble in excess NaOH."},
  build(g, fx) {
    bench(g, BENCH);
    const r = rig(g, 360, 'cu');
    const s1 = fx.sticker(fx.ui, 360, 220, 'ONE DROP. ONE METAL.', { size: 44 });
    const s2 = fx.sticker(fx.ui, 360, 220, 'Cu²⁺ = PALE BLUE', { color: C.sky, ink: '#0B1B33', size: 50 });
    const s3 = fx.sticker(fx.ui, 360, 300, 'STAYS IN EXCESS', { color: '#221D19', ink: C.peach, size: 34, rot: 2 });
    return (t, P) => {
      r.set({ t, show: easeOut(P(0, 0.1, 0.5)), drip: during(P, 1) && P(1, 0.4, 1) > 0 || during(P, 3) ? 1 : 0,
        ppt: clamp(P(1, 0.7, 1) + P(2, 0, 0.3)), settle: clamp(P(3, 0.3, 1)) * 0.5, add: clamp(P(3, 0, 0.8)) });
      s1.set(P(0, 0, 0.25) * (1 - P(1, 0, 0.15)));
      s2.set(P(2, 0.05, 0.3) * (1 - P(3, 0, 0.1)) + P(4, 0, 0.25));
      s3.set(P(3, 0.6, 0.9) * (1 - P(4, 0, 0.1)));
      fx.flash(fx.pulse(P(2, 0, 1), 0, 0.08) * 0.5);
      fx.camera(fx.root, 1 + 0.3 * ease(P(1, 0, 0.5)) * (1 - ease(P(4, 0, 0.4))), 360, 700, fx.pulse(P(2, 0, 1), 0, 0.12) * 6, t);
    };
  },
};

const ions2 = {
  id: 'chem-ions-2', series: 'Metal ion colours', part: 2, of: 3, topic: 'qualitative',
  title: 'Iron’s two faces',
  beats: [
    { say: '*Iron(II)*: pale green. Add NaOH…', speak: 'Iron two: pale green. Add sodium hydroxide.' },
    '*Dirty green* precipitate.',
    'Leave it small… the top turns *brown*. Air is *oxidising* it.',
    { say: '*Iron(III)*? Straight to *reddish-brown*.', speak: 'Iron three? Straight to reddish brown.' },
    { say: 'Green: iron(II). Brown: iron(III). *Done.*', speak: 'Green: iron two. Brown: iron three. Done.' },
  ],
  next: 'Part 3: The precipitate that disappears',
  quiz: {q: "A dirty green precipitate slowly turns brown at the surface. Why?", options: ["Air oxidises iron(II) to iron(III)", "The NaOH evaporates", "Copper is being formed", "The precipitate is dissolving"], answer: 0, why: "Fe(OH)₂ (green) is oxidised by oxygen in the air to Fe(OH)₃ (reddish-brown)."},
  build(g, fx) {
    bench(g, BENCH);
    const a = rig(g, 220, 'fe2', 400, 420), b = rig(g, 500, 'fe3', 400, 420);
    const sA = fx.sticker(fx.ui, 220, 300, 'Fe²⁺ GREEN', { color: '#5F7F3A', ink: '#fff', size: 36, rot: -4 });
    const sB = fx.sticker(fx.ui, 500, 300, 'Fe³⁺ BROWN', { color: '#9A3412', ink: '#fff', size: 36, rot: 4 });
    const air = fx.text(fx.ui, 220, 230, 'O₂ from the air', { size: 30, fill: C.sky });
    return (t, P) => {
      a.set({ t, show: easeOut(P(0, 0, 0.3)), drip: during(P, 0) && P(0, 0.4, 1) > 0 ? 1 : 0, ppt: clamp(P(0, 0.8, 1) + P(1, 0, 0.3)), settle: clamp(P(1, 0.4, 1)) * 0.4 + clamp(P(2, 0, 1)) * 0.3, add: clamp(P(0, 0.4, 1)), skin: clamp(P(2, 0.2, 0.8)) });
      b.set({ t, show: easeOut(P(3, 0, 0.2)), drip: during(P, 3) && P(3, 0.15, 0.6) > 0 ? 1 : 0, ppt: clamp(P(3, 0.4, 0.7)), settle: clamp(P(4, 0, 1)) * 0.4, add: clamp(P(3, 0.15, 0.6)) });
      sA.set(P(1, 0.1, 0.35) * (1 - P(2, 0, 0.1)) + P(4, 0, 0.25));
      air.set(easeOut(P(2, 0.15, 0.4)) * (1 - P(3, 0, 0.15)), 10);
      sB.set(P(3, 0.6, 0.85) + P(4, 0, 0.0001) * 0);
      fx.flash(fx.pulse(P(3, 0, 1), 0.45, 0.1) * 0.5);
      // camera follows: tube A, then tube B, then both
      const focus = lerp(220, 500, ease(P(3, 0, 0.3)));
      const k = 1 + 0.28 * (1 - ease(P(4, 0, 0.4)));
      fx.camera(fx.root, k * easeOut(P(0, 0, 0.3)) + (1 - easeOut(P(0, 0, 0.3))), lerp(focus, 360, ease(P(4, 0, 0.4))), 650, 0, t);
    };
  },
};

const ions3 = {
  id: 'chem-ions-3', series: 'Metal ion colours', part: 3, of: 3, topic: 'qualitative',
  title: 'The vanishing precipitate',
  beats: [
    { say: '*Zinc* ions: no colour at all. Add NaOH…', speak: 'Zinc ions: no colour at all. Add sodium hydroxide.' },
    '*White* precipitate. Normal so far.',
    { say: 'Keep adding… *Omo, it’s gone!*', speak: 'Keep adding. Omo, it is gone!' },
    'Zinc hydroxide is *amphoteric*: it reacts with *acids and alkalis*.',
    'Blue, green, brown… and white that *vanishes*. You know your metals now.',
  ],
  next: 'Practise these now. The full table is in your note.',
  quiz: {q: "Which ion gives a white precipitate with NaOH that dissolves in excess?", options: ["Cu²⁺", "Zn²⁺", "Fe²⁺", "Fe³⁺"], answer: 1, why: "Zinc hydroxide is amphoteric, so it dissolves in excess alkali. Al³⁺ and Pb²⁺ do the same."},
  build(g, fx) {
    bench(g, BENCH);
    const r = rig(g, 360, 'zn');
    const gone = fx.sticker(fx.ui, 360, 230, 'OMO, IT’S GONE!', { color: C.green, ink: '#052E16', size: 50 });
    const amph = fx.sticker(fx.ui, 360, 230, 'AMPHOTERIC', { color: C.peach, size: 50, rot: 3 });
    const chips = [['Cu²⁺', '#7DB4F5'], ['Fe²⁺', '#5F7F3A'], ['Fe³⁺', '#9A3412'], ['Zn²⁺', '#F5F5F4']].map(([s, col], i) => {
      const cg = S('g', { opacity: 0 }, g);
      S('circle', { cx: 0, cy: 0, r: 52, fill: col }, cg);
      const t2 = S('text', { x: 0, y: 12, 'text-anchor': 'middle', 'font-family': "'Plus Jakarta Sans', system-ui", 'font-size': 32, 'font-weight': 800, fill: i === 3 ? '#1C0A00' : '#fff' }, cg);
      t2.textContent = s;
      return { cg, x: 110 + i * 135 };
    });
    return (t, P) => {
      const rec = ease(P(4, 0, 0.25));
      r.set({ t, show: easeOut(P(0, 0, 0.3)) * (1 - rec), drip: (during(P, 0) && P(0, 0.4, 1) > 0) || during(P, 2) ? 1 : 0, ppt: clamp(P(0, 0.85, 1) + P(1, 0, 0.3)), settle: clamp(P(1, 0.3, 1)) * 0.3, dissolve: ease(P(2, 0.3, 0.8)), add: clamp(P(2, 0, 0.8)) });
      gone.set(P(2, 0.6, 0.85) * (1 - P(3, 0, 0.1)));
      amph.set(P(3, 0.05, 0.3) * (1 - P(4, 0, 0.1)));
      chips.forEach((c, i) => { const a = P(4, 0.1 + i * 0.12, 0.3 + i * 0.12); c.cg.setAttribute('opacity', clamp(a * 2).toFixed(3)); c.cg.setAttribute('transform', `translate(${c.x} 620) scale(${(0.5 + 0.5 * easeOut(a)).toFixed(3)})`); });
      fx.flash(fx.pulse(P(2, 0, 1), 0.6, 0.1) * 0.6);
      fx.camera(fx.root, 1 + 0.3 * ease(P(0, 0, 0.5)) * (1 - rec), 360, 700, fx.pulse(P(2, 0, 1), 0.6, 0.15) * 7, t);
    };
  },
};

export default [hcl1, hcl2, hcl3, ions1, ions2, ions3];

// Video lesson: Electromagnetic induction, in motion graphics.
import { S, C, clamp, lerp, ease, easeOut, backOut, keyframes } from '../anim/videoplayer.js';

const FONT = "'Plus Jakarta Sans', system-ui, sans-serif";
const T = (parent, x, y, text, o = {}) => {
  const n = S('text', { x, y, fill: o.fill || C.ink, 'font-family': FONT, 'font-size': o.size || 24, 'font-weight': o.weight || 700, 'text-anchor': o.anchor || 'start', 'letter-spacing': o.ls, opacity: o.opacity }, parent);
  n.textContent = text; return n;
};
const show = (n, a, dy = 0) => { n.setAttribute('opacity', a.toFixed(3)); if (dy) n.setAttribute('transform', `translate(0 ${((1 - a) * dy).toFixed(1)})`); };
const pill = (parent, x, y, text, color) => {
  const g = S('g', { opacity: 0 }, parent);
  const w = text.length * 11.2 + 40;
  S('rect', { x, y, width: w, height: 44, rx: 22, fill: color || C.orange }, g);
  T(g, x + 20, y + 29, text, { size: 19, weight: 800, fill: color === C.blue ? '#fff' : '#1C0A00' });
  return g;
};
const arrowHead = (parent, color, id) => { const m = S('marker', { id, viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }, S('defs', {}, parent)); S('path', { d: 'M0 0L10 5L0 10z', fill: color }, m); return `url(#${id})`; };

// ---------------------------------------------------------------- the lab: coil, galvanometer, magnet
const CX = 560, CY = 290, OUT = 940, IN = 560;
function makeLab(g, { loops = 6, extra = false, meter = true } = {}) {
  const L = {};
  const all = [];
  for (let k = 0; k < loops; k++) all.push({ x: 430 + (260 / (loops - 1)) * k, extra: false });
  if (extra) for (let k = 0; k < loops - 1; k++) all.push({ x: 430 + (260 / (loops - 1)) * (k + 0.5), extra: true });
  L.backs = S('g', {}, g);
  L.field = S('g', { opacity: 0 }, g);
  L.magnet = S('g', {}, g);
  L.fronts = S('g', {}, g);
  L.loops = all.map((lp) => {
    const back = S('path', { d: `M${lp.x} ${CY - 80} A 17 80 0 0 0 ${lp.x} ${CY + 80}`, fill: 'none', stroke: C.copperDark, 'stroke-width': 7, 'stroke-linecap': 'round' }, L.backs);
    const front = S('path', { d: `M${lp.x} ${CY - 80} A 17 80 0 0 1 ${lp.x} ${CY + 80}`, fill: 'none', stroke: C.copper, 'stroke-width': 7, 'stroke-linecap': 'round' }, L.fronts);
    return { ...lp, back, front };
  });
  // leads + galvanometer
  const GX = CX, GY = 560;
  const lead = `M430 ${CY + 80} V${GY} H${GX - 58} M690 ${CY + 80} V${GY} H${GX + 58}`;
  L.leads = S('path', { d: lead, fill: 'none', stroke: C.copper, 'stroke-width': 5, 'stroke-linejoin': 'round' }, g);
  L.flow = S('path', { d: `M${GX - 58} ${GY} H430 V${CY + 80} M690 ${CY + 80} V${GY} H${GX + 58}`, fill: 'none', stroke: C.gold, 'stroke-width': 5, 'stroke-dasharray': '4 22', 'stroke-linecap': 'round', opacity: 0 }, g);
  L.galvo = S('g', {}, g);
  S('circle', { cx: GX, cy: GY, r: 62, fill: '#1F1A17', stroke: '#78716C', 'stroke-width': 3 }, L.galvo);
  for (let a = -60; a <= 60; a += 15) {
    const r = (a - 90) * Math.PI / 180;
    S('line', { x1: GX + Math.cos(r) * 44, y1: GY + 10 + Math.sin(r) * 44, x2: GX + Math.cos(r) * (a % 30 ? 50 : 54), y2: GY + 10 + Math.sin(r) * (a % 30 ? 50 : 54), stroke: a === 0 ? C.ink : C.muted, 'stroke-width': a === 0 ? 3 : 2 }, L.galvo);
  }
  T(L.galvo, GX, GY + 44, 'G', { size: 18, weight: 800, anchor: 'middle', fill: C.muted });
  L.needle = S('line', { x1: GX, y1: GY + 10, x2: GX, y2: GY - 38, stroke: C.orange, 'stroke-width': 4, 'stroke-linecap': 'round' }, L.galvo);
  S('circle', { cx: GX, cy: GY + 10, r: 6, fill: C.ink }, L.galvo);
  // field lines (move with the magnet)
  for (let k = 1; k <= 4; k++) {
    const a = 40 + k * 48, b = 30 + k * 34;
    for (const s of [-1, 1]) S('path', { d: `M-110 ${s * 8} C ${-110 - a} ${s * b} ${110 + a} ${s * b} 110 ${s * 8}`, fill: 'none', stroke: C.peach, 'stroke-width': 2, 'stroke-dasharray': '7 9', class: 'fl' }, L.field);
  }
  S('path', { d: 'M-110 0 H-430', fill: 'none', stroke: C.peach, 'stroke-width': 2, 'stroke-dasharray': '7 9', class: 'fl' }, L.field);
  S('path', { d: 'M110 0 H330', fill: 'none', stroke: C.peach, 'stroke-width': 2, 'stroke-dasharray': '7 9', class: 'fl' }, L.field);
  L.fls = [...L.field.querySelectorAll('.fl')];
  // magnet: N faces the coil
  S('rect', { x: -110, y: -28, width: 110, height: 56, rx: 8, fill: C.red }, L.magnet);
  S('rect', { x: 0, y: -28, width: 110, height: 56, rx: 8, fill: C.blue }, L.magnet);
  S('rect', { x: -10, y: -28, width: 20, height: 56, fill: C.red }, L.magnet);
  S('rect', { x: 0, y: -28, width: 10, height: 56, fill: C.blue }, L.magnet);
  T(L.magnet, -55, 10, 'N', { size: 28, weight: 800, anchor: 'middle', fill: '#fff' });
  T(L.magnet, 55, 10, 'S', { size: 28, weight: 800, anchor: 'middle', fill: '#fff' });
  // flux meter
  if (meter) {
    L.meter = S('g', { opacity: 0 }, g);
    S('rect', { x: 1110, y: 150, width: 46, height: 300, rx: 14, fill: '#221D19', stroke: '#3A332E', 'stroke-width': 2 }, L.meter);
    L.meterFill = S('rect', { x: 1116, y: 444, width: 34, height: 0, rx: 10, fill: C.peach }, L.meter);
    T(L.meter, 1133, 130, 'Flux Φ', { size: 20, weight: 800, anchor: 'middle', fill: C.peach });
    L.meterTxt = T(L.meter, 1133, 488, '', { size: 16, weight: 700, anchor: 'middle', fill: C.muted });
  }
  L.flux = (mx) => 1 / (1 + Math.pow((mx - CX) / 140, 2));
  // Draw the whole lab for one moment.
  L.set = ({ mx, mag = 1, n = loops, extraA = 0, fieldA = 0, flowSign = 1, lt = 0, draw = 1, glow = 0, rate }) => {
    L.magnet.setAttribute('transform', `translate(${mx.toFixed(1)} ${CY})`);
    L.magnet.setAttribute('opacity', mag.toFixed(3));
    L.field.setAttribute('transform', `translate(${mx.toFixed(1)} ${CY})`);
    L.field.setAttribute('opacity', (fieldA * mag).toFixed(3));
    L.fls.forEach((p) => p.setAttribute('stroke-dashoffset', (-lt * 26).toFixed(1)));
    const f = L.flux(mx) * mag;
    const ang = clamp(rate * 24 * (n / 6), -62, 62);
    L.needle.setAttribute('transform', `rotate(${ang.toFixed(2)} ${CX} 570)`);
    L.flow.setAttribute('stroke-dashoffset', (-f * (n / 6) * 220 * flowSign).toFixed(1));
    L.flow.setAttribute('opacity', clamp(Math.abs(ang) / 18).toFixed(3));
    L.loops.forEach((lp, k) => {
      const a = lp.extra ? extraA : 1;
      const len = clamp(draw * L.loops.length - k);
      for (const p of [lp.back, lp.front]) { p.setAttribute('opacity', (a * (len > 0 ? 1 : 0)).toFixed(3)); p.setAttribute('stroke-dasharray', '260'); p.setAttribute('stroke-dashoffset', ((1 - len) * 260).toFixed(1)); }
      lp.front.setAttribute('stroke', glow > 0.02 ? `rgb(${Math.round(lerp(232, 255, glow))},${Math.round(lerp(145, 214, glow))},${Math.round(lerp(58, 140, glow))})` : C.copper);
    });
    if (L.meter) { const h = f * 288; L.meterFill.setAttribute('y', (444 - h).toFixed(1)); L.meterFill.setAttribute('height', h.toFixed(1)); L.meterTxt.textContent = `${Math.round(f * 12)} lines`; }
    return ang;
  };
  // numerical d(flux)/dt for a magnet path
  L.rate = (path, lt) => (L.flux(path(lt + 0.02)) - L.flux(path(lt - 0.02))) / 0.04;
  return L;
}

// ---------------------------------------------------------------- scenes
const intro = {
  chapter: 'Intro',
  beats: ['Every light in your home depends on one simple idea.', 'A changing magnetic field makes electricity. This is electromagnetic induction.'],
  build(g) {
    const arcs = S('g', { transform: 'translate(640 330)' }, g);
    const rings = [160, 230, 300].map((r, i) => S('ellipse', { cx: 0, cy: 0, rx: r * 1.6, ry: r, fill: 'none', stroke: i % 2 ? C.blue : C.orange, 'stroke-width': 2, 'stroke-dasharray': '10 14', opacity: 0.35 }, arcs));
    const eyebrow = T(g, 640, 250, 'JAMB PHYSICS · VIDEO LESSON', { size: 20, weight: 800, anchor: 'middle', fill: C.orange, ls: 4 });
    const t1 = T(g, 640, 345, 'Electromagnetic', { size: 92, weight: 800, anchor: 'middle', ls: -2 });
    const t2 = T(g, 640, 440, 'induction', { size: 92, weight: 800, anchor: 'middle', ls: -2, fill: C.peach });
    const bolt = S('path', { d: 'M660 470 L612 548 H652 L622 620 L702 528 H660 L690 470 Z', fill: 'none', stroke: C.gold, 'stroke-width': 5, 'stroke-linejoin': 'round', 'stroke-dasharray': 520 }, g);
    const sub = T(g, 640, 670, 'How a moving magnet makes electricity', { size: 24, weight: 600, anchor: 'middle', fill: C.muted });
    return (lt, B, P) => {
      rings.forEach((r, i) => r.setAttribute('transform', `rotate(${(lt * (i % 2 ? -6 : 8)).toFixed(2)})`));
      show(eyebrow, easeOut(P(0, 0, 0.25)), 20);
      show(t1, easeOut(P(0, 0.1, 0.45)), 40);
      show(t2, easeOut(P(0, 0.25, 0.6)), 40);
      bolt.setAttribute('stroke-dashoffset', (520 * (1 - ease(P(1, 0, 0.45)))).toFixed(1));
      bolt.setAttribute('fill', P(1, 0.4, 0.6) > 0 ? `rgba(253,230,138,${(P(1, 0.4, 0.6) * 0.9).toFixed(2)})` : 'none');
      show(sub, easeOut(P(1, 0.3, 0.6)), 20);
    };
  },
};

const experiment = {
  chapters: [[0, 'The experiment'], [5, 'Magnetic flux']],
  beats: [
    'Here is a coil of copper wire joined to a galvanometer, a meter that shows current.',
    'Hold a magnet still near the coil, and nothing happens. The needle stays at zero.',
    'Now push the magnet into the coil. The needle jumps! A current flows, with no battery at all.',
    'Pull the magnet out, and the needle swings the other way. The current has reversed.',
    "Stop moving, and the current stops. It isn't the magnet that matters. It's the change.",
    'Picture the magnetic field lines. The number of lines passing through the coil is called the magnetic flux.',
    'As the magnet comes closer, more lines pass through the coil. A changing flux is what induces the e.m.f.',
  ],
  build(g) {
    const L = makeLab(g);
    const lbCoil = S('g', { opacity: 0 }, g); S('path', { d: 'M560 196 V150 H640', stroke: C.muted, fill: 'none', 'stroke-width': 2 }, lbCoil); T(lbCoil, 650, 157, 'Coil of copper wire', { size: 22, fill: C.muted });
    const lbG = S('g', { opacity: 0 }, g); S('path', { d: 'M500 560 H330', stroke: C.muted, fill: 'none', 'stroke-width': 2 }, lbG); T(lbG, 320, 567, 'Galvanometer', { size: 22, fill: C.muted, anchor: 'end' });
    const tags = ['Magnet still → no current', 'Moving in → current flows', 'Moving out → current reverses', 'No motion → no current'].map((s, i) => pill(g, 80, 70, s, i === 2 ? C.blue : C.orange));
    const big = T(g, 80, 150, '', { size: 30, weight: 800, fill: C.peach });
    const path = (B) => (lt) => keyframes([
      [0, OUT],
      [B[2].s + (B[2].e - B[2].s) * 0.25, OUT], [B[2].s + (B[2].e - B[2].s) * 0.55, IN],
      [B[3].s + (B[3].e - B[3].s) * 0.2, IN], [B[3].s + (B[3].e - B[3].s) * 0.5, OUT],
      [B[6].s + (B[6].e - B[6].s) * 0.1, OUT], [B[6].s + (B[6].e - B[6].s) * 0.75, 650],
    ], lt);
    return (lt, B, P) => {
      const mp = path(B), mx = mp(lt);
      const fieldA = ease(P(5, 0, 0.3));
      L.set({ mx, mag: ease(P(1, 0, 0.25)), lt, draw: ease(P(0, 0, 0.45)), fieldA, rate: L.rate(mp, lt), glow: fieldA * L.flux(mx) * 0.9 });
      L.galvo.setAttribute('opacity', ease(P(0, 0.25, 0.55)).toFixed(3));
      L.leads.setAttribute('opacity', ease(P(0, 0.2, 0.5)).toFixed(3));
      show(lbCoil, ease(P(0, 0.45, 0.65)) * (1 - P(1, 0, 0.2)));
      show(lbG, ease(P(0, 0.6, 0.8)) * (1 - P(1, 0, 0.2)));
      const which = lt < B[1].s ? -1 : lt < B[2].s ? 0 : lt < B[3].s ? 1 : lt < B[4].s ? 2 : lt < B[5].s ? 3 : -1;
      tags.forEach((tg, i) => show(tg, i === which ? easeOut(clamp((lt - B[i + 1].s) / 0.4)) : 0, -10));
      if (L.meter) L.meter.setAttribute('opacity', fieldA.toFixed(3));
      big.textContent = lt >= B[6].s ? 'Changing flux → induced e.m.f.' : lt >= B[5].s ? 'Flux = field lines through the coil' : '';
      show(big, lt >= B[6].s ? easeOut(P(6, 0.5, 0.75)) : easeOut(P(5, 0.35, 0.6)), 14);
    };
  },
};

const faraday = {
  chapter: "Faraday's law",
  beats: [
    "Faraday's law: the size of the induced e.m.f. depends on how fast the flux changes.",
    'Move the magnet faster, and the needle swings much further.',
    'Add more turns of wire, and the e.m.f. grows again. A stronger magnet does the same.',
    'In symbols: E equals N, the number of turns, times the change in flux, divided by the time taken.',
  ],
  build(g) {
    const L = makeLab(g, { extra: true, meter: false });
    const title = T(g, 80, 110, "Faraday's law", { size: 44, weight: 800 });
    const tags = ['Slow → small e.m.f.', 'Fast → big e.m.f.', 'More turns → bigger e.m.f.'].map((s) => pill(g, 80, 140, s));
    const turns = T(g, 560, 120, '', { size: 22, weight: 800, anchor: 'middle', fill: C.peach });
    const formula = S('g', { opacity: 0 }, g);
    S('rect', { x: 820, y: 230, width: 380, height: 150, rx: 22, fill: '#221D19', stroke: '#3A332E', 'stroke-width': 2 }, formula);
    const fE = T(formula, 870, 325, 'E =', { size: 56, weight: 800 });
    const fN = T(formula, 980, 325, 'N', { size: 56, weight: 800, fill: C.orange });
    const fP = T(formula, 1070, 300, 'ΔΦ', { size: 44, weight: 800, fill: C.sky });
    S('line', { x1: 1045, y1: 314, x2: 1160, y2: 314, stroke: C.ink, 'stroke-width': 4 }, formula);
    const fT = T(formula, 1072, 360, 'Δt', { size: 40, weight: 800, fill: C.green });
    const legend = S('g', { opacity: 0 }, g);
    [['N', 'turns', C.orange], ['ΔΦ', 'change in flux', C.sky], ['Δt', 'time taken', C.green]].forEach(([k, v, c], i) => { T(legend, 850, 430 + i * 38, k, { size: 24, weight: 800, fill: c }); T(legend, 910, 430 + i * 38, v, { size: 22, weight: 600, fill: C.muted }); });
    const path = (B) => {
      const k = [[0, OUT]];
      const seg = (i, a, b, c, d) => { const s = B[i].s, D = B[i].e - B[i].s; k.push([s + a * D, OUT], [s + b * D, IN], [s + c * D, IN], [s + d * D, OUT]); };
      seg(0, 0.12, 0.47, 0.55, 0.9);
      seg(1, 0.1, 0.22, 0.32, 0.44); seg(1, 0.52, 0.64, 0.74, 0.86);
      seg(2, 0.3, 0.6, 0.66, 0.95);
      return (lt) => keyframes(k, lt);
    };
    return (lt, B, P) => {
      const mp = path(B), mx = mp(lt);
      const extraA = ease(P(2, 0, 0.25));
      const n = 6 + 5 * extraA;
      L.set({ mx, lt, n, extraA, mag: 1 - ease(P(3, 0, 0.2)), rate: L.rate(mp, lt) });
      show(title, easeOut(P(0, 0, 0.2)), 20);
      const which = lt < B[1].s ? 0 : lt < B[2].s ? 1 : lt < B[3].s ? 2 : -1;
      tags.forEach((tg, i) => show(tg, i === which ? easeOut(clamp((lt - B[i].s - 0.3) / 0.4)) : 0, -10));
      turns.textContent = `${Math.round(n)} turns`;
      show(turns, lt < B[3].s ? 1 : 0);
      const f = easeOut(P(3, 0, 0.25));
      formula.setAttribute('opacity', f.toFixed(3));
      formula.setAttribute('transform', `translate(${((1 - f) * 40).toFixed(1)} 0)`);
      [[fN, 0.25], [fP, 0.45], [fT, 0.65]].forEach(([n2, a]) => n2.setAttribute('opacity', (0.35 + 0.65 * easeOut(P(3, a, a + 0.12))).toFixed(3)));
      show(legend, easeOut(P(3, 0.3, 0.6)), 12);
      show(fE, 1);
    };
  },
};

const lenz = {
  chapter: "Lenz's law",
  beats: [
    "Lenz's law tells us the direction. The induced current always opposes the change that causes it.",
    'Push a north pole towards the coil, and the near end of the coil becomes a north pole too. Like poles repel, so the coil pushes back.',
    'Pull the magnet away, and that end becomes a south pole, pulling the magnet back.',
    'Either way, you have to do work against the coil, and that work becomes electrical energy. Lenz’s law is energy conservation.',
  ],
  build(g) {
    const L = makeLab(g, { meter: false });
    const title = T(g, 80, 110, "Lenz's law", { size: 44, weight: 800 });
    const rule = T(g, 80, 160, 'The induced current opposes the change', { size: 26, weight: 700, fill: C.peach });
    const end = S('g', { opacity: 0 }, g);
    const endC = S('circle', { cx: 722, cy: CY, r: 26, fill: C.red }, end);
    const endT = T(end, 722, CY + 10, 'N', { size: 30, weight: 800, anchor: 'middle', fill: '#fff' });
    const halo = S('circle', { cx: 722, cy: CY, r: 26, fill: 'none', stroke: C.red, 'stroke-width': 3 }, end);
    const arr = arrowHead(g, C.ink, 'lz');
    const pushL = S('line', { stroke: C.ink, 'stroke-width': 4, 'marker-end': arr }, g);
    const pushR = S('line', { stroke: C.ink, 'stroke-width': 4, 'marker-end': arr }, g);
    const word = T(g, 0, CY - 70, '', { size: 22, weight: 800, anchor: 'middle', fill: C.ink });
    const energy = S('g', { opacity: 0 }, g);
    S('rect', { x: 760, y: 470, width: 440, height: 130, rx: 22, fill: '#221D19', stroke: '#3A332E', 'stroke-width': 2 }, energy);
    T(energy, 800, 525, 'Work you do', { size: 26, weight: 800, fill: C.peach });
    T(energy, 1010, 525, '→', { size: 30, weight: 800, fill: C.muted });
    T(energy, 1050, 525, 'Electrical', { size: 26, weight: 800, fill: C.gold });
    T(energy, 1050, 557, 'energy', { size: 26, weight: 800, fill: C.gold });
    T(energy, 800, 575, 'Energy is conserved', { size: 18, weight: 600, fill: C.muted });
    const FAR = 1150, NEAR = 925;
    const path = (B) => (lt) => keyframes([[0, FAR], [B[1].s + (B[1].e - B[1].s) * 0.12, FAR], [B[1].s + (B[1].e - B[1].s) * 0.8, NEAR], [B[2].s + (B[2].e - B[2].s) * 0.1, NEAR], [B[2].s + (B[2].e - B[2].s) * 0.75, FAR]], lt);
    return (lt, B, P) => {
      const mp = path(B), mx = mp(lt);
      const v = (mp(lt + 0.02) - mp(lt - 0.02)) / 0.04; // px per second; negative = approaching
      const r = -v / 55;
      L.set({ mx, lt, rate: r });
      const ang = clamp(r * 24, -62, 62);
      show(title, easeOut(P(0, 0, 0.2)), 20);
      show(rule, easeOut(P(0, 0.25, 0.5)), 14);
      const s = clamp(Math.abs(ang) / 10);
      const north = r > 0;
      end.setAttribute('opacity', s.toFixed(3));
      endC.setAttribute('fill', north ? C.red : C.blue); halo.setAttribute('stroke', north ? C.red : C.blue);
      endT.textContent = north ? 'N' : 'S';
      halo.setAttribute('r', (30 + (lt * 40) % 26).toFixed(1)); halo.setAttribute('opacity', (1 - ((lt * 40) % 26) / 26).toFixed(2));
      const gapA = 752, gapB = mx - 115, mid = (gapA + gapB) / 2;
      const a = s > 0.15 ? s : 0;
      if (north) { pushL.setAttribute('x1', mid - 8); pushL.setAttribute('x2', gapA + 4); pushR.setAttribute('x1', mid + 8); pushR.setAttribute('x2', gapB - 4); }
      else { pushL.setAttribute('x1', gapA + 4); pushL.setAttribute('x2', mid - 8); pushR.setAttribute('x1', gapB - 4); pushR.setAttribute('x2', mid + 8); }
      for (const p of [pushL, pushR]) { p.setAttribute('y1', CY); p.setAttribute('y2', CY); p.setAttribute('opacity', (a * (gapB - gapA > 40 ? 1 : 0)).toFixed(3)); }
      word.textContent = north ? 'Repel!' : 'Attract!';
      word.setAttribute('x', mid.toFixed(1)); word.setAttribute('opacity', a.toFixed(3));
      energy.setAttribute('opacity', easeOut(P(3, 0.1, 0.35)).toFixed(3));
    };
  },
};

const generator = {
  chapters: [[0, 'Generators and a.c.'], [2, "Fleming's right-hand rule"]],
  beats: [
    'Now spin a coil between two magnets. As it turns, the flux through it keeps changing. This is a generator, or dynamo.',
    'The e.m.f. rises, falls and flips direction every half turn. This is alternating current, or a.c.',
    "To find the direction of the induced current, use Fleming's right-hand rule.",
    'Thumb for motion, first finger for field, second finger for current. The right hand is for generators. The left hand is for motors.',
  ],
  build(g) {
    const gen = S('g', {}, g);
    const poleN = S('path', { d: 'M110 170 H230 V230 A 130 130 0 0 0 230 410 V470 H110 Z', fill: C.red }, gen);
    const poleS = S('path', { d: 'M630 170 H510 V230 A 130 130 0 0 1 510 410 V470 H630 Z', fill: C.blue }, gen);
    T(gen, 160, 330, 'N', { size: 44, weight: 800, anchor: 'middle', fill: '#fff' });
    T(gen, 580, 330, 'S', { size: 44, weight: 800, anchor: 'middle', fill: '#fff' });
    const field = [250, 290, 330, 370, 410].map((y) => S('line', { x1: 238, y1: y - 10, x2: 502, y2: y - 10, stroke: C.peach, 'stroke-width': 2, 'stroke-dasharray': '7 9', opacity: 0.55 }, gen));
    S('line', { x1: 370, y1: 140, x2: 370, y2: 520, stroke: '#78716C', 'stroke-width': 5 }, gen);
    const coil = S('polygon', { fill: 'rgba(232,145,58,.15)', stroke: C.copper, 'stroke-width': 9, 'stroke-linejoin': 'round' }, gen);
    S('ellipse', { cx: 370, cy: 540, rx: 26, ry: 8, fill: 'none', stroke: C.copper, 'stroke-width': 5 }, gen);
    S('ellipse', { cx: 370, cy: 562, rx: 26, ry: 8, fill: 'none', stroke: C.copper, 'stroke-width': 5 }, gen);
    S('path', { d: 'M396 540 H470 V610 M396 562 H440 V610', fill: 'none', stroke: C.muted, 'stroke-width': 3 }, gen);
    const bulbGlow = S('circle', { cx: 455, cy: 640, r: 50, fill: C.gold, opacity: 0 }, gen);
    S('circle', { cx: 455, cy: 640, r: 22, fill: '#2A2420', stroke: C.muted, 'stroke-width': 3 }, gen);
    const bulb = S('circle', { cx: 455, cy: 640, r: 14, fill: C.gold, opacity: 0.2 }, gen);
    // graph
    const graph = S('g', {}, g);
    S('line', { x1: 720, y1: 330, x2: 1200, y2: 330, stroke: '#57534E', 'stroke-width': 2 }, graph);
    S('line', { x1: 720, y1: 190, x2: 720, y2: 470, stroke: '#57534E', 'stroke-width': 2 }, graph);
    T(graph, 730, 180, 'e.m.f.', { size: 20, weight: 800, fill: C.muted });
    T(graph, 1200, 360, 'time', { size: 20, weight: 700, fill: C.muted, anchor: 'end' });
    T(graph, 700, 230, '+', { size: 26, weight: 800, fill: C.orange, anchor: 'middle' });
    T(graph, 700, 445, '−', { size: 26, weight: 800, fill: C.sky, anchor: 'middle' });
    const wave = S('polyline', { fill: 'none', stroke: C.orange, 'stroke-width': 4, 'stroke-linejoin': 'round' }, graph);
    const dot = S('circle', { r: 8, fill: C.gold }, graph);
    const acTag = pill(g, 760, 520, 'Alternating current (a.c.)');
    // Fleming
    const fl = S('g', { opacity: 0 }, g);
    const O = [930, 420];
    const axes = [
      { d: [0, -190], label: 'Thumb', sub: 'Motion', c: C.green },
      { d: [170, 95], label: 'First finger', sub: 'Field', c: C.sky },
      { d: [-170, 95], label: 'Second finger', sub: 'Current', c: C.orange },
    ].map((a, i) => {
      const head = arrowHead(fl, a.c, 'fl' + i);
      const line = S('line', { x1: O[0], y1: O[1], x2: O[0], y2: O[1], stroke: a.c, 'stroke-width': 9, 'stroke-linecap': 'round', 'marker-end': head }, fl);
      const lg = S('g', { opacity: 0 }, fl);
      const lx = O[0] + a.d[0] * 1.12, ly = O[1] + a.d[1] * 1.12 + (a.d[1] < 0 ? -18 : 34);
      T(lg, lx, ly, a.label, { size: 24, weight: 800, anchor: 'middle', fill: a.c });
      T(lg, lx, ly + 28, a.sub, { size: 22, weight: 600, anchor: 'middle', fill: C.ink });
      return { ...a, line, lg };
    });
    S('circle', { cx: O[0], cy: O[1], r: 10, fill: C.ink }, fl);
    T(fl, 930, 130, "Fleming's right-hand rule", { size: 30, weight: 800, anchor: 'middle' });
    const hands = pill(fl, 730, 640, 'Right hand = generators · Left hand = motors', C.orange);
    const W = 4.8, OMEGA = (2 * Math.PI) / 2.4;
    return (lt, B, P) => {
      const th = lt * OMEGA;
      const w = 130 * Math.cos(th), front = Math.cos(th) >= 0;
      coil.setAttribute('points', `${370 - w},215 ${370 + w},215 ${370 + w},425 ${370 - w},425`);
      coil.setAttribute('stroke', front ? C.copper : C.copperDark);
      const emf = Math.sin(th);
      const glow = Math.abs(emf);
      bulb.setAttribute('opacity', (0.2 + 0.8 * glow).toFixed(3)); bulbGlow.setAttribute('opacity', (0.35 * glow).toFixed(3));
      field.forEach((f) => f.setAttribute('stroke-dashoffset', (-lt * 26).toFixed(1)));
      const pts = [];
      const t0 = Math.max(0, lt - W);
      for (let k = 0; k <= 120; k++) { const tt = t0 + (lt - t0) * (k / 120); pts.push(`${(720 + ((tt - t0) / W) * 470).toFixed(1)},${(330 - Math.sin(tt * OMEGA) * 110).toFixed(1)}`); }
      wave.setAttribute('points', pts.join(' '));
      const last = pts.at(-1).split(',');
      dot.setAttribute('cx', last[0]); dot.setAttribute('cy', last[1]);
      const flA = ease(P(2, 0, 0.25));
      gen.setAttribute('opacity', (1 - 0.75 * flA).toFixed(3));
      graph.setAttribute('opacity', (1 - flA).toFixed(3));
      show(acTag, easeOut(P(1, 0.2, 0.4)) * (1 - flA), -10);
      fl.setAttribute('opacity', flA.toFixed(3));
      axes.forEach((a, i) => {
        const draw = lt < B[3].s ? easeOut(P(2, 0.25 + i * 0.2, 0.45 + i * 0.2)) : 1;
        a.line.setAttribute('x2', (O[0] + a.d[0] * draw).toFixed(1)); a.line.setAttribute('y2', (O[1] + a.d[1] * draw).toFixed(1));
        const hi = lt >= B[3].s ? (P(3, i * 0.18, i * 0.18 + 0.15) > 0 && P(3, i * 0.18 + 0.18, i * 0.18 + 0.2) < 1 ? 1 : 0.55) : 1;
        a.lg.setAttribute('opacity', (draw * (lt >= B[3].s ? hi : 1)).toFixed(3));
        a.line.setAttribute('stroke-width', lt >= B[3].s && hi === 1 ? 13 : 9);
      });
      show(hands, easeOut(P(3, 0.6, 0.8)), -10);
    };
  },
};

const transformer = {
  chapter: 'Transformers',
  beats: [
    'A transformer has two coils wound on a soft iron core.',
    'Alternating current in the primary coil makes a changing magnetic flux in the core.',
    'That changing flux passes through the secondary coil and induces a voltage there.',
    'The voltages are in the same ratio as the turns: Vs over Vp equals Ns over Np.',
    'With 2000 turns on the primary and 100 on the secondary, 240 volts steps down to 12 volts.',
    'Feed it steady d.c. instead, and the flux stops changing. No change, no induced voltage. Transformers only work with a.c.',
  ],
  build(g) {
    const core = S('g', { opacity: 0 }, g);
    S('path', { d: 'M420 170 H860 V490 H420 Z M500 250 V410 H780 V250 Z', fill: '#4A433E', 'fill-rule': 'evenodd', stroke: '#6B635C', 'stroke-width': 3 }, core);
    for (let y = 182; y < 490; y += 14) S('line', { x1: 424, y1: y, x2: 856, y2: y, stroke: '#3D3733', 'stroke-width': 1 }, core);
    T(core, 640, 155, 'Soft iron core', { size: 20, weight: 700, anchor: 'middle', fill: C.muted });
    const coil = (cx, n, y0, y1, label, sub) => {
      const g2 = S('g', {}, g), backs = S('g', {}, g2), fronts = S('g', {}, g2), out = [];
      for (let k = 0; k < n; k++) {
        const y = y0 + ((y1 - y0) / (n - 1)) * k;
        out.push(S('path', { d: `M${cx - 58} ${y} A 58 12 0 0 1 ${cx + 58} ${y}`, fill: 'none', stroke: C.copperDark, 'stroke-width': 6 }, backs));
        out.push(S('path', { d: `M${cx - 58} ${y} A 58 12 0 0 0 ${cx + 58} ${y}`, fill: 'none', stroke: C.copper, 'stroke-width': 6 }, fronts));
      }
      const lab = S('g', {}, g2);
      T(lab, cx, 530, label, { size: 22, weight: 800, anchor: 'middle' });
      const st = T(lab, cx, 558, sub, { size: 19, weight: 600, anchor: 'middle', fill: C.muted });
      return { g: g2, paths: out, lab, st };
    };
    const P1 = coil(460, 12, 200, 460, 'Primary', 'Np = 2000 turns');
    const P2 = coil(820, 5, 265, 395, 'Secondary', 'Ns = 100 turns');
    const flux = S('path', { d: 'M460 210 H820 V450 H460 Z', fill: 'none', stroke: C.peach, 'stroke-width': 4, 'stroke-dasharray': '16 18', opacity: 0 }, g);
    const leads = S('path', { d: 'M402 230 H250 V300 M402 430 H250 V360 M878 290 H1030 V310 M878 370 H1030 V350', fill: 'none', stroke: C.muted, 'stroke-width': 3, opacity: 0 }, g);
    const src = S('g', { opacity: 0 }, g);
    S('circle', { cx: 250, cy: 330, r: 34, fill: '#221D19', stroke: C.ink, 'stroke-width': 3 }, src);
    const srcWave = S('path', { fill: 'none', stroke: C.orange, 'stroke-width': 4, 'stroke-linecap': 'round' }, src);
    const srcLab = T(src, 250, 400, '240 V a.c.', { size: 22, weight: 800, anchor: 'middle' });
    const out = S('g', { opacity: 0 }, g);
    const glow = S('circle', { cx: 1030, cy: 330, r: 60, fill: C.gold, opacity: 0 }, out);
    S('circle', { cx: 1030, cy: 330, r: 26, fill: '#2A2420', stroke: C.muted, 'stroke-width': 3 }, out);
    const bulb = S('circle', { cx: 1030, cy: 330, r: 16, fill: C.gold, opacity: 0.2 }, out);
    const outLab = T(out, 1030, 400, '12 V', { size: 22, weight: 800, anchor: 'middle' });
    const formula = S('g', { opacity: 0 }, g);
    S('rect', { x: 350, y: 30, width: 580, height: 96, rx: 22, fill: '#221D19', stroke: '#3A332E', 'stroke-width': 2 }, formula);
    const fA = T(formula, 640, 94, 'Vs ÷ Vp  =  Ns ÷ Np', { size: 40, weight: 800, anchor: 'middle', fill: C.peach });
    const calc = S('g', { opacity: 0 }, g);
    S('rect', { x: 300, y: 590, width: 680, height: 80, rx: 20, fill: '#221D19', stroke: C.orange, 'stroke-width': 2 }, calc);
    T(calc, 640, 642, 'Vs = 240 × 100 ÷ 2000 = 12 V', { size: 32, weight: 800, anchor: 'middle', fill: C.ink });
    const dcTag = pill(g, 920, 470, 'd.c. → no change → 0 V', C.blue);
    const OM = 2 * Math.PI * 1.1;
    return (lt, B, P) => {
      core.setAttribute('opacity', ease(P(0, 0, 0.3)).toFixed(3));
      [P1, P2].forEach((c, ci) => {
        const d = ease(P(0, 0.25 + ci * 0.25, 0.6 + ci * 0.25));
        c.paths.forEach((p, k) => p.setAttribute('opacity', clamp(d * c.paths.length / 2 - Math.floor(k / 2)).toFixed(3)));
        c.lab.setAttribute('opacity', d.toFixed(3));
      });
      const ac = 1 - ease(P(5, 0, 0.3));
      const on = ease(P(1, 0, 0.3));
      const s = Math.sin(lt * OM) * ac;
      flux.setAttribute('opacity', (on * (0.35 + 0.65 * ac)).toFixed(3));
      flux.setAttribute('stroke-dashoffset', (s * 70).toFixed(1));
      leads.setAttribute('opacity', on.toFixed(3));
      src.setAttribute('opacity', on.toFixed(3));
      let d = 'M226 330';
      for (let k = 0; k <= 24; k++) { const x = 226 + k * 2, y = 330 - Math.sin(k / 24 * 2 * Math.PI + lt * OM) * 14 * ac; d += ` L${x} ${y.toFixed(1)}`; }
      srcWave.setAttribute('d', d);
      srcLab.textContent = ac < 0.5 ? '240 V d.c.' : '240 V a.c.';
      const o2 = ease(P(2, 0, 0.3));
      out.setAttribute('opacity', o2.toFixed(3));
      const gl = Math.abs(Math.cos(lt * OM)) * ac;
      bulb.setAttribute('opacity', (0.2 + 0.8 * gl).toFixed(3)); glow.setAttribute('opacity', (0.35 * gl).toFixed(3));
      outLab.textContent = ac < 0.5 ? '0 V' : '12 V'; outLab.setAttribute('fill', ac < 0.5 ? C.sky : C.ink);
      formula.setAttribute('opacity', easeOut(P(3, 0.05, 0.3)).toFixed(3));
      fA.setAttribute('transform', `translate(0 ${((1 - easeOut(P(3, 0.05, 0.3))) * 10).toFixed(1)})`);
      calc.setAttribute('opacity', (easeOut(P(4, 0.1, 0.35)) * (1 - ease(P(5, 0, 0.2)))).toFixed(3));
      show(dcTag, easeOut(P(5, 0.35, 0.55)), -10);
    };
  },
};

const recap = {
  chapter: 'Recap',
  beats: [
    'Quick recap. One: a changing magnetic flux induces an e.m.f. No change, no current.',
    'Two: a faster change, more turns or a stronger magnet give a bigger e.m.f.',
    "Three: by Lenz's law, the induced current always opposes the change.",
    'And four: a transformer changes voltage in the ratio of its turns, and only works with a.c. Now try the practice questions!',
  ],
  build(g) {
    T(g, 640, 110, 'Recap', { size: 52, weight: 800, anchor: 'middle' });
    const cards = [
      ['1', 'Changing flux → e.m.f.', 'No change, no current.', C.orange],
      ['2', 'E = N ΔΦ ÷ Δt', 'Faster, more turns, stronger magnet.', C.sky],
      ['3', "Lenz's law", 'The current opposes the change.', C.green],
      ['4', 'Vs ÷ Vp = Ns ÷ Np', 'Transformers need a.c.', C.peach],
    ].map(([n, h, p, c], i) => {
      const x = i % 2 ? 660 : 160, y = i < 2 ? 160 : 400;
      const cg = S('g', { opacity: 0 }, g);
      S('rect', { x, y, width: 460, height: 200, rx: 26, fill: '#221D19', stroke: '#3A332E', 'stroke-width': 2 }, cg);
      S('circle', { cx: x + 52, cy: y + 56, r: 26, fill: c }, cg);
      T(cg, x + 52, y + 66, n, { size: 26, weight: 800, anchor: 'middle', fill: '#1C0A00' });
      T(cg, x + 36, y + 130, h, { size: 34, weight: 800 });
      T(cg, x + 36, y + 170, p, { size: 22, weight: 600, fill: C.muted });
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

export default { title: 'Electromagnetic induction', poster: 6.4, scenes: [intro, experiment, faraday, lenz, generator, transformer, recap] };

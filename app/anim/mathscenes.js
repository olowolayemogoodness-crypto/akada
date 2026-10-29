// Manim-style maths animations (dark board, curves drawing themselves, equations transforming), built with SVG + GSAP.
import gsap from 'gsap';

const W = 640, H = 320;
const NS = 'http://www.w3.org/2000/svg';
const C = { bg: '#141210', grid: '#2A2522', axis: '#78716C', white: '#F5F5F4', orange: '#F97316', yellow: '#FACC15', blue: '#60A5FA', green: '#4ADE80' };

function board(el, title) {
  el.innerHTML = `<div class="mboard"><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet"></svg>
    <div class="mcap" aria-live="polite"></div></div>
    <div class="controls"><div class="small" style="font-weight:800;flex:1">${title}</div>
      <button class="btn ghost sm" data-m="play">Pause</button><button class="btn ghost sm" data-m="replay">Replay</button></div>`;
  const svg = el.querySelector('svg');
  const cap = el.querySelector('.mcap');
  const add = (tag, attrs, parent = svg) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); parent.appendChild(n); return n; };
  add('rect', { x: 0, y: 0, width: W, height: H, fill: C.bg });
  return { svg, add, cap };
}
function mapper(xmin, xmax, ymin, ymax, pad = { l: 40, r: 30, t: 24, b: 30 }) {
  const X = (x) => pad.l + ((x - xmin) / (xmax - xmin)) * (W - pad.l - pad.r);
  const Y = (y) => H - pad.b - ((y - ymin) / (ymax - ymin)) * (H - pad.t - pad.b);
  return { X, Y, xmin, xmax, ymin, ymax };
}
function axes(B, M) {
  const g = B.add('g', {});
  for (let x = Math.ceil(M.xmin); x <= M.xmax; x++) B.add('line', { x1: M.X(x), y1: M.Y(M.ymin), x2: M.X(x), y2: M.Y(M.ymax), stroke: C.grid, 'stroke-width': 1 }, g);
  for (let y = Math.ceil(M.ymin); y <= M.ymax; y++) B.add('line', { x1: M.X(M.xmin), y1: M.Y(y), x2: M.X(M.xmax), y2: M.Y(y), stroke: C.grid, 'stroke-width': 1 }, g);
  const ax = B.add('path', { d: `M${M.X(M.xmin)} ${M.Y(0)}H${M.X(M.xmax)}M${M.X(0)} ${M.Y(M.ymin)}V${M.Y(M.ymax)}`, stroke: C.axis, 'stroke-width': 2, fill: 'none' });
  return { grid: g, ax };
}
const pathOf = (M, f, a, b, n = 120) => { let d = ''; for (let i = 0; i <= n; i++) { const x = a + ((b - a) * i) / n; d += (i ? 'L' : 'M') + M.X(x).toFixed(1) + ' ' + M.Y(f(x)).toFixed(1); } return d; };
function drawOn(tl, el, dur = 1.2, at) {
  const len = el.getTotalLength();
  gsap.set(el, { strokeDasharray: len, strokeDashoffset: len });
  tl.to(el, { strokeDashoffset: 0, duration: dur, ease: 'power1.inOut' }, at);
}
function text(B, x, y, str, { size = 20, color = C.white, anchor = 'start', weight = 700 } = {}) {
  const t = B.add('text', { x, y, fill: color, 'font-size': size, 'font-weight': weight, 'text-anchor': anchor, 'font-family': 'Plus Jakarta Sans, system-ui, sans-serif', opacity: 0 });
  t.textContent = str;
  return t;
}
// Equation "transform": the old line slides up and fades while the new one rises in.
function swap(tl, from, to, at) {
  tl.to(from, { opacity: 0, y: -14, duration: 0.4 }, at).fromTo(to, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' }, '<0.15');
}
function caption(tl, B, str, at) { tl.call(() => { B.cap.textContent = str; gsap.fromTo(B.cap, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.35 }); }, null, at); }
function controlsFor(el, tl) {
  const play = el.querySelector('[data-m="play"]');
  play.addEventListener('click', () => { if (tl.paused() || tl.progress() === 1) { tl.progress() === 1 ? tl.restart() : tl.play(); play.textContent = 'Pause'; } else { tl.pause(); play.textContent = 'Play'; } });
  el.querySelector('[data-m="replay"]').addEventListener('click', () => { tl.restart(); play.textContent = 'Pause'; });
  tl.eventCallback('onComplete', () => (play.textContent = 'Play'));
}

// ---------------------------------------------------------------- derivative as a limit
function deriv(el) {
  const B = board(el, 'From secant to tangent: how dy/dx is born');
  const M = mapper(-1.2, 3.4, -1, 10, { l: 30, r: 300, t: 20, b: 26 });
  const A = axes(B, M);
  const f = (x) => x * x;
  const curve = B.add('path', { d: pathOf(M, f, -1, 3.15), stroke: C.blue, 'stroke-width': 4, fill: 'none', 'stroke-linecap': 'round' });
  const lab = text(B, M.X(1.6), M.Y(8.6), 'y = x²', { color: C.blue });
  const secant = B.add('line', { stroke: C.orange, 'stroke-width': 3, opacity: 0 });
  const P = B.add('circle', { cx: M.X(1), cy: M.Y(1), r: 7, fill: C.yellow, opacity: 0 });
  const Q = B.add('circle', { r: 7, fill: C.white, opacity: 0 });
  const pl = text(B, M.X(1) + 10, M.Y(1) + 22, 'P(1, 1)', { size: 15, color: C.yellow });
  const ql = text(B, 0, 0, 'Q', { size: 15 });
  const gtxt = text(B, 360, 52, '', { size: 18, color: C.orange });
  const e1 = text(B, 360, 92, 'gradient = [(x + h)² − x²] ÷ h', { size: 17 });
  const e2 = text(B, 360, 92, '= (2xh + h²) ÷ h', { size: 17 });
  const e3 = text(B, 360, 92, '= 2x + h', { size: 17 });
  const e4 = text(B, 360, 92, 'h → 0 :  dy/dx = 2x', { size: 19, color: C.green });
  const st = { h: 2 };
  const setQ = () => {
    const x2 = 1 + st.h, y2 = f(x2), m = (y2 - 1) / st.h;
    Q.setAttribute('cx', M.X(x2)); Q.setAttribute('cy', M.Y(y2));
    ql.setAttribute('x', M.X(x2) + 10); ql.setAttribute('y', M.Y(y2) + 4);
    const xa = -1.1, xb = 3.3;
    secant.setAttribute('x1', M.X(xa)); secant.setAttribute('y1', M.Y(1 + m * (xa - 1)));
    secant.setAttribute('x2', M.X(xb)); secant.setAttribute('y2', M.Y(1 + m * (xb - 1)));
    gtxt.textContent = `h = ${st.h.toFixed(2)}   gradient = ${m.toFixed(2)}`;
  };
  setQ();
  const tl = gsap.timeline();
  drawOn(tl, A.ax, 0.8);
  tl.from(A.grid, { opacity: 0, duration: 0.6 }, '<');
  drawOn(tl, curve, 1.3);
  tl.to(lab, { opacity: 1, duration: 0.4 });
  caption(tl, B, 'Pick a point P on the curve, and another point Q a little further along.');
  tl.to([P, pl], { opacity: 1, duration: 0.3 }).fromTo(P, { attr: { r: 0 } }, { attr: { r: 7 }, duration: 0.35, ease: 'back.out(3)' }, '<');
  tl.to([Q, ql, secant, gtxt], { opacity: 1, duration: 0.4 });
  caption(tl, B, 'The line through P and Q is a secant. Its gradient is rise ÷ run.');
  tl.to(e1, { opacity: 1, duration: 0.4 });
  tl.to({}, { duration: 0.8 });
  caption(tl, B, 'Now slide Q towards P: make h smaller and smaller…');
  tl.to(st, { h: 0.001, duration: 4, ease: 'power2.inOut', onUpdate: setQ });
  swap(tl, e1, e2, '-=3');
  swap(tl, e2, e3, '-=1.6');
  swap(tl, e3, e4);
  caption(tl, B, 'The secant becomes the tangent. Its gradient is the derivative: at x = 1, dy/dx = 2.');
  tl.to(secant, { attr: { 'stroke-width': 5 }, duration: 0.3, yoyo: true, repeat: 3 });
  tl.to({}, { duration: 1.5 });
  controlsFor(el, tl);
  return () => tl.kill();
}

// ---------------------------------------------------------------- completing the square
function square(el) {
  const B = board(el, 'Completing the square: where is the minimum?');
  const M = mapper(-3.2, 5.2, -1, 10, { l: 30, r: 300, t: 20, b: 26 });
  const A = axes(B, M);
  const base = B.add('path', { d: pathOf(M, (x) => x * x, -3.1, 3.1), stroke: C.axis, 'stroke-width': 3, fill: 'none', 'stroke-dasharray': '6 6', opacity: 0 });
  const moving = B.add('g', {});
  const par = B.add('path', { d: pathOf(M, (x) => x * x, -3.1, 3.1), stroke: C.orange, 'stroke-width': 4, fill: 'none', 'stroke-linecap': 'round', opacity: 0 }, moving);
  const vdot = B.add('circle', { cx: M.X(0), cy: M.Y(0), r: 7, fill: C.yellow, opacity: 0 }, moving);
  const l1 = text(B, 352, 50, 'y = x² − 4x + 7', { size: 22 });
  const l2 = text(B, 352, 90, 'y = (x² − 4x + 4) + 3', { size: 20, color: C.blue });
  const l3 = text(B, 352, 130, 'y = (x − 2)² + 3', { size: 24, color: C.orange });
  const note = text(B, 352, 170, 'half of −4 is −2;  (−2)² = 4', { size: 15, color: C.yellow });
  const vlab = text(B, 360, 210, 'minimum point (2, 3)', { size: 17, color: C.yellow });
  const dx = M.X(2) - M.X(0), dy = M.Y(3) - M.Y(0);
  const tl = gsap.timeline();
  drawOn(tl, A.ax, 0.8);
  tl.from(A.grid, { opacity: 0, duration: 0.6 }, '<');
  tl.to(l1, { opacity: 1, duration: 0.5 });
  caption(tl, B, 'Start with y = x² − 4x + 7. Where does its graph turn?');
  tl.to([base, par, vdot], { opacity: 1, duration: 0.5 });
  caption(tl, B, 'Every parabola like this is just y = x² moved somewhere. Let\'s find where.');
  tl.to(note, { opacity: 1, duration: 0.4 });
  caption(tl, B, 'Take half of the x-coefficient and square it. Add it and take it away.');
  tl.fromTo(l2, { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.5 });
  tl.to({}, { duration: 0.8 });
  tl.fromTo(l3, { opacity: 0, scale: 0.9, transformOrigin: 'left center' }, { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(2)' });
  caption(tl, B, '(x − 2)² is never negative, so y is smallest when x = 2. Then y = 3.');
  tl.to(moving, { x: dx, y: dy, duration: 1.6, ease: 'power2.inOut' });
  tl.to(vlab, { opacity: 1, duration: 0.4 });
  tl.to(vdot, { attr: { r: 11 }, duration: 0.3, yoyo: true, repeat: 3 });
  caption(tl, B, 'Turning point (2, 3): minimum value 3. Same answer as x = −b ÷ 2a = 2.');
  tl.to({}, { duration: 1.5 });
  controlsFor(el, tl);
  return () => tl.kill();
}

// ---------------------------------------------------------------- powers and logs
function powers(el) {
  const B = board(el, 'Powers and logs are mirror images');
  const M = mapper(-1.2, 9.4, -1.2, 9.4, { l: 30, r: 260, t: 20, b: 26 });
  const A = axes(B, M);
  const pts = [0, 1, 2, 3].map((x) => [x, 2 ** x]);
  const st = { t: 0 };
  const curvePts = [];
  for (let i = 0; i <= 80; i++) { const x = -1 + (i / 80) * 4.17; curvePts.push([x, 2 ** x]); }
  const curve = B.add('path', { stroke: C.blue, 'stroke-width': 4, fill: 'none', 'stroke-linecap': 'round' });
  const diag = B.add('path', { d: `M${M.X(-1)} ${M.Y(-1)}L${M.X(9.2)} ${M.Y(9.2)}`, stroke: C.axis, 'stroke-width': 2, 'stroke-dasharray': '7 7', fill: 'none', opacity: 0 });
  const dots = pts.map(() => B.add('circle', { r: 6, fill: C.yellow, opacity: 0 }));
  const labs = pts.map(() => text(B, 0, 0, '', { size: 13, color: C.yellow }));
  const name = text(B, M.X(2.4), M.Y(7.6), 'y = 2ˣ', { color: C.blue });
  const name2 = text(B, M.X(6.2), M.Y(1.2), 'y = log₂ x', { color: C.orange });
  const lerp = (a, b, t) => a + (b - a) * t;
  const place = () => {
    const t = st.t;
    curve.setAttribute('d', curvePts.map(([x, y], i) => `${i ? 'L' : 'M'}${M.X(lerp(x, y, t)).toFixed(1)} ${M.Y(lerp(y, x, t)).toFixed(1)}`).join(''));
    curve.setAttribute('stroke', t > 0.5 ? C.orange : C.blue);
    pts.forEach(([x, y], i) => {
      const px = lerp(x, y, t), py = lerp(y, x, t);
      dots[i].setAttribute('cx', M.X(px)); dots[i].setAttribute('cy', M.Y(py));
      labs[i].setAttribute('x', M.X(px) + 8); labs[i].setAttribute('y', M.Y(py) - 8);
      labs[i].textContent = t < 0.5 ? `(${x}, ${y})` : `(${y}, ${x})`;
    });
  };
  place();
  const p1 = text(B, 400, 60, '2³ = 8', { size: 26 });
  const p2 = text(B, 400, 60, 'log₂ 8 = 3', { size: 26, color: C.orange });
  const p3 = text(B, 400, 92, '"what power of 2 gives 8?"', { size: 14, color: C.yellow });
  const law = B.add('g', { opacity: 0 });
  const lawT = text(B, 400, 160, '2³ × 2² = 2⁵', { size: 22 });
  const blocks = [];
  for (let i = 0; i < 5; i++) blocks.push(B.add('rect', { x: 400 + i * 40 + (i > 2 ? 18 : 0), y: 180, width: 32, height: 32, rx: 6, fill: i < 3 ? C.orange : C.blue }, law));
  const btxt = [...Array(5)].map((_, i) => { const t = text(B, 416 + i * 40 + (i > 2 ? 18 : 0), 202, '2', { size: 15, color: '#1C1917', anchor: 'middle' }); law.appendChild(t); gsap.set(t, { opacity: 1 }); return t; });
  const rule = text(B, 400, 246, 'multiply → add the powers', { size: 15, color: C.green });
  const tl = gsap.timeline();
  drawOn(tl, A.ax, 0.8);
  tl.from(A.grid, { opacity: 0, duration: 0.6 }, '<');
  drawOn(tl, curve, 1.3);
  tl.set(curve, { strokeDasharray: 'none', strokeDashoffset: 0 });
  tl.to(name, { opacity: 1, duration: 0.3 });
  caption(tl, B, 'y = 2ˣ doubles every step: 1, 2, 4, 8 …');
  tl.to([...dots, ...labs], { opacity: 1, duration: 0.3, stagger: 0.12 });
  tl.to(p1, { opacity: 1, duration: 0.4 });
  caption(tl, B, 'Now reflect it in the line y = x: swap every x and y.');
  tl.to(diag, { opacity: 1, duration: 0.4 });
  tl.to(name, { opacity: 0, duration: 0.3 });
  tl.to(st, { t: 1, duration: 2.2, ease: 'power2.inOut', onUpdate: place });
  tl.to(name2, { opacity: 1, duration: 0.3 });
  swap(tl, p1, p2);
  tl.to(p3, { opacity: 1, duration: 0.4 });
  caption(tl, B, 'That mirror curve is y = log₂ x. A log tells you the power.');
  tl.to({}, { duration: 1 });
  tl.to([law, lawT], { opacity: 1, duration: 0.4 });
  caption(tl, B, 'Three 2s times two 2s is five 2s multiplied together.');
  tl.to(blocks.slice(3), { x: -18, duration: 0.6, ease: 'power2.inOut' });
  tl.to(btxt.slice(3), { x: -18, duration: 0.6, ease: 'power2.inOut' }, '<');
  tl.to(blocks, { fill: C.orange, duration: 0.3 });
  tl.to(rule, { opacity: 1, duration: 0.4 });
  tl.to({}, { duration: 1.5 });
  controlsFor(el, tl);
  return () => tl.kill();
}

export const MATH_SCENES = { deriv, square, powers };

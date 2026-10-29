// Slide a point along a curve: the tangent line shows the gradient dy/dx at that point.
import { controls, range, statBox } from './kit.js';
import { plot } from './graph2d.js';

const CURVES = {
  sq: { label: 'y = x²', f: (x) => x * x, d: (x) => 2 * x, dl: 'dy/dx = 2x', view: [-5, 5, -2, 12] },
  cube: { label: 'y = x³ − 3x', f: (x) => x ** 3 - 3 * x, d: (x) => 3 * x * x - 3, dl: 'dy/dx = 3x² − 3', view: [-3, 3, -6, 6] },
  hill: { label: 'y = 4 + 6x − x²', f: (x) => 4 + 6 * x - x * x, d: (x) => 6 - 2 * x, dl: 'dy/dx = 6 − 2x', view: [-2, 8, -4, 16] },
  sin: { label: 'y = sin x', f: Math.sin, d: Math.cos, dl: 'dy/dx = cos x', view: [-6.5, 6.5, -2, 2] },
};
const fmt = (v) => (Math.abs(v) < 0.005 ? '0' : v.toFixed(2)).replace('-', '−');

export function mount(section) {
  const P = plot(section.querySelector('.stage'));
  const bar = controls(section,
    `<div class="seg">${Object.entries(CURVES).map(([k, c], i) => `<button data-c="${k}" class="${i === 0 ? 'on' : ''}">${c.label}</button>`).join('')}</div>` +
    range('tx', 'Move the point: x', -4, 4, 0.05, 1) +
    `<div class="row gap">${statBox('ty', 'y', '')}${statBox('tg', 'GRADIENT', '')}${statBox('tf', 'RULE', '')}</div>`,
    'The orange line touches the curve at one point; its steepness is the derivative there. Where the line is flat (gradient 0) you are at a turning point: a maximum or minimum.');
  const $ = (id) => bar.querySelector('#' + id);
  let key = 'sq', x = 1;
  function setCurve(k) {
    key = k; const v = CURVES[k].view;
    Object.assign(P.view, { xmin: v[0], xmax: v[1], ymin: v[2], ymax: v[3] });
    const s = $('tx'); s.min = v[0] + 0.3; s.max = v[1] - 0.3;
    x = Math.min(Math.max(x, +s.min), +s.max); s.value = x;
    draw();
  }
  function draw() {
    P.fit(); P.clear();
    const C = CURVES[key], y = C.f(x), m = C.d(x);
    P.curve(C.f, '#1C1917', 3);
    const L = (P.view.xmax - P.view.xmin) * 0.22;
    P.line(x - L, y - m * L, x + L, y + m * L, '#F97316', 3.5);
    P.dot(x, y, '#F97316', 7);
    P.text(Math.abs(m) < 0.05 ? 'gradient = 0 (turning point)' : `gradient = ${fmt(m)}`, x, y, '#C2410C', 12, -12);
    $('tx-v').textContent = fmt(x); $('ty').textContent = fmt(y); $('tg').textContent = fmt(m); $('tf').textContent = C.dl;
  }
  bar.querySelectorAll('[data-c]').forEach((b) => b.addEventListener('click', () => { bar.querySelectorAll('[data-c]').forEach((z) => z.classList.toggle('on', z === b)); setCurve(b.dataset.c); }));
  $('tx').addEventListener('input', (e) => { x = +e.target.value; draw(); });
  const ro = new ResizeObserver(draw); ro.observe(section.querySelector('.stage'));
  setCurve('sq');
  return () => ro.disconnect();
}

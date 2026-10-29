// y = ax² + bx + c: move the sliders and watch the roots, discriminant and turning point change.
import { controls, range, statBox } from './kit.js';
import { plot } from './graph2d.js';

const fmt = (v) => (Math.abs(v - Math.round(v)) < 1e-9 ? String(Math.round(v)) : v.toFixed(2)).replace('-', '−');

export function mount(section) {
  const P = plot(section.querySelector('.stage'));
  const bar = controls(section,
    range('qa', 'a', -3, 3, 0.5, 1) + range('qb', 'b', -8, 8, 0.5, -5) + range('qc', 'c', -8, 10, 0.5, 6) +
    `<div class="row gap">${statBox('qd', 'b² − 4ac', '')}${statBox('qr', 'ROOTS', '')}${statBox('qs', 'SUM · PRODUCT', '')}</div>`,
    'The roots are where the curve crosses the x-axis. When b² − 4ac is positive there are two; at zero the curve just touches (equal roots); below zero it never crosses (no real roots). Sum of roots = −b/a and product = c/a.');
  const $ = (id) => bar.querySelector('#' + id);
  let a = 1, b = -5, c = 6;
  function draw() {
    P.fit(); P.clear();
    if (a === 0) { P.curve((x) => b * x + c); $('qd').textContent = '—'; $('qr').textContent = 'Not a quadratic'; $('qs').textContent = '—'; return; }
    P.curve((x) => a * x * x + b * x + c);
    const D = b * b - 4 * a * c, hx = -b / (2 * a), hy = a * hx * hx + b * hx + c;
    P.line(hx, P.view.ymin, hx, P.view.ymax, '#D6D3D1', 1.5, [6, 6]);
    P.dot(hx, hy, '#1C1917'); P.text(`turning point (${fmt(hx)}, ${fmt(hy)})`, hx, hy, '#1C1917', 10, a > 0 ? 22 : -10);
    $('qd').textContent = fmt(D);
    if (D > 1e-9) {
      const r1 = (-b - Math.sqrt(D)) / (2 * a), r2 = (-b + Math.sqrt(D)) / (2 * a);
      [r1, r2].forEach((r) => { P.dot(r, 0, '#F97316'); P.text(`x = ${fmt(r)}`, r, 0, '#C2410C', -18, -14); });
      $('qr').textContent = `${fmt(Math.min(r1, r2))} and ${fmt(Math.max(r1, r2))}`;
    } else if (Math.abs(D) <= 1e-9) { P.dot(hx, 0, '#F97316'); $('qr').textContent = `Equal: ${fmt(hx)}`; }
    else $('qr').textContent = 'No real roots';
    $('qs').textContent = `${fmt(-b / a)} · ${fmt(c / a)}`;
    ['a', 'b', 'c'].forEach((k) => ($('q' + k + '-v').textContent = fmt({ a, b, c }[k])));
  }
  $('qa').addEventListener('input', (e) => { a = +e.target.value; draw(); });
  $('qb').addEventListener('input', (e) => { b = +e.target.value; draw(); });
  $('qc').addEventListener('input', (e) => { c = +e.target.value; draw(); });
  const ro = new ResizeObserver(draw); ro.observe(section.querySelector('.stage'));
  draw();
  return () => ro.disconnect();
}

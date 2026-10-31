// Virtual lab kit: glassware and effects drawn in SVG for practical-chemistry lessons.
// Each piece is created once and then updated every frame from the lesson's time,
// so a new practical is mostly a matter of arranging pieces and saying what happens.
import { S, C, clamp, lerp } from './videoplayer.js';

const GLASS = 'rgba(220,235,255,0.10)', RIM = 'rgba(220,235,255,0.75)';
const FONT = "'Plus Jakarta Sans', system-ui, sans-serif";

// Repeatable "random" numbers, so a scrubbed video always looks the same.
export function seeded(n) {
  let s = n * 9301 + 49297;
  return () => ((s = (s * 9301 + 49297) % 233280) / 233280);
}

let uid = 0;
const clip = (g, d) => { const id = 'lk' + (++uid); S('path', { d }, S('clipPath', { id }, S('defs', {}, g))); return `url(#${id})`; };

export function label(g, x, y, text, { anchor = 'start', size = 18, fill = C.muted, weight = 600, line } = {}) {
  const grp = S('g', { opacity: 0 }, g);
  if (line) S('path', { d: line, stroke: C.dim, 'stroke-width': 1.5, fill: 'none' }, grp);
  const t = S('text', { x, y, fill, 'font-family': FONT, 'font-size': size, 'font-weight': weight, 'text-anchor': anchor }, grp);
  t.textContent = text;
  return { g: grp, set: (a) => grp.setAttribute('opacity', a.toFixed(3)), text: t };
}

export function bench(g, y = 610) {
  S('rect', { x: 0, y, width: 1280, height: 600, fill: '#2A211B' }, g);
  S('rect', { x: 0, y, width: 1280, height: 6, fill: '#4A3A2E' }, g);
}

// Bunsen burner with a flickering blue flame.
export function burner(g, x, y) {
  const grp = S('g', {}, g);
  S('rect', { x: x - 34, y: y - 10, width: 68, height: 10, rx: 3, fill: '#78716C' }, grp);
  S('rect', { x: x - 9, y: y - 70, width: 18, height: 62, fill: '#A8A29E' }, grp);
  S('rect', { x: x - 12, y: y - 40, width: 24, height: 10, rx: 2, fill: '#57534E' }, grp);
  const outer = S('path', { fill: '#60A5FA', opacity: 0 }, grp);
  const inner = S('path', { fill: '#BFDBFE', opacity: 0 }, grp);
  return {
    g: grp,
    set(on, t) {
      const h = 46 + Math.sin(t * 23) * 4 + Math.sin(t * 37) * 2;
      outer.setAttribute('d', `M${x - 9} ${y - 70} Q${x - 14} ${y - 70 - h * 0.5} ${x} ${y - 70 - h} Q${x + 14} ${y - 70 - h * 0.5} ${x + 9} ${y - 70} Z`);
      inner.setAttribute('d', `M${x - 5} ${y - 70} Q${x - 7} ${y - 70 - h * 0.3} ${x} ${y - 70 - h * 0.55} Q${x + 7} ${y - 70 - h * 0.3} ${x + 5} ${y - 70} Z`);
      outer.setAttribute('opacity', (0.85 * on).toFixed(3)); inner.setAttribute('opacity', (0.9 * on).toFixed(3));
    },
  };
}

// Round-bottomed flask with a liquid level, crystals at the bottom and froth.
export function flask(g, cx, cy, r = 78) {
  const neckW = 30, neckH = 90;
  const d = `M${cx - neckW / 2} ${cy - r - neckH} V${cy - r * 0.92} A${r} ${r} 0 1 0 ${cx + neckW / 2} ${cy - r * 0.92} V${cy - r - neckH}`;
  const grp = S('g', {}, g);
  S('path', { d: d + ' Z', fill: GLASS }, grp);
  const cl = clip(grp, d + ' Z');
  const liquid = S('rect', { x: cx - r, y: cy + r, width: 2 * r, height: 0, fill: '#E7E5E4', opacity: 0.55, 'clip-path': cl }, grp);
  const crystals = S('g', { 'clip-path': cl }, grp);
  const rnd = seeded(3);
  for (let i = 0; i < 46; i++) {
    const a = (rnd() - 0.5) * 1.9, rr = r - 8 - rnd() * 22;
    S('rect', { x: cx + Math.sin(a) * rr - 4, y: cy + Math.cos(a) * rr - 6 - rnd() * 8, width: 6 + rnd() * 5, height: 5 + rnd() * 4, fill: '#F5F5F4', transform: `rotate(${rnd() * 60} ${cx} ${cy})`, opacity: 0.95 }, crystals);
  }
  const froth = S('g', { 'clip-path': cl }, grp);
  const bubbles = Array.from({ length: 28 }, (_, i) => { const rb = seeded(10 + i); return { x: cx + (rb() - 0.5) * r * 1.4, sp: 0.5 + rb(), ph: rb(), s: 3 + rb() * 5, el: S('circle', { r: 4, fill: 'none', stroke: '#fff', 'stroke-width': 1.5, opacity: 0 }, froth) }; });
  S('path', { d, fill: 'none', stroke: RIM, 'stroke-width': 2.5 }, grp);
  return {
    g: grp, top: { x: cx, y: cy - r - neckH }, neckY: cy - r - neckH,
    set({ level = 0, color = '#E7E5E4', froth: f = 0, t = 0 }) {
      const h = level * r * 1.3;
      liquid.setAttribute('y', (cy + r - h).toFixed(1)); liquid.setAttribute('height', h.toFixed(1)); liquid.setAttribute('fill', color);
      const surf = cy + r - h;
      bubbles.forEach((b) => {
        const p = (t * b.sp + b.ph) % 1;
        b.el.setAttribute('cx', (b.x + Math.sin(p * 9 + b.ph * 6) * 4).toFixed(1));
        b.el.setAttribute('cy', (cy + r - 6 - p * (cy + r - surf + 10)).toFixed(1));
        b.el.setAttribute('r', (b.s * (0.6 + p * 0.6)).toFixed(1));
        b.el.setAttribute('opacity', (f * 0.8 * (1 - p * 0.6)).toFixed(3));
      });
    },
  };
}

// Tap (dropping) funnel: a bulb of liquid above a tap, with drops falling from the tip.
export function tapFunnel(g, x, yTip, color = '#FDE68A') {
  const grp = S('g', {}, g);
  const bulbTop = yTip - 170;
  const d = `M${x - 34} ${bulbTop} H${x + 34} L${x + 30} ${bulbTop + 70} L${x + 6} ${yTip - 60} V${yTip} H${x - 6} V${yTip - 60} L${x - 30} ${bulbTop + 70} Z`;
  S('path', { d, fill: GLASS }, grp);
  const cl = clip(grp, d);
  const liq = S('rect', { x: x - 40, y: bulbTop + 10, width: 80, height: 200, fill: color, opacity: 0.5, 'clip-path': cl }, grp);
  S('path', { d, fill: 'none', stroke: RIM, 'stroke-width': 2.5 }, grp);
  const tap = S('rect', { x: x - 16, y: yTip - 48, width: 32, height: 10, rx: 4, fill: '#A8A29E' }, grp);
  const drops = Array.from({ length: 3 }, () => S('ellipse', { rx: 4, ry: 6, fill: color, opacity: 0 }, grp));
  return {
    g: grp,
    set({ level = 1, open = 0, t = 0, fall = 90 }) {
      liq.setAttribute('y', (bulbTop + 10 + (1 - level) * 90).toFixed(1));
      tap.setAttribute('transform', `rotate(${open > 0.5 ? 90 : 0} ${x} ${yTip - 43})`);
      drops.forEach((dr, i) => {
        const p = (t * 1.6 + i / 3) % 1;
        dr.setAttribute('cx', x); dr.setAttribute('cy', (yTip + p * fall).toFixed(1));
        dr.setAttribute('opacity', (open * (p < 0.9 ? 0.9 : 0)).toFixed(3));
      });
    },
  };
}

export function tube(g, d, width = 9) {
  S('path', { d, fill: 'none', stroke: RIM, 'stroke-width': width, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', opacity: 0.35 }, g);
  S('path', { d, fill: 'none', stroke: 'rgba(20,17,15,0.9)', 'stroke-width': width - 4, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, g);
  return S('path', { d, fill: 'none', stroke: '#fff', 'stroke-width': 3, 'stroke-dasharray': '3 16', 'stroke-linecap': 'round', opacity: 0 }, g);
}

// Gas jar that fills with a faint gas from the bottom (downward delivery) or the top.
export function gasJar(g, x, yBottom, w = 120, h = 210) {
  const grp = S('g', {}, g);
  const d = `M${x - w / 2} ${yBottom - h} V${yBottom - 8} Q${x - w / 2} ${yBottom} ${x - w / 2 + 8} ${yBottom} H${x + w / 2 - 8} Q${x + w / 2} ${yBottom} ${x + w / 2} ${yBottom - 8} V${yBottom - h}`;
  S('path', { d: d + ' Z', fill: GLASS }, grp);
  const cl = clip(grp, d + ' Z');
  const gas = S('rect', { x: x - w / 2, y: yBottom, width: w, height: 0, fill: '#E0F2FE', opacity: 0.22, 'clip-path': cl }, grp);
  S('path', { d, fill: 'none', stroke: RIM, 'stroke-width': 2.5 }, grp);
  S('rect', { x: x - w / 2 - 6, y: yBottom - h - 4, width: w + 12, height: 6, rx: 3, fill: RIM, opacity: 0.6 }, grp);
  return { g: grp, mouth: { x, y: yBottom - h }, set: (fill) => { const hh = fill * (h - 4); gas.setAttribute('y', (yBottom - hh).toFixed(1)); gas.setAttribute('height', hh.toFixed(1)); } };
}

// White fumes or smoke: soft puffs rising and spreading from a point.
export function fumes(g, n = 26, seed = 5) {
  const grp = S('g', {}, g);
  const puffs = Array.from({ length: n }, (_, i) => { const r = seeded(seed + i); return { dx: (r() - 0.5) * 2, sp: 0.25 + r() * 0.35, ph: r(), s: 10 + r() * 16, el: S('circle', { fill: '#F5F5F4', opacity: 0 }, grp) }; });
  return {
    g: grp,
    set({ x, y, amount = 0, t = 0, rise = 120, spread = 50, dense = 0.35 }) {
      puffs.forEach((p) => {
        const k = (t * p.sp + p.ph) % 1;
        p.el.setAttribute('cx', (x + p.dx * spread * (0.3 + k)).toFixed(1));
        p.el.setAttribute('cy', (y - k * rise).toFixed(1));
        p.el.setAttribute('r', (p.s * (0.5 + k)).toFixed(1));
        p.el.setAttribute('opacity', (amount * dense * Math.sin(Math.PI * k)).toFixed(3));
      });
    },
  };
}

export function litmus(g) {
  const grp = S('g', { opacity: 0 }, g);
  S('rect', { x: -6, y: -150, width: 12, height: 110, fill: '#A8A29E' }, grp);
  const paper = S('rect', { x: -14, y: -44, width: 28, height: 70, rx: 3, fill: '#3B82F6' }, grp);
  return {
    g: grp,
    set({ x, y, show = 1, red = 0 }) {
      grp.setAttribute('transform', `translate(${x} ${y})`); grp.setAttribute('opacity', show.toFixed(3));
      const c = (a, b) => Math.round(lerp(a, b, red));
      paper.setAttribute('fill', `rgb(${c(59, 239)},${c(130, 68)},${c(246, 68)})`);
    },
  };
}

export function glassRod(g) {
  const grp = S('g', { opacity: 0 }, g);
  S('rect', { x: -4, y: -170, width: 8, height: 170, rx: 4, fill: 'rgba(220,235,255,0.55)' }, grp);
  S('circle', { cx: 0, cy: 2, r: 6, fill: '#DBEAFE', opacity: 0.9 }, grp);
  return { g: grp, set({ x, y, show = 1, tilt = 0 }) { grp.setAttribute('transform', `translate(${x} ${y}) rotate(${tilt})`); grp.setAttribute('opacity', show.toFixed(3)); } };
}

// Test tube with a solution, a precipitate that forms and settles, and can dissolve again.
export function testTube(g, x, yTop, { w = 54, h = 230 } = {}) {
  const grp = S('g', {}, g);
  const d = `M${x - w / 2} ${yTop} V${yTop + h - w / 2} A${w / 2} ${w / 2} 0 0 0 ${x + w / 2} ${yTop + h - w / 2} V${yTop}`;
  S('path', { d: d + ' Z', fill: GLASS }, grp);
  const cl = clip(grp, d + ' Z');
  const sol = S('rect', { x: x - w / 2, y: yTop + h * 0.45, width: w, height: h, fill: '#93C5FD', opacity: 0.35, 'clip-path': cl }, grp);
  const cloud = S('rect', { x: x - w / 2, y: yTop, width: w, height: h, opacity: 0, 'clip-path': cl }, grp);
  const soft = 'lks' + (++uid);
  S('feGaussianBlur', { stdDeviation: 1.6 }, S('filter', { id: soft, x: '-50%', y: '-50%', width: '200%', height: '200%' }, S('defs', {}, grp)));
  const ppt = S('g', { 'clip-path': cl, filter: `url(#${soft})` }, grp);
  const rnd = seeded(Math.round(x));
  const grains = Array.from({ length: 70 }, () => ({ x: x + (rnd() - 0.5) * (w - 8), y0: yTop + h * 0.5 + rnd() * h * 0.25, yEnd: yTop + h - 6 - rnd() * 34, r: 2 + rnd() * 3.5, el: S('circle', { r: 3, opacity: 0 }, ppt) }));
  const top2 = S('rect', { x: x - w / 2, y: yTop + h * 0.45, width: w, height: 14, opacity: 0, 'clip-path': cl }, grp);
  S('path', { d, fill: 'none', stroke: RIM, 'stroke-width': 2.5 }, grp);
  S('rect', { x: x - w / 2 - 5, y: yTop - 3, width: w + 10, height: 6, rx: 3, fill: RIM, opacity: 0.6 }, grp);
  return {
    g: grp, x, yTop,
    set({ level = 0.55, solColor = '#93C5FD', solA = 0.35, ppt: p = 0, settle = 0, pptColor = '#60A5FA', dissolve = 0, skin = 0, skinColor = '#92400E' }) {
      const yS = yTop + h * (1 - level);
      sol.setAttribute('y', yS.toFixed(1)); sol.setAttribute('fill', solColor); sol.setAttribute('opacity', solA.toFixed(3));
      grains.forEach((gr, i) => {
        const vis = clamp(p * 1.4 - i / grains.length * 0.4) * (1 - dissolve);
        const yy = lerp(Math.max(gr.y0, yS + 8), gr.yEnd, settle);
        gr.el.setAttribute('cx', gr.x.toFixed(1)); gr.el.setAttribute('cy', yy.toFixed(1));
        gr.el.setAttribute('r', gr.r); gr.el.setAttribute('fill', pptColor); gr.el.setAttribute('opacity', (vis * 0.9).toFixed(3));
      });
      // a precipitate first clouds the whole liquid, then settles to the bottom
      cloud.setAttribute('y', (lerp(yS, yTop + h - 40, settle)).toFixed(1)); cloud.setAttribute('fill', pptColor);
      cloud.setAttribute('opacity', (clamp(p * 1.3) * (0.62 - 0.25 * settle) * (1 - dissolve)).toFixed(3));
      top2.setAttribute('y', yS.toFixed(1)); top2.setAttribute('fill', skinColor); top2.setAttribute('opacity', (skin * 0.75).toFixed(3));
    },
  };
}

// Dropper above a tube; drops fall while `on` is above zero.
export function dropper(g, color = '#E0F2FE') {
  const grp = S('g', { opacity: 0 }, g);
  S('rect', { x: -7, y: -110, width: 14, height: 80, rx: 3, fill: 'rgba(220,235,255,0.3)', stroke: RIM, 'stroke-width': 1.5 }, grp);
  S('path', { d: 'M-7 -30 L-2 0 H2 L7 -30 Z', fill: 'rgba(220,235,255,0.3)', stroke: RIM, 'stroke-width': 1.5 }, grp);
  S('rect', { x: -12, y: -150, width: 24, height: 44, rx: 12, fill: '#EF4444' }, grp);
  const drops = Array.from({ length: 3 }, () => S('ellipse', { rx: 3.5, ry: 5, fill: color, opacity: 0 }, grp));
  return {
    g: grp,
    set({ x, y, show = 1, on = 0, t = 0, fall = 110 }) {
      grp.setAttribute('transform', `translate(${x} ${y})`); grp.setAttribute('opacity', show.toFixed(3));
      drops.forEach((dr, i) => { const p = (t * 1.8 + i / 3) % 1; dr.setAttribute('cx', 0); dr.setAttribute('cy', (4 + p * fall).toFixed(1)); dr.setAttribute('opacity', (on * show * (p < 0.92 ? 0.9 : 0)).toFixed(3)); });
    },
  };
}

// Equation panel at the top of the frame.
export function equation(g, text, y = 70, cx = 640, size = 28) {
  const grp = S('g', { opacity: 0 }, g);
  const w = Math.max(300, text.length * size * 0.6 + 60);
  S('rect', { x: cx - w / 2, y: y - 38, width: w, height: 58, rx: 16, fill: '#221D19', stroke: '#3A332E', 'stroke-width': 2 }, grp);
  const t = S('text', { x: cx, y: y + 2, fill: C.peach, 'font-family': FONT, 'font-size': size, 'font-weight': 800, 'text-anchor': 'middle' }, grp);
  t.textContent = text;
  return { g: grp, set: (a, dy = 0) => { grp.setAttribute('opacity', a.toFixed(3)); grp.setAttribute('transform', `translate(0 ${dy})`); }, text: t };
}

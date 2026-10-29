// The mole bridge: type any one quantity and see grams, moles, particles and gas volume together.
import { controls } from './kit.js';

const SUBS = [
  { f: 'H₂O', m: 18, gas: false }, { f: 'CO₂', m: 44, gas: true }, { f: 'NaOH', m: 40, gas: false },
  { f: 'O₂', m: 32, gas: true }, { f: 'CaCO₃', m: 100, gas: false }, { f: 'NH₃', m: 17, gas: true }, { f: 'H₂SO₄', m: 98, gas: false },
];
const sci = (n) => { if (!n) return '0'; const e = Math.floor(Math.log10(Math.abs(n))); const m = n / 10 ** e; return `${m.toFixed(2)} × 10${String(e).split('').map((d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'['0123456789'.indexOf(d)] ?? '⁻').join('')}`; };
const nice = (n) => (Math.abs(n) >= 1000 || (Math.abs(n) < 0.01 && n) ? n.toExponential(2) : +n.toFixed(3)).toString();

export function mount(section) {
  const stageEl = section.querySelector('.stage');
  stageEl.style.height = 'auto';
  stageEl.innerHTML = `<div style="padding:24px;display:flex;flex-direction:column;gap:18px">
    <div class="row gap wrap"><span class="small" style="font-weight:700;color:#57534E">Substance</span>
      <div class="seg" id="msubs">${SUBS.map((s, i) => `<button data-i="${i}" class="${i === 1 ? 'on' : ''}">${s.f}</button>`).join('')}</div></div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px;align-items:stretch" id="mgrid">
      ${[['mass', 'Mass', 'g'], ['moles', 'Moles', 'mol'], ['particles', 'Particles', '× 10²³'], ['volume', 'Gas volume at s.t.p.', 'dm³']].map(([id, l, u]) => `
        <label style="background:#fff;border:1px solid #EEE8E2;border-radius:16px;padding:14px;display:flex;flex-direction:column;gap:8px">
          <span class="tiny" style="font-weight:800;color:#6B635C;letter-spacing:.04em;text-transform:uppercase">${l}</span>
          <span class="row gap"><input id="m-${id}" type="number" step="any" min="0" style="width:100%;border:0;outline:none;font-size:24px;font-weight:800;background:transparent;font-variant-numeric:tabular-nums"><span class="small muted" style="white-space:nowrap">${u}</span></span>
        </label>`).join('')}
    </div>
    <div id="msteps" class="small" style="background:#fff;border-radius:14px;padding:14px 16px;line-height:1.8;color:#44403C"></div>
  </div>`;
  controls(section, '', 'Moles are the bridge. From grams divide by molar mass; to particles multiply by 6.02 × 10²³; for a gas at s.t.p. multiply by 22.4 dm³.');
  const $ = (id) => stageEl.querySelector('#' + id);
  let sub = SUBS[1], moles = 0.1, last = 'mass';
  function render(except) {
    const mass = moles * sub.m, parts = moles * 6.02e23, vol = moles * 22.4;
    if (except !== 'mass') $('m-mass').value = nice(mass);
    if (except !== 'moles') $('m-moles').value = nice(moles);
    if (except !== 'particles') $('m-particles').value = nice(parts / 1e23);
    if (except !== 'volume') $('m-volume').value = sub.gas ? nice(vol) : '';
    $('m-volume').disabled = !sub.gas; $('m-volume').placeholder = sub.gas ? '' : 'not a gas';
    $('msteps').innerHTML = `<b>${sub.f}</b>: molar mass = <b>${sub.m} g/mol</b><br>
      moles = mass ÷ molar mass = ${nice(mass)} ÷ ${sub.m} = <b>${nice(moles)} mol</b><br>
      particles = ${nice(moles)} × 6.02 × 10²³ = <b>${sci(parts)}</b>${sub.gas ? `<br>volume = ${nice(moles)} × 22.4 = <b>${nice(vol)} dm³</b>` : ''}`;
  }
  const inputs = { mass: (v) => v / sub.m, moles: (v) => v, particles: (v) => (v * 1e23) / 6.02e23, volume: (v) => v / 22.4 };
  Object.keys(inputs).forEach((k) => $('m-' + k).addEventListener('input', (e) => {
    const v = parseFloat(e.target.value); if (!(v >= 0)) return;
    moles = inputs[k](v); last = k; render(k);
  }));
  $('msubs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-i]'); if (!b) return;
    sub = SUBS[+b.dataset.i];
    $('msubs').querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
    render();
  });
  render();
  return () => {};
}

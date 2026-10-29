// Roll two 3D dice many times and watch the experimental probability approach the theory.
import { stage, THREE, COLORS, mat, ground, controls, statBox } from './kit.js';

function faceTexture(n) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, 128, 128);
  g.fillStyle = n === 6 ? '#F97316' : '#1C1917';
  const spots = { 1: [[64, 64]], 2: [[34, 34], [94, 94]], 3: [[30, 30], [64, 64], [98, 98]], 4: [[34, 34], [94, 34], [34, 94], [94, 94]], 5: [[32, 32], [96, 32], [64, 64], [32, 96], [96, 96]], 6: [[34, 28], [94, 28], [34, 64], [94, 64], [34, 100], [94, 100]] }[n];
  for (const [x, y] of spots) { g.beginPath(); g.arc(x, y, 11, 0, Math.PI * 2); g.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
// Box face order: +x, −x, +y, −y, +z, −z → numbers so opposite faces add to 7
const FACES = [3, 4, 1, 6, 2, 5];
const UP_ROT = { 1: [0, 0], 6: [Math.PI, 0], 2: [-Math.PI / 2, 0], 5: [Math.PI / 2, 0], 3: [0, Math.PI / 2], 4: [0, -Math.PI / 2] };

export function mount(section) {
  const S = stage(section, { camera: [0, 4.6, 6.5], target: [0, 0.5, 0] });
  ground(S.scene);
  const mats = FACES.map((n) => new THREE.MeshStandardMaterial({ map: faceTexture(n), roughness: 0.4 }));
  const dice = [-1.1, 1.1].map((x) => {
    const d = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mats);
    d.position.set(x, 0.5, 0); d.castShadow = true; S.scene.add(d); return d;
  });
  const counts = Array(13).fill(0);
  let rolls = 0, anim = null, target = [1, 1];

  const bar = controls(section,
    `<button class="btn primary sm" id="r1">Roll once</button><button class="btn ghost sm" id="r100">Roll 100 times</button>
     <div class="row gap">${statBox('dn', 'ROLLS', '0')}${statBox('d7', 'TOTAL OF 7', '—')}${statBox('dth', 'THEORY', '1/6 ≈ 17%')}</div>
     <div id="hist" style="flex:1 1 100%;display:grid;grid-template-columns:repeat(11,minmax(0,1fr));gap:4px;align-items:end;height:90px"></div>`,
    'There are 36 equally likely pairs. Six of them add up to 7, so P(7) = 6/36 = 1/6. The more you roll, the closer the bars get to the theory.');
  const $ = (id) => bar.querySelector('#' + id);
  const hist = $('hist');
  function drawHist() {
    const max = Math.max(1, ...counts.slice(2));
    hist.innerHTML = counts.slice(2).map((c, i) => `<div style="display:flex;flex-direction:column;align-items:center;gap:3px;height:100%;justify-content:flex-end">
      <div style="width:100%;border-radius:4px 4px 0 0;background:${i + 2 === 7 ? '#F97316' : '#E7E0D9'};height:${(c / max) * 70}px"></div><span style="font-size:11px;font-weight:700;color:#57534E">${i + 2}</span></div>`).join('');
    $('dn').textContent = rolls;
    $('d7').textContent = rolls ? Math.round((counts[7] / rolls) * 100) + '%' : '—';
  }
  const roll = () => [1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)];
  function record(r) { counts[r[0] + r[1]]++; rolls++; }
  $('r1').addEventListener('click', () => { target = roll(); record(target); anim = { t: 0 }; drawHist(); });
  $('r100').addEventListener('click', () => { for (let i = 0; i < 99; i++) record(roll()); target = roll(); record(target); anim = { t: 0 }; drawHist(); });
  drawHist();

  S.onFrame((dt) => {
    if (!anim) return;
    anim.t += dt;
    const k = Math.min(1, anim.t / 0.9);
    dice.forEach((d, i) => {
      const [rx, rz] = UP_ROT[target[i]];
      const spin = (1 - k) * 10;
      d.rotation.set(rx + spin * (i ? 1.3 : 1), spin * 0.7, rz + spin * (i ? 0.8 : 1.1));
      d.position.y = 0.5 + Math.abs(Math.sin(k * Math.PI * 3)) * (1 - k) * 2;
    });
    if (k >= 1) anim = null;
  });
  return () => S.dispose();
}

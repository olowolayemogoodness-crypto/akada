// N₂ + 3H₂ ⇌ 2NH₃ in a box. Change pressure, temperature and add a catalyst; watch the mix shift.
import { stage, THREE, COLORS, mat, label, controls, range, statBox } from './kit.js';

export function mount(section) {
  const S = stage(section, { camera: [0, 3, 8.6], target: [0, 1.8, 0] });
  const box = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(6, 3.4, 3)), new THREE.LineBasicMaterial({ color: 0xa8a29e }));
  box.position.y = 1.8; S.scene.add(box);
  const piston = new THREE.Mesh(new THREE.BoxGeometry(6, 0.15, 3), mat(0x78716c, { transparent: true, opacity: 0.6 }));
  S.scene.add(piston);
  const title = label('N₂ + 3H₂ ⇌ 2NH₃   (forward reaction gives out heat)', { size: 0.4 }); title.position.set(0, 4.3, 0); S.scene.add(title);
  const geoR = new THREE.SphereGeometry(0.14, 14, 10), geoP = new THREE.SphereGeometry(0.19, 14, 10);
  const mR = mat(COLORS.blue), mP = mat(COLORS.orange);
  const parts = [];
  for (let i = 0; i < 60; i++) {
    const m = new THREE.Mesh(geoR, mR);
    m.userData = { prod: false, v: new THREE.Vector3((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2) };
    m.position.set((Math.random() - 0.5) * 5.6, 0.3 + Math.random() * 3, (Math.random() - 0.5) * 2.6);
    S.scene.add(m); parts.push(m);
  }

  const bar = controls(section,
    range('ep', 'Pressure', 1, 4, 0.1, 1.5, '×') + range('et', 'Temperature', 200, 700, 10, 450, ' °C') +
    `<label class="row gap small" style="font-weight:700;color:#57534E"><input type="checkbox" id="ec"> Iron catalyst</label>
     <div class="row gap">${statBox('ey', 'AMMONIA', '')}${statBox('es', 'SPEED', '')}</div>`,
    'Blue = reactants (N₂, H₂). Orange = ammonia. Higher pressure squeezes the box: fewer gas molecules are favoured, so more ammonia. Higher temperature favours the heat-absorbing backward reaction, so less ammonia. A catalyst only gets there faster.');
  const $ = (id) => bar.querySelector('#' + id);
  let P = 1.5, T = 450, cat = false;
  const target = () => THREE.MathUtils.clamp(0.18 + (P - 1) * 0.17 - (T - 450) * 0.0011, 0.04, 0.9);
  const rate = () => (0.25 + (T - 200) / 500) * (cat ? 3 : 1);
  const update = () => {
    $('ep-v').textContent = P.toFixed(1) + '×'; $('et-v').textContent = T + ' °C';
    $('es').textContent = rate() > 1.4 ? 'Fast' : rate() > 0.7 ? 'Medium' : 'Slow';
  };
  $('ep').addEventListener('input', (e) => { P = +e.target.value; update(); });
  $('et').addEventListener('input', (e) => { T = +e.target.value; update(); });
  $('ec').addEventListener('change', (e) => { cat = e.target.checked; update(); });
  update();

  let acc = 0;
  S.onFrame((dt) => {
    const top = 3.5 - (P - 1) * 0.75; // piston height
    piston.position.y = top;
    const speed = 0.6 + (T - 200) / 400;
    for (const m of parts) {
      const p = m.position, v = m.userData.v;
      p.addScaledVector(v, dt * speed);
      if (p.x < -2.85 || p.x > 2.85) v.x *= -1;
      if (p.y < 0.2 || p.y > top - 0.2) { v.y *= -1; p.y = THREE.MathUtils.clamp(p.y, 0.2, top - 0.2); }
      if (p.z < -1.35 || p.z > 1.35) v.z *= -1;
    }
    // move the mix towards the equilibrium fraction at the current rate
    acc += dt * rate() * 6;
    while (acc > 1) {
      acc -= 1;
      const prodN = parts.filter((m) => m.userData.prod).length;
      const want = Math.round(target() * parts.length);
      const flip = prodN < want ? parts.find((m) => !m.userData.prod) : prodN > want ? parts.find((m) => m.userData.prod) : null;
      if (flip) { flip.userData.prod = !flip.userData.prod; flip.geometry = flip.userData.prod ? geoP : geoR; flip.material = flip.userData.prod ? mP : mR; }
    }
    $('ey').textContent = Math.round((parts.filter((m) => m.userData.prod).length / parts.length) * 100) + '%';
  });
  return () => S.dispose();
}

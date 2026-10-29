// Blocks of different density in a tank of liquid: see how much of each sinks below the surface.
import { stage, THREE, COLORS, mat, ground, label, controls, range, statBox } from './kit.js';

export function mount(section) {
  const S = stage(section, { camera: [0, 3.6, 11], target: [0, 1.6, 0] });
  ground(S.scene);
  const W = 9, H = 3.4, D = 3;
  const tank = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.BackSide }));
  tank.position.y = H / 2; S.scene.add(tank);
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(W, H, D)), new THREE.LineBasicMaterial({ color: 0xa8a29e }));
  edges.position.y = H / 2; S.scene.add(edges);
  const level = 2.2;
  const liquid = new THREE.Mesh(new THREE.BoxGeometry(W - 0.05, level, D - 0.05), new THREE.MeshStandardMaterial({ color: COLORS.water, transparent: true, opacity: 0.55, depthWrite: false }));
  liquid.position.y = level / 2; liquid.renderOrder = 2; S.scene.add(liquid);
  const surface = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.05, D - 0.05), new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.35, depthWrite: false }));
  surface.rotation.x = -Math.PI / 2; surface.position.y = level; surface.renderOrder = 3; S.scene.add(surface);

  const blocks = [
    { name: 'Cork', rho: 240, color: 0xd6a36a },
    { name: 'Wood', rho: 600, color: 0xb7793f },
    { name: 'Ice', rho: 920, color: 0xe0f2fe },
    { name: 'Your block', rho: 1500, color: COLORS.orange, yours: true },
  ];
  const size = 1.1;
  blocks.forEach((b, i) => {
    b.mesh = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), mat(b.color, b.name === 'Ice' ? { transparent: true, opacity: 0.85 } : {}));
    b.mesh.castShadow = true;
    b.mesh.position.set(-3.3 + i * 2.2, level + 2, 0);
    S.scene.add(b.mesh);
    b.lab = label(`${b.name} · ${b.rho}`, { size: 0.36 });
    S.scene.add(b.lab);
    b.y = level + 2; b.vy = 0;
  });

  const bar = controls(section,
    range('dl', 'Liquid density', 700, 1600, 10, 1000, ' kg/m³') + range('db', 'Your block density', 100, 2500, 20, 1500, ' kg/m³') +
    `<div class="row gap">${statBox('dfrac', 'UNDER WATER', '')}${statBox('dup', 'FLOATS?', '')}</div>
     <button class="btn ghost sm" id="drop">Drop again</button>`,
    'A floating block sinks until it pushes aside its own weight of liquid. Fraction under the surface = block density ÷ liquid density. Make the liquid denser (like salt water) and everything floats higher.');
  const $ = (id) => bar.querySelector('#' + id);
  let rhoL = 1000;
  const yours = blocks[3];
  const update = () => {
    $('dl-v').textContent = rhoL + ' kg/m³'; $('db-v').textContent = yours.rho + ' kg/m³';
    yours.lab.setText(`Your block · ${yours.rho}`);
    const f = yours.rho / rhoL;
    $('dfrac').textContent = f >= 1 ? '100%' : Math.round(f * 100) + '%';
    $('dup').textContent = f < 1 ? 'Floats' : f === 1 ? 'Hovers' : 'Sinks';
    liquid.material.color.setHSL(0.55, 0.85, 0.75 - (rhoL - 700) / 3000);
  };
  $('dl').addEventListener('input', (e) => { rhoL = +e.target.value; update(); });
  $('db').addEventListener('input', (e) => { yours.rho = +e.target.value; update(); });
  $('drop').addEventListener('click', () => blocks.forEach((b) => { b.y = level + 2; b.vy = 0; }));
  update();

  S.onFrame((dt) => {
    for (const b of blocks) {
      const f = b.rho / rhoL;
      const target = f >= 1 ? size / 2 + 0.02 : level - size * f + size / 2; // centre height when floating
      // damped spring towards rest position, with a "falling" start
      const k = 14, c = 4.5;
      const acc = b.y > target + 0.6 && b.vy <= 0 ? -9 : -k * (b.y - target) - c * b.vy;
      b.vy += acc * dt; b.y += b.vy * dt;
      if (b.y < size / 2) { b.y = size / 2; b.vy = 0; }
      b.mesh.position.y = b.y;
      b.lab.position.set(b.mesh.position.x, b.y + size / 2 + 0.45, 0.6);
    }
  });
  return () => S.dispose();
}

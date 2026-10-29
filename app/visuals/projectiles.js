// Projectile launcher: change angle and speed, watch the ball fly and see range, height and time.
import { stage, THREE, COLORS, mat, ground, label, controls, range, statBox } from './kit.js';

const G = 10, SCALE = 0.12; // 1 m in the world = 0.12 units

export function mount(section) {
  const S = stage(section, { camera: [4, 6, 15], target: [5, 1.5, 0] });
  ground(S.scene);
  // launcher
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.6, 0.4, 32), mat(COLORS.ink));
  base.position.set(0, 0.2, 0); base.castShadow = true; S.scene.add(base);
  const barrel = new THREE.Group();
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 1.4, 24), mat(COLORS.orange));
  tube.position.y = 0.7; tube.castShadow = true; barrel.add(tube);
  barrel.position.set(0, 0.4, 0); S.scene.add(barrel);
  // distance markers every 10 m
  for (let m = 10; m <= 160; m += 10) {
    const tick = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.02, m % 50 ? 0.4 : 0.9), mat(COLORS.grey));
    tick.position.set(m * SCALE, 0.01, 0); S.scene.add(tick);
  }
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.22, 32, 16), mat(COLORS.ink, { roughness: 0.3 }));
  ball.castShadow = true; S.scene.add(ball);
  const ghost = new THREE.Mesh(new THREE.SphereGeometry(0.16, 24, 12), mat(COLORS.orangeSoft, { transparent: true, opacity: 0.5 }));
  S.scene.add(ghost);
  let path = null, comp = null, peakLine = null;
  const landLabel = label('R = 0 m'); S.scene.add(landLabel);
  const peakLabel = label('H = 0 m'); S.scene.add(peakLabel);
  // velocity component arrows on the ball
  const vxArrow = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1, COLORS.blue, 0.25, 0.15);
  const vyArrow = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(), 1, COLORS.green, 0.25, 0.15);
  S.scene.add(vxArrow, vyArrow);

  const bar = controls(section,
    range('pa', 'Launch angle', 10, 80, 1, 45, '°') + range('pu', 'Speed', 10, 40, 1, 25, ' m/s') +
    `<div class="row gap">${statBox('pt', 'TIME', '0 s')}${statBox('pr', 'RANGE', '0 m')}${statBox('ph', 'HEIGHT', '0 m')}</div>
     <label class="row gap small" style="font-weight:700;color:#57534E"><input type="checkbox" id="pc"> Show 90° − θ</label>`,
    'Blue arrow: horizontal velocity (never changes). Green arrow: vertical velocity (shrinks to zero at the top, then grows downwards). Tick "Show 90° − θ" to see that complementary angles land in the same place.');
  const $ = (id) => bar.querySelector('#' + id);

  let angle = 45, speed = 25, t = 0, T = 1, showComp = false;
  const pathFor = (deg, u) => {
    const a = deg * Math.PI / 180, tt = 2 * u * Math.sin(a) / G, pts = [];
    for (let i = 0; i <= 80; i++) { const s = tt * i / 80; pts.push(new THREE.Vector3(u * Math.cos(a) * s * SCALE, (u * Math.sin(a) * s - 0.5 * G * s * s) * SCALE + 0.01, 0)); }
    return new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: COLORS.orange, linewidth: 2 }));
  };
  function rebuild() {
    const a = angle * Math.PI / 180;
    T = 2 * speed * Math.sin(a) / G;
    const R = speed * speed * Math.sin(2 * a) / G, H = (speed * Math.sin(a)) ** 2 / (2 * G);
    if (path) { S.scene.remove(path); path.geometry.dispose(); }
    path = pathFor(angle, speed); S.scene.add(path);
    if (comp) { S.scene.remove(comp); comp.geometry.dispose(); comp = null; }
    if (showComp) { comp = pathFor(90 - angle, speed); comp.material = new THREE.LineDashedMaterial({ color: 0xa8a29e, dashSize: 0.2, gapSize: 0.15 }); comp.computeLineDistances(); S.scene.add(comp); }
    if (peakLine) { S.scene.remove(peakLine); peakLine.geometry.dispose(); }
    const px = speed * Math.cos(a) * (T / 2) * SCALE, py = H * SCALE;
    peakLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(px, 0, 0), new THREE.Vector3(px, py, 0)]), new THREE.LineDashedMaterial({ color: 0xa8a29e, dashSize: 0.12, gapSize: 0.1 }));
    peakLine.computeLineDistances(); S.scene.add(peakLine);
    landLabel.setText(`R = ${R.toFixed(1)} m`); landLabel.position.set(R * SCALE, 0.6, 0.6);
    peakLabel.setText(`H = ${H.toFixed(1)} m`); peakLabel.position.set(px + 0.2, py + 0.5, 0);
    barrel.rotation.z = -(Math.PI / 2 - a);
    $('pt').textContent = T.toFixed(1) + ' s'; $('pr').textContent = R.toFixed(1) + ' m'; $('ph').textContent = H.toFixed(1) + ' m';
    $('pa-v').textContent = angle + '°'; $('pu-v').textContent = speed + ' m/s';
    if (S.controls) S.controls.target.set(Math.max(3, R * SCALE / 2), Math.max(1.2, py / 2), 0);
    t = 0;
  }
  $('pa').addEventListener('input', (e) => { angle = +e.target.value; rebuild(); });
  $('pu').addEventListener('input', (e) => { speed = +e.target.value; rebuild(); });
  $('pc').addEventListener('change', (e) => { showComp = e.target.checked; rebuild(); });
  rebuild();

  S.onFrame((dt) => {
    t += dt * 1.1;
    const loopT = T + 0.8;
    if (t > loopT) t = 0;
    const s = Math.min(t, T), a = angle * Math.PI / 180;
    const x = speed * Math.cos(a) * s, y = speed * Math.sin(a) * s - 0.5 * G * s * s;
    ball.position.set(x * SCALE, Math.max(0.22, y * SCALE + 0.22), 0);
    const vx = speed * Math.cos(a), vy = speed * Math.sin(a) - G * s;
    vxArrow.position.copy(ball.position); vxArrow.setLength(Math.max(0.3, vx * 0.06), 0.25, 0.15);
    vyArrow.position.copy(ball.position); vyArrow.setDirection(new THREE.Vector3(0, Math.sign(vy) || 1, 0)); vyArrow.setLength(Math.max(0.05, Math.abs(vy) * 0.06), 0.25, 0.15);
    vyArrow.visible = Math.abs(vy) > 0.6;
    if (showComp) {
      const b = (90 - angle) * Math.PI / 180, T2 = 2 * speed * Math.sin(b) / G, s2 = Math.min(t * (T2 / T), T2);
      ghost.visible = true; ghost.position.set(speed * Math.cos(b) * s2 * SCALE, Math.max(0.16, (speed * Math.sin(b) * s2 - 0.5 * G * s2 * s2) * SCALE + 0.16), 0);
    } else ghost.visible = false;
  });
  return () => S.dispose();
}

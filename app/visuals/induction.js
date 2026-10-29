// A bar magnet moves through a coil; a meter shows the induced current (Faraday and Lenz).
import { stage, THREE, COLORS, mat, ground, label, controls, range } from './kit.js';

export function mount(section) {
  const S = stage(section, { camera: [1, 3.6, 9.5], target: [0, 1.6, 0] });
  ground(S.scene);
  // coil (helix of copper)
  const turnsGroup = new THREE.Group(); S.scene.add(turnsGroup);
  const copper = mat(0xc87533, { metalness: 0.6, roughness: 0.35 });
  let coilLen = 3;
  function buildCoil(turns) {
    turnsGroup.clear();
    const pts = [];
    coilLen = 3;
    for (let i = 0; i <= turns * 24; i++) { const a = (i / 24) * Math.PI * 2; pts.push(new THREE.Vector3(-coilLen / 2 + (coilLen * i) / (turns * 24), 1.6 + Math.sin(a) * 0.95, Math.cos(a) * 0.95)); }
    const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), turns * 40, 0.06, 8, false), copper);
    tube.castShadow = true; turnsGroup.add(tube);
  }
  // magnet: red N, blue S halves
  const magnet = new THREE.Group();
  const n = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.6, 0.6), mat(COLORS.red)); n.position.x = -0.6;
  const s = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.6, 0.6), mat(COLORS.blue)); s.position.x = 0.6;
  n.castShadow = s.castShadow = true;
  magnet.add(n, s);
  const nl = label('N', { size: 0.4, color: '#B91C1C' }); nl.position.set(-0.9, 0.6, 0); magnet.add(nl);
  const sl = label('S', { size: 0.4, color: '#1D4ED8' }); sl.position.set(0.9, 0.6, 0); magnet.add(sl);
  magnet.position.set(-6, 1.6, 0); S.scene.add(magnet);
  // galvanometer
  const meter = new THREE.Group(); meter.position.set(4.6, 0, -1.2); S.scene.add(meter);
  const box = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.6, 0.5), mat(0xffffff)); box.position.y = 1.4; box.castShadow = true; meter.add(box);
  const dial = new THREE.Mesh(new THREE.CircleGeometry(0.9, 48, 0, Math.PI), mat(0xfff7f0)); dial.position.set(0, 1.0, 0.26); meter.add(dial);
  const needle = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.85, 0.02), mat(COLORS.ink)); needle.geometry.translate(0, 0.42, 0); needle.position.set(0, 1.0, 0.28); meter.add(needle);
  const zero = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.15, 0.02), mat(COLORS.orange)); zero.position.set(0, 1.85, 0.28); meter.add(zero);
  // wires
  const wire = (a, b) => S.scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, b]), new THREE.LineBasicMaterial({ color: 0xc87533 })));
  wire(new THREE.Vector3(1.5, 0.65, 0.4), new THREE.Vector3(3.8, 0.65, -1.0));
  wire(new THREE.Vector3(1.5, 2.55, 0.4), new THREE.Vector3(3.8, 2.0, -1.0));
  const emfLab = label('No change in flux → no current', { size: 0.42 }); emfLab.position.set(0, 4.1, 0); S.scene.add(emfLab);

  const bar = controls(section,
    range('is', 'Magnet speed', 0, 3, 0.1, 1.2, '×') + range('it', 'Turns on the coil', 4, 16, 1, 8, '') +
    `<div class="seg"><button class="on" data-m="auto">Push in and out</button><button data-m="stop">Hold still</button></div>`,
    'The meter only moves while the magnet is moving. Faster or more turns gives a bigger kick. Pushing in and pulling out swing the needle opposite ways (Lenz\'s law).');
  const $ = (id) => bar.querySelector('#' + id);
  let speed = 1.2, turns = 8, mode = 'auto', phase = 0, lastX = -6, swing = 0;
  buildCoil(turns);
  $('is').addEventListener('input', (e) => { speed = +e.target.value; $('is-v').textContent = speed.toFixed(1) + '×'; });
  $('it').addEventListener('input', (e) => { turns = +e.target.value; $('it-v').textContent = turns; buildCoil(turns); });
  bar.querySelectorAll('[data-m]').forEach((b) => b.addEventListener('click', () => { mode = b.dataset.m; bar.querySelectorAll('[data-m]').forEach((x) => x.classList.toggle('on', x === b)); }));

  let lastText = '';
  S.onFrame((dt) => {
    if (mode === 'auto') phase += dt * speed * 0.9;
    const x = -4.2 + 4.2 * (1 - Math.cos(phase)) * 0.5 * 1.9 - 0.2; // swings from left of coil into its middle and back
    magnet.position.x = x;
    const v = (x - lastX) / Math.max(dt, 1e-3); lastX = x;
    // flux change is strongest near the coil ends: weight by distance from coil centre
    const near = Math.exp(-((x + 0.3) ** 2) / 3);
    const emf = -v * near * turns * 0.025;
    swing += (THREE.MathUtils.clamp(emf, -1.3, 1.3) - swing) * 0.2;
    needle.rotation.z = swing;
    const txt = Math.abs(swing) < 0.06 ? 'No change in flux → no current' : swing > 0 ? 'Magnet moving in → current one way' : 'Magnet moving out → current the other way';
    if (txt !== lastText) { emfLab.setText(txt); lastText = txt; }
  });
  return () => S.dispose();
}

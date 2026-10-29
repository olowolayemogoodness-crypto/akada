// Transverse (light) and longitudinal (sound) waves side by side. Change frequency and amplitude.
import { stage, THREE, COLORS, mat, label, controls, range, statBox } from './kit.js';

export function mount(section) {
  const S = stage(section, { camera: [0, 2.8, 11], target: [0, 1.6, 0] });
  const N = 44, X0 = -8.6, DX = 0.4;
  const geo = new THREE.SphereGeometry(0.13, 16, 10);
  const trans = [], longi = [];
  const tMat = mat(COLORS.orange), lMat = mat(COLORS.blue), hiMat = mat(COLORS.ink);
  for (let i = 0; i < N; i++) {
    const a = new THREE.Mesh(geo, i === 20 ? hiMat : tMat); a.position.set(X0 + i * DX, 3.4, 0); S.scene.add(a); trans.push(a);
    for (let k = 0; k < 3; k++) {
      const b = new THREE.Mesh(geo, i === 20 && k === 1 ? hiMat : lMat);
      b.position.set(X0 + i * DX, 0.2 + k * 0.42, 0); b.userData = { x0: X0 + i * DX }; S.scene.add(b); longi.push(b);
    }
  }
  const tLab = label('Transverse: particles move up and down (light)', { size: 0.45 }); tLab.position.set(0, 5.2, 0); S.scene.add(tLab);
  const lLab = label('Longitudinal: particles move back and forth (sound)', { size: 0.45 }); lLab.position.set(0, 1.85, 0); S.scene.add(lLab);
  const lamLine = new THREE.Group(); S.scene.add(lamLine);
  const lamLab = label('λ', { size: 0.5, color: '#C2410C' }); S.scene.add(lamLab);

  const bar = controls(section,
    range('wf', 'Frequency', 0.3, 2, 0.1, 0.8, ' Hz (slowed)') + range('wa', 'Amplitude', 0.2, 1.2, 0.05, 0.7, '') +
    `<div class="row gap">${statBox('wl', 'WAVELENGTH', '')}${statBox('ws', 'PITCH / COLOUR', '')}</div>`,
    'The black particle never travels along with the wave. It only vibrates in place. Raise the frequency and the wavelength gets shorter (v = fλ stays the same).');
  const $ = (id) => bar.querySelector('#' + id);
  let f = 0.8, A = 0.7;
  const V = 2.4; // wave speed in world units per second
  const update = () => {
    const lam = V / f;
    $('wf-v').textContent = f.toFixed(1) + ' Hz (slowed)'; $('wa-v').textContent = A.toFixed(2);
    $('wl').textContent = lam.toFixed(1) + ' units';
    $('ws').textContent = f < 0.7 ? 'Low' : f < 1.3 ? 'Medium' : 'High';
    lamLine.clear();
    const y = 3.4 + A + 0.45;
    const pts = [new THREE.Vector3(-lam / 2, y, 0), new THREE.Vector3(lam / 2, y, 0)];
    lamLine.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: COLORS.orange })));
    lamLab.position.set(0, y + 0.35, 0);
  };
  $('wf').addEventListener('input', (e) => { f = +e.target.value; update(); });
  $('wa').addEventListener('input', (e) => { A = +e.target.value; update(); });
  update();

  S.onFrame((dt, time) => {
    const k = (2 * Math.PI * f) / V, w = 2 * Math.PI * f;
    trans.forEach((p, i) => { p.position.y = 3.4 + A * Math.sin(k * (X0 + i * DX) - w * time); });
    longi.forEach((p) => { p.position.x = p.userData.x0 + A * 0.35 * Math.sin(k * p.userData.x0 - w * time); });
    // keep the λ marker on a crest
    const crestX = (((w * time + Math.PI / 2) / k) % (V / f)) - (V / f) * 0.5;
    lamLine.position.x = crestX; lamLab.position.x = crestX;
  });
  return () => S.dispose();
}

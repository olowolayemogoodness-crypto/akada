// 3D ball-and-stick molecules: compare single, double and triple bonds and functional groups.
import { stage, THREE, COLORS, mat, label, controls } from './kit.js';

const ATOM = { C: { r: 0.42, color: 0x292524 }, H: { r: 0.26, color: 0xf5f5f4 }, O: { r: 0.4, color: COLORS.red } };
const tet = [[1, 1, 1], [-1, -1, 1], [-1, 1, -1], [1, -1, -1]].map((v) => new THREE.Vector3(...v).normalize());

// Each molecule: atoms [element, x, y, z], bonds [a, b, order]
function methane() {
  const a = [['C', 0, 0, 0], ...tet.map((v) => ['H', v.x * 1.1, v.y * 1.1, v.z * 1.1])];
  return { atoms: a, bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1]], name: 'Methane, CH₄', info: 'Alkane · single bonds · sp³ · 109.5° · saturated' };
}
function ethane() {
  const a = [['C', -0.77, 0, 0], ['C', 0.77, 0, 0]];
  const b = [[0, 1, 1]];
  [[-1.15, 0.95, 0.3], [-1.15, -0.65, 0.75], [-1.15, -0.3, -0.95]].forEach((p) => { a.push(['H', ...p]); b.push([0, a.length - 1, 1]); });
  [[1.15, -0.95, -0.3], [1.15, 0.65, -0.75], [1.15, 0.3, 0.95]].forEach((p) => { a.push(['H', ...p]); b.push([1, a.length - 1, 1]); });
  return { atoms: a, bonds: b, name: 'Ethane, C₂H₆', info: 'Alkane · C–C single bond · does NOT decolourise bromine water' };
}
function ethene() {
  const a = [['C', -0.67, 0, 0], ['C', 0.67, 0, 0], ['H', -1.25, 0.93, 0], ['H', -1.25, -0.93, 0], ['H', 1.25, 0.93, 0], ['H', 1.25, -0.93, 0]];
  return { atoms: a, bonds: [[0, 1, 2], [0, 2, 1], [0, 3, 1], [1, 4, 1], [1, 5, 1]], name: 'Ethene, C₂H₄', info: 'Alkene · C=C double bond · sp² · flat, 120° · unsaturated: decolourises bromine water' };
}
function ethyne() {
  const a = [['C', -0.6, 0, 0], ['C', 0.6, 0, 0], ['H', -1.65, 0, 0], ['H', 1.65, 0, 0]];
  return { atoms: a, bonds: [[0, 1, 3], [0, 2, 1], [1, 3, 1]], name: 'Ethyne, C₂H₂', info: 'Alkyne · C≡C triple bond · sp · straight line, 180°' };
}
function ethanol() {
  const m = ethane();
  // replace one H on carbon 2 with O–H
  m.atoms[5] = ['O', 1.55, 0.95, -0.35];
  m.atoms.push(['H', 2.4, 0.75, -0.1]);
  m.bonds.push([5, m.atoms.length - 1, 1]);
  return { ...m, name: 'Ethanol, C₂H₅OH', info: 'Alkanol · –OH (hydroxyl) group · made by fermenting glucose' };
}
const MOLS = { methane, ethane, ethene, ethyne, ethanol };

export function mount(section) {
  const S = stage(section, { camera: [0, 1.2, 7.5], target: [0, 0, 0] });
  S.controls.maxPolarAngle = Math.PI; S.controls.minDistance = 3;
  const holder = new THREE.Group(); S.scene.add(holder);
  const nameLab = label('', { size: 0.42 }); nameLab.position.set(0, 2.35, 0); S.scene.add(nameLab);
  const bondMat = mat(0xa8a29e);
  const atomMats = Object.fromEntries(Object.entries(ATOM).map(([k, v]) => [k, mat(v.color, { roughness: 0.35 })]));

  function show(key) {
    holder.clear();
    const m = MOLS[key]();
    const pos = m.atoms.map(([, x, y, z]) => new THREE.Vector3(x, y, z));
    m.atoms.forEach(([el], i) => {
      const s = new THREE.Mesh(new THREE.SphereGeometry(ATOM[el].r, 32, 16), atomMats[el]);
      s.position.copy(pos[i]); s.castShadow = true; holder.add(s);
    });
    m.bonds.forEach(([i, j, order]) => {
      const a = pos[i], b = pos[j], mid = a.clone().add(b).multiplyScalar(0.5), dir = b.clone().sub(a), len = dir.length();
      const up = Math.abs(dir.clone().normalize().y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
      const side = new THREE.Vector3().crossVectors(dir, up).normalize().multiplyScalar(0.13);
      const offsets = order === 1 ? [0] : order === 2 ? [-1, 1] : [-1.4, 0, 1.4];
      offsets.forEach((o) => {
        const c = new THREE.Mesh(new THREE.CylinderGeometry(order === 1 ? 0.08 : 0.055, order === 1 ? 0.08 : 0.055, len, 12), bondMat);
        c.position.copy(mid).add(side.clone().multiplyScalar(o));
        c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
        holder.add(c);
      });
    });
    nameLab.setText(m.name);
    info.textContent = m.info;
  }

  const bar = controls(section,
    `<div class="seg">${Object.keys(MOLS).map((k, i) => `<button data-mol="${k}" class="${i === 2 ? 'on' : ''}">${k[0].toUpperCase() + k.slice(1)}</button>`).join('')}</div>
     <div class="small" id="molinfo" style="font-weight:700;color:#57534E;flex:1 1 260px"></div>`,
    'Drag to turn the molecule. Black = carbon, white = hydrogen, red = oxygen. More bonds between carbons (single → double → triple) make the molecule flatter, then straight.');
  const info = bar.querySelector('#molinfo');
  bar.querySelectorAll('[data-mol]').forEach((b) => b.addEventListener('click', () => { bar.querySelectorAll('[data-mol]').forEach((x) => x.classList.toggle('on', x === b)); show(b.dataset.mol); }));
  show('ethene');
  S.onFrame((dt) => { holder.rotation.y += dt * 0.35; });
  return () => S.dispose();
}

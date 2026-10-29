// Electrolysis cell: watch positive ions go to the cathode and negative ions to the anode.
import { stage, THREE, COLORS, mat, ground, label, controls } from './kit.js';

const SETUPS = {
  acid: { name: 'Dilute H₂SO₄ (platinum)', cation: 'H⁺', anion: 'OH⁻', cathode: 'Hydrogen gas', anode: 'Oxygen gas', catColor: 0xfdba74, anColor: 0x93c5fd, gasCat: true, gasAn: true },
  brine: { name: 'Concentrated NaCl (carbon)', cation: 'H⁺', anion: 'Cl⁻', cathode: 'Hydrogen gas', anode: 'Chlorine gas', catColor: 0xfdba74, anColor: 0xbef264, gasCat: true, gasAn: true },
  copper: { name: 'CuSO₄ (copper electrodes)', cation: 'Cu²⁺', anion: 'SO₄²⁻', cathode: 'Copper coats the cathode', anode: 'Copper anode dissolves', catColor: 0x7dd3fc, anColor: 0xd6d3d1, gasCat: false, gasAn: false, plate: true },
};

export function mount(section) {
  const S = stage(section, { camera: [0, 4, 11], target: [0, 1.6, 0] });
  ground(S.scene);
  const beaker = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 3.2, 48, 1, true), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.15, side: THREE.DoubleSide, depthWrite: false }));
  beaker.position.y = 1.6; S.scene.add(beaker);
  const sol = new THREE.Mesh(new THREE.CylinderGeometry(3.15, 3.15, 2.6, 48), new THREE.MeshStandardMaterial({ color: 0xbae6fd, transparent: true, opacity: 0.35, depthWrite: false }));
  sol.position.y = 1.3; S.scene.add(sol);
  const cath = new THREE.Mesh(new THREE.BoxGeometry(0.35, 3.6, 1.2), mat(0x9ca3af, { metalness: 0.5 })); cath.position.set(-1.7, 2.1, 0); cath.castShadow = true; S.scene.add(cath);
  const anod = new THREE.Mesh(new THREE.BoxGeometry(0.35, 3.6, 1.2), mat(0x9ca3af, { metalness: 0.5 })); anod.position.set(1.7, 2.1, 0); anod.castShadow = true; S.scene.add(anod);
  const cl = label('Cathode (−) · reduction', { size: 0.36, color: '#1D4ED8' }); cl.position.set(-1.7, 4.4, 0); S.scene.add(cl);
  const al = label('Anode (+) · oxidation', { size: 0.36, color: '#B91C1C' }); al.position.set(1.7, 4.4, 0); S.scene.add(al);
  const outCat = label('', { size: 0.34 }); outCat.position.set(-2.4, 0.2, 2.2); S.scene.add(outCat);
  const outAn = label('', { size: 0.34 }); outAn.position.set(2.4, 0.2, 2.2); S.scene.add(outAn);
  // battery
  const batt = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.7, 0.7), mat(COLORS.ink)); batt.position.set(0, 4.9, 0); S.scene.add(batt);
  const wireMat = new THREE.LineBasicMaterial({ color: 0x57534e });
  S.scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-0.8, 4.9, 0), new THREE.Vector3(-1.7, 4.9, 0), new THREE.Vector3(-1.7, 3.9, 0)]), wireMat));
  S.scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0.8, 4.9, 0), new THREE.Vector3(1.7, 4.9, 0), new THREE.Vector3(1.7, 3.9, 0)]), wireMat));

  const ions = [], bubbles = [];
  const ionGeo = new THREE.SphereGeometry(0.13, 16, 10), bubGeo = new THREE.SphereGeometry(0.09, 12, 8);
  const catMat = mat(COLORS.orange), anMat = mat(COLORS.blue), bubMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 });
  let setup = SETUPS.acid, on = true, plateT = 0;
  const plateLayer = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.4, 1.24), mat(0xb45309, { metalness: 0.7, roughness: 0.3 }));
  plateLayer.position.set(-1.48, 1.3, 0); S.scene.add(plateLayer);

  function reset() {
    ions.forEach((i) => S.scene.remove(i)); ions.length = 0;
    bubbles.forEach((b) => S.scene.remove(b)); bubbles.length = 0;
    for (let k = 0; k < 34; k++) {
      const cat = k % 2 === 0;
      const m = new THREE.Mesh(ionGeo, cat ? catMat : anMat);
      m.userData = { cat };
      m.position.set((Math.random() - 0.5) * 3, 0.3 + Math.random() * 2.1, (Math.random() - 0.5) * 3.4);
      S.scene.add(m); ions.push(m);
    }
    outCat.setText(setup.cathode); outAn.setText(setup.anode);
    plateT = 0; plateLayer.visible = !!setup.plate; plateLayer.scale.x = 0.01;
    sol.material.color.set(setup === SETUPS.copper ? 0x60a5fa : 0xbae6fd);
    info.textContent = `${setup.cation} moves to the cathode · ${setup.anion} moves to the anode`;
  }

  const bar = controls(section,
    `<div class="seg">${Object.entries(SETUPS).map(([k, v], i) => `<button data-set="${k}" class="${i === 0 ? 'on' : ''}">${v.name}</button>`).join('')}</div>
     <button class="btn ghost sm" id="pow">Switch off</button><div class="small" id="ecinfo" style="font-weight:700;color:#57534E;flex:1 1 220px"></div>`,
    'Orange = positive ions (cations) → cathode. Blue = negative ions (anions) → anode. With copper electrodes, copper leaves the anode as fast as it plates the cathode, so the blue colour stays the same.');
  const info = bar.querySelector('#ecinfo');
  bar.querySelectorAll('[data-set]').forEach((b) => b.addEventListener('click', () => { bar.querySelectorAll('[data-set]').forEach((x) => x.classList.toggle('on', x === b)); setup = SETUPS[b.dataset.set]; reset(); }));
  bar.querySelector('#pow').addEventListener('click', (e) => { on = !on; e.target.textContent = on ? 'Switch off' : 'Switch on'; });
  reset();

  S.onFrame((dt) => {
    for (const m of ions) {
      const p = m.position;
      p.x += (Math.random() - 0.5) * 0.04; p.y += (Math.random() - 0.5) * 0.03; p.z += (Math.random() - 0.5) * 0.04;
      if (on) p.x += (m.userData.cat ? -1 : 1) * dt * 0.7;
      const targetX = m.userData.cat ? -1.45 : 1.45;
      if (on && Math.abs(p.x - targetX) < 0.12) {
        // discharged at the electrode: make a bubble (or plate copper) and respawn the ion
        if ((m.userData.cat && setup.gasCat) || (!m.userData.cat && setup.gasAn)) {
          const b = new THREE.Mesh(bubGeo, bubMat); b.position.set(targetX + (m.userData.cat ? -0.05 : 0.05), p.y, p.z); S.scene.add(b); bubbles.push(b);
        }
        if (m.userData.cat && setup.plate) plateT = Math.min(1, plateT + 0.01);
        p.set(m.userData.cat ? 1.2 : -1.2, 0.3 + Math.random() * 2.1, (Math.random() - 0.5) * 3.4);
      }
      p.x = THREE.MathUtils.clamp(p.x, -2.8, 2.8); p.y = THREE.MathUtils.clamp(p.y, 0.15, 2.5); p.z = THREE.MathUtils.clamp(p.z, -1.9, 1.9);
    }
    for (let i = bubbles.length - 1; i >= 0; i--) {
      const b = bubbles[i]; b.position.y += dt * 1.6;
      if (b.position.y > 2.65) { S.scene.remove(b); bubbles.splice(i, 1); }
    }
    plateLayer.scale.x = 0.01 + plateT * 2.5;
  });
  return () => S.dispose();
}

// Shared set-up for the 3D explainers: scene, soft lighting, camera you can drag, resize handling.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export { THREE };
export const COLORS = { orange: 0xf97316, orangeSoft: 0xfdba74, ink: 0x1c1917, blue: 0x3b7ddd, green: 0x22c55e, red: 0xef4444, grey: 0xd6d3d1, bg: 0xfaf8f5, water: 0x7dd3fc };

export function stage(section, { camera = [0, 4, 12], target = [0, 1.5, 0], orbit = true, fov = 40 } = {}) {
  const el = section.querySelector('.stage');
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(COLORS.bg);
  const cam = new THREE.PerspectiveCamera(fov, 1, 0.1, 200);
  cam.position.set(...camera);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  el.appendChild(renderer.domElement);

  scene.add(new THREE.HemisphereLight(0xffffff, 0xf5efe9, 1.6));
  const sun = new THREE.DirectionalLight(0xffffff, 1.6);
  sun.position.set(6, 12, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -15, right: 15, top: 15, bottom: -15 });
  scene.add(sun);

  let controls = null;
  if (orbit) {
    controls = new OrbitControls(cam, renderer.domElement);
    controls.target.set(...target);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 4;
    controls.maxDistance = 40;
    controls.maxPolarAngle = Math.PI * 0.49;
    controls.update();
  } else cam.lookAt(...target);

  const resize = () => {
    const w = el.clientWidth || 600, h = el.clientHeight || 340;
    renderer.setSize(w, h, false);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    cam.aspect = w / h;
    cam.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(el);
  resize();

  const frames = [];
  const clock = new THREE.Clock();
  let raf = 0;
  const loop = () => {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(clock.getDelta(), 0.05);
    for (const f of frames) f(dt, clock.elapsedTime);
    controls?.update();
    renderer.render(scene, cam);
  };
  loop();

  return {
    THREE, scene, camera: cam, renderer, controls,
    onFrame: (f) => frames.push(f),
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls?.dispose();
      scene.traverse((o) => { o.geometry?.dispose(); if (o.material) [].concat(o.material).forEach((m) => { m.map?.dispose(); m.dispose(); }); });
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}

export const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.05, ...extra });

export function ground(scene, size = 40, color = 0xf5efe9) {
  const g = new THREE.Mesh(new THREE.PlaneGeometry(size, size), mat(color, { roughness: 0.95 }));
  g.rotation.x = -Math.PI / 2;
  g.receiveShadow = true;
  scene.add(g);
  return g;
}

// A text label drawn on a canvas, always facing the camera.
export function label(text, { color = '#1C1917', bg = 'rgba(255,255,255,0.92)', size = 0.6 } = {}) {
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d');
  const font = '700 44px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.font = font;
  const w = Math.ceil(ctx.measureText(text).width) + 36;
  c.width = w; c.height = 72;
  ctx.font = font;
  ctx.fillStyle = bg;
  const r = 20;
  ctx.beginPath(); ctx.roundRect(0, 0, w, 72, r); ctx.fill();
  ctx.fillStyle = color; ctx.textBaseline = 'middle';
  ctx.fillText(text, 18, 38);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false }));
  s.scale.set((w / 72) * size, size, 1);
  s.renderOrder = 10;
  s.setText = (t) => { const n = label(t, { color, bg, size }); s.material.map.dispose(); s.material.map = n.material.map; s.scale.copy(n.scale); };
  return s;
}

// Controls bar under the stage: returns the element; `html` holds the inputs.
export function controls(section, html, hint) {
  const bar = document.createElement('div');
  bar.className = 'controls';
  bar.innerHTML = html;
  section.appendChild(bar);
  if (hint) { const h = document.createElement('div'); h.className = 'hint'; h.textContent = hint; section.appendChild(h); }
  return bar;
}
export const range = (id, labelText, min, max, step, value, unit = '') =>
  `<label class="range"><span>${labelText} <b id="${id}-v">${value}${unit}</b></span><input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${value}"></label>`;
export const statBox = (id, labelText, value) => `<div class="stat"><small>${labelText}</small><b id="${id}">${value}</b></div>`;

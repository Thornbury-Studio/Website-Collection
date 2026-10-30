// Longlight — the contour relief. One abstract fBm heightfield (no modelled
// terrain, no real mountain), drawn as thin topographic lines with the route
// as a tube in the accent colour.
//   data-relief="drift"  home: slow drift + pointer tilt, route fully drawn
//   data-relief="scrub"  expedition: scroll scrubs the route, readout follows
// Engineering floor: DPR ≤ 2, renders only while on screen, both WebGL
// context events handled, one static frame under reduced motion.
import * as THREE from '../vendor/three.module.min.js';

const LL = window.LL || { reduced: false, fine: false };
const EMBER = new THREE.Color('#E2874F');
const BONE = new THREE.Color('#ECE6DA');

/* ---------- heightfield: value-noise fBm, deterministic ---------- */
const N = 256;
function hash(x, y) {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y) {
  let s = 0, amp = 0.5, f = 1;
  for (let o = 0; o < 6; o++) { s += amp * vnoise(x * f + o * 17.3, y * f + o * 9.1); amp *= 0.5; f *= 2.05; }
  return s;
}
function buildField() {
  const h = new Float32Array(N * N);
  let min = 1e9, max = -1e9;
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const u = i / (N - 1), v = j / (N - 1);
    // a broad diagonal ridge so the field reads as a massif, plus detail
    const ridge = Math.exp(-Math.pow((u + v - 1.05) * 1.6, 2)) * 0.9;
    const val = fbm(u * 3.1, v * 3.1) * 0.75 + ridge * 0.55 + fbm(u * 9, v * 9) * 0.08;
    h[j * N + i] = val; if (val < min) min = val; if (val > max) max = val;
  }
  // min/max were tracked in float64; h is float32, so clamp before the pow or a corner rounds to NaN
  for (let k = 0; k < h.length; k++) { const t = Math.min(Math.max((h[k] - min) / (max - min), 0), 1); h[k] = Math.pow(t, 1.35); }
  return h;
}
function sample(h, u, v) {
  const x = Math.min(Math.max(u, 0), 1) * (N - 1), y = Math.min(Math.max(v, 0), 1) * (N - 1);
  const x0 = Math.floor(x), y0 = Math.floor(y), x1 = Math.min(x0 + 1, N - 1), y1 = Math.min(y0 + 1, N - 1);
  const fx = x - x0, fy = y - y0;
  const a = h[y0 * N + x0], b = h[y0 * N + x1], c = h[y1 * N + x0], d = h[y1 * N + x1];
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}

/* ---------- shaders ---------- */
const reliefVert = `
  attribute float aH; varying float vH; varying float vDist;
  void main(){ vH = aH; vec4 mv = modelViewMatrix * vec4(position, 1.0); vDist = -mv.z; gl_Position = projectionMatrix * mv; }`;
const reliefFrag = `
  precision highp float;
  uniform vec3 uLine; uniform float uLevels; uniform float uPhase; uniform float uNear; uniform float uFar; uniform float uGain;
  varying float vH; varying float vDist;
  void main(){
    float h = vH * uLevels + uPhase;
    float w = fwidth(h);
    float f = fract(h); float d = min(f, 1.0 - f);
    float minor = 1.0 - smoothstep(0.0, w * 1.1, d - w * 0.3);
    float h5 = h / 5.0; float f5 = fract(h5); float d5 = min(f5, 1.0 - f5) * 5.0;
    float major = 1.0 - smoothstep(0.0, w * 1.3, d5 - w * 0.55);
    float a = max(minor * 0.42, major * 0.85);
    a *= 1.0 - smoothstep(uNear, uFar, vDist);
    a *= 0.3 + 0.7 * vH;
    gl_FragColor = vec4(uLine, a * uGain);
  }`;
const routeVert = `
  attribute float aT; varying float vT;
  void main(){ vT = aT; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const routeFrag = `
  precision highp float;
  uniform vec3 uColor; uniform float uProgress; varying float vT;
  void main(){
    if (vT > uProgress) discard;
    float head = 1.0 - smoothstep(0.0, 0.05, uProgress - vT);
    gl_FragColor = vec4(uColor + head * 0.25, 1.0);
  }`;

/* ---------- route ---------- */
const ROUTE_UV = [[0.07, 0.2], [0.17, 0.3], [0.27, 0.46], [0.4, 0.4], [0.49, 0.54], [0.56, 0.7], [0.68, 0.63], [0.78, 0.72], [0.9, 0.82]];
const SIZE = 6, HEIGHT = 0.95;
const toWorld = (field, u, v, lift) => new THREE.Vector3((u - 0.5) * SIZE, (v - 0.5) * SIZE, sample(field, u, v) * HEIGHT + lift);

/* ---------- one relief ---------- */
function mount(container) {
  const mode = container.dataset.relief;
  const canvas = document.createElement('canvas');
  container.appendChild(canvas);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  } catch (e) { container.setAttribute('data-nogl', ''); return null; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 40);
  const group = new THREE.Group(); scene.add(group);

  const field = buildField();
  const geo = new THREE.PlaneGeometry(SIZE, SIZE, N - 1, N - 1);
  const pos = geo.attributes.position; const aH = new Float32Array(pos.count);
  for (let k = 0; k < pos.count; k++) {
    const u = pos.getX(k) / SIZE + 0.5, v = pos.getY(k) / SIZE + 0.5;
    const hh = sample(field, u, v); aH[k] = hh; pos.setZ(k, hh * HEIGHT);
  }
  geo.setAttribute('aH', new THREE.BufferAttribute(aH, 1));
  const reliefMat = new THREE.ShaderMaterial({
    vertexShader: reliefVert, fragmentShader: reliefFrag, transparent: true, depthWrite: true,
    uniforms: { uLine: { value: BONE }, uLevels: { value: 22 }, uPhase: { value: 0 }, uNear: { value: 2.2 }, uFar: { value: 9.5 }, uGain: { value: 1 } }
  });
  group.add(new THREE.Mesh(geo, reliefMat));

  // route as a tube lifted a hair above the surface
  const pts = ROUTE_UV.map(([u, v]) => toWorld(field, u, v, 0.02));
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal', 0.4);
  const TUB = 360, RAD = 5;
  const samples = curve.getSpacedPoints(TUB).map((p) => toWorld(field, p.x / SIZE + 0.5, p.y / SIZE + 0.5, 0.018));
  const lifted = new THREE.CatmullRomCurve3(samples, false, 'catmullrom', 0.5);
  const tube = new THREE.TubeGeometry(lifted, TUB, 0.011, RAD, false);
  const aT = new Float32Array(tube.attributes.position.count);
  for (let k = 0; k < aT.length; k++) aT[k] = Math.floor(k / (RAD + 1)) / TUB;
  tube.setAttribute('aT', new THREE.BufferAttribute(aT, 1));
  const routeMat = new THREE.ShaderMaterial({ vertexShader: routeVert, fragmentShader: routeFrag, uniforms: { uColor: { value: EMBER }, uProgress: { value: mode === 'scrub' ? 0 : 1 } } });
  group.add(new THREE.Mesh(tube, routeMat));

  // waypoint dots + the travelling head
  const dotGeo = new THREE.SphereGeometry(0.02, 10, 8);
  const dotMat = new THREE.MeshBasicMaterial({ color: BONE });
  pts.forEach((p) => { const m = new THREE.Mesh(dotGeo, dotMat); m.position.copy(p).add(new THREE.Vector3(0, 0, 0.012)); group.add(m); });
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.034, 12, 10), new THREE.MeshBasicMaterial({ color: EMBER }));
  head.visible = mode === 'scrub'; group.add(head);

  /* camera pose */
  const look = new THREE.Vector3(0, 0.3, 0.2);
  const camBase = new THREE.Vector3(0, -3.6, 2.35);
  const tilt = { x: 0, y: 0, tx: 0, ty: 0 };
  let progress = routeMat.uniforms.uProgress.value;
  let t0 = performance.now(), phase = 0;

  function resize() {
    const w = container.clientWidth || 1, h = container.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.fov = w < 760 ? 48 : 36; camera.updateProjectionMatrix();
    // home: keep the route clear of the text column on the left
    if (mode === 'drift') { if (w < 760) group.position.set(0.7, -1.6, 0); else group.position.set(1.7, -0.25, 0); }
  }

  function frame(now) {
    const dt = Math.min((now - t0) / 1000, 0.05); t0 = now;
    if (mode === 'drift') {
      if (!LL.reduced) { group.rotation.z += dt * 0.025; phase += dt * 0.045; reliefMat.uniforms.uPhase.value = phase; }
      tilt.x += (tilt.tx - tilt.x) * 0.045; tilt.y += (tilt.ty - tilt.y) * 0.045;
      camera.position.set(camBase.x + tilt.x * 0.9, camBase.y + tilt.y * 0.5, camBase.z - tilt.y * 0.35);
      camera.lookAt(look);
    } else {
      const p = lifted.getPointAt(Math.min(Math.max(progress, 0), 1));
      head.position.copy(p).add(new THREE.Vector3(0, 0, 0.01));
      const target = new THREE.Vector3(p.x, p.y, p.z);
      camera.position.set(p.x * 0.55 + 0.2, p.y * 0.55 - 3.1, 2.1 + p.z * 0.4);
      camera.lookAt(target.add(new THREE.Vector3(0, 0.4, -0.1)));
    }
    renderer.render(scene, camera);
  }

  /* loop only while visible; never under reduced motion for drift */
  let raf = 0, visible = false, lost = false;
  const loop = (now) => { raf = 0; if (!visible || lost) return; frame(now); raf = requestAnimationFrame(loop); };
  const start = () => { if (!raf && visible && !lost) { t0 = performance.now(); raf = requestAnimationFrame(loop); } };
  const once = () => { if (!lost) frame(performance.now()); };
  const continuous = mode === 'drift' && !LL.reduced;

  new IntersectionObserver((en) => {
    visible = en[0].isIntersecting;
    if (visible) { continuous ? start() : once(); } else if (raf) { cancelAnimationFrame(raf); raf = 0; }
  }, { threshold: 0.02 }).observe(container);

  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); lost = true; if (raf) { cancelAnimationFrame(raf); raf = 0; } });
  canvas.addEventListener('webglcontextrestored', () => { lost = false; resize(); continuous ? start() : once(); });

  if (mode === 'drift' && LL.fine && !LL.reduced) {
    window.addEventListener('pointermove', (e) => {
      tilt.tx = (e.clientX / window.innerWidth - 0.5) * 0.9;
      tilt.ty = (e.clientY / window.innerHeight - 0.5) * 0.7;
    }, { passive: true });
  }
  window.addEventListener('resize', () => { resize(); if (!continuous) once(); });
  resize();

  return {
    setProgress(p) { progress = p; routeMat.uniforms.uProgress.value = p; if (!continuous && visible) once(); }
  };
}

/* ---------- expedition page: scroll scrub + readout ---------- */
function scrub(container, relief) {
  const section = container.closest('.pin');
  const items = [...document.querySelectorAll('#itin [data-t]')];   // the itinerary is the single source of truth
  const way = items.map((el) => ({ t: parseFloat(el.dataset.t), day: el.dataset.day, name: el.dataset.name, alt: parseInt(el.dataset.alt, 10) }));
  const out = { day: document.querySelector('[data-ro="day"]'), name: document.querySelector('[data-ro="name"]'), alt: document.querySelector('[data-ro="alt"]'), bar: document.querySelector('.readout-bar i'), live: document.querySelector('[data-ro="live"]') };
  const fmt = (n) => n.toLocaleString('en-GB');
  let lastIdx = -1;
  function update(p) {
    if (relief) relief.setProgress(p);
    let i = 0; while (i < way.length - 1 && way[i + 1].t <= p) i++;
    const a = way[i], b = way[Math.min(i + 1, way.length - 1)];
    const f = b.t > a.t ? Math.min(Math.max((p - a.t) / (b.t - a.t), 0), 1) : 0;
    const alt = Math.round(a.alt + (b.alt - a.alt) * f);
    if (out.alt) out.alt.textContent = fmt(alt);
    if (out.bar) out.bar.style.width = (p * 100).toFixed(1) + '%';
    if (i !== lastIdx) {
      lastIdx = i;
      if (out.day) out.day.textContent = 'Day ' + a.day;
      if (out.name) out.name.textContent = a.name;
      if (out.live) out.live.textContent = `Day ${a.day}, ${a.name}, ${fmt(a.alt)} metres.`;
    }
  }
  update(0);
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    ScrollTrigger.create({ trigger: section, start: 'top top', end: 'bottom bottom', scrub: 0.6, onUpdate: (st) => update(st.progress) });
  } else {
    const onScroll = () => { const r = section.getBoundingClientRect(); update(Math.min(Math.max(-r.top / (r.height - window.innerHeight), 0), 1)); };
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  }
}

document.querySelectorAll('[data-relief]').forEach((el) => {
  const relief = mount(el);
  if (el.dataset.relief === 'scrub') scrub(el, relief);
});

/* ═══════════════════════════════════════════════════════════════════════════
   EON ATELIER — No. 1 "Meantime" · the dark room
   Six cinematic plates of one impossible instrument, hung in a WebGL night.
   Scroll dollies the camera from chamber to chamber through darkness; the
   visitor's pointer carries the only lamp — plates answer it with sheen,
   the shadow register answers it with shade. Every register's reading is
   live: today's moon, today's planets, the visitor's own attended time.
   ═══════════════════════════════════════════════════════════════════════════ */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

/* pure sRGB compositing — plates are shown as authored, night matches the page */
THREE.ColorManagement.enabled = false;

const doc = document.documentElement;
const $ = (s) => document.querySelector(s);

/* ── tier ─────────────────────────────────────────────────────────────── */
const COARSE = matchMedia('(pointer: coarse)').matches;
const SMALL = matchMedia('(max-width: 760px)').matches;
const MOBILE = COARSE && SMALL;
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

const CFG = {
  dprCap: MOBILE ? 1.8 : 2,
  fov: MOBILE ? 50 : 40,
  trackVh: MOBILE ? 780 : 850,
  scrollK: REDUCED ? 0.2 : MOBILE ? 0.095 : 0.07,
};

const NIGHT = new THREE.Color('#0b0e12');

/* ── the real sky (mean elements — an instrument's honesty) ───────────── */
const DAY_MS = 86400000;
const dSinceJ2000 = () => Date.now() / DAY_MS - 10957.5;
const SYNODIC = 29.530588;
function moonAge() {
  const ref = Date.UTC(2000, 0, 6, 18, 14) / DAY_MS;
  const a = (Date.now() / DAY_MS - ref) % SYNODIC;
  return a < 0 ? a + SYNODIC : a;
}
const PLANETS = [
  { name: 'ME', L0: 252.25, n: 4.09233445 },
  { name: 'VE', L0: 181.98, n: 1.60213034 },
  { name: 'TE', L0: 100.47, n: 0.98560912 },
  { name: 'MA', L0: 355.43, n: 0.52402068 },
  { name: 'JU', L0: 34.33, n: 0.08308529 },
  { name: 'SA', L0: 50.08, n: 0.03344414 },
];
function tideState() {
  const age = moonAge();
  const phase = (age / SYNODIC) * Math.PI * 2;
  const springK = 0.55 + 0.45 * Math.cos(phase * 2);
  const h = (Date.now() / 3600000) % 12.42;
  const rising = Math.cos((h / 12.42) * Math.PI * 2) >= 0;
  return { age, springK, rising };
}
function phaseName(age) {
  const i = Math.floor((age / SYNODIC) * 8 + 0.5) % 8;
  return ['new', 'waxing crescent', 'first quarter', 'waxing gibbous', 'full',
    'waning gibbous', 'last quarter', 'waning crescent'][i];
}

/* ── renderer ─────────────────────────────────────────────────────────── */
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
} catch (e) {
  doc.classList.add('no-3d');
  throw e;
}
window.__eon2 = true;

let DPR = Math.min(devicePixelRatio || 1, CFG.dprCap);
renderer.setPixelRatio(DPR);
renderer.setSize(innerWidth, innerHeight);
renderer.setClearColor(NIGHT);
renderer.domElement.className = 'scene';
document.body.prepend(renderer.domElement);

const scene = new THREE.Scene();
const FOG_D = 0.0062;
const camera = new THREE.PerspectiveCamera(CFG.fov, innerWidth / innerHeight, 0.5, 900);
scene.add(camera);

/* the carried lamp: a faint warm glow that lives where the pointer is */
let glow;
{
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(128, 128, 8, 128, 128, 128);
  g.addColorStop(0, 'rgba(255, 226, 186, 0.9)');
  g.addColorStop(0.4, 'rgba(255, 214, 170, 0.28)');
  g.addColorStop(1, 'rgba(255, 205, 160, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(c);
  glow = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({
      map: tex, transparent: true, opacity: 0.085,
      blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false,
    })
  );
  glow.renderOrder = 5;
  camera.add(glow);
  glow.position.z = -60;
}

/* ═══════════════════════════════════════════════════════════════════════
   THE PLATES
   ═══════════════════════════════════════════════════════════════════════ */
const VERT = `
  varying vec2 vUv;
  varying vec2 vScreen;
  varying float vDist;
  void main() {
    vUv = uv;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vDist = length(mv.xyz);
    vec4 pr = projectionMatrix * mv;
    vScreen = pr.xy / pr.w * 0.5 + 0.5;
    gl_Position = pr;
  }`;

const FRAG = `
  precision highp float;
  uniform sampler2D uMap;
  uniform vec2 uUvScale, uUvOff, uLamp, uEllC, uEllR;
  uniform float uExpo, uLampReveal, uSheen, uTravel, uShade, uTime,
                uEllFeather, uEdge, uAspect, uFogK;
  uniform vec3 uNight;
  varying vec2 vUv;
  varying vec2 vScreen;
  varying float vDist;

  void main() {
    vec2 uvc = vUv * uUvScale + uUvOff;
    /* a breath of glass while travelling between chambers */
    uvc.x += uTravel * 0.0035 * sin(uvc.y * 7.0 + uTime * 0.6);

    /* in-plate depth: the subject ellipse floats over its own background */
    vec2 par = (uLamp - 0.5) * 0.016;
    float m = 1.0 - smoothstep(1.0 - uEllFeather, 1.0 + uEllFeather,
      length((uvc - uEllC) / uEllR));
    vec2 uvBg = uvc + par * 0.45;
    vec2 uvFg = uvc - par * 0.85;
    float tr = uTravel * 0.0022;
    vec3 bg = vec3(
      texture2D(uMap, uvBg + vec2(tr, 0.0)).r,
      texture2D(uMap, uvBg).g,
      texture2D(uMap, uvBg - vec2(tr, 0.0)).b);
    vec3 fg = vec3(
      texture2D(uMap, uvFg + vec2(tr, 0.0)).r,
      texture2D(uMap, uvFg).g,
      texture2D(uMap, uvFg - vec2(tr, 0.0)).b);
    vec3 col = mix(bg * 0.94, fg, m);

    /* the lamp: reveal in the threshold, sheen on metal everywhere */
    float d = length((vScreen - uLamp) * vec2(uAspect, 1.0));
    float lampGlow = exp(-d * d * 5.5);
    float expo = clamp(uExpo + uLampReveal * lampGlow, 0.0, 1.35);
    col *= expo;
    float lum = dot(col, vec3(0.299, 0.587, 0.114));
    col += col * lum * lampGlow * uSheen;

    /* the shadow register answers: the side away from the lamp falls dark */
    float away = clamp((uvc.x - uEllC.x) * -sign(uLamp.x - 0.5) * 2.2, 0.0, 1.0);
    col *= 1.0 - uShade * 0.34 * smoothstep(0.05, 0.8, away) * uExpo;

    /* the plate dissolves into the room's night at its edges */
    float ef = smoothstep(0.0, uEdge, uvc.x) * smoothstep(1.0, 1.0 - uEdge, uvc.x)
             * smoothstep(0.0, uEdge, uvc.y) * smoothstep(1.0, 1.0 - uEdge, uvc.y);
    if (uvc.x < 0.0 || uvc.x > 1.0 || uvc.y < 0.0 || uvc.y > 1.0) ef = 0.0;
    col = mix(uNight, col, ef);

    /* depth fog: distant chambers melt into the dark */
    float fogF = 1.0 - exp(-uFogK * uFogK * vDist * vDist);
    col = mix(col, uNight, fogF);
    gl_FragColor = vec4(col, 1.0);
  }`;

/* plate definitions: file, depth, exposure window, subject ellipse,
   framing per tier (zoom < 1 pulls the image back into the darkness) */
const PLATES = [
  {
    key: 'hero', file: 'img/p1-hero.webp', z: 0,
    win: [-0.05, 0.272], ell: [0.515, 0.5, 0.24, 0.44],
    zoom: 1.0, zoomM: 0.52, focus: [0, 0], focusM: [0.01, 0.02],
  },
  {
    key: 'aestus', file: 'img/p2-aestus.webp', z: -160,
    win: [0.252, 0.418], ell: [0.5, 0.45, 0.38, 0.34],
    zoom: 1.0, zoomM: 0.62, focus: [0, 0], focusM: [0, 0.02],
  },
  {
    key: 'umbra', file: 'img/p3-umbra.webp', z: -320,
    win: [0.392, 0.558], ell: [0.55, 0.44, 0.4, 0.38],
    zoom: 1.0, zoomM: 0.6, focus: [0, 0], focusM: [0.02, 0.03],
  },
  {
    key: 'memoria', file: 'img/p4-memoria.webp', z: -480,
    win: [0.532, 0.698], ell: [0.31, 0.5, 0.3, 0.42],
    zoom: 1.0, zoomM: 0.6, focus: [0, 0], focusM: [-0.1, 0],
  },
  {
    key: 'sidera', file: 'img/p5-sidera.webp', z: -640,
    win: [0.672, 0.838], ell: [0.52, 0.47, 0.32, 0.38],
    zoom: 1.0, zoomM: 0.6, focus: [0, 0], focusM: [0.01, 0.02],
  },
  {
    key: 'face', file: 'img/p6-face.webp', z: -800,
    win: [0.812, 0.988], ell: [0.5, 0.5, 0.23, 0.41],
    zoom: 0.94, zoomM: 0.56, focus: [0, 0.01], focusM: [0, 0.02],
  },
];

const IMG_ASPECT = 16 / 9;
const PLANE_H = 74;               // sized to cover the viewport at entry distance
const loader = new THREE.TextureLoader();
const plateMeshes = [];

function makePlate(def) {
  const u = {
    uMap: { value: null },
    uUvScale: { value: new THREE.Vector2(1, 1) },
    uUvOff: { value: new THREE.Vector2(0, 0) },
    uLamp: { value: new THREE.Vector2(0.5, 0.5) },
    uEllC: { value: new THREE.Vector2(def.ell[0], def.ell[1]) },
    uEllR: { value: new THREE.Vector2(def.ell[2], def.ell[3]) },
    uEllFeather: { value: 0.38 },
    uExpo: { value: 0 },
    uLampReveal: { value: 0 },
    uSheen: { value: 0.85 },
    uTravel: { value: 0 },
    uShade: { value: 0 },
    uTime: { value: 0 },
    uEdge: { value: 0.16 },
    uAspect: { value: 1 },
    uNight: { value: NIGHT },
    uFogK: { value: FOG_D },
  };
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.ShaderMaterial({ uniforms: u, vertexShader: VERT, fragmentShader: FRAG })
  );
  mesh.position.z = def.z;
  mesh.visible = false;
  mesh.userData = { def, u };
  scene.add(mesh);
  plateMeshes.push(mesh);
  return mesh;
}
for (const def of PLATES) makePlate(def);

/* cover-fit each plate's texture for the current viewport (letterboxing
   sinks into the night via the edge fade, so zoom < 1 is safe) */
function fitPlates() {
  const vpAspect = innerWidth / innerHeight;
  for (const mesh of plateMeshes) {
    const { def, u } = mesh.userData;
    mesh.scale.set(PLANE_H * vpAspect, PLANE_H, 1);
    const zoom = MOBILE ? def.zoomM : def.zoom;
    const focus = MOBILE ? def.focusM : def.focus;
    let sx = 1, sy = 1;
    if (vpAspect > IMG_ASPECT) { sy = IMG_ASPECT / vpAspect; }
    else { sx = vpAspect / IMG_ASPECT; }
    sx /= zoom; sy /= zoom;
    u.uUvScale.value.set(sx, sy);
    u.uUvOff.value.set(0.5 - sx / 2 + focus[0], 0.5 - sy / 2 + focus[1]);
    u.uAspect.value = vpAspect;
  }
}
fitPlates();

/* ═══════════════════════════════════════════════════════════════════════
   CAMERA PATH — one dolly through the chambers
   ═══════════════════════════════════════════════════════════════════════ */
const CAM_KEYS = [
  [0.0, 100], [0.10, 90], [0.21, 58], [0.256, 4],
  [0.30, -78], [0.335, -104], [0.418, -142],
  [0.46, -238], [0.495, -264], [0.558, -302],
  [0.60, -398], [0.635, -424], [0.698, -462],
  [0.74, -558], [0.775, -584], [0.838, -622],
  [0.885, -722], [0.925, -748], [1.0, -764],
];
function camZ(p) {
  let i = 0;
  while (i < CAM_KEYS.length - 2 && p > CAM_KEYS[i + 1][0]) i++;
  const [p0, z0] = CAM_KEYS[i], [p1, z1] = CAM_KEYS[i + 1];
  const t = THREE.MathUtils.clamp((p - p0) / Math.max(p1 - p0, 1e-6), 0, 1);
  return z0 + (z1 - z0) * (t * t * (3 - 2 * t));
}

/* ═══════════════════════════════════════════════════════════════════════
   SCROLL · LAMP · STATE
   ═══════════════════════════════════════════════════════════════════════ */
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
const track = $('#track');
track.style.height = CFG.trackVh + 'vh';

let targetP = 0, smoothP = 0;
function readScroll() {
  const span = Math.max(track.offsetHeight - innerHeight * 1.5, 1);
  targetP = THREE.MathUtils.clamp(scrollY / span, 0, 1);
}
addEventListener('scroll', readScroll, { passive: true });

let lampTX = 0.38, lampTY = 0.42, lampX = lampTX, lampY = lampTY;
let lastInput = -10, lampTouched = false;
const perfNow = () => performance.now() / 1000;
if (!COARSE) {
  addEventListener('pointermove', (e) => {
    lampTX = e.clientX / innerWidth;
    lampTY = 1 - e.clientY / innerHeight;
    lastInput = perfNow();
    lampTouched = true;
  }, { passive: true });
} else {
  let lastX = null;
  addEventListener('pointerdown', (e) => { lastX = e.clientX; }, { passive: true });
  addEventListener('pointermove', (e) => {
    if (lastX === null) return;
    lampTX = THREE.MathUtils.clamp(lampTX + (e.clientX - lastX) / innerWidth * 1.6, 0.05, 0.95);
    lastX = e.clientX;
    lastInput = perfNow();
    lampTouched = true;
  }, { passive: true });
  addEventListener('pointerup', () => { lastX = null; }, { passive: true });
  addEventListener('pointercancel', () => { lastX = null; }, { passive: true });
}

/* ═══════════════════════════════════════════════════════════════════════
   DOM WIRING — labels, hud, live registers
   ═══════════════════════════════════════════════════════════════════════ */
const labels = [...document.querySelectorAll('.label')];
const hudReg = $('#hud-reg'), cue = $('#cue');
let everScrolled = false, ready = false;

const LABEL_WINDOWS = [
  [0.0, 0.075], [0.13, 0.245], [0.29, 0.4], [0.45, 0.545],
  [0.59, 0.685], [0.73, 0.825], [0.875, 0.96],
];
const ACT_NAMES = [
  'THE DARK', 'NO. 1 — MEANTIME',
  'REG. I — AESTUS', 'REG. II — UMBRA',
  'REG. III — MEMORIA', 'REG. IIII — SIDERA',
  'MEANTIME',
];

$('#rewind').addEventListener('click', (e) => { e.preventDefault(); scrollTo(0, 0); });

/* papers reveals — gated so a stalled observer can never blank the page */
doc.classList.add('js-anim');
{
  const parts = [...document.querySelectorAll('.pp-mast, .pp-sec, .foot')];
  const show = (el) => el.classList.add('is-in');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => {
      for (const e of es) if (e.isIntersecting) { show(e.target); io.unobserve(e.target); }
    }, { rootMargin: '0px 0px -8% 0px' });
    parts.forEach((el) => io.observe(el));
  }
  setTimeout(() => {
    if (parts.some((el) => !el.classList.contains('is-in') && el.getBoundingClientRect().top < innerHeight)) {
      parts.forEach(show);
    }
  }, 2600);
  addEventListener('scroll', () => {
    parts.forEach((el) => {
      if (!el.classList.contains('is-in') && el.getBoundingClientRect().top < innerHeight * 0.96) show(el);
    });
  }, { passive: true });
}

/* live register readings — chamber labels and papers both */
const t0 = Date.now();
function setLive(chamberId, papersId, text) {
  const a = $(chamberId), b = $(papersId);
  if (a) a.textContent = text;
  if (b) b.textContent = text;
}
function updateLive() {
  const ts = tideState();
  const lean = ts.springK > 0.72 ? 'leaning spring' : ts.springK < 0.38 ? 'leaning neap' : 'between books';
  setLive('#lv-aestus', '#live-aestus',
    `now — moon ${ts.age.toFixed(1)} d · ${phaseName(ts.age)} · ${lean} · water ${ts.rising ? 'rising' : 'easing'}`);
  if (lampTouched) {
    const az = Math.round(((lampX - 0.5) * 160 + 180 + 360) % 360);
    const el = Math.round(14 + lampY * 52);
    setLive('#lv-umbra', '#live-umbra', `now — your lamp at ${az}° · ${el}° high · the register agrees`);
  } else {
    setLive('#lv-umbra', '#live-umbra', 'now — awaiting your lamp');
  }
  const dwell = Math.floor((Date.now() - t0) / 1000);
  const mm = String(Math.floor(dwell / 60)).padStart(2, '0');
  const ss = String(dwell % 60).padStart(2, '0');
  setLive('#lv-memoria', '#live-memoria',
    `now — this sitting ${mm}:${ss} · ${Math.min(96, Math.floor(dwell / 10) + 1)} marks taken`);
  const d = dSinceJ2000();
  setLive('#lv-sidera', '#live-sidera',
    'now — ' + PLANETS.map((p) => `${p.name} ${Math.round(((p.L0 + p.n * d) % 360 + 360) % 360)}°`).join(' · '));
}
updateLive();
setInterval(updateLive, 1000);

/* ═══════════════════════════════════════════════════════════════════════
   PER-FRAME COMPOSITION
   ═══════════════════════════════════════════════════════════════════════ */
const clock = new THREE.Clock();
const sm = (p, a, b) => THREE.MathUtils.smoothstep(p, a, b);
let prevCamZ = camZ(0), travelK = 0;

function composeFrame(p, time) {
  /* the lamp */
  const idle = perfNow() - lastInput > 4 && !REDUCED;
  if (idle) {
    lampTX = 0.5 + Math.sin(time * 0.11) * 0.22;
    lampTY = 0.48 + Math.cos(time * 0.08) * 0.16;
  }
  lampX += (lampTX - lampX) * 0.07;
  lampY += (lampTY - lampY) * 0.07;

  /* camera */
  camera.position.z = camZ(p);
  camera.position.x = (lampX - 0.5) * (REDUCED ? 0.8 : 2.6);
  camera.position.y = (lampY - 0.5) * (REDUCED ? 0.6 : 1.9);
  camera.rotation.set(0, 0, 0);

  /* the glass breath comes from motion, never from rest */
  const dz = Math.abs(camera.position.z - prevCamZ);
  prevCamZ = camera.position.z;
  const travelT = REDUCED ? 0 : THREE.MathUtils.clamp(dz / 3.2, 0, 1);
  travelK += (travelT - travelK) * 0.08;

  const revealK = 1.9 * (1 - sm(p, 0.1, 0.21)) + 0.22;
  for (const mesh of plateMeshes) {
    const { def, u } = mesh.userData;
    const w = def.win;
    let expo = sm(p, w[0], w[0] + 0.045) * (1 - sm(p, w[1] - 0.045, w[1]));
    if (def.key === 'hero') {
      expo = (0.1 + 0.9 * sm(p, 0.04, 0.155)) * (1 - sm(p, w[1] - 0.05, w[1]));
      u.uLampReveal.value = revealK;
    }
    if (def.key === 'face') {
      mesh.rotation.z = REDUCED ? 0 : Math.sin(time * 0.1) * 0.008;
    }
    u.uExpo.value = expo * (def.key === 'face' ? 1 - sm(p, 0.97, 1) * 0.6 : 1);
    u.uShade.value = def.key === 'umbra' ? sm(p, 0.4, 0.45) * (1 - sm(p, 0.53, 0.56)) : 0;
    u.uLamp.value.set(lampX, lampY);
    u.uTime.value = time;
    u.uTravel.value = travelK;
    mesh.visible = expo > 0.003 && mesh.userData.u.uMap.value !== null;
  }

  /* the carried glow drifts with the lamp */
  const fh = 2 * 60 * Math.tan(THREE.MathUtils.degToRad(CFG.fov / 2));
  glow.position.set((lampX - 0.5) * fh * camera.aspect, (lampY - 0.5) * fh, -60);
  glow.scale.setScalar(fh * 0.85);
  glow.material.opacity = 0.055 + 0.03 * (1 - sm(p, 0.05, 0.2)) + (REDUCED ? 0 : 0.012 * Math.sin(time * 0.9));
}

/* DOM state per frame (cheap) */
let lastAct = -1;
function composeDom(p) {
  const act = p < 0.1 ? 0 : p < 0.26 ? 1 : p < 0.42 ? 2 : p < 0.56 ? 3 : p < 0.7 ? 4 : p < 0.84 ? 5 : 6;
  if (act !== lastAct) {
    lastAct = act;
    hudReg.textContent = ACT_NAMES[act];
  }
  for (let i = 0; i < labels.length; i++) {
    const w = LABEL_WINDOWS[i];
    labels[i].classList.toggle('on', ready && p >= w[0] && p <= w[1]);
  }
  if (ready && !everScrolled && p > 0.012) {
    everScrolled = true;
    cue.classList.remove('show');
  }
  renderer.domElement.classList.toggle('dimmed', p > 0.988);
  doc.classList.toggle('in-papers', targetP > 0.9995);
}

/* ═══════════════════════════════════════════════════════════════════════
   LOOP
   ═══════════════════════════════════════════════════════════════════════ */
let frameAcc = 0, frameCount = 0, degraded = false;
function frame() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const time = clock.elapsedTime;
  smoothP += (targetP - smoothP) * CFG.scrollK;
  if (Math.abs(targetP - smoothP) < 0.00005) smoothP = targetP;
  composeFrame(smoothP, time);
  composeDom(smoothP);
  renderer.render(scene, camera);
  if (!degraded && ready) {
    frameAcc += dt; frameCount++;
    if (frameCount === 110) {
      if (frameAcc / frameCount > 0.026) {
        DPR = Math.max(1, DPR * 0.8);
        renderer.setPixelRatio(DPR);
        degraded = true;
      }
      frameAcc = 0; frameCount = 0;
    }
  }
  requestAnimationFrame(frame);
}

/* ═══════════════════════════════════════════════════════════════════════
   BOOT — the hero plate lights the room; the rest arrive behind it
   ═══════════════════════════════════════════════════════════════════════ */
addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  fitPlates();
  readScroll();
});

function loadTex(mesh) {
  return new Promise((res, rej) => {
    loader.load(mesh.userData.def.file, (tex) => {
      tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      mesh.userData.u.uMap.value = tex;
      res();
    }, undefined, rej);
  });
}

readScroll();
frame();

loadTex(plateMeshes[0]).then(() => {
  ready = true;
  doc.classList.add('ready');
  cue.classList.add('show');
  for (const mesh of plateMeshes.slice(1)) loadTex(mesh).catch(() => {});
}).catch(() => {
  doc.classList.add('no-3d');
});

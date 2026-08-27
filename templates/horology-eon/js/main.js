/* ═══════════════════════════════════════════════════════════════════════════
   EON ATELIER — No. 1 "Meantime" · the descent
   One calibre, four registers, no hours. The instrument on this page is
   running: the moon is today's, the planets are today's, the lamp is the
   visitor's pointer, and the barrel winds on their attention. Scroll unwinds
   a 96-hour reserve while the movement opens stratum by stratum.
   Everything visible is generated — zero image assets.
   ═══════════════════════════════════════════════════════════════════════════ */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

const doc = document.documentElement;
const $ = (s) => document.querySelector(s);

/* ── tier ─────────────────────────────────────────────────────────────── */
const COARSE = matchMedia('(pointer: coarse)').matches;
const SMALL = matchMedia('(max-width: 760px)').matches;
const MOBILE = COARSE && SMALL;
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

const CFG = {
  dprCap: MOBILE ? 1.8 : 2,
  fov: MOBILE ? 54 : 40,
  trackVh: MOBILE ? 950 : 1060,
  scrollK: REDUCED ? 0.2 : MOBILE ? 0.095 : 0.07,
  shadow: MOBILE ? 1024 : 2048,
};

/* ── palette ──────────────────────────────────────────────────────────── */
const NIGHT = new THREE.Color('#0d1115');

/* ── the real sky (mean elements — an orrery's honesty) ───────────────── */
const DAY_MS = 86400000;
const dSinceJ2000 = () => Date.now() / DAY_MS - 10957.5;
const SYNODIC = 29.530588;
function moonAge() {
  // days since the new moon of 2000-01-06 18:14 UTC
  const ref = Date.UTC(2000, 0, 6, 18, 14) / DAY_MS;
  const a = (Date.now() / DAY_MS - ref) % SYNODIC;
  return a < 0 ? a + SYNODIC : a;
}
/* mean longitude L0 (deg at J2000) and rate n (deg/day) */
const PLANETS = [
  { name: 'ME', L0: 252.25, n: 4.09233445, rail: 1.35, r: 0.17, tint: '#b8b2a6' },
  { name: 'VE', L0: 181.98, n: 1.60213034, rail: 2.0, r: 0.26, tint: '#d9c9a3' },
  { name: 'TE', L0: 100.47, n: 0.98560912, rail: 2.65, r: 0.27, tint: '#41639e' },
  { name: 'MA', L0: 355.43, n: 0.52402068, rail: 3.28, r: 0.21, tint: '#a2543c' },
  { name: 'JU', L0: 34.33, n: 0.08308529, rail: 3.95, r: 0.42, tint: '#b39a76' },
  { name: 'SA', L0: 50.08, n: 0.03344414, rail: 4.62, r: 0.36, tint: '#c2b494' },
];
/* tide: semidiurnal swing scaled by spring/neap from the moon's age */
function tideState(t) {
  const age = moonAge();
  const phase = (age / SYNODIC) * Math.PI * 2;
  const springK = 0.55 + 0.45 * Math.cos(phase * 2);   // 1 at syzygy, .1 at quarters
  const h = (Date.now() / 3600000) % 12.42;
  const daily = Math.sin((h / 12.42) * Math.PI * 2 + (t || 0) * 0.002);
  const rising = Math.cos((h / 12.42) * Math.PI * 2) >= 0;
  return { age, springK, level: daily * springK, rising };
}

/* ── renderer ─────────────────────────────────────────────────────────── */
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
} catch (e) {
  doc.classList.add('no-3d');
  throw e;
}
window.__eon = true;

let DPR = Math.min(devicePixelRatio || 1, CFG.dprCap);
renderer.setPixelRatio(DPR);
renderer.setSize(innerWidth, innerHeight);
renderer.setClearColor(NIGHT);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.06;
renderer.domElement.className = 'scene';
document.body.prepend(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(NIGHT.clone(), 0.0042);
const camera = new THREE.PerspectiveCamera(CFG.fov, innerWidth / innerHeight, 0.5, 400);

/* ── the room: a soft studio, baked to an environment map ─────────────── */
{
  const room = new THREE.Scene();
  const box = (w, h, d, c, x, y, z, ry = 0, rx = 0) => {
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(c) })
    );
    m.position.set(x, y, z); m.rotation.y = ry; m.rotation.x = rx;
    room.add(m);
  };
  room.add(new THREE.Mesh(
    new THREE.SphereGeometry(60, 16, 12),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(0.045, 0.05, 0.065), side: THREE.BackSide })
  ));
  // one tall warm softbox (the window), a cool strip behind, a floor bounce
  box(26, 44, 1, new THREE.Color(3.2, 3.0, 2.6), -30, 12, 14, Math.PI / 3.2);
  box(50, 4, 1, new THREE.Color(0.9, 1.15, 1.7), 6, 20, -34, -0.2, 0.4);
  box(30, 1, 22, new THREE.Color(0.3, 0.3, 0.33), 0, -24, 0);
  box(1, 30, 8, new THREE.Color(2.0, 1.9, 1.7), 32, 4, -6, 0);
  box(36, 1, 26, new THREE.Color(1.1, 1.08, 1.0), -4, 30, -2);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(room, 0.04).texture;
  pmrem.dispose();
}

/* ── lights: the lamp is the visitor's ────────────────────────────────── */
const lamp = new THREE.SpotLight(0xfff0da, 3400, 0, 0.62, 0.85, 1.7);
lamp.position.set(-16, 26, 18);
lamp.castShadow = true;
lamp.shadow.mapSize.setScalar(CFG.shadow);
lamp.shadow.bias = -0.00022;
lamp.shadow.normalBias = 0.05;
lamp.shadow.camera.near = 6;
lamp.shadow.camera.far = 90;
scene.add(lamp);
scene.add(lamp.target);

const rim = new THREE.DirectionalLight(0x8fa8e0, 1.7);
rim.position.set(-20, 9, -26);
scene.add(rim);
const fill = new THREE.DirectionalLight(0x3a4250, 3.0);
fill.position.set(14, -8, 18);
scene.add(fill);
/* a small warm glow inside the heart, pulsing with the beat */
const heartGlow = new THREE.PointLight(0xffd9a8, 22, 16, 2);
heartGlow.position.set(0, 3.4, 0);
scene.add(heartGlow);

/* ═══════════════════════════════════════════════════════════════════════
   CANVAS ENGRAVINGS & FINISH MAPS
   ═══════════════════════════════════════════════════════════════════════ */
const MONO = '"Spline Sans Mono", monospace';
const DISP = '"Marcellus", serif';

function makeCanvas(px) {
  const c = document.createElement('canvas');
  c.width = c.height = px;
  return [c, c.getContext('2d')];
}
/* characters along an arc; canvas centre = dial centre. flip = readable at 6h */
function arcText(ctx, px, text, rFrac, angDeg, font, fill, spacing, flip) {
  const cx = px / 2, r = (px / 2) * rFrac;
  ctx.font = font;
  ctx.fillStyle = fill;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const widths = [...text].map((ch) => ctx.measureText(ch).width + spacing * r);
  const total = widths.reduce((a, b) => a + b, 0);
  let a = (angDeg * Math.PI) / 180 - (flip ? -1 : 1) * (total / 2 / r);
  for (let i = 0; i < text.length; i++) {
    const half = widths[i] / 2 / r;
    a += (flip ? -1 : 1) * half;
    ctx.save();
    ctx.translate(cx + Math.cos(a) * r, cx + Math.sin(a) * r);
    ctx.rotate(a + (flip ? -Math.PI / 2 : Math.PI / 2));
    ctx.fillText(text[i], 0, 0);
    ctx.restore();
    a += (flip ? -1 : 1) * half;
  }
}
function canvasTex(c, srgb = true) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return t;
}

/* chapter ring face: register names at the cardinals, graduations between */
let chapterTex = null;
function drawChapter() {
  const px = 1024;
  const [c, ctx] = makeCanvas(px);
  const bone = 'rgba(233,227,213,';
  // graduations: 96 marks for 96 hours of reserve, broken at the cardinals
  ctx.strokeStyle = bone + '0.6)';
  for (let i = 0; i < 96; i++) {
    const a = (i / 96) * Math.PI * 2 - Math.PI / 2;
    const gap = Math.abs(((a + Math.PI / 2) % (Math.PI / 2)) - Math.PI / 4) > Math.PI / 4 - 0.24;
    if (gap) continue;
    const major = i % 4 === 0;
    ctx.lineWidth = major ? 3 : 1.6;
    ctx.beginPath();
    const r0 = px * 0.442, r1 = px * (major ? 0.472 : 0.462);
    ctx.moveTo(px / 2 + Math.cos(a) * r0, px / 2 + Math.sin(a) * r0);
    ctx.lineTo(px / 2 + Math.cos(a) * r1, px / 2 + Math.sin(a) * r1);
    ctx.stroke();
  }
  const f = `500 ${px * 0.034}px ${MONO}`;
  arcText(ctx, px, 'A E S T U S', 0.856, -90, f, bone + '0.92)', 0.004, false);
  arcText(ctx, px, 'U M B R A', 0.856, 0, f, bone + '0.92)', 0.004, false);
  arcText(ctx, px, 'M E M O R I A', 0.862, 90, f, bone + '0.92)', 0.004, true);
  arcText(ctx, px, 'S I D E R A', 0.856, 180, f, bone + '0.92)', 0.004, false);
  return canvasTex(c);
}

/* dial signatures: the house above, the instrument below */
function drawSigNorth() {
  const px = 1024;
  const [c, ctx] = makeCanvas(px);
  arcText(ctx, px, 'E O N   A T E L I E R', 0.78, -90, `${px * 0.05}px ${DISP}`, 'rgba(20,23,28,0.9)', 0.006, false);
  return canvasTex(c);
}
function drawSigSouth() {
  const px = 1024;
  const [c, ctx] = makeCanvas(px);
  arcText(ctx, px, 'M E A N T I M E  ·  N o 1', 0.78, 90, `${px * 0.042}px ${DISP}`, 'rgba(20,23,28,0.78)', 0.006, true);
  return canvasTex(c);
}

/* plate rim inscription */
function drawPlateRim() {
  const px = 1024;
  const [c, ctx] = makeCanvas(px);
  const f = `300 ${px * 0.026}px ${MONO}`;
  const ink = 'rgba(233,227,213,0.5)';
  arcText(ctx, px, 'EON ATELIER · CAL. C.1', 0.885, -90, f, ink, 0.02, false);
  arcText(ctx, px, 'USHANT · ELEVEN A YEAR', 0.885, 90, f, ink, 0.02, true);
  return canvasTex(c);
}

/* register scales */
function drawAestusScale() {
  const px = 512;
  const [c, ctx] = makeCanvas(px);
  const bone = 'rgba(233,227,213,';
  ctx.strokeStyle = bone + '0.7)';
  for (let i = -8; i <= 8; i++) {
    const a = -Math.PI / 2 + (i / 8) * 0.72;
    ctx.lineWidth = i % 4 === 0 ? 5 : 2.4;
    ctx.beginPath();
    ctx.moveTo(px / 2 + Math.cos(a) * (px / 2) * 0.87, px / 2 + Math.sin(a) * (px / 2) * 0.87);
    ctx.lineTo(px / 2 + Math.cos(a) * (px / 2) * 0.985, px / 2 + Math.sin(a) * (px / 2) * 0.985);
    ctx.stroke();
  }
  const f = `500 ${px * 0.055}px ${MONO}`;
  arcText(ctx, px, 'NEAP', 0.905, -90 - 40, f, bone + '0.85)', 0.01, false);
  arcText(ctx, px, 'SPRING', 0.905, -90 + 40, f, bone + '0.85)', 0.01, false);
  return canvasTex(c);
}
function drawUmbraScale() {
  const px = 512;
  const [c, ctx] = makeCanvas(px);
  const bone = 'rgba(233,227,213,';
  ctx.strokeStyle = bone + '0.65)';
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    ctx.lineWidth = i % 6 === 0 ? 5 : 2.2;
    ctx.beginPath();
    ctx.moveTo(px / 2 + Math.cos(a) * (px / 2) * 0.82, px / 2 + Math.sin(a) * (px / 2) * 0.82);
    ctx.lineTo(px / 2 + Math.cos(a) * (px / 2) * 0.97, px / 2 + Math.sin(a) * (px / 2) * 0.97);
    ctx.stroke();
  }
  arcText(ctx, px, 'THE LIGHT YOU BRING', 0.68, 90, `500 ${px * 0.048}px ${MONO}`, bone + '0.6)', 0.02, true);
  return canvasTex(c);
}

/* finish maps (roughness): radial sunray, circular brush, straight côtes, perlage */
function sunrayMap() {
  const px = 512;
  const [c, ctx] = makeCanvas(px);
  ctx.fillStyle = '#8c8c8c'; ctx.fillRect(0, 0, px, px);
  for (let i = 0; i < 720; i++) {
    const a = (i / 720) * Math.PI * 2 + Math.sin(i * 7.13) * 0.002;
    const v = 110 + Math.floor(Math.abs(Math.sin(i * 12.9898) * 43758.5453 % 1) * 70);
    ctx.strokeStyle = `rgb(${v},${v},${v})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px / 2, px / 2);
    ctx.lineTo(px / 2 + Math.cos(a) * px, px / 2 + Math.sin(a) * px);
    ctx.stroke();
  }
  const t = canvasTex(c, false);
  return t;
}
function circBrushMap() {
  const px = 512;
  const [c, ctx] = makeCanvas(px);
  ctx.fillStyle = '#909090'; ctx.fillRect(0, 0, px, px);
  for (let r = 2; r < px * 0.75; r += 1.6) {
    const v = 116 + Math.floor(Math.abs(Math.sin(r * 12.9898) * 43758.5453 % 1) * 58);
    ctx.strokeStyle = `rgba(${v},${v},${v},0.9)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(px / 2, px / 2, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  return canvasTex(c, false);
}
function cotesMap() {
  const px = 512;
  const [c, ctx] = makeCanvas(px);
  const bandW = px / 7;
  for (let b = 0; b < 8; b++) {
    const g = ctx.createLinearGradient(b * bandW, 0, (b + 1) * bandW, 0);
    g.addColorStop(0, '#a8a8a8'); g.addColorStop(0.42, '#7e7e7e');
    g.addColorStop(0.58, '#8a8a8a'); g.addColorStop(1, '#b4b4b4');
    ctx.fillStyle = g;
    ctx.fillRect(b * bandW, 0, bandW + 1, px);
  }
  for (let x = 0; x < px; x += 2) {
    const v = Math.abs(Math.sin(x * 12.9898) * 43758.5453 % 1) * 26;
    ctx.fillStyle = `rgba(60,60,60,${0.05 + v / 255})`;
    ctx.fillRect(x, 0, 1, px);
  }
  return canvasTex(c, false);
}
function perlageMap() {
  const px = 512;
  const [c, ctx] = makeCanvas(px);
  ctx.fillStyle = '#8a8a8a'; ctx.fillRect(0, 0, px, px);
  const step = px / 8;
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const x = col * step + (row % 2) * step * 0.5, y = row * step;
      const g = ctx.createRadialGradient(x, y, step * 0.1, x, y, step * 0.62);
      g.addColorStop(0, 'rgba(190,190,190,0.85)');
      g.addColorStop(0.75, 'rgba(120,120,120,0.5)');
      g.addColorStop(1, 'rgba(90,90,90,0.0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, step * 0.62, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  return canvasTex(c, false);
}
function lineBrushMap() {
  const px = 512;
  const [c, ctx] = makeCanvas(px);
  ctx.fillStyle = '#8e8e8e'; ctx.fillRect(0, 0, px, px);
  for (let y = 0; y < px; y += 1) {
    const v = 112 + Math.floor(Math.abs(Math.sin(y * 12.9898) * 43758.5453 % 1) * 62);
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(0, y, px, 1);
  }
  return canvasTex(c, false);
}

/* fit a planar-UV texture so shape-space [-R..R] fills the canvas */
function fitPlanar(tex, R) {
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1 / (2 * R), 1 / (2 * R));
  tex.offset.set(0.5, 0.5);
  return tex;
}

/* ═══════════════════════════════════════════════════════════════════════
   MATERIALS
   ═══════════════════════════════════════════════════════════════════════ */
const texSun = sunrayMap(), texCirc = circBrushMap(), texCotes = cotesMap(),
  texPerl = perlageMap(), texLine = lineBrushMap();

const P = (o) => new THREE.MeshPhysicalMaterial(o);
const mPolish = P({ color: '#e7ebf1', metalness: 1, roughness: 0.07, envMapIntensity: 1.35 });
const mCase = P({ color: '#aab1bc', metalness: 1, roughness: 0.72, envMapIntensity: 1.25, roughnessMap: texLine });
const mCaseDark = P({ color: '#181c22', metalness: 0.9, roughness: 0.6 });
const mDial = P({ color: '#d8d1c0', metalness: 0.92, roughness: 0.4, envMapIntensity: 1.0 });
const mChapter = P({ color: '#2e333b', metalness: 1, roughness: 0.5, envMapIntensity: 0.9 });
const mPlate = P({ color: '#767c85', metalness: 1, roughness: 0.5, envMapIntensity: 0.9 });
const mBridge = P({ color: '#848a93', metalness: 1, roughness: 0.44, envMapIntensity: 1.0 });
const mAnthr = P({ color: '#3a414b', metalness: 1, roughness: 0.55, envMapIntensity: 1.0 });
const mBlued = P({
  color: '#2b55b0', metalness: 1, roughness: 0.25, envMapIntensity: 1.6,
  iridescence: 0.3, iridescenceIOR: 1.7, iridescenceThicknessRange: [220, 330],
});
const mRuby = P({
  color: '#8c1631', metalness: 0, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.06,
  envMapIntensity: 1.7, emissive: '#330512',
});
const mGold = P({ color: '#c9a057', metalness: 1, roughness: 0.26, envMapIntensity: 1.15 });
const mLiquid = P({ color: '#dfe6ef', metalness: 1, roughness: 0.12, envMapIntensity: 2.3 });
const mSapphire = P({
  color: '#e7eef8', metalness: 0, roughness: 0.035, envMapIntensity: 1.6,
  transparent: true, opacity: 0.05, depthWrite: false, side: THREE.DoubleSide,
});
const mPedestal = new THREE.MeshStandardMaterial({ color: '#101418', metalness: 0, roughness: 0.95 });

/* planar-finish variants (fitted per part at build time) */
function withMap(base, tex, R) {
  const m = base.clone();
  m.roughnessMap = fitPlanar(tex.clone(), R);
  m.roughnessMap.needsUpdate = true;
  return m;
}
function engraveMat(tex, opacity = 1) {
  return new THREE.MeshStandardMaterial({
    map: tex, transparent: true, opacity,
    metalness: 0.35, roughness: 0.55,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
  });
}

/* the moon shades itself from a phase vector, ignoring the room */
const moonUniforms = { uSun: { value: new THREE.Vector3(1, 0, 0) } };
const mMoon = new THREE.ShaderMaterial({
  uniforms: moonUniforms,
  vertexShader: `
    varying vec3 vN;
    void main() {
      vN = normalize(mat3(modelMatrix) * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: `
    uniform vec3 uSun;
    varying vec3 vN;
    void main() {
      float d = dot(normalize(vN), normalize(uSun));
      float lit = smoothstep(-0.06, 0.18, d);
      vec3 c = mix(vec3(0.075, 0.085, 0.105), vec3(0.82, 0.83, 0.84), lit);
      gl_FragColor = vec4(c, 1.0);
    }`,
});

/* ═══════════════════════════════════════════════════════════════════════
   GEOMETRY BUILDERS
   ═══════════════════════════════════════════════════════════════════════ */
const EXTRUDE_UP = (g) => { g.rotateX(-Math.PI / 2); return g; };

/* trapezoid-tooth gear outline with spoke windows */
function gearGeom(rTip, teeth, depth, opts = {}) {
  const rRoot = rTip - (opts.tooth ?? Math.max(0.28, rTip * 0.055));
  const s = new THREE.Shape();
  const N = teeth;
  for (let i = 0; i < N; i++) {
    const a0 = (i / N) * Math.PI * 2;
    const a1 = ((i + 1) / N) * Math.PI * 2;
    const tw = (a1 - a0);
    // root → flank → tip → flank
    const pts = [
      [rRoot, a0], [rRoot, a0 + tw * 0.2],
      [rTip, a0 + tw * 0.34], [rTip, a0 + tw * 0.62],
      [rRoot, a0 + tw * 0.76], [rRoot, a1],
    ];
    for (const [r, a] of pts) {
      const x = Math.cos(a) * r, y = Math.sin(a) * r;
      if (i === 0 && r === pts[0][0] && a === pts[0][1]) s.moveTo(x, y);
      else s.lineTo(x, y);
    }
  }
  s.closePath();
  const hub = opts.hub ?? Math.max(0.35, rTip * 0.14);
  const rimIn = rRoot - (opts.rim ?? Math.max(0.4, rTip * 0.14));
  if (opts.spokes !== 0 && rimIn > hub + 0.5) {
    const S = opts.spokes ?? 5;
    const arm = opts.arm ?? 0.16; // half-width of a spoke, radians at mid
    for (let k = 0; k < S; k++) {
      const c0 = (k / S) * Math.PI * 2 + arm;
      const c1 = ((k + 1) / S) * Math.PI * 2 - arm;
      const h = new THREE.Path();
      h.absarc(0, 0, hub + 0.32, c0, c1, false);
      h.absarc(0, 0, rimIn, c1, c0, true);
      h.closePath();
      s.holes.push(h);
    }
  } else {
    const h = new THREE.Path();
    h.absarc(0, 0, hub * 0.42, 0, Math.PI * 2, true);
    s.holes.push(h);
  }
  const g = new THREE.ExtrudeGeometry(s, {
    depth, bevelEnabled: true, bevelThickness: depth * 0.18,
    bevelSize: Math.min(0.07, rTip * 0.02), bevelSegments: 1, curveSegments: 6,
  });
  return EXTRUDE_UP(g);
}

/* annular sector (dial quadrant) with optional round windows */
function sectorGeom(r0, r1, a0, a1, depth, holes = []) {
  const s = new THREE.Shape();
  if (a1 - a0 >= Math.PI * 2 - 1e-4) {
    s.absarc(0, 0, r1, 0, Math.PI * 2, false);
    const inner = new THREE.Path();
    inner.absarc(0, 0, r0, 0, Math.PI * 2, true);
    s.holes.push(inner);
  } else {
    s.absarc(0, 0, r1, a0, a1, false);
    s.absarc(0, 0, r0, a1, a0, true);
    s.closePath();
  }
  for (const [hx, hy, hr] of holes) {
    const h = new THREE.Path();
    h.absarc(hx, hy, hr, 0, Math.PI * 2, true);
    s.holes.push(h);
  }
  const g = new THREE.ExtrudeGeometry(s, {
    depth, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05,
    bevelSegments: 1, curveSegments: 48,
  });
  return EXTRUDE_UP(g);
}

/* archimedean spiral tube (springs) */
function spiralGeom(rIn, rOut, turns, tube, segs = 220) {
  const pts = [];
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const a = t * turns * Math.PI * 2;
    const r = rIn + (rOut - rIn) * t;
    pts.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r));
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  return new THREE.TubeGeometry(curve, segs, tube, MOBILE ? 5 : 7, false);
}

function lathe(profile, segs = 96) {
  return new THREE.LatheGeometry(profile.map(([x, y]) => new THREE.Vector2(x, y)), segs);
}

const shadowed = (mesh, cast = true, receive = true) => {
  mesh.castShadow = cast; mesh.receiveShadow = receive; return mesh;
};

/* ═══════════════════════════════════════════════════════════════════════
   THE CALIBRE
   ═══════════════════════════════════════════════════════════════════════ */
const calibre = new THREE.Group();
scene.add(calibre);

/* pedestal — a charcoal plinth far below; catches the lamp pool */
{
  const ped = new THREE.Mesh(new THREE.CylinderGeometry(30, 30, 1.6, 72), mPedestal);
  ped.position.y = -9.6;
  ped.receiveShadow = true;
  scene.add(ped);
}

/* named layers, each with a home + an opening gesture */
const L = {};
window.__eonLayers = L;
function layer(name, y = 0) {
  const g = new THREE.Group();
  g.position.y = y;
  g.userData.homeY = y;
  calibre.add(g);
  L[name] = g;
  return g;
}

/* ── case group (band, bezel, back, lugs, crown) — sinks away when opened */
{
  const g = layer('case', 0);
  const band = new THREE.Mesh(lathe([
    [18.4, -4.6], [21.2, -3.9], [21.6, -2.2], [21.6, 3.2], [21.1, 4.4], [18.6, 4.7],
  ]), mCase);
  shadowed(band);
  const bezel = new THREE.Mesh(lathe([
    [18.6, 4.7], [21.0, 4.5], [21.35, 5.1], [20.3, 6.35], [18.2, 6.7], [17.6, 6.2],
  ]), mPolish);
  shadowed(bezel);
  const back = new THREE.Mesh(lathe([
    [0, -5.7], [12, -5.7], [17.8, -5.35], [19.9, -4.7], [18.4, -4.6],
  ]), mCase);
  shadowed(back);
  const inner = new THREE.Mesh(new THREE.CylinderGeometry(18.45, 18.45, 9.2, 72, 1, true), mCaseDark);
  inner.position.y = -0.2;
  g.add(band, bezel, back, inner);

  // integrated strap plates, flush with the band, north & south
  const sp = new THREE.Shape();
  sp.moveTo(-5.5, 0);
  sp.lineTo(5.5, 0);
  sp.lineTo(5.5, 3.2);
  sp.quadraticCurveTo(5.5, 5.4, 3.1, 5.4);
  sp.lineTo(-3.1, 5.4);
  sp.quadraticCurveTo(-5.5, 5.4, -5.5, 3.2);
  sp.closePath();
  const strapG = EXTRUDE_UP(new THREE.ExtrudeGeometry(sp, {
    depth: 1.7, bevelEnabled: true, bevelThickness: 0.22, bevelSize: 0.2, bevelSegments: 2,
  }));
  for (const sz of [-1, 1]) {
    const plate = new THREE.Mesh(strapG, mCase);
    plate.position.set(0, -2.6, sz * 18.6);
    if (sz > 0) plate.rotation.y = Math.PI;
    shadowed(plate);
    g.add(plate);
  }

  // crown at three o'clock
  const crown = new THREE.Group();
  const crownBody = new THREE.Mesh(new THREE.CylinderGeometry(2.15, 2.3, 2.4, 24), mPolish);
  crownBody.rotation.z = Math.PI / 2;
  crown.add(shadowed(crownBody));
  const knurlN = MOBILE ? 12 : 22;
  const ridge = new THREE.BoxGeometry(2.2, 0.5, 0.34);
  for (let i = 0; i < knurlN; i++) {
    const a = (i / knurlN) * Math.PI * 2;
    const m = new THREE.Mesh(ridge, mCase);
    m.position.set(0, Math.sin(a) * 2.2, Math.cos(a) * 2.2);
    m.rotation.x = -a;
    crown.add(m);
  }
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 2.2, 12), mPolish);
  stem.rotation.z = Math.PI / 2;
  stem.position.x = -2.2;
  crown.add(stem);
  crown.position.set(23.2, 0.2, 0);
  g.add(crown);

  g.userData.open = { y: -9, window: [0.095, 0.2] };
}

/* ── sapphire dome — lifts first, tilts as it goes */
{
  const g = layer('sapphire', 0);
  const R = 30, edge = 17.9;
  const cap = Math.asin(edge / R);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(R, 72, 24, 0, Math.PI * 2, 0, cap), mSapphire);
  dome.position.y = 6.55 - R * Math.cos(cap);
  dome.renderOrder = 30;
  g.add(dome);
  g.userData.open = { y: 17, rot: [-0.24, 0, 0.1], window: [0.085, 0.19] };
}

/* ── chapter ring */
{
  const g = layer('chapter', 0);
  const ring = new THREE.Mesh(sectorGeom(14.7, 17.9, 0, Math.PI * 2, 0.7), mChapter);
  ring.position.y = 3.95;
  shadowed(ring);
  g.add(ring);
  const face = new THREE.Mesh(new THREE.RingGeometry(14.7, 17.9, 128), engraveMat(null));
  face.rotation.x = -Math.PI / 2;
  face.position.y = 4.73;
  face.visible = false; // texture arrives after fonts
  g.add(face);
  g.userData.face = face;
  g.userData.open = { y: 10.5, scale: 1.32, window: [0.095, 0.205] };
}

/* ── dial quadrants: four petals, each with its guichet */
const QUAD_ANGLES = [Math.PI / 2, 0, -Math.PI / 2, Math.PI];  // shape-space: N, E, S, W
{
  const holeR = 3.1, holeAt = 9.2;
  const sunFit = withMap(mDial, texSun, 14.5);
  sunFit.anisotropy = 0.65;
  for (let i = 0; i < 4; i++) {
    const g = layer('quad' + i, 0);
    const mid = QUAD_ANGLES[i];
    const a0 = mid - Math.PI / 4 + 0.026, a1 = mid + Math.PI / 4 - 0.026;
    const hx = Math.cos(mid) * holeAt, hy = Math.sin(mid) * holeAt;
    const geom = sectorGeom(4.7, 14.45, a0, a1, 0.5, [[hx, hy, holeR]]);
    const petal = new THREE.Mesh(geom, [sunFit, mPolish]);
    petal.position.y = 3.62;
    shadowed(petal);
    g.add(petal);
    // guichet chamfer ring
    const rimG = new THREE.Mesh(new THREE.TorusGeometry(holeR + 0.08, 0.1, 8, 48), mPolish);
    rimG.rotation.x = Math.PI / 2;
    rimG.position.set(hx, 4.16, -hy);
    g.add(rimG);
    // heart chamfer (inner edge) — one segment per quadrant
    const heart = new THREE.Mesh(new THREE.TorusGeometry(4.72, 0.09, 8, 64, Math.PI / 2 - 0.05), mPolish);
    heart.rotation.x = -Math.PI / 2;
    heart.rotation.z = a0 + 0.012;
    heart.position.y = 4.16;
    g.add(heart);
    const worldMid = new THREE.Vector3(Math.cos(mid), 0, -Math.sin(mid));
    g.userData.open = {
      y: 12.5 + i * 0.4,
      tiltAxis: new THREE.Vector3(-worldMid.z, 0, worldMid.x).normalize(),
      tilt: 0.72,
      slide: worldMid.clone().multiplyScalar(6.5),
      window: [0.1 + i * 0.013, 0.215 + i * 0.013],
    };
  }
  // signatures ride on their own petals (ring segments, so each opens with its petal)
  const sig = new THREE.Mesh(new THREE.RingGeometry(3.4, 6.1, 48, 1, Math.PI / 4 + 0.03, Math.PI / 2 - 0.06), engraveMat(null));
  sig.rotation.x = -Math.PI / 2;
  sig.position.y = 4.26;
  sig.visible = false;
  L.quad0.add(sig);           // north arc text sits near the heart
  L.quad0.userData.sig = sig;
  const sig2 = new THREE.Mesh(new THREE.RingGeometry(3.4, 6.1, 48, 1, Math.PI + Math.PI / 4 + 0.03, Math.PI / 2 - 0.06), engraveMat(null));
  sig2.rotation.x = -Math.PI / 2;
  sig2.position.y = 4.26;
  sig2.visible = false;
  L.quad2.add(sig2);
  L.quad2.userData.sig = sig2;
}

/* register world positions (dial-space cardinal, radius 9.2) */
const REG_AT = {
  aestus: new THREE.Vector3(0, 0, -9.2),
  umbra: new THREE.Vector3(9.2, 0, 0),
  memoria: new THREE.Vector3(0, 0, 9.2),
  sidera: new THREE.Vector3(-9.2, 0, 0),
};

/* ── Register I · AESTUS — the tide ───────────────────────────────────── */
let liquid, moonBall, tideHand;
{
  const g = layer('aestus', 0);
  g.position.copy(REG_AT.aestus);
  g.userData.homePos = g.position.clone();
  const base = new THREE.Mesh(lathe([
    [0, 0.6], [4.8, 0.6], [5.4, 0.9], [5.4, 1.9], [4.6, 2.1], [4.55, 1.5],
    [3.15, 1.45], [3.1, 2.5], [1.55, 2.5], [1.5, 1.2], [0, 1.2],
  ], 80), mAnthr);
  shadowed(base);
  g.add(base);
  // the basin of levelled silver — a flat pool, so it mirrors the light above
  liquid = new THREE.Mesh(new THREE.CylinderGeometry(4.42, 4.42, 0.22, 64), mLiquid);
  liquid.position.y = 1.7;
  g.add(liquid);
  // the moon, at centre, in today's phase
  moonBall = new THREE.Mesh(new THREE.SphereGeometry(1.3, 40, 28), mMoon);
  moonBall.position.y = 2.22;
  g.add(moonBall);
  const moonSeat = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.14, 8, 40), mGold);
  moonSeat.rotation.x = Math.PI / 2;
  moonSeat.position.y = 1.42;
  g.add(moonSeat);
  // scale + hand
  const scaleRing = new THREE.Mesh(new THREE.RingGeometry(4.55, 5.35, 96), engraveMat(null));
  scaleRing.rotation.x = -Math.PI / 2;
  scaleRing.position.y = 2.14;
  scaleRing.visible = false;
  g.add(scaleRing);
  g.userData.scale = scaleRing;
  tideHand = new THREE.Group();
  const handBar = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 1.35), mBlued);
  handBar.position.z = -4.95;
  tideHand.add(handBar);
  tideHand.position.y = 2.2;
  g.add(tideHand);
  g.userData.open = { y: 6.2, window: [0.195, 0.3] };
}

/* ── Register II · UMBRA — the shadow ─────────────────────────────────── */
let platter, gnomon;
{
  const g = layer('umbra', 0);
  g.position.copy(REG_AT.umbra);
  g.userData.homePos = g.position.clone();
  const base = new THREE.Mesh(lathe([
    [0, 0.5], [4.8, 0.5], [5.3, 0.8], [5.3, 1.5], [4.8, 1.7], [0, 1.7],
  ], 80), mAnthr);
  shadowed(base);
  g.add(base);
  platter = new THREE.Mesh(new THREE.CylinderGeometry(4.75, 4.9, 0.34, 72), withMap(mBridge, texCirc, 5));
  platter.position.y = 1.85;
  platter.receiveShadow = true;
  g.add(platter);
  const scaleRing = new THREE.Mesh(new THREE.RingGeometry(2.6, 4.6, 96), engraveMat(null));
  scaleRing.rotation.x = -Math.PI / 2;
  scaleRing.position.y = 2.04;
  scaleRing.visible = false;
  platter.add(scaleRing);
  scaleRing.position.y = 0.19;
  g.userData.scale = scaleRing;
  // the gnomon: a blade of blued steel, tip rising into the guichet
  const blade = new THREE.Shape();
  blade.moveTo(-1.7, 0);
  blade.lineTo(1.9, 0);
  blade.lineTo(-0.4, 2.35);
  blade.closePath();
  const bladeG = new THREE.ExtrudeGeometry(blade, {
    depth: 0.12, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 1,
  });
  bladeG.translate(0, 0, -0.06);
  const mGnomon = mBlued.clone();
  mGnomon.roughness = 0.42;
  mGnomon.envMapIntensity = 0.9;
  mGnomon.color = new THREE.Color('#1f3f8a');
  mGnomon.iridescence = 0.15;
  gnomon = new THREE.Mesh(bladeG, mGnomon);
  gnomon.position.y = 2.02;
  gnomon.rotation.y = Math.PI / 2;
  gnomon.castShadow = true;
  g.add(gnomon);
  g.userData.open = { y: 5.2, window: [0.355, 0.46] };
}

/* ── Register III · MEMORIA — the while ───────────────────────────────── */
let memSpring, memMarks, memDrum;
{
  const g = layer('memoria', 0);
  g.position.copy(REG_AT.memoria);
  g.userData.homePos = g.position.clone();
  const base = new THREE.Mesh(lathe([
    [0, 0.4], [4.2, 0.4], [4.9, 0.7], [4.9, 1.1], [0, 1.1],
  ], 72), mAnthr);
  g.add(shadowed(base));
  memDrum = new THREE.Group();
  // skeleton drum: wall + open top ring + four spokes
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.5, 1.7, 72, 1, true), mBridge);
  wall.position.y = 1.95;
  memDrum.add(shadowed(wall, true, true));
  const lip = new THREE.Mesh(new THREE.TorusGeometry(4.5, 0.16, 8, 72), mPolish);
  lip.rotation.x = Math.PI / 2;
  lip.position.y = 2.8;
  memDrum.add(lip);
  for (let i = 0; i < 4; i++) {
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.16, 8.6), mBridge);
    spoke.rotation.y = (i / 4) * Math.PI + Math.PI / 4;
    spoke.position.y = 2.78;
    memDrum.add(spoke);
  }
  // the spring inside — it keeps what the marks measure
  memSpring = new THREE.Mesh(spiralGeom(0.75, 3.85, 4.5, 0.15, MOBILE ? 160 : 240), mBlued);
  memSpring.position.y = 1.9;
  memDrum.add(memSpring);
  const arbor = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 2.3, 20), mPolish);
  arbor.position.y = 1.95;
  memDrum.add(arbor);
  g.add(memDrum);
  // the marks: engraved one per ten seconds attended
  const markG = new THREE.BoxGeometry(0.12, 0.07, 0.8);
  memMarks = new THREE.InstancedMesh(markG, mGold, 96);
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), S = new THREE.Vector3(1, 1, 1);
  for (let i = 0; i < 96; i++) {
    const a = Math.PI / 2 + (i / 96) * Math.PI * 2;   // first marks face the act's camera (south)
    V.set(Math.cos(a) * 4.78, 2.86, Math.sin(a) * 4.78);
    Q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -a + Math.PI / 2);
    M.compose(V, Q, S);
    memMarks.setMatrixAt(i, M);
  }
  memMarks.count = 1;
  memMarks.instanceMatrix.needsUpdate = true;
  g.add(memMarks);
  g.userData.open = { y: 4.4, window: [0.515, 0.62] };
}

/* ── Register IIII · SIDERA — the sky ─────────────────────────────────── */
const planetPivots = [];
{
  const g = layer('sidera', 0);
  g.position.copy(REG_AT.sidera);
  g.userData.homePos = g.position.clone();
  const base = new THREE.Mesh(lathe([
    [0, 0.3], [4.8, 0.3], [5.4, 0.6], [5.4, 1.0], [4.8, 1.15], [0, 1.15],
  ], 80), mAnthr);
  g.add(shadowed(base));
  const sun = new THREE.Mesh(new THREE.SphereGeometry(0.52, 24, 18), mGold);
  sun.position.y = 1.75;
  g.add(sun);
  const d = dSinceJ2000();
  for (const p of PLANETS) {
    const rail = new THREE.Mesh(new THREE.TorusGeometry(p.rail, 0.03, 6, 96), mAnthr.clone());
    rail.material.color = new THREE.Color('#4a5059');
    rail.rotation.x = Math.PI / 2;
    rail.position.y = 1.55;
    g.add(rail);
    const pivot = new THREE.Group();
    pivot.position.y = 1.62;
    const Lrad = ((p.L0 + p.n * d) % 360) * (Math.PI / 180);
    pivot.userData.base = -Lrad;
    pivot.rotation.y = -Lrad;
    const bead = new THREE.Mesh(new THREE.SphereGeometry(p.r, 20, 14),
      P({ color: p.tint, metalness: 0.25, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.12 }));
    bead.position.x = p.rail;
    bead.castShadow = true;
    pivot.add(bead);
    if (p.name === 'SA') {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(p.r * 1.65, 0.035, 6, 40), mGold);
      ring.rotation.x = Math.PI / 2.4;
      ring.position.x = p.rail;
      pivot.add(ring);
    }
    pivot.userData.rate = p.n * (Math.PI / 180) * (REDUCED ? 0 : 0.7); // exaggerated, ratio-true
    planetPivots.push(pivot);
    g.add(pivot);
  }
  g.userData.open = { y: 3.6, scale: 1.42, window: [0.675, 0.78] };
}

/* ── the going train: one great wheel drives all four registers ───────── */
const spinning = []; // { mesh, rate }
{
  const g = layer('train', 0);
  const gw = new THREE.Mesh(gearGeom(6.7, 67, 0.55, { spokes: 5, rim: 0.85, hub: 0.8 }), [withMap(mBridge, texCirc, 7), mPolish]);
  gw.position.y = -1.5;
  shadowed(gw);
  g.add(gw);
  const GW_RATE = REDUCED ? 0.012 : 0.05;
  spinning.push({ mesh: gw, rate: GW_RATE });
  const gwCap = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.9, 0.9, 24), mPolish);
  gwCap.position.y = -1.2;
  g.add(gwCap);

  // four register pinions at the cardinals (r 6.7 + r 1.5 = 8.2 → at 8.2… seated 8.9 under their registers with mesh tuck)
  for (const key of ['aestus', 'umbra', 'memoria', 'sidera']) {
    const at = REG_AT[key];
    const dir = at.clone().normalize();
    const pin = new THREE.Mesh(gearGeom(1.5, 15, 0.5, { spokes: 0 }), [mBridge, mPolish]);
    pin.position.copy(dir.multiplyScalar(8.2));
    pin.position.y = -1.5;
    shadowed(pin);
    g.add(pin);
    spinning.push({ mesh: pin, rate: -GW_RATE * 6.7 / 1.5 });
  }
  // reserve wheel NE, small pinion NW — the rest of the going train
  const res = new THREE.Mesh(gearGeom(3.0, 30, 0.5, { spokes: 4, rim: 0.5, hub: 0.5 }), [withMap(mBridge, texCirc, 3.2), mPolish]);
  res.position.set(6.86, -1.5, -6.86);
  shadowed(res);
  g.add(res);
  spinning.push({ mesh: res, rate: -GW_RATE * 6.7 / 3.0 });
  const nw = new THREE.Mesh(gearGeom(1.2, 12, 0.45, { spokes: 0 }), [mBridge, mPolish]);
  nw.position.set(-5.59, -1.5, -5.59);
  g.add(nw);
  spinning.push({ mesh: nw, rate: GW_RATE * 6.7 / 1.2 * -1 });
  g.userData.open = { y: 2.2, window: [0.69, 0.8] };
  g.userData.fan = [gw, res, nw];
}

/* ── escapement + balance: the heart, visible where hands would stand ── */
let balWheel, hairspring, escWheel, fork;
{
  const g = layer('heart', 0);
  // escape wheel SE
  escWheel = new THREE.Mesh(gearGeom(2.2, 15, 0.4, { spokes: 4, rim: 0.34, hub: 0.4, tooth: 0.55 }), [mPolish, mPolish]);
  escWheel.position.set(6.29, -0.6, 6.29);
  shadowed(escWheel);
  g.add(escWheel);
  // pallet fork reaching toward centre
  fork = new THREE.Group();
  const forkArm = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.18, 0.34), mPolish);
  forkArm.position.x = -1.7;
  fork.add(forkArm);
  const forkHead = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 1.15), mBlued);
  forkHead.position.x = -3.3;
  fork.add(forkHead);
  fork.position.set(4.6, -0.45, 4.6);
  fork.rotation.y = Math.PI / 4;
  g.add(fork);

  // the balance
  const bal = new THREE.Group();
  balWheel = new THREE.Group();
  const rimT = new THREE.Mesh(new THREE.TorusGeometry(3.35, 0.28, 12, 72), mPolish);
  rimT.rotation.x = Math.PI / 2;
  balWheel.add(shadowed(rimT));
  for (let i = 0; i < 2; i++) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.2, 0.48), mPolish);
    arm.rotation.y = (i / 2) * Math.PI;
    balWheel.add(arm);
  }
  const screwG = new THREE.CylinderGeometry(0.15, 0.15, 0.32, 10);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    const s = new THREE.Mesh(screwG, mGold);
    s.position.set(Math.cos(a) * 3.35, 0, Math.sin(a) * 3.35);
    s.rotation.z = Math.PI / 2;
    s.rotation.y = -a;
    balWheel.add(s);
  }
  const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 2.4, 10), mPolish);
  balWheel.add(staff);
  bal.add(balWheel);
  hairspring = new THREE.Mesh(spiralGeom(0.42, 2.55, 5, 0.055, MOBILE ? 180 : 260), mBlued);
  hairspring.position.y = -0.55;
  bal.add(hairspring);
  bal.position.set(0, 1.75, 0);
  g.add(bal);

  // balance cock: a skeleton arm from the east, jewel at its eye
  const cockShape = new THREE.Shape();
  cockShape.moveTo(8.6, -1.15);
  cockShape.quadraticCurveTo(4.5, -1.5, 1.3, -0.75);
  cockShape.absarc(0, 0, 1.5, -Math.PI / 2.6, Math.PI / 2.6, false);
  cockShape.quadraticCurveTo(4.5, 1.5, 8.6, 1.15);
  cockShape.closePath();
  const cockHole = new THREE.Path();
  cockHole.absarc(0, 0, 0.72, 0, Math.PI * 2, true);
  cockShape.holes.push(cockHole);
  const win = new THREE.Path();
  win.moveTo(6.9, -0.62);
  win.quadraticCurveTo(4.6, -0.9, 2.6, -0.5);
  win.lineTo(2.6, 0.5);
  win.quadraticCurveTo(4.6, 0.9, 6.9, 0.62);
  win.closePath();
  cockShape.holes.push(win);
  const cock = new THREE.Mesh(
    EXTRUDE_UP(new THREE.ExtrudeGeometry(cockShape, {
      depth: 0.42, bevelEnabled: true, bevelThickness: 0.09, bevelSize: 0.09, bevelSegments: 1, curveSegments: 24,
    })),
    [withMap(mBridge, texCotes, 9), mPolish]
  );
  cock.position.y = 2.62;
  shadowed(cock);
  g.add(cock);
  const chat = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.14, 8, 28), mGold);
  chat.rotation.x = Math.PI / 2;
  chat.position.y = 3.1;
  g.add(chat);
  const jewel = new THREE.Mesh(new THREE.SphereGeometry(0.4, 20, 14), mRuby);
  jewel.scale.y = 0.62;
  jewel.position.y = 3.12;
  g.add(jewel);
  g.userData.open = { y: 0, window: [0, 0.0001] };  // the heart never leaves
}

/* ── bridges over the train ───────────────────────────────────────────── */
{
  const g = layer('bridges', 0);
  const mk = (pts, holes = []) => {
    const s = new THREE.Shape();
    s.moveTo(...pts[0]);
    for (let i = 1; i < pts.length; i += 2) s.quadraticCurveTo(...pts[i], ...(pts[i + 1] || pts[0]));
    s.closePath();
    for (const [hx, hy, hr] of holes) {
      const h = new THREE.Path();
      h.absarc(hx, hy, hr, 0, Math.PI * 2, true);
      s.holes.push(h);
    }
    return new THREE.Mesh(
      EXTRUDE_UP(new THREE.ExtrudeGeometry(s, {
        depth: 0.8, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.12, bevelSegments: 1, curveSegments: 20,
      })),
      [withMap(mBridge, texCotes, 12), mPolish]
    );
  };
  // north-east bridge, carrying two jewels
  const b1 = mk(
    [[-12.5, -8.0], [-4, -13.4], [4.2, -10.4], [10.6, -8.4], [12.8, -3.2], [9.2, -1.4], [4.4, -3.5], [-2.5, -3.4], [-8.5, -3.3], [-12.9, -4.6]],
    [[-8.2, -6.3, 1.1], [6.9, -6.4, 1.1]]
  );
  b1.position.y = -0.85;
  shadowed(b1);
  g.add(b1);
  // south-west bridge
  const b2 = mk(
    [[12.5, 8.0], [4, 13.4], [-4.2, 10.4], [-10.6, 8.4], [-12.8, 3.2], [-9.2, 1.4], [-4.4, 3.5], [2.5, 3.4], [8.5, 3.3], [12.9, 4.6]],
    [[8.2, 6.3, 1.1], [-6.9, 6.4, 1.1]]
  );
  b2.position.y = -0.85;
  shadowed(b2);
  g.add(b2);

  // jewels in chatons at the bridge eyes (world xz from shape-space x,-y)
  const eyeAt = [[-8.2, 6.3], [6.9, 6.4], [8.2, -6.3], [-6.9, -6.4]];
  for (const [x, z] of eyeAt) {
    const chat = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.16, 8, 28), mGold);
    chat.rotation.x = Math.PI / 2;
    chat.position.set(x, 0.12, z);
    g.add(chat);
    const jw = new THREE.Mesh(new THREE.SphereGeometry(0.46, 20, 14), mRuby);
    jw.scale.y = 0.6;
    jw.position.set(x, 0.14, z);
    g.add(jw);
  }
  // blued screws along the bridges
  const headG = new THREE.CylinderGeometry(0.4, 0.44, 0.16, 16);
  const slotG = new THREE.BoxGeometry(0.62, 0.05, 0.12);
  const screwAt = [[-11.3, 5.6], [1.2, 11.2], [11.4, 4.9], [11.3, -5.6], [-1.2, -11.2], [-11.4, -4.9]];
  screwAt.forEach(([x, z], i) => {
    const s = new THREE.Group();
    s.add(new THREE.Mesh(headG, mBlued));
    const slot = new THREE.Mesh(slotG, mCaseDark);
    slot.position.y = 0.06;
    slot.rotation.y = i * 1.1;
    s.add(slot);
    s.position.set(x, 0.08, z);
    g.add(s);
  });
  g.userData.open = { y: 0, window: [0, 0.0001] };
}

/* ── main plate ───────────────────────────────────────────────────────── */
{
  const g = layer('plate', 0);
  const plate = new THREE.Mesh(lathe([
    [0, -4.3], [16.4, -4.3], [18.0, -3.9], [18.0, -2.6], [16.8, -2.3], [0, -2.3],
  ], 96), withMap(mPlate, texPerl, 18));
  plate.receiveShadow = true;
  g.add(plate);
  const rimText = new THREE.Mesh(new THREE.RingGeometry(14.6, 17.6, 128), engraveMat(null));
  rimText.rotation.x = -Math.PI / 2;
  rimText.position.y = -2.28;
  rimText.visible = false;
  g.add(rimText);
  g.userData.face = rimText;
  // recess inlays under the registers + the heart
  for (const key of Object.keys(REG_AT)) {
    const at = REG_AT[key];
    const well = new THREE.Mesh(new THREE.CylinderGeometry(6.0, 6.0, 0.16, 48), mAnthr);
    well.position.set(at.x, -2.24, at.z);
    well.receiveShadow = true;
    g.add(well);
  }
  const wellC = new THREE.Mesh(new THREE.CylinderGeometry(7.1, 7.1, 0.16, 56), mAnthr);
  wellC.position.y = -2.24;
  wellC.receiveShadow = true;
  g.add(wellC);
  g.userData.open = { y: 0, window: [0, 0.0001] };
}

/* ═══════════════════════════════════════════════════════════════════════
   CAMERA PATH
   ═══════════════════════════════════════════════════════════════════════ */
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const CAM_KEYS = [
  { p: 0.0, pos: V3(40, 52, 55), look: V3(0, 1, 0) },
  { p: 0.05, pos: V3(25, 38, 39), look: V3(0, 2, 0) },
  { p: 0.10, pos: V3(7, 36, 27), look: V3(0, 5, -1.5) },
  { p: 0.175, pos: V3(1, 35, 13), look: V3(0, 6, -2.5) },
  { p: 0.24, pos: V3(6, 16, -27), look: V3(0, 6.5, -9.2) },
  { p: 0.315, pos: V3(-10, 12, -24), look: V3(0, 6, -9.2) },
  { p: 0.37, pos: V3(14, 11, -18), look: V3(5.5, 5.5, -3.5) },
  { p: 0.425, pos: V3(27, 13, 10), look: V3(9.2, 5.5, 0) },
  { p: 0.49, pos: V3(22, 15, -11), look: V3(9.2, 5, 0) },
  { p: 0.545, pos: V3(11, 12, 26), look: V3(2, 4.5, 9.2) },
  { p: 0.615, pos: V3(-11, 11, 25), look: V3(0, 4.5, 9.2) },
  { p: 0.68, pos: V3(-22, 11, 13), look: V3(-7, 4.5, 4) },
  { p: 0.74, pos: V3(-26, 13, -7), look: V3(-9.2, 5, 0) },
  { p: 0.80, pos: V3(-32, 20, 17), look: V3(-2, 5, 0) },
  { p: 0.862, pos: V3(-30, 44, 46), look: V3(0, 4, 0) },
  { p: 0.93, pos: V3(-2, 46, 18), look: V3(0, 2, 0) },
  { p: 1.0, pos: V3(0, 42, 9), look: V3(0, 1, 0) },
];

/* non-uniform Hermite sampling of keyframes (C1, honours plateaus) — PATTERNS-adjacent, PARALLAX-proven */
function sampleKeys(keys, p, out) {
  const n = keys.length;
  let i = 0;
  while (i < n - 2 && p > keys[i + 1].p) i++;
  const k0 = keys[i], k1 = keys[i + 1];
  const span = Math.max(k1.p - k0.p, 1e-6);
  const t = THREE.MathUtils.clamp((p - k0.p) / span, 0, 1);
  const prev = keys[Math.max(i - 1, 0)], next = keys[Math.min(i + 2, n - 1)];
  for (const ch of ['pos', 'look']) {
    const P0 = k0[ch], P1 = k1[ch], Pm = prev[ch], Pp = next[ch];
    const still = P0.distanceToSquared(P1) < 1e-8;
    for (const ax of ['x', 'y', 'z']) {
      const m0 = still ? 0 : (P1[ax] - Pm[ax]) / Math.max(k1.p - prev.p, 1e-6) * span;
      const m1 = still ? 0 : (Pp[ax] - P0[ax]) / Math.max(next.p - k0.p, 1e-6) * span;
      const t2 = t * t, t3 = t2 * t;
      out[ch][ax] =
        (2 * t3 - 3 * t2 + 1) * P0[ax] + (t3 - 2 * t2 + t) * m0 +
        (-2 * t3 + 3 * t2) * P1[ax] + (t3 - t2) * m1;
    }
  }
}
const camPose = { pos: new THREE.Vector3(), look: new THREE.Vector3() };

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

/* the lamp: pointer position → a hand-held light on a sphere around the work */
let lampNX = -0.4, lampNY = -0.35;        // normalized pointer, idle default
let lampTX = lampNX, lampTY = lampNY;
let lastInput = -10, lampTouched = false;
if (!COARSE) {
  addEventListener('pointermove', (e) => {
    lampTX = (e.clientX / innerWidth - 0.5) * 2;
    lampTY = (e.clientY / innerHeight - 0.5) * 2;
    lastInput = perfNow();
    lampTouched = true;
  }, { passive: true });
} else {
  let lastX = null;
  addEventListener('pointerdown', (e) => { lastX = e.clientX; }, { passive: true });
  addEventListener('pointermove', (e) => {
    if (lastX === null) return;
    lampTX = THREE.MathUtils.clamp(lampTX + (e.clientX - lastX) / innerWidth * 2.4, -1, 1);
    lastX = e.clientX;
    lastInput = perfNow();
    lampTouched = true;
  }, { passive: true });
  addEventListener('pointerup', () => { lastX = null; }, { passive: true });
  addEventListener('pointercancel', () => { lastX = null; }, { passive: true });
}
function perfNow() { return performance.now() / 1000; }

/* ═══════════════════════════════════════════════════════════════════════
   DOM WIRING — gate, labels, hud, live papers
   ═══════════════════════════════════════════════════════════════════════ */
const gate = $('#gate'), enterBtn = $('#enter'), cue = $('#cue');
const labels = [...document.querySelectorAll('.label')];
const hudReg = $('#hud-reg'), hudRes = $('#hud-res'), hudResBar = $('#hud-res-bar');
let entered = false, everScrolled = false;

const LABEL_WINDOWS = [
  [0.0, 0.075], [0.105, 0.19], [0.225, 0.345], [0.385, 0.505],
  [0.545, 0.665], [0.705, 0.825], [0.872, 0.952],
];
const ACT_NAMES = [
  'CAL. C.1 — WOUND', 'THE CALIBRE, OPENING',
  'REG. I — AESTUS', 'REG. II — UMBRA',
  'REG. III — MEMORIA', 'REG. IIII — SIDERA',
  'CLOSING',
];

function enter(skipWalk) {
  if (entered) return;
  entered = true;
  doc.classList.add('entered');
  gate.classList.add('leave');
  setTimeout(() => { gate.style.display = 'none'; }, 1050);
  if (skipWalk) {
    $('#papers').scrollIntoView();
  } else {
    scrollTo(0, 0);
    cue.classList.add('show');
  }
}
enterBtn.addEventListener('click', () => enter(false));
$('#gate-skip').addEventListener('click', (e) => { e.preventDefault(); enter(true); });
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
  const failsafe = () => parts.forEach(show);
  setTimeout(() => {
    // anything already in view but not shown: reveal everything (observer stalled or hidden tab)
    if (parts.some((el) => !el.classList.contains('is-in') && el.getBoundingClientRect().top < innerHeight)) failsafe();
  }, 2600);
  addEventListener('scroll', () => {
    parts.forEach((el) => {
      if (!el.classList.contains('is-in') && el.getBoundingClientRect().top < innerHeight * 0.96) show(el);
    });
  }, { passive: true });
}

/* live register readings in the papers */
const liveA = $('#live-aestus'), liveU = $('#live-umbra'), liveM = $('#live-memoria'), liveS = $('#live-sidera');
const t0 = Date.now();
function phaseName(age) {
  const i = Math.floor((age / SYNODIC) * 8 + 0.5) % 8;
  return ['new', 'waxing crescent', 'first quarter', 'waxing gibbous', 'full',
    'waning gibbous', 'last quarter', 'waning crescent'][i];
}
function updateLive() {
  const ts = tideState();
  const lean = ts.springK > 0.72 ? 'leaning spring' : ts.springK < 0.38 ? 'leaning neap' : 'between books';
  liveA.textContent = `now — moon ${ts.age.toFixed(1)} d · ${phaseName(ts.age)} · ${lean} · water ${ts.rising ? 'rising' : 'easing'}`;
  if (lampTouched) {
    const az = Math.round(((Math.atan2(lamp.position.x, lamp.position.z) * 180 / Math.PI) + 360) % 360);
    const el = Math.round(Math.asin(THREE.MathUtils.clamp(lamp.position.y / lamp.position.length(), -1, 1)) * 180 / Math.PI);
    liveU.textContent = `now — your lamp at ${az}° · ${el}° high · the register agrees`;
  } else {
    liveU.textContent = 'now — awaiting your lamp';
  }
  const dwell = Math.floor((Date.now() - t0) / 1000);
  const mm = String(Math.floor(dwell / 60)).padStart(2, '0');
  const ss = String(dwell % 60).padStart(2, '0');
  liveM.textContent = `now — this sitting ${mm}:${ss} · ${Math.min(96, Math.floor(dwell / 10) + 1)} marks taken`;
  const d = dSinceJ2000();
  liveS.textContent = 'now — ' + PLANETS.map((p) => `${p.name} ${Math.round(((p.L0 + p.n * d) % 360 + 360) % 360)}°`).join(' · ');
}
updateLive();
setInterval(updateLive, 1000);

/* ═══════════════════════════════════════════════════════════════════════
   PER-FRAME COMPOSITION
   ═══════════════════════════════════════════════════════════════════════ */
const clock = new THREE.Clock();
const sm = (p, a, b) => THREE.MathUtils.smoothstep(p, a, b);
const _q = new THREE.Quaternion();
let lampX = 0, lampY = 0;

function composeFrame(p, time) {
  const closeMul = 1 - sm(p, 0.858, 0.952);

  /* layer choreography */
  for (const name of Object.keys(L)) {
    const g = L[name];
    const o = g.userData.open;
    if (!o) continue;
    const k = sm(p, o.window[0], o.window[1]) * closeMul;
    const homeY = g.userData.homeY || 0;
    if (g.userData.homePos) {
      g.position.copy(g.userData.homePos);
      g.position.y = homeY + (o.y || 0) * k;
    } else {
      g.position.set(0, homeY + (o.y || 0) * k, 0);
    }
    if (o.slide) {
      g.position.x += o.slide.x * k;
      g.position.z += o.slide.z * k;
    }
    if (o.rot) g.rotation.set(o.rot[0] * k, o.rot[1] * k, o.rot[2] * k);
    if (o.tiltAxis) {
      _q.setFromAxisAngle(o.tiltAxis, o.tilt * k);
      g.quaternion.copy(_q);
    }
    if (o.scale) g.scale.setScalar(1 + (o.scale - 1) * k);
  }
  /* the train fans into a column at Sidera */
  const fanK = sm(p, 0.7, 0.82) * closeMul;
  const fan = L.train.userData.fan;
  fan[1].position.y = -1.5 + 2.6 * fanK;
  fan[2].position.y = -1.5 + 1.4 * fanK;

  /* arrival breathing: the whole calibre, gently */
  const idleK = (1 - sm(p, 0.03, 0.09)) + sm(p, 0.955, 1);
  calibre.position.y = REDUCED ? 0 : Math.sin(time * 0.5) * 0.14 * idleK;
  calibre.rotation.y = REDUCED ? 0 : Math.sin(time * 0.11) * 0.045 * idleK;

  /* mechanics — always running */
  const beat = REDUCED ? Math.sin(time * Math.PI) * 0.55 : Math.sin(time * Math.PI * 5) * 2.3;
  balWheel.rotation.y = beat;
  const spr = 1 + (REDUCED ? 0.015 : 0.05) * Math.sin(time * Math.PI * 5 + 1.2);
  hairspring.scale.set(spr, 1, spr);
  escWheel.rotation.y = -Math.floor(time * 5) * (Math.PI / 15) - (REDUCED ? 0 : sm((time * 5) % 1, 0, 0.14) * (Math.PI / 15));
  fork.rotation.y = Math.PI / 4 + (Math.sin(time * Math.PI * 5) > 0 ? 0.16 : -0.16);
  for (const s of spinning) s.mesh.rotation.y = s.rate * time;
  for (const pv of planetPivots) pv.rotation.y = pv.userData.base - pv.userData.rate * time;
  memSpring.rotation.y = time * 0.02;
  platter.rotation.y = time * 0.006;

  /* the tide, live */
  const ts = tideState(time);
  liquid.position.y = 1.62 + ts.level * 0.34;
  if (!REDUCED) liquid.rotation.set(Math.sin(time * 0.7) * 0.015, 0, Math.sin(time * 0.53) * 0.015);
  tideHand.rotation.y = -ts.level * 0.62;
  /* the moon, live — today's phase, terminator presented toward the visitor */
  const phase = (moonAge() / SYNODIC) * Math.PI * 2;
  const mAz = Math.atan2(camera.position.x, camera.position.z + 9.2) + (Math.PI - phase);
  moonUniforms.uSun.value.set(Math.sin(mAz), 0.15, Math.cos(mAz));
  moonBall.rotation.y = time * 0.01;
  /* the while, live */
  const marks = Math.min(96, Math.floor((Date.now() - t0) / 10000) + 1);
  if (memMarks.count !== marks) { memMarks.count = marks; }

  /* the heart glows with the beat */
  heartGlow.intensity = 20 + 5 * Math.sin(time * Math.PI * 5);

  /* camera */
  sampleKeys(CAM_KEYS, p, camPose);
  camera.position.copy(camPose.pos);
  if (MOBILE) camera.position.sub(camPose.look).multiplyScalar(1.28).add(camPose.look);
  camera.up.set(0, 1, 0);
  /* small parallax sway from the pointer */
  camera.position.x += lampX * 0.55;
  camera.position.y += -lampY * 0.4;
  camera.lookAt(camPose.look);

  /* the lamp rides the pointer on a sphere around the work */
  const idle = perfNow() - lastInput > 4 && !REDUCED;
  if (idle) {
    lampTX = Math.sin(time * 0.13) * 0.5 - 0.2;
    lampTY = Math.cos(time * 0.09) * 0.22 + 0.12;
  }
  lampX += (lampTX - lampX) * 0.06;
  lampY += (lampTY - lampY) * 0.06;
  const camAz = Math.atan2(camera.position.x - camPose.look.x, camera.position.z - camPose.look.z);
  const umbraK = sm(p, 0.36, 0.42) * (1 - sm(p, 0.5, 0.56));
  const az = camAz + lampX * 1.45 - umbraK * 0.55;
  const elBase = 0.62 - umbraK * 0.3;   // the lamp grazes low over Umbra
  const el = THREE.MathUtils.clamp(elBase - lampY * 0.6, 0.14, 1.2);
  const R = 30;
  lamp.position.set(
    camPose.look.x + Math.sin(az) * Math.cos(el) * R,
    Math.sin(el) * R,
    camPose.look.z + Math.cos(az) * Math.cos(el) * R
  );
  lamp.target.position.copy(camPose.look);
  lamp.intensity = 3400 + 1400 * umbraK;

  /* depth grading */
  scene.fog.density = 0.0042 + sm(p, 0.94, 1) * 0.0
    + 0.0016 * sm(p, 0.8, 0.862) * (1 - sm(p, 0.9, 0.96));
}

/* DOM state per frame (cheap) */
let lastRes = -1, lastAct = -1;
function composeDom(p) {
  const res = Math.round(96 * (1 - p));
  if (res !== lastRes) {
    lastRes = res;
    hudRes.textContent = String(res);
    hudResBar.style.transform = `scaleX(${(1 - p).toFixed(4)})`;
  }
  const act = p < 0.09 ? 0 : p < 0.215 ? 1 : p < 0.37 ? 2 : p < 0.53 ? 3 : p < 0.69 ? 4 : p < 0.858 ? 5 : 6;
  if (act !== lastAct) {
    lastAct = act;
    hudReg.textContent = ACT_NAMES[act];
  }
  for (let i = 0; i < labels.length; i++) {
    const w = LABEL_WINDOWS[i];
    labels[i].classList.toggle('on', entered && p >= w[0] && p <= w[1]);
  }
  if (entered && !everScrolled && p > 0.012) {
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
  if (!degraded && entered) {
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
   BOOT
   ═══════════════════════════════════════════════════════════════════════ */
addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  readScroll();
});

function applyEngravings() {
  const set = (mesh, tex) => {
    if (!mesh) return;
    if (mesh.material.map) mesh.material.map.dispose();
    mesh.material.map = tex;
    mesh.material.needsUpdate = true;
    mesh.visible = true;
  };
  set(L.chapter.userData.face, drawChapter());
  set(L.plate.userData.face, drawPlateRim());
  set(L.quad0.userData.sig, drawSigNorth());
  set(L.quad2.userData.sig, drawSigSouth());
  set(L.aestus.userData.scale, drawAestusScale());
  set(L.umbra.userData.scale, drawUmbraScale());
}

(async () => {
  try {
    await Promise.race([
      Promise.all([
        document.fonts.load(`500 34px "Spline Sans Mono"`),
        document.fonts.load(`26px "Marcellus"`),
      ]),
      new Promise((r) => setTimeout(r, 2500)),
    ]);
  } catch (e) { /* fallback glyphs are fine */ }
  applyEngravings();
  document.fonts.ready.then(applyEngravings);
  readScroll();
  composeFrame(0, 0);
  renderer.render(scene, camera);
  enterBtn.disabled = false;
  frame();
})();

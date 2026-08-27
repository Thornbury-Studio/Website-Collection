/* ═══════════════════════════════════════════════════════════════════════════
   PARALLAX — EXHIBIT 00 · the walk
   One world, one camera, one population of porcelain fragments that keeps
   reassembling into the works. Parallax — the line of sight — is the medium:
   the word, and the final tri-bar, only exist from one exact viewpoint.
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
  count: MOBILE ? 680 : 1340,          // fragment population
  dprCap: MOBILE ? 1.8 : 2,
  fov: MOBILE ? 58 : 42,
  trackVh: MOBILE ? 980 : 1150,
  scrollK: REDUCED ? 0.2 : MOBILE ? 0.09 : 0.062,
  portals: MOBILE ? 7 : 9,
};

/* ── palette ──────────────────────────────────────────────────────────── */
const PORCELAIN = new THREE.Color('#ece8e0');
const INK = '#191610';
// pigment = the iridescence bias per act; fog leans toward it by a whisper
const PIGMENTS = [
  new THREE.Color('#8e8aa8'), // 00 silver-violet
  new THREE.Color('#2b4bc9'), // 01 cobalt
  new THREE.Color('#a89066'), // 02 dry sandstone
  new THREE.Color('#1e7f66'), // 03 viridian
  new THREE.Color('#8f84b8'), // 04 silver-violet, denser
  new THREE.Color('#8e8aa8'), // 05 dissolve
];
/* per-act iridescence: the vessel and torus may shimmer; architecture is dry */
const IRID_ACT = [0.55, 0.6, 0.24, 0.62, 0.5, 0.45];

/* ── seeded random (stable art direction across loads) ────────────────── */
let _seed = 22;
function rnd() {
  _seed = (_seed * 16807) % 2147483647;
  return (_seed - 1) / 2147483646;
}

/* ── renderer ─────────────────────────────────────────────────────────── */
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
} catch (e) {
  doc.classList.add('no-3d');
  throw e;
}
window.__parallax = true;

let DPR = Math.min(devicePixelRatio || 1, CFG.dprCap);
renderer.setPixelRatio(DPR);
renderer.setSize(innerWidth, innerHeight);
renderer.setClearColor(PORCELAIN);
renderer.domElement.className = 'scene';
document.body.prepend(renderer.domElement);

const scene = new THREE.Scene();
const FOG0 = 0.024;
scene.fog = new THREE.FogExp2(PORCELAIN.clone(), FOG0);

const camera = new THREE.PerspectiveCamera(CFG.fov, innerWidth / innerHeight, 0.1, 240);

/* ═══════════════════════════════════════════════════════════════════════
   WORLD LAYOUT
   ═══════════════════════════════════════════════════════════════════════ */
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

const VESSEL = V3(-13, -1.5, -30);
const CORR_X = -13, CORR_Y = -0.5, CORR_Z0 = -54, CORR_DZ = -6;
const RING = V3(-13, 2, -116);
const TORUS = V3(2, 0.5, -126);
const PEN = V3(26, 2, -148);
const PEN_L = 7;
const ALIGN_DIR = V3(1, 1, 1).normalize();
/* long lens + long distance: near-orthographic, so the tri-bar's two open
   ends overlap almost perfectly and the joint reads as truly closed */
const PEN_CAM = PEN.clone().add(ALIGN_DIR.clone().multiplyScalar(70));

/* camera keyframes: p, position, look target */
const CAM_KEYS = [
  { p: 0.0, pos: V3(-9, 3.4, 20.5), look: V3(0, 0.2, 0) },
  { p: 0.075, pos: V3(0, 0.35, 14.5), look: V3(0, 0.2, 0) },
  { p: 0.135, pos: V3(-3.5, 0.1, 2), look: V3(-10, -0.9, -19) },
  { p: 0.185, pos: V3(-7.5, -0.6, -16), look: V3(-13, -1.2, -30) },
  { p: 0.27, pos: V3(-19.5, -0.9, -22.5), look: V3(-13, -1.7, -30) },
  { p: 0.33, pos: V3(-15.5, -0.3, -41), look: V3(-13, -0.6, -54) },
  { p: 0.375, pos: V3(-13, -0.5, -50), look: V3(-13, -0.5, -62) },
  { p: 0.545, pos: V3(-13, -0.5, -99), look: V3(-13, -0.3, -113) },
  { p: 0.607, pos: V3(-7.5, 4.2, -112.5), look: V3(2, 0.6, -126) },
  { p: 0.72, pos: V3(-1.8, 5.6, -117.8), look: V3(2, 0.3, -126) },
  { p: 0.775, pos: V3(9, 3.4, -133.5), look: V3(18, 2.6, -141) },
  { p: 0.805, pos: V3(17, 5.5, -129), look: PEN.clone() },
  { p: 0.845, pos: PEN_CAM.clone(), look: PEN.clone() },
  { p: 0.885, pos: PEN_CAM.clone(), look: PEN.clone() },
  { p: 0.922, pos: V3(30, 10, -121), look: PEN.clone() },
  { p: 1.0, pos: V3(24, 19, -141), look: V3(26, 27, -158) },
];

/* non-uniform Hermite sampling of keyframes (C1, honours the plateau) */
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
    // finite-difference tangents, zeroed across a plateau
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

/* ═══════════════════════════════════════════════════════════════════════
   FRAGMENT MATERIAL — porcelain with dichroic grazing edges
   ═══════════════════════════════════════════════════════════════════════ */
const shardUniforms = {
  uPigment: { value: PIGMENTS[0].clone() },
  uIrid: { value: 0.55 },
  uFogColor: { value: scene.fog.color },
  uFogDensity: { value: FOG0 },
  uTime: { value: 0 },
  uInkify: { value: 0 }, // act 4: the tri-bar prints itself in ink
  uGlow: { value: 0 },   // act 3: matter warms as it passes the throat
  uGlowPos: { value: new THREE.Vector3() },
};

const shardMaterial = new THREE.ShaderMaterial({
  uniforms: shardUniforms,
  vertexShader: /* glsl */ `
    attribute float aRand;
    attribute float aBar;
    attribute float aGild;
    attribute float aLus;
    varying vec3 vN; varying vec3 vWp; varying float vR; varying float vBar;
    varying float vGild; varying float vLus;
    void main() {
      vR = aRand;
      vBar = aBar;
      vGild = aGild;
      vLus = aLus;
      mat4 im = instanceMatrix;
      vec4 wp = modelMatrix * im * vec4(position, 1.0);
      vWp = wp.xyz;
      vN = normalize(mat3(modelMatrix) * mat3(im) * normal);
      gl_Position = projectionMatrix * viewMatrix * wp;
    }
  `,
  fragmentShader: /* glsl */ `
    varying vec3 vN; varying vec3 vWp; varying float vR; varying float vBar;
    varying float vGild; varying float vLus;
    uniform vec3 uPigment; uniform float uIrid;
    uniform vec3 uFogColor; uniform float uFogDensity; uniform float uTime;
    uniform float uInkify; uniform float uGlow; uniform vec3 uGlowPos;

    vec3 spectral(float t) {
      // iq cosine palette, biased toward the act pigment
      vec3 a = vec3(0.62), b = vec3(0.38);
      vec3 c = vec3(1.0), d = vec3(0.0, 0.33, 0.67);
      return a + b * cos(6.28318 * (c * t + d));
    }

    void main() {
      vec3 N = normalize(vN);
      if (!gl_FrontFacing) N = -N;
      vec3 V = normalize(cameraPosition - vWp);
      float ndv = max(dot(N, V), 0.0);
      float sky = N.y * 0.5 + 0.5;

      // glazed porcelain body: cool light from above, warm bounce below,
      // under-faces settle into real shadow
      vec3 warm = vec3(0.945, 0.888, 0.815);
      vec3 cool = vec3(0.9, 0.925, 0.962);
      vec3 base = mix(warm, cool, sky) * (0.6 + 0.4 * pow(sky, 1.3));
      base *= 0.95 + 0.09 * vR;

      // warm key, glaze sheen: one broad, one fired-tight
      vec3 L = normalize(vec3(0.42, 0.78, 0.35));
      vec3 H = normalize(L + V);
      float dif = max(dot(N, L), 0.0);
      float ndh = max(dot(N, H), 0.0);
      base += vec3(0.125, 0.112, 0.09) * dif;
      float sheen = pow(ndh, 7.0) * 0.09 + pow(ndh, 64.0) * 0.34;

      // thin porcelain edges pass light — rims lift toward paper white
      float rim = pow(1.0 - ndv, 4.0);
      base += vec3(0.28, 0.255, 0.21) * rim * 0.5;

      // dichroic film at grazing angles; lustre shards fire much harder
      float fres = pow(1.0 - ndv, 3.1);
      vec3 film = spectral(fres * 1.25 + vR * 0.4 + uTime * 0.012);
      film = mix(film, uPigment, 0.68);
      float lusBoost = 1.0 + vLus * 1.8;
      vec3 col = mix(base, film, clamp(fres * uIrid * lusBoost, 0.0, 0.85));
      col += vec3(sheen) * (1.0 + vLus * 1.7);

      // kintsugi: the gilded caste
      vec3 gold = vec3(0.57, 0.43, 0.205) * (0.5 + 0.5 * dif);
      gold += vec3(1.0, 0.83, 0.5) * (pow(ndh, 24.0) * 0.95 + pow(ndh, 6.0) * 0.22);
      gold += vec3(0.95, 0.8, 0.55) * fres * 0.55;
      col = mix(col, gold, vGild);

      // the swallow: matter warms as it approaches the throat
      float g = (1.0 - smoothstep(2.2, 5.6, distance(vWp, uGlowPos))) * uGlow;
      col += vec3(0.4, 0.24, 0.1) * g * 0.55;

      // alignment: the bars print in ink; the gold veins stay gold
      float ink = vBar * uInkify * (1.0 - vGild);
      vec3 inkCol = vec3(0.15, 0.14, 0.125) + film * 0.06;
      col = mix(col, inkCol, ink * 0.85);

      float depth = length(cameraPosition - vWp);
      float f = 1.0 - exp(-uFogDensity * uFogDensity * depth * depth);
      col = mix(col, uFogColor, f);
      gl_FragColor = vec4(col, 1.0);
    }
  `,
});

/* ═══════════════════════════════════════════════════════════════════════
   GEOMETRY: authored porcelain shards.
   Every silhouette is drawn by hand and extruded with a chamfered bevel —
   the bevel is what catches the light and makes an edge worth looking at.
   Facets stay flat (non-indexed normals): fired clay, not soap.
   ═══════════════════════════════════════════════════════════════════════ */
function shard(points, depth, bevel, tx, ty, tz) {
  const shape = new THREE.Shape();
  shape.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) shape.lineTo(points[i][0], points[i][1]);
  shape.closePath();
  let geo = new THREE.ExtrudeGeometry(shape, {
    depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel,
    bevelSegments: 1, steps: 1,
  });
  geo.center();
  geo.rotateX(Math.PI / 2); // thickness becomes Y
  // ExtrudeGeometry already ships non-indexed with flat per-face vertices,
  // so faceted normals fall straight out of computeVertexNormals() here.
  geo.computeVertexNormals();
  geo.computeBoundingBox();
  const b = geo.boundingBox, sz = new THREE.Vector3();
  b.getSize(sz);
  geo.scale(tx / sz.x, ty / sz.y, tz / sz.z);
  return geo;
}

const N = CFG.count;
const GROUPS = [
  // plates — the porcelain body
  { name: 'plateA', geo: shard([[0, 0], [1, 0.06], [0.94, 0.62], [0.08, 0.55]], 0.3, 0.07, 1, 0.2, 0.68), frac: 0.22 },
  { name: 'plateB', geo: shard([[0, 0.05], [1, 0], [0.9, 0.4], [0.12, 0.46]], 0.3, 0.06, 1, 0.18, 0.5), frac: 0.2 },
  // blades and barlets — structure members
  { name: 'blade', geo: shard([[0, 0.05], [0.45, 0], [1, 0.08], [0.97, 0.16], [0.5, 0.22], [0.05, 0.16]], 0.28, 0.05, 1, 0.13, 0.2), frac: 0.18 },
  { name: 'barlet', geo: shard([[0, 0], [1, 0.04], [0.96, 0.3], [0.05, 0.34]], 0.42, 0.08, 1, 0.3, 0.34), frac: 0.12 },
  // chips — the fine matter
  { name: 'chipA', geo: shard([[0, 0], [1, 0.12], [0.35, 0.9]], 0.3, 0.06, 0.4, 0.14, 0.4), frac: 0.15 },
  { name: 'chipB', geo: shard([[0.1, 0], [0.9, 0.05], [1, 0.55], [0.5, 1], [0, 0.5]], 0.28, 0.06, 0.32, 0.12, 0.3), frac: 0.13 },
];
let acc = 0;
for (const g of GROUPS) {
  g.count = Math.floor(N * g.frac);
  g.start = acc;
  acc += g.count;
}
GROUPS[GROUPS.length - 1].count += N - acc; // remainder

const meshes = [];
for (const g of GROUPS) {
  const mesh = new THREE.InstancedMesh(g.geo, shardMaterial, g.count);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = false;
  const rands = new Float32Array(g.count);
  for (let i = 0; i < g.count; i++) rands[i] = rnd();
  g.geo.setAttribute('aRand', new THREE.InstancedBufferAttribute(rands, 1));
  scene.add(mesh);
  meshes.push(mesh);
  g.mesh = mesh;
  g.rand = rands;
}

/* flat instance table: idx -> {group, local} */
const inst = [];
for (const g of GROUPS) {
  for (let i = 0; i < g.count; i++) inst.push({ g, i, r: g.rand[i] });
}

/* ═══════════════════════════════════════════════════════════════════════
   FORMATIONS — pos/quat/scale per instance, ×6
   F0 gathering · F1 vessel · F2 colonnade · F3 torus · F4 tri-bar · F5 dust
   ═══════════════════════════════════════════════════════════════════════ */
const NF = 6;
const fPos = [], fQuat = [], fScale = [];
for (let f = 0; f < NF; f++) {
  fPos.push(new Float32Array(N * 3));
  fQuat.push(new Float32Array(N * 4));
  fScale.push(new Float32Array(N * 3));
}
/* per-instance dynamic roles (bitmask: 1 = vessel-stream, 2 = torus-flow) */
const role = new Uint8Array(N);
const roleData = new Float32Array(N * 4); // vessel stream: debris xyz + phase
const torusUV = new Float32Array(N * 2);  // torus surface params
const liftDir = new Float32Array(N * 3);  // morph arc direction
const jitterAmp = new Float32Array(N);    // penrose gathering amplitude
const barFlag = new Float32Array(N);      // 1 = member of a tri-bar

const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _m = new THREE.Matrix4();
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3();

function put(f, idx, x, y, z, qx, qy, qz, qw, sx, sy, sz) {
  fPos[f][idx * 3] = x; fPos[f][idx * 3 + 1] = y; fPos[f][idx * 3 + 2] = z;
  fQuat[f][idx * 4] = qx; fQuat[f][idx * 4 + 1] = qy; fQuat[f][idx * 4 + 2] = qz; fQuat[f][idx * 4 + 3] = qw;
  fScale[f][idx * 3] = sx; fScale[f][idx * 3 + 1] = sy; fScale[f][idx * 3 + 2] = sz;
}
function putE(f, idx, x, y, z, rx, ry, rz, sx, sy, sz) {
  _q.setFromEuler(_e.set(rx, ry, rz));
  put(f, idx, x, y, z, _q.x, _q.y, _q.z, _q.w, sx, sy, sz);
}
/* scatter helper — porcelain dust in a shell around a centre */
function dust(f, idx, cx, cy, cz, rMin, rMax) {
  const th = rnd() * Math.PI * 2, ph = Math.acos(2 * rnd() - 1);
  const rad = rMin + (rMax - rMin) * Math.pow(rnd(), 0.7);
  const x = cx + rad * Math.sin(ph) * Math.cos(th);
  const y = cy + rad * Math.cos(ph) * 0.55;
  const z = cz + rad * Math.sin(ph) * Math.sin(th);
  const s = 0.1 + rnd() * 0.5;
  putE(f, idx, x, y, z, rnd() * 6.3, rnd() * 6.3, rnd() * 6.3, s, s, s);
}

/* F0 — THE GATHERING: halo around the letter field.
   The viewing cone from the alignment camera to the word stays clear so the
   composed word is never blocked; big matter is banished from near the axis. */
const AX_A = V3(0, 0.35, 14.5);
const AX_DIR = V3(0, 0.2, 0).sub(AX_A).normalize();
function buildF0() {
  const v = new THREE.Vector3();
  for (let i = 0; i < N; i++) {
    const th = rnd() * Math.PI * 2;
    const rad = 8.5 + Math.pow(rnd(), 0.8) * 14;
    let x = Math.cos(th) * rad;
    let z = Math.sin(th) * rad * 0.9 - 2;
    let y = (rnd() - 0.45) * 9;
    // clearance: distance from the align sightline
    v.set(x, y, z).sub(AX_A);
    const t = v.dot(AX_DIR);
    let radial = Infinity;
    if (t > -3 && t < 30) {
      _a.copy(AX_DIR).multiplyScalar(t);
      v.sub(_a);
      radial = v.length();
      if (radial < 6.5) {
        v.normalize().multiplyScalar(6.5 - radial + 1.2);
        x += v.x; y += v.y; z += v.z;
        radial = 6.5;
      }
    }
    const bigAllowed = radial > 11;
    const s = 0.3 + rnd() * (bigAllowed && rnd() < 0.05 ? 2.2 : 0.85);
    putE(0, i, x, y, z, rnd() * 6.3, rnd() * 6.3, rnd() * 6.3, s, s * (0.6 + rnd() * 0.8), s);
  }
  // keystones: seven monoliths, each placed by hand. They are what makes
  // the field look arranged by someone rather than emitted by something.
  const KEYSTONES = [
    { p: [-11.5, 2.4, 6.5], r: [0.12, 0.5, 0.08], s: [4.6, 1.3, 3.0] },
    { p: [10.5, -3.0, 2.0], r: [-0.08, -0.35, 0.15], s: [3.8, 1.05, 2.7] },
    { p: [-13.5, -5.0, -6.0], r: [0.05, 0.9, -0.1], s: [5.4, 1.5, 3.3] },
    { p: [13.0, 4.4, -9.0], r: [0.2, -0.7, 0.05], s: [5.0, 1.25, 3.1] },
    { p: [0.5, 8.2, -15.0], r: [0.4, 0.1, 0.35], s: [6.2, 1.6, 3.5] },
    { p: [-8.2, -1.4, 15.5], r: [0.03, 0.25, 0.55], s: [2.7, 0.85, 1.9] },
    { p: [16.0, 0.6, -17.0], r: [0.0, -0.5, 0.2], s: [5.2, 1.4, 3.1] },
  ];
  let k = 0;
  for (let i = GROUPS[0].start; i < GROUPS[0].start + GROUPS[0].count && k < KEYSTONES.length; i++) {
    if (inst[i].r < 0.05 || inst[i].r > 0.86) continue; // keystones stay porcelain
    const ks = KEYSTONES[k++];
    putE(0, i, ks.p[0], ks.p[1], ks.p[2], ks.r[0], ks.r[1], ks.r[2], ks.s[0], ks.s[1], ks.s[2]);
  }
}

/* F1 — VESSEL: amphora surface + upward debris stream */
function vesselProfile(t) {
  let r = 0.52 + 2.0 * Math.exp(-Math.pow((t - 0.4) / 0.22, 2));
  r += 0.44 * Math.exp(-Math.pow((t - 1.0) / 0.055, 2));  // lip
  r += 0.24 * Math.exp(-Math.pow((t - 0.0) / 0.05, 2));   // foot
  r -= 0.62 * Math.exp(-Math.pow((t - 0.8) / 0.085, 2));  // neck pinch
  return Math.max(r, 0.3);
}
function buildF1() {
  const H = 8, Y0 = -5.5;
  for (let i = 0; i < N; i++) {
    const it = inst[i];
    if (i % 100 >= 78) { dust(1, i, VESSEL.x, VESSEL.y + 1, VESSEL.z, 10, 26); continue; }
    const t = rnd(), th = rnd() * Math.PI * 2;
    const r = vesselProfile(t);
    const crack = rnd() < 0.09 ? 0.5 + rnd() * 1.1 : 0;
    const rr = r + crack + 0.06;
    const x = VESSEL.x + Math.cos(th) * rr;
    const y = VESSEL.y + Y0 + t * H;
    const z = VESSEL.z + Math.sin(th) * rr;
    // outward slope normal from profile derivative
    const slope = (vesselProfile(Math.min(t + 0.02, 1)) - vesselProfile(Math.max(t - 0.02, 0))) / 0.04 / H;
    _b.set(Math.cos(th), -slope * 2.2, Math.sin(th)).normalize();       // normal-ish
    _a.set(-Math.sin(th), 0, Math.cos(th));                              // horizontal tangent
    _c.crossVectors(_b, _a).normalize();
    _m.makeBasis(_a, _b, _c);
    _q.setFromRotationMatrix(_m);
    const sw = 0.5 + rnd() * 0.65;
    put(1, i, x, y, z, _q.x, _q.y, _q.z, _q.w, sw, 0.34 + rnd() * 0.26, 0.56 + rnd() * 0.45);
    // a share of the surface pours: loops up from the debris field below
    if (it.r < 0.30) {
      role[i] |= 1;
      const dr = 1.5 + rnd() * 4.5, dth = rnd() * Math.PI * 2;
      roleData[i * 4] = VESSEL.x + Math.cos(dth) * dr;
      roleData[i * 4 + 1] = VESSEL.y + Y0 - 1.6 - rnd() * 2.6;
      roleData[i * 4 + 2] = VESSEL.z + Math.sin(dth) * dr;
      roleData[i * 4 + 3] = rnd();
    }
  }
}

/* F2 — COLONNADE: portal frames along the corridor + the rose ring beyond */
function buildF2() {
  const slots = [];
  const P = CFG.portals;
  for (let k = 0; k < P; k++) {
    const z = CORR_Z0 + k * CORR_DZ;
    const rot = (k % 2 ? 1 : -1) * k * 0.015;
    const w = 3.3 - k * 0.05, h = 2.7 - k * 0.03;
    for (const sx of [-1, 1]) {                                  // jambs — vertical rods
      for (let j = 0; j < 4; j++) {
        slots.push({
          x: CORR_X + sx * (w + 0.45), y: CORR_Y - h + (j + 0.5) * (2 * h / 4), z,
          rx: 0, ry: rot, rz: Math.PI / 2, sx: 1.6 + rnd() * 0.7, big: 1,
        });
      }
    }
    for (let j = 0; j < 6; j++) {                                // lintel
      slots.push({
        x: CORR_X - w - 0.45 + (j + 0.5) * (2 * (w + 0.45) / 6), y: CORR_Y + h + 0.55, z,
        rx: 0, ry: rot, rz: 0, sx: 1.3 + rnd() * 0.5, big: 1,
      });
    }
    for (let j = 0; j < 4; j++) {                                // sill
      slots.push({
        x: CORR_X - w + (j + 0.5) * (2 * w / 4), y: CORR_Y - h - 0.5, z,
        rx: 0, ry: rot, rz: 0, sx: 1.2 + rnd() * 0.4, big: 1,
      });
    }
  }
  const RN = 68;                                                  // the rose ring
  for (let j = 0; j < RN; j++) {
    const a = (j / RN) * Math.PI * 2;
    slots.push({
      x: RING.x + Math.cos(a) * 9, y: RING.y + Math.sin(a) * 9, z: RING.z,
      rx: 0, ry: 0, rz: a + Math.PI / 2, sx: 1.5 + rnd() * 0.6, big: 1,
    });
  }
  // the inner circle is reserved for the gilded caste — a gold ring set
  // inside the rose window, the corridor's one jewel
  const RN2 = 40;
  const goldRing = [];
  for (let j = 0; j < RN2; j++) {
    const a = (j / RN2) * Math.PI * 2;
    goldRing.push({
      x: RING.x + Math.cos(a) * 6.4, y: RING.y + Math.sin(a) * 6.4, z: RING.z - 1.5,
      rx: 0, ry: 0, rz: a, sx: 1.0 + rnd() * 0.3, big: 1,
    });
  }
  let s = 0, gr = 0;
  for (let i = 0; i < N; i++) {
    if (inst[i].r < 0.045 && gr < goldRing.length) {
      const sl = goldRing[gr++];
      putE(2, i, sl.x, sl.y, sl.z, sl.rx, sl.ry, sl.rz, sl.sx, 0.85, 0.85);
      continue;
    }
    if (s < slots.length && i % 10 < 8) {
      const sl = slots[s++];
      putE(2, i, sl.x, sl.y, sl.z, sl.rx, sl.ry, sl.rz, sl.sx, 0.9 + rnd() * 0.5, 0.9 + rnd() * 0.5);
    } else {
      // corridor dust — drifting flakes low along the walls
      const z = CORR_Z0 + rnd() * (CFG.portals * CORR_DZ + 10);
      const side = rnd() < 0.5 ? -1 : 1;
      dust(2, i, CORR_X + side * (5 + rnd() * 5), CORR_Y + (rnd() - 0.3) * 6, z, 0.4, 3.5);
    }
  }
}

/* F3 — TORUS: the self-swallowing surface (u,v stored; flow applied live) */
function buildF3() {
  for (let i = 0; i < N; i++) {
    if (i % 10 < 7) {
      role[i] |= 2;
      torusUV[i * 2] = rnd() * Math.PI * 2;
      torusUV[i * 2 + 1] = rnd() * Math.PI * 2;
      // static placeholder (overwritten live); scales are what count here
      put(3, i, TORUS.x, TORUS.y, TORUS.z, 0, 0, 0, 1,
        0.42 + rnd() * 0.3, 0.3 + rnd() * 0.14, 0.36 + rnd() * 0.22);
    } else {
      dust(3, i, TORUS.x, TORUS.y, TORUS.z, 9, 24);
    }
  }
}
const TOR_R = 4.4, TOR_r = 1.75;
/* tilt the whole surface so its throat faces the approaching camera */
const TOR_TILT = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.95, -0.45, 0));
function torusPose(i, flow, outPos, outQuat) {
  const u = torusUV[i * 2], v = torusUV[i * 2 + 1] + flow;
  const cu = Math.cos(u), su = Math.sin(u), cv = Math.cos(v), sv = Math.sin(v);
  outPos.set(cu * (TOR_R + TOR_r * cv), TOR_r * sv, su * (TOR_R + TOR_r * cv))
    .applyQuaternion(TOR_TILT).add(TORUS);
  _a.set(-su, 0, cu);                       // tangent u
  _b.set(cu * cv, sv, su * cv);             // normal
  _c.crossVectors(_a, _b).normalize();
  _m.makeBasis(_a, _b, _c);
  outQuat.setFromRotationMatrix(_m).premultiply(TOR_TILT);
}

/* F4 — THE TRI-BAR: three perpendicular bars; the gap closes only on-axis */
function buildF4() {
  const bars = [
    { o: V3(0, 0, 0), a: V3(1, 0, 0) },
    { o: V3(PEN_L, 0, 0), a: V3(0, 1, 0) },
    { o: V3(PEN_L, PEN_L, 0), a: V3(0, 0, 1) },
  ];
  const centroid = V3(5 * PEN_L / 6, PEN_L / 2, PEN_L / 6);
  const origin = PEN.clone().sub(centroid);
  const W = 0.5; // half cross-section
  let bi = 0;
  for (let i = 0; i < N; i++) {
    if (i % 10 < 7) {
      const bar = bars[bi % 3]; bi++;
      const t = 0.045 + rnd() * 0.91;
      const endTaper = t > 0.86 || t < 0.14 ? 0.55 : 1; // flush ends, no antennae
      const off1 = (rnd() - 0.5) * 1.15 * W, off2 = (rnd() - 0.5) * 1.15 * W;
      _a.copy(bar.a);
      _b.set(_a.y, _a.z, _a.x); // any perpendicular for box cross-section
      _c.crossVectors(_a, _b);
      const p = origin.clone().add(bar.o)
        .addScaledVector(_a, t * PEN_L)
        .addScaledVector(_b, off1)
        .addScaledVector(_c, off2);
      _m.makeBasis(_a, _b, _c);
      _q.setFromRotationMatrix(_m);
      put(4, i, p.x, p.y, p.z, _q.x, _q.y, _q.z, _q.w,
        (0.8 + rnd() * 0.7) * endTaper, 0.36 + rnd() * 0.22, 0.36 + rnd() * 0.22);
      jitterAmp[i] = 1.2 + rnd() * 3.2;
      barFlag[i] = 1;
    } else {
      dust(4, i, PEN.x, PEN.y, PEN.z, 12, 30);
      jitterAmp[i] = 0;
    }
  }
}

/* F5 — DUST: the show exhales */
function buildF5() {
  for (let i = 0; i < N; i++) {
    dust(5, i, 25, 16, -150, 6, 40);
    fScale[5][i * 3] *= 0.5; fScale[5][i * 3 + 1] *= 0.5; fScale[5][i * 3 + 2] *= 0.5;
  }
}

/* morph arc directions */
function buildLifts() {
  for (let i = 0; i < N; i++) {
    _a.set(rnd() - 0.5, 0.4 + rnd() * 0.8, rnd() - 0.5).normalize();
    liftDir[i * 3] = _a.x; liftDir[i * 3 + 1] = _a.y; liftDir[i * 3 + 2] = _a.z;
  }
}

buildF0(); buildF1(); buildF2(); buildF3(); buildF4(); buildF5(); buildLifts();
/* material castes: most matter is glazed porcelain; ~14% carries lustre;
   ~5% is kintsugi gold — the same gold travels the whole walk (it pours the
   vessel, rings the rose window, veins the tri-bar) */
const isGild = (i) => inst[i].r < 0.045;
const isLus = (i) => inst[i].r > 0.86;
for (const g of GROUPS) {
  const bar = new Float32Array(g.count);
  const gild = new Float32Array(g.count);
  const lus = new Float32Array(g.count);
  for (let li = 0; li < g.count; li++) {
    const i = g.start + li;
    bar[li] = barFlag[i];
    gild[li] = isGild(i) ? 1 : 0;
    lus[li] = isLus(i) ? 1 : 0;
  }
  g.geo.setAttribute('aBar', new THREE.InstancedBufferAttribute(bar, 1));
  g.geo.setAttribute('aGild', new THREE.InstancedBufferAttribute(gild, 1));
  g.geo.setAttribute('aLus', new THREE.InstancedBufferAttribute(lus, 1));
}

/* ═══════════════════════════════════════════════════════════════════════
   ATMOSPHERE: a gradient dome that follows the camera — the room has
   weather now: paper light above, warm shadow below, the act's pigment
   breathing at the horizon.
   ═══════════════════════════════════════════════════════════════════════ */
const domeUniforms = {
  uBase: { value: PORCELAIN.clone() },
  uPig: { value: PIGMENTS[0].clone() },
  uFlat: { value: 0 },
};
const dome = new THREE.Mesh(
  new THREE.SphereGeometry(150, 32, 24),
  new THREE.ShaderMaterial({
    uniforms: domeUniforms,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vDir;
      uniform vec3 uBase; uniform vec3 uPig; uniform float uFlat;
      void main() {
        float t = smoothstep(-0.42, 0.6, vDir.y);
        vec3 top = uBase * 1.06 + vec3(-0.004, 0.001, 0.009);
        vec3 bot = uBase * 0.952 + vec3(0.012, 0.005, -0.005);
        vec3 col = mix(bot, top, t);
        col = mix(col, mix(uPig, uBase, 0.65), 0.06 * max(0.0, 1.0 - abs(vDir.y) * 1.6));
        col = mix(col, uBase, uFlat);
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  })
);
dome.renderOrder = -1;
dome.frustumCulled = false;
scene.add(dome);

/* ═══════════════════════════════════════════════════════════════════════
   ACT SEGMENTS
   ═══════════════════════════════════════════════════════════════════════ */
const SEGS = [
  { p0: 0.0, p1: 0.1, f0: 0, f1: 0 },
  { p0: 0.1, p1: 0.17, f0: 0, f1: 1 },
  { p0: 0.17, p1: 0.285, f0: 1, f1: 1 },
  { p0: 0.285, p1: 0.36, f0: 1, f1: 2 },
  { p0: 0.36, p1: 0.55, f0: 2, f1: 2 },
  { p0: 0.55, p1: 0.61, f0: 2, f1: 3 },
  { p0: 0.61, p1: 0.73, f0: 3, f1: 3 },
  { p0: 0.73, p1: 0.8, f0: 3, f1: 4 },
  { p0: 0.8, p1: 0.945, f0: 4, f1: 4 },
  { p0: 0.945, p1: 1.001, f0: 4, f1: 5 },
];

/* ═══════════════════════════════════════════════════════════════════════
   SPATIAL TYPOGRAPHY — anamorphic letters + catalogue numerals
   ═══════════════════════════════════════════════════════════════════════ */
const WORD = 'PARALLAX';
const LETTER_DEPTHS = [10, 16, 8.5, 20, 12, 18, 9.5, 14];
const letterGroup = new THREE.Group();
scene.add(letterGroup);
const letterPlanes = [];

function glyphTexture(text, px, font) {
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d');
  ctx.font = `${px}px ${font}`;
  const m = ctx.measureText(text);
  const w = Math.ceil(m.width) + 40;
  const h = Math.ceil(px * 1.32) + 40;
  c.width = w; c.height = h;
  const ctx2 = c.getContext('2d');
  ctx2.font = `${px}px ${font}`;
  ctx2.fillStyle = INK;
  ctx2.textBaseline = 'middle';
  ctx2.fillText(text, 20, h / 2 + px * 0.03);
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  tex.colorSpace = THREE.SRGBColorSpace;
  return { tex, aspect: w / h };
}

const FONT_DISPLAY = '"Archivo Black", "Archivo", sans-serif';

function buildLetters() {
  for (const ch of WORD) {
    const { tex, aspect } = glyphTexture(ch, 300, FONT_DISPLAY);
    // fog:false — the word is printed on the visitor's eye, not on the room
    const mat = new THREE.MeshBasicMaterial({
      map: tex, transparent: true, alphaTest: 0.28, side: THREE.DoubleSide, fog: false,
    });
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), plainInkFix(mat));
    letterGroup.add(plane);
    letterPlanes.push(plane);
  }
  layoutLetters();
}
function plainInkFix(mat) { return mat; }

/* place letters so they compose the word exactly from the p=0.075 camera */
const alignCam = new THREE.PerspectiveCamera(CFG.fov, 1, 0.1, 240);
function layoutLetters() {
  alignCam.fov = CFG.fov;
  alignCam.aspect = innerWidth / innerHeight;
  alignCam.position.copy(CAM_KEYS[1].pos);
  alignCam.lookAt(CAM_KEYS[1].look);
  alignCam.updateMatrixWorld();
  alignCam.updateProjectionMatrix();

  // word layout from glyph aspects
  const aspects = letterPlanes.map((p) => p.material.map.image.width / p.material.map.image.height);
  const track = 0.06;
  const total = aspects.reduce((s, a) => s + a, 0) + track * (aspects.length - 1);
  const SPAN = 1.66;                          // NDC width of the whole word
  const NDC_H = MOBILE ? 0.30 : 0.42;         // NDC height of a letter box
  let cursor = -total / 2;
  for (let i = 0; i < letterPlanes.length; i++) {
    const a = aspects[i];
    const cx = cursor + a / 2;
    cursor += a + track;
    const nx = (cx / total) * SPAN;
    const ny = 0.02;
    const d = LETTER_DEPTHS[i];
    _a.set(nx, ny, 0.5).unproject(alignCam).sub(alignCam.position).normalize();
    const pos = alignCam.position.clone().addScaledVector(_a, d);
    const h = NDC_H * d * Math.tan(THREE.MathUtils.degToRad(alignCam.fov / 2)) * (a > 1.15 ? 0.94 : 1);
    const plane = letterPlanes[i];
    plane.position.copy(pos);
    plane.scale.set(h * a, h, 1);
    plane.quaternion.copy(alignCam.quaternion); // face the alignment viewpoint
    plane.userData.baseQuat = plane.quaternion.clone();
    plane.userData.phase = i * 1.7;
  }
}

/* catalogue numerals standing in the world */
const numeralPlanes = [];
const NUMERAL_WINDOWS = [[0.09, 0.36], [0.29, 0.6], [0.5, 0.79]];
function buildNumerals() {
  const defs = [
    { text: '01', pos: V3(-20.5, 0.8, -35), toward: V3(-9, -0.5, -20), h: 5.5 },
    { text: '02', pos: V3(-13, 0.9, -111.5), toward: V3(-13, -0.5, -60), h: 5 },
    { text: '03', pos: V3(6.5, 1.2, -132.5), toward: V3(-4, 1.5, -118), h: 5.5 },
  ];
  for (const d of defs) {
    const { tex, aspect } = glyphTexture(d.text, 300, FONT_DISPLAY);
    const mat = new THREE.MeshBasicMaterial({
      map: tex, transparent: true, alphaTest: 0.28, side: THREE.DoubleSide, fog: true,
    });
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
    plane.position.copy(d.pos);
    plane.scale.set(d.h * aspect, d.h, 1);
    plane.lookAt(d.toward);
    scene.add(plane);
    numeralPlanes.push(plane);
  }
}

/* ═══════════════════════════════════════════════════════════════════════
   SCROLL · SWAY · STATE
   ═══════════════════════════════════════════════════════════════════════ */
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
const track = $('#track');
track.style.height = CFG.trackVh + 'vh';

let targetP = 0, smoothP = 0;
function readScroll() {
  const trackPx = track.offsetHeight;
  const span = Math.max(trackPx - innerHeight * 1.55, 1);
  targetP = THREE.MathUtils.clamp(scrollY / span, 0, 1);
}
addEventListener('scroll', readScroll, { passive: true });

/* sway — the visitor bends the sightline */
let swayTX = 0, swayTY = 0, swayX = 0, swayY = 0;
if (!COARSE) {
  addEventListener('pointermove', (e) => {
    swayTX = (e.clientX / innerWidth - 0.5) * 2;
    swayTY = (e.clientY / innerHeight - 0.5) * 2;
  }, { passive: true });
} else {
  document.body.style.touchAction = 'pan-y';
  let lastX = null;
  addEventListener('pointerdown', (e) => { lastX = e.clientX; }, { passive: true });
  addEventListener('pointermove', (e) => {
    if (lastX == null) return;
    swayTX = THREE.MathUtils.clamp(swayTX + (e.clientX - lastX) / innerWidth * 3.2, -1.15, 1.15);
    lastX = e.clientX;
  }, { passive: true });
  addEventListener('pointerup', () => { lastX = null; }, { passive: true });
  addEventListener('pointercancel', () => { lastX = null; }, { passive: true });
}

/* ═══════════════════════════════════════════════════════════════════════
   DOM WIRING — gate, labels, hud
   ═══════════════════════════════════════════════════════════════════════ */
const gate = $('#gate'), enterBtn = $('#enter'), cue = $('#cue');
const labels = [...document.querySelectorAll('.label')];
const hudPct = $('#hud-pct'), hudExhNo = $('#hud-exh-no');
const alignLock = $('#align-lock');
let entered = false, everScrolled = false;

const LABEL_WINDOWS = [
  [0.012, 0.115], [0.185, 0.298], [0.385, 0.53],
  [0.615, 0.728], [0.798, 0.888], [0.908, 0.972],
];

function enter(skipWalk) {
  if (entered) return;
  entered = true;
  doc.classList.add('entered');
  gate.classList.add('leave');
  setTimeout(() => { gate.style.display = 'none'; }, 900);
  if (skipWalk) {
    $('#catalogue').scrollIntoView();
  } else {
    scrollTo(0, 0);
    cue.classList.add('show');
  }
}
enterBtn.addEventListener('click', () => enter(false));
$('#gate-skip').addEventListener('click', (e) => { e.preventDefault(); enter(true); });
$('#rewalk').addEventListener('click', (e) => { e.preventDefault(); scrollTo(0, 0); });

/* notify form — local courtesy only */
const notify = $('#notify');
notify.addEventListener('submit', (e) => {
  e.preventDefault();
  notify.classList.add('held');
  notify.querySelector('.n-done').textContent = 'Held. Word will come when the doors are physical.';
});

/* ═══════════════════════════════════════════════════════════════════════
   PER-FRAME COMPOSITION
   ═══════════════════════════════════════════════════════════════════════ */
const camPose = { pos: new THREE.Vector3(), look: new THREE.Vector3() };
const _p1 = new THREE.Vector3(), _q1 = new THREE.Quaternion();
const _p2 = new THREE.Vector3(), _q2 = new THREE.Quaternion();
const _s1 = new THREE.Vector3(), _s2 = new THREE.Vector3();
const _right = new THREE.Vector3(), _upv = new THREE.Vector3(), _fwd = new THREE.Vector3();

const IDLE_AMP = [0.26, 0.05, 0.035, 0, 0, 0.4]; // per formation
const clock = new THREE.Clock();
let time = 0;
let frameAcc = 0, frameCount = 0, degraded = false;

function readFormation(f, i, t, outP, outQ, outS) {
  // dynamic overrides
  if (f === 1 && (role[i] & 1)) {
    // pouring loop: debris → surface slot, dwell, fade, repeat
    const slotX = fPos[1][i * 3], slotY = fPos[1][i * 3 + 1], slotZ = fPos[1][i * 3 + 2];
    const phase = roleData[i * 4 + 3];
    const cyc = REDUCED ? 0.999 : ((t * 0.09 + phase) % 1);
    const up = THREE.MathUtils.clamp(cyc / 0.62, 0, 1);
    const k = up * up * (3 - 2 * up);
    const dx = roleData[i * 4], dy = roleData[i * 4 + 1], dz = roleData[i * 4 + 2];
    // arc via mid-point pushed outward
    const mx = (dx + slotX) / 2 + (dx - VESSEL.x) * 0.45;
    const my = (dy + slotY) / 2 + 1.2;
    const mz = (dz + slotZ) / 2 + (dz - VESSEL.z) * 0.45;
    const u = 1 - k;
    outP.set(
      u * u * dx + 2 * u * k * mx + k * k * slotX,
      u * u * dy + 2 * u * k * my + k * k * slotY,
      u * u * dz + 2 * u * k * mz + k * k * slotZ
    );
    outQ.set(fQuat[1][i * 4], fQuat[1][i * 4 + 1], fQuat[1][i * 4 + 2], fQuat[1][i * 4 + 3]);
    // grow in from dust, settle at full size, exhale before the loop restarts
    const out = cyc > 0.9 ? 1 - (cyc - 0.9) / 0.1 : 1;
    let grow = (0.25 + 0.75 * k) * Math.max(out, 0.12);
    if (role[i] & 1 && inst[i].r < 0.045) grow *= 0.62; // gold pours fine, not chunky
    outS.set(fScale[1][i * 3] * grow, fScale[1][i * 3 + 1] * grow, fScale[1][i * 3 + 2] * grow);
    return;
  }
  if (f === 3 && (role[i] & 2)) {
    const flow = REDUCED ? time * 0.06 : time * 0.30;
    torusPose(i, flow, outP, outQ);
    outS.set(fScale[3][i * 3], fScale[3][i * 3 + 1], fScale[3][i * 3 + 2]);
    return;
  }
  outP.set(fPos[f][i * 3], fPos[f][i * 3 + 1], fPos[f][i * 3 + 2]);
  outQ.set(fQuat[f][i * 4], fQuat[f][i * 4 + 1], fQuat[f][i * 4 + 2], fQuat[f][i * 4 + 3]);
  outS.set(fScale[f][i * 3], fScale[f][i * 3 + 1], fScale[f][i * 3 + 2]);
  if (f === 4 && jitterAmp[i] > 0) {
    // the gathering: swarm compacts into the bars as alignment approaches
    const j = jitterAmp[i] * (1 - alignK);
    outP.x += Math.sin(i * 12.9898 + time * 0.7) * j;
    outP.y += Math.sin(i * 78.233 + time * 0.55 + 2) * j * 0.8;
    outP.z += Math.cos(i * 37.719 + time * 0.62) * j;
  }
  // idle breath — big matter is heavy and barely stirs, fine matter drifts
  const amp = REDUCED ? 0 : IDLE_AMP[f] * THREE.MathUtils.clamp(0.8 / Math.max(outS.x, 0.4), 0.16, 1.5);
  if (amp > 0) {
    const ph = i * 0.618;
    outP.x += Math.sin(time * 0.4 + ph) * amp;
    outP.y += Math.sin(time * 0.31 + ph * 2.1) * amp * 0.8;
    outP.z += Math.cos(time * 0.36 + ph * 1.3) * amp;
  }
}

let alignK = 0;   // tri-bar gathering 0..1
let alignQ = 0;   // alignment quality incl. user sway (drives the lockup)

function composeFrame(p, dt) {
  time += dt;
  // segment lookup
  let seg = SEGS[0];
  for (const s of SEGS) if (p >= s.p0 && p < s.p1) { seg = s; break; }
  if (p >= 1) seg = SEGS[SEGS.length - 1];
  const segT = THREE.MathUtils.clamp((p - seg.p0) / (seg.p1 - seg.p0), 0, 1);

  // alignment factor for the tri-bar
  alignK = THREE.MathUtils.smoothstep(p, 0.802, 0.845) * (1 - THREE.MathUtils.smoothstep(p, 0.945, 0.995));

  // pigment drift
  const pigA = PIGMENTS[seg.f0], pigB = PIGMENTS[seg.f1];
  shardUniforms.uPigment.value.copy(pigA).lerp(pigB, segT);
  shardUniforms.uIrid.value = THREE.MathUtils.lerp(IRID_ACT[seg.f0], IRID_ACT[seg.f1], segT);
  shardUniforms.uTime.value = time;

  // the throat glow lives only while the torus is the work on view
  shardUniforms.uGlow.value = THREE.MathUtils.smoothstep(p, 0.56, 0.62) *
    (1 - THREE.MathUtils.smoothstep(p, 0.72, 0.78));
  shardUniforms.uGlowPos.value.copy(TORUS);

  // fragments
  for (const g of GROUPS) {
    const arr = g.mesh.instanceMatrix.array;
    for (let li = 0; li < g.count; li++) {
      const i = g.start + li;
      const it = inst[i];
      if (seg.f0 === seg.f1) {
        readFormation(seg.f0, i, time, _p1, _q1, _s1);
      } else {
        const local = THREE.MathUtils.clamp((segT - it.r * 0.3) / 0.7, 0, 1);
        const k = local * local * (3 - 2 * local);
        readFormation(seg.f0, i, time, _p1, _q1, _s1);
        readFormation(seg.f1, i, time, _p2, _q2, _s2);
        _p1.lerp(_p2, k);
        const lift = Math.sin(Math.PI * k) * (1.2 + it.r * 3.4);
        _p1.x += liftDir[i * 3] * lift;
        _p1.y += liftDir[i * 3 + 1] * lift;
        _p1.z += liftDir[i * 3 + 2] * lift;
        _q1.slerp(_q2, k);
        _s1.lerp(_s2, k);
      }
      _m.compose(_p1, _q1, _s1);
      arr.set(_m.elements, li * 16);
    }
    g.mesh.instanceMatrix.needsUpdate = true;
  }

  // camera
  sampleKeys(CAM_KEYS, p, camPose);
  camera.position.copy(camPose.pos);
  camera.up.set(0, 1, 0);
  camera.lookAt(camPose.look);
  // sway: shift eye, hold the look — parallax itself
  const swayAmp = 0.55 + 1.8 * alignK + 0.5 * THREE.MathUtils.smoothstep(1 - Math.abs(p - 0.075) / 0.075, 0, 1);
  swayX += ((swayTX * swayAmp) - swayX) * (REDUCED ? 0.03 : 0.055);
  swayY += ((-swayTY * swayAmp * 0.55) - swayY) * (REDUCED ? 0.03 : 0.055);
  _fwd.subVectors(camPose.look, camPose.pos).normalize();
  _right.crossVectors(_fwd, camera.up).normalize();
  _upv.crossVectors(_right, _fwd).normalize();
  camera.position.addScaledVector(_right, swayX).addScaledVector(_upv, swayY);
  camera.lookAt(camPose.look);
  // corridor roll for the colonnade
  if (p > 0.37 && p < 0.57 && !REDUCED) {
    camera.rotateZ(Math.sin((p - 0.37) / 0.2 * Math.PI * 2) * 0.05);
  }
  if (!REDUCED) {
    camera.position.y += Math.sin(time * 0.5) * 0.05; // breath
  }
  if (COARSE && Math.abs(swayTX) > 0.002) swayTX *= 0.985; // touch sway eases home

  // letters: crisp at the aligned viewpoint, drifting elsewhere
  const q0 = THREE.MathUtils.clamp(1 - Math.abs(p - 0.075) / 0.06, 0, 1);
  for (let i = 0; i < letterPlanes.length; i++) {
    const pl = letterPlanes[i];
    const drift = (1 - q0 * q0) * (REDUCED ? 0.02 : 1);
    pl.quaternion.copy(pl.userData.baseQuat);
    if (drift > 0.001) {
      _q.setFromEuler(_e.set(
        Math.sin(time * 0.16 + pl.userData.phase) * 0.09 * drift,
        Math.sin(time * 0.13 + pl.userData.phase * 2) * 0.14 * drift,
        Math.sin(time * 0.1 + pl.userData.phase * 3) * 0.06 * drift
      ));
      pl.quaternion.multiply(_q);
    }
  }

  // long lens into the alignment: the dolly-zoom is the act-4 signature
  const fovK = THREE.MathUtils.smoothstep(p, 0.805, 0.845) *
    (1 - THREE.MathUtils.smoothstep(p, 0.885, 0.94));
  const fov = CFG.fov + (16 - CFG.fov) * fovK;
  if (Math.abs(fov - camera.fov) > 0.01) {
    camera.fov = fov;
    camera.updateProjectionMatrix();
  }

  // the tri-bar prints itself in ink through the alignment and the reveal
  shardUniforms.uInkify.value = THREE.MathUtils.smoothstep(p, 0.815, 0.85) *
    (1 - THREE.MathUtils.smoothstep(p, 0.955, 0.995));

  // numerals exist only while their room is on view
  for (let i = 0; i < numeralPlanes.length; i++) {
    const w = NUMERAL_WINDOWS[i];
    numeralPlanes[i].visible = p >= w[0] && p <= w[1];
  }

  // fog leans with the act, thins for the climax, and lifts to white at the end
  const clearBell = Math.exp(-Math.pow((p - 0.87) / 0.11, 2));
  const fogT = Math.max(0.024 + 0.006 * Math.sin(p * Math.PI) - 0.019 * clearBell, 0.005);
  const fade = THREE.MathUtils.smoothstep(p, 0.94, 1);
  shardUniforms.uFogDensity.value = fogT + fade * 0.09;
  scene.fog.density = shardUniforms.uFogDensity.value;
  scene.fog.color.copy(PORCELAIN).lerp(shardUniforms.uPigment.value, 0.05);
  renderer.setClearColor(scene.fog.color);

  // the dome rides with the camera and grades the room per act
  dome.position.copy(camera.position);
  domeUniforms.uBase.value.copy(scene.fog.color);
  domeUniforms.uPig.value.copy(shardUniforms.uPigment.value);
  domeUniforms.uFlat.value = fade;

  // alignment quality — the visitor can break it by moving
  const swayBreak = THREE.MathUtils.clamp(1 - (Math.abs(swayX) * 1.5 + Math.abs(swayY) * 1.2), 0, 1);
  alignQ = alignK * swayBreak * THREE.MathUtils.smoothstep(p, 0.825, 0.85) * (1 - THREE.MathUtils.smoothstep(p, 0.885, 0.92));
  alignLock.style.opacity = alignQ.toFixed(3);
  alignLock.classList.toggle('on', alignQ > 0.5);
}

/* DOM state per frame (cheap) */
let lastPct = -1, lastAct = -1;
function composeDom(p) {
  const pct = Math.round(p * 100);
  if (pct !== lastPct) {
    lastPct = pct;
    hudPct.textContent = String(pct).padStart(3, '0');
  }
  const act = p < 0.155 ? 0 : p < 0.335 ? 1 : p < 0.58 ? 2 : p < 0.765 ? 3 : 4;
  if (act !== lastAct) {
    lastAct = act;
    hudExhNo.textContent = '0' + act;
  }
  for (let i = 0; i < labels.length; i++) {
    const w = LABEL_WINDOWS[i];
    labels[i].classList.toggle('on', entered && p >= w[0] && p <= w[1]);
  }
  if (entered && !everScrolled && p > 0.012) {
    everScrolled = true;
    cue.classList.remove('show');
  }
  renderer.domElement.classList.toggle('dimmed', p > 0.985);
  doc.classList.toggle('in-catalogue', targetP > 0.9995);
}

/* ═══════════════════════════════════════════════════════════════════════
   LOOP
   ═══════════════════════════════════════════════════════════════════════ */
function frame() {
  const dt = Math.min(clock.getDelta(), 0.05);
  smoothP += (targetP - smoothP) * CFG.scrollK;
  if (Math.abs(targetP - smoothP) < 0.00005) smoothP = targetP;
  composeFrame(smoothP, dt);
  composeDom(smoothP);
  renderer.render(scene, camera);

  // adaptive: one quality step down if the frame budget is blown
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
  layoutLetters();
  readScroll();
});

(async () => {
  try {
    await Promise.race([
      document.fonts.load(`300px ${FONT_DISPLAY}`),
      new Promise((r) => setTimeout(r, 2500)),
    ]);
  } catch (e) { /* fallback glyphs are fine */ }
  buildLetters();
  buildNumerals();
  // if the display font lands after the race timeout, redraw the glyphs
  document.fonts.ready.then(() => {
    for (let i = 0; i < letterPlanes.length; i++) {
      const { tex } = glyphTexture(WORD[i], 300, FONT_DISPLAY);
      letterPlanes[i].material.map.dispose();
      letterPlanes[i].material.map = tex;
      letterPlanes[i].material.needsUpdate = true;
    }
    layoutLetters();
    const texts = ['01', '02', '03'];
    numeralPlanes.forEach((pl, i) => {
      const { tex } = glyphTexture(texts[i], 300, FONT_DISPLAY);
      pl.material.map.dispose();
      pl.material.map = tex;
      pl.material.needsUpdate = true;
    });
  });
  readScroll();
  composeFrame(0, 0);
  renderer.render(scene, camera);
  enterBtn.disabled = false;
  frame();
})();

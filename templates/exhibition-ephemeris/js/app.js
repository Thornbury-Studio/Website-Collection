/* ═══════════════════════════════════════════════════════════════════════════
   EPHEMERIS — EXHIBIT 01 · the room
   One real object in the dark, read by one moving light. Scroll walks the
   camera through five acts with plateau holds; in act III the lamp passes to
   the visitor and raking incidence brings the engraving back.

   Renderer: three.js WebGPURenderer. It selects a WebGPU backend where one
   exists and a WebGL2 backend where it doesn't — the same TSL node graphs
   compile to WGSL or GLSL, so there is one code path here, not two.
   ═══════════════════════════════════════════════════════════════════════════ */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.webgpu.js';
import { GLTFLoader } from './vendor/GLTFLoader.js';
import { DRACOLoader } from './vendor/DRACOLoader.js';

const {
  uniform, float, vec3, positionWorld, normalWorld, cameraPosition,
  mix, smoothstep, time, positionLocal,
} = THREE.TSL;

const doc = document.documentElement;
const $ = (s) => document.querySelector(s);

/* ── tier ─────────────────────────────────────────────────────────────── */
const COARSE = matchMedia('(pointer: coarse)').matches;
const SMALL = matchMedia('(max-width: 760px)').matches;
const MOBILE = COARSE && SMALL;
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

const CFG = {
  dprCap: MOBILE ? 1.75 : 2,
  fov: MOBILE ? 46 : 38,
  envSize: MOBILE ? 128 : 256,
  /* spring constants — the camera has mass. k is stiffness, zeta the damping
     ratio. 1.0 is critically damped: it arrives and stops, never oscillates,
     but it arrives *asymptotically*, which is what gives a plateau its weight
     instead of a dead stop. Reduced motion stiffens it to near-instant. */
  camK: REDUCED ? 900 : 26,
  camZeta: 1.0,
  scrollK: REDUCED ? 600 : 34,
  scrollZeta: 1.0,
};

/* ── renderer ─────────────────────────────────────────────────────────── */
let renderer;
try {
  renderer = new THREE.WebGPURenderer({ antialias: !MOBILE, powerPreference: 'high-performance' });
  await renderer.init();
} catch (e) {
  doc.classList.add('no-3d');
  throw e;
}
window.__ephemeris = true;

const BACKEND = renderer.backend && renderer.backend.isWebGPUBackend ? 'webgpu' : 'webgl';
window.__ephemerisBackend = BACKEND;

let DPR = Math.min(devicePixelRatio || 1, CFG.dprCap);
renderer.setPixelRatio(DPR);
renderer.setSize(innerWidth, innerHeight);
renderer.setClearColor(0x07080a, 1);
renderer.toneMapping = THREE.NeutralToneMapping;   // keeps blacks black, small speculars alive
renderer.toneMappingExposure = 1.15;
renderer.domElement.className = 'scene';
document.body.prepend(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(CFG.fov, innerWidth / innerHeight, 0.01, 60);

/* ═══════════════════════════════════════════════════════════════════════
   THE ROOM'S AIR
   A backdrop sphere carrying a dark gradient and a slow drift of haze. This
   is a shaded volume, not a field of primitives — there is no secondary
   particle geometry anywhere in this build, on purpose: one lit object in a
   dark room does not need company.

   If an atmospheric plate is present at img/air.mp4 it is composited into the
   same node graph as a third term; when it is absent (or fails to decode) the
   procedural air stands alone and nothing else changes.
   ═══════════════════════════════════════════════════════════════════════ */
const uAir = uniform(0);          // 0 = procedural only, 1 = plate mixed in
const uAirTex = { value: null };

const airMat = new THREE.MeshBasicNodeMaterial({ side: THREE.BackSide, depthWrite: false, fog: false });
{
  const p = positionLocal.normalize();
  const t = REDUCED ? float(0) : time.mul(0.014);

  // vertical gradient: a touch of warmth low down, cold nothing above.
  // Kept nearly neutral — any real saturation here and the "dark room" turns
  // into a purple backdrop, which is the tell of a lit void rather than an
  // unlit one.
  const h = p.y.mul(0.5).add(0.5);
  const grad = mix(vec3(0.026, 0.025, 0.026), vec3(0.011, 0.011, 0.014), smoothstep(0.16, 0.72, h));

  // three drifting bands of haze, each on its own slow phase — reads as air
  // moving through a beam rather than as a texture sliding past
  const a1 = p.x.mul(2.3).add(p.y.mul(1.1)).add(t).sin();
  const a2 = p.z.mul(3.1).sub(p.y.mul(1.7)).sub(t.mul(0.63)).sin();
  const a3 = p.x.mul(1.3).sub(p.z.mul(2.2)).add(t.mul(0.41)).sin();
  const haze = a1.mul(a2).mul(0.5).add(a3.mul(0.28)).mul(0.5).add(0.5);

  // the haze only lifts where the room is already lit — low, and toward front
  const lit = smoothstep(0.62, 0.02, h).mul(smoothstep(-0.55, 0.5, p.z));
  const air = grad.add(vec3(0.052, 0.043, 0.030).mul(haze).mul(lit));

  airMat.colorNode = air;
}
const airDome = new THREE.Mesh(new THREE.SphereGeometry(26, 40, 24), airMat);
airDome.renderOrder = -1;
scene.add(airDome);

/* ═══════════════════════════════════════════════════════════════════════
   THE STUDIO
   A procedural PMREM environment: a dim gradient surround plus a handful of
   emissive *rectangles*. The rectangle shape is the point — a long softbox
   draws the long specular streak down a brass ring that a point light never
   will. Baked once, costs no asset and no new CSP host.
   ═══════════════════════════════════════════════════════════════════════ */
function buildStudio() {
  const s = new THREE.Scene();

  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(12, 32, 20),
    (() => {
      const m = new THREE.MeshBasicNodeMaterial({ side: THREE.BackSide });
      const h = positionLocal.normalize().y.mul(0.5).add(0.5);
      m.colorNode = mix(vec3(0.012, 0.013, 0.017), vec3(0.055, 0.056, 0.066), smoothstep(0.3, 1.0, h));
      return m;
    })()
  );
  s.add(dome);

  const panel = (w, h, col, intensity, pos, look) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(intensity), side: THREE.DoubleSide })
    );
    m.position.set(pos[0], pos[1], pos[2]);
    m.lookAt(look[0], look[1], look[2]);
    s.add(m);
    return m;
  };

  // key: a tall narrow softbox front-left — the streak down the meridian ring
  panel(1.2, 5.4, 0xfff0d8, 8.5, [-3.6, 2.4, 3.8], [0, 0.7, 0]);
  // a second, shorter key from front-right at a third the power, so the
  // graduated band is lit from both sides and the ring nest reads as a nest
  panel(0.9, 3.2, 0xffe8cc, 3.0, [3.4, 1.9, 3.2], [0, 0.7, 0]);
  // cool fill, opposite and much weaker, so the shadow side isn't dead black
  panel(4.0, 3.0, 0x9fb6d8, 1.1, [5.0, 1.6, -2.4], [0, 0.7, 0]);
  // rim from behind — separates brass from the ground
  panel(3.4, 0.8, 0xffe6bc, 6.0, [0.6, 2.9, -4.6], [0, 0.9, 0]);
  // floor bounce, dim and warm
  panel(6.0, 6.0, 0x8a734e, 0.5, [0, -2.2, 0], [0, 1, 0]);

  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader?.();
  const rt = pmrem.fromScene(s, 0.04, 0.1, 30);
  return rt.texture;
}
scene.environment = buildStudio();
scene.environmentIntensity = 1.25;

/* the lamp the visitor eventually carries — a real light, not an overlay */
const lamp = new THREE.PointLight(0xffe2b0, 0, 6, 2);
scene.add(lamp);
/* a weak, near-neutral directional so the silhouette exists before act III;
   kept low so the environment keeps ownership of the diffuse response */
const key = new THREE.DirectionalLight(0xfff3e2, 0.8);
key.position.set(-2.4, 3.0, 2.6);
scene.add(key);

/* ═══════════════════════════════════════════════════════════════════════
   THE RAKING-LIGHT REVEAL  (act III)
   The engraving on the horizon ring lives in the scan's normal map. It is
   invisible under diffuse light and returns at grazing incidence, which is
   how the real object behaves in a gallery — so the reveal is a real lighting
   term, not a decal that fades in.

   `1 - |N·L|` peaks where the light runs tangent to the surface. Because N is
   the *perturbed* normal, every engraved groove crosses that peak at a
   slightly different moment as the lamp sweeps, and the marks come up out of
   the brass in the order they were cut.
   ═══════════════════════════════════════════════════════════════════════ */
const uLampPos = uniform(new THREE.Vector3(0, 0.71, 1.2));
const uRake = uniform(0);        // act-III strength, 0 outside the act

function rakingTerm() {
  const P = positionWorld;
  const N = normalWorld.normalize();
  const V = cameraPosition.sub(P).normalize();
  const d = uLampPos.sub(P);
  const dist = d.length();
  const L = d.div(dist.max(0.0001));

  // inverse-square falloff, tight enough that the pool has an edge you can
  // steer — a loose falloff lights the legs and base too and the reveal stops
  // reading as a lamp held against one ring
  const atten = float(1).div(float(1).add(dist.mul(dist).mul(9.0)));

  /* The lamp is held almost *in* the plane of the band, so on the flat brass
     N·L is only a few hundredths — the field stays dark. A groove wall tilted
     toward the lamp swings N·L up by an order of magnitude, and a hard gain on
     that difference is exactly the contrast a conservator buys by lowering the
     lamp to the surface. Amplifying N·L is the whole trick; `1 − |N·L|` would
     light the flat field instead and wash the relief out.

     The gain is set against the actual incidence: at ~4° the flat band returns
     N·L ≈ 0.075, so a gain of 2.2 leaves the field sitting near 0.17 while a
     groove wall tilted 25° into the lamp reaches 1.0. Six times the contrast,
     with the field still dark. Gains high enough to saturate the flat brass
     (6.5 was the first try) blow the surface white and throw away the very
     relief they were added to show. */
  const ndl = N.dot(L).clamp(0, 1);
  const relief = ndl.mul(2.2).clamp(0, 1).pow(1.35);

  // a tight specular lobe — the polish inside the cut catching the lamp
  const H = L.add(V).normalize();
  const spec = N.dot(H).clamp(0, 1).pow(90.0);

  /* Confine the term to the graduated band. Raking light is not a property of
     the room, it is what one lamp does to one surface it is being held against
     — applied to the whole instrument it lights every ring and leg that
     happens to face the lamp and the object washes out white, which is exactly
     what the first two passes did. The band is an annulus about the Y axis, so
     a world-space radial-plus-height mask is also rotation-invariant and
     survives act IV's turntable untouched. */
  const rr = positionWorld.xz.length();
  const inPlane = smoothstep(0.055, 0.018, positionWorld.y.sub(RING.y).abs());
  const inRadius = smoothstep(0.20, 0.255, rr).mul(smoothstep(0.400, 0.352, rr));
  /* ...and to the band's UP-facing fragments. Its outer rim is a vertical wall
     pointing straight at the lamp, so it takes N·L ≈ 1 and burns white while
     the engraved face beside it stays dark — the one surface the act is about
     ends up the only one not being read. The threshold is deliberately loose:
     a groove wall tilted 40° out of plane still has to count, because that is
     the geometry carrying the marks. */
  const face = smoothstep(0.15, 0.55, normalWorld.normalize().y);
  const band = inPlane.mul(inRadius).mul(face);

  const brass = vec3(1.0, 0.76, 0.44);
  return brass.mul(relief.mul(1.7).add(spec.mul(0.9))).mul(atten).mul(band).mul(uRake);
}

/* ═══════════════════════════════════════════════════════════════════════
   THE OBJECT
   ═══════════════════════════════════════════════════════════════════════ */
const OBJ = new THREE.Group();       // holds the normalised instrument
scene.add(OBJ);
const SPIN = new THREE.Group();      // turntable: the whole instrument, about Y
OBJ.add(SPIN);

let loaded = false;

function adoptMaterial(src) {
  /* Rebuild the loaded PBR material as a node material so the raking term can
     be added to it. Every map the scan carries is kept — base colour, normal,
     roughness/metalness and AO all come off the same 1K set. */
  const m = new THREE.MeshStandardNodeMaterial({
    map: src.map || null,
    normalMap: src.normalMap || null,
    roughnessMap: src.roughnessMap || null,
    metalnessMap: src.metalnessMap || null,
    aoMap: src.aoMap || null,
    side: src.side,
    transparent: false,
  });
  if (src.normalScale) m.normalScale.copy(src.normalScale).multiplyScalar(1.35);
  /* The scan ships metalness 1.0 against a rough map, which is how a
     photogrammetry export describes brass and how it always renders as mud:
     a fully-metallic surface has no diffuse term, so all the baked colour in
     the albedo is thrown away and only a rough, dark reflection is left.
     Treat it as a mostly-dielectric surface with a metallic sheen instead —
     the maps still do all the variation, they just stop cancelling the plate. */
  m.roughness = 0.58;
  m.metalness = 0.28;
  m.aoMapIntensity = 0.7;
  m.envMapIntensity = 1.75;
  m.emissiveNode = rakingTerm();
  m.name = src.name;
  return m;
}

const draco = new DRACOLoader();
draco.setDecoderPath('js/vendor/draco/');
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(draco);

/* Geometric facts about the instrument, in normalised instrument-heights.
   Measured off the loaded geometry rather than guessed from the bounding box —
   the widest thing in the box is the wooden base (r 0.41), not the ring, so a
   bbox-derived radius aims every close-up 0.06 too far out. Radius profile by
   height band: base r0.41 · legs 0.31→0.10 · sphere 0.26→0.32 ·
   HORIZON BAND y0.70–0.78 r0.345 (20k verts, the density spike) · pole 0.15. */
const RING = { y: 0.725, r: 0.345 };

gltfLoader.load('model/ephemeris.glb', (gltf) => {
  const root = gltf.scene;

  // normalise: base on the floor, centred on XZ, exactly one unit tall, so
  // every authored camera number below is in instrument-heights
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  const ctr = box.getCenter(new THREE.Vector3());
  const s = 1 / size.y;
  root.scale.setScalar(s);
  root.position.set(-ctr.x * s, -box.min.y * s, -ctr.z * s);

  root.traverse((o) => {
    if (!o.isMesh) return;
    o.frustumCulled = false;
    // three reads aoMap through uv1; the scan ships one UV set for all maps
    if (o.material.aoMap && o.geometry.attributes.uv && !o.geometry.attributes.uv1) {
      o.geometry.setAttribute('uv1', o.geometry.attributes.uv);
    }
    if (o.material.name === 'glass') {
      /* The compass cover in the base. Transmission is wrong here: it refracts
         the unlit room instead of the dial 4 mm underneath, and the cover
         renders as a hole punched through the base. What old glass over a dark
         dial actually does is stay almost invisible and carry one hard
         reflection — so: nearly clear, very smooth, and let the studio show up
         in it. No transmission pass on any tier, which is also the cheaper
         answer on mobile. */
      const g = new THREE.MeshPhysicalNodeMaterial({
        color: 0x0a0c10, roughness: 0.03, metalness: 0.0,
        transparent: true, opacity: 0.14, depthWrite: false,
      });
      g.envMapIntensity = 2.4;
      o.material = g;
      o.renderOrder = 2;
    } else {
      o.material = adoptMaterial(o.material);
    }
  });

  SPIN.add(root);
  loaded = true;
  const btn = $('#enter');
  btn.disabled = false;
}, undefined, (err) => {
  console.error('[EPHEMERIS] the object failed to load', err);
  doc.classList.add('no-3d');
});

/* ═══════════════════════════════════════════════════════════════════════
   THE ATMOSPHERIC PLATE (optional)
   A generated 4K loop, when one is present. The site is complete without it:
   absence is the normal case, not an error, so nothing is logged and nothing
   is retried.
   ═══════════════════════════════════════════════════════════════════════ */

/* Flip to true the moment img/air.mp4 exists — that is the entire integration.
   Left false so the shipped page does not probe a file that is not there and
   log a 404 into every visitor's console. */
const HAS_PLATE = false;

(function tryPlate() {
  if (!HAS_PLATE || REDUCED) return;
  const v = document.createElement('video');
  v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'auto';
  v.crossOrigin = 'anonymous';
  v.addEventListener('canplay', () => {
    const tex = new THREE.VideoTexture(v);
    tex.colorSpace = THREE.SRGBColorSpace;
    uAirTex.value = tex;
    v.play().catch(() => {});
    // fold the plate into the air graph and let it come up over two seconds
    const base = airMat.colorNode;
    airMat.colorNode = mix(base, THREE.TSL.texture(tex, THREE.TSL.uv()).rgb.mul(0.5), uAir);
    airMat.needsUpdate = true;
    const t0 = performance.now();
    const ramp = () => {
      const k = Math.min((performance.now() - t0) / 2000, 1);
      uAir.value = k * 0.62;
      if (k < 1) requestAnimationFrame(ramp);
    };
    ramp();
  }, { once: true });
  v.addEventListener('error', () => {}, { once: true });
  v.src = 'img/air.mp4';
})();

/* ═══════════════════════════════════════════════════════════════════════
   THE WALK
   Camera keyframes in instrument-heights. Repeated keys are plateaus: the
   sampler zeroes its tangents across them so the spline arrives flat instead
   of sailing through, and the spring below turns that flat span into a hold
   with weight rather than a freeze.
   ═══════════════════════════════════════════════════════════════════════ */
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

/* Acts II and III look DOWN onto the graduated face of the band. Level with
   it the band is edge-on — a bar across frame — and the engraving that the
   whole middle of the walk is about is never actually pointed at. */
const CAM_KEYS = [
  /* ── act I · the object ───────────────────────────────────────────── */
  { p: 0.00, pos: V3(0.92, 1.06, 2.42), look: V3(0, 0.52, 0) },
  { p: 0.075, pos: V3(0.46, 0.86, 1.92), look: V3(0, 0.56, 0) },
  { p: 0.125, pos: V3(0.30, 0.80, 1.74), look: V3(0, 0.58, 0) },
  { p: 0.165, pos: V3(0.30, 0.80, 1.74), look: V3(0, 0.58, 0) },   // hold
  /* ── act II · the horizon ring, from above its plane ──────────────── */
  { p: 0.245, pos: V3(0.24, 0.94, 1.30), look: V3(0, 0.73, 0.14) },
  { p: 0.335, pos: V3(0.17, 1.03, 0.88), look: V3(0, 0.735, 0.17) },
  { p: 0.385, pos: V3(0.17, 1.03, 0.88), look: V3(0, 0.735, 0.17) },  // hold
  /* ── act III · raking light (the long one — this is the play zone) ── */
  { p: 0.470, pos: V3(-0.14, 0.98, 0.72), look: V3(-0.06, 0.730, 0.24) },
  { p: 0.545, pos: V3(-0.26, 0.925, 0.60), look: V3(-0.09, 0.728, 0.26) },
  { p: 0.665, pos: V3(-0.26, 0.925, 0.60), look: V3(-0.09, 0.728, 0.26) },  // long hold
  /* ── act IV · the mechanism ───────────────────────────────────────── */
  { p: 0.745, pos: V3(0.34, 0.98, 1.42), look: V3(0, 0.66, 0) },
  { p: 0.835, pos: V3(1.02, 1.30, 1.74), look: V3(0, 0.58, 0) },
  { p: 0.880, pos: V3(1.02, 1.30, 1.74), look: V3(0, 0.58, 0) },   // hold
  /* ── act V · resting ──────────────────────────────────────────────── */
  { p: 0.950, pos: V3(0.52, 0.84, 2.05), look: V3(0, 0.50, 0) },
  { p: 1.000, pos: V3(0.40, 0.76, 2.46), look: V3(0, 0.48, 0) },
];

/* act windows, for labels and for the lamp handover */
const ACTS = [
  { i: 0, a: 0.00, b: 0.20 },
  { i: 1, a: 0.20, b: 0.41 },
  { i: 2, a: 0.41, b: 0.70 },
  { i: 3, a: 0.70, b: 0.90 },
  { i: 4, a: 0.90, b: 1.01 },
];
const ROMAN = ['I', 'II', 'III', 'IV', 'V'];

/* non-uniform Hermite sampling of the keys (C1, honours a plateau) */
const _sample = { pos: new THREE.Vector3(), look: new THREE.Vector3() };
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
    const still = P0.distanceToSquared(P1) < 1e-8;   // plateau → flat tangents
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

/* ── responsive fit ───────────────────────────────────────────────────
   Distances are pushed out by the ratio of the real fit half-angle to the
   desktop one, computed against the *binding* axis. On a landscape stage the
   vertical field binds; on a phone held upright the horizontal one does, and
   the camera pulls back exactly enough to keep the object inside both edges.
   ─────────────────────────────────────────────────────────────────────── */
let RESP = 1;
function computeResp() {
  const vHalf = THREE.MathUtils.degToRad(camera.fov) / 2;
  const hHalf = Math.atan(Math.tan(vHalf) * camera.aspect);
  const bind = Math.min(vHalf, hHalf);
  const ref = THREE.MathUtils.degToRad(38) / 2;    // desktop vertical half-angle
  RESP = Math.min(Math.sin(ref) / Math.sin(bind), 2.6);
}

/* ═══════════════════════════════════════════════════════════════════════
   PHYSICS
   Everything that moves here is a damped spring integrated on real elapsed
   time, not a per-frame lerp: a lerp's speed depends on frame rate, and it
   has no momentum, so it cannot arrive at a plateau with weight. Substepped
   at a fixed dt so a stiff spring stays stable when a frame runs long.
   ═══════════════════════════════════════════════════════════════════════ */
function springStep(cur, vel, target, k, zeta, dt) {
  const c = 2 * Math.sqrt(k) * zeta;
  const a = -k * (cur - target) - c * vel;
  const v = vel + a * dt;
  return [cur + v * dt, v];
}
function springVec(cur, vel, target, k, zeta, dt) {
  const c = 2 * Math.sqrt(k) * zeta;
  for (const ax of ['x', 'y', 'z']) {
    const a = -k * (cur[ax] - target[ax]) - c * vel[ax];
    vel[ax] += a * dt;
    cur[ax] += vel[ax] * dt;
  }
}

/* ── scroll ───────────────────────────────────────────────────────────── */
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
let targetP = 0, smoothP = 0, velP = 0;
const trackEl = $('#track');
function readScroll() {
  /* Measure p against the TRACK, not the document. The reading room is a real
     section in normal flow, so `document.body.scrollHeight` includes its
     height — p then reaches 1.0 only at the bottom of the notes, and the last
     two acts play out behind a page of opaque text that has already scrolled
     over the canvas. Against the track, the walk finishes exactly as the
     reading room's top edge reaches the top of the viewport. */
  const span = Math.max(trackEl.offsetTop + trackEl.offsetHeight - innerHeight, 1);
  targetP = THREE.MathUtils.clamp(scrollY / span, 0, 1);
  if (targetP > 0.004) doc.classList.add('moved');
}
addEventListener('scroll', readScroll, { passive: true });

/* ── the pointer carries the lamp ─────────────────────────────────────── */
let lampX = 0, lampY = 0;          // −1..1, the visitor's hand
let lampTX = 0, lampTY = 0;
let hasTouched = false;
if (COARSE) {
  document.body.style.touchAction = 'pan-y';
  const track = (e) => {
    const t = e.touches ? e.touches[0] : e;
    lampTX = (t.clientX / innerWidth) * 2 - 1;
    lampTY = (t.clientY / innerHeight) * 2 - 1;
    hasTouched = true;
  };
  addEventListener('touchstart', track, { passive: true });
  addEventListener('touchmove', track, { passive: true });
} else {
  addEventListener('pointermove', (e) => {
    lampTX = (e.clientX / innerWidth) * 2 - 1;
    lampTY = (e.clientY / innerHeight) * 2 - 1;
    hasTouched = true;
  }, { passive: true });
}

/* ── entry ────────────────────────────────────────────────────────────── */
const gate = $('#gate');
$('#enter').addEventListener('click', () => {
  gate.classList.add('leave');
  doc.classList.add('entered');
  scrollTo(0, 0);
  setTimeout(() => { gate.style.display = 'none'; }, 1200);
});
$('#gate-skip').addEventListener('click', () => {
  doc.classList.add('no-3d');
});
$('#rewalk').addEventListener('click', (e) => { e.preventDefault(); scrollTo(0, 0); });
$('#notify').addEventListener('submit', (e) => {
  e.preventDefault();
  const f = e.currentTarget;
  f.querySelector('.n-done').textContent = 'Noted. You will hear on the morning it opens.';
  f.querySelector('.n-mail').value = '';
});

/* ── labels + HUD ─────────────────────────────────────────────────────── */
const labelEls = Array.from(document.querySelectorAll('.label'));
const hudPct = $('#hud-pct');
const hudAct = $('#hud-act-no');
const lampCue = $('#lamp-cue');
let shownAct = -1;

function setAct(i) {
  if (i === shownAct) return;
  shownAct = i;
  labelEls.forEach((el) => el.classList.toggle('on', Number(el.dataset.act) === i));
  hudAct.textContent = ROMAN[i] || 'I';
}

/* ── resize ───────────────────────────────────────────────────────────── */
function resize() {
  camera.aspect = innerWidth / innerHeight;
  camera.fov = matchMedia('(max-width: 760px)').matches ? 46 : 38;
  camera.updateProjectionMatrix();
  computeResp();
  DPR = Math.min(devicePixelRatio || 1, CFG.dprCap);
  renderer.setPixelRatio(DPR);
  renderer.setSize(innerWidth, innerHeight);
}
addEventListener('resize', resize);
computeResp();
readScroll();

/* ═══════════════════════════════════════════════════════════════════════
   FRAME
   ═══════════════════════════════════════════════════════════════════════ */
const camPos = camera.position.clone().copy(CAM_KEYS[0].pos);
const camVel = new THREE.Vector3();
const lookCur = CAM_KEYS[0].look.clone();
const lookVel = new THREE.Vector3();
const tPos = new THREE.Vector3(), tLook = new THREE.Vector3();
let last = performance.now();
let spin = 0;

/* the lamp's own path when nobody is holding it: a slow inclined arc, the
   way a sun crosses. Act III hands it over; act IV takes it back. */
const LAMP_TILT = THREE.MathUtils.degToRad(23.4);

renderer.setAnimationLoop(() => {
  const now = performance.now();
  const dtReal = Math.min((now - last) / 1000, 0.25);
  last = now;

  /* substep the springs so stiffness can't blow up on a long frame */
  const steps = Math.min(Math.ceil(dtReal / (1 / 120)), 8);
  const dt = dtReal / steps;

  for (let s = 0; s < steps; s++) {
    [smoothP, velP] = springStep(smoothP, velP, targetP, CFG.scrollK, CFG.scrollZeta, dt);
  }
  smoothP = THREE.MathUtils.clamp(smoothP, 0, 1);

  /* the spline gives the target; the spring gives the mass */
  sampleKeys(CAM_KEYS, smoothP, _sample);
  tLook.copy(_sample.look);
  tPos.copy(_sample.pos).sub(tLook).multiplyScalar(RESP).add(tLook);

  for (let s = 0; s < steps; s++) {
    springVec(camPos, camVel, tPos, CFG.camK, CFG.camZeta, dt);
    springVec(lookCur, lookVel, tLook, CFG.camK * 1.25, CFG.camZeta, dt);
  }
  camera.position.copy(camPos);
  camera.lookAt(lookCur);

  /* ── act state ─────────────────────────────────────────────────────── */
  const act = ACTS.find((a) => smoothP >= a.a && smoothP < a.b) || ACTS[4];
  setAct(act.i);
  hudPct.textContent = String(Math.round(smoothP * 100)).padStart(3, '0');

  /* ── the turntable ─────────────────────────────────────────────────
     The scan is one fused solid — there are no separable rings in it — so
     nothing here pretends to articulate the mechanism. What turns is the
     whole instrument about its vertical axis, which is exactly what a museum
     turntable does, and it comes up only under act IV. */
  const spinAmt = REDUCED ? 0 : smoothstepN(smoothP, 0.70, 0.78) * (1 - smoothstepN(smoothP, 0.92, 0.99));
  spin += dtReal * 0.19 * spinAmt;
  SPIN.rotation.y = spin;

  /* ── the lamp ──────────────────────────────────────────────────────
     Act III hands it to the pointer. Everywhere else it runs its own arc. */
  const handover = smoothstepN(smoothP, 0.42, 0.50) * (1 - smoothstepN(smoothP, 0.66, 0.72));
  const lampK = REDUCED ? 26 : 9;
  for (let s = 0; s < steps; s++) {
    lampX += (lampTX - lampX) * Math.min(lampK * dt, 1);
    lampY += (lampTY - lampY) * Math.min(lampK * dt, 1);
  }

  // free path: an inclined circle around the object
  const ang = REDUCED ? 0.9 : now * 0.00007;
  const freeX = Math.cos(ang) * 1.5;
  const freeZ = Math.sin(ang) * 1.5;
  const freeY = 0.95 + Math.sin(ang) * Math.sin(LAMP_TILT) * 0.55;

  /* Held path: the lamp rides just above the plane of the band — 30–70 mm of
     rise over ~0.5 of run, which is four to eight degrees of incidence. Moving
     the pointer sweeps the *azimuth* of that grazing light around the band,
     so marks come up in the order they were cut rather than a bright dot
     sliding over an evenly-lit surface. Vertical pointer travel raises and
     lowers the lamp, which is the visitor's control over how hard the
     relief bites. */
  const heldX = lampX * 0.55;
  const heldZ = RING.r + 0.16;
  // 4 mm of rise over 160 mm of run is ~1.4 deg; 32 mm is ~11 deg. Clamped,
  // because letting the pointer drive the lamp below the plane of the band
  // lights it from underneath and the relief inverts.
  const heldY = RING.y + Math.min(Math.max(0.012 + (-lampY) * 0.020, 0.004), 0.032);

  uLampPos.value.set(
    freeX + (heldX - freeX) * handover,
    freeY + (heldY - freeY) * handover,
    freeZ + (heldZ - freeZ) * handover
  );
  /* As the lamp passes to the visitor the room goes out. Raking light only
     exists as an absence of every other source: leave the studio up and the
     ambient fill re-lights the flat brass the low angle was there to keep
     dark, and the engraving stops being a discovery. */
  scene.environmentIntensity = 1.25 - 0.72 * handover;
  key.intensity = 0.8 - 0.52 * handover;

  lamp.position.copy(uLampPos.value);
  /* Inverse-square over ~0.2 units multiplies irradiance by ~25, so the free
     arc's intensity would flood the object white the moment the lamp comes in
     close. Held, it is deliberately tiny: the reveal is meant to be carried by
     the raking term, with the point light only grounding it. */
  lamp.intensity = 0.45 * (1 - handover) + 0.16 * handover;
  uRake.value = handover;

  lampCue.classList.toggle('on', handover > 0.55 && !hasTouched);

  /* readable state, for QA over CDP — the walk is a continuous camera path,
     so "did act III arrive" is a question about numbers, not about a pixel */
  window.__eph = { p: smoothP, act: act.i, backend: BACKEND, rake: uRake.value, spin: SPIN.rotation.y, cam: camPos.toArray(), look: lookCur.toArray(), resp: RESP };

  /* The reading room takes the room's place at the very end. The labels and
     HUD are `position: fixed`, so they have to be dismissed explicitly or they
     hang over the notes for the rest of the page. */
  renderer.domElement.classList.toggle('dimmed', smoothP > 0.985);
  doc.classList.toggle('reading-on', smoothP > 0.975);

  if (loaded) renderer.render(scene, camera);
});

function smoothstepN(x, a, b) {
  const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
}

/* ══════════════════════════════════════════════════════════════════
   FRACTURE — the surface engine.

   One debris field of ~1,400 instanced concrete/glass fragments that
   NEVER tweens with scroll. It holds, jagged, until scroll crosses a
   section threshold — then a shockwave: camera kick, the field
   violently re-forms into the next composition (wall → VS → fist →
   cage → 09 → rubble), a chromatic-aberration hit, and a new hold.
   The pointer is a punch input: moving it shoves the field, clicking
   it lands an impulse. Impact-triggered, not clock-driven.
   ══════════════════════════════════════════════════════════════════ */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

const doc = document.documentElement;

/* ── device + quality profile ─────────────────────────────────── */
const MOBILE = matchMedia('(max-width: 720px)').matches ||
               (matchMedia('(pointer: coarse)').matches && innerWidth < 900);
const RM = { on: doc.classList.contains('rm') };
matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', e => {
  RM.on = e.matches; doc.classList.toggle('rm', e.matches);
});

const CFG = {
  N: MOBILE ? 820 : 1400,
  dprCap: MOBILE ? 1.75 : 2,
  samples: MOBILE ? 0 : 4,
  dust: MOBILE ? 280 : 600,
  fov: 42,
};

/* ── renderer (any failure here folds to the static sheet) ────── */
let renderer, canvas;
try {
  renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
  canvas = renderer.domElement;
} catch (err) {
  window.__fxFold && window.__fxFold();
  throw err;
}
canvas.className = 'stage';
document.body.prepend(canvas);
canvas.addEventListener('webglcontextlost', () => { window.__fxFold && window.__fxFold(); });

let DPR = Math.min(devicePixelRatio || 1, CFG.dprCap);
renderer.setPixelRatio(DPR);
renderer.setSize(innerWidth, innerHeight);
/* colour management off: the composite pass does one manual gamma at
   the end, so every hex below is authored in sRGB and converted once. */
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;

const lin = hex => new THREE.Color(hex).convertSRGBToLinear();

/* ── scene, camera ────────────────────────────────────────────── */
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(CFG.fov, innerWidth / innerHeight, 0.1, 300);
camera.position.set(0, 0, 46);

/* ── deterministic RNG so the room looks the same every night ─── */
function mulberry(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const rng = mulberry(90210);
const N = CFG.N;
const rnd = new Float32Array(N);            // one stable random per instance
for (let i = 0; i < N; i++) rnd[i] = rng();

/* ── fragment geometries: slab / shard / splinter ─────────────── */
function prism(pts, depth) {
  const s = new THREE.Shape(pts.map(p => new THREE.Vector2(p[0], p[1])));
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false });
  g.center();
  return g;
}
const GEO = [
  prism([[-0.6, 0.45], [0.55, 0.52], [0.62, -0.38], [-0.48, -0.5]], 0.34),   // slab
  prism([[0, 0.58], [0.52, -0.4], [-0.46, -0.34]], 0.22),                    // shard
  prism([[0, 1.15], [0.17, -0.92], [-0.13, -0.98]], 0.1),                    // splinter
];
const COUNTS = [Math.round(N * 0.3), Math.round(N * 0.55), 0];
COUNTS[2] = N - COUNTS[0] - COUNTS[1];
const OFFSETS = [0, COUNTS[0], COUNTS[0] + COUNTS[1]];
const typeOf = i => (i < OFFSETS[1] ? 0 : i < OFFSETS[2] ? 1 : 2);

/* ── castes: concrete / glass / blood-marked ──────────────────── */
const tintArr = new Float32Array(N * 3);
const miscArr = new Float32Array(N * 2);   // seed, material id
{
  const cWarm = lin('#87858A'), cCool = lin('#7B7D89'), cDark = lin('#5A585F');
  const glass = lin('#7B739F'), blood = lin('#B03030');
  const tmp = new THREE.Color();
  for (let i = 0; i < N; i++) {
    const r = rng();
    let mat = 0;
    if (r > 0.98) { tmp.copy(blood); mat = 2; }
    else if (r > 0.93) { tmp.copy(glass); mat = 1; }
    else {
      tmp.copy(rng() < 0.5 ? cWarm : cCool).lerp(cDark, rng() * 0.55);
    }
    const v = 0.85 + rng() * 0.35;
    tintArr[i * 3] = tmp.r * v; tintArr[i * 3 + 1] = tmp.g * v; tintArr[i * 3 + 2] = tmp.b * v;
    miscArr[i * 2] = rng(); miscArr[i * 2 + 1] = mat;
  }
}

/* ── environment: baked once with PMREM from a tiny procedural
   scene — the hall as the glass caste sees it: four hot floodlight
   strips overhead, a bruise-violet wash low, darkness everywhere
   else. No HDRI file, no new hosts. ───────────────────────────── */
function bakeEnv() {
  const pm = new THREE.PMREMGenerator(renderer);
  const s = new THREE.Scene();
  s.add(new THREE.Mesh(
    new THREE.SphereGeometry(60, 16, 12),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: /* glsl */`
        varying vec3 vP;
        void main() {
          float t = clamp(vP.y / 60.0 + 0.5, 0.0, 1.0);
          vec3 c = mix(vec3(0.006, 0.006, 0.008), vec3(0.09, 0.09, 0.10), pow(t, 1.7));
          c += vec3(0.045, 0.035, 0.085) * pow(1.0 - t, 3.0);
          gl_FragColor = vec4(c, 1.0);
        }`,
    })
  ));
  const strip = (c, x, z, ry) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(16, 2.6),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(...c), side: THREE.DoubleSide }));
    m.position.set(x, 26, z);
    m.rotation.set(Math.PI / 2, ry, 0);
    s.add(m);
  };
  strip([3.4, 3.2, 2.9], -14, -9, 0.4);
  strip([3.4, 3.2, 2.9], 14, -9, -0.4);
  strip([2.6, 2.5, 2.3], -12, 12, -0.3);
  strip([2.6, 2.5, 2.3], 12, 12, 0.3);
  const low = new THREE.Mesh(
    new THREE.PlaneGeometry(50, 24),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(0.16, 0.13, 0.34), side: THREE.DoubleSide }));
  low.position.set(0, -24, 0);
  low.rotation.x = Math.PI / 2;
  s.add(low);
  const rt = pm.fromScene(s, 0.035);
  pm.dispose();
  s.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
  return rt.texture;
}
const envTex = bakeEnv();
const envH = envTex.image.height;
const envMip = Math.log2(envH) - 2;
const fmt = v => String(v).includes('.') || String(v).includes('e') ? String(v) : v + '.0';

/* ── shared fragment material ─────────────────────────────────── */
const U = {
  uKeyDir: { value: new THREE.Vector3(0.3, 0.5, 0.82).normalize() },
  uKeyCol: { value: lin('#FAF7F0').multiplyScalar(1.2) },
  uFillDir: { value: new THREE.Vector3(-0.55, -0.35, 0.55).normalize() },
  uFillCol: { value: lin('#4F4670').multiplyScalar(0.8) },
  uAmb: { value: lin('#2A2933') },
  uCam: { value: camera.position },
  uExpo: { value: 1 },
  uHit: { value: new THREE.Vector3(0, 0, 0) },
  uHitAmp: { value: 0 },
  uBlood: { value: lin('#D22F2F') },
  uEnv: { value: envTex },
};
const shardMat = new THREE.ShaderMaterial({
  uniforms: U,
  defines: {
    ENVMAP_TYPE_CUBE_UV: '',
    CUBEUV_TEXEL_WIDTH: fmt(1 / (3 * Math.max(Math.pow(2, envMip), 7 * 16))),
    CUBEUV_TEXEL_HEIGHT: fmt(1 / envH),
    CUBEUV_MAX_MIP: fmt(envMip),
  },
  vertexShader: /* glsl */`
    /* instanceMatrix is injected by three for InstancedMesh */
    attribute vec3 aTint;
    attribute vec2 aMisc;
    attribute float aAO;
    varying vec3 vN; varying vec3 vW; varying vec3 vTint; varying vec2 vMisc;
    varying vec3 vLp; varying vec3 vLn; varying float vAO;
    void main() {
      vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.0);
      vW = wp.xyz;
      vN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
      vTint = aTint; vMisc = aMisc; vAO = aAO;
      vLp = position; vLn = normal;      /* surface field rides the fragment */
      gl_Position = projectionMatrix * viewMatrix * wp;
    }`,
  fragmentShader: /* glsl */`
    #include <cube_uv_reflection_fragment>
    uniform sampler2D uEnv;
    uniform vec3 uKeyDir; uniform vec3 uKeyCol;
    uniform vec3 uFillDir; uniform vec3 uFillCol;
    uniform vec3 uAmb; uniform vec3 uCam; uniform float uExpo;
    uniform vec3 uHit; uniform float uHitAmp; uniform vec3 uBlood;
    varying vec3 vN; varying vec3 vW; varying vec3 vTint; varying vec2 vMisc;
    varying vec3 vLp; varying vec3 vLn; varying float vAO;

    float h31(vec3 p) {
      p = fract(p * 0.1031);
      p += dot(p, p.zyx + 31.32);
      return fract((p.x + p.y) * p.z);
    }
    float n3(vec3 p) {
      vec3 i = floor(p), f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(mix(h31(i),                    h31(i + vec3(1, 0, 0)), f.x),
            mix(h31(i + vec3(0, 1, 0)),    h31(i + vec3(1, 1, 0)), f.x), f.y),
        mix(mix(h31(i + vec3(0, 0, 1)),    h31(i + vec3(1, 0, 1)), f.x),
            mix(h31(i + vec3(0, 1, 1)),    h31(i + vec3(1, 1, 1)), f.x), f.y), f.z);
    }

    void main() {
      vec3 N = normalize(vN);
      if (!gl_FrontFacing) N = -N;
      vec3 V = normalize(uCam - vW);

      /* ── surface field: LOCAL space + per-instance seed, so the
         pattern is glued to each fragment instead of swimming through
         it while the field flies between formations ─────────────── */
      vec3 lp = vLp + vMisc.x * 37.0;
      vec3 an = normalize(vLn); an *= an;
      vec3 w = an / (an.x + an.y + an.z + 1e-5);
      /* form-board strain: an anisotropic streak per axis plane,
         blended triplanar-style by the local normal */
      float strain = w.x * n3(vec3(lp.y * 1.7, lp.z * 7.5, 3.1))
                   + w.y * n3(vec3(lp.z * 7.5, lp.x * 1.7, 7.4))
                   + w.z * n3(vec3(lp.x * 7.5, lp.y * 1.7, 5.2));
      float hLow  = n3(lp * 2.4);
      float hGrit = n3(lp * 12.0);
      /* bump rides only the low frequencies — grit in the bump reads
         as hammered metal; grit belongs to colour and roughness */
      float hBump = hLow * 0.72 + strain * 0.28;
      float hgt = hLow * 0.45 + strain * 0.25 + hGrit * 0.3;

      float glass = step(0.5, vMisc.y) * (1.0 - step(1.5, vMisc.y));
      float blood = step(1.5, vMisc.y);
      float conc = 1.0 - glass - blood;

      /* bump: screen-space surface gradient of the height field,
         damped with distance so the far field never sparkles */
      float bumpK = (0.17 * conc + 0.05 * glass + 0.11 * blood)
                  / (1.0 + 55.0 * length(fwidth(lp)));
      vec3 dpx = dFdx(vW), dpy = dFdy(vW);
      float dhx = dFdx(hBump), dhy = dFdy(hBump);
      vec3 r1 = cross(dpy, N), r2 = cross(N, dpx);
      float det = dot(dpx, r1);
      N = normalize(N - (r1 * dhx + r2 * dhy) * (bumpK / max(abs(det), 1e-8)) * sign(det));

      /* ── weathering: grime pools in the cavities of the height
         field and dulls them; facet edges are worn bright (fwidth of
         the flat geometric normal spikes exactly on facet borders);
         per-instance neighbour-density AO buries interior debris ── */
      vec3 Ng = normalize(vN);
      if (!gl_FrontFacing) Ng = -Ng;
      float cav = smoothstep(0.62, 0.2, hLow) * (0.45 + 0.55 * conc);
      float edge = clamp(length(fwidth(Ng)) * 1.3, 0.0, 1.0);
      float occ = vAO * (1.0 - cav * 0.25);

      /* roughness: caste base, blotched, dull in cavities, worn at edges */
      float rough = clamp(0.88 * conc + 0.16 * glass + 0.55 * blood
                        + (hgt - 0.5) * 0.25 + cav * 0.2 - edge * 0.25, 0.05, 1.0);

      /* albedo: speckled at low contrast, blood keeps the treatment */
      vec3 alb = vTint * (0.88 + 0.24 * hgt);
      alb = mix(alb, uBlood * (0.8 + 0.3 * hgt), blood * 0.85);
      alb = mix(alb, alb * vec3(0.6, 0.58, 0.56), cav);
      alb *= 1.0 - glass * 0.4;              /* glass answers with reflection */

      float kd = max(dot(N, uKeyDir), 0.0);
      float fd = max(dot(N, uFillDir), 0.0);
      vec3 col = alb * (uAmb * occ + uKeyCol * kd * mix(1.0, occ, 0.35) + uFillCol * fd * occ);

      float ndv = max(dot(N, V), 0.0);
      float rim = pow(1.0 - ndv, 3.0);
      col += rim * mix(vec3(0.55, 0.56, 0.64), vec3(0.55, 0.48, 0.9), glass) * (0.12 + glass * 0.3) * occ;

      vec3 H = normalize(uKeyDir + V);
      float shin = mix(150.0, 9.0, rough);
      float spec = pow(max(dot(N, H), 0.0), shin) * (1.0 - rough * 0.9);
      col += spec * (0.2 + glass * 1.6 + edge * 0.5) * (1.0 - cav * 0.7) * uKeyCol * 0.7;

      /* environment: the baked hall — floodlights live in the glass */
      vec3 env = textureCubeUV(uEnv, reflect(-V, N), rough).rgb;
      float fres = 0.04 + 0.96 * pow(1.0 - ndv, 5.0);
      float envK = glass * (0.5 + fres) + conc * fres * 0.5 + blood * fres * 1.2;
      col += env * envK * (1.0 - cav * 0.5) * occ;

      /* worn edges catch the key light */
      col += edge * uKeyCol * 0.09 * (0.4 + 0.6 * kd) * (conc + blood);

      float d = length(vW - uHit);
      col += uBlood * uHitAmp * exp(-d * 0.12) * 1.5;
      gl_FragColor = vec4(col * uExpo, 1.0);
    }`,
});

const meshes = [];
for (let m = 0; m < 3; m++) {
  const im = new THREE.InstancedMesh(GEO[m], shardMat, COUNTS[m]);
  im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  im.frustumCulled = false;
  const t = new Float32Array(COUNTS[m] * 3), mi = new Float32Array(COUNTS[m] * 2);
  t.set(tintArr.subarray(OFFSETS[m] * 3, (OFFSETS[m] + COUNTS[m]) * 3));
  mi.set(miscArr.subarray(OFFSETS[m] * 2, (OFFSETS[m] + COUNTS[m]) * 2));
  im.geometry = GEO[m].clone();
  im.geometry.setAttribute('aTint', new THREE.InstancedBufferAttribute(t, 3));
  im.geometry.setAttribute('aMisc', new THREE.InstancedBufferAttribute(mi, 2));
  const aoAttr = new THREE.InstancedBufferAttribute(new Float32Array(COUNTS[m]).fill(1), 1);
  aoAttr.setUsage(THREE.DynamicDrawUsage);
  im.geometry.setAttribute('aAO', aoAttr);
  scene.add(im);
  meshes.push(im);
}

/* ── backdrop: the hall ───────────────────────────────────────── */
function safeHash() {
  return /* glsl */`
    float h21(vec2 p) {
      vec3 p3 = fract(vec3(p.xyx) * 0.1031);
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.x + p3.y) * p3.z);
    }`;
}
const bg = new THREE.Mesh(
  new THREE.PlaneGeometry(340, 200),
  new THREE.ShaderMaterial({
    uniforms: { uA: { value: lin('#141318') }, uB: { value: lin('#060607') }, uV: { value: lin('#141021') } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: safeHash() + /* glsl */`
      uniform vec3 uA; uniform vec3 uB; uniform vec3 uV;
      varying vec2 vUv;
      void main() {
        vec2 c = vUv - vec2(0.5, 0.42);
        vec3 col = mix(uA, uB, clamp(length(c) * 1.9, 0.0, 1.0));
        float fl = exp(-pow((vUv.x - 0.5) * 3.4, 2.0)) * exp(-pow((1.0 - vUv.y) * 2.6, 2.0));
        col += vec3(0.95, 0.93, 0.88) * fl * 0.10;
        col += uV * exp(-pow((vUv.y) * 3.0, 2.0)) * 0.5;
        col += (h21(vUv * 700.0) - 0.5) * 0.02;
        gl_FragColor = vec4(col, 1.0);
      }`,
  })
);
bg.position.z = -42;
scene.add(bg);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(260, 150),
  new THREE.ShaderMaterial({
    uniforms: { uA: { value: lin('#111014') }, uB: { value: lin('#060607') } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: safeHash() + /* glsl */`
      uniform vec3 uA; uniform vec3 uB; varying vec2 vUv;
      void main() {
        float d = length((vUv - 0.5) * vec2(2.2, 3.4));
        vec3 col = mix(uA, uB, clamp(d, 0.0, 1.0));
        col += (h21(vUv * 900.0) - 0.5) * 0.015;
        gl_FragColor = vec4(col, 1.0);
      }`,
  })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -12.4;
scene.add(ground);

/* falling dust — the only thing that moves during a hold */
const dustGeo = new THREE.BufferGeometry();
{
  const p = new Float32Array(CFG.dust * 3);
  for (let i = 0; i < CFG.dust; i++) {
    p[i * 3] = (rng() - 0.5) * 70; p[i * 3 + 1] = (rng() - 0.5) * 40; p[i * 3 + 2] = (rng() - 0.5) * 24;
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(p, 3));
}
const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({
  color: lin('#8A8792'), size: 0.09, transparent: true, opacity: 0.55, depthWrite: false,
}));
scene.add(dust);

/* ── composite pass: CA hit, glitch bands, grain, vignette ────── */
let rt = makeRT();
function makeRT() {
  const t = new THREE.WebGLRenderTarget(
    Math.round(innerWidth * DPR), Math.round(innerHeight * DPR),
    { samples: CFG.samples });
  return t;
}
const postU = {
  tD: { value: rt.texture },
  uShock: { value: 0 },
  uFlash: { value: 0 },
  uT: { value: 0 },
  uRes: { value: new THREE.Vector2(innerWidth * DPR, innerHeight * DPR) },
};
const postScene = new THREE.Scene();
const postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
  uniforms: postU,
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
  fragmentShader: safeHash() + /* glsl */`
    uniform sampler2D tD; uniform float uShock; uniform float uFlash;
    uniform float uT; uniform vec2 uRes;
    varying vec2 vUv;
    void main() {
      vec2 uv = vUv;
      vec2 c = uv - 0.5;
      float band = floor(uv.y * 36.0);
      float bt = floor(uT * 24.0);
      float slice = step(0.62, h21(vec2(band * 1.7, bt + 9.0)));
      uv.x += (h21(vec2(band, bt)) - 0.5) * uShock * 0.05 * slice;
      vec2 off = c * (0.0011 + uShock * 0.02);
      vec3 col = vec3(
        texture2D(tD, uv + off).r,
        texture2D(tD, uv).g,
        texture2D(tD, uv - off).b);
      col += uFlash * vec3(1.0, 0.9, 0.85) * 0.2;
      col *= clamp(1.0 - dot(c, c) * 0.9, 0.0, 1.0);
      col += (h21(uv * uRes + fract(uT) * 371.0) - 0.5) * 0.035;
      gl_FragColor = vec4(pow(max(col, 0.0), vec3(0.4545)), 1.0);
    }`,
  depthTest: false, depthWrite: false,
})));

/* ══ FORMATIONS ════════════════════════════════════════════════
   Every formation assigns a target to EVERY instance — leftovers go
   to a scatter shell, never to scale zero, so no impact can ever
   leave an empty frame mid-flight (the PARALLAX vessel-morph bug). */

const EUL = new THREE.Euler(), QT = new THREE.Quaternion();
function alloc() {
  return { pos: new Float32Array(N * 3), rot: new Float32Array(N * 4), scl: new Float32Array(N), rw: 16, rh: 10, cy: 0 };
}
function setInst(F, i, x, y, z, rx, ry, rz, s) {
  F.pos[i * 3] = x; F.pos[i * 3 + 1] = y; F.pos[i * 3 + 2] = z;
  EUL.set(rx, ry, rz); QT.setFromEuler(EUL);
  F.rot[i * 4] = QT.x; F.rot[i * 4 + 1] = QT.y; F.rot[i * 4 + 2] = QT.z; F.rot[i * 4 + 3] = QT.w;
  F.scl[i] = s;
}
function shell(F, i, r) {
  // golden-angle scatter, biased behind the composition
  const g = i * 2.39996, y = (rnd[i] - 0.5) * 1.6;
  const rr = r * (0.85 + rnd[i] * 0.45);
  setInst(F, i,
    Math.cos(g) * rr, y * rr * 0.45, -6 - Math.abs(Math.sin(g)) * rr * 0.6,
    rnd[i] * 6, rnd[(i + 7) % N] * 6, rnd[(i + 13) % N] * 6,
    0.3 + rnd[i] * 0.3);
}

/* 0 · WALL — the surface, cracked and holding */
function genWall() {
  // rw/rh are framing radii, set tighter than the wall itself so the
  // surface bleeds past every edge of the viewport — the page IS the wall
  const F = alloc(); F.rw = 15.5; F.rh = 9.2; F.cy = 0;
  const W = 42, H = 25;
  // six crack rays out of the strike point
  const segs = [];
  for (let r = 0; r < 6; r++) {
    let a = r / 6 * Math.PI * 2 + rng() * 0.7, x = 0, y = 1.5;
    for (let s = 0; s < 5; s++) {
      const len = 2.2 + rng() * 3.4;
      const nx = x + Math.cos(a) * len, ny = y + Math.sin(a) * len;
      segs.push([x, y, nx, ny]);
      x = nx; y = ny; a += (rng() - 0.5) * 0.9;
    }
  }
  const dSeg = (px, py, s) => {
    const vx = s[2] - s[0], vy = s[3] - s[1];
    const t = Math.max(0, Math.min(1, ((px - s[0]) * vx + (py - s[1]) * vy) / (vx * vx + vy * vy)));
    const dx = px - (s[0] + vx * t), dy = py - (s[1] + vy * t);
    return Math.hypot(dx, dy);
  };
  for (let i = 0; i < N; i++) {
    const x = (rng() - 0.5) * W, y = (rng() - 0.5) * H;
    let d = 1e9;
    for (let s = 0; s < segs.length; s++) d = Math.min(d, dSeg(x, y, segs[s]));
    const type = typeOf(i);
    // the wall lies flat, tight and aligned — ONLY the cracks disturb it,
    // and they disturb it violently, so the fracture lines read as lines
    let s = type === 0 ? 1.9 + rnd[i] * 0.5 : type === 1 ? 1.2 + rnd[i] * 0.4 : 0.7 + rnd[i] * 0.3;
    let z = rng() * 0.18, rx = (rng() - 0.5) * 0.07, ry = (rng() - 0.5) * 0.07, rz = (rng() - 0.5) * 0.13;
    if (d < 1.3) {
      const t = Math.pow((1.3 - d) / 1.3, 1.5);
      z += t * (rng() - 0.25) * 3.4;
      rx += t * (rng() - 0.5) * 1.6; ry += t * (rng() - 0.5) * 1.6; rz += t * (rng() - 0.5) * 1.8;
      s *= 1 - t * 0.35;
    }
    setInst(F, i, x, y, z, rx, ry, rz, s);
  }
  return F;
}

/* raster sampler — letters and the fist share it */
function rasterForm(draw, worldW, opts) {
  const F = alloc();
  const cw = 300, ch = 170;
  const cv = document.createElement('canvas');
  cv.width = cw; cv.height = ch;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  ctx.clearRect(0, 0, cw, ch);
  ctx.fillStyle = '#fff';
  draw(ctx, cw, ch);
  const px = ctx.getImageData(0, 0, cw, ch).data;
  const cells = [];
  let x0 = cw, x1 = 0, y0 = ch, y1 = 0;
  for (let y = 1; y < ch; y += 3) for (let x = 1; x < cw; x += 3) {
    if (px[(y * cw + x) * 4 + 3] > 120) {
      cells.push([x, y]);
      if (x < x0) x0 = x; if (x > x1) x1 = x;
      if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
  }
  // deterministic shuffle
  for (let i = cells.length - 1; i > 0; i--) {
    const j = (rng() * (i + 1)) | 0; const t = cells[i]; cells[i] = cells[j]; cells[j] = t;
  }
  // normalise the glyph bounding box, not the canvas, to worldW
  const scale = worldW / Math.max(x1 - x0, 1);
  const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
  const used = Math.min(N, Math.round(N * 0.9));
  const layers = Math.max(1, Math.ceil(used / Math.max(cells.length, 1)));
  const tilt = (opts && opts.tilt) || 0;
  const cs = Math.cos(tilt), sn = Math.sin(tilt);
  F.rw = worldW * 0.6; F.rh = Math.max((y1 - y0) * scale * 0.62, worldW * 0.28); F.cy = 0;
  // fragments sized to the sampling pitch so the letterform stays legible
  const pitch = 3 * scale;
  for (let i = 0; i < N; i++) {
    if (i >= used || !cells.length) { shell(F, i, 30); continue; }
    const cell = cells[i % cells.length];
    const layer = (i / cells.length) | 0;
    const x = (cell[0] - mx) * scale + (rng() - 0.5) * pitch * 0.5;
    const y = -(cell[1] - my) * scale + (rng() - 0.5) * pitch * 0.5;
    const z = (layer - (layers - 1) / 2) * 0.9 + (rng() - 0.5) * 0.6;
    const xr = x * cs - y * sn, yr = x * sn + y * cs;
    const type = typeOf(i);
    const s = pitch * ((type === 0 ? 1.15 : type === 1 ? 1.3 : 1.1) + rnd[i] * 0.75);
    setInst(F, i, xr, yr, z, (rng() - 0.5) * 0.3, (rng() - 0.5) * 0.3, rng() * Math.PI * 2, s);
  }
  return F;
}

const DISP_FONT = '900 130px "Big Shoulders Display", "Arial Narrow", Impact, sans-serif';
function drawText(text) {
  return (ctx, cw, ch) => {
    ctx.font = DISP_FONT;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const w = ctx.measureText(text).width;
    if (w > cw * 0.94) { ctx.setTransform(cw * 0.94 / w, 0, 0, 1, 0, 0); ctx.fillText(text, cw / 2 / (cw * 0.94 / w), ch / 2 + 6); ctx.setTransform(1, 0, 0, 1, 0, 0); }
    else ctx.fillText(text, cw / 2, ch / 2 + 6);
  };
}
/* two masses driving at each other — the versus as composition, since
   curved glyphs seal shut when rendered as debris */
function drawClash(ctx) {
  ctx.beginPath();
  ctx.moveTo(18, 12); ctx.lineTo(18, 158); ctx.lineTo(138, 96); ctx.lineTo(138, 74); ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(282, 12); ctx.lineTo(282, 158); ctx.lineTo(162, 96); ctx.lineTo(162, 74); ctx.closePath();
  ctx.fill();
}
function drawFist(ctx) {
  const rr = (x, y, w, h, r) => {
    if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill(); }
    else ctx.fillRect(x, y, w, h);
  };
  // four folded fingers with real gaps, palm mass, thumb across, wrist —
  // gaps must survive one cell of fragment bleed or the hand reads as a blob
  for (let k = 0; k < 4; k++) rr(64 + k * 44, 12, 32, 92, 14);
  rr(60, 82, 212, 66, 22);
  ctx.save(); ctx.translate(262, 122); ctx.rotate(0.6); rr(-15, -34, 30, 72, 13); ctx.restore();
  rr(112, 148, 88, 32, 8);
}

/* 3 · CAGE — the octagon, posts and mesh */
function genCage() {
  const F = alloc(); F.rw = 17; F.rh = 11; F.cy = -1;
  const R = 13.5, yTop = 6.5, yBot = -9.5;
  const corner = a => [Math.cos(a) * R, Math.sin(a) * R];
  let i = 0;
  const post = 16, band = 17, face = 34, floor = 170;
  for (let p = 0; p < 8 && i < N; p++) {
    const a = p / 8 * Math.PI * 2 + Math.PI / 8;
    const [cx, cz] = corner(a);
    for (let k = 0; k < post && i < N; k++, i++) {
      const y = yBot + (k / (post - 1)) * (yTop - yBot);
      setInst(F, i, cx + (rng() - 0.5) * 0.3, y, cz + (rng() - 0.5) * 0.3,
        (rng() - 0.5) * 0.2, rng() * 6, (rng() - 0.5) * 0.2, 0.9 + rnd[i] * 0.4);
    }
  }
  for (let b = 0; b < 2; b++) {
    const y = b ? yTop : yBot;
    for (let p = 0; p < 8; p++) {
      const a0 = p / 8 * Math.PI * 2 + Math.PI / 8, a1 = (p + 1) / 8 * Math.PI * 2 + Math.PI / 8;
      const [x0, z0] = corner(a0), [x1, z1] = corner(a1);
      for (let k = 0; k < band && i < N; k++, i++) {
        const t = (k + 0.5) / band;
        setInst(F, i, x0 + (x1 - x0) * t, y + (rng() - 0.5) * 0.35, z0 + (z1 - z0) * t,
          (rng() - 0.5) * 0.3, Math.atan2(x1 - x0, z1 - z0), (rng() - 0.5) * 0.3, 0.75 + rnd[i] * 0.35);
      }
    }
  }
  for (let p = 0; p < 8; p++) {
    const a0 = p / 8 * Math.PI * 2 + Math.PI / 8, a1 = (p + 1) / 8 * Math.PI * 2 + Math.PI / 8;
    const [x0, z0] = corner(a0), [x1, z1] = corner(a1);
    for (let k = 0; k < face && i < N; k++, i++) {
      const t = rng(), y = yBot + 1 + rng() * (yTop - yBot - 2);
      setInst(F, i, x0 + (x1 - x0) * t, y, z0 + (z1 - z0) * t,
        rng() * 6, rng() * 6, rng() * 6, 0.3 + rnd[i] * 0.25);
    }
  }
  for (let k = 0; k < floor && i < N; k++, i++) {
    const a = rng() * Math.PI * 2, r = Math.sqrt(rng()) * (R - 1.5);
    setInst(F, i, Math.cos(a) * r, yBot + 0.2 + rng() * 0.4, Math.sin(a) * r,
      -Math.PI / 2 + (rng() - 0.5) * 0.4, 0, rng() * Math.PI * 2, 0.8 + rnd[i] * 0.8);
  }
  for (; i < N; i++) shell(F, i, 30);
  return F;
}

/* 5 · RUBBLE — what a wall becomes */
function genRubble() {
  const F = alloc(); F.rw = 20; F.rh = 9; F.cy = -6;
  const mounds = [[-9, 0, 4.4, 26], [6, -2, 5.6, 34], [1, 4, 3.2, 20]];
  for (let i = 0; i < N; i++) {
    const x = (rng() - 0.5) * 40, z = (rng() - 0.5) * 17;
    let y = 0;
    for (const [mx, mz, h, sp] of mounds) {
      const dd = (x - mx) * (x - mx) + (z - mz) * (z - mz);
      y += h * Math.exp(-dd / sp);
    }
    y = -11.8 + y * (0.35 + rng() * 0.65) + rng() * 0.5;
    const type = typeOf(i);
    const s = type === 0 ? 1.2 + rnd[i] * 1.4 : type === 1 ? 0.8 + rnd[i] * 0.8 : 0.5 + rnd[i] * 0.5;
    setInst(F, i, x, y, z, rng() * 6, rng() * 6, rng() * 6, s);
  }
  return F;
}

/* per-instance ambient occlusion: neighbour density in the formation's
   TARGET positions, spatial-hashed, normalised per formation so buried
   debris darkens and exposed debris stays lit whatever the layout */
function computeAO(F) {
  const inv = 1 / 2.6, r2 = 2.4 * 2.4;
  const map = new Map();
  const key = (x, y, z) => ((x + 512) << 20) | ((y + 512) << 10) | (z + 512);
  for (let i = 0; i < N; i++) {
    const k = key(Math.floor(F.pos[i * 3] * inv), Math.floor(F.pos[i * 3 + 1] * inv), Math.floor(F.pos[i * 3 + 2] * inv));
    let b = map.get(k); if (!b) map.set(k, b = []);
    b.push(i);
  }
  const cnt = new Float32Array(N);
  let mn = 1e9, mx = 0;
  for (let i = 0; i < N; i++) {
    const x = F.pos[i * 3], y = F.pos[i * 3 + 1], z = F.pos[i * 3 + 2];
    const cx = Math.floor(x * inv), cy = Math.floor(y * inv), cz = Math.floor(z * inv);
    let n = 0;
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) {
      const b = map.get(key(cx + dx, cy + dy, cz + dz));
      if (!b) continue;
      for (let j = 0; j < b.length; j++) {
        const o = b[j]; if (o === i) continue;
        const ax = F.pos[o * 3] - x, ay = F.pos[o * 3 + 1] - y, az = F.pos[o * 3 + 2] - z;
        if (ax * ax + ay * ay + az * az < r2) n++;
      }
    }
    cnt[i] = n;
    if (n < mn) mn = n; if (n > mx) mx = n;
  }
  const ao = new Float32Array(N);
  const span = Math.max(mx - mn, 1);
  for (let i = 0; i < N; i++) ao[i] = 1 - ((cnt[i] - mn) / span) * 0.36;
  F.ao = ao;
  return F;
}

const forms = {
  wall: computeAO(genWall()),
  vs: computeAO(rasterForm(drawClash, 19)),
  fist: computeAO(rasterForm(drawFist, 17, { tilt: -0.14 })),
  cage: computeAO(genCage()),
  nine: computeAO(rasterForm(drawText('09'), 21)),
  rubble: computeAO(genRubble()),
};

/* re-rasterise the type-based formation once the display font lands */
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => {
    forms.nine = computeAO(rasterForm(drawText('09'), 21));
    if (ACTS[act].form === 'nine') fire(act, { refresh: true });
  });
}

/* ══ ACTS + IMPACT ENGINE ══════════════════════════════════════ */

/* side: which edge the DOM panel occupies (+1 right, −1 left, 0 overlay) —
   the camera frames the formation into whatever area the panel leaves free */
const ACTS = [
  { form: 'wall',   expo: 1.0,  side: 0,  cam: { x: 0,   y: 0.4, lookY: 0.2 } },
  { form: 'vs',     expo: 0.86, side: 1,  cam: { x: 2,   y: 0.2, lookY: 0 } },
  { form: 'fist',   expo: 0.86, side: -1, cam: { x: -2,  y: 0,   lookY: 0 } },
  { form: 'cage',   expo: 0.92, side: 1,  cam: { x: 2.5, y: 3.2, lookY: -0.8 } },
  { form: 'nine',   expo: 0.84, side: -1, cam: { x: -2,  y: 0,   lookY: 0 } },
  { form: 'rubble', expo: 0.95, side: 0,  cam: { x: 0,   y: 2.5, lookY: 0.6 } },
];
const TH = [0.14, 0.34, 0.52, 0.70, 0.88];

/* per-instance live state */
const curPos = new Float32Array(N * 3), curRot = new Float32Array(N * 4), curScl = new Float32Array(N);
const prevPos = new Float32Array(N * 3), prevRot = new Float32Array(N * 4), prevScl = new Float32Array(N);
const off = new Float32Array(N * 3), vel = new Float32Array(N * 3);
const delay = new Float32Array(N), dur = new Float32Array(N);
const settled = new Uint8Array(N);

let act = 0, home = forms.wall;
let t0 = -10, flightSpan = 0;
let kickEnv = 0;
const kickDir = new THREE.Vector3();
let expoFrom = 1, expoTo = 1;
const camFrom = { pos: new THREE.Vector3(0, 0, 46), look: new THREE.Vector3() };
const camTo = { pos: new THREE.Vector3(0, 0, 46), look: new THREE.Vector3() };

function computeCam(a, out) {
  const A = ACTS[a], F = forms[A.form];
  const tanV = Math.tan(camera.fov * Math.PI / 360);
  const tanH = tanV * camera.aspect;
  let z, lx = 0, ly;
  if (MOBILE && A.side !== 0) {
    // bottom sheet takes ~52% of the screen: frame into the top area
    const freeV = 0.46;
    z = Math.max(F.rw / (tanH * 0.94), F.rh / (tanV * freeV * 0.9));
    ly = F.cy - 0.5 * tanV * z;
  } else if (MOBILE) {
    // overlay act on a phone: fill the height, let the width bleed
    z = F.rh / (tanV * 0.8);
    ly = F.cy + A.cam.lookY;
  } else if (A.side !== 0) {
    // panel occupies ~36% of one edge: centre the formation in the rest
    const r = 0.36;
    z = Math.max(F.rw / ((1 - r) * tanH * 0.92), F.rh / (tanV * 0.85));
    lx = A.side * r * tanH * z;
    ly = F.cy + A.cam.lookY;
  } else {
    z = Math.max(F.rh / (tanV * 0.95), F.rw / (tanH * 0.95));
    ly = F.cy + A.cam.lookY;
  }
  out.pos.set(A.cam.x + lx * 0.3, A.cam.y + F.cy, z);
  out.look.set(lx, ly, 0);
}

const panels = [...document.querySelectorAll('.panel')];
let panelTimer = 0, hitTimer = 0;

function fire(newAct, o) {
  const opts = o || {};
  const A = ACTS[newAct];
  prevPos.set(curPos); prevRot.set(curRot); prevScl.set(curScl);
  home = forms[A.form];
  if (!opts.refresh) { off.fill(0); vel.fill(0); }   // punch state is baked into prev
  for (let m = 0; m < 3; m++) {                      // occlusion follows the new layout
    const at = meshes[m].geometry.getAttribute('aAO');
    at.array.set(home.ao.subarray(OFFSETS[m], OFFSETS[m] + COUNTS[m]));
    at.needsUpdate = true;
  }
  let span = 0;
  for (let i = 0; i < N; i++) {
    delay[i] = RM.on ? 0 : rnd[i] * 0.16 + ((i * 7) % 100) / 100 * 0.1;
    dur[i] = RM.on ? 1.15 : (opts.refresh ? 0.3 : 0.42 + rnd[(i + 3) % N] * 0.3);
    if (delay[i] + dur[i] > span) span = delay[i] + dur[i];
    settled[i] = 0;
  }
  flightSpan = span;
  t0 = NOW;
  camFrom.pos.copy(camera.position);
  camFrom.look.copy(camTo.look);
  computeCam(newAct, camTo);
  expoFrom = U.uExpo.value; expoTo = A.expo;

  if (!opts.initial && !opts.refresh && !RM.on) {
    kickEnv = 1;
    kickDir.set((rng() - 0.5) * 2, (rng() - 0.5) * 1.2, 0.6 + rng() * 0.5).normalize();
    postU.uShock.value = 0.9;
    postU.uFlash.value = 0.5;
    U.uHit.value.set((rng() - 0.5) * 8, forms[A.form].cy + (rng() - 0.5) * 5, 2);
    U.uHitAmp.value = 1;
    thud(1);
    document.body.classList.add('struck');
    document.body.classList.remove('hit');
    clearTimeout(hitTimer);
    requestAnimationFrame(() => document.body.classList.add('hit'));
    hitTimer = setTimeout(() => document.body.classList.remove('hit'), 420);
  }
  if (!opts.refresh) {
    clearTimeout(panelTimer);
    panelTimer = setTimeout(() => {
      panels.forEach(p => p.classList.toggle('on', +p.dataset.act === newAct));
    }, opts.initial || RM.on ? 0 : 70);
  }
  act = newAct;
  if (opts.initial) {
    // land already-formed: no flight, no zero-quaternion first frame
    curPos.set(home.pos); curRot.set(home.rot); curScl.set(home.scl);
    prevPos.set(home.pos); prevRot.set(home.rot); prevScl.set(home.scl);
    t0 = NOW - (span + 1);
  }
}

/* ── flight easing: whip out, overshoot, hard stop ────────────── */
function snapEase(t) {
  if (t <= 0) return 0; if (t >= 1) return 1;
  const c = 2.4, u = t - 1;
  return 1 + (c + 1) * u * u * u + c * u * u;
}
function softEase(t) { return t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t); }

/* ══ POINTER = PUNCH ═══════════════════════════════════════════ */
const ptr = { x: 0, y: 0, wx: 0, wy: 0, wz: 0, speed: 0, active: false };
const PV = new THREE.Vector3();
function ptrWorld(cx, cy) {
  PV.set((cx / innerWidth) * 2 - 1, -(cy / innerHeight) * 2 + 1, 0.5).unproject(camera);
  PV.sub(camera.position).normalize();
  const s = (0 - camera.position.z) / (PV.z || -1e-6);
  ptr.wx = camera.position.x + PV.x * s;
  ptr.wy = camera.position.y + PV.y * s;
  ptr.wz = 0;
}
addEventListener('pointermove', e => {
  const dx = e.clientX - ptr.x, dy = e.clientY - ptr.y;
  ptr.speed = Math.min(Math.hypot(dx, dy), 60);
  ptr.x = e.clientX; ptr.y = e.clientY;
  ptr.active = true;
  ptrWorld(e.clientX, e.clientY);
}, { passive: true });

const ringEl = document.getElementById('ring');
function punch(strength) {
  if (document.body.classList.contains('past')) return;
  const R = 9, px = ptr.wx, py = ptr.wy;
  for (let i = 0; i < N; i++) {
    const dx = curPos[i * 3] - px, dy = curPos[i * 3 + 1] - py, dz = curPos[i * 3 + 2];
    const d = Math.hypot(dx, dy, dz) || 1e-4;
    if (d < R) {
      const f = (1 - d / R); const k = f * f * strength * (8 + rnd[i] * 10);
      vel[i * 3] += dx / d * k;
      vel[i * 3 + 1] += dy / d * k + f * 2;
      vel[i * 3 + 2] += (dz / d + 0.7) * k * 0.5;
      settled[i] = 0;
    }
  }
  if (!RM.on) {
    postU.uShock.value = Math.max(postU.uShock.value, 0.32);
    kickEnv = Math.max(kickEnv, 0.3);
    kickDir.set((rng() - 0.5), (rng() - 0.5), 1).normalize();
    U.uHit.value.set(px, py, 0); U.uHitAmp.value = Math.max(U.uHitAmp.value, 0.5);
  }
  thud(0.55);
  if (ringEl) {
    ringEl.style.left = ptr.x + 'px'; ringEl.style.top = ptr.y + 'px';
    ringEl.classList.remove('go'); void ringEl.offsetWidth; ringEl.classList.add('go');
  }
}
canvas.addEventListener('pointerdown', e => {
  if (e.pointerType === 'mouse') { ptrWorld(e.clientX, e.clientY); punch(1); }
});
canvas.addEventListener('click', e => {
  if (!e.pointerType || e.pointerType !== 'mouse') { ptrWorld(e.clientX, e.clientY); punch(1); }
});

/* ══ SCROLL → THRESHOLDS ═══════════════════════════════════════ */
const track = document.getElementById('track');
const meterEl = document.getElementById('hud-meter');
let P = 0, lastFire = -10, meterStr = '';
const BLOCKS_ON = '▓', BLOCKS_OFF = '░';

function onScroll() {
  const trackH = track.offsetHeight;
  const span = Math.max(trackH - innerHeight, 1);
  P = Math.min(Math.max(scrollY / span, 0), 1);
  document.body.classList.toggle('past', scrollY > trackH - innerHeight * 0.35);

  let target = 0;
  for (let i = 0; i < TH.length; i++) {
    const h = (i + 1 === act) ? -0.008 : (i + 1 === act + 1 ? 0.008 : 0);
    if (P >= TH[i] + h) target = i + 1;
  }
  if (target !== act && NOW - lastFire > 0.22) { lastFire = NOW; fire(target); }

  const lo = act > 0 ? TH[act - 1] : 0, hi = act < TH.length ? TH[act] : 1;
  const stress = Math.min(Math.max((P - lo) / (hi - lo), 0), 1);
  const b = Math.round(stress * 10);
  const s = act >= 5
    ? 'STRESS ▓▓▓▓▓▓▓▓▓▓ MAX · SECT 05/05'
    : 'STRESS ' + BLOCKS_ON.repeat(b) + BLOCKS_OFF.repeat(10 - b) + ' ' +
      String(Math.round(stress * 100)).padStart(3, '0') + ' · SECT 0' + act + '/05';
  if (s !== meterStr && meterEl) { meterEl.textContent = s; meterStr = s; }
}
addEventListener('scroll', onScroll, { passive: true });

/* ══ SOUND — opt-in impact foley, synthesized ══════════════════ */
let AC = null, master = null, sndOn = false;
const sndBtn = document.getElementById('snd');
const sndState = document.getElementById('snd-state');
function thud(p) {
  if (!sndOn || !AC || RM.on) return;
  const t = AC.currentTime;
  const o = AC.createOscillator(), g = AC.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(85 + 45 * p, t);
  o.frequency.exponentialRampToValueAtTime(26, t + 0.3);
  g.gain.setValueAtTime(0.8 * p, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
  o.connect(g).connect(master); o.start(t); o.stop(t + 0.34);
  const nb = AC.createBuffer(1, AC.sampleRate * 0.16 | 0, AC.sampleRate);
  const ch = nb.getChannelData(0);
  for (let i = 0; i < ch.length; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / ch.length);
  const src = AC.createBufferSource(); src.buffer = nb;
  const bp = AC.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 0.8;
  bp.frequency.setValueAtTime(1500, t); bp.frequency.exponentialRampToValueAtTime(220, t + 0.14);
  const g2 = AC.createGain();
  g2.gain.setValueAtTime(0.5 * p, t);
  g2.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
  src.connect(bp).connect(g2).connect(master); src.start(t);
}
if (sndBtn) sndBtn.addEventListener('click', () => {
  if (!AC) {
    AC = new (window.AudioContext || window.webkitAudioContext)();
    master = AC.createGain(); master.gain.value = 0.65; master.connect(AC.destination);
  }
  sndOn = !sndOn;
  if (sndOn && AC.state === 'suspended') AC.resume();
  sndBtn.setAttribute('aria-pressed', String(sndOn));
  if (sndState) sndState.textContent = sndOn ? 'ON' : 'OFF';
  if (sndOn) thud(0.7);
});

/* notify form — front-of-house only */
const notify = document.getElementById('notify');
if (notify) notify.addEventListener('submit', e => {
  e.preventDefault();
  const done = notify.querySelector('.n-done');
  if (done) done.textContent = 'You’re on the wall. Watch your phone at 21:00, 25 SEP.';
  notify.reset();
});

/* ══ FRAME LOOP ════════════════════════════════════════════════ */
let NOW = performance.now() / 1000, lastT = NOW;
const dummy = new THREE.Object3D();
const QA = new THREE.Quaternion(), QB = new THREE.Quaternion();
let frameMs = 16, qLevel = 0;

function updateField(dt) {
  const tG = NOW - t0;
  const flying = tG < flightSpan + 0.05;
  const shove = ptr.active && ptr.speed > 2 && !document.body.classList.contains('past');
  const sR = 5.5, sF = Math.min(ptr.speed, 40) * (RM.on ? 0.25 : 1);
  const tremor = kickEnv > 0.02 && !RM.on;
  const kSpring = 15, cDamp = 6;

  for (let i = 0; i < N; i++) {
    const i3 = i * 3, i4 = i * 4;

    /* punch offset physics */
    let ox = off[i3], oy = off[i3 + 1], oz = off[i3 + 2];
    let vx = vel[i3], vy = vel[i3 + 1], vz = vel[i3 + 2];
    const activeOff = (ox * ox + oy * oy + oz * oz > 1e-5) || (vx * vx + vy * vy + vz * vz > 1e-5);

    if (shove) {
      const dx = curPos[i3] - ptr.wx, dy = curPos[i3 + 1] - ptr.wy;
      const d = Math.hypot(dx, dy, curPos[i3 + 2]);
      if (d < sR) {
        const f = (1 - d / sR);
        vx += dx / (d || 1e-4) * f * f * sF * dt * 3.2;
        vy += dy / (d || 1e-4) * f * f * sF * dt * 3.2;
        vz += f * sF * dt * 0.9;
        settled[i] = 0;
      }
    }

    if (!flying && settled[i] && !activeOff && !tremor) continue;

    if (activeOff || shove) {
      vx += (-kSpring * ox - cDamp * vx) * dt;
      vy += (-kSpring * oy - cDamp * vy) * dt;
      vz += (-kSpring * oz - cDamp * vz) * dt;
      ox += vx * dt; oy += vy * dt; oz += vz * dt;
      const m = Math.hypot(ox, oy, oz);
      if (m > 6) { ox *= 6 / m; oy *= 6 / m; oz *= 6 / m; }
      off[i3] = ox; off[i3 + 1] = oy; off[i3 + 2] = oz;
      vel[i3] = vx; vel[i3 + 1] = vy; vel[i3 + 2] = vz;
    }

    let px, py, pz, sc;
    if (flying) {
      const ti = Math.min(Math.max((tG - delay[i]) / dur[i], 0), 1);
      const e = RM.on ? softEase(ti) : snapEase(ti);
      px = prevPos[i3] + (home.pos[i3] - prevPos[i3]) * e;
      py = prevPos[i3 + 1] + (home.pos[i3 + 1] - prevPos[i3 + 1]) * e;
      pz = prevPos[i3 + 2] + (home.pos[i3 + 2] - prevPos[i3 + 2]) * e;
      if (!RM.on && ti > 0 && ti < 1) {
        const j = (1 - ti) * 0.5;
        px += Math.sin(NOW * 51 + i) * j; py += Math.sin(NOW * 47 + i * 2.1) * j;
      }
      QA.set(prevRot[i4], prevRot[i4 + 1], prevRot[i4 + 2], prevRot[i4 + 3]);
      QB.set(home.rot[i4], home.rot[i4 + 1], home.rot[i4 + 2], home.rot[i4 + 3]);
      QA.slerp(QB, e);
      sc = prevScl[i] + (home.scl[i] - prevScl[i]) * e;
      curRot[i4] = QA.x; curRot[i4 + 1] = QA.y; curRot[i4 + 2] = QA.z; curRot[i4 + 3] = QA.w;
      curScl[i] = sc;
      if (ti >= 1 && !activeOff) settled[i] = 1;
    } else {
      // hold = flight over: read home directly and write it back to cur,
      // so a flight skipped entirely (rAF gap longer than the flight span
      // in a throttled tab) can never freeze stale rotation/scale
      px = home.pos[i3]; py = home.pos[i3 + 1]; pz = home.pos[i3 + 2];
      QA.set(home.rot[i4], home.rot[i4 + 1], home.rot[i4 + 2], home.rot[i4 + 3]);
      sc = home.scl[i];
      curRot[i4] = QA.x; curRot[i4 + 1] = QA.y; curRot[i4 + 2] = QA.z; curRot[i4 + 3] = QA.w;
      curScl[i] = sc;
      if (!activeOff && !tremor) settled[i] = 1;
    }

    px += ox; py += oy; pz += oz;
    // curPos is the DISPLAYED position (offset included, tremor excluded) —
    // an impact captures it as-is, so shoved debris flies from where it was.
    curPos[i3] = px; curPos[i3 + 1] = py; curPos[i3 + 2] = pz;
    if (tremor) {
      const hx = px - U.uHit.value.x, hy = py - U.uHit.value.y;
      const fall = Math.exp(-Math.hypot(hx, hy) * 0.09) * kickEnv * 0.09;
      px += Math.sin(NOW * 63 + i * 1.7) * fall;
      py += Math.sin(NOW * 71 + i * 2.3) * fall;
    }

    dummy.position.set(px, py, pz);
    dummy.quaternion.copy(QA);
    dummy.scale.setScalar(sc);
    dummy.updateMatrix();
    const m = typeOf(i);
    meshes[m].setMatrixAt(i - OFFSETS[m], dummy.matrix);
  }
  for (const im of meshes) im.instanceMatrix.needsUpdate = true;
}

function updateCamera(dt, dtReal) {
  const ct = Math.min(Math.max((NOW - t0) / 0.62, 0), 1);
  const e = RM.on ? softEase(ct) : snapEase(ct);
  const px = camFrom.pos.x + (camTo.pos.x - camFrom.pos.x) * e;
  const py = camFrom.pos.y + (camTo.pos.y - camFrom.pos.y) * e;
  const pz = camFrom.pos.z + (camTo.pos.z - camFrom.pos.z) * e;
  const lx = camFrom.look.x + (camTo.look.x - camFrom.look.x) * e;
  const ly = camFrom.look.y + (camTo.look.y - camFrom.look.y) * e;
  camera.position.set(px, py, pz);
  let roll = 0;
  if (kickEnv > 0.001) {
    kickEnv *= Math.exp(-dtReal * 5.2);
    const j = Math.sin(NOW * 47) * Math.sin(NOW * 89 + 2);
    camera.position.addScaledVector(kickDir, kickEnv * 1.15 * (0.55 + 0.45 * j));
    roll = kickEnv * 0.028 * j;
    camera.fov = CFG.fov * (1 - kickEnv * 0.05);
    camera.updateProjectionMatrix();
  } else if (camera.fov !== CFG.fov) {
    camera.fov = CFG.fov; camera.updateProjectionMatrix();
  }
  camera.lookAt(lx, ly, 0);
  camera.rotation.z += roll;
  U.uExpo.value = expoFrom + (expoTo - expoFrom) * e;
}

function updateDust(dt) {
  const p = dustGeo.attributes.position;
  const a = p.array;
  for (let i = 0; i < CFG.dust; i++) {
    a[i * 3 + 1] -= dt * (0.35 + (i % 7) * 0.06);
    if (a[i * 3 + 1] < -20) a[i * 3 + 1] = 20;
  }
  p.needsUpdate = true;
}

function step(dt, dtR) {
  // decay envelopes run on TRUE elapsed time — with the clamped dt a
  // throttled tab (~1 fps rAF) would hold the impact heat, shock and
  // kick ~20x longer than designed. Physics keeps the clamp.
  const dtReal = dtR === undefined ? dt : dtR;
  postU.uT.value = NOW;
  postU.uShock.value *= Math.exp(-dtReal * 4.4);
  postU.uFlash.value *= Math.exp(-dtReal * 9);
  U.uHitAmp.value *= Math.exp(-dtReal * 3.2);
  updateField(dt);
  updateCamera(dt, dtReal);
  updateDust(dt);
}
function draw() {
  renderer.setRenderTarget(rt);
  renderer.render(scene, camera);
  renderer.setRenderTarget(null);
  renderer.render(postScene, postCam);
}

/* quality ladder — degrade once, stay down */
let fpsAcc = 0, fpsN = 0;
function ladder(ms) {
  fpsAcc += ms; fpsN++;
  if (fpsN < 110) return;
  const mean = fpsAcc / fpsN; fpsAcc = 0; fpsN = 0;
  if (mean < 26 || qLevel >= 3) return;
  qLevel++;
  if (qLevel === 1) { DPR = Math.min(DPR, 1.5); resize(); }
  else if (qLevel === 2) { CFG.samples = 0; resize(); }
  else if (qLevel === 3) { DPR = Math.min(DPR, 1.2); resize(); }
}

let rafId = 0;
function loop(t) {
  rafId = requestAnimationFrame(loop);
  NOW = t / 1000;
  const dtReal = NOW - lastT;
  const dt = Math.min(dtReal, 0.05);
  lastT = NOW;
  if (document.body.classList.contains('past') && scrollY > track.offsetHeight) return;
  const a = performance.now();
  step(dt, dtReal);
  draw();
  frameMs = performance.now() - a;
  // the ladder samples the DELIVERED frame time (vsync/GPU included),
  // not just JS cost — but never a throttled-tab gap
  if (dtReal < 0.25) ladder(dtReal * 1000);
}

/* ── resize ───────────────────────────────────────────────────── */
function resize() {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(DPR);
  renderer.setSize(innerWidth, innerHeight);
  rt.dispose(); rt = makeRT();
  postU.tD.value = rt.texture;
  postU.uRes.value.set(innerWidth * DPR, innerHeight * DPR);
  computeCam(act, camTo);
  if (NOW - t0 > 1) { camFrom.pos.copy(camTo.pos); camFrom.look.copy(camTo.look); }
  onScroll();
}
addEventListener('resize', () => { clearTimeout(resize._t); resize._t = setTimeout(resize, 150); });

/* ── boot ─────────────────────────────────────────────────────── */
onScroll();
{
  let a0 = 0;
  for (let i = 0; i < TH.length; i++) if (P >= TH[i]) a0 = i + 1;
  NOW = performance.now() / 1000; lastT = NOW;
  fire(a0, { initial: true });
  camFrom.pos.copy(camTo.pos); camFrom.look.copy(camTo.look);
  U.uExpo.value = ACTS[a0].expo;
  step(0.016);
  draw();                                   // one synchronous frame before the loop
}
window.FRACTURE_READY = true;
if (window.__fxWatch) clearTimeout(window.__fxWatch);
rafId = requestAnimationFrame(loop);

/* ── debug handle (verification harness reads this) ───────────── */
window.FX = {
  get p() { return P; },
  get act() { return act; },
  get frameMs() { return frameMs; },
  get quality() { return { qLevel, DPR, samples: CFG.samples, N }; },
  forms, meshes, camera, scene,
  fire: n => fire(n),
  punchAt: (x, y, s) => { ptr.x = x; ptr.y = y; ptrWorld(x, y); punch(s || 1); },
  bench: (n) => {
    const reps = n || 120, a = performance.now(), save = NOW;
    for (let i = 0; i < reps; i++) { NOW += 0.016; step(0.016); draw(); }
    const ms = (performance.now() - a) / reps;
    NOW = save;
    return ms;
  },
};

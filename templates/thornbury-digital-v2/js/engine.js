/* ══════════════════════════════════════════════════════════════════
   THORNBURY DIGITAL v2 — DETONATION CORE (three.js r180, WebGL2)

   One entity, three layers, one post pass:
   · CORE  — an icosphere deformed by two octaves of simplex noise in
             the vertex shader, normals rebuilt from tangent finite
             differences, Voronoi plate edges in the fragment shader that
             flash acid lime on impact, magenta fresnel rim.
   · SKIN  — 20k GPU points sampled on the same surface. Cursor
             acceleration detonates them outward along the normal plus a
             turbulence field; they re-assemble like filings on a magnet.
   · VOID  — a background quad: lime grid + dot lattice that parallax
             with the pointer, a magenta glow under the cursor, a scan band.
   · POST  — chromatic aberration (radial + scroll-directional), glitch
             row slices on shock, grain, scan lines, impact vignette.

   Every page of the site is a camera/entity state around the same core;
   the router tweens between them so navigation never re-creates it.
   Decays run on true elapsed time. Scroll shear is recomputed absolutely
   every frame from the smoothed velocity, never accumulated.
   ══════════════════════════════════════════════════════════════════ */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

/* ── GLSL ──────────────────────────────────────────────────────── */

// Simplex 3D noise — Ian McEwan / Ashima Arts (MIT), webgl-noise.
const SNOISE = /* glsl */`
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);
  const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);
  vec3 l=1.0-g;
  vec3 i1=min(g.xyz,l.zxy);
  vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;
  vec3 x2=x0-i2+C.yyy;
  vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;
  vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);
  vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;
  vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);
  vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;
  vec4 s1=floor(b1)*2.0+1.0;
  vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);
  vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z);
  vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
  m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
`;

// Precision-safe hashes (Dave Hoskins). Never fract(p.x*p.y) — see memory.
const HASH = /* glsl */`
float h21(vec2 p){vec3 p3=fract(vec3(p.xyx)*0.1031);p3+=dot(p3,p3.yzx+33.33);return fract((p3.x+p3.y)*p3.z);}
vec3 h33(vec3 p){p=fract(p*vec3(0.1031,0.1030,0.0973));p+=dot(p,p.yxz+33.33);return fract((p.xxy+p.yxx)*p.zyx);}
`;

const CORE_VERT = /* glsl */`
uniform float uTime, uShock, uVel, uPush;
uniform vec3 uMouseDir;
varying vec3 vN, vV, vObj;
varying float vDisp;
${SNOISE}
float dfield(vec3 q){
  float n1 = snoise(q*1.55 + vec3(0.0, uTime*0.22, uTime*0.07));
  float n2 = snoise(q*3.7  - vec3(uTime*0.35, 0.0, uTime*0.18));
  float d = n1*0.32 + n2*0.11;
  d *= 1.0 + uShock*2.4;
  d += uShock * 0.16 * sin(q.y*18.0 - uTime*22.0);
  float facing = max(0.0, dot(normalize(q), uMouseDir));
  d -= pow(facing, 10.0) * 0.5 * uPush;
  return d;
}
vec3 shear(vec3 p){
  p.x += p.y * uVel * 0.32;
  p.y *= 1.0 + abs(uVel) * 0.22;
  return p;
}
vec3 disp(vec3 q){ return shear(q + normalize(q) * dfield(q)); }
void main(){
  vec3 n = normalize(position);
  vec3 t = normalize(cross(n, abs(n.y) < 0.98 ? vec3(0.0,1.0,0.0) : vec3(1.0,0.0,0.0)));
  vec3 b = cross(n, t);
  float e = 0.025;
  float d0 = dfield(position);
  vec3 p0 = shear(position + n * d0);
  vec3 p1 = disp(position + t*e);
  vec3 p2 = disp(position + b*e);
  vec3 N = normalize(cross(p1 - p0, p2 - p0));
  if (dot(N, n) < 0.0) N = -N;
  vObj = position;
  vDisp = d0;
  vec4 mv = modelViewMatrix * vec4(p0, 1.0);
  vN = normalize(normalMatrix * N);
  vV = -mv.xyz;
  gl_Position = projectionMatrix * mv;
}
`;

const CORE_FRAG = /* glsl */`
precision highp float;
uniform float uTime, uShock, uVel, uQ;
uniform vec3 uLime, uMag;
varying vec3 vN, vV, vObj;
varying float vDisp;
${HASH}
vec2 voronoi(vec3 p){
  vec3 i = floor(p), f = fract(p);
  float f1 = 8.0, f2 = 8.0;
  for (int x=-1;x<=1;x++) for (int y=-1;y<=1;y++) for (int z=-1;z<=1;z++){
    vec3 g = vec3(float(x),float(y),float(z));
    vec3 o = h33(i + g);
    o = 0.5 + 0.4 * sin(uTime*0.6 + 6.2831*o);
    vec3 r = g + o - f;
    float d = dot(r,r);
    if (d < f1){ f2 = f1; f1 = d; } else if (d < f2){ f2 = d; }
  }
  return vec2(sqrt(f1), sqrt(f2));
}
void main(){
  vec3 N = normalize(vN);
  vec3 V = normalize(vV);
  float ndv = max(dot(N, V), 0.0);
  float fres = pow(1.0 - ndv, 3.0);
  vec3 L1 = normalize(vec3(0.55, 0.75, 0.6));
  vec3 L2 = normalize(vec3(-0.7, -0.3, 0.4));
  vec3 H1 = normalize(L1 + V);
  float spec = pow(max(dot(N, H1), 0.0), 72.0);
  float diff = max(dot(N, L1), 0.0);
  float rim2 = pow(max(dot(N, L2), 0.0), 2.0);
  float edge = 0.0;
  if (uQ > 0.5){
    vec2 vf = voronoi(vObj * 3.2);
    edge = 1.0 - smoothstep(0.0, 0.05 + uShock*0.03, vf.y - vf.x);
  }
  vec3 base = vec3(0.035, 0.035, 0.04);
  vec3 col = base * (0.4 + diff * 0.8);
  col += uMag * fres * (0.78 + uShock*0.7);
  col += uMag * rim2 * 0.16;
  col += vec3(0.9, 1.0, 0.85) * spec * 0.6;
  col += uLime * edge * (0.26 + uShock * 2.4 + max(uVel, 0.0) * 0.4);
  col += uLime * smoothstep(0.24, 0.6, vDisp) * 0.16 * (1.0 + uShock*3.0);
  gl_FragColor = vec4(col, 1.0);
}
`;

const SKIN_VERT = /* glsl */`
attribute float aSeed;
uniform float uTime, uShock, uBurst, uVel, uDpr, uSize;
uniform vec3 uLime, uMag;
varying vec3 vCol;
varying float vA;
${SNOISE}
vec3 nvec(vec3 p){ return vec3(snoise(p), snoise(p + vec3(31.7, 11.3, 5.1)), snoise(p + vec3(-7.3, 53.9, 19.2))); }
void main(){
  vec3 h = position;
  vec3 n = normalize(h);
  float d = snoise(h*1.55 + vec3(0.0, uTime*0.22, uTime*0.07)) * 0.32 * (1.0 + uShock*2.4);
  vec3 p = h + n * (d + 0.07 + 0.05 * sin(uTime*1.7 + aSeed*6.2831));
  float b = uBurst * (0.55 + aSeed*0.9);
  vec3 turb = nvec(h*1.3 + uTime*0.25 + aSeed*3.0);
  p += n * b * 2.8 + turb * b * 1.6;
  p.x += p.y * uVel * 0.32;
  p.y *= 1.0 + abs(uVel) * 0.22;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  float sz = (1.3 + aSeed*2.2 + uBurst*3.5) * uSize * uDpr;
  gl_PointSize = sz * (5.0 / max(-mv.z, 0.5));
  vCol = mix(uMag, uLime, smoothstep(0.08, 0.7, uBurst * (0.4 + aSeed)));
  vA = 0.5 + 0.5 * uBurst;
  gl_Position = projectionMatrix * mv;
}
`;

const SKIN_FRAG = /* glsl */`
precision highp float;
varying vec3 vCol;
varying float vA;
void main(){
  float r = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.12, r) * vA;
  gl_FragColor = vec4(vCol * a, a);
}
`;

const NDC_VERT = /* glsl */`
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = vec4(position.xy, 1.0, 1.0); }
`;

const BG_FRAG = /* glsl */`
precision highp float;
uniform float uTime, uScroll, uVel, uShock;
uniform vec2 uMouse, uRes;
uniform vec3 uLime, uMag;
varying vec2 vUv;
void main(){
  vec2 asp = vec2(uRes.x / uRes.y, 1.0);
  vec2 p = (vUv - 0.5) * asp;
  vec2 par = uMouse * 0.035;
  vec2 g = (p + par + vec2(0.0, uScroll * 0.08)) * 9.0;
  vec2 gf = abs(fract(g - 0.5) - 0.5) / fwidth(g);
  float line = 1.0 - min(min(gf.x, gf.y), 1.0);
  vec2 dg = fract((p - par * 2.0 + vec2(0.0, uScroll * 0.16)) * 22.0) - 0.5;
  float dots = smoothstep(0.075, 0.02, length(dg));
  float band = smoothstep(0.03, 0.0, abs(fract(vUv.y * 0.6 + uTime * 0.025 + uScroll * 0.1) - 0.5) - 0.47);
  vec2 mp = uMouse * asp * 0.5;
  float glow = exp(-dot(p - mp, p - mp) * 2.6);
  vec3 col = vec3(0.02, 0.02, 0.022);
  col += uLime * line * (0.085 + uShock * 0.25);
  col += uLime * dots * 0.16;
  col += uMag * glow * (0.10 + uShock * 0.3);
  col += uMag * band * 0.05;
  col *= 1.0 - dot(p, p) * 0.35;
  gl_FragColor = vec4(col, 1.0);
}
`;

const POST_VERT = /* glsl */`
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const POST_FRAG = /* glsl */`
precision highp float;
uniform sampler2D tDiffuse;
uniform float uTime, uVel, uShock, uFlash, uCA;
uniform vec2 uRes;
uniform vec3 uLime, uMag;
varying vec2 vUv;
${HASH}
void main(){
  vec2 uv = vUv;
  float row = floor(uv.y * 26.0);
  float seed = floor(uTime * 14.0);
  float g = step(1.0 - uShock * 0.55, h21(vec2(row, seed)));
  uv.x += (h21(vec2(seed, row)) - 0.5) * 0.12 * uShock * g;
  vec2 d = uv - 0.5;
  float r2 = dot(d, d);
  float ca = uCA + abs(uVel) * 0.010 + uShock * 0.018;
  vec2 off = d * ca * (1.0 + r2 * 4.0);
  vec2 voff = vec2(0.0, uVel * 0.012);
  vec3 col;
  col.r = texture2D(tDiffuse, uv + off + voff).r;
  col.g = texture2D(tDiffuse, uv).g;
  col.b = texture2D(tDiffuse, uv - off - voff).b;
  col += uMag * uShock * r2 * 0.5;
  col += uLime * uFlash * 0.10;
  col += (h21(uv * uRes + fract(uTime) * 917.0) - 0.5) * 0.055;
  col *= 0.955 + 0.045 * sin(uv.y * uRes.y * 1.4);
  col *= 1.0 - smoothstep(0.12, 0.85, r2) * 0.7;
  gl_FragColor = vec4(col, 1.0);
}
`;

/* ── engine ────────────────────────────────────────────────────── */

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export function createEngine({ stage, page = 'home', mobile = false, rm = false }) {
  THREE.ColorManagement.enabled = false; // brand hexes go to the canvas untouched

  const S = { shock: 0, burst: 0, vel: 0, push: 0, mx: 0, my: 0, flash: 0, lowered: false };
  const E = { state: S, page, ready: false, onFrame: null };

  const renderer = new THREE.WebGLRenderer({
    antialias: false, alpha: false, stencil: false, depth: true, powerPreference: 'high-performance',
  });
  if (!renderer.capabilities.isWebGL2) { renderer.dispose(); throw new Error('WebGL2 required'); }
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.setClearColor(0x050505, 1);
  const canvas = renderer.domElement;
  stage.appendChild(canvas);

  const Q = {
    dpr: Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 1.75),
    msaa: mobile ? 0 : 4,
    n: mobile ? 7000 : 20000,
    detail: mobile ? 20 : 48,
    q: 1, // plates on everywhere; the ladder removes them only below ~22 fps
  };

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 60);
  const group = new THREE.Group();
  scene.add(group);

  const U = {
    uTime: { value: 0 }, uShock: { value: 0 }, uBurst: { value: 0 }, uVel: { value: 0 }, uPush: { value: 0 },
    uMouseDir: { value: new THREE.Vector3(0, 0, 1) }, uQ: { value: Q.q }, uDpr: { value: Q.dpr }, uSize: { value: 1 },
    uLime: { value: new THREE.Color('#CCFF00') }, uMag: { value: new THREE.Color('#FF0055') },
  };

  // CORE
  const coreGeo = new THREE.IcosahedronGeometry(1.25, Q.detail);
  const core = new THREE.Mesh(coreGeo, new THREE.ShaderMaterial({ uniforms: U, vertexShader: CORE_VERT, fragmentShader: CORE_FRAG }));
  core.frustumCulled = false;
  group.add(core);

  // SKIN
  const n = Q.n;
  const home = new Float32Array(n * 3), seed = new Float32Array(n);
  const ga = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const th = ga * i;
    home[i * 3] = Math.cos(th) * r * 1.25;
    home[i * 3 + 1] = y * 1.25;
    home[i * 3 + 2] = Math.sin(th) * r * 1.25;
    seed[i] = Math.random();
  }
  const skinGeo = new THREE.BufferGeometry();
  skinGeo.setAttribute('position', new THREE.BufferAttribute(home, 3));
  skinGeo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  const skin = new THREE.Points(skinGeo, new THREE.ShaderMaterial({
    uniforms: U, vertexShader: SKIN_VERT, fragmentShader: SKIN_FRAG,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  skin.frustumCulled = false;
  group.add(skin);

  // VOID
  const quad = new THREE.PlaneGeometry(2, 2);
  const bgU = {
    uTime: U.uTime, uVel: U.uVel, uShock: U.uShock, uLime: U.uLime, uMag: U.uMag,
    uMouse: { value: new THREE.Vector2() }, uRes: { value: new THREE.Vector2(1, 1) }, uScroll: { value: 0 },
  };
  const bg = new THREE.Mesh(quad, new THREE.ShaderMaterial({ uniforms: bgU, vertexShader: NDC_VERT, fragmentShader: BG_FRAG, depthTest: false, depthWrite: false }));
  bg.frustumCulled = false;
  bg.renderOrder = -10;
  scene.add(bg);

  // POST
  let rt = makeRT(2, 2, Q.msaa);
  const postScene = new THREE.Scene();
  const postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const postU = {
    tDiffuse: { value: rt.texture }, uTime: U.uTime, uVel: U.uVel, uShock: U.uShock, uLime: U.uLime, uMag: U.uMag,
    uFlash: { value: 0 }, uRes: bgU.uRes, uCA: { value: rm ? 0.0012 : 0.0024 },
  };
  const post = new THREE.Mesh(quad, new THREE.ShaderMaterial({ uniforms: postU, vertexShader: POST_VERT, fragmentShader: POST_FRAG, depthTest: false, depthWrite: false }));
  post.frustumCulled = false;
  postScene.add(post);

  function makeRT(w, h, samples) {
    return new THREE.WebGLRenderTarget(w, h, { samples, depthBuffer: true, stencilBuffer: false });
  }

  /* ── views: every page is a state of the same core ─────────── */
  const VIEWS = {
    home:    { cam: [0, 0, 5.4],   look: [0, 0, 0],     core: mobile ? [0, 0.9, 0] : [1.0, 0.05, 0],       s: mobile ? 0.72 : 1.0,  spin: 0.12 },
    work:    { cam: [0, 0, 5.4],   look: [0, 0, 0],     core: mobile ? [0.2, 1.3, -1.2] : [2.2, -0.4, -1.7], s: mobile ? 0.6 : 0.85,  spin: 0.3 },
    studio:  { cam: [0, 0, 5.4],   look: [0, 0, 0],     core: [0, 0, 0],                                   s: mobile ? 1.5 : 1.9,   spin: 0.05 },
    contact: { cam: [0, 3.4, 3.6], look: [0, -0.2, 0],  core: mobile ? [0, 0.4, 0] : [0.6, -0.5, 0],       s: mobile ? 0.6 : 0.9,   spin: 0.22 },
  };
  const view = { cx: 0, cy: 0, cz: 5.4, lx: 0, ly: 0, lz: 0, ox: 0, oy: 0, oz: 0, s: 1, spin: 0.12 };
  function target(name) {
    const v = VIEWS[name] || VIEWS.home;
    return { cx: v.cam[0], cy: v.cam[1], cz: v.cam[2], lx: v.look[0], ly: v.look[1], lz: v.look[2], ox: v.core[0], oy: v.core[1], oz: v.core[2], s: v.s, spin: v.spin };
  }
  E.setPage = (name, immediate) => {
    E.page = name;
    const t = target(name);
    const g = window.gsap;
    if (immediate || !g || rm) { Object.assign(view, t); return; }
    g.killTweensOf(view);
    g.to(view, { ...t, duration: 1.35, ease: 'power3.inOut' });
  };
  Object.assign(view, target(page));

  E.burst = (v) => {
    if (rm) return;
    S.burst = Math.max(S.burst, v);
    S.shock = Math.max(S.shock, v * 0.8);
    S.flash = Math.max(S.flash, v);
  };

  /* ── pointer: acceleration is the trigger, not position ────── */
  const P = { x: innerWidth / 2, y: innerHeight / 2, px: innerWidth / 2, py: innerHeight / 2, vx: 0, vy: 0, active: false, last: 0 };
  addEventListener('pointermove', (e) => {
    const now = performance.now();
    if (now - P.last > 350) { P.px = e.clientX; P.py = e.clientY; P.vx = 0; P.vy = 0; }
    P.x = e.clientX; P.y = e.clientY; P.active = true; P.last = now;
  }, { passive: true });
  addEventListener('pointerdown', (e) => {
    P.x = e.clientX; P.y = e.clientY; P.active = true; P.last = performance.now();
    E.burst(1);
  }, { passive: true });
  document.addEventListener('pointerleave', () => { P.active = false; });
  addEventListener('blur', () => { P.active = false; });

  /* ── scroll velocity (viewport heights per second, smoothed) ── */
  let lastY = scrollY;
  E.resetScroll = () => { lastY = scrollY; S.vel = 0; };

  /* ── quality ladder: delivered rAF delta, two steps down ─────
     Step 1 drops resolution, MSAA and half the skin; step 2 (only if
     still slow) drops the Voronoi plates. Samples over 250 ms are a
     throttled tab, not a slow GPU, and never count. ──────────────── */
  const samples = [];
  let tier = 0;
  function sample(dt) {
    if (tier >= 2 || dt > 0.25) return;
    samples.push(dt);
    if (samples.length < 150) return;
    const sorted = samples.slice().sort((a, b) => a - b);
    const med = sorted[sorted.length >> 1];
    samples.length = 0;
    // 30 Hz displays and rAF-capped windows sit at 33 ms and must not degrade;
    // step 1 below ~27 fps, step 2 (plates off) only below ~22 fps.
    if (med > (tier === 0 ? 0.037 : 0.045)) lower();
  }
  function lower() {
    tier += 1;
    S.lowered = tier;
    if (tier === 1) {
      Q.dpr = Math.min(Q.dpr, 1.25);
      Q.msaa = 0;
      U.uDpr.value = Q.dpr;
      skinGeo.setDrawRange(0, Math.floor(n * 0.5));
      rt.dispose();
      rt = makeRT(2, 2, 0);
      postU.tDiffuse.value = rt.texture;
      resize();
    } else {
      U.uQ.value = 0;
    }
  }

  /* ── resize ─────────────────────────────────────────────────── */
  let sizedW = 0, sizedH = 0;
  function resize() {
    const w = stage.clientWidth || innerWidth;
    const h = stage.clientHeight || innerHeight;
    sizedW = w; sizedH = h;
    renderer.setPixelRatio(Q.dpr);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    rt.setSize(Math.floor(w * Q.dpr), Math.floor(h * Q.dpr));
    bgU.uRes.value.set(w * Q.dpr, h * Q.dpr);
  }
  let rzT = 0;
  addEventListener('resize', () => { clearTimeout(rzT); rzT = setTimeout(resize, 120); });

  /* ── step ───────────────────────────────────────────────────── */
  const tmpV = new THREE.Vector3(), tmpQ = new THREE.Quaternion();
  let time = 0;
  function step(dt) {
    const dd = Math.max(dt, 1 / 240);
    time += dt * (rm ? 0.25 : 1);
    U.uTime.value = time;

    // pointer kinematics
    const diag = Math.hypot(innerWidth, innerHeight) || 1;
    const vx = (P.x - P.px) / diag / dd, vy = (P.y - P.py) / diag / dd;
    const acc = Math.hypot((vx - P.vx) / dd, (vy - P.vy) / dd);
    const spd = Math.hypot(vx, vy);
    let imp = Math.max(0, (acc - 18) / 90);
    imp = Math.max(imp, ((spd - 2.6) / 4) * 0.7);
    imp = clamp(imp, 0, 1);
    if (rm) imp = 0;
    if (imp > S.shock) S.shock = imp;
    if (imp * 0.95 > S.burst) S.burst = imp * 0.95;
    P.px = P.x; P.py = P.y; P.vx = vx; P.vy = vy;

    const mx = (P.x / innerWidth) * 2 - 1, my = -((P.y / innerHeight) * 2 - 1);
    const k = 1 - Math.exp(-6 * dt);
    S.mx += (mx - S.mx) * k;
    S.my += (my - S.my) * k;
    S.push += ((P.active && !rm ? 1 : 0) - S.push) * (1 - Math.exp(-4 * dt));

    // scroll velocity
    const sv = (scrollY - lastY) / (innerHeight || 1) / dd;
    lastY = scrollY;
    const vt = rm ? 0 : clamp(sv * 0.3, -1, 1);
    S.vel += (vt - S.vel) * (1 - Math.exp(-7 * dt));
    bgU.uScroll.value = scrollY / (innerHeight || 1);

    // decays on TRUE elapsed time
    S.shock *= Math.exp(-3.8 * dt);
    S.burst *= Math.exp(-1.5 * dt);
    S.flash *= Math.exp(-9 * dt);

    // camera + entity — absolute from the view state, never incremental
    camera.position.set(view.cx + S.mx * 0.25, view.cy + S.my * 0.18, view.cz);
    camera.lookAt(view.lx, view.ly, view.lz);
    group.position.set(view.ox, view.oy, view.oz);
    group.scale.setScalar(view.s * (1 + S.shock * 0.05));
    group.rotation.y += dt * view.spin;
    group.rotation.x = Math.sin(time * 0.13) * 0.12 + S.my * 0.1;
    group.updateMatrixWorld();

    // cursor direction into the entity's object space (for the dent)
    tmpV.set(S.mx, S.my, 0.5).unproject(camera).sub(camera.position).normalize();
    if (Math.abs(tmpV.z) > 1e-4) {
      const tt = (group.position.z - camera.position.z) / tmpV.z;
      if (tt > 0) {
        tmpV.multiplyScalar(tt).add(camera.position).sub(group.position);
        if (tmpV.lengthSq() > 1e-6) {
          group.getWorldQuaternion(tmpQ).invert();
          U.uMouseDir.value.copy(tmpV.normalize().applyQuaternion(tmpQ));
        }
      }
    }

    U.uShock.value = S.shock;
    U.uBurst.value = S.burst;
    U.uVel.value = S.vel;
    U.uPush.value = S.push;
    postU.uFlash.value = S.flash;
    bgU.uMouse.value.set(S.mx, S.my);
  }

  function render() {
    renderer.setRenderTarget(rt);
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    renderer.render(postScene, postCam);
  }

  /* ── loop ───────────────────────────────────────────────────── */
  let last = performance.now(), frames = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = clamp((now - last) / 1000, 0.0001, 10);
    last = now;
    // a missed resize event (emulation, iOS toolbars) must never leave the
    // buffer sized for a viewport that no longer exists
    if ((++frames % 30) === 0 && (stage.clientWidth !== sizedW || stage.clientHeight !== sizedH)) resize();
    step(dt);
    render();
    sample(dt);
    if (E.onFrame) E.onFrame(S, dt);
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) last = performance.now(); });

  E.start = () => {
    resize();
    step(1 / 60);
    render(); // synchronous first paint — never blank behind the intro
    last = performance.now();
    requestAnimationFrame(frame);
    E.ready = true;
  };

  E.debug = { renderer, scene, camera, group, core, skin, view, Q };
  return E;
}

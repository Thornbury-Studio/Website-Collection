// EMBER — the coal.
//
// A WebGL lump of charcoal that cools as you scroll. It reads its heat from
// `window.EMBER.heat` (0..1), which main.js writes from the same scroll
// position that drives the temperature readout — so the object on screen and
// the number beside it are always describing the same thing.
//
// PERFORMANCE — "bake once, animate cheap" (the house rule):
// The craggy silhouette and the fissure network are both derived from 3D value
// noise evaluated ONCE per vertex at load and baked into the position buffer
// and a static `aCrack` attribute. Nothing recomputes noise per frame. The
// vertex shader is transform-only; the fragment shader is a smoothstep, one
// sin, and a fresnel term. Rotation and heat are uniforms, which cost nothing.
//
// Everything else is gated: no render when the canvas is off screen, none when
// the tab is hidden, and point count / pixel ratio drop on weaker hardware.

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js';

function visualRandom() {
  const bytes = new Uint32Array(1);
  window.crypto.getRandomValues(bytes);
  return bytes[0] / 0x100000000;
}

const host = document.getElementById('coal');
if (host && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  try { boot(host); } catch (e) { host.classList.add('is-dead'); }
}

/* ---------- one-time CPU noise bake (never runs per frame) ---------- */
function hash3(x, y, z) {
  const h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453123;
  return h - Math.floor(h);
}
function valueNoise3D(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const w = zf * zf * (3 - 2 * zf);
  const c000 = hash3(xi, yi, zi), c100 = hash3(xi + 1, yi, zi);
  const c010 = hash3(xi, yi + 1, zi), c110 = hash3(xi + 1, yi + 1, zi);
  const c001 = hash3(xi, yi, zi + 1), c101 = hash3(xi + 1, yi, zi + 1);
  const c011 = hash3(xi, yi + 1, zi + 1), c111 = hash3(xi + 1, yi + 1, zi + 1);
  const x00 = c000 * (1 - u) + c100 * u, x10 = c010 * (1 - u) + c110 * u;
  const x01 = c001 * (1 - u) + c101 * u, x11 = c011 * (1 - u) + c111 * u;
  const y0 = x00 * (1 - v) + x10 * v, y1 = x01 * (1 - v) + x11 * v;
  return (y0 * (1 - w) + y1 * w) * 2 - 1;
}
// The noise lattice is integer-spaced, so a unit sphere only spans a couple of
// cells at low frequencies — that produces a few giant lobes instead of a rough
// surface. These frequencies put roughly 5–36 cells across the object, and the
// offsets keep the lattice from lining up symmetrically about the origin.
function fbm(x, y, z) {
  return valueNoise3D(x * 2.6 + 11.3, y * 2.6 + 4.1, z * 2.6 + 7.7) * 0.36
       + valueNoise3D(x * 5.7 + 2.9, y * 5.7 + 19.4, z * 5.7 + 5.2) * 0.30
       + valueNoise3D(x * 11.3 + 31.7, y * 11.3 + 8.6, z * 11.3 + 23.1) * 0.22
       + valueNoise3D(x * 21.9 + 3.4, y * 21.9 + 27.8, z * 21.9 + 14.6) * 0.12;
}

// The fissure network. Cheap enough to run per fragment (six sins), and
// duplicated verbatim in GLSL below so the carved grooves and the glowing
// seams describe the same pattern.
function ridge(x, y, z) {
  const v = Math.sin(x * 7.0) * Math.sin(y * 6.3) * Math.sin(z * 7.7)
    + 0.5 * Math.sin(x * 15.0 + 1.7) * Math.sin(y * 13.1 + 0.4) * Math.sin(z * 16.3 + 2.2);
  return Math.max(0, 1 - Math.abs(v) * 4.5);
}

/* ---------- smooth normals over a non-indexed geometry ----------
   IcosahedronGeometry ships non-indexed, so computeVertexNormals() hands every
   triangle a flat face normal and the coal renders as a low-poly gem. Averaging
   the normals of every vertex that shares a position restores smooth shading.
   One pass at load; never touched again. */
function smoothNormals(geo) {
  const pos = geo.attributes.position;
  const nrm = geo.attributes.normal;
  const acc = new Map();
  const keyAt = i =>
    Math.round(pos.getX(i) * 1e4) + '|' +
    Math.round(pos.getY(i) * 1e4) + '|' +
    Math.round(pos.getZ(i) * 1e4);

  for (let i = 0; i < pos.count; i++) {
    const k = keyAt(i);
    let a = acc.get(k);
    if (!a) { a = [0, 0, 0]; acc.set(k, a); }
    a[0] += nrm.getX(i); a[1] += nrm.getY(i); a[2] += nrm.getZ(i);
  }
  for (let i = 0; i < pos.count; i++) {
    const a = acc.get(keyAt(i));
    const l = Math.hypot(a[0], a[1], a[2]) || 1;
    nrm.setXYZ(i, a[0] / l, a[1] / l, a[2] / l);
  }
  nrm.needsUpdate = true;
}

/* ---------- soft round sprite for the embers ---------- */
function dotTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 48;
  const g = c.getContext('2d');
  const rg = g.createRadialGradient(24, 24, 0, 24, 24, 24);
  rg.addColorStop(0, 'rgba(255,255,255,1)');
  rg.addColorStop(0.35, 'rgba(255,190,110,0.75)');
  rg.addColorStop(1, 'rgba(255,140,60,0)');
  g.fillStyle = rg;
  g.fillRect(0, 0, 48, 48);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function boot(host) {
  const tier = (() => {
    const w = window.innerWidth;
    const cores = navigator.hardwareConcurrency || 4;
    if (w < 700 || cores <= 4) return { detail: 3, points: 40, dpr: 1.25, aa: false };
    if (w < 1200 || cores <= 8) return { detail: 4, points: 70, dpr: 1.5, aa: true };
    return { detail: 4, points: 110, dpr: 2, aa: true };
  })();

  const renderer = new THREE.WebGLRenderer({ antialias: tier.aa, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, tier.dpr));
  renderer.setClearAlpha(0);
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 40);
  camera.position.set(0, 0.1, 3.5);

  /* ---------- the coal ---------- */
  const geo = new THREE.IcosahedronGeometry(1, tier.detail);
  const pos = geo.attributes.position;
  // The undisplaced sphere position travels to the fragment shader so the
  // glowing seams land in exactly the grooves carved here.
  const base = new Float32Array(pos.count * 3);

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    base[i * 3] = x; base[i * 3 + 1] = y; base[i * 3 + 2] = z;
    // Lumpy silhouette from fbm, then the fissure network carved back in.
    const d = 1 + fbm(x, y, z) * 0.24 - ridge(x, y, z) * 0.10;
    pos.setXYZ(i, x * d, y * d, z * d);
  }
  pos.needsUpdate = true;
  geo.setAttribute('aBase', new THREE.BufferAttribute(base, 3));
  geo.computeVertexNormals();
  smoothNormals(geo);

  const uniforms = {
    uHeat: { value: 1 },
    uTime: { value: 0 }
  };

  const coal = new THREE.Mesh(geo, new THREE.ShaderMaterial({
    uniforms,
    vertexShader: `
      attribute vec3 aBase;
      varying vec3 vBase;
      varying vec3 vN;
      varying vec3 vView;
      void main() {
        vBase = aBase;
        vN = normalize(normalMatrix * normal);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vView = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      precision mediump float;
      uniform float uHeat;
      uniform float uTime;
      varying vec3 vBase;
      varying vec3 vN;
      varying vec3 vView;

      // Same fissure network as the CPU-side ridge() that carved the grooves.
      // Evaluated per fragment so the seams stay hairline-thin instead of
      // interpolating into triangular blobs across each face.
      float ridge(vec3 p) {
        float v = sin(p.x * 7.0) * sin(p.y * 6.3) * sin(p.z * 7.7)
                + 0.5 * sin(p.x * 15.0 + 1.7) * sin(p.y * 13.1 + 0.4) * sin(p.z * 16.3 + 2.2);
        return max(0.0, 1.0 - abs(v) * 4.5);
      }

      void main() {
        vec3 N = normalize(vN);
        float fres = pow(1.0 - max(dot(N, normalize(vView)), 0.0), 3.0);

        float seam = ridge(vBase);
        // Hotter coal = the seams open wider and read brighter. Keep the band
        // tight or the whole surface glows and it stops looking like charcoal.
        float g = smoothstep(0.72 - uHeat * 0.34, 1.0, seam);
        g *= 0.80 + 0.20 * sin(uTime * 1.6 + seam * 9.0);

        vec3 cool = vec3(0.46, 0.05, 0.01);
        vec3 hot  = vec3(1.00, 0.68, 0.32);
        vec3 fire = mix(cool, hot, uHeat);

        // A fixed key light so the black form still reads as a solid object
        // rather than a silhouette.
        float lam = max(dot(N, normalize(vec3(0.45, 0.80, 0.55))), 0.0);
        vec3 ash = mix(vec3(0.10, 0.094, 0.090), vec3(0.038, 0.032, 0.030), uHeat);
        ash *= 0.30 + 0.70 * lam;

        vec3 col = ash + fire * g * (0.30 + uHeat * 2.6);
        col += fire * fres * (0.04 + uHeat * 0.30);

        gl_FragColor = vec4(col, 1.0);
      }
    `
  }));
  scene.add(coal);

  /* ---------- halo (cheap stand-in for bloom) ---------- */
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: dotTexture(),
    color: 0xe8531f,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
    depthTest: false
  }));
  // Keep this well inside the frustum — scaled past the viewport it stops
  // reading as a glow and just tints the whole canvas.
  halo.scale.setScalar(1.9);
  halo.position.z = -0.6;
  scene.add(halo);

  /* ---------- rising embers ---------- */
  const N = tier.points;
  const pts = new Float32Array(N * 3);
  const vel = new Float32Array(N);
  const spread = 1.55;
  for (let i = 0; i < N; i++) {
    pts[i * 3] = (visualRandom() - 0.5) * spread * 2;
    pts[i * 3 + 1] = -1.3 + visualRandom() * 3.6;
    pts[i * 3 + 2] = (visualRandom() - 0.5) * spread * 2;
    vel[i] = 0.0035 + visualRandom() * 0.007;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pts, 3));
  const pMat = new THREE.PointsMaterial({
    size: 0.055,
    map: dotTexture(),
    color: 0xffa451,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true
  });
  const embers = new THREE.Points(pGeo, pMat);
  scene.add(embers);

  /* ---------- sizing ---------- */
  function resize() {
    const r = host.getBoundingClientRect();
    const w = Math.max(1, r.width);
    const h = Math.max(1, r.height);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  /* ---------- run only when it is worth running ---------- */
  let onScreen = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(e => { onScreen = e[0].isIntersecting; }, { threshold: 0 }).observe(host);
  }

  let running = false;
  let heat = 1;
  const clock = new THREE.Clock();

  function frame() {
    if (!running) return;
    requestAnimationFrame(frame);
    if (!onScreen) return;

    const dt = Math.min(clock.getDelta(), 0.05);
    const target = window.EMBER ? window.EMBER.heat : 1;
    heat += (target - heat) * 0.06;

    uniforms.uHeat.value = heat;
    uniforms.uTime.value += dt;

    coal.rotation.y += dt * 0.16;
    coal.rotation.x = Math.sin(uniforms.uTime.value * 0.22) * 0.11;

    halo.scale.setScalar(1.7 + heat * 0.6);
    halo.material.opacity = 0.04 + heat * 0.16;

    // Embers rise faster and brighter off a hot coal, and barely lift off a cold one.
    const p = pGeo.attributes.position.array;
    const lift = 0.35 + heat * 1.4;
    for (let i = 0; i < N; i++) {
      p[i * 3 + 1] += vel[i] * lift;
      if (p[i * 3 + 1] > 2.3) {
        p[i * 3 + 1] = -1.3;
        p[i * 3] = (visualRandom() - 0.5) * spread * 2;
        p[i * 3 + 2] = (visualRandom() - 0.5) * spread * 2;
      }
    }
    pGeo.attributes.position.needsUpdate = true;
    pMat.opacity = 0.16 + heat * 0.78;

    renderer.render(scene, camera);
  }

  function start() { if (!running) { running = true; clock.getDelta(); requestAnimationFrame(frame); } }
  function stop() { running = false; }
  document.addEventListener('visibilitychange', () => { document.hidden ? stop() : start(); });

  host.classList.add('is-live');
  start();
}

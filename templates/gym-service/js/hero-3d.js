// FORGE hero — Three.js WebGL centerpiece: a distorted, glowing icosahedron.
// Loaded as a native ES module directly from the jsdelivr CDN — no build
// step, no bundler.
//
// PERFORMANCE STRATEGY — "bake once, animate cheap":
// The organic noise-displaced shape looks expensive but isn't computed live.
// The noise is evaluated ONCE per vertex at page load (a few thousand JS
// function calls, negligible), baked directly into the geometry's position
// buffer. The per-frame vertex shader does only a single sin() per vertex
// for a subtle wobble, plus rotation/scale which are transform-only and
// cost nothing extra. The fragment shader is a plain fresnel glow — no
// noise, no loops. The visual result reads as "continuously simulated
// organic motion"; the actual per-frame GPU cost is near-zero.
//
// Device-tier scaling reduces particle count and pixel ratio on
// lower-power hardware — same design, cheaper to draw.

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js';

/* ---------- one-time CPU noise bake (not used per-frame) ---------- */
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
  return (y0 * (1 - w) + y1 * w) * 2 - 1; // -1..1
}

function bakeDisplacedGeometry(radius, detail, amp) {
  const geometry = new THREE.IcosahedronGeometry(radius, detail);
  const pos = geometry.attributes.position;
  const nrm = geometry.attributes.normal;
  const bump = new Float32Array(pos.count);

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const n = valueNoise3D(x * 1.6, y * 1.6, z * 1.6);
    bump[i] = n;
    const nx = nrm.getX(i), ny = nrm.getY(i), nz = nrm.getZ(i);
    pos.setXYZ(i, x + nx * n * amp, y + ny * n * amp, z + nz * n * amp);
  }
  pos.needsUpdate = true;
  // deliberately NOT recomputing normals: keeping the original sphere
  // normals against the displaced surface is what gives the soft, blurry
  // glow look (matches the original live-shader version's appearance)
  // rather than a crisp faceted/wireframe look.
  geometry.setAttribute('aBump', new THREE.BufferAttribute(bump, 1));
  return geometry;
}

/* ---------- cheap per-frame shaders (no noise) ---------- */
const VERTEX = `
  uniform float uTime;
  attribute float aBump;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying float vBump;

  void main() {
    vBump = aBump;
    // a single sin() per vertex — near-free compared to per-frame noise
    float wobble = sin(uTime * 0.6 + position.x * 1.8 + position.y * 1.3) * 0.02;
    vec3 displaced = position + normal * wobble;
    vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
    vViewPosition = -mvPosition.xyz;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const FRAGMENT = `
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying float vBump;
  uniform vec3 uColor;
  uniform vec3 uDark;

  void main() {
    vec3 viewDir = normalize(vViewPosition);
    float fresnel = pow(1.0 - max(dot(normalize(vNormal), viewDir), 0.0), 2.4);
    vec3 col = mix(uDark, uColor, clamp(fresnel + vBump * 0.2, 0.0, 1.0));
    float alpha = clamp(fresnel * 0.85 + 0.12 + vBump * 0.05, 0.0, 1.0);
    gl_FragColor = vec4(col, alpha);
  }
`;

function getDeviceTier() {
  const cores = navigator.hardwareConcurrency || 4;
  const mem = navigator.deviceMemory || 4;
  const isMobileUA = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
  const smallViewport = window.matchMedia('(max-width: 760px)').matches;
  const low = cores <= 4 || mem <= 4 || isMobileUA || smallViewport;
  return low ? 'low' : 'high';
}

function initHero3D(canvas) {
  if (!canvas) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const heroSection = document.getElementById('top');
  const tier = getDeviceTier();

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: tier !== 'low' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, tier === 'low' ? 1.5 : 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.set(0, 0, 6.4);

  // detail is exponential (20 * 4^detail faces) — 4 gives ~5,120 triangles,
  // baked once below, so this cost is paid a single time, not per frame.
  const geometry = bakeDisplacedGeometry(2.05, 4, 0.38);
  const material = new THREE.ShaderMaterial({
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(0xd4ff3f) },
      uDark: { value: new THREE.Color(0x14150f) },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  // ambient particle field surrounding the core — fewer on low-power devices
  const particleCount = tier === 'low' ? 60 : 130;
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    const r = 3.6 + Math.random() * 2.6;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi) * 0.5;
  }
  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particleMat = new THREE.PointsMaterial({
    color: 0xd4ff3f,
    size: 0.03,
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const points = new THREE.Points(particleGeo, particleMat);
  scene.add(points);

  const mouse = { x: 0, y: 0 };
  window.addEventListener('mousemove', (e) => {
    mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
    mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;
    renderer.setSize(rect.width, rect.height, false);
    camera.aspect = rect.width / rect.height;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  // fade + settle as the hero scrolls out of view. Uses ScrollTrigger's own
  // scroll() rather than window.scrollY, which does not track real position
  // once ScrollSmoother is driving the page.
  let scrollFactor = 1;
  function updateFade(scrollY) {
    if (!heroSection) return;
    const heroH = heroSection.offsetHeight || window.innerHeight;
    const p = Math.min(1, Math.max(0, scrollY / (heroH * 0.85)));
    scrollFactor = 1 - p;
    canvas.style.opacity = String(Math.max(0.12, scrollFactor));
  }

  const clock = new THREE.Clock();

  function renderFrame() {
    const t = clock.getElapsedTime();
    material.uniforms.uTime.value = t;
    const breathe = 1 + Math.sin(t * 0.55) * 0.045;
    mesh.scale.setScalar(breathe * (0.82 + scrollFactor * 0.18));
    mesh.rotation.y = t * 0.16 + mouse.x * 0.4;
    mesh.rotation.x = t * 0.07 + mouse.y * 0.25;
    points.rotation.y = t * 0.04;
    points.rotation.x = mouse.y * 0.1;
    renderer.render(scene, camera);
  }

  if (reduced) {
    renderFrame();
    return;
  }

  let rafId = null;
  let tabHidden = false;

  function loop() {
    renderFrame();
    rafId = requestAnimationFrame(loop);
  }

  function syncLoop() {
    const shouldRun = scrollFactor > 0.02 && !tabHidden;
    if (shouldRun && rafId === null) {
      loop();
    } else if (!shouldRun && rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  document.addEventListener('visibilitychange', () => {
    tabHidden = document.hidden;
    syncLoop();
  });

  if (typeof ScrollTrigger !== 'undefined') {
    ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        updateFade(self.scroll());
        syncLoop();
      },
    });
  } else {
    window.addEventListener('scroll', () => {
      updateFade(window.scrollY);
      syncLoop();
    }, { passive: true });
  }

  loop();
}

const heroCanvas = document.getElementById('hero-canvas');
if (heroCanvas) initHero3D(heroCanvas);

// FORGE hero — Three.js WebGL centerpiece: a distorted, glowing icosahedron
// driven by a custom GLSL noise-displacement + fresnel shader. Loaded as a
// native ES module directly from the jsdelivr CDN — no build step, no bundler.
//
// The simplex noise function below is the standard Ashima Arts / Ian McEwan
// "webgl-noise" implementation (MIT License), used essentially unmodified —
// it's a ubiquitous math utility, not a media asset.

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js';

const NOISE_GLSL = `
  vec3 mod289(vec3 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
  vec4 mod289(vec4 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
  vec4 permute(vec4 x){ return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v){
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    i = mod289(i);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }
`;

const VERTEX = `
  ${NOISE_GLSL}
  uniform float uTime;
  uniform float uAmp;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying float vNoise;

  void main() {
    float n = snoise(position * 1.3 + vec3(0.0, 0.0, uTime * 0.18));
    vNoise = n;
    vec3 displaced = position + normal * (n * uAmp);
    vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
    vViewPosition = -mvPosition.xyz;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const FRAGMENT = `
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying float vNoise;
  uniform vec3 uColor;
  uniform vec3 uDark;

  void main() {
    vec3 viewDir = normalize(vViewPosition);
    float fresnel = pow(1.0 - max(dot(normalize(vNormal), viewDir), 0.0), 2.4);
    vec3 col = mix(uDark, uColor, clamp(fresnel + vNoise * 0.2, 0.0, 1.0));
    float alpha = clamp(fresnel * 0.85 + 0.12 + vNoise * 0.05, 0.0, 1.0);
    gl_FragColor = vec4(col, alpha);
  }
`;

function initHero3D(canvas) {
  if (!canvas) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const heroSection = document.getElementById('top');

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.set(0, 0, 6.4);

  // detail is exponential (20 * 4^detail faces) — 4 gives ~5,120 triangles,
  // plenty for organic-looking noise displacement without tanking the frame rate
  const geometry = new THREE.IcosahedronGeometry(2.05, 4);
  const material = new THREE.ShaderMaterial({
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    uniforms: {
      uTime: { value: 0 },
      uAmp: { value: 0.38 },
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

  // ambient particle field surrounding the core
  const particleCount = 130;
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

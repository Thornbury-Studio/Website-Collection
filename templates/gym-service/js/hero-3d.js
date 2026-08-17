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

function visualRandom() {
  const bytes = new Uint32Array(1);
  window.crypto.getRandomValues(bytes);
  return bytes[0] / 0x100000000;
}

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

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const n = valueNoise3D(x * 2.2, y * 2.2, z * 2.2);
    // Displace RADIALLY, not along the vertex normal. IcosahedronGeometry is
    // non-indexed, so triangles sharing a corner hold separate copies of it;
    // along per-face normals those copies drift apart and the hull splits into
    // floating shards. The radial direction is a pure function of position, so
    // every copy of a corner moves identically and the hull stays welded.
    const len = Math.hypot(x, y, z) || 1;
    const d = 1 + (n * amp) / len;
    pos.setXYZ(i, x * d, y * d, z * d);
  }
  pos.needsUpdate = true;
  // Non-indexed geometry means this assigns one normal per face, which is
  // exactly what is wanted here: crisp facets that catch the key light
  // individually and give the mass a readable, machined surface.
  geometry.computeVertexNormals();
  return geometry;
}

/* ---------- cheap per-frame shaders (no noise) ----------
   The solid and the edge overlay must apply an identical per-vertex wobble or
   the wireframe slides off the surface it is drawing, so both start from this
   same displacement expression. */
const DISPLACE = `
  float wobbleAmount(vec3 p, float t) {
    return sin(t * 0.6 + p.x * 1.8 + p.y * 1.3) * 0.02;
  }
`;

const VERTEX = `
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  ${DISPLACE}

  void main() {
    // a single sin() per vertex — near-free compared to per-frame noise
    vec3 displaced = position + normalize(position) * wobbleAmount(position, uTime);
    vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
    vViewPosition = -mvPosition.xyz;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

/* Opaque, front-faces only, depth-tested: the silhouette is the point. The
   previous material was additive and double-sided, so every fragment summed
   light through the whole volume in both directions and the accent colour
   clipped to flat lime across the entire shape — a glowing blob with no
   surface. Here the accent is spent only on the rim and the lit facet
   highlights, and the body stays graphite. */
const FRAGMENT = `
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  uniform vec3 uAccent;
  uniform vec3 uBody;

  void main() {
    vec3 N = normalize(vNormal);
    vec3 V = normalize(vViewPosition);
    vec3 L = normalize(vec3(-0.45, 0.72, 0.55));

    float lambert = max(dot(N, L), 0.0);
    float fill    = 0.5 + 0.5 * dot(N, normalize(vec3(0.35, -0.55, 0.42)));
    float fresnel = pow(1.0 - max(dot(N, V), 0.0), 2.2);

    // Dark metal LIT by the accent, rather than a body coloured with it: the
    // graphite carries only ambient, and every lime contribution arrives as
    // light. Facets square-on to the camera still catch the key, so the mass
    // reads solid instead of hollowing out into a black centre.
    // Whitening the key a little stops the lit facets reading as moulded green
    // plastic; the accent stays pure in the rim, where it is doing brand work.
    vec3 keyColor = mix(uAccent, vec3(1.0), 0.18);

    vec3 col = uBody * (0.45 + fill * 0.55);
    col += keyColor * lambert * 0.40;
    col += uAccent * fresnel * 0.45;
    col += vec3(1.0) * pow(lambert, 24.0) * 0.22;  // tight spec, keeps edges honest
    gl_FragColor = vec4(col, 1.0);
  }
`;

const EDGE_VERTEX = `
  uniform float uTime;
  varying float vFade;
  ${DISPLACE}

  void main() {
    vec3 displaced = position + normalize(position) * wobbleAmount(position, uTime);
    vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
    vFade = smoothstep(-2.8, 2.0, mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const EDGE_FRAGMENT = `
  uniform vec3 uAccent;
  varying float vFade;

  void main() {
    gl_FragColor = vec4(uAccent, 0.10 + vFade * 0.42);
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

  // detail is exponential (20 * 4^detail faces). 3 gives 1,280 — coarse enough
  // that individual facets stay legible as facets at hero size, fine enough to
  // still read as a mass rather than a die. Baked once below, so the noise cost
  // is paid a single time, not per frame.
  const ACCENT = 0xd4ff3f;
  const geometry = bakeDisplacedGeometry(2.0, 3, 0.30);
  const uTime = { value: 0 };

  const material = new THREE.ShaderMaterial({
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    uniforms: {
      uTime,
      uAccent: { value: new THREE.Color(ACCENT) },
      uBody: { value: new THREE.Color(0x2b2f26) },
    },
    // Pushed a touch away from the camera in depth only, so the edge overlay
    // below lands cleanly on the surface instead of z-fighting it.
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  });
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  // Structural edge overlay — depth-tested against the solid, so only the
  // facets actually facing the viewer draw and the object reads as opaque.
  const edges = new THREE.LineSegments(
    new THREE.WireframeGeometry(geometry),
    new THREE.ShaderMaterial({
      vertexShader: EDGE_VERTEX,
      fragmentShader: EDGE_FRAGMENT,
      uniforms: { uTime, uAccent: { value: new THREE.Color(ACCENT) } },
      transparent: true,
      depthWrite: false,
    })
  );
  mesh.add(edges);

  // ambient particle field surrounding the core — fewer on low-power devices
  const particleCount = tier === 'low' ? 60 : 130;
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    const r = 3.6 + visualRandom() * 2.6;
    const theta = visualRandom() * Math.PI * 2;
    const phi = Math.acos(visualRandom() * 2 - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi) * 0.5;
  }
  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particleMat = new THREE.PointsMaterial({
    color: ACCENT,
    size: 0.03,
    transparent: true,
    opacity: 0.38,
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

  // Fade and settle as the hero scrolls out of view. ScrollTrigger keeps this
  // synchronized with native scrolling while the renderer pauses offscreen.
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
  let contextLost = false;

  /* Chrome only keeps a limited number of live WebGL contexts per process and
     drops the oldest when it runs over — which is exactly what happens to a
     visitor who opens several of these templates in tabs. Three.js already
     calls preventDefault() on the lost event and re-initialises GL state when
     the browser hands the context back, but it does not know about this loop,
     so without these two listeners the canvas keeps burning frames while it is
     dead and stays blank after a restore. */
  canvas.addEventListener('webglcontextlost', () => {
    contextLost = true;
    canvas.classList.add('is-context-lost');
    syncLoop();
  }, false);

  canvas.addEventListener('webglcontextrestored', () => {
    contextLost = false;
    canvas.classList.remove('is-context-lost');
    resize();
    syncLoop();
  }, false);

  function loop() {
    renderFrame();
    rafId = requestAnimationFrame(loop);
  }

  function syncLoop() {
    const shouldRun = scrollFactor > 0.02 && !tabHidden && !contextLost;
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

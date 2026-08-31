/* ═══════════════════════════════════════════════════════════════════════════
   CANDELA — the instrument on the stand.

   One object, four materials, and a viewer who is allowed to pick it up.
   Everything here serves material truth: the environment is a real photo
   studio (soft rectangles at real distances, because a brushed surface can
   only show you a highlight it is actually reflecting), the glass has
   thickness so it bends what is behind it, and the metal's roughness is
   never uniform — uniform roughness is the single most reliable tell that
   a surface was described in a shader rather than machined.

   Pin discipline: the three.js URL below must match the rewritten specifier
   at the top of js/vendor/GLTFLoader.js, DRACOLoader.js and
   BufferGeometryUtils.js. Two copies of three break every instanceof.
   ═══════════════════════════════════════════════════════════════════════════ */

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";
import { GLTFLoader } from "./vendor/GLTFLoader.js";
import { DRACOLoader } from "./vendor/DRACOLoader.js";

const canvas = document.getElementById("gl");
const stage = document.getElementById("stage");
if (canvas && stage) boot();

function boot() {
  const COARSE = matchMedia("(pointer: coarse)").matches;
  const SMALL = matchMedia("(max-width: 820px)").matches;
  const MOBILE = COARSE && SMALL;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");

  const CFG = {
    dprCap: MOBILE ? 1.6 : 1.9,
    fov: MOBILE ? 38 : 30,
    // the transmission pass renders the scene a second time; phones opt out
    transmission: !MOBILE,
    shadows: true,
    shadowSize: MOBILE ? 1024 : 2048,
  };

  /* ── renderer ─────────────────────────────────────────────────────────
     Construction throws on a machine with no WebGL2; boot.js is watching
     for CANDELA_READY and folds the page to the static sheet if we never
     announce ourselves. */
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas, antialias: !MOBILE, alpha: true, powerPreference: "high-performance",
    });
  } catch (err) {
    fail("webgl");
    return;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, CFG.dprCap));
  // Product viewers want tonal honesty over filmic drama — Khronos PBR
  // Neutral keeps the leather black and the chrome white without crushing
  // the specular roll-off the way ACES does on small bright highlights.
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.shadowMap.enabled = CFG.shadows;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  canvas.addEventListener("webglcontextlost", (e) => { e.preventDefault(); fail("context"); });

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(CFG.fov, 1, 0.05, 100);
  const target = new THREE.Vector3(0, 0, 0);

  /* ── the studio ───────────────────────────────────────────────────────
     A procedural environment baked to a PMREM. No .hdr file to ship and no
     new CSP host: the "room" is a dark surround with four bright rectangles
     in it, which is what a product studio physically is. The rectangles
     matter more than their brightness — a long softbox is what draws the
     long specular streak down a brushed plate, and a point light never
     will. Pattern per PATTERNS.md "reflective caste needs a real env map". */
  function studio() {
    const env = new THREE.Scene();

    // surround: vertical gradient, brighter overhead, near-black at the floor
    const g = document.createElement("canvas");
    g.width = 4; g.height = 128;
    const gx = g.getContext("2d");
    const grad = gx.createLinearGradient(0, 0, 0, 128);
    grad.addColorStop(0.00, "#5a5f68");
    grad.addColorStop(0.42, "#23262c");
    grad.addColorStop(0.72, "#0d0e11");
    grad.addColorStop(1.00, "#050506");
    gx.fillStyle = grad; gx.fillRect(0, 0, 4, 128);
    const domeTex = new THREE.CanvasTexture(g);
    domeTex.colorSpace = THREE.SRGBColorSpace;
    domeTex.mapping = THREE.EquirectangularReflectionMapping;
    env.background = domeTex;

    const panel = (w, h, color, pos, look) => {
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(w, h),
        new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(...color), side: THREE.DoubleSide })
      );
      m.position.set(...pos);
      m.lookAt(...(look || [0, 0, 0]));
      env.add(m);
      return m;
    };

    /* Panel energy is deliberately modest. The first pass ran the key at 7.4
       and the top plate clipped to flat white — a saturated surface cannot
       show a brush stroke, so every bit of roughness detail was thrown away
       to win an exposure fight nobody asked for. Aluminium wants to sit
       around 0.5–0.85, with the streaks doing the rest. */
    // key: tall softbox, camera-right and forward — draws the main streak
    panel(3.2, 7.0, [2.6, 2.54, 2.44], [6.4, 2.4, 3.4]);
    // top: broad overhead diffusion — puts a wide sheen on the top plate
    panel(9.0, 5.0, [1.55, 1.53, 1.48], [0.4, 6.6, 0.6]);
    // fill: cool, low and left — keeps the shadow side legible, not grey
    panel(5.0, 4.0, [0.42, 0.50, 0.68], [-6.2, 0.6, 1.4]);
    // rim: behind and high, clips the top edges so the silhouette separates
    panel(4.4, 2.2, [2.1, 2.06, 2.0], [-1.6, 3.6, -6.0]);
    // a dim floor bounce so the underside is not a void
    panel(9.0, 9.0, [0.16, 0.16, 0.18], [0, -3.2, 0], [0, 1, 0]);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const rt = pmrem.fromScene(env, 0.015);
    pmrem.dispose();
    domeTex.dispose();
    env.traverse((o) => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); } });
    return rt.texture;
  }

  const envMap = studio();
  scene.environment = envMap;

  /* ── brushed roughness ────────────────────────────────────────────────
     The Blender source had the brush as a stretched-noise roughness node;
     procedural nodes do not survive a glTF export, and a flat 0.30 metal
     reads as plastic chrome. This redraws the brush at runtime as literal
     strokes — which is what brushing a plate actually is — and costs no
     bytes. The UV islands are smart-projected, so each face gets its own
     stroke direction; that is correct, machined parts do not share a grain. */
  function brushedRoughness(size = 1024) {
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const x = c.getContext("2d");
    x.fillStyle = "#e8e8e8";
    x.fillRect(0, 0, size, size);
    for (let i = 0; i < size * 4; i++) {
      const y = Math.random() * size;
      const v = Math.round(150 + Math.random() * 105);
      x.strokeStyle = `rgba(${v},${v},${v},${0.05 + Math.random() * 0.12})`;
      x.lineWidth = 0.5 + Math.random() * 1.8;
      x.beginPath();
      x.moveTo(0, y);
      // a hair of wander stops the strokes reading as a scanline pattern
      x.bezierCurveTo(size * 0.33, y + (Math.random() - 0.5) * 2.2,
                      size * 0.66, y + (Math.random() - 0.5) * 2.2, size, y);
      x.stroke();
    }
    // low-frequency blotch: real plates polish unevenly across their span
    for (let i = 0; i < 26; i++) {
      const r = size * (0.12 + Math.random() * 0.3);
      const gx2 = x.createRadialGradient(Math.random() * size, Math.random() * size, 0,
                                         Math.random() * size, Math.random() * size, r);
      gx2.addColorStop(0, `rgba(255,255,255,${0.05 + Math.random() * 0.07})`);
      gx2.addColorStop(1, "rgba(255,255,255,0)");
      x.fillStyle = gx2;
      x.fillRect(0, 0, size, size);
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    return t;
  }
  const brushTex = brushedRoughness(MOBILE ? 512 : 1024);

  /* ── model ────────────────────────────────────────────────────────────── */
  const root = new THREE.Group();
  scene.add(root);

  const draco = new DRACOLoader();
  draco.setDecoderPath("js/vendor/draco/");
  const loader = new GLTFLoader();
  loader.setDRACOLoader(draco);

  let model = null;
  let ready = false;
  const partsByMaterial = new Map();

  loader.load(
    "assets/candela.glb",
    (gltf) => {
      model = gltf.scene;

      // normalise: fit the subject to one unit across and sit it on origin
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const centre = box.getCenter(new THREE.Vector3());
      const k = 1 / Math.max(size.x, size.y, size.z);
      model.scale.setScalar(k);
      model.position.set(-centre.x * k, -centre.y * k, -centre.z * k);
      // half-diagonal of the normalised box — the rotation-safe fit radius
      fitRadius = 0.5 * size.length() * k;

      model.traverse((o) => {
        if (!o.isMesh) return;
        o.castShadow = true;
        o.receiveShadow = true;
        const m = o.material;
        if (!m) return;
        m.envMap = envMap;
        m.envMapIntensity = 1.35;

        const name = m.name || "";
        if (!partsByMaterial.has(name)) partsByMaterial.set(name, []);
        partsByMaterial.get(name).push(o);

        if (name === "CandelaMetal") {
          // real brushed aluminium is nearer 0.66 than the 0.80 the Blender
          // material carried; at 0.80 under a studio it just reads as chrome
          m.color.setRGB(0.66, 0.665, 0.685);
          m.roughness = 0.42;
          m.roughnessMap = brushTex;
          m.roughnessMap.repeat.set(2.4, 2.4);
          m.envMapIntensity = 1.05;
          // the KHR tangent comes off arbitrary smart-project UVs, so a
          // strong anisotropy fights the stroke map instead of helping it
          if ("anisotropy" in m) m.anisotropy = 0.35;
        } else if (name === "CandelaMetalDark") {
          m.roughness = 0.50;
          m.roughnessMap = brushTex;
          m.roughnessMap.repeat.set(3.0, 3.0);
          m.envMapIntensity = 1.0;
          if ("anisotropy" in m) m.anisotropy = 0.25;
        } else if (name === "CandelaGlass") {
          // Blender exported no volume, so transmission alone leaves the
          // elements flat. But thickness is a physical depth, not a dial:
          // the element is ~0.035 units through, and the first pass at 0.34
          // refracted the key panel into a white smear across the front.
          if (CFG.transmission) {
            m.transmission = 1.0;
            m.opacity = 1.0;
            m.transparent = false;
            m.thickness = 0.05;
            m.attenuationDistance = 1.4;
            m.attenuationColor = new THREE.Color(0.78, 0.88, 0.94);
          } else {
            // Phones skip the transmission pass. Dropping to a translucent
            // white made the front element a pale plastic cap — the exact
            // flat-disc read this build exists to avoid. Opaque, near-black
            // and very smooth reflects the studio instead, which is what a
            // coated element looks like from the outside anyway.
            m.transmission = 0;
            m.transparent = false;
            m.opacity = 1;
            m.color.setRGB(0.014, 0.016, 0.020);
            m.metalness = 0;
          }
          m.ior = 1.517;
          m.roughness = 0.025;
          // coated optics are dark but never dead — the element has to keep
          // enough environment in it to show the curve of its own surface
          m.envMapIntensity = 2.1;
          m.castShadow = false;
        } else if (name === "CandelaLeather") {
          m.roughness = 0.66;
          m.envMapIntensity = 1.0;
          if (m.normalScale) m.normalScale.set(1.35, 1.35);
        } else if (name === "CandelaRubber") {
          m.roughness = 0.88;
          m.envMapIntensity = 0.6;
        } else if (name === "CandelaBadge") {
          m.envMapIntensity = 1.5;
        }
        m.needsUpdate = true;
      });

      root.add(model);
      ready = true;
      stage.classList.add("is-live");
      document.getElementById("stageNote")?.setAttribute("hidden", "");
      window.CANDELA_READY = true;
      window.dispatchEvent(new Event("candela:ready"));
    },
    (evt) => {
      if (!evt.lengthComputable) return;
      const pct = Math.round((evt.loaded / evt.total) * 100);
      const bar = document.getElementById("loadBar");
      if (bar) bar.style.setProperty("--p", pct + "%");
    },
    () => fail("model")
  );

  /* ── lights ───────────────────────────────────────────────────────────
     The PMREM does the material work; these two exist for the shadow and
     for a single hard catch on the bevels, which is what reads as "this
     edge was actually cut". */
  /* Kept deliberately weak and near-neutral. At 2.1 and 0xfff4e6 this light
     was doing diffuse work the environment should own, and it pushed the
     black leatherette to olive. It is here for the shadow and for one hard
     catch on the bevels, nothing else. */
  const key = new THREE.DirectionalLight(0xfff7ee, 1.35);
  key.position.set(2.6, 6.2, 2.2);
  key.castShadow = CFG.shadows;
  key.shadow.mapSize.set(CFG.shadowSize, CFG.shadowSize);
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 14;
  key.shadow.camera.left = key.shadow.camera.bottom = -1.6;
  key.shadow.camera.right = key.shadow.camera.top = 1.6;
  key.shadow.bias = -0.0012;
  key.shadow.normalBias = 0.014;
  key.shadow.radius = 5;
  scene.add(key);

  const spill = new THREE.DirectionalLight(0xbcd2ff, 0.35);
  spill.position.set(-4.0, 1.2, -2.4);
  scene.add(spill);

  /* shadow catcher: invisible except for what falls on it. It sits a hair
     under the model's real base (-0.2963 after normalisation) — parked lower
     the contact shadow spreads out and the object reads as hovering. */
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 14),
    new THREE.ShadowMaterial({ opacity: 0.48 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.298;
  ground.receiveShadow = true;
  scene.add(ground);

  /* ── framing ──────────────────────────────────────────────────────────
     Spherical, hand-rolled rather than OrbitControls: one less vendored
     file with a bare 'three' specifier to rewrite, and the idle drift and
     the chip fly-to need to share one spring anyway. */
  /* `dist` is a ZOOM factor, not a distance: 1.0 means the model's bounding
     sphere exactly fills the tighter of the two fields of view. Authoring in
     absolute units broke the moment the stage stopped being landscape — the
     desktop stage is a tall column and the object ran off both edges. */
  const VIEWS = {
    hero:    { az: 0.62, pol: 1.26, dist: 1.00, ty: 0.01 },
    metal:   { az: 0.52, pol: 0.68, dist: 0.86, ty: 0.08 },
    // dead-on front leaves the element a black hole; a little off-axis is
    // what catches the key panel in the coating
    glass:   { az: 0.34, pol: 1.31, dist: 0.72, ty: -0.02 },
    leather: { az: 1.24, pol: 1.36, dist: 0.84, ty: -0.02 },
    rubber:  { az: 0.88, pol: 0.62, dist: 0.62, ty: 0.10 },
  };
  const ZOOM_MIN = 0.52, ZOOM_MAX = 1.75;
  const cur = { ...VIEWS.hero };
  const aim = { ...VIEWS.hero };
  let idle = true;
  let idleAt = performance.now();

  function applyView(name) {
    const v = VIEWS[name];
    if (!v) return;
    Object.assign(aim, v);
    idle = false;
    idleAt = performance.now() + 2600;
  }
  window.CANDELA_VIEW = applyView;

  /* Radius of the model's bounding sphere, set once the GLB has been
     normalised. Fitting the SPHERE rather than the current silhouette is
     what makes the framing rotation-safe: the object is 1.0 wide and 0.59
     tall, so whichever way it is turned it still cannot leave the frame. */
  let fitRadius = 0.65;
  function framedDist(zoom) {
    const vHalf = (camera.fov * Math.PI) / 360;
    const hHalf = Math.atan(Math.tan(vHalf) * camera.aspect);
    const lim = Math.max(Math.min(vHalf, hHalf), 0.05);
    return (fitRadius / Math.sin(lim)) * zoom;
  }

  /* pointer drag = azimuth/polar; wheel and pinch = a limited dolly */
  let dragging = false, lastX = 0, lastY = 0, pinch = 0;

  const onDown = (x, y) => { dragging = true; lastX = x; lastY = y; idle = false; stage.classList.add("is-grabbed"); };
  const onMove = (x, y) => {
    if (!dragging) return;
    aim.az -= (x - lastX) * 0.0072;
    aim.pol = clamp(aim.pol - (y - lastY) * 0.0060, 0.30, 2.06);
    lastX = x; lastY = y;
    idleAt = performance.now() + 3400;
  };
  const onUp = () => { dragging = false; stage.classList.remove("is-grabbed"); };

  canvas.addEventListener("pointerdown", (e) => {
    canvas.setPointerCapture(e.pointerId);
    onDown(e.clientX, e.clientY);
  });
  canvas.addEventListener("pointermove", (e) => onMove(e.clientX, e.clientY));
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", onUp);
  canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    aim.dist = clamp(aim.dist + e.deltaY * 0.0008, ZOOM_MIN, ZOOM_MAX);
    idle = false;
    idleAt = performance.now() + 3400;
  }, { passive: false });

  canvas.addEventListener("touchstart", (e) => {
    if (e.touches.length === 2) pinch = touchGap(e);
  }, { passive: true });
  canvas.addEventListener("touchmove", (e) => {
    if (e.touches.length !== 2) return;
    const g = touchGap(e);
    if (pinch) {
      aim.dist = clamp(aim.dist * (pinch / g), ZOOM_MIN, ZOOM_MAX);
      idleAt = performance.now() + 3400;
    }
    pinch = g;
  }, { passive: true });
  canvas.addEventListener("touchend", () => { pinch = 0; });

  function touchGap(e) {
    const [a, b] = e.touches;
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  }

  /* keyboard: the canvas is focusable so the object is reachable without
     a pointer, which is the whole reason the chips exist too */
  canvas.addEventListener("keydown", (e) => {
    const step = 0.16;
    if (e.key === "ArrowLeft") aim.az += step;
    else if (e.key === "ArrowRight") aim.az -= step;
    else if (e.key === "ArrowUp") aim.pol = clamp(aim.pol - step * 0.7, 0.30, 2.06);
    else if (e.key === "ArrowDown") aim.pol = clamp(aim.pol + step * 0.7, 0.30, 2.06);
    else if (e.key === "+" || e.key === "=") aim.dist = clamp(aim.dist - 0.09, ZOOM_MIN, ZOOM_MAX);
    else if (e.key === "-") aim.dist = clamp(aim.dist + 0.09, ZOOM_MIN, ZOOM_MAX);
    else return;
    e.preventDefault();
    idle = false;
    idleAt = performance.now() + 3400;
  });

  /* ── loop ─────────────────────────────────────────────────────────────── */
  function resize() {
    const r = stage.getBoundingClientRect();
    const w = Math.max(1, r.width), h = Math.max(1, r.height);
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, CFG.dprCap));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  addEventListener("resize", resize);
  resize();

  /* Idle motion is an OSCILLATION about the authored azimuth, not a spin.
     A continuous rotation means the composition somebody designed only
     exists for one frame in every eighty; swinging a sixth of a radian
     either side keeps the hero angle while still walking the specular
     highlight across the plates, which is the only reason to move at all. */
  let driftT = 0, driftAmt = 0, prev = 0;

  let raf = 0;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (!ready) return;
    const dt = Math.min((now - prev) / 1000 || 0, 0.05);
    prev = now;

    if (!dragging && now > idleAt) idle = true;
    driftT += dt;
    // ease the drift in and out rather than snapping it off under the hand
    driftAmt += ((idle && !reduced.matches ? 1 : 0) - driftAmt) * Math.min(1, dt * 1.6);

    const k = reduced.matches ? 0.24 : 0.085;
    cur.az += (aim.az - cur.az) * k;
    cur.pol += (aim.pol - cur.pol) * k;
    cur.dist += (aim.dist - cur.dist) * k;
    cur.ty += (aim.ty - cur.ty) * k;

    const az = cur.az + Math.sin(driftT * 0.42) * 0.17 * driftAmt;
    const pol = cur.pol + Math.sin(driftT * 0.29) * 0.035 * driftAmt;

    target.set(0, cur.ty, 0);
    const d = framedDist(cur.dist);
    camera.position.set(
      target.x + d * Math.sin(pol) * Math.sin(az),
      target.y + d * Math.cos(pol),
      target.z + d * Math.sin(pol) * Math.cos(az)
    );
    camera.lookAt(target);
    renderer.render(scene, camera);
  }
  raf = requestAnimationFrame(frame);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else raf = requestAnimationFrame(frame);
  });

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  function fail(why) {
    document.documentElement.classList.add("no-3d");
    document.documentElement.dataset.glFail = why;
    stage.classList.remove("is-live");
  }

  /* verification handle — pixels lie less when you can query the graph */
  window.CANDELA = {
    scene, camera, renderer, get model() { return model; },
    views: VIEWS, aim, cur, applyView, partsByMaterial,
    materials() {
      const out = {};
      partsByMaterial.forEach((meshes, name) => {
        const m = meshes[0].material;
        out[name] = {
          meshes: meshes.length,
          roughness: m.roughness,
          metalness: m.metalness,
          transmission: m.transmission ?? 0,
          ior: m.ior ?? null,
          thickness: m.thickness ?? 0,
          anisotropy: m.anisotropy ?? 0,
          hasRoughMap: !!m.roughnessMap,
          hasNormalMap: !!m.normalMap,
          envIntensity: m.envMapIntensity,
        };
      });
      return out;
    },
    tris() {
      let t = 0;
      scene.traverse((o) => { if (o.isMesh && o.geometry?.index) t += o.geometry.index.count / 3; });
      return t;
    },
  };
}

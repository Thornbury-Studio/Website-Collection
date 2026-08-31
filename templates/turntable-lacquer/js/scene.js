/* LACQUER — the deck on the bench.
   Sourced Poly (Google) turntable geometry, CC0 Poly Haven studio HDRI,
   runtime material passes for metal grain, walnut, vinyl grooves, felt,
   glass cover. Pin discipline matches js/vendor loaders → three@0.180.0. */

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
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
    dprCap: MOBILE ? 1.55 : 1.85,
    fov: MOBILE ? 36 : 28,
    transmission: !MOBILE,
    shadows: true,
    shadowSize: MOBILE ? 1024 : 2048,
  };

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas, antialias: !MOBILE, alpha: true, powerPreference: "high-performance",
    });
  } catch {
    fail("webgl");
    return;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, CFG.dprCap));
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.shadowMap.enabled = CFG.shadows;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  canvas.addEventListener("webglcontextlost", (e) => { e.preventDefault(); fail("context"); });

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(CFG.fov, 1, 0.02, 80);
  const target = new THREE.Vector3(0, 0.02, 0);

  function brushedRoughness(size = 1024) {
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const x = c.getContext("2d");
    x.fillStyle = "#e4e4e4";
    x.fillRect(0, 0, size, size);
    for (let i = 0; i < size * 3.5; i++) {
      const y = Math.random() * size;
      const v = Math.round(140 + Math.random() * 110);
      x.strokeStyle = `rgba(${v},${v},${v},${0.04 + Math.random() * 0.11})`;
      x.lineWidth = 0.4 + Math.random() * 1.6;
      x.beginPath();
      x.moveTo(0, y);
      x.lineTo(size, y + (Math.random() - 0.5) * 1.8);
      x.stroke();
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    return t;
  }

  function woodGrain(size = 1024) {
    const c = document.createElement("canvas");
    c.width = size; c.height = size;
    const x = c.getContext("2d");
    x.fillStyle = "#6b4428";
    x.fillRect(0, 0, size, size);
    for (let i = 0; i < 140; i++) {
      const y = (i / 140) * size;
      x.strokeStyle = `rgba(${40 + Math.random() * 30},${22 + Math.random() * 18},${12 + Math.random() * 10},${0.08 + Math.random() * 0.14})`;
      x.lineWidth = 0.6 + Math.random() * 2.2;
      x.beginPath();
      x.moveTo(0, y);
      x.bezierCurveTo(size * 0.3, y + (Math.random() - 0.5) * 8,
        size * 0.7, y + (Math.random() - 0.5) * 8, size, y + (Math.random() - 0.5) * 4);
      x.stroke();
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  }

  function vinylGrooves(size = 1024) {
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const x = c.getContext("2d");
    const cx = size / 2, cy = size / 2;
    x.fillStyle = "#808080";
    x.fillRect(0, 0, size, size);
    for (let r = 40; r < size / 2; r += 2.2) {
      const v = 118 + Math.sin(r * 0.08) * 18;
      x.strokeStyle = `rgb(${v},${v},${v})`;
      x.lineWidth = 0.55;
      x.beginPath();
      x.arc(cx, cy, r, 0, Math.PI * 2);
      x.stroke();
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  }

  const brushTex = brushedRoughness(MOBILE ? 512 : 1024);
  const woodTex = woodGrain(MOBILE ? 512 : 1024);
  const grooveTex = vinylGrooves(MOBILE ? 512 : 1024);

  const key = new THREE.DirectionalLight(0xfff4e8, 1.1);
  key.position.set(2.4, 5.8, 2.0);
  key.castShadow = CFG.shadows;
  key.shadow.mapSize.set(CFG.shadowSize, CFG.shadowSize);
  key.shadow.camera.near = 0.4;
  key.shadow.camera.far = 12;
  key.shadow.camera.left = key.shadow.camera.bottom = -1.4;
  key.shadow.camera.right = key.shadow.camera.top = 1.4;
  key.shadow.bias = -0.001;
  key.shadow.normalBias = 0.012;
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xc8d8f0, 0.32);
  fill.position.set(-3.5, 1.0, -2.2);
  scene.add(fill);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 12),
    new THREE.ShadowMaterial({ opacity: 0.42 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.01;
  ground.receiveShadow = true;
  scene.add(ground);

  const root = new THREE.Group();
  scene.add(root);

  let envMap = null;
  let model = null;
  let ready = false;
  let fitRadius = 0.55;
  const partsByFamily = new Map();

  function familyForMesh(mesh) {
    const n = (mesh.name + " " + (mesh.material?.name || "")).toLowerCase();
    if (/cover|glass|lid|dome|acrylic|transparent/.test(n)) return "cover";
    if (/vinyl|record|disc|lp|groove/.test(n)) return "vinyl";
    if (/felt|mat|slip|rubber|belt/.test(n)) return "felt";
    if (/wood|plinth|base|cabinet|veneer|body/.test(n)) return "plinth";
    if (/arm|tone|head|cartridge|counter/.test(n)) return "tonearm";
    if (/plat|spindle|hub|metal|chrome|steel|alumin/.test(n)) return "platter";

    const col = new THREE.Color();
    if (mesh.material?.color) col.copy(mesh.material.color);
    const hsl = { h: 0, s: 0, l: 0 };
    col.getHSL(hsl);

    if (mesh.material?.transparent || (hsl.l > 0.82 && hsl.s < 0.12)) return "cover";
    if (hsl.l < 0.14 && hsl.s < 0.2) return "vinyl";
    if (hsl.h > 0.06 && hsl.h < 0.14 && hsl.s > 0.28 && hsl.l < 0.55) return "plinth";
    if (hsl.h > 0.22 && hsl.h < 0.42 && hsl.s > 0.35) return "tonearm";
    if (hsl.l > 0.35 && hsl.s < 0.18) return "platter";
    if (hsl.l < 0.35 && hsl.s < 0.15) return "vinyl";
    return "plinth";
  }

  function applyFamilyMaterial(mesh, family, env) {
    const old = mesh.material;
    const phys = new THREE.MeshPhysicalMaterial({
      color: old?.color?.clone() || new THREE.Color(0.88, 0.88, 0.9),
      metalness: 0,
      roughness: 0.55,
      envMap: env,
      envMapIntensity: 1.2,
    });

    if (family === "platter" || family === "tonearm") {
      phys.color.setRGB(0.72, 0.73, 0.76);
      phys.metalness = 0.92;
      phys.roughness = 0.38;
      phys.roughnessMap = brushTex;
      phys.roughnessMap.repeat.set(2.2, 2.2);
      if ("anisotropy" in phys) phys.anisotropy = 0.42;
      phys.envMapIntensity = 1.05;
    } else if (family === "plinth") {
      phys.color.setRGB(0.42, 0.28, 0.17);
      phys.roughness = 0.62;
      phys.roughnessMap = woodTex;
      phys.roughnessMap.repeat.set(1.6, 1.6);
      phys.metalness = 0.02;
    } else if (family === "vinyl") {
      phys.color.setRGB(0.04, 0.04, 0.045);
      phys.roughness = 0.34;
      phys.roughnessMap = grooveTex;
      phys.roughnessMap.repeat.set(3, 3);
      phys.metalness = 0.08;
      phys.envMapIntensity = 0.85;
    } else if (family === "felt") {
      phys.color.setRGB(0.12, 0.11, 0.10);
      phys.roughness = 0.94;
      phys.metalness = 0;
      phys.envMapIntensity = 0.35;
    } else if (family === "cover") {
      phys.color.setRGB(0.95, 0.96, 0.98);
      if (CFG.transmission) {
        phys.transmission = 1;
        phys.thickness = 0.06;
        phys.ior = 1.49;
        phys.roughness = 0.04;
        phys.opacity = 1;
        phys.transparent = false;
      } else {
        phys.transmission = 0;
        phys.color.setRGB(0.08, 0.09, 0.11);
        phys.roughness = 0.08;
        phys.metalness = 0.15;
      }
      phys.envMapIntensity = 1.8;
      phys.castShadow = false;
    }

    if (old) old.dispose?.();
    mesh.material = phys;
    mesh.castShadow = family !== "cover";
    mesh.receiveShadow = true;

    if (!partsByFamily.has(family)) partsByFamily.set(family, []);
    partsByFamily.get(family).push(mesh);
  }

  function onModel(gltf) {
    model = gltf.scene;
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const centre = box.getCenter(new THREE.Vector3());
    const k = 0.95 / Math.max(size.x, size.y, size.z);
    model.scale.setScalar(k);
    model.position.set(-centre.x * k, -box.min.y * k, -centre.z * k);
    fitRadius = 0.5 * size.length() * k;

    model.traverse((o) => {
      if (!o.isMesh) return;
      const family = familyForMesh(o);
      applyFamilyMaterial(o, family, envMap);
    });

    root.add(model);
    ready = true;
    stage.classList.add("is-live");
    document.getElementById("stageNote")?.setAttribute("hidden", "");
    window.LACQUER_READY = true;
    window.dispatchEvent(new Event("lacquer:ready"));
  }

  function loadModel() {
    const draco = new DRACOLoader();
    draco.setDecoderPath("js/vendor/draco/");
    const loader = new GLTFLoader();
    loader.setDRACOLoader(draco);
    loader.load(
      "assets/lacquer.glb",
      onModel,
      (evt) => {
        if (!evt.lengthComputable) return;
        const pct = Math.round((evt.loaded / evt.total) * 100);
        document.getElementById("loadBar")?.style.setProperty("--p", pct + "%");
      },
      () => fail("model")
    );
  }

  new RGBELoader().load(
    "assets/studio.hdr",
    (hdrTex) => {
      hdrTex.mapping = THREE.EquirectangularReflectionMapping;
      const pmrem = new THREE.PMREMGenerator(renderer);
      envMap = pmrem.fromEquirectangular(hdrTex).texture;
      hdrTex.dispose();
      pmrem.dispose();
      scene.environment = envMap;
      loadModel();
    },
    undefined,
    () => fail("hdr")
  );

  const VIEWS = {
    hero:    { az: 0.55, pol: 1.18, dist: 1.0, ty: 0.04 },
    platter: { az: 0.18, pol: 1.42, dist: 0.78, ty: 0.06 },
    plinth:  { az: 0.92, pol: 1.05, dist: 0.88, ty: -0.04 },
    tonearm: { az: -0.42, pol: 1.08, dist: 0.72, ty: 0.05 },
    vinyl:   { az: 0.08, pol: 1.55, dist: 0.62, ty: 0.07 },
    cover:   { az: 0.72, pol: 0.92, dist: 0.82, ty: 0.08 },
  };
  const ZOOM_MIN = 0.5, ZOOM_MAX = 1.65;
  const cur = { ...VIEWS.hero };
  const aim = { ...VIEWS.hero };
  let idle = true, idleAt = performance.now();
  let dragging = false, lastX = 0, lastY = 0, pinch = 0;

  function applyView(name) {
    const v = VIEWS[name];
    if (!v) return;
    Object.assign(aim, v);
    idle = false;
    idleAt = performance.now() + 2600;
  }
  window.LACQUER_VIEW = applyView;

  function framedDist(zoom) {
    const vHalf = (camera.fov * Math.PI) / 360;
    const hHalf = Math.atan(Math.tan(vHalf) * camera.aspect);
    const lim = Math.max(Math.min(vHalf, hHalf), 0.05);
    return (fitRadius / Math.sin(lim)) * zoom;
  }

  const onDown = (x, y) => { dragging = true; lastX = x; lastY = y; idle = false; stage.classList.add("is-grabbed"); };
  const onMove = (x, y) => {
    if (!dragging) return;
    aim.az -= (x - lastX) * 0.007;
    aim.pol = clamp(aim.pol - (y - lastY) * 0.0058, 0.35, 1.75);
    lastX = x; lastY = y;
    idleAt = performance.now() + 3400;
  };
  const onUp = () => { dragging = false; stage.classList.remove("is-grabbed"); };

  canvas.addEventListener("pointerdown", (e) => { canvas.setPointerCapture(e.pointerId); onDown(e.clientX, e.clientY); });
  canvas.addEventListener("pointermove", (e) => onMove(e.clientX, e.clientY));
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", onUp);
  canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    aim.dist = clamp(aim.dist + e.deltaY * 0.00075, ZOOM_MIN, ZOOM_MAX);
    idle = false;
    idleAt = performance.now() + 3400;
  }, { passive: false });

  canvas.addEventListener("keydown", (e) => {
    const step = 0.14;
    if (e.key === "ArrowLeft") aim.az += step;
    else if (e.key === "ArrowRight") aim.az -= step;
    else if (e.key === "ArrowUp") aim.pol = clamp(aim.pol - step * 0.65, 0.35, 1.75);
    else if (e.key === "ArrowDown") aim.pol = clamp(aim.pol + step * 0.65, 0.35, 1.75);
    else if (e.key === "+" || e.key === "=") aim.dist = clamp(aim.dist - 0.08, ZOOM_MIN, ZOOM_MAX);
    else if (e.key === "-") aim.dist = clamp(aim.dist + 0.08, ZOOM_MIN, ZOOM_MAX);
    else return;
    e.preventDefault();
    idle = false;
    idleAt = performance.now() + 3400;
  });

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

  let driftT = 0, driftAmt = 0, prev = 0, raf = 0;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (!ready) return;
    const dt = Math.min((now - prev) / 1000 || 0, 0.05);
    prev = now;
    if (!dragging && now > idleAt) idle = true;
    driftT += dt;
    driftAmt += ((idle && !reduced.matches ? 1 : 0) - driftAmt) * Math.min(1, dt * 1.5);
    const k = reduced.matches ? 0.28 : 0.088;
    cur.az += (aim.az - cur.az) * k;
    cur.pol += (aim.pol - cur.pol) * k;
    cur.dist += (aim.dist - cur.dist) * k;
    cur.ty += (aim.ty - cur.ty) * k;
    const az = cur.az + Math.sin(driftT * 0.38) * 0.14 * driftAmt;
    const pol = cur.pol + Math.sin(driftT * 0.27) * 0.03 * driftAmt;
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
    window.__lacquerFold?.(why);
  }
}

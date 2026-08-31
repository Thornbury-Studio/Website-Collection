/* TAPE//LACQUER — WebGL rig.
   Sourced Poly Haven boombox + portable cassette (CC0), warehouse HDRI.
   No procedural geometry — only loaded glTF meshes + point static. */

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { GLTFLoader } from "./vendor/GLTFLoader.js";

(function () {
  "use strict";

  var canvas = document.getElementById("gl");
  var S = window.TLSTATE;
  if (!canvas || !S) return;

  var mobile = window.matchMedia("(max-width: 760px), (pointer: coarse)").matches;
  var DPR_CAP = mobile ? 1.35 : 1.75;

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: !mobile,
      alpha: true,
      powerPreference: "high-performance"
    });
  } catch (e) {
    fold("webgl");
    return;
  }

  renderer.setClearColor(0x000000, 0.38);
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  canvas.addEventListener("webglcontextlost", function (e) {
    e.preventDefault();
    fold("context");
  });

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(42, 1, 0.05, 60);

  var COL = {
    tape: new THREE.Color(0xf2e94a),
    static: new THREE.Color(0x4de8ff),
    burn: new THREE.Color(0xff3d2e)
  };

  var root = new THREE.Group();
  scene.add(root);

  var boombox = null;
  var cassette = null;
  var boomboxScale = 1;
  var cassetteScale = 1;
  var envMap = null;
  var ready = false;

  var key = new THREE.DirectionalLight(0xfff0e0, 1.4);
  key.position.set(3, 5, 2);
  scene.add(key);

  var rim = new THREE.DirectionalLight(0x4de8ff, 0.45);
  rim.position.set(-4, 2, -3);
  scene.add(rim);

  var fill = new THREE.AmbientLight(0x1a1428, 0.35);
  scene.add(fill);

  /* static rain — points, not modeled assets */
  var staticCount = mobile ? 800 : 1600;
  var staticGeo = new THREE.BufferGeometry();
  var staticPos = new Float32Array(staticCount * 3);
  for (var i = 0; i < staticCount; i++) {
    staticPos[i * 3] = (Math.random() - 0.5) * 14;
    staticPos[i * 3 + 1] = Math.random() * 8 - 1;
    staticPos[i * 3 + 2] = (Math.random() - 0.5) * 10;
  }
  staticGeo.setAttribute("position", new THREE.BufferAttribute(staticPos, 3));
  var staticMat = new THREE.PointsMaterial({
    color: 0x4de8ff,
    size: mobile ? 0.04 : 0.028,
    transparent: true,
    opacity: 0.55,
    depthWrite: false
  });
  var staticRain = new THREE.Points(staticGeo, staticMat);
  scene.add(staticRain);

  function applyEnvToObject(obj) {
    if (!envMap) return;
    obj.traverse(function (o) {
      if (!o.isMesh || !o.material) return;
      var mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach(function (m) {
        if (m && m.isMaterial) {
          m.envMap = envMap;
          m.envMapIntensity = 1.1;
          m.needsUpdate = true;
        }
      });
    });
  }

  function fitModel(obj, scaleTarget) {
    var box = new THREE.Box3().setFromObject(obj);
    var size = box.getSize(new THREE.Vector3());
    var centre = box.getCenter(new THREE.Vector3());
    var k = scaleTarget / Math.max(size.x, size.y, size.z);
    obj.scale.setScalar(k);
    obj.position.set(-centre.x * k, -box.min.y * k, -centre.z * k);
    return k;
  }

  var loader = new GLTFLoader();
  var pending = 2;

  function modelReady() {
    pending -= 1;
    if (pending > 0) return;
    ready = true;
    document.body.classList.add("is-live");
    window.TAPE_READY = true;
    window.dispatchEvent(new Event("tape:ready"));
  }

  loader.load(
    "assets/models/boombox/boombox_1k.gltf",
    function (gltf) {
      boombox = gltf.scene;
      boomboxScale = fitModel(boombox, 1.1);
      applyEnvToObject(boombox);
      root.add(boombox);
      modelReady();
    },
    undefined,
    function () { fold("boombox"); }
  );

  loader.load(
    "assets/models/cassette/portable_cassette_player_1k.gltf",
    function (gltf) {
      cassette = gltf.scene;
      cassetteScale = fitModel(cassette, 0.42);
      cassette.position.set(0.55, 0.35 * cassetteScale, 0.35);
      applyEnvToObject(cassette);
      root.add(cassette);
      modelReady();
    },
    undefined,
    function () { fold("cassette"); }
  );

  new RGBELoader().load(
    "assets/warehouse.hdr",
    function (hdrTex) {
      hdrTex.mapping = THREE.EquirectangularReflectionMapping;
      var pmrem = new THREE.PMREMGenerator(renderer);
      envMap = pmrem.fromEquirectangular(hdrTex).texture;
      hdrTex.dispose();
      pmrem.dispose();
      scene.environment = envMap;
      if (boombox) applyEnvToObject(boombox);
      if (cassette) applyEnvToObject(cassette);
    },
    undefined,
    function () {
      new RGBELoader().load("assets/studio.hdr", function (hdrTex) {
        hdrTex.mapping = THREE.EquirectangularReflectionMapping;
        var pmrem = new THREE.PMREMGenerator(renderer);
        envMap = pmrem.fromEquirectangular(hdrTex).texture;
        hdrTex.dispose();
        pmrem.dispose();
        scene.environment = envMap;
      });
    }
  );

  function resize() {
    var w = window.innerWidth;
    var h = window.innerHeight;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, DPR_CAP));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", resize);
  resize();

  var t0 = performance.now();
  var raf = 0;

  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (!ready) return;

    var t = (now - t0) / 1000;
    var v = S.v || 0;
    var px = S.px || 0;
    var py = S.py || 0;
    var beat = S.beatPhase || 0;
    var charge = S.charge || 0;
    var reduced = S.reduced;

    var kick = reduced ? 0 : Math.pow(1 - beat, 3) * 0.12;

    if (boombox) {
      var wobble = reduced ? 0 : 1;
      boombox.rotation.y = t * 0.22 * wobble + px * 0.35 + v * 0.8;
      boombox.rotation.x = Math.sin(t * 0.4) * 0.06 * wobble + py * 0.12;
      boombox.rotation.z = Math.sin(t * 0.55) * 0.04 * wobble;
      var pulse = 1 + kick + charge * 0.08;
      boombox.scale.setScalar(boomboxScale * pulse);
    }

    if (cassette) {
      var orbit = reduced ? 0 : 1;
      cassette.position.x = 0.55 + Math.sin(t * 0.9) * 0.22 * orbit + px * 0.15;
      cassette.position.y = 0.28 + Math.sin(t * 1.3 + 1) * 0.12 * orbit + charge * 0.2;
      cassette.position.z = 0.35 + Math.cos(t * 0.85) * 0.18 * orbit;
      cassette.rotation.x = t * 0.5 * orbit;
      cassette.rotation.y = t * 0.75 * orbit + px * 0.4;
      cassette.rotation.z = Math.sin(t * 1.1) * 0.3 * orbit;
    }

    staticRain.rotation.y = t * 0.05;
    staticMat.opacity = 0.25 + v * 0.45 + charge * 0.25;

    var stageCol = COL.tape;
    if (S.stage === "b") stageCol = COL.static;
    if (S.stage === "burn") stageCol = COL.burn;
    staticMat.color.copy(stageCol);

    if (S.surge && now - S.surge.t < 900) {
      var sp = S.surge.power || 0;
      camera.position.z += sp * 0.15 * Math.sin((now - S.surge.t) * 0.02);
    }

    var camDist = 2.8 - v * 0.5 - charge * 0.35;
    var camY = 0.75 + v * 0.25 + py * 0.15;
    var camX = px * 0.4 + Math.sin(t * 0.25) * 0.08 * (reduced ? 0 : 1);
    camera.position.set(camX, camY, camDist);
    camera.lookAt(0, 0.35, 0);

    renderer.render(scene, camera);
  }

  raf = requestAnimationFrame(frame);
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) cancelAnimationFrame(raf);
    else raf = requestAnimationFrame(frame);
  });

  function fold(why) {
    document.documentElement.classList.add("no-3d");
    document.documentElement.dataset.glFail = why || "fail";
    window.__tapeFold?.(why);
  }
})();

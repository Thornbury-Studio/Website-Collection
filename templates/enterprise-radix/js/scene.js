import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

THREE.ColorManagement.enabled = false;

(function () {
  "use strict";

  var canvas = document.getElementById("knot");
  if (!canvas) return;

  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fallback = document.getElementById("knotStill");

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
  } catch (err) {
    if (fallback) fallback.hidden = false;
    canvas.hidden = true;
    return;
  }

  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(32, 1, 0.1, 40);
  camera.position.set(0, 0.08, 6.35);

  var group = new THREE.Group();
  scene.add(group);

  function knot(p, q, radius, tube, color, opacity) {
    var geo = new THREE.TorusKnotGeometry(radius, tube, 220, 12, p, q);
    var mat = new THREE.MeshBasicMaterial({
      color: color,
      wireframe: true,
      transparent: true,
      opacity: opacity
    });
    var mesh = new THREE.Mesh(geo, mat);
    group.add(mesh);
    return mesh;
  }

  var layers = [
    knot(2, 3, 1.48, 0.06, 0xe8e8e8, 0.96),
    knot(3, 4, 1.16, 0.05, 0xd7efa8, 0.68),
    knot(1, 2, 1.82, 0.028, 0x9a9a9a, 0.22)
  ];

  var mouse = { x: 0, y: 0 };
  var target = { x: 0, y: 0 };

  function resize() {
    var box = canvas.parentElement.getBoundingClientRect();
    var w = Math.max(1, box.width);
    var h = Math.max(1, box.height);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    var compact = w < 700;
    camera.position.z = compact ? 7.55 : 6.35;
    camera.position.y = compact ? -0.12 : 0.08;
  }

  function frame(t) {
    target.x += (mouse.x - target.x) * 0.05;
    target.y += (mouse.y - target.y) * 0.05;
    group.position.y = -0.22;
    group.rotation.y = t * 0.00048 + target.x * 0.32;
    group.rotation.x = 0.22 + target.y * 0.12;
    layers[1].rotation.z = t * 0.00032;
    renderer.render(scene, camera);
    if (!reduced) requestAnimationFrame(frame);
  }

  window.addEventListener("pointermove", function (e) {
    mouse.x = (e.clientX / innerWidth) * 2 - 1;
    mouse.y = (e.clientY / innerHeight) * 2 - 1;
  }, { passive: true });

  window.addEventListener("resize", resize);

  group.position.y = -0.22;
  group.rotation.x = 0.22;
  resize();
  if (reduced) {
    renderer.render(scene, camera);
  } else {
    requestAnimationFrame(frame);
  }
})();

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

THREE.ColorManagement.enabled = false;

(function () {
  "use strict";

  var canvas = document.getElementById("knot");
  if (!canvas) return;

  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var asciiEl = document.getElementById("ascii");
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
  var camera = new THREE.PerspectiveCamera(28, 1, 0.1, 40);
  camera.position.set(0, 1.35, 9.2);

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
    knot(2, 3, 1.35, 0.055, 0xe8e8e8, 0.95),
    knot(3, 4, 1.05, 0.04, 0xd7efa8, 0.22),
    knot(1, 2, 1.7, 0.03, 0x9a9a9a, 0.18)
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
  }

  var chars = " ·•+=%#";
  var asciiW = 92;
  var asciiH = 42;
  var read = document.createElement("canvas");
  var readCtx = read.getContext("2d", { willReadFrequently: true });

  function drawAscii() {
    if (!asciiEl || reduced) return;
    var w = canvas.width;
    var h = canvas.height;
    if (w < 8 || h < 8) return;
    read.width = asciiW;
    read.height = asciiH;
    readCtx.clearRect(0, 0, asciiW, asciiH);
    readCtx.drawImage(canvas, 0, 0, asciiW, asciiH);
    var data = readCtx.getImageData(0, 0, asciiW, asciiH).data;
    var out = "";
    for (var y = 0; y < asciiH; y++) {
      for (var x = 0; x < asciiW; x++) {
        var i = (y * asciiW + x) * 4;
        var v = (data[i] + data[i + 1] + data[i + 2]) / 3 * (data[i + 3] / 255);
        out += chars[Math.min(chars.length - 1, (v / 255 * (chars.length - 1)) | 0)];
      }
      out += "\n";
    }
    asciiEl.textContent = out;
  }

  function frame(t) {
    target.x += (mouse.x - target.x) * 0.04;
    target.y += (mouse.y - target.y) * 0.04;
    group.position.y = -1.55;
    group.rotation.y = t * 0.00018 + target.x * 0.35;
    group.rotation.x = 0.38 + target.y * 0.2;
    layers[1].rotation.z = t * 0.00012;
    renderer.render(scene, camera);
    if (asciiEl && asciiEl.classList.contains("is-on")) drawAscii();
    if (!reduced) requestAnimationFrame(frame);
  }

  window.addEventListener("pointermove", function (e) {
    mouse.x = (e.clientX / innerWidth) * 2 - 1;
    mouse.y = (e.clientY / innerHeight) * 2 - 1;
  }, { passive: true });

  window.addEventListener("resize", resize);

  document.querySelectorAll("[data-layer]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var id = Number(btn.getAttribute("data-layer"));
      document.querySelectorAll("[data-layer]").forEach(function (b) {
        b.classList.toggle("is-on", b === btn);
      });
      layers.forEach(function (mesh, i) {
        mesh.material.opacity = i === id ? 0.95 : 0.12;
        mesh.material.color.setHex(i === id ? 0xe8e8e8 : 0x666666);
      });
      var copy = document.getElementById("layerCopy");
      if (copy) {
        var texts = [
          "Sense. Live demand, inventory, and market signal land in one control layer.",
          "Decide. Agents propose the next move. Operators keep judgement and risk.",
          "Act. Replenishment, cash, and service execute while the loop keeps learning."
        ];
        copy.textContent = texts[id] || texts[0];
      }
      if (asciiEl) asciiEl.classList.toggle("is-on", id === 2);
    });
  });

  resize();
  if (reduced) {
    renderer.render(scene, camera);
  } else {
    requestAnimationFrame(frame);
  }
})();

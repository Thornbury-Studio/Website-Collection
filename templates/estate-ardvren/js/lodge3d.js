/* ARDVREN — the lodge, as a massing model.
   A turntable in the configurator that rebuilds itself from the form: the
   chosen design (The Bothy, The Pine, The Ridge) at its true footprint and
   heights, the cladding you picked, and every option you tick — the flue
   for the stove, the longer deck, the boot room, the panels on the south
   pitch, the shore sauna on its jetty when the plot is lochside — with the
   ground around it dressed for the kind of plot. One unit is a metre.
   three.js loads only when the configurator is about to be seen. */
(function () {
  'use strict';

  var host = document.getElementById('lodge3d');
  var form = document.getElementById('configForm');
  if (!host || !form) return;

  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var small = matchMedia('(max-width: 860px)').matches;
  var THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.min.js';

  var loader = new IntersectionObserver(function (entries) {
    if (!entries[0].isIntersecting) return;
    loader.disconnect();
    import(THREE_URL).then(build).catch(function () { host.classList.add('no-webgl'); });
  }, { rootMargin: '500px 0px' });
  loader.observe(host);

  function build(THREE) {
    var renderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false }); }
    catch (e) { host.classList.add('no-webgl'); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x1b2b2a, 1);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    host.appendChild(renderer.domElement);
    host.classList.add('has-webgl');

    var scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x1b2b2a, 42, 70);
    var camera = new THREE.PerspectiveCamera(30, 1.6, 0.5, 200);

    // a baked environment so glass and zinc have something to reflect: a soft sky dome and a low sun strip
    var pmrem = new THREE.PMREMGenerator(renderer);
    var envScene = new THREE.Scene();
    var dome = new THREE.Mesh(new THREE.SphereGeometry(50, 24, 12), new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: {},
      vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: 'varying vec3 vP; void main(){ float t = clamp(vP.y / 50.0 * 0.5 + 0.5, 0.0, 1.0); vec3 sky = mix(vec3(0.16,0.22,0.22), vec3(0.72,0.80,0.80), pow(t, 0.8)); gl_FragColor = vec4(sky, 1.0); }'
    }));
    envScene.add(dome);
    var strip = new THREE.Mesh(new THREE.PlaneGeometry(30, 6), new THREE.MeshBasicMaterial({ color: 0xfff2dc }));
    strip.position.set(-20, 18, -30); strip.lookAt(0, 0, 0);
    envScene.add(strip);
    scene.environment = pmrem.fromScene(envScene, 0.04).texture;
    pmrem.dispose();

    /* ---------------- materials ---------------- */
    var MAT = {
      larch: new THREE.MeshStandardMaterial({ color: 0xa88a5f, roughness: 0.82, metalness: 0.0 }),
      charred: new THREE.MeshStandardMaterial({ color: 0x1a2321, roughness: 0.62, metalness: 0.05 }),
      zinc: new THREE.MeshStandardMaterial({ color: 0x5c6866, roughness: 0.45, metalness: 0.55 }),
      glass: new THREE.MeshStandardMaterial({ color: 0x27403f, roughness: 0.08, metalness: 0.9, transparent: true, opacity: 0.92 }),
      frame: new THREE.MeshStandardMaterial({ color: 0x2a2a28, roughness: 0.6 }),
      deck: new THREE.MeshStandardMaterial({ color: 0x8f7853, roughness: 0.9 }),
      ground: new THREE.MeshStandardMaterial({ color: 0x2f4741, roughness: 1.0 }),
      moss: new THREE.MeshStandardMaterial({ color: 0x3b5a4c, roughness: 1.0 }),
      heather: new THREE.MeshStandardMaterial({ color: 0x5a4c5a, roughness: 1.0 }),
      rock: new THREE.MeshStandardMaterial({ color: 0x6a716c, roughness: 0.95 }),
      water: new THREE.MeshStandardMaterial({ color: 0x35595f, roughness: 0.2, metalness: 0.3, transparent: true, opacity: 0.94 }),
      panel: new THREE.MeshStandardMaterial({ color: 0x0f1a24, roughness: 0.25, metalness: 0.7 }),
      flue: new THREE.MeshStandardMaterial({ color: 0x2b2f2e, roughness: 0.5, metalness: 0.6 }),
      tree: new THREE.MeshStandardMaterial({ color: 0x2b4a40, roughness: 0.95 }),
      trunk: new THREE.MeshStandardMaterial({ color: 0x3d3128, roughness: 0.95 })
    };

    /* ---------------- helpers ---------------- */
    var group = new THREE.Group();
    scene.add(group);

    function box(w, h, d, mat, x, y, z, ry) {
      var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      m.position.set(x, y, z);
      if (ry) m.rotation.y = ry;
      m.castShadow = true; m.receiveShadow = true;
      group.add(m);
      return m;
    }
    // a roof slab that rises toward the front (+z): low eaves at the back, high at the glazed face
    function monoRoof(W, D, hLow, hHigh, x, z) {
      var rise = hHigh - hLow, L = Math.hypot(D, rise);
      var m = new THREE.Mesh(new THREE.BoxGeometry(W + 0.9, 0.16, L + 0.9), MAT.zinc);
      m.position.set(x, (hLow + hHigh) / 2 + 0.08, z);
      m.rotation.x = -Math.atan2(rise, D);
      m.castShadow = true; m.receiveShadow = true;
      group.add(m);
      return m;
    }
    // the triangular top of a side wall under a mono-pitch: a prism along x, tall at the front (+z)
    function wedge(W, D, rise, mat, x, y, z) {
      var sh = new THREE.Shape();
      sh.moveTo(-D / 2, 0); sh.lineTo(D / 2, 0); sh.lineTo(D / 2, rise); sh.closePath();
      var g = new THREE.ExtrudeGeometry(sh, { depth: W, bevelEnabled: false });
      g.rotateY(-Math.PI / 2); g.translate(W / 2, 0, 0);
      var m = new THREE.Mesh(g, mat);
      m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true;
      group.add(m);
      return m;
    }
    // a gable roof: the ridge runs along x for length W, the triangle spans depth D across z
    function gableRoof(W, D, rise, x, yEaves, z) {
      var o = 0.5, slope = rise / (D / 2);
      var sh = new THREE.Shape();
      sh.moveTo(-D / 2 - o, -o * slope); sh.lineTo(D / 2 + o, -o * slope); sh.lineTo(0, rise); sh.closePath();
      var g = new THREE.ExtrudeGeometry(sh, { depth: W + 2 * o, bevelEnabled: false });
      g.rotateY(-Math.PI / 2); g.translate((W + 2 * o) / 2, 0, 0);
      var m = new THREE.Mesh(g, MAT.zinc);
      m.position.set(x, yEaves, z); m.castShadow = true; m.receiveShadow = true;
      group.add(m);
      return m;
    }
    function glazing(w, h, x, y, z, ry, bays) {
      var g = new THREE.Group();
      var pane = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.08), MAT.glass);
      pane.castShadow = false; pane.receiveShadow = true;
      g.add(pane);
      var n = bays || Math.max(1, Math.round(w / 2.4));
      for (var i = 0; i <= n; i++) {
        var mull = new THREE.Mesh(new THREE.BoxGeometry(0.08, h, 0.12), MAT.frame);
        mull.position.x = -w / 2 + (w / n) * i;
        g.add(mull);
      }
      var head = new THREE.Mesh(new THREE.BoxGeometry(w + 0.1, 0.1, 0.12), MAT.frame); head.position.y = h / 2; g.add(head);
      var sill = head.clone(); sill.position.y = -h / 2; g.add(sill);
      g.position.set(x, y, z); g.rotation.y = ry || 0;
      group.add(g);
      return g;
    }
    function tree(x, z, s) {
      var c = new THREE.Mesh(new THREE.ConeGeometry(0.9 * s, 3.4 * s, 7), MAT.tree);
      c.position.set(x, 1.7 * s + 0.5 * s, z); c.castShadow = true; group.add(c);
      var t = new THREE.Mesh(new THREE.CylinderGeometry(0.1 * s, 0.14 * s, 0.6 * s, 6), MAT.trunk);
      t.position.set(x, 0.3 * s, z); group.add(t);
    }

    /* ---------------- the three designs ---------------- */
    var LODGE = {
      bothy: function (clad, o) {
        // 9.6 x 6.2, one storey, a mono-pitch rising to the glazed gable at the front (+z)
        var W = 6.2, D = 9.6, hBack = 2.7, hFront = 4.1;
        box(W, hBack, D, clad, 0, hBack / 2, 0);
        wedge(W, D, hFront - hBack, clad, 0, hBack, 0);
        monoRoof(W, D, hBack, hFront, 0, 0);
        glazing(W - 0.7, hFront - 0.6, 0, (hFront - 0.6) / 2 + 0.25, D / 2 + 0.06, 0, 3);
        var dd = 3.0 + (o.deck ? 4 : 0);
        deck(W, dd, 0, D / 2 + dd / 2);
        if (o.stove) flue(-1.6, hBack + 0.8, -2.6);
        if (o.boot) box(3.0, 2.4, 2.2, clad, -W / 2 - 1.5, 1.2, -2.6);
        if (o.pv) panels(3, 0, hBack + (hFront - hBack) * 0.35 + 0.22, -1.4, W - 0.6, 1.2, -Math.atan2(hFront - hBack, D));
      },
      pine: function (clad, o) {
        // 21.0 x 5.4, one storey under a low mono-pitch, the whole south face glass onto a deck the length of the house
        var W = 21.0, D = 5.4, hBack = 3.1, hFront = 3.4;
        box(W, hBack, D, clad, 0, hBack / 2, 0);
        wedge(W, D, hFront - hBack, clad, 0, hBack, 0);
        monoRoof(W, D, hBack, hFront, 0, 0);
        glazing(W - 1.2, hBack - 0.5, 0, (hBack - 0.5) / 2 + 0.2, D / 2 + 0.06, 0, 8);
        var dd = 3.5 + (o.deck ? 4 : 0);
        deck(W, dd, 0, D / 2 + dd / 2);
        if (o.stove) flue(6.5, hBack + 0.9, -1.4);
        if (o.boot) box(3.0, 2.5, 2.2, clad, -W / 2 + 2.5, 1.25, -D / 2 - 1.1);
        if (o.pv) panels(6, 0, hBack + 0.35, 0.4, W - 2, 1.2, -Math.atan2(hFront - hBack, D));
      },
      ridge: function (clad, o) {
        // 12.8 x 7.4, two storeys under a standing-seam gable, the upper floor set back on the loch side, a deep covered porch
        var W = 12.8, D = 7.4, h1 = 3.0, h2 = 2.7, set = 1.5, D2 = D - set, rise = 2.3;
        box(W, h1, D, clad, 0, h1 / 2, 0);
        box(W, h2, D2, clad, 0, h1 + h2 / 2, -set / 2);
        gableRoof(W, D2, rise, 0, h1 + h2, -set / 2);
        glazing(W - 1.6, h1 - 0.6, 0, (h1 - 0.6) / 2 + 0.25, D / 2 + 0.06, 0, 5);
        glazing(W - 4, h2 - 0.9, 0, h1 + (h2 - 0.9) / 2 + 0.35, D / 2 - set + 0.06, 0, 4);
        // the covered porch: a slab on posts, 2.4 m deep
        box(W, 0.14, 2.6, MAT.zinc, 0, h1 + 0.1, D / 2 + 1.2);
        for (var i = 0; i < 4; i++) box(0.16, h1, 0.16, MAT.frame, -W / 2 + 0.4 + i * (W - 0.8) / 3, h1 / 2, D / 2 + 2.3);
        var dd = 2.8 + (o.deck ? 4 : 0);
        deck(W, dd, 0, D / 2 + dd / 2);
        if (o.stove) flue(-3.2, h1 + h2 + 1.5, -1.6);
        if (o.boot) box(3.2, 2.5, 2.4, clad, W / 2 + 1.6, 1.25, -1.0);
        if (o.pv) panels(5, 0, h1 + h2 + rise / 2 + 0.12, -set / 2 + D2 / 4, W - 2, 1.4, Math.atan2(rise, D2 / 2));
      }
    };
    function deck(w, d, x, z) {
      var m = box(w, 0.22, d, MAT.deck, x, 0.45, z);
      // boards
      for (var i = 0; i < Math.floor(d / 0.3); i++) {
        var gap = new THREE.Mesh(new THREE.BoxGeometry(w + 0.02, 0.02, 0.03), MAT.frame);
        gap.position.set(x, 0.57, z - d / 2 + 0.3 * i + 0.15); gap.castShadow = false; group.add(gap);
      }
      for (var k = 0; k < Math.ceil(w / 2.4); k++) box(0.14, 0.45, 0.14, MAT.frame, x - w / 2 + 0.3 + k * 2.4, 0.22, z + d / 2 - 0.3);
      return m;
    }
    function flue(x, y, z) {
      var f = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 1.6, 10), MAT.flue);
      f.position.set(x, y, z); f.castShadow = true; group.add(f);
      var cap = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.12, 10), MAT.flue);
      cap.position.set(x, y + 0.86, z); group.add(cap);
    }
    function panels(n, x, y, z, spread, rows, tilt) {
      var pw = Math.min(1.6, spread / n - 0.15);
      for (var i = 0; i < n; i++) {
        var p = new THREE.Mesh(new THREE.BoxGeometry(pw, 0.05, 1.0 * rows), MAT.panel);
        p.position.set(x - spread / 2 + pw / 2 + 0.1 + i * (spread / n), y, z);
        p.rotation.x = tilt || 0;
        p.castShadow = true; group.add(p);
      }
    }

    function ground(kind) {
      var disc = new THREE.Mesh(new THREE.CylinderGeometry(19, 19, 1.2, 48), kind === 'ridge' ? MAT.heather : kind === 'lochside' ? MAT.ground : MAT.moss);
      disc.position.y = -0.6; disc.receiveShadow = true; group.add(disc);
      var seed = 11;
      function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
      if (kind === 'lochside') {
        // the loch takes the front half of the ground, from the deck's edge to the rim
        var w = new THREE.Mesh(new THREE.CylinderGeometry(19.02, 19.02, 0.3, 48, 1, false, -Math.PI * 0.42, Math.PI * 0.84), MAT.water);
        w.position.y = -0.12; w.receiveShadow = true; group.add(w);
        for (var i = 0; i < 9; i++) tree(-16 + rnd() * 32, -9 - rnd() * 6, 0.8 + rnd() * 0.5);
        return;
      }
      if (kind === 'ridge') {
        var rock = new THREE.Mesh(new THREE.DodecahedronGeometry(1.4, 0), MAT.rock);
        rock.position.set(9, 0.4, -6); rock.rotation.set(0.3, 0.6, 0.2); rock.castShadow = true; group.add(rock);
        for (var j = 0; j < 7; j++) tree(-14 + rnd() * 28, -8 - rnd() * 8, 0.7 + rnd() * 0.6);
        return;
      }
      for (var k = 0; k < 18; k++) {
        var a = rnd() * Math.PI * 2, r = 11 + rnd() * 7;
        tree(Math.cos(a) * r, Math.sin(a) * r, 0.8 + rnd() * 0.7);
      }
    }

    function sauna() {
      // the shore sauna on its own jetty, off the end of the deck
      box(1.4, 0.2, 7, MAT.deck, 11.5, 0.3, 9.5, -0.3);
      box(2.4, 2.6, 3.6, MAT.charred, 12.6, 1.5, 12.6, -0.3);
      box(2.8, 0.1, 4.0, MAT.zinc, 12.6, 2.85, 12.6, -0.3);
    }

    /* ---------------- read the form, build the scene ---------------- */
    function state() {
      function val(n) { var el = form.querySelector('input[name="' + n + '"]:checked'); return el ? el.value : null; }
      var extras = {};
      form.querySelectorAll('input[name="extra"]:checked').forEach(function (el) { if (!el.disabled) extras[el.value] = true; });
      return { lodge: val('lodge') || 'pine', plot: val('plot') || 'woodland', clad: val('cladding') === 'charred' ? MAT.charred : MAT.larch, o: extras };
    }
    var cap = document.getElementById('lodge3dCap');
    var NAMES = { bothy: 'The Bothy', pine: 'The Pine', ridge: 'The Ridge' };
    var DIST = { bothy: 27, pine: 38, ridge: 33 };
    function rebuild() {
      while (group.children.length) {
        var c = group.children.pop();
        c.traverse(function (n) { if (n.geometry && n.geometry !== c.geometry) n.geometry.dispose(); });
        if (c.geometry) c.geometry.dispose();
      }
      var s = state();
      ground(s.plot);
      LODGE[s.lodge](s.clad, s.o);
      if (s.o.sauna && s.plot === 'lochside') sauna();
      goal.dist = DIST[s.lodge] + (s.o.sauna && s.plot === 'lochside' ? 5 : 0) + (s.o.deck ? 2 : 0);
      if (cap) cap.textContent = NAMES[s.lodge] + ' · ' + (s.clad === MAT.charred ? 'charred' : 'natural') + ' larch · ' + s.plot + ' plot · massing at 1:1';
      need = true;
    }
    form.addEventListener('change', rebuild);

    /* ---------------- light, camera, turntable ---------------- */
    scene.add(new THREE.HemisphereLight(0xbfd0cd, 0x1b2b2a, 0.9));
    var sun = new THREE.DirectionalLight(0xfff0dc, 2.2);
    sun.position.set(18, 26, 22);
    sun.castShadow = true;
    sun.shadow.mapSize.set(small ? 1024 : 2048, small ? 1024 : 2048);
    sun.shadow.camera.left = -24; sun.shadow.camera.right = 24;
    sun.shadow.camera.top = 24; sun.shadow.camera.bottom = -24;
    sun.shadow.camera.near = 5; sun.shadow.camera.far = 80;
    sun.shadow.bias = -0.0006;
    scene.add(sun);

    var view = { yaw: 0.55, pitch: 1.12, dist: 38 };
    var goal = { yaw: view.yaw, pitch: view.pitch, dist: 38 };
    var auto = !reduce;
    var target = new THREE.Vector3(0, 1.8, 1.5);
    function place() {
      camera.position.set(
        target.x + view.dist * Math.sin(view.pitch) * Math.sin(view.yaw),
        target.y + view.dist * Math.cos(view.pitch),
        target.z + view.dist * Math.sin(view.pitch) * Math.cos(view.yaw));
      camera.lookAt(target);
    }
    var need = true;
    function resize() {
      var w = host.clientWidth, h = host.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.updateProjectionMatrix();
      need = true;
    }
    new ResizeObserver(resize).observe(host);
    resize();

    var el = renderer.domElement, drag = null;
    el.addEventListener('pointerdown', function (e) {
      drag = { x: e.clientX, y: e.clientY, yaw: goal.yaw, pitch: goal.pitch };
      el.setPointerCapture(e.pointerId); host.classList.add('is-dragging'); auto = false;
    });
    el.addEventListener('pointermove', function (e) {
      if (!drag) return;
      goal.yaw = drag.yaw - (e.clientX - drag.x) * 0.008;
      goal.pitch = Math.min(1.35, Math.max(0.7, drag.pitch - (e.clientY - drag.y) * 0.005));
    });
    function up() { drag = null; host.classList.remove('is-dragging'); }
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);

    var visible = false, raf = 0, last = 0;
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(tick);
    }, { threshold: 0.05 }).observe(host);

    function tick(t) {
      raf = 0;
      if (!visible) return;
      var dt = Math.min(0.05, (t - last) / 1000 || 0.016); last = t;
      if (auto) goal.yaw += dt * 0.18;
      var k = 1 - Math.pow(0.002, dt);
      var dy = goal.yaw - view.yaw, dp = goal.pitch - view.pitch, dd = goal.dist - view.dist;
      view.yaw += dy * k; view.pitch += dp * k; view.dist += dd * k;
      if (auto || need || Math.abs(dy) > 1e-4 || Math.abs(dp) > 1e-4 || Math.abs(dd) > 0.01) { place(); renderer.render(scene, camera); need = false; }
      raf = requestAnimationFrame(tick);
    }
    rebuild();
    place();
    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  }
})();

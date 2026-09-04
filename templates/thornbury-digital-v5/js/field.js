/* Thornbury Digital v5 — js/field.js
   The Thomas attractor as molten chrome.
   Plain 2D canvas, no dependencies. One instance survives the whole session:
   js/bg.js drives its camera and its world between pages.

   Attractor    x' = sin y − b·x   y' = sin z − b·y   z' = sin x − b·z
                Euler, dt = 0.02, 60 steps per second. b is per-world (see below).
   Strands      particles are seeded in strands of 24: a leader is settled onto the
                attractor (240 warm steps), then each follower is placed two steps
                behind the one before it. A strand therefore lies along one
                trajectory and draws as one continuous string, not as dust.
   Segments     every particle draws the segment from its previous screen position
                to its current one; the length IS the velocity, so fast stretches
                draw long, thin, bright and slow bends draw short, heavy, dim.
   Wipe         each frame is covered with rgba(8,8,8,0.08) before drawing, so a
                trail decays to 1/e in ~12 frames. Every 7th frame the wipe is
                0.24 to clear the 8-bit quantisation floor a soft wipe leaves behind.
   Metal        additive compositing ('lighter'); luminance = 0.22 + 0.45·depth +
                0.6·spec where spec = |t̂·L|³ against a key light — strands aligned
                with the light flare to white, the rest sit as grey chrome,
                crossings pool to white like mercury. L is per-page: moving it is
                a change of mood without a change of world.
   Projection   Ry(rot)·Rx(tilt), orthographic, S = 0.10·min(vw, vh)·zoom·(4.6/ext)
                px per unit — the ext term keeps a looser attractor from outgrowing
                the frame. Depth d ∈ [0,1] scales width ×(0.5 + 0.8d) and alpha
                ×(0.45 + 0.55d).

   Worlds       b sets the character, and b also sets the size and the speed, so a
                world carries its own ext and vnorm. Measured over 200 trajectories,
                4,000 warm steps, 98th-percentile extent and mean |v|:

                  b      extent   mean|v|      reads as
                  0.130   4.88     1.09        wide, slow, sparse
                  0.155   4.55     1.04        large and restless
                  0.190   4.01     0.76        the classic tangle
                  0.205   3.84     0.73        near the edge of chaos: orderly loops

                Above b ≈ 0.208 it stops being chaotic and collapses, so 0.205 is
                the far end of the usable range, not an arbitrary number. */
(function (global) {
  'use strict';

  var DT = 0.02;
  var SUB = 1;
  var STEP = 1 / 60;
  var DRAW_STEP = 1 / 30;   /* the field is ambient: physics at 60, paint at 30 */
  var STRAND = 24;
  var EXT0 = 4.6;           /* the reference extent the scale is normalised against */

  function hash(n) {
    var s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return s - Math.floor(s);
  }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function smooth(u) { return u * u * (3 - 2 * u); }

  function start(canvas, opts) {
    opts = opts || {};
    var ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return null;

    var still = !!opts.still;
    var coarse = matchMedia('(pointer: coarse)').matches;
    var mobile = Math.min(innerWidth, innerHeight) < 700 || coarse;
    var N = mobile ? 900 : 2600;
    var NA = N;

    var P = new Float32Array(N * 3);
    var V = new Float32Array(N);
    var kind = new Uint8Array(N);
    var PX = new Float32Array(N), PY = new Float32Array(N);
    var valid = new Uint8Array(N);

    /* ---- world: the attractor's own parameters, and they are tweenable.
       b is continuous in the vector field, so easing it while the integrator
       runs reshapes the existing trajectories instead of replacing them. ---- */
    var law = { b: 0.19, ext: 4.6, vn: 1.3 };

    /* Seeding is the one genuinely expensive thing here: 240 warm steps per
       strand, ~108 strands, and doing it all in one frame cost a measured 212 ms.
       It is therefore a job that can be spread over several frames — a transition
       has a ghost over it anyway, so a half-built world is never seen. */
    var seedQ = null;

    function seedStrand(q) {
      var B = q.b, seed = q.seed, s = q.s;
      var x = (hash(seed * 7.1 + s * 3.1 + 1) - 0.5) * 6;
      var y = (hash(seed * 7.3 + s * 3.3 + 2) - 0.5) * 6;
      var z = (hash(seed * 7.7 + s * 3.7 + 3) - 0.5) * 6;
      for (var w = 0; w < 240; w++) {
        var vx = Math.sin(y) - B * x, vy = Math.sin(z) - B * y, vz = Math.sin(x) - B * z;
        x += vx * 0.03; y += vy * 0.03; z += vz * 0.03;
      }
      var ember = hash(seed + s * 1.7 + 9) < 0.045 ? 1 : 0;
      for (var k = 0; k < STRAND && q.i < NA; k++, q.i++) {
        var i = q.i;
        P[i * 3] = x; P[i * 3 + 1] = y; P[i * 3 + 2] = z;
        kind[i] = ember;
        valid[i] = 0;                 /* its old screen position is meaningless now */
        for (var qq = 0; qq < 2; qq++) {
          vx = Math.sin(y) - B * x; vy = Math.sin(z) - B * y; vz = Math.sin(x) - B * z;
          x += vx * DT; y += vy * DT; z += vz * DT;
        }
      }
      q.s++;
    }

    function seedStep(strands) {
      if (!seedQ) return;
      var n = 0;
      while (seedQ.i < NA && n < strands) { seedStrand(seedQ); n++; }
      if (seedQ.i >= NA) seedQ = null;
    }

    function seedWorld(seed, b, chunked) {
      law.b = b;
      seedQ = { seed: seed, b: b, i: 0, s: 0 };
      if (chunked) return;            /* the rAF loop finishes it */
      seedStep(1e9);
      valid.fill(0);
    }

    /* ---- camera: every term here is tweenable, and a page is just a set of them ---- */
    var drift = hash((opts.seed || 0) + 0.5) * 6.283;
    var cam = { rot: 0, tilt: 0.5, ax: 0.5, ay: 0.5, zoom: 1, lx: 0.6, ly: -0.8 };

    function norml(o) {
      var m = Math.sqrt(o.lx * o.lx + o.ly * o.ly) || 1;
      o.lx /= m; o.ly /= m;
    }

    /* one eased tween over a named set of an object's numeric keys */
    function tweener(obj, keys, after) {
      var A = null, B = null, t = 0, dur = 0;
      function finish() { if (after) after(obj); }
      return {
        set: function (to) {
          for (var i = 0; i < keys.length; i++) {
            var k = keys[i];
            if (to[k] != null) obj[k] = to[k];
          }
          A = B = null;
          finish();
        },
        to: function (to, d) {
          if (!d) { this.set(to); return; }
          A = {}; B = {};
          for (var i = 0; i < keys.length; i++) {
            var k = keys[i];
            A[k] = obj[k];
            B[k] = to[k] == null ? obj[k] : to[k];
          }
          if (after) after(B);
          t = 0; dur = d;
        },
        step: function (dt) {
          if (!B) return;
          t += dt;
          var u = t >= dur ? 1 : smooth(t / dur);
          for (var i = 0; i < keys.length; i++) {
            var k = keys[i];
            obj[k] = A[k] + (B[k] - A[k]) * u;
          }
          finish();
          if (u === 1) { A = B = null; }
        },
        busy: function () { return !!B; }
      };
    }

    var camTw = tweener(cam, ['rot', 'tilt', 'ax', 'ay', 'zoom', 'lx', 'ly'], norml);
    var lawTw = tweener(law, ['b', 'ext', 'vn'], null);
    function tweensStep(dt) { camTw.step(dt); lawTw.step(dt); }

    var W = 1, Hh = 1, dpr = 1, S = 1, wScale = 1;
    var rot = drift, rotP = 0, tiltP = 0, px = 0, py = 0, tx = 0, ty = 0;
    var running = false, raf = 0, last = 0, acc = 0, drawAcc = 0, frameNo = 0, painted = 0;
    /* One reusable Float64Array per bucket with its own fill count. Plain arrays
       plus length = 0 churn their backing store every frame, which showed up as a
       5% tail of ~18 ms frames; these only ever grow. */
    var KEYMAX = 2 * 16 * 20 * 16;
    var bufs = new Array(KEYMAX);
    var lens = new Int32Array(KEYMAX);
    for (var bi = 0; bi < KEYMAX; bi++) bufs[bi] = null;
    var activeKeys = new Int32Array(KEYMAX);
    var activeN = 0;
    var warmLeft = 0;

    function integrate() {
      var h = DT / SUB;
      var B = law.b;
      for (var i = 0; i < NA; i++) {
        var x = P[i * 3], y = P[i * 3 + 1], z = P[i * 3 + 2], sp = 0;
        for (var s = 0; s < SUB; s++) {
          var vx = Math.sin(y) - B * x, vy = Math.sin(z) - B * y, vz = Math.sin(x) - B * z;
          x += vx * h; y += vy * h; z += vz * h;
          sp = vx * vx + vy * vy + vz * vz;
        }
        P[i * 3] = x; P[i * 3 + 1] = y; P[i * 3 + 2] = z;
        V[i] = Math.sqrt(sp);
      }
    }

    function resize() {
      dpr = Math.min(devicePixelRatio || 1, mobile ? 1.25 : 1.5);
      W = Math.max(1, canvas.clientWidth);
      Hh = Math.max(1, canvas.clientHeight);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(Hh * dpr);
      wScale = clamp(Math.min(W, Hh) / 900, 0.7, 1.3);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#080808';
      ctx.fillRect(0, 0, W, Hh);
      valid.fill(0);
    }

    function put(k, lumQ, aQ, wQ, x0, y0, x1, y1) {
      var key = ((k * 16 + lumQ) * 20 + aQ) * 16 + wQ;
      var arr = bufs[key];
      var n = lens[key];
      if (arr === null) { arr = bufs[key] = new Float64Array(256); }
      else if (n + 4 > arr.length) {
        var bigger = new Float64Array(arr.length * 2);
        bigger.set(arr);
        arr = bufs[key] = bigger;
      }
      if (n === 0) activeKeys[activeN++] = key;
      arr[n] = x0; arr[n + 1] = y0; arr[n + 2] = x1; arr[n + 3] = y1;
      lens[key] = n + 4;
    }

    function flush() {
      for (var ai = 0; ai < activeN; ai++) {
        var key = activeKeys[ai];
        var arr = bufs[key];
        var used = lens[key];
        var wQ = key % 16; var rest = (key - wQ) / 16;
        var aQ = rest % 20; rest = (rest - aQ) / 20;
        var lumQ = rest % 16; var k = (rest - lumQ) / 16;
        var L = lumQ / 12 * 1.3;
        var A = aQ / 16;
        var c;
        if (k) {
          c = 'rgba(255,42,0,' + (A * (0.5 + 0.5 * L)).toFixed(3) + ')';
        } else {
          var v = Math.min(255, Math.round(225 * L));
          c = 'rgba(' + v + ',' + v + ',' + v + ',' + A.toFixed(3) + ')';
        }
        ctx.strokeStyle = c;
        ctx.lineWidth = wQ / 4;
        ctx.beginPath();
        for (var i = 0; i < used; i += 4) {
          ctx.moveTo(arr[i], arr[i + 1]);
          ctx.lineTo(arr[i + 2], arr[i + 3]);
        }
        ctx.stroke();
        lens[key] = 0;
      }
      activeN = 0;
    }

    function drawFrame(wipe) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(8,8,8,' + wipe + ')';
      ctx.fillRect(0, 0, W, Hh);

      var EXT = law.ext, VN = law.vn;
      S = Math.min(W, Hh) * 0.10 * cam.zoom * (EXT0 / EXT);
      var cx = W * cam.ax + px * W * 0.03;
      var cy = Hh * cam.ay + py * Hh * 0.03;
      var cr = Math.cos(rot + cam.rot + rotP), sr = Math.sin(rot + cam.rot + rotP);
      var ct = Math.cos(cam.tilt + tiltP), st = Math.sin(cam.tilt + tiltP);
      var LX = cam.lx, LY = cam.ly;
      /* a camera tween moves every particle at once; the stale-segment guard has
         to open up for it or the whole field strobes while the camera travels */
      var maxSeg = (camTw.busy() || lawTw.busy()) ? 150 : 48;

      ctx.globalCompositeOperation = 'lighter';
      ctx.lineCap = 'round';

      for (var i = 0; i < NA; i++) {
        var x = P[i * 3], y = P[i * 3 + 1], z = P[i * 3 + 2];
        var x1 = x * cr + z * sr, z1 = -x * sr + z * cr;
        var y2 = y * ct - z1 * st, z2 = y * st + z1 * ct;
        var sx = cx + S * x1, sy = cy - S * y2;
        var d = clamp((z2 + EXT) / (2 * EXT), 0, 1);
        if (!valid[i]) { PX[i] = sx; PY[i] = sy; valid[i] = 1; continue; }
        var x0 = PX[i], y0 = PY[i];
        PX[i] = sx; PY[i] = sy;
        var dx = sx - x0, dy = sy - y0;
        var len = Math.sqrt(dx * dx + dy * dy);
        if (len < 0.12 || len > maxSeg) continue;
        if ((x0 < -8 && sx < -8) || (x0 > W + 8 && sx > W + 8) ||
            (y0 < -8 && sy < -8) || (y0 > Hh + 8 && sy > Hh + 8)) continue;
        var spec = Math.abs((dx * LX + dy * LY) / len);
        spec = spec * spec * spec;
        var sp = clamp(V[i] / VN, 0, 1);
        var lum = 0.22 + 0.45 * d + 0.6 * spec;
        var A = (0.16 + 0.3 * sp) * (0.45 + 0.55 * d);
        var lw = (2.1 - 1.1 * sp) * (0.5 + 0.8 * d) * wScale;
        put(kind[i],
            Math.round(clamp(lum, 0, 1.3) / 1.3 * 12),
            Math.round(clamp(A, 0, 1) * 16),
            clamp(Math.round(lw * 4), 1, 15),
            x0, y0, sx, sy);
      }
      flush();
      ctx.globalCompositeOperation = 'source-over';
      painted++;
    }

    function frame(t) {
      if (!running) return;
      var dt = last ? Math.min(0.05, (t - last) / 1000) : 0.016;
      last = t;
      if (seedQ) seedStep(Math.ceil(NA / STRAND / 6));
      acc += dt;
      var steps = 0;
      while (acc >= STEP && steps < 3) { integrate(); acc -= STEP; steps++; }
      rot += dt * 0.06;
      tweensStep(dt);
      var e = 1 - Math.exp(-dt * 2.4);
      rotP += (tx * 0.25 - rotP) * e;
      tiltP += (ty * 0.12 - tiltP) * e;
      px += (tx - px) * e;
      py += (ty - py) * e;
      /* Painting every other frame halves the cost and is invisible on a drift
         this slow. Segments then span two sim steps, so the wipe is doubled to
         keep the trail the same length in wall-clock terms. */
      drawAcc += dt;
      if (drawAcc >= DRAW_STEP) {
        drawAcc = drawAcc > DRAW_STEP * 3 ? 0 : drawAcc - DRAW_STEP;
        frameNo++;
        drawFrame(frameNo % 5 === 0 ? 0.4 : 0.15);
      }
      raf = requestAnimationFrame(frame);
    }

    /* Still pages pour the strands in and then leave them. Four draws per rAF,
       not twelve: the trail is at steady state well before 54 frames, and a
       bigger batch put a 60 ms long task in the middle of page load. */
    function warm() {
      var n = Math.min(warmLeft, 4);
      for (var f = 0; f < n; f++) {
        if (seedQ) seedStep(Math.ceil(NA / STRAND / 6));
        integrate();
        rot += 0.0008;
        tweensStep(1 / 60);
        drawFrame(0.13);
      }
      warmLeft -= n;
      if (warmLeft > 0) raf = requestAnimationFrame(warm);
    }
    function settle(n) {
      running = false;
      cancelAnimationFrame(raf);
      warmLeft = n || 54;
      warm();
    }
    function run() {
      if (running) return;
      running = true;
      last = 0; acc = 0; drawAcc = 0;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(frame);
    }

    function onPointer(ev) {
      tx = (ev.clientX / W - 0.5) * 2;
      ty = (ev.clientY / Hh - 0.5) * 2;
    }
    var rt;
    function onResize() {
      clearTimeout(rt);
      rt = setTimeout(function () {
        resize();
        if (still) settle();
      }, 120);
    }
    function onVis() { last = 0; }

    seedWorld(opts.seed || 0, 0.19);
    if (opts.ax != null) cam.ax = opts.ax;
    if (opts.ay != null) cam.ay = opts.ay;
    resize();
    global.addEventListener('resize', onResize);
    if (!coarse) global.addEventListener('pointermove', onPointer, { passive: true });
    document.addEventListener('visibilitychange', onVis);

    if (still) {
      settle();
    } else {
      drawFrame(1);
      run();
    }

    return {
      count: N,
      isStill: function () { return still; },
      /* the hero film covers the canvas completely until it starts dissolving;
         simulating and drawing behind an opaque video is pure waste */
      setActive: function (on) {
        if (still) return;
        if (on) run();
        else if (running) { running = false; cancelAnimationFrame(raf); }
      },
      /* still is a policy, not a construction detail: a persistent field has to
         be able to wake up on a page that was built static */
      setStill: function (on, warmFrames) {
        if (on === still) { if (on) settle(warmFrames); return; }
        still = on;
        if (on) settle(warmFrames);
        else run();
      },
      camera: function (to, dur) { if (dur) camTw.to(to, dur); else camTw.set(to); },
      /* Change the attractor's own constant instead of reseeding: the strands
         stay the strands and the tangle reshapes into the next page's law. */
      lawTo: function (spec, dur) {
        lawTw.to({ b: spec.b, ext: spec.ext, vn: spec.vn }, dur);
      },
      /* reseeding costs one frame; callers hide it behind the ghost */
      world: function (spec) {
        lawTw.set({ b: spec.b, ext: spec.ext, vn: spec.vn });
        var want = spec.density == null ? N : Math.max(STRAND, Math.round(N * spec.density));
        NA = Math.min(N, want);
        seedWorld(spec.seed || 0, spec.b || 0.19, !!spec.chunked);
      },
      /* draw n frames right now — enough that a freshly seeded world is not an
         empty screen the instant a dissolve starts */
      pour: function (n) {
        for (var f = 0; f < n; f++) { integrate(); drawFrame(f === 0 ? 1 : 0.13); }
      },
      size: function () { return { w: canvas.width, h: canvas.height, dpr: dpr }; },
      state: function () { return { b: law.b, ext: law.ext, vn: law.vn, zoom: cam.zoom, n: NA }; },
      frames: function () { return painted; },
      active: function () { return running; },
      redraw: function () { drawFrame(0.15); },
      stop: function () {
        running = false;
        cancelAnimationFrame(raf);
        global.removeEventListener('resize', onResize);
        global.removeEventListener('pointermove', onPointer);
        document.removeEventListener('visibilitychange', onVis);
      }
    };
  }

  global.TBField = { start: start };
})(window);

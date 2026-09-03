/* Thornbury Digital v5 — js/field.js
   The Thomas attractor as molten chrome.
   Plain 2D canvas, no dependencies. Live on Home and Studio; still on Work and Contact.

   Attractor    x' = sin y − b·x   y' = sin z − b·y   z' = sin x − b·z   b = 0.19
                Euler, dt = 0.02 in two sub-steps, 60 steps per second.
   Strands      particles are seeded in strands of 24: a leader is settled onto the
                attractor (400 warm steps), then each follower is placed two steps
                behind the one before it. A strand therefore lies along one
                trajectory and draws as one continuous string, not as dust.
   Segments     every particle draws the segment from its previous screen position
                to its current one; the length IS the velocity, so fast stretches
                draw long, thin, bright and slow bends draw short, heavy, dim.
   Wipe         each frame is covered with rgba(8,8,8,0.08) before drawing, so a
                trail decays to 1/e in ~12 frames. Every 7th frame the wipe is
                0.24 to clear the 8-bit quantisation floor a soft wipe leaves behind.
   Metal        additive compositing ('lighter'); luminance = 0.22 + 0.45·depth +
                0.6·spec where spec = |t̂·L|³ against a fixed key light from the
                upper right — strands aligned with the light flare to white, the
                rest sit as grey chrome, crossings pool to white like mercury.
   Projection   Ry(rot)·Rx(tilt), orthographic, S = 0.10·min(vw, vh) px per unit;
                depth d ∈ [0,1] scales width ×(0.5 + 0.8d) and alpha ×(0.45 + 0.55d). */
(function (global) {
  'use strict';

  var B = 0.19;
  var DT = 0.02;
  var SUB = 2;
  var EXT = 4.6;
  var STEP = 1 / 60;
  var STRAND = 24;
  var LX = 0.6, LY = -0.8;

  function hash(n) {
    var s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return s - Math.floor(s);
  }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  function start(canvas, opts) {
    opts = opts || {};
    var ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return null;

    var still = !!opts.still;
    var coarse = matchMedia('(pointer: coarse)').matches;
    var mobile = Math.min(innerWidth, innerHeight) < 700 || coarse;
    var N = mobile ? 900 : 2600;
    var seed = opts.seed || 0;
    var ax = opts.ax == null ? 0.5 : opts.ax;
    var ay = opts.ay == null ? 0.5 : opts.ay;

    var P = new Float32Array(N * 3);
    var V = new Float32Array(N);
    var kind = new Uint8Array(N);
    var PX = new Float32Array(N), PY = new Float32Array(N);
    var valid = new Uint8Array(N);

    /* seed strands along the flow */
    var i = 0, s = 0;
    while (i < N) {
      var x = (hash(seed * 7.1 + s * 3.1 + 1) - 0.5) * 6;
      var y = (hash(seed * 7.3 + s * 3.3 + 2) - 0.5) * 6;
      var z = (hash(seed * 7.7 + s * 3.7 + 3) - 0.5) * 6;
      for (var w = 0; w < 400; w++) {
        var vx = Math.sin(y) - B * x, vy = Math.sin(z) - B * y, vz = Math.sin(x) - B * z;
        x += vx * 0.03; y += vy * 0.03; z += vz * 0.03;
      }
      var ember = hash(seed + s * 1.7 + 9) < 0.045 ? 1 : 0;
      for (var k = 0; k < STRAND && i < N; k++, i++) {
        P[i * 3] = x; P[i * 3 + 1] = y; P[i * 3 + 2] = z;
        kind[i] = ember;
        for (var q = 0; q < 2; q++) {
          vx = Math.sin(y) - B * x; vy = Math.sin(z) - B * y; vz = Math.sin(x) - B * z;
          x += vx * DT; y += vy * DT; z += vz * DT;
        }
      }
      s++;
    }

    var W = 1, Hh = 1, dpr = 1, S = 1, wScale = 1;
    var rot = hash(seed + 0.5) * 6.283, tilt = 0.5;
    var rotP = 0, tiltP = 0, px = 0, py = 0, tx = 0, ty = 0;
    var running = false, raf = 0, last = 0, acc = 0, frameNo = 0, painted = 0;
    var buckets = new Map();
    var warmLeft = 0;

    function integrate() {
      var h = DT / SUB;
      for (var i = 0; i < N; i++) {
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
      S = Math.min(W, Hh) * 0.10;
      wScale = clamp(Math.min(W, Hh) / 900, 0.7, 1.3);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#080808';
      ctx.fillRect(0, 0, W, Hh);
      valid.fill(0);
    }

    function put(k, lumQ, aQ, wQ, x0, y0, x1, y1) {
      var key = ((k * 16 + lumQ) * 20 + aQ) * 16 + wQ;
      var arr = buckets.get(key);
      if (!arr) { arr = []; buckets.set(key, arr); }
      arr.push(x0, y0, x1, y1);
    }

    function flush() {
      buckets.forEach(function (arr, key) {
        if (!arr.length) return;
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
        for (var i = 0; i < arr.length; i += 4) {
          ctx.moveTo(arr[i], arr[i + 1]);
          ctx.lineTo(arr[i + 2], arr[i + 3]);
        }
        ctx.stroke();
        arr.length = 0;
      });
    }

    function drawFrame(wipe) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(8,8,8,' + wipe + ')';
      ctx.fillRect(0, 0, W, Hh);

      var cx = W * ax + px * W * 0.03;
      var cy = Hh * ay + py * Hh * 0.03;
      var cr = Math.cos(rot + rotP), sr = Math.sin(rot + rotP);
      var ct = Math.cos(tilt + tiltP), st = Math.sin(tilt + tiltP);

      ctx.globalCompositeOperation = 'lighter';
      ctx.lineCap = 'round';

      for (var i = 0; i < N; i++) {
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
        if (len < 0.12 || len > 48) continue;
        if ((x0 < -8 && sx < -8) || (x0 > W + 8 && sx > W + 8) ||
            (y0 < -8 && sy < -8) || (y0 > Hh + 8 && sy > Hh + 8)) continue;
        var spec = Math.abs((dx * LX + dy * LY) / len);
        spec = spec * spec * spec;
        var sp = clamp(V[i] / 1.3, 0, 1);
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
      acc += dt;
      var steps = 0;
      while (acc >= STEP && steps < 3) { integrate(); acc -= STEP; steps++; }
      rot += dt * 0.06;
      var e = 1 - Math.exp(-dt * 2.4);
      rotP += (tx * 0.25 - rotP) * e;
      tiltP += (ty * 0.12 - tiltP) * e;
      px += (tx - px) * e;
      py += (ty - py) * e;
      frameNo++;
      drawFrame(frameNo % 7 === 0 ? 0.24 : 0.08);
      raf = requestAnimationFrame(frame);
    }

    /* still pages: pour the strands in over a few frames, then leave them */
    function warm() {
      var n = Math.min(warmLeft, 12);
      for (var f = 0; f < n; f++) {
        integrate();
        rot += 0.0008;
        drawFrame(0.07);
      }
      warmLeft -= n;
      if (warmLeft > 0) raf = requestAnimationFrame(warm);
    }
    function settle() {
      cancelAnimationFrame(raf);
      warmLeft = 84;
      warm();
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

    resize();
    global.addEventListener('resize', onResize);

    if (still) {
      settle();
    } else {
      running = true;
      drawFrame(1);
      raf = requestAnimationFrame(frame);
      if (!coarse) global.addEventListener('pointermove', onPointer, { passive: true });
      document.addEventListener('visibilitychange', onVis);
    }

    return {
      still: still,
      count: N,
      frames: function () { return painted; },
      redraw: function () { drawFrame(0.08); },
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

/* =====================================================================
   INTERACTION-001 — WARP
   A loom held under tension. The visitor is the weft.

   Design rules this file obeys:
   - The hero gesture costs nothing: MOVING the pointer strums. No click,
     no instruction, no onboarding. The instrument sings first.
   - Plucks are triggered by CROSSING a thread, not by being near one.
     Crossing is what makes a sweep feel like discrete strings rather than
     a smear, and it is what lets speed mean something.
   - Every thread is tuned to a pentatonic degree, so there is no wrong
     note. Playability is a design decision, not a happy accident.
   - Touch is not an afterthought: pointers are tracked by id, so a phone
     gets chords, which a single mouse can never play.
   ===================================================================== */
(function () {
  "use strict";

  var canvas = document.getElementById("warp");
  if (!canvas) return;
  var ctx = canvas.getContext("2d", { alpha: false });

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------------
     TUNING
     --------------------------------------------------------------- */
  var PENTATONIC = [0, 2, 4, 7, 9];          // major pentatonic — no wrong notes
  var MAX_VOICES = 22;

  var cfg = {};
  function configure() {
    var narrow = window.innerWidth < 720;
    cfg.count = narrow ? 14 : 24;
    cfg.baseMidi = narrow ? 57 : 45;          // phones start an octave up: small speakers
    cfg.grabRadius = narrow ? 34 : 40;
    cfg.margin = narrow ? 26 : 64;
  }

  function midiToFreq(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  function degreeToMidi(i) {
    var oct = Math.floor(i / PENTATONIC.length);
    return cfg.baseMidi + oct * 12 + PENTATONIC[i % PENTATONIC.length];
  }

  /* ---------------------------------------------------------------
     THREADS
     --------------------------------------------------------------- */
  var threads = [];
  var coupleBuf = new Float64Array(0);   // allocated once per layout, never per frame
  var W = 0, H = 0, dpr = 1;
  var bgGrad = null, bloomTex = null;

  /* Paints are rebuilt on resize only. Rebuilding a gradient every frame —
     and worse, evaluating a full-screen radial one — is what took this from
     60fps to the high twenties while the field was lit. */
  function buildPaints() {
    bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, "#100e26");
    bgGrad.addColorStop(0.55, "#15122f");
    bgGrad.addColorStop(1, "#0c0a1d");

    if (!bloomTex) {
      // The collective bloom is baked once into a small texture. Scaling it
      // up costs a bilinear sample per pixel instead of a gradient solve.
      var s = 256;
      bloomTex = document.createElement("canvas");
      bloomTex.width = s; bloomTex.height = s;
      var bx = bloomTex.getContext("2d");
      var rg = bx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
      rg.addColorStop(0, "rgba(120,150,255,1)");
      rg.addColorStop(1, "rgba(120,150,255,0)");
      bx.fillStyle = rg;
      bx.fillRect(0, 0, s, s);
    }
  }

  function buildThreads() {
    threads = [];
    var n = cfg.count;
    coupleBuf = new Float64Array(n);
    var usable = W - cfg.margin * 2;
    for (var i = 0; i < n; i++) {
      var t = n === 1 ? 0.5 : i / (n - 1);
      var midi = degreeToMidi(i);
      // Visual wobble must stay far below audio rate or it aliases into a
      // blur. Capped at 6 Hz — that is still 10 frames per cycle at 60fps,
      // which reads as vibration rather than strobing. Pitch still shows:
      // high threads shiver, low threads sway.
      var rate = 2.6 + t * 3.4;
      threads.push({
        i: i,
        x: cfg.margin + usable * t,
        amp: 0,
        vel: 0,
        peak: 0.5,
        heat: 0,
        held: null,           // pointerId currently grabbing this thread
        freq: midiToFreq(midi),
        omega: rate * Math.PI * 2,
        // Short tight strings throw a smaller arc than long slack ones.
        ampScale: 1 - t * 0.45,
        // Low threads sustain longer, exactly like real strings.
        decay: 1.9 - t * 1.05,
        hue: 168 + (8 - 168) * Math.pow(t, 0.85),
        width: 2.6 - t * 1.25
      });
    }
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    configure();
    buildPaints();
    var prev = threads;
    var prevCount = prev.length;
    buildThreads();
    // Carry live motion across a resize so the field never "resets" mid-play.
    for (var i = 0; i < threads.length && i < prevCount; i++) {
      threads[i].amp = prev[i].amp;
      threads[i].vel = prev[i].vel;
      threads[i].heat = prev[i].heat;
    }
    // A rotated phone changes the thread count, and therefore the tuning —
    // the pre-rendered notes have to be rebuilt or pitches would drift off
    // their threads.
    if (actx && prevCount !== threads.length) {
      buffers = threads.map(function (t) { return renderPluck(actx, t.freq); });
    }
  }

  /* ---------------------------------------------------------------
     AUDIO — Karplus-Strong, pre-rendered once per note.
     Runtime cost per pluck is then just a buffer source, which keeps
     fast sweeps cheap.
     --------------------------------------------------------------- */
  var actx = null, master = null, verb = null, buffers = null, voices = 0;
  var soundOn = true;

  function makeImpulse(ac, seconds, decay) {
    var len = Math.floor(ac.sampleRate * seconds);
    var buf = ac.createBuffer(2, len, ac.sampleRate);
    for (var c = 0; c < 2; c++) {
      var d = buf.getChannelData(c);
      for (var i = 0; i < len; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
      }
    }
    return buf;
  }

  function renderPluck(ac, freq) {
    var sr = ac.sampleRate;
    var seconds = 1.5;
    var n = Math.floor(sr * seconds);
    var period = Math.max(2, Math.round(sr / freq));
    var buf = ac.createBuffer(1, n, sr);
    var out = buf.getChannelData(0);

    // Excite the delay line with a short noise burst, then low-pass the
    // feedback: the classic plucked-string algorithm.
    var line = new Float32Array(period);
    for (var i = 0; i < period; i++) line[i] = Math.random() * 2 - 1;

    var idx = 0, prev = 0;
    var blend = 0.5;
    var damp = 0.996;
    for (var s = 0; s < n; s++) {
      var cur = line[idx];
      var avg = (cur + prev) * blend * damp;
      line[idx] = avg;
      prev = cur;
      out[s] = avg;
      idx = (idx + 1) % period;
    }
    // Gentle fade-out so nothing clicks at the tail.
    var fade = Math.floor(sr * 0.25);
    for (var f = 0; f < fade; f++) {
      out[n - 1 - f] *= f / fade;
    }
    return buf;
  }

  function initAudio() {
    if (actx) return;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) { soundOn = false; return; }
    actx = new AC();

    master = actx.createGain();
    master.gain.value = 0.5;

    verb = actx.createConvolver();
    verb.buffer = makeImpulse(actx, 2.0, 2.6);
    var verbGain = actx.createGain();
    verbGain.gain.value = 0.32;

    master.connect(actx.destination);
    master.connect(verbGain);
    verbGain.connect(verb);
    verb.connect(actx.destination);

    buffers = threads.map(function (t) { return renderPluck(actx, t.freq); });
  }

  function playNote(thread, velocity) {
    if (!soundOn || !actx || !buffers || voices >= MAX_VOICES) return;
    var buf = buffers[thread.i];
    if (!buf) return;

    var src = actx.createBufferSource();
    src.buffer = buf;

    var g = actx.createGain();
    g.gain.value = Math.min(0.9, 0.1 + velocity * 0.75);

    // Harder plucks are brighter — the single most important dynamic cue.
    var lp = actx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 700 + velocity * 5200;

    src.connect(lp); lp.connect(g); g.connect(master);
    voices++;
    src.onended = function () { voices--; };
    src.start();
  }

  /* ---------------------------------------------------------------
     INPUT — pointer id map, so touch gets chords
     --------------------------------------------------------------- */
  var pointers = new Map();
  var crossings = 0;
  var hasPlayed = false;

  var elHint = document.getElementById("hint");
  var elCount = document.getElementById("count");

  function markPlayed() {
    if (hasPlayed) return;
    hasPlayed = true;
    document.body.classList.add("is-playing");
    initAudio();
  }

  function nearestThread(x, radius) {
    var best = null, bestD = radius;
    for (var i = 0; i < threads.length; i++) {
      var d = Math.abs(threads[i].x - x);
      if (d < bestD) { bestD = d; best = threads[i]; }
    }
    return best;
  }

  function pluck(thread, velocity, dir, peak) {
    var v = Math.min(1, velocity);
    // Specify the ARC we want to see, then convert to the impulse that
    // produces it (A = v/omega). Without this, high threads barely move
    // because their stiffness eats the same impulse.
    // Reduced motion keeps the instrument fully playable — this is direct
    // manipulation, not autonomous animation — but swings a shorter arc.
    var arc = (7 + v * 55) * thread.ampScale * (reduceMotion ? 0.55 : 1);
    thread.vel += dir * arc * thread.omega;
    thread.peak = peak;
    thread.heat = Math.min(1, thread.heat + 0.35 + v * 0.65);
    crossings++;
    if (elCount) elCount.textContent = crossings.toLocaleString();
    playNote(thread, v);
  }

  /** Walk the segment travelled since the last event and pluck every
      thread it crossed — so a fast flick still hits each one. */
  function sweep(p, x, y, dt) {
    var dx = x - p.x;
    // px per millisecond, calibrated so a brisk sweep (~2 px/ms) reads as
    // full velocity. Floor the interval so coalesced sub-frame events
    // aren't scored as slow.
    var speed = Math.min(1, Math.abs(dx) / Math.max(dt, 3) / 2.2);
    var lo = Math.min(p.x, x), hi = Math.max(p.x, x);
    var dir = dx >= 0 ? 1 : -1;
    var peak = Math.max(0.05, Math.min(0.95, y / H));

    for (var i = 0; i < threads.length; i++) {
      var t = threads[i];
      if (t.held !== null) continue;
      if (t.x > lo && t.x <= hi) {
        pluck(t, speed, dir, peak);
        markPlayed();
      }
    }
  }

  var HOLD_MS = 180;

  function onDown(e) {
    canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId);
    var p = {
      x: e.clientX, y: e.clientY, t: e.timeStamp,
      x0: e.clientX, grabbed: null, down: true, holdTimer: 0
    };

    if (e.pointerType === "mouse") {
      // A mouse already strums by hovering, so pressing can mean grab
      // immediately with no ambiguity.
      var t = nearestThread(e.clientX, cfg.grabRadius);
      if (t && t.held === null) { t.held = e.pointerId; p.grabbed = t; }
    } else {
      // Touch has no hover: dragging MUST strum, or the hero gesture is
      // unreachable on a phone — and with threads closer together than the
      // grab radius, an eager grab silently swallows every strum.
      // Pulling is opted into by pressing and staying still for a beat.
      p.holdTimer = setTimeout(function () {
        var cur = pointers.get(e.pointerId);
        if (!cur || cur.grabbed) return;
        if (Math.abs(cur.x - cur.x0) > 8) return;      // already strumming
        var th = nearestThread(cur.x, cfg.grabRadius);
        if (th && th.held === null) { th.held = e.pointerId; cur.grabbed = th; }
      }, HOLD_MS);
    }

    pointers.set(e.pointerId, p);
    markPlayed();
  }

  function onMove(e) {
    var p = pointers.get(e.pointerId);
    if (!p) {
      // Hover with no button held: this is the hero gesture on desktop.
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, t: e.timeStamp, grabbed: null, down: false });
      return;
    }

    if (p.grabbed) {
      // Pull one thread out of true and hold it there.
      var g = p.grabbed;
      var off = e.clientX - g.x;
      g.amp = Math.max(-170, Math.min(170, off));
      g.vel = 0;
      g.peak = Math.max(0.05, Math.min(0.95, e.clientY / H));
      g.heat = Math.max(g.heat, 0.42);
      p.x = e.clientX; p.y = e.clientY; p.t = e.timeStamp;
      return;
    }

    var events = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    for (var k = 0; k < events.length; k++) {
      var ev = events[k];
      var dt = Math.max(1, ev.timeStamp - p.t);
      sweep(p, ev.clientX, ev.clientY, dt);
      p.x = ev.clientX; p.y = ev.clientY; p.t = ev.timeStamp;
    }
  }

  function onUp(e) {
    var p = pointers.get(e.pointerId);
    if (p && p.holdTimer) clearTimeout(p.holdTimer);
    if (p && p.grabbed) {
      var g = p.grabbed;
      // Release. The displacement you pulled out IS the energy — the thread
      // simply starts oscillating from where you left it. Adding an impulse
      // on top would double-count it and snap unnaturally hard.
      var v = Math.min(1, Math.abs(g.amp) / 150);
      g.vel = 0;
      g.heat = Math.min(1, g.heat + 0.5 + v * 0.5);
      g.held = null;
      crossings++;
      if (elCount) elCount.textContent = crossings.toLocaleString();
      playNote(g, Math.max(0.25, v));
    }
    pointers.delete(e.pointerId);
  }

  function onLeave(e) {
    var p = pointers.get(e.pointerId);
    if (p && p.holdTimer) clearTimeout(p.holdTimer);
    if (p && p.grabbed) p.grabbed.held = null;
    pointers.delete(e.pointerId);
  }

  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove, { passive: true });
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", onUp);
  canvas.addEventListener("pointerleave", onLeave);
  // Keep a drag from turning into a text selection or a browser page-swipe.
  canvas.addEventListener("dragstart", function (e) { e.preventDefault(); });

  /* ---------------------------------------------------------------
     SIMULATION
     --------------------------------------------------------------- */
  var COUPLING = 0.04;
  var MAX_AMP = 220;

  function step(dt) {
    var i, t;
    for (i = 0; i < threads.length; i++) {
      t = threads[i];
      if (t.held !== null) continue;

      t.vel += -t.omega * t.omega * t.amp * dt;
      t.vel *= Math.pow(0.5, dt / t.decay);
      t.amp += t.vel * dt;
      if (t.amp > MAX_AMP) { t.amp = MAX_AMP; t.vel = 0; }
      else if (t.amp < -MAX_AMP) { t.amp = -MAX_AMP; t.vel = 0; }

      // The pluck point drifts back toward centre as upper harmonics die,
      // which is what real strings do and why they "round out" as they ring.
      t.peak += (0.5 - t.peak) * Math.min(1, dt * 1.1);
      t.heat *= Math.pow(0.5, dt / 1.25);

      if (Math.abs(t.amp) < 0.01 && Math.abs(t.vel) < 0.01) { t.amp = 0; t.vel = 0; }
    }

    // Neighbour coupling: energy travels sideways through the frame, so a
    // single hard pluck ripples outward instead of sitting alone. Scaled by
    // omega² so it behaves like a real spring to the neighbours rather than
    // an arbitrary nudge that means different things at different pitches.
    var deltas = coupleBuf;
    for (i = 1; i < threads.length - 1; i++) {
      deltas[i] = threads[i - 1].amp + threads[i + 1].amp - 2 * threads[i].amp;
    }
    for (i = 1; i < threads.length - 1; i++) {
      t = threads[i];
      if (t.held === null) t.vel += deltas[i] * COUPLING * t.omega * t.omega * dt;
    }
  }

  /* ---------------------------------------------------------------
     RENDER
     --------------------------------------------------------------- */
  var SEGMENTS = 18;

  function threadPath(t) {
    ctx.beginPath();
    for (var s = 0; s <= SEGMENTS; s++) {
      var u = s / SEGMENTS;
      // Smoothed triangular profile peaking where the thread was struck.
      var prof = u < t.peak
        ? (t.peak === 0 ? 0 : u / t.peak)
        : (t.peak === 1 ? 0 : (1 - u) / (1 - t.peak));
      prof = Math.sin(prof * Math.PI * 0.5);
      var x = t.x + t.amp * prof;
      var y = u * H;
      if (s === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
  }

  function draw() {
    // Ground
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    var energy = 0;
    for (var i = 0; i < threads.length; i++) energy += threads[i].heat;
    energy = Math.min(1, energy / (threads.length * 0.45));

    // Collective bloom — the whole frame answers a big strum.
    if (energy > 0.01) {
      var d = Math.max(W, H) * 1.24;
      ctx.globalAlpha = energy * 0.16;
      ctx.drawImage(bloomTex, (W - d) / 2, (H - d) / 2, d, d);
      ctx.globalAlpha = 1;
    }

    ctx.lineCap = "round";

    // Glow pass, additively blended. Every thread keeps a faint permanent
    // halo even at rest: untouched, the field has to read as something
    // under tension and worth touching, not as a set of hairlines.
    ctx.globalCompositeOperation = "lighter";
    for (i = 0; i < threads.length; i++) {
      var t = threads[i];
      threadPath(t);
      ctx.strokeStyle = "hsla(" + t.hue.toFixed(0) + ", 85%, 62%, " + (0.05 + t.heat * 0.28).toFixed(3) + ")";
      ctx.lineWidth = t.width + 3 + 7 * t.heat;
      ctx.stroke();
    }

    // Core pass
    ctx.globalCompositeOperation = "source-over";
    for (i = 0; i < threads.length; i++) {
      t = threads[i];
      var lum = 54 + t.heat * 28;
      var alpha = 0.46 + t.heat * 0.54;
      threadPath(t);
      ctx.strokeStyle = "hsla(" + t.hue.toFixed(0) + ", " + (56 + t.heat * 30).toFixed(0) + "%, " + lum.toFixed(0) + "%, " + alpha.toFixed(3) + ")";
      ctx.lineWidth = t.width;
      ctx.stroke();
    }

    // Anchor beams: the loom's top and bottom rails.
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "rgba(255,255,255,0.07)";
    ctx.fillRect(0, 0, W, 1);
    ctx.fillRect(0, H - 1, W, 1);
  }

  /* ---------------------------------------------------------------
     LOOP
     --------------------------------------------------------------- */
  var last = 0, raf = 0, running = true;

  function frame(now) {
    if (!running) return;
    // Clamped well under the stability limit for the stiffest thread
    // (omega·dt must stay below ~2 for semi-implicit Euler).
    var dt = last ? Math.min(0.033, (now - last) / 1000) : 0.016;
    last = now;
    step(dt);
    draw();
    raf = requestAnimationFrame(frame);
  }

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      running = false;
      cancelAnimationFrame(raf);
      if (actx && actx.state === "running") actx.suspend();
    } else if (!running) {
      running = true;
      last = 0;
      raf = requestAnimationFrame(frame);
      if (actx && actx.state === "suspended" && soundOn) actx.resume();
    }
  });

  /* ---------------------------------------------------------------
     SOUND TOGGLE
     --------------------------------------------------------------- */
  var soundBtn = document.getElementById("sound");
  if (soundBtn) {
    soundBtn.addEventListener("click", function () {
      soundOn = !soundOn;
      soundBtn.setAttribute("aria-pressed", String(soundOn));
      soundBtn.querySelector(".sound__state").textContent = soundOn ? "On" : "Off";
      if (soundOn) {
        initAudio();
        if (actx && actx.state === "suspended") actx.resume();
        if (master) master.gain.value = 0.5;
      } else if (master) {
        master.gain.value = 0;
      }
    });
  }

  /* ---------------------------------------------------------------
     BOOT
     --------------------------------------------------------------- */
  window.addEventListener("resize", resize);
  resize();
  raf = requestAnimationFrame(frame);

  // One silent, unprompted pluck shortly after load: the field shows what
  // it does without a line of instruction. Never under reduced motion.
  if (!reduceMotion) {
    setTimeout(function () {
      if (hasPlayed) return;
      var t = threads[Math.floor(threads.length * 0.62)];
      if (!t) return;
      // Arc-based, like a real pluck — a bare velocity of 50 would move a
      // stiff thread about two pixels and demonstrate nothing.
      t.vel = 34 * t.omega;
      t.peak = 0.42;
      t.heat = 0.6;
    }, 1100);
  }

  // Expose a tiny surface for automated inspection only.
  window.__warp = {
    threads: function () { return threads; },
    crossings: function () { return crossings; },
    audio: function () {
      return actx
        ? { state: actx.state, notes: buffers ? buffers.length : 0, rate: actx.sampleRate, voices: voices }
        : null;
    },
    pointers: function () { return pointers.size; },
    energy: function () {
      var e = 0;
      for (var i = 0; i < threads.length; i++) e += Math.abs(threads[i].amp);
      return e;
    }
  };
})();

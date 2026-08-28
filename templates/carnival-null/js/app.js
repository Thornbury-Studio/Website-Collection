/* ═══════════════════════════════════════════════════════════════════
   NULL CARNIVAL — interface layer.

   This file owns the page: the 84 BPM clock, the scroll → ring
   mapping, the null (the hole the visitor carries), the channel the
   whole site is lit in, the calliope, and every piece of content
   behaviour. It publishes one object, window.NCSTATE, and js/carnival.js
   consumes it every frame without ever writing back.

   Nothing here assumes the WebGL module loaded. If it never does, the
   watchdog at the bottom reveals the designed static midway and the
   page carries on exactly as it is.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var doc = document;
  var root = doc.documentElement;

  var COARSE = matchMedia("(pointer: coarse)").matches;
  var SMALL = matchMedia("(max-width: 760px)").matches;
  var MOBILE = COARSE && SMALL;
  var REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* the gate: 14 Nov 2026, 20:00 SGT */
  var GATE = Date.UTC(2026, 10, 14, 12, 0, 0);

  var NCSTATE = {
    t0: (window.performance && performance.now) ? performance.now() : Date.now(),
    bpm: 84,
    beat: 0, phase: 0, bar: 0,
    p: 0,                 /* scroll progress 0..1                     */
    stationF: 0,          /* fractional station 0..6                  */
    station: 0,
    px: 0, py: 0,         /* pointer, -1..1, viewport                 */
    pxn: 0.5, pyn: 0.5,   /* pointer, 0..1, viewport                  */
    active: 0,            /* pointer engagement, eased 0..1           */
    nullAmt: 0,           /* strength of the null, eased 0..1         */
    nr: 0,                /* null radius, css px                      */
    ch: 0,                /* 0 sodium · 1 mercury · 2 carmine · 3 gilt */
    dim: 0,               /* how much the world should yield to copy  */
    lock: 0,              /* the ACCESS ritual: world nulls, ticket lit */
    booth: -1,
    sound: false,
    reduced: REDUCED,
    mobile: MOBILE
  };
  window.NCSTATE = NCSTATE;

  var CH_IDX = { sodium: 0, mercury: 1, carmine: 2, gilt: 3 };

  /* ─────────────────────────────────────────────────────────────────
     reveal system (house pattern)
     ───────────────────────────────────────────────────────────────── */
  var io = null;
  var seenOnce = false;

  function revealAllNow() {
    doc.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("is-in"); });
  }
  function sweepViewport() {
    var vh = window.innerHeight || root.clientHeight;
    doc.querySelectorAll(".reveal:not(.is-in)").forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < vh * 0.96 && r.bottom > 0) el.classList.add("is-in");
    });
  }
  if ("IntersectionObserver" in window) {
    root.classList.add("js-anim");
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          seenOnce = true;
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.05 });
    doc.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });
    setTimeout(function () { if (!seenOnce) revealAllNow(); }, 1400);
  }

  /* ─────────────────────────────────────────────────────────────────
     type as material — split headings and the wordmark into characters
     ───────────────────────────────────────────────────────────────── */
  function splitChars(el) {
    var txt = el.textContent;
    var sr = doc.createElement("span");
    sr.className = "vh";
    sr.textContent = txt;
    var vis = doc.createElement("span");
    vis.setAttribute("aria-hidden", "true");
    for (var i = 0; i < txt.length; i++) {
      var c = txt.charAt(i);
      if (c === " ") { vis.appendChild(doc.createTextNode(" ")); continue; }
      var s = doc.createElement("span");
      s.className = "ch";
      s.textContent = c;
      s.style.setProperty("--i", i);
      vis.appendChild(s);
    }
    el.textContent = "";
    el.appendChild(sr);
    el.appendChild(vis);
    return vis;
  }

  var tearables = [];
  doc.querySelectorAll("[data-tear]").forEach(function (el) {
    var vis = splitChars(el);
    tearables.push(vis);
  });
  var wmWord = doc.querySelector(".wm-word");
  if (wmWord) splitChars(wmWord);

  /* ─────────────────────────────────────────────────────────────────
     the null — DOM half. Each .nul[data-true] gets two stacked layers:
     the public name, and the name the crew uses. The mask that swaps
     them is the same circle the composite shader punches in the world.
     ───────────────────────────────────────────────────────────────── */
  var nulEls = [];
  doc.querySelectorAll(".nul[data-true]").forEach(function (el) {
    var a = doc.createElement("span");
    a.className = "nul-a";
    while (el.firstChild) a.appendChild(el.firstChild);
    var b = doc.createElement("span");
    b.className = "nul-b";
    b.setAttribute("aria-hidden", "true");
    b.textContent = el.getAttribute("data-true");
    el.appendChild(a);
    el.appendChild(b);
    nulEls.push(el);
  });
  if (nulEls.length) root.classList.add("js-nul");

  /* ─────────────────────────────────────────────────────────────────
     cached layout — nothing in the frame loop is allowed to read it
     ───────────────────────────────────────────────────────────────── */
  var sections = Array.prototype.slice.call(doc.querySelectorAll(".stn-sec"));
  var anchors = [];
  var maxScroll = 1;
  var vw = window.innerWidth;
  var vh = window.innerHeight;

  function measure() {
    vw = window.innerWidth;
    vh = window.innerHeight || root.clientHeight;
    maxScroll = Math.max(1, root.scrollHeight - vh);
    var sy = window.scrollY || window.pageYOffset || 0;
    /* Station 0 is the top of the page, not the gate's own anchor —
       otherwise the ring is already part-turned before the visitor has
       scrolled at all, and the hero frames the gap between two booths. */
    anchors = sections.map(function (s, i) {
      return i === 0 ? 0 : (s.getBoundingClientRect().top + sy - vh * 0.42);
    });
    var sx = window.scrollX || window.pageXOffset || 0;
    for (var i = 0; i < nulEls.length; i++) {
      var r = nulEls[i].getBoundingClientRect();
      nulEls[i].style.setProperty("--ex", (r.left + sx) + "px");
      nulEls[i].style.setProperty("--ey", (r.top + sy) + "px");
    }
  }

  var measureTimer = 0;
  function measureSoon(delay) {
    clearTimeout(measureTimer);
    measureTimer = setTimeout(measure, delay || 200);
  }

  measure();
  [400, 1200, 2600].forEach(function (t) { setTimeout(measure, t); });
  window.addEventListener("resize", function () { measure(); measureSoon(260); });
  window.addEventListener("load", measure);
  if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(function () { measure(); });

  var scrollTimer = 0;
  window.addEventListener("scroll", function () {
    if (scrollTimer) return;
    scrollTimer = setTimeout(function () {
      scrollTimer = 0;
      sweepViewport();
      measure();
    }, 220);
  }, { passive: true });

  /* ─────────────────────────────────────────────────────────────────
     pointer — raw events write plain numbers; CSS is touched once
     per frame, never per event.
     ───────────────────────────────────────────────────────────────── */
  var ptrX = vw * 0.5, ptrY = vh * 0.42;
  var wantX = ptrX, wantY = ptrY;
  var engaged = 0;
  var lastInput = -9999;

  if (!COARSE && !REDUCED) {
    window.addEventListener("pointermove", function (e) {
      wantX = e.clientX; wantY = e.clientY;
      engaged = 1;
      lastInput = nowMs();
    }, { passive: true });
    window.addEventListener("pointerleave", function () { engaged = 0; });
    window.addEventListener("blur", function () { engaged = 0; });
  }

  if (MOBILE && !REDUCED) {
    var band = doc.createElement("div");
    band.className = "nullband";
    band.setAttribute("aria-hidden", "true");
    doc.body.appendChild(band);
    doc.addEventListener("pointerdown", function (e) {
      if (e.target && e.target.closest && e.target.closest("a,button,input,textarea,label")) return;
      wantY = e.clientY;
      lastInput = nowMs();
    }, { passive: true });
  }

  function nowMs() {
    return (window.performance && performance.now) ? performance.now() : Date.now();
  }

  /* ─────────────────────────────────────────────────────────────────
     channel — one accent the whole site is lit in
     ───────────────────────────────────────────────────────────────── */
  var hotCh = null;
  var secCh = "sodium";
  var appliedCh = "";

  function applyChannel() {
    var c = hotCh || secCh;
    if (c === appliedCh) return;
    appliedCh = c;
    doc.body.setAttribute("data-ch", c);
    NCSTATE.ch = CH_IDX[c] !== undefined ? CH_IDX[c] : 0;
  }
  applyChannel();

  function hotFrom(el) {
    if (!el) { hotCh = null; NCSTATE.booth = -1; applyChannel(); return; }
    hotCh = el.getAttribute("data-ch") || null;
    var b = el.getAttribute("data-booth");
    NCSTATE.booth = b ? (parseInt(b, 10) - 1) : -1;
    applyChannel();
  }

  var HOT_SEL = ".booth, .prg, .tier";
  doc.addEventListener("pointerover", function (e) {
    if (!e.target || !e.target.closest) return;
    hotFrom(e.target.closest(HOT_SEL));
  });
  doc.addEventListener("pointerout", function (e) {
    if (!e.target || !e.target.closest) return;
    var from = e.target.closest(HOT_SEL);
    if (from && (!e.relatedTarget || !from.contains(e.relatedTarget))) hotFrom(null);
  });
  /* keyboard parity — every hover response has a focus twin */
  doc.addEventListener("focusin", function (e) {
    if (!e.target || !e.target.closest) return;
    var el = e.target.closest(HOT_SEL);
    if (el) hotFrom(el);
  });
  doc.addEventListener("focusout", function (e) {
    if (!e.target || !e.target.closest) return;
    if (e.target.closest(HOT_SEL)) hotFrom(null);
  });

  /* ─────────────────────────────────────────────────────────────────
     stations — the ring position, and the nav that turns it
     ───────────────────────────────────────────────────────────────── */
  var stnBtns = Array.prototype.slice.call(doc.querySelectorAll(".stn"));
  var hudStation = doc.getElementById("hudStation");
  var hudTurn = doc.getElementById("hudTurn");
  var hudCount = doc.getElementById("hudCount");
  var turnHand = doc.getElementById("turnHand");
  var lastStationTxt = "";
  var lastTurnTxt = "";

  function stationAt(y) {
    if (!anchors.length) return 0;
    if (y <= anchors[0]) return 0;
    for (var i = 0; i < anchors.length - 1; i++) {
      if (y < anchors[i + 1]) {
        var span = anchors[i + 1] - anchors[i];
        return i + (span > 0 ? (y - anchors[i]) / span : 0);
      }
    }
    return anchors.length - 1;
  }

  stnBtns.forEach(function (b) {
    b.addEventListener("click", function () {
      var id = b.getAttribute("data-go");
      var t = doc.getElementById(id);
      if (!t) return;
      var y = t.getBoundingClientRect().top + (window.scrollY || 0) - 74;
      window.scrollTo({ top: y, behavior: REDUCED ? "auto" : "smooth" });
    });
  });

  /* ─────────────────────────────────────────────────────────────────
     ribbon — true-loop marquee (PATTERNS.md)
     ───────────────────────────────────────────────────────────────── */
  function trueLoopMarquee(track, secondsPerCopy) {
    if (!track || !track.firstElementChild) return;
    var master = track.firstElementChild.cloneNode(true);
    var timer;

    function build() {
      /* detach before touching duration/children, or the browser
         recomputes the played fraction against the old elapsed time */
      track.style.animationName = "none";
      while (track.children.length > 1) track.removeChild(track.lastElementChild);
      var rowW = track.firstElementChild.getBoundingClientRect().width;
      var boxW = (track.parentElement || doc.body).getBoundingClientRect().width;
      if (rowW < 1) { track.style.animationName = ""; return; }
      var perHalf = Math.max(1, Math.ceil(boxW / rowW));
      for (var i = 1; i < perHalf * 2; i++) {
        var copy = master.cloneNode(true);
        copy.setAttribute("aria-hidden", "true");
        track.appendChild(copy);
      }
      track.style.animationDuration = (secondsPerCopy * perHalf) + "s";
      void track.offsetWidth;
      track.style.animationName = "";
    }

    build();
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(build);
    window.addEventListener("resize", function () {
      clearTimeout(timer);
      timer = setTimeout(build, 200);
    });
  }
  trueLoopMarquee(doc.getElementById("ribbonTrack"), 26);

  /* ─────────────────────────────────────────────────────────────────
     drawer
     ───────────────────────────────────────────────────────────────── */
  var drawer = doc.getElementById("drawer");
  var burger = doc.getElementById("burger");
  var drawerX = doc.getElementById("drawerX");

  function openDrawer(on) {
    if (!drawer || !burger) return;
    if (on) {
      drawer.hidden = false;
      requestAnimationFrame(function () { drawer.classList.add("is-open"); });
      burger.setAttribute("aria-expanded", "true");
      var f = drawer.querySelector("a");
      if (f) f.focus();
    } else {
      drawer.classList.remove("is-open");
      burger.setAttribute("aria-expanded", "false");
      setTimeout(function () { drawer.hidden = true; }, 340);
    }
  }
  if (burger) burger.addEventListener("click", function () { openDrawer(drawer.hidden); });
  if (drawerX) drawerX.addEventListener("click", function () { openDrawer(false); burger.focus(); });
  if (drawer) {
    drawer.addEventListener("click", function (e) {
      if (e.target === drawer || (e.target.closest && e.target.closest("nav a"))) openDrawer(false);
    });
  }
  doc.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && drawer && !drawer.hidden) { openDrawer(false); burger.focus(); }
  });

  /* ─────────────────────────────────────────────────────────────────
     ballot
     ───────────────────────────────────────────────────────────────── */
  var bForm = doc.getElementById("ballotForm");
  var bOut = doc.getElementById("ballotOut");

  function fieldBad(input, msg) {
    var fld = input.closest(".fld");
    var err = doc.getElementById("err-" + input.id);
    if (fld) fld.classList.toggle("is-bad", !!msg);
    if (err) err.textContent = msg || "";
    return !msg;
  }

  if (bForm) {
    bForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = doc.getElementById("bname");
      var mail = doc.getElementById("bmail");
      var ok = true;
      ok = fieldBad(name, name.value.trim().length >= 2 ? "" : "A name is needed for the stub.") && ok;
      ok = fieldBad(mail, /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail.value.trim()) ? "" : "A reachable address is needed.") && ok;
      if (!ok) { if (bOut) bOut.textContent = ""; return; }

      /* a stable reference derived from the name, so a resubmit reads the same */
      var s = name.value.trim().toUpperCase(), h = 5381;
      for (var i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
      var ref = ("00000" + (h % 900000 + 100000)).slice(-6);

      if (bOut) {
        bOut.textContent = "Logged. Ballot reference NC‑VII‑" + ref +
          " · the Oracle draws at 17:00 on 14 November.";
      }
      bForm.querySelectorAll("input, textarea").forEach(function (f) { f.value = ""; });
    });
    bForm.querySelectorAll("input").forEach(function (f) {
      f.addEventListener("input", function () { fieldBad(f, ""); });
    });
  }

  /* ─────────────────────────────────────────────────────────────────
     the calliope — a fairground organ playing in three over a clock
     that counts in four. Synthesized live, no samples.
     ───────────────────────────────────────────────────────────────── */
  var A = {
    ctx: null, bus: null, comp: null, wob: null, band: null,
    on: false, timer: 0, step: 0, next: 0, hiss: null, drone: null, droneF: null
  };

  var CHORDS = [
    { bass: 110.00, tones: [220.00, 261.63, 329.63] },  /* Am */
    { bass: 87.31,  tones: [174.61, 220.00, 261.63] },  /* F  */
    { bass: 130.81, tones: [261.63, 329.63, 392.00] },  /* C  */
    { bass: 82.41,  tones: [164.81, 207.65, 246.94] }   /* E  */
  ];

  function noiseBuffer(ctx) {
    var n = Math.floor(ctx.sampleRate * 2);
    var buf = ctx.createBuffer(1, n, ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  function audioBuild() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    var ctx = new AC();
    A.ctx = ctx;

    var comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18; comp.knee.value = 22;
    comp.ratio.value = 4; comp.attack.value = 0.006; comp.release.value = 0.22;
    comp.connect(ctx.destination);
    A.comp = comp;

    var bus = ctx.createGain();
    bus.gain.value = 0;
    bus.connect(comp);
    A.bus = bus;

    /* worn-tape flutter: one slow LFO fanned into every voice's detune */
    var wobOsc = ctx.createOscillator();
    wobOsc.type = "sine"; wobOsc.frequency.value = 0.27;
    var wob = ctx.createGain();
    wob.gain.value = 7;                       /* cents */
    wobOsc.connect(wob); wobOsc.start();
    A.wob = wob;

    /* the organ's own bandpass — opens as the visitor goes deeper */
    var band = ctx.createBiquadFilter();
    band.type = "bandpass"; band.frequency.value = 620; band.Q.value = 0.62;
    var bandGain = ctx.createGain(); bandGain.gain.value = 0.9;
    band.connect(bandGain); bandGain.connect(bus);
    A.band = band;

    /* tape hiss bed */
    var hs = ctx.createBufferSource();
    hs.buffer = noiseBuffer(ctx); hs.loop = true;
    var hp = ctx.createBiquadFilter();
    hp.type = "bandpass"; hp.frequency.value = 2600; hp.Q.value = 0.5;
    var hg = ctx.createGain(); hg.gain.value = 0.03;
    hs.connect(hp); hp.connect(hg); hg.connect(bus); hs.start();
    A.hiss = hs;

    /* bellows drone — two saws beating, behind a breathing lowpass */
    var lp = ctx.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.value = 240; lp.Q.value = 5;
    var dg = ctx.createGain(); dg.gain.value = 0.15;
    lp.connect(dg); dg.connect(bus);
    [55, 55.42].forEach(function (f) {
      var o = ctx.createOscillator();
      o.type = "sawtooth"; o.frequency.value = f;
      wob.connect(o.detune);
      o.connect(lp); o.start();
    });
    var bl = ctx.createOscillator();
    bl.type = "sine"; bl.frequency.value = 0.13;
    var blg = ctx.createGain(); blg.gain.value = 110;
    bl.connect(blg); blg.connect(lp.frequency); bl.start();
    A.droneF = lp;

    return true;
  }

  function organNote(freq, t, dur, level) {
    var ctx = A.ctx;
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(level, t + 0.018);
    g.gain.exponentialRampToValueAtTime(level * 0.55, t + dur * 0.4);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    g.connect(A.band);
    [-14, 0, 14].forEach(function (cents) {
      var o = ctx.createOscillator();
      o.type = "square";
      o.frequency.value = freq;
      o.detune.value = cents;
      A.wob.connect(o.detune);
      o.connect(g);
      o.start(t); o.stop(t + dur + 0.05);
    });
  }

  function bassNote(freq, t, dur) {
    var ctx = A.ctx;
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.30, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    var lp = ctx.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.value = 520;
    g.connect(lp); lp.connect(A.bus);
    var o = ctx.createOscillator();
    o.type = "triangle"; o.frequency.value = freq;
    A.wob.connect(o.detune);
    o.connect(g); o.start(t); o.stop(t + dur + 0.05);
  }

  function bellStrike(t) {
    var ctx = A.ctx;
    var car = ctx.createOscillator();
    var mod = ctx.createOscillator();
    var mg = ctx.createGain();
    var g = ctx.createGain();
    car.type = "sine"; car.frequency.value = 880;
    mod.type = "sine"; mod.frequency.value = 880 * 1.41;   /* inharmonic → bell */
    mg.gain.setValueAtTime(1400, t);
    mg.gain.exponentialRampToValueAtTime(3, t + 1.1);
    mod.connect(mg); mg.connect(car.frequency);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.20, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 3.0);
    car.connect(g); g.connect(A.bus);
    car.start(t); mod.start(t);
    car.stop(t + 3.1); mod.stop(t + 3.1);
  }

  function scheduler() {
    if (!A.on || !A.ctx) return;
    var beatLen = 60 / NCSTATE.bpm;
    var horizon = A.ctx.currentTime + 0.28;
    while (A.next < horizon) {
      var s = A.step;
      var inBar = s % 3;                  /* the organ counts in three */
      var barIdx = Math.floor(s / 3);
      var ch = CHORDS[barIdx % 4];
      if (inBar === 0) {
        bassNote(ch.bass, A.next, beatLen * 0.85);
        if (barIdx % 4 === 0) bellStrike(A.next);
      } else {
        for (var i = 0; i < ch.tones.length; i++) {
          organNote(ch.tones[i], A.next + i * 0.006, beatLen * 0.52, 0.075);
        }
      }
      A.next += beatLen;
      A.step++;
    }
    /* the filter opens as the visitor goes deeper into the building */
    var want = 520 + NCSTATE.p * 1750 + NCSTATE.nullAmt * 260;
    A.band.frequency.setTargetAtTime(want, A.ctx.currentTime, 0.4);
    A.timer = setTimeout(scheduler, 90);
  }

  function soundSet(on) {
    var btn = doc.getElementById("sndBtn");
    if (on) {
      if (!A.ctx && !audioBuild()) return;
      if (A.ctx.state === "suspended") A.ctx.resume();
      A.on = true;
      A.step = 0;
      A.next = A.ctx.currentTime + 0.12;
      NCSTATE.t0 = nowMs();            /* re-zero so light and sound share downbeats */
      A.bus.gain.cancelScheduledValues(A.ctx.currentTime);
      A.bus.gain.setValueAtTime(0.0001, A.ctx.currentTime);
      A.bus.gain.exponentialRampToValueAtTime(0.34, A.ctx.currentTime + 1.6);
      clearTimeout(A.timer);
      scheduler();
    } else {
      A.on = false;
      clearTimeout(A.timer);
      if (A.ctx && A.bus) {
        A.bus.gain.cancelScheduledValues(A.ctx.currentTime);
        A.bus.gain.setValueAtTime(A.bus.gain.value, A.ctx.currentTime);
        A.bus.gain.exponentialRampToValueAtTime(0.0001, A.ctx.currentTime + 0.5);
      }
    }
    NCSTATE.sound = on;
    if (btn) btn.setAttribute("aria-pressed", on ? "true" : "false");
    try { localStorage.setItem("nc-sound", on ? "1" : "0"); } catch (e) { /* private mode */ }
  }

  var sndBtn = doc.getElementById("sndBtn");
  if (sndBtn) {
    sndBtn.addEventListener("click", function () { soundSet(!A.on); });
  }
  doc.addEventListener("visibilitychange", function () {
    if (!A.ctx) return;
    if (doc.visibilityState === "hidden") { if (A.ctx.state === "running") A.ctx.suspend(); }
    else if (A.on && A.ctx.state === "suspended") A.ctx.resume();
  });

  /* ─────────────────────────────────────────────────────────────────
     countdown
     ───────────────────────────────────────────────────────────────── */
  function countText() {
    var ms = GATE - Date.now();
    if (ms <= 0) return "THE GATE IS OPEN";
    var d = Math.floor(ms / 86400000);
    var h = Math.floor(ms / 3600000) % 24;
    var m = Math.floor(ms / 60000) % 60;
    return "T−" + ("00" + d).slice(-3) + " : " + ("0" + h).slice(-2) + " : " + ("0" + m).slice(-2);
  }
  if (hudCount) {
    hudCount.textContent = countText();
    setInterval(function () { hudCount.textContent = countText(); }, 20000);
  }

  /* ─────────────────────────────────────────────────────────────────
     the frame — the only place CSS is touched
     ───────────────────────────────────────────────────────────────── */
  var idleT = 0;
  var lastTear = -99;

  function frame(now) {
    /* clock */
    var beatLen = 60000 / NCSTATE.bpm;
    var beats = (now - NCSTATE.t0) / beatLen;
    NCSTATE.beat = Math.floor(beats);
    NCSTATE.phase = beats - NCSTATE.beat;
    NCSTATE.bar = Math.floor(NCSTATE.beat / 4);

    /* scroll → ring (maxScroll is cached; never read scrollHeight here) */
    var sy = window.scrollY || window.pageYOffset || 0;
    var p = Math.min(1, Math.max(0, sy / maxScroll));
    NCSTATE.p = p;

    var sf = stationAt(sy);
    NCSTATE.stationF = sf;
    NCSTATE.station = Math.round(sf);

    /* the world yields where the copy is dense */
    var dim = 0;
    if (p > 0.035) dim = Math.min(1, (p - 0.035) / 0.065) * 0.60;
    if (p > 0.93) dim = 0.60 + (p - 0.93) * 2.0;
    NCSTATE.dim = Math.min(0.74, dim);

    /* the ACCESS ritual: within the access station the world nulls out
       and only the ticket stays lit */
    var toAccess = 1 - Math.min(1, Math.abs(sf - 5) / 0.55);
    NCSTATE.lock += (Math.max(0, toAccess) - NCSTATE.lock) * 0.07;

    /* pointer, idle drift, and the null */
    if (MOBILE) {
      ptrX = vw * 0.5;
      ptrY += (vh * 0.5 - ptrY) * 0.08;
      engaged = REDUCED ? 0 : 1;
    } else if (!REDUCED) {
      idleT = now - lastInput;
      if (idleT > 4000) {
        /* after four seconds of stillness the hole wanders on its own */
        var k = (now - lastInput - 4000) / 1000;
        var e = Math.min(1, k / 2.2);
        var dx = Math.cos(now * 0.00021) * 0.30 + Math.cos(now * 0.00047) * 0.10;
        var dy = Math.sin(now * 0.00017) * 0.22 + Math.sin(now * 0.00039) * 0.07;
        wantX += ((0.5 + dx) * vw - wantX) * 0.012 * e;
        wantY += ((0.46 + dy) * vh - wantY) * 0.012 * e;
        engaged = 1;
      }
      ptrX += (wantX - ptrX) * 0.13;
      ptrY += (wantY - ptrY) * 0.13;
    }

    NCSTATE.active += (engaged - NCSTATE.active) * 0.07;
    NCSTATE.pxn = vw ? ptrX / vw : 0.5;
    NCSTATE.pyn = vh ? ptrY / vh : 0.5;
    NCSTATE.px = NCSTATE.pxn * 2 - 1;
    NCSTATE.py = NCSTATE.pyn * 2 - 1;

    var wantNull = REDUCED ? 0 : NCSTATE.active;
    NCSTATE.nullAmt += (wantNull - NCSTATE.nullAmt) * 0.08;
    var baseR = MOBILE ? 150 : 98;
    NCSTATE.nr = (baseR + p * 54 + NCSTATE.active * 22) * NCSTATE.nullAmt;

    /* one batch of style writes, on one element */
    root.style.setProperty("--pxd", (ptrX + (window.scrollX || 0)) + "px");
    root.style.setProperty("--pyd", (ptrY + sy) + "px");
    root.style.setProperty("--nr", NCSTATE.nr.toFixed(1) + "px");
    root.style.setProperty("--gx", (NCSTATE.px * NCSTATE.active).toFixed(3));
    root.style.setProperty("--gy", (NCSTATE.py * NCSTATE.active).toFixed(3));

    /* section channel follows the ring */
    var si = Math.max(0, Math.min(sections.length - 1, Math.round(sf)));
    var want = sections[si].getAttribute("data-ch") || "sodium";
    if (want !== secCh) { secCh = want; applyChannel(); }

    /* HUD — written only when the string actually changes */
    if (hudStation) {
      var nm = (sections[si].getAttribute("id") || "gate").toUpperCase();
      if (nm !== lastStationTxt) { hudStation.textContent = nm; lastStationTxt = nm; }
    }
    var deg = Math.round(sf * (360 / 7));
    if (hudTurn) {
      var tt = ("00" + deg).slice(-3) + "°";
      if (tt !== lastTurnTxt) { hudTurn.textContent = tt; lastTurnTxt = tt; }
    }
    if (turnHand) turnHand.style.transform = "translate(-50%,-100%) rotate(" + deg + "deg)";

    /* station buttons */
    for (var i = 0; i < stnBtns.length; i++) {
      var on = stnBtns[i].getAttribute("data-go") === sections[si].id;
      stnBtns[i].classList.toggle("is-on", on);
    }

    /* a tear on the headline, every four bars, only where it can be seen */
    if (!REDUCED && NCSTATE.bar !== lastTear && NCSTATE.bar % 4 === 0 && NCSTATE.phase < 0.12) {
      lastTear = NCSTATE.bar;
      tearOne();
    }

    requestAnimationFrame(frame);
  }

  function tearOne() {
    var pool = [];
    for (var i = 0; i < tearables.length; i++) {
      var r = tearables[i].getBoundingClientRect();
      if (r.top < vh * 0.9 && r.bottom > 0) pool.push(tearables[i]);
    }
    if (!pool.length) return;
    var host = pool[(Math.random() * pool.length) | 0];
    var chs = host.querySelectorAll(".ch");
    if (!chs.length) return;
    var start = (Math.random() * chs.length) | 0;
    var run = 1 + ((Math.random() * 3) | 0);
    for (var j = 0; j < run; j++) {
      var c = chs[(start + j) % chs.length];
      if (!c) continue;
      (function (el, d) {
        setTimeout(function () {
          el.classList.remove("tear");
          void el.offsetWidth;
          el.classList.add("tear");
          setTimeout(function () { el.classList.remove("tear"); }, 480);
        }, d);
      })(c, j * 42);
    }
  }

  requestAnimationFrame(frame);

  /* ─────────────────────────────────────────────────────────────────
     restore the sound preference, and the 3D watchdog (house pattern)
     ───────────────────────────────────────────────────────────────── */
  try {
    if (localStorage.getItem("nc-sound") === "1") {
      /* browsers require a gesture; arm it on the first one */
      var arm = function () {
        doc.removeEventListener("pointerdown", arm);
        doc.removeEventListener("keydown", arm);
        soundSet(true);
      };
      doc.addEventListener("pointerdown", arm, { once: true });
      doc.addEventListener("keydown", arm, { once: true });
    }
  } catch (e) { /* private mode */ }

  setTimeout(function () {
    if (!(window.NC && window.NC.ready)) doc.body.classList.add("no3d");
  }, 3500);

  window.ncMeasure = measure;
})();

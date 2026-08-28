/* VOLT//FLOOD — interface layer.
   Owns the master state (scroll voltage, pointer interference, active
   stage, 132 BPM clock) that the WebGL machine reads every frame, plus
   the reveal system, HUD, tier rendering, counters, the synthesized
   sound engine, drawer nav and the 3D watchdog. */
(function () {
  "use strict";

  var doc = document;
  var root = doc.documentElement;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- master state (read by js/machine.js) ---------------- */
  var VFSTATE = {
    v: 0,            // voltage: scroll progress 0..1
    px: 0, py: 0,    // pointer interference −1..1
    stage: null,     // "grid" | "flood" | "drain" | null
    dim: 0,          // machine exposure damping over text-dense ranges
    charge: 0,       // signal-touch: held-pointer charge 0..1
    surge: null,     // signal-touch: last discharge {t, power}
    bpm: 132,
    t0: performance.now(),
    beatPhase: 0,
    beatCount: 0,
    reduced: reduced
  };
  window.VFSTATE = VFSTATE;

  /* ---------------- reveal system (house pattern) ---------------- */
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
  function rescanReveals() {
    if (!io) return;
    doc.querySelectorAll(".reveal:not(.is-in)").forEach(function (el) { io.observe(el); });
    sweepViewport();
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
    var t = 0;
    function throttledSweep() {
      if (t) return;
      t = setTimeout(function () { t = 0; sweepViewport(); }, 180);
    }
    window.addEventListener("scroll", throttledSweep, { passive: true });
    window.addEventListener("resize", throttledSweep);
    window.addEventListener("hashchange", throttledSweep);
  }
  window.rescanReveals = rescanReveals;

  /* ---------------- drawer nav ---------------- */
  var burger = doc.querySelector(".burger");
  var scrim = doc.querySelector(".scrim");
  function setNav(open) {
    doc.body.classList.toggle("nav-open", open);
    if (burger) burger.setAttribute("aria-expanded", open ? "true" : "false");
  }
  if (burger) burger.addEventListener("click", function () {
    setNav(!doc.body.classList.contains("nav-open"));
  });
  if (scrim) scrim.addEventListener("click", function () { setNav(false); });
  doc.querySelectorAll(".drawer a").forEach(function (a) {
    a.addEventListener("click", function () { setNav(false); });
  });
  doc.addEventListener("keydown", function (e) {
    if (e.key === "Escape") setNav(false);
  });

  /* ---------------- signal touch: pointer = interference ----------------
     The pointer is a physical interference source: the machine's floor
     ripples where you point, press-and-hold charges the rig (beams swing
     to track you), and release discharges a surge through the room. */
  var coarse = window.matchMedia("(pointer: coarse)").matches;
  var charging = false, chargeT0 = 0, tapT0 = 0, tapY = 0;
  var surgeFlashUntil = 0;

  function fireSurge(power) {
    VFSTATE.surge = { t: performance.now(), power: power };
    surgeFlashUntil = performance.now() + 1300;
    glitchPulse();
    if (audioOn()) surgeHit(power);
  }
  function endCharge(fire) {
    if (charging && fire && VFSTATE.charge > 0.06) fireSurge(VFSTATE.charge);
    charging = false;
    doc.body.classList.remove("charging");
  }
  if (!reduced) {
    window.addEventListener("pointermove", function (e) {
      VFSTATE.px = (e.clientX / window.innerWidth) * 2 - 1;
      VFSTATE.py = (e.clientY / window.innerHeight) * 2 - 1;
      root.style.setProperty("--gx", VFSTATE.px.toFixed(3));
      root.style.setProperty("--gy", VFSTATE.py.toFixed(3));
    }, { passive: true });

    window.addEventListener("pointerdown", function (e) {
      if (e.button > 0) return;
      var tEl = e.target instanceof Element ? e.target : null;
      if (tEl && tEl.closest("a, button, input, select, textarea, [tabindex], .top, .drawer, .hud")) return;
      VFSTATE.px = (e.clientX / window.innerWidth) * 2 - 1;
      VFSTATE.py = (e.clientY / window.innerHeight) * 2 - 1;
      if (coarse) {                       // touch: quick tap = discharge
        tapT0 = performance.now();
        tapY = e.clientY;
      } else {                            // fine pointer: hold to charge
        charging = true;
        chargeT0 = performance.now();
        doc.body.classList.add("charging");
      }
    }, { passive: true });

    window.addEventListener("pointerup", function (e) {
      if (coarse) {
        if (performance.now() - tapT0 < 320 && Math.abs(e.clientY - tapY) < 12 && tapT0) fireSurge(0.5);
        tapT0 = 0;
        return;
      }
      endCharge(true);
    }, { passive: true });
    window.addEventListener("pointercancel", function () { tapT0 = 0; endCharge(false); }, { passive: true });
    window.addEventListener("blur", function () { tapT0 = 0; endCharge(false); });
  }

  /* ---------------- stage activation (zones + schedule) ---------------- */
  function setStage(ch) {
    VFSTATE.stage = ch;
    doc.body.setAttribute("data-stage", ch || "");
  }
  doc.querySelectorAll(".zone[data-ch], .act[data-ch]").forEach(function (el) {
    var ch = el.getAttribute("data-ch");
    el.addEventListener("mouseenter", function () { setStage(ch); });
    el.addEventListener("mouseleave", function () { setStage(null); });
    el.addEventListener("focus", function () { setStage(ch); });
    el.addEventListener("blur", function () { setStage(null); });
  });

  /* ---------------- HUD + clock loop ---------------- */
  var hvFill = doc.getElementById("hv-fill");
  var hvRead = doc.getElementById("hv-read");
  var hudPhase = doc.getElementById("hud-phase");
  var beatDot = doc.getElementById("beat-dot");
  var hudCount = doc.getElementById("hud-count");

  if (hudCount) {
    var days = Math.max(0, Math.ceil((Date.UTC(2026, 10, 13) - Date.now()) / 86400000));
    hudCount.textContent = days > 0 ? "T−" + ("00" + days).slice(-3) : "LIVE";
  }

  var PHASES = [
    [0.00, "SIGNAL·ACQ"],
    [0.10, "MACHINE·LIVE"],
    [0.30, "SCHEDULE·LOCK"],
    [0.56, "ZONES·ARMED"],
    [0.76, "ACCESS·OPEN"],
    [0.92, "ARCHIVE·DRAIN"]
  ];
  var lastPhaseLabel = "";
  var lastBeat = -1;
  var lastPct = -1;
  var hudEl = doc.querySelector(".hud");
  var mobileMq = window.matchMedia("(max-width: 700px)");
  var lastHudOp = -1;

  function glitchPulse() {
    if (reduced) return;
    var targets = doc.querySelectorAll("[data-glitch]");
    if (!targets.length) return;
    var el = targets[Math.floor(Math.random() * targets.length)];
    el.classList.add("glitching");
    setTimeout(function () { el.classList.remove("glitching"); }, 160);
  }

  function frame(now) {
    /* voltage from scroll */
    var max = root.scrollHeight - window.innerHeight;
    var v = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    VFSTATE.v = v;

    /* machine exposure damping over text-dense ranges */
    var dim = 0;
    if (v > 0.08) dim = Math.min(1, (v - 0.08) / 0.1) * 0.6;
    if (v > 0.9) dim = 0.6 + (v - 0.9) * 2;      // drain out at the foot
    VFSTATE.dim = Math.min(0.85, dim);

    /* signal-touch charge: grows under the held pointer, decays free */
    if (charging) VFSTATE.charge = Math.min(1, (now - chargeT0) / 1100);
    else VFSTATE.charge = (VFSTATE.charge || 0) * 0.88;

    /* mobile: the HUD yields exactly when the machine dims for content */
    if (hudEl && mobileMq.matches) {
      var hop = Math.round((1 - Math.min(1, VFSTATE.dim * 1.3) * 0.75) * 100) / 100;
      if (hop !== lastHudOp) { lastHudOp = hop; hudEl.style.opacity = String(hop); }
    } else if (lastHudOp !== -1 && hudEl) {
      lastHudOp = -1;
      hudEl.style.opacity = "";
    }

    /* clock */
    var beatLen = 60000 / VFSTATE.bpm;
    var beats = (now - VFSTATE.t0) / beatLen;
    VFSTATE.beatCount = Math.floor(beats);
    VFSTATE.beatPhase = beats - VFSTATE.beatCount;

    if (VFSTATE.beatCount !== lastBeat) {
      lastBeat = VFSTATE.beatCount;
      if (beatDot && !reduced) {
        beatDot.classList.add("tick");
        setTimeout(function () { beatDot.classList.remove("tick"); }, 170);
      }
      if (lastBeat % 16 === 0 && lastBeat > 0) glitchPulse();
    }

    /* HUD */
    var pct = Math.round(v * 100);
    if (pct !== lastPct) {
      lastPct = pct;
      if (hvFill) hvFill.style.transform = "scaleX(" + (v || 0.004) + ")";
      if (hvRead) hvRead.textContent = ("00" + pct).slice(-3) + "%";
    }
    var label = PHASES[0][1];
    for (var i = 0; i < PHASES.length; i++) if (v >= PHASES[i][0]) label = PHASES[i][1];
    if (charging) label = "CHARGING·" + ("00" + Math.round(VFSTATE.charge * 100)).slice(-3);
    else if (now < surgeFlashUntil) label = "SURGE·DISCHARGE";
    if (label !== lastPhaseLabel && hudPhase) {
      lastPhaseLabel = label;
      hudPhase.textContent = label;
    }

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  /* ---------------- tiers (single source of truth, math computed) ------- */
  var TIERS = [
    {
      tag: "ONE NIGHT", name: "SURGE PASS", feat: false,
      scope: "Any single night · all zones", price: 88, nights: 1,
      perks: ["All three zones, one night", "Re-entry until 02:00", "Cloakroom included"]
    },
    {
      tag: "ALL THREE NIGHTS", name: "FULL FLOOD", feat: true,
      scope: "Fri + Sat + Sun · all zones", price: 228, nights: 3,
      perks: ["All zones, all three nights", "Fast-lane doors, every night", "Cloakroom + locker", "Sunday recovery pour in the Drain"]
    },
    {
      tag: "ALL NIGHTS + THE CAGE", name: "OVERLOAD", feat: false,
      scope: "Everything, plus the rig floor", price: 388, nights: 3,
      perks: ["Everything in FULL FLOOD", "Rig-floor cage slot, 30 min a night", "Numbered Edition IV archive print", "First allocation for Edition V"]
    }
  ];
  var oneNight = TIERS[0].price;

  function tierMath(t) {
    if (t.nights === 1) return "S$" + t.price + " / NIGHT";
    if (t.name === "OVERLOAD") {
      var over = t.price - TIERS[1].price;
      return "+S$" + over + " OVER FULL FLOOD";
    }
    var perNight = Math.round(t.price / t.nights);
    var save = oneNight * t.nights - t.price;
    return "S$" + perNight + "/NIGHT — SAVE S$" + save;
  }

  var tierGrid = doc.getElementById("tier-grid");
  if (tierGrid) {
    TIERS.forEach(function (t, idx) {
      var card = doc.createElement("article");
      card.className = "tier reveal d" + (idx + 1) + (t.feat ? " tier-feat" : "");

      var tag = doc.createElement("span");
      tag.className = "tier-tag mono";
      tag.textContent = t.tag;
      var name = doc.createElement("h3");
      name.className = "tier-name";
      name.textContent = t.name;
      var scope = doc.createElement("p");
      scope.className = "tier-scope";
      scope.textContent = t.scope;
      var price = doc.createElement("p");
      price.className = "tier-price";
      price.textContent = "S$" + t.price;
      var math = doc.createElement("p");
      math.className = "tier-math";
      math.textContent = tierMath(t);
      var list = doc.createElement("ul");
      list.className = "tier-list";
      t.perks.forEach(function (p) {
        var li = doc.createElement("li");
        li.textContent = p;
        list.appendChild(li);
      });

      var btn = doc.createElement("button");
      btn.type = "button";
      btn.className = "btn" + (t.feat ? " btn-acid" : " btn-ghost");
      var held = doc.createElement("p");
      held.className = "tier-held mono";

      var key = "vf-hold-" + t.name.replace(/\s+/g, "-").toLowerCase();
      function paint() {
        var ref = null;
        try { ref = localStorage.getItem(key); } catch (e) { /* storage blocked */ }
        if (ref) {
          btn.textContent = "RELEASE HOLD";
          held.textContent = "HELD — REF " + ref + " · COLLECT BY 21:00";
        } else {
          btn.textContent = "RESERVE — S$" + t.price;
          held.textContent = "";
        }
      }
      btn.addEventListener("click", function () {
        var ref = null;
        try {
          ref = localStorage.getItem(key);
          if (ref) localStorage.removeItem(key);
          else localStorage.setItem(key, "VF-" + Math.random().toString(36).slice(2, 6).toUpperCase());
        } catch (e) { /* storage blocked */ }
        paint();
      });
      paint();

      card.appendChild(tag);
      card.appendChild(name);
      card.appendChild(scope);
      card.appendChild(price);
      card.appendChild(math);
      card.appendChild(list);
      card.appendChild(btn);
      card.appendChild(held);
      tierGrid.appendChild(card);
    });
    rescanReveals();
  }

  /* ---------------- counters (computed where derivable) ---------------- */
  var bodiesEl = doc.getElementById("stat-bodies");
  if (bodiesEl) {
    var total = 0;
    doc.querySelectorAll(".zone-data dd[data-cap]").forEach(function (dd) {
      total += parseInt(dd.getAttribute("data-cap"), 10) || 0;
    });
    bodiesEl.setAttribute("data-count", String(total));
  }

  function runCounter(el) {
    var target = parseInt(el.getAttribute("data-count"), 10) || 0;
    var suffix = el.getAttribute("data-suffix") || "";
    var t0 = performance.now();
    var durn = 1100;
    function fmt(n) { return n.toLocaleString("en-SG"); }
    if (reduced) { el.textContent = fmt(target) + (suffix ? " " + suffix : ""); return; }
    function step(now) {
      var k = Math.min(1, (now - t0) / durn);
      var eased = 1 - Math.pow(1 - k, 3);
      el.textContent = fmt(Math.round(target * eased)) + (suffix ? " " + suffix : "");
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ("IntersectionObserver" in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.querySelectorAll(".stat-n[data-count]").forEach(runCounter);
          cio.unobserve(e.target);
        }
      });
    }, { threshold: 0.3 });
    doc.querySelectorAll(".stat-rail").forEach(function (el) { cio.observe(el); });
    setTimeout(function () {
      doc.querySelectorAll(".stat-n[data-count]").forEach(function (el) {
        if (el.textContent === "0") runCounter(el);
      });
    }, 6000);
  } else {
    doc.querySelectorAll(".stat-n[data-count]").forEach(runCounter);
  }

  /* ---------------- sound engine: OVERDRIVE (synthesized, opt-in) ------
     Hype bass-boosted arrangement, built entirely in the browser so it is
     copyright-free by construction: saturated gliding 808 sub, phonk
     cowbell lead, punch kick with sidechain pump, claps on the backbeat,
     driven hats and an 8-bar filter riser. Same clock as the visuals. */
  var soundBtn = doc.getElementById("soundbtn");
  var AC = null, master = null, duck = null, noiseBuf = null,
      schedTimer = null, nextBeatT = 0, beatIdx = 0;

  function audioOn() { return !!(schedTimer && AC); }

  function makeNoise(ac, secs) {
    var len = Math.floor(ac.sampleRate * secs);
    var buf = ac.createBuffer(1, len, ac.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }
  function makeSat(ac) {
    var ws = ac.createWaveShaper();
    var n = 512, c = new Float32Array(n);
    for (var i = 0; i < n; i++) {
      var x = (i / (n - 1)) * 2 - 1;
      c[i] = Math.tanh(x * 2.4);          // the "bass boost" saturation
    }
    ws.curve = c;
    ws.oversample = "2x";
    return ws;
  }
  function pump(t) {                       // sidechain duck on every kick
    duck.gain.cancelScheduledValues(t);
    duck.gain.setValueAtTime(0.42, t);
    duck.gain.linearRampToValueAtTime(1, t + 0.24);
  }
  function kick(t) {
    var o = AC.createOscillator(), g = AC.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(205, t);
    o.frequency.exponentialRampToValueAtTime(38, t + 0.1);
    g.gain.setValueAtTime(1.0, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    o.connect(g).connect(duck);
    o.start(t); o.stop(t + 0.32);
    var s = AC.createBufferSource(), hf = AC.createBiquadFilter(), cg = AC.createGain();
    s.buffer = noiseBuf;                   // attack click
    hf.type = "highpass"; hf.frequency.value = 3200;
    cg.gain.setValueAtTime(0.5, t);
    cg.gain.exponentialRampToValueAtTime(0.001, t + 0.02);
    s.connect(hf).connect(cg).connect(duck);
    s.start(t); s.stop(t + 0.03);
    pump(t);
  }
  function clap(t) {
    for (var i = 0; i < 3; i++) {
      var s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain();
      s.buffer = noiseBuf;
      f.type = "bandpass"; f.frequency.value = 1400; f.Q.value = 1.1;
      var tt = t + i * 0.012;
      g.gain.setValueAtTime(i === 2 ? 0.34 : 0.16, tt);
      g.gain.exponentialRampToValueAtTime(0.001, tt + (i === 2 ? 0.2 : 0.03));
      s.connect(f).connect(g).connect(duck);
      s.start(tt); s.stop(tt + 0.24);
    }
  }
  function hat(t, vol, open) {
    var s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain();
    s.buffer = noiseBuf;
    f.type = "highpass"; f.frequency.value = 7800;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + (open ? 0.12 : 0.04));
    s.connect(f).connect(g).connect(duck);
    s.start(t); s.stop(t + 0.14);
  }
  /* gliding 808 line over 8 beats: A1 A1 . C2 / A1 G1 A1 D2 */
  var B808 = [
    [55, 0], [55, 0], [0, 0], [65.41, 55],
    [55, 0], [49, 0], [55, 0], [73.42, 55]
  ];
  function b808(t, f, glideTo) {
    var o = AC.createOscillator(), g = AC.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(f, t);
    if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t + 0.34);
    g.gain.setValueAtTime(0.0, t);
    g.gain.linearRampToValueAtTime(0.62, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.44);
    o.connect(g).connect(duck);
    o.start(t); o.stop(t + 0.48);
  }
  /* phonk cowbell lead, two hits per beat over an 8-beat phrase (Am) */
  var COWS = [
    [440, 0], [0, 523.25], [440, 392], [0, 0],
    [329.63, 0], [0, 392], [349.23, 329.63], [293.66, 0]
  ];
  function cow(t, f) {
    var g = AC.createGain(), bp = AC.createBiquadFilter();
    bp.type = "bandpass"; bp.frequency.value = f * 2.4; bp.Q.value = 1.4;
    g.gain.setValueAtTime(0.2, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
    [f, f * 1.48].forEach(function (ff) {
      var o = AC.createOscillator();
      o.type = "square";
      o.frequency.value = ff;
      o.connect(bp);
      o.start(t); o.stop(t + 0.26);
    });
    bp.connect(g).connect(duck);
  }
  function riser(t, len) {                 // last bar of every 8 beats
    var s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain();
    s.buffer = noiseBuf; s.loop = true;
    f.type = "bandpass"; f.Q.value = 2.2;
    f.frequency.setValueAtTime(320, t);
    f.frequency.exponentialRampToValueAtTime(5600, t + len);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.2, t + len);
    g.gain.setValueAtTime(0.0001, t + len + 0.01);
    s.connect(f).connect(g).connect(duck);
    s.start(t); s.stop(t + len + 0.05);
  }
  function surgeHit(power) {               // the discharge, heard
    if (!AC) return;
    var t = AC.currentTime + 0.02;
    var o = AC.createOscillator(), g = AC.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(96, t);
    o.frequency.exponentialRampToValueAtTime(28, t + 0.7);
    g.gain.setValueAtTime(0.5 + power * 0.3, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.85);
    o.connect(g).connect(duck);
    o.start(t); o.stop(t + 0.9);
    var s = AC.createBufferSource(), f = AC.createBiquadFilter(), ng = AC.createGain();
    s.buffer = noiseBuf; s.loop = true;
    f.type = "lowpass";
    f.frequency.setValueAtTime(6400, t);
    f.frequency.exponentialRampToValueAtTime(180, t + 0.55);
    ng.gain.setValueAtTime(0.3, t);
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    s.connect(f).connect(ng).connect(duck);
    s.start(t); s.stop(t + 0.65);
  }
  function scheduler() {
    var beatLen = 60 / VFSTATE.bpm;
    while (nextBeatT < AC.currentTime + 0.26) {
      var t = nextBeatT, p8 = beatIdx % 8;
      kick(t);
      if (beatIdx % 2 === 1) clap(t);
      hat(t + beatLen * 0.25, 0.09, false);
      hat(t + beatLen * 0.5, 0.2, beatIdx % 4 === 3);
      hat(t + beatLen * 0.75, 0.09, false);
      var bn = B808[p8];
      if (bn[0]) b808(t, bn[0], bn[1]);
      var cn = COWS[p8];
      if (cn[0]) cow(t, cn[0]);
      if (cn[1]) cow(t + beatLen * 0.5, cn[1]);
      if (p8 === 7) riser(t, beatLen);
      nextBeatT += beatLen;
      beatIdx++;
    }
  }
  function soundOn() {
    if (!AC) {
      var Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return false;
      AC = new Ctor();
      duck = AC.createGain();
      duck.gain.value = 1;
      master = AC.createGain();
      master.gain.value = 0.38;
      var comp = AC.createDynamicsCompressor();
      comp.threshold.value = -18;
      comp.ratio.value = 6;
      duck.connect(makeSat(AC)).connect(master).connect(comp).connect(AC.destination);
      noiseBuf = makeNoise(AC, 0.6);
    }
    AC.resume();
    nextBeatT = AC.currentTime + 0.08;
    beatIdx = 0;
    /* re-zero the visual clock so machine + audio share downbeats */
    VFSTATE.t0 = performance.now() + 80;
    schedTimer = setInterval(scheduler, 90);
    return true;
  }
  function soundOff() {
    if (schedTimer) { clearInterval(schedTimer); schedTimer = null; }
    if (AC) AC.suspend();
  }
  if (soundBtn) {
    soundBtn.addEventListener("click", function () {
      var on = soundBtn.getAttribute("aria-pressed") === "true";
      if (on) { soundOff(); soundBtn.setAttribute("aria-pressed", "false"); }
      else if (soundOn()) soundBtn.setAttribute("aria-pressed", "true");
    });
  }
  doc.addEventListener("visibilitychange", function () {
    if (doc.visibilityState === "hidden" && soundBtn &&
        soundBtn.getAttribute("aria-pressed") === "true") {
      soundOff();
      soundBtn.setAttribute("aria-pressed", "false");
    }
  });

  /* ---------------- 3D watchdog (house pattern) ---------------- */
  setTimeout(function () {
    if (!(window.VF && window.VF.ready)) doc.body.classList.add("no3d");
  }, 3500);

})();

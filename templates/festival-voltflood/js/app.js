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

  /* ---------------- pointer = interference ---------------- */
  var fine = window.matchMedia("(pointer: fine)").matches;
  if (fine && !reduced) {
    window.addEventListener("mousemove", function (e) {
      VFSTATE.px = (e.clientX / window.innerWidth) * 2 - 1;
      VFSTATE.py = (e.clientY / window.innerHeight) * 2 - 1;
      root.style.setProperty("--gx", VFSTATE.px.toFixed(3));
      root.style.setProperty("--gy", VFSTATE.py.toFixed(3));
    }, { passive: true });
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

  /* ---------------- sound engine (synthesized, opt-in) ---------------- */
  var soundBtn = doc.getElementById("soundbtn");
  var AC = null, master = null, noiseBuf = null, schedTimer = null, nextBeatT = 0, beatIdx = 0;

  function makeNoise(ac) {
    var len = Math.floor(ac.sampleRate * 0.08);
    var buf = ac.createBuffer(1, len, ac.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }
  function kick(ac, t) {
    var o = ac.createOscillator(), g = ac.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(43, t + 0.11);
    g.gain.setValueAtTime(0.85, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.26);
    o.connect(g).connect(master);
    o.start(t); o.stop(t + 0.3);
  }
  function hat(ac, t, open) {
    var s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noiseBuf;
    f.type = "highpass"; f.frequency.value = 7600;
    g.gain.setValueAtTime(open ? 0.22 : 0.12, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + (open ? 0.09 : 0.045));
    s.connect(f).connect(g).connect(master);
    s.start(t);
  }
  var BASSLINE = [55, 55, 65.41, 49];  // A1 A1 C2 G1 over the bar
  function bass(ac, t, note) {
    var o = ac.createOscillator(), f = ac.createBiquadFilter(), g = ac.createGain();
    o.type = "sawtooth";
    o.frequency.value = note;
    f.type = "lowpass"; f.frequency.setValueAtTime(420, t);
    f.frequency.exponentialRampToValueAtTime(150, t + 0.4);
    g.gain.setValueAtTime(0.16, t + 0.06);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.42);
    o.connect(f).connect(g).connect(master);
    o.start(t + 0.05); o.stop(t + 0.46);
  }
  function scheduler() {
    var beatLen = 60 / VFSTATE.bpm;
    while (nextBeatT < AC.currentTime + 0.24) {
      kick(AC, nextBeatT);
      hat(AC, nextBeatT + beatLen / 2, beatIdx % 4 === 3);
      bass(AC, nextBeatT, BASSLINE[beatIdx % 4]);
      nextBeatT += beatLen;
      beatIdx++;
    }
  }
  function soundOn() {
    if (!AC) {
      var Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return false;
      AC = new Ctor();
      master = AC.createGain();
      master.gain.value = 0.42;
      var comp = AC.createDynamicsCompressor();
      master.connect(comp).connect(AC.destination);
      noiseBuf = makeNoise(AC);
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

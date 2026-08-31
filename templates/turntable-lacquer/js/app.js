/* TAPE//LACQUER — interface layer.
   Owns TLSTATE (scroll static, pointer, burn charge, 118 BPM clock)
   read by js/scene.js every frame. */

(function () {
  "use strict";

  var doc = document;
  var root = doc.documentElement;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var TLSTATE = {
    v: 0,
    px: 0, py: 0,
    stage: "a",
    charge: 0,
    surge: null,
    bpm: 118,
    t0: performance.now(),
    beatPhase: 0,
    beatCount: 0,
    reduced: reduced
  };
  window.TLSTATE = TLSTATE;

  /* ---- reveals ---- */
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
    var t = 0;
    function throttledSweep() {
      if (t) return;
      t = setTimeout(function () { t = 0; sweepViewport(); }, 180);
    }
    window.addEventListener("scroll", throttledSweep, { passive: true });
    window.addEventListener("resize", throttledSweep);
  } else {
    revealAllNow();
  }

  /* ---- nav drawer ---- */
  var burger = doc.querySelector(".burger");
  var scrim = doc.querySelector(".scrim");
  function setNav(open) {
    doc.body.classList.toggle("nav-open", open);
    if (burger) burger.setAttribute("aria-expanded", open ? "true" : "false");
    if (scrim) scrim.hidden = !open;
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

  /* ---- pointer / burn charge ---- */
  var burning = false, burnT0 = 0;

  function fireSurge(power) {
    TLSTATE.surge = { t: performance.now(), power: power };
    glitchPulse();
  }
  function endBurn(fire) {
    if (burning && fire && TLSTATE.charge > 0.06) fireSurge(TLSTATE.charge);
    burning = false;
    doc.body.classList.remove("burning");
  }

  if (!reduced) {
    window.addEventListener("pointermove", function (e) {
      TLSTATE.px = (e.clientX / window.innerWidth) * 2 - 1;
      TLSTATE.py = (e.clientY / window.innerHeight) * 2 - 1;
      root.style.setProperty("--gx", TLSTATE.px.toFixed(3));
      root.style.setProperty("--gy", TLSTATE.py.toFixed(3));
    }, { passive: true });

    window.addEventListener("pointerdown", function (e) {
      if (e.button > 0) return;
      var tEl = e.target instanceof Element ? e.target : null;
      if (tEl && tEl.closest("a, button, input, select, textarea, .top, .drawer, .hud, .burger")) return;
      burning = true;
      burnT0 = performance.now();
      doc.body.classList.add("burning");
    });
    window.addEventListener("pointerup", function () { endBurn(true); });
    window.addEventListener("pointercancel", function () { endBurn(false); });
  }

  function glitchPulse() {
    doc.body.classList.add("glitch");
    setTimeout(function () { doc.body.classList.remove("glitch"); }, 380);
  }

  /* ---- scroll → static level + stage ---- */
  var sections = Array.prototype.slice.call(doc.querySelectorAll("[data-stage]"));
  var hsFill = doc.getElementById("hs-fill");
  var hsRead = doc.getElementById("hs-read");
  var hudSide = doc.getElementById("hud-side");
  var hudTape = doc.getElementById("hud-tape");
  var beatDot = doc.getElementById("beat-dot");
  var statBodies = doc.getElementById("stat-bodies");

  var STAGE_LABEL = { a: "SIDE A", b: "SIDE B", burn: "BURN" };
  var STAGE_CLASS = { a: "ch-a", b: "ch-b", burn: "ch-burn" };

  function setStage(name) {
    if (!name || name === TLSTATE.stage) return;
    TLSTATE.stage = name;
    doc.body.classList.remove("ch-a", "ch-b", "ch-burn");
    doc.body.classList.add(STAGE_CLASS[name] || "ch-a");
    if (hudSide) hudSide.textContent = STAGE_LABEL[name] || "SIDE A";
    if (hudTape) hudTape.textContent = "TAPE " + String(7 + (name === "b" ? 1 : name === "burn" ? 2 : 0)).padStart(2, "0");
  }

  function onScroll() {
    var docH = doc.documentElement.scrollHeight - window.innerHeight;
    TLSTATE.v = docH > 0 ? Math.min(1, Math.max(0, window.scrollY / docH)) : 0;
    if (hsFill) hsFill.style.transform = "scaleX(" + TLSTATE.v.toFixed(4) + ")";
    if (hsRead) hsRead.textContent = String(Math.round(TLSTATE.v * 100)).padStart(3, "0") + "%";
    if (statBodies) statBodies.textContent = String(Math.round(180 + TLSTATE.v * 420));

    var mid = window.innerHeight * 0.42;
    for (var i = sections.length - 1; i >= 0; i--) {
      var s = sections[i];
      var r = s.getBoundingClientRect();
      if (r.top <= mid && r.bottom > mid) {
        setStage(s.getAttribute("data-stage"));
        break;
      }
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  setStage("a");
  onScroll();

  /* ---- drop hover channel ---- */
  doc.querySelectorAll(".drop, .night").forEach(function (el) {
    el.addEventListener("mouseenter", function () {
      var ch = el.getAttribute("data-ch");
      if (ch) setStage(ch === "burn" ? "burn" : ch);
    });
  });

  /* ---- count-up stats ---- */
  doc.querySelectorAll("[data-count]").forEach(function (el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    var suffix = el.getAttribute("data-suffix") || "";
    var done = false;
    function tick() {
      if (done) return;
      var p = TLSTATE.v;
      var n = Math.round(target * Math.min(1, p * 1.4 + 0.08));
      el.textContent = n + suffix;
      if (p > 0.85) done = true;
    }
    window.addEventListener("scroll", tick, { passive: true });
    tick();
  });

  /* ---- 118 BPM clock ---- */
  function beatLoop() {
    var now = performance.now();
    var beatMs = 60000 / TLSTATE.bpm;
    var elapsed = now - TLSTATE.t0;
    var phase = (elapsed % beatMs) / beatMs;
    TLSTATE.beatPhase = phase;
    if (phase < 0.12 && TLSTATE.beatCount !== Math.floor(elapsed / beatMs)) {
      TLSTATE.beatCount = Math.floor(elapsed / beatMs);
      if (beatDot) {
        beatDot.classList.add("tick");
        setTimeout(function () { beatDot.classList.remove("tick"); }, 120);
      }
    }
    if (burning) {
      TLSTATE.charge = Math.min(1, (now - burnT0) / 2200);
    } else {
      TLSTATE.charge *= 0.92;
      if (TLSTATE.charge < 0.01) TLSTATE.charge = 0;
    }
    requestAnimationFrame(beatLoop);
  }
  if (!reduced) requestAnimationFrame(beatLoop);

  /* ---- press form ---- */
  var form = doc.getElementById("pressForm");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = doc.getElementById("press-name");
      var email = doc.getElementById("press-email");
      var errName = doc.getElementById("err-name");
      var errEmail = doc.getElementById("err-email");
      var done = doc.getElementById("pressDone");
      var ok = true;
      if (!name || !name.value.trim()) {
        ok = false;
        if (errName) errName.hidden = false;
      } else if (errName) errName.hidden = true;
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
        ok = false;
        if (errEmail) errEmail.hidden = false;
      } else if (errEmail) errEmail.hidden = true;
      if (!ok) return;
      if (done) done.hidden = false;
      form.querySelector("button[type=submit]").disabled = true;
      glitchPulse();
    });
  }

  /* ---- video play watchdog ---- */
  var vid = doc.querySelector(".stage-vid");
  if (vid && !reduced) {
    vid.play().catch(function () {});
    doc.addEventListener("visibilitychange", function () {
      if (!doc.hidden) vid.play().catch(function () {});
    });
  }
})();

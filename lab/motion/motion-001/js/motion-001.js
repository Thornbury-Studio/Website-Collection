/* =====================================================================
   MOTION-001 — THE INTERVAL

   No framework, no animation library, no canvas, no WebGL. Three jobs:

   1. Turn scroll position into a frame index (the scroll IS the shutter).
   2. Reveal a small number of elements once, on entry.
   3. Report honest numbers — the interval readout is computed from the
      real source frame rate and the real sampling step, so it stays
      truthful when mobile loads a coarser sequence.
   ===================================================================== */
(function () {
  "use strict";

  /* Facts about the source clip, measured with ffprobe — not decorative. */
  var SOURCE_FPS = 29.97;
  var SOURCE_STEP = 5;      // every 5th recorded frame was kept
  var TOTAL_PLATES = 29;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------------
     1. THE SEQUENCE
     --------------------------------------------------------------- */
  function initSequence() {
    var section = document.getElementById("sequence");
    var stage = document.getElementById("stage");
    if (!section || !stage) return;

    // Coarser sequence on small screens: same idea, less bandwidth and
    // fewer decoded bitmaps on a phone. The readout adapts to match.
    var viewStep = window.innerWidth < 700 ? 2 : 1;

    var wanted = [];
    for (var n = 1; n <= TOTAL_PLATES; n += viewStep) wanted.push(n);
    if (wanted[wanted.length - 1] !== TOTAL_PLATES) wanted.push(TOTAL_PLATES);

    // f01 is already in the HTML as the no-JS poster; append the rest.
    var frag = document.createDocumentFragment();
    for (var i = 1; i < wanted.length; i++) {
      var num = String(wanted[i]).padStart(2, "0");
      var img = new Image();
      img.src = "img/seq/f" + num + ".jpg";
      img.alt = "";
      img.decoding = "async";
      img.setAttribute("aria-hidden", "true");
      frag.appendChild(img);
    }
    stage.appendChild(frag);

    var shots = stage.querySelectorAll("img");
    var count = shots.length;

    var elIndex = document.getElementById("frameIndex");
    var elTotal = document.getElementById("frameTotal");
    var elGap = document.getElementById("intervalGap");
    var elElapsed = document.getElementById("elapsed");
    var elFill = document.getElementById("scrubFill");
    var elApex = document.getElementById("apexMark");

    /* Plates 19–24 of the full 29 hold the horizontal suspension. Expressed
       against the source sequence so it stays correct when mobile samples
       a coarser set. */
    function isApex(idx) {
      var plate = idx * viewStep + 1;
      return plate >= 19 && plate <= 24;
    }

    // Real milliseconds discarded between two adjacent plates as shown.
    var gapMs = Math.round((SOURCE_STEP * viewStep / SOURCE_FPS) * 1000);
    if (elTotal) elTotal.textContent = String(count).padStart(2, "0");
    if (elGap) elGap.textContent = gapMs + " ms";

    var current = -1;
    var ticking = false;

    function paint() {
      ticking = false;

      var rect = section.getBoundingClientRect();
      var scrollable = section.offsetHeight - window.innerHeight;
      if (scrollable <= 0) return;

      var p = -rect.top / scrollable;
      p = p < 0 ? 0 : p > 1 ? 1 : p;

      var idx = Math.round(p * (count - 1));
      if (idx !== current) {
        if (shots[current]) shots[current].classList.remove("is-on");
        shots[idx].classList.add("is-on");
        current = idx;

        if (elIndex) elIndex.textContent = String(idx + 1).padStart(2, "0");
        if (elApex) elApex.hidden = !isApex(idx);
        if (elElapsed) {
          // Elapsed time within the recorded action at this plate.
          var secs = (idx * viewStep * SOURCE_STEP) / SOURCE_FPS;
          elElapsed.textContent = secs.toFixed(2) + "s";
        }
      }
      if (elFill) elFill.style.width = (p * 100).toFixed(2) + "%";
    }

    function onScroll() {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(paint);
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    paint();
  }

  /* ---------------------------------------------------------------
     2. REVEALS — one-shot, and deliberately few
     --------------------------------------------------------------- */
  function initReveals() {
    var targets = document.querySelectorAll(".reveal, .cue");
    if (!("IntersectionObserver" in window)) {
      targets.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-in");
        io.unobserve(e.target);
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.15 });
    targets.forEach(function (el) { io.observe(el); });
  }

  /* ---------------------------------------------------------------
     3. IMPACT — the single violent entrance
     --------------------------------------------------------------- */
  function initImpact() {
    var impact = document.querySelector(".impact");
    if (!impact) return;
    if (!("IntersectionObserver" in window)) { impact.classList.add("is-hit"); return; }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        impact.classList.add("is-hit");
        io.unobserve(e.target);
      });
    }, { threshold: 0.4 });
    io.observe(impact);
  }

  /* ---------------------------------------------------------------
     4. THE PLATE — frames print in, quickly, in order
     --------------------------------------------------------------- */
  function initPlates() {
    var figures = document.querySelectorAll(".plates figure");
    if (!figures.length) return;
    if (!("IntersectionObserver" in window) || reduceMotion) {
      figures.forEach(function (f) { f.classList.add("is-in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        var order = Number(el.dataset.order || 0);
        setTimeout(function () { el.classList.add("is-in"); }, (order % 12) * 34);
        io.unobserve(el);
      });
    }, { threshold: 0.1 });
    figures.forEach(function (f) { io.observe(f); });
  }

  function boot() {
    initSequence();
    initReveals();
    initImpact();
    initPlates();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();

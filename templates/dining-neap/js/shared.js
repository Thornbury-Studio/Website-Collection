/* NEAP — shared chrome: reveals, moon glyphs, small computed copy. */
(function () {
  "use strict";

  var root = document.documentElement;
  root.classList.remove("no-js");
  root.classList.add("js-anim");

  /* ---------- reveals ----------
     IO-gated with two failsafes: a hard timer that shows everything if
     IO never fires, and a throttled scroll/resize/hashchange sweep that
     reveals anything already in the viewport (anchor jumps, injected
     markup, IO edge cases). */
  var io = null;
  var seenAny = false;

  function showAll() {
    var els = document.querySelectorAll(".reveal:not(.is-in)");
    for (var i = 0; i < els.length; i++) els[i].classList.add("is-in");
  }

  function inViewport(el) {
    var r = el.getBoundingClientRect();
    return r.top < (window.innerHeight || 0) + 40 && r.bottom > -40;
  }

  function sweep() {
    var els = document.querySelectorAll(".reveal:not(.is-in)");
    for (var i = 0; i < els.length; i++) {
      if (inViewport(els[i])) els[i].classList.add("is-in");
    }
  }

  var sweepQueued = false;
  function queueSweep() {
    if (sweepQueued) return;
    sweepQueued = true;
    setTimeout(function () { sweepQueued = false; sweep(); }, 120);
  }

  function observe(el) {
    if (io) io.observe(el);
    else el.classList.add("is-in");
  }

  if ("IntersectionObserver" in window) {
    io = new IntersectionObserver(function (entries) {
      seenAny = true;
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) {
          entries[i].target.classList.add("is-in");
          io.unobserve(entries[i].target);
        }
      }
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
  }

  function rescanReveals() {
    var els = document.querySelectorAll(".reveal:not(.is-in)");
    for (var i = 0; i < els.length; i++) observe(els[i]);
    queueSweep();
  }

  rescanReveals();

  // Failsafe: if IO never reported within 1.6s, show everything.
  setTimeout(function () { if (!seenAny) showAll(); }, 1600);

  window.addEventListener("scroll", queueSweep, { passive: true });
  window.addEventListener("resize", queueSweep);
  window.addEventListener("hashchange", queueSweep);

  window.NEAP_UI = { rescanReveals: rescanReveals };

  /* ---------- moon glyphs (synchronous first paint) ---------- */
  if (window.NEAP_TIDE) window.NEAP_TIDE.paintGlyphs();

  /* ---------- computed footer copy ---------- */
  var t = window.NEAP_TIDE ? window.NEAP_TIDE.tonight() : null;
  var phaseEls = document.querySelectorAll("[data-tide-phase]");
  if (t) {
    for (var i = 0; i < phaseEls.length; i++) {
      phaseEls[i].textContent = t.phase + " · " + (t.regime === "spring" ? "spring tides" : "neap tides");
    }
  }

  var yearEls = document.querySelectorAll("[data-year]");
  var y = String(new Date().getFullYear());
  for (var j = 0; j < yearEls.length; j++) yearEls[j].textContent = y;
})();

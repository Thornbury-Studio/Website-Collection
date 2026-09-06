/* THORNBURY DIGITAL v7 — the only verb on this site is "switch on". */
(function () {
  "use strict";
  var d = document;

  clearTimeout(window.__thornburyFailsafe);

  /* ---- SGT clock (real time, Asia/Singapore) ---- */
  var clockEl = d.getElementById("sgt");
  var fmt;
  try {
    fmt = new Intl.DateTimeFormat("en-SG", {
      timeZone: "Asia/Singapore", hour: "2-digit", minute: "2-digit", hour12: false
    });
  } catch (e) { fmt = null; }
  function tick() {
    if (clockEl && fmt) clockEl.textContent = fmt.format(new Date());
  }
  tick();
  setInterval(tick, 20000);

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function light(el) {
    el.classList.add("lit");
    /* reflect state in the attribute so audits can read it off the DOM */
    if (el.hasAttribute("data-strike")) el.setAttribute("data-strike", "on");
    if (el.hasAttribute("data-ignite") && !el.getAttribute("data-ignite")) el.setAttribute("data-ignite", "on");
  }
  function all(sel) { return Array.prototype.slice.call(d.querySelectorAll(sel)); }

  /* ---- load ignition: plate warms, sign strikes, furniture snaps on ---- */
  var sequence = [
    ["plate", 120],
    ["wm1", 430],
    ["wm2", 660],
    ["sub", 1000],
    ["kick", 1060],
    ["thesis", 1120],
    ["cta", 1180],
    ["cap", 1240]
  ];
  var furniture = all('[data-ignite="fur"]');

  if (reduced) {
    all("[data-ignite]").forEach(light);
  } else {
    sequence.forEach(function (step) {
      var els = all('[data-ignite="' + step[0] + '"]');
      setTimeout(function () { els.forEach(light); }, step[1]);
    });
    furniture.forEach(function (el, i) {
      setTimeout(function () { light(el); }, 1200 + i * 70);
    });
  }

  /* ---- scroll strikes: geometric, event-driven, dead-context-proof ----
     No IntersectionObserver. IO delivery is not guaranteed in every
     embedded/webview context (a confirmed zero-delivery environment left
     every strike dark), and painted-out content must never stay dark.
     Instead: anything already on the first screen lights immediately, and
     a direct rect check runs on scroll/resize (rAF-throttled, only while
     something is still pending) — reliable at any scroll speed because it
     reads geometry at the destination, not events along the way. The CSS
     side carries an additional 6s absolute fallback that needs no JS. */
  var pending = all("[data-strike]");

  function viewH() { return window.innerHeight || d.documentElement.clientHeight; }
  function inView(el) {
    var r = el.getBoundingClientRect();
    return r.top < viewH() * 0.94 && r.bottom > 0;
  }

  if (reduced) {
    pending.forEach(light);
    pending = [];
  } else {
    var burst = 0, lastBurst = 0, sweepQueued = false;

    var strikeNow = function (el) {
      var now = performance.now();
      if (now - lastBurst > 400) burst = 0;   /* new burst window */
      lastBurst = now;
      setTimeout(function () { light(el); }, Math.min(burst++, 6) * 90);
    };

    var sweep = function () {
      sweepQueued = false;
      var left = [];
      for (var i = 0; i < pending.length; i++) {
        if (inView(pending[i])) strikeNow(pending[i]);
        else left.push(pending[i]);
      }
      pending = left;
      if (!pending.length) {
        window.removeEventListener("scroll", queueSweep);
        window.removeEventListener("resize", queueSweep);
      }
    };

    var queueSweep = function () {
      if (sweepQueued) return;
      sweepQueued = true;
      if (window.requestAnimationFrame) window.requestAnimationFrame(sweep);
      else setTimeout(sweep, 16);
    };

    /* first screen (and anchor-target loads): on now, no waiting */
    pending = pending.filter(function (el) {
      if (inView(el)) { light(el); return false; }
      return true;
    });

    window.addEventListener("scroll", queueSweep, { passive: true });
    window.addEventListener("resize", queueSweep);
    window.addEventListener("pageshow", function (e) { if (e.persisted) sweep(); });
  }

  /* ---- the counter form: order taken, chit shown ---- */
  var form = d.querySelector("[data-counter-form]");
  if (form) {
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var note = d.querySelector("[data-sent]");
      form.hidden = true;
      if (note) {
        note.hidden = false;
        note.classList.add("lit");
        note.setAttribute("tabindex", "-1");
        note.focus();
      }
    });
  }

  /* ---- in-page scroll buttons ---- */
  all("[data-scroll]").forEach(function (a) {
    a.addEventListener("click", function (ev) {
      var id = a.getAttribute("href");
      if (!id || id.charAt(0) !== "#") return;
      var target = d.querySelector(id);
      if (!target) return;
      ev.preventDefault();
      target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
      if (history.replaceState) history.replaceState(null, "", id);
    });
  });
}());

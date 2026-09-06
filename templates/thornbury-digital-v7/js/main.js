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

  function light(el) { el.classList.add("lit"); }
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

  /* ---- scroll strikes: sections switch on once, in view ---- */
  var pending = all("[data-strike]");
  if (reduced || !("IntersectionObserver" in window)) {
    pending.forEach(light);
  } else {
    var burst = 0, lastBurst = 0;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        io.unobserve(entry.target);
        var now = performance.now();
        if (now - lastBurst > 400) burst = 0;   /* new burst window */
        lastBurst = now;
        var el = entry.target;
        setTimeout(function () { light(el); }, Math.min(burst++, 6) * 90);
      });
    /* threshold 0 + a -6% bottom inset: fires once any pixel crosses the line.
       A ratio threshold here can permanently skip elements pinned at the page
       bottom — they never reach 20% visible inside the inset viewport. */
    }, { threshold: 0, rootMargin: "0px 0px -6% 0px" });
    pending.forEach(function (el) { io.observe(el); });
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

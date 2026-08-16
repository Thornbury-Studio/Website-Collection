/* LOAM — shared chrome: reveals, toasts, the service line, the tray mount. */
(function () {
  "use strict";

  var root = document.documentElement;
  root.classList.remove("no-js");
  root.classList.add("js-anim");

  /* ---------- reveals ----------
     IO-gated, with a hard-timer failsafe and a throttled sweep so that
     anchor jumps and JS-injected markup can never leave blank space. */
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
    for (var i = 0; i < els.length; i++) if (inViewport(els[i])) els[i].classList.add("is-in");
  }

  var queued = false;
  function queueSweep() {
    if (queued) return;
    queued = true;
    setTimeout(function () { queued = false; sweep(); }, 120);
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
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.04 });
  }

  function rescanReveals() {
    var els = document.querySelectorAll(".reveal:not(.is-in)");
    for (var i = 0; i < els.length; i++) {
      if (io) io.observe(els[i]);
      else els[i].classList.add("is-in");
    }
    queueSweep();
  }

  rescanReveals();
  setTimeout(function () { if (!seenAny) showAll(); }, 1600);
  window.addEventListener("scroll", queueSweep, { passive: true });
  window.addEventListener("resize", queueSweep);
  window.addEventListener("hashchange", queueSweep);

  /* ---------- toasts ---------- */
  var toastEl = null, toastTimer = null;

  function toast(message) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "toast";
      toastEl.setAttribute("role", "status");
      toastEl.setAttribute("aria-live", "polite");
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = message;
    toastEl.classList.add("is-up");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("is-up"); }, 2600);
  }

  /* ---------- the service line ---------- */
  function paintService() {
    if (!window.LOAM_SERVICE) return;
    var s = window.LOAM_SERVICE.state();
    var line = window.LOAM_SERVICE.headline(s);

    var els = document.querySelectorAll("[data-service-line]");
    for (var i = 0; i < els.length; i++) els[i].textContent = line;

    var dots = document.querySelectorAll("[data-service-dot]");
    for (var j = 0; j < dots.length; j++) {
      dots[j].classList.toggle("is-open", s.open);
      dots[j].classList.toggle("is-shut", !s.open);
    }

    var todays = document.querySelectorAll("[data-today-hours]");
    for (var k = 0; k < todays.length; k++) {
      todays[k].textContent = s.today ? s.openAt + "–" + s.closeAt : "closed today";
    }
    return s;
  }

  /* ---------- odds and ends ---------- */
  var yearEls = document.querySelectorAll("[data-year]");
  var y = String(new Date().getFullYear());
  for (var i = 0; i < yearEls.length; i++) yearEls[i].textContent = y;

  window.LOAM_UI = {
    rescanReveals: rescanReveals,
    toast: toast,
    paintService: paintService
  };

  paintService();
  if (window.LOAM_TRAY) window.LOAM_TRAY.mount();
})();

/* ═══════════════════════════════════════════════════════════════════════════
   app — everything that is DOM.

   This file owns the page: which plate you are on, which record is lit, the
   reveals, and the access form. It publishes one small state object on
   window.AISTATE which archive.js polls each frame. That direction is
   deliberate — the 3D layer reads the page, the page never reaches into the
   3D layer, so the site degrades to a readable archive if the module throws.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var doc = document.documentElement;
  var REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* the contract with archive.js */
  var S = window.AISTATE = {
    plate: 0,        // 0..6, which plate is in view
    record: -1,      // index of the lit record, -1 for none
    spec: -1,        // index of the lit instrument spec, -1 for none
    reduced: REDUCED
  };

  if ("scrollRestoration" in history) history.scrollRestoration = "manual";

  /* ── plate tracking: drives the HUD readout ─────────────────────────── */
  var plates = [].slice.call(document.querySelectorAll(".plate"));
  var hud = {
    plate: document.querySelector('[data-hud="plate"]'),
    name: document.querySelector('[data-hud="name"]'),
    coord: document.querySelector('[data-hud="coord"]'),
    time: document.querySelector('[data-hud="time"]')
  };

  var current = null;
  function setHud(el) {
    if (!el || el === current) return;
    current = el;
    S.plate = parseInt(el.getAttribute("data-plate"), 10) || 0;
    if (hud.plate) hud.plate.textContent = el.getAttribute("data-plate") || "00";
    if (hud.name) hud.name.textContent = el.getAttribute("data-name") || "";
    /* a lit record overrides the plate's own readout */
    if (S.record < 0) {
      if (hud.coord) hud.coord.textContent = el.getAttribute("data-coord") || "";
      if (hud.time) hud.time.textContent = el.getAttribute("data-time") || "";
    }
  }

  /* whichever plate covers the middle of the viewport wins */
  function pickPlate() {
    var mid = innerHeight * 0.42, best = null, bestD = 1e9;
    for (var i = 0; i < plates.length; i++) {
      var r = plates[i].getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) continue;
      var d = Math.abs(r.top - mid);
      if (r.top <= mid && r.bottom >= mid) { best = plates[i]; break; }
      if (d < bestD) { bestD = d; best = plates[i]; }
    }
    setHud(best || plates[0]);
  }
  addEventListener("scroll", pickPlate, { passive: true });
  addEventListener("resize", pickPlate);
  pickPlate();

  /* ── reveals ────────────────────────────────────────────────────────── */
  var revealables = [].slice.call(document.querySelectorAll(".reveal"));
  function revealAll() { revealables.forEach(function (el) { el.classList.add("in"); }); }

  if (REDUCED || !("IntersectionObserver" in window)) {
    revealAll();
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.15 });
    revealables.forEach(function (el) { io.observe(el); });
    /* a stalled observer must never be able to blank the page */
    setTimeout(revealAll, 6000);
  }

  /* ── instrument specs: lighting one aims the 3D camera at that detail ── */
  var specs = [].slice.call(document.querySelectorAll(".spec"));
  if (specs.length && "IntersectionObserver" in window && !REDUCED) {
    var so = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var i = specs.indexOf(e.target);
        if (e.isIntersecting) {
          specs.forEach(function (s) { s.classList.remove("lit"); });
          e.target.classList.add("lit");
          S.spec = i;
        }
      });
    }, { rootMargin: "-38% 0px -38% 0px" });
    specs.forEach(function (el) { so.observe(el); });
  }

  /* ── records: lighting one re-dresses the archive around the camera ──── */
  var recs = [].slice.call(document.querySelectorAll(".rec"));
  function lightRecord(btn, i) {
    var already = btn.classList.contains("on");
    recs.forEach(function (b) { b.classList.remove("on"); b.setAttribute("aria-pressed", "false"); });
    if (already) {
      S.record = -1;
      if (current) {
        if (hud.coord) hud.coord.textContent = current.getAttribute("data-coord") || "";
        if (hud.time) hud.time.textContent = current.getAttribute("data-time") || "";
      }
      return;
    }
    btn.classList.add("on");
    btn.setAttribute("aria-pressed", "true");
    S.record = i;
    if (hud.coord) hud.coord.textContent = btn.getAttribute("data-coord") || "";
    if (hud.time) hud.time.textContent = btn.getAttribute("data-time") || "";
  }
  recs.forEach(function (btn, i) {
    btn.setAttribute("aria-pressed", "false");
    btn.addEventListener("click", function () { lightRecord(btn, i); });
    /* hovering previews the same state without committing to it */
    btn.addEventListener("mouseenter", function () {
      if (S.record < 0) {
        S.record = i;
        if (hud.coord) hud.coord.textContent = btn.getAttribute("data-coord") || "";
        if (hud.time) hud.time.textContent = btn.getAttribute("data-time") || "";
      }
    });
    btn.addEventListener("mouseleave", function () {
      if (!btn.classList.contains("on") && !document.querySelector(".rec.on")) {
        S.record = -1;
        if (current) {
          if (hud.coord) hud.coord.textContent = current.getAttribute("data-coord") || "";
          if (hud.time) hud.time.textContent = current.getAttribute("data-time") || "";
        }
      }
    });
  });

  /* ── the cue retires once the visitor has actually inspected ─────────── */
  var cue = document.querySelector("[data-cue]");
  if (cue) {
    var moved = 0;
    var spend = function () {
      if (++moved < 6) return;
      cue.classList.add("spent");
      removeEventListener("pointermove", spend);
      removeEventListener("touchmove", spend);
    };
    addEventListener("pointermove", spend, { passive: true });
    addEventListener("touchmove", spend, { passive: true });
  }

  /* ── access form: validates and answers in place ─────────────────────── */
  var form = document.querySelector("[data-req]");
  if (form) {
    var note = form.querySelector("[data-req-note]");
    var mail = form.querySelector("#req-mail");
    var rest = note ? note.textContent : "";
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = (mail.value || "").trim();
      var ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
      if (!ok) {
        mail.classList.add("bad");
        if (note) { note.textContent = "That address doesn't look complete — we need a reachable one to answer."; note.className = "req-note bad"; }
        mail.focus();
        return;
      }
      mail.classList.remove("bad");
      var kind = form.querySelector("#req-kind");
      var isCommission = kind && kind.selectedIndex === 2;
      if (note) {
        note.textContent = isCommission
          ? "Logged. Tell us the site's end date when you reply — that decides the order we work in."
          : "Logged. Access is issued to " + v + " once the request is checked against the register.";
        note.className = "req-note ok";
      }
      form.querySelector(".btn").textContent = "Request logged";
      setTimeout(function () {
        if (note && note.classList.contains("ok")) { /* leave the confirmation up */ }
      }, 100);
    });
    mail.addEventListener("input", function () {
      if (mail.classList.contains("bad")) {
        mail.classList.remove("bad");
        if (note) { note.textContent = rest; note.className = "req-note"; }
      }
    });
  }
})();

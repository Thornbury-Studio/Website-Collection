/* CANDELA — page behaviour. Everything 3D lives in scene.js; this file only
   ever asks it to look somewhere, and degrades to a normal document if that
   module never arrived. */
(function () {
  "use strict";

  var chips = Array.prototype.slice.call(document.querySelectorAll(".chip"));
  var panels = Array.prototype.slice.call(document.querySelectorAll(".panel"));
  var instSerial = document.getElementById("instSerial");
  var instEv = document.getElementById("instEv");
  var instCal = document.getElementById("instCal");

  /* per-material optical readouts — DOM chrome only, not scene state */
  var READOUTS = {
    hero:   { serial: "CW-I·026", ev: "EV 11.8 · 1/125", cal: "CAL 0.00°" },
    metal:  { serial: "BILLET A12", ev: "AL 6082-T6", cal: "CHAMFER 0.4" },
    glass:  { serial: "COAT MC", ev: "f/1.8 – f/16", cal: "6E / 4G" },
    leather:{ serial: "WRAP 03", ev: "GRAIN 0.35mm", cal: "HIDE VGT" },
    rubber: { serial: "DOME M10", ev: "40 SHORE A", cal: "REL 1.6 N" }
  };

  function paintReadout(name) {
    var r = READOUTS[name] || READOUTS.hero;
    if (instSerial) instSerial.textContent = r.serial;
    if (instEv) instEv.textContent = r.ev;
    if (instCal) instCal.textContent = r.cal;
  }

  /* ── material focus ────────────────────────────────────────────────────
     The chips and the scroll position are two inputs to one piece of state,
     so they share a setter rather than each poking the scene directly. */
  var active = "hero";

  function setView(name, fromScroll) {
    if (!name || name === active) return;
    active = name;
    chips.forEach(function (c) {
      c.setAttribute("aria-pressed", String(c.dataset.view === name));
    });
    panels.forEach(function (p) {
      p.classList.toggle("is-active", p.dataset.view === name);
    });
    if (typeof window.CANDELA_VIEW === "function") window.CANDELA_VIEW(name);
    paintReadout(name);
    // a chip press should also bring its caption up; a scroll must not
    // fight the scroll that caused it
    if (!fromScroll) {
      var panel = panels.filter(function (p) { return p.dataset.view === name; })[0];
      if (panel) panel.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "center" });
    }
  }

  function reduced() {
    return matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  chips.forEach(function (c) {
    c.addEventListener("click", function () { setView(c.dataset.view, false); });
  });

  panels.forEach(function (p) {
    p.classList.toggle("is-active", p.dataset.view === active);
  });
  paintReadout(active);

  /* scroll drives the same state — the caption crossing the middle of the
     viewport is what decides which material is being talked about */
  if ("IntersectionObserver" in window && panels.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) setView(e.target.dataset.view, true);
      });
    }, { rootMargin: "-45% 0px -45% 0px", threshold: 0 });
    panels.forEach(function (p) { io.observe(p); });
  }

  /* ── reveals ───────────────────────────────────────────────────────────
     Failsafe first: if IO is missing the content must still be visible,
     never left at opacity 0 holding blank space. */
  var revealables = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
  if (!("IntersectionObserver" in window)) {
    revealables.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var rio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); rio.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.06 });
    revealables.forEach(function (el) { rio.observe(el); });

    // anchor jumps can land past an element before the observer ever saw it
    var sweep = function () {
      revealables.forEach(function (el) {
        if (el.classList.contains("is-in")) return;
        var r = el.getBoundingClientRect();
        if (r.top < innerHeight * 0.95 && r.bottom > 0) el.classList.add("is-in");
      });
    };
    var t = 0;
    addEventListener("scroll", function () {
      clearTimeout(t); t = setTimeout(sweep, 120);
    }, { passive: true });
    addEventListener("hashchange", sweep);
  }

  /* ── enquiry form ──────────────────────────────────────────────────────
     Client-side only; validates, then confirms in place. */
  var form = document.getElementById("enqForm");
  if (form) {
    var name = document.getElementById("enq-name");
    var email = document.getElementById("enq-email");
    var errName = document.getElementById("err-name");
    var errEmail = document.getElementById("err-email");
    var done = document.getElementById("enqDone");

    var show = function (input, err, bad) {
      err.hidden = !bad;
      input.setAttribute("aria-invalid", String(bad));
      if (bad) input.setAttribute("aria-describedby", err.id);
      else input.removeAttribute("aria-describedby");
      input.classList.toggle("is-bad", bad);
    };

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var badName = !name.value.trim();
      var badEmail = !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim());
      show(name, errName, badName);
      show(email, errEmail, badEmail);
      if (badName) { name.focus(); return; }
      if (badEmail) { email.focus(); return; }
      form.classList.add("is-sent");
      done.hidden = false;
      done.focus && done.focus();
    });

    [[name, errName], [email, errEmail]].forEach(function (pair) {
      pair[0].addEventListener("input", function () {
        if (pair[1].hidden) return;
        show(pair[0], pair[1], false);
      });
    });
  }

  /* the stage announces itself when the model lands so the note can go */
  addEventListener("candela:ready", function () {
    var note = document.getElementById("stageNote");
    if (note) note.hidden = true;
  });
})();

/* LACQUER — page behaviour. 3D lives in scene.js. */
(function () {
  "use strict";

  var chips = Array.prototype.slice.call(document.querySelectorAll(".chip"));
  var panels = Array.prototype.slice.call(document.querySelectorAll(".panel"));
  var instSerial = document.getElementById("instSerial");
  var instEv = document.getElementById("instEv");
  var instCal = document.getElementById("instCal");

  var READOUTS = {
    hero:    { serial: "LQ-77·014", ev: "33⅓ RPM · 0.00%", cal: "WOW 0.08" },
    platter: { serial: "PLT AL6061", ev: "±0.02% WRMS", cal: "MASS 2.8 kg" },
    plinth:  { serial: "VN WAL-01", ev: "OAK VENEER", cal: "DAMP 12 dB" },
    tonearm: { serial: "ARM 9\"", ev: "FR 10–20 Hz", cal: "VTA 20°" },
    vinyl:   { serial: "LAC CUT", ev: "GROOVE 74 µm", cal: "RIAA ON" },
    cover:   { serial: "ACRY 4mm", ev: "IOR 1.49", cal: "HINGE L" },
  };

  function paintReadout(name) {
    var r = READOUTS[name] || READOUTS.hero;
    if (instSerial) instSerial.textContent = r.serial;
    if (instEv) instEv.textContent = r.ev;
    if (instCal) instCal.textContent = r.cal;
  }

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
    if (typeof window.LACQUER_VIEW === "function") window.LACQUER_VIEW(name);
    paintReadout(name);
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

  if ("IntersectionObserver" in window && panels.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) setView(e.target.dataset.view, true);
      });
    }, { rootMargin: "-45% 0px -45% 0px", threshold: 0 });
    panels.forEach(function (p) { io.observe(p); });
  }

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
    });

    [[name, errName], [email, errEmail]].forEach(function (pair) {
      pair[0].addEventListener("input", function () {
        if (pair[1].hidden) return;
        show(pair[0], pair[1], false);
      });
    });
  }

  addEventListener("lacquer:ready", function () {
    var note = document.getElementById("stageNote");
    if (note) note.hidden = true;
  });
})();

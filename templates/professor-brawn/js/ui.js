/* Professor Brawn — shared chrome: reveals, nav, the open-now clock. */
(function () {
  "use strict";

  var root = document.documentElement;
  root.classList.remove("no-js");
  root.classList.add("js-anim");

  /* ---------- reveals ----------
     IO-gated with a hard-timer failsafe and a throttled sweep, so anchor
     jumps and JS-injected markup can never leave blank space. */
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

  /* ---------- mobile nav ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var head = document.querySelector(".site-head");
  if (toggle && head) {
    toggle.addEventListener("click", function () {
      var open = head.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && head.classList.contains("nav-open")) {
        head.classList.remove("nav-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.focus();
      }
    });
  }

  /* ---------- open-now, computed in Singapore time ----------
     Published hours: Mon–Sat & public holidays 9:00am–9:00pm, last order
     8:20pm, closed on Sundays. Public holidays are open days, so the only
     closed day is Sunday. */
  function sgNow() {
    try {
      var parts = new Intl.DateTimeFormat("en-SG", {
        timeZone: "Asia/Singapore",
        weekday: "short", hour: "numeric", minute: "numeric", hourCycle: "h23"
      }).formatToParts(new Date());
      var out = {};
      parts.forEach(function (p) { out[p.type] = p.value; });
      return { day: out.weekday, mins: parseInt(out.hour, 10) * 60 + parseInt(out.minute, 10) };
    } catch (e) {
      var d = new Date();
      return { day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()], mins: d.getHours() * 60 + d.getMinutes() };
    }
  }

  function serviceState() {
    var H = window.PB_DATA ? window.PB_DATA.hours : { open: 540, close: 1260, lastOrderMin: 1220 };
    var now = sgNow();
    var sunday = now.day === "Sun";
    var open = !sunday && now.mins >= H.open && now.mins < H.close;
    var line;
    if (open) {
      line = now.mins >= H.lastOrderMin
        ? "Open now — kitchen takes last orders at 8:20pm"
        : "Open now until 9:00pm";
    } else if (sunday) {
      line = "Closed today (Sunday) — back Monday 9:00am";
    } else if (now.mins < H.open) {
      line = "Opens today at 9:00am";
    } else {
      line = "Closed for tonight — back tomorrow 9:00am";
    }
    return { open: open, line: line };
  }

  function paintService() {
    var s = serviceState();
    var pills = document.querySelectorAll("[data-open-pill]");
    for (var i = 0; i < pills.length; i++) {
      pills[i].classList.toggle("is-open", s.open);
      pills[i].classList.toggle("is-shut", !s.open);
    }
    var lines = document.querySelectorAll("[data-open-line]");
    for (var j = 0; j < lines.length; j++) lines[j].textContent = s.line;
  }

  paintService();
  setInterval(paintService, 60000);

  /* ---------- year ---------- */
  var yearEls = document.querySelectorAll("[data-year]");
  var y = String(new Date().getFullYear());
  for (var k = 0; k < yearEls.length; k++) yearEls[k].textContent = y;

  /* ---------- toast ---------- */
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

  window.PB_UI = {
    rescanReveals: rescanReveals,
    paintService: paintService,
    serviceState: serviceState,
    toast: toast
  };
})();

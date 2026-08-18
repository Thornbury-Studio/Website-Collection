/* cafe BomBom — shared chrome: reveals, mobile nav drawer, open-now clock.

   Published hours are a single fact — 11am to 9.30pm, every day — so the clock
   is deliberately simple. It exists because someone standing in Tampines 1 is
   asking exactly one question first: is it open right now, and for how long. */
(function () {
  "use strict";

  var root = document.documentElement;
  root.classList.remove("no-js");
  root.classList.add("js-anim");

  /* ---------- reveals ----------
     IO-gated with a hard-timer failsafe and a throttled sweep, so a stalled
     observer or an anchor jump can never leave blank space on the page. */
  var io = null, seenAny = false;

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
    }, { rootMargin: "0px 0px -5% 0px", threshold: 0.03 });
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
  setTimeout(function () { if (!seenAny) showAll(); }, 1500);
  window.addEventListener("scroll", queueSweep, { passive: true });
  window.addEventListener("resize", queueSweep);
  window.addEventListener("hashchange", queueSweep);

  /* ---------- nav drawer ----------
     The drawer is a fixed panel over the page, so while it is open the body
     must not scroll underneath it — that "ghost scrolling" is the single most
     common mobile drawer bug. Focus is moved into the panel and returned to
     the trigger on close. */
  var head = document.querySelector(".site-head");
  var toggle = document.querySelector(".nav-toggle");
  var closeBtn = document.querySelector(".nav-close");
  var scrim = document.querySelector(".scrim");
  var nav = document.querySelector(".site-nav");
  var scrollY = 0;

  function openNav() {
    scrollY = window.scrollY;
    head.classList.add("nav-open");
    document.body.style.position = "fixed";
    document.body.style.top = -scrollY + "px";
    document.body.style.width = "100%";
    toggle.setAttribute("aria-expanded", "true");
    if (closeBtn) closeBtn.focus();
  }
  function closeNav(returnFocus) {
    head.classList.remove("nav-open");
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.width = "";
    window.scrollTo(0, scrollY);
    toggle.setAttribute("aria-expanded", "false");
    if (returnFocus) toggle.focus();
  }

  if (toggle && head && nav) {
    toggle.addEventListener("click", function () {
      if (head.classList.contains("nav-open")) closeNav(true); else openNav();
    });
    if (closeBtn) closeBtn.addEventListener("click", function () { closeNav(true); });
    if (scrim) scrim.addEventListener("click", function () { closeNav(false); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && head.classList.contains("nav-open")) closeNav(true);
    });
    /* Tapping a link inside the drawer navigates; unlock the body first so the
       destination page does not inherit position:fixed. */
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) closeNav(false);
    });
    /* If the viewport grows past the desktop breakpoint while the drawer is
       open, the drawer stops existing — release the body lock with it. */
    window.addEventListener("resize", function () {
      if (window.innerWidth >= 900 && head.classList.contains("nav-open")) closeNav(false);
    });
  }

  /* ---------- open now, in Singapore time ----------
     Published hours: every day, 10:00–20:00. */
  var OPEN = 11 * 60, CLOSE = 21 * 60 + 30;

  function sgNow() {
    try {
      var parts = new Intl.DateTimeFormat("en-SG", {
        timeZone: "Asia/Singapore", weekday: "short",
        hour: "numeric", minute: "numeric", hourCycle: "h23"
      }).formatToParts(new Date());
      var o = {};
      parts.forEach(function (p) { o[p.type] = p.value; });
      var idx = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].indexOf(o.weekday);
      return { dayIdx: idx === -1 ? new Date().getDay() : idx,
               mins: parseInt(o.hour, 10) * 60 + parseInt(o.minute, 10) };
    } catch (e) {
      var d = new Date();
      return { dayIdx: d.getDay(), mins: d.getHours() * 60 + d.getMinutes() };
    }
  }
  function fmt(m) {
    var h = Math.floor(m / 60), mm = m % 60;
    var ap = h >= 12 ? "pm" : "am", h12 = h % 12 === 0 ? 12 : h % 12;
    return h12 + (mm ? "." + (mm < 10 ? "0" + mm : mm) : "") + ap;
  }
  function state() {
    var n = sgNow();
    var open = n.mins >= OPEN && n.mins < CLOSE;
    var line;
    if (open) {
      line = (CLOSE - n.mins <= 60)
        ? "Open — closing at " + fmt(CLOSE)
        : "Open now until " + fmt(CLOSE);
    } else if (n.mins < OPEN) {
      line = "Opens today at " + fmt(OPEN);
    } else {
      line = "Closed — opens tomorrow at " + fmt(OPEN);
    }
    return { open: open, line: line, dayIdx: n.dayIdx };
  }
  function paint() {
    var s = state();
    var pills = document.querySelectorAll("[data-open-pill]");
    for (var i = 0; i < pills.length; i++) {
      pills[i].classList.toggle("is-open", s.open);
      pills[i].classList.toggle("is-shut", !s.open);
    }
    var lines = document.querySelectorAll("[data-open-line]");
    for (var j = 0; j < lines.length; j++) lines[j].textContent = s.line;
    var rows = document.querySelectorAll("[data-day]");
    for (var k = 0; k < rows.length; k++) {
      rows[k].classList.toggle("is-today", rows[k].getAttribute("data-day") === String(s.dayIdx));
    }
  }
  paint();
  setInterval(paint, 60000);

  /* ---------- year ---------- */
  var y = String(new Date().getFullYear());
  var ys = document.querySelectorAll("[data-year]");
  for (var n2 = 0; n2 < ys.length; n2++) ys[n2].textContent = y;

  /* ---------- toast ---------- */
  var toastEl = null, timer = null;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "toast";
      toastEl.setAttribute("role", "status");
      toastEl.setAttribute("aria-live", "polite");
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add("is-up");
    clearTimeout(timer);
    timer = setTimeout(function () { toastEl.classList.remove("is-up"); }, 2600);
  }

  window.BOM_UI = { rescanReveals: rescanReveals, toast: toast, serviceState: state };
})();

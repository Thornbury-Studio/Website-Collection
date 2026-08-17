/* Timestealer Café — shared chrome: reveals, mobile nav, the open-now clock. */
(function () {
  "use strict";

  var root = document.documentElement;
  root.classList.remove("no-js");
  root.classList.add("js-anim");

  /* ---------- reveals ----------
     IntersectionObserver-gated with a hard-timer failsafe and a throttled
     sweep, so an anchor jump or a stalled observer can never leave the page
     blank. */
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
     Counter hours: Mon–Fri 10.30am–7pm, Sat 10.30am–5pm, closed Sunday.
     Index 0 is Sunday to match Date#getDay(); null means closed all day. */
  var HOURS = [
    null,               /* Sun */
    [630, 1140],        /* Mon 10:30–19:00 */
    [630, 1140],        /* Tue */
    [630, 1140],        /* Wed */
    [630, 1140],        /* Thu */
    [630, 1140],        /* Fri */
    [630, 1020],        /* Sat 10:30–17:00 */
    null
  ];
  var DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  function sgNow() {
    try {
      var parts = new Intl.DateTimeFormat("en-SG", {
        timeZone: "Asia/Singapore",
        weekday: "short", hour: "numeric", minute: "numeric", hourCycle: "h23"
      }).formatToParts(new Date());
      var out = {};
      parts.forEach(function (p) { out[p.type] = p.value; });
      var idx = DAY_NAMES.indexOf(out.weekday);
      return {
        dayIdx: idx === -1 ? new Date().getDay() : idx,
        mins: parseInt(out.hour, 10) * 60 + parseInt(out.minute, 10)
      };
    } catch (e) {
      var d = new Date();
      return { dayIdx: d.getDay(), mins: d.getHours() * 60 + d.getMinutes() };
    }
  }

  function fmt(mins) {
    var h = Math.floor(mins / 60);
    var m = mins % 60;
    var ampm = h >= 12 ? "pm" : "am";
    var h12 = h % 12 === 0 ? 12 : h % 12;
    return h12 + (m ? "." + (m < 10 ? "0" + m : m) : "") + ampm;
  }

  function nextOpenDay(fromIdx) {
    for (var i = 1; i <= 7; i++) {
      var idx = (fromIdx + i) % 7;
      if (HOURS[idx]) return { idx: idx, open: HOURS[idx][0], inDays: i };
    }
    return null;
  }

  function serviceState() {
    var now = sgNow();
    var today = HOURS[now.dayIdx];
    var open = !!today && now.mins >= today[0] && now.mins < today[1];
    var line;

    if (open) {
      var left = today[1] - now.mins;
      line = left <= 45
        ? "Open now — last orders soon, closes " + fmt(today[1])
        : "Open now until " + fmt(today[1]);
    } else if (today && now.mins < today[0]) {
      line = "Opens today at " + fmt(today[0]);
    } else {
      var nxt = nextOpenDay(now.dayIdx);
      if (!nxt) {
        line = "Closed";
      } else if (nxt.inDays === 1) {
        line = "Closed now — back tomorrow at " + fmt(nxt.open);
      } else {
        line = "Closed today — back " + DAY_NAMES[nxt.idx] + " at " + fmt(nxt.open);
      }
    }
    return { open: open, line: line, dayIdx: now.dayIdx };
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

    /* Highlight today's row in any hours table. */
    var rows = document.querySelectorAll("[data-day]");
    for (var k = 0; k < rows.length; k++) {
      var days = rows[k].getAttribute("data-day").split(",");
      var hit = days.indexOf(String(s.dayIdx)) !== -1;
      rows[k].classList.toggle("is-today", hit);
    }
  }

  paintService();
  setInterval(paintService, 60000);

  /* ---------- year ---------- */
  var yearEls = document.querySelectorAll("[data-year]");
  var y = String(new Date().getFullYear());
  for (var n = 0; n < yearEls.length; n++) yearEls[n].textContent = y;

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

  window.TS_UI = {
    rescanReveals: rescanReveals,
    paintService: paintService,
    serviceState: serviceState,
    toast: toast
  };
})();

/* NORTHLINE — interface layer: reveal system (house pattern), screen
   chrome (clock, KPIs, exception feed), the operations consoles, the
   3D watchdog fallback, and the working-session form. */
(function () {
  "use strict";

  var doc = document;
  var NL = window.NL;

  /* ---------------- reveal system ---------------- */
  var io = null;
  var seenOnce = false;

  function revealAllNow() {
    doc.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("is-in"); });
  }
  function sweepViewport() {
    var vh = window.innerHeight || doc.documentElement.clientHeight;
    doc.querySelectorAll(".reveal:not(.is-in)").forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < vh * 0.96 && r.bottom > 0) el.classList.add("is-in");
    });
  }
  function rescanReveals() {
    if (!io) return;
    doc.querySelectorAll(".reveal:not(.is-in)").forEach(function (el) { io.observe(el); });
    sweepViewport();
  }
  if ("IntersectionObserver" in window) {
    doc.documentElement.classList.add("js-anim");
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          seenOnce = true;
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.05 });
    doc.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });
    setTimeout(function () { if (!seenOnce) revealAllNow(); }, 1400);
    var t = 0;
    function throttledSweep() {
      if (t) return;
      t = setTimeout(function () { t = 0; sweepViewport(); }, 180);
    }
    window.addEventListener("scroll", throttledSweep, { passive: true });
    window.addEventListener("resize", throttledSweep);
    window.addEventListener("hashchange", throttledSweep);
  }
  window.rescanReveals = rescanReveals;

  if (!NL) return;

  /* ---------------- screen clock ---------------- */
  var clockEl = doc.getElementById("screen-clock");
  function tickClock() {
    if (!clockEl) return;
    var d = new Date();
    clockEl.textContent =
      ("0" + d.getHours()).slice(-2) + ":" +
      ("0" + d.getMinutes()).slice(-2) + ":" +
      ("0" + d.getSeconds()).slice(-2) + " LOCAL";
  }
  tickClock();
  setInterval(tickClock, 1000);

  /* ---------------- exception feed (hero screen) ---------------- */
  function sevChip(sev) {
    var c = doc.createElement("span");
    c.className = "sev sev-" + sev;
    c.textContent = sev === "info" ? "INFO" : sev.toUpperCase();
    return c;
  }
  var feed = doc.getElementById("feed-rows");
  if (feed) {
    NL.exceptions.forEach(function (ex) {
      var row = doc.createElement("button");
      row.type = "button";
      row.className = "feedrow";
      row.setAttribute("data-exnode", ex.node);

      var head = doc.createElement("span");
      head.className = "fr-head";
      head.appendChild(sevChip(ex.sev));
      var id = doc.createElement("span");
      id.className = "fr-id";
      id.textContent = ex.id + " · " + ex.kind;
      head.appendChild(id);
      var when = doc.createElement("span");
      when.className = "fr-when";
      when.textContent = ex.when;
      head.appendChild(when);

      var body = doc.createElement("span");
      body.className = "fr-body";
      body.textContent = ex.text;

      row.appendChild(head);
      row.appendChild(body);

      function focus(on) {
        if (window.NLMAP && window.NLMAP.focus) window.NLMAP.focus(on ? ex.node : null);
        row.classList.toggle("linked", on);
      }
      row.addEventListener("mouseenter", function () { focus(true); });
      row.addEventListener("mouseleave", function () { focus(false); });
      row.addEventListener("focus", function () { focus(true); });
      row.addEventListener("blur", function () { focus(false); });

      feed.appendChild(row);
    });
  }

  /* ---------------- 3D watchdog ----------------
     If the module never announced itself (CDN blocked, old browser,
     WebGL refused), reveal the designed static state. */
  setTimeout(function () {
    var screen = doc.getElementById("screen");
    if (screen && !(window.NLMAP && window.NLMAP.ready)) screen.classList.add("no3d");
  }, 3500);

  /* ---------------- operations consoles ---------------- */
  var views = ["exceptions", "lanes", "reroute"];
  doc.querySelectorAll(".seg[data-view]").forEach(function (b) {
    b.addEventListener("click", function () {
      var v = b.getAttribute("data-view");
      doc.querySelectorAll(".seg[data-view]").forEach(function (x) {
        x.setAttribute("aria-pressed", x === b ? "true" : "false");
      });
      views.forEach(function (id) {
        var panel = doc.getElementById("console-" + id);
        if (panel) panel.hidden = id !== v;
      });
    });
  });

  /* exceptions console (fuller table) */
  var exBody = doc.getElementById("ex-table");
  if (exBody) {
    NL.exceptions.forEach(function (ex) {
      var n = NL.nodeById(ex.node);
      var row = doc.createElement("div");
      row.className = "crow";
      row.setAttribute("data-exnode", ex.node);

      var c1 = doc.createElement("span");
      c1.className = "c-id mono";
      c1.textContent = ex.id;
      var c2 = doc.createElement("span");
      c2.appendChild(sevChip(ex.sev));
      var c3 = doc.createElement("span");
      c3.className = "c-kind";
      c3.textContent = ex.kind;
      var c4 = doc.createElement("span");
      c4.className = "c-where";
      c4.textContent = n ? n.name : "—";
      var c5 = doc.createElement("span");
      c5.className = "c-text";
      c5.textContent = ex.text;
      var c6 = doc.createElement("span");
      c6.className = "c-when mono";
      c6.textContent = ex.when;

      row.appendChild(c1); row.appendChild(c2); row.appendChild(c3);
      row.appendChild(c4); row.appendChild(c5); row.appendChild(c6);
      exBody.appendChild(row);
    });
  }

  /* lane confidence console */
  var laneBody = doc.getElementById("lane-table");
  if (laneBody) {
    var sorted = NL.lanes.slice().sort(function (a, b) { return a.conf - b.conf; });
    sorted.forEach(function (l) {
      var a = NL.nodeById(l.from), b = NL.nodeById(l.to);
      var row = doc.createElement("div");
      row.className = "crow lane-row";

      var c1 = doc.createElement("span");
      c1.className = "c-lane";
      c1.textContent = (a ? a.name : l.from) + " → " + (b ? b.name : l.to);

      var c2 = doc.createElement("span");
      c2.className = "c-days mono";
      c2.textContent = l.plan + " d plan · " + l.fcst.toFixed(1) + " d forecast";

      var c3 = doc.createElement("span");
      c3.className = "c-conf";
      var bar = doc.createElement("span");
      bar.className = "confbar s-" + l.status;
      var fill = doc.createElement("i");
      fill.style.width = Math.round(l.conf * 100) + "%";
      bar.appendChild(fill);
      var pct = doc.createElement("em");
      pct.className = "mono";
      pct.textContent = Math.round(l.conf * 100) + "%";
      c3.appendChild(bar); c3.appendChild(pct);

      var c4 = doc.createElement("span");
      var chip = sevChip(l.status === "alert" ? "red" : l.status === "watch" ? "watch" : "info");
      chip.textContent = l.status === "alert" ? "AT RISK" : l.status === "watch" ? "WATCH" : "STABLE";
      c4.appendChild(chip);

      row.appendChild(c1); row.appendChild(c2); row.appendChild(c3); row.appendChild(c4);
      laneBody.appendChild(row);
    });
  }

  /* reroute console */
  var rrHead = doc.getElementById("rr-head");
  var rrBody = doc.getElementById("rr-options");
  if (rrHead && rrBody) {
    rrHead.textContent = NL.reroute.shipment + " · " + NL.reroute.from + " → " + NL.reroute.to + " · required at DC " + NL.reroute.due;
    NL.reroute.options.forEach(function (o) {
      var card = doc.createElement("div");
      card.className = "rropt" + (o.rec ? " rec" : "");

      if (o.rec) {
        var rec = doc.createElement("span");
        rec.className = "rectag";
        rec.textContent = "RECOMMENDED";
        card.appendChild(rec);
      }
      var h = doc.createElement("h4");
      h.textContent = o.name;
      card.appendChild(h);

      var grid = doc.createElement("div");
      grid.className = "rr-facts mono";
      [["ETA", o.eta],
       ["Confidence", Math.round(o.conf * 100) + "%"],
       ["Cost delta", o.cost],
       ["CO₂ delta", o.co2]].forEach(function (f) {
        var k = doc.createElement("span"); k.className = "rk"; k.textContent = f[0];
        var v = doc.createElement("span"); v.className = "rv"; v.textContent = f[1];
        grid.appendChild(k); grid.appendChild(v);
      });
      card.appendChild(grid);

      var note = doc.createElement("p");
      note.textContent = o.flag;
      card.appendChild(note);

      rrBody.appendChild(card);
    });
  }

  /* ---------------- working-session form ---------------- */
  var form = doc.getElementById("session-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var done = doc.getElementById("form-done");
      form.hidden = true;
      if (done) {
        done.hidden = false;
        done.focus();
      }
    });
  }
})();

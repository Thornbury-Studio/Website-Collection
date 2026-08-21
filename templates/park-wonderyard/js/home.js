/* WONDERYARD home — the walk. Night factor from scroll, wayfinding rail,
   hero letter split, today board, computed facts and ticket prices. */
(function () {
  "use strict";

  var doc = document;
  var WY = window.WY;

  /* ---------------- hero letters ---------------- */
  var h1 = doc.querySelector(".hero h1 .word");
  if (h1) {
    var txt = h1.textContent;
    h1.textContent = "";
    for (var i = 0; i < txt.length; i++) {
      var s = doc.createElement("span");
      s.className = "l" + (txt[i] === "Y" ? " yo" : "");
      s.textContent = txt[i];
      h1.appendChild(s);
    }
  }

  /* ---------------- night factor ----------------
     0 until the dusk band enters, 1 once Afterdark's heart is reached.
     Interpolated across that span so the whole page ground sinks into
     night as you walk. */
  var duskEl = doc.getElementById("dusk");
  var darkEl = doc.getElementById("afterdark");
  var root = doc.documentElement;
  var lastNf = -1;

  /* progress p = how far between (dusk enters view) and (afterdark reached) */
  function nightFactor() {
    if (!duskEl || !darkEl) return 0;
    var vh = window.innerHeight || 800;
    var a = duskEl.getBoundingClientRect().top - vh * 0.9;   /* 0 at start */
    var b = darkEl.getBoundingClientRect().top - vh * 0.5;   /* 0 at end */
    if (a >= 0) return 0;
    if (b <= 0) return 1;
    return Math.min(1, Math.max(0, a / (a - b)));
  }

  function smooth(t) { return t * t * (3 - 2 * t); }

  function applyNf() {
    var raw = nightFactor();
    var nf = smooth(raw);
    /* text crosses fast between raw .40 and .60, where the dark dusk band
       owns the viewport — ink and ground never sit converged on screen */
    var nt = smooth(Math.min(1, Math.max(0, (raw - 0.4) / 0.2)));
    var q = Math.round(nf * 100) / 100;
    if (q === lastNf) return;
    lastNf = q;
    root.style.setProperty("--nf", String(q));
    root.style.setProperty("--nt", String(Math.round(nt * 100) / 100));
    doc.body.classList.toggle("night", raw > 0.5);
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { ticking = false; applyNf(); railHere(); });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  applyNf();

  /* ---------------- wayfinding rail ---------------- */
  var railLinks = Array.prototype.slice.call(doc.querySelectorAll(".rail a"));
  var stops = railLinks.map(function (a) {
    return doc.getElementById(a.getAttribute("href").slice(1));
  });

  function railHere() {
    if (!railLinks.length) return;
    var vh = window.innerHeight || 800;
    var current = 0;
    for (var i = 0; i < stops.length; i++) {
      if (stops[i] && stops[i].getBoundingClientRect().top <= vh * 0.5) current = i;
    }
    railLinks.forEach(function (a, i) { a.classList.toggle("here", i === current); });
  }
  railHere();

  /* ---------------- computed facts ---------------- */
  function put(id, v) {
    var el = doc.getElementById(id);
    if (el) el.textContent = String(v);
  }
  if (WY) {
    put("f-worlds", WY.worlds.length);
    put("f-attractions", WY.attractions.length);
    put("f-hours", (WY.hours.close - WY.hours.open));

    /* ticket prices on the plan strip */
    WY.tickets.forEach(function (t) {
      put("px-" + t.id, "$" + t.price);
      put("pk-" + t.id, "kids $" + t.kids);
    });
    var day = null;
    for (var j = 0; j < WY.tickets.length; j++) if (WY.tickets[j].id === "day") day = WY.tickets[j];
    if (day) {
      var fb = WY.familyBundle;
      var full = day.price * fb.adults + day.kids * fb.kids;
      put("px-family", "$" + (full - fb.off));
      put("pk-family", "save $" + fb.off + " vs " + fb.adults + "+" + fb.kids + " singles");
    }
  }

  /* ---------------- today board ---------------- */
  var tbody = doc.getElementById("today-rows");
  if (tbody && WY) {
    var picks = ["loosetooth", "squall", "hundredhand", "upsidehouse", "tallgrass", "nightmarket", "lastfirework"];
    var frag = doc.createDocumentFragment();
    picks.forEach(function (id) {
      var a = null;
      for (var k = 0; k < WY.attractions.length; k++) if (WY.attractions[k].id === id) a = WY.attractions[k];
      if (!a) return;
      var st = WY.statusFor(a);
      var row = doc.createElement("div");
      row.className = "trow";
      var w = WY.worldById(a.world);

      var n = doc.createElement("span"); n.className = "tn"; n.textContent = a.name;
      var t = doc.createElement("span"); t.className = "tw"; t.textContent = w ? w.name : "";
      var s = doc.createElement("span"); s.className = "ts s-" + st.state; s.textContent = st.label;
      row.appendChild(n); row.appendChild(t); row.appendChild(s);
      frag.appendChild(row);
    });
    tbody.appendChild(frag);

    var clock = doc.getElementById("today-clock");
    function tickClock() {
      var d = new Date();
      var hh = ("0" + d.getHours()).slice(-2), mm = ("0" + d.getMinutes()).slice(-2);
      if (clock) clock.textContent = hh + ":" + mm;
    }
    tickClock();
    setInterval(tickClock, 30000);
  }

  /* ---------------- afterdark video ---------------- */
  var vid = doc.getElementById("dark-video");
  var tog = doc.getElementById("dark-toggle");
  if (vid) {
    var src = (window.innerWidth <= 760 ? vid.getAttribute("data-src-small") : vid.getAttribute("data-src"));
    var loaded = false;
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function loadAndPlay() {
      if (!loaded) {
        vid.src = src;
        vid.load();
        loaded = true;
      }
      vid.play().catch(function () { /* fine — poster stands in */ });
    }

    if (!reduce && "IntersectionObserver" in window) {
      var vio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) loadAndPlay();
          else if (loaded) vid.pause();
        });
      }, { threshold: 0.25 });
      vio.observe(vid);
    }

    if (tog) {
      tog.addEventListener("click", function () {
        if (vid.paused) {
          loadAndPlay();
          tog.textContent = "Pause motion";
          tog.setAttribute("aria-pressed", "true");
        } else {
          vid.pause();
          tog.textContent = "Play motion";
          tog.setAttribute("aria-pressed", "false");
        }
      });
    }
  }
})();

/* NIGHTSHIFT home — league cards and Night Pass top-ups rendered from the
   catalogue (bonus percentages computed, never typed), plus the film strip. */
(function () {
  "use strict";

  var doc = document;
  var NS = window.NS;

  /* ---------------- leagues ---------------- */
  var lwrap = doc.getElementById("league-cards");
  if (lwrap && NS) {
    NS.leagues.forEach(function (l, i) {
      var c = doc.createElement("div");
      c.className = "lcard reveal" + (i ? " d" + i : "");
      var d = doc.createElement("span");
      d.className = "lday";
      d.textContent = l.day;
      var h = doc.createElement("h3");
      h.textContent = l.name;
      var p = doc.createElement("p");
      p.textContent = l.what;
      c.appendChild(d); c.appendChild(h); c.appendChild(p);
      lwrap.appendChild(c);
    });
    if (window.rescanReveals) window.rescanReveals();
  }

  /* ---------------- top-ups ---------------- */
  var twrap = doc.getElementById("topup-cards");
  if (twrap && NS) {
    NS.topups.forEach(function (t, i) {
      var v = NS.topupView(t);
      var bonusPct = v.bonusPct;
      var games = v.games;

      var c = doc.createElement("div");
      c.className = "tcard reveal" + (i ? " d" + i : "");
      var pay = doc.createElement("span");
      pay.className = "pay";
      pay.textContent = "$" + t.pay;
      var cr = doc.createElement("span");
      cr.className = "credits";
      cr.textContent = t.credits + " CREDITS";
      var b = doc.createElement("span");
      b.className = "bonus";
      b.textContent = bonusPct > 0 ? "+" + bonusPct + "% vs the $" + NS.topups[0].pay + " load" : "the starter load";
      var p = doc.createElement("p");
      p.textContent = "Roughly " + games + " games, depending on how brave you feel.";
      c.appendChild(pay); c.appendChild(cr); c.appendChild(b); c.appendChild(p);
      twrap.appendChild(c);
    });
    if (window.rescanReveals) window.rescanReveals();
  }

  /* ---------------- film strip ---------------- */
  var vid = doc.getElementById("strip-video");
  var tog = doc.getElementById("strip-toggle");
  if (vid) {
    var src = (window.innerWidth <= 760 ? vid.getAttribute("data-src-small") : vid.getAttribute("data-src"));
    var loaded = false;
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function loadAndPlay() {
      if (!loaded) { vid.src = src; vid.load(); loaded = true; }
      vid.play().catch(function () {});
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

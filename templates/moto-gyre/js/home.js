/* GYRE — home: hero media handling, lineup rail injected from the catalogue,
   derived stat chips. All figures computed via GYRE.derive — never typed. */
(function () {
  "use strict";

  var G = window.GYRE;
  if (!G) return;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- hero video ---------------- */
  var video = document.getElementById("hero-video");
  var toggle = document.getElementById("hero-toggle");

  if (video && reduceMotion) {
    /* respect reduced motion: never load the loop at all — poster only */
    if (toggle) toggle.hidden = true;
  } else if (video) {
    /* src assigned here, not in markup: no bytes for reduced-motion or no-JS,
       and the right tier per viewport */
    var small = window.matchMedia("(max-width: 768px)").matches;
    video.src = video.getAttribute(small ? "data-src-small" : "data-src");
    var p = video.play();
    if (p && p.catch) p.catch(function () { /* autoplay refused: poster stands */ });
    var syncLabel = function () {
      if (!toggle) return;
      toggle.textContent = video.paused ? "Play motion" : "Pause motion";
      toggle.setAttribute("aria-pressed", video.paused ? "false" : "true");
    };
    if (toggle) {
      toggle.addEventListener("click", function () {
        if (video.paused) { video.play(); } else { video.pause(); }
        syncLabel();
      });
    }
    video.addEventListener("play", syncLabel);
    video.addEventListener("pause", syncLabel);
    /* loadedmetadata races on file:// and warm caches — check readyState too */
    if (video.readyState >= 1) syncLabel(); else video.addEventListener("loadedmetadata", syncLabel);
  }

  /* ---------------- hero vitals (computed) ---------------- */
  var apex = G.byId("apex");
  var vitals = document.getElementById("hero-vitals");
  if (vitals && apex) {
    var d = G.derive(apex);
    vitals.innerHTML =
      '<div><span class="label">Peak output</span><b>' + G.fmt(d.hp) + ' hp</b></div>' +
      '<div><span class="label">Power to weight</span><b>' + G.fmt(d.ptw) + ' hp/t</b></div>' +
      '<div><span class="label">Machines</span><b>' + G.machines.length + '</b></div>';
  }

  /* ---------------- lineup rail ---------------- */
  var rail = document.getElementById("rail");
  if (rail) {
    var html = "";
    G.machines.forEach(function (m, i) {
      var d = G.derive(m);
      var stat = m.power.type === "ev"
        ? '<span class="label">Range</span><b>' + G.fmt(d.range) + ' km</b>'
        : '<span class="label">Peak</span><b>' + G.fmt(d.hp) + ' hp</b>';
      html +=
        '<a class="rail-card reveal d' + Math.min(i, 3) + '" href="garage.html#' + m.id + '">' +
          '<figure><img src="img/' + m.stage + '-card.webp" width="800" height="600" alt="' + m.alt + '" loading="lazy"></figure>' +
          '<div class="rail-body">' +
            '<span class="label">' + m.cls + '</span>' +
            '<h3>' + m.name + '</h3>' +
            '<div class="rail-stat">' + stat + '<span class="label">0–100 · ' + G.fmt(d.sprint, 1) + 's</span></div>' +
          '</div>' +
        '</a>';
    });
    rail.innerHTML = html;
    if (window.rescanReveals) window.rescanReveals();
  }
})();

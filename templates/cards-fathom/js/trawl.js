/* FATHOM — the trawl. Free, unlimited, honest: hold to haul the net, five
   plates surface face-down, flip them one by one. Rarity gates the reveal:
   Pulse+ plates tease (shake + brass halo) for a beat before turning.
   Distribution guarantees one Glow-or-better per trawl; Beacons are
   uncommon, Signatures rare. No money, no pity timers, no dark patterns. */
(function () {
  "use strict";

  var F = window.FATHOM, LOG = window.FATHOM_LOG, UI = window.FATHOM_UI;
  if (!F || !UI) return;

  var stage = document.getElementById("trawl-stage");
  var net = document.getElementById("net");
  if (!stage || !net) return;

  var progress = net.querySelector(".net-progress i");
  var hint = document.getElementById("trawl-hint");
  var row = document.getElementById("reveal-row");
  var summary = document.getElementById("trawl-summary");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- draw ---------- */

  function pool(rar) { return F.plates.filter(function (p) { return p.rar === rar; }); }
  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }

  function drawRarity(roll) {
    /* per-slot odds; slot 5 upgraded below */
    if (roll < 0.02) return "signature";
    if (roll < 0.085) return "beacon";
    if (roll < 0.27) return "pulse";
    if (roll < 0.58) return "glow";
    return "drift";
  }

  function drawFive() {
    var out = [], hasGlowPlus = false;
    for (var i = 0; i < 5; i++) {
      var rar = drawRarity(Math.random());
      if (i === 4 && !hasGlowPlus && (rar === "drift")) rar = "glow"; /* guarantee */
      if (F.rarities[rar].tier >= 2) hasGlowPlus = true;
      out.push(pick(pool(rar)));
    }
    return out;
  }

  /* ---------- haul (hold to fill) ---------- */

  var hauling = false, haul = 0, raf = 0, drawn = null, flipped = 0;

  function paintHaul() {
    raf = 0;
    progress.style.width = (haul * 100).toFixed(1) + "%";
    if (haul >= 1 && !drawn) surface();
  }

  function step() {
    if (!hauling && haul <= 0) return;
    haul = Math.min(1, Math.max(0, haul + (hauling ? 0.022 : -0.035)));
    if (!raf) raf = requestAnimationFrame(paintHaul);
    if (haul > 0 && haul < 1) setTimeout(step, 16);
  }

  function startHaul(e) {
    if (drawn) return;
    e.preventDefault();
    hauling = true;
    net.classList.add("hauling");
    if (window.FATHOM_AUDIO) window.FATHOM_AUDIO.tick();
    step();
  }
  function stopHaul() {
    hauling = false;
    net.classList.remove("hauling");
  }

  net.addEventListener("pointerdown", startHaul);
  net.addEventListener("pointerup", stopHaul);
  net.addEventListener("pointerleave", stopHaul);
  net.addEventListener("pointercancel", stopHaul);
  net.addEventListener("keydown", function (e) {
    if ((e.key === "Enter" || e.key === " ") && !drawn) {
      e.preventDefault();
      haul = 1; /* keyboard users skip the hold */
      if (!raf) raf = requestAnimationFrame(paintHaul);
    }
  });

  /* ---------- surface & flip ---------- */

  function surface() {
    drawn = drawFive();
    flipped = 0;
    stopHaul();
    if (window.FATHOM_AUDIO) window.FATHOM_AUDIO.tear();
    net.parentElement.hidden = true;
    if (hint) hint.hidden = true;
    row.hidden = false;
    row.innerHTML = drawn.map(function (p, i) {
      var tier = F.rarities[p.rar].tier;
      return '<div class="rcard waiting' + (tier >= 3 ? " tease-later" : "") + '" data-i="' + i + '">' +
        '<div class="rcard-inner">' +
          '<button class="rcard-back" type="button" aria-label="Turn plate ' + (i + 1) + ' of 5"><span class="cb-ring"></span></button>' +
          '<div class="rcard-front">' + UI.plateHtml(p, "md", { bare: true, inert: true }) + "</div>" +
        "</div></div>";
    }).join("");

    row.querySelectorAll(".rcard").forEach(function (rc) {
      rc.querySelector(".rcard-back").addEventListener("click", function () { flip(rc); });
    });
  }

  function flip(rc) {
    if (!rc.classList.contains("waiting")) return;
    var i = Number(rc.getAttribute("data-i"));
    var p = drawn[i];
    var tier = F.rarities[p.rar].tier;
    rc.classList.remove("waiting");

    function turn() {
      rc.classList.remove("tease");
      rc.classList.add("flipped");
      LOG.add(p.n);
      flipped += 1;
      if (window.FATHOM_AUDIO) {
        if (p.rar === "signature") window.FATHOM_AUDIO.signature();
        else if (p.rar === "beacon") window.FATHOM_AUDIO.beacon();
        else if (tier >= 3) window.FATHOM_AUDIO.shimmer();
        else window.FATHOM_AUDIO.flip();
      }
      UI.attachTilt(rc);
      if (flipped === 5) setTimeout(done, 650);
    }

    if (tier >= 3 && !reduceMotion) {
      rc.classList.add("tease");
      if (window.FATHOM_AUDIO && tier >= 4) window.FATHOM_AUDIO.shimmer();
      setTimeout(turn, tier >= 4 ? 1050 : 700);
    } else {
      turn();
    }
  }

  function done() {
    LOG.trawlDone();
    var s = LOG.stats();
    var newest = drawn.filter(function (p, i) { return drawn.indexOf(p) === i; });
    var bestTier = 0, best = null;
    drawn.forEach(function (p) {
      var t = F.rarities[p.rar].tier;
      if (t > bestTier) { bestTier = t; best = p; }
    });
    summary.hidden = false;
    summary.innerHTML =
      '<p class="lede">' +
      (bestTier >= 5 ? "An Abyssal Signature. The Survey will want to hear about this." :
        bestTier >= 4 ? "A Beacon surfaced — " + best.name + "." :
          "Five plates logged for the archive.") + "</p>" +
      '<span class="muted">' + F.set.short + " now " + s.owned + " / " + s.total + " · trawl " + LOG.trawls() + "</span>" +
      '<div class="hero-cta">' +
      '<button class="btn btn-ink" type="button" id="again">Trawl again</button>' +
      '<a class="btn btn-line" href="binder.html">Open the Log</a></div>';
    document.getElementById("again").addEventListener("click", reset);
  }

  function reset() {
    drawn = null; haul = 0; flipped = 0;
    progress.style.width = "0%";
    row.hidden = true; row.innerHTML = "";
    summary.hidden = true; summary.innerHTML = "";
    net.parentElement.hidden = false;
    if (hint) hint.hidden = false;
    net.focus();
  }
})();

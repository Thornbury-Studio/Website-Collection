/* FATHOM — plate renderer, tilt/foil engine, and the inspector.
   One renderer for every context (binder cell, grid, inspector) so a plate
   is always the same object at three sizes. Rarity is a material system:
   tiers add layers (glow edge → foil → holo band → signature shimmer). */
(function () {
  "use strict";

  var F = window.FATHOM, LOG = window.FATHOM_LOG;
  if (!F) return;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- svg glyphs ---------------- */

  function essGlyph(ess) {
    var c = F.essences[ess].color;
    var core = {
      ember: '<circle cx="8" cy="8" r="3.4" fill="' + c + '"/><circle cx="8" cy="8" r="5.8" fill="none" stroke="' + c + '" stroke-width="1" opacity="0.45"/>',
      volt: '<path d="M9.2 2.5 5 9h2.6l-1 4.5L11 7H8.4l0.8-4.5z" fill="' + c + '"/>',
      frost: '<path d="M8 2v12M3 5l10 6M13 5 3 11" stroke="' + c + '" stroke-width="1.4" stroke-linecap="round"/>',
      bloom: '<circle cx="8" cy="5.4" r="2.5" fill="' + c + '"/><circle cx="5.4" cy="9.8" r="2.5" fill="' + c + '" opacity="0.75"/><circle cx="10.6" cy="9.8" r="2.5" fill="' + c + '" opacity="0.55"/>',
      veil: '<path d="M8 2.6c3 2.2 4.6 4 4.6 6a4.6 4.6 0 1 1-9.2 0c0-2 1.6-3.8 4.6-6z" fill="none" stroke="' + c + '" stroke-width="1.4"/>',
      tide: '<path d="M2.5 9.5c1.8-2.4 3.4-2.4 5.2 0s3.4 2.4 5.2 0M2.5 5.5c1.8-2.4 3.4-2.4 5.2 0s3.4 2.4 5.2 0" fill="none" stroke="' + c + '" stroke-width="1.4" stroke-linecap="round"/>'
    }[ess];
    return '<svg viewBox="0 0 16 16" class="ess-glyph" role="img" aria-label="' + F.essences[ess].name + ' essence">' + core + "</svg>";
  }

  function setGlyph() {
    /* Descent I mark: a chevron sounding-line into water */
    return '<svg viewBox="0 0 16 16" class="set-glyph" aria-hidden="true"><path d="M3 4h10M8 4v5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><path d="M5 9.5 8 13l3-3.5" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }

  function rarMark(rar) {
    var r = F.rarities[rar];
    if (rar === "signature") return '<span class="rar-mark rm-sig">AS</span>';
    if (rar === "beacon") return '<span class="rar-mark rm-beacon">◈</span>';
    return '<span class="rar-mark">' + r.mark + "</span>";
  }

  /* ---------------- plate renderer ---------------- */

  /* size: "sm" | "md" | "lg" — controls art tier + which fields render */
  function plateHtml(p, size, opts) {
    opts = opts || {};
    var ess = F.essences[p.ess], zone = F.zones[p.zone];
    var art = F.artBase(p);
    var tier = F.rarities[p.rar].tier;
    var full = p.kind === "full" || p.kind === "signature";
    var owned = LOG ? LOG.has(p.n) : true;
    var fresh = LOG && LOG.isFresh(p.n);
    var img = "img/art-" + art + "-" + (size === "lg" ? "lg" : size === "md" ? "md" : "sm") + ".webp";
    var dims = size === "lg" ? 'width="1096" height="1462"' : size === "md" ? 'width="560" height="747"' : 'width="280" height="374"';

    var cls = "plate size-" + size + " rar-" + p.rar + (full ? " full-plate" : "") + (owned ? " is-owned" : " not-owned");
    var html = '<article class="' + cls + '" data-n="' + p.n + '" style="--ess:' + ess.color + '" tabindex="' + (opts.inert ? "-1" : "0") + '" role="button" aria-label="' + p.name + ", " + F.rarities[p.rar].name + " plate " + F.pad(p.n) + '">';
    html += '<div class="plate-inner"><div class="plate-face">';

    if (!full) {
      html += '<header class="plate-head"><span class="p-name">' + p.name + "</span>" + essGlyph(p.ess) + "</header>";
    }

    html += '<figure class="plate-art"><img src="' + img + '" ' + dims + ' alt="" loading="' + (opts.eager ? "eager" : "lazy") + '" decoding="async">';
    if (tier >= 3) html += '<div class="foil" aria-hidden="true"></div>';
    if (tier >= 4) html += '<div class="holo-band" aria-hidden="true"></div>';
    html += "</figure>";

    if (full) {
      html += '<header class="plate-head over"><span class="p-name">' + p.name + "</span>" + essGlyph(p.ess) + "</header>";
    }

    if (size !== "sm") {
      html += '<div class="plate-meta"><span class="p-zone">' + zone.name.toUpperCase() + " · " + zone.depth + '</span><span class="p-lumen">LM ' + p.lumen + "</span></div>";
    }

    html += '<footer class="plate-foot"><span class="p-no">' + (p.serial ? p.serial : F.pad(p.n) + " / " + F.plates.length) + "</span>" + setGlyph() + rarMark(p.rar) + "</footer>";
    html += '<div class="glare" aria-hidden="true"></div>';
    html += "</div></div>";

    if (!opts.bare) {
      if (fresh) html += '<span class="pip-new" aria-label="Newly logged">NEW</span>';
      if (owned && LOG) html += '<span class="pip-owned" role="img" aria-label="In your log"></span>';
      if (owned && LOG && LOG.count(p.n) > 1) html += '<span class="pip-count">×' + LOG.count(p.n) + "</span>";
    }
    html += "</article>";
    return html;
  }

  /* ---------------- tilt / foil engine ---------------- */

  function attachTilt(root) {
    if (reduceMotion) return;
    root = root || document;
    root.querySelectorAll(".plate:not([data-tilt])").forEach(function (card) {
      card.setAttribute("data-tilt", "1");
      var inner = card.querySelector(".plate-inner");
      var raf = 0, px = 0.5, py = 0.5, active = false;

      function paint() {
        raf = 0;
        var ry = (px - 0.5) * 16, rx = (0.5 - py) * 14;
        inner.style.transform = active
          ? "rotateX(" + rx.toFixed(2) + "deg) rotateY(" + ry.toFixed(2) + "deg)"
          : "";
        card.style.setProperty("--px", (px * 100).toFixed(1) + "%");
        card.style.setProperty("--py", (py * 100).toFixed(1) + "%");
      }
      function onMove(e) {
        var r = card.getBoundingClientRect();
        px = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
        py = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
        active = true;
        card.classList.add("lit");
        if (!raf) raf = requestAnimationFrame(paint);
      }
      function onLeave() {
        active = false;
        card.classList.remove("lit");
        if (!raf) raf = requestAnimationFrame(paint);
      }
      card.addEventListener("pointermove", onMove);
      card.addEventListener("pointerleave", onLeave);
      card.addEventListener("pointercancel", onLeave);
      card.addEventListener("pointerup", onLeave); /* touch drags end without a leave */
    });
  }

  /* ---------------- inspector ---------------- */

  var overlay = null, currentN = 0, lastFocus = null;

  function relatedOf(p) {
    var rel = [];
    F.plates.forEach(function (q) {
      if (q.n === p.n) return;
      var sameArt = F.artBase(q) === F.artBase(p);
      var sameZone = q.zone === p.zone;
      if (sameArt) rel.unshift(q);
      else if (sameZone && rel.length < 6) rel.push(q);
    });
    return rel.slice(0, 4);
  }

  function inspectorHtml(p) {
    var zone = F.zones[p.zone], ess = F.essences[p.ess], rar = F.rarities[p.rar];
    var owned = LOG ? LOG.count(p.n) : 0;
    var rel = relatedOf(p);
    var h = '<div class="insp-backdrop" data-close></div>';
    h += '<div class="insp-panel" role="dialog" aria-modal="true" aria-label="' + p.name + ' plate detail">';
    h += '<button class="insp-close" type="button" data-close aria-label="Close">×</button>';
    h += '<div class="insp-stage"><div class="insp-flip" id="insp-flip">';
    h += '<div class="insp-front">' + plateHtml(p, "lg", { bare: true, eager: true, inert: true }) + "</div>";
    h += '<div class="insp-back"><div class="card-back"><div class="cb-ring"></div><span class="cb-word">FATHOM</span><span class="cb-sub">Meridian Trench Survey</span><span class="cb-line">Some light never surfaces.</span></div></div>';
    h += "</div>";
    h += '<button class="btn-flip" type="button" id="insp-flipbtn">Turn plate</button></div>';
    h += '<div class="insp-info">';
    h += '<span class="label">Plate ' + (p.serial || F.pad(p.n)) + " · " + F.set.short + "</span>";
    h += "<h2>" + p.name + "</h2>";
    h += '<p class="insp-note">' + p.note + "</p>";
    h += '<dl class="insp-facts">';
    h += "<div><dt>Rarity</dt><dd>" + rar.name + "</dd></div>";
    h += "<div><dt>Zone</dt><dd>" + zone.name + " · " + zone.depth + "</dd></div>";
    h += "<div><dt>Essence</dt><dd>" + ess.name + " — " + ess.note + "</dd></div>";
    h += "<div><dt>Lumen</dt><dd>LM " + p.lumen + "</dd></div>";
    h += "<div><dt>Recorded length</dt><dd>" + p.len + "</dd></div>";
    h += "<div><dt>In your log</dt><dd>" + (owned ? owned + " cop" + (owned > 1 ? "ies" : "y") : "Not yet logged") + "</dd></div>";
    h += "</dl>";
    if (LOG) {
      h += '<div class="insp-actions">';
      h += '<button class="btn-pin' + (LOG.isPinned(p.n) ? " on" : "") + '" type="button" id="insp-pin"' + (owned ? "" : " disabled") + ">" + (LOG.isPinned(p.n) ? "Pinned to shelf" : "Pin to shelf") + "</button>";
      h += "</div>";
    }
    if (rel.length) {
      h += '<span class="label rel-label">Related plates</span><div class="insp-rel">';
      rel.forEach(function (q) { h += plateHtml(q, "sm", { bare: true }); });
      h += "</div>";
    }
    h += '<div class="insp-nav"><button type="button" class="btn-ghost" id="insp-prev">← Prev</button><button type="button" class="btn-ghost" id="insp-next">Next →</button></div>';
    h += "</div></div>";
    return h;
  }

  function openInspector(n) {
    var p = F.byN(n);
    if (!p) return;
    currentN = n;
    lastFocus = document.activeElement;
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.className = "inspector";
      document.body.appendChild(overlay);
    }
    overlay.innerHTML = inspectorHtml(p);
    overlay.classList.add("open");
    document.body.classList.add("no-scroll");
    if (LOG) LOG.clearFresh(n);
    attachTilt(overlay);
    if (window.FATHOM_AUDIO) window.FATHOM_AUDIO.flip();

    overlay.querySelectorAll("[data-close]").forEach(function (el) {
      el.addEventListener("click", closeInspector);
    });
    var flip = overlay.querySelector("#insp-flip");
    overlay.querySelector("#insp-flipbtn").addEventListener("click", function () {
      flip.classList.toggle("flipped");
      if (window.FATHOM_AUDIO) window.FATHOM_AUDIO.flip();
    });
    var pin = overlay.querySelector("#insp-pin");
    if (pin) pin.addEventListener("click", function () {
      LOG.pin(currentN);
      pin.classList.toggle("on", LOG.isPinned(currentN));
      pin.textContent = LOG.isPinned(currentN) ? "Pinned to shelf" : "Pin to shelf";
      if (window.FATHOM_AUDIO) window.FATHOM_AUDIO.tick();
    });
    function step(d) {
      var list = F.plates, idx = -1;
      list.forEach(function (q, i) { if (q.n === currentN) idx = i; });
      var next = list[(idx + d + list.length) % list.length];
      openInspector(next.n);
    }
    overlay.querySelector("#insp-prev").addEventListener("click", function () { step(-1); });
    overlay.querySelector("#insp-next").addEventListener("click", function () { step(1); });
    overlay.querySelectorAll(".insp-rel .plate").forEach(function (card) {
      card.addEventListener("click", function () { openInspector(Number(card.getAttribute("data-n"))); });
    });
    overlay.querySelector(".insp-close").focus();
  }

  function closeInspector() {
    if (!overlay) return;
    overlay.classList.remove("open");
    document.body.classList.remove("no-scroll");
    overlay.innerHTML = "";
    if (lastFocus && lastFocus.focus) lastFocus.focus();
    document.dispatchEvent(new CustomEvent("fathom:change"));
  }

  document.addEventListener("keydown", function (e) {
    if (!overlay || !overlay.classList.contains("open")) return;
    if (e.key === "Escape") closeInspector();
    if (e.key === "ArrowLeft") { var b = overlay.querySelector("#insp-prev"); if (b) b.click(); }
    if (e.key === "ArrowRight") { var b2 = overlay.querySelector("#insp-next"); if (b2) b2.click(); }
  });

  /* click-to-inspect delegation for any container marked data-inspect */
  document.addEventListener("click", function (e) {
    var card = e.target.closest("[data-inspect] .plate");
    if (card) openInspector(Number(card.getAttribute("data-n")));
  });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Enter" && e.key !== " ") return;
    var card = e.target.closest && e.target.closest("[data-inspect] .plate");
    if (card) { e.preventDefault(); openInspector(Number(card.getAttribute("data-n"))); }
  });

  window.FATHOM_UI = {
    plateHtml: plateHtml,
    attachTilt: attachTilt,
    inspect: openInspector,
    essGlyph: essGlyph,
    setGlyph: setGlyph
  };
})();

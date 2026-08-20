/* FATHOM — the archive: search + progressive filters. Basic exploration is
   a search box and three quick chips; zone/essence/rarity live behind
   "More filters" so casual browsing stays calm. */
(function () {
  "use strict";

  var F = window.FATHOM, LOG = window.FATHOM_LOG, UI = window.FATHOM_UI;
  if (!F || !UI) return;

  var grid = document.getElementById("archive-grid");
  var result = document.getElementById("result-line");
  var search = document.getElementById("search");
  if (!grid) return;

  var state = { q: "", own: "all", zone: null, ess: null, rar: null };

  function buildChips(el, dict, key, withSwatch) {
    var html = "";
    Object.keys(dict).forEach(function (k) {
      html += '<button class="chip" type="button" data-k="' + k + '" aria-pressed="false">' +
        (withSwatch ? '<span class="swatch" style="background:' + dict[k].color + '"></span>' : "") +
        dict[k].name + "</button>";
    });
    el.innerHTML = html;
    el.addEventListener("click", function (e) {
      var b = e.target.closest(".chip");
      if (!b) return;
      var k = b.getAttribute("data-k");
      state[key] = state[key] === k ? null : k;
      el.querySelectorAll(".chip").forEach(function (c) {
        c.setAttribute("aria-pressed", c.getAttribute("data-k") === state[key] ? "true" : "false");
      });
      if (window.FATHOM_AUDIO) window.FATHOM_AUDIO.tick();
      render();
    });
  }

  var zoneEl = document.getElementById("f-zone"), essEl = document.getElementById("f-ess"), rarEl = document.getElementById("f-rar");
  if (zoneEl) buildChips(zoneEl, F.zones, "zone", false);
  if (essEl) buildChips(essEl, F.essences, "ess", true);
  if (rarEl) buildChips(rarEl, F.rarities, "rar", false);

  document.querySelectorAll("#own-row .chip").forEach(function (b) {
    b.addEventListener("click", function () {
      state.own = b.getAttribute("data-own");
      document.querySelectorAll("#own-row .chip").forEach(function (c) {
        c.setAttribute("aria-pressed", c.getAttribute("data-own") === state.own ? "true" : "false");
      });
      if (window.FATHOM_AUDIO) window.FATHOM_AUDIO.tick();
      render();
    });
  });

  var adv = document.getElementById("adv");
  var advBtn = document.getElementById("adv-toggle");
  if (advBtn) advBtn.addEventListener("click", function () {
    var open = adv.hidden;
    adv.hidden = !open;
    advBtn.setAttribute("aria-expanded", open ? "true" : "false");
    advBtn.textContent = open ? "Fewer filters" : "More filters";
  });

  if (search) {
    var deb = 0;
    search.addEventListener("input", function () {
      clearTimeout(deb);
      deb = setTimeout(function () { state.q = search.value.trim().toLowerCase(); render(); }, 140);
    });
  }

  function matches(p) {
    if (state.q) {
      var hay = (p.name + " " + p.id + " " + F.zones[p.zone].name + " " + F.essences[p.ess].name + " " + F.rarities[p.rar].name).toLowerCase();
      if (hay.indexOf(state.q) < 0) return false;
    }
    if (state.own === "owned" && !LOG.has(p.n)) return false;
    if (state.own === "missing" && LOG.has(p.n)) return false;
    if (state.zone && p.zone !== state.zone) return false;
    if (state.ess && p.ess !== state.ess) return false;
    if (state.rar && p.rar !== state.rar) return false;
    return true;
  }

  function render() {
    var list = F.plates.filter(matches);
    if (result) result.textContent = list.length + " of " + F.plates.length + " plates";
    if (!list.length) {
      grid.innerHTML = '<div class="empty-state span-all"><b>Nothing at this depth.</b>Loosen a filter, or trawl for more plates.</div>';
      return;
    }
    grid.innerHTML = list.map(function (p) { return UI.plateHtml(p, "md"); }).join("");
    UI.attachTilt(grid);
    if (window.rescanFades) window.rescanFades();
  }

  render();
  document.addEventListener("fathom:change", render);
})();

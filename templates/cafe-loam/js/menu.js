/* LOAM — the board. Renders the menu from the catalogue, filters it,
   answers the taste finder, and gives every tap something back. */
(function () {
  "use strict";

  var C = window.LOAM, S = window.LOAM_SERVICE, T = window.LOAM_TRAY;
  if (!C || !S || !T) return;

  var board = document.querySelector("[data-board]");
  if (!board) return;

  var service = S.state();
  var filter = "all";
  var taste = { milk: null, strength: null, temp: null };

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  var PLUS = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>';
  var TICK = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>';

  /* ---------- what the current filters allow ---------- */

  function tasteActive() {
    return taste.milk !== null || taste.strength !== null || taste.temp !== null;
  }

  function matchesTaste(item) {
    if (item.milk === null || item.milk === undefined) return false; // food has no taste profile
    if (taste.milk !== null && item.milk !== taste.milk) return false;
    if (taste.strength !== null && item.strength !== taste.strength) return false;
    if (taste.temp !== null && item.temp !== taste.temp) return false;
    return true;
  }

  function visibleItems() {
    var out = [];
    for (var i = 0; i < C.ITEMS.length; i++) {
      var item = C.ITEMS[i];
      if (tasteActive()) {
        if (matchesTaste(item)) out.push(item);
        continue;
      }
      if (filter === "all" || item.group === filter) out.push(item);
    }
    return out;
  }

  /* ---------- rendering ---------- */

  function cardHTML(item) {
    var available = S.isAvailable(item, service);
    var reason = available ? "" : S.unavailableReason(item, service);
    var qty = T.qtyOf(item.id);

    return '<article class="card reveal' + (qty ? " is-added" : "") + (available ? "" : " is-off") +
        '" data-card="' + esc(item.id) + '">' +
        '<div class="card-shot">' +
          '<img src="img/' + esc(item.img) + '-400.webp"' +
            ' srcset="img/' + esc(item.img) + '-400.webp 400w, img/' + esc(item.img) + '-800.webp 800w"' +
            ' sizes="(min-width: 900px) 360px, (min-width: 560px) 45vw, 92vw"' +
            ' alt="' + esc(item.alt) + '" width="800" height="800" loading="lazy" decoding="async">' +
          '<span class="qty-flag" data-flag="' + esc(item.id) + '"' + (qty ? "" : " hidden") + '>' +
            qty + " on tray</span>" +
          (available ? "" : '<span class="off-flag">' + esc(reason) + "</span>") +
        "</div>" +
        '<div class="card-body">' +
          '<h3 class="card-name">' + esc(item.name) + "</h3>" +
          '<p class="card-note">' + esc(item.note) + "</p>" +
          '<div class="card-foot">' +
            '<span class="card-price nums">' + C.money(item.price) + "</span>" +
            '<button class="add-btn" type="button" data-add="' + esc(item.id) + '"' +
              (available ? "" : " disabled") + ' aria-label="Add ' + esc(item.name) + ' to tray, ' + C.money(item.price) + '">' +
              (qty ? TICK : PLUS) + "<span>" + (available ? "Add" : "Later") + "</span></button>" +
          "</div>" +
        "</div>" +
      "</article>";
  }

  function render() {
    var items = visibleItems();
    var html = "";

    if (tasteActive()) {
      html += '<section class="group">' +
        '<div class="group-head"><h2>Matching your taste</h2>' +
        '<span class="group-count">' + items.length + (items.length === 1 ? " drink" : " drinks") + "</span></div>";
      html += items.length
        ? '<div class="items">' + items.map(cardHTML).join("") + "</div>"
        : '<p class="empty-note">Nothing matches all three just now. Loosen one and try again &mdash; or ask at the counter, we improvise.</p>';
      html += "</section>";
    } else {
      for (var g = 0; g < C.GROUPS.length; g++) {
        var group = C.GROUPS[g];
        if (filter !== "all" && filter !== group.key) continue;
        var inGroup = items.filter(function (it) { return it.group === group.key; });
        if (!inGroup.length) continue;
        html += '<section class="group" id="g-' + esc(group.key) + '">' +
          '<div class="group-head"><h2>' + esc(group.name) + "</h2>" +
          '<span class="group-count">' + inGroup.length + " items</span></div>" +
          '<p class="group-note">' + esc(group.note) + "</p>" +
          '<div class="items">' + inGroup.map(cardHTML).join("") + "</div>" +
        "</section>";
      }
    }

    board.innerHTML = html;
    if (window.LOAM_UI) window.LOAM_UI.rescanReveals();
  }

  /* ---------- chips ---------- */

  function buildChips() {
    var rail = document.querySelector("[data-chips]");
    if (!rail) return;
    var html = '<button class="chip" type="button" data-filter="all" aria-pressed="true">Everything' +
      '<span class="chip-count">' + C.ITEMS.length + "</span></button>";
    for (var i = 0; i < C.GROUPS.length; i++) {
      var g = C.GROUPS[i];
      html += '<button class="chip" type="button" data-filter="' + esc(g.key) + '" aria-pressed="false">' +
        esc(g.name) + '<span class="chip-count">' + C.inGroup(g.key).length + "</span></button>";
    }
    rail.innerHTML = html;

    rail.addEventListener("click", function (ev) {
      var chip = ev.target.closest("[data-filter]");
      if (!chip) return;
      filter = chip.getAttribute("data-filter");
      // Choosing a category clears the taste finder — one lens at a time.
      if (tasteActive()) {
        taste = { milk: null, strength: null, temp: null };
        syncFinder();
      }
      var chips = rail.querySelectorAll("[data-filter]");
      for (var i = 0; i < chips.length; i++) {
        chips[i].setAttribute("aria-pressed", chips[i] === chip ? "true" : "false");
      }
      render();
    });
  }

  /* ---------- taste finder ---------- */

  function syncFinder() {
    var btns = document.querySelectorAll("[data-taste]");
    for (var i = 0; i < btns.length; i++) {
      var key = btns[i].getAttribute("data-taste");
      var raw = btns[i].getAttribute("data-value");
      var val = raw === "true" ? true : raw === "false" ? false : isNaN(+raw) ? raw : +raw;
      btns[i].setAttribute("aria-pressed", taste[key] === val ? "true" : "false");
    }
    var out = document.querySelector("[data-taste-out]");
    var clear = document.querySelector("[data-taste-clear]");
    if (out) {
      if (!tasteActive()) {
        out.textContent = "Pick any combination and the board narrows to it.";
      } else {
        var n = C.ITEMS.filter(matchesTaste).length;
        out.textContent = n === 0
          ? "Nothing matches all three."
          : n + (n === 1 ? " drink matches." : " drinks match.");
      }
    }
    if (clear) clear.hidden = !tasteActive();
  }

  function buildFinder() {
    var finder = document.querySelector("[data-finder]");
    if (!finder) return;
    finder.addEventListener("click", function (ev) {
      var btn = ev.target.closest("[data-taste]");
      if (btn) {
        var key = btn.getAttribute("data-taste");
        var raw = btn.getAttribute("data-value");
        var val = raw === "true" ? true : raw === "false" ? false : isNaN(+raw) ? raw : +raw;
        taste[key] = taste[key] === val ? null : val;   // press again to clear
        syncFinder();
        render();
        return;
      }
      if (ev.target.closest("[data-taste-clear]")) {
        taste = { milk: null, strength: null, temp: null };
        syncFinder();
        render();
      }
    });
    syncFinder();
  }

  /* ---------- adding ---------- */

  board.addEventListener("click", function (ev) {
    var btn = ev.target.closest("[data-add]");
    if (!btn || btn.disabled) return;
    var id = btn.getAttribute("data-add");
    var res = T.add(id);
    if (!res) return;

    if (res.capped) {
      if (window.LOAM_UI) window.LOAM_UI.toast("That's " + res.qty + " already — plenty.");
      return;
    }
    if (window.LOAM_UI) {
      window.LOAM_UI.toast(res.item.name + " added" + (res.qty > 1 ? " (" + res.qty + ")" : "") + ".");
    }
  });

  // Keep every card's badge honest, whatever changed the tray.
  window.addEventListener("loam:tray", function () {
    var cards = board.querySelectorAll("[data-card]");
    for (var i = 0; i < cards.length; i++) {
      var id = cards[i].getAttribute("data-card");
      var qty = T.qtyOf(id);
      var flag = cards[i].querySelector("[data-flag]");
      var btn = cards[i].querySelector("[data-add]");
      cards[i].classList.toggle("is-added", qty > 0);
      if (flag) {
        flag.hidden = qty === 0;
        flag.textContent = qty + " on tray";
      }
      if (btn && !btn.disabled) {
        btn.innerHTML = (qty ? TICK : PLUS) + "<span>" + (qty ? "Added" : "Add") + "</span>";
      }
    }
  });

  /* ---------- service note at the top of the board ---------- */
  var note = document.querySelector("[data-board-note]");
  if (note) {
    if (!service.open) {
      note.textContent = "The board is here whenever you are — we open " + (service.nextOpenLabel || "soon") + ".";
    } else if (service.kitchenNext) {
      note.textContent = service.kitchenNext;
    } else {
      note.textContent = "Kitchen on until " + service.kitchenUntil + ". Everything below is going right now.";
    }
  }

  buildChips();
  buildFinder();
  render();
})();

/* LOAM — the retail bags. Same tray, same feedback. */
(function () {
  "use strict";

  var C = window.LOAM, T = window.LOAM_TRAY;
  if (!C || !T) return;

  var grid = document.querySelector("[data-bags]");
  if (!grid) return;

  var ROAST_WORDS = ["", "light", "light–medium", "medium", "medium–dark", "dark"];

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function render() {
    var html = "";
    for (var i = 0; i < C.BEANS.length; i++) {
      var b = C.BEANS[i];
      var qty = T.qtyOf(b.id);

      var meter = "";
      for (var r = 1; r <= 5; r++) {
        meter += '<span class="roast-step' + (r <= b.roast ? " on" : "") + '"></span>';
      }

      var notes = "";
      for (var n = 0; n < b.notes.length; n++) {
        notes += '<span class="note-chip">' + esc(b.notes[n]) + "</span>";
      }

      html +=
        '<article class="bag reveal d' + ((i % 3) + 1) + '" data-bag="' + esc(b.id) + '">' +
          '<div class="bag-top"><div>' +
            '<p class="bag-kind">' + esc(b.kind) + "</p>" +
            "<h3>" + esc(b.name) + "</h3>" +
            '<p class="bag-origin">' + esc(b.origin) + " · " + esc(b.size) + "</p>" +
          "</div></div>" +
          '<div class="notes">' + notes + "</div>" +
          '<p class="roast"><span>Roast</span><span class="roast-meter" role="img" aria-label="Roast level ' +
            b.roast + ' of 5, ' + ROAST_WORDS[b.roast] + '">' + meter + "</span></p>" +
          '<p class="bag-blurb">' + esc(b.blurb) + "</p>" +
          '<div class="bag-foot">' +
            '<span class="bag-price nums">' + C.money(b.price) + "</span>" +
            '<button class="add-btn" type="button" data-add-bag="' + esc(b.id) + '"' +
              ' aria-label="Add ' + esc(b.name) + ' to tray, ' + C.money(b.price) + '">' +
              (qty ? "Added" : "Add bag") + "</button>" +
          "</div>" +
        "</article>";
    }
    grid.innerHTML = html;
    if (window.LOAM_UI) window.LOAM_UI.rescanReveals();
  }

  grid.addEventListener("click", function (ev) {
    var btn = ev.target.closest("[data-add-bag]");
    if (!btn) return;
    var res = T.add(btn.getAttribute("data-add-bag"));
    if (!res) return;
    if (res.capped) {
      if (window.LOAM_UI) window.LOAM_UI.toast("That's " + res.qty + " bags — the grinder thanks you.");
      return;
    }
    if (window.LOAM_UI) window.LOAM_UI.toast(res.item.name + " added" + (res.qty > 1 ? " (" + res.qty + ")" : "") + ".");
  });

  window.addEventListener("loam:tray", function () {
    var bags = grid.querySelectorAll("[data-bag]");
    for (var i = 0; i < bags.length; i++) {
      var id = bags[i].getAttribute("data-bag");
      var btn = bags[i].querySelector("[data-add-bag]");
      if (btn) btn.textContent = T.qtyOf(id) ? "Added" : "Add bag";
    }
  });

  render();
})();

/* NEAP — menu page: renders both services from the catalogue,
   marks tonight's, and draws the 28-night tide calendar. */
(function () {
  "use strict";

  var T = window.NEAP_TIDE, M = window.NEAP_MENUS;
  if (!T || !M) return;

  var t = T.tonight();

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  /* ---------- the two services ---------- */
  function renderMenu(el, menu) {
    var head =
      '<header class="menu-card-head reveal">' +
        '<h2 class="menu-name">' + esc(menu.name) + "</h2>" +
        '<p class="menu-tide">' + esc(menu.tide) + "</p>" +
        '<p class="menu-tonight">Served tonight</p>' +
      "</header>";

    var lis = "";
    for (var i = 0; i < menu.courses.length; i++) {
      var c = menu.courses[i];
      lis += '<li class="reveal"><p class="t-course">' + esc(c.n) + "</p>" +
             '<p class="course-note">' + esc(c.d) + "</p></li>";
    }

    var price =
      '<p class="menu-price reveal">' + menu.courses.length + " courses &mdash; " + menu.price +
      ' <span class="muted">per guest</span></p>';

    el.innerHTML = head + '<ol class="courses">' + lis + "</ol>" + price;
    if (menu.key === t.menu) el.classList.add("is-tonight");
  }

  var floodEl = document.querySelector("[data-menu-flood]");
  var stillEl = document.querySelector("[data-menu-still]");
  if (floodEl) renderMenu(floodEl, M.flood);
  if (stillEl) renderMenu(stillEl, M.still);

  // Tonight's service first in reading order? No — keep Flood/Still fixed,
  // the border and tag carry it. But say it plainly up top:
  var toneEl = document.querySelector("[data-menu-tonight-line]");
  if (toneEl) {
    toneEl.textContent = "Tonight: " + t.phase + ", " +
      (t.regime === "spring" ? "spring tides — the Flood menu is served." :
        "neap tides — the Still menu is served.");
  }

  /* ---------- supplements & pairings ---------- */
  function renderAside(sel, rows) {
    var el = document.querySelector(sel);
    if (!el) return;
    var html = "";
    for (var i = 0; i < rows.length; i++) {
      html += '<li><span>' + esc(rows[i].n) + '</span><span class="dots" aria-hidden="true"></span>' +
              '<span class="price">' + rows[i].price + "</span></li>";
    }
    el.innerHTML = html;
  }
  renderAside("[data-supplements]", window.NEAP_SUPPLEMENTS || []);
  renderAside("[data-pairings]", window.NEAP_PAIRINGS || []);

  /* ---------- tide calendar ---------- */
  var calEl = document.querySelector("[data-cal]");
  if (calEl) {
    var days = T.calendar(28);
    var html = "";
    for (var i = 0; i < days.length; i++) {
      var d = days[i];
      var cls = "cal-day " + d.regime + (d.today ? " today" : "");
      var label = d.month + " " + d.day + ": " +
        (d.regime === "spring" ? "spring tides, Flood menu" : "neap tides, Still menu") +
        (d.syzygy ? ", " + d.syzygy + " moon" : "");
      html += '<div class="' + cls + '" role="img" aria-label="' + esc(label) + '">' +
        (d.syzygy ? '<span class="syz" aria-hidden="true">' + (d.syzygy === "full" ? "F" : "N") + "</span>" : "") +
        '<svg class="m" viewBox="0 0 100 100" aria-hidden="true">' + T.moonMarkup(d.illumination, d.waxing) + "</svg>" +
        '<span class="d" aria-hidden="true">' + d.day + "</span></div>";
    }
    calEl.innerHTML = html;

    var calNote = document.querySelector("[data-cal-note]");
    if (calNote) {
      var springs = 0;
      for (var j = 0; j < days.length; j++) if (days[j].regime === "spring") springs++;
      calNote.textContent = "Of the next " + days.length + " nights, the sea moves on " +
        springs + " and rests on " + (days.length - springs) + ".";
    }
  }

  if (window.NEAP_UI) window.NEAP_UI.rescanReveals();
})();

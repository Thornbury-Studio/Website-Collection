/* NEAP — home page: tonight's panel and every count the copy quotes. */
(function () {
  "use strict";

  var T = window.NEAP_TIDE, M = window.NEAP_MENUS;
  if (!T || !M) return;

  var t = T.tonight();
  var menu = M[t.menu];
  var other = M[t.menu === "flood" ? "still" : "flood"];

  function put(sel, text) {
    var els = document.querySelectorAll(sel);
    for (var i = 0; i < els.length; i++) els[i].textContent = text;
  }

  // "Tonight the moon is a waxing gibbous, eleven nights old…"
  var article = /^[aeiou]/.test(t.phase) ? "an" : "a";
  var agePart = t.nights === 0 ? "the first night of its month"
    : t.nights === 1 ? "one night old"
    : t.nightsWord + " nights old";
  var line = t.phase === "new moon" || t.phase === "full moon"
    ? "Tonight the moon is " + t.phase.replace(" moon", "") + " — " + agePart + "."
    : "Tonight the moon is " + article + " " + t.phase + ", " + agePart + ".";
  put("[data-tonight-moon]", line);

  var running = t.regime === "spring"
    ? "Spring tides are running — the sea moves, and the Flood menu is served."
    : "Neap tides are running — the water barely breathes, and the Still menu is served.";
  put("[data-tonight-menu]", running);

  put("[data-tonight-count]", menu.courses.length + " courses · " + menu.price);

  // Manifesto counts, computed from the catalogue.
  put("[data-count-flood]", String(M.flood.courses.length));
  put("[data-count-still]", String(M.still.courses.length));
  put("[data-count-seats]", String(window.NEAP_HOUSE.seats));

  // Three courses from tonight's menu as a teaser.
  var teaser = document.querySelector("[data-teaser]");
  if (teaser) {
    var picks = [menu.courses[0], menu.courses[2], menu.courses[menu.courses.length - 1]];
    var html = "";
    for (var i = 0; i < picks.length; i++) {
      html += '<li class="reveal d' + (i + 1) + '">' +
        '<p class="t-course">' + picks[i].n + "</p>" +
        '<p class="course-note">' + picks[i].d + "</p></li>";
    }
    teaser.innerHTML = html;
    put("[data-teaser-from]", "from tonight's " + menu.name + " menu");
    if (window.NEAP_UI) window.NEAP_UI.rescanReveals();
  }

  // The other service, one line.
  put("[data-other-menu]", "The " + other.name + " menu, " + other.courses.length +
    " courses, returns with the " + (other.key === "flood" ? "spring" : "neap") + " tide.");
})();

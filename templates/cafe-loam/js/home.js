/* LOAM — home. The counter's three picks, plus every count the copy quotes. */
(function () {
  "use strict";

  var C = window.LOAM, S = window.LOAM_SERVICE, T = window.LOAM_TRAY;
  if (!C || !S || !T) return;

  var service = S.state();

  function put(sel, text) {
    var els = document.querySelectorAll(sel);
    for (var i = 0; i < els.length; i++) els[i].textContent = text;
  }

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  // Counts, computed — never typed into the copy.
  put("[data-count-drinks]", String(C.inGroup("coffee").length + C.inGroup("other").length));
  put("[data-count-all]", String(C.ITEMS.length));
  put("[data-count-bags]", String(C.BEANS.length));
  put("[data-count-seats]", String(C.HOUSE.seats));

  var cheapest = C.ITEMS.reduce(function (a, b) { return a.price <= b.price ? a : b; });
  put("[data-from-price]", C.money(cheapest.price));

  // Three from the counter: a coffee, something baked, something from the kitchen.
  var picks = [C.byId("flat-white"), C.byId("cardamom-bun"), C.byId("avocado-toast")].filter(Boolean);
  var strip = document.querySelector("[data-picks]");
  if (strip) {
    var html = "";
    for (var i = 0; i < picks.length; i++) {
      var item = picks[i];
      var available = S.isAvailable(item, service);
      html +=
        '<article class="card reveal d' + (i + 1) + '">' +
          '<div class="card-shot">' +
            '<img src="img/' + esc(item.img) + '-400.webp"' +
              ' srcset="img/' + esc(item.img) + '-400.webp 400w, img/' + esc(item.img) + '-800.webp 800w"' +
              ' sizes="(min-width: 560px) 32vw, 92vw"' +
              ' alt="' + esc(item.alt) + '" width="800" height="800" loading="lazy" decoding="async">' +
            (available ? "" : '<span class="off-flag">' + esc(S.unavailableReason(item, service)) + "</span>") +
          "</div>" +
          '<div class="card-body">' +
            '<h3 class="card-name">' + esc(item.name) + "</h3>" +
            '<p class="card-note">' + esc(item.note) + "</p>" +
            '<div class="card-foot"><span class="card-price nums">' + C.money(item.price) + "</span>" +
            '<a class="btn btn-quiet" href="menu.html">See the board</a></div>' +
          "</div>" +
        "</article>";
    }
    strip.innerHTML = html;
    if (window.LOAM_UI) window.LOAM_UI.rescanReveals();
  }

  // Today's hours line, in the house's voice.
  var todayLine = document.querySelector("[data-today-line]");
  if (todayLine && service.today) {
    todayLine.textContent = service.dayName + ", " + service.openAt + " to " + service.closeAt +
      " · kitchen " + service.kitchenFrom + " to " + service.kitchenUntil;
  }
})();

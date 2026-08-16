/* Professor Brawn — home page: prices pulled from the catalogue so copy can
   never drift from the menu, plus the specials board. */
(function () {
  "use strict";

  var D = window.PB_DATA, fmt = window.PB_FMT;
  if (!D) return;

  /* Look a dish up by name across every section (cheapest match wins). */
  function priceOf(name) {
    var best = null;
    D.sections.forEach(function (s) {
      s.items.forEach(function (it) {
        if (it.n === name) {
          [it.amk, it.tp].forEach(function (p) {
            if (typeof p === "number" && (best == null || p < best)) best = p;
          });
        }
      });
    });
    return best;
  }

  var chips = document.querySelectorAll("[data-price-of]");
  for (var i = 0; i < chips.length; i++) {
    var p = priceOf(chips[i].getAttribute("data-price-of"));
    if (p != null) chips[i].textContent = fmt(p) + "++";
    else chips[i].remove();
  }

  /* Specials board. */
  var grid = document.getElementById("specials-grid");
  if (grid) {
    D.specials.forEach(function (sp, idx) {
      var fig = document.createElement("figure");
      fig.className = "poster reveal" + (idx ? " d" + idx : "");
      var img = document.createElement("img");
      img.src = "img/" + sp.img + "-420.webp";
      img.srcset = "img/" + sp.img + "-420.webp 420w, img/" + sp.img + "-840.webp 840w";
      img.sizes = "(max-width: 700px) 92vw, 30vw";
      img.width = 420; img.height = 594;
      img.loading = "lazy";
      img.decoding = "async";
      img.alt = sp.alt;
      var cap = document.createElement("figcaption");
      var strongLine = sp.name + (typeof sp.price === "number" ? " — " + fmt(sp.price) + "++" : "");
      cap.appendChild(document.createTextNode(strongLine));
      var sub = document.createElement("span");
      sub.textContent = sp.blurb;
      cap.appendChild(sub);
      fig.appendChild(img);
      fig.appendChild(cap);
      grid.appendChild(fig);
    });
    if (window.PB_UI) window.PB_UI.rescanReveals();
  }
})();

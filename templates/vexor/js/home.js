/* home.js — featured lineup */
(function () {
  "use strict";
  document.addEventListener("DOMContentLoaded", function () {
    var root = document.querySelector("#featured");
    if (!root || !window.VEXOR) return;
    var featured = VEXOR.MODELS.filter(function (m) { return m.featured; }).slice(0, 3);
    if (featured.length < 3) {
      featured = VEXOR.MODELS.slice(0, 3);
    }
    root.innerHTML = featured.map(function (m) {
      return (
        '<a class="bike-card reveal" href="model.html?id=' + m.id + '">' +
          '<figure><img src="' + m.heroImg + '" alt="' + m.alt + '" width="800" height="500" loading="lazy"></figure>' +
          '<div class="body">' +
            '<div class="label">' + m.class + "</div>" +
            '<div class="name">' + m.name + "</div>" +
            '<p class="muted">' + m.line + "</p>" +
            '<div class="meta"><span>' + VEXOR.formatSGD(m.priceSGD) + "</span><span>" + m.powerKw + " kW</span></div>" +
          "</div>" +
        "</a>"
      );
    }).join("");
    if (window.VexorUI) {
      /* re-run reveals for injected nodes */
      root.querySelectorAll(".reveal").forEach(function (n) { n.classList.add("in"); });
    }
  });
})();

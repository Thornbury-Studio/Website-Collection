/* NIGHTSHIFT — the Floor. Machine plates rendered from the catalogue,
   filtered by zone. */
(function () {
  "use strict";

  var doc = document;
  var NS = window.NS;
  if (!NS) return;

  var grid = doc.getElementById("machine-grid");
  var zone = "all";

  function render() {
    if (!grid) return;
    grid.textContent = "";
    var frag = doc.createDocumentFragment();

    NS.machines.forEach(function (m) {
      if (zone !== "all" && m.zone !== zone) return;
      var z = NS.zoneById(m.zone);

      var card = doc.createElement("article");
      card.className = "plate reveal" + (m.sig ? " sigplate" : "");

      var s1 = doc.createElement("span"); s1.className = "screw1";
      var s2 = doc.createElement("span"); s2.className = "screw2";
      card.appendChild(s1); card.appendChild(s2);

      if (m.sig) {
        var tag = doc.createElement("span");
        tag.className = "tag";
        tag.textContent = "Signature";
        card.appendChild(tag);
      }

      var h = doc.createElement("h3");
      h.textContent = m.name;
      card.appendChild(h);

      var meta = doc.createElement("span");
      meta.className = "pmeta";
      var model = doc.createElement("span");
      model.className = "pmodel";
      model.textContent = m.model;
      meta.appendChild(model);
      var zn = doc.createElement("span");
      zn.textContent = z ? z.name : "";
      meta.appendChild(zn);
      var pl = doc.createElement("span");
      pl.textContent = m.players + (m.players === "—" ? "" : " players");
      meta.appendChild(pl);
      card.appendChild(meta);

      var p = doc.createElement("p");
      p.textContent = m.copy;
      card.appendChild(p);

      var sv = doc.createElement("p");
      sv.className = "service";
      sv.textContent = "Service: " + m.service;
      card.appendChild(sv);

      frag.appendChild(card);
    });

    grid.appendChild(frag);
    if (window.rescanReveals) window.rescanReveals();
  }

  doc.querySelectorAll(".fbtn[data-z]").forEach(function (b) {
    b.addEventListener("click", function () {
      zone = b.getAttribute("data-z");
      doc.querySelectorAll(".fbtn[data-z]").forEach(function (x) {
        x.setAttribute("aria-pressed", x === b ? "true" : "false");
      });
      render();
    });
  });

  render();
})();

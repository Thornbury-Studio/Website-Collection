/* WONDERYARD — map page. District list from the catalogue, two-way
   selection between SVG and list, day/night sky toggle. */
(function () {
  "use strict";

  var doc = document;
  var WY = window.WY;
  if (!WY) return;

  var box = doc.getElementById("mapbox");
  var list = doc.getElementById("maplist");
  var mapWorlds = ["yard", "tilt", "soak", "sideways", "giants"];

  /* ---------------- build the list ---------------- */
  var items = {};
  if (list) {
    WY.worlds.forEach(function (w) {
      if (mapWorlds.indexOf(w.id) < 0 && w.id !== "afterdark") return;
      var count = WY.attractions.filter(function (a) { return a.world === w.id; }).length;

      var b = doc.createElement("button");
      b.type = "button";
      b.className = "mitem w-" + w.id + " reveal";
      b.setAttribute("data-w", w.id);

      var h = doc.createElement("h3");
      var dot = doc.createElement("i");
      h.appendChild(dot);
      h.appendChild(doc.createTextNode(w.name));
      var p = doc.createElement("p");
      p.textContent = w.kicker + " — " + w.blurb.split(". ")[0] + ".";
      var c = doc.createElement("span");
      c.className = "mcount";
      c.textContent = (w.id === "afterdark")
        ? count + " after-dark experiences · everywhere, later"
        : count + " attractions";

      b.appendChild(h);
      b.appendChild(p);
      b.appendChild(c);
      list.appendChild(b);
      items[w.id] = b;
    });
    if (window.rescanReveals) window.rescanReveals();
  }

  /* ---------------- selection sync ---------------- */
  function select(id) {
    doc.querySelectorAll(".dist").forEach(function (g) {
      g.classList.toggle("sel", g.getAttribute("data-w") === id);
    });
    Object.keys(items).forEach(function (k) {
      items[k].classList.toggle("sel", k === id);
    });
    /* afterdark has no blob — selecting it flips the sky instead */
    if (id === "afterdark") setNight(true);
  }

  doc.querySelectorAll(".dist").forEach(function (g) {
    var id = g.getAttribute("data-w");
    g.addEventListener("click", function () { select(id); });
    g.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        select(id);
      }
    });
  });
  Object.keys(items).forEach(function (id) {
    items[id].addEventListener("click", function () { select(id); });
  });

  /* ---------------- sky toggle ---------------- */
  var tog = doc.getElementById("sky-toggle");
  function setNight(on) {
    if (!box) return;
    box.classList.toggle("nightmode", on);
    if (tog) {
      tog.setAttribute("aria-pressed", on ? "true" : "false");
      tog.innerHTML = on ? "&#9728; Back to daylight" : "&#9789; See it at night";
    }
  }
  if (tog) {
    tog.addEventListener("click", function () {
      setNight(!box.classList.contains("nightmode"));
    });
  }
})();

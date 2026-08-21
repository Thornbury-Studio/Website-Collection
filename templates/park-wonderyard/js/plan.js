/* WONDERYARD — plan page. Ticket cards and hours rendered from the
   catalogue so printed numbers can never drift from the data. */
(function () {
  "use strict";

  var doc = document;
  var WY = window.WY;
  if (!WY) return;

  /* ---------------- tickets ---------------- */
  var wrap = doc.getElementById("tix-cards");
  if (wrap) {
    var frag = doc.createDocumentFragment();

    function card(name, price, sub, note, delay) {
      var c = doc.createElement("div");
      c.className = "tcard reveal" + (delay ? " d" + delay : "");
      var h = doc.createElement("h3");
      h.textContent = name;
      var p = doc.createElement("span");
      p.className = "price";
      p.textContent = "$" + price;
      var s = doc.createElement("span");
      s.className = "sub";
      s.textContent = sub;
      var n = doc.createElement("p");
      n.textContent = note;
      c.appendChild(h); c.appendChild(p); c.appendChild(s); c.appendChild(n);
      return c;
    }

    WY.tickets.forEach(function (t, i) {
      frag.appendChild(card(t.name, t.price, "kids $" + t.kids, t.note, i % 3));
    });

    /* family bundle — arithmetic from the catalogue */
    var day = null;
    for (var j = 0; j < WY.tickets.length; j++) if (WY.tickets[j].id === "day") day = WY.tickets[j];
    if (day) {
      var fb = WY.familyBundle;
      var full = day.price * fb.adults + day.kids * fb.kids;
      frag.appendChild(card(
        "Family Day",
        full - fb.off,
        fb.adults + " adults + " + fb.kids + " kids · save $" + fb.off,
        "The Full Day for " + (fb.adults + fb.kids) + ", minus the arithmetic argument at the gate.",
        0
      ));
    }
    wrap.appendChild(frag);
    if (window.rescanReveals) window.rescanReveals();
  }

  /* ---------------- hours ---------------- */
  var hrs = doc.getElementById("hrs-list");
  if (hrs) {
    function two(n) { return ("0" + n).slice(-2) + ":00"; }
    var rows = [
      ["Gates open", two(WY.hours.open)],
      ["Afterdark ticket valid from", two(WY.hours.afterdarkFrom)],
      ["Night Market opens", "18:00"],
      ["The Last Firework", WY.hours.firework],
      ["Park closes", two(WY.hours.close)]
    ];
    rows.forEach(function (r, i) {
      var d = doc.createElement("div");
      var k = doc.createElement("span");
      k.textContent = r[0];
      var v = doc.createElement("span");
      v.textContent = r[1];
      if (r[0] === "The Last Firework") v.className = "hl";
      d.appendChild(k); d.appendChild(v);
      hrs.appendChild(d);
    });
  }
})();

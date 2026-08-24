/* NIGHTSHIFT — visit page. Top-ups, hours and rooms facts from the
   catalogue; the hours table's last row is the quiet door to ops. */
(function () {
  "use strict";

  var doc = document;
  var NS = window.NS;
  if (!NS) return;

  /* ---------------- top-ups ---------------- */
  var twrap = doc.getElementById("topup-cards");
  if (twrap) {
    NS.topups.forEach(function (t, i) {
      var v = NS.topupView(t);
      var c = doc.createElement("div");
      c.className = "tcard reveal" + (i ? " d" + i : "");
      var pay = doc.createElement("span");
      pay.className = "pay";
      pay.textContent = "$" + v.pay;
      var cr = doc.createElement("span");
      cr.className = "credits";
      cr.textContent = v.credits + " CREDITS";
      var b = doc.createElement("span");
      b.className = "bonus";
      b.textContent = v.bonusPct > 0 ? "+" + v.bonusPct + "% vs the $" + NS.topups[0].pay + " load" : "the starter load";
      var p = doc.createElement("p");
      p.textContent = "Roughly " + v.games + " games, depending on how brave you feel.";
      c.appendChild(pay); c.appendChild(cr); c.appendChild(b); c.appendChild(p);
      twrap.appendChild(c);
    });
  }

  /* ---------------- hours ---------------- */
  var hrs = doc.getElementById("hrs-list");
  if (hrs) {
    var rows = [
      ["Doors open", NS.hours.open, ""],
      ["Kitchen closes", NS.hours.kitchen, ""],
      ["Last race (GRID)", NS.hours.lastRace, ""],
      ["Close", NS.hours.close, "hl"]
    ];
    rows.forEach(function (r) {
      var d = doc.createElement("div");
      var k = doc.createElement("span");
      k.textContent = r[0];
      var v = doc.createElement("span");
      v.textContent = r[1];
      if (r[2]) v.className = r[2];
      d.appendChild(k); d.appendChild(v);
      hrs.appendChild(d);
    });
    /* the quiet door */
    var after = doc.createElement("div");
    after.className = "after";
    var k2 = doc.createElement("span");
    var a = doc.createElement("a");
    a.href = "ops.html";
    a.textContent = "After " + NS.hours.close + " — the building stays on";
    k2.appendChild(a);
    var v2 = doc.createElement("span");
    v2.textContent = "—";
    after.appendChild(k2); after.appendChild(v2);
    hrs.appendChild(after);
  }

  /* ---------------- rooms facts ---------------- */
  var rf = doc.getElementById("rooms-facts");
  if (rf) {
    var facts = [
      ["Rate", "$" + NS.rooms.perHour + " / hour"],
      ["Capacity", "up to " + NS.rooms.capacity],
      ["Minimum", NS.rooms.minHours + " hours"],
      ["Includes", "host + pass credits for the room"]
    ];
    facts.forEach(function (r) {
      var d = doc.createElement("div");
      var k = doc.createElement("span");
      k.textContent = r[0];
      var v = doc.createElement("span");
      v.textContent = r[1];
      d.appendChild(k); d.appendChild(v);
      rf.appendChild(d);
    });
  }

  if (window.rescanReveals) window.rescanReveals();
})();

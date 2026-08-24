/* NS/OPS — facility view. Cameras, event log, zone power and lost property
   from the catalogue. The portal runs on the building's night clock: it
   boots at 02:47:13 and ticks live. Camera clocks drift a little, because
   real ones do. */
(function () {
  "use strict";

  var doc = document;
  var NS = window.NS;
  if (!NS) return;

  /* ---------------- the night clock ---------------- */
  var BOOT = { h: 2, m: 47, s: 13 };
  var t0 = Date.now();

  function nightTime(offsetSeconds) {
    var elapsed = Math.floor((Date.now() - t0) / 1000) + (offsetSeconds || 0);
    var total = BOOT.h * 3600 + BOOT.m * 60 + BOOT.s + elapsed;
    var h = Math.floor(total / 3600) % 24;
    var m = Math.floor((total % 3600) / 60);
    var s = total % 60;
    return ("0" + h).slice(-2) + ":" + ("0" + m).slice(-2) + ":" + ("0" + s).slice(-2);
  }

  var headClock = doc.getElementById("ops-clock");

  /* ---------------- cameras ---------------- */
  var grid = doc.getElementById("cam-grid");
  var camTimes = [];
  if (grid) {
    NS.cams.forEach(function (c, i) {
      var tile = doc.createElement("figure");
      tile.className = "cam reveal" + (c.status === "nosignal" ? " nosignal" : "");

      var label = doc.createElement("figcaption");
      label.className = "camlabel";
      label.textContent = c.cam + " · " + c.area;
      tile.appendChild(label);

      if (c.status === "nosignal") {
        var msg = doc.createElement("div");
        msg.className = "ns-msg";
        var b = doc.createElement("b");
        b.textContent = "NO SIGNAL";
        msg.appendChild(b);
        msg.appendChild(doc.createTextNode("last frame 02:13:41 · ticket #4471"));
        tile.appendChild(msg);
      } else {
        var img = doc.createElement("img");
        img.src = "img/" + c.img + "-after-700.webp";
        img.srcset = "img/" + c.img + "-after-700.webp 700w, img/" + c.img + "-after-1200.webp 1200w";
        img.sizes = "(max-width: 760px) 92vw, 32vw";
        img.width = 1200; img.height = 670;
        img.loading = i > 1 ? "lazy" : "eager";
        img.decoding = "async";
        img.alt = "Camera view: " + c.area.toLowerCase() + ", empty.";
        tile.appendChild(img);

        var time = doc.createElement("span");
        time.className = "camtime";
        /* small fixed per-camera drift — real installs never agree */
        var drift = (i * 7) % 5 - 2;
        camTimes.push({ el: time, drift: drift });
        time.textContent = "";
        tile.appendChild(time);

        if (c.note) {
          var note = doc.createElement("span");
          note.className = "camnote";
          note.textContent = "▲ " + c.note;
          tile.appendChild(note);
        }
      }
      grid.appendChild(tile);
    });
  }

  function tickClocks() {
    if (headClock) headClock.textContent = nightTime(0) + " · SITE TIME";
    camTimes.forEach(function (c) {
      c.el.textContent = "● " + nightTime(c.drift);
    });
  }
  tickClocks();
  setInterval(tickClocks, 1000);

  /* ---------------- event log ---------------- */
  var log = doc.getElementById("ops-log");
  if (log) {
    NS.opsLog.forEach(function (e) {
      var row = doc.createElement("div");
      if (e.flag) row.className = "flag";
      var t = doc.createElement("span");
      t.className = "lt";
      t.textContent = e.t;
      var x = doc.createElement("span");
      x.className = "lx";
      x.textContent = e.text;
      row.appendChild(t); row.appendChild(x);
      log.appendChild(row);
    });
  }

  /* ---------------- zone power ---------------- */
  var pw = doc.getElementById("ops-power");
  if (pw) {
    var states = [
      ["GRID", "STANDBY · 1 pod active", "warn"],
      ["VOLT", "STANDBY · attract active", "warn"],
      ["ARENA", "STANDBY", "ok"],
      ["VAULT", "CASE LIGHTING ON", "warn"],
      ["SIDEQUEST", "CAM FAULT · #4471", "warn"],
      ["TABLE", "OFF", "ok"],
      ["HVAC", "NIGHT CYCLE", "ok"]
    ];
    states.forEach(function (s) {
      var d = doc.createElement("div");
      var k = doc.createElement("span");
      k.className = "sk";
      k.textContent = s[0];
      var v = doc.createElement("span");
      v.className = "sv " + s[2];
      v.textContent = s[1];
      d.appendChild(k); d.appendChild(v);
      pw.appendChild(d);
    });
  }

  /* ---------------- lost property ---------------- */
  var lp = doc.getElementById("ops-lost");
  if (lp) {
    NS.lostProperty.forEach(function (item) {
      var li = doc.createElement("li");
      li.textContent = item;
      lp.appendChild(li);
    });
  }

  if (window.rescanReveals) window.rescanReveals();
})();

/* FATHOM — the survey desk: hero plate demo, expedition status, display
   shelf, recent finds, milestones. Everything derived from the archive +
   the log; nothing typed. */
(function () {
  "use strict";

  var F = window.FATHOM, LOG = window.FATHOM_LOG, UI = window.FATHOM_UI;
  if (!F || !UI) return;

  /* hero plate: show the collection's most desirable owned plate, else the
     Aurelume Full Plate as the aspiration piece */
  var hero = document.getElementById("hero-plate");
  if (hero) {
    var best = null;
    F.plates.forEach(function (p) {
      if (LOG.has(p.n)) {
        if (!best || F.rarities[p.rar].tier > F.rarities[best.rar].tier) best = p;
      }
    });
    var show = best && F.rarities[best.rar].tier >= 3 ? best : F.byId("fp-aurelume");
    hero.innerHTML = UI.plateHtml(show, "md", { eager: true });
    UI.attachTilt(hero);
  }

  function render() {
    var s = LOG.stats();

    /* status card */
    var pct = document.getElementById("stat-pct");
    if (pct) {
      pct.innerHTML =
        '<div class="gauge-row"><span class="label">' + F.set.name + '</span><b>' + s.owned + " / " + s.total + "</b></div>" +
        '<div class="gauge-bar"><div class="gauge-fill" style="width:' + s.pct + '%"></div></div>' +
        '<span class="muted">' + (s.owned === 0
          ? "No plates logged yet. The first trawl is waiting."
          : s.pct === 100
            ? "The Long Dark, complete. The Survey salutes you."
            : (s.total - s.owned) + " plates still down there" + (s.dupes ? " · " + s.dupes + " duplicate" + (s.dupes > 1 ? "s" : "") + " held" : "")) + "</span>";
    }

    /* rarity distribution */
    var dist = document.getElementById("stat-rar");
    if (dist) {
      var html = "";
      Object.keys(F.rarities).forEach(function (k) {
        var r = s.byRar[k];
        if (!r) return;
        html += '<div class="gauge-row"><span class="label">' + F.rarities[k].name + "</span><span class=\"muted\">" + r.owned + " / " + r.total + "</span></div>";
      });
      dist.innerHTML = html;
    }

    /* shelf (pins) */
    var shelf = document.getElementById("shelf");
    if (shelf) {
      var pins = LOG.pins(), out = "";
      for (var i = 0; i < 4; i++) {
        if (pins[i]) out += UI.plateHtml(F.byN(pins[i]), "sm");
        else out += '<div class="shelf-slot">Empty<br>slot</div>';
      }
      shelf.innerHTML = out;
      UI.attachTilt(shelf);
    }

    /* recent finds */
    var rec = document.getElementById("recent");
    var recWrap = document.getElementById("recent-wrap");
    if (rec) {
      var fresh = LOG.recent(4);
      if (recWrap) recWrap.hidden = fresh.length === 0;
      rec.innerHTML = fresh.map(function (n) { return UI.plateHtml(F.byN(n), "sm"); }).join("");
      UI.attachTilt(rec);
    }

    /* milestones */
    var ms = document.getElementById("milestones");
    if (ms) {
      var drift = s.byRar.drift || { owned: 0, total: 1 };
      var fields = F.plates.filter(function (p) { return p.kind === "field"; });
      var fieldsOwned = fields.filter(function (p) { return LOG.has(p.n); }).length;
      var items = [
        { name: "First Light", note: "log your first plate", done: s.owned >= 1 },
        { name: "Ten Fathoms", note: "log ten plates", done: s.owned >= 10 },
        { name: "The Field Survey", note: "log all four Field plates", done: fieldsOwned === fields.length },
        { name: "Full Drift", note: "log every Drift plate", done: drift.owned === drift.total },
        { name: "The Long Dark", note: "complete Descent I", done: s.owned === s.total }
      ];
      ms.innerHTML = items.map(function (m) {
        return '<div class="stamp' + (m.done ? " earned" : "") + '"><span class="seal">' + (m.done ? "✦" : "·") + "</span><span><b>" + m.name + "</b> — " + m.note + "</span></div>";
      }).join("");
    }
  }

  render();
  document.addEventListener("fathom:change", render);
})();

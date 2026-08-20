/* FATHOM — the collector's log. localStorage-backed store: owned counts,
   pinned plates, new-flags, trawl history, sound preference. Emits
   "fathom:change" on every mutation so pages stay in sync. */
(function () {
  "use strict";

  var KEY = "fathom-log-v1";
  var state = load();

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var s = JSON.parse(raw);
        if (s && typeof s === "object") {
          return {
            owned: s.owned || {},
            pins: Array.isArray(s.pins) ? s.pins : [],
            fresh: s.fresh || {},
            trawls: s.trawls || 0,
            sound: !!s.sound,
            seed: s.seed || Math.floor(Math.random() * 1e9)
          };
        }
      }
    } catch (e) { /* fresh log */ }
    return { owned: {}, pins: [], fresh: {}, trawls: 0, sound: false, seed: Math.floor(Math.random() * 1e9) };
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* private mode: session-only */ }
    document.dispatchEvent(new CustomEvent("fathom:change"));
  }

  function count(n) { return state.owned[n] || 0; }

  var LOG = {
    count: count,
    has: function (n) { return count(n) > 0; },
    add: function (n) {
      state.owned[n] = count(n) + 1;
      state.fresh[n] = true;
      save();
    },
    clearFresh: function (n) {
      if (state.fresh[n]) { delete state.fresh[n]; save(); }
    },
    isFresh: function (n) { return !!state.fresh[n]; },
    pin: function (n) {
      var i = state.pins.indexOf(n);
      if (i >= 0) state.pins.splice(i, 1);
      else {
        state.pins.unshift(n);
        if (state.pins.length > 4) state.pins.length = 4; /* four brass slots on the shelf */
      }
      save();
    },
    isPinned: function (n) { return state.pins.indexOf(n) >= 0; },
    pins: function () { return state.pins.slice(); },
    trawlDone: function () { state.trawls += 1; save(); },
    trawls: function () { return state.trawls; },
    sound: function (v) {
      if (v === undefined) return state.sound;
      state.sound = !!v; save(); return state.sound;
    },
    /* derived */
    stats: function () {
      var F = window.FATHOM, ownedUnique = 0, total = F.plates.length, dupes = 0;
      var byRar = {};
      F.plates.forEach(function (p) {
        byRar[p.rar] = byRar[p.rar] || { total: 0, owned: 0 };
        byRar[p.rar].total += 1;
        var c = count(p.n);
        if (c > 0) { ownedUnique += 1; byRar[p.rar].owned += 1; dupes += c - 1; }
      });
      return { owned: ownedUnique, total: total, pct: total ? Math.round((ownedUnique / total) * 100) : 0, dupes: dupes, byRar: byRar };
    },
    missing: function () {
      return window.FATHOM.plates.filter(function (p) { return count(p.n) === 0; });
    },
    recent: function (k) {
      var fresh = Object.keys(state.fresh).map(Number).sort(function (a, b) { return b - a; });
      return fresh.slice(0, k || 4);
    }
  };

  window.FATHOM_LOG = LOG;
})();

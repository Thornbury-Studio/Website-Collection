/* SEJUK chit — order state. Pure state + arithmetic; rendering lives in ui.js.
   Persisted to localStorage, revalidated on load, announced via CustomEvent. */
(function () {
  "use strict";

  var KEY = "sejuk.chit.v1";
  var cat = window.SEJUK.cat;

  var state = { lines: [], note: "" };

  function lineKey(l) {
    return l.id + "|" + (l.size || "") + "|" + (l.addons || []).slice().sort().join(",");
  }

  function sanitize(raw) {
    var out = { lines: [], note: "" };
    if (!raw || typeof raw !== "object") return out;
    if (typeof raw.note === "string") out.note = raw.note.slice(0, 200);
    var lines = Array.isArray(raw.lines) ? raw.lines : [];
    lines.forEach(function (l) {
      if (!l || !cat.byId(l.id)) return; /* dropped from the menu */
      var kind = cat.kindOf(l.id);
      var line = {
        id: l.id,
        qty: Math.max(1, Math.min(9, Math.round(Number(l.qty) || 1))),
        size: kind === "ice" ? (l.size === "berdua" ? "berdua" : "solo") : null,
        addons: [],
      };
      if (kind === "ice" && Array.isArray(l.addons)) {
        line.addons = l.addons.filter(function (a) { return !!cat.addonById(a); }).slice(0, 6);
      }
      out.lines.push(line);
    });
    return out;
  }

  function load() {
    try {
      state = sanitize(JSON.parse(localStorage.getItem(KEY)));
    } catch (e) {
      state = { lines: [], note: "" };
    }
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) { /* private mode: chit lives for the page only */ }
    document.dispatchEvent(new CustomEvent("sejuk:chit"));
  }

  function add(id, opts) {
    var item = cat.byId(id);
    if (!item) return false;
    var kind = cat.kindOf(id);
    var line = {
      id: id,
      qty: 1,
      size: kind === "ice" ? ((opts && opts.size) === "berdua" ? "berdua" : "solo") : null,
      addons: kind === "ice" && opts && Array.isArray(opts.addons) ? opts.addons.filter(function (a) { return !!cat.addonById(a); }) : [],
    };
    var key = lineKey(line);
    var existing = null;
    state.lines.forEach(function (l) { if (lineKey(l) === key) existing = l; });
    if (existing) existing.qty = Math.min(9, existing.qty + 1);
    else state.lines.push(line);
    save();
    return true;
  }

  function setQty(index, qty) {
    var l = state.lines[index];
    if (!l) return;
    qty = Math.round(qty);
    if (qty <= 0) state.lines.splice(index, 1);
    else l.qty = Math.min(9, qty);
    save();
  }

  function setNote(text) {
    state.note = String(text || "").slice(0, 200);
    save();
  }

  function clear() {
    state = { lines: [], note: "" };
    save();
  }

  function count() {
    return state.lines.reduce(function (n, l) { return n + l.qty; }, 0);
  }

  function total() {
    return state.lines.reduce(function (n, l) { return n + cat.linePrice(l); }, 0);
  }

  function readyIn() {
    return cat.readyInMin(state.lines);
  }

  function has(id) {
    return state.lines.some(function (l) { return l.id === id; });
  }

  load();

  window.SEJUK.chit = {
    lines: function () { return state.lines; },
    note: function () { return state.note; },
    add: add,
    setQty: setQty,
    setNote: setNote,
    clear: clear,
    count: count,
    total: total,
    readyIn: readyIn,
    has: has,
  };
})();

/* Inner-page art weather. Set is locked; Dev switcher is gone. */

export var ARTS = [
  { id: "set", name: "Set" },
  { id: "plate", name: "Plate" },
  { id: "grain", name: "Grain" },
  { id: "edge", name: "Edge" },
  { id: "folio", name: "Folio" }
];

var KEY = "tb-v4-art";
var IDS = ARTS.map(function (a) { return a.id; });

export function readArt() {
  try {
    var saved = localStorage.getItem(KEY);
    if (saved && IDS.indexOf(saved) !== -1) return saved;
  } catch (err) {}
  return "set";
}

export function writeArt(id) {
  try { localStorage.setItem(KEY, id); } catch (err) {}
}

export function bindArt(opts) {
  opts = opts || {};
  var html = document.documentElement;
  var reduced = !!opts.reduced;
  var film = document.getElementById("artFilm");
  var current = "set";
  var hold = false;

  function setVars(x, y, s) {
    html.style.setProperty("--art-x", x.toFixed(3));
    html.style.setProperty("--art-y", y.toFixed(3));
    html.style.setProperty("--art-s", s.toFixed(3));
  }

  function scrollP() {
    var max = document.documentElement.scrollHeight - innerHeight;
    return max > 1 ? Math.min(1, Math.max(0, scrollY / max)) : 0.28;
  }

  function onPointer(e) {
    if (reduced) return;
    setVars(e.clientX / Math.max(1, innerWidth), e.clientY / Math.max(1, innerHeight), scrollP());
  }

  function onScroll() {
    if (reduced) return;
    html.style.setProperty("--art-s", scrollP().toFixed(3));
  }

  window.addEventListener("pointermove", onPointer, { passive: true });
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  function setFilm(on) {
    if (!film) return;
    if (on && !reduced && !hold) {
      film.preload = "metadata";
      var play = film.play();
      if (play && play.catch) play.catch(function () {});
    } else {
      film.pause();
    }
  }

  function apply(id) {
    if (IDS.indexOf(id) === -1) id = "set";
    current = id;
    html.dataset.art = id;
    writeArt(id);
    document.querySelectorAll(".dev-menu [data-art]").forEach(function (btn) {
      btn.setAttribute("aria-pressed", btn.dataset.art === id ? "true" : "false");
    });
    setFilm(id === "plate");
    document.querySelectorAll("details.dev").forEach(function (el) {
      el.open = false;
    });
  }

  document.querySelectorAll(".dev-menu [data-art]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      apply(btn.dataset.art);
    });
  });

  document.querySelectorAll("details.dev").forEach(function (el) {
    el.addEventListener("toggle", function () {
      if (!el.open) return;
      document.querySelectorAll("details.dev").forEach(function (other) {
        if (other !== el) other.open = false;
      });
    });
  });

  document.addEventListener("pointerdown", function (e) {
    document.querySelectorAll("details.dev[open]").forEach(function (el) {
      if (!el.contains(e.target)) el.open = false;
    });
  });

  apply(html.dataset.art || readArt());

  return {
    apply: apply,
    setPlaying: function (on) {
      hold = !on;
      setFilm(current === "plate");
    }
  };
}

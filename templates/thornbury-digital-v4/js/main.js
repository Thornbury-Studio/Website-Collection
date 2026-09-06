import { startField } from "./field.js";
import { mountPieces, bindRail } from "./work.js";
import { bindArt } from "./art.js";
import { bindDrift } from "./drift.js";

const html = document.documentElement;
const page = html.dataset.page || "home";
const reduced = html.classList.contains("rm");
const stage = document.getElementById("field");
const inner = page === "work" || page === "studio" || page === "contact";

function fold() {
  if (window.__tbFold) window.__tbFold();
}

var field = null;
var art = null;
try {
  if (stage && page === "home") {
    field = startField(stage, {
      mode: stage.dataset.mode || "side",
      reduced: reduced,
      still: reduced
    });
  }
  window.TB_READY = true;
  clearTimeout(window.__tbWatch);
} catch (err) {
  console.warn("[thornbury v4] field offline:", err && err.message);
  fold();
}

if (inner) {
  art = bindArt({ reduced: reduced });
}
if (page === "studio" && !reduced) {
  bindDrift(document.querySelector(".studio-doc"));
}

var films = [
  document.getElementById("stageFilm")
].filter(Boolean);
var filmHold = false;
var filmVisible = true;

function setFilms() {
  films.forEach(function (el) {
    if (!reduced && !filmHold && filmVisible) {
      var play = el.play();
      if (play && play.catch) play.catch(function () {});
    } else {
      el.pause();
    }
  });
}

if (films.length) {
  if (reduced) {
    films.forEach(function (el) {
      el.removeAttribute("autoplay");
      el.pause();
      el.preload = "none";
    });
  } else {
    var watch = document.querySelector(".hero") || document.querySelector(".studio-fig") || films[0];
    var io = new IntersectionObserver(function (entries) {
      filmVisible = !!(entries[0] && entries[0].isIntersecting);
      setFilms();
    }, { threshold: 0.12 });
    io.observe(watch);
    setFilms();
  }
}

var rail = document.getElementById("pieces");
mountPieces(rail, {
  home: page === "home",
  skip: page === "work" ? ["Null", "Sejuk"] : page === "home" ? ["Col Noir"] : []
});
bindRail(rail, {
  onHold: function () {
    filmHold = true;
    setFilms();
    if (field && field.pause) field.pause();
    if (art && art.setPlaying) art.setPlaying(false);
  },
  onRelease: function () {
    filmHold = false;
    setFilms();
    if (field && field.resume) field.resume();
    if (art && art.setPlaying) art.setPlaying(true);
  }
});

const form = document.getElementById("brief");
const note = document.getElementById("brief-note");
if (form) {
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!form.reportValidity()) return;
    var btn = form.querySelector("[type=submit]");
    if (btn) btn.disabled = true;
    form.hidden = true;
    if (note) {
      note.hidden = false;
      note.focus();
    }
  });
  form.querySelectorAll("input, textarea").forEach(function (el) {
    el.addEventListener("invalid", function () {
      el.setCustomValidity(el.validity.valueMissing ? "This field is needed." : "");
    });
    el.addEventListener("input", function () {
      el.setCustomValidity("");
    });
  });
}

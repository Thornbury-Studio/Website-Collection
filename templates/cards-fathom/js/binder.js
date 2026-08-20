/* FATHOM — the Log: binder spreads of nine slots, embossed silhouettes for
   missing plates, page-completion ring, swipe + arrow + button paging. */
(function () {
  "use strict";

  var F = window.FATHOM, LOG = window.FATHOM_LOG, UI = window.FATHOM_UI;
  if (!F || !UI) return;

  var pageEl = document.getElementById("binder-page");
  var gridEl = document.getElementById("binder-grid");
  if (!pageEl || !gridEl) return;

  var PER = 9;
  var pages = Math.ceil(F.plates.length / PER);
  var cur = 0;

  var prevBtn = document.getElementById("b-prev");
  var nextBtn = document.getElementById("b-next");
  var pageLbl = document.getElementById("b-label");
  var ringEl = document.getElementById("b-ring");
  var footLbl = document.getElementById("b-foot");

  function ring(pct) {
    var r = 30, c = 2 * Math.PI * r;
    return '<svg viewBox="0 0 74 74" role="img" aria-label="Page completion ' + pct + ' percent">' +
      '<circle class="track" cx="37" cy="37" r="' + r + '"/>' +
      '<circle class="fill" cx="37" cy="37" r="' + r + '" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + (c * (1 - pct / 100)).toFixed(1) + '"/>' +
      "</svg>";
  }

  function render(dir) {
    var start = cur * PER;
    var slice = F.plates.slice(start, start + PER);
    var owned = 0;
    gridEl.innerHTML = slice.map(function (p) {
      if (LOG.has(p.n)) {
        owned += 1;
        return '<div class="binder-slot">' + UI.plateHtml(p, "sm") + "</div>";
      }
      return '<div class="binder-slot"><button class="slot-empty" type="button" data-n="' + p.n + '" aria-label="Preview missing plate ' + F.pad(p.n) + '">' + (p.serial || F.pad(p.n)) + "</button></div>";
    }).join("");
    UI.attachTilt(gridEl);
    gridEl.querySelectorAll(".slot-empty").forEach(function (b) {
      b.addEventListener("click", function () { UI.inspect(Number(b.getAttribute("data-n"))); });
    });

    var pct = Math.round((owned / slice.length) * 100);
    if (ringEl) ringEl.innerHTML = ring(pct);
    if (pageLbl) pageLbl.textContent = "Spread " + (cur + 1) + " of " + pages;
    if (footLbl) footLbl.textContent = owned + " of " + slice.length + " plates mounted" + (pct === 100 ? " — spread complete" : "");
    if (prevBtn) prevBtn.disabled = cur === 0;
    if (nextBtn) nextBtn.disabled = cur === pages - 1;

    if (dir) {
      pageEl.classList.remove("turning-next", "turning-prev");
      void pageEl.offsetWidth;
      pageEl.classList.add(dir > 0 ? "turning-next" : "turning-prev");
      if (window.FATHOM_AUDIO) window.FATHOM_AUDIO.page();
    }
  }

  function go(d) {
    var n = Math.min(pages - 1, Math.max(0, cur + d));
    if (n === cur) return;
    cur = n;
    render(d);
  }

  if (prevBtn) prevBtn.addEventListener("click", function () { go(-1); });
  if (nextBtn) nextBtn.addEventListener("click", function () { go(1); });
  document.addEventListener("keydown", function (e) {
    if (document.querySelector(".inspector.open")) return;
    var tag = (document.activeElement && document.activeElement.tagName) || "";
    if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
    if (e.key === "ArrowLeft") go(-1);
    if (e.key === "ArrowRight") go(1);
  });

  /* swipe */
  var x0 = null;
  pageEl.addEventListener("pointerdown", function (e) { x0 = e.clientX; });
  pageEl.addEventListener("pointerup", function (e) {
    if (x0 === null) return;
    var dx = e.clientX - x0;
    x0 = null;
    if (Math.abs(dx) > 56) go(dx < 0 ? 1 : -1);
  });

  render(0);
  document.addEventListener("fathom:change", function () { render(0); });
})();

/* Thornbury Digital v4 — marks scripting, motion, pointer; folds if the
   field never reports ready. Does not touch the DOM beyond <html> classes. */
(function () {
  var d = document.documentElement;
  d.classList.add("js");
  if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) {
    d.classList.add("rm");
  }
  if (window.matchMedia && matchMedia("(hover: none) and (pointer: coarse)").matches) {
    d.classList.add("touch");
  }
  var page = d.getAttribute("data-page");
  if (page && page !== "home") {
    var art = "set";
    try {
      var saved = localStorage.getItem("tb-v4-art");
      if (saved && /^(set|plate|grain|edge|folio)$/.test(saved)) art = saved;
    } catch (err) {}
    d.setAttribute("data-art", art);
  }
  window.__tbFold = function () {
    d.classList.add("no-3d");
  };
  window.__tbWatch = setTimeout(function () {
    if (!window.TB_READY) window.__tbFold();
  }, 6000);
})();

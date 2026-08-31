/* TAPE//LACQUER — boot watchdog. Folds to static poster if WebGL never arrives. */
(function () {
  var d = document.documentElement;
  d.classList.add("js");
  if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) {
    d.classList.add("rm");
  }
  window.__tapeFold = function (why) {
    d.classList.add("no-3d");
    if (why && !d.dataset.glFail) d.dataset.glFail = why;
  };
  setTimeout(function () {
    if (!window.TAPE_READY) window.__tapeFold("timeout");
  }, 14000);
})();

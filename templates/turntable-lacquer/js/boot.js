/* LACQUER — boot watchdog. Folds to static hero if WebGL/module never arrives. */
(function () {
  var d = document.documentElement;
  d.classList.add("js");
  if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) {
    d.classList.add("rm");
  }
  window.__lacquerFold = function (why) {
    d.classList.add("no-3d");
    if (why && !d.dataset.glFail) d.dataset.glFail = why;
  };
  setTimeout(function () {
    if (!window.LACQUER_READY) window.__lacquerFold("timeout");
  }, 12000);
})();

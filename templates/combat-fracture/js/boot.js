/* FRACTURE — boot watchdog (classic script, runs before the module lands).
   Marks scripting on, then folds the page down to the static fight sheet if
   the 3D module never reports in — CDN failure, old browser, no WebGL2. */
(function () {
  var d = document.documentElement;
  d.classList.add('js');
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) {
    d.classList.add('rm');
  }
  window.__fxFold = function () {
    d.classList.add('no-3d');
    d.classList.remove('walk');
  };
  window.__fxWatch = setTimeout(function () {
    if (!window.FRACTURE_READY) window.__fxFold();
  }, 6000);
})();

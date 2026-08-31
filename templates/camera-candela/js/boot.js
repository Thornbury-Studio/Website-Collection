/* CANDELA — boot watchdog (classic script, runs before the module lands).
   Marks scripting on, then folds the stage back to the static product shot
   if the 3D module never reports in: blocked CDN, no WebGL2, old browser,
   or a GLB that failed to fetch. The page is fully readable either way. */
(function () {
  var d = document.documentElement;
  d.classList.add('js');
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) {
    d.classList.add('rm');
  }
  window.__candelaFold = function (why) {
    d.classList.add('no-3d');
    // the module records a specific cause the instant it knows one; the
    // watchdog must not relabel that as a generic timeout afterwards
    if (why && !d.dataset.glFail) d.dataset.glFail = why;
  };
  setTimeout(function () {
    if (!window.CANDELA_READY) window.__candelaFold('timeout');
  }, 8000);
})();

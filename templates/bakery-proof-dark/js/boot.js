/* Runs before first paint: sets the mode classes the stylesheet keys off. */
(function () {
  var r = document.documentElement;
  r.classList.add('js');
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) r.classList.add('rm');
  /* if the motion script has not started within 4 s (blocked, offline), fall back to the plain page */
  setTimeout(function () { if (!window.__proofReady) r.classList.add('rm'); }, 4000);
})();

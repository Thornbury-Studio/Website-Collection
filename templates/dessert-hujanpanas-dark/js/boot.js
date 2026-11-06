/* Runs before first paint: sets the mode classes the stylesheet keys off. */
(function () {
  var r = document.documentElement;
  r.classList.add('js');
  try { if (localStorage.getItem('hp-motion') === 'off') r.classList.add('still'); } catch (e) {}
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) r.classList.add('rm');
  /* if the page script has not started within 4 s (blocked, offline), show the plain page */
  setTimeout(function () { if (!window.__hpReady) r.classList.add('rm', 'nojs-ish'); }, 4000);
})();

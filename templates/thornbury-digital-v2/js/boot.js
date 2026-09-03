/* THORNBURY DIGITAL v2 — boot watchdog (classic script, runs before the
   module lands). Marks scripting on, reads motion + pointer preferences,
   decides whether the ignition intro plays, and folds the page down to its
   static fallback if the engine never reports in (CDN failure, old browser,
   no WebGL2). Nothing here touches the DOM beyond the <html> class list. */
(function () {
  var d = document.documentElement;
  d.classList.add('js');

  var rm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (rm) d.classList.add('rm');
  if (window.matchMedia && matchMedia('(hover: none) and (pointer: coarse)').matches) d.classList.add('touch');

  var seen = false;
  try { seen = sessionStorage.getItem('tb-intro') === '1'; } catch (e) { seen = true; }
  if (seen || rm) d.classList.add('intro-seen'); else d.classList.add('lock');

  window.__tbFold = function () {
    d.classList.add('no-3d');
    d.classList.add('k-safe');
    d.classList.remove('lock');
  };
  window.__tbWatch = setTimeout(function () {
    if (!window.TB_READY) window.__tbFold();
  }, 6000);
})();

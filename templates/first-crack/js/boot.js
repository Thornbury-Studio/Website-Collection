/* Runs before first paint: marks JS on, and marks animation on only when
   the visitor has not asked for reduced motion. */
(function () {
  'use strict';
  var el = document.documentElement;
  var still = false;
  try { still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { /* no matchMedia */ }
  el.className += (el.className ? ' ' : '') + 'js ' + (still ? 'no-anim' : 'js-anim');
})();

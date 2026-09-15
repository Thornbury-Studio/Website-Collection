/* Runs before first paint. Marks JS on so the CSS can hold back what it is
   about to reveal, and marks animation on only when the visitor has not
   asked for less of it. Under reduced motion the climb arrives at altitude,
   the footage shows its posters, and every reveal is instant. */
(function () {
  'use strict';
  var el = document.documentElement;
  var still = false;
  try { still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { /* no matchMedia */ }
  el.className += (el.className ? ' ' : '') + 'js ' + (still ? 'no-anim' : 'js-anim');
})();

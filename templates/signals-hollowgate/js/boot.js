/* Runs before first paint. Marks JS on so the stylesheet can hide what it is
   about to move, and marks animation on only when the visitor has not asked
   for less of it — a lever that starts hidden and never throws is worse than
   a lever that simply changes state. */
(function () {
  'use strict';
  var el = document.documentElement;
  var cls = ['js'];
  var still = false;
  try {
    still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) { /* no matchMedia */ }
  if (!still) cls.push('js-anim');
  el.className += (el.className ? ' ' : '') + cls.join(' ');
})();

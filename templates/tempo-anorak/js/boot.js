/* Runs before first paint. Marks JS on so the CSS can hide the things it is
   about to animate, and only marks animation on when the visitor has not asked
   for less of it — a reveal that starts hidden and never arrives is worse than
   no reveal at all. */
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

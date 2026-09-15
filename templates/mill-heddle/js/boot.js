/* Runs blocking in <head>, before the first paint. Marks JS on so the CSS can
   hide the things it is about to reveal, and only marks animation on when the
   visitor has not asked for less of it. The loom itself is not an animation —
   it is driven by scroll and pointer, so it runs either way. */
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

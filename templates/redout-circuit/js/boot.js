/* Runs before first paint. Marks JS on so the CSS can hide what it is about
   to reveal, and marks animation on only when the visitor has not asked for
   less of it. With reduced motion the veil never appears, the feed wall
   shows its posters, and the gate sequence arrives already armed. */
(function () {
  'use strict';
  var el = document.documentElement;
  var cls = ['js'];
  var still = false;
  try {
    still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) { /* no matchMedia */ }
  cls.push(still ? 'no-anim' : 'js-anim');
  el.className += (el.className ? ' ' : '') + cls.join(' ');
})();

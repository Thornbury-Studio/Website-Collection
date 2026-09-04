/* Runs blocking in <head>, before the first paint.

   Everything that starts hidden on this page — the reveals and the loader —
   is gated behind a `.js` class rather than being hidden in the stylesheet
   directly. If this file never arrives, or script is off, nothing is hidden:
   the page is a plain scrolling document with all its content visible and no
   loader covering it. That is the correct failure direction for a full-screen
   loader, which is otherwise a black rectangle over the whole site.

   The CSP here is script-src 'self' with no inline scripts, so this is a real
   file loaded without defer rather than the usual inline snippet. */
(function () {
  'use strict';
  var el = document.documentElement;
  el.className += (el.className ? ' ' : '') + 'js';

  /* Someone who has asked for reduced motion should not be held behind a
     twelve-frame countdown, so the loader is skipped outright rather than
     played faster. Marked here, before paint, so it never flashes. */
  try {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.setAttribute('data-still', '1');
    }
  } catch (e) { /* very old browser: play it as normal */ }
})();

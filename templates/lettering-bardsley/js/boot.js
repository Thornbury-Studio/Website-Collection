/* Runs blocking in <head>, before the first paint.

   Everything on this page that starts hidden — the wipes and the loader — is
   gated behind a `.js` class rather than being hidden in the stylesheet
   directly. If this file never arrives, or script is off, nothing is hidden:
   the page is a plain scrolling document, fully readable, with no loader
   sitting over it. That is the only acceptable failure direction for a
   full-screen loader, which is otherwise a blank rectangle over the site.

   The CSP here is script-src 'self' with no inline scripts, so this is a real
   file loaded without defer rather than the usual inline snippet. */
(function () {
  'use strict';
  var el = document.documentElement;
  el.className += (el.className ? ' ' : '') + 'js';

  /* Someone who has asked for reduced motion should not be held behind a
     wordmark being written out one stroke at a time. The loader is skipped
     outright rather than played faster, and it is marked here — before
     paint — so it never flashes. */
  try {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.setAttribute('data-still', '1');
    }
  } catch (e) { /* very old browser: play it as normal */ }
})();

/* Runs blocking in <head>, before first paint. CSP is script-src 'self' with
   no inline scripts, so this is a real file loaded without defer.

   Restores the stored flavour before anything is drawn — a visitor who chose
   MOOD RING yesterday must not see a yellow flash today — and opts the page
   into reveal animations, so a page whose JS never arrives is simply visible
   rather than blank. */
(function () {
  'use strict';
  var el = document.documentElement;
  var FLAVORS = { citrus: 1, burn: 1, mood: 1, snap: 1 };
  try {
    var f = localStorage.getItem('unstill.flavor');
    if (f && FLAVORS[f]) el.setAttribute('data-flavor', f);
  } catch (e) { /* private mode: default flavour stands */ }
  el.className += (el.className ? ' ' : '') + 'js-anim';
})();

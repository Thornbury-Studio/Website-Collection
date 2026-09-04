/* Runs blocking in <head>, before the first paint.

   The CSP here is script-src 'self' with no inline scripts, so this is a real
   file loaded without defer. It marks scripting as available, which is what
   turns the reveals and the block elevation into opt-in effects: a page whose
   JavaScript never arrives is simply visible, with every window already lit. */
(function () {
  'use strict';
  var el = document.documentElement;
  el.className += (el.className ? ' ' : '') + 'js js-anim';
})();

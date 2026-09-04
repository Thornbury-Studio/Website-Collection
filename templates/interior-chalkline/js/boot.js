/* Runs blocking in <head>, before the first paint.

   The CSP here is script-src 'self' with no inline scripts, so this is a
   real file loaded without defer. It marks scripting as available: pairs
   become scrubbable and reveals become opt-in from here, and a page whose
   JavaScript never arrives is simply visible rather than blank. */
(function () {
  'use strict';
  var el = document.documentElement;
  el.className += (el.className ? ' ' : '') + 'js js-anim';
})();

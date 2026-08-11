/* Runs blocking in <head>, before the first paint, and does only two things.

   The stored red-light preference has to be on <html> before anything is
   drawn. The usual trick is an inline <script>, but the CSP here is
   script-src 'self' with no inline scripts allowed, so this is a real file
   loaded without defer instead. Anything slower would flash a white page at
   someone whose eyes have taken twenty minutes to adapt — the exact harm the
   mode exists to prevent. */
(function () {
  'use strict';
  var el = document.documentElement;
  try {
    if (localStorage.getItem('vela.vision') === 'night') {
      el.setAttribute('data-vision', 'night');
    }
  } catch (e) { /* private mode: stay on the day theme */ }

  /* Reveal animations are opt-in from script, so a page whose JS never
     arrives is simply visible rather than blank. */
  el.className += (el.className ? ' ' : '') + 'js-anim';
})();

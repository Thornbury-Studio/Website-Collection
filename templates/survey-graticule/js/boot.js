/* Runs blocking in <head>, before the first paint, and does two things.

   The stored Office/Field preference has to be on <html> before anything is
   drawn, or someone who works in Field mode gets a full-page flash of cream
   paper on every navigation. The usual trick is an inline <script>, but the
   CSP here is script-src 'self' with no inline scripts allowed, so this is a
   real file loaded without defer instead. */
(function () {
  'use strict';
  var el = document.documentElement;
  try {
    if (localStorage.getItem('graticule.mode') === 'field') {
      el.setAttribute('data-mode', 'field');
    }
  } catch (e) { /* private mode: stay in Office */ }

  /* Reveal animations are opt-in from script, so a page whose JS never
     arrives is simply visible rather than blank. */
  el.className += (el.className ? ' ' : '') + 'js-anim';
})();

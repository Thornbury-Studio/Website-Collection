/* Runs before first paint: marks JS on, and picks the shop's state so the
   page never flashes the wrong one. FORGE is the default; BENCH follows the
   system preference until the visitor says otherwise. */
(function () {
  'use strict';
  var el = document.documentElement;
  el.className += (el.className ? ' ' : '') + 'js js-anim';
  var state = null;
  try { state = localStorage.getItem('hamon.state.v1'); } catch (e) { /* private mode */ }
  if (state !== 'forge' && state !== 'bench') {
    state = (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) ? 'bench' : 'forge';
  }
  if (state === 'bench') el.setAttribute('data-theme', 'bench');
})();

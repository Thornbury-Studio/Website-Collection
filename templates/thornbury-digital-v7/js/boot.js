/* boot: mark JS-on before first paint so pre-reveal states apply flash-free.
   Failsafe: if main.js never runs (blocked, 404), light everything anyway. */
document.documentElement.className += " js";
window.__thornburyFailsafe = setTimeout(function () {
  document.documentElement.className += " lit-all";
}, 2600);

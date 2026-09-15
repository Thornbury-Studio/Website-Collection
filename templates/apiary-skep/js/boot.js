/* Runs in <head>, before first paint. Marks the document animatable so the
   reveal gate in style.css applies without content flashing in already-moved.
   If this file never runs, .rev stays inert and every section is simply
   present — which is the correct failure mode. */
(function () {
  var d = document.documentElement;
  d.classList.add('js-anim');
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    d.classList.add('no-motion');
  }
})();

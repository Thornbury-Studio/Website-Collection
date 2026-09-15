/* Runs in <head>, before first paint. Marks the document as animatable so
   the reveal gate in style.css applies without the content flashing in
   already-broken. If this file never runs, .brk stays inert and every
   section is simply present — which is the correct failure mode. */
(function () {
  var d = document.documentElement;
  d.classList.add('js-anim');
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    d.classList.add('no-motion');
  }
})();

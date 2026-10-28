/* Runs before first paint: flips the no-js hooks the stylesheet keys off. */
(function () {
  var d = document.documentElement;
  d.classList.remove('no-js');
  d.classList.add('js');
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) d.classList.add('static');
})();

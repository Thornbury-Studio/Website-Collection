/* The block elevation on the home page.

   Two hundred and twenty-four windows are written into the HTML, one per
   handover, and they are lit in the stylesheet by default. This file is the
   only thing that ever turns them off: it adds `js-lights` to <html>, which
   darkens them, and then brings them back on in a shuffled stagger when the
   section is reached, counting the tally up alongside. If this file fails to
   load, or the browser has no IntersectionObserver, or the reader asked for
   reduced motion, the block simply stays as the stylesheet drew it — fully
   lit, with the number already printed in the markup. */

(function (root, doc) {
  'use strict';

  var DURATION = 2400;

  function start() {
    var block = doc.getElementById('block');
    var tally = doc.getElementById('tally');
    if (!block) return;

    var wins = Array.prototype.slice.call(block.querySelectorAll('i'));
    if (!wins.length) return;
    var total = wins.length;

    function lightAll() {
      for (var i = 0; i < total; i++) wins[i].classList.add('on');
      if (tally) tally.textContent = String(total);
    }

    var reduced = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || !root.IntersectionObserver || !root.requestAnimationFrame) return;

    /* Only now is it safe to darken them: everything below is guaranteed to
       run, and the 6s failsafe covers a tab that never composites. */
    doc.documentElement.classList.add('js-lights');

    /* A fixed shuffle, so the evening arrives the same way on every visit. */
    var order = [], seed = 20080417;
    for (var j = 0; j < total; j++) order.push(j);
    for (var k = total - 1; k > 0; k--) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      var s = seed % (k + 1);
      var tmp = order[k]; order[k] = order[s]; order[s] = tmp;
    }

    var running = false, done = false, lit = 0;

    function run(now) {
      var t = Math.min(1, (now - run.t0) / DURATION);
      var p = t * t * (3 - 2 * t);              // dusk: slow, then most at once, then stragglers
      var want = Math.round(p * total);
      while (lit < want) { wins[order[lit]].classList.add('on'); lit++; }
      if (tally) tally.textContent = String(lit);
      if (t < 1) root.requestAnimationFrame(run);
      else { done = true; lightAll(); }
    }

    function begin() {
      if (running) return;
      running = true;
      if (tally) tally.textContent = '0';
      run.t0 = (root.performance && root.performance.now) ? root.performance.now() : Date.now();
      root.requestAnimationFrame(run);
    }

    /* threshold 0 rather than a fraction: the block is routinely taller than
       a short viewport, so a ratio threshold is a trap waiting for the one
       window size that can never reach it. */
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        begin();
      });
    }, { threshold: 0, rootMargin: '0px 0px -12% 0px' });
    io.observe(block);

    /* IntersectionObserver only runs as part of rendering, and an observer
       that fires once and then misses is a real failure class here, not a
       hypothetical — so the same trigger also hangs off real scroll input,
       exactly as the reveals in ui.js do. */
    function sweep() {
      if (running) return;
      var r = block.getBoundingClientRect();
      if (r.top < root.innerHeight * 0.88 && r.bottom > 0) { io.unobserve(block); begin(); }
    }
    root.addEventListener('scroll', sweep, { passive: true });
    root.addEventListener('resize', sweep);
    setTimeout(sweep, 400);

    /* Last resort: a tab that never composites still has to show the number. */
    setTimeout(function () { if (!done) { running = true; lightAll(); } }, 6000);
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', start);
  else start();

})(window, document);

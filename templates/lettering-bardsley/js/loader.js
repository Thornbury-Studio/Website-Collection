/* NELL BARDSLEY — the loader.

   It writes the name. Same nib engine as the rest of the page, so the first
   thing a visitor sees is already the argument: the wordmark is not an image
   and not a font, it is a pen being dragged along a skeleton.

   Interactive, because a loader that only waits is a toll booth. Moving the
   pointer across the sheet turns the nib, live, while the word is still being
   laid down — so the thicks and thins of the name that ends up on screen are
   the visitor's, not mine.

   Two rules a loader has to obey to be worth having:

   1. It must never be the reason someone waits. It leaves on whichever comes
      LAST of "the word is written" and "the window loaded", and it is
      hard-capped past that regardless.

   2. Its exit must not depend on requestAnimationFrame. rAF is the right
      clock for animation and the wrong one for a deadline — it is not
      guaranteed to run at all, and a backgrounded or non-compositing tab
      would leave a full-screen sheet with no way out. rAF decides how this
      LOOKS; a setTimeout decides when it GOES. */

(function (root, doc) {
  'use strict';

  var WRITE = 1400;   /* ms to lay the word down */
  var CAP   = 2600;   /* ms — past this it leaves whatever is happening */

  function leave(el, immediate) {
    doc.documentElement.removeAttribute('data-loading');
    if (immediate) {
      if (el.parentNode) el.parentNode.removeChild(el);
      return;
    }
    el.setAttribute('data-done', '1');
    /* Removed from the document rather than left hidden, so it can never
       trap focus behind itself. Matches the 420ms fade in the stylesheet. */
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 460);
  }

  function init() {
    var el = doc.getElementById('load');
    if (!el) return;

    var canvas = doc.getElementById('loadCanvas');
    if (!canvas || !root.NIB || !canvas.getContext) { leave(el, true); return; }

    if (doc.documentElement.getAttribute('data-still') === '1') {
      leave(el, true);
      return;
    }

    doc.documentElement.setAttribute('data-loading', '1');

    var ctx = canvas.getContext('2d');
    var out = doc.getElementById('loadAngle');
    var lay = root.NIB.layout('nell bardsley', 30);

    var angle = 30, target = 30;
    var t0 = performance.now();
    var loaded = doc.readyState === 'complete';
    var running = true;

    root.addEventListener('load', function () { loaded = true; });

    /* The pointer turns the nib. Absolute across the sheet rather than
       relative to a drag, so a single sweep covers the whole range and there
       is nothing to discover. */
    function aim(clientX) {
      var box = canvas.getBoundingClientRect();
      if (!box.width) return;
      var k = Math.max(0, Math.min(1, (clientX - box.left) / box.width));
      target = Math.round(6 + k * 78);
    }
    el.addEventListener('pointermove', function (e) { aim(e.clientX); });
    el.addEventListener('pointerdown', function (e) { aim(e.clientX); });

    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
        e.preventDefault();
        if (!running) return;
        running = false;
        clearTimeout(deadline);
        leave(el);
      }
    });

    var deadline = setTimeout(function () {
      if (!running) return;
      running = false;
      leave(el);
    }, CAP);

    function frame(now) {
      if (!running) return;
      var elapsed = now - t0;

      /* Eased so the pen accelerates off the mark and settles, rather than
         travelling at a constant rate no hand ever managed. */
      var p = Math.min(1, elapsed / WRITE);
      p = 1 - Math.pow(1 - p, 3);

      angle += (target - angle) * 0.16;
      if (out) out.textContent = String(Math.round(angle));

      var dpr = Math.min(root.devicePixelRatio || 1, 2);
      var w = canvas.clientWidth, h = canvas.clientHeight;
      if (w && h) {
        if (canvas.width !== Math.round(w * dpr)) { canvas.width = Math.round(w * dpr); }
        if (canvas.height !== Math.round(h * dpr)) { canvas.height = Math.round(h * dpr); }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, h);
        var f = root.NIB.fit(lay, w, h, 64, 4, true);
        root.NIB.draw(ctx, lay, {
          angle: angle, nibW: 64, progress: p,
          scale: f.scale, ox: f.ox, oy: f.oy, color: '#131211'
        });
      }

      if ((p >= 1 && loaded) || elapsed >= CAP) {
        running = false;
        clearTimeout(deadline);
        leave(el);
        return;
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init);
  else init();

})(window, document);

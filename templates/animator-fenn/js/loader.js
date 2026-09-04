/* MARLOWE FENN — the leader.

   A film leader counts the operator into the first frame of a reel. This one
   counts twelve, because that is the rate the rest of the site quotes, and it
   advances the same way: one discrete step every 83ms, with nothing tweened
   between them. The sweep hand jumps thirty degrees at a time rather than
   sliding, which is what makes it read as sampled time rather than as a
   loading spinner.

   Two rules a loader has to obey to be worth having at all:

   1. It must never be the reason someone waits. It leaves on whichever comes
      LAST of "the count finished" and "the window loaded", but it is also
      hard-capped — past the cap it goes regardless of what the count is doing.
   2. It must be skippable. Dragging scrubs the count forward, Enter/Escape
      clears it outright, and anyone who has asked for reduced motion never
      sees it at all. */

(function (root, doc) {
  'use strict';

  var FPS = 12;
  var STEP = 1000 / FPS;
  var TOTAL = 12;          /* frames in the count */
  var CAP = 2200;          /* ms — past this the leader leaves regardless */

  function leave(el, immediate) {
    doc.documentElement.removeAttribute('data-loading');
    if (immediate) {
      if (el.parentNode) el.parentNode.removeChild(el);
      return;
    }
    el.setAttribute('data-done', '1');
    /* Matches the 333ms exit in the stylesheet. Removed from the document
       rather than left hidden, so it can never trap focus behind itself. */
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 400);
  }

  function init() {
    var el = doc.getElementById('leader');
    if (!el) return;

    if (doc.documentElement.getAttribute('data-still') === '1') {
      leave(el, true);
      return;
    }

    doc.documentElement.setAttribute('data-loading', '1');

    var countEl = doc.getElementById('leaderCount');
    var sweep = doc.getElementById('leaderSweep');
    var barEl = doc.getElementById('leaderBar');

    var t0 = performance.now();
    var scrub = 0;                                   /* frames added by dragging */
    var loaded = doc.readyState === 'complete';
    var running = true;

    root.addEventListener('load', function () { loaded = true; });

    /* The count runs on requestAnimationFrame, which is the right clock for
       animation and the wrong one for a deadline: rAF is not guaranteed to
       run at all. A backgrounded tab, a throttled webview, or anything that
       is not compositing will starve it — measured at literally zero frames
       per second in one embedded browser — and the overlay would then sit
       there forever with no way out.

       So the dismissal does not depend on the animation loop. A timer, which
       keeps firing when rAF does not, removes the leader at the cap whatever
       the count is doing. rAF decides how the thing LOOKS; setTimeout decides
       when it LEAVES. */
    var deadline = setTimeout(function () {
      if (!running) return;
      running = false;
      leave(el);
    }, CAP);

    /* Drag to advance — about one frame per 26px of travel in either
       direction, so a flick clears the whole count. */
    var lastX = null;
    el.addEventListener('pointerdown', function (e) {
      lastX = e.clientX;
      el.setPointerCapture(e.pointerId);
    });
    el.addEventListener('pointermove', function (e) {
      if (lastX === null) return;
      var dx = e.clientX - lastX;
      if (Math.abs(dx) >= 26) {
        scrub += Math.abs(dx) / 26;
        lastX = e.clientX;
      }
    });
    function release(e) {
      if (lastX === null) return;
      lastX = null;
      try { el.releasePointerCapture(e.pointerId); } catch (err) { /* already gone */ }
    }
    el.addEventListener('pointerup', release);
    el.addEventListener('pointercancel', release);

    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
        e.preventDefault();
        scrub += TOTAL;
      }
    });

    requestAnimationFrame(function tick(now) {
      if (!running) return;
      var elapsed = now - t0;
      var frame = Math.floor(elapsed / STEP) + Math.floor(scrub);
      var shown = Math.max(0, TOTAL - frame);

      countEl.textContent = shown < 10 ? '0' + shown : String(shown);
      /* Thirty degrees a frame, as a whole number, so there is never a
         sub-degree position for the browser to interpolate toward. */
      sweep.setAttribute('transform', 'rotate(' + ((frame % TOTAL) * 30) + ' 60 60)');
      barEl.style.width = Math.min(100, (frame / TOTAL) * 100) + '%';

      if ((frame >= TOTAL && loaded) || elapsed >= CAP) {
        running = false;
        clearTimeout(deadline);
        leave(el);
        return;
      }
      requestAnimationFrame(tick);
    });
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init);
  else init();

})(window, document);

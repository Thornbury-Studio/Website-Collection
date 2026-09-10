/* NELL BARDSLEY — the instrument in THE HAND, and the four release cards.

   THE CONTROL SURFACE

   Two things drive the word, and they are deliberately different in kind:

   - Scroll drives the PEN. On a wide screen the panel pins and the word is
     laid down as the reader travels through the section, which is the only
     honest mapping for a mark that has a beginning and an end. Scroll back
     up and it un-writes, because the pen is where you left it.
   - The pointer drives the TOOL. Angle, width and shape are dials, and they
     apply instantly at whatever point the pen has reached.

   Typing a word hands authorship over: the moment someone writes their own
   word, scroll stops scrubbing (it would erase what they just asked for) and
   the word writes itself once, on a timer. That mode change is one flag,
   `owned`, and it is the only stateful thing in this file.

   WHY IT REDRAWS THE WHOLE WORD EVERY FRAME

   Because it can. Splining the skeletons is the expensive half and NIB.layout
   caches it per word; a frame is ~30 Path2D builds and ~30 fills, which is
   nothing. Caching the rendered letters instead would mean invalidating on
   angle, width, shape, progress, size and DPR — six inputs, all of which
   change during ordinary use. */

(function (root, doc) {
  'use strict';

  if (!root.NIB) return;

  var INK = '#131211', RULE = '#c3bfb5', GHOST = '#a29d93';

  function dpr() { return Math.min(root.devicePixelRatio || 1, 2); }

  /* Sizes the backing store to the CSS box. Returns false when the element is
     not laid out yet (display:none, or a zero-height parent), which is the
     one case where drawing would silently produce nothing. */
  function sizeTo(canvas, ctx) {
    var w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return false;
    var r = dpr();
    var bw = Math.round(w * r), bh = Math.round(h * r);
    if (canvas.width !== bw) canvas.width = bw;
    if (canvas.height !== bh) canvas.height = bh;
    ctx.setTransform(r, 0, 0, r, 0, 0);
    ctx.clearRect(0, 0, w, h);
    return true;
  }

  /* ---- the release cards -------------------------------------------------
     Each card renders its own diagnostic letter through the same engine at
     that family's tool setting. The section's claim is that four families
     came out of one hand at four settings; setting the specimens in a
     finished font would have made that claim unverifiable on its own page. */

  function initFaces() {
    var cards = Array.prototype.slice.call(doc.querySelectorAll('.face__c'));
    if (!cards.length) return;

    var built = cards.map(function (c) {
      return {
        el: c,
        ctx: c.getContext('2d'),
        lay: root.NIB.layout(c.getAttribute('data-letter') || 'a', 0),
        angle: parseFloat(c.getAttribute('data-angle')) || 30,
        nib: parseFloat(c.getAttribute('data-nib')) || 72,
        round: c.getAttribute('data-round') === '1'
      };
    });

    function paint() {
      built.forEach(function (b) {
        if (!sizeTo(b.el, b.ctx)) return;
        var f = root.NIB.fit(b.lay, b.el.clientWidth, b.el.clientHeight, b.nib, 6, true);
        root.NIB.draw(b.ctx, b.lay, {
          angle: b.angle, nibW: b.nib, round: b.round, progress: 1,
          scale: f.scale, ox: f.ox, oy: f.oy, color: INK
        });
      });
    }

    paint();
    root.addEventListener('load', paint);
    if (root.ResizeObserver) {
      var ro = new ResizeObserver(paint);
      built.forEach(function (b) { ro.observe(b.el); });
    } else {
      root.addEventListener('resize', paint);
    }
    /* Webfont swap does not change these — they are canvas, not text — but a
       late layout shift from the swap does change the box they are drawn in. */
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(paint).catch(function () {});
  }

  /* ---- the instrument ---------------------------------------------------- */

  function initRig() {
    var rig = doc.getElementById('rig');
    var canvas = doc.getElementById('handCanvas');
    if (!rig || !canvas || !canvas.getContext) return;

    var ctx = canvas.getContext('2d');
    var top = doc.querySelector('.top');

    var wordIn   = doc.getElementById('handWord');
    var angleIn  = doc.getElementById('handAngle');
    var nibIn    = doc.getElementById('handNib');
    var guidesIn = doc.getElementById('handGuides');
    var broadB   = doc.getElementById('nibBroad');
    var roundB   = doc.getElementById('nibRound');
    var againB   = doc.getElementById('handAgain');
    var scrubTip = doc.getElementById('handScrub');
    var note     = doc.getElementById('handNote');

    var outAngle = doc.getElementById('handAngleOut');
    var outNib   = doc.getElementById('handNibOut');
    var roStroke = doc.getElementById('roStrokes');
    var roTravel = doc.getElementById('roTravel');
    var roContra = doc.getElementById('roContrast');

    var state = {
      word: 'hamburgevons',
      lay: root.NIB.layout('hamburgevons'),
      angle: 30,
      nib: 72,
      round: false,
      guides: false,
      progress: 0,
      owned: false      /* has the visitor taken the word over from scroll? */
    };

    var still = doc.documentElement.getAttribute('data-still') === '1';
    if (still) state.progress = 1;

    /* -- pinning ---------------------------------------------------------
       The same condition as the stylesheet's pin query, read once per
       resize. Asking the element whether it is currently `position: sticky`
       would work too, but it couples this file to a value that lives in the
       CSS; a media query is the one place the rule is actually written. */
    var pinQ = root.matchMedia('(min-width: 62rem) and (min-height: 40rem)');
    function pinned() { return pinQ.matches && !still; }

    /* -- draw ------------------------------------------------------------- */

    function drawGuides(w, h, f) {
      var M = root.NIB.metrics;
      var lines = [
        [M.asc,  'asc'],
        [M.xh,   'x'],
        [M.base, 'base'],
        [M.desc, 'desc']
      ];
      ctx.save();
      ctx.strokeStyle = RULE;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      for (var i = 0; i < lines.length; i++) {
        /* +0.5 so a 1px hairline lands on a device pixel instead of
           straddling two and rendering as a 2px smear. */
        var y = Math.round(-lines[i][0] * f.scale + f.oy) + 0.5;
        ctx.moveTo(0, y); ctx.lineTo(w, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = GHOST;
      ctx.font = '10px ui-monospace, Menlo, Consolas, monospace';
      for (var j = 0; j < lines.length; j++) {
        var ly = Math.round(-lines[j][0] * f.scale + f.oy);
        ctx.fillText(lines[j][1], 6, ly - 4);
      }
      ctx.restore();
    }

    function paint() {
      if (!sizeTo(canvas, ctx)) return;
      var w = canvas.clientWidth, h = canvas.clientHeight;
      var f = root.NIB.fit(state.lay, w, h, state.nib, 14);
      if (state.guides) drawGuides(w, h, f);
      root.NIB.draw(ctx, state.lay, {
        angle: state.angle,
        nibW: state.nib,
        round: state.round,
        progress: state.progress,
        scale: f.scale, ox: f.ox, oy: f.oy,
        color: INK,
        ghosts: state.guides,
        ghostColor: GHOST
      });
    }

    /* One redraw in flight at a time. Scroll and input both funnel through
       here, so a fast wheel cannot queue thirty redraws for one frame.

       Two clocks, on purpose. requestAnimationFrame is the right one when the
       page is being composited, and it is not guaranteed to run at all: an
       embedded webview that is not painting delivers literally zero frames,
       and then a dial the visitor just moved would never reach the sheet.
       So a timer runs alongside as the floor. Whichever arrives first clears
       the flag and the other becomes a no-op. */
    var queued = false, backstop = 0;
    function request() {
      if (queued) return;
      queued = true;
      function run() {
        if (!queued) return;
        queued = false;
        clearTimeout(backstop);
        paint();
      }
      requestAnimationFrame(run);
      backstop = setTimeout(run, 140);
    }

    /* -- readouts ---------------------------------------------------------
       Contrast is not a style word here, it is the arithmetic of the tool.
       A nib of width W held at angle t sweeps a ribbon whose perpendicular
       width is W·|sin(t − travel)|, so a vertical stem comes out W·|cos t|
       and a horizontal bar W·|sin t|. The ratio between those two is the
       whole reason a broad nib produces a typeface rather than a monoline,
       and at 0 or 90 degrees one of them is a hairline of literally zero
       width — which is reported as such rather than as a large number. */
    function readouts() {
      var rad = state.angle * Math.PI / 180;
      var stem = Math.abs(Math.cos(rad));
      var bar  = Math.abs(Math.sin(rad));

      if (outAngle) outAngle.textContent = state.angle + '°';
      if (outNib) outNib.textContent = 'x-height ' + (500 / state.nib).toFixed(1) + ' nibs';
      if (roStroke) roStroke.textContent = state.lay.strokes.length;
      if (roTravel) roTravel.textContent = (state.lay.total / 1000).toFixed(1) + ' em';

      if (roContra) {
        if (state.round) roContra.textContent = 'none · monoline';
        else {
          var hi = Math.max(stem, bar), lo = Math.min(stem, bar);
          if (lo < 0.02) roContra.textContent = '∞ · hairline';
          else roContra.textContent = (hi / lo).toFixed(2) + ' : 1 · ' +
            (stem >= bar ? 'stem heavy' : 'bar heavy');
        }
      }
    }

    /* -- scroll as the pen ------------------------------------------------- */

    function fromScroll() {
      if (state.owned || !pinned()) return;
      var rect = rig.getBoundingClientRect();
      var stick = top ? top.offsetHeight : 0;
      var pin = rig.firstElementChild;
      var travel = rect.height - (pin ? pin.getBoundingClientRect().height : 0);
      if (travel <= 0) { state.progress = 1; return; }
      var p = (stick - rect.top) / travel;
      state.progress = Math.max(0, Math.min(1, p));
    }

    function onScroll() { fromScroll(); request(); }

    /* -- writing on a timer (small screens, and after someone types) ------ */

    var writing = 0, writeGuard = 0;
    function writeOut(ms) {
      if (still) { state.progress = 1; request(); return; }
      var dur = ms || 1100;
      var t0 = performance.now();
      var id = ++writing;

      /* The same rule the loader obeys: rAF decides how the writing LOOKS, a
         timer decides that it FINISHES. Where the page is not being
         composited the loop below runs exactly once, at progress zero — and
         an empty sheet is not a missing animation, it is missing content. */
      clearTimeout(writeGuard);
      writeGuard = setTimeout(function () {
        if (id !== writing || state.progress >= 1) return;
        state.progress = 1;
        paint();
      }, dur + 500);

      (function step(now) {
        if (id !== writing) return;
        var p = Math.min(1, (now - t0) / dur);
        state.progress = 1 - Math.pow(1 - p, 3);
        paint();
        if (p < 1) requestAnimationFrame(step);
        else clearTimeout(writeGuard);
      })(t0);
    }

    /* -- controls ---------------------------------------------------------- */

    function take() {
      if (state.owned) return;
      state.owned = true;
      if (scrubTip) scrubTip.textContent = 'Your word · scroll released';
    }

    if (wordIn) {
      wordIn.addEventListener('input', function () {
        var raw = wordIn.value;
        var lay = root.NIB.layout(raw.toLowerCase());
        if (!lay.strokes.length) {
          if (note) {
            note.textContent = 'Nothing in that the nib can write. Lowercase letters, a full stop, a comma, a hyphen or an ampersand.';
            note.setAttribute('data-warn', '1');
          }
          return;
        }
        if (note) {
          note.textContent = /[^a-z .,\-&]/.test(raw.toLowerCase())
            ? 'Folded to what this nib is cut for — lowercase, and a few marks.'
            : 'The control word. Lowercase only — this nib is cut for minuscules.';
          note.removeAttribute('data-warn');
        }
        state.word = raw;
        state.lay = lay;
        take();
        readouts();
        writeOut(900);
      });
    }

    if (angleIn) {
      angleIn.addEventListener('input', function () {
        state.angle = parseInt(angleIn.value, 10) || 0;
        readouts();
        request();
      });
    }
    if (nibIn) {
      nibIn.addEventListener('input', function () {
        state.nib = parseInt(nibIn.value, 10) || 70;
        readouts();
        request();
      });
    }
    if (guidesIn) {
      guidesIn.addEventListener('change', function () {
        state.guides = guidesIn.checked;
        request();
      });
    }

    function shape(isRound) {
      state.round = isRound;
      if (broadB) { broadB.classList.toggle('is-on', !isRound); broadB.setAttribute('aria-pressed', String(!isRound)); }
      if (roundB) { roundB.classList.toggle('is-on', isRound); roundB.setAttribute('aria-pressed', String(isRound)); }
      readouts();
      request();
    }
    if (broadB) broadB.addEventListener('click', function () { shape(false); });
    if (roundB) roundB.addEventListener('click', function () { shape(true); });

    if (againB) {
      againB.addEventListener('click', function () { take(); writeOut(1100); });
    }

    /* -- start ------------------------------------------------------------- */

    root.addEventListener('scroll', onScroll, { passive: true });
    root.addEventListener('resize', function () {
      fromScroll();
      request();
    });
    if (root.ResizeObserver) new ResizeObserver(request).observe(canvas);

    /* Unpinned, the word is not something to scrub — it writes itself once
       when it comes into view, and the button replays it. */
    if (!pinned()) {
      if (scrubTip) scrubTip.textContent = 'Writes on arrival';
      if (root.IntersectionObserver) {
        var io = new IntersectionObserver(function (en) {
          if (en[0] && en[0].isIntersecting) { io.disconnect(); writeOut(1200); }
        }, { threshold: 0.3 });
        io.observe(canvas);
        /* IntersectionObserver only fires as part of the rendering steps, so
           a tab that never composites would leave the sheet blank. Nothing
           on this page waits longer than three seconds to appear. */
        setTimeout(function () { if (state.progress < 1) { io.disconnect(); writeOut(700); } }, 3000);
      } else {
        writeOut(1200);
      }
    }

    pinQ.addEventListener
      ? pinQ.addEventListener('change', function () { fromScroll(); request(); })
      : pinQ.addListener(function () { fromScroll(); request(); });

    readouts();
    fromScroll();
    paint();
    root.addEventListener('load', function () { fromScroll(); paint(); });
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(function () { fromScroll(); paint(); }).catch(function () {});
  }

  function start() { initFaces(); initRig(); }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', start);
  else start();

})(window, document);

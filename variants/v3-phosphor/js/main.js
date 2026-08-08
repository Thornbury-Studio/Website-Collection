/* ZANE — PHOSPHOR. Variant 03.
   Zero dependencies. The monitor re-renders each screenshot into this world:
   ordered dither to three beam levels, baked once per image, then only
   composited per frame. Nothing plays sound. */

(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* =======================================================================
     1. The dither engine
     ======================================================================= */

  var CW = 640, CH = 400;      /* backing store */
  var CELL = 5;                /* phosphor pitch */
  var GW = CW / CELL, GH = CH / CELL;   /* 128 x 80 cells */

  /* Bayer 8x8, normalised 0..1. Ordered dither keeps the grain regular,
     which is what a shadow mask actually looks like — error diffusion
     would give a noisy, photographic grain that reads as a JPEG artefact. */
  var BAYER = [
     0, 32,  8, 40,  2, 34, 10, 42,
    48, 16, 56, 24, 50, 18, 58, 26,
    12, 44,  4, 36, 14, 46,  6, 38,
    60, 28, 52, 20, 62, 30, 54, 22,
     3, 35, 11, 43,  1, 33,  9, 41,
    51, 19, 59, 27, 49, 17, 57, 25,
    15, 47,  7, 39, 13, 45,  5, 37,
    63, 31, 55, 23, 61, 29, 53, 21
  ].map(function (v) { return (v + 0.5) / 64; });

  var BEAM = ['', 'rgba(214,140,36,.85)', '#ffb642'];   /* off / half / full */

  var sampler = document.createElement('canvas');
  sampler.width = GW; sampler.height = GH;
  var sctx = sampler.getContext('2d', { willReadFrequently: true });

  var cache = Object.create(null);

  /* Bake one image into a ready-to-blit phosphor frame. Runs once per image. */
  function bake(src) {
    return new Promise(function (resolve, reject) {
      if (cache[src]) { resolve(cache[src]); return; }

      var img = new Image();
      img.decoding = 'async';
      img.onerror = reject;
      img.onload = function () {
        /* cover-fit the source into the sampler, anchored to the top —
           the interesting half of a website screenshot is its first fold */
        var s = Math.max(GW / img.width, GH / img.height);
        var dw = img.width * s, dh = img.height * s;
        sctx.fillStyle = '#000';
        sctx.fillRect(0, 0, GW, GH);
        sctx.drawImage(img, (GW - dw) / 2, 0, dw, dh);

        var data = sctx.getImageData(0, 0, GW, GH).data;

        var out = document.createElement('canvas');
        out.width = CW; out.height = CH;
        var octx = out.getContext('2d');
        octx.fillStyle = '#060409';
        octx.fillRect(0, 0, CW, CH);

        /* Auto-levels. Most of these screenshots are dark-UI pages whose whole
           histogram sits in the bottom fifth; dithered raw they come out as an
           almost empty field. Stretch each image against its own 2nd/98th
           percentile so every one lands on a usable range of beam levels. */
        var n = GW * GH;
        var lum = new Float32Array(n);
        var hist = new Uint32Array(256);
        for (var p = 0; p < n; p++) {
          var q = p * 4;
          var v = (data[q] * 0.299 + data[q + 1] * 0.587 + data[q + 2] * 0.114) / 255;
          lum[p] = v;
          hist[(v * 255) | 0]++;
        }
        var loCut = n * 0.02, hiCut = n * 0.02, acc = 0, lo = 0, hi = 255;
        for (var b = 0; b < 256; b++) { acc += hist[b]; if (acc >= loCut) { lo = b; break; } }
        acc = 0;
        for (var b2 = 255; b2 >= 0; b2--) { acc += hist[b2]; if (acc >= hiCut) { hi = b2; break; } }
        lo /= 255; hi /= 255;
        var span = Math.max(0.08, hi - lo);

        var r = CELL * 0.42;
        for (var y = 0; y < GH; y++) {
          for (var x = 0; x < GW; x++) {
            var l = (lum[y * GW + x] - lo) / span;
            l = l < 0 ? 0 : l > 1 ? 1 : l;
            l = Math.pow(l, 0.78);

            var t = BAYER[(y & 7) * 8 + (x & 7)];
            var level = 0;
            if (l > t * 0.42 + 0.5) level = 2;
            else if (l > t * 0.5 + 0.04) level = 1;
            if (!level) continue;

            octx.fillStyle = BEAM[level];
            octx.beginPath();
            octx.arc(x * CELL + CELL / 2, y * CELL + CELL / 2,
                     level === 2 ? r : r * 0.7, 0, 6.2832);
            octx.fill();
          }
        }

        cache[src] = out;
        resolve(out);
      };
      img.src = src;
    });
  }

  /* =======================================================================
     2. The tube
     ======================================================================= */

  var cv = document.getElementById('crt');
  if (!cv) return;
  var ctx = cv.getContext('2d');

  var frame = null;        /* the baked canvas currently on screen */
  var wipe = 1;            /* 0..1 scan-in progress */
  var wipeStart = 0;
  var running = false;
  var visible = true;
  var lastPaint = 0;

  function clearTube() {
    ctx.fillStyle = '#060409';
    ctx.fillRect(0, 0, CW, CH);
  }
  clearTube();

  function paint(now) {
    if (!running) return;

    /* Idle costs ~20fps, not 60 — there is nothing here that needs more. */
    if (wipe >= 1 && now - lastPaint < 48) { requestAnimationFrame(paint); return; }
    lastPaint = now;

    /* phosphor decay: the previous frame is dimmed, not erased, so the
       scan-in leaves a trail behind the beam the way a real tube does */
    ctx.fillStyle = 'rgba(6,4,9,.34)';
    ctx.fillRect(0, 0, CW, CH);

    if (frame) {
      if (wipe < 1) {
        var t = (now - wipeStart) / 260;
        wipe = t >= 1 ? 1 : t;
        var h = Math.ceil(CH * wipe);
        ctx.drawImage(frame, 0, 0, CW, h, 0, 0, CW, h);
        /* the beam line itself */
        ctx.fillStyle = 'rgba(255,240,207,.55)';
        ctx.fillRect(0, h - 2, CW, 2);
      } else {
        ctx.drawImage(frame, 0, 0);
        /* a slow bright band drifting down the tube */
        var band = ((now / 26) % (CH + 160)) - 160;
        var g = ctx.createLinearGradient(0, band, 0, band + 160);
        g.addColorStop(0, 'rgba(255,182,66,0)');
        g.addColorStop(.5, 'rgba(255,182,66,.05)');
        g.addColorStop(1, 'rgba(255,182,66,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, band, CW, 160);
      }
    }
    requestAnimationFrame(paint);
  }

  function start() {
    if (running || !visible || document.hidden) return;
    running = true;
    requestAnimationFrame(paint);
  }
  function stop() { running = false; }

  function show(src) {
    bake(src).then(function (baked) {
      frame = baked;
      wipe = reduced ? 1 : 0;
      wipeStart = performance.now();
      if (reduced) { clearTube(); ctx.drawImage(frame, 0, 0); }
      start();
    }).catch(function () {
      /* image missing: leave the tube dark rather than showing a broken box */
      clearTube();
    });
  }

  /* only burn frames while the tube is actually on screen and the tab is up */
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) {
      visible = e[0].isIntersecting;
      visible ? start() : stop();
    }, { threshold: 0.05 }).observe(cv);
  }
  document.addEventListener('visibilitychange', function () {
    document.hidden ? stop() : start();
  });

  /* =======================================================================
     3. The directory drives the tube
     ======================================================================= */

  var list = document.getElementById('dirList');
  var nameEl = document.getElementById('crtName');
  var subEl = document.getElementById('crtSub');
  if (!list) return;

  var rows = Array.prototype.slice.call(list.querySelectorAll('[role="option"]'));
  var index = Math.max(0, rows.findIndex(function (r) {
    return r.getAttribute('aria-selected') === 'true';
  }));

  function select(i, focusList) {
    index = (i + rows.length) % rows.length;
    var row = rows[index];

    rows.forEach(function (r, n) {
      r.setAttribute('aria-selected', n === index ? 'true' : 'false');
    });
    list.setAttribute('aria-activedescendant', row.id);

    if (nameEl) nameEl.textContent = row.dataset.name;
    if (subEl) subEl.innerHTML = row.dataset.sub;
    cv.setAttribute('aria-label', row.dataset.name + ', redrawn as amber phosphor dots');
    show(row.dataset.img);

    if (focusList) list.focus({ preventScroll: true });
  }

  function open(i) {
    var href = rows[(i + rows.length) % rows.length].dataset.href;
    if (href) window.location.href = href;
  }

  rows.forEach(function (r, n) {
    r.addEventListener('click', function () {
      if (n === index) { open(n); } else { select(n); }
    });
    r.addEventListener('mouseenter', function () { select(n); });
  });

  list.addEventListener('keydown', function (e) {
    var done = true;
    switch (e.key) {
      case 'ArrowDown': select(index + 1, true); break;
      case 'ArrowUp':   select(index - 1, true); break;
      case 'Home':      select(0, true); break;
      case 'End':       select(rows.length - 1, true); break;
      case 'Enter':
      case ' ':         open(index); break;
      default: done = false;
    }
    if (done) e.preventDefault();
  });

  /* =======================================================================
     4. Function keys and number keys, as the bar promises
     ======================================================================= */

  var fmap = { F1: 'dir', F2: 'log', F3: 'note', F4: 'coin' };

  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;

    if (fmap[e.key]) {
      var sec = document.getElementById(fmap[e.key]);
      if (sec) {
        e.preventDefault();
        sec.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
      }
      return;
    }
    var n = parseInt(e.key, 10);
    if (n >= 1 && n <= rows.length) {
      e.preventDefault();
      select(n - 1);
      document.getElementById('dir').scrollIntoView({
        behavior: reduced ? 'auto' : 'smooth', block: 'start'
      });
    }
  });

  /* mark the section the reader is actually in */
  if ('IntersectionObserver' in window) {
    var links = Array.prototype.slice.call(document.querySelectorAll('.fkeys a'));
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) {
          a.setAttribute('aria-current',
            a.getAttribute('href') === '#' + en.target.id ? 'true' : 'false');
        });
      });
    }, { rootMargin: '-25% 0px -60% 0px' });
    ['dir', 'log', 'note', 'coin'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) io.observe(el);
    });
  }

  /* =======================================================================
     5. Transmit
     ======================================================================= */

  (function () {
    var form = document.getElementById('termForm');
    var out = document.getElementById('termOut');
    if (!form || !out) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = form.elements.email, brief = form.elements.brief;
      if (!email.value.trim() || email.validity.typeMismatch) {
        out.dataset.state = 'error';
        out.textContent = 'ERR: address rejected. Check it and transmit again.';
        email.focus(); return;
      }
      if (!brief.value.trim()) {
        out.dataset.state = 'error';
        out.textContent = 'ERR: empty brief. One line is enough.';
        brief.focus(); return;
      }
      out.dataset.state = 'ok';
    out.textContent = 'Thanks — please contact us directly to continue.';
    });
  })();

  /* boot the tube on whatever the markup says is selected */
  select(index);
})();

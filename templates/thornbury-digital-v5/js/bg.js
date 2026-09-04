/* Thornbury Digital v5 — js/bg.js
   Navigation between pages, and what the background does while it happens.

   Every page is a real HTML file. Same-directory links are intercepted, fetched,
   and only <main> is swapped, so the canvas is never torn down and the background
   can carry a thought across the navigation instead of blinking out with it.
   Anything unexpected — a cross-origin URL, a modified click, a failed fetch —
   falls straight back to a real navigation.

   Seven directions are implemented, plus the hard cut as a control. They differ
   only in what happens to the background between the two pages:

     off         a real browser navigation. The control.
     continuum   one world, never reseeded. The camera travels to the next page's
                 viewpoint and the key light moves with it. Nothing resets, so the
                 strand you were watching is still there when you arrive.
     chapters    a different world per page — its own b, density, seed — under one
                 material and one motion law. The old frame is frozen and dissolved
                 over the new one, so the two identities are compared, not cut.
     pour        the frozen frame is torn away by a procedural front: a per-band
                 noise offset moving left to right with a bright edge, revealing the
                 new state behind it. No asset, no continuity — the transition is
                 the material re-pouring itself.
     film        a looping video plate instead of the field. Built so it can be
                 judged, not recommended: see DESIGN.md.
     law         the attractor constant b eases between pages. No reseed, no ghost,
                 no transition layer: the strands stay the strands and the tangle
                 reshapes into the next page's attractor. B's idea by A's means.
     inkcut      pour's job with the shape filmed instead of computed — a real ink
                 stroke keyed to alpha by luminance and used to erase the old frame.
     refract     not a wipe at all. A filmed liquid-metal ripple displaces the
                 frozen frame along its own luminance gradient, cell by cell.

   Every direction carries its measured cost in `cost`, and the dev switcher shows
   it, because a transition is only worth what you are willing to pay for it.

   The mode is chosen by js/dev-bg-switcher.js, which is temporary and dev-only.
   Without it this file runs whichever mode DEFAULT names below. */
(function (global) {
  'use strict';

  var html = document.documentElement;
  var canvas = document.getElementById('field');
  var DEFAULT = 'continuum';

  /* ---------------------------------------------------------------------------
     Page presets. cam is where the camera sits; world is which attractor it is
     looking at. b, ext and vnorm are measured together — see the table in
     js/field.js. Only `continuum` uses cam alone; only `chapters` and `pour`
     change world.
     ------------------------------------------------------------------------- */
  var PAGES = {
    home: {
      field: 'live',
      cam: { rot: 0.00, tilt: 0.50, ax: .50, ay: .50, zoom: 1.00, lx: 0.60, ly: -0.80 },
      world: { b: 0.190, seed: 0, ext: 4.6, vn: 1.30, density: 1.00 },
      film: { pos: '50% 100%', scale: 1.16, filter: 'saturate(.9) contrast(1.02)' }
    },
    work: {
      field: 'still',
      cam: { rot: 1.15, tilt: 0.86, ax: .34, ay: .46, zoom: 1.42, lx: -0.50, ly: -0.87 },
      world: { b: 0.155, seed: 23, ext: 5.1, vn: 1.78, density: 0.92 },
      film: { pos: '20% 40%', scale: 1.42, filter: 'saturate(.5) contrast(1.15) brightness(.8)' }
    },
    studio: {
      field: 'live',
      cam: { rot: 2.35, tilt: 1.18, ax: .64, ay: .52, zoom: 0.92, lx: 0.95, ly: -0.31 },
      world: { b: 0.205, seed: 11, ext: 4.4, vn: 1.25, density: 1.00 },
      film: { pos: '80% 20%', scale: 1.05, filter: 'saturate(.3) contrast(1.05) brightness(.72)' }
    },
    contact: {
      field: 'still',
      cam: { rot: 3.30, tilt: 0.34, ax: .70, ay: .58, zoom: 1.22, lx: 0.20, ly: -0.98 },
      world: { b: 0.130, seed: 37, ext: 5.4, vn: 1.87, density: 0.60 },
      film: { pos: '60% 70%', scale: 1.30, filter: 'saturate(.2) contrast(1.1) brightness(.62)' }
    }
  };
  function preset(p) { return PAGES[p] || PAGES.home; }
  /* mark a world spec so the field rebuilds it across frames rather than in one */
  function chunked(w) {
    return { b: w.b, seed: w.seed, ext: w.ext, vn: w.vn, density: w.density, chunked: true };
  }

  function field() { return global.TBPage && global.TBPage.field(); }
  function reduced() { return !!(global.TBPage && global.TBPage.reduced); }
  function delay(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  /* ---------------------------------------------------------------------------
     The ghost: one frozen copy of the canvas, laid over it. Both dissolve and
     tear work on this, so the live field is free to become the next page behind
     it — including paying its reseed cost — without anything being seen.
     ------------------------------------------------------------------------- */
  var gc = null, gctx = null;

  function ghost() {
    if (gc || !canvas) return gc;
    gc = document.createElement('canvas');
    gc.className = 'field field--ghost';
    gc.setAttribute('aria-hidden', 'true');
    canvas.parentNode.insertBefore(gc, canvas.nextSibling);
    gctx = gc.getContext('2d');
    return gc;
  }
  function freeze() {
    if (!ghost() || !canvas.width) return false;
    gc.width = canvas.width;
    gc.height = canvas.height;
    gctx.setTransform(1, 0, 0, 1, 0, 0);
    gctx.globalCompositeOperation = 'source-over';
    gctx.clearRect(0, 0, gc.width, gc.height);
    gctx.drawImage(canvas, 0, 0);
    gc.style.transition = '';
    gc.style.opacity = '1';
    gc.hidden = false;
    return true;
  }
  function thaw() {
    if (!gc) return;
    gc.hidden = true;
    gc.style.transition = '';
    gc.style.opacity = '';
  }

  function ghostFade(ms) {
    if (!gc || gc.hidden) return delay(0);
    gc.style.transition = 'opacity ' + ms + 'ms cubic-bezier(.45,.05,.55,.95)';
    requestAnimationFrame(function () { gc.style.opacity = '0'; });
    return delay(ms + 60).then(thaw);
  }

  /* A front sweeping left to right, displaced per band by a fixed sum of three
     sines, erasing the frozen frame. The front only ever advances, so the bright
     edge drawn at one frame's position is erased by the next frame's cut and no
     residue is left behind — which is why this needs no second buffer. */
  function tearWipe(ms) {
    if (!gc || gc.hidden) return delay(0);
    return new Promise(function (done) {
      var w = gc.width, h = gc.height;
      var dp = Math.max(1, w / Math.max(1, gc.clientWidth));
      var amp = w * 0.085;
      var bandH = Math.max(4 * dp, Math.round(h / 120));
      var bands = Math.ceil(h / bandH);
      var nz = new Float64Array(bands);
      var ph = Math.random() * 100;
      for (var i = 0; i < bands; i++) {
        var u = i / bands;
        nz[i] = Math.sin(u * 7.4 + ph) * 0.55 +
                Math.sin(u * 17.3 + ph * 1.7) * 0.30 +
                Math.sin(u * 31.1 + ph * 2.3) * 0.15;
      }
      var t0 = performance.now();
      function step(t) {
        var p = Math.min(1, (t - t0) / ms);
        var e = p * p * (3 - 2 * p);
        var f = -amp + e * (w + amp * 2);
        gctx.setTransform(1, 0, 0, 1, 0, 0);
        gctx.globalCompositeOperation = 'destination-out';
        gctx.fillStyle = '#000';
        var i, x;
        for (i = 0; i < bands; i++) {
          x = f + nz[i] * amp;
          if (x > 0) gctx.fillRect(0, i * bandH, x, bandH + 1);
        }
        gctx.globalCompositeOperation = 'lighter';
        for (i = 0; i < bands; i++) {
          x = f + nz[i] * amp;
          if (x < -34 * dp || x > w + 4) continue;
          gctx.fillStyle = 'rgba(225,225,225,.09)';
          gctx.fillRect(x - 32 * dp, i * bandH, 32 * dp, bandH + 1);
          gctx.fillStyle = 'rgba(255,255,255,.5)';
          gctx.fillRect(x - 2.2 * dp, i * bandH, 2.4 * dp, bandH + 1);
        }
        if (p < 1) requestAnimationFrame(step);
        else { thaw(); done(); }
      }
      requestAnimationFrame(step);
    });
  }

  /* ---------------------------------------------------------------------------
     Media used only by a transition. Nothing is fetched until its mode is
     chosen, and nothing plays at rest.
     ------------------------------------------------------------------------- */
  var clips = {};
  function clip(name, src) {
    if (clips[name]) return clips[name];
    var v = document.createElement('video');
    v.muted = true; v.playsInline = true; v.preload = 'auto';
    v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
    v.src = src;
    /* kept in the document, 1px and invisible: a detached <video> decodes fine in
       Chromium but is not reliable everywhere, and drawImage needs real frames */
    v.className = 'bg-clip';
    v.setAttribute('aria-hidden', 'true');
    document.body.appendChild(v);
    v.load();
    clips[name] = v;
    return v;
  }
  function playFrom(v, t) {
    if (!v) return;
    try { v.currentTime = t || 0; } catch (e) { /* not seekable yet */ }
    var pl = v.play();
    if (pl && pl.catch) pl.catch(function () { /* autoplay refused: the wipe still runs */ });
  }

  /* luminanceToAlpha turns a greyscale frame into a matte in one GPU draw, which
     is the whole reason a filmed wipe costs about what a computed one does. */
  var lumaOK = null;
  function lumaFilter() {
    if (document.getElementById('tb-luma')) return;
    var NS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('width', '0');
    svg.setAttribute('height', '0');
    svg.style.position = 'absolute';
    svg.style.width = svg.style.height = '0';
    var f = document.createElementNS(NS, 'filter');
    f.setAttribute('id', 'tb-luma');
    f.setAttribute('color-interpolation-filters', 'sRGB');
    var m = document.createElementNS(NS, 'feColorMatrix');
    m.setAttribute('type', 'luminanceToAlpha');
    f.appendChild(m);
    svg.appendChild(f);
    document.body.appendChild(svg);
  }
  function lumaKeyWorks() {
    if (lumaOK !== null) return lumaOK;
    lumaFilter();
    try {
      var c = document.createElement('canvas');
      c.width = c.height = 2;
      var x = c.getContext('2d');
      x.fillStyle = '#fff';
      x.fillRect(0, 0, 2, 2);
      x.globalCompositeOperation = 'destination-out';
      x.filter = 'url(#tb-luma)';
      x.fillStyle = '#000';           /* luminance 0 must erase nothing */
      x.fillRect(0, 0, 2, 2);
      x.filter = 'none';
      lumaOK = x.getImageData(0, 0, 1, 1).data[3] > 200;
    } catch (e) { lumaOK = false; }
    return lumaOK;
  }

  /* F — the wipe shape is a filmed brush stroke. The clip is graded to a matte
     (black through white); its luminance becomes alpha and erases the frozen
     frame. Falls back to a dissolve wherever the filter is not honoured. */
  function inkWipe(ms) {
    if (!gc || gc.hidden) return delay(0);
    var v = clip('ink', 'video/ink.mp4');
    if (!lumaKeyWorks()) return ghostFade(ms);
    var w = gc.width, h = gc.height;
    playFrom(v, 0);
    return new Promise(function (done) {
      var t0 = performance.now();
      function step(t) {
        var p = Math.min(1, (t - t0) / ms);
        gctx.setTransform(1, 0, 0, 1, 0, 0);
        gctx.globalCompositeOperation = 'destination-out';
        if (v.readyState >= 2) {
          gctx.filter = 'url(#tb-luma)';
          gctx.drawImage(v, 0, 0, w, h);
          gctx.filter = 'none';
        }
        /* the encoded white tops out just under 255, so the last quarter carries
           a plain erase and the frame always finishes clean */
        if (p > 0.72) {
          var k = (p - 0.72) / 0.28;
          gctx.fillStyle = 'rgba(0,0,0,' + (k * k * 0.5).toFixed(3) + ')';
          gctx.fillRect(0, 0, w, h);
        }
        if (p < 1) requestAnimationFrame(step);
        else { v.pause(); thaw(); done(); }
      }
      requestAnimationFrame(step);
    });
  }

  /* G — the frozen frame is not wiped, it is bent. A filmed ripple is read at
     32x18 and its luminance gradient displaces the image cell by cell, so the
     old page flows away through liquid metal. This is the expensive one: ~576
     drawImage calls a frame while it runs. */
  var buf = null, bctx = null, map = null, mctx = null;
  var MAPX = 36, MAPY = 20;
  function refractWarm() {
    if (!canvas || !canvas.width) return;
    if (!buf) { buf = document.createElement('canvas'); bctx = buf.getContext('2d'); }
    if (buf.width !== canvas.width || buf.height !== canvas.height) {
      buf.width = canvas.width; buf.height = canvas.height;
    }
    if (!map) {
      map = document.createElement('canvas');
      map.width = MAPX; map.height = MAPY;
      mctx = map.getContext('2d', { willReadFrequently: true });
      mctx.getImageData(0, 0, MAPX, MAPY);
    }
  }
  function refract(ms) {
    if (!gc || gc.hidden) return delay(0);
    var v = clip('warp', 'video/warp.mp4');
    var w = gc.width, h = gc.height;
    refractWarm();
    if (buf.width !== w || buf.height !== h) { buf.width = w; buf.height = h; }
    bctx.setTransform(1, 0, 0, 1, 0, 0);
    bctx.clearRect(0, 0, w, h);
    bctx.drawImage(gc, 0, 0);
    var CX = MAPX, CY = MAPY;
    playFrom(v, Math.random() * 3);
    var cw = w / CX, ch = h / CY;
    /* cells overlap generously: the seam between two differently-displaced
       cells is what makes a grid read as shards instead of as liquid */
    var ov = Math.ceil(Math.max(cw, ch) * 0.38) + 2;
    var amp = w * 0.10;
    var lum = new Float32Array(CX * CY);
    return new Promise(function (done) {
      var t0 = performance.now();
      function step(t) {
        var p = Math.min(1, (t - t0) / ms);
        var a = Math.sin(Math.PI * p) * amp;
        var fade = p < 0.45 ? 1 : Math.max(0, 1 - (p - 0.45) / 0.55);
        var i, j, o;
        if (v.readyState >= 2) {
          mctx.drawImage(v, 0, 0, CX, CY);
          var d = mctx.getImageData(0, 0, CX, CY).data;
          for (i = 0; i < CX * CY; i++) {
            o = i * 4;
            lum[i] = (d[o] * 0.3 + d[o + 1] * 0.59 + d[o + 2] * 0.11) / 255;
          }
        }
        gctx.setTransform(1, 0, 0, 1, 0, 0);
        gctx.globalCompositeOperation = 'source-over';
        gctx.clearRect(0, 0, w, h);
        gctx.globalAlpha = fade;
        for (j = 0; j < CY; j++) {
          for (i = 0; i < CX; i++) {
            /* displace along the map's gradient — light bends toward the slope */
            var gx = lum[j * CX + Math.min(CX - 1, i + 1)] - lum[j * CX + Math.max(0, i - 1)];
            var gy = lum[Math.min(CY - 1, j + 1) * CX + i] - lum[Math.max(0, j - 1) * CX + i];
            var sx = i * cw, sy = j * ch;
            gctx.drawImage(buf,
              sx - ov, sy - ov, cw + ov * 2, ch + ov * 2,
              sx - ov + gx * a, sy - ov + gy * a, cw + ov * 2, ch + ov * 2);
          }
        }
        gctx.globalAlpha = 1;
        if (p < 1) requestAnimationFrame(step);
        else { v.pause(); thaw(); done(); }
      }
      requestAnimationFrame(step);
    });
  }

  /* ---------------------------------------------------------------------------
     The film plate. Created only if the mode is ever selected, so nothing is
     downloaded for the other four.
     ------------------------------------------------------------------------- */
  var filmBox = null;
  function filmPlate() {
    if (filmBox || !canvas) return filmBox;
    filmBox = document.createElement('div');
    filmBox.className = 'bg-film';
    filmBox.setAttribute('aria-hidden', 'true');
    filmBox.innerHTML =
      '<video class="bg-film-media" poster="img/poster-hero.webp" muted loop playsinline preload="auto">' +
      '<source src="video/hero.mp4" type="video/mp4"></video><i class="bg-film-veil"></i>';
    canvas.parentNode.insertBefore(filmBox, canvas.nextSibling);
    var v = filmBox.querySelector('.bg-film-media');
    if (!reduced()) { v.autoplay = true; v.play().catch(function () { /* blocked: poster stands in */ }); }
    return filmBox;
  }
  function filmTo(page) {
    if (!filmBox) return;
    var f = preset(page).film;
    var v = filmBox.querySelector('.bg-film-media');
    v.style.objectPosition = f.pos;
    v.style.transform = 'scale(' + f.scale + ')';
    v.style.filter = f.filter;
  }

  /* ---------------------------------------------------------------------------
     Field policy: which pages run the loop, and which pour a trail and stop.
     ------------------------------------------------------------------------- */
  /* under reduced motion the field is always still: waking it is the one thing a
     mode is never allowed to do. It still redraws, so a new world is not a blank. */
  function wake(f, redrawFrames) {
    if (!f) return;
    if (reduced()) { f.setStill(true, redrawFrames || 30); return; }
    f.setStill(false);
  }

  function fieldPolicy(page, mode) {
    var f = field();
    if (!f) return;
    if (reduced()) { html.setAttribute('data-field', 'still'); f.setStill(true); return; }
    if (mode === 'continuum' || mode === 'law') {
      html.setAttribute('data-field', 'live');
      f.setStill(false);
      return;
    }
    var want = preset(page).field;
    html.setAttribute('data-field', want);
    f.setStill(want === 'still');
  }

  /* ---------------------------------------------------------------------------
     The directions. Every one carries the cost it actually measured, because a
     transition is only worth what you are willing to pay for it.

     Method, desktop at 1440x900 (canvas 2138x1350 at dpr 1.5, 2600 particles):
     rest is a paired on/off frame-time difference over five rounds - 6.06 ms
     with the canvas idle, 8.25 ms with it running, i.e. ~0.25 s of extra main
     thread per second, ~8 ms on each of 30 painted frames. Swap cost is total
     PerformanceObserver longtask time across four navigations, median. Every
     direction but REFRACT records exactly zero. None of them has been measured
     on a real phone, and the labels say so rather than guessing.

     enter(page)          put the background into this page's resting state
     exit()               undo anything this mode added to the document
     run(from,to,commit)  perform the transition; call commit() to swap <main>
     ------------------------------------------------------------------------- */
  var MODES = {
    off: {
      label: 'OFF — hard cut',
      cost: '0 ms · swap: a full page load · phone: n/a',
      note: 'Real navigation. The control.',
      router: false,
      enter: function () {},
      exit: function () {}
    },

    continuum: {
      label: 'A · CONTINUUM',
      cost: 'canvas on every page: ~0.25 s/s main thread · swap: no long task · phone: no on-device number',
      note: 'One world. The camera travels; nothing resets.',
      router: true,
      enter: function (page) {
        var f = field();
        if (!f) return;
        /* "one world" has to mean a defined one: entering the mode from another
           that reseeded or moved the law would otherwise inherit its leftovers */
        wake(f, 0);
        f.world(PAGES.home.world);
        f.camera(preset(page).cam);
        f.pour(3);
        fieldPolicy(page, 'continuum');
      },
      exit: function () {},
      run: function (from, to, commit) {
        var f = field();
        var dur = reduced() ? 0 : 1.35;
        if (f) f.camera(preset(to).cam, dur);
        setTimeout(commit, dur ? 420 : 0);
        return delay(dur * 1000).then(function () { fieldPolicy(to, 'continuum'); });
      }
    },

    chapters: {
      label: 'B · CHAPTERS',
      cost: 'free at rest, still pages stay still · swap: no long task · phone: no on-device number',
      note: 'A world per page, one material. Frozen frame dissolves over the new one.',
      router: true,
      enter: function (page) {
        var f = field();
        if (!f) return;
        wake(f, 0);
        f.world(preset(page).world);
        f.camera(preset(page).cam);
        f.pour(3);
        fieldPolicy(page, 'chapters');
      },
      exit: function () { thaw(); },
      run: function (from, to, commit) {
        var f = field();
        var frozen = freeze();
        if (f) {
          wake(f, 0);
          f.world(chunked(preset(to).world));
          f.camera(preset(to).cam);
          f.pour(3);
        }
        if (!frozen) { commit(); fieldPolicy(to, 'chapters'); return delay(0); }
        setTimeout(commit, reduced() ? 0 : 380);
        return ghostFade(reduced() ? 120 : 1000).then(function () { fieldPolicy(to, 'chapters'); });
      }
    },

    pour: {
      label: 'C · POUR',
      cost: 'free at rest, no asset at all · swap: no long task · phone: no on-device number',
      note: 'Procedural tear, no asset. The frozen frame is pulled off the new one.',
      router: true,
      enter: function (page) { MODES.chapters.enter(page); },
      exit: function () { thaw(); },
      run: function (from, to, commit) {
        var f = field();
        var frozen = freeze();
        if (f) {
          wake(f, 0);
          f.world(chunked(preset(to).world));
          f.camera(preset(to).cam);
          f.pour(4);
        }
        if (!frozen || reduced()) { commit(); thaw(); fieldPolicy(to, 'pour'); return delay(0); }
        setTimeout(commit, 460);
        return tearWipe(1000).then(function () { fieldPolicy(to, 'pour'); });
      }
    },

    film: {
      label: 'D · FILM',
      cost: 'video decoding the whole time you read, 2.7 MB · swap: no long task · phone: no on-device number',
      note: 'Video plate, decoding the whole time you read. Not qualified.',
      router: true,
      enter: function (page) {
        filmPlate();
        html.classList.add('has-bg-film');
        if (global.TBPage) global.TBPage.suspendField(true);
        filmTo(page);
      },
      exit: function () {
        html.classList.remove('has-bg-film');
        if (global.TBPage) global.TBPage.suspendField(false);
        if (filmBox) { filmBox.remove(); filmBox = null; }
      },
      run: function (from, to, commit) {
        filmTo(to);
        setTimeout(commit, reduced() ? 0 : 380);
        return delay(reduced() ? 120 : 900);
      }
    },

    /* E — B's per-page identity reached by A's means. b is continuous in the
       vector field, so easing it while the integrator runs makes the existing
       trajectories reshape into the next page's attractor. Nothing is reseeded,
       nothing is frozen, and there is no transition layer at all: the only thing
       that changes between pages is the law the strands are obeying. */
    law: {
      label: 'E · LAW',
      cost: 'canvas on every page: ~0.25 s/s main thread · swap: no long task · phone: no on-device number',
      note: 'The attractor constant b eases between pages. No reseed, no ghost — the tangle reshapes itself.',
      router: true,
      enter: function (page) {
        var f = field();
        if (!f) return;
        /* one particle set, seeded once; only the law it obeys changes after this */
        wake(f, 0);
        f.world(PAGES.home.world);
        f.camera(preset(page).cam);
        f.lawTo(preset(page).world, 0);
        f.pour(3);
        fieldPolicy(page, 'law');
      },
      exit: function () {},
      run: function (from, to, commit) {
        var f = field();
        var dur = reduced() ? 0 : 1.5;
        if (f) {
          f.camera(preset(to).cam, dur);
          f.lawTo(preset(to).world, dur);
        }
        setTimeout(commit, dur ? 480 : 0);
        return delay(dur * 1000).then(function () { fieldPolicy(to, 'law'); });
      }
    },

    /* F — the same job as C, with the shape filmed instead of computed. */
    inkcut: {
      label: 'F · INKCUT',
      cost: 'free at rest, 87 kB clip · swap: no long task · phone: no on-device number',
      note: 'The wipe shape is a filmed ink stroke used as a luma matte, not a function. Direct comparison with C.',
      router: true,
      enter: function (page) {
        clip('ink', 'video/ink.mp4');
        MODES.chapters.enter(page);
      },
      exit: function () { thaw(); },
      run: function (from, to, commit) {
        var f = field();
        var frozen = freeze();
        if (f) {
          wake(f, 0);
          f.world(chunked(preset(to).world));
          f.camera(preset(to).cam);
          f.pour(4);
        }
        if (!frozen || reduced()) { commit(); thaw(); fieldPolicy(to, 'inkcut'); return delay(0); }
        setTimeout(commit, 500);
        return inkWipe(1200).then(function () { fieldPolicy(to, 'inkcut'); });
      }
    },

    /* G — not a wipe at all: an image-space distortion. The expensive one. */
    refract: {
      label: 'G · REFRACT',
      cost: 'free at rest, but 0.56 s of long tasks per swap (worst 159 ms), 155 kB · phone: no on-device number',
      note: 'The frozen page bends away through a filmed liquid-metal ripple — a displacement field, not a wipe.',
      router: true,
      enter: function (page) {
        clip('warp', 'video/warp.mp4');
        refractWarm();
        MODES.chapters.enter(page);
      },
      exit: function () { thaw(); },
      run: function (from, to, commit) {
        var f = field();
        var frozen = freeze();
        if (f) {
          wake(f, 0);
          f.world(chunked(preset(to).world));
          f.camera(preset(to).cam);
          f.pour(4);
        }
        if (!frozen || reduced()) { commit(); thaw(); fieldPolicy(to, 'refract'); return delay(0); }
        setTimeout(commit, 440);
        return refract(1150).then(function () { fieldPolicy(to, 'refract'); });
      }
    }
  };

  /* ---------------------------------------------------------------------------
     Content. <main> fades and lifts on the way out and back in; the difference
     between the modes is only ever what is behind it. The opacity lives in a
     class, not inline, so at rest <main> carries no opacity at all and does not
     become a stacking context the glass would then fail to blend through.
     ------------------------------------------------------------------------- */
  function contentOut() {
    if (reduced()) { return delay(0); }
    html.classList.add('bg-out');
    return delay(300);
  }
  function contentIn() {
    html.classList.remove('bg-out');
  }

  /* ---------------------------------------------------------------------------
     Router.
     ------------------------------------------------------------------------- */
  var base = location.pathname.replace(/[^/]*$/, '');
  var cache = new Map();
  var busy = false;
  var current = null;
  var page = html.getAttribute('data-page') || 'home';

  try { history.scrollRestoration = 'manual'; } catch (e) { /* older engines */ }

  function routable(u) {
    if (u.origin !== location.origin || u.pathname.indexOf(base) !== 0) return false;
    return /^([a-z0-9-]+\.html)?$/.test(u.pathname.slice(base.length));
  }

  function load(href) {
    if (cache.has(href)) return cache.get(href);
    var p = fetch(href, { credentials: 'same-origin' })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
      .then(function (t) { return new DOMParser().parseFromString(t, 'text/html'); })
      .catch(function (err) { cache.delete(href); throw err; });
    cache.set(href, p);
    return p;
  }

  function commitDoc(doc, hash) {
    var next = doc.querySelector('main');
    var cur = document.getElementById('main');
    if (!next || !cur) return false;
    if (global.TBPage) global.TBPage.teardown();
    var fresh = document.importNode(next, true);
    cur.replaceWith(fresh);
    document.title = doc.title;
    var md = doc.querySelector('meta[name="description"]');
    var mine = document.querySelector('meta[name="description"]');
    if (md && mine) mine.setAttribute('content', md.getAttribute('content'));
    page = doc.documentElement.getAttribute('data-page') || 'home';
    html.setAttribute('data-page', page);
    scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (global.TBPage) global.TBPage.init(fresh, { intro: true });
    if (global.ScrollTrigger) global.ScrollTrigger.refresh();
    if (hash) {
      var t = document.getElementById(hash.slice(1));
      if (t) t.scrollIntoView({ behavior: 'instant', block: 'start' });
    }
    fresh.focus({ preventScroll: true });
    return true;
  }

  function go(href, push) {
    if (busy) return;
    var mode = MODES[current];
    if (!mode || !mode.router) { location.href = href; return; }
    busy = true;
    var u = new URL(href, location.href);
    load(u.href).then(function (doc) {
      if (!doc.querySelector('main')) throw new Error('no main');
      var from = page;
      var to = doc.documentElement.getAttribute('data-page') || 'home';
      document.querySelectorAll('dialog[open]').forEach(function (d) { d.close(); });
      if (push) history.pushState({ tb: 1 }, '', u.href);
      if (global.TBPage) global.TBPage.holdField(true);
      return contentOut().then(function () {
        var committed = false;
        return mode.run(from, to, function () {
          if (committed) return;
          committed = true;
          commitDoc(doc, u.hash);
          contentIn();
        }).then(function () {
          if (!committed) { commitDoc(doc, u.hash); contentIn(); }
        });
      });
    }).then(function () {
      if (global.TBPage) global.TBPage.holdField(false);
      busy = false;
    }).catch(function () {
      busy = false;
      location.href = u.href;
    });
  }

  document.addEventListener('click', function (e) {
    if (!MODES[current] || !MODES[current].router) return;
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target === '_blank' || a.hasAttribute('download') || a.hasAttribute('data-native')) return;
    var u;
    try { u = new URL(a.getAttribute('href'), location.href); } catch (err) { return; }
    if (!routable(u)) return;
    var here = location.pathname;
    var same = u.pathname === here ||
      (u.pathname === base && /index\.html$/.test(here)) ||
      (here === base && /index\.html$/.test(u.pathname));
    if (same) {
      if (u.hash) return;
      e.preventDefault();
      scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    e.preventDefault();
    go(u.href, true);
  });

  function warm(e) {
    if (!MODES[current] || !MODES[current].router) return;
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var u;
    try { u = new URL(a.getAttribute('href'), location.href); } catch (err) { return; }
    if (routable(u) && u.pathname !== location.pathname) load(u.href).catch(function () {});
  }
  document.addEventListener('pointerenter', warm, true);
  document.addEventListener('focusin', warm);
  document.addEventListener('touchstart', warm, { passive: true });
  addEventListener('popstate', function () { go(location.href, false); });

  /* ---------------------------------------------------------------------------
     Mode selection.
     ------------------------------------------------------------------------- */
  function setMode(id, remember) {
    if (!MODES[id]) id = DEFAULT;
    if (id === current) return;
    if (current && MODES[current].exit) MODES[current].exit();
    current = id;
    html.setAttribute('data-bg', id);
    if (remember !== false) {
      try { sessionStorage.setItem('tb-bg', id); } catch (e) { /* private mode */ }
    }
    if (global.TBPage) {
      global.TBPage.onField(function () { MODES[id].enter(page); });
    }
    /* so a mode set from anywhere but the dropdown still shows up in it */
    dispatchEvent(new CustomEvent('tb-bg-mode', { detail: id }));
  }

  var stored = null;
  try { stored = sessionStorage.getItem('tb-bg'); } catch (e) { /* private mode */ }
  setMode(stored || DEFAULT, false);

  global.TBBg = {
    modes: function () {
      return Object.keys(MODES).map(function (k) {
        return { id: k, label: MODES[k].label, cost: MODES[k].cost, note: MODES[k].note };
      });
    },
    mode: function () { return current; },
    setMode: setMode,
    page: function () { return page; },
    presets: PAGES
  };
})(window);

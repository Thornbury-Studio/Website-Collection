/* Thornbury Digital v5 — js/bg.js
   Navigation between pages, and what the background does while it happens.

   Every page is a real HTML file. Same-directory links are intercepted, fetched,
   and only <main> is swapped, so the canvas is never torn down and the background
   can carry a thought across the navigation instead of blinking out with it.
   Anything unexpected — a cross-origin URL, a modified click, a failed fetch —
   falls straight back to a real navigation.

   Four directions are implemented, plus the hard cut as a control. They differ
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
    if (mode === 'continuum') {
      html.setAttribute('data-field', 'live');
      f.setStill(false);
      return;
    }
    var want = preset(page).field;
    html.setAttribute('data-field', want);
    f.setStill(want === 'still');
  }

  /* ---------------------------------------------------------------------------
     The four directions.
     enter(page)          put the background into this page's resting state
     exit()               undo anything this mode added to the document
     run(from,to,commit)  perform the transition; call commit() to swap <main>
     ------------------------------------------------------------------------- */
  var MODES = {
    off: {
      label: 'OFF — hard cut',
      note: 'Real navigation. The control.',
      router: false,
      enter: function () {},
      exit: function () {}
    },

    continuum: {
      label: 'A · CONTINUUM',
      note: 'One world. The camera travels; nothing resets.',
      router: true,
      enter: function (page) {
        var f = field();
        if (!f) return;
        fieldPolicy(page, 'continuum');
        f.camera(preset(page).cam);
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
          f.world(preset(to).world);
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
      note: 'Procedural tear, no asset. The frozen frame is pulled off the new one.',
      router: true,
      enter: function (page) { MODES.chapters.enter(page); },
      exit: function () { thaw(); },
      run: function (from, to, commit) {
        var f = field();
        var frozen = freeze();
        if (f) {
          wake(f, 0);
          f.world(preset(to).world);
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
      note: 'Video plate. Not qualified — no on-device number. See DESIGN.md.',
      router: true,
      enter: function (page) {
        filmPlate();
        html.classList.add('has-bg-film');
        var f = field();
        if (f) f.setActive(false);
        filmTo(page);
      },
      exit: function () {
        html.classList.remove('has-bg-film');
        if (filmBox) { filmBox.remove(); filmBox = null; }
      },
      run: function (from, to, commit) {
        filmTo(to);
        setTimeout(commit, reduced() ? 0 : 380);
        return delay(reduced() ? 120 : 900).then(function () {
          var f = field();
          if (f) f.setActive(false);   /* nothing is visible behind the plate */
        });
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
        return { id: k, label: MODES[k].label, note: MODES[k].note };
      });
    },
    mode: function () { return current; },
    setMode: setMode,
    page: function () { return page; },
    presets: PAGES
  };
})(window);

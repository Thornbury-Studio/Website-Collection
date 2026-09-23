/* UNFURL. — the stage: the first steep, scrubbed by scroll.

   The picture is a real film (Adobe Stock 737291599, loose leaf opening in a
   glass teapot), cut by tools/film.py into 160 graded frames and drawn to a
   2D canvas — Apple's product-page technique: ScrollTrigger pins the stage and
   maps scroll to a frame; the canvas draws that frame, cross-fading into the
   next so slow scrolls stay smooth. The readouts are js/steep-model.js's
   cupping notes for the same instant.

   Discipline:
   - backing store capped at 1.5x device pixels; three frame sets — 720x1280
     portrait on phones, 1440 or 2048 wide landscape on desktop, by backing width;
   - draws only when the stage is on screen and the frame has changed;
   - frames load coarse-to-fine (every 32nd, 16th … 1st), nearest-first around
     wherever the reader is;
   - prefers-reduced-motion (or no GSAP): no pin, no scrub. The stage is a still
     at the pour, and the slider steps through the notes, swapping still frames;
   - the 2D context can be lost and restored (GPU reset, backgrounded tab):
     both events are handled, and a restore redraws. */

(function () {
  'use strict';

  var S = window.STEEP, F = window.FILM;
  var stage = document.querySelector('[data-stage]');
  if (!stage || !S || !F) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  var scrub = !reduced && hasGsap;

  var T = S.STAGE.seconds, N = F.n;
  var q = function (sel) { return stage.querySelector(sel); };
  var canvas = q('[data-film]'), still = q('[data-still]'), column = q('[data-column]');
  // the <picture> source is only for no-script phones; script picks its own set
  var pictureSource = column.querySelector('source');

  function pickSet() {
    if (window.innerWidth < 900) return 's';
    return window.innerWidth * Math.min(window.devicePixelRatio || 1, 1.5) > 1500 ? 'xl' : 'l';
  }
  function showStill(setName, i) {
    if (pictureSource) { pictureSource.remove(); pictureSource = null; }
    if (still) still.src = 'film/' + setName + '/' + pad3(i) + '.webp';
  }
  var out = {
    clock: q('[data-clock]'), liquor: q('[data-liquor]'), head: q('[data-head]'), note: q('[data-note]'),
    summary: q('[data-summary]'), fill: q('[data-fill]'), word: q('[data-word]'), input: q('#steep-t')
  };
  var ticks = stage.querySelectorAll('[data-ticks] li[data-i]');
  var logItems = document.querySelectorAll('[data-log] li');

  var t = T, shownSec = -1, shownMark = -1;
  function pad3(i) { return ('00' + i).slice(-3); }
  var frameAt = function (s) { return s / T * (N - 1); };

  /* ---- readouts: every number here comes from the model ----------------- */

  function readouts(nt, announce) {
    t = Math.max(0, Math.min(T, nt));
    var sec = Math.round(t);
    if (sec !== shownSec) {
      shownSec = sec;
      out.clock.textContent = S.clock(sec);
      if (out.input && document.activeElement !== out.input) out.input.value = String(sec);
      if (out.input) out.input.setAttribute('aria-valuetext', S.clock(sec));
    }
    var m = S.markAt(t);
    if (m !== shownMark) {
      shownMark = m;
      var mk = S.MARKS[m];
      out.liquor.textContent = mk.liquor;
      out.head.textContent = mk.head;
      out.note.textContent = mk.note;
      // the live region speaks once per note, not once per second
      if (announce !== false) out.summary.textContent = S.summary(mk.t);
      for (var i = 0; i < ticks.length; i++) ticks[i].classList.toggle('is-past', i <= m);
      for (var j = 0; j < logItems.length; j++) logItems[j].classList.toggle('is-now', j === m);
    }
    var p = t / T;
    out.fill.style.setProperty('--p', p.toFixed(4));
    stage.classList.toggle('is-steeping', t > 4);
  }

  /* ---- the word opens with the leaf ------------------------------------ */

  // the size and width live on the stage, so the silhouette copy of the word
  // (multiplied into the film where the pot stands in front) follows exactly
  var WMIN = 62, WMAX = 125;
  function fitWord() {
    var w = out.word;
    if (!w) return;
    stage.style.removeProperty('--word-size');
    stage.style.setProperty('--wdth', WMAX);
    // full width on phones; on desktop the open word takes 70% and leaves the
    // top right for the lede
    var target = window.innerWidth * (window.innerWidth < 900 ? 0.92 : 0.7);
    var width = w.getBoundingClientRect().width;
    if (width > 0) {
      var size = parseFloat(getComputedStyle(w).fontSize) * target / width;
      stage.style.setProperty('--word-size', size.toFixed(2) + 'px');
      stage.style.setProperty('--word-h', Math.ceil(w.getBoundingClientRect().height + 14) + 'px');
    }
    stretch();
  }
  function stretch() {
    stage.style.setProperty('--wdth', (WMIN + (WMAX - WMIN) * (t / T)).toFixed(2));
  }

  /* ---- still mode: reduced motion, or GSAP failed to load --------------- */

  if (!scrub) {
    stage.classList.add('is-still');
    readouts(T, false);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitWord); else fitWord();
    window.addEventListener('resize', fitWord);
    var setName = pickSet();
    var swap;
    if (out.input) out.input.addEventListener('input', function () {
      var v = +out.input.value;
      readouts(v);
      stretch();
      clearTimeout(swap);
      swap = setTimeout(function () {
        showStill(setName, Math.round(frameAt(v)));
      }, 60);
    });
    window.__stage = { mode: 'still', t: function () { return t; } };
    return;
  }

  /* ---- scrub mode --------------------------------------------------------- */

  var ctx = canvas.getContext('2d', { alpha: false });
  var ctxOK = !!ctx;
  var dpr = 1, cw = 0, ch = 0, set = 'l';
  var imgs = new Array(N), ready = new Uint8Array(N);
  var queue = [], inflight = 0, MAXFLIGHT = 6, gen = 0;
  var visible = true, drawn = -1, drawPending = false;

  var chooseSet = pickSet;

  function size() {
    var r = column.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    cw = Math.max(1, Math.round(r.width * dpr));
    ch = Math.max(1, Math.round(r.height * dpr));
    if (canvas.width !== cw || canvas.height !== ch) { canvas.width = cw; canvas.height = ch; }
    drawn = -1;
  }

  function pump() {
    while (inflight < MAXFLIGHT && queue.length) {
      var i = queue.shift();
      if (imgs[i]) continue;
      inflight++;
      (function (i, g) {
        var im = new Image();
        im.decoding = 'async';
        imgs[i] = im;
        var done = function (ok) {
          inflight--;
          if (g !== gen) { pump(); return; }   // a set we've since left
          if (ok) {
            ready[i] = 1;
            var f = frameAt(t);
            if (Math.abs(i - f) < 34) request();
          }
          pump();
        };
        im.onload = function () {
          if (im.decode) im.decode().then(function () { done(true); }, function () { done(true); });
          else done(true);
        };
        im.onerror = function () { if (g === gen) imgs[i] = null; done(false); };
        im.src = 'film/' + set + '/' + pad3(i) + '.webp';
      })(i, gen);
    }
  }

  function plan() {
    var order = [], seen = new Uint8Array(N);
    [32, 16, 8, 4, 2, 1].forEach(function (s) {
      for (var i = 0; i < N; i += s) if (!seen[i]) { seen[i] = 1; order.push(i); }
    });
    if (!seen[N - 1]) order.push(N - 1);
    queue = order;
    pump();
  }

  // pull the frames around the reader to the front of the queue
  function prioritise(f) {
    var c = Math.round(f), near = [];
    for (var d = 0; d <= 10; d++) {
      if (c + d < N && !imgs[c + d]) near.push(c + d);
      if (d && c - d >= 0 && !imgs[c - d]) near.push(c - d);
    }
    if (near.length) { queue = near.concat(queue.filter(function (i) { return near.indexOf(i) < 0; })); pump(); }
  }

  function nearestReady(i) {
    for (var d = 0; d < N; d++) {
      if (i - d >= 0 && ready[i - d]) return i - d;
      if (i + d < N && ready[i + d]) return i + d;
    }
    return -1;
  }

  function cover(im, alpha) {
    var iw = im.naturalWidth, ih = im.naturalHeight;
    if (!iw || !ih) return;
    var s = Math.max(cw / iw, ch / ih), w = iw * s, h = ih * s;
    ctx.globalAlpha = alpha;
    ctx.drawImage(im, (cw - w) / 2, (ch - h) / 2, w, h);
  }

  function draw() {
    drawPending = false;
    if (!visible || !ctxOK) return;
    var f = frameAt(t);
    if (Math.abs(f - drawn) < 0.02) return;
    var a = Math.floor(f), b = Math.min(N - 1, a + 1), k = f - a;
    var A = ready[a] ? a : nearestReady(a);
    if (A < 0) return;
    cover(imgs[A], 1);
    if (A === a && k > 0.03 && ready[b]) cover(imgs[b], k);
    ctx.globalAlpha = 1;
    drawn = A === a ? f : -1;
    if (!stage.classList.contains('is-film')) stage.classList.add('is-film');
  }
  function request() {
    if (!drawPending) { drawPending = true; requestAnimationFrame(draw); }
  }

  canvas.addEventListener('contextlost', function (e) { e.preventDefault(); ctxOK = false; stage.classList.remove('is-film'); });
  canvas.addEventListener('contextrestored', function () { ctxOK = true; size(); request(); });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      visible = es[0].isIntersecting;
      if (visible) { drawn = -1; request(); }
    }, { rootMargin: '10% 0px' }).observe(stage);
  }

  // start at the water going in
  set = chooseSet();
  showStill(set, 0);
  size();
  readouts(0, false);
  out.summary.textContent = S.summary(0);
  plan();

  gsap.registerPlugin(ScrollTrigger);
  var proxy = { p: 0 };
  var HOLD = 0.035;
  var tween = gsap.to(proxy, {
    p: 1, ease: 'none',
    scrollTrigger: {
      trigger: stage, start: 'top top', end: function () { return '+=' + Math.round(window.innerHeight * 3.4); },
      pin: stage.querySelector('.stage-pin'), scrub: 0.45, anticipatePin: 1, invalidateOnRefresh: true
    },
    onUpdate: function () {
      var p = Math.max(0, Math.min(1, (proxy.p - HOLD) / (1 - 2 * HOLD)));
      readouts(p * T);
      stretch();
      prioritise(frameAt(t));
      request();
    }
  });
  var st = tween.scrollTrigger;

  // the slider drives the scroll, so the page and the pot never disagree
  if (out.input) out.input.addEventListener('input', function () {
    var v = +out.input.value / T;
    var p = HOLD + v * (1 - 2 * HOLD);
    var y = st.start + p * (st.end - st.start);
    if (window.lenis) window.lenis.scrollTo(y, { duration: 0.5 });
    else window.scrollTo(0, y);
  });

  function onResize() {
    var s2 = chooseSet();
    size();
    fitWord();
    if (s2 !== set) {
      // crossed a breakpoint (phone <-> desktop, or into the big set): reload that set
      set = s2; gen++; imgs = new Array(N); ready = new Uint8Array(N); queue = []; drawn = -1;
      showStill(set, Math.round(frameAt(t))); stage.classList.remove('is-film'); plan();
    }
    request();
  }
  var rz;
  window.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(onResize, 120); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { fitWord(); ScrollTrigger.refresh(); });
  fitWord();
  request();

  window.__stage = {
    mode: 'scrub',
    t: function () { return t; },
    loaded: function () { var n = 0; for (var i = 0; i < N; i++) n += ready[i]; return n; },
    set: function () { return set; },
    st: function () { return { start: st.start, end: st.end }; },
    backing: function () { return [canvas.width, canvas.height, dpr]; }
  };
})();

/* HARLOWE — shared chrome and the bell voice.
   Every bell on this site is synthesized from the five true-harmonic
   partials (hum ½f, prime f, tierce 1.2f, quint 1.5f, nominal 2f); nothing
   chimes from a file. The size model is calibrated against real founders'
   data: strike-frequency × diameter ≈ 470 Hz·m, and weight follows the
   Hibberts bronze regression w ≈ 0.715 · nominal · d⁴. */
(function () {
  'use strict';
  document.documentElement.classList.remove('no-js');
  document.documentElement.classList.add('js-anim');

  var U = window.HB = {
    reduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    clamp: function (v, a, b) { return v < a ? a : v > b ? b : v; }
  };

  /* ---------- the physics model (single source of every number) ---------- */

  var NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  U.model = {
    freqOf: function (name, octave) { // strike/prime frequency, A4 = 440
      var i = NOTE_NAMES.indexOf(name);
      var semisFromA4 = (octave - 4) * 12 + (i - 9);
      return 440 * Math.pow(2, semisFromA4 / 12);
    },
    specOf: function (f) {
      var d = 470 / f;                       // m
      var w = 0.715 * (2 * f) * Math.pow(d, 4); // kg
      var price = 2600 + 58 * w;             // GBP guide
      return {
        f: f,
        nominal: 2 * f, hum: f / 2, tierce: 1.2 * f, quint: 1.5 * f,
        d: d, w: w,
        cwt: w / 50.802,
        priceLo: price * 0.92, priceHi: price * 1.08,
        weeks: U.clamp(Math.round(14 + w / 120), 14, 44)
      };
    },
    fmt: {
      mm: function (d) { return d < 1 ? Math.round(d * 1000) + ' mm' : d.toFixed(2).replace('.', '·') + ' m'; },
      kg: function (w) {
        return w < 100 ? w.toFixed(1) + ' kg'
          : Math.round(w).toLocaleString('en-GB') + ' kg';
      },
      cwt: function (c) { return c < 1 ? c.toFixed(1) + ' cwt' : Math.round(c) + ' cwt'; },
      hz: function (f) { return f < 100 ? f.toFixed(1) + ' Hz' : Math.round(f) + ' Hz'; },
      gbp: function (v) {
        var r = v > 20000 ? 1000 : 100;
        return '£' + (Math.round(v / r) * r).toLocaleString('en-GB');
      }
    }
  };

  /* ---------- the bell voice ---------- */

  var A = { ctx: null, comp: null, voices: 0 };

  function ctx() {
    if (A.ctx) return A.ctx;
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    A.ctx = new Ctx();
    A.comp = A.ctx.createDynamicsCompressor();
    A.comp.threshold.value = -18;
    A.comp.ratio.value = 6;
    A.comp.connect(A.ctx.destination);
    return A.ctx;
  }

  /* One strike = five doublet partials + upper work + a strike transient.
     Decays scale with bell size: the deeper the bell, the longer the hum. */
  U.strike = function (f, opts) {
    opts = opts || {};
    var c = ctx();
    if (!c) return;
    if (c.state === 'suspended') c.resume();
    if (A.voices > 8) return; // voice cap: never a wall of sound
    var t = c.currentTime + 0.01;
    var gain = opts.gain || 0.5;
    var sizeT = U.clamp(330 / f, 0.4, 2.6); // decay multiplier by size

    var master = c.createGain();
    master.gain.value = gain;
    master.connect(A.comp);

    // partial table: [ratio to prime, level, decay seconds at size 1]
    var partials = opts.solo ? [opts.solo] : [
      [0.5,  0.42, 11.0],  // hum — outlasts everything
      [1.0,  0.34, 6.0],   // prime
      [1.2,  0.48, 4.6],   // tierce — the bell's melancholy
      [1.5,  0.20, 3.2],   // quint
      [2.0,  1.00, 2.6],   // nominal — the strike pitch you name
      [2.99, 0.24, 1.1],   // superquint
      [4.02, 0.12, 0.7]    // octave nominal
    ];

    var maxT = 0;
    partials.forEach(function (p) {
      var decay = p[2] * sizeT;
      maxT = Math.max(maxT, decay);
      // doublet: two sines a few cents apart — the slow beat of a real casting
      [-1, 1].forEach(function (side) {
        var o = c.createOscillator(), g = c.createGain();
        var cents = side * (0.7 + Math.random() * 0.9);
        o.frequency.value = f * p[0] * Math.pow(2, cents / 1200);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(p[1] * 0.5 * (0.92 + Math.random() * 0.16), t + 0.012);
        g.gain.setTargetAtTime(0.0001, t + 0.05, decay / 4);
        o.connect(g); g.connect(master);
        o.start(t); o.stop(t + decay + 1);
      });
    });

    // strike transient: a breath of filtered noise — the clapper itself
    var len = Math.floor(c.sampleRate * 0.06);
    var buf = c.createBuffer(1, len, c.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    var src = c.createBufferSource(); src.buffer = buf;
    var bp = c.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = U.clamp(f * 3, 400, 6000); bp.Q.value = 1.1;
    var ng = c.createGain(); ng.gain.value = 0.5;
    src.connect(bp); bp.connect(ng); ng.connect(master);
    src.start(t);

    A.voices++;
    setTimeout(function () { A.voices--; }, Math.min(maxT, 12) * 1000);
  };

  /* ---------- ring ripples (annular rings from the strike point) ---------- */

  U.ripple = function (host, x, y) {
    if (U.reduced) return;
    var svg = host.querySelector('.ripples');
    if (!svg) return;
    var box = host.getBoundingClientRect();
    var r = Math.max(box.width, box.height) * 0.9;
    for (var i = 0; i < 3; i++) {
      (function (i) {
        setTimeout(function () {
          var cNS = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          cNS.setAttribute('cx', x); cNS.setAttribute('cy', y); cNS.setAttribute('r', r);
          cNS.style.transformOrigin = x + 'px ' + y + 'px';
          svg.appendChild(cNS);
          // force layout so the animation class lands as a fresh instance
          void cNS.getBBox();
          cNS.classList.add('go');
          setTimeout(function () { if (cNS.parentNode) cNS.parentNode.removeChild(cNS); }, 2000);
        }, i * 140);
      })(i);
    }
  };

  /* wire anything with [data-strike] — a note name like "D4" or a raw Hz value */
  U.wireStrikes = function (root) {
    (root || document).querySelectorAll('[data-strike]').forEach(function (el) {
      if (el.__struck) return;
      el.__struck = true;
      el.addEventListener('click', function (ev) {
        var v = el.getAttribute('data-strike');
        var f = /^[\d.]+$/.test(v) ? parseFloat(v)
          : U.model.freqOf(v.replace(/[0-9]/g, ''), parseInt(v.replace(/[^\d]/g, ''), 10));
        U.strike(f, { gain: parseFloat(el.getAttribute('data-gain') || '0.5') });
        var box = el.getBoundingClientRect();
        var x = (ev.clientX || box.left + box.width / 2) - box.left;
        var y = (ev.clientY || box.top + box.height / 2) - box.top;
        U.ripple(el, x, y);
      });
    });
  };

  /* ---------- sound toggle (ambient policy only; strikes are gestures) ---------- */

  var KEY = 'harlowe.sound.v1';
  U.soundOn = function () { try { return localStorage.getItem(KEY) === 'on'; } catch (e) { return false; } };
  U.setSound = function (v) {
    try { localStorage.setItem(KEY, v ? 'on' : 'off'); } catch (e) { /* private mode */ }
    paintSnd();
  };
  function paintSnd() {
    document.querySelectorAll('.snd').forEach(function (b) {
      b.setAttribute('aria-pressed', U.soundOn() ? 'true' : 'false');
      var s = b.querySelector('.snd-label');
      if (s) s.textContent = U.soundOn() ? 'Bells on' : 'Bells off';
    });
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('.snd');
    if (!b) return;
    U.setSound(!U.soundOn());
    if (U.soundOn()) U.strike(U.model.freqOf('D', 5), { gain: 0.25 });
  });
  paintSnd();

  /* ---------- reveals (gated, failsafe, rescannable) ---------- */

  var seen = false;
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { seen = true; en.target.classList.add('is-in'); io.unobserve(en.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }) : null;

  U.rescanReveals = function (root) {
    var els = (root || document).querySelectorAll('.reveal:not(.is-in), .cool:not(.is-in)');
    if (!io) { els.forEach(function (el) { el.classList.add('is-in'); }); return; }
    els.forEach(function (el) { io.observe(el); });
  };
  U.rescanReveals();

  // Backstop sweep: IO is the elegant path, but if it stalls or misses an
  // element (anchor jump, programmatic scroll, injected markup), anything
  // actually inside the viewport gets revealed anyway. Blank space is the
  // one failure this system is not allowed to have.
  function sweep() {
    var els = document.querySelectorAll('.reveal:not(.is-in), .cool:not(.is-in)');
    if (!els.length) return;
    var vh = window.innerHeight;
    els.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < vh + 80 && r.bottom > -80) el.classList.add('is-in');
    });
  }
  var sweepQueued = false;
  function queueSweep() {
    if (sweepQueued) return;
    sweepQueued = true;
    setTimeout(function () { sweepQueued = false; sweep(); }, 120);
  }
  window.addEventListener('scroll', queueSweep, { passive: true });
  window.addEventListener('resize', queueSweep);
  window.addEventListener('hashchange', queueSweep);

  // failsafe: if the observer never fires at all, show everything
  setTimeout(function () {
    if (!seen) document.querySelectorAll('.reveal, .cool').forEach(function (el) { el.classList.add('is-in'); });
    else sweep();
  }, 1600);

  /* ---------- topbar: submerge on scroll down, surface on scroll up ---------- */

  var bar = document.querySelector('.topbar');
  if (bar) {
    var lastY = 0;
    window.addEventListener('scroll', function () {
      var y = window.scrollY;
      bar.classList.toggle('settled', y > 40);
      if (y > 260 && y > lastY + 4) bar.classList.add('gone');
      else if (y < lastY - 4 || y < 260) bar.classList.remove('gone');
      lastY = y;
    }, { passive: true });
  }

  /* ---------- true-loop marquee (PATTERNS.md) ---------- */

  U.trueLoopMarquee = function (track, secondsPerCopy) {
    if (!track || !track.firstElementChild) return;
    var master = track.firstElementChild.cloneNode(true);
    var timer;
    function build() {
      track.style.animationName = 'none';
      while (track.children.length > 1) track.removeChild(track.lastElementChild);
      var rowW = track.firstElementChild.getBoundingClientRect().width;
      var boxW = (track.parentElement || document.body).getBoundingClientRect().width;
      if (rowW < 1) { track.style.animationName = ''; return; }
      var perHalf = Math.max(1, Math.ceil(boxW / rowW));
      for (var i = 1; i < perHalf * 2; i++) {
        var copy = master.cloneNode(true);
        copy.setAttribute('aria-hidden', 'true');
        track.appendChild(copy);
      }
      track.style.animationDuration = (secondsPerCopy * perHalf) + 's';
      void track.offsetWidth; // commit animation-name:none before reattaching
      track.style.animationName = '';
    }
    build();
    window.addEventListener('resize', function () {
      clearTimeout(timer);
      timer = setTimeout(build, 200);
    });
  };
  document.querySelectorAll('.band').forEach(function (b) { U.trueLoopMarquee(b, 46); });

  /* ---------- video: play in view, pause out of view ---------- */

  var vio = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      var v = en.target;
      if (U.reduced) { v.pause(); return; }
      if (en.isIntersecting) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
      else v.pause();
    });
  }, { rootMargin: '120px 0px' }) : null;
  if (vio) document.querySelectorAll('video[data-io]').forEach(function (v) { vio.observe(v); });
  else document.querySelectorAll('video[data-io]').forEach(function (v) { var p = v.play(); if (p && p.catch) p.catch(function () {}); });

  U.wireStrikes();
}());

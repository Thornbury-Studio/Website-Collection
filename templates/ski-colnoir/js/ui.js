/* COL NOIR — shared chrome: wind audio engine, sound toggle, reveals.
   The wind you hear is the wind the model reports: ambience gain follows
   today's wind speed, and a howl layer fades in above ~55 km/h. */
(function () {
  'use strict';
  document.documentElement.classList.remove('no-js');

  var U = window.CNUI = {
    clamp: function (v, a, b) { return v < a ? a : v > b ? b : v; },
    reduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches
  };

  var KEY = 'colnoir.sound.v1';
  var A = { ctx: null, ready: false, loading: false, master: null, windGain: null, howlGain: null };

  function on() { try { return localStorage.getItem(KEY) === 'on'; } catch (e) { return false; } }
  U.soundOn = on;

  function loadBuf(ctx, url) {
    return fetch(url).then(function (r) { return r.arrayBuffer(); }).then(function (ab) {
      return new Promise(function (res, rej) { ctx.decodeAudioData(ab, res, rej); });
    });
  }

  function start() {
    if (A.ready || A.loading) return;
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    A.loading = true;
    var ctx = A.ctx = new Ctx();
    A.master = ctx.createGain(); A.master.gain.value = 0;
    A.master.connect(ctx.destination);
    A.windGain = ctx.createGain(); A.windGain.connect(A.master);
    A.howlGain = ctx.createGain(); A.howlGain.gain.value = 0; A.howlGain.connect(A.master);
    Promise.all([loadBuf(ctx, 'audio/wind-loop.mp3'), loadBuf(ctx, 'audio/wind-howl.mp3')])
      .then(function (bufs) {
        [[bufs[0], A.windGain], [bufs[1], A.howlGain]].forEach(function (pair) {
          var s = ctx.createBufferSource();
          s.buffer = pair[0]; s.loop = true;
          s.loopStart = 0.25; s.loopEnd = pair[0].duration - 0.25;
          s.connect(pair[1]); s.start(0, 0.25);
        });
        A.ready = true; A.loading = false;
        applyWind();
        A.master.gain.setTargetAtTime(0.85, ctx.currentTime, 1.0);
      }).catch(function () { A.loading = false; });
  }

  var windKph = 20;
  U.setWind = function (k) { windKph = k; applyWind(); };
  function applyWind() {
    if (!A.ready) return;
    var t = A.ctx.currentTime;
    A.windGain.gain.setTargetAtTime(0.25 + U.clamp(windKph / 90, 0, 1) * 0.6, t, 0.8);
    A.howlGain.gain.setTargetAtTime(windKph > 55 ? U.clamp((windKph - 55) / 30, 0, 1) * 0.5 : 0, t, 1.2);
  }

  /* short gate beep — the turnstile's chirp, synthesized */
  U.beep = function () {
    if (!A.ready || !on()) return;
    var ctx = A.ctx, t = ctx.currentTime;
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'square'; o.frequency.setValueAtTime(1660, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.05, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    o.connect(g); g.connect(A.master);
    o.start(t); o.stop(t + 0.2);
  };

  var toggles = [];
  function paint() {
    toggles.forEach(function (b) {
      b.setAttribute('aria-pressed', on() ? 'true' : 'false');
      var s = b.querySelector('.snd-label');
      if (s) s.textContent = on() ? 'Wind on' : 'Wind off';
    });
  }
  U.setSound = function (v) {
    try { localStorage.setItem(KEY, v ? 'on' : 'off'); } catch (e) { /* private mode */ }
    if (v) {
      start();
      if (A.ctx && A.ctx.state === 'suspended') A.ctx.resume();
      if (A.ready) A.master.gain.setTargetAtTime(0.85, A.ctx.currentTime, 0.5);
    } else if (A.ready) {
      A.master.gain.setTargetAtTime(0, A.ctx.currentTime, 0.25);
    }
    paint();
  };
  Array.prototype.forEach.call(document.querySelectorAll('.snd'), function (b) {
    toggles.push(b);
    b.addEventListener('click', function () { U.setSound(!on()); });
  });
  paint();
  if (on()) {
    var resume = function () { U.setSound(true); };
    window.addEventListener('pointerdown', resume, { once: true });
    window.addEventListener('keydown', resume, { once: true });
  }

  /* reveals */
  U.rise = function () {
    var els = document.querySelectorAll('.rise');
    if (!('IntersectionObserver' in window) || U.reduced) {
      Array.prototype.forEach.call(els, function (el) { el.classList.add('lit'); });
      return;
    }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('lit'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.04 });
    Array.prototype.forEach.call(els, function (el) { io.observe(el); });
    setTimeout(function () {
      Array.prototype.forEach.call(els, function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('lit');
      });
    }, 1800);
  };

  /* lazy station video helper */
  U.video = function (root) {
    var vids = (root || document).querySelectorAll('video[data-src]');
    function load(v) {
      if (v.dataset.loaded) return;
      v.dataset.loaded = '1';
      v.src = v.getAttribute('data-src');
      v.load();
    }
    if (!('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(vids, load);
      return;
    }
    var lio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) load(e.target); });
    }, { rootMargin: '70% 0px 70% 0px' });
    var pio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting) {
          load(v);
          if (!U.reduced) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
        } else v.pause();
      });
    }, { threshold: 0.12 });
    Array.prototype.forEach.call(vids, function (v) { lio.observe(v); pio.observe(v); });
  };
})();

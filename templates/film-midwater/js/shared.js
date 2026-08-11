/* MIDWATER shared layer: audio engine + sound toggle + small utilities.
   Zero dependencies. The ambience graph is two looped buffers (surface waves,
   deep water) crossfaded by depth through one lowpass — the sea audibly
   thickens as the page sinks. */
(function () {
  'use strict';

  document.documentElement.classList.remove('no-js');

  var MW = window.MW = {
    clamp: function (v, a, b) { return v < a ? a : v > b ? b : v; },
    lerp: function (a, b, t) { return a + (b - a) * t; },
    prefersReduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches
  };

  /* ---------- audio ---------- */
  var SOUND_KEY = 'midwater.sound.v1';
  var audio = {
    ctx: null, ready: false, loading: false,
    master: null, lowpass: null,
    waves: null, deep: null, wavesGain: null, deepGain: null,
    depth: 0
  };
  MW.audio = audio;

  function loadBuffer(ctx, url) {
    return fetch(url)
      .then(function (r) { return r.arrayBuffer(); })
      .then(function (ab) {
        return new Promise(function (res, rej) { ctx.decodeAudioData(ab, res, rej); });
      });
  }

  function startGraph() {
    if (audio.ready || audio.loading) return;
    audio.loading = true;
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) { audio.loading = false; return; }
    var ctx = audio.ctx = new Ctx();

    audio.master = ctx.createGain();
    audio.master.gain.value = 0;
    audio.lowpass = ctx.createBiquadFilter();
    audio.lowpass.type = 'lowpass';
    audio.lowpass.frequency.value = 9000;
    audio.lowpass.Q.value = 0.4;
    audio.lowpass.connect(audio.master);
    audio.master.connect(ctx.destination);

    audio.wavesGain = ctx.createGain();
    audio.deepGain = ctx.createGain();
    audio.wavesGain.connect(audio.lowpass);
    audio.deepGain.connect(audio.lowpass);

    Promise.all([
      loadBuffer(ctx, 'audio/amb-waves.mp3'),
      loadBuffer(ctx, 'audio/amb-deep.mp3')
    ]).then(function (bufs) {
      var mk = function (buf, gainNode) {
        var src = ctx.createBufferSource();
        src.buffer = buf;
        src.loop = true;
        /* trim encoder padding so the loop point is clean */
        src.loopStart = 0.25;
        src.loopEnd = buf.duration - 0.25;
        src.connect(gainNode);
        src.start(0, 0.25);
        return src;
      };
      audio.waves = mk(bufs[0], audio.wavesGain);
      audio.deep = mk(bufs[1], audio.deepGain);
      audio.ready = true;
      audio.loading = false;
      audio.master.gain.setTargetAtTime(0.9, ctx.currentTime, 1.2);
      MW.setAudioDepth(audio.depth, true);
    }).catch(function () { audio.loading = false; });
  }

  /* depth in metres drives the mix: waves fade out by ~26 m, the lowpass
     closes from 9 kHz at the surface to ~240 Hz in the lantern town. */
  MW.setAudioDepth = function (d, force) {
    audio.depth = d;
    if (!audio.ready) return;
    if (!force && Math.abs(d - (audio._last || 0)) < 0.5) return;
    audio._last = d;
    var t = audio.ctx.currentTime;
    var surf = 1 - MW.clamp(d / 26, 0, 1);
    var deep = MW.clamp(d / 60, 0.12, 1);
    audio.wavesGain.gain.setTargetAtTime(0.75 * surf * surf, t, 0.4);
    audio.deepGain.gain.setTargetAtTime(0.65 * deep, t, 0.4);
    var f = 9000 * Math.exp(-d / 180) + 240;
    audio.lowpass.frequency.setTargetAtTime(f, t, 0.5);
  };

  /* one short sonar ping — synthesized, no file */
  MW.ping = function () {
    if (!audio.ready || !soundOn()) return;
    var ctx = audio.ctx, t = ctx.currentTime;
    var osc = ctx.createOscillator();
    var g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1240, t);
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.22);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.06, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    osc.connect(g); g.connect(audio.lowpass);
    osc.start(t); osc.stop(t + 0.55);
  };

  function soundOn() {
    try { return localStorage.getItem(SOUND_KEY) === 'on'; } catch (e) { return false; }
  }
  MW.soundOn = soundOn;

  var toggles = [];
  function paintToggles() {
    var on = soundOn();
    toggles.forEach(function (btn) {
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      var label = btn.querySelector('.sound-label');
      if (label) label.textContent = on ? 'Sound on' : 'Sound off';
    });
  }

  MW.setSound = function (on) {
    try { localStorage.setItem(SOUND_KEY, on ? 'on' : 'off'); } catch (e) { /* private mode */ }
    if (on) {
      startGraph();
      if (audio.ctx && audio.ctx.state === 'suspended') audio.ctx.resume();
      if (audio.ready) audio.master.gain.setTargetAtTime(0.9, audio.ctx.currentTime, 0.6);
    } else if (audio.ready) {
      audio.master.gain.setTargetAtTime(0, audio.ctx.currentTime, 0.3);
    }
    paintToggles();
  };

  MW.bindSoundToggle = function (btn) {
    if (!btn) return;
    toggles.push(btn);
    btn.addEventListener('click', function () { MW.setSound(!soundOn()); });
  };

  MW.bindSoundToggle(document.getElementById('soundToggle'));
  paintToggles();

  /* a previous visit chose sound: resume on the first gesture the browser
     will accept, instead of asking again */
  if (soundOn()) {
    var resume = function () {
      MW.setSound(true);
      window.removeEventListener('pointerdown', resume);
      window.removeEventListener('keydown', resume);
    };
    window.addEventListener('pointerdown', resume, { once: true });
    window.addEventListener('keydown', resume, { once: true });
  }

  /* ---------- topbar submerges on the way down, surfaces on the way up ---------- */
  (function () {
    var bar = document.querySelector('.topbar');
    if (!bar) return;
    var last = window.scrollY, ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var y = window.scrollY;
        if (y < 140) bar.classList.remove('dived');
        else if (y > last + 4) bar.classList.add('dived');
        else if (y < last - 4) bar.classList.remove('dived');
        last = y;
        ticking = false;
      });
    }, { passive: true });
  })();

  /* ---------- reveal helper for subpages ---------- */
  MW.observeRise = function (root) {
    var els = (root || document).querySelectorAll('.rise');
    if (!('IntersectionObserver' in window) || MW.prefersReduced) {
      els.forEach ? els.forEach(function (el) { el.classList.add('lit'); }) : null;
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('lit'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    Array.prototype.forEach.call(els, function (el) { io.observe(el); });
    /* backgrounded-tab guard: rAF and IO may never fire there */
    setTimeout(function () {
      Array.prototype.forEach.call(els, function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('lit');
      });
    }, 1800);
  };
})();

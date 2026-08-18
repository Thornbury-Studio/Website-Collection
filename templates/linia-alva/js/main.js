/* ============================================================================
   LINIA ALVA — the transmission engine.
   One rAF drives everything: scroll -> km -> HUD, cyclorama cue, tunnel dark.
   The real clock drives the LIVE train. Zero dependencies.
   ============================================================================ */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------------- the line: one source of truth ---------------- */
  var LINE_KM = 41.8;
  // elevation anchors [km, altitude m]
  var PROFILE = [
    [0, 988], [7.4, 1247], [12, 1360], [16.2, 1571], [19, 1680],
    [23.1, 1845], [27, 1990], [31.6, 2091], [36, 2160], [41.8, 2236]
  ];
  var STATIONS = [
    { km: 0, name: 'Tarven' },
    { km: 7.4, name: 'Punt Suot' },
    { km: 16.2, name: 'Punt Alva' },
    { km: 31.6, name: 'Plaun Alv' },
    { km: 41.8, name: 'Alvagrat' }
  ];
  var TUNNEL = [19.0, 23.1];

  // winter timetable, minutes after midnight; journey 96 min
  var UP = [432, 587, 782, 991];      // 07:12 09:47 13:02 16:31 from Tarven
  var DOWN = [538, 693, 888, 1097];   // 08:58 11:33 14:48 18:17 from Alvagrat
  var DUR = 96;

  function altAt(km) {
    if (km <= 0) return PROFILE[0][1];
    for (var i = 1; i < PROFILE.length; i++) {
      if (km <= PROFILE[i][0]) {
        var a = PROFILE[i - 1], b = PROFILE[i];
        var t = (km - a[0]) / (b[0] - a[0]);
        return a[1] + (b[1] - a[1]) * t;
      }
    }
    return PROFILE[PROFILE.length - 1][1];
  }
  function tempAt(alt) {
    // valley reference −5 °C on a January day, standard lapse 6.5 °C/km
    return Math.round(-5 - (alt - 988) * 6.5 / 1000);
  }
  function fmtTime(mins) {
    var h = Math.floor(mins / 60) % 24, m = Math.round(mins % 60);
    return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
  }
  function nowMins() { var d = new Date(); return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60; }

  function segmentName(km) {
    if (km <= 0.3) return 'at Tarven';
    if (km < 7.4) return 'climbing above Tarven';
    if (km < 8) return 'calling at Punt Suot';
    if (km < 15.8) return 'in the Bualetsch woods';
    if (km < 17) return 'crossing Punt Alva';
    if (km < TUNNEL[0]) return 'on the upper ledges';
    if (km < TUNNEL[1]) return 'in Tunnel dal Corv';
    if (km < 31.2) return 'crossing Plaun Alv';
    if (km < 32.2) return 'calling at Plaun Alv';
    if (km < 41.4) return 'on the ridge line';
    return 'at Alvagrat';
  }

  /* live train position from the real clock; null when line asleep */
  function liveTrain() {
    var n = nowMins(), i, p;
    for (i = 0; i < UP.length; i++) {
      p = (n - UP[i]) / DUR;
      if (p >= 0 && p <= 1) return { km: p * LINE_KM, dir: 'up' };
    }
    for (i = 0; i < DOWN.length; i++) {
      p = (n - DOWN[i]) / DUR;
      if (p >= 0 && p <= 1) return { km: (1 - p) * LINE_KM, dir: 'down' };
    }
    return null;
  }
  function nextDeparture() {
    var n = nowMins();
    for (var i = 0; i < UP.length; i++) if (UP[i] > n) return { mins: UP[i], idx: i, today: true };
    return { mins: UP[0], idx: 0, today: false };
  }

  /* ---------------- videos: tier pick + lazy attach + IO play ---------------- */
  var saveData = navigator.connection && navigator.connection.saveData;
  var TIERS = {
    'hero-dawn': ['1080', '540'], 'climb-larch': ['1080', '540'],
    'viaduct': ['1440', '1080', '720'], 'wiesen-frost': ['1080', '540'],
    'plateau-light': ['1080', '540'], 'window-seat': ['1080', '540'],
    'dusk-arrival': ['1080', '540']
  };
  function pickTier(name) {
    var t = TIERS[name];
    var w = window.innerWidth * Math.min(window.devicePixelRatio || 1, 2);
    if (saveData) return t[t.length - 1];
    if (name === 'viaduct') return w >= 2400 ? '1440' : (w >= 1100 ? '1080' : '720');
    return w >= 1100 ? t[0] : t[t.length - 1];
  }
  function attach(v) {
    if (v.dataset.loaded) return;
    v.dataset.loaded = '1';
    var name = v.dataset.v;
    v.src = 'video/' + name + '-' + pickTier(name) + '.mp4';
  }

  var vids = $$('.film-v');
  if (reduced) {
    // posters only; no motion, no fetch
    vids.forEach(function (v) { v.removeAttribute('autoplay'); v.preload = 'none'; });
  } else if ('IntersectionObserver' in window) {
    var vio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting) {
          attach(v);
          var pr = v.play(); if (pr && pr.catch) pr.catch(function () {});
        } else if (!v.paused) v.pause();
      });
    }, { rootMargin: '240px 0px' });
    vids.forEach(function (v) { vio.observe(v); });
  } else {
    vids.forEach(function (v) { attach(v); var p = v.play(); if (p && p.catch) p.catch(function () {}); });
  }
  document.addEventListener('visibilitychange', function () {
    vids.forEach(function (v) {
      if (document.hidden) { if (!v.paused) v.pause(); }
      else if (v.dataset.loaded && isNear(v)) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
    });
  });
  function isNear(el) {
    var r = el.getBoundingClientRect();
    return r.bottom > -240 && r.top < innerHeight + 240;
  }

  /* ---------------- scroll -> km engine ---------------- */
  var sections = $$('[data-km0]');
  var marks = [];
  function measure() {
    marks = sections.map(function (s) {
      return { top: s.offsetTop, h: s.offsetHeight, km0: +s.dataset.km0, km1: +s.dataset.km1, el: s };
    });
  }
  measure();
  var rTimer;
  addEventListener('resize', function () { clearTimeout(rTimer); rTimer = setTimeout(measure, 200); });

  function kmAtScroll(y) {
    var mid = y + innerHeight * 0.6;
    var m, i;
    for (i = marks.length - 1; i >= 0; i--) {
      m = marks[i];
      if (mid >= m.top) {
        var t = Math.min(1, Math.max(0, (mid - m.top) / m.h));
        return m.km0 + (m.km1 - m.km0) * t;
      }
    }
    return 0;
  }

  /* strip + big profile share geometry */
  function xAtKm(km) { return km / LINE_KM * 1000; }
  var stripPts = [[0, 23.5], [7.4, 19], [12, 17.2], [16.2, 13.5], [19, 11.6], [23.1, 8.8], [27, 6.4], [31.6, 4.6], [36, 3.4], [41.8, 2]];
  var bigPts = [[0, 104], [7.4, 84.9], [12, 76.6], [16.2, 61], [19, 53], [23.1, 40.8], [27, 30.1], [31.6, 22.7], [36, 17.6], [41.8, 12]];
  function yOn(pts, km) {
    if (km <= 0) return pts[0][1];
    for (var i = 1; i < pts.length; i++) {
      if (km <= pts[i][0]) {
        var a = pts[i - 1], b = pts[i];
        return a[1] + (b[1] - a[1]) * (km - a[0]) / (b[0] - a[0]);
      }
    }
    return pts[pts.length - 1][1];
  }

  /* cue phases: which light the sky performs, driven by journey km
     (the day arc IS the journey: dawn at Tarven, day up high, dusk at Alvagrat) */
  function cueAt(km, tunnelDepth) {
    if (tunnelDepth > 0.15) return 'night';
    if (km < 4) return 'night';
    if (km < 17) return 'first';
    if (km < 34) return 'day';
    return 'dusk';
  }

  var cycEls = { night: $('.cyc-night'), first: $('.cyc-first'), day: $('.cyc-day'), dusk: $('.cyc-dusk') };
  var curCue = 'night';
  function setCue(c) {
    if (c === curCue) return;
    curCue = c;
    for (var k in cycEls) cycEls[k].style.opacity = (k === c) ? 1 : 0;
    document.body.dataset.cue = c;
  }

  /* HUD elements */
  var hudKm = $('#hudKm'), hudAlt = $('#hudAlt'), hudTemp = $('#hudTemp'), hudNext = $('#hudNext');
  var stripYou = $('#stripYou'), stripLive = $('#stripLive');
  var profileTrain = $('#profileTrain');
  var tunnelKmEl = $('#tunnelKm');
  var tunnelSec = $('#tunnel');

  function nextStation(km) {
    for (var i = 0; i < STATIONS.length; i++) if (STATIONS[i].km > km + 0.05) return STATIONS[i].name;
    return 'Alvagrat';
  }

  var lastY = -1, lastLiveT = 0, ticking = false;
  function frame() {
    ticking = false;
    var y = scrollY;
    var km = kmAtScroll(y);
    var alt = altAt(km);

    hudKm.textContent = 'km ' + km.toFixed(1);
    hudAlt.textContent = Math.round(alt) + ' m';
    hudTemp.textContent = (tempAt(alt) > 0 ? '+' : '−') + Math.abs(tempAt(alt)) + '°';
    hudNext.textContent = km >= LINE_KM - 0.05 ? 'terminus' : '→ ' + nextStation(km);

    var x = xAtKm(km);
    stripYou.setAttribute('cx', x);
    stripYou.setAttribute('cy', yOn(stripPts, km));
    profileTrain.setAttribute('cx', x);
    profileTrain.setAttribute('cy', yOn(bigPts, km));

    // tunnel darkness: how deep into the tunnel section the viewport sits
    var tRect = tunnelSec.getBoundingClientRect();
    var depth = 0;
    if (tRect.top < innerHeight && tRect.bottom > 0) {
      var prog = Math.min(1, Math.max(0, (innerHeight * 0.6 - tRect.top) / tRect.height));
      depth = Math.sin(Math.PI * Math.min(1, Math.max(0, prog))); // in-and-out
      var tkm = TUNNEL[0] + (TUNNEL[1] - TUNNEL[0]) * prog;
      tunnelKmEl.textContent = tkm.toFixed(1);
    }

    setCue(cueAt(km, depth));
    if (audio.on) audio.scene(km, depth);

    // live train dot (cheap; update at most every 5s worth of movement)
    var now = Date.now();
    if (now - lastLiveT > 5000) {
      lastLiveT = now;
      paintLive();
    }
  }
  function onScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(frame); }
  }
  addEventListener('scroll', onScroll, { passive: true });

  /* ---------------- the broadcast: real clock -> live state ---------------- */
  var heroClock = $('#heroClock'), heroLiveText = $('#heroLiveText');
  var thirdLiveText = $('#thirdLiveText');
  var boardNext = $('#boardNext'), boardBody = $('#boardBody');

  function paintLive() {
    var t = liveTrain();
    if (t) {
      stripLive.style.display = '';
      stripLive.setAttribute('cx', xAtKm(t.km));
      stripLive.setAttribute('cy', yOn(stripPts, t.km));
      var txt = 'live · ' + segmentName(t.km) + (t.dir === 'down' ? ' (down train)' : '');
      thirdLiveText.textContent = txt;
      heroLiveText.textContent = 'TRANSMISSION · ' + segmentName(t.km);
    } else {
      stripLive.style.display = 'none';
      var nd = nextDeparture();
      thirdLiveText.textContent = 'standby · next ' + fmtTime(nd.mins);
      heroLiveText.textContent = 'TRANSMISSION · line asleep';
    }
    var nd2 = nextDeparture();
    heroClock.textContent = fmtTime(nd2.mins);
    boardNext.textContent = nd2.today
      ? 'next departure ' + fmtTime(nd2.mins)
      : 'service ended · first light tomorrow 07:12';
    // mark board rows
    var n = nowMins();
    $$('#boardBody tr').forEach(function (tr, i) {
      tr.classList.toggle('is-gone', UP[i] + DUR < n);
      tr.classList.toggle('is-next', nd2.today && nd2.idx === i);
    });
  }
  paintLive();
  setInterval(paintLive, 30000);

  /* ---------------- audio: the sound of the line ---------------- */
  var audio = {
    on: false, ready: false,
    ctx: null, bed: null, wind: null, bedG: null, windG: null, filt: null, master: null,
    init: function () {
      if (this.ready) return;
      var C = window.AudioContext || window.webkitAudioContext;
      if (!C) return;
      this.ctx = new C();
      this.bed = new Audio('audio/line-bed.mp3'); this.bed.loop = true;
      this.wind = new Audio('audio/wind-alv.mp3'); this.wind.loop = true;
      var sBed = this.ctx.createMediaElementSource(this.bed);
      var sWind = this.ctx.createMediaElementSource(this.wind);
      this.bedG = this.ctx.createGain(); this.windG = this.ctx.createGain();
      this.filt = this.ctx.createBiquadFilter(); this.filt.type = 'lowpass'; this.filt.frequency.value = 18000;
      this.master = this.ctx.createGain(); this.master.gain.value = 0;
      sBed.connect(this.bedG); sWind.connect(this.windG);
      this.bedG.connect(this.filt); this.windG.connect(this.filt);
      this.filt.connect(this.master); this.master.connect(this.ctx.destination);
      this.bedG.gain.value = 0.85; this.windG.gain.value = 0;
      this.ready = true;
    },
    start: function () {
      this.init();
      if (!this.ready) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();
      this.bed.play().catch(function () {});
      this.wind.play().catch(function () {});
      this.master.gain.setTargetAtTime(1, this.ctx.currentTime, 0.6);
      this.on = true;
    },
    stop: function () {
      if (!this.ready) return;
      var self = this;
      this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.25);
      setTimeout(function () { if (!self.on) { self.bed.pause(); self.wind.pause(); } }, 700);
      this.on = false;
    },
    scene: function (km, tunnelDepth) {
      if (!this.ready) return;
      var t = this.ctx.currentTime;
      // tunnel: close the filter, duck the bed
      var f = tunnelDepth > 0.05 ? (18000 - (18000 - 420) * tunnelDepth) : 18000;
      this.filt.frequency.setTargetAtTime(f, t, 0.18);
      this.bedG.gain.setTargetAtTime(tunnelDepth > 0.05 ? 0.55 : (km > 23 && km < 34 ? 0.6 : 0.85), t, 0.4);
      // wind lives on the high plain and the ridge
      var wantWind = (km >= 23 && km <= LINE_KM) && tunnelDepth < 0.4;
      this.windG.gain.setTargetAtTime(wantWind ? 0.75 : 0, t, 0.8);
    }
  };

  var soundBtn = $('#soundBtn'), soundLabel = $('#soundLabel');
  function paintSound() {
    soundBtn.setAttribute('aria-pressed', audio.on ? 'true' : 'false');
    soundLabel.textContent = audio.on ? 'Sound on' : 'Sound';
  }
  soundBtn.addEventListener('click', function () {
    if (audio.on) { audio.stop(); localStorage.setItem('linia.sound', 'off'); }
    else { audio.start(); localStorage.setItem('linia.sound', 'on'); }
    paintSound();
  });
  // remembered preference still requires a gesture; re-arm on first interaction
  if (localStorage.getItem('linia.sound') === 'on' && !reduced) {
    var arm = function () {
      document.removeEventListener('pointerdown', arm);
      document.removeEventListener('keydown', arm);
      audio.start(); paintSound();
    };
    document.addEventListener('pointerdown', arm, { once: true });
    document.addEventListener('keydown', arm, { once: true });
  }

  /* ---------------- reserve a window ---------------- */
  var STORE = 'linia.seat.v1';
  var rfDeps = $('#rfDeps'), form = $('#reserveForm'), chit = $('#chit'), chitBody = $('#chitBody');

  function buildDeps() {
    var n = nowMins(), html = '', anyLeft = false;
    UP.forEach(function (dep, i) {
      var gone = dep - 10 <= n; // held until ten minutes before
      if (!gone && !anyLeft) anyLeft = true;
      html += '<label class="' + (gone ? 'is-gone' : '') + '">' +
        '<input type="radio" name="dep" value="' + i + '"' + (gone ? ' disabled' : '') + '>' +
        '<span>' + fmtTime(dep) + '</span></label>';
    });
    rfDeps.innerHTML = html;
    var first = rfDeps.querySelector('input:not([disabled])');
    if (first) first.checked = true;
    var note = $('#rfNote');
    if (!anyLeft) note.textContent = 'Today’s trains have left — holding a seat on tomorrow’s 07:12.';
  }
  buildDeps();

  function seatNo(depIdx, side, fare) {
    // deterministic, honest-looking seat: car by class, number by side/departure
    var car = fare === 'Panorama' ? 1 : (fare === 'Window' ? 2 : 3);
    var base = fare === 'Bench' ? 10 : 40;
    return 'car ' + car + ' · seat ' + (base + depIdx * 2 + (side === 'gorge' ? 1 : 2));
  }

  function paintChit() {
    var saved = null;
    try { saved = JSON.parse(localStorage.getItem(STORE) || 'null'); } catch (e) {}
    if (saved && saved.body) {
      chitBody.textContent = saved.body;
      chit.hidden = false; form.hidden = true;
    } else {
      chit.hidden = true; form.hidden = false;
    }
  }
  paintChit();

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var depIn = form.querySelector('input[name="dep"]:checked');
    var side = form.querySelector('input[name="side"]:checked').value;
    var fareIn = form.querySelector('input[name="fare"]:checked');
    var fare = fareIn.value, price = fareIn.dataset.price;
    var depIdx = depIn ? +depIn.value : 0;
    var today = !!depIn;
    var when = (today ? 'today' : 'tomorrow') + ' · ' + fmtTime(UP[depIdx]) + ' from Tarven';
    var body = when + '\n' + fare + ' · ' + (side === 'gorge' ? 'gorge side' : 'valley side') +
      ' · ' + seatNo(depIdx, side, fare) + '\n' + price + ' CHF · pay at the counter';
    try { localStorage.setItem(STORE, JSON.stringify({ body: body })); } catch (e2) {}
    paintChit();
    chit.scrollIntoView({ block: 'nearest', behavior: reduced ? 'auto' : 'smooth' });
  });
  $('#chitCancel').addEventListener('click', function () {
    try { localStorage.removeItem(STORE); } catch (e) {}
    buildDeps(); paintChit();
  });

  /* ---------------- misc ---------------- */
  $('#yy').textContent = new Date().getFullYear();

  // initial paint (also covers load-in-background: rAF may not tick while hidden)
  frame();
  setTimeout(frame, 400);
})();

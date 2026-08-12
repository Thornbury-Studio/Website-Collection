/* KARN — world chrome and the one engineering model.
   Every performance figure on this site is computed here from declared
   primitives (mass, power, drag area, drivetrain, battery). The marque
   publishes arithmetic, not adjectives. */
(function () {
  'use strict';
  document.documentElement.classList.remove('no-js');
  document.documentElement.classList.add('js-anim');

  var K = window.KN = {
    reduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    clamp: function (v, a, b) { return v < a ? a : v > b ? b : v; }
  };

  /* ---------- the fleet (primitives first, story second) ---------- */

  K.fleet = {
    monolit: {
      code: 'T1', name: 'MONOLIT', slug: 'monolit',
      role: 'Salt-flat record machine', sector: 'SC-01 · WEISS FLAT',
      accent: '#eef2f6',
      m: 1240, kw: 810, nm: 1080, cda: 0.58, drive: 'AWD', tyre: 'road',
      seats: 1, engine: 'Hybrid twin-turbo V8 · rear e-axle',
      note: 'Built for one straight line and the nerve to hold it.'
    },
    serra: {
      code: 'R2', name: 'SERRA', slug: 'serra',
      role: 'Ring-circuit track weapon', sector: 'SC-02 · THE RING',
      accent: '#ff4d00',
      m: 980, kw: 520, nm: 720, cda: 0.98, cla: 3.9, drive: 'RWD', tyre: 'slick',
      seats: 1, engine: 'NA V10 · straight-cut gearset',
      note: 'Downforce exceeding its own weight above 232 km/h.'
    },
    brekka: {
      code: 'K4', name: 'BREKKA', slug: 'brekka',
      role: 'Ash-dune heavy raider', sector: 'SC-03 · ASKA DUNES',
      accent: '#8d939e',
      m: 2260, kw: 420, nm: 1150, cda: 1.35, drive: 'AWD', tyre: 'AT',
      vlimit: 210, seats: 4, engine: 'Twin-turbo diesel V8 · portal axles',
      note: 'Two and a quarter tonnes that refuse to be slowed by planets.'
    },
    nokt: {
      code: 'G3', name: 'NOKT', slug: 'nokt',
      role: 'Night-coast grand tourer', sector: 'SC-04 · KYST ROAD',
      accent: '#7fd4e8',
      m: 1690, kw: 430, nm: 840, cda: 0.78, drive: 'AWD', tyre: 'road',
      seats: 2, engine: 'Twin-turbo flat-six · 9-speed',
      note: 'Made for the hours when the coast road belongs to nobody.'
    },
    varde: {
      code: 'E0', name: 'VARDE', slug: 'varde',
      role: 'Experimental electric prototype', sector: 'SC-05 · THE WORKS',
      accent: '#ffd166',
      m: 1520, kw: 580, nm: 1600, cda: 0.60, drive: 'AWD', tyre: 'road',
      vlimit: 300, battery: 92, whkm: 210, seats: 2, engine: 'Tri-motor EV · 900 V',
      note: 'Half car, half argument about what comes next.'
    }
  };

  /* ---------- the performance model ---------- */

  var RHO = 1.225, ETA = 0.82;
  K.perf = {
    // 0–100 km/h: mass/power law with drivetrain-traction factor, floor 1.7 s
    t100: function (v) {
      var f = v.tyre === 'AT' ? 1.35 : (v.drive === 'RWD' ? 1.15 : 1.0);
      return Math.max(1.7, (v.m / v.kw) * f);
    },
    // top speed: aero-limited v = (2Pη/ρCdA)^⅓ unless the machine declares a limiter
    vmax: function (v) {
      var aero = Math.pow((2 * v.kw * 1000 * ETA) / (RHO * v.cda), 1 / 3) * 3.6;
      return v.vlimit ? Math.min(v.vlimit, aero) : aero;
    },
    vmaxLimited: function (v) {
      var aero = Math.pow((2 * v.kw * 1000 * ETA) / (RHO * v.cda), 1 / 3) * 3.6;
      return !!v.vlimit && v.vlimit < aero;
    },
    pw: function (v) { return v.kw / (v.m / 1000); },          // kW per tonne
    range: function (v) { return v.battery ? v.battery * 1000 / v.whkm : null; },
    downforceAt: function (v, kmh) {
      if (!v.cla) return null;
      var ms = kmh / 3.6;
      return 0.5 * RHO * ms * ms * v.cla;                       // newtons
    },
    // speed above which downforce exceeds weight (null if never)
    crossoverKmh: function (v) {
      if (!v.cla) return null;
      return Math.sqrt((v.m * 9.81) / (0.5 * RHO * v.cla)) * 3.6;
    }
  };

  K.fmt = {
    s: function (x) { return x.toFixed(1).replace(/\.0$/, '.0') + ' s'; },
    kmh: function (x) { return Math.round(x) + ' km/h'; },
    kw: function (x) { return Math.round(x) + ' kW'; },
    pw: function (x) { return Math.round(x) + ' kW/t'; },
    kg: function (x) { return x.toLocaleString('en-GB') + ' kg'; },
    km: function (x) { return Math.round(x) + ' km'; },
    kn: function (x) { return (x / 1000).toFixed(1) + ' kN'; }
  };

  /* ---------- daily proving-ground conditions (seeded, deterministic) ---------- */

  function seed(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return function () {
      h = Math.imul(h ^ (h >>> 15), 2246822507);
      h = Math.imul(h ^ (h >>> 13), 3266489909);
      return ((h ^= h >>> 16) >>> 0) / 4294967296;
    };
  }
  var today = new Date().toISOString().slice(0, 10);
  K.conditions = (function () {
    var r = seed('karn·' + today);
    function sector(base, spread) {
      return {
        wind: Math.round(8 + r() * 60),
        temp: Math.round(base + (r() - 0.5) * spread),
        open: r() > 0.12
      };
    }
    return {
      'SC-01': sector(31, 8), 'SC-02': sector(19, 10), 'SC-03': sector(24, 12),
      'SC-04': sector(14, 6), 'SC-05': sector(21, 2)
    };
  }());

  /* ---------- HUD rim: conditions + scroll velocity ---------- */

  var condEl = document.querySelector('[data-hud-cond]');
  if (condEl) {
    var sc = document.body.getAttribute('data-sector') || 'SC-01';
    var c = K.conditions[sc] || K.conditions['SC-01'];
    condEl.textContent = sc + ' · ' + c.temp + '°C · WIND ' + c.wind + ' · ' + (c.open ? 'OPEN' : 'HOLD');
  }

  var velEl = document.querySelector('[data-hud-vel]');
  if (velEl && !K.reduced) {
    var lastY = window.scrollY, lastT = performance.now(), shown = 0;
    var tick = function () {
      var now = performance.now(), y = window.scrollY;
      var dt = Math.max(16, now - lastT);
      var raw = Math.abs(y - lastY) / dt * 1000;       // px/s
      var kmh = K.clamp(raw / 14, 0, 320);             // px/s → fictional km/h
      shown += (kmh - shown) * 0.14;                   // needle inertia
      velEl.textContent = String(Math.round(shown)).padStart(3, '0') + ' KM/H';
      lastY = y; lastT = now;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    // paint the first frame synchronously — rAF never fires in hidden tabs
    velEl.textContent = '000 KM/H';
  } else if (velEl) {
    velEl.textContent = '000 KM/H';
  }

  /* ---------- reveals: hard snaps with a signal ghost + sweep backstop ---------- */

  var seen = false;
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { seen = true; en.target.classList.add('is-in'); io.unobserve(en.target); }
    });
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0.04 }) : null;

  K.rescanReveals = function (root) {
    var els = (root || document).querySelectorAll('.snap:not(.is-in)');
    if (!io) { els.forEach(function (el) { el.classList.add('is-in'); }); return; }
    els.forEach(function (el) { io.observe(el); });
  };
  K.rescanReveals();

  function sweep() {
    var els = document.querySelectorAll('.snap:not(.is-in)');
    if (!els.length) return;
    var vh = window.innerHeight;
    els.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < vh + 80 && r.bottom > -80) el.classList.add('is-in');
    });
  }
  var q = false;
  function queueSweep() {
    if (q) return; q = true;
    setTimeout(function () { q = false; sweep(); }, 120);
  }
  window.addEventListener('scroll', queueSweep, { passive: true });
  window.addEventListener('resize', queueSweep);
  window.addEventListener('hashchange', queueSweep);
  setTimeout(function () {
    if (!seen) document.querySelectorAll('.snap').forEach(function (el) { el.classList.add('is-in'); });
    else sweep();
  }, 1500);

  /* ---------- velocity skew: [data-velocity] leans with scroll speed ---------- */

  if (!K.reduced) {
    var vEls = document.querySelectorAll('[data-velocity]');
    if (vEls.length) {
      var vy = window.scrollY, vv = 0;
      var vloop = function () {
        var y = window.scrollY;
        vv += ((y - vy) - vv) * 0.12;
        vy = y;
        var lean = K.clamp(vv * 0.06, -4, 4);
        vEls.forEach(function (el) { el.style.transform = 'skewY(' + lean.toFixed(2) + 'deg)'; });
        requestAnimationFrame(vloop);
      };
      requestAnimationFrame(vloop);
    }
  }

  /* ---------- pointer parallax: [data-parallax] children drift ---------- */

  if (!K.reduced) {
    document.querySelectorAll('[data-parallax]').forEach(function (stage) {
      var layers = stage.querySelectorAll('[data-depth]');
      if (!layers.length) return;
      stage.addEventListener('pointermove', function (e) {
        var r = stage.getBoundingClientRect();
        var nx = (e.clientX - r.left) / r.width - 0.5;
        var ny = (e.clientY - r.top) / r.height - 0.5;
        layers.forEach(function (l) {
          var d = parseFloat(l.getAttribute('data-depth'));
          l.style.transform = 'translate3d(' + (-nx * d) + 'px,' + (-ny * d * 0.6) + 'px,0)';
        });
      });
      stage.addEventListener('pointerleave', function () {
        layers.forEach(function (l) { l.style.transform = ''; });
      });
    });
  }

  /* ---------- the sweep: draggable light bar over paint ---------- */

  K.wireSweeps = function (root) {
    (root || document).querySelectorAll('.sweep-stage').forEach(function (stage) {
      if (stage.__wired) return;
      stage.__wired = true;
      var bar = stage.querySelector('.sweep-glare');
      var range = stage.querySelector('input[type="range"]');
      if (!bar || !range) return;
      function paint(v) {
        var x = v * 100;
        bar.style.background =
          'linear-gradient(105deg, transparent ' + Math.max(0, x - 18) + '%, ' +
          'rgba(255,255,255,0.28) ' + x + '%, transparent ' + Math.min(100, x + 18) + '%)';
      }
      paint(parseFloat(range.value));
      range.addEventListener('input', function () { paint(parseFloat(range.value)); });
      // drag anywhere on the plate
      stage.addEventListener('pointerdown', function (e) {
        if (e.target === range) return;
        stage.setPointerCapture(e.pointerId);
        var move = function (ev) {
          var r = stage.getBoundingClientRect();
          var v = K.clamp((ev.clientX - r.left) / r.width, 0, 1);
          range.value = v;
          paint(v);
        };
        move(e);
        stage.addEventListener('pointermove', move);
        stage.addEventListener('pointerup', function up() {
          stage.removeEventListener('pointermove', move);
          stage.removeEventListener('pointerup', up);
        });
      });
    });
  };
  K.wireSweeps();

  /* ---------- the garage ---------- */

  var GKEY = 'karn.garage.v1';
  K.garage = {
    list: function () {
      try { return JSON.parse(localStorage.getItem(GKEY) || '[]'); } catch (e) { return []; }
    },
    has: function (slug) { return this.list().indexOf(slug) !== -1; },
    toggle: function (slug) {
      var l = this.list();
      var i = l.indexOf(slug);
      if (i === -1) l.push(slug); else l.splice(i, 1);
      try { localStorage.setItem(GKEY, JSON.stringify(l)); } catch (e) { /* private mode */ }
      paintGarage();
      return i === -1;
    }
  };
  function paintGarage() {
    var n = K.garage.list().length;
    document.querySelectorAll('[data-garage-count]').forEach(function (el) {
      el.textContent = n ? 'GARAGE · ' + n : 'GARAGE';
    });
    document.querySelectorAll('[data-garage-toggle]').forEach(function (b) {
      var slug = b.getAttribute('data-garage-toggle');
      var inG = K.garage.has(slug);
      b.setAttribute('aria-pressed', inG ? 'true' : 'false');
      var lbl = b.querySelector('.g-label');
      if (lbl) lbl.textContent = inG ? 'IN THE GARAGE' : 'SAVE TO GARAGE';
    });
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-garage-toggle]');
    if (!b) return;
    K.garage.toggle(b.getAttribute('data-garage-toggle'));
  });
  paintGarage();

  /* ---------- video in-view management ---------- */

  var vio = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      var v = en.target;
      if (K.reduced) { v.pause(); return; }
      if (en.isIntersecting) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
      else v.pause();
    });
  }, { rootMargin: '100px 0px' }) : null;
  document.querySelectorAll('video[data-io]').forEach(function (v) {
    if (vio) vio.observe(v);
    else if (!K.reduced) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
  });

  /* ---------- the reticle: a HUD cursor over cinematic zones ---------- */

  if (!K.reduced && window.matchMedia('(pointer: fine)').matches) {
    var ret = document.createElement('div');
    ret.className = 'reticle';
    ret.setAttribute('aria-hidden', 'true');
    document.body.appendChild(ret);
    var rx = -100, ry = -100, tx = -100, ty = -100, retOn = false;
    document.addEventListener('pointermove', function (e) {
      tx = e.clientX; ty = e.clientY;
      var zone = e.target.closest('.plate, .machine-row, .sweep-stage, .chart, .scrub');
      var hot = !!e.target.closest('a, button, input, .sector-hit');
      var on = !!zone;
      if (on !== retOn) { retOn = on; ret.classList.toggle('on', on); }
      ret.classList.toggle('hot', on && hot);
    }, { passive: true });
    (function retLoop() {
      rx += (tx - rx) * 0.3; ry += (ty - ry) * 0.3;
      ret.style.transform = 'translate(' + rx.toFixed(1) + 'px,' + ry.toFixed(1) + 'px)';
      requestAnimationFrame(retLoop);
    }());
  }

  /* ---------- the wipe: signal shutter between machine sheets ---------- */

  var wipe = document.createElement('div');
  wipe.className = 'wipe';
  wipe.setAttribute('aria-hidden', 'true');
  document.body.appendChild(wipe);
  window.addEventListener('pageshow', function () { wipe.classList.remove('go'); });
  if (!K.reduced) {
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href$=".html"], a[href*=".html#"], a[href*=".html?"]');
      if (!a || a.origin !== location.origin) return;
      if (a.pathname === location.pathname) return; // same-page anchor: just scroll
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target === '_blank') return;
      e.preventDefault();
      var href = a.href;
      wipe.classList.add('go');
      setTimeout(function () { location.href = href; }, 260);
    });
  }

  /* ---------- the scrub: a pre-extracted frame sequence on canvas.
     Seeking a long-GOP video teleports (every currentTime write decodes
     from the nearest keyframe); frames drawn to canvas have zero seek
     latency. Coarse pass loads every 8th frame so the drive works within
     ~2s; the fill pass completes it; a small bitmap LRU keeps memory sane
     and the drawer always paints the nearest frame it owns. ---------- */

  K.scrubState = { total: 0, loaded: 0, drawn: -1 };

  K.wireScrubSeq = function (section, canvas, readout, opts) {
    if (!section || !canvas || !canvas.getContext) return;
    var ctx = canvas.getContext('2d');
    var N = opts.count;
    var hi = (window.innerWidth * (window.devicePixelRatio || 1)) > 1500 &&
             !(window.matchMedia('(prefers-reduced-data: reduce)').matches);
    var pat = hi ? opts.hi : opts.lo;
    // Image elements, not fetch(): fetch is blocked on file:// pages and this
    // template must survive being opened straight from disk. The browser
    // owns the decode cache; we only track which frames have arrived.
    var frames = new Array(N);
    var ready = new Array(N);
    K.scrubState.total = N;

    function url(i) { return pat.replace('%03d', String(i + 1).padStart(3, '0')); }

    function fetchFrame(i) {
      if (frames[i]) return Promise.resolve();
      return new Promise(function (resolve) {
        var im = new Image();
        im.decoding = 'async';
        im.onload = function () { ready[i] = true; K.scrubState.loaded++; resolve(); };
        im.onerror = function () { frames[i] = null; resolve(); };
        im.src = url(i);
        frames[i] = im;
      });
    }

    function nearestOwned(i) {
      for (var d = 0; d < N; d++) {
        if (ready[i - d]) return i - d;
        if (ready[i + d]) return i + d;
      }
      return -1;
    }

    function size() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = Math.min(Math.round(canvas.clientWidth * dpr), hi ? 2560 : 1280);
      var h = Math.round(w * canvas.clientHeight / Math.max(1, canvas.clientWidth));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; K.scrubState.drawn = -1; }
    }

    function draw(bm) {
      // cover-fit
      var cw = canvas.width, ch = canvas.height;
      var s = Math.max(cw / bm.width, ch / bm.height);
      var dw = bm.width * s, dh = bm.height * s;
      ctx.drawImage(bm, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
    }

    var target = 0, current = 0, painting = false;

    function paintIndex(iWanted) {
      var i = nearestOwned(iWanted);
      if (i < 0) return;
      if (K.scrubState.drawn !== i) {
        draw(frames[i]);
        K.scrubState.drawn = i;
      }
    }

    function step() {
      current += (target - current) * 0.22;
      paintIndex(Math.round(current * (N - 1)));
      if (readout) {
        var m = Math.round((1 - current) * 1400);
        readout.textContent = 'SURFACE −' + String(m).padStart(4, '0') + ' M';
      }
      if (Math.abs(target - current) > 0.0015) requestAnimationFrame(step);
      else painting = false;
    }

    function onScroll() {
      var r = section.getBoundingClientRect();
      var span = r.height - window.innerHeight;
      if (span <= 0) return;
      target = K.clamp(-r.top / span, 0, 1);
      if (!painting) { painting = true; requestAnimationFrame(step); }
    }

    size();
    window.addEventListener('resize', function () { size(); onScroll(); });

    // coarse pass first (every 8th frame), then fill the rest sequentially
    var coarse = [];
    for (var i = 0; i < N; i += 8) coarse.push(i);
    Promise.all(coarse.map(fetchFrame)).then(function () {
      // first paint, even before any scroll
      paintIndex(Math.round(current * (N - 1)));
      onScroll();
      if (window.matchMedia('(prefers-reduced-data: reduce)').matches) return;
      var next = 0;
      (function fill() {
        while (next < N && frames[next]) next++;
        if (next >= N) return;
        fetchFrame(next).then(function () { setTimeout(fill, 8); });
      }());
    });

    if (K.reduced) {
      section.classList.add('scrub-static');
      // a single static frame, no scroll wiring
      fetchFrame(0).then(function () { if (ready[0]) { size(); draw(frames[0]); K.scrubState.drawn = 0; } });
      return;
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  };
}());

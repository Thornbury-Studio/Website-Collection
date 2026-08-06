/* =====================================================================
   SYS-2026 — Field Terminal
   No dependencies. One rAF loop drives every scroll-linked effect; all
   the heavy layout work is precomputed and the per-frame cost is a
   handful of lerps written into CSS custom properties.
   ===================================================================== */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var lerp  = function (a, b, t) { return a + (b - a) * t; };

  /* ==================================================================
     1. Scroll engine
     Progress for a pinned section = how far its tall parent has been
     scrolled through, 0 → 1 while the sticky child is on screen.
     ================================================================== */

  var bootSec  = document.getElementById('boot');
  var anatSec  = document.getElementById('anatomy');
  var fill     = document.getElementById('scrollFill');
  var nav      = document.getElementById('nav');
  var heroImgs = document.querySelectorAll('.hero-video, .hero-still');

  function sectionProgress(el) {
    if (!el) return 0;
    var r = el.getBoundingClientRect();
    var travel = r.height - window.innerHeight;
    if (travel <= 0) return r.top <= 0 ? 1 : 0;
    return clamp(-r.top / travel, 0, 1);
  }

  /* ---- power-on self test -------------------------------------------
     Runs on its own clock the first time it comes into view. Each row sits
     in a visible "checking" state for its own duration before it reports,
     because a list that fills in instantly reads as decoration rather than
     as a machine doing work. Replayable on demand. */
  var bootItems  = [].slice.call(document.querySelectorAll('[data-boot]'));
  var bootDone   = document.getElementById('bootDone');
  var bootPct    = document.getElementById('bootPct');
  var bootBar    = document.getElementById('bootBar');
  var bootReplay = document.getElementById('bootReplay');
  var bootTimers = [];
  var bootTotal  = bootItems.reduce(function (a, el) { return a + (+el.dataset.ms || 300); }, 0);

  function bootReset() {
    bootTimers.forEach(clearTimeout);
    bootTimers = [];
    bootItems.forEach(function (el) { el.classList.remove('is-run', 'is-on'); });
    if (bootDone) bootDone.classList.remove('is-on');
    if (bootPct) bootPct.textContent = '0%';
    if (bootBar) bootBar.style.transform = 'scaleX(0)';
  }

  function bootRun() {
    bootReset();
    if (bootReplay) bootReplay.disabled = true;

    if (reduced) {                       // no theatre; show the finished state
      bootItems.forEach(function (el) { el.classList.add('is-on'); });
      if (bootDone) bootDone.classList.add('is-on');
      if (bootPct) bootPct.textContent = '100%';
      if (bootBar) bootBar.style.transform = 'scaleX(1)';
      if (bootReplay) bootReplay.disabled = false;
      return;
    }

    var at = 0, done = 0;
    bootItems.forEach(function (el, i) {
      var ms = +el.dataset.ms || 300;
      bootTimers.push(setTimeout(function () { el.classList.add('is-run'); }, at));
      at += ms;
      done += ms;
      // `done` is shared across iterations, so capture the fraction here —
      // reading it inside the timeout gives every row the final value.
      var frac = done / bootTotal;
      var pct = Math.round(frac * 100);
      bootTimers.push(setTimeout(function () {
        el.classList.remove('is-run');
        el.classList.add('is-on');
        if (bootPct) bootPct.textContent = pct + '%';
        if (bootBar) bootBar.style.transform = 'scaleX(' + frac.toFixed(3) + ')';
      }, at));
    });

    bootTimers.push(setTimeout(function () {
      if (bootDone) bootDone.classList.add('is-on');
      if (bootReplay) bootReplay.disabled = false;
    }, at + 260));
  }

  if (bootItems.length) {
    var bootFired = false;
    var bootGo = function () {
      if (bootFired) return;
      bootFired = true;
      bootRun();
    };
    var bootVisible = function () {
      var r = bootSec.getBoundingClientRect();
      return r.top < window.innerHeight * 0.72 && r.bottom > 0;
    };

    if ('IntersectionObserver' in window) {
      var bio = new IntersectionObserver(function (es) {
        if (es[0].isIntersecting) { bootGo(); bio.disconnect(); }
      }, { threshold: 0.35 });
      bio.observe(bootSec);
      // A backgrounded tab never fires IO. Poll position instead of time —
      // a bare timer would run the show before anyone has scrolled to it.
      window.addEventListener('scroll', function onBootScroll() {
        if (bootFired || bootVisible()) {
          if (!bootFired && bootVisible()) bootGo();
          if (bootFired) window.removeEventListener('scroll', onBootScroll);
        }
      }, { passive: true });
      setTimeout(function () { if (bootVisible()) bootGo(); }, 3000);
    } else {
      bootGo();
    }
    if (bootReplay) bootReplay.addEventListener('click', bootRun);
  }

  /* ---- anatomy ------------------------------------------------------ */
  var STOPS = 6;
  var callouts = [].slice.call(document.querySelectorAll('.callout'));
  var ticks    = [].slice.call(document.querySelectorAll('#stageTicks li'));

  // The index doubles as navigation: clicking a component scrolls to the
  // middle of that stop's slice of the section.
  [].slice.call(document.querySelectorAll('#stageTicks button')).forEach(function (b) {
    b.addEventListener('click', function () {
      if (!anatSec) return;
      var i = +b.getAttribute('data-jump');
      var q = (i + 0.5) / STOPS;              // centre of the slice
      var p = q * 0.9 + 0.05;                 // undo the lead-in/out padding
      window.scrollTo({
        top: anatSec.offsetTop + (anatSec.offsetHeight - window.innerHeight) * p,
        behavior: reduced ? 'auto' : 'smooth'
      });
    });
  });
  var devWrap  = document.querySelector('.device-wrap');
  var lastStop = -1;

  /* -- orbit frame sequence ---------------------------------------------
     Source frames are 1280x720 (the video's native resolution). The canvas
     element can render as wide as ~1240 CSS px, which on a 2x/3x display
     needs 2480+ real pixels to look sharp — feeding it a fixed 1280x720
     buffer left the browser upscaling the whole canvas via CSS, which is a
     second, blurrier stretch on top of whatever drawImage already did.
     Sizing the raster to the element's own CSS box × devicePixelRatio
     makes drawImage do one clean upscale straight to native pixels. */
  var ORBIT_N = 80;
  var ORBIT_AR = 720 / 1280;
  var orbitCanvas = document.getElementById('orbitCanvas');
  var orbitCtx = orbitCanvas ? orbitCanvas.getContext('2d') : null;
  var orbitDeg = document.getElementById('orbitDeg');
  var orbitFrames = [];        // HTMLImageElement per frame, filled lazily
  var orbitLoaded = 0;
  var orbitStarted = false;
  var orbitFrame = -1;         // currently drawn frame
  var orbitTarget = 0;         // frame scroll wants
  var orbitShown = 0;          // smoothed position, for inertia
  var orbitDpr = Math.min(window.devicePixelRatio || 1, 2.5);
  var orbitRasterW = 0;        // last raster width set, so resize is a no-op when unchanged

  function orbitResize() {
    if (!orbitCanvas || !devWrap) return;
    // The canvas is display:none pre-orbit, so read the always-visible
    // wrap's width rather than the canvas's own (0x0) bounding rect.
    var cssW = devWrap.getBoundingClientRect().width;
    if (!cssW) return;
    var targetW = Math.round(cssW * orbitDpr);
    if (Math.abs(targetW - orbitRasterW) < 8) return;   // ignore sub-pixel jitter
    orbitRasterW = targetW;
    orbitCanvas.width = targetW;
    orbitCanvas.height = Math.round(targetW * ORBIT_AR);
    orbitCtx.imageSmoothingEnabled = true;
    orbitCtx.imageSmoothingQuality = 'high';
    orbitFrame = -1;   // new, blank buffer — force the next tick to redraw
  }

  function orbitLoad() {
    if (orbitStarted || !orbitCtx || reduced) return;
    orbitStarted = true;
    orbitResize();
    for (var i = 0; i < ORBIT_N; i++) {
      (function (i) {
        var im = new Image();
        im.decoding = 'async';
        im.src = 'img/orbit/f' + String(i).padStart(3, '0') + '.webp';
        im.onload = function () {
          orbitFrames[i] = im;
          orbitLoaded++;
          // switch over once the sequence is dense enough to look continuous
          if (orbitLoaded === Math.floor(ORBIT_N * 0.4)) {
            devWrap.classList.add('is-orbiting');
            orbitResize();      // wrap's box may have shifted going 4:3 -> 16:9
            orbitFrame = -1;
          }
        };
      })(i);
    }
  }

  function orbitDraw(f) {
    // nearest loaded frame at or below f, so gaps during load never blank
    var i = f;
    while (i >= 0 && !orbitFrames[i]) i--;
    if (i < 0) return;
    if (i === orbitFrame) return;
    orbitFrame = i;
    orbitCtx.drawImage(orbitFrames[i], 0, 0, orbitCanvas.width, orbitCanvas.height);
    if (orbitDeg) {
      orbitDeg.textContent = String(Math.round(i / (ORBIT_N - 1) * 360)).padStart(3, '0') + '°';
    }
  }

  function renderAnatomy(p) {
    var q = clamp((p - 0.05) / 0.9, 0, 1);
    var stop = clamp(Math.floor(q * STOPS), 0, STOPS - 1);

    if (stop !== lastStop) {
      for (var i = 0; i < STOPS; i++) {
        var on = i === stop;
        if (callouts[i]) callouts[i].classList.toggle('is-on', on);
        if (ticks[i])    ticks[i].classList.toggle('is-on', on);
      }
      lastStop = stop;
    }

    orbitTarget = q * (ORBIT_N - 1);
  }

  /* ---- nav / rail --------------------------------------------------- */
  var docH = 0;
  function measure() { docH = document.documentElement.scrollHeight - window.innerHeight; }
  measure();

  var ticking = false;
  function frame() {
    var y = window.scrollY || window.pageYOffset;

    if (fill && docH > 0) fill.style.transform = 'scaleX(' + clamp(y / docH, 0, 1).toFixed(4) + ')';
    if (nav) nav.classList.toggle('is-stuck', y > 40);

    // hero parallax, only while the hero is actually on screen
    if (y < window.innerHeight * 1.2) {
      var py = y * 0.28;
      for (var i = 0; i < heroImgs.length; i++) {
        heroImgs[i].style.setProperty('--heroY', py.toFixed(1) + 'px');
      }
    }

    if (!reduced) {
      if (anatSec) {
        renderAnatomy(sectionProgress(anatSec));
        // light inertia so fast flicks glide instead of strobing
        orbitShown = lerp(orbitShown, orbitTarget, 0.22);
        if (orbitCtx && devWrap.classList.contains('is-orbiting')) {
          orbitDraw(clamp(Math.round(orbitShown), 0, ORBIT_N - 1));
        }
      }
    }

    ticking = false;
  }

  // The camera lerp needs frames of its own, so run continuously while
  // the anatomy stage is anywhere near the viewport; otherwise only on
  // scroll. Cheap either way — this is a few property writes.
  var running = false;
  function loop() {
    frame();
    if (running) requestAnimationFrame(loop);
  }
  function setRunning(on) {
    if (on === running) return;
    running = on;
    if (on) requestAnimationFrame(loop);
  }

  window.addEventListener('scroll', function () {
    if (!running && !ticking) { ticking = true; requestAnimationFrame(frame); }
  }, { passive: true });

  window.addEventListener('resize', function () { measure(); orbitResize(); frame(); });

  if (anatSec && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) orbitLoad();   // fetch frames one screen early
      setRunning(es[0].isIntersecting);
    }, { rootMargin: '40% 0px' }).observe(anatSec);
    // Backgrounded tabs never fire IO; load once the user is anywhere near.
    window.addEventListener('scroll', function onFirst() {
      if (window.scrollY > anatSec.offsetTop - window.innerHeight * 2) {
        orbitLoad();
        window.removeEventListener('scroll', onFirst);
      }
    }, { passive: true });
  } else {
    setRunning(true);
    orbitLoad();
  }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) setRunning(false);
    else if (anatSec) {
      var r = anatSec.getBoundingClientRect();
      setRunning(r.top < window.innerHeight * 1.4 && r.bottom > -window.innerHeight * 0.4);
    }
  });

  frame();
  setTimeout(function () { measure(); frame(); }, 400);

  /* ==================================================================
     2. Hero — typed status line + lazy video
     ================================================================== */

  var bootLine = document.getElementById('bootLine');
  if (bootLine && !reduced) {
    var caret = bootLine.querySelector('.boot-caret');
    var msgs = [
      'SYS-2026 // rom v4.11 // no network required',
      'det: 0.11 uSv/h  nav: 21 sv  mesh: 4 units',
      'cartridge A mounted // 61.4 GB free',
      'scroll to run the power-on self test'
    ];
    var mi = 0, ci = 0, dir = 1, txt = document.createTextNode('');
    bootLine.insertBefore(txt, caret);
    (function type() {
      var m = msgs[mi];
      ci += dir;
      txt.nodeValue = m.slice(0, ci);
      var wait = dir > 0 ? 34 : 14;
      if (ci >= m.length) { dir = -1; wait = 2600; }
      else if (ci <= 0)   { dir = 1; mi = (mi + 1) % msgs.length; wait = 380; }
      setTimeout(type, wait);
    })();
  }

  function liveVideo(el) {
    if (!el || reduced) return;
    var started = false;
    function go() {
      if (started) return;
      started = true;
      el.load();
      var pr = el.play();
      if (pr && pr.catch) pr.catch(function () { started = false; });
    }
    el.addEventListener('playing', function () { el.classList.add('is-live'); });
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        if (es[0].isIntersecting) { go(); }
        else if (started && !el.paused) { el.pause(); }
      }, { threshold: 0.15 });
      io.observe(el);
    }
    // Backstop: a tab that loads in the background never fires IO.
    setTimeout(function () {
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) go();
    }, 1200);
  }
  liveVideo(document.getElementById('heroVideo'));
  liveVideo(document.getElementById('fieldVideo'));

  /* ==================================================================
     3. Reveal on scroll
     ================================================================== */

  var reveals = [].slice.call(document.querySelectorAll('.reveal'));
  if (reveals.length) {
    if ('IntersectionObserver' in window && !reduced) {
      var rio = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('is-in'); rio.unobserve(e.target); }
        });
      }, { rootMargin: '0px 0px -12% 0px' });
      reveals.forEach(function (el) { rio.observe(el); });
    }
    // A backgrounded tab can leave every observer un-fired; never let that
    // hide real content.
    setTimeout(function () { reveals.forEach(function (el) { el.classList.add('is-in'); }); }, 2500);
  }

  /* ==================================================================
     4. Nav — active section
     ================================================================== */

  var links = [].slice.call(document.querySelectorAll('.nav-links a'));
  var targets = links.map(function (a) { return document.querySelector(a.getAttribute('href')); });
  if ('IntersectionObserver' in window) {
    var nio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var i = targets.indexOf(e.target);
        if (i < 0) return;
        links.forEach(function (a, j) { a.classList.toggle('is-active', j === i); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    targets.forEach(function (t) { if (t) nio.observe(t); });
  }

  /* ==================================================================
     5. The terminal — modes, dial, switches, live readouts
     ================================================================== */

  var MODES = ['rad', 'nav', 'mesh', 'radio', 'vitals', 'data'];
  var UX = {
    rad:    'Radiation is the one number that has to be readable at arm\u2019s length, so it takes the whole top half and nothing competes with it. The bar strip underneath is sixty seconds of history \u2014 direction matters more than the digits.',
    nav:    'The compass is drawn, not written, because a heading is a direction before it is a number. Coordinates sit beside it in a fixed-width column so the digits never dance while you walk.',
    mesh:   'Every unit in range gets one row: who, how strong, how far. No pairing screens, no accounts, no notion of \u201conline\u201d \u2014 either a node answered a moment ago or it did not.',
    radio:  'The tuning strip gives the frequency a physical position, so a nudge of the dial has a place on a band rather than an abstract number jumping around.',
    vitals: 'A waveform first, numbers second. A trace tells you instantly whether the reading is trustworthy; three digits on their own never do.',
    data:   'Files, sizes, and the free space \u2014 the same list you would see on any card. Nothing is synced, so nothing can be in a state you did not put it in.'
  };

  var screen   = document.getElementById('screen');
  var panes    = {};
  [].slice.call(document.querySelectorAll('.pane')).forEach(function (p) {
    panes[p.getAttribute('data-pane')] = p;
  });
  var modeBtns = [].slice.call(document.querySelectorAll('.mode-list button'));
  var dial     = document.getElementById('dial');
  var dialFace = document.querySelector('.dial-face');
  var scrMode  = document.getElementById('scrMode');
  var uxBody   = document.getElementById('uxBody');
  var liveEl   = document.getElementById('liveStatus');
  var needle   = document.getElementById('gaugeNeedle');
  var idx = 0;

  function setMode(n, announce) {
    idx = (n + MODES.length) % MODES.length;
    var m = MODES[idx];

    for (var k in panes) panes[k].classList.toggle('is-on', k === m);
    modeBtns.forEach(function (b) {
      b.setAttribute('aria-selected', String(b.getAttribute('data-mode') === m));
    });
    if (scrMode) scrMode.textContent = m.toUpperCase();
    if (dialFace) dialFace.style.setProperty('--dialDeg', (idx * 55) + 'deg');
    if (dial) {
      dial.setAttribute('aria-valuenow', String(idx + 1));
      dial.setAttribute('aria-valuetext', m.toUpperCase());
    }
    if (uxBody) uxBody.textContent = UX[m];
    if (needle) needle.style.transform = 'rotate(' + (-62 + idx * 25) + 'deg)';

    // a short "refresh" flash, like a panel redrawing
    if (screen && !reduced) {
      screen.classList.add('is-lit');
      setTimeout(function () { screen.classList.remove('is-lit'); }, 110);
    }
    if (liveEl && announce !== false) {
      liveEl.textContent = 'Mode: ' + m.toUpperCase() + '. ' + (modeBtns[idx]
        ? modeBtns[idx].querySelector('span').textContent : '');
    }
  }

  modeBtns.forEach(function (b, i) {
    b.addEventListener('click', function () { setMode(i); });
  });

  /* ---- dial: drag, wheel, keys -------------------------------------- */
  if (dial) {
    var dragging = false, lastAngle = 0, acc = 0;

    function angleAt(ev) {
      var r = dial.getBoundingClientRect();
      return Math.atan2(ev.clientY - (r.top + r.height / 2),
                        ev.clientX - (r.left + r.width / 2)) * 180 / Math.PI;
    }

    dial.addEventListener('pointerdown', function (ev) {
      dragging = true; acc = 0; lastAngle = angleAt(ev);
      dial.setPointerCapture(ev.pointerId);
    });
    dial.addEventListener('pointermove', function (ev) {
      if (!dragging) return;
      var a = angleAt(ev), d = a - lastAngle;
      if (d > 180) d -= 360; else if (d < -180) d += 360;
      lastAngle = a; acc += d;
      while (acc >= 40)  { acc -= 40; setMode(idx + 1); }
      while (acc <= -40) { acc += 40; setMode(idx - 1); }
    });
    function endDrag(ev) {
      if (!dragging) return;
      dragging = false;
      try { dial.releasePointerCapture(ev.pointerId); } catch (e) {}
    }
    dial.addEventListener('pointerup', endDrag);
    dial.addEventListener('pointercancel', endDrag);

    dial.addEventListener('wheel', function (ev) {
      ev.preventDefault();
      setMode(idx + (ev.deltaY > 0 ? 1 : -1));
    }, { passive: false });

    dial.addEventListener('keydown', function (ev) {
      if (ev.key === 'ArrowRight' || ev.key === 'ArrowUp')   { ev.preventDefault(); setMode(idx + 1); }
      if (ev.key === 'ArrowLeft'  || ev.key === 'ArrowDown') { ev.preventDefault(); setMode(idx - 1); }
    });
  }

  // Arrow keys anywhere, as long as the console is on screen and you are
  // not typing into the form.
  document.addEventListener('keydown', function (ev) {
    if (ev.key !== 'ArrowLeft' && ev.key !== 'ArrowRight') return;
    var t = ev.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA')) return;
    if (t === dial) return; // already handled
    var rig = document.querySelector('.console-rig');
    if (!rig) return;
    var r = rig.getBoundingClientRect();
    if (r.bottom < 80 || r.top > window.innerHeight - 80) return;
    setMode(idx + (ev.key === 'ArrowRight' ? 1 : -1));
  });

  /* ---- panel switches ----------------------------------------------- */
  function toggle(btn, onChange) {
    if (!btn) return;
    btn.addEventListener('click', function () {
      var on = btn.getAttribute('aria-pressed') !== 'true';
      btn.setAttribute('aria-pressed', String(on));
      onChange(on);
    });
  }
  var screenOffState = false;
  toggle(document.getElementById('tglPower'), function (on) {
    screenOffState = !on;
    if (screen) screen.classList.toggle('is-off', !on);
    if (liveEl) liveEl.textContent = on ? 'Terminal on.' : 'Terminal off.';
  });
  toggle(document.getElementById('tglLight'), function (on) {
    if (screen) screen.style.filter = on ? 'brightness(1.28)' : '';
    if (liveEl) liveEl.textContent = 'Backlight ' + (on ? 'on' : 'off') + '.';
  });
  var phosRadios = [].slice.call(document.querySelectorAll('input[name="phosphor"]'));
  toggle(document.getElementById('tglPhos'), function (on) {
    setPhosphor(on ? 'amber' : 'green');
    var r = phosRadios.filter(function (x) { return x.value === (on ? 'amber' : 'green'); })[0];
    if (r && !r.checked) { r.checked = true; priceUpdate(); }
    if (liveEl) liveEl.textContent = 'Phosphor: ' + (on ? 'amber P3' : 'green P1') + '.';
  });

  function setPhosphor(kind) {
    if (!screen) return;
    if (kind === 'amber') screen.setAttribute('data-phos', 'amber');
    else screen.removeAttribute('data-phos');
    var t = document.getElementById('tglPhos');
    if (t) t.setAttribute('aria-pressed', String(kind === 'amber'));
  }

  /* ---- live readouts ------------------------------------------------ */
  var radValue = document.getElementById('radValue');
  var radState = document.getElementById('radState');
  var radAcc   = document.getElementById('radAcc');
  var radBars  = document.getElementById('radBars');
  var scrClock = document.getElementById('scrClock');
  var navHdg   = document.getElementById('navHdg');
  var navAlt   = document.getElementById('navAlt');
  var rose     = document.getElementById('compassRose');
  var meshWrap = document.getElementById('meshNodes');
  var vitHr    = document.getElementById('vitHr');
  var vitSpo   = document.getElementById('vitSpo');
  var vitTmp   = document.getElementById('vitTmp');
  var ecgLine  = document.getElementById('ecgLine');
  var radioSig = document.getElementById('radioSig');
  var tuner    = document.getElementById('tuner');

  var BARS = 34;
  if (radBars) {
    for (var b = 0; b < BARS; b++) radBars.appendChild(document.createElement('i'));
  }
  var barEls = radBars ? [].slice.call(radBars.children) : [];
  // Seed the history so the strip reads as a running trace from the first
  // paint rather than filling in from the left edge.
  var hist = [];
  for (var s0 = 0; s0 < BARS; s0++) hist.push(0.09 + Math.random() * 0.06);

  var NODES = [
    { id: 'UNIT-002', d: '2.1 km', s: 4 },
    { id: 'UNIT-007', d: '5.4 km', s: 3 },
    { id: 'RELAY-A',  d: '9.8 km', s: 2 },
    { id: 'UNIT-011', d: '11.6 km', s: 1 }
  ];
  if (meshWrap) {
    meshWrap.innerHTML = NODES.map(function (n) {
      return '<li><b>' + n.id + '</b><span class="n-s">' +
             '\u2588'.repeat(n.s) + '\u2591'.repeat(5 - n.s) +
             '</span><span class="n-d">' + n.d + '</span></li>';
    }).join('');
  }

  var hdg = 341, acc2 = 0.0043, t0 = 0;

  function ecg(t) {
    var pts = [], N = 60;
    for (var i = 0; i < N; i++) {
      var x = i / (N - 1) * 300;
      var ph = ((i + t) % 20) / 20;
      var v = 0;
      if (ph < 0.08) v = -2;
      else if (ph < 0.14) v = 22;          // R
      else if (ph < 0.2) v = -8;
      else if (ph < 0.34) v = 3;
      else v = Math.sin(ph * 12) * 1.2;
      pts.push(x.toFixed(1) + ',' + (35 - v).toFixed(1));
    }
    return pts.join(' ');
  }

  function tickData() {
    if (screenOffState) return;
    t0++;

    // clock
    if (scrClock) {
      var d = new Date();
      scrClock.textContent =
        String(d.getHours()).padStart(2, '0') + ':' +
        String(d.getMinutes()).padStart(2, '0') + ':' +
        String(d.getSeconds()).padStart(2, '0');
    }

    // radiation — a quiet background with the occasional count
    var base = 0.10 + Math.random() * 0.05;
    if (Math.random() < 0.07) base += Math.random() * 0.5;
    hist.push(base);
    if (hist.length > BARS) hist.shift();
    if (radValue) radValue.textContent = base.toFixed(2);
    if (radState) radState.textContent = base > 0.35 ? 'ELEVATED' : 'BACKGROUND';
    acc2 += base / 3600 / 1000 * 60;
    if (radAcc) radAcc.textContent = acc2.toFixed(4) + ' mSv';
    // Scale the strip to what has actually been seen, with a floor, so a
    // quiet background still reads as a waveform instead of a flat line.
    var peak = 0.22;
    for (var j = 0; j < hist.length; j++) if (hist[j] > peak) peak = hist[j];
    for (var i = 0; i < barEls.length; i++) {
      var v = hist[i - (BARS - hist.length)];
      barEls[i].style.setProperty('--v',
        (v === undefined ? 0.04 : clamp(v / peak * 0.92, 0.08, 1)).toFixed(3));
    }

    // navigation
    hdg = (hdg + (Math.random() - 0.5) * 3 + 360) % 360;
    var names = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
    if (navHdg) navHdg.textContent = Math.round(hdg) + '\u00B0 ' + names[Math.round(hdg / 22.5) % 16];
    if (rose) rose.style.transform = 'rotate(' + (-hdg).toFixed(1) + 'deg)';
    if (navAlt) navAlt.textContent = (438 + Math.round(Math.sin(t0 / 9) * 3)) + ' m';

    // vitals
    if (vitHr)  vitHr.textContent  = (62 + Math.round(Math.sin(t0 / 7) * 4 + Math.random() * 2)) + ' bpm';
    if (vitSpo) vitSpo.textContent = (97 + Math.round(Math.random())) + '%';
    if (vitTmp) vitTmp.textContent = (33.6 + Math.random() * 0.4).toFixed(1) + ' \u00B0C';
    if (ecgLine) ecgLine.setAttribute('points', ecg(t0 * 3));

    // radio
    if (radioSig) {
      var s = 3 + (Math.random() < 0.4 ? 1 : 0);
      radioSig.textContent = '\u2588'.repeat(s) + '\u2591'.repeat(5 - s);
    }
    if (tuner) tuner.style.setProperty('--tune', (54 + Math.sin(t0 / 11) * 2).toFixed(1) + '%');
  }

  var dataTimer = setInterval(tickData, 500);
  tickData();
  document.addEventListener('visibilitychange', function () {
    clearInterval(dataTimer);
    if (!document.hidden) dataTimer = setInterval(tickData, 500);
  });

  setMode(0, false);

  /* ==================================================================
     6. Configurator + reserve form
     ================================================================== */

  var BASE = 1480;
  var LABELS = {
    finish:    { olive: 'Olive drab', graphite: 'Graphite', raw: 'Raw aluminium' },
    phosphor:  { green: 'Green P1', amber: 'Amber P3' },
    strap:     { nylon: 'Ballistic nylon', lined: 'Leather-lined' },
    cartridge: { '64': '64 GB cartridge', '256': '256 GB cartridge' }
  };
  var NAMES = ['finish', 'phosphor', 'strap', 'cartridge'];
  var sumList  = document.getElementById('sumList');
  var sumTotal = document.getElementById('sumTotal');

  function priceUpdate() {
    if (!sumList) return;
    var total = BASE, rows = '';
    NAMES.forEach(function (n) {
      var el = document.querySelector('input[name="' + n + '"]:checked');
      if (!el) return;
      var add = +(el.getAttribute('data-price') || 0);
      total += add;
      rows += '<li><span>' + (LABELS[n][el.value] || el.value) + '</span><b>' +
              (add ? '+ $' + add : 'Included') + '</b></li>';
    });
    sumList.innerHTML = '<li><span>SYS-2026 base unit</span><b>$' + BASE.toLocaleString() + '</b></li>' + rows;
    sumTotal.textContent = '$' + total.toLocaleString();
  }

  NAMES.forEach(function (n) {
    [].slice.call(document.querySelectorAll('input[name="' + n + '"]')).forEach(function (r) {
      r.addEventListener('change', function () {
        priceUpdate();
        if (n === 'phosphor') setPhosphor(r.value);
      });
    });
  });
  priceUpdate();

  /* ---- form validation ---------------------------------------------- */
  var form = document.getElementById('resForm');
  if (form) {
    var FIELDS = [
      { id: 'rName',   err: 'eName',   test: function (v) { return v.trim().length >= 2; },
        msg: 'Please enter your name.' },
      { id: 'rEmail',  err: 'eEmail',  test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); },
        msg: 'That does not look like an email address.' },
      { id: 'rRegion', err: 'eRegion', test: function (v) { return v !== ''; },
        msg: 'Choose a region.' }
    ];

    function check(f, showEmpty) {
      var el = document.getElementById(f.id);
      var er = document.getElementById(f.err);
      var wrap = el.closest('.fld');
      var empty = el.value.trim() === '';
      if (empty && !showEmpty) { wrap.classList.remove('is-bad'); er.textContent = ''; return false; }
      var ok = f.test(el.value);
      wrap.classList.toggle('is-bad', !ok);
      er.textContent = ok ? '' : f.msg;
      el.setAttribute('aria-invalid', String(!ok));
      return ok;
    }

    FIELDS.forEach(function (f) {
      var el = document.getElementById(f.id);
      el.addEventListener('blur',  function () { check(f, true); });
      el.addEventListener('input', function () { if (el.closest('.fld').classList.contains('is-bad')) check(f, true); });
      el.addEventListener('change', function () { check(f, true); });
    });

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var ok = FIELDS.map(function (f) { return check(f, true); }).every(Boolean);
      var out = document.getElementById('resOk');
      if (!ok) {
        out.textContent = '';
        var bad = form.querySelector('.fld.is-bad input, .fld.is-bad select');
        if (bad) bad.focus();
        return;
      }
      var btn = document.getElementById('resSubmit');
      btn.disabled = true;
      btn.textContent = 'Logging\u2026';
      setTimeout(function () {
        btn.textContent = 'Reserved';
        out.textContent = 'Recorded on this page only \u2014 ' + sumTotal.textContent +
                          ', ' + document.getElementById('rEmail').value.trim() +
                          '. No request left your browser.';
        setTimeout(function () { btn.disabled = false; btn.textContent = 'Reserve this build'; }, 3200);
      }, 700);
    });
  }

  /* ==================================================================
     7. Expanding panels (specs + FAQ)

     Native <details> removes its content the instant `open` flips, so a
     closing panel has nothing left to animate. Here the click is taken
     over: opening sets `open` first and animates after, closing animates
     first and drops `open` on transitionend. Without JS the panels still
     open and close natively, just without the motion.
     ================================================================== */

  var panels = [].slice.call(document.querySelectorAll('.spec-groups details, .faq-list details'));

  function panelOpen(d) {
    d.open = true;
    // one frame at 0fr before going to 1fr, or the transition never starts
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { d.classList.add('is-open'); });
    });
    setTimeout(function () { d.classList.add('is-open'); }, 60);   // rAF-free fallback
  }

  function panelClose(d) {
    var body = d.querySelector('.det-body');
    d.classList.remove('is-open');
    if (!body || reduced) { d.open = false; return; }
    var done = false;
    var finish = function () {
      if (done) return;
      done = true;
      body.removeEventListener('transitionend', onEnd);
      if (!d.classList.contains('is-open')) d.open = false;
    };
    var onEnd = function (ev) { if (ev.propertyName === 'grid-template-rows') finish(); };
    body.addEventListener('transitionend', onEnd);
    setTimeout(finish, 500);
  }

  panels.forEach(function (d) {
    if (d.open) d.classList.add('is-open');
    var summary = d.querySelector('summary');
    if (!summary) return;
    summary.addEventListener('click', function (ev) {
      ev.preventDefault();
      if (d.classList.contains('is-open')) panelClose(d);
      else panelOpen(d);
      syncSpecToggle();
    });
  });

  var specToggle = document.getElementById('specToggle');
  var specToggleLabel = document.getElementById('specToggleLabel');
  var specPanels = [].slice.call(document.querySelectorAll('.spec-groups details'));

  function syncSpecToggle() {
    if (!specToggle) return;
    var all = specPanels.length > 0 && specPanels.every(function (d) {
      return d.classList.contains('is-open');
    });
    specToggle.setAttribute('aria-pressed', String(all));
    if (specToggleLabel) specToggleLabel.textContent = all ? 'Collapse all' : 'Expand all';
  }

  if (specToggle) {
    specToggle.addEventListener('click', function () {
      var opening = specToggle.getAttribute('aria-pressed') !== 'true';
      specPanels.forEach(function (d, i) {
        setTimeout(function () {
          if (opening) panelOpen(d); else panelClose(d);
        }, reduced ? 0 : i * 70);          // cascade, so the change is legible
      });
      setTimeout(syncSpecToggle, reduced ? 10 : specPanels.length * 70 + 40);
    });
    syncSpecToggle();
  }

  /* ==================================================================
     8. Inspiration note
     ================================================================== */

  var insp = document.getElementById('insp');
  var pop  = document.getElementById('inspPop');
  var close = document.getElementById('inspClose');
  function setPop(open) {
    if (!pop || !insp) return;
    pop.hidden = !open;
    insp.setAttribute('aria-expanded', String(open));
    if (open && close) close.focus();
  }
  if (insp) insp.addEventListener('click', function () { setPop(pop.hidden); });
  if (close) close.addEventListener('click', function () { setPop(false); insp.focus(); });
  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape' && pop && !pop.hidden) { setPop(false); insp.focus(); }
  });
  document.addEventListener('click', function (ev) {
    if (!pop || pop.hidden) return;
    if (pop.contains(ev.target) || insp.contains(ev.target)) return;
    setPop(false);
  });

})();

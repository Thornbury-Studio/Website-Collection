/* ============================================================
   PULSE — interaction layer
   Philosophy: bake expensive geometry once, animate cheaply,
   never run a loop for something nobody is looking at.
   ============================================================ */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  var hasLenis = typeof window.Lenis !== 'undefined';

  /* ---------- device tier: same design, fewer particles ---------- */
  var cores = navigator.hardwareConcurrency || 4;
  var narrow = window.innerWidth < 900;
  var tier = (cores <= 4 || narrow) ? 'low' : (cores <= 8 ? 'mid' : 'high');
  var DPR_CAP = tier === 'low' ? 1.5 : 2;

  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  /* ============================================================
     SMOOTH SCROLL
     ============================================================ */
  var lenis = null;
  if (hasLenis && !reduced) {
    lenis = new window.Lenis({
      duration: 1.15,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smoothWheel: true,
      touchMultiplier: 1.6
    });

    if (hasGSAP) {
      lenis.on('scroll', window.ScrollTrigger.update);
      window.gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      window.gsap.ticker.lagSmoothing(0);
    } else {
      (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(0);
    }
  }

  // anchor links routed through Lenis so momentum stays consistent
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (!id || id === '#') return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      closeMenu();
      if (lenis) lenis.scrollTo(target, { offset: -70, duration: 1.4 });
      else target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    });
  });

  /* ============================================================
     NAV
     ============================================================ */
  var nav = document.getElementById('nav');
  var navToggle = document.getElementById('navToggle');
  var mobileMenu = document.getElementById('mobileMenu');

  function onScrollNav() {
    nav.classList.toggle('scrolled', window.scrollY > 24);
  }
  window.addEventListener('scroll', onScrollNav, { passive: true });
  onScrollNav();

  function closeMenu() {
    if (!mobileMenu) return;
    mobileMenu.classList.remove('open');
    navToggle.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('is-locked');
    if (lenis) lenis.start();
  }
  if (navToggle) {
    navToggle.addEventListener('click', function () {
      var open = mobileMenu.classList.toggle('open');
      navToggle.classList.toggle('open', open);
      navToggle.setAttribute('aria-expanded', String(open));
      document.body.classList.toggle('is-locked', open);
      if (lenis) { open ? lenis.stop() : lenis.start(); }
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMenu();
  });

  /* ============================================================
     MOUSE-RESPONSIVE LIGHTING + FLOATING CARDS
     ============================================================ */
  var spotlight = document.getElementById('spotlight');
  var floatCards = Array.prototype.slice.call(document.querySelectorAll('.float-card'));
  var pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  var smooth = { x: pointer.x, y: pointer.y };
  var pointerFine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (pointerFine && !reduced) {
    window.addEventListener('mousemove', function (e) {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
    }, { passive: true });

    (function follow() {
      smooth.x = lerp(smooth.x, pointer.x, 0.12);
      smooth.y = lerp(smooth.y, pointer.y, 0.12);
      if (spotlight) {
        spotlight.style.transform = 'translate3d(' + smooth.x + 'px,' + smooth.y + 'px,0)';
      }
      // parallax the notification cards off centre-screen offset
      var cx = (smooth.x / window.innerWidth - 0.5);
      var cy = (smooth.y / window.innerHeight - 0.5);
      for (var i = 0; i < floatCards.length; i++) {
        var d = parseFloat(floatCards[i].dataset.depth) || 0.05;
        floatCards[i].style.transform =
          'translate3d(' + (-cx * d * 620).toFixed(2) + 'px,' + (-cy * d * 620).toFixed(2) + 'px,0)';
      }
      requestAnimationFrame(follow);
    })();
  }

  /* ============================================================
     MAGNETIC BUTTONS
     ============================================================ */
  if (pointerFine && !reduced) {
    document.querySelectorAll('[data-magnetic]').forEach(function (el) {
      var rect = null;
      el.addEventListener('mouseenter', function () { rect = el.getBoundingClientRect(); });
      el.addEventListener('mousemove', function (e) {
        if (!rect) rect = el.getBoundingClientRect();
        var mx = e.clientX - (rect.left + rect.width / 2);
        var my = e.clientY - (rect.top + rect.height / 2);
        el.style.transform = 'translate3d(' + mx * 0.28 + 'px,' + my * 0.4 + 'px,0)';
      });
      el.addEventListener('mouseleave', function () {
        rect = null;
        el.style.transform = '';
      });
    });
  }

  /* ============================================================
     REVEAL ON SCROLL (IntersectionObserver — no GSAP dependency)
     ============================================================ */
  var revealables = document.querySelectorAll('.reveal, .feature-visual');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.16, rootMargin: '0px 0px -8% 0px' });
    revealables.forEach(function (el) { io.observe(el); });
  } else {
    revealables.forEach(function (el) { el.classList.add('in'); });
  }

  /* ============================================================
     HERO — particle universe that assembles into a dashboard
     Targets are baked once; per frame we only lerp + one sin().
     ============================================================ */
  var heroCanvas = document.getElementById('heroCanvas');
  var hero = document.getElementById('hero');

  if (heroCanvas && hero) {
    var ctx = heroCanvas.getContext('2d', { alpha: true });
    var W = 0, H = 0, dpr = 1;
    var particles = [];
    var targets = [];
    var progress = 0;      // 0 = scattered universe, 1 = assembled dashboard
    var heroVisible = true;
    var COUNT = tier === 'high' ? 2400 : (tier === 'mid' ? 1400 : 620);

    var PALETTE = ['#7c5cff', '#22d3ee', '#f472b6', '#fbbf24', '#a3e635', '#5b7cfa'];

    /* ---- bake the dashboard geometry once ---- */
    function pushLine(x1, y1, x2, y2, n, color) {
      for (var i = 0; i <= n; i++) {
        var t = n === 0 ? 0 : i / n;
        targets.push({ x: lerp(x1, x2, t), y: lerp(y1, y2, t), c: color, s: 1 });
      }
    }
    function pushRect(x, y, w, h, step, color) {
      var nx = Math.max(2, Math.round(w / step));
      var ny = Math.max(2, Math.round(h / step));
      pushLine(x, y, x + w, y, nx, color);
      pushLine(x + w, y, x + w, y + h, ny, color);
      pushLine(x + w, y + h, x, y + h, nx, color);
      pushLine(x, y + h, x, y, ny, color);
    }

    function buildTargets() {
      targets.length = 0;

      // on wide screens the dashboard sits beside the copy instead of under it
      var wide = W > 1180;
      var bw = wide ? Math.min(W * 0.54, 1180) : Math.min(W * 0.88, 900);
      var bh = bw * 0.58;
      var cxCentre = wide ? W * 0.63 : W * 0.5;
      var bx = cxCentre - bw / 2;
      var by = (H - bh) / 2 + H * 0.02;
      var step = tier === 'low' ? 13 : 8;

      // outer frame
      pushRect(bx, by, bw, bh, step, '#7c5cff');

      // top chrome divider + sidebar divider
      var topY = by + bh * 0.13;
      pushLine(bx, topY, bx + bw, topY, Math.round(bw / step), '#5b7cfa');
      var sideX = bx + bw * 0.2;
      pushLine(sideX, topY, sideX, by + bh, Math.round((bh - bh * 0.13) / step), '#5b7cfa');

      // sidebar nav dashes
      for (var n = 0; n < 5; n++) {
        var ny2 = topY + bh * 0.1 + n * bh * 0.11;
        pushLine(bx + bw * 0.04, ny2, bx + bw * 0.15, ny2, 7, '#22d3ee');
      }

      // three KPI cards
      var padX = bx + bw * 0.25;
      var cardW = bw * 0.22;
      var cardH = bh * 0.2;
      var cardY = topY + bh * 0.08;
      for (var k = 0; k < 3; k++) {
        pushRect(padX + k * (cardW + bw * 0.025), cardY, cardW, cardH, step, PALETTE[k]);
      }

      // bar chart
      var chartX = padX;
      var chartW = bw * 0.72;
      var baseY = by + bh * 0.88;
      var chartTop = cardY + cardH + bh * 0.1;
      var bars = 9;
      var bwid = chartW / (bars * 1.65);
      for (var b = 0; b < bars; b++) {
        var bxp = chartX + b * (chartW / bars);
        var ratio = 0.28 + Math.abs(Math.sin(b * 1.13)) * 0.72;
        var bhh = (baseY - chartTop) * ratio;
        var col = b % 3 === 0 ? '#f472b6' : (b % 3 === 1 ? '#7c5cff' : '#22d3ee');
        // fill the bar with a light grid of points
        var cols = Math.max(2, Math.round(bwid / step));
        var rows = Math.max(2, Math.round(bhh / step));
        for (var cxi = 0; cxi <= cols; cxi++) {
          for (var ryi = 0; ryi <= rows; ryi++) {
            if ((cxi + ryi) % 2) continue; // half-density lattice
            targets.push({
              x: bxp + (cxi / cols) * bwid,
              y: baseY - (ryi / rows) * bhh,
              c: col, s: 1
            });
          }
        }
      }

      // baseline
      pushLine(chartX, baseY, chartX + chartW, baseY, Math.round(chartW / step), '#9a9ab0');

      // predictive curve riding over the bars
      var curveN = tier === 'low' ? 60 : 110;
      for (var q = 0; q <= curveN; q++) {
        var t2 = q / curveN;
        var yy = chartTop + (baseY - chartTop) * (0.62 - Math.sin(t2 * Math.PI * 1.7) * 0.34);
        targets.push({ x: chartX + t2 * chartW, y: yy, c: '#a3e635', s: 1.35 });
      }
    }

    function seedParticles() {
      particles.length = 0;

      // stride-sample the target list so a low particle budget still covers the
      // whole dashboard evenly, instead of only the shapes built first
      var nAssigned = Math.min(COUNT, targets.length);
      var stride = targets.length / nAssigned;

      for (var i = 0; i < nAssigned; i++) {
        var t = targets[Math.floor(i * stride)];
        particles.push({
          ox: Math.random() * W,
          oy: Math.random() * H,
          tx: t.x,
          ty: t.y,
          assigned: true,
          c: t.c,
          r: t.s * (0.85 + Math.random() * 0.6),
          // per-particle stagger so assembly cascades instead of snapping
          delay: Math.random() * 0.42,
          amp: 6 + Math.random() * 22,
          phase: Math.random() * Math.PI * 2,
          spd: 0.4 + Math.random() * 0.7,
          alpha: 0.55 + Math.random() * 0.45
        });
      }

      // ambient dust that never assembles — depth behind the structure
      var dust = Math.round(COUNT * 0.3);
      for (var j = 0; j < dust; j++) {
        particles.push({
          ox: Math.random() * W,
          oy: Math.random() * H,
          tx: 0, ty: 0,
          assigned: false,
          c: PALETTE[(Math.random() * PALETTE.length) | 0],
          r: 0.5 + Math.random() * 1.2,
          delay: 0,
          amp: 8 + Math.random() * 26,
          phase: Math.random() * Math.PI * 2,
          spd: 0.3 + Math.random() * 0.6,
          alpha: 0.16 + Math.random() * 0.3
        });
      }
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
      var r = hero.getBoundingClientRect();
      W = r.width;
      H = r.height;
      heroCanvas.width = Math.round(W * dpr);
      heroCanvas.height = Math.round(H * dpr);
      heroCanvas.style.width = W + 'px';
      heroCanvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildTargets();
      seedParticles();
    }

    var t0 = performance.now();
    function draw(now) {
      var time = (now - t0) * 0.001;
      ctx.clearRect(0, 0, W, H);
      // additive blending — overlapping points bloom for free
      ctx.globalCompositeOperation = 'lighter';

      // finish assembling before the pin releases, so the completed
      // dashboard gets a beat on screen instead of leaving with it
      var asm = clamp(progress / 0.72, 0, 1);

      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        var x, y, a = p.alpha;

        // one cheap trig pair per particle — the whole "life" budget
        var driftX = Math.sin(time * p.spd + p.phase) * p.amp;
        var driftY = Math.cos(time * p.spd * 0.82 + p.phase) * p.amp * 0.7;

        if (p.assigned) {
          var local = clamp((asm - p.delay) / (1 - p.delay), 0, 1);
          // ease-out so points settle instead of arriving linearly
          var e = 1 - Math.pow(1 - local, 3);
          x = lerp(p.ox + driftX, p.tx, e);
          y = lerp(p.oy + driftY, p.ty, e);
          a = p.alpha * (0.3 + e * 0.7);
        } else {
          x = p.ox + driftX;
          y = p.oy + driftY;
          a = p.alpha * (1 - asm * 0.6); // dust recedes as structure forms
        }

        ctx.globalAlpha = a;
        ctx.fillStyle = p.c;
        ctx.beginPath();
        ctx.arc(x, y, p.r, 0, 6.283185);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }

    var rafId = null;
    function loop(now) {
      draw(now);
      rafId = requestAnimationFrame(loop);
    }
    function start() { if (rafId === null) rafId = requestAnimationFrame(loop); }
    function stop() { if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; } }

    resize();
    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(resize, 180);
    });

    // never render for someone who isn't looking
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        heroVisible = es[0].isIntersecting;
        heroVisible && !document.hidden ? start() : stop();
      }, { threshold: 0 }).observe(hero);
    } else { start(); }

    document.addEventListener('visibilitychange', function () {
      document.hidden || !heroVisible ? stop() : start();
    });

    if (reduced) {
      progress = 1;
      draw(performance.now());
      stop();
    } else {
      start();
      // scroll-scrubbed assembly, pinned so it happens in place
      if (hasGSAP) {
        window.ScrollTrigger.create({
          trigger: hero,
          start: 'top top',
          end: '+=145%',
          pin: true,
          pinSpacing: true,
          scrub: 0.9,
          onUpdate: function (self) { progress = self.progress; }
        });
      } else {
        window.addEventListener('scroll', function () {
          progress = clamp(window.scrollY / (window.innerHeight * 0.9), 0, 1);
        }, { passive: true });
      }
    }

    // one frame lets the CSS transitions catch the initial state; the timeout is
    // the safety net for backgrounded tabs, where rAF can be throttled to a stop
    requestAnimationFrame(function () { hero.classList.add('ready'); });
    setTimeout(function () { hero.classList.add('ready'); }, 400);
  }

  /* ============================================================
     PARALLAX (hero ambient plate + flow image)
     ============================================================ */
  if (hasGSAP && !reduced) {
    document.querySelectorAll('[data-parallax]').forEach(function (el) {
      var amt = parseFloat(el.dataset.parallax) || 0.06;
      window.gsap.fromTo(el, { yPercent: amt * 100 }, {
        yPercent: -amt * 100, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });
    var sig = document.getElementById('signalBg');
    if (sig) {
      window.gsap.fromTo(sig, { scale: 1.14 }, {
        scale: 1, ease: 'none',
        scrollTrigger: { trigger: '.features', start: 'top bottom', end: 'bottom top', scrub: true }
      });
    }
  }

  /* ============================================================
     3D TILT on cards
     ============================================================ */
  if (pointerFine && !reduced) {
    document.querySelectorAll('[data-tilt]').forEach(function (el) {
      var r = null;
      el.addEventListener('mouseenter', function () { r = el.getBoundingClientRect(); });
      el.addEventListener('mousemove', function (e) {
        if (!r) r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform =
          'perspective(1100px) rotateY(' + (px * 7).toFixed(2) + 'deg) rotateX(' +
          (-py * 7).toFixed(2) + 'deg) translateY(-6px)';
      });
      el.addEventListener('mouseleave', function () {
        r = null;
        el.style.transform = '';
      });
    });
  }

  /* ============================================================
     STAT COUNTERS
     ============================================================ */
  function runCounter(el) {
    var end = parseFloat(el.dataset.count);
    var pre = el.dataset.prefix || '';
    var suf = el.dataset.suffix || '';
    var sep = el.dataset.sep === '1';
    var dur = 1900;
    var st = performance.now();

    function fmt(v) {
      var n = Math.round(v);
      return pre + (sep ? n.toLocaleString('en-US') : n) + suf;
    }
    (function tick(now) {
      var t = clamp((now - st) / dur, 0, 1);
      var e = 1 - Math.pow(1 - t, 4);
      el.textContent = fmt(end * e);
      if (t < 1) requestAnimationFrame(tick);
    })(st);
  }

  var statsEl = document.getElementById('stats');
  if (statsEl && 'IntersectionObserver' in window) {
    var sio = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return;
      statsEl.querySelectorAll('[data-count]').forEach(function (n, i) {
        if (reduced) {
          n.textContent = (n.dataset.prefix || '') +
            (n.dataset.sep === '1' ? (+n.dataset.count).toLocaleString('en-US') : n.dataset.count) +
            (n.dataset.suffix || '');
        } else {
          setTimeout(function () { runCounter(n); }, i * 110);
        }
      });
      sio.disconnect();
    }, { threshold: 0.4 });
    sio.observe(statsEl);
  }

  /* ============================================================
     LIVING PRODUCT SHOWCASE
     ============================================================ */
  var browser = document.getElementById('browser');
  var showcaseAlive = false;
  var timers = [];

  /* ---- animated chart ---- */
  var chart = document.getElementById('appChart');
  var chartCtx = chart ? chart.getContext('2d') : null;
  var seriesA = [], seriesB = [];
  var POINTS = 26;
  for (var s = 0; s < POINTS; s++) {
    seriesA.push(0.42 + Math.sin(s * 0.42) * 0.2 + Math.random() * 0.08);
    seriesB.push(0.38 + Math.sin(s * 0.42 + 0.6) * 0.17 + Math.random() * 0.08);
  }

  function drawChart() {
    if (!chartCtx) return;
    var w = chart.width, h = chart.height;
    chartCtx.clearRect(0, 0, w, h);

    // grid
    chartCtx.strokeStyle = 'rgba(255,255,255,0.055)';
    chartCtx.lineWidth = 1;
    for (var g = 0; g <= 4; g++) {
      var gy = (h / 4) * g + 0.5;
      chartCtx.beginPath();
      chartCtx.moveTo(0, gy);
      chartCtx.lineTo(w, gy);
      chartCtx.stroke();
    }

    function plot(arr, color, fill) {
      var stepX = w / (arr.length - 1);
      chartCtx.beginPath();
      for (var i = 0; i < arr.length; i++) {
        var x = i * stepX;
        var y = h - arr[i] * h * 0.86 - h * 0.07;
        if (i === 0) chartCtx.moveTo(x, y);
        else {
          var px = (i - 1) * stepX;
          var py = h - arr[i - 1] * h * 0.86 - h * 0.07;
          chartCtx.bezierCurveTo(px + stepX * 0.5, py, x - stepX * 0.5, y, x, y);
        }
      }
      chartCtx.strokeStyle = color;
      chartCtx.lineWidth = 2;
      chartCtx.stroke();

      if (fill) {
        chartCtx.lineTo(w, h);
        chartCtx.lineTo(0, h);
        chartCtx.closePath();
        var grd = chartCtx.createLinearGradient(0, 0, 0, h);
        grd.addColorStop(0, fill);
        grd.addColorStop(1, 'rgba(0,0,0,0)');
        chartCtx.fillStyle = grd;
        chartCtx.fill();
      }
    }

    plot(seriesA, '#7c5cff', 'rgba(124,92,255,0.22)');
    plot(seriesB, '#22d3ee', null);

    // leading dot on the predicted line
    var lastY = h - seriesA[seriesA.length - 1] * h * 0.86 - h * 0.07;
    chartCtx.beginPath();
    chartCtx.arc(w - 1, lastY, 3.5, 0, 6.283185);
    chartCtx.fillStyle = '#7c5cff';
    chartCtx.fill();
  }
  drawChart();

  function shiftChart() {
    seriesA.shift();
    seriesB.shift();
    var i = Date.now() * 0.001;
    seriesA.push(clamp(0.42 + Math.sin(i * 0.7) * 0.2 + (Math.random() - 0.5) * 0.16, 0.08, 0.94));
    seriesB.push(clamp(0.38 + Math.sin(i * 0.7 + 0.6) * 0.17 + (Math.random() - 0.5) * 0.14, 0.08, 0.9));
    drawChart();
  }

  /* ---- live activity feed ---- */
  var feedList = document.getElementById('feedList');
  var FEED = [
    { k: 'risk', t: 'Risk spike', b: '<b>Northwind Labs</b> moved to <b>91</b> — usage down 62%.' },
    { k: 'info', t: 'Playbook sent', b: 'Re-onboarding sequence queued for <b>Helix Digital</b>.' },
    { k: 'good', t: 'Recovered', b: '<b>Cobalt Systems</b> back to healthy. $84k retained.' },
    { k: 'info', t: 'Signal', b: 'Champion change detected at <b>Atlas Grid</b>.' },
    { k: 'good', t: 'Renewed', b: '<b>Verdant Co.</b> upgraded to annual. +$12.2k ARR.' },
    { k: 'risk', t: 'Invoice failed', b: 'Second retry failed for <b>Quantum Mile</b>.' },
    { k: 'info', t: 'Model updated', b: 'Weights refreshed on 4.2M new events.' }
  ];
  var feedIdx = 0;

  function pushFeed() {
    if (!feedList) return;
    var f = FEED[feedIdx % FEED.length];
    feedIdx++;
    var el = document.createElement('div');
    el.className = 'feed-item';
    el.innerHTML =
      '<div class="feed-top"><i class="fc-dot ' + f.k + '"></i>' + f.t + '</div>' +
      '<div class="feed-text">' + f.b + '</div>';
    feedList.insertBefore(el, feedList.firstChild);

    while (feedList.children.length > 4) {
      var last = feedList.lastElementChild;
      last.classList.add('leaving');
      (function (node) { setTimeout(function () { node.remove(); }, 380); })(last);
      if (feedList.children.length > 5) last.remove();
      break;
    }
  }

  /* ---- AI typing ---- */
  var aiEl = document.getElementById('aiType');
  var AI_LINES = [
    'Northwind Labs is the highest-value account at risk this week. Recommend a re-onboarding sequence — similar accounts recovered 71% of the time.',
    'Three enterprise accounts share the same signal: their champion left. Suggest routing all three to the retention pod today.',
    'Invoice friction is now your second-strongest churn predictor, up from fifth last quarter. Worth a billing review.'
  ];
  var aiLine = 0, aiChar = 0, aiTimer = null, aiHold = 0;

  function typeAI() {
    if (!aiEl) return;
    var line = AI_LINES[aiLine % AI_LINES.length];
    if (aiHold > 0) { aiHold--; return; }
    if (aiChar <= line.length) {
      aiEl.textContent = line.slice(0, aiChar);
      aiChar++;
      if (aiChar > line.length) aiHold = 46; // pause on a completed thought
    } else {
      aiChar = 0;
      aiLine++;
      aiEl.textContent = '';
    }
  }

  /* ---- KPI drift ---- */
  var kpiRisk = document.getElementById('kpiRisk');
  var kpiRec = document.getElementById('kpiRec');
  var kpiArr = document.getElementById('kpiArr');
  var riskV = 38, recV = 129, arrV = 1.84;

  function driftKPI() {
    riskV = clamp(riskV + (Math.random() < 0.5 ? -1 : 1), 31, 46);
    recV += Math.random() < 0.65 ? 1 : 0;
    arrV = clamp(arrV + (Math.random() - 0.35) * 0.02, 1.6, 2.4);
    if (kpiRisk) kpiRisk.textContent = riskV;
    if (kpiRec) kpiRec.textContent = recV;
    if (kpiArr) kpiArr.textContent = '$' + arrV.toFixed(2) + 'M';
  }

  /* ---- ghost cursor tour ---- */
  var ghost = document.getElementById('ghostCursor');
  var ghostStops = [[0.22, 0.34], [0.52, 0.28], [0.66, 0.62], [0.34, 0.74], [0.12, 0.5]];
  var ghostI = 0;

  function moveGhost() {
    if (!ghost || !browser) return;
    var r = browser.getBoundingClientRect();
    var s = ghostStops[ghostI % ghostStops.length];
    ghostI++;
    ghost.style.transition = 'transform 1.9s cubic-bezier(0.4,0,0.2,1), opacity 0.5s ease';
    ghost.style.transform = 'translate3d(' + (s[0] * r.width) + 'px,' + (s[1] * r.height) + 'px,0)';
  }

  function startShowcase() {
    if (showcaseAlive || reduced) return;
    showcaseAlive = true;
    pushFeed(); pushFeed(); pushFeed();
    moveGhost();
    timers.push(setInterval(shiftChart, 1400));
    timers.push(setInterval(pushFeed, 3600));
    timers.push(setInterval(typeAI, 34));
    timers.push(setInterval(driftKPI, 2600));
    timers.push(setInterval(moveGhost, 2600));
  }
  function stopShowcase() {
    showcaseAlive = false;
    timers.forEach(clearInterval);
    timers.length = 0;
  }

  if (browser && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) {
        browser.classList.add('in');
        if (!document.hidden) startShowcase();
      } else stopShowcase();
    }, { threshold: 0.22 }).observe(browser);

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stopShowcase();
    });
  } else if (browser) {
    browser.classList.add('in');
    startShowcase();
  }

  if (reduced && feedList) { pushFeed(); pushFeed(); pushFeed(); }
  if (reduced && aiEl) aiEl.textContent = AI_LINES[0];

  /* ============================================================
     PRICING TOGGLE
     ============================================================ */
  var toggle = document.getElementById('billToggle');
  var labM = document.getElementById('labMonthly');
  var labA = document.getElementById('labAnnual');
  var annual = false;

  function animatePrice(el, from, to) {
    if (reduced) { el.textContent = to; return; }
    var st = performance.now(), dur = 520;
    (function tick(now) {
      var t = clamp((now - st) / dur, 0, 1);
      var e = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(lerp(from, to, e));
      if (t < 1) requestAnimationFrame(tick);
    })(st);
  }

  function setBilling(isAnnual) {
    annual = isAnnual;
    toggle.classList.toggle('annual', annual);
    toggle.setAttribute('aria-checked', String(annual));
    labM.classList.toggle('on', !annual);
    labA.classList.toggle('on', annual);

    document.querySelectorAll('.price').forEach(function (p) {
      var from = parseInt(p.textContent, 10);
      var to = parseInt(annual ? p.dataset.a : p.dataset.m, 10);
      animatePrice(p, from, to);
    });
    document.querySelectorAll('[data-billed]').forEach(function (b) {
      b.textContent = annual ? 'Billed annually — 2 months free' : 'Billed monthly';
    });
  }

  if (toggle) {
    toggle.addEventListener('click', function () { setBilling(!annual); });
    labM.addEventListener('click', function () { setBilling(false); });
    labA.addEventListener('click', function () { setBilling(true); });
  }

  /* ============================================================
     FAQ ACCORDION
     ============================================================ */
  document.querySelectorAll('.faq-item').forEach(function (item) {
    var q = item.querySelector('.faq-q');
    var a = item.querySelector('.faq-a');
    q.addEventListener('click', function () {
      var isOpen = item.classList.contains('open');

      // close siblings for a single-open accordion
      document.querySelectorAll('.faq-item.open').forEach(function (other) {
        if (other === item) return;
        other.classList.remove('open');
        other.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
        other.querySelector('.faq-a').style.height = '0px';
      });

      if (isOpen) {
        a.style.height = a.scrollHeight + 'px';
        requestAnimationFrame(function () { a.style.height = '0px'; });
        item.classList.remove('open');
        q.setAttribute('aria-expanded', 'false');
      } else {
        item.classList.add('open');
        q.setAttribute('aria-expanded', 'true');
        a.style.height = a.scrollHeight + 'px';
        setTimeout(function () {
          if (item.classList.contains('open')) a.style.height = 'auto';
        }, 520);
      }
    });
  });

  /* ============================================================
     CTA PARTICLE FIELD
     ============================================================ */
  var ctaCanvas = document.getElementById('ctaCanvas');
  if (ctaCanvas && !reduced) {
    var cctx = ctaCanvas.getContext('2d');
    var cw = 0, ch = 0, cdpr = 1;
    var dots = [];
    var CN = tier === 'high' ? 130 : (tier === 'mid' ? 90 : 50);
    var cRaf = null;
    var ctaSection = document.getElementById('cta');

    function ctaResize() {
      cdpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
      var r = ctaSection.getBoundingClientRect();
      cw = r.width; ch = r.height;
      ctaCanvas.width = Math.round(cw * cdpr);
      ctaCanvas.height = Math.round(ch * cdpr);
      ctaCanvas.style.width = cw + 'px';
      ctaCanvas.style.height = ch + 'px';
      cctx.setTransform(cdpr, 0, 0, cdpr, 0, 0);

      dots.length = 0;
      var pal = ['#7c5cff', '#22d3ee', '#f472b6', '#fbbf24', '#a3e635'];
      for (var i = 0; i < CN; i++) {
        dots.push({
          x: Math.random() * cw,
          y: Math.random() * ch,
          r: 0.8 + Math.random() * 2.4,
          c: pal[(Math.random() * pal.length) | 0],
          a: 0.18 + Math.random() * 0.5,
          sp: 0.25 + Math.random() * 0.55,
          ph: Math.random() * 6.283,
          amp: 10 + Math.random() * 34
        });
      }
    }

    var ct0 = performance.now();
    function ctaLoop(now) {
      var t = (now - ct0) * 0.001;
      cctx.clearRect(0, 0, cw, ch);
      for (var i = 0; i < dots.length; i++) {
        var d = dots[i];
        var x = d.x + Math.sin(t * d.sp + d.ph) * d.amp;
        var y = d.y + Math.cos(t * d.sp * 0.8 + d.ph) * d.amp * 0.6;
        cctx.globalAlpha = d.a * (0.6 + Math.sin(t * 1.4 + d.ph) * 0.4);
        cctx.fillStyle = d.c;
        cctx.beginPath();
        cctx.arc(x, y, d.r, 0, 6.283185);
        cctx.fill();
      }
      cctx.globalAlpha = 1;
      cRaf = requestAnimationFrame(ctaLoop);
    }

    ctaResize();
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(ctaResize, 200);
    });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        if (es[0].isIntersecting && !document.hidden) {
          if (cRaf === null) cRaf = requestAnimationFrame(ctaLoop);
        } else if (cRaf !== null) {
          cancelAnimationFrame(cRaf); cRaf = null;
        }
      }, { threshold: 0 }).observe(ctaSection);
    } else {
      cRaf = requestAnimationFrame(ctaLoop);
    }
  }

  /* ---------- misc ---------- */
  var yr = document.getElementById('year');
  if (yr) yr.textContent = new Date().getFullYear();

  // duplicate the logo track so the marquee loops seamlessly
  var track = document.getElementById('proofTrack');
  if (track) {
    track.innerHTML += track.innerHTML;
  }

  // ScrollTrigger needs a refresh once fonts/images settle the layout
  if (hasGSAP) {
    window.addEventListener('load', function () { window.ScrollTrigger.refresh(); });
  }
})();

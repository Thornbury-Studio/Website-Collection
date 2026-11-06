/* PROOF. — the night shift.
   Scroll runs a clock from 02:00 to 07:00. One sticky stage per hour, a flour-dust canvas,
   odometer numerals, and a pair of panels that part at 07:00. GSAP + Lenis + SplitType,
   no bundler. Reduced motion (and no JS) get the stacked page; see css/style.css. */
(function () {
  'use strict';
  var root = document.documentElement;
  if (!window.gsap || root.classList.contains('rm')) { root.classList.add('rm'); window.__proofReady = true; return; }
  window.__proofReady = true;

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var ease = function (t) { return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; };
  gsap.registerPlugin(ScrollTrigger);

  var chs = $$('.ch'), open = $('#open'), menu = $('#menu'), coffee = $('.coffee'), foot = $('.foot');
  var header = $('#top'), clock = $('#clock'), live = $('#hour-live');
  var motionOn = true;

  /* ---------- smooth scroll ---------- */
  var lenis = null;
  function startLenis() {
    if (!window.Lenis || lenis) return;
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
  }
  startLenis();
  gsap.ticker.add(function (t) { if (lenis) lenis.raf(t * 1000); });
  gsap.ticker.lagSmoothing(0);
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href').slice(1), el = id && document.getElementById(id);
      if (!el || a.classList.contains('skip')) return;
      e.preventDefault();
      var dist = Math.abs(el.getBoundingClientRect().top);
      if (lenis) lenis.scrollTo(el, { duration: clamp(dist / 2600, 0.9, 4.2), offset: 0 });
      else el.scrollIntoView({ behavior: 'auto', block: 'start' });
      history.replaceState(null, '', '#' + id);
    });
  });
  var scrollY = function () { return lenis ? lenis.scroll : window.scrollY; };

  /* ---------- geometry cache ---------- */
  var geo = {};
  function measure() {
    var y = window.scrollY, vh = window.innerHeight;
    geo.vh = vh;
    geo.ch = chs.map(function (c) { var r = c.getBoundingClientRect(); return { top: r.top + y, len: Math.max(1, r.height - vh), el: c, hour: +c.dataset.hour }; });
    var o = open.getBoundingClientRect(); geo.open = { top: o.top + y, len: Math.max(1, o.height - vh) };
    var m = menu.getBoundingClientRect(); geo.menuTop = m.top + y;
    var cf = coffee.getBoundingClientRect(); geo.cof = [cf.top + y, cf.bottom + y];
    geo.foot = foot.getBoundingClientRect().top + y;
    var k = [{ y: -1e5, m: 120 }];
    geo.ch.forEach(function (c, i) {
      k.push({ y: c.top, m: c.hour * 60 }, { y: c.top + c.len, m: c.hour * 60 + 59 });
    });
    k.push({ y: geo.open.top, m: 419.6 }, { y: geo.open.top + geo.open.len * 0.18, m: 420 }, { y: 1e7, m: 420 });
    geo.keys = k;
  }
  function minutesAt(y) {
    var k = geo.keys;
    for (var i = 1; i < k.length; i++) {
      if (y <= k[i].y) { var a = k[i - 1], b = k[i]; return a.m + (b.m - a.m) * clamp((y - a.y) / Math.max(1, b.y - a.y), 0, 1); }
    }
    return 420;
  }

  /* ---------- the clock: odometer reels that settle on whole minutes ---------- */
  var reels = [], prox = { h: 0, t: 0, o: 0 };
  (function buildClock() {
    ['z', 'h', ':', 't', 'o'].forEach(function (s) {
      if (s === ':') { var c = document.createElement('span'); c.className = 'colon'; c.textContent = ':'; clock.appendChild(c); return; }
      var reel = document.createElement('span'); reel.className = 'reel';
      var col = document.createElement('div');
      var n = s === 'z' ? 1 : s === 't' ? 7 : 11, mod = s === 't' ? 6 : 10;
      for (var i = 0; i < n; i++) { var d = document.createElement('i'); d.textContent = s === 'z' ? '0' : String(i % mod); col.appendChild(d); }
      reel.appendChild(col); clock.appendChild(reel);
      if (s !== 'z') reels.push({ k: s, col: col, n: n, mod: mod, set: gsap.quickSetter(col, 'yPercent') });
    });
  })();
  function renderClock() { reels.forEach(function (r) { r.set(-((prox[r.k] % r.mod) / r.n) * 100); }); }
  var tw = {};
  ['h', 't', 'o'].forEach(function (k) { tw[k] = gsap.quickTo(prox, k, { duration: .6, ease: 'power3.out', onUpdate: renderClock }); });
  var lastWhole = -1;
  function setClock(m, instant) {
    var w = Math.floor(m + 0.0001);
    if (w === lastWhole && !instant) return;
    lastWhole = w;
    var h = Math.floor(w / 60), t = Math.floor(w / 10), o = w;
    if (instant) { prox.h = h; prox.t = t; prox.o = o; renderClock(); return; }
    tw.h(h); tw.t(t); tw.o(o);
  }

  /* ---------- video ladder ---------- */
  function wanted() {
    var c = navigator.connection, w = window.innerWidth, d = Math.min(window.devicePixelRatio || 1, 2);
    if (c && (c.saveData || /(^|-)(2g|3g)$/.test(c.effectiveType || ''))) return 720;
    if (w < 900) return 720;
    if (w >= 2200 || w * d >= 3000) return 2160;
    return 1080;
  }
  function pick(v) {
    var rungs = v.dataset.rungs.split(',').map(Number), want = wanted();
    for (var i = 0; i < rungs.length; i++) if (rungs[i] <= want) return rungs[i];
    return rungs[rungs.length - 1];
  }
  var videos = $$('video[data-name]'), ready = false;
  function ensureSrc(v) { if (!v.src && ready && v.__near && !v.hasAttribute('data-late')) v.src = 'video/' + v.dataset.name + '-' + pick(v) + '.mp4'; }
  var vio = new IntersectionObserver(function (es) {
    es.forEach(function (e) { var v = e.target; v.__near = e.isIntersecting; ensureSrc(v); syncVideo(v); });
  }, { rootMargin: '60% 0px 60% 0px', threshold: 0 });
  var vis = new IntersectionObserver(function (es) {
    es.forEach(function (e) { e.target.__on = e.isIntersecting && e.intersectionRatio > 0.2; syncVideo(e.target); });
  }, { threshold: [0, 0.2, 0.5] });
  function syncVideo(v) {
    if (!v.src) return;
    if (motionOn && v.__on && !document.hidden) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } else v.pause();
  }
  videos.forEach(function (v) {
    v.addEventListener('playing', function () { v.classList.add('is-playing'); });
    vio.observe(v); vis.observe(v);
  });
  document.addEventListener('visibilitychange', function () { videos.forEach(syncVideo); });
  /* nothing is fetched before the page has loaded, so the poster is the first view */
  function go() { ready = true; videos.forEach(function (v) { ensureSrc(v); syncVideo(v); }); }
  window.addEventListener('load', function () { (window.requestIdleCallback || function (f) { setTimeout(f, 300); })(go, { timeout: 1500 }); });

  /* ---------- the dust: pure points, 2D canvas ---------- */
  var cv = $('#dust'), ctx = cv.getContext('2d'), W = 0, H = 0, dpr = 1;
  var small = window.innerWidth < 820, N = small ? 200 : 560;
  var P = [];
  for (var i = 0; i < N; i++) P.push({ x: Math.random(), y: Math.random(), z: .25 + Math.random() * .75, ph: Math.random() * 6.28, e: Math.random() < .35 });
  function sprite(r, g, b) {
    var s = document.createElement('canvas'); s.width = s.height = 48;
    var c = s.getContext('2d'), gr = c.createRadialGradient(24, 24, 0, 24, 24, 24);
    gr.addColorStop(0, 'rgba(' + r + ',' + g + ',' + b + ',1)'); gr.addColorStop(.4, 'rgba(' + r + ',' + g + ',' + b + ',.35)'); gr.addColorStop(1, 'rgba(' + r + ',' + g + ',' + b + ',0)');
    c.fillStyle = gr; c.fillRect(0, 0, 48, 48); return s;
  }
  var SP_F = sprite(246, 236, 216), SP_E = sprite(238, 130, 52);
  function size() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  var D = [[120, 1], [150, .9], [180, .55], [240, .38], [290, .2], [300, .16], [330, .2], [360, .34], [419, .42], [420, .5]];
  function density(m) {
    if (m >= 420) return 0;
    for (var i = 1; i < D.length; i++) if (m <= D[i][0]) { var a = D[i - 1], b = D[i]; return a[1] + (b[1] - a[1]) * (m - a[0]) / (b[0] - a[0]); }
    return 0;
  }
  var burst = 0, burstDone = false, lastT = 0, cleared = false, minutes = 120, vel = 0;
  function dust(t) {
    var dt = Math.min(.05, (t - lastT) / 1000 || .016); lastT = t;
    var d = motionOn ? density(minutes) : 0;
    burst = Math.max(0, burst - dt * .7);
    var active = Math.floor(N * clamp(d + burst, 0, 1));
    var ember = minutes >= 300 && minutes < 360 ? .55 : minutes >= 240 ? .12 : 0;
    var wind = clamp(vel * .06, -60, 60);
    var dayHidden = geo.open && scrollY() > geo.open.top + geo.open.len * .75 && burst <= 0;
    if (!active || dayHidden || document.hidden) { if (!cleared) { ctx.clearRect(0, 0, W, H); cleared = true; } return; }
    cleared = false;
    ctx.clearRect(0, 0, W, H);
    var tt = t / 1000;
    for (var i = 0; i < active; i++) {
      var p = P[i];
      p.x += (Math.sin(p.y * 5 + tt * .35 + p.ph) * .010 + .004 * p.z) * dt * 3;
      p.y += (-.012 * p.z - burst * .09 * p.z + wind * .00018 * p.z) * dt * 3;
      if (p.y < -.05) { p.y = 1.05; p.x = Math.random(); } else if (p.y > 1.05) p.y = -.05;
      if (p.x > 1.05) p.x = -.05; else if (p.x < -.05) p.x = 1.05;
      var s = (6 + p.z * 22) * (1 + burst * .6);
      var tw = .6 + .4 * Math.sin(tt * .9 + p.ph * 3);
      ctx.globalAlpha = (.04 + p.z * .12) * tw;
      var isE = ember > 0 && p.ph / 6.28 < ember;
      ctx.drawImage(isE ? SP_E : SP_F, p.x * W - s / 2, p.y * H - s / 2, s, s);
    }
    ctx.globalAlpha = 1;
  }

  /* ---------- reveals ---------- */
  var splitDone = [];
  chs.forEach(function (c, idx) {
    var title = $('h1,h2', c), copy = $('.copy', c), kids = $$('.copy > *', c).filter(function (e) { return e !== title; });
    var label = title.textContent.trim();
    var sp = new SplitType(title, { types: 'words,chars' });
    title.setAttribute('aria-label', label);
    gsap.set(sp.chars, { yPercent: 70, opacity: 0 });
    var played = false;
    function play() {
      if (played) return; played = true;
      gsap.to(sp.chars, { yPercent: 0, opacity: 1, duration: .9, ease: 'power3.out', stagger: .014 });
      gsap.fromTo(kids, { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: .9, ease: 'power3.out', stagger: .12, delay: .25 });
    }
    gsap.set(title, { opacity: 1 });
    ScrollTrigger.create({ trigger: c, start: 'top 62%', once: true, onEnter: play });
    if (idx === 0) play();
  });
  // doors copy
  var dayBack = $$('.day-back > *');
  // menu bars
  var bars = $$('.bar i');
  ScrollTrigger.create({
    trigger: '.rows', start: 'top 80%', once: true,
    onEnter: function () { gsap.to(bars, { '--k': 1, duration: 1.1, ease: 'power3.out', stagger: .09 }); }
  });
  gsap.set(bars, { '--k': 0 });


  /* ---------- the live menu: where Singapore's clock sits on the bake-time bars ---------- */
  var board = $('#board'), nowline = $('.nowline', board), rowsEl = $$('.row', board);
  function sgMinutes() {
    var q = new URLSearchParams(location.search).get('now');   /* ?now=08:15 previews a time of day */
    if (q && /^\d{1,2}:\d{2}$/.test(q)) { var p = q.split(':'); return +p[0] * 60 + +p[1]; }
    var f = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Singapore', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date()), o = {};
    f.forEach(function (x) { o[x.type] = x.value; });
    return (+o.hour % 24) * 60 + +o.minute;
  }
  var nowFrac = 0, grow = { v: 0 };
  function placeNow() {
    var m = sgMinutes(), pad = function (n) { return String(n).padStart(2, '0'); };
    var open = m >= 420 && m <= 780;
    nowFrac = open ? clamp((m - 300) / 480, 0, 1) : .25;      /* closed: a ghost tick at the doors, 07:00 */
    nowline.hidden = false; board.classList.add('is-live'); board.classList.toggle('is-idle', !open); nowline.classList.toggle('is-idle', !open);
    board.style.setProperty('--now', (nowFrac * grow.v).toFixed(4));
    $('span', nowline).textContent = open ? 'Now ' + pad(Math.floor(m / 60)) + ':' + pad(m % 60) : 'Doors 07:00';
    rowsEl.forEach(function (r) {
      var to = parseFloat(getComputedStyle(r).getPropertyValue('--to')), end = 300 + to * 480;
      r.classList.toggle('is-gone', open && m > end);
    });
  }
  placeNow(); setInterval(placeNow, 30000);
  ScrollTrigger.create({ trigger: board, start: 'top 78%', once: true, onEnter: function () { gsap.to(grow, { v: 1, duration: 1.6, ease: 'power3.out', onUpdate: function () { board.style.setProperty('--now', (nowFrac * grow.v).toFixed(4)); } }); } });


  var mpics = $$('.menu-photo picture'), mrows = $$('.row[data-photo]');
  if (mpics.length) {
    var mio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var role = e.target.dataset.photo;
        mpics.forEach(function (p) { p.classList.toggle('is-on', p.dataset.role === role); });
      });
    }, { rootMargin: '-42% 0px -48% 0px', threshold: 0 });
    mrows.forEach(function (r) { mio.observe(r); });
  }

  /* ---------- per-frame work ---------- */
  var doors = { l: $('.door--l'), r: $('.door--r'), bloom: $('.bloom') };
  var lastIdx = -1, burstArmed = true, prevPo = 0;
  var insets = chs.map(function (c) { return $('.inset', c); });
  var plates = chs.map(function (c) { return $('.plate', c); });
  var copies = chs.map(function (c) { return $('.copy', c); });

  function frame(time) {
    var y = scrollY();
    vel = lenis ? lenis.velocity : 0;
    minutes = minutesAt(y);
    setClock(minutes, false);
    clock.style.setProperty('--b', clamp(Math.abs(vel) * .035, 0, 7) + 'px');

    // chapter-local motion
    var cur = -1;
    for (var i = 0; i < geo.ch.length; i++) {
      var g = geo.ch[i], p = clamp((y - g.top) / g.len, 0, 1);
      if (y >= g.top - 1 && y < g.top + g.len + geo.vh * .5) cur = i;
      if (y > g.top - geo.vh && y < g.top + g.len + geo.vh) {
        plates[i].style.transform = 'scale(' + (1 + p * .07).toFixed(4) + ')';
        var fade = clamp((p - .9) / .1, 0, 1);
        copies[i].style.opacity = String(1 - fade * .9);
        if (insets[i]) {
          if (p > .12) { var iv = $('video', insets[i]); if (iv && iv.hasAttribute('data-late')) { iv.removeAttribute('data-late'); ensureSrc(iv); syncVideo(iv); } }
          var k = ease(clamp((p - .28) / .22, 0, 1)) * (1 - fade);
          insets[i].style.opacity = k.toFixed(3);
          insets[i].style.transform = 'translateY(' + ((1 - k) * 30).toFixed(1) + 'px)';
        }
      }
    }
    if (cur !== lastIdx && cur >= 0) {
      lastIdx = cur;
      clock.setAttribute('data-pos', geo.ch[cur].el.classList.contains('ch--split') ? 'r' : geo.ch[cur].el.classList.contains('ch--low') ? 't' : 'l');
      var t = String(geo.ch[cur].hour).padStart(2, '0') + ':00';
      live.textContent = t + ', ' + $('.eyebrow', geo.ch[cur].el).textContent.replace(/Hour \d of \d/, '').trim();
    }

    // doors
    var po = clamp((y - geo.open.top) / geo.open.len, 0, 1), t2 = ease(clamp((po - .03) / .5, 0, 1));
    doors.l.style.transform = 'translate3d(' + (-t2 * 101).toFixed(2) + '%,0,0)';
    doors.r.style.transform = 'translate3d(' + (t2 * 101).toFixed(2) + '%,0,0)';
    doors.bloom.style.setProperty('--bs', (.2 + t2 * .9).toFixed(3));
    doors.bloom.style.setProperty('--bo', (clamp(t2 * 1.3, 0, 1) * (.85 - clamp((po - .7) / .3, 0, 1) * .5)).toFixed(3));
    var dk = clamp((po - .74) / .16, 0, 1);
    open.style.setProperty('--wash', clamp((po - .82) / .18, 0, 1).toFixed(3));
    for (var j = 0; j < dayBack.length; j++) { dayBack[j].style.opacity = String(clamp((dk - j * .12) * 3, 0, 1)); dayBack[j].style.transform = 'translateY(' + ((1 - dk) * 24).toFixed(1) + 'px)'; }
    if (po > .26 && po < .7 && burstArmed && prevPo <= .26) { burst = 1; }
    burstArmed = po < .1 ? true : burstArmed;
    prevPo = po;

    // clock hides once the panels take over the numeral at the seam
    if (y > geo.open.top + geo.vh * .1) clock.setAttribute('data-hide', ''); else clock.removeAttribute('data-hide');

    // header colour: dark text only over the cream ground
    var yy = y + 34, day = yy > geo.menuTop - 10 && !(yy > geo.cof[0] && yy < geo.cof[1]) && yy < geo.foot;
    header.dataset.theme = day ? 'day' : 'night';

    dust(time);
  }

  /* ---------- motion switch ---------- */
  var btn = $('#motion');
  btn.setAttribute('aria-pressed', 'true');
  btn.addEventListener('click', function () {
    motionOn = !motionOn;
    root.classList.toggle('motion-off', !motionOn);
    btn.setAttribute('aria-pressed', String(motionOn));
    $('b', btn).textContent = motionOn ? 'on' : 'off';
    videos.forEach(syncVideo);
    if (!motionOn && lenis) { lenis.destroy(); lenis = null; } else if (motionOn) startLenis();
  });

  /* ---------- go ---------- */
  measure(); size(); setClock(minutesAt(scrollY()), true);
  var rz;
  window.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(function () { size(); measure(); ScrollTrigger.refresh(); }, 150); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { measure(); ScrollTrigger.refresh(); });
  window.addEventListener('load', function () { measure(); ScrollTrigger.refresh(); });
  gsap.ticker.add(frame);
})();

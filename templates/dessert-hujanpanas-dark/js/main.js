/* Hujan Panas: reads the weather, re-sorts the board, plays the right film.
   The page is complete without this file (see tools/bake.mjs); everything here is enhancement. */
(function () {
  'use strict';
  var root = document.documentElement;
  var HP = window.HP;
  if (!HP) { root.classList.add('rm'); window.__hpReady = true; return; }
  window.__hpReady = true;
  root.classList.remove('nojs-ish');

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduced = root.classList.contains('rm');
  var motionOn = !reduced && !root.classList.contains('still');
  var loaded = false;

  /* ---------- where the numbers come from ---------- */
  var PRESET = { 'panas': [32.6, 0], 'hujan': [28.4, 0.6], 'downpour': [27.6, 2.4], 'hujan-panas': [31.2, 0.6], 'redup': [28.8, 0] };
  var q = new URLSearchParams(location.search);
  var forced = null;
  if (q.has('weather') && PRESET[q.get('weather')]) forced = { temp: PRESET[q.get('weather')][0], rain: PRESET[q.get('weather')][1], source: 'preview' };
  if (q.has('temp') || q.has('rain')) {
    var t0 = parseFloat(q.get('temp')), r0 = parseFloat(q.get('rain'));
    forced = { temp: isFinite(t0) ? HP.clamp(t0, 20, 38) : 29, rain: isFinite(r0) ? HP.clamp(r0, 0, 20) : 0, source: 'preview' };
  }
  var liveReading = null, current = forced || HP.typical();

  /* ---------- hero film per state ---------- */
  var FILMS = {
    'panas': { L: 'sun', P: 'sunv' },
    'hujan': { L: 'leaves', P: 'railv' },
    'downpour': { L: 'street', P: 'skyv' },
    'hujan-panas': { L: 'sun', P: 'railv' },
    'redup': { L: 'leaves', P: 'skyv' }
  };
  var RUNGS = { sun: [2160, 1080, 720], leaves: [2160, 1080, 720], street: [2160, 1080, 720],
    sunv: [2160, 1080, 720], railv: [2160, 1080, 720], skyv: [1080, 720] };
  var portraitMQ = window.matchMedia('(max-width: 899px) and (orientation: portrait)');
  function wanted(portrait) {
    var c = navigator.connection, w = window.innerWidth, d = Math.min(window.devicePixelRatio || 1, 2);
    if (c && (c.saveData || /(^|-)(2g|3g)$/.test(c.effectiveType || ''))) return 720;
    var px = portrait ? w * d : w * d;
    if (portrait) return px >= 1500 ? 1080 : 720;
    if (w < 900) return 720;
    if (w >= 2200 || px >= 3000) return 2160;
    return 1080;
  }
  function rung(name, want) {
    var r = RUNGS[name] || [1080, 720];
    for (var i = 0; i < r.length; i++) if (r[i] <= want) return r[i];
    return r[r.length - 1];
  }
  var heroVideo = $('#now-video'), heroPoster = $('#now-poster'), heroFilm = null;
  /* the baked poster stays until we know whether a live reading is coming, so a first view never fetches two posters */
  var filmGate = !!forced, pendingFilm = null;
  function filmKey(st, rain) { return st === 'hujan' && rain >= 1.5 ? 'downpour' : st; }
  function setPoster(f) {
    var srcs = heroPoster.querySelectorAll('source'), img = heroPoster.querySelector('img');
    var P = f.P, L = f.L;
    srcs[0].srcset = 'img/p-' + P + '-540.avif 540w, img/p-' + P + '-1080.avif 1080w';
    srcs[1].srcset = 'img/p-' + P + '-540.webp 540w, img/p-' + P + '-1080.webp 1080w';
    srcs[2].srcset = 'img/p-' + L + '-960.avif 960w, img/p-' + L + '-1920.avif 1920w';
    img.srcset = 'img/p-' + L + '-960.webp 960w, img/p-' + L + '-1920.webp 1920w';
    img.src = 'img/p-' + L + '-1920.webp';
  }
  function setHeroFilm(key, force) {
    if (!filmGate) { pendingFilm = key; return; }
    var f = FILMS[key], portrait = portraitMQ.matches, name = portrait ? f.P : f.L;
    var src = 'video/' + name + '-' + rung(name, wanted(portrait)) + '.mp4';
    if (heroFilm && heroFilm.key === key && heroFilm.src === src && !force) return;
    var changedKey = !heroFilm || heroFilm.key !== key;
    heroFilm = { key: key, src: src };
    /* with motion on, the film covers the poster, so the baked poster stays and no second one is fetched */
    if (changedKey && !motionOn) setPoster(f);
    if (!loaded || !motionOn) { heroVideo.removeAttribute('src'); heroVideo.classList.remove('is-playing'); return; }
    heroVideo.classList.remove('is-playing');
    heroVideo.src = src;
    playIfVisible(heroVideo);
  }
  heroVideo.addEventListener('playing', function () { heroVideo.classList.add('is-playing'); });
  portraitMQ.addEventListener && portraitMQ.addEventListener('change', function () { if (heroFilm) setHeroFilm(heroFilm.key, true); });

  /* ---------- chapter films: only the ones near the screen load ---------- */
  var chapterVideos = $$('video[data-name]');
  function playIfVisible(v) {
    if (!v.getAttribute('src')) return;
    if (motionOn && v.__on !== false && !document.hidden) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } else v.pause();
  }
  function ensureSrc(v) {
    if (v.getAttribute('src') || !loaded || !motionOn || !v.__near) return;
    var r = v.dataset.rungs.split(',').map(Number), want = v.hasAttribute('data-portrait') ? (window.innerWidth * Math.min(window.devicePixelRatio || 1, 2) >= 1300 ? 1080 : 720) : wanted(false);
    var pick = r[r.length - 1];
    for (var i = 0; i < r.length; i++) if (r[i] <= want) { pick = r[i]; break; }
    v.src = 'video/' + v.dataset.name + '-' + pick + '.mp4';
  }
  var near = new IntersectionObserver(function (es) {
    es.forEach(function (e) { e.target.__near = e.isIntersecting; ensureSrc(e.target); });
  }, { rootMargin: '50% 0px 50% 0px' });
  var seen = new IntersectionObserver(function (es) {
    es.forEach(function (e) { e.target.__on = e.isIntersecting; playIfVisible(e.target); });
  }, { threshold: 0.15 });
  chapterVideos.forEach(function (v) {
    v.addEventListener('playing', function () { v.classList.add('is-playing'); });
    near.observe(v); seen.observe(v);
  });
  seen.observe(heroVideo);
  document.addEventListener('visibilitychange', function () { chapterVideos.concat(heroVideo).forEach(playIfVisible); });

  /* ---------- rain: abstract streaks, density from millimetres ---------- */
  var canvas = $('#rain'), ctx = canvas.getContext('2d'), drops = [], rainMM = 0, rainWarm = false, rafId = 0, heroOn = true, lastT = 0;
  function sizeCanvas() {
    var d = Math.min(window.devicePixelRatio || 1, 1.5), r = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(r.width * d)); canvas.height = Math.max(1, Math.round(r.height * d));
    ctx.setTransform(d, 0, 0, d, 0, 0);
  }
  function seedDrops() {
    var r = canvas.getBoundingClientRect(), n = rainMM <= 0 ? 0 : Math.round((rainMM >= 1.5 ? 380 : 150) * (r.width < 700 ? 0.55 : 1));
    drops = [];
    for (var i = 0; i < n; i++) drops.push({ x: Math.random() * r.width * 1.2, y: Math.random() * r.height, l: 12 + Math.random() * 26, v: 700 + Math.random() * 700, a: 0.12 + Math.random() * 0.3 });
  }
  function drawRain(t) {
    rafId = 0;
    if (!motionOn || !heroOn || document.hidden || !drops.length) { ctx.clearRect(0, 0, canvas.width, canvas.height); return; }
    var dt = Math.min(0.05, (t - (lastT || t)) / 1000); lastT = t;
    var r = canvas.getBoundingClientRect(), w = r.width, h = r.height, slant = 0.16;
    ctx.clearRect(0, 0, w, h);
    ctx.lineCap = 'round'; ctx.lineWidth = 1.1;
    var col = rainWarm ? '255,214,170' : '214,236,232';
    for (var i = 0; i < drops.length; i++) {
      var p = drops[i];
      p.y += p.v * dt; p.x -= p.v * dt * slant;
      if (p.y - p.l > h) { p.y = -p.l - Math.random() * 60; p.x = Math.random() * w * 1.2; }
      ctx.strokeStyle = 'rgba(' + col + ',' + p.a + ')';
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + p.l * slant, p.y - p.l); ctx.stroke();
    }
    rafId = requestAnimationFrame(drawRain);
  }
  function kickRain() { if (!rafId && motionOn && heroOn && drops.length) { lastT = 0; rafId = requestAnimationFrame(drawRain); } else if (!drops.length || !motionOn) ctx.clearRect(0, 0, canvas.width, canvas.height); }
  new IntersectionObserver(function (es) { heroOn = es[0].isIntersecting; kickRain(); }).observe($('#now'));
  window.addEventListener('resize', function () { sizeCanvas(); seedDrops(); kickRain(); });

  /* ---------- numbers that roll ---------- */
  /* the first live reading lands while the page is still settling: apply it without animation */
  var t0Page = performance.now();
  function quiet() { return performance.now() - t0Page < 6000 && !userTouched; }
  var userTouched = false;
  ['pointerdown', 'keydown'].forEach(function (ev) { window.addEventListener(ev, function () { userTouched = true; }, { once: true, passive: true }); });
  function rollTo(el, to, digits) {
    var from = parseFloat(el.textContent) || 0;
    if (!motionOn || quiet() || Math.abs(from - to) < 0.05) { el.textContent = to.toFixed(digits); return; }
    var t0 = performance.now(), dur = 700;
    (function step(t) {
      var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = (from + (to - from) * e).toFixed(digits);
      if (k < 1) requestAnimationFrame(step);
    })(t0);
  }

  /* ---------- the board ---------- */
  var list = $('#dishes'), firstRender = true;
  var rows = {};
  $$('.dish', list).forEach(function (li) { rows[li.dataset.id] = li; });
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  /* ---------- the hero board: five lines, the dish, the usual-day slide ---------- */
  var heroList = $('#now-three'), heroRows = {}, heroWhen = $('#hb-when'), intro = root.classList.contains('intro'), heroLatest = null;
  $$('li', heroList).forEach(function (li) { heroRows[li.dataset.id] = li; });
  var byId = {}; HP.MENU.forEach(function (it) { byId[it.id] = it; });
  function heroRow(id) {
    if (heroRows[id]) return heroRows[id];
    var li = document.createElement('li'), n = document.createElement('span'), nm = document.createElement('span'), mv = document.createElement('span');
    li.dataset.id = id; li.style.viewTransitionName = 'h-' + id;
    n.className = 'hb__n'; nm.className = 'hb__nm'; nm.textContent = byId[id].name; mv.className = 'hb__mv';
    mv.append(document.createElement('span'), document.createElement('span')); mv.firstChild.setAttribute('aria-hidden', 'true'); mv.lastChild.className = 'sr-only';
    li.append(n, nm, mv); return (heroRows[id] = li);
  }
  function paintHero(ids, moves, when) {
    heroList.replaceChildren.apply(heroList, ids.slice(0, 5).map(function (id, i) {
      var li = heroRow(id), mv = li.querySelector('.hb__mv'), m = moves ? moves[id] : 0;
      li.querySelector('.hb__n').textContent = pad(i + 1);
      mv.dataset.move = !moves ? 'same' : m > 0 ? 'up' : m < 0 ? 'down' : 'same';
      mv.firstChild.textContent = moves ? HP.moveText(m) : '';
      mv.lastChild.textContent = moves ? HP.moveSr(m) : 'its place on a usual day';
      return li;
    }));
    heroWhen.textContent = when;
  }
  var dishFig = $('#hb-dish');
  function heroDish(ranked) {
    if (!dishFig) return;
    var it = ranked.filter(function (r) { return r.item.img; })[0].item;
    $('#hb-dish-tag').textContent = ranked[0].item.id === it.id ? 'No. 1 right now' : 'Highest with a photograph';
    $('#hb-dish-name').textContent = it.name; $('#hb-dish-price').textContent = 'S$' + it.price.toFixed(2);
    if (dishFig.dataset.id === it.id && dishFig.dataset.on) return;
    if (!loaded) { dishFig.dataset.id = it.id; return; }
    var src = dishFig.querySelector('source'), img = dishFig.querySelector('img');
    src.srcset = 'img/' + it.img + '-640.avif 640w, img/' + it.img + '-1280.avif 1280w';
    img.srcset = 'img/' + it.img + '-640.webp 640w, img/' + it.img + '-1280.webp 1280w';
    img.src = 'img/' + it.img + '-640.webp';
    img.alt = (rows[it.id] && rows[it.id].dataset.alt) || it.name;
    dishFig.dataset.id = it.id; dishFig.dataset.on = '1';
  }
  if (intro) {
    paintHero(HP.USUAL, null, 'On a usual day');
    heroWhen.parentNode.classList.add('is-usual');
    root.classList.remove('intro');
  }

  function reorder(ranked) {
    var order = ranked.map(function (r) { return r.item.id; });
    var now = $$('.dish', list).map(function (li) { return li.dataset.id; });
    var mvs = HP.moves(ranked);
    heroLatest = ranked;
    function apply() {
      order.forEach(function (id, i) { var li = rows[id]; li.querySelector('.dish__rank').textContent = pad(i + 1); list.appendChild(li); });
      if (!intro) { paintHero(order, mvs, 'Right now'); heroDish(ranked); }
    }
    if (order.join() === now.join() && (intro || heroList.firstElementChild && heroList.firstElementChild.dataset.id === order[0])) { if (!intro) { paintHero(order, mvs, 'Right now'); heroDish(ranked); } return; }
    if (document.startViewTransition && motionOn && !firstRender && !quiet()) {
      var vt = document.startViewTransition(apply);
      [vt.ready, vt.finished, vt.updateCallbackDone].forEach(function (p) { if (p && p.catch) p.catch(function () {}); });
    } else apply();
  }

  /* ---------- the dial (try another afternoon) ---------- */
  var tempIn = $('#dial-temp'), tempOut = $('#dial-temp-out'), rainIns = $$('input[name="rain"]'), liveBtn = $('#dial-live');
  function syncDial(w) {
    tempIn.value = w.temp.toFixed(1);
    tempIn.setAttribute('aria-valuetext', w.temp.toFixed(1) + ' degrees');
    tempOut.textContent = w.temp.toFixed(1) + '°C';
    tempIn.style.setProperty('--fill', ((w.temp - 24) / 11 * 100).toFixed(1) + '%');
    var best = rainIns[0], bd = 99;
    rainIns.forEach(function (r) { var d = Math.abs(parseFloat(r.value) - w.rain); if (d < bd) { bd = d; best = r; } });
    best.checked = true;
  }
  function fromDial() {
    var r = rainIns.filter(function (x) { return x.checked; })[0];
    render({ temp: parseFloat(tempIn.value), rain: r ? parseFloat(r.value) : 0, source: 'dial' }, true);
  }
  tempIn.addEventListener('input', function () {
    tempOut.textContent = parseFloat(tempIn.value).toFixed(1) + '°C';
    tempIn.setAttribute('aria-valuetext', parseFloat(tempIn.value).toFixed(1) + ' degrees');
    tempIn.style.setProperty('--fill', ((tempIn.value - 24) / 11 * 100).toFixed(1) + '%');
  });
  tempIn.addEventListener('change', fromDial);
  var dragT = 0;
  tempIn.addEventListener('input', function () { clearTimeout(dragT); dragT = setTimeout(fromDial, 160); });
  rainIns.forEach(function (r) { r.addEventListener('change', fromDial); });
  liveBtn.addEventListener('click', function () { render(liveReading || forced || HP.typical()); });

  /* ---------- render one reading everywhere ---------- */
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  function where(w) {
    if (w.source === 'live') return 'Now, ' + w.station;
    if (w.source === 'dial') return 'An afternoon you set';
    if (w.source === 'preview') return 'Preview';
    var part = w.hour < 12 ? 'morning' : w.hour < 18 ? 'afternoon' : 'evening';
    return 'A typical ' + MONTHS[w.month] + ' ' + part + ' in Singapore';
  }
  function sourceLine(w) {
    if (w.source === 'live') {
      var tm = w.time ? new Date(w.time) : null;
      var hh = tm ? tm.toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Singapore' }) : '';
      return 'Live from the NEA station at ' + w.station + (hh ? ', read at ' + hh : '') + '. Rain from ' + (w.rainStation || 'the nearest gauge') + '.';
    }
    if (w.source === 'dial') return 'You moved the dial. The real weather is one button away.';
    if (w.source === 'preview') return 'Preview from the address bar. Remove ?weather or ?temp to read the real sky.';
    return 'No live reading reached this page, so these are the usual numbers for this month and hour.';
  }
  function render(w, fromUser) {
    current = w;
    var st = HP.state(w.temp, w.rain), words = HP.WORDS[st], c = HP.coolness(w.temp, w.rain), ranked = HP.rank(w.temp, w.rain);
    var now = $('#now');
    now.dataset.state = st;
    root.style.setProperty('--cool', c.toFixed(3));
    $('#now-where').textContent = where(w);
    rollTo($('#now-temp'), w.temp, 1);
    rollTo($('#now-rain'), w.rain, 1);
    $('#now-word').textContent = words.word;
    $('#now-line').textContent = words.line;
    $('#now-src').textContent = sourceLine(w);
    reorder(ranked);
    var mv = HP.moves(ranked);
    ranked.forEach(function (r) {
      var el = rows[r.item.id].querySelector('.dish__move'), n = mv[r.item.id];
      el.dataset.move = n > 0 ? 'up' : n < 0 ? 'down' : 'same';
      el.firstElementChild.textContent = HP.moveText(n);
      el.lastElementChild.textContent = HP.moveSr(n);
    });
    var lead = ranked.filter(function (r) { return r.item.img; })[0].item, fig = $('#board-lead');
    if (fig && fig.dataset.id !== lead.id) {
      fig.dataset.id = lead.id;
      var src = fig.querySelector('source'), img = fig.querySelector('img'), n2 = lead.img;
      src.srcset = 'img/' + n2 + '-640.avif 640w, img/' + n2 + '-1280.avif 1280w';
      img.srcset = 'img/' + n2 + '-640.webp 640w, img/' + n2 + '-1280.webp 1280w';
      img.src = 'img/' + n2 + '-1280.webp';
      img.alt = rows[lead.id].dataset.alt || lead.name;
      fig.querySelector('b').textContent = lead.name;
    }
    $('#board-live').textContent = 'Board sorted for ' + w.temp.toFixed(1) + ' degrees and ' + w.rain.toFixed(1) + ' millimetres of rain. First: ' + ranked[0].item.name + '.';
    if (!fromUser) syncDial(w);
    liveBtn.hidden = w.source !== 'dial';
    rainMM = w.rain; rainWarm = st === 'hujan-panas';
    sizeCanvas(); seedDrops(); kickRain();
    setHeroFilm(filmKey(st, w.rain));
    firstRender = false;
  }
  render(current);

  /* NEA, now and every five minutes, unless a preview is forced */
  function openGate() { if (filmGate) return; filmGate = true; setHeroFilm(pendingFilm || 'hujan'); }
  function poll() {
    if (forced) return;
    HP.live(4500).then(function (w) {
      if (w) { liveReading = w; if (current.source !== 'dial') render(w); }
      openGate();
    });
  }
  poll();
  setInterval(poll, 5 * 60 * 1000);

  /* nothing heavy is fetched before the page has loaded: the poster is the first view */
  window.addEventListener('load', function () {
    (window.requestIdleCallback || function (f) { setTimeout(f, 200); })(function () {
      loaded = true;
      if (heroFilm) setHeroFilm(heroFilm.key, true);
      if (heroLatest) heroDish(heroLatest);
      if (intro) setTimeout(function () {
        intro = false;
        heroWhen.parentNode.classList.remove('is-usual');
        var r = heroLatest, ids = r.map(function (x) { return x.item.id; }), m = HP.moves(r);
        var go = function () { paintHero(ids, m, 'Right now'); };
        if (document.startViewTransition && motionOn) { var vt = document.startViewTransition(go); [vt.ready, vt.finished, vt.updateCallbackDone].forEach(function (p) { if (p && p.catch) p.catch(function () {}); }); } else go();
      }, 900);
      chapterVideos.forEach(function (v) { ensureSrc(v); playIfVisible(v); });
    }, { timeout: 1200 });
  });

  /* ---------- header gets a ground once the hero has gone ---------- */
  var top = $('.top'), solid = false;
  function paintTop() { var s = window.scrollY > 60; if (s !== solid) { solid = s; top.classList.toggle('is-solid', s); } }
  window.addEventListener('scroll', paintTop, { passive: true }); paintTop();

  /* ---------- the October chart grows when it is seen ---------- */
  var chart = $('.log__svg');
  if (chart) {
    root.classList.add('log-armed');
    new IntersectionObserver(function (es, o) { if (es[0].isIntersecting) { chart.classList.add('in'); o.disconnect(); } }, { threshold: 0.3 }).observe(chart);
  }

  /* ---------- smooth scroll and the warm-end run (GSAP + Lenis), desktop only ---------- */
  /* Phones scroll natively and get no pin, so they never download these three files. */
  var lenis = null, hasGsap = false;
  function startLenis() {
    if (!window.Lenis || lenis || !motionOn || !hasGsap) return;
    lenis = new Lenis({ lerp: 0.11, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
  }
  function loadScript(src) { return new Promise(function (res, fail) { var el = document.createElement('script'); el.src = src; el.onload = res; el.onerror = fail; document.head.appendChild(el); }); }
  function initMotion() {
    hasGsap = !!(window.gsap && window.ScrollTrigger);
    if (!hasGsap) return;
    gsap.registerPlugin(ScrollTrigger);
    gsap.ticker.add(function (t) { if (lenis) lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    startLenis();
    var mm = gsap.matchMedia();
    mm.add('(min-width: 900px)', function () {
      var track = $('#warm-track');
      root.classList.add('warm-pinned');
      var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };
      gsap.to(track, { x: function () { return -dist(); }, ease: 'none',
        scrollTrigger: { trigger: '#warm', start: 'top top', end: function () { return '+=' + dist(); }, pin: true, scrub: 0.6, invalidateOnRefresh: true } });
      return function () { root.classList.remove('warm-pinned'); };
    });
    $$('.board__title, .warm__intro h2, .cool h2, .pot h2, .kueh h2, .log h2, .visit h2').forEach(function (el) {
      if (el.getBoundingClientRect().top < window.innerHeight) return;
      gsap.from(el, { y: 36, opacity: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
    });
    ScrollTrigger.refresh();
  }
  if (!reduced && window.matchMedia('(min-width: 900px)').matches) {
    var go = function () {
      loadScript('vendor/gsap.min.js').then(function () { return Promise.all([loadScript('vendor/ScrollTrigger.min.js'), loadScript('vendor/lenis.min.js')]); })
        .then(initMotion).catch(function () {});
    };
    if (document.readyState === 'complete') go(); else window.addEventListener('load', go);
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href'), el = id.length > 1 && document.querySelector(id);
    if (!el) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(el, { offset: 0, duration: 1.2 }); else el.scrollIntoView({ behavior: motionOn ? 'smooth' : 'auto' });
    if (el.tabIndex < 0 && !/^(A|BUTTON|INPUT)$/.test(el.tagName)) el.setAttribute('tabindex', '-1');
    el.focus({ preventScroll: true });
    history.replaceState(null, '', id);
  });

  /* ---------- the Motion switch: for anyone, not only those with a system setting ---------- */
  var btn = $('#motion');
  function paintBtn() { btn.setAttribute('aria-pressed', String(!motionOn)); btn.querySelector('b').textContent = motionOn ? 'on' : 'off'; }
  paintBtn();
  if (reduced) btn.hidden = true;
  btn.addEventListener('click', function () {
    motionOn = !motionOn;
    root.classList.toggle('still', !motionOn);
    try { localStorage.setItem('hp-motion', motionOn ? 'on' : 'off'); } catch (e) {}
    paintBtn();
    if (motionOn) {
      startLenis();
      if (heroFilm) setHeroFilm(heroFilm.key, true);
      chapterVideos.forEach(function (v) { ensureSrc(v); playIfVisible(v); });
      kickRain();
    } else {
      if (lenis) { lenis.destroy(); lenis = null; }
      chapterVideos.concat(heroVideo).forEach(function (v) { v.pause(); });
      if (heroFilm) setPoster(FILMS[heroFilm.key]);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  });
})();

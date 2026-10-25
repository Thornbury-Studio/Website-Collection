/* Page behaviour: the three-state switch, the scroll scrub on the home hero,
   the callout leader lines, and reveals. Content never depends on any of it. */

(function () {
  'use strict';

  var root = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isHome = root.getAttribute('data-page') === 'home';
  var WORLDS = ['living', 'scan', 'glass'];
  var BG = ['#0a0807', '#071a3d', '#061214'];       // mirrors --bg and --scan in style.css, so a world
  var SCAN = ['#ffb25e', '#7cf5da', '#8ee8f2'];     // change never has to read computed style
  var CAPTIONS = [
    '00 — Day 0, 09:40. The bloom opens.',
    '01 — Day 0, 14:10. 212 photographs, one depth map.',
    '02 — Week 11. The same bloom, in glass.'
  ];

  var radios = Array.prototype.slice.call(document.querySelectorAll('input[name="state"]'));
  var stageEl = document.querySelector('[data-stage]');
  var hero = document.querySelector('[data-hero]');
  var caption = document.getElementById('state-line');
  var rel = null;
  var world = 0;
  var phase = 0, target = 0, lockY = null;
  var ticking = false;

  function stored() {
    try { var w = WORLDS.indexOf(localStorage.getItem('pp-world')); return w < 0 ? 0 : w; } catch (e) { return 0; }
  }

  function applyWorld(i) {
    world = i;
    root.setAttribute('data-world', WORLDS[i]);
    radios.forEach(function (r) { r.checked = r.value === WORLDS[i]; });
    if (caption) caption.firstElementChild.textContent = CAPTIONS[i];
    if (rel) rel.setAccent(SCAN[i]);
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute('content', BG[i]);
    if (!isHome) { try { localStorage.setItem('pp-world', WORLDS[i]); } catch (e) { /* storage may be blocked */ } }
  }

  function followPhase() {
    var w = world;
    if (phase > world + 0.54) w = Math.min(2, Math.round(phase));
    else if (phase < world - 0.54) w = Math.max(0, Math.round(phase));
    if (w !== world) applyWorld(w);
  }

  function tick() {
    var d = target - phase;
    if (reduced || Math.abs(d) < 0.0015) { phase = target; ticking = false; } else { phase += d * 0.13; }
    if (rel) rel.setPhase(phase);
    followPhase();
    if (ticking) requestAnimationFrame(tick);
  }
  function setTarget(t) {
    target = Math.max(0, Math.min(2, t));
    if (!ticking) { ticking = true; requestAnimationFrame(tick); }
  }

  /* scroll position on the pinned hero -> where the front has got to */
  function ease(x) { return x * x * (3 - 2 * x); }
  function scrollPhase() {
    var r = hero.getBoundingClientRect();
    var total = r.height - window.innerHeight;
    var p = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0;
    if (p < 0.07) return 0;
    if (p < 0.33) return ease((p - 0.07) / 0.26);
    if (p < 0.55) return 1;
    if (p < 0.85) return 1 + ease((p - 0.55) / 0.30);
    return 2;
  }
  var pin = hero && hero.querySelector('.pin');
  function onScroll() {
    if (!hero || reduced) return;
    var leave = 1 - Math.min(1, Math.max(0, (window.innerHeight - hero.getBoundingClientRect().bottom) / (window.innerHeight * 0.35)));
    if (pin) { pin.style.opacity = leave.toFixed(3); pin.style.visibility = leave < 0.01 ? 'hidden' : ''; }
    if (lockY !== null) {
      if (Math.abs(window.scrollY - lockY) < 60) return;
      lockY = null;
    }
    setTarget(scrollPhase());
  }

  radios.forEach(function (r) {
    r.addEventListener('change', function () {
      var i = WORLDS.indexOf(r.value);
      applyWorld(i);
      lockY = window.scrollY;
      setTarget(i);
    });
  });

  /* ---- callouts: leader lines that follow the relief ---- */
  var leaders = stageEl && stageEl.querySelector('.leaders');
  var items = [];
  var NS = 'http://www.w3.org/2000/svg';
  var lastKey = '';

  function buildLeaders() {
    if (!leaders) return;
    Array.prototype.forEach.call(stageEl.querySelectorAll('.callout'), function (li) {
      var line = document.createElementNS(NS, 'polyline');
      var dot = document.createElementNS(NS, 'circle');
      var ring = document.createElementNS(NS, 'circle');
      dot.setAttribute('r', '2.6'); ring.setAttribute('r', '7'); ring.setAttribute('class', 'ring');
      leaders.appendChild(line); leaders.appendChild(ring); leaders.appendChild(dot);
      items.push({ el: li, u: parseFloat(li.dataset.u), v: parseFloat(li.dataset.v), line: line, dot: dot, ring: ring, box: null });
    });
  }

  function measure() {
    var s = stageEl.getBoundingClientRect();
    items.forEach(function (it) {
      var b = it.el.getBoundingClientRect();
      it.box = { l: b.left - s.left, r: b.right - s.left, t: b.top - s.top, b: b.bottom - s.top };
    });
    lastKey = '';
    draw();
  }

  function draw(force) {
    if (!items.length) return;
    var W = stageEl.clientWidth, H = stageEl.clientHeight;
    var key = W + 'x' + H + ':' + (rel && rel.ready ? rel.anchor(0.5, 0.5).x.toFixed(4) + rel.anchor(0.3, 0.3).y.toFixed(4) : 'flat');
    if (!force && key === lastKey) return;
    lastKey = key;
    leaders.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    items.forEach(function (it) {
      if (!it.box) return;
      var a = rel && rel.ready ? rel.anchor(it.u, it.v) : { x: it.u, y: it.v };
      var ax = a.x * W, ay = a.y * H, bx = it.box, mid = (bx.t + bx.b) / 2, px, py, ex, ey;
      if (ax < bx.l - 4) { px = bx.l - 6; py = mid; ex = px - 16; ey = py; }
      else if (ax > bx.r + 4) { px = bx.r + 6; py = mid; ex = px + 16; ey = py; }
      else { px = (bx.l + bx.r) / 2; py = ay > bx.b ? bx.b + 4 : bx.t - 4; ex = px; ey = py; }
      if (Math.abs(ax - ex) < 10 && Math.abs(ay - ey) < 10) { ex = ax; ey = ay; }
      it.line.setAttribute('points', ax.toFixed(1) + ',' + ay.toFixed(1) + ' ' + ex.toFixed(1) + ',' + ey.toFixed(1) + ' ' + px.toFixed(1) + ',' + py.toFixed(1));
      it.dot.setAttribute('cx', ax.toFixed(1)); it.dot.setAttribute('cy', ay.toFixed(1));
      it.ring.setAttribute('cx', ax.toFixed(1)); it.ring.setAttribute('cy', ay.toFixed(1));
    });
  }

  /* ---- start ---- */
  function startStage() {
    if (!stageEl) return;
    buildLeaders();
    measure();
    window.addEventListener('resize', measure);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);

    var gl = window.PontilRelief && PontilRelief.create(stageEl, {
      relief: 'img/lily-relief.png',
      phase: phase,
      onReady: function () { rel.setAccent(SCAN[world]); rel.setPhase(phase); draw(true); }
    });
    if (!gl) { root.classList.add('no-gl'); return; }
    rel = gl;
    rel.onFrame(function () { draw(); });
  }

  function whenIdle(fn) {
    if ('requestIdleCallback' in window) requestIdleCallback(fn, { timeout: 1200 }); else setTimeout(fn, 300);
  }

  if (isHome) {
    applyWorld(0);
    if (hero && !reduced) { window.addEventListener('scroll', onScroll, { passive: true }); onScroll(); }
  } else {
    var w0 = stored();
    applyWorld(w0);
    phase = target = w0;
  }

  if (stageEl) {
    var poster = stageEl.querySelector('img');
    var go = function () { whenIdle(startStage); };
    if (poster && !poster.complete) poster.addEventListener('load', go, { once: true }); else go();
  }

  /* iOS asks before it shares the gyroscope, and only from a tap */
  var tiltBtn = document.getElementById('tilt-btn');
  var DOE = window.DeviceOrientationEvent;
  if (tiltBtn && DOE && typeof DOE.requestPermission === 'function' && window.matchMedia('(pointer: coarse)').matches && !reduced) {
    tiltBtn.setAttribute('data-show', '');
    tiltBtn.addEventListener('click', function () {
      DOE.requestPermission().then(function (s) { if (s === 'granted') tiltBtn.removeAttribute('data-show'); }).catch(function () {});
    });
  }

  /* ---- reveals ---- */
  var revealEls = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && !reduced) {
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }
})();

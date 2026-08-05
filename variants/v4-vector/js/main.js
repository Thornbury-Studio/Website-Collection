/* ZANE — VECTOR. Variant 04.
   Zero dependencies. The well is drawn the way a vector monitor draws:
   every path stroked three times — wide and faint, medium, then a bright
   core — composited additively. No fills anywhere. No sound. */

(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var LANES = [
    { name: 'PULSE',     kind: 'AI analytics landing page',
      href: '../../templates/pulse-ai-analytics/index.html',    ink: '#ff3ce0' },
    { name: 'EMBER',     kind: 'Wood-fire restaurant',
      href: '../../templates/restaurant-food/index.html',       ink: '#ff9a3c' },
    { name: 'FORGE',     kind: 'Strength & conditioning',
      href: '../../templates/gym-service/index.html',           ink: '#b6ff3c' },
    { name: 'TRIGGERED', kind: 'Active game centre — unofficial concept',
      href: '../../templates/entertainment-triggered/index.html', ink: '#ff3c6e' },
    { name: 'MERIDIAN',  kind: 'Consulting firm, four pages',
      href: '../../templates/business-corporate/index.html',    ink: '#35f0ff' },
    { name: 'OBLIK',     kind: 'Design-object store',
      href: '../../templates/ecommerce-design-store/index.html', ink: '#a97cff' }
  ];
  var N = LANES.length;

  /* =======================================================================
     The well
     ======================================================================= */

  var cv = document.getElementById('well');
  if (!cv) return;
  var ctx = cv.getContext('2d');

  var W = 0, H = 0, cx = 0, cy = 0, R0 = 0;
  var RINGS = 13;
  var rings = [];              /* baked depth scales — never recomputed per frame */
  var active = 0;
  var rot = 0, rotTarget = 0;  /* radians; the well turns, the cursor stays put */
  var running = false, onScreen = true;
  var shots = [];

  function bakeRings() {
    rings.length = 0;
    for (var i = 0; i < RINGS; i++) {
      var t = i / (RINGS - 1);
      var z = Math.pow(t, 1.9);            /* rings crowd toward the vanishing point */
      rings.push(1 / (1 + z * 9));         /* perspective scale */
    }
  }
  bakeRings();

  function resize() {
    var rect = cv.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(320, rect.width); H = Math.max(320, rect.height);
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx = W * 0.5;
    cy = H * 0.44;
    R0 = Math.min(W, H) * (W < 760 ? 0.62 : 0.52);
  }

  /* one point on the well: lane boundary `k`, depth ring `r` */
  function px(k, r) {
    var a = rot + (k / N) * Math.PI * 2 - Math.PI / 2;
    return [cx + Math.cos(a) * R0 * rings[r], cy + Math.sin(a) * R0 * rings[r] * 0.74];
  }

  /* Three passes per path is what makes a stroke look like a beam rather
     than a hairline. Additive, so crossings burn brighter on their own. */
  function beam(build, color, w) {
    var passes = [[w * 6, 0.09], [w * 2.4, 0.22], [w, 1]];
    for (var i = 0; i < 3; i++) {
      ctx.beginPath();
      build();
      ctx.strokeStyle = color;
      ctx.globalAlpha = passes[i][1];
      ctx.lineWidth = passes[i][0];
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function draw(now) {
    if (!running) return;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cv.width, cv.height);
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    /* ease the rotation toward the target on the short way round */
    var d = rotTarget - rot;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    rot += d * (reduced ? 1 : 0.12);

    var ink = LANES[active].ink;

    /* rings, faintest at the vanishing point */
    for (var r = 0; r < RINGS; r++) {
      (function (r) {
        var fade = 0.22 + 0.78 * (r / (RINGS - 1));
        ctx.globalAlpha = 1;
        beam(function () {
          for (var k = 0; k <= N; k++) {
            var p = px(k, r);
            k === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1]);
          }
        }, r === RINGS - 1 ? '#35f0ff' : 'rgba(23,143,160,' + fade.toFixed(2) + ')',
           r === RINGS - 1 ? 1.4 : 0.9);
      })(r);
    }

    /* spokes */
    beam(function () {
      for (var k = 0; k < N; k++) {
        var a = px(k, 0), b = px(k, RINGS - 1);
        ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]);
      }
    }, 'rgba(23,143,160,.75)', 0.85);

    /* the live lane: both its walls plus the rim segment, burning */
    beam(function () {
      var a0 = px(active, 0), a1 = px(active, RINGS - 1);
      var b0 = px(active + 1, 0), b1 = px(active + 1, RINGS - 1);
      ctx.moveTo(a1[0], a1[1]); ctx.lineTo(a0[0], a0[1]);
      ctx.lineTo(b0[0], b0[1]);
      ctx.lineTo(b1[0], b1[1]);
    }, ink, 1.7);

    /* the claw sitting on the rim of the live lane */
    beam(function () {
      var a = px(active + 0.12, 0), b = px(active + 0.88, 0);
      var ai = px(active + 0.12, 2), bi = px(active + 0.88, 2);
      ctx.moveTo(ai[0], ai[1]); ctx.lineTo(a[0], a[1]);
      ctx.lineTo(b[0], b[1]); ctx.lineTo(bi[0], bi[1]);
    }, '#eafcff', 2.1);

    /* traffic: short segments running up the walls, so the well is alive
       without anything having to be simulated */
    if (!reduced) {
      if (shots.length < 14 && Math.random() < 0.09) {
        shots.push({ k: Math.floor(Math.random() * N), z: 1, v: 0.004 + Math.random() * 0.008 });
      }
      beam(function () {
        for (var i = shots.length - 1; i >= 0; i--) {
          var s = shots[i];
          s.z -= s.v;
          if (s.z <= 0) { shots.splice(i, 1); continue; }
          var r1 = Math.min(RINGS - 1, Math.floor(s.z * (RINGS - 1)));
          var r2 = Math.max(0, r1 - 1);
          var p = px(s.k + 0.5, r1), q = px(s.k + 0.5, r2);
          ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]);
        }
      }, 'rgba(234,252,255,.85)', 1.2);
    }

    ctx.globalCompositeOperation = 'source-over';
    requestAnimationFrame(draw);
  }

  function start() {
    if (running || !onScreen || document.hidden) return;
    running = true; requestAnimationFrame(draw);
  }
  function stop() { running = false; }

  /* =======================================================================
     Selection
     ======================================================================= */

  var card  = document.getElementById('laneCard');
  var elNum = document.getElementById('laneNum');
  var elNam = document.getElementById('laneName');
  var elKnd = document.getElementById('laneKind');
  var elGo  = document.getElementById('laneGo');

  function select(i) {
    active = (i + N) % N;
    var L = LANES[active];
    /* keep the live lane at the bottom of the well, where the cursor lives */
    rotTarget = -((active + 0.5) / N) * Math.PI * 2 + Math.PI / 2;

    if (card) card.style.setProperty('--ink', L.ink);
    if (elNum) elNum.textContent = 'LANE 0' + (active + 1);
    if (elNam) elNam.textContent = L.name;
    if (elKnd) elKnd.textContent = L.kind;
    if (elGo) {
      elGo.setAttribute('href', L.href);
      elGo.setAttribute('aria-label', 'Open ' + L.name + ', ' + L.kind);
    }
    start();
  }

  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;

    if (e.key === 'ArrowRight') { e.preventDefault(); select(active + 1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); select(active - 1); }
    else if (e.key === 'Enter' && document.activeElement === document.body) {
      e.preventDefault(); window.location.href = LANES[active].href;
    } else {
      var n = parseInt(e.key, 10);
      if (n >= 1 && n <= N) { e.preventDefault(); select(n - 1); }
    }
  });

  /* clicking the well picks the lane under the pointer */
  cv.addEventListener('click', function (e) {
    var rect = cv.getBoundingClientRect();
    var a = Math.atan2((e.clientY - rect.top - cy) / 0.74, e.clientX - rect.left - cx);
    var k = ((a + Math.PI / 2 - rot) / (Math.PI * 2)) * N;
    select(Math.floor(((k % N) + N) % N));
  });
  cv.style.cursor = 'pointer';

  /* hovering a card in the grid below drives the well too */
  Array.prototype.forEach.call(document.querySelectorAll('.cell[data-lane]'), function (c) {
    c.addEventListener('mouseenter', function () { select(+c.dataset.lane); });
    c.addEventListener('focusin', function () { select(+c.dataset.lane); });
  });

  /* =======================================================================
     Lifecycle
     ======================================================================= */

  resize();
  var rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () { resize(); }, 150);
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) {
      onScreen = en[0].isIntersecting;
      onScreen ? start() : stop();
    }, { threshold: 0.02 }).observe(cv);
  }
  document.addEventListener('visibilitychange', function () {
    document.hidden ? stop() : start();
  });

  /* section marker on the rail */
  if ('IntersectionObserver' in window) {
    var links = Array.prototype.slice.call(document.querySelectorAll('.rail__nav a'));
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) {
          a.setAttribute('aria-current',
            a.getAttribute('href') === '#' + en.target.id ? 'true' : 'false');
        });
      });
    }, { rootMargin: '-20% 0px -65% 0px' });
    ['lanes', 'telemetry', 'method', 'transmit'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) io.observe(el);
    });
  }

  /* =======================================================================
     Transmit
     ======================================================================= */

  (function () {
    var form = document.getElementById('txForm');
    var out = document.getElementById('txOut');
    if (!form || !out) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = form.elements.email, brief = form.elements.brief;
      if (!email.value.trim() || email.validity.typeMismatch) {
        out.dataset.state = 'error';
        out.textContent = 'No carrier — that return address will not resolve.';
        email.focus(); return;
      }
      if (!brief.value.trim()) {
        out.dataset.state = 'error';
        out.textContent = 'Empty payload — one line about the project is enough.';
        brief.focus(); return;
      }
      out.dataset.state = 'ok';
      out.textContent = 'Demo form, no receiver wired up yet. Copy your note and email it over.';
    });
  })();

  select(0);
})();

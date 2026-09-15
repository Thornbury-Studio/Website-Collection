/* APOGEE — shared behaviour for every page.
 *
 * Everything here reads from window.APOGEE (js/data.js). Blocks that do
 * not exist on the current page are skipped by the presence check at the
 * top of each one, so one script serves all four pages.
 */
(function () {
  'use strict';

  var D = window.APOGEE;
  var doc = document;
  var root = doc.documentElement;
  var anim = root.classList.contains('js-anim');
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var smooth = function (t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  function el(tag, cls, html) { var e = doc.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* ------------------------------------------------------------------ */
  /* Header: solid once the page moves; ink or bone to match what is under it */
  /* ------------------------------------------------------------------ */
  var top = $('#top');
  var topH = top ? top.offsetHeight : 72;
  function headerState() {
    if (!top) return;
    top.classList.toggle('is-solid', window.scrollY > 12);
    var under = doc.elementFromPoint(Math.min(window.innerWidth - 8, 24), topH + 2);
    var dark = under && under.closest('.dark, .hero, .quiet, .climb-stick');
    var onInk = !!dark;
    if (dark && dark.classList.contains('climb-stick')) onInk = dark.dataset.ink === '1';
    top.classList.toggle('on-ink', onInk);
    if (window.scrollY <= 12) top.classList.toggle('on-ink', !!doc.querySelector('.hero, .climb-stick'));
  }
  var burger = $('#burger'), drawer = $('#drawer');
  if (burger && drawer) {
    burger.addEventListener('click', function () {
      var open = burger.getAttribute('aria-expanded') !== 'true';
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      drawer.setAttribute('data-open', String(open));
      doc.body.style.overflow = open ? 'hidden' : '';
      if (top) top.classList.toggle('is-solid', open || window.scrollY > 12);
      if (top) top.classList.toggle('on-ink', open ? false : top.classList.contains('on-ink'));
    });
  }

  /* ------------------------------------------------------------------ */
  /* Reveals                                                             */
  /* ------------------------------------------------------------------ */
  var revealSel = '.reveal, .wipe, .plate-in';
  function revealAll() { $$(revealSel).forEach(function (n) { n.classList.add('is-in'); }); }
  var io = null;
  if (anim && 'IntersectionObserver' in window) {
    /* A clip-path that hides the whole element also hides it from the
       observer's intersection ratio, so the callback checks the box it is
       handed as well as the flag, and a sweep on load catches the first screen. */
    io = new IntersectionObserver(function (entries) {
      var vh = window.innerHeight;
      entries.forEach(function (e) {
        var r = e.boundingClientRect;
        if (e.isIntersecting || (r.top < vh * 0.94 && r.bottom > 0)) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0 });
    $$(revealSel).forEach(function (n) { io.observe(n); });
    setTimeout(revealAll, 4000);
    var sweepT = 0;
    function sweep(now) {
      if (sweepT) return;
      sweepT = setTimeout(function () {
        sweepT = 0;
        var vh = window.innerHeight;
        $$(revealSel).forEach(function (n) {
          if (n.classList.contains('is-in')) return;
          var r = n.getBoundingClientRect();
          if (r.top < vh && r.bottom > 0) n.classList.add('is-in');
        });
      }, now === true ? 0 : 140);
    }
    window.addEventListener('scroll', sweep, { passive: true });
    window.addEventListener('resize', sweep);
    window.addEventListener('hashchange', sweep);
    window.addEventListener('load', function () { sweep(true); });
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(function () { sweep(true); });
    sweep(true);
  } else revealAll();
  function rescan() { if (io) $$(revealSel).forEach(function (n) { if (!n.classList.contains('is-in')) io.observe(n); }); }

  /* ------------------------------------------------------------------ */
  /* Weight: the lean with velocity, the lag on plates                   */
  /* ------------------------------------------------------------------ */
  var paras = $$('.para');
  function layoutParas() {
    var vh = window.innerHeight;
    paras.forEach(function (p) {
      var k = parseFloat(p.dataset.para || '0.2');
      var r = p.getBoundingClientRect();
      var c = r.top + r.height / 2 - vh / 2;
      p.style.setProperty('--py', (-c * k * 0.25).toFixed(1) + 'px');
    });
  }
  if (anim) {
    var lastY = window.scrollY, lastT = performance.now(), vel = 0, lean = 0, running = false;
    function tick(now) {
      var dt = Math.max(8, now - lastT) / 1000;
      var y = window.scrollY;
      var v = (y - lastY) / dt;
      lastY = y; lastT = now;
      vel += (v - vel) * 0.25;
      var target = clamp(vel / 3200, -1, 1) * 1.6;
      lean += (target - lean) * 0.12;
      root.style.setProperty('--vy', lean.toFixed(3) + 'deg');
      layoutParas();
      headerState();
      if (Math.abs(vel) > 3 || Math.abs(lean) > 0.01) requestAnimationFrame(tick);
      else { running = false; root.style.setProperty('--vy', '0deg'); }
    }
    function wake() { if (!running) { running = true; lastT = performance.now(); lastY = window.scrollY; requestAnimationFrame(tick); } }
    window.addEventListener('scroll', wake, { passive: true });
    window.addEventListener('resize', function () { layoutParas(); headerState(); });
    layoutParas();
  } else {
    window.addEventListener('scroll', headerState, { passive: true });
  }
  headerState();

  /* ------------------------------------------------------------------ */
  /* Footage: a source only once it is near, play only while on screen   */
  /* ------------------------------------------------------------------ */
  function wireVideo(v) {
    if (!v || v.dataset.wired) return;
    v.dataset.wired = '1';
    if (!anim) return;
    var started = false;
    function start() { if (started) return; started = true; v.src = v.dataset.src; v.load(); var p = v.play(); if (p && p.catch) p.catch(function () {}); }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { start(); var p = v.play(); if (p && p.catch) p.catch(function () {}); }
          else if (started) v.pause();
        });
      }, { rootMargin: '30% 0px' }).observe(v);
    } else start();
  }
  $$('video[data-src]').forEach(wireVideo);

  /* ------------------------------------------------------------------ */
  /* The climb. The hero is its first frame: one pinned scene, scroll is  */
  /* altitude, and everything on it derives from one progress number.    */
  /* ------------------------------------------------------------------ */
  var climb = $('#climb');
  if (climb) {
    var stick = $('#climb-stick'), altEl = $('#alt'), oatEl = $('#oat'), cabEl = $('#cab'), machEl = $('#mach');
    var wing = $('#layer-wing'), deck = $('#layer-deck'), apex = $('#layer-apex'), ground = $('#layer-ground'), bar = $('#climb-bar');
    var heroUi = $('#hero-ui'), climbUi = $('#climb-ui');
    var lines = $$('.climb-line', climb);
    var TOP = 45000;
    /* The first stretch of scroll is the hero leaving; the climb proper starts at HERO_END. */
    var HERO_END = 0.08;
    /* Sky stops: bone on the ground, haze, the blue at twenty, the deep of the tropopause, the near-black of the top. */
    var SKY = [[0, [236, 233, 226]], [0.16, [205, 214, 224]], [0.4, [122, 151, 189]], [0.68, [36, 57, 94]], [1, [9, 14, 30]]];
    function sky(p) {
      for (var i = 1; i < SKY.length; i++) {
        if (p <= SKY[i][0]) {
          var a = SKY[i - 1], b = SKY[i], t = (p - a[0]) / (b[0] - a[0]);
          return [Math.round(lerp(a[1][0], b[1][0], t)), Math.round(lerp(a[1][1], b[1][1], t)), Math.round(lerp(a[1][2], b[1][2], t))];
        }
      }
      return SKY[SKY.length - 1][1];
    }
    var lastLine = -1, lastInk = null, heroGone = null, uiGone = null;
    function setClimb(p) {
      /* p is the page's progress through the section; q is the climb's, zero until the hero has gone. */
      var q = clamp((p - HERO_END) / (1 - HERO_END), 0, 1);
      var hero = 1 - smooth(p / HERO_END);
      var ui = smooth((p - HERO_END * 0.95) / (HERO_END * 0.9));
      /* The profile: quick off the ground, slower up top, like the real thing. */
      var alt = Math.round(TOP * (1 - Math.pow(1 - q, 1.7)) / 10) * 10;
      var c = sky(q);
      stick.style.setProperty('--sky', 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')');
      stick.style.setProperty('--hero', hero.toFixed(3));
      stick.style.setProperty('--ui', ui.toFixed(3));
      var hg = hero < 0.02, ug = ui < 0.02;
      if (hg !== heroGone) { heroUi.classList.toggle('is-gone', hg); heroGone = hg; }
      if (ug !== uiGone) { climbUi.classList.toggle('is-gone', ug); uiGone = ug; }
      /* Ink stays ink until the sky is dark enough to need bone; the crossing is steep so nothing is grey on grey.
         The header reads bone while the hero's scrim is still up. */
      var inkT = smooth((q - 0.3) / 0.16);
      var ink = [Math.round(lerp(22, 247, inkT)), Math.round(lerp(23, 245, inkT)), Math.round(lerp(27, 240, inkT))];
      stick.style.setProperty('--sky-ink', 'rgb(' + ink[0] + ',' + ink[1] + ',' + ink[2] + ')');
      var onInk = (inkT > 0.5 || hero > 0.4) ? '1' : '0';
      if (onInk !== lastInk) { stick.dataset.ink = onInk; lastInk = onInk; }
      altEl.innerHTML = D.fmtNum(alt) + '<small>ft</small>';
      var oat = D.isa(alt);
      oatEl.textContent = (oat > 0 ? '+' : '−') + Math.abs(oat).toFixed(0) + '°C';
      cabEl.textContent = D.fmtNum(Math.round(Math.min(5000, alt * 0.118) / 10) * 10) + ' ft';
      machEl.textContent = (0.02 + 0.78 * smooth(q * 1.15)).toFixed(2);
      /* Layers: the apron lifts away under the hero, the wing comes up out of cloud through the middle,
         the deck is the top of the weather, and the apex — the deck far below and the horizon — holds. */
      if (anim) {
        var lift = smooth((p - HERO_END * 0.35) / 0.09);
        ground.style.opacity = (1 - lift).toFixed(3);
        ground.style.transform = 'translate3d(0,' + (lift * 90 + p * 40).toFixed(1) + 'px,0) scale(' + (1 + lift * 0.42 + p * 0.1).toFixed(3) + ')';
        var wingO = smooth((q - 0.08) / 0.14) * (1 - smooth((q - 0.46) / 0.16));
        var deckO = smooth((q - 0.42) / 0.16) * (1 - smooth((q - 0.8) / 0.12));
        var apexO = smooth((q - 0.74) / 0.16);
        wing.style.opacity = wingO.toFixed(3);
        wing.style.transform = 'translate3d(0,' + ((0.5 - q) * 60).toFixed(1) + 'px,0) scale(' + (1.08 - q * 0.06).toFixed(3) + ')';
        deck.style.opacity = deckO.toFixed(3);
        deck.style.transform = 'translate3d(0,' + ((0.7 - q) * 90).toFixed(1) + 'px,0) scale(' + (1.02 + q * 0.06).toFixed(3) + ')';
        apex.style.opacity = apexO.toFixed(3);
        apex.style.transform = 'translate3d(0,' + ((1 - q) * 70).toFixed(1) + 'px,0) scale(' + (1.1 - q * 0.1).toFixed(3) + ')';
      }
      /* The mark: the arc draws across once the aircraft is nearly there; the dot lights at the top. */
      var arc = smooth((q - 0.84) / 0.13);
      stick.style.setProperty('--apex', (arc > 0 ? 1 : 0));
      stick.style.setProperty('--arc', (1 - arc).toFixed(4));
      stick.style.setProperty('--dot', smooth((q - 0.96) / 0.04).toFixed(3));
      var idx = 0;
      lines.forEach(function (l, i) { if (alt >= parseInt(l.dataset.at, 10)) idx = i; });
      if (idx !== lastLine) { lines.forEach(function (l, i) { l.classList.toggle('on', i === idx); }); lastLine = idx; }
      if (bar) bar.style.setProperty('--p', q.toFixed(4));
    }
    if (anim) {
      var ticking = false;
      function onScroll() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () {
          ticking = false;
          var r = climb.getBoundingClientRect();
          var travel = climb.offsetHeight - window.innerHeight;
          setClimb(travel > 0 ? clamp(-r.top / travel, 0, 1) : 1);
        });
      }
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll);
      onScroll();
    } else {
      setClimb(1);
      lines.forEach(function (l) { l.classList.add('on'); });
    }
  }

  /* ------------------------------------------------------------------ */
  /* Fleet rows (home) and tiers/terms (home + programme)                */
  /* ------------------------------------------------------------------ */
  var rows = $('#fleet-rows');
  if (rows) {
    var maxR = Math.max.apply(null, D.fleet.map(function (t) { return t.range; }));
    D.fleet.forEach(function (t) {
      var a = el('a', 'frow');
      a.href = 'fleet.html#' + t.key;
      a.innerHTML =
        '<div class="frow-name"><b>' + esc(t.name) + '</b><span>' + esc(t.tag) + ' · ' + t.count + ' in the fleet · ' + t.seats + ' seats</span></div>' +
        '<div class="range"><span><b>' + D.fmtNum(t.range) + ' nm</b> · ' + esc(t.pairs[0]) + ' nonstop</span><i></i></div>' +
        '<div class="frow-meta"><span><b>' + D.fmtMoney(t.rate) + '</b><br><span class="small mute">Per hour, all in</span></span><span><b>' + t.ceiling.toLocaleString('en-GB') + ' ft</b><br><span class="small mute">Ceiling</span></span></div>';
      $('.range i', a).style.setProperty('--r', (t.range / maxR).toFixed(3));
      rows.appendChild(a);
    });
  }
  $$('[data-fleet-count]').forEach(function (n) { n.textContent = D.fleet.reduce(function (s, t) { return s + t.count; }, 0); });
  var tiers = $('#tiers');
  if (tiers) {
    D.programme.forEach(function (t) {
      var li = el('li', 'tier');
      li.innerHTML = '<span class="small">' + (t.term === 1 ? 'One-year term' : t.term + '-year term') + '</span><b class="num">' + t.hours + '<small>hours</small></b><h3>' + esc(t.name) + '</h3><p>' + esc(t.line) + '</p>';
      tiers.appendChild(li);
    });
  }
  var terms = $('#terms');
  if (terms) D.terms.forEach(function (t) { terms.appendChild(el('li', null, esc(t))); });

  /* ------------------------------------------------------------------ */
  /* Cities into selects                                                 */
  /* ------------------------------------------------------------------ */
  function fillCities(sel, chosen) {
    if (!sel) return;
    D.cities.forEach(function (c) {
      var o = doc.createElement('option'); o.value = c.key; o.textContent = c.name + ' · ' + c.apt; sel.appendChild(o);
    });
    if (chosen) sel.value = chosen;
  }

  /* ------------------------------------------------------------------ */
  /* Fleet page: cabin plans, the map, the route                         */
  /* ------------------------------------------------------------------ */
  var typesWrap = $('#types');
  if (typesWrap) {
    var L = 16.6, W = 2.44; /* the biggest cabin sets the scale for all four */
    var SC = 10; /* units per metre */
    D.fleet.forEach(function (t) {
      var sec = el('section', 'type');
      sec.id = t.key;
      var cl = t.cabin.l * SC, cw = t.cabin.w * SC, x0 = 8, y0 = 30 - cw / 2;
      var plan = '<svg class="plan" viewBox="0 0 190 60" role="img" aria-label="Cabin plan of the ' + esc(t.name) + ' to scale: ' + t.cabin.l + ' metres long, ' + t.cabin.w + ' wide">';
      plan += '<rect class="ref" x="' + x0 + '" y="' + (30 - W * SC / 2) + '" width="' + (L * SC) + '" height="' + (W * SC) + '" rx="6"/>';
      plan += '<rect class="cab" x="' + x0 + '" y="' + y0.toFixed(1) + '" width="' + cl.toFixed(1) + '" height="' + cw.toFixed(1) + '" rx="' + Math.min(6, cw / 2).toFixed(1) + '"/>';
      /* Seats in club pairs down each side; a divan takes the back of the big cabins. */
      var s = 5.2, gap = (cl - 14) / Math.ceil(t.seats / 2), n = 0;
      for (var i = 0; i < Math.ceil(t.seats / 2) && n < t.seats; i++) {
        var sx = x0 + 8 + i * gap;
        plan += '<rect class="seat" x="' + sx.toFixed(1) + '" y="' + (y0 + 1.6).toFixed(1) + '" width="' + s + '" height="' + s + '" rx="1.2"/>'; n++;
        if (n < t.seats) { plan += '<rect class="seat" x="' + sx.toFixed(1) + '" y="' + (y0 + cw - s - 1.6).toFixed(1) + '" width="' + s + '" height="' + s + '" rx="1.2"/>'; n++; }
      }
      for (var z = 1; z < t.zones; z++) { var zx = x0 + cl * z / t.zones; plan += '<line class="zone" x1="' + zx.toFixed(1) + '" y1="' + y0.toFixed(1) + '" x2="' + zx.toFixed(1) + '" y2="' + (y0 + cw).toFixed(1) + '"/>'; }
      plan += '<text x="' + x0 + '" y="56">' + t.cabin.l + ' m × ' + t.cabin.w + ' m × ' + t.cabin.h + ' m high · ' + t.zones + (t.zones === 1 ? ' zone' : ' zones') + '</text></svg>';
      sec.innerHTML =
        '<div class="type-head"><p class="small mute reveal">' + esc(t.tag) + ' · ' + t.count + ' in the fleet</p><h2 class="h2 lean wipe">' + esc(t.name) + '</h2><div class="pairs reveal d1">' + t.pairs.map(function (p) { return '<span>' + esc(p) + '</span>'; }).join('') + '</div></div>' +
        '<div class="type-plan reveal d1">' + plan + '</div>' +
        '<div class="type-copy"><p class="lede reveal measure">' + esc(t.line) + '</p><p class="reveal d1"><a class="link" href="request.html?type=' + t.key + '">Request the ' + esc(t.name) + '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 8h12M9 3l5 5-5 5"/></svg></a></p></div>' +
        '<ul class="type-spec reveal d1"><li><b>' + D.fmtNum(t.range) + '<small>nm</small></b><span>Range</span></li><li><b>' + t.seats + '</b><span>Seats' + (t.beds ? ', ' + t.beds + ' berth' + (t.beds === 1 ? '' : 's') : '') + '</span></li><li><b>' + t.cruise + '<small>kt</small></b><span>Cruise</span></li><li><b>' + t.cabin.h + '<small>m</small></b><span>Cabin height</span></li><li><b>' + D.fmtNum(t.ceiling) + '<small>ft</small></b><span>Ceiling</span></li><li><b>' + D.fmtMoney(t.rate) + '</b><span>Per hour</span></li></ul>';
      typesWrap.appendChild(sec);
    });
    rescan();
  }

  var map = $('#map');
  if (map) {
    var canvas = $('canvas', map), svg = $('svg', map);
    var fromSel = $('#from'), toSel = $('#to');
    fillCities(fromSel, 'london'); fillCities(toSel, 'singapore');
    var LAND = window.AP_LAND;
    function drawLand() {
      var w = map.clientWidth, h = map.clientHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      var ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);
      if (!LAND) return;
      ctx.fillStyle = 'rgba(247,245,240,.38)';
      var cw = w / LAND.w, ch = h / LAND.h, r = Math.max(0.6, Math.min(cw, ch) * 0.3);
      for (var row = 0; row < LAND.h; row++) for (var col = 0; col < LAND.w; col++) {
        if (LAND.bits.charAt(row * LAND.w + col) !== '1') continue;
        ctx.beginPath(); ctx.arc((col + 0.5) * cw, (row + 0.5) * ch, r, 0, Math.PI * 2); ctx.fill();
      }
    }
    function proj(pt, w, h) { return { x: (pt.lon + 180) / 360 * w, y: (90 - pt.lat) / 180 * h }; }
    function drawRoute() {
      var w = map.clientWidth, h = map.clientHeight;
      svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
      var a = D.city(fromSel.value), b = D.city(toSel.value);
      var pts = D.arc(a, b, 96);
      var d = '', prev = null;
      pts.forEach(function (p) {
        var q = proj(p, w, h);
        if (prev && Math.abs(p.lon - prev.lon) > 180) d += 'M' + q.x.toFixed(1) + ' ' + q.y.toFixed(1);
        else d += (prev ? 'L' : 'M') + q.x.toFixed(1) + ' ' + q.y.toFixed(1);
        prev = p;
      });
      var A = proj(a, w, h), B = proj(b, w, h);
      var out = '';
      D.bases.forEach(function (bs) { var q = proj(bs, w, h); out += '<circle class="base" cx="' + q.x.toFixed(1) + '" cy="' + q.y.toFixed(1) + '" r="5"/>'; });
      out += '<path class="gc-shadow" d="' + d + '"/><path class="gc" id="gc" d="' + d + '"/>';
      out += '<circle class="city" cx="' + A.x.toFixed(1) + '" cy="' + A.y.toFixed(1) + '" r="3"/><circle class="city" cx="' + B.x.toFixed(1) + '" cy="' + B.y.toFixed(1) + '" r="3"/>';
      out += '<text class="lbl" x="' + (A.x + 8).toFixed(1) + '" y="' + (A.y - 8).toFixed(1) + '">' + esc(a.name) + '</text><text class="lbl" x="' + (B.x + 8).toFixed(1) + '" y="' + (B.y - 8).toFixed(1) + '">' + esc(b.name) + '</text>';
      svg.innerHTML = out;
      var gc = $('#gc', svg);
      if (anim && gc) { var len = gc.getTotalLength(); gc.style.strokeDasharray = len; gc.style.strokeDashoffset = len; gc.getBoundingClientRect(); gc.style.transition = 'stroke-dashoffset 1.4s cubic-bezier(.22,.7,.18,1)'; gc.style.strokeDashoffset = '0'; }
      var nm = D.distance(a, b);
      $('#route-nm').innerHTML = D.fmtNum(nm) + '<small>nm</small>';
      $('#route-line').textContent = a.name + ' to ' + b.name + ' · great circle';
      var list = $('#route-types');
      list.innerHTML = D.types(nm).map(function (l) {
        return '<li class="' + (l.nonstop ? '' : 'no') + '"><b>' + esc(l.type.name) + '</b><span class="t">' + D.fmtHours(l.hours) + '</span><span class="ok">' + (l.nonstop ? 'Nonstop' : (l.stops === 1 ? 'one stop' : l.stops + ' stops')) + '</span></li>';
      }).join('');
    }
    drawLand(); drawRoute();
    fromSel.addEventListener('change', drawRoute);
    toSel.addEventListener('change', drawRoute);
    var swap = $('#swap');
    if (swap) swap.addEventListener('click', function () { var t = fromSel.value; fromSel.value = toSel.value; toSel.value = t; drawRoute(); });
    var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { drawLand(); drawRoute(); }, 150); });
  }

  /* ------------------------------------------------------------------ */
  /* Programme page: what a leg costs in hours                           */
  /* ------------------------------------------------------------------ */
  var calc = $('#calc');
  if (calc) {
    var cFrom = $('#c-from'), cTo = $('#c-to'), cType = $('#c-type'), cTier = $('#c-tier');
    fillCities(cFrom, 'geneva'); fillCities(cTo, 'dubai');
    D.fleet.forEach(function (t) { var o = doc.createElement('option'); o.value = t.key; o.textContent = t.name + ' · ' + t.tag; cType.appendChild(o); });
    D.programme.forEach(function (t) { var o = doc.createElement('option'); o.value = t.key; o.textContent = t.name + ' · ' + t.hours + ' hours'; cTier.appendChild(o); });
    cType.value = 'super'; cTier.value = 'hundred';
    function calcOut() {
      var a = D.city(cFrom.value), b = D.city(cTo.value), t = D.type(cType.value);
      var tier = D.programme.filter(function (x) { return x.key === cTier.value; })[0];
      var nm = D.distance(a, b), l = D.leg(t, nm);
      $('#c-hours').innerHTML = l.hours.toFixed(1) + '<small>hours</small>';
      $('#c-line').textContent = a.name + ' to ' + b.name + ' on the ' + t.name + (l.nonstop ? ', nonstop' : ', with ' + (l.stops === 1 ? 'a technical stop' : l.stops + ' technical stops'));
      $('#c-rows').innerHTML =
        '<li><span>Distance</span><b>' + D.fmtNum(nm) + ' nm</b></li>' +
        '<li><span>Block time, gate to gate</span><b>' + D.fmtHours(l.hours) + '</b></li>' +
        '<li><span>Hours left of ' + tier.hours + ' after this leg</span><b>' + (tier.hours - l.hours).toFixed(1) + '</b></li>' +
        '<li><span>Legs like this in the year</span><b>' + Math.floor(tier.hours / l.hours) + '</b></li>' +
        '<li><span>This leg at the ' + t.name + ' rate</span><b>' + D.fmtMoney(l.hours * t.rate) + '</b></li>';
    }
    calcOut();
    [cFrom, cTo, cType, cTier].forEach(function (s) { s.addEventListener('change', calcOut); });
  }

  /* ------------------------------------------------------------------ */
  /* Request page: the form composes a message                            */
  /* ------------------------------------------------------------------ */
  var req = $('#request-form');
  if (req) {
    var rFrom = $('#r-from'), rTo = $('#r-to'), rType = $('#r-type'), rDate = $('#r-date'), rTime = $('#r-time'), rSeats = $('#r-seats'), rOut = $('#r-out');
    fillCities(rFrom, 'london'); fillCities(rTo, 'nice');
    var any = doc.createElement('option'); any.value = 'any'; any.textContent = 'Whichever suits the route'; rType.appendChild(any);
    D.fleet.forEach(function (t) { var o = doc.createElement('option'); o.value = t.key; o.textContent = t.name + ' · ' + t.tag + ' · ' + t.seats + ' seats'; rType.appendChild(o); });
    var want = (location.search.match(/type=([a-z]+)/) || [])[1];
    if (want && D.type(want)) rType.value = want;
    var tomorrow = new Date(Date.now() + 86400000); rDate.value = tomorrow.toISOString().slice(0, 10); rDate.min = new Date().toISOString().slice(0, 10);
    function suggest() {
      var a = D.city(rFrom.value), b = D.city(rTo.value), nm = D.distance(a, b);
      var pick = rType.value === 'any' ? D.types(nm).filter(function (l) { return l.nonstop; }).sort(function (x, y) { return x.type.rate - y.type.rate; })[0] : { type: D.type(rType.value) };
      var l = D.leg(pick.type, nm);
      var seats = parseInt(rSeats.value, 10) || 1;
      var fits = seats <= pick.type.seats;
      rOut.innerHTML = '<span>' + esc(a.name) + ' to ' + esc(b.name) + ' · ' + D.fmtNum(nm) + ' nm</span><b>' + esc(pick.type.name) + ' · ' + D.fmtHours(l.hours) + (l.nonstop ? ' nonstop' : ', one stop') + '</b><span>' + (fits ? 'Seats ' + seats + ' of ' + pick.type.seats + '. ' : seats + ' is more than the ' + pick.type.name + ' seats; we will suggest the next size up. ') + 'The reply comes with a firm price.</span>';
      return { a: a, b: b, nm: nm, type: pick.type, leg: l, seats: seats };
    }
    suggest();
    [rFrom, rTo, rType, rSeats].forEach(function (s) { s.addEventListener('change', suggest); s.addEventListener('input', suggest); });
    req.addEventListener('submit', function (e) {
      e.preventDefault();
      var s = suggest();
      var name = $('#r-name').value.trim(), contact = $('#r-contact').value.trim();
      var lines = [
        'Flight request: ' + s.a.name + ' (' + s.a.apt + ') to ' + s.b.name + ' (' + s.b.apt + ')',
        'Date: ' + rDate.value + (rTime.value ? ' at ' + rTime.value : ''),
        'Seats: ' + s.seats,
        'Aircraft: ' + (rType.value === 'any' ? 'whichever suits (' + s.type.name + ' suggested)' : s.type.name),
        'Estimated ' + D.fmtHours(s.leg.hours) + ', ' + D.fmtNum(s.nm) + ' nm',
        '',
        'Name: ' + name,
        'Contact: ' + contact,
        '',
        'Sent from apogeecharter.com'
      ];
      var href = 'mailto:fly@apogeecharter.com?subject=' + encodeURIComponent('Flight request — ' + s.a.name + ' to ' + s.b.name + ', ' + rDate.value) + '&body=' + encodeURIComponent(lines.join('\n'));
      /* Announced before it opens, so a harness or a hook can see it or stop it. */
      var ev = new CustomEvent('apogee:request', { detail: { href: href }, cancelable: true });
      if (req.dispatchEvent(ev)) location.href = href;
    });
  }
})();

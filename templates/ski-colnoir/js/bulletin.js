/* COL NOIR — bulletin renderer. Reads today's model once and writes every
   figure, board and log line from it. SVG diagrams are drawn value-true:
   the depth bars, the wind arrow and the band ratings are the numbers. */
(function () {
  'use strict';
  var M = window.CN.today();
  var U = window.CNUI;
  var WORDS = window.CN.DANGER_WORDS;
  var $ = function (id) { return document.getElementById(id); };
  var NS = 'http://www.w3.org/2000/svg';
  var DCOL = ['', '#4f9d5b', '#e9c531', '#ee8b2c', '#d8272c', '#1a1a1a'];

  /* ---------------- issue strip + hero ---------------- */
  var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  $('isNo').textContent = '№ ' + M.issue;
  $('isDate').textContent = days[M.date.getDay()] + ' ' + M.date.getDate() + ' ' + months[M.date.getMonth()] + ' ' + M.date.getFullYear();
  var spinning = M.lifts.filter(function (l) { return l.state === 'open' || l.state === 'delayed'; }).length;
  $('isLifts').innerHTML = 'Lifts <b>' + spinning + ' / ' + M.lifts.length + '</b>';
  var holds = M.lifts.filter(function (l) { return l.state === 'hold'; });
  if (holds.length) { var f = $('isFlash'); f.hidden = false; f.textContent = 'Wind hold: ' + holds.map(function (l) { return l.name; }).join(', '); }

  /* danger card */
  $('dgNum').textContent = M.danger.max;
  $('dgWord').textContent = WORDS[M.danger.max];
  $('dgWhere').textContent = M.danger.high >= M.danger.tree
    ? 'Above 2 400 m · lower bands ' + M.danger.tree + ' / ' + M.danger.low
    : 'All bands';
  Array.prototype.forEach.call($('dgScale').children, function (el, i) {
    if (i < M.danger.max) el.className = 'on-' + M.danger.max;
  });

  /* ---------------- hero video source ---------------- */
  var hv = $('heroVideo');
  (function () {
    var conn = navigator.connection || {};
    var want4k = window.innerWidth * (window.devicePixelRatio || 1) >= 2200 &&
                 !conn.saveData && (conn.downlink === undefined || conn.downlink > 4);
    if (want4k && hv.canPlayType('video/webm; codecs="vp9"')) {
      var s = document.createElement('source'); s.src = 'video/hero-4k.webm'; s.type = 'video/webm';
      hv.appendChild(s);
    }
    var m = document.createElement('source'); m.src = 'video/hero.mp4'; m.type = 'video/mp4';
    hv.appendChild(m);
    hv.load();
    if (!U.reduced) { var p = hv.play(); if (p && p.catch) p.catch(function () {}); }
  })();
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) {
      if (en[0].isIntersecting) { if (!U.reduced) { var p = hv.play(); if (p && p.catch) p.catch(function () {}); } }
      else hv.pause();
    }, { threshold: 0.05 }).observe($('hero'));
  }

  /* ---------------- SNOW ---------------- */
  function stat(v, unit, label, hot) {
    return '<div class="stat' + (hot ? ' hot' : '') + '"><b>' + v + '<small>' + unit + '</small></b><span>' + label + '</span></div>';
  }
  $('snowStats').innerHTML =
    stat(M.snow24, 'cm', 'New · 24 h', M.snow24 >= 20) +
    stat(M.snow48, 'cm', 'New · 48 h', false) +
    stat(M.snow72, 'cm', 'New · 72 h', false) +
    stat(M.depth.mid, 'cm', 'Depth · 2 450 m', false) +
    stat(M.depth.summit, 'cm', 'Depth · 3 260 m', false);
  $('snowProse').innerHTML = (
    M.snow24 >= 20 ? '<strong>' + M.snow24 + ' centimetres overnight.</strong> The plateau board disappeared again around four. Expect the classic Col Noir queue physics: everyone at the gondola for first bin, nobody in the trees by eleven. '
    : M.snow24 > 0 ? 'A refresh of <strong>' + M.snow24 + ' cm</strong> overnight — enough to quiet yesterday’s chatter, not enough to move the rating on its own. '
    : 'No new snow overnight. The surface is yesterday’s story: ' + (M.weather.wind > 40 ? 'wind-worked up high, chalky where it’s sheltered. ' : 'settled and honest, edgeable nearly everywhere. ')
  ) + 'Settled depth sits at ' + M.depth.base + ' cm at the base, ' + M.depth.mid + ' cm at the plateau and ' + M.depth.summit + ' cm below the summit ridge.';

  /* depth diagram: mountain silhouette + three band bars */
  (function () {
    var svg = $('depthSvg');
    svg.innerHTML =
      '<path d="M10 225 L150 40 L210 140 L260 75 L330 155 L450 225 Z" fill="#eef1ee" stroke="#c9cfcb" stroke-width="1"/>' +
      '<line x1="10" y1="225" x2="450" y2="225" stroke="#16181a" stroke-width="2"/>';
    var bands = [
      { y: 200, label: '1 840 M · BASE', v: M.depth.base },
      { y: 140, label: '2 450 M · PLATEAU', v: M.depth.mid },
      { y: 80,  label: '3 260 M · SUMMIT', v: M.depth.summit }
    ];
    var max = Math.max(M.depth.summit, 1);
    bands.forEach(function (b) {
      var w = 30 + (b.v / max) * 150;
      var g = document.createElementNS(NS, 'g');
      g.innerHTML =
        '<line x1="240" y1="' + b.y + '" x2="450" y2="' + b.y + '" stroke="#d5dad7" stroke-width="1"/>' +
        '<rect x="240" y="' + (b.y - 9) + '" width="' + w + '" height="9" fill="#16181a"/>' +
        '<text x="240" y="' + (b.y + 14) + '" font-family="Chivo Mono, monospace" font-size="9" letter-spacing="1" fill="#667074">' + b.label + '</text>' +
        '<text x="' + (244 + w) + '" y="' + (b.y - 13) + '" font-family="Chivo Mono, monospace" font-size="11" font-weight="500" fill="#16181a">' + b.v + '</text>';
      svg.appendChild(g);
    });
  })();

  /* ---------------- WEATHER ---------------- */
  $('wxStats').innerHTML =
    stat(M.temp.base.toFixed(0) + '°', '', 'Base · 1 840 m', false) +
    stat(M.temp.mid.toFixed(0) + '°', '', 'Plateau · 2 450 m', false) +
    stat(M.temp.summit.toFixed(0) + '°', '', 'Summit · 3 260 m', false) +
    stat(M.weather.wind, 'km/h', 'Wind · ' + M.weather.dir, M.weather.wind > 55) +
    (M.freezing >= 1840
      ? stat(String(M.freezing).replace(/\B(?=(\d{3})+(?!\d))/g, ' '), 'm', 'Freezing level', false)
      : stat('Valley', '', 'Freezing level below base', false));
  $('wxProse').innerHTML =
    (M.weather.storm > 0.66 ? '<strong>Storm day.</strong> Visibility drops with every hundred metres above the plateau; the forest skis better than anything with a view. ' :
     M.weather.storm > 0.33 ? 'Mixed sky, workable light. Cloud sits around the ridgelines and opens in pulses. ' :
     '<strong>Bluebird.</strong> Cold, clear and windless enough to hear your own edges. ') +
    'Wind at the summit anemometer is ' + M.weather.dir + ' at ' + M.weather.wind + ' km/h' +
    (M.weather.wind > 55 ? ' — expect holds on the exposed cables and drifted entries below the crête.' : ', within limits for every cable on the hill.');

  /* wind diagram: compass ring + wind vector + lee shading */
  (function () {
    var svg = $('windSvg');
    var cx = 230, cy = 122, R = 86;
    var C = window.CN.COMPASS;
    var g = ['<circle cx="' + cx + '" cy="' + cy + '" r="' + R + '" fill="none" stroke="#c9cfcb"/>'];
    for (var i = 0; i < 8; i++) {
      var a = (i * 45 - 90) * Math.PI / 180;
      var lx = cx + Math.cos(a) * (R + 18), ly = cy + Math.sin(a) * (R + 18) + 3;
      g.push('<text x="' + lx + '" y="' + ly + '" text-anchor="middle" font-family="Chivo Mono, monospace" font-size="10" fill="#667074">' + C[i] + '</text>');
      g.push('<line x1="' + (cx + Math.cos(a) * (R - 6)) + '" y1="' + (cy + Math.sin(a) * (R - 6)) + '" x2="' + (cx + Math.cos(a) * R) + '" y2="' + (cy + Math.sin(a) * R) + '" stroke="#c9cfcb"/>');
    }
    /* lee octants shaded (where slabs build) */
    var lee = (M.weather.dirI + 4) % 8;
    [-1, 0, 1].forEach(function (o) {
      var i2 = (lee + o + 8) % 8;
      var a1 = (i2 * 45 - 90 - 22.5) * Math.PI / 180, a2 = (i2 * 45 - 90 + 22.5) * Math.PI / 180;
      g.push('<path d="M' + cx + ' ' + cy + ' L' + (cx + Math.cos(a1) * R) + ' ' + (cy + Math.sin(a1) * R) +
             ' A' + R + ' ' + R + ' 0 0 1 ' + (cx + Math.cos(a2) * R) + ' ' + (cy + Math.sin(a2) * R) + ' Z" fill="rgba(216,39,44,0.14)"/>');
    });
    /* wind vector: from dir toward centre, length = speed */
    var wa = (M.weather.dirI * 45 - 90) * Math.PI / 180;
    var len = 26 + (M.weather.wind / 90) * 52;
    var x1 = cx + Math.cos(wa) * R, y1 = cy + Math.sin(wa) * R;
    var x2 = cx + Math.cos(wa) * (R - len), y2 = cy + Math.sin(wa) * (R - len);
    g.push('<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="#d8272c" stroke-width="3"/>');
    var pa = Math.atan2(y2 - y1, x2 - x1);
    g.push('<path d="M' + x2 + ' ' + y2 + ' L' + (x2 - Math.cos(pa - 0.44) * 11) + ' ' + (y2 - Math.sin(pa - 0.44) * 11) +
           ' L' + (x2 - Math.cos(pa + 0.44) * 11) + ' ' + (y2 - Math.sin(pa + 0.44) * 11) + ' Z" fill="#d8272c"/>');
    g.push('<text x="' + cx + '" y="' + (cy + 4) + '" text-anchor="middle" font-family="Chivo Mono, monospace" font-size="13" font-weight="500" fill="#16181a">' + M.weather.wind + '</text>');
    svg.innerHTML = g.join('');
    $('windCap').textContent = 'Fig. 2 — Wind ' + M.weather.dir + ' ' + M.weather.wind + ' km/h · shaded octants collect the slab';
  })();

  /* ---------------- DANGER ---------------- */
  $('dangerProse').innerHTML =
    'Rated <strong>' + M.danger.high + ' — ' + WORDS[M.danger.high].toLowerCase() + '</strong> above 2 400 m, ' +
    M.danger.tree + ' between the treeline bands and ' + M.danger.low + ' below. ' +
    (M.danger.high >= 4 ? 'This is a day for the forest and the groomed spine — the alpine will still be here on Thursday.' :
     M.danger.high === 3 ? 'Considerable is the rating that reads like an invitation and behaves like a test. Spacing, one at a time, an exit you’ve already named.' :
     'The pack is settling well. Respect the shaded high corners; enjoy the rest.');

  (function () {
    var svg = $('bandsSvg');
    var bands = [
      { label: '> 2 400 M', lv: M.danger.high, y: 55 },
      { label: '2 000 – 2 400 M', lv: M.danger.tree, y: 130 },
      { label: '< 2 000 M', lv: M.danger.low, y: 205 }
    ];
    var g = ['<path d="M18 232 L170 30 L240 130 L300 70 L442 232 Z" fill="#eef1ee" stroke="#c9cfcb"/>'];
    bands.forEach(function (b) {
      g.push('<line x1="18" y1="' + (b.y + 20) + '" x2="442" y2="' + (b.y + 20) + '" stroke="#d5dad7" stroke-dasharray="3 4"/>');
      g.push('<text x="18" y="' + (b.y - 14) + '" font-family="Chivo Mono, monospace" font-size="9" letter-spacing="1" fill="#667074">' + b.label + '</text>');
      for (var i = 0; i < 5; i++) {
        var on = i < b.lv;
        g.push('<rect x="' + (300 + i * 26) + '" y="' + (b.y - 6 - i * 4) + '" width="20" height="' + (10 + i * 4) + '" fill="' +
          (on ? DCOL[b.lv] : '#e2e6e2') + '"' + (on && b.lv === 5 ? ' stroke="#d8272c" stroke-width="2"' : '') + '/>');
      }
      g.push('<text x="270" y="' + (b.y + 8) + '" text-anchor="end" font-family="Archivo, sans-serif" font-weight="800" font-size="26" fill="#16181a">' + b.lv + '</text>');
    });
    svg.innerHTML = g.join('');
  })();

  /* problems with mini aspect roses */
  function rose(aspects, size) {
    var s = size || 74, c = s / 2, r = c - 3;
    var C = window.CN.COMPASS;
    var out = ['<svg class="rose" viewBox="0 0 ' + s + ' ' + s + '" role="img" aria-label="Loaded aspects: ' + aspects.join(', ') + '">'];
    for (var i = 0; i < 8; i++) {
      var a1 = (i * 45 - 90 - 22.5) * Math.PI / 180, a2 = (i * 45 - 90 + 22.5) * Math.PI / 180;
      var on = aspects.indexOf(C[i]) !== -1;
      out.push('<path d="M' + c + ' ' + c + ' L' + (c + Math.cos(a1) * r) + ' ' + (c + Math.sin(a1) * r) +
               ' A' + r + ' ' + r + ' 0 0 1 ' + (c + Math.cos(a2) * r) + ' ' + (c + Math.sin(a2) * r) + ' Z" fill="' +
               (on ? '#16181a' : '#e8ebe8') + '" stroke="#f5f6f4" stroke-width="1"/>');
    }
    out.push('<text x="' + c + '" y="9" text-anchor="middle" font-family="Chivo Mono, monospace" font-size="7" fill="#d8272c">N</text></svg>');
    return out.join('');
  }
  $('problems').innerHTML = M.problems.length
    ? M.problems.map(function (p) {
        return '<div class="problem"><h4>' + p.kind + '<small>' + (p.above ? 'above ' + p.above + ' m · ' : '') + p.aspects.join(' · ') + '</small></h4>' +
               rose(p.aspects) + '<p>' + p.note + '</p></div>';
      }).join('')
    : '<div class="problem"><h4>No named problem<small>General alpine caution applies</small></h4>' + rose([]) + '<p>No specific avalanche problem is on the board today. That is a description of the snowpack, not a promise.</p></div>';

  /* ---------------- LIFTS ---------------- */
  var stateWord = { open: 'Open', delayed: 'Delayed', hold: 'Wind hold', closed: 'Closed' };
  $('liftAside').textContent = spinning + ' of ' + M.lifts.length + ' spinning';
  $('liftBoard').innerHTML =
    '<div class="board-row head"><span>Lift</span><span>Line</span><span>Elevation</span><span>State</span></div>' +
    M.lifts.map(function (l) {
      return '<div class="board-row">' +
        '<span class="lift-name">' + l.name + '</span>' +
        '<span class="lift-kind">' + l.kind + '</span>' +
        '<span class="lift-alt">' + l.base + ' → ' + l.top + ' m</span>' +
        '<span class="lift-state ' + l.state + '"><i></i>' + stateWord[l.state] + ' <small>· ' + l.why + '</small></span>' +
        '</div>';
    }).join('');

  /* ---------------- OBSERVATIONS ---------------- */
  $('obsList').innerHTML = M.obs.map(function (o) {
    return '<li><span class="t">' + o.t + '</span><span class="s">' + o.s + '</span><span class="m">' + o.m + '</span></li>';
  }).join('');

  /* ---------------- TERRAIN TEASER (3 sectors) ---------------- */
  var teaser = M.sectors.slice(0, 3);
  var stateWordS = { open: 'Open', closed: 'Closed', 'no-access': 'No lift access' };
  $('sectorTeaser').innerHTML = teaser.map(function (s) {
    return '<article class="sector">' +
      '<div class="sector-top"><div><h3>' + s.name + '</h3>' +
      '<p class="meta">' + s.aspect + ' · ' + s.alt[0] + '–' + s.alt[1] + ' m · ' + s.steep + '° max</p></div>' +
      rose([s.aspect], 46).replace('class="rose"', 'class="mini-rose"') + '</div>' +
      '<span class="sector-state ' + (s.loaded && s.state === 'open' ? 'loaded' : s.state) + '">' +
      (s.loaded && s.state === 'open' ? 'Open · loaded aspects' : stateWordS[s.state]) + '</span>' +
      '<p>' + s.character + '</p></article>';
  }).join('');

  /* ---------------- snowfall overlay + wind audio ---------------- */
  U.setWind(M.weather.wind);
  (function () {
    if (U.reduced || M.snow24 < 6) return;
    var cv = document.getElementById('snowfall');
    cv.classList.add('on');
    var ctx = cv.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var w, h, flakes;
    function init() {
      w = window.innerWidth; h = window.innerHeight;
      cv.width = w * dpr; cv.height = h * dpr;
      var n = Math.min(140, 30 + M.snow24 * 3);
      if (w < 760 || navigator.hardwareConcurrency < 4) n = (n / 2) | 0;
      flakes = [];
      for (var i = 0; i < n; i++) {
        flakes.push({ x: Math.random() * w, y: Math.random() * h, r: 0.6 + Math.random() * 1.8, s: 0.5 + Math.random() * 1.4, p: Math.random() * 6.28 });
      }
    }
    var drift = (M.weather.wind / 90) * 1.6;
    var running = !document.hidden;
    function tick(t) {
      if (!running) return;
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.save(); ctx.scale(dpr, dpr);
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.strokeStyle = 'rgba(120,130,134,0.15)';
      for (var i = 0; i < flakes.length; i++) {
        var f = flakes[i];
        f.y += f.s; f.x += drift + Math.sin(t * 0.0006 + f.p) * 0.3;
        if (f.y > h + 4) { f.y = -4; f.x = Math.random() * w; }
        if (f.x > w + 4) f.x = -4;
        ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 6.2832); ctx.fill();
      }
      ctx.restore();
      requestAnimationFrame(tick);
    }
    document.addEventListener('visibilitychange', function () {
      running = !document.hidden;
      if (running) requestAnimationFrame(tick);
    });
    var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(init, 200); });
    init();
    requestAnimationFrame(tick);
  })();

  U.rise();
  U.video(document);
})();

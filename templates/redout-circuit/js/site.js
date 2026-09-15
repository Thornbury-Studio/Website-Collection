/* REDOUT — shared behaviour for every page.
 *
 * Everything here reads from window.REDOUT (js/data.js). Sections that do
 * not exist on the current page are skipped by the presence check at the
 * top of each block, so one script serves all four pages.
 */
(function () {
  'use strict';

  var D = window.REDOUT;
  var doc = document;
  var root = doc.documentElement;
  var anim = root.classList.contains('js-anim');
  var $ = function (sel, ctx) { return (ctx || doc).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var NOW = new Date();

  function el(tag, cls, html) {
    var e = doc.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function pilotName(p) { return esc(p.first) + ' ' + esc(p.last); }
  function teamName(p) { return esc(D.teams[p.team].name); }

  /* ------------------------------------------------------------------ */
  /* Header                                                              */
  /* ------------------------------------------------------------------ */
  var top = $('#top');
  function solid() { if (top) top.classList.toggle('is-solid', window.scrollY > 24); }
  solid();
  window.addEventListener('scroll', solid, { passive: true });

  var burger = $('#burger'), drawer = $('#drawer');
  if (burger && drawer) {
    burger.addEventListener('click', function () {
      var open = burger.getAttribute('aria-expanded') !== 'true';
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      drawer.setAttribute('data-open', String(open));
      doc.body.style.overflow = open ? 'hidden' : '';
    });
    $$('a', drawer).forEach(function (a) {
      a.addEventListener('click', function () {
        burger.setAttribute('aria-expanded', 'false');
        drawer.setAttribute('data-open', 'false');
        doc.body.style.overflow = '';
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* Next round, everywhere it is mentioned                              */
  /* ------------------------------------------------------------------ */
  var next = D.nextRound(NOW);
  var lastDone = D.completedRounds().slice(-1)[0];
  var longDate = { day: '2-digit', month: 'long' };

  $$('[data-next-code]').forEach(function (n) { n.textContent = next ? D.roundCode(next) + ' ' + next.city : 'Season over'; });
  $$('[data-next-line]').forEach(function (n) {
    n.textContent = next ? 'Round ' + D.pad2(next.n) + ' · ' + next.city + ' · ' + next.venue + ' · ' + D.fmtDate(next.date, longDate, next.tz).replace(/^0/, '') : 'Season 04 complete';
  });
  $$('[data-last-result]').forEach(function (n) {
    if (!lastDone) return;
    var w = D.winner(lastDone);
    n.textContent = D.roundCode(lastDone) + ' ' + lastDone.city + ' · ' + w.last + ' wins';
  });
  $$('[data-standings-kicker]').forEach(function (n) {
    var k = D.completedRounds().length;
    n.textContent = 'After ' + ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'][k] + ' round' + (k === 1 ? '' : 's') + ' of eight';
  });
  $$('[data-pass-line]').forEach(function (n) {
    var pit = D.tickets[1].price, rounds = D.rounds.length;
    var equiv = Math.floor(D.seasonPass / pit);
    n.textContent = 'A season pass is ' + ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'][rounds] + ' rounds of pit lane for less than ' + ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'][equiv + 1] + ' of them bought one at a time.';
  });

  $$('[data-rounds-run]').forEach(function (n) { n.textContent = D.completedRounds().length; });
  $$('[data-leader]').forEach(function (n) { var s0 = D.standings()[0]; n.textContent = '#' + s0.pilot.num + ' ' + s0.pilot.last + ' · ' + s0.pts + ' pts'; });
  $$('[data-quickest]').forEach(function (n) { var q = D.reactionGrid()[0]; n.textContent = q.last + ' · ' + q.reaction.toFixed(3) + ' s'; });
  $$('[data-fastest-line]').forEach(function (n) { var f = D.seasonFastest(); if (f) n.textContent = f.pilot.last + ' · ' + D.fmtTime(f.lap.total) + ' · ' + f.round.city; });
  $$('[data-pass-price]').forEach(function (n) { n.innerHTML = D.money(D.seasonPass) + '<small> all eight</small>'; });

  function countdown() {
    var nodes = $$('[data-countdown]');
    if (!nodes.length) return;
    var text;
    if (!next) text = 'Done';
    else {
      var ms = new Date(next.date).getTime() - Date.now();
      if (ms < -4 * 3600 * 1000) text = 'Result in';
      else if (ms <= 0) text = 'Live';
      else {
        var d = Math.floor(ms / 86400000), h = Math.floor(ms % 86400000 / 3600000), m = Math.floor(ms % 3600000 / 60000);
        text = d > 0 ? d + 'd ' + D.pad2(h) + 'h' : h > 0 ? h + 'h ' + D.pad2(m) + 'm' : m + 'm';
      }
    }
    nodes.forEach(function (n) { n.textContent = text; });
  }
  countdown();
  setInterval(countdown, 30000);

  /* ------------------------------------------------------------------ */
  /* Reveals: observer, failsafe, and a sweep for anything it missed     */
  /* ------------------------------------------------------------------ */
  var revealSel = '.reveal, .lines';
  function revealAll() { $$(revealSel).forEach(function (n) { n.classList.add('is-in'); }); }
  var io = null;
  if (anim && 'IntersectionObserver' in window) {
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    $$(revealSel).forEach(function (n) { io.observe(n); });
    setTimeout(revealAll, 3500);
    var sweepT = 0;
    function sweep() {
      if (sweepT) return;
      sweepT = setTimeout(function () {
        sweepT = 0;
        var vh = window.innerHeight;
        $$(revealSel).forEach(function (n) {
          if (n.classList.contains('is-in')) return;
          var r = n.getBoundingClientRect();
          if (r.top < vh && r.bottom > 0) n.classList.add('is-in');
        });
      }, 120);
    }
    window.addEventListener('scroll', sweep, { passive: true });
    window.addEventListener('resize', sweep);
    window.addEventListener('hashchange', sweep);
  } else {
    revealAll();
  }
  function rescanReveals() {
    if (!io) return;
    $$(revealSel).forEach(function (n) { if (!n.classList.contains('is-in')) io.observe(n); });
  }

  /* ------------------------------------------------------------------ */
  /* Velocity: the kinetic width and the redout veil                     */
  /* ------------------------------------------------------------------ */
  if (anim) {
    var lastY = window.scrollY, lastT = performance.now(), vel = 0, sq = 0, g = 0, running = false;
    function tick(now) {
      var dt = Math.max(8, now - lastT) / 1000;
      var y = window.scrollY;
      var v = (y - lastY) / dt; /* px per second, signed */
      lastY = y; lastT = now;
      vel += (v - vel) * 0.35;
      var target = clamp((Math.abs(vel) - 500) / 2800, 0, 1);
      sq += (target - sq) * (target > sq ? 0.28 : 0.09);
      var gt = clamp((Math.abs(vel) - 1400) / 3200, 0, 1);
      g += (gt - g) * (gt > g ? 0.3 : 0.06);
      root.style.setProperty('--wdth', (125 - 63 * sq).toFixed(2));
      root.style.setProperty('--g', (g * (1 - veilHold.g) + veilHold.g * veilHold.level).toFixed(3));
      if (Math.abs(vel) > 2 || sq > 0.004 || g > 0.004 || veilHold.g > 0) requestAnimationFrame(tick);
      else { running = false; root.style.setProperty('--wdth', '125'); root.style.setProperty('--g', '0'); }
    }
    var veilHold = { g: 0, level: 0 }; /* the gantry can hold the veil open while the lights are on */
    function wake() { if (!running) { running = true; lastT = performance.now(); lastY = window.scrollY; requestAnimationFrame(tick); } }
    window.addEventListener('scroll', wake, { passive: true });
    window.REDOUT_VEIL = { hold: function (level) { veilHold.g = level > 0 ? 1 : 0; veilHold.level = level; wake(); } };
  } else {
    window.REDOUT_VEIL = { hold: function () {} };
  }

  /* ------------------------------------------------------------------ */
  /* The wall                                                            */
  /* ------------------------------------------------------------------ */
  var mark = $('#mark');
  if (mark) {
    var wallMark = mark.parentElement;
    var probe = el('span');
    probe.style.cssText = 'position:absolute;left:-9999px;top:0;visibility:hidden;white-space:nowrap;font:900 100px/1 ' + getComputedStyle(mark).fontFamily + ';font-variation-settings:"wdth" 125;text-transform:uppercase;letter-spacing:-0.005em';
    probe.textContent = mark.textContent;
    doc.body.appendChild(probe);
    function fitMark() {
      /* Phones set the wordmark narrower (see the 720px rule in the stylesheet), so measure at that width. */
      probe.style.fontVariationSettings = '"wdth" ' + (window.innerWidth <= 720 ? 92 : 125);
      var w = probe.getBoundingClientRect().width;
      if (w < 10) return;
      var avail = wallMark.clientWidth - 16;
      var size = Math.floor(avail / w * 100 * 0.985);
      root.style.setProperty('--mark-size', size + 'px');
      /* The intro clears half the wordmark: it sits translated by half its own height. */
      root.style.setProperty('--mark-half', Math.round(size * 0.8 * 0.5) + 'px');
    }
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(fitMark);
    fitMark();
    window.addEventListener('resize', fitMark);
    setTimeout(fitMark, 600);
  }

  /* Feed videos: only the feeds that are visible get a source, and a feed
   * only plays while it is on screen. */
  function wireVideo(v) {
    if (!v || v.dataset.wired) return;
    v.dataset.wired = '1';
    if (!anim) return; /* reduced motion: posters only */
    var started = false;
    function start() {
      if (started) return;
      started = true;
      v.src = v.dataset.src;
      v.load();
      var p = v.play();
      if (p && p.catch) p.catch(function () {});
    }
    if ('IntersectionObserver' in window) {
      var vio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { start(); var p = v.play(); if (p && p.catch) p.catch(function () {}); }
          else if (started) v.pause();
        });
      }, { rootMargin: '120px 0px' });
      vio.observe(v);
    } else start();
  }
  $$('.feed').forEach(function (f, i) {
    var v = $('video', f);
    if (!v) return;
    if (getComputedStyle(f).display === 'none') return;
    wireVideo(v);
  });
  window.addEventListener('resize', function () {
    $$('.feed').forEach(function (f) { if (getComputedStyle(f).display !== 'none') wireVideo($('video', f)); });
  });
  $$('.pit-video video, .hero video').forEach(wireVideo);

  /* ------------------------------------------------------------------ */
  /* Ticker (true loop, see PATTERNS.md)                                 */
  /* ------------------------------------------------------------------ */
  var ticker = $('#ticker');
  if (ticker) {
    var st = D.standings();
    var items = [];
    if (next) items.push(D.roundCode(next) + ' ' + next.city + ' · ' + D.fmtDate(next.date, null, next.tz), next.venue, next.gates + ' gates', next.length + ' m a lap');
    items.push('16 pilots', '140 km/h');
    if (st[0].gap === 0 && st[1]) items.push(st[0].pilot.last + ' leads ' + st[1].pilot.last + ' by ' + st[1].gap);
    var f = D.seasonFastest();
    if (f) items.push('Fastest lap ' + D.fmtTime(f.lap.total) + ' · ' + f.pilot.last + ' · ' + f.round.city);
    ticker.innerHTML = '';
    var row = el('div', 'ticker-row');
    items.forEach(function (t) { row.appendChild(el('span', null, esc(t))); });
    ticker.appendChild(row);
    trueLoopMarquee(ticker, 14);
  }
  function trueLoopMarquee(track, secondsPerCopy) {
    if (!track || !track.firstElementChild) return;
    var master = track.firstElementChild.cloneNode(true);
    var timer;
    function build() {
      track.style.animationName = 'none';
      while (track.children.length > 1) track.removeChild(track.lastElementChild);
      var rowW = track.firstElementChild.getBoundingClientRect().width;
      var boxW = (track.parentElement || doc.body).getBoundingClientRect().width;
      if (rowW < 1) { track.style.animationName = ''; return; }
      var perHalf = Math.max(1, Math.ceil(boxW / rowW));
      for (var i = 1; i < perHalf * 2; i++) {
        var copy = master.cloneNode(true);
        copy.setAttribute('aria-hidden', 'true');
        track.appendChild(copy);
      }
      track.style.animationDuration = (secondsPerCopy * perHalf) + 's';
      void track.offsetWidth;
      track.style.animationName = '';
    }
    build();
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(build);
    window.addEventListener('resize', function () { clearTimeout(timer); timer = setTimeout(build, 150); });
  }

  /* ------------------------------------------------------------------ */
  /* Facts and counted numbers                                           */
  /* ------------------------------------------------------------------ */
  var dnf = D.dnfRate();
  $$('[data-dnf-rate]').forEach(function (n) { n.textContent = Math.round(dnf.rate * 100) + '%'; });

  var fastest = D.seasonFastest();
  var quickest = D.reactionGrid()[0];
  $$('[data-fastest]').forEach(function (n) { n.dataset.count = fastest ? fastest.lap.total : 0; });
  $$('[data-fastest-label]').forEach(function (n) { if (fastest) n.textContent = 'Fastest lap this season · ' + fastest.pilot.last + ', ' + fastest.round.city; });
  $$('[data-reaction]').forEach(function (n) { n.dataset.count = quickest.reaction; });
  $$('[data-reaction-label]').forEach(function (n) { n.textContent = 'Quickest off the tone · ' + quickest.last; });
  $$('[data-react-mean]').forEach(function (n) { var sum = 0; D.pilots.forEach(function (p) { sum += p.reaction; }); n.textContent = (sum / D.pilots.length).toFixed(2); });

  function countUp(node) {
    var target = parseFloat(node.dataset.count), dp = parseInt(node.dataset.dp || '0', 10), unit = node.dataset.unit || '';
    var small = unit ? '<small>' + esc(unit) + '</small>' : '';
    if (!anim) { node.innerHTML = target.toFixed(dp) + small; return; }
    var t0 = performance.now(), dur = 1100;
    function step(now) {
      var k = clamp((now - t0) / dur, 0, 1);
      var e = 1 - Math.pow(1 - k, 3);
      node.innerHTML = (target * e).toFixed(dp) + small;
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var counters = $$('[data-count]');
  if (counters.length) {
    if (anim && 'IntersectionObserver' in window) {
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) { countUp(e.target); cio.unobserve(e.target); } });
      }, { threshold: 0.4 });
      counters.forEach(function (n) { cio.observe(n); });
      setTimeout(function () { counters.forEach(function (n) { if (!n.dataset.done) { n.dataset.done = '1'; countUp(n); } }); }, 6000);
    } else counters.forEach(countUp);
  }

  /* ------------------------------------------------------------------ */
  /* Course geometry (shared by the strip, the calendar and the tool)    */
  /* ------------------------------------------------------------------ */
  function segments(course) {
    var n = course.length, out = [];
    for (var i = 0; i < n; i++) {
      var p0 = course[(i - 1 + n) % n], p1 = course[i], p2 = course[(i + 1) % n], p3 = course[(i + 2) % n];
      var c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      var c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      out.push('M' + p1[0] + ' ' + p1[1] + 'C' + c1[0].toFixed(2) + ' ' + c1[1].toFixed(2) + ' ' + c2[0].toFixed(2) + ' ' + c2[1].toFixed(2) + ' ' + p2[0] + ' ' + p2[1]);
    }
    return out;
  }
  function gateMarks(course, cls) {
    var n = course.length, s = '';
    for (var i = 0; i < n; i++) {
      var p = course[i], prev = course[(i - 1 + n) % n], nxt = course[(i + 1) % n];
      var dx = nxt[0] - prev[0], dy = nxt[1] - prev[1], L = Math.hypot(dx, dy) || 1;
      var nx = -dy / L * 3.2, ny = dx / L * 3.2;
      s += '<line class="cg' + (i === 0 ? ' start' : '') + '" x1="' + (p[0] + nx).toFixed(2) + '" y1="' + (p[1] + ny).toFixed(2) + '" x2="' + (p[0] - nx).toFixed(2) + '" y2="' + (p[1] - ny).toFixed(2) + '"/>';
    }
    s += '<circle class="cs" cx="' + course[0][0] + '" cy="' + course[0][1] + '" r="1.6"/>';
    return s;
  }
  function courseSvg(course, extra) {
    return '<svg class="course" viewBox="-5 -5 110 70" aria-hidden="true">' +
      '<path class="cl" d="' + segments(course).join('') + '"/>' + gateMarks(course) + (extra || '') + '</svg>';
  }

  var venueMap = $('#venue-map');
  if (venueMap && next) venueMap.innerHTML = courseSvg(next.course);

  /* ------------------------------------------------------------------ */
  /* Rounds strip (home)                                                 */
  /* ------------------------------------------------------------------ */
  var strip = $('#rounds-strip');
  if (strip) {
    D.rounds.forEach(function (r) {
      var s = D.status(r, NOW);
      var li = el('li', 'round reveal' + (s === 'next' ? ' is-next' : ''));
      var w = D.winner(r);
      var fl = r.finish ? D.fastestLap(r) : null;
      li.innerHTML =
        '<div class="round-top"><span>' + esc(D.fmtDate(r.date, { day: '2-digit', month: 'short', year: 'numeric' }, r.tz)) + '</span><span class="pill pill--' + s + '">' + (s === 'done' ? 'Result' : s === 'next' ? 'Next' : 'Soon') + '</span></div>' +
        '<div class="round-n">' + D.roundCode(r) + '<small>' + esc(r.city) + '</small><em>' + esc(r.venue) + ' · ' + r.gates + ' gates · ' + r.length + ' m</em></div>' +
        courseSvg(r.course) +
        '<div class="round-foot">' +
          (w ? '<span>Winner<b>' + pilotName(w) + '</b></span><span class="r">Best lap<b>' + D.fmtTime(fl.lap.total) + '</b></span>'
             : s === 'next' ? '<span>Doors<b>18:00</b></span><span class="r">Final<b>22:00</b></span>'
             : '<span>Grid<b>16</b></span><span class="r">Laps<b>3 × ' + r.gates + '</b></span>') +
        '</div>';
      strip.appendChild(li);
    });
    rescanReveals();
    /* Drag to scroll on a mouse; touch scrolls natively. */
    var drag = null;
    strip.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse') return;
      drag = { x: e.clientX, left: strip.scrollLeft, moved: false };
      strip.classList.add('is-drag');
    });
    window.addEventListener('pointermove', function (e) {
      if (!drag) return;
      var dx = e.clientX - drag.x;
      if (Math.abs(dx) > 3) drag.moved = true;
      strip.scrollLeft = drag.left - dx;
    });
    window.addEventListener('pointerup', function () { if (drag) { drag = null; strip.classList.remove('is-drag'); } });
    var nextCard = $('.round.is-next', strip);
    if (nextCard && window.innerWidth > 720) strip.scrollLeft = Math.max(0, nextCard.offsetLeft - strip.offsetLeft - 14 - parseFloat(getComputedStyle(strip).paddingLeft));
  }

  /* ------------------------------------------------------------------ */
  /* Standings (home: top eight; season page: everyone)                  */
  /* ------------------------------------------------------------------ */
  function renderStandings(table, limit, withForm) {
    var rows = D.standings().slice(0, limit || 99);
    rows.forEach(function (row) {
      var p = row.pilot;
      var div = el('div', 'row' + (row.pos === 1 ? ' is-leader' : ''));
      div.setAttribute('role', 'row');
      var form = '';
      if (withForm) {
        form = '<span class="form" aria-label="Form">' + row.results.map(function (res) {
          if (!res) return '<i>·</i>';
          if (res.dnf) return '<i class="x" title="DNF">X</i>';
          return '<i class="' + (res.pos === 1 ? 'w' : '') + '" title="P' + res.pos + '">' + res.pos + '</i>';
        }).join('') + '</span>';
      }
      div.innerHTML =
        '<span class="pos">' + row.pos + '</span>' +
        '<span class="pnum">' + p.num + '</span>' +
        '<span class="pname">' + pilotName(p) + '<small class="mute">' + esc(p.nat) + ' · ' + row.wins + ' win' + (row.wins === 1 ? '' : 's') + ' · ' + row.podiums + ' podium' + (row.podiums === 1 ? '' : 's') + (row.dnfs ? ' · ' + row.dnfs + ' DNF' : '') + '</small></span>' +
        '<span class="team">' + teamName(p) + (withForm ? '<br>' + form : '') + '</span>' +
        '<span class="pts">' + row.pts + '</span>' +
        '<span class="gap mute">' + (row.pos === 1 ? 'Leader' : '−' + row.gap) + '</span>';
      table.appendChild(div);
    });
  }
  var st8 = $('#standings-table');
  if (st8) renderStandings(st8, 8, false);
  var st16 = $('#standings-full');
  if (st16) renderStandings(st16, 16, true);

  /* ------------------------------------------------------------------ */
  /* Pilot cards (home: the top four)                                    */
  /* ------------------------------------------------------------------ */
  var cards = $('#pilot-cards');
  if (cards) {
    D.standings().slice(0, 4).forEach(function (row) {
      var p = row.pilot;
      var li = el('li', 'pcard');
      li.innerHTML =
        '<div class="big">' + p.num + '</div>' +
        '<div class="who"><b>' + pilotName(p) + '</b><span>' + teamName(p) + ' · ' + esc(p.nat) + '</span></div>' +
        '<p class="line">' + esc(p.line) + '</p>' +
        '<div class="tally"><span>P' + row.pos + ' · ' + row.wins + ' win' + (row.wins === 1 ? '' : 's') + '</span><b>' + row.pts + ' pts</b></div>';
      cards.appendChild(li);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Tiers                                                               */
  /* ------------------------------------------------------------------ */
  var tiers = $('#tiers');
  if (tiers) {
    D.tickets.forEach(function (t, i) {
      var li = el('li', 'tier' + (i === 2 ? ' tier--best' : ''));
      li.innerHTML = '<h3>' + esc(t.name) + '</h3><div class="price">' + D.money(t.price) + '<small>per round</small></div><div class="seat">' + esc(t.seat) + '</div><ul>' + t.includes.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul>';
      tiers.appendChild(li);
    });
  }

  /* ------------------------------------------------------------------ */
  /* The gates: one lap, armed by scroll                                 */
  /* ------------------------------------------------------------------ */
  var gatesSec = $('#gates');
  if (gatesSec) {
    var gRound = lastDone || D.rounds[0];
    var gBest = D.fastestLap(gRound);
    var gLap = gBest.lap;
    var N = gRound.gates;
    $$('[data-gates-kicker]').forEach(function (n) { n.textContent = gRound.city + ' · ' + gRound.venue + ' · ' + gBest.pilot.last + '’s best lap'; });
    var svg = $('#gates-svg');
    var gateEls = [], splitEls = [], lineEl = null, lineLen = 0, builtRows = 0;
    /* One row of twelve on a wide screen; two rows of six on a phone, where
     * twelve across would be gates the size of a fingernail. */
    function buildGates() {
      var rows = window.innerWidth <= 720 ? 2 : 1;
      if (rows === builtRows) return;
      builtRows = rows;
      var perRow = N / rows;
      var W = 1200, rowH = 300, H = rowH * rows, x0 = 56, x1 = W - 56;
      var pts = [];
      for (var gi = 0; gi < N; gi++) {
        var r = Math.floor(gi / perRow), k = gi % perRow;
        var gx = x0 + (x1 - x0) * k / (perRow - 1);
        var gy = r * rowH + 118 + Math.sin(gi * 0.95 + 0.4) * 46;
        pts.push([gx, gy]);
      }
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      var line = pts.map(function (p, i) { return (i % perRow === 0 ? 'M' : 'L') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join('');
      var html = '<path class="gate-line" id="gate-line" d="' + line + '"/>';
      pts.forEach(function (p, i) {
        var prev = pts[Math.max(0, i - 1)], nx = pts[Math.min(N - 1, i + 1)];
        var ang = Math.atan2(nx[1] - prev[1], nx[0] - prev[0]) * 180 / Math.PI;
        if (Math.abs(ang) > 60) ang = 0; /* the wrap from one row to the next is not a corner */
        html += '<rect class="gate" data-i="' + i + '" x="' + (p[0] - 40).toFixed(1) + '" y="' + (p[1] - 40).toFixed(1) + '" width="80" height="80" rx="8" transform="rotate(' + (ang * 0.6).toFixed(1) + ' ' + p[0].toFixed(1) + ' ' + p[1].toFixed(1) + ')"/>';
        html += '<text class="gnum" x="' + p[0].toFixed(1) + '" y="' + (p[1] + 70).toFixed(1) + '" text-anchor="middle">G' + D.pad2(i + 1) + '</text>';
        html += '<text class="split" data-i="' + i + '" x="' + p[0].toFixed(1) + '" y="' + (p[1] + 96).toFixed(1) + '" text-anchor="middle">' + D.fmtTime(gLap.cum[i]) + '</text>';
      });
      svg.innerHTML = html;
      gateEls = $$('.gate', svg); splitEls = $$('.split', svg); lineEl = $('#gate-line', svg);
      lineLen = lineEl.getTotalLength();
      lineEl.style.strokeDasharray = lineLen;
      lastArmed = -1;
    }
    var lastArmed = -1;
    buildGates();
    var timeEl = $('#gates-time'), labelEl = $('#gates-label'), barEl = $('#gates-bar');
    function setGates(p) {
      var t = p * gLap.total;
      var armed = 0;
      for (var i = 0; i < N; i++) if (t >= gLap.cum[i] - 0.0005) armed = i + 1;
      if (p >= 0.999) armed = N;
      if (armed !== lastArmed) {
        gateEls.forEach(function (g, i) { g.classList.toggle('on', i < armed); });
        splitEls.forEach(function (s, i) { s.classList.toggle('on', i < armed); });
        lastArmed = armed;
      }
      lineEl.style.strokeDashoffset = (lineLen * (1 - p)).toFixed(1);
      var shown = Math.min(t, gLap.total);
      var s = shown.toFixed(3).split('.');
      timeEl.innerHTML = '<em>' + s[0] + '</em>.' + s[1];
      labelEl.textContent = armed >= N ? 'Lap complete · ' + gBest.pilot.last : armed === 0 ? 'On the tone' : 'Gate ' + D.pad2(armed) + ' of ' + N;
      barEl.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    }
    if (anim) {
      var gTicking = false;
      function gatesScroll() {
        if (gTicking) return;
        gTicking = true;
        requestAnimationFrame(function () {
          gTicking = false;
          var r = gatesSec.getBoundingClientRect();
          var travel = gatesSec.offsetHeight - window.innerHeight;
          if (travel <= 0) { setGates(1); return; }
          setGates(clamp(-r.top / travel, 0, 1));
        });
      }
      window.addEventListener('scroll', gatesScroll, { passive: true });
      window.addEventListener('resize', function () { buildGates(); gatesScroll(); });
      gatesScroll();
    } else { window.addEventListener('resize', function () { buildGates(); setGates(1); }); setGates(1); }
  }

  /* ------------------------------------------------------------------ */
  /* The start gantry                                                    */
  /* ------------------------------------------------------------------ */
  var gantry = $('#gantry');
  if (gantry) {
    var lights = $$('.light', gantry), big = $('#gantry-big'), sub = $('#gantry-sub'), armBtn = $('#arm'), bestEl = $('#gantry-best');
    var gridEl = $('#react-grid');
    var state = 'idle', timers = [], t0 = 0, best = null;
    try {
      var saved = JSON.parse(localStorage.getItem('redout-best') || 'null');
      if (saved && saved.day === new Date().toDateString()) best = saved.ms;
    } catch (e) { /* storage unavailable */ }
    function showBest() { bestEl.textContent = best == null ? 'Best today —' : 'Best today ' + (best / 1000).toFixed(3) + ' s'; }
    showBest();

    function renderGrid(yours) {
      var grid = D.reactionGrid().map(function (p) { return { p: p, r: p.reaction }; });
      if (yours != null) grid.push({ you: true, r: yours / 1000 });
      grid.sort(function (a, b) { return a.r - b.r; });
      var youPos = -1;
      grid.forEach(function (g, i) { if (g.you) youPos = i; });
      var show = grid.slice(0, 6);
      if (youPos >= 6) show = grid.slice(0, 5).concat([grid[youPos]]);
      gridEl.innerHTML = show.map(function (g, i) {
        var pos = g.you ? youPos + 1 : grid.indexOf(g) + 1;
        if (g.you) return '<li class="you"><b>' + pos + '</b><span class="pn">YOU</span><span>Your start</span><span class="rt">' + g.r.toFixed(3) + '</span></li>';
        return '<li><b>' + pos + '</b><span class="pn">' + g.p.num + '</span><span>' + pilotName(g.p) + '</span><span class="rt">' + g.r.toFixed(3) + '</span></li>';
      }).join('');
      return youPos;
    }
    renderGrid(null);

    function clearTimers() { timers.forEach(clearTimeout); timers = []; }
    function setLights(n) { lights.forEach(function (l, i) { l.classList.toggle('on', i < n); }); }
    function reset(msg) {
      clearTimers();
      state = 'idle';
      gantry.classList.remove('is-go', 'is-hot');
      setLights(0);
      big.className = 'big';
      big.textContent = 'Arm';
      sub.innerHTML = msg || 'Five lights. A hold. Lights out. React.';
      armBtn.hidden = false;
      armBtn.textContent = 'Arm the gantry';
      window.REDOUT_VEIL.hold(0);
    }
    function arm() {
      if (state !== 'idle') return;
      state = 'arming';
      gantry.classList.add('is-hot');
      armBtn.hidden = true;
      big.className = 'big';
      big.textContent = 'Hold';
      sub.innerHTML = 'Lights on. <strong>Wait for them to go out.</strong>';
      window.REDOUT_VEIL.hold(0.42);
      for (var i = 1; i <= 5; i++) (function (n) {
        timers.push(setTimeout(function () { setLights(n); }, 700 + (n - 1) * 800));
      })(i);
      var holdMs = 900 + Math.random() * 1900;
      timers.push(setTimeout(function () {
        state = 'go';
        gantry.classList.add('is-go');
        setLights(0);
        big.textContent = 'Go';
        sub.textContent = 'Lights out.';
        window.REDOUT_VEIL.hold(0);
        t0 = performance.now();
        timers.push(setTimeout(function () { if (state === 'go') reset('Nothing. The grid left without you. <strong>Arm it again.</strong>'); }, 2500));
      }, 700 + 4 * 800 + holdMs));
    }
    function hit() {
      if (state === 'arming') {
        clearTimers();
        state = 'jump';
        gantry.classList.remove('is-hot');
        setLights(0);
        big.className = 'big jump';
        big.textContent = 'Jump';
        sub.innerHTML = 'Off before the lights went out. <strong>Five-second penalty.</strong>';
        window.REDOUT_VEIL.hold(0);
        timers.push(setTimeout(function () { reset('Again. <strong>Wait for the lights to go out.</strong>'); }, 1500));
        return;
      }
      if (state !== 'go') return;
      var ms = Math.round(performance.now() - t0);
      clearTimers();
      state = 'done';
      gantry.classList.remove('is-go', 'is-hot');
      var pos = renderGrid(ms) + 1;
      var field = D.pilots.length + 1;
      var quicker = pos - 1;
      big.className = 'big';
      big.innerHTML = (ms / 1000).toFixed(3) + '<small>s</small>';
      sub.innerHTML = pos === 1 ? 'Quicker than the whole grid. <strong>P1 of ' + field + '.</strong> Try that twice.' :
        quicker >= D.pilots.length ? '<strong>Last of ' + field + '.</strong> Every pilot on the grid had gone before you moved.' :
        '<strong>P' + pos + ' of ' + field + '.</strong> ' + quicker + ' pilot' + (quicker === 1 ? '' : 's') + ' left before you did.';
      if (best == null || ms < best) {
        best = ms;
        try { localStorage.setItem('redout-best', JSON.stringify({ day: new Date().toDateString(), ms: ms })); } catch (e) { /* storage unavailable */ }
      }
      showBest();
      armBtn.hidden = false;
      armBtn.textContent = 'Again';
      state = 'idle';
      gantry.classList.remove('is-hot');
    }
    armBtn.addEventListener('click', function (e) { e.stopPropagation(); arm(); });
    gantry.addEventListener('pointerdown', function (e) {
      if (e.target === armBtn || armBtn.contains(e.target)) return;
      if (state === 'idle') { arm(); return; }
      hit();
    });
    gantry.addEventListener('keydown', function (e) {
      if (e.key !== ' ' && e.key !== 'Enter') return;
      if (e.target === armBtn) return;
      e.preventDefault();
      if (state === 'idle') arm(); else hit();
    });
    doc.addEventListener('keydown', function (e) {
      if (e.key !== ' ' || state === 'idle' || state === 'done') return;
      if (gantry.contains(e.target)) return; /* the gantry's own handler has it */
      if (e.target && /INPUT|SELECT|TEXTAREA|BUTTON/.test(e.target.tagName)) return;
      e.preventDefault();
      hit();
    });
    doc.addEventListener('visibilitychange', function () { if (doc.hidden && state !== 'idle') reset(); });
  }

  /* ------------------------------------------------------------------ */
  /* Season page: calendar                                               */
  /* ------------------------------------------------------------------ */
  var cal = $('#calendar');
  if (cal) {
    D.rounds.forEach(function (r) {
      var s = D.status(r, NOW);
      var w = D.winner(r);
      var fl = r.finish ? D.fastestLap(r) : null;
      var div = el('div', 'cal-row reveal' + (s === 'next' ? ' is-next' : ''));
      div.innerHTML =
        '<div class="rn">' + D.roundCode(r) + '</div>' +
        '<div class="rdate">' + esc(D.fmtDate(r.date, { weekday: 'short', day: '2-digit', month: 'short' }, r.tz)) + '<small class="mute">' + esc(new Date(r.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })) + ' · your time</small></div>' +
        '<div class="rname"><b>' + esc(r.city) + '</b><span class="mute">' + esc(r.venue) + ' · ' + r.gates + ' gates · ' + r.length + ' m a lap · ' + esc(r.country) + '</span></div>' +
        '<div class="rres">' + (w ? 'Winner<b>' + pilotName(w) + '</b><span class="mute">Best lap ' + D.fmtTime(fl.lap.total) + ' · ' + esc(fl.pilot.last) + '</span>' : s === 'next' ? 'Next round<b>' + esc(D.fmtDate(r.date, longDate, r.tz)) + '</b><span>Tickets open</span>' : 'Grid of sixteen<b>Three laps</b>') + '</div>' +
        courseSvg(r.course);
      cal.appendChild(div);
    });
    rescanReveals();
  }

  /* ------------------------------------------------------------------ */
  /* Season page: compare two laps                                       */
  /* ------------------------------------------------------------------ */
  var cmp = $('#compare-tool');
  if (cmp) {
    var selA = $('#pilot-a'), selB = $('#pilot-b'), selR = $('#round-sel'), range = $('#scrub');
    var mapBox = $('#compare-map'), readA = $('#read-a'), readB = $('#read-b'), readGap = $('#read-gap'), readT = $('#read-t'), splits = $('#split-table');
    var labelA = $('#label-a'), labelB = $('#label-b');
    var st = D.standings();
    st.forEach(function (row) {
      var o = doc.createElement('option'); o.value = row.pilot.num; o.textContent = '#' + row.pilot.num + ' ' + row.pilot.first + ' ' + row.pilot.last;
      selA.appendChild(o); selB.appendChild(o.cloneNode(true));
    });
    D.completedRounds().forEach(function (r) {
      var o = doc.createElement('option'); o.value = r.key; o.textContent = D.roundCode(r) + ' ' + r.city + ' · ' + r.venue;
      selR.appendChild(o);
    });
    selA.value = st[0].pilot.num; selB.value = st[1].pilot.num; selR.value = D.completedRounds().slice(-1)[0].key;

    var geom = null;
    function buildMap() {
      var r = D.roundByKey(selR.value);
      var segs = segments(r.course);
      mapBox.innerHTML = '<svg viewBox="-5 -5 110 70" aria-hidden="true">' +
        segs.map(function (d, i) { return '<path class="cl" data-seg="' + i + '" d="' + d + '"/>'; }).join('') +
        gateMarks(r.course) +
        '<path class="trail-b" id="trail-b" d=""/><path class="trail-a" id="trail-a" d=""/>' +
        '<circle class="gb" id="dot-b" r="2.2"/><circle class="ga" id="dot-a" r="2.2"/></svg>';
      var paths = $$('path[data-seg]', mapBox);
      geom = { round: r, paths: paths, lens: paths.map(function (p) { return p.getTotalLength(); }) };
    }
    function pointAt(lap, t) {
      var g = 0;
      while (g < lap.cum.length - 1 && t >= lap.cum[g]) g++;
      var from = g === 0 ? 0 : lap.cum[g - 1];
      var f = clamp((t - from) / lap.splits[g], 0, 1);
      var pt = geom.paths[g].getPointAtLength(f * geom.lens[g]);
      return { x: pt.x, y: pt.y, g: g, f: f };
    }
    function trail(lap, t) {
      var d = '', pos = pointAt(lap, t);
      for (var i = 0; i < pos.g; i++) {
        var p = geom.paths[i];
        var pts = [];
        for (var k = 0; k <= 8; k++) { var q = p.getPointAtLength(geom.lens[i] * k / 8); pts.push(q.x.toFixed(2) + ' ' + q.y.toFixed(2)); }
        d += (i === 0 ? 'M' : 'L') + pts.join('L');
      }
      var cur = geom.paths[pos.g], last = [];
      for (var k2 = 0; k2 <= 8; k2++) { var q2 = cur.getPointAtLength(geom.lens[pos.g] * pos.f * k2 / 8); last.push(q2.x.toFixed(2) + ' ' + q2.y.toFixed(2)); }
      d += (pos.g === 0 ? 'M' : 'L') + last.join('L');
      return { d: d, pos: pos };
    }
    function update() {
      var pa = D.byNum(parseInt(selA.value, 10)), pb = D.byNum(parseInt(selB.value, 10)), r = geom.round;
      var la = D.lap(pa, r), lb = D.lap(pb, r);
      var maxT = Math.max(la.total, lb.total);
      var t = parseFloat(range.value) / 1000 * maxT;
      var ta = trail(la, Math.min(t, la.total)), tb = trail(lb, Math.min(t, lb.total));
      $('#trail-a', mapBox).setAttribute('d', ta.d);
      $('#trail-b', mapBox).setAttribute('d', tb.d);
      var da = $('#dot-a', mapBox), db = $('#dot-b', mapBox);
      da.setAttribute('cx', ta.pos.x.toFixed(2)); da.setAttribute('cy', ta.pos.y.toFixed(2));
      db.setAttribute('cx', tb.pos.x.toFixed(2)); db.setAttribute('cy', tb.pos.y.toFixed(2));
      /* Gap: the time each pilot took to reach the same point on the course,
       * taken at whichever of the two is behind. */
      var gap;
      var lead = ta.pos.g + ta.pos.f, lag = tb.pos.g + tb.pos.f;
      var ahead = lead >= lag ? 'a' : 'b';
      var dist = Math.min(lead, lag);
      var timeAt = function (lap, dpos) { var gi = Math.min(Math.floor(dpos), lap.splits.length - 1); var from = gi === 0 ? 0 : lap.cum[gi - 1]; return from + (dpos - gi) * lap.splits[gi]; };
      gap = timeAt(lb, dist) - timeAt(la, dist);
      readT.textContent = D.fmtTime(t);
      readA.innerHTML = '<b class="a">' + D.fmtTime(Math.min(t, la.total)) + '</b><span>#' + pa.num + ' ' + esc(pa.last) + ' · gate ' + D.pad2(Math.min(ta.pos.g + (ta.pos.f >= 1 ? 1 : 0), r.gates)) + '</span>';
      readB.innerHTML = '<b>' + D.fmtTime(Math.min(t, lb.total)) + '</b><span>#' + pb.num + ' ' + esc(pb.last) + ' · gate ' + D.pad2(Math.min(tb.pos.g + (tb.pos.f >= 1 ? 1 : 0), r.gates)) + '</span>';
      readGap.innerHTML = '<b class="' + (gap >= 0 ? 'ahead' : '') + '">' + (gap >= 0 ? '+' : '−') + D.fmtTime(Math.abs(gap)) + '</b><span>' + (Math.abs(gap) < 0.0005 ? 'Level' : (gap > 0 ? esc(pa.last) : esc(pb.last)) + ' ahead at this point') + '</span>';
      labelA.textContent = '#' + pa.num + ' ' + pa.last; labelB.textContent = '#' + pb.num + ' ' + pb.last;
      /* Split table */
      var rows = '<li class="th"><span>Gate</span><span>' + esc(pa.last) + '</span><span>' + esc(pb.last) + '</span><span class="d">Diff</span></li>';
      for (var i = 0; i < r.gates; i++) {
        var dd = lb.cum[i] - la.cum[i];
        var here = i === Math.min(ta.pos.g, tb.pos.g) && t < maxT;
        rows += '<li' + (here ? ' class="is-here"' : '') + '><b>G' + D.pad2(i + 1) + '</b><span>' + D.fmtTime(la.cum[i]) + '</span><span>' + D.fmtTime(lb.cum[i]) + '</span><span class="d ' + (dd > 0 ? 'pos' : dd < 0 ? 'neg' : '') + '">' + (dd >= 0 ? '+' : '−') + D.fmtTime(Math.abs(dd)) + '</span></li>';
      }
      rows += '<li><b>Lap</b><span>' + D.fmtTime(la.total) + '</span><span>' + D.fmtTime(lb.total) + '</span><span class="d ' + (lb.total - la.total > 0 ? 'pos' : 'neg') + '">' + (lb.total - la.total >= 0 ? '+' : '−') + D.fmtTime(Math.abs(lb.total - la.total)) + '</span></li>';
      splits.innerHTML = rows;
    }
    buildMap();
    update();
    selA.addEventListener('change', update);
    selB.addEventListener('change', update);
    selR.addEventListener('change', function () { buildMap(); update(); });
    range.addEventListener('input', update);
    var play = $('#play'), playing = null;
    if (play) {
      play.addEventListener('click', function () {
        if (playing) { cancelAnimationFrame(playing); playing = null; play.textContent = 'Play the lap'; return; }
        var start = performance.now(), from = parseFloat(range.value) >= 999 ? 0 : parseFloat(range.value);
        play.textContent = 'Stop';
        function step(now) {
          var v = from + (now - start) / 1000 * (1000 / 46); /* real time: about a lap in 46 s */
          if (v >= 1000) { range.value = 1000; update(); playing = null; play.textContent = 'Play the lap'; return; }
          range.value = v; update(); playing = requestAnimationFrame(step);
        }
        playing = requestAnimationFrame(step);
      });
    }
  }

  /* ------------------------------------------------------------------ */
  /* Pilots page: the roster                                             */
  /* ------------------------------------------------------------------ */
  var roster = $('#roster');
  if (roster) {
    var stAll = D.standings();
    var open = null;
    stAll.forEach(function (row) {
      var p = row.pilot;
      var b = el('button', 'pl');
      b.type = 'button';
      b.setAttribute('aria-expanded', 'false');
      b.dataset.num = p.num;
      b.innerHTML =
        (row.pos === 1 ? '<span class="tag">Leader</span>' : p.num === 1 ? '<span class="tag">Champion</span>' : '') +
        '<div class="big">' + p.num + '</div>' +
        '<div class="who"><b>' + pilotName(p) + '</b><span>' + teamName(p) + ' · ' + esc(p.nat) + '</span></div>' +
        '<div class="tally"><span>P' + row.pos + '</span><b>' + row.pts + ' pts</b></div>';
      b.addEventListener('click', function () { toggle(b, row); });
      roster.appendChild(b);
    });
    function toggle(btn, row) {
      var was = open;
      if (was) { was.btn.setAttribute('aria-expanded', 'false'); was.panel.remove(); open = null; }
      if (was && was.btn === btn) return;
      var p = row.pilot;
      var panel = el('div', 'pl-detail');
      panel.id = 'pilot-' + p.num;
      var res = '<li class="th"><span>Round</span><span>Circuit</span><span class="r">Pos</span><span class="r">Pts</span></li>' + D.completedRounds().map(function (r) {
        var x = D.result(r, p.num);
        return '<li><b>' + D.roundCode(r) + '</b><span>' + esc(r.city) + '</span><span class="r">' + (x.dnf ? '<span class="dnf">DNF</span>' : 'P' + x.pos) + '</span><span class="r">' + x.pts + '</span></li>';
      }).join('');
      var bestLap = null;
      D.completedRounds().forEach(function (r) { var l = D.lap(p, r); if (!bestLap || l.total < bestLap.lap.total) bestLap = { lap: l, round: r }; });
      panel.innerHTML =
        '<div><p class="kicker">#' + p.num + ' · ' + teamName(p) + ' · ' + esc(p.nat) + ' · since ' + p.since + '</p>' +
        '<h3 class="sec-title mt-sm">' + esc(p.first) + '<br>' + esc(p.last) + '</h3>' +
        '<p class="line">' + esc(p.line) + '</p>' +
        '<ul class="facts"><li class="fact"><b>' + p.reaction.toFixed(3) + '</b><span>Reaction, s</span></li><li class="fact"><b>' + (bestLap ? D.fmtTime(bestLap.lap.total) : '—') + '</b><span>Best lap' + (bestLap ? ', ' + esc(bestLap.round.city) : '') + '</span></li><li class="fact"><b>' + row.dnfs + '</b><span>DNF' + (row.dnfs === 1 ? '' : 's') + ' this season</span></li></ul>' +
        '<p class="mt-md"><button class="btn btn--paper close" type="button">Close</button></p></div>' +
        '<div><p class="kicker mb-sm">Season 04 · P' + row.pos + ' · ' + row.pts + ' points · ' + row.wins + ' win' + (row.wins === 1 ? '' : 's') + '</p><ul class="results">' + res + '</ul></div>';
      /* Insert after the last card of the row the button sits in. */
      var cols = Math.max(1, Math.round(roster.clientWidth / btn.offsetWidth));
      var kids = $$('.pl', roster);
      var idx = kids.indexOf(btn);
      var rowEnd = kids[Math.min(kids.length - 1, Math.floor(idx / cols) * cols + cols - 1)];
      rowEnd.after(panel);
      btn.setAttribute('aria-expanded', 'true');
      btn.setAttribute('aria-controls', panel.id);
      open = { btn: btn, panel: panel };
      $('.close', panel).addEventListener('click', function () { toggle(btn, row); btn.focus(); });
      if (anim) setTimeout(function () { var r = panel.getBoundingClientRect(); if (r.bottom > window.innerHeight || r.top < 64) panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 30);
    }
    var want = (location.hash || '').replace('#pilot-', '');
    if (want) { var b0 = $('.pl[data-num="' + want + '"]', roster); if (b0) b0.click(); }
  }

  /* ------------------------------------------------------------------ */
  /* Tickets page: hold seats, by mail                                   */
  /* ------------------------------------------------------------------ */
  var hold = $('#hold-form');
  if (hold) {
    var tierSel = $('#tier'), qty = $('#qty'), out = $('#hold-total'), roundSel = $('#hold-round');
    D.tickets.forEach(function (t) { var o = doc.createElement('option'); o.value = t.key; o.textContent = t.name + ' · ' + D.money(t.price); tierSel.appendChild(o); });
    var o0 = doc.createElement('option'); o0.value = 'pass'; o0.textContent = 'Season pass · ' + D.money(D.seasonPass); tierSel.appendChild(o0);
    D.rounds.forEach(function (r) { if (D.status(r, NOW) === 'done') return; var o = doc.createElement('option'); o.value = r.key; o.textContent = D.roundCode(r) + ' ' + r.city + ' · ' + D.fmtDate(r.date, longDate, r.tz); roundSel.appendChild(o); });
    tierSel.value = 'pitlane';
    function total() {
      var n = clamp(parseInt(qty.value, 10) || 1, 1, 8);
      qty.value = n;
      var t = tierSel.value === 'pass' ? { name: 'Season pass', price: D.seasonPass } : D.tickets.filter(function (x) { return x.key === tierSel.value; })[0];
      var sum = t.price * n;
      out.innerHTML = n + ' × ' + esc(t.name) + (tierSel.value === 'pass' ? '' : ' · ' + esc($('option:checked', roundSel).textContent)) + '<b>' + D.money(sum) + '</b>';
      roundSel.disabled = tierSel.value === 'pass';
      return { t: t, n: n, sum: sum };
    }
    total();
    tierSel.addEventListener('change', total); qty.addEventListener('input', total); roundSel.addEventListener('change', total);
    $('#qty-less').addEventListener('click', function () { qty.value = (parseInt(qty.value, 10) || 1) - 1; total(); });
    $('#qty-more').addEventListener('click', function () { qty.value = (parseInt(qty.value, 10) || 1) + 1; total(); });
    hold.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = $('#name').value.trim(), email = $('#email').value.trim();
      var s = total();
      var lines = [
        'Please hold ' + s.n + ' x ' + s.t.name + (tierSel.value === 'pass' ? '' : ' for ' + $('option:checked', roundSel).textContent) + '.',
        'Total ' + D.money(s.sum) + '.',
        '',
        'Name: ' + name,
        'Email: ' + email,
        '',
        'Sent from redoutcircuit.com'
      ];
      var href = 'mailto:tickets@redoutcircuit.com?subject=' + encodeURIComponent('Hold seats — ' + s.t.name + ' × ' + s.n) + '&body=' + encodeURIComponent(lines.join('\n'));
      /* Announced before it opens, so anything listening (a test harness, an analytics hook) can see it or stop it. */
      var ev = new CustomEvent('redout:hold', { detail: { href: href }, cancelable: true });
      if (hold.dispatchEvent(ev)) location.href = href;
    });
  }
})();

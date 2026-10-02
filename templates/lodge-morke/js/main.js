/* MØRKE — one film, scrubbed by scroll: the top of the page is the sky, the
   bottom is the lodge. Everything else is a reading of the sun at 78°26′ N.

   Modes
     scrub   the film follows the scroll (default)
     stills  three frames of the same film, swapped per chapter: reduced
             motion, Save-Data, or a film that cannot load or seek
   ?mode=stills forces the fallback, for screenshots. */
(function () {
  'use strict';

  var doc = document, root = doc.documentElement;
  var $ = function (s, r) { return (r || doc).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var small = window.matchMedia('(max-width: 700px)');
  var Sun = window.MorkeSun;

  /* ---------------------------------------------------------------- year */
  $$('[data-year]').forEach(function (el) { el.textContent = String(new Date().getFullYear()); });

  /* ---------------------------------------------------------------- the sun, now */
  var sunNow = $('[data-sun-now]');
  var clock = $('[data-clock]');
  var tz = 'Arctic/Longyearbyen';
  try { new Intl.DateTimeFormat('en-GB', { timeZone: tz }); } catch (e) { tz = 'Europe/Oslo'; }
  var clockFmt = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false });

  function deg(a) { return (a < 0 ? '−' : '+') + Math.abs(a).toFixed(1) + '°'; }
  function tickSun() {
    var a = Sun.altitude(new Date());
    sunNow.textContent = deg(a) + (a < Sun.RISE ? ' below the horizon' : ' above the horizon');
    clock.textContent = clockFmt.format(new Date());
  }
  tickSun();
  window.setInterval(tickSun, 30000);

  /* ---------------------------------------------------------------- the season chart */
  // drawn at the width it is shown, so its 11px labels stay 11px on a phone
  var seasonSvg = $('[data-season-svg]'), seasonW = 0;
  function drawSeason() {
    var svg = seasonSvg;
    if (!svg) return;
    var NS = 'http://www.w3.org/2000/svg';
    var W = Math.round(clamp(svg.parentNode.clientWidth || 640, 300, 640));
    if (W === seasonW) return;
    seasonW = W;
    $$('path, line, text, g, circle', svg).forEach(function (n) { if (n.parentNode === svg) svg.removeChild(n); });
    var H = W < 480 ? 230 : 260, L = 40, R = 16, T = 18, B = 34;
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    var start = Date.UTC(2026, 9, 1), end = Date.UTC(2027, 2, 1), day = 864e5;
    var top = 12, bot = -14;
    var x = function (t) { return L + (t - start) / (end - start) * (W - L - R); };
    var y = function (a) { return T + (top - a) / (top - bot) * (H - T - B); };
    function el(name, attrs, text) {
      var n = doc.createElementNS(NS, name);
      for (var k in attrs) n.setAttribute(k, attrs[k]);
      if (text != null) n.textContent = text;
      svg.appendChild(n);
      return n;
    }
    var pts = [];
    for (var t = start; t <= end; t += day) {
      var d = new Date(t);
      pts.push([t, Sun.dayMax(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())]);
    }
    // shade every day the sun stays down
    var shade = '';
    pts.forEach(function (p) { if (p[1] < Sun.RISE) shade += 'M' + x(p[0]).toFixed(1) + ' ' + y(0).toFixed(1) + 'V' + y(p[1]).toFixed(1); });
    el('path', { d: shade, class: 'below', stroke: 'rgba(167,232,192,0.18)', 'stroke-width': ((W - L - R) / pts.length + 0.4).toFixed(2) });
    el('line', { x1: L, x2: W - R, y1: y(0), y2: y(0), class: 'horizon' });
    el('line', { x1: L, x2: W - R, y1: y(Sun.CIVIL), y2: y(Sun.CIVIL), class: 'civil' });
    // Labels go where the curve can't be: 12 Nov – 30 Jan it stays under −6°, so the band
    // between the two lines is empty around the solstice, and late January is clear above 0°.
    var sol = x(Date.UTC(2026, 11, 21));
    el('text', { x: x(Date.UTC(2027, 0, 24)), y: y(0) - 6, class: 'note' }, 'Horizon');
    el('text', { x: sol, y: y(Sun.CIVIL) - 6, class: 'note', 'text-anchor': 'middle' }, W >= 480 ? '−6°: too dark to read outside' : '−6°: too dark to read');
    [12, 0, -12].forEach(function (a) { el('text', { x: L - 8, y: y(a) + 4, class: 'tick', 'text-anchor': 'end' }, (a > 0 ? '+' : a < 0 ? '−' : '') + Math.abs(a) + '°'); });
    var months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
    months.forEach(function (m, i) {
      var mt = Date.UTC(2026, 9 + i, 1);
      el('line', { x1: x(mt), x2: x(mt), y1: H - B, y2: H - B + 5, class: 'axis' });
      if (i < 5) el('text', { x: x(mt) + 4, y: H - B + 18, class: 'tick' }, m);
    });
    el('line', { x1: L, x2: W - R, y1: H - B, y2: H - B, class: 'axis' });
    el('path', { d: pts.map(function (p, i) { return (i ? 'L' : 'M') + x(p[0]).toFixed(1) + ' ' + y(p[1]).toFixed(1); }).join(''), class: 'curve' });
    // the low point
    var low = pts.reduce(function (m, p) { return p[1] < m[1] ? p : m; }, pts[0]);
    if (W >= 480) el('text', { x: x(low[0]), y: y(low[1]) - 9, class: 'note', 'text-anchor': 'middle' }, deg(low[1]) + ' on 21 Dec');
    el('text', { x: sol, y: y(0) - 24, class: 'note', 'text-anchor': 'middle' }, '113 days without the sun');
    // today, if it falls inside the chart
    var now = Date.now();
    if (now >= start && now <= end) {
      var dn = new Date(now), a = Sun.dayMax(dn.getUTCFullYear(), dn.getUTCMonth(), dn.getUTCDate());
      var g = doc.createElementNS(NS, 'g');
      g.setAttribute('class', 'today');
      svg.appendChild(g);
      var gx = x(now), gy = y(a);
      [['line', { x1: gx, x2: gx, y1: T - 4, y2: H - B }], ['circle', { cx: gx, cy: gy, r: 3.5 }]].forEach(function (s) {
        var n = doc.createElementNS(NS, s[0]); for (var k in s[1]) n.setAttribute(k, s[1][k]); g.appendChild(n);
      });
      var tx = doc.createElementNS(NS, 'text');
      tx.setAttribute('x', gx + 7); tx.setAttribute('y', T + 6);
      tx.textContent = 'Noon today ' + deg(a);
      g.appendChild(tx);
    }
  }
  drawSeason();
  var seasonTimer = 0;
  window.addEventListener('resize', function () { clearTimeout(seasonTimer); seasonTimer = setTimeout(drawSeason, 150); });

  /* ---------------------------------------------------------------- film */
  var video = $('[data-film]');
  var stills = $$('[data-still]');
  var chapters = $$('[data-ch]');
  var seasonCh = $('#season');
  var forced = /[?&]mode=stills\b/.test(location.search);
  var saveData = navigator.connection && navigator.connection.saveData;
  var mode = (forced || reduce.matches || saveData) ? 'stills' : 'scrub';
  var ready = false, target = 0, shown = 0, seeking = false, pendingSeek = null, failTimer = 0;
  var FPS = 24;

  function stillFor(id) { return id === 'way' ? 'ridge' : (id === 'lodge' || id === 'inside' || id === 'season') ? 'lodge' : 'sky'; }
  function showStill(name) { stills.forEach(function (s) { s.classList.toggle('is-on', s.getAttribute('data-still') === name); }); }

  function toStills(why) {
    mode = 'stills';
    ready = false;
    root.classList.remove('is-scrubbing');
    clearTimeout(failTimer);
    try { video.removeAttribute('src'); video.load(); } catch (e) { /* nothing loaded */ }
    root.setAttribute('data-film', 'stills:' + why);
    updateChapter();
  }

  function filmSrc() { return small.matches ? 'film/descent-s.mp4' : 'film/descent.mp4'; }

  function startFilm() {
    root.setAttribute('data-film', 'loading');
    video.preload = 'auto';
    video.src = filmSrc();
    video.load();
    failTimer = window.setTimeout(function () { if (!ready) toStills('timeout'); }, 15000);
  }

  video.addEventListener('loadeddata', function () {
    if (mode !== 'scrub') return;
    // iOS paints nothing until the element has played once; muted inline play is allowed.
    var p = video.play();
    if (p && p.then) p.then(function () { video.pause(); }).catch(function () { /* still seekable */ });
    else video.pause();
    ready = true;
    clearTimeout(failTimer);
    root.setAttribute('data-film', 'scrub');
    seekTo(target, true);
  });
  video.addEventListener('seeked', function () {
    seeking = false;
    if (mode === 'scrub' && ready && !root.classList.contains('is-scrubbing')) root.classList.add('is-scrubbing');
    if (pendingSeek != null) { var t = pendingSeek; pendingSeek = null; seekTo(t); }
  });
  video.addEventListener('error', function () { toStills('error'); });

  function seekTo(t, force) {
    if (!ready || !isFinite(video.duration)) return;
    var max = video.duration - 1 / (FPS * 2);
    t = clamp(t * max, 0, max);
    // only seek when the frame would actually change
    if (!force && Math.abs(t - video.currentTime) < 0.5 / FPS) return;
    if (seeking) { pendingSeek = t / max; return; }
    seeking = true;
    video.currentTime = t;
  }

  // scroll 0 = sky; the camera has landed on the lodge just before the window opens
  var insideSec = $('#inside');
  function filmProgress() {
    var endY = insideSec.offsetTop - window.innerHeight * 1.4; // = the lodge chapter's top, give or take
    return clamp(window.scrollY / Math.max(1, endY), 0, 1);
  }

  /* ---------------------------------------------------------------- through the window */
  // The second lit window from the left in the film's last frame, as fractions of
  // that frame (measured from film/lodge.webp; the phone cut is x 0.433–0.747 of it).
  var WIN = { wide: [0.5781, 0.7808, 0.5911, 0.8134, 1920, 1072], tall: [0.462, 0.7808, 0.503, 0.8134, 720, 1280] };
  var layer = $('[data-inside-layer]');
  var rooms = $$('[data-room]');
  var roomImgs = $$('[data-room-img]');
  var filmWrap = $('[data-film-wrap]');
  var zoomEl = $('[data-film-zoom]');
  var foot = $('.foot');
  var currentRoom = null, lastClip = '';
  function windowRect() {
    var w = WIN[small.matches ? 'tall' : 'wide'], vw = window.innerWidth, vh = window.innerHeight;
    var s = Math.max(vw / w[4], vh / w[5]), dw = w[4] * s, dh = w[5] * s, ox = (vw - dw) / 2, oy = (vh - dh) / 2;
    return [ox + w[0] * dw, oy + w[1] * dh, ox + w[2] * dw, oy + w[3] * dh];
  }
  function ease(q) { return q < 0.5 ? 2 * q * q : 1 - Math.pow(-2 * q + 2, 2) / 2; }
  function updateInside() {
    var y = window.scrollY, vh = window.innerHeight, vw = window.innerWidth;
    var top = insideSec.offsetTop, bottom = top + insideSec.offsetHeight;
    // open while #inside rises from 65% to 12% of the screen; close after the last caption has gone
    var open = clamp((y - (top - 0.65 * vh)) / (0.53 * vh), 0, 1);
    var close = clamp((y - (bottom - 0.6 * vh)) / (0.55 * vh), 0, 1);
    var q = open * (1 - close);
    if (mode === 'stills' || reduce.matches) q = (open >= 0.5 && close < 0.5) ? 1 : 0;
    root.classList.toggle('is-inside', q > 0.001);
    // Push in: the film zooms toward the window (up to 2.6x) while the opening stays
    // attached to that window, then the opening outgrows the screen.
    var e = q > 0.001 ? ease(q) : 0, r = windowRect();
    var cx = (r[0] + r[2]) / 2, cy = (r[1] + r[3]) / 2;
    var z = (mode === 'stills' || reduce.matches) ? 1 : 1 + 1.6 * Math.min(1, e * 1.4);
    zoomEl.style.transformOrigin = cx.toFixed(1) + 'px ' + cy.toFixed(1) + 'px';
    zoomEl.style.transform = z > 1.0005 ? 'scale(' + z.toFixed(4) + ')' : '';
    if (q > 0.001) {
      // the window as the zoomed film shows it, then grown out to the whole screen
      var wx0 = cx + (r[0] - cx) * z, wx1 = cx + (r[2] - cx) * z, wy0 = cy + (r[1] - cy) * z, wy1 = cy + (r[3] - cy) * z;
      var g = Math.pow(e, 1.6), k = 1 - g;
      var clip = 'inset(' + (wy0 * k).toFixed(1) + 'px ' + ((vw - wx1) * k).toFixed(1) + 'px ' + ((vh - wy1) * k).toFixed(1) + 'px ' + (wx0 * k).toFixed(1) + 'px round ' + (k * 3).toFixed(1) + 'px)';
      if (clip !== lastClip) { layer.style.clipPath = clip; layer.style.webkitClipPath = clip; lastClip = clip; }
      layer.style.setProperty('--settle', (1 + 0.14 * (1 - e)).toFixed(4));
      // whichever room is across the middle of the screen
      var mid = y + vh * 0.5, id = rooms[0].getAttribute('data-room');
      rooms.forEach(function (rm) { if (top + rm.offsetTop <= mid) id = rm.getAttribute('data-room'); }); // offsetTop is within #inside
      if (id !== currentRoom) {
        currentRoom = id;
        layer.setAttribute('data-on', id);
        roomImgs.forEach(function (im) { im.classList.toggle('is-on', im.getAttribute('data-room-img') === id); });
      }
    }
    // the last screen: lift the film with the footer so the lodge is never cut at its roof
    var lift = Math.max(0, vh - foot.getBoundingClientRect().top);
    filmWrap.style.transform = lift > 0.5 ? 'translate3d(0,' + (-lift).toFixed(1) + 'px,0)' : '';
  }

  var currentCh = null, currentStill = null;
  function updateChapter() {
    var mid = window.scrollY + window.innerHeight * 0.55, id = 'sky';
    chapters.forEach(function (c) { if (c.offsetTop <= mid) id = c.getAttribute('data-ch'); });
    if (id !== currentCh) {
      currentCh = id;
      var railId = id === 'inside' ? 'lodge' : id;
      $$('[data-rail]').forEach(function (a) {
        var on = a.getAttribute('data-rail') === railId;
        a.classList.toggle('is-now', on);
        if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
      });
    }
    // until the film is drawing (or if it never will), the matching still stands in
    var want = (mode === 'stills' || !ready) ? stillFor(id) : null;
    if (want && want !== currentStill) { currentStill = want; showStill(want); }
    root.classList.toggle('past-hero', window.scrollY > window.innerHeight * 0.6);
    root.classList.toggle('at-foot', window.scrollY + window.innerHeight > doc.documentElement.scrollHeight - 140);
  }

  var railFill = $('[data-rail-fill]');
  function frame() {
    var p = filmProgress();
    target = p;
    if (mode === 'scrub') {
      // a light ease on top of the scroll so a flick reads as a camera move, not a cut
      shown += (target - shown) * (reduce.matches ? 1 : 0.22);
      if (Math.abs(target - shown) < 0.0005) shown = target;
      seekTo(shown);
    }
    if (railFill) railFill.style.transform = 'scaleY(' + clamp(window.scrollY / Math.max(1, doc.documentElement.scrollHeight - window.innerHeight), 0, 1).toFixed(4) + ')';
    updateInside();
    updateChapter();
  }

  if (mode === 'scrub') startFilm(); else toStills(forced ? 'forced' : reduce.matches ? 'reduced-motion' : 'save-data');
  reduce.addEventListener('change', function (e) { if (e.matches) toStills('reduced-motion'); });
  small.addEventListener('change', function () {
    if (mode !== 'scrub') return;
    ready = false; root.classList.remove('is-scrubbing');
    startFilm();
  });

  /* ---------------------------------------------------------------- scrolling */
  var lenis = null;
  function boot() {
    var gsap = window.gsap, ST = window.ScrollTrigger;
    if (gsap && ST) gsap.registerPlugin(ST);

    if (window.Lenis && !reduce.matches) {
      lenis = new window.Lenis({ lerp: 0.09, smoothWheel: true, wheelMultiplier: 0.9 });
      root.classList.add('lenis');
      if (gsap) {
        if (ST) lenis.on('scroll', ST.update);
        gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
        gsap.ticker.lagSmoothing(0);
      } else {
        (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(performance.now());
      }
    }

    if (gsap) gsap.ticker.add(frame);
    else (function loop() { frame(); requestAnimationFrame(loop); })();

    // in-page links go through Lenis when it is running
    $$('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        var el = id.length > 1 && $(id);
        if (!el) return;
        e.preventDefault();
        if (lenis) lenis.scrollTo(el, { offset: 0, duration: 1.6 });
        else el.scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth' });
        var focusTarget = $('h1, h2', el) || el;
        focusTarget.setAttribute('tabindex', '-1');
        focusTarget.focus({ preventScroll: true });
        history.replaceState(null, '', id);
      });
    });

    if (!gsap || !ST || reduce.matches) return;

    // headings arrive line by line, once
    var Split = window.SplitType;
    $$('[data-split]').forEach(function (h) {
      if (!Split) return;
      h.setAttribute('aria-label', h.textContent.replace(/\s+/g, ' ').trim());
      var split = new Split(h, { types: 'lines', lineClass: 'line' });
      split.lines.forEach(function (ln) {
        ln.setAttribute('aria-hidden', 'true');
        var mask = doc.createElement('span');
        mask.className = 'line-mask';
        ln.parentNode.insertBefore(mask, ln);
        mask.appendChild(ln);
      });
      gsap.set(split.lines, { yPercent: 105 });
      ST.create({
        trigger: h, start: 'top 88%', once: true,
        onEnter: function () {
          gsap.to(split.lines, {
            yPercent: 0, duration: 1.15, ease: 'power3.out', stagger: 0.09,
            onComplete: function () { split.revert(); h.removeAttribute('aria-label'); }
          });
        }
      });
    });

    // each chapter dims as it leaves the top, so two never compete
    $$('.ch:not(.ch--season) .ch__body').forEach(function (b) {
      gsap.to(b, { opacity: 0.08, ease: 'none', scrollTrigger: { trigger: b, start: 'bottom 42%', end: 'bottom 6%', scrub: true } });
    });
  }
  if (doc.readyState === 'complete') boot(); else window.addEventListener('load', boot);
  window.addEventListener('resize', updateChapter);
  doc.addEventListener('visibilitychange', function () { if (!doc.hidden) frame(); });

  /* ---------------------------------------------------------------- enquiry */
  var form = $('[data-enquire]');
  var est = $('[data-estimate]');
  var done = $('[data-done]');
  var RATE = 11400, EMAIL = 'booking@morkelodge.no';
  var nok = new Intl.NumberFormat('en-GB');
  function read() {
    var g = parseInt(form.elements.guests.value, 10);
    g = isFinite(g) ? clamp(g, 1, 12) : 1;
    var n = parseInt(form.elements.nights.value, 10);
    return { guests: g, nights: n, total: g * n * RATE, month: form.elements.month.value };
  }
  function renderEst() {
    var o = read();
    est.textContent = 'For ' + o.guests + (o.guests === 1 ? ' guest, ' : ' guests, ') + o.nights + ' nights: NOK ' + nok.format(o.total) + '.';
  }
  form.addEventListener('input', renderEst);
  form.addEventListener('change', function () { form.elements.guests.value = read().guests; renderEst(); });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var bad = null;
    ['name', 'email'].forEach(function (k) {
      var f = form.elements[k];
      var ok = k === 'email' ? /.+@.+\..+/.test(f.value.trim()) : f.value.trim().length > 1;
      f.setAttribute('aria-invalid', ok ? 'false' : 'true');
      if (!ok && !bad) bad = f;
    });
    if (bad) {
      done.hidden = false;
      done.textContent = bad.name === 'email' ? 'We need an email address to write back to.' : 'Tell us your name and we’ll write back.';
      bad.focus();
      return;
    }
    var o = read();
    var body = [
      'Hello Mørke,', '',
      'We would like to come in ' + o.month + ': ' + o.guests + (o.guests === 1 ? ' guest, ' : ' guests, ') + o.nights + ' nights.',
      'Estimate on the site: NOK ' + nok.format(o.total) + '.', '',
      form.elements.note.value.trim(), '',
      form.elements.name.value.trim(), form.elements.email.value.trim()
    ].join('\n');
    var href = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent('Enquiry: ' + o.month + ', ' + o.guests + ' guests, ' + o.nights + ' nights') + '&body=' + encodeURIComponent(body);
    done.hidden = false;
    done.textContent = 'Your enquiry is written out in a new email to ' + EMAIL + '. Send it and we’ll reply within a day with the arrival dates that are open.';
    var go = form.dispatchEvent(new CustomEvent('morke:enquire', { cancelable: true, detail: { href: href, order: o } }));
    if (go) window.location.href = href;
  });
  renderEst();

  window.MORKE = { state: function () { return { mode: mode, ready: ready, target: +target.toFixed(4), shown: +shown.toFixed(4), time: video.currentTime, chapter: currentCh, room: currentRoom, inside: root.classList.contains('is-inside'), clip: lastClip, film: root.getAttribute('data-film') }; } };
})();

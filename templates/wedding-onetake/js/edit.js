/* CIRCLE TAKE — the page is the edit.
   One film sits behind the page and the scroll position is its playhead.
   Every cut in the film starts a section; the reel at the bottom is the
   film's timeline and the page's navigation at once.
   SHOTS must match the cut list in tools/film.sh. */
(function () {
  'use strict';

  var FPS = 24;
  var SHOTS = [3.5, 5, 5.5, 5, 5, 5, 5];
  var CUTS = [0];
  SHOTS.forEach(function (s, i) { CUTS.push(CUTS[i] + s); });
  var TOTAL = CUTS[CUTS.length - 1];

  var doc = document;
  var root = doc.documentElement;
  function $(s, r) { return (r || doc).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); }

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var sections = $$('[data-section]');
  var links = $$('[data-cut]');
  var tcEl = $('[data-tc]');

  /* timecode, the way an edit suite counts: hours from 01, then frames */
  function tc(t) {
    var f = Math.round(t * FPS);
    var fr = f % FPS, s = Math.floor(f / FPS);
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    return '01:' + p(Math.floor(s / 60)) + ':' + p(s % 60) + ':' + p(fr);
  }

  var top = $('[data-top]');
  if (top) {
    var onScroll = function () { top.classList.toggle('is-scrolled', window.scrollY > 40); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* every printed cut time comes from SHOTS, so the copy cannot drift from the film */
  sections.forEach(function (sec, i) {
    var el = $('.cut__tc', sec);
    if (el) el.textContent = 'Cut ' + (i < 10 ? '0' : '') + i + ' · ' + tc(CUTS[i]);
  });

  /* the reel's circles: drawn in code, one per shot */
  links.forEach(function (a) {
    var ns = 'http://www.w3.org/2000/svg';
    var svg = doc.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 100 40');
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    var path = doc.createElementNS(ns, 'path');
    path.setAttribute('d', 'M14 30 C 4 22, 10 6, 46 5 C 82 4, 98 12, 95 22 C 92 33, 62 37, 40 36 C 18 35, 4 28, 12 16 C 15 11, 22 8, 30 7');
    path.setAttribute('pathLength', '1');
    svg.appendChild(path);
    ($('.reel__lab', a) || a).appendChild(svg);
  });

  /* ------------------------------------------------------------------ */
  /* The enquiry: composes a WhatsApp message, sends nothing itself      */
  /* ------------------------------------------------------------------ */

  var WHATSAPP = '6581274460';
  var EMAIL = 'hello@circletake.sg';
  var form = $('[data-ask]');
  if (form) {
    var err = $('[data-err]', form);
    var out = $('[data-out]', form);
    var mail = $('[data-mail]', form);
    var longDate = function (v) {
      var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || '');
      if (!m) return '';
      var d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
      return new Intl.DateTimeFormat('en-SG', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(d);
    };
    var compose = function () {
      var f = form.elements;
      var lines = [
        'Hello Circle Take, is this date free?',
        '',
        'Date: ' + (longDate(f.date.value) || '(not chosen yet)'),
        'Names: ' + (f.names.value.trim() || '-'),
        'Looking at: ' + f.pack.value
      ];
      if (f.where.value.trim()) lines.push('The day: ' + f.where.value.trim());
      return lines.join('\n');
    };
    var syncMail = function () {
      mail.href = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent('Wedding date: ' + (longDate(form.elements.date.value) || 'enquiry')) + '&body=' + encodeURIComponent(compose());
    };
    form.addEventListener('input', syncMail);
    form.addEventListener('change', syncMail);
    syncMail();
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var f = form.elements, missing = [];
      [f.names, f.date].forEach(function (el) {
        var bad = !el.value.trim();
        el.setAttribute('aria-invalid', bad ? 'true' : 'false');
        if (bad) missing.push(el);
      });
      if (missing.length) {
        err.hidden = false;
        err.textContent = missing.length === 2 ? 'Add your names and the wedding date, and we can check it.' : missing[0] === f.date ? 'Add the wedding date; it is the first thing we check.' : 'Add your names so we know who to reply to.';
        missing[0].focus();
        return;
      }
      err.hidden = true;
      var url = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(compose());
      out.textContent = 'Your message is written in WhatsApp. Press send there and we reply within one working day. If WhatsApp did not open, use the email link instead.';
      form.setAttribute('data-ready', url);
      if (!form.hasAttribute('data-hold')) window.open(url, '_blank', 'noopener');
    });
  }

  /* ------------------------------------------------------------------ */
  /* Still mode: reduced motion (or no GSAP): a still frame and the list */
  /* ------------------------------------------------------------------ */

  var now = $('[data-now]');
  function markActive(i) {
    var name = links[i] && $('.reel__name', links[i]);
    if (now && name) now.innerHTML = '<b>' + (i < 10 ? '0' : '') + i + '</b>' + name.textContent;
    links.forEach(function (a, k) {
      var on = k === i;
      a.classList.toggle('is-on', on);
      if (on) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
    });
  }

  if (reduce.matches || !window.gsap || !window.ScrollTrigger) {
    root.classList.add('is-still');
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) markActive(+en.target.getAttribute('data-section')); });
      }, { rootMargin: '-45% 0px -45% 0px' });
      sections.forEach(function (s) { io.observe(s); });
    }
    markActive(0);
    return;
  }

  /* ------------------------------------------------------------------ */
  /* Rolling mode                                                        */
  /* ------------------------------------------------------------------ */

  var gsap = window.gsap;
  var ST = window.ScrollTrigger;
  gsap.registerPlugin(ST);

  var film = $('[data-film]');
  var still = $('[data-still]');
  var head = $('[data-head]');
  var load = $('[data-load]');
  var reel = $('[data-reel]');

  var lenis = null;
  if (window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 0.9 });
    lenis.on('scroll', ST.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  /* where each cut sits on the page: a cut lands as its section's panel
     rises into the lower quarter of the screen */
  var anchors = [];
  var panelTops = [];
  function measure() {
    var vh = window.innerHeight;
    var max = Math.max(1, doc.documentElement.scrollHeight - vh);
    anchors = sections.map(function (sec, i) {
      var panel = $('.panel', sec) || sec;
      var top = panel.getBoundingClientRect().top + window.scrollY;
      panelTops[i] = top;
      return i === 0 ? 0 : Math.max(1, Math.min(max - 1, top - vh * 0.8));
    });
    anchors.push(max);
    for (var i = 1; i < anchors.length; i++) if (anchors[i] <= anchors[i - 1]) anchors[i] = anchors[i - 1] + 1;
  }
  function timeAt(y) {
    for (var i = 0; i < SHOTS.length; i++) {
      if (y < anchors[i + 1]) {
        var p = Math.max(0, Math.min(1, (y - anchors[i]) / (anchors[i + 1] - anchors[i])));
        return CUTS[i] + p * SHOTS[i];
      }
    }
    return TOTAL;
  }
  function shotAt(t) {
    for (var i = SHOTS.length - 1; i >= 0; i--) if (t >= CUTS[i] - 1e-6) return i;
    return 0;
  }

  /* --- which rung of the ladder this screen gets --------------------- */
  function pickSource() {
    var pin = /[?&]rung=(2160|1080|720|p720)\b/.exec(location.search);   // ?rung= pins one for testing
    if (pin) return 'video/edit-' + pin[1] + '.mp4';
    var w = window.innerWidth, h = window.innerHeight;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var conn = navigator.connection || {};
    var slow = conn.saveData || /(^|-)2g|3g/.test(conn.effectiveType || '');
    if (h > w * 1.1 && w <= 900) return 'video/edit-p720.mp4';          // phones, upright: a 9:16 cut
    if (slow) return 'video/edit-720.mp4';
    var big = w >= 1680 && w * dpr >= 2880 && !(conn.downlink && conn.downlink < 5);
    if (big && film.canPlayType('video/mp4; codecs="avc1.640033"')) return 'video/edit-2160.mp4';
    if (w * dpr >= 1100) return 'video/edit-1080.mp4';
    return 'video/edit-720.mp4';
  }
  var portrait = window.innerHeight > window.innerWidth * 1.1 && window.innerWidth <= 900;

  /* --- the film, fetched whole so every seek is local ---------------- */
  var ready = false, started = false;
  function setLoad(text) { load.textContent = text; }
  function startFilm() {
    if (started) return;
    started = true;
    var src = pickSource();
    film.setAttribute('data-src', src);
    var done = function (url) {
      film.preload = 'auto';
      film.src = url;
      film.addEventListener('loadeddata', function () {
        ready = true;
        film.currentTime = snap(shown);
        film.addEventListener('seeked', function first() {
          film.removeEventListener('seeked', first);
          root.classList.add('is-rolling');
          setLoad('');
        });
      }, { once: true });
      film.load();
    };
    if (!window.fetch || !window.URL || !window.ReadableStream) { done(src); return; }
    fetch(src).then(function (res) {
      if (!res.ok || !res.body) throw new Error('film ' + res.status);
      var total = +res.headers.get('content-length') || 0;
      var got = 0, parts = [], reader = res.body.getReader();
      var pump = function () {
        return reader.read().then(function (r) {
          if (r.done) return;
          parts.push(r.value); got += r.value.length;
          if (total) setLoad('Loading the film ' + Math.floor(got / total * 100) + '%');
          return pump();
        });
      };
      return pump().then(function () { return new Blob(parts, { type: 'video/mp4' }); });
    }).then(function (blob) {
      done(URL.createObjectURL(blob));
    }).catch(function () {
      setLoad('');               // the stills carry the cuts instead
    });
  }
  film.addEventListener('error', function () { ready = false; root.classList.remove('is-rolling'); setLoad(''); });

  var coarse = window.matchMedia('(pointer: coarse)').matches;
  var saveData = !!(navigator.connection && navigator.connection.saveData);
  var kick = function () { startFilm(); };
  ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach(function (ev) {
    window.addEventListener(ev, kick, { once: true, passive: true });
  });
  window.addEventListener('scroll', kick, { once: true, passive: true });
  window.addEventListener('load', function () {
    if (saveData) return;      // only on the reader's first move
    var later = function () { window.setTimeout(startFilm, coarse ? 3500 : 1500); };
    if ('requestIdleCallback' in window) window.requestIdleCallback(later, { timeout: 2000 }); else later();
  });

  /* --- stills: what the cut shows before the film arrives ------------ */
  var stillShot = 0;
  function showStill(i) {
    if (i === stillShot) return;
    stillShot = i;
    if (i === 0) { still.hidden = true; return; }
    still.src = 'img/shot-' + i + (portrait ? '-p760' : '-1280') + '.webp';
    still.hidden = false;
  }

  /* --- the loop ------------------------------------------------------ */
  function snap(t) { return Math.min(TOTAL - 1 / FPS, Math.round(t * FPS) / FPS + 0.001); }
  var shown = 0, lastTc = '', lastShot = -1, lastP = -1;
  measure();
  shown = timeAt(window.scrollY);

  gsap.ticker.add(function () {
    var target = timeAt(window.scrollY);
    var d = target - shown;
    shown = Math.abs(d) < 0.002 ? target : shown + d * 0.28;

    if (ready && !film.seeking) {
      var want = snap(shown);
      if (Math.abs(film.currentTime - want) > 0.5 / FPS) film.currentTime = want;
    }

    var i = shotAt(shown);
    if (i !== lastShot) {
      lastShot = i;
      markActive(i);
      if (!root.classList.contains('is-rolling')) showStill(i);
    }
    var label = tc(shown);
    if (label !== lastTc) { tcEl.textContent = label; lastTc = label; }
    var p = shown / TOTAL;
    if (Math.abs(p - lastP) > 0.0004) {
      lastP = p;
      reel.style.setProperty('--p', p.toFixed(4));
      links.forEach(function (a, k) {
        var lp = Math.max(0, Math.min(1, (shown - CUTS[k]) / SHOTS[k]));
        a.style.setProperty('--lp', lp.toFixed(3));
      });
    }
  });

  /* --- navigation: jumping is shuttling through the film ------------- */
  function goTo(i, focus) {
    var y = i === 0 ? 0 : Math.max(0, panelTops[i] - window.innerHeight * 0.16);
    var dist = Math.abs(y - window.scrollY);
    var after = function () {
      if (!focus) return;
      var h = $('h1, h2', sections[i]);
      if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
    };
    if (lenis) lenis.scrollTo(y, { duration: Math.min(2.4, 0.8 + dist / 4000), onComplete: after });
    else { window.scrollTo({ top: y, behavior: 'smooth' }); window.setTimeout(after, 900); }
    if (history.replaceState) history.replaceState(null, '', '#' + sections[i].id);
  }
  doc.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href').slice(1);
    var idx = sections.findIndex(function (s) { return s.id === id; });
    if (idx < 0) return;
    e.preventDefault();
    startFilm();
    goTo(idx, true);
  });

  /* --- the circles that give the studio its name --------------------- */
  gsap.fromTo('.brand__ring path', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut', delay: 0.2 });
  gsap.fromTo('.circled path', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.9, ease: 'power2.inOut', delay: 0.9 });

  /* panels settle in as their cut lands (desktop only: phones paint at once) */
  if (window.matchMedia('(min-width: 901px)').matches) {
    sections.slice(1).forEach(function (sec) {
      var kids = $$('.panel > *', sec);
      gsap.set(kids, { autoAlpha: 0, y: 26 });
      ST.create({
        trigger: sec.querySelector('.panel'), start: 'top 82%', once: true,
        onEnter: function () { gsap.to(kids, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.07 }); }
      });
    });
  }

  /* keep the cut points honest when the layout moves */
  var t0;
  var remeasure = function () { clearTimeout(t0); t0 = setTimeout(function () { measure(); ST.refresh(); }, 120); };
  window.addEventListener('resize', remeasure);
  if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(remeasure);
  if ('ResizeObserver' in window) new ResizeObserver(remeasure).observe($('main'));

  /* a hash on arrival: land on that section */
  if (location.hash) {
    var start = sections.findIndex(function (s) { return '#' + s.id === location.hash; });
    if (start > 0) window.addEventListener('load', function () { measure(); goTo(start, false); });
  }

  window.CIRCLETAKE = {
    state: function () { return { shown: shown, shot: lastShot, ready: ready, rolling: root.classList.contains('is-rolling'), src: film.getAttribute('data-src'), currentTime: film.currentTime, anchors: anchors }; },
    start: startFilm
  };
})();

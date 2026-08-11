/* VELA — shared chrome: red-light switch, mobile drawer, reveals, the live
   "tonight" strip and the basket counter. Loaded on every page. */
(function (root, doc) {
  'use strict';

  var Sky = root.Sky, VELA = root.VELA;

  function $(sel, ctx) { return (ctx || doc).querySelector(sel); }
  function $$(sel, ctx) {
    return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel));
  }

  /* ---- Red-light mode ---------------------------------------------------- */

  function initVision() {
    var btn = $('#visionBtn');
    if (!btn) return;
    var el = doc.documentElement;

    function paint() {
      var on = el.getAttribute('data-vision') === 'night';
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      var txt = $('.vision__txt', btn);
      if (txt) txt.textContent = on ? 'Red light' : 'Red light';
      btn.setAttribute('aria-label',
        on ? 'Switch off red light mode and return to the day theme'
           : 'Switch on red light mode, the low-glare red display used in the dome');
      /* The meta colour follows so the browser chrome does not glare either. */
      var meta = $('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', on ? '#07070a' : '#f2eee6');
    }

    btn.addEventListener('click', function () {
      var on = el.getAttribute('data-vision') === 'night';
      if (on) el.removeAttribute('data-vision');
      else el.setAttribute('data-vision', 'night');
      try {
        localStorage.setItem('vela.vision', on ? 'day' : 'night');
      } catch (e) { /* private mode */ }
      paint();
      root.dispatchEvent(new CustomEvent('vela:vision', { detail: { night: !on } }));
    });

    paint();
  }

  /* ---- Mobile drawer ----------------------------------------------------- */

  function initDrawer() {
    var btn = $('#burger'), drawer = $('#drawer');
    if (!btn || !drawer) return;
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', open ? 'false' : 'true');
      drawer.hidden = open;
    });
    /* A resize into the desktop breakpoint must not leave the drawer stuck
       open behind the horizontal nav. */
    var mq = root.matchMedia('(min-width: 62rem)');
    var close = function (e) {
      if (e.matches) { drawer.hidden = true; btn.setAttribute('aria-expanded', 'false'); }
    };
    if (mq.addEventListener) mq.addEventListener('change', close);
    else if (mq.addListener) mq.addListener(close);
  }

  /* ---- Reveals ----------------------------------------------------------- */

  /* The observer only knows about elements that exist when it scans, so any
     script that injects markup carrying .reveal must call rescanReveals()
     afterwards — otherwise the injected content sits at opacity 0 forever
     while still holding its layout space (the membership tiers shipped that
     way once). */
  var revealIO = null;

  function rescanReveals() {
    var items = $$('.reveal:not([data-rv])');
    if (!items.length) return;
    if (!revealIO) {
      items.forEach(function (el) {
        el.setAttribute('data-rv', '1');
        el.classList.add('is-in');
      });
      return;
    }
    items.forEach(function (el) {
      el.setAttribute('data-rv', '1');
      revealIO.observe(el);
    });
  }

  function showAllReveals() {
    $$('.reveal').forEach(function (el) {
      el.setAttribute('data-rv', '1');
      el.classList.add('is-in');
    });
  }

  function initReveals() {
    if ('IntersectionObserver' in root &&
        !root.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      revealIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            revealIO.unobserve(entry.target);
          }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    }
    rescanReveals();

    /* Failsafe. In a background or hidden tab the observer never fires and an
       ungated page would serve nothing but whitespace. */
    root.setTimeout(function () {
      if (doc.visibilityState !== 'visible') showAllReveals();
    }, 1200);
    doc.addEventListener('visibilitychange', function () {
      if (doc.visibilityState === 'visible') return;
      showAllReveals();
    });
  }

  /* ---- The live strip ---------------------------------------------------- */

  function initTonight() {
    var host = $('#tonight');
    if (!host || !Sky || !VELA) return;

    function render() {
      var now = new Date();
      var s = VELA.site;
      var win = Sky.darkWindow(now, s.latitude, s.longitude);
      var moon = Sky.moon(Sky.dayNumber(now));
      var lit = Math.round(moon.illuminated * 100);
      var bits = [];

      if (win.darkStatus === 'above') {
        bits.push('<span class="tonight__item"><span class="tonight__dot"></span>' +
          'No astronomical darkness tonight</span>');
        bits.push('<span class="tonight__item tonight__item--wide">' +
          'Solar sessions daily &middot; deep-sky season resumes 3 August</span>');
      } else {
        var inDark = win.darkStart && win.darkEnd &&
          now >= win.darkStart && now <= win.darkEnd;
        bits.push('<span class="tonight__item"><span class="tonight__dot"></span>' +
          (inDark ? 'Dark now' : 'Tonight') + ' <b>' +
          Sky.clock(win.darkStart, s.timeZone) + '&ndash;' +
          Sky.clock(win.darkEnd, s.timeZone) + '</b></span>');
        bits.push('<span class="tonight__item tonight__item--wide">Astronomical dark <b>' +
          Sky.duration(win.darkMinutes) + '</b></span>');
      }

      bits.push('<span class="tonight__item">Moon <b>' + lit + '%</b> ' +
        Sky.moonPhaseName(moon.phase).toLowerCase() + '</span>');
      bits.push('<span class="tonight__item tonight__item--wide">Sunset <b>' +
        Sky.clock(win.sunset, s.timeZone) + '</b></span>');

      host.innerHTML = bits.join('<span class="tonight__sep" aria-hidden="true">/</span>');
    }

    render();
    /* Cheap, and it keeps "dark now" honest for anyone who leaves the tab
       open across the start of the window. */
    root.setInterval(render, 60000);
  }

  /* ---- Basket counter ---------------------------------------------------- */

  function initBasket() {
    var btn = $('#basketBtn');
    if (!btn || !VELA) return;
    var n = $('#basketCount', btn);

    function paint() {
      var c = VELA.basket.count();
      if (n) n.textContent = c;
      btn.setAttribute('data-empty', c === 0 ? '1' : '0');
      btn.setAttribute('aria-label', c === 0
        ? 'Your basket is empty'
        : 'Your basket, ' + c + (c === 1 ? ' ticket' : ' tickets'));
    }

    paint();
    root.addEventListener('vela:basket', paint);
    /* Another tab may have changed it. */
    root.addEventListener('storage', function (e) {
      if (e.key === 'vela.basket.v1' || e.key === 'vela.member.v1') paint();
    });
  }

  /* ---- Year stamp --------------------------------------------------------- */

  function initYear() {
    $$('[data-year]').forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });
  }

  function boot() {
    initVision();
    initDrawer();
    initReveals();
    initTonight();
    initBasket();
    initYear();
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot);
  else boot();

  root.VelaUI = { $: $, $$: $$, rescanReveals: rescanReveals };
})(window, document);

/* ============================================================================
   OSCILLA — shared chrome
   ----------------------------------------------------------------------------
   The header transport, the basket and its drawer, scroll reveals, and the
   toast that answers every action. The audio Engine is a lazy singleton kept
   here so any page can reach the same instrument.
   ========================================================================== */
(function (O, A) {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  /* The one engine on the page. Constructed here, but it does not touch
     Web Audio until start() is called from a real click. */
  var engine = new A.Engine();

  /* -- toast ---------------------------------------------------------------- */
  var toastTimer;
  function toast(msg, kind) {
    var el = $('#toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast'; el.setAttribute('role', 'status');
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.setAttribute('data-kind', kind || 'ok');
    el.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('is-on'); }, 3200);
  }

  /* -- reveals -------------------------------------------------------------- */
  function reveals(root) {
    var els = $$('.reveal:not(.is-in)', root);
    if (reduce || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    document.documentElement.classList.add('js-anim');
    setTimeout(function () {
      if (!document.querySelector('.reveal.is-in')) {
        els.forEach(function (el) { el.classList.add('is-in'); });
      }
    }, 2500);
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        var sibs = el.parentElement ? $$('.reveal', el.parentElement) : [];
        el.style.transitionDelay = Math.min(Math.max(0, sibs.indexOf(el)), 6) * 60 + 'ms';
        el.classList.add('is-in');
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* -- transport (header power / mute) --------------------------------------
     Power is the gesture that is allowed to create the AudioContext. Until it
     is pressed the site is silent and says so. */
  function transport() {
    var power = $('#btnPower'), mute = $('#btnMute'), led = $('#markLed');

    function paint() {
      var on = engine.ready && engine.ctx && engine.ctx.state === 'running';
      if (power) {
        power.setAttribute('aria-pressed', String(on));
        power.setAttribute('aria-label', on ? 'Sound on — switch off' : 'Switch sound on');
      }
      if (led) led.setAttribute('data-on', on && !engine.muted ? '1' : '0');
      if (mute) {
        mute.setAttribute('aria-pressed', String(engine.muted));
        mute.setAttribute('aria-label', engine.muted ? 'Unmute' : 'Mute');
        mute.disabled = !on;
      }
      document.documentElement.setAttribute('data-audio', on ? 'on' : 'off');
    }

    if (power) power.addEventListener('click', function () {
      var on = engine.ready && engine.ctx && engine.ctx.state === 'running';
      if (on) {
        engine.stop(); paint();
        toast('Sound off.');
      } else {
        engine.start().then(function (ok) {
          paint();
          toast(ok ? 'Sound on. Everything you hear is made in your browser.'
                   : 'Your browser blocked audio — try again after clicking the page.',
                ok ? 'ok' : 'warn');
        });
      }
    });

    if (mute) mute.addEventListener('click', function () {
      engine.setMuted(!engine.muted);
      paint();
      toast(engine.muted ? 'Muted.' : 'Unmuted.');
    });

    engine.on('ready', paint);
    engine.on('power', paint);
    paint();
    return paint;
  }

  /* -- basket ---------------------------------------------------------------- */
  function lineHTML(l) {
    var it = O.byId(l.id);
    if (!it) return '';
    return '<div class="bline" data-line="' + esc(it.id) + '">' +
        (it.img
          ? '<img class="bline__img" src="img/' + esc(it.img) + '" width="62" height="62" loading="lazy" decoding="async" alt="">'
          : '<span class="bline__img" aria-hidden="true"></span>') +
        '<div><p class="bline__n">' + esc(it.name) + '</p>' +
        '<p class="bline__p">' + esc(it.code) + ' · ' + O.money(it.price) + '</p></div>' +
        '<span class="step-n">' +
          '<button type="button" data-dec="' + esc(it.id) + '" aria-label="One fewer ' + esc(it.name) + '">&minus;</button>' +
          '<b class="u-num">' + l.qty + '</b>' +
          '<button type="button" data-inc="' + esc(it.id) + '" aria-label="One more ' + esc(it.name) + '">+</button>' +
        '</span>' +
      '</div>';
  }

  var lastFocus = null;

  function basket() {
    var btn = $('#basketBtn'), n = $('#basketCount');
    var drawer = $('#drawer'), scrim = $('#scrim');
    var body = $('#drawerBody'), tot = $('#drawerTotal'), save = $('#drawerSave');

    function paint(d) {
      d = d || {
        lines: O.basket.read(), count: O.basket.count(),
        discount: O.basket.discount(), total: O.basket.total()
      };
      if (n) n.textContent = d.count;
      if (btn) btn.setAttribute('data-full', d.count ? '1' : '0');
      if (tot) tot.textContent = O.money(d.total);
      if (save) {
        save.hidden = !d.discount;
        var v = $('#drawerSaveV');
        if (v) v.textContent = '−' + O.money(d.discount);
      }
      if (body) {
        body.innerHTML = d.lines.length
          ? d.lines.map(lineHTML).join('')
          : '<p class="drawer__empty">Nothing here yet.</p>';
      }
    }

    document.addEventListener('oscilla:basket', function (e) {
      paint(e.detail);
      if (btn && !reduce) {
        btn.classList.remove('is-bump'); btn.offsetWidth; btn.classList.add('is-bump');
        setTimeout(function () { btn.classList.remove('is-bump'); }, 320);
      }
    });

    function open() {
      if (!drawer) return;
      lastFocus = document.activeElement;
      scrim.hidden = false; scrim.offsetWidth;
      scrim.classList.add('is-open'); drawer.classList.add('is-open');
      drawer.setAttribute('aria-hidden', 'false');
      var x = $('#drawerClose'); if (x) x.focus();
      document.addEventListener('keydown', onKey);
    }
    function close() {
      if (!drawer) return;
      scrim.classList.remove('is-open'); drawer.classList.remove('is-open');
      drawer.setAttribute('aria-hidden', 'true');
      document.removeEventListener('keydown', onKey);
      setTimeout(function () { if (!scrim.classList.contains('is-open')) scrim.hidden = true; }, 380);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    function onKey(e) {
      if (e.key === 'Escape') { close(); return; }
      if (e.key !== 'Tab' || !drawer) return;
      var f = $$('button, a[href], input', drawer).filter(function (el) {
        return !el.disabled && el.offsetParent !== null;
      });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }

    if (btn) btn.addEventListener('click', function (e) { e.preventDefault(); open(); });
    var x = $('#drawerClose'); if (x) x.addEventListener('click', close);
    if (scrim) scrim.addEventListener('click', close);

    document.addEventListener('click', function (e) {
      var add = e.target.closest('[data-add]');
      if (add) {
        var id = add.getAttribute('data-add');
        O.basket.add(id, 1);
        add.classList.add('is-done');
        var was = add.textContent; add.textContent = 'Added';
        setTimeout(function () { add.classList.remove('is-done'); add.textContent = was; }, 1200);
        var it = O.byId(id);
        if (it) toast(it.name + ' added to the basket.');
        return;
      }
      var bundle = e.target.closest('[data-add-bundle]');
      if (bundle) {
        O.basket.addBundle();
        toast('All four added — the set saves ' + O.money(O.bundleFull() * O.bundleOff) + '.');
        return;
      }
      var inc = e.target.closest('[data-inc]');
      if (inc) {
        var li = O.basket.read().filter(function (l) { return l.id === inc.getAttribute('data-inc'); })[0];
        O.basket.setQty(inc.getAttribute('data-inc'), (li ? li.qty : 0) + 1); return;
      }
      var dec = e.target.closest('[data-dec]');
      if (dec) {
        var ld = O.basket.read().filter(function (l) { return l.id === dec.getAttribute('data-dec'); })[0];
        O.basket.setQty(dec.getAttribute('data-dec'), (ld ? ld.qty : 0) - 1);
      }
    });

    paint();
  }

  function init() {
    transport();
    basket();
    reveals();
  }

  O.ui = {
    esc: esc, $: $, $$: $$, reduce: reduce,
    engine: engine, toast: toast, reveals: reveals, init: init
  };
})(window.OSCILLA, window.OSCILLA_AUDIO);

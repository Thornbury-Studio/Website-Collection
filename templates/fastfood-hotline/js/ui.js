/* ============================================================================
   HOTLINE — shared interface
   ----------------------------------------------------------------------------
   Everything that appears on more than one page lives here: the header bag and
   its drawer, the trading-status pip, the scroll reveals, and the two markup
   builders (photo card / typographic row) that the menu is drawn from.
   ========================================================================== */
(function (H) {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  /* -- markup ------------------------------------------------------------- */

  function heatHTML(n) {
    if (!n) return '<span class="heat"><span class="heat__l">No heat</span></span>';
    var bars = '';
    for (var i = 1; i <= 5; i++) {
      bars += '<i class="' + (i <= n ? 'on' + (n === 5 && i === 5 ? ' max' : '') : '') + '"></i>';
    }
    return '<span class="heat"><span class="heat__bars" role="img" aria-label="Heat ' + n + ' of 5">' +
           bars + '</span><span class="heat__l">' + n + '/5</span></span>';
  }

  function cardHTML(it) {
    return '<article class="card reveal">' +
        '<div class="card__media">' +
          '<img src="img/' + esc(it.img) + '" width="1200" height="900" loading="lazy" decoding="async" alt="' + esc(it.alt) + '">' +
          '<span class="card__no u-num">' + esc(it.no) + '</span>' +
          (it.tags.length ? '<span class="card__tag">' + esc(it.tags[0]) + '</span>' : '') +
        '</div>' +
        '<div class="card__body">' +
          '<div class="card__head">' +
            '<h3 class="card__name">' + esc(it.name) + '</h3>' +
            '<span class="card__price u-num">' + H.money(it.price) + '</span>' +
          '</div>' +
          '<p class="card__desc">' + esc(it.desc) + '</p>' +
          '<div class="card__foot">' + heatHTML(it.heat) +
            '<button class="add" type="button" data-add="' + esc(it.id) + '">Add</button>' +
          '</div>' +
        '</div>' +
      '</article>';
  }

  function rowHTML(it) {
    return '<div class="row reveal">' +
        '<span class="row__no u-num">' + esc(it.no) + '</span>' +
        '<span class="row__t">' +
          '<span class="row__n">' + esc(it.name) + '</span>' +
          '<span class="row__d">' + esc(it.desc) + '</span>' +
        '</span>' +
        heatHTML(it.heat) +
        '<span class="row__p">' + H.money(it.price) + '</span>' +
        '<button class="add" type="button" data-add="' + esc(it.id) + '">Add</button>' +
      '</div>';
  }

  /* -- reveals ------------------------------------------------------------ */

  function reveals(root) {
    var els = $$('.reveal:not(.is-in)', root);
    if (reduce || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    // Only now is it safe to hide them: we know we can put them back.
    document.documentElement.classList.add('js-anim');

    // Failsafe. If nothing at all has been revealed a few seconds in, the
    // observer is not firing in this environment — show everything rather
    // than serve a blank page. Scoped to the "nothing fired" case so it can
    // never pre-empt a working observer.
    setTimeout(function () {
      if (!document.querySelector('.reveal.is-in')) {
        els.forEach(function (el) { el.classList.add('is-in'); });
      }
    }, 2500);

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        // stagger siblings so a grid arrives as a wave, not a slab
        var sibs = el.parentElement ? $$('.reveal', el.parentElement) : [];
        var i = Math.max(0, sibs.indexOf(el));
        el.style.transitionDelay = Math.min(i, 7) * 55 + 'ms';
        el.classList.add('is-in');
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* -- bag + drawer ------------------------------------------------------- */

  var lastFocus = null;

  function bagLineHTML(line) {
    var it = H.byId(line.id);
    if (!it) return '';
    return '<div class="bagline" data-line="' + esc(it.id) + '">' +
        (it.img
          ? '<img class="bagline__img" src="img/' + esc(it.img) + '" width="64" height="64" loading="lazy" decoding="async" alt="">'
          : '<span class="bagline__img" aria-hidden="true"></span>') +
        '<div>' +
          '<p class="bagline__n">' + esc(it.name) + '</p>' +
          '<p class="bagline__p">' + H.money(it.price) + ' each</p>' +
        '</div>' +
        '<span class="step">' +
          '<button type="button" data-dec="' + esc(it.id) + '" aria-label="One fewer ' + esc(it.name) + '">&minus;</button>' +
          '<b class="u-num">' + line.qty + '</b>' +
          '<button type="button" data-inc="' + esc(it.id) + '" aria-label="One more ' + esc(it.name) + '">+</button>' +
        '</span>' +
      '</div>';
  }

  function initBag() {
    var countEl = $('#bagCount'), topBag = $('#topBag');
    var drawer = $('#drawer'), scrim = $('#scrim');
    var body = $('#drawerBody'), totalEl = $('#drawerTotal');

    function paint(detail) {
      var d = detail || { lines: H.bag.read(), count: H.bag.count(), total: H.bag.total() };
      if (countEl) countEl.textContent = d.count;
      if (topBag) topBag.setAttribute('data-empty', d.count ? '0' : '1');
      if (totalEl) totalEl.textContent = H.money(d.total);
      if (body) {
        body.innerHTML = d.lines.length
          ? d.lines.map(bagLineHTML).join('')
          : '<p class="drawer__empty">Nothing in the bag yet.</p>';
      }
    }

    document.addEventListener('hotline:bag', function (e) {
      paint(e.detail);
      if (topBag && !reduce) {
        topBag.classList.remove('is-bump');
        topBag.offsetWidth;          // restart the transition cleanly
        topBag.classList.add('is-bump');
        setTimeout(function () { topBag.classList.remove('is-bump'); }, 340);
      }
    });

    function open() {
      if (!drawer) return;
      lastFocus = document.activeElement;
      scrim.hidden = false;
      scrim.offsetWidth;
      scrim.classList.add('is-open');
      drawer.classList.add('is-open');
      drawer.setAttribute('aria-hidden', 'false');
      var x = $('#drawerClose'); if (x) x.focus();
      document.addEventListener('keydown', onKey);
    }
    function close() {
      if (!drawer) return;
      scrim.classList.remove('is-open');
      drawer.classList.remove('is-open');
      drawer.setAttribute('aria-hidden', 'true');
      document.removeEventListener('keydown', onKey);
      setTimeout(function () { if (!scrim.classList.contains('is-open')) scrim.hidden = true; }, 400);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    function onKey(e) {
      if (e.key === 'Escape') { close(); return; }
      if (e.key !== 'Tab' || !drawer) return;
      var f = $$('button, a[href], input, select, textarea', drawer)
                .filter(function (el) { return !el.disabled && el.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }

    // The bag link is a real link to the order page; JS upgrades it to the drawer.
    if (topBag) topBag.addEventListener('click', function (e) {
      if (!drawer) return;
      e.preventDefault();
      open();
    });
    var x = $('#drawerClose'); if (x) x.addEventListener('click', close);
    if (scrim) scrim.addEventListener('click', close);

    // delegated: add / step buttons anywhere on the page
    document.addEventListener('click', function (e) {
      var add = e.target.closest('[data-add]');
      if (add) {
        H.bag.add(add.getAttribute('data-add'), 1);
        add.classList.add('is-done');
        var was = add.textContent;
        add.textContent = 'Added';
        setTimeout(function () { add.classList.remove('is-done'); add.textContent = was; }, 1300);
        return;
      }
      var inc = e.target.closest('[data-inc]');
      if (inc) {
        var li = H.bag.read().filter(function (l) { return l.id === inc.getAttribute('data-inc'); })[0];
        H.bag.setQty(inc.getAttribute('data-inc'), (li ? li.qty : 0) + 1); return;
      }
      var dec = e.target.closest('[data-dec]');
      if (dec) {
        var ld = H.bag.read().filter(function (l) { return l.id === dec.getAttribute('data-dec'); })[0];
        H.bag.setQty(dec.getAttribute('data-dec'), (ld ? ld.qty : 0) - 1);
      }
    });

    paint();
  }

  /* -- trading status ----------------------------------------------------- */

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function initStatus() {
    var pip = $('#statusPip'), text = $('#statusText');
    var label = $('#counterLabel'), value = $('#counterValue');
    if (!pip && !value) return;

    function tick() {
      var s = H.service();
      if (pip) pip.setAttribute('data-open', s.open ? '1' : '0');
      if (text) text.textContent = s.open ? 'Open now' : 'Closed';

      if (value) {
        // Last orders is half an hour before the shutters; once that has passed
        // the counter switches to counting down the close itself.
        var ms = s.ms;
        if (s.open) {
          var toLast = ms - 30 * 60 * 1000;
          if (toLast > 0) { if (label) label.textContent = 'Last orders in'; ms = toLast; }
          else { if (label) label.textContent = 'Kitchen closes in'; }
        } else if (label) {
          label.textContent = 'Opens in';
        }
        var t = Math.max(0, Math.floor(ms / 1000));
        value.textContent = pad(Math.floor(t / 3600)) + ':' + pad(Math.floor(t / 60) % 60) + ':' + pad(t % 60);
      }
    }
    tick();
    setInterval(tick, 1000);
  }

  H.ui = {
    esc: esc, $: $, $$: $$,
    heatHTML: heatHTML, cardHTML: cardHTML, rowHTML: rowHTML, bagLineHTML: bagLineHTML,
    reveals: reveals, initBag: initBag, initStatus: initStatus, reduce: reduce
  };
})(window.HOTLINE);

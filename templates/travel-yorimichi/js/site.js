/* YORIMICHI — shared behaviour: header, drawer, search, reveal, helpers. */
(function () {
  'use strict';

  var Y = window.YORI = window.YORI || {};

  /* ---- helpers ---- */
  Y.money = function (n) {
    return 'S$' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  Y.parseDate = function (iso) {
    var p = iso.split('-');
    return new Date(+p[0], +p[1] - 1, +p[2]);
  };
  Y.fmtDate = function (iso) {
    var d = Y.parseDate(iso);
    return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
  };
  Y.fmtDay = function (iso) {
    return DAYS[Y.parseDate(iso).getDay()];
  };
  Y.addDays = function (iso, n) {
    var d = Y.parseDate(iso);
    d.setDate(d.getDate() + n);
    return d.getDate() + ' ' + MONTHS[d.getMonth()];
  };
  Y.tour = function (slug) {
    var list = window.YORI_TOURS || [];
    for (var i = 0; i < list.length; i++) if (list[i].slug === slug) return list[i];
    return null;
  };
  Y.nextDeparture = function (t) {
    for (var i = 0; i < t.departures.length; i++) if (t.departures[i][2] > 0) return t.departures[i];
    return t.departures[0];
  };
  Y.seatsHtml = function (seats) {
    if (seats === 0) return '<span class="seats seats--out">Sold out · waitlist</span>';
    if (seats <= 3) return '<span class="seats seats--low">' + seats + ' seat' + (seats === 1 ? '' : 's') + ' left</span>';
    return '<span class="seats">' + seats + ' seats open</span>';
  };
  Y.esc = function (s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  };
  Y.qs = function (name) {
    var m = new RegExp('[?&]' + name + '=([^&#]*)').exec(window.location.search);
    return m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : '';
  };

  /* ---- header: drawer + search ---- */
  var burger = document.getElementById('burger');
  var drawer = document.getElementById('drawer');
  if (burger && drawer) {
    burger.addEventListener('click', function () {
      var open = burger.getAttribute('aria-expanded') !== 'true';
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      drawer.setAttribute('data-open', String(open));
      document.body.classList.toggle('is-locked', open);
    });
    drawer.addEventListener('click', function (e) {
      if (e.target.closest('a')) burger.click();
    });
  }

  var searchBtn = document.getElementById('searchBtn');
  var search = document.getElementById('search');
  if (searchBtn && search) {
    searchBtn.addEventListener('click', function () {
      var open = search.hidden;
      search.hidden = !open;
      searchBtn.setAttribute('aria-expanded', String(open));
      if (open) {
        var input = search.querySelector('input');
        if (input) input.focus();
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !search.hidden) {
        search.hidden = true;
        searchBtn.setAttribute('aria-expanded', 'false');
        searchBtn.focus();
      }
    });
  }

  /* ---- reveal on entry: the one motion ---- */
  var items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && items.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('is-in');
          io.unobserve(en.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('is-in'); });
  }
})();

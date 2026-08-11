/* ============================================================================
   SALTFIELD — shared interface
   ----------------------------------------------------------------------------
   Everything that appears on more than one page: the conditions line (the
   house's own light, computed), the hold pip in the header, scroll reveals,
   and the toast that answers every action the guest takes.
   ========================================================================== */
(function (S) {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  /* -- reveals -------------------------------------------------------------
     Content is visible by default; it is only hidden once script confirms it
     can animate it back in (the .js-anim gate), and a failsafe shows
     everything if the observer never fires. Learned the hard way.          */
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
        var i = Math.max(0, sibs.indexOf(el));
        el.style.transitionDelay = Math.min(i, 6) * 70 + 'ms';
        el.classList.add('is-in');
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* -- conditions line ----------------------------------------------------- */
  function conditions() {
    var el = $('#conditions');
    if (!el) return;
    var l = S.light();
    el.innerHTML =
      '<span>54°36′N&thinsp;0°54′W</span>' +
      '<i aria-hidden="true"></i><span>First light ' + l.first + '</span>' +
      '<i aria-hidden="true"></i><span>Last light ' + l.last + '</span>' +
      '<i aria-hidden="true"></i><span>at the house</span>';
  }

  /* -- hold pip ------------------------------------------------------------
     The header's "Book" link grows a small pip when a hold is being carried,
     so the guest can see across every page that the house is keeping their
     dates. */
  function paintHold(h) {
    var link = $('#bookLink');
    if (!link) return;
    var room = h && S.byId(h.room);
    link.setAttribute('data-hold', room ? '1' : '0');
    var label = $('#bookLabel');
    if (label) label.textContent = room ? 'Book · ' + room.name : 'Book';
  }

  /* -- toast ---------------------------------------------------------------
     One small confirmation surface, aria-live, self-dismissing. Every action
     that changes state answers through this or an inline status — nothing the
     guest does goes unacknowledged. */
  var toastTimer;
  function toast(msg, kind) {
    var el = $('#toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast';
      el.setAttribute('role', 'status');
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.setAttribute('data-kind', kind || 'ok');
    el.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('is-on'); }, 3400);
  }

  /* -- room card (rooms grid on home + rooms pages) ------------------------ */
  function cardHTML(r) {
    return '<article class="rcard reveal">' +
        '<div class="rcard__media plate">' +
          '<img src="img/' + esc(r.img) + '" width="1200" height="900" loading="lazy" decoding="async" alt="' + esc(r.alt) + '">' +
          '<span class="rcard__no u-num">No. ' + esc(r.no) + '</span>' +
        '</div>' +
        '<div class="rcard__body">' +
          '<div class="rcard__head">' +
            '<h3 class="rcard__name">' + esc(r.name) + '</h3>' +
            '<span class="rcard__rate u-num">from ' + S.money(Math.round(r.rate * S.seasons.low.mult)) + '</span>' +
          '</div>' +
          '<p class="rcard__line">' + esc(r.line) + '</p>' +
          '<p class="rcard__meta"><span>Sleeps ' + r.sleeps + '</span><span>' + esc(r.bed) + '</span><span>' + esc(r.outlook) + ' outlook</span></p>' +
          '<a class="linkline" href="room.html?r=' + esc(r.id) + '">See the room</a>' +
        '</div>' +
      '</article>';
  }

  /* -- date helpers for display ------------------------------------------- */
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function fmtDay(d) { return d ? d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear() : ''; }
  function isoDay(d) {
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }

  function init() {
    conditions();
    paintHold(S.hold.read());
    document.addEventListener('saltfield:hold', function (e) { paintHold(e.detail); });
  }

  S.ui = {
    esc: esc, $: $, $$: $$, reduce: reduce,
    reveals: reveals, toast: toast, init: init,
    cardHTML: cardHTML, fmtDay: fmtDay, isoDay: isoDay
  };
})(window.SALTFIELD);

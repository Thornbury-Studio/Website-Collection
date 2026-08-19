/* A&E Unisex Salon — the whole site's JavaScript. Reveals, a live open/closed
   pill and today's-row highlighting, computed in the salon's own timezone.
   No frameworks, no inline scripts, no cookies, no storage, no third parties. */
(function () {
  'use strict';

  document.documentElement.classList.remove('no-js');
  document.documentElement.classList.add('js-anim');

  /* --- reveals ------------------------------------------------------------ */
  function revealNow(el) { el.classList.add('is-in'); }

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { revealNow(entry.target); io.unobserve(entry.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });

    // Failsafe: if nothing revealed shortly after load, show everything.
    setTimeout(function () {
      if (!document.querySelector('.reveal.is-in')) {
        document.querySelectorAll('.reveal').forEach(revealNow);
      }
    }, 1400);

    // IO can miss anchor jumps; a cheap throttled sweep catches anything
    // already on screen that never fired.
    var tick = false;
    function sweep() {
      document.querySelectorAll('.reveal:not(.is-in)').forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < (window.innerHeight || 0) && r.bottom > 0) revealNow(el);
      });
    }
    window.addEventListener('scroll', function () {
      if (tick) return;
      tick = true;
      setTimeout(function () { tick = false; sweep(); }, 200);
    }, { passive: true });
    window.addEventListener('hashchange', sweep);
  } else {
    document.querySelectorAll('.reveal').forEach(revealNow);
  }

  /* --- opening hours -------------------------------------------------------
     Verified against the L'Oreal Professionnel salon listing and directory
     entries (Aug 2026), consistent with Google's live "closes 8 pm" on a
     weekday:  Mon-Fri 10.00-20.00,  Sat & Sun 09.30-19.00.
     Change these two rows and the visit table together. */
  var HOURS = {
    mon: [600, 1200], tue: [600, 1200], wed: [600, 1200],
    thu: [600, 1200], fri: [600, 1200],
    sat: [570, 1140], sun: [570, 1140]
  };
  var LABEL = { 1200: '8pm', 1140: '7pm' };

  function sgNow() {
    try {
      var parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Singapore', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false
      }).formatToParts(new Date());
      var day = null, h = 0, m = 0;
      parts.forEach(function (p) {
        if (p.type === 'weekday') day = p.value.toLowerCase();
        if (p.type === 'hour') h = parseInt(p.value, 10) % 24;
        if (p.type === 'minute') m = parseInt(p.value, 10);
      });
      return { day: day, min: h * 60 + m };
    } catch (e) { return null; }
  }

  function paintPill() {
    var pill = document.querySelector('[data-open-pill]');
    var line = document.querySelector('[data-open-line]');
    if (!pill || !line) return;
    var now = sgNow();
    if (!now || !HOURS[now.day]) { line.textContent = 'Open seven days a week'; return; }
    var span = HOURS[now.day];
    if (now.min >= span[0] && now.min < span[1]) {
      pill.dataset.state = 'open';
      line.textContent = (span[1] - now.min <= 60)
        ? 'Open · closing at ' + LABEL[span[1]]
        : 'Open now · till ' + LABEL[span[1]];
    } else {
      pill.dataset.state = 'closed';
      var next = now.min >= span[1] ? 'tomorrow' : 'today';
      line.textContent = 'Closed · opens ' + next;
    }
  }
  paintPill();
  setInterval(paintPill, 60000);

  /* --- highlight today in the hours table --------------------------------- */
  var now2 = sgNow();
  if (now2 && now2.day) {
    document.querySelectorAll('.hours-table tr[data-day]').forEach(function (row) {
      if ((row.getAttribute('data-day') || '').split(' ').indexOf(now2.day) !== -1) {
        row.setAttribute('data-today', '');
      }
    });
  }

  /* --- footer year -------------------------------------------------------- */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();

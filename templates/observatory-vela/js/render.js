/* VELA — one renderer for a programme session, shared by the home page and the
   full programme so a session can never be described two different ways in two
   places. Booking is wired by delegation, so freshly rendered rows work without
   rebinding anything. */
(function (root, doc) {
  'use strict';

  var VELA = root.VELA, Sky = root.Sky;

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  var KIND_LABEL = {
    dome: 'Dome show', telescope: 'Telescope night',
    solar: 'Solar observing', lecture: 'Lecture'
  };

  /* Availability wording is derived from the remaining count rather than
     stored, so a session cannot claim seats it does not have. */
  function availability(s) {
    if (s.remaining <= 0) return { cls: 'avail--none', text: 'Sold out' };
    if (s.remaining <= Math.max(3, Math.round(s.capacity * 0.12))) {
      return { cls: 'avail--low', text: s.remaining + ' left' };
    }
    return { cls: 'avail--ok', text: 'Places available' };
  }

  function sessionHTML(s, opts) {
    opts = opts || {};
    var av = availability(s);
    var start = new Date(s.startsAt);
    var end = new Date(start.getTime() + s.minutes * 60000);
    var tz = VELA.site.timeZone;

    var when = '<div class="session__when">' +
      (opts.showDay === false ? '' :
        '<span>' + esc(VELA.dayLabel(start)) + '</span>') +
      '<b>' + Sky.clock(start, tz) + '</b>' +
      '<span>to ' + Sky.clock(end, tz) + '</span></div>';

    var meta = [KIND_LABEL[s.kind] || 'Session', s.minutes + ' min', 'Ages ' + s.age];
    if (s.kind === 'telescope' && s.darkMinutes) {
      meta.push('dark for ' + Sky.duration(s.darkMinutes));
    }

    var body = '<div class="session__body">' +
      '<div class="tagset"><span class="tag' +
        (s.kind === 'telescope' ? ' tag--signal' : '') + '">' +
        esc(KIND_LABEL[s.kind] || 'Session') + '</span>' +
      '<span class="tag">' + esc(s.minutes + ' min') + '</span>' +
      '<span class="tag">' + esc('Ages ' + s.age) + '</span></div>' +
      '<h3>' + esc(s.title) + '</h3>' +
      '<p>' + esc(s.blurb) + '</p></div>';

    var side = '<div class="session__side">' +
      '<span class="session__price">' + VELA.money(s.price) +
        '<span>' + esc(s.priceNote || '') + '</span></span>' +
      '<span class="avail ' + av.cls + '">' + esc(av.text) + '</span>' +
      (s.remaining > 0
        ? '<button class="btn btn--sm" type="button" data-book="' + esc(s.id) + '">Add to basket</button>'
        : '<button class="btn btn--sm" type="button" disabled>Sold out</button>') +
      '</div>';

    return '<article class="session' + (s.remaining <= 0 ? ' session--gone' : '') +
      '" data-session="' + esc(s.id) + '">' + when + body + side + '</article>';
  }

  function listHTML(sessions, opts) {
    if (!sessions.length) {
      return '<p class="empty">Nothing scheduled in this range. Try a wider date window, or ' +
        'see <a href="whats-on.html">the whole programme</a>.</p>';
    }
    return sessions.map(function (s) { return sessionHTML(s, opts); }).join('');
  }

  /* One delegated listener for the whole document. */
  var index = {};
  function remember(sessions) {
    sessions.forEach(function (s) { index[s.id] = s; });
  }

  doc.addEventListener('click', function (e) {
    var btn = e.target.closest ? e.target.closest('[data-book]') : null;
    if (!btn) return;
    var s = index[btn.getAttribute('data-book')];
    if (!s) return;
    var start = new Date(s.startsAt);
    VELA.basket.add({
      sku: s.id,
      title: s.title,
      meta: VELA.dayLabel(start) + ', ' + Sky.clock(start, VELA.site.timeZone),
      unit: s.price,
      qty: 1,
      kind: 'ticket'
    });
    var was = btn.textContent;
    btn.textContent = 'Added';
    btn.setAttribute('aria-live', 'polite');
    root.setTimeout(function () { btn.textContent = was; }, 1400);
  });

  root.VelaRender = {
    sessionHTML: sessionHTML,
    listHTML: listHTML,
    remember: remember,
    availability: availability,
    esc: esc
  };
})(window, document);

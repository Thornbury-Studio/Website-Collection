/* YORIMICHI — home page: the hero slider, the film dialog, departures and reviews. */
(function () {
  'use strict';
  var Y = window.YORI;

  /* ---- hero slider: moves only when asked (index, arrows, keys, swipe) ---- */
  var SLIDES = [
    { place: 'Kyoto', href: 'tour.html?t=kyoto-autumn', facts: '<strong>Kyoto in Autumn</strong> &middot; 7 days &middot; from S$4,860 with flights' },
    { place: 'Tokyo', href: 'tour.html?t=tokyo-dark', facts: '<strong>Tokyo After Dark</strong> &middot; 5 days &middot; from S$3,290 with flights' },
    { place: 'Miyajima', href: 'tour.html?t=inland-sea', facts: '<strong>Hiroshima &amp; the Inland Sea</strong> &middot; 7 days &middot; from S$4,690 with flights' },
    { place: 'Shirakawa-go', href: 'tour.html?t=snow-country', facts: '<strong>Snow Country</strong> &middot; 8 days &middot; from S$5,420 with flights' },
    { place: 'Mount Fuji', href: 'tour.html?t=fuji-lakes', facts: '<strong>Fuji &amp; the Five Lakes</strong> &middot; 6 days &middot; from S$3,980 with flights' },
  ];
  var stage = document.getElementById('heroStage');
  if (stage) {
    var slides = stage.querySelectorAll('.slide');
    var tabs = stage.querySelectorAll('.hero__index button');
    var place = document.getElementById('heroPlace');
    var cta = document.getElementById('heroCta');
    var facts = document.getElementById('heroFacts');
    var cur = 0;

    function go(n) {
      cur = (n + SLIDES.length) % SLIDES.length;
      slides.forEach(function (s, i) { s.setAttribute('aria-hidden', String(i !== cur)); });
      tabs.forEach(function (t, i) { t.setAttribute('aria-current', String(i === cur)); });
      place.textContent = SLIDES[cur].place;
      cta.setAttribute('href', SLIDES[cur].href);
      facts.innerHTML = SLIDES[cur].facts;
      // the next slide's image starts loading the moment this one shows
      var nextImg = slides[(cur + 1) % SLIDES.length].querySelector('img');
      if (nextImg) nextImg.loading = 'eager';
    }
    tabs.forEach(function (t) {
      t.addEventListener('click', function () { go(+t.getAttribute('data-go')); });
    });
    document.getElementById('heroPrev').addEventListener('click', function () { go(cur - 1); });
    document.getElementById('heroNext').addEventListener('click', function () { go(cur + 1); });
    document.addEventListener('keydown', function (e) {
      if (document.querySelector('dialog[open]')) return;
      if (e.key === 'ArrowRight') go(cur + 1);
      if (e.key === 'ArrowLeft') go(cur - 1);
    });
    var x0 = null;
    stage.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 48) go(dx < 0 ? cur + 1 : cur - 1);
      x0 = null;
    }, { passive: true });
  }

  /* ---- film dialog with two chapters ---- */
  var CHAPTERS = [
    { src: 'video/film-fushimi.mp4', poster: 'img/film-fushimi-poster.webp' },
    { src: 'video/film-fuji.mp4', poster: 'img/film-fuji-poster.webp' },
  ];
  var modal = document.getElementById('filmModal');
  var video = document.getElementById('filmVideo');
  if (modal && video && typeof modal.showModal === 'function') {
    var chips = modal.querySelectorAll('.chip');
    function load(n, play) {
      chips.forEach(function (c, i) { c.setAttribute('aria-pressed', String(i === n)); });
      video.pause();
      video.poster = CHAPTERS[n].poster;
      video.querySelector('source').src = CHAPTERS[n].src;
      video.load();
      if (play) {
        var p = video.play();
        if (p && p.catch) p.catch(function () { /* autoplay refused: the controls are there */ });
      }
    }
    function open(n) {
      modal.showModal();
      document.body.classList.add('is-locked');
      load(n, true);
    }
    function close() {
      video.pause();
      modal.close();
    }
    document.querySelectorAll('[data-chapter]').forEach(function (btn) {
      if (btn.classList.contains('chip')) {
        btn.addEventListener('click', function () { load(+btn.getAttribute('data-chapter'), true); });
      } else {
        btn.addEventListener('click', function () { open(+btn.getAttribute('data-chapter')); });
      }
    });
    document.getElementById('filmClose').addEventListener('click', close);
    modal.addEventListener('click', function (e) { if (e.target === modal) close(); });
    modal.addEventListener('close', function () {
      video.pause();
      document.body.classList.remove('is-locked');
    });
    // chapter one ends, chapter two follows
    video.addEventListener('ended', function () {
      var n = 0;
      chips.forEach(function (c, i) { if (c.getAttribute('aria-pressed') === 'true') n = i; });
      if (n < CHAPTERS.length - 1) load(n + 1, true);
    });
  }

  /* ---- next departures ---- */
  var tbody = document.querySelector('#depTable tbody');
  if (tbody) {
    var all = [];
    (window.YORI_TOURS || []).forEach(function (t) {
      t.departures.forEach(function (d) { all.push({ t: t, date: d[0], price: d[1], seats: d[2], note: d[3] }); });
    });
    all.sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var upcoming = all.filter(function (d) { return Y.parseDate(d.date) >= today; });
    if (!upcoming.length) upcoming = all;
    function render(range) {
      var rows = upcoming.filter(function (d) {
        var dt = Y.parseDate(d.date);
        if (range === 'soon') return (dt - today) / 864e5 <= 90;
        if (range === '2027') return dt.getFullYear() === 2027;
        return true;
      });
      if (!rows.length && range === 'soon') rows = upcoming.slice(0, 6);
      tbody.innerHTML = rows.map(function (d) {
        return '<tr>' +
          '<td class="date">' + Y.fmtDate(d.date) + '<small>' + Y.fmtDay(d.date) + ' &middot; returns ' + Y.addDays(d.date, d.t.days - 1) + (d.note ? ' &middot; ' + Y.esc(d.note) : '') + '</small></td>' +
          '<td class="tname">' + Y.esc(d.t.name) + '<small>' + Y.esc(d.t.short) + '</small></td>' +
          '<td class="len">' + d.t.days + ' days</td>' +
          '<td class="price num">' + Y.money(d.price) + '<small>twin-share</small></td>' +
          '<td class="seatsc">' + Y.seatsHtml(d.seats) + '</td>' +
          '<td class="act"><a class="more" href="tour.html?t=' + d.t.slug + '&d=' + d.date + '">' + (d.seats ? 'Book' : 'Waitlist') + '</a></td>' +
        '</tr>';
      }).join('') || '<tr><td colspan="6" class="empty">No departures in that window.</td></tr>';
    }
    render('soon');
    document.querySelectorAll('#depChips .chip').forEach(function (c) {
      c.addEventListener('click', function () {
        document.querySelectorAll('#depChips .chip').forEach(function (o) { o.setAttribute('aria-pressed', 'false'); });
        c.setAttribute('aria-pressed', 'true');
        render(c.getAttribute('data-range'));
      });
    });
  }

  /* ---- reviews ---- */
  var grid = document.getElementById('reviewGrid');
  if (grid) {
    var star = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.8l2.8 6 6.6.7-4.9 4.5 1.4 6.5L12 17.2l-5.9 3.3 1.4-6.5L2.6 9.5l6.6-.7z"/></svg>';
    grid.innerHTML = (window.YORI_REVIEWS || []).map(function (r) {
      return '<article class="review reveal">' +
        '<div class="stars" aria-label="Five stars">' + star + star + star + star + star + '</div>' +
        '<blockquote>' + Y.esc(r[2]) + '</blockquote>' +
        '<cite><strong>' + Y.esc(r[0]) + '</strong>' + Y.esc(r[1]) + '</cite>' +
      '</article>';
    }).join('');
    grid.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('is-in'); });
  }
})();

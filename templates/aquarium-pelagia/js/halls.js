/* PELAGIA — the halls page: five hall sections and a gallery with a lightbox. */
(function () {
  'use strict';
  var P = window.PELAGIA;
  var $ = function (id) { return document.getElementById(id); };

  /* ---- hall sections ---- */
  var feedsFor = function (slug) {
    return P.schedule.filter(function (s) { return s[2] === slug; }).map(function (s) { return s[0] + ' ' + s[1] + (s[5] === 'late' ? ' (Fri & Sat)' : ''); });
  };
  $('hallSections').innerHTML = P.halls.map(function (h, i) {
    var media = h.video
      ? '<video autoplay muted loop playsinline preload="metadata" poster="' + h.poster + '" aria-label="' + P.esc(h.alt) + '"><source src="' + h.video + '" type="video/mp4"></video>'
      : '<img src="' + h.img + '" srcset="' + h.img + ' 1600w, ' + h.img2560 + ' 2560w" sizes="(max-width: 1100px) 100vw, 60vw" alt="' + P.esc(h.alt) + '" width="1600" height="1067" loading="lazy">';
    return '<section class="hallsec' + (i % 2 ? ' hallsec--flip' : '') + '" id="' + h.slug + '" aria-labelledby="h-' + h.slug + '">' +
      '<div class="hallsec__media reveal"><span class="hall__o">' + P.icons[h.icon] + '</span>' + media + '</div>' +
      '<div class="hallsec__body reveal">' +
        '<span class="kicker">Hall ' + (i + 1) + ' of 5 &middot; ' + P.esc(h.tag) + '</span>' +
        '<h2 class="h2" id="h-' + h.slug + '">' + P.esc(h.name) + '</h2>' +
        '<p class="lede">' + P.esc(h.blurb) + '</p>' +
        '<ul class="facts">' + h.facts.map(function (f) { return '<li>' + P.esc(f) + '</li>'; }).join('') + '</ul>' +
        '<p class="muted" style="font-size:14px"><strong style="color:var(--text)">On the timetable:</strong> ' + feedsFor(h.slug).map(P.esc).join(' · ') + '</p>' +
        '<div><a class="more" href="tickets.html">Book a slot ' + P.icons.arrow + '</a></div>' +
      '</div>' +
    '</section>';
  }).join('');
  P.watchClips();
  // the sections were rendered after the observer ran: reveal them as they arrive
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) { entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } }); }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    $('hallSections').querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
  } else { $('hallSections').querySelectorAll('.reveal').forEach(function (el) { el.classList.add('is-in'); }); }

  /* ---- gallery ---- */
  var all = P.gallery, shown = all.slice();
  var chips = $('galChips');
  P.halls.forEach(function (h) {
    var b = document.createElement('button'); b.className = 'chip'; b.type = 'button'; b.setAttribute('data-hall', h.slug); b.setAttribute('aria-pressed', 'false'); b.textContent = h.name; chips.appendChild(b);
  });
  function render(hall) {
    shown = hall ? all.filter(function (g) { return g[2] === hall; }) : all.slice();
    $('galGrid').innerHTML = shown.map(function (g, i) {
      return '<figure><button type="button" data-i="' + i + '" aria-label="Open ' + P.esc(g[3]) + '"><img src="' + g[0] + '" alt="' + P.esc(g[1] + ' — ' + g[3]) + '" width="1600" height="1067" loading="lazy"></button>' +
        '<figcaption><strong>' + P.esc(g[1]) + '</strong>' + P.esc(g[3]) + '</figcaption></figure>';
    }).join('');
    $('galCount').innerHTML = '<strong>' + shown.length + ' photograph' + (shown.length === 1 ? '' : 's') + '</strong>' + (hall ? ' from ' + P.esc(P.hall(hall).name) : ' from the five halls') + '.';
  }
  render('');
  chips.addEventListener('click', function (e) {
    var c = e.target.closest('.chip'); if (!c) return;
    chips.querySelectorAll('.chip').forEach(function (o) { o.setAttribute('aria-pressed', 'false'); });
    c.setAttribute('aria-pressed', 'true');
    render(c.getAttribute('data-hall'));
  });

  var lb = $('lightbox');
  if (!lb || typeof lb.showModal !== 'function') return;
  var cur = 0;
  function show(i) {
    cur = (i + shown.length) % shown.length;
    var g = shown[cur];
    $('lbImg').src = g[0]; $('lbImg').alt = g[1] + ' — ' + g[3];
    $('lbCap').innerHTML = '<strong>' + P.esc(g[1]) + '</strong> &middot; ' + P.esc(g[3]) + ' &middot; ' + (cur + 1) + ' / ' + shown.length;
  }
  $('galGrid').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-i]'); if (!b) return;
    show(+b.getAttribute('data-i')); lb.showModal(); document.body.classList.add('is-locked');
  });
  $('lbPrev').addEventListener('click', function () { show(cur - 1); });
  $('lbNext').addEventListener('click', function () { show(cur + 1); });
  $('lbClose').addEventListener('click', function () { lb.close(); });
  lb.addEventListener('click', function (e) { if (e.target === lb) lb.close(); });
  lb.addEventListener('close', function () { document.body.classList.remove('is-locked'); });
  document.addEventListener('keydown', function (e) {
    if (!lb.open) return;
    if (e.key === 'ArrowRight') show(cur + 1);
    if (e.key === 'ArrowLeft') show(cur - 1);
  });
})();

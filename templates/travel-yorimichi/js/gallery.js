/* YORIMICHI — gallery: region filter and a lightbox. */
(function () {
  'use strict';
  var Y = window.YORI;
  var all = window.YORI_GALLERY || [];
  var grid = document.getElementById('ggrid');
  var count = document.getElementById('gcount');
  if (!grid) return;
  var shown = all.slice();

  function render(region) {
    shown = region ? all.filter(function (g) { return g[2] === region; }) : all.slice();
    grid.innerHTML = shown.map(function (g, i) {
      return '<figure><button type="button" data-i="' + i + '" aria-label="Open ' + Y.esc(g[1]) + '">' +
        '<img src="' + g[0] + '" alt="' + Y.esc(g[1] + ' — ' + g[3]) + '" width="1600" height="1067" loading="lazy">' +
        '</button><figcaption><strong>' + Y.esc(g[1]) + '</strong>' + Y.esc(g[3]) + '</figcaption></figure>';
    }).join('');
    count.innerHTML = '<strong>' + shown.length + ' photograph' + (shown.length === 1 ? '' : 's') + '</strong>' + (region ? ' in ' + region.charAt(0).toUpperCase() + region.slice(1) : '') + '.';
  }
  render('');

  document.querySelectorAll('#gfilters .chip').forEach(function (c) {
    c.addEventListener('click', function () {
      document.querySelectorAll('#gfilters .chip').forEach(function (o) { o.setAttribute('aria-pressed', 'false'); });
      c.setAttribute('aria-pressed', 'true');
      render(c.getAttribute('data-region'));
    });
  });

  /* lightbox */
  var lb = document.getElementById('lightbox');
  if (!lb || typeof lb.showModal !== 'function') return;
  var img = document.getElementById('lbImg');
  var cap = document.getElementById('lbCap');
  var cur = 0;
  function show(i) {
    cur = (i + shown.length) % shown.length;
    var g = shown[cur];
    img.src = g[0];
    img.alt = g[1] + ' — ' + g[3];
    cap.innerHTML = '<strong>' + Y.esc(g[1]) + '</strong> &middot; ' + Y.esc(g[3]) + ' &middot; ' + (cur + 1) + ' / ' + shown.length;
  }
  grid.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-i]');
    if (!b) return;
    show(+b.getAttribute('data-i'));
    lb.showModal();
    document.body.classList.add('is-locked');
  });
  document.getElementById('lbPrev').addEventListener('click', function () { show(cur - 1); });
  document.getElementById('lbNext').addEventListener('click', function () { show(cur + 1); });
  document.getElementById('lbClose').addEventListener('click', function () { lb.close(); });
  lb.addEventListener('click', function (e) { if (e.target === lb) lb.close(); });
  lb.addEventListener('close', function () { document.body.classList.remove('is-locked'); });
  document.addEventListener('keydown', function (e) {
    if (!lb.open) return;
    if (e.key === 'ArrowRight') show(cur + 1);
    if (e.key === 'ArrowLeft') show(cur - 1);
  });
})();

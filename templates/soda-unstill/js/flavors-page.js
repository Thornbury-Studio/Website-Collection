/* UNSTILL — the flavours page: one full-bleed colour takeover band per can,
   written from the catalogue. */
(function (root, doc) {
  'use strict';

  var U = root.UNSTILL;
  if (!U) return;

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function boot() {
    var host = doc.getElementById('flavorBands');
    if (!host) return;
    host.innerHTML = U.flavors.map(function (f, i) {
      var per = U.perCan(f);
      return '<section class="fband fband--' + f.id + '" aria-labelledby="fb-' + f.id + '">' +
        '<div class="wrap"><div class="fband__grid' + (i % 2 ? ' fband__grid--flip' : '') + '">' +
        '<div class="fband__can ' + (i % 2 ? 'tilt-r' : 'tilt-l') + '">' +
        '<img src="img/can-' + f.id + '.webp" width="717" height="1128" loading="lazy" ' +
        'decoding="async" alt="The ' + esc(f.name) + ' can: ' + esc(f.strap.toLowerCase()) + '.">' +
        '</div>' +
        '<div>' +
        '<p class="label"><span class="sticker sticker--bone tilt-r">' + esc(f.strap) + '</span></p>' +
        '<h2 id="fb-' + f.id + '">' + esc(f.name) + '</h2>' +
        '<p class="lede">' + esc(f.tagline) + '</p>' +
        '<p>' + esc(f.story) + '</p>' +
        '<div class="hero__stickers">' +
        '<span class="sticker sticker--bone tilt-l">' + per.kcal + ' kcal a can</span>' +
        '<span class="sticker sticker--bone tilt-r">Chaos ' + f.chaos + '/5</span>' +
        '</div>' +
        '<p class="btn-row">' +
        '<a class="btn btn--ink" href="flavor.html?id=' + f.id + '">Everything about it</a>' +
        '<a class="btn btn--ghost" href="packs.html">Crate it</a>' +
        '</p></div></div></div></section>';
    }).join('');
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window, document);

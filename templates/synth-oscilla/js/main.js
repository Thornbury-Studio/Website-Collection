/* OSCILLA — home page */
(function (O) {
  'use strict';
  var U = O.ui;

  var grid = U.$('#rangeGrid');
  if (grid) grid.innerHTML = O.instruments().map(function (it) {
    return '<article class="pcard reveal">' +
        '<a class="pcard__media" href="instrument.html?i=' + U.esc(it.id) + '">' +
          '<img src="img/' + U.esc(it.img) + '" width="1200" height="900" loading="lazy" decoding="async" alt="' + U.esc(it.alt) + '">' +
          '<span class="pcard__code">' + U.esc(it.code) + '</span>' +
        '</a>' +
        '<div class="pcard__body">' +
          '<div class="pcard__head">' +
            '<h3 class="pcard__name">' + U.esc(it.name) + '</h3>' +
            '<span class="pcard__role">' + U.esc(it.role) + '</span>' +
            '<span class="pcard__price u-num">' + O.money(it.price) + '</span>' +
          '</div>' +
          '<p class="pcard__line">' + U.esc(it.line) + '</p>' +
          '<div class="pcard__foot">' +
            '<a class="linkline" href="instrument.html?i=' + U.esc(it.id) + '">Hear it</a>' +
            '<button class="add push" type="button" data-add="' + U.esc(it.id) + '">Add</button>' +
          '</div>' +
        '</div>' +
      '</article>';
  }).join('');

  var off = U.$('#bundleOff'), bp = U.$('#bundlePrice'), bf = U.$('#bundleFull');
  if (off) off.textContent = Math.round(O.bundleOff * 100) + '%';
  if (bp) bp.textContent = O.money(O.bundlePrice());
  if (bf) bf.textContent = O.money(O.bundleFull());

  U.init();
})(window.OSCILLA);

/* VELA — the dome show list, written from the same catalogue the programme
   books against so a show cannot be described here and sold as something else. */
(function (root, doc) {
  'use strict';

  var VELA = root.VELA, R = root.VelaRender;
  if (!VELA || !R) return;

  function boot() {
    var host = doc.getElementById('showList');
    if (!host) return;
    host.innerHTML = '<h3>In rotation</h3>' + VELA.shows.map(function (s) {
      return '<p><b>' + R.esc(s.title) + '</b> &middot; <span class="num u-mut">' +
        s.minutes + ' min &middot; ages ' + R.esc(s.age) + '</span><br>' +
        R.esc(s.blurb) + '</p>';
    }).join('');
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window, document);

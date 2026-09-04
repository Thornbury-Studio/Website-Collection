/* ============================================================================
   TEMPORARY — DEVELOPMENT ONLY. DELETE BEFORE LAUNCH.

   Replaces the coordinate readout in the bar with a dropdown that swaps the
   background-transition direction live, without a reload, so the directions in
   js/bg.js can be compared by clicking rather than by description.

   To remove: delete this file and the four
       <script defer src="js/dev-bg-switcher.js"></script>
   tags (index / work / studio / contact). Nothing else refers to it. The bar
   markup is untouched — the readout is restored by simply not loading this.

   It is inert unless the dev flag is on, which means one of:
     · a local hostname (localhost, 127.0.0.1, *.local, file://)
     · ?dev=1 anywhere in the URL — an explicit opt-in that appears in no link
       on the site, and is remembered for that tab only
   A normal visit to the deployed site never builds any of this.
   ============================================================================ */
(function (global) {
  'use strict';

  function devFlag() {
    var h = location.hostname;
    var local = h === 'localhost' || h === '127.0.0.1' || h === '[::1]' || h === '' || /\.local$/.test(h);
    var asked = /(?:^|[?&])dev=1(?:&|$)/.test(location.search);
    var kept = false;
    try {
      if (asked) sessionStorage.setItem('tb-dev', '1');
      kept = sessionStorage.getItem('tb-dev') === '1';
    } catch (e) { /* storage blocked: the query string still works for this load */ }
    return local || asked || kept;
  }

  function build() {
    var slot = document.querySelector('.bar-side');
    var bg = global.TBBg;
    if (!slot || !bg) return;

    slot.classList.add('devbg');
    slot.textContent = '';

    var tag = document.createElement('span');
    tag.className = 'devbg-tag';
    tag.textContent = 'DEV';

    var sel = document.createElement('select');
    sel.className = 'devbg-sel';
    sel.id = 'devbg';
    sel.setAttribute('aria-label', 'Temporary development control: background transition direction');

    /* Every option carries its own measured cost, in the dropdown itself and in
       the readout beside it, so no direction can be judged without its price. */
    var modes = bg.modes();
    var info = {};
    modes.forEach(function (m) {
      info[m.id] = m;
      var o = document.createElement('option');
      o.value = m.id;
      o.textContent = m.label + '  —  ' + String(m.cost || '').split(' · ')[0];
      sel.appendChild(o);
    });

    var price = document.createElement('span');
    price.className = 'devbg-cost';
    var note = document.createElement('span');
    note.className = 'devbg-note';

    function show(id) {
      var m = info[id] || {};
      price.textContent = m.cost || '';
      note.textContent = m.note || '';
      sel.title = 'TEMPORARY dev control — not for production.\n' +
        (m.label || '') + '\nCost: ' + (m.cost || '') + '\n' + (m.note || '');
    }
    sel.value = bg.mode();
    show(sel.value);

    sel.addEventListener('change', function () {
      bg.setMode(sel.value);
      show(sel.value);
      slot.classList.remove('is-hit');
      void slot.offsetWidth;
      slot.classList.add('is-hit');
    });

    addEventListener('tb-bg-mode', function (e) {
      if (sel.value !== e.detail) {
        sel.value = e.detail;
        show(e.detail);
      }
    });

    slot.appendChild(tag);
    slot.appendChild(sel);
    slot.appendChild(price);
    slot.appendChild(note);
    document.documentElement.classList.add('devbg-on');
  }

  if (!devFlag()) return;
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', build);
  else build();
})(window);

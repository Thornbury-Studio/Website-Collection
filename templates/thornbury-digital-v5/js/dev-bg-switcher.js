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

    var modes = bg.modes();
    var notes = {};
    modes.forEach(function (m) {
      notes[m.id] = m.note;
      var o = document.createElement('option');
      o.value = m.id;
      o.textContent = m.label;
      sel.appendChild(o);
    });
    sel.value = bg.mode();
    sel.title = 'TEMPORARY dev control — not for production.\n' + notes[sel.value];

    var note = document.createElement('span');
    note.className = 'devbg-note';
    note.textContent = notes[sel.value] || '';

    sel.addEventListener('change', function () {
      bg.setMode(sel.value);
      note.textContent = notes[sel.value] || '';
      sel.title = 'TEMPORARY dev control — not for production.\n' + notes[sel.value];
      slot.classList.remove('is-hit');
      void slot.offsetWidth;
      slot.classList.add('is-hit');
    });

    addEventListener('tb-bg-mode', function (e) {
      if (sel.value !== e.detail) {
        sel.value = e.detail;
        note.textContent = notes[e.detail] || '';
      }
    });

    slot.appendChild(tag);
    slot.appendChild(sel);
    slot.appendChild(note);
    document.documentElement.classList.add('devbg-on');
  }

  if (!devFlag()) return;
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', build);
  else build();
})(window);

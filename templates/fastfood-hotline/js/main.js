/* ============================================================================
   HOTLINE — home page
   ========================================================================== */
(function (H) {
  'use strict';

  var U = H.ui, $ = U.$;

  /* -- the short list ------------------------------------------------------ */

  function signature() {
    var grid = $('#sigGrid');
    if (!grid) return;
    var picks = ['b01', 's04', 'b02', 's06', 'f07', 'b03'];
    grid.innerHTML = picks.map(function (id) {
      var it = H.byId(id);
      return it && it.img ? U.cardHTML(it) : '';
    }).join('');
  }

  /* -- box builder ---------------------------------------------------------
     Four steps, each a single choice. The output panel is the honest one: it
     only claims a saving once all four are chosen, and the number it shows is
     the same rule the checkout applies.                                     */

  var STEPS = [
    { key: 'main',   label: 'Pick a main',  hint: 'Bird or stack', ids: ['b01', 'b02', 'b03', 's04', 's05', 's06'] },
    { key: 'side',   label: 'Pick a side',  hint: 'One',           ids: ['f07', 'f08', 'f09'] },
    { key: 'dip',    label: 'Pick a dip',   hint: 'One',           ids: ['d10', 'd11', 'd12', 'd13'] },
    { key: 'drink',  label: 'Pick a drink', hint: 'One',           ids: ['k14', 'k15', 'k16', 'k17'] }
  ];

  var chosen = { main: null, side: null, dip: null, drink: null };

  function boxBuilder() {
    var picks = $('#boxPicks');
    if (!picks) return;

    picks.innerHTML = STEPS.map(function (st, i) {
      var chips = st.ids.map(function (id) {
        var it = H.byId(id);
        if (!it) return '';
        return '<button class="chip" type="button" role="switch" aria-pressed="false" ' +
               'data-step="' + st.key + '" data-id="' + it.id + '">' +
               U.esc(it.name) + '<span>' + H.money(it.price) + '</span></button>';
      }).join('');
      return '<div class="box__step" data-step-for="' + st.key + '" data-done="0">' +
          '<div class="box__steph">' +
            '<span class="box__stepn u-num">' + (i + 1) + '</span>' +
            '<span class="box__stept">' + st.label + '</span>' +
            '<span class="box__hint">' + st.hint + '</span>' +
          '</div>' +
          '<div class="chips">' + chips + '</div>' +
        '</div>';
    }).join('');

    picks.addEventListener('click', function (e) {
      var chip = e.target.closest('.chip');
      if (!chip) return;
      var step = chip.getAttribute('data-step'), id = chip.getAttribute('data-id');
      var already = chosen[step] === id;
      chosen[step] = already ? null : id;

      U.$$('.chip[data-step="' + step + '"]', picks).forEach(function (c) {
        c.setAttribute('aria-pressed', String(!already && c === chip));
      });
      var wrap = U.$('[data-step-for="' + step + '"]', picks);
      if (wrap) wrap.setAttribute('data-done', chosen[step] ? '1' : '0');
      paintBox();
    });

    paintBox();
  }

  function paintBox() {
    var lines = $('#boxLines'), totalEl = $('#boxTotal');
    var saveRow = $('#boxSave'), saveV = $('#boxSaveV'), addBtn = $('#boxAdd');
    if (!lines) return;

    var sum = 0, complete = true;
    lines.innerHTML = STEPS.map(function (st) {
      var id = chosen[st.key], it = id ? H.byId(id) : null;
      if (!it) { complete = false; return '<p class="box__line box__line--empty"><b>' + st.label + '</b><i></i>—</p>'; }
      sum += it.price;
      return '<p class="box__line"><b>' + U.esc(it.name) + '</b><i></i>' + H.money(it.price) + '</p>';
    }).join('');

    var save = complete ? H.boxDiscount : 0;
    if (saveRow) saveRow.hidden = !complete;
    if (saveV) saveV.textContent = '−' + H.money(save);
    if (totalEl) totalEl.textContent = H.money(Math.max(0, sum - save));
    if (addBtn) addBtn.disabled = !complete;
  }

  function boxAdd() {
    var btn = $('#boxAdd');
    if (!btn) return;
    btn.addEventListener('click', function () {
      STEPS.forEach(function (st) { if (chosen[st.key]) H.bag.add(chosen[st.key], 1); });
      var span = btn.querySelector('span');
      if (span) {
        var was = span.textContent;
        span.textContent = 'Box added';
        setTimeout(function () { span.textContent = was; }, 1400);
      }
    });
  }

  /* -- kitchen ticker ------------------------------------------------------
     True-loop marquee, all three rules from PATTERNS.md: no gap on the track,
     clone until half the track covers the container, and detach the animation
     before touching duration so the browser cannot recompute a played
     fraction against stale elapsed time.                                    */

  function trueLoopMarquee(track, secondsPerCopy) {
    if (!track || !track.firstElementChild) return;
    var master = track.firstElementChild.cloneNode(true);
    var timer;

    function build() {
      track.style.animationName = 'none';

      while (track.children.length > 1) track.removeChild(track.lastElementChild);
      var rowW = track.firstElementChild.getBoundingClientRect().width;
      var boxW = (track.parentElement || document.body).getBoundingClientRect().width;
      if (rowW < 1) { track.style.animationName = ''; return; }

      var perHalf = Math.max(1, Math.ceil(boxW / rowW));
      for (var i = 1; i < perHalf * 2; i++) {
        var copy = master.cloneNode(true);
        copy.setAttribute('aria-hidden', 'true');
        track.appendChild(copy);
      }
      track.style.animationDuration = (secondsPerCopy * perHalf) + 's';

      void track.offsetWidth;      // load-bearing: commits animation-name:none first
      track.style.animationName = '';
    }

    build();
    window.addEventListener('resize', function () {
      clearTimeout(timer);
      timer = setTimeout(build, 200);
    });
  }

  /* -- go ----------------------------------------------------------------- */

  signature();
  boxBuilder();
  boxAdd();
  U.initBag();
  U.initStatus();
  trueLoopMarquee(document.getElementById('ticker'), 30);
  U.reveals();
})(window.HOTLINE);

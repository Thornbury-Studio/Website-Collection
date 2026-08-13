/* NOCTURNE — one entry: the stage, the judging card (bars fill and marks
   count when the card enters view), the judges' notes, the detail figures,
   and the walk to the neighbouring entries. Deep-linkable via ?e=<id>. */
(function () {
  'use strict';
  var N = window.NOC;
  var ENTRIES = window.NOCTURNE_ENTRIES;
  var CLASSES = window.NOCTURNE_CLASSES;
  var $ = function (id) { return document.getElementById(id); };

  var param = new URLSearchParams(location.search).get('e');
  var idx = ENTRIES.findIndex(function (e) { return e.id === param; });
  if (idx === -1) idx = 0;
  var E = ENTRIES[idx];

  document.title = 'Entry ' + E.no + ' — ' + E.name + ' | NOCTURNE';
  var md = document.querySelector('meta[name="description"]');
  if (md) md.setAttribute('content', E.name + ' — ' + E.spec + '. Its plate, its judging card, and the notes the judges left in the margin.');

  /* stage */
  var img = $('stageImg');
  img.src = E.plate.src + '-1600.webp';
  img.srcset = N.srcset(E.plate.src);
  img.sizes = '100vw';
  img.width = E.plate.w; img.height = E.plate.h;
  img.alt = E.plate.alt;
  img.style.viewTransitionName = 'vt-' + E.id;
  if (E.plate.focus) img.style.objectPosition = E.plate.focus;
  N.bindLamp($('stage'));

  /* head */
  $('entryNo').textContent = E.no;
  $('entryName').textContent = E.name;
  $('entrySpec').textContent = E.spec;
  $('entryCls').innerHTML = 'Class · <b>' + CLASSES[E.cls] + '</b>';
  $('entryEra').innerHTML = 'Era · <b>' + E.era + '</b>';
  var pin = $('pinBtn');
  pin.setAttribute('data-pin', E.id);
  pin.setAttribute('aria-label', 'Pin a rosette to ' + E.name);
  N.bindPin(pin);

  /* judging card */
  var jc = $('jcard');
  if (!E.card) {
    jc.className = 'jcard sealed-card';
    jc.innerHTML =
      '<svg class="seal" viewBox="0 0 74 74" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true">' +
      '<circle cx="37" cy="37" r="30"/><circle cx="37" cy="37" r="23"/>' +
      '<path d="M37 21v32M25 30l24 14M49 30 25 44"/></svg>' +
      '<p>The card is sealed with the car. Marks are entered the moment the cover comes off — and not one minute before. Rosettes may be pinned on faith; the house respects faith.</p>';
  } else {
    var ROWS = [
      ['Coachwork', 'coachwork', 30],
      ['Interior', 'interior', 25],
      ['Presence after dark', 'dark', 25],
      ['Provenance', 'provenance', 20]
    ];
    var total = ROWS.reduce(function (s, r) { return s + E.card[r[1]]; }, 0);
    jc.innerHTML =
      '<div class="jcard-head"><h2>Judging card</h2><span class="season">Season MMXXVI · card ' + E.no + '</span></div>' +
      ROWS.map(function (r) {
        return '<div class="jrow" data-v="' + E.card[r[1]] + '" data-max="' + r[2] + '">' +
          '<span class="k">' + r[0] + '</span>' +
          '<span class="v" data-count>0</span><span class="of">/ ' + r[2] + '</span>' +
          '<span class="bar"><i></i></span>' +
          '</div>';
      }).join('') +
      '<div class="jtotal"><span class="k">Total</span><span class="v"><span data-total>0</span><small> / 100</small></span></div>';

    /* marks fill when the card is seen */
    var filled = false;
    function fill() {
      if (filled) return;
      filled = true;
      var rows = jc.querySelectorAll('.jrow');
      Array.prototype.forEach.call(rows, function (row) {
        var v = +row.getAttribute('data-v'), max = +row.getAttribute('data-max');
        row.querySelector('.bar i').style.width = (v / max * 100) + '%';
        countUp(row.querySelector('[data-count]'), v, 900);
      });
      countUp(jc.querySelector('[data-total]'), total, 1200);
    }
    function countUp(el, target, ms) {
      if (N.reduced) { el.textContent = target; return; }
      var t0 = null;
      function step(t) {
        if (!t0) t0 = t;
        var p = Math.min(1, (t - t0) / ms);
        p = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * p);
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en, io) {
        if (en[0].isIntersecting) { fill(); io.disconnect(); }
      }, { threshold: 0.35 }).observe(jc);
      setTimeout(fill, 2600); /* backgrounded-tab guard */
    } else fill();
  }

  $('citation').textContent = '“' + E.citation + '”';
  $('notes').innerHTML = E.notes.map(function (n) { return '<li>' + n + '</li>'; }).join('');

  /* detail figures */
  if (E.details.length) {
    $('figures').hidden = false;
    $('figGrid').innerHTML = E.details.map(function (d) {
      return '<figure class="efig' + (d.portrait ? ' tall' : '') + '">' +
        '<img src="' + d.src + '-1600.webp" srcset="' + N.srcset(d.src) + '"' +
        ' sizes="(max-width: 860px) 94vw, 46vw"' +
        ' width="' + d.w + '" height="' + d.h + '" alt="' + d.alt + '" loading="lazy" decoding="async">' +
        '<figcaption>' + d.cap + '</figcaption>' +
        '</figure>';
    }).join('');
  }

  /* the walk */
  var prev = ENTRIES[(idx - 1 + ENTRIES.length) % ENTRIES.length];
  var next = ENTRIES[(idx + 1) % ENTRIES.length];
  var wp = $('walkPrev'), wn = $('walkNext');
  wp.href = 'entry.html?e=' + prev.id;
  wp.querySelector('.nm').textContent = prev.no + ' · ' + prev.name;
  wn.href = 'entry.html?e=' + next.id;
  wn.querySelector('.nm').textContent = next.no + ' · ' + next.name;

  /* arrow keys walk the field too */
  document.addEventListener('keydown', function (e) {
    if (e.target.matches('input, select, textarea')) return;
    if (e.key === 'ArrowLeft') location.href = wp.href;
    if (e.key === 'ArrowRight') location.href = wn.href;
  });

  N.paintPins();
  N.rise();
})();

/* NOCTURNE — the field: plates, lamps, class filters, rosette pins, and the
   hero film. Filtering dims rather than removes — a closed class is still
   parked on the field, you just can't walk to it. */
(function () {
  'use strict';
  var N = window.NOC;
  var ENTRIES = window.NOCTURNE_ENTRIES;
  var CLASSES = window.NOCTURNE_CLASSES;

  /* ---------------- hero ---------------- */
  var hv = document.getElementById('heroVideo');
  (function () {
    var conn = navigator.connection || {};
    var want4k = window.innerWidth * (window.devicePixelRatio || 1) >= 2200 &&
                 !conn.saveData && (conn.downlink === undefined || conn.downlink > 4);
    if (want4k && hv.canPlayType('video/webm; codecs="vp9"')) {
      var s = document.createElement('source'); s.src = 'video/hero-4k.webm'; s.type = 'video/webm';
      hv.appendChild(s);
    }
    var m = document.createElement('source'); m.src = 'video/hero.mp4'; m.type = 'video/mp4';
    hv.appendChild(m);
    if (N.reduced) {
      hv.removeAttribute('autoplay');
      hv.hidden = true;
      document.querySelector('.hero .fallback').hidden = false;
      return;
    }
    hv.load();
    var p = hv.play(); if (p && p.catch) p.catch(function () {});
  })();
  if ('IntersectionObserver' in window && !N.reduced) {
    new IntersectionObserver(function (en) {
      if (en[0].isIntersecting) { var p = hv.play(); if (p && p.catch) p.catch(function () {}); }
      else hv.pause();
    }, { threshold: 0.05 }).observe(document.getElementById('top'));
  }

  /* season date: the next new moon would be lovely; the next first Saturday
     of a month is honest and computable */
  (function () {
    var d = new Date();
    d.setMonth(d.getMonth() + 1, 1);
    while (d.getDay() !== 6) d.setDate(d.getDate() + 1);
    var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    document.getElementById('heroDate').textContent = d.getDate() + ' ' + months[d.getMonth()];
  })();

  /* ---------------- the field ---------------- */
  /* Orientation follows the photograph: portrait plates get portrait boxes,
     landscape plates get wide ones. The sealed entry closes the field on a
     full-width band. */
  var SPANS = { continental: 's7', hemi: 's5', saloon: 's4 tall-m', landaulet: 's4 tall-m', chrome: 's4 tall-m',
                roadster: 's6 tall-m', aircooled: 's6', emerald: 's4 tall-m', sodium: 's4 tall-m', sealed: 's12' };

  var grid = document.getElementById('fieldGrid');
  grid.innerHTML = ENTRIES.map(function (e) {
    var span = SPANS[e.id];
    var sizes = span.indexOf('s12') === 0 ? '94vw'
      : (span.indexOf('s7') === 0 || span.indexOf('s8') === 0)
        ? '(max-width: 860px) 94vw, 58vw'
        : '(max-width: 860px) 94vw, 38vw';
    return '<article class="plate ' + SPANS[e.id] + '" data-entry="' + e.id + '" data-cls="' + e.cls + '">' +
      '<a class="plate-cover" href="entry.html?e=' + e.id + '" aria-label="Entry ' + e.no + ' — ' + e.name + '">' +
        '<img src="' + e.plate.src + '-1600.webp" srcset="' + N.srcset(e.plate.src) + '" sizes="' + sizes + '"' +
        ' width="' + e.plate.w + '" height="' + e.plate.h + '" alt="' + e.plate.alt + '" loading="lazy" decoding="async"' +
        ' style="view-transition-name: vt-' + e.id + ';">' +
        '<span class="lamp" aria-hidden="true"></span>' +
        '<span class="plate-tag">' +
          '<span class="plate-no">' + e.no + '</span>' +
          '<span class="plate-name">' + e.name + '</span>' +
          '<span class="plate-cls">' + CLASSES[e.cls] + '</span>' +
        '</span>' +
      '</a>' +
      '<button class="pin" type="button" data-pin="' + e.id + '" aria-pressed="false" aria-label="Pin a rosette to ' + e.name + '">' +
        N.rosette() +
      '</button>' +
      '</article>';
  }).join('');

  /* anchors fill the plate */
  Array.prototype.forEach.call(grid.querySelectorAll('.plate-cover'), function (a) {
    a.style.position = 'absolute';
    a.style.inset = '0';
  });
  Array.prototype.forEach.call(grid.querySelectorAll('.plate'), function (p) {
    N.bindLamp(p);
    var img = p.querySelector('img');
    img.style.position = 'absolute';
    img.style.inset = '0';
    var fe = ENTRIES.filter(function (x) { return x.id === p.getAttribute('data-entry'); })[0];
    if (fe && fe.plate.focus) img.style.objectPosition = fe.plate.focus;
  });
  Array.prototype.forEach.call(grid.querySelectorAll('[data-pin]'), N.bindPin);

  /* ---------------- class rail ---------------- */
  var counts = {};
  ENTRIES.forEach(function (e) { counts[e.cls] = (counts[e.cls] || 0) + 1; });
  var rail = document.getElementById('classRail');
  var order = ['all', 'touring', 'formal', 'chrome', 'sport', 'sealed'];
  rail.innerHTML = order.map(function (c) {
    var label = c === 'all' ? 'The whole field' : CLASSES[c];
    var n = c === 'all' ? ENTRIES.length : (counts[c] || 0);
    return '<button class="class-chip" type="button" data-cls="' + c + '" aria-pressed="' + (c === 'all') + '">' +
      label + '<span class="class-count">' + n + '</span></button>';
  }).join('');

  var active = 'all';
  Array.prototype.forEach.call(rail.children, function (chip) {
    chip.addEventListener('click', function () {
      active = chip.getAttribute('data-cls');
      Array.prototype.forEach.call(rail.children, function (c) {
        c.setAttribute('aria-pressed', String(c === chip));
      });
      Array.prototype.forEach.call(grid.children, function (plate) {
        var dim = active !== 'all' && plate.getAttribute('data-cls') !== active;
        plate.classList.toggle('dimmed', dim);
        var cover = plate.querySelector('.plate-cover');
        if (dim) cover.setAttribute('tabindex', '-1');
        else cover.removeAttribute('tabindex');
      });
    });
  });

  N.paintPins();
  N.rise();
})();

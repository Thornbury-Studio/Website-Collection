/* ANORAK° — one file, no dependencies, everything guarded on presence so the
   same script can sit under all four pages.

   Four things happen here:
     1. the header (drawer, bag panel)
     2. reveals — a wipe up, once, never re-run
     3. the conditions dial, which is the site's one authored moment
     4. the numbers, which are computed from cloth data rather than typed, so
        a spec table and a fabric page cannot drift apart
*/
(function () {
  'use strict';

  var root = document.documentElement;
  var animates = root.classList.contains('js-anim');

  /* -- 1. header ------------------------------------------------------- */

  function toggler(btn, panel) {
    if (!btn || !panel) return null;
    function set(open) {
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      panel.setAttribute('data-open', open ? 'true' : 'false');
    }
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      set(btn.getAttribute('aria-expanded') !== 'true');
    });
    return set;
  }

  var closeBag = toggler(document.getElementById('bagBtn'), document.getElementById('bagPanel'));
  var closeNav = toggler(document.getElementById('burger'), document.getElementById('drawer'));

  document.addEventListener('click', function (e) {
    if (closeBag && !e.target.closest('.bagwrap')) closeBag(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (closeBag) closeBag(false);
    if (closeNav) closeNav(false);
  });

  var drawer = document.getElementById('drawer');
  if (drawer) {
    drawer.addEventListener('click', function (e) {
      if (e.target.tagName === 'A' && closeNav) closeNav(false);
    });
  }

  /* -- 2. reveals ------------------------------------------------------ */

  /* Deliberately NOT IntersectionObserver. The hidden state of a reveal is a
     `clip-path: inset(0 0 100% 0)`, and a clipped element has an intersection
     rectangle of zero area — so the observer reports isIntersecting: false no
     matter where the element sits on screen, and nothing ever appears. A
     rect-versus-viewport check is immune to that, costs one rAF per scroll,
     and drops each element from the list the moment it has arrived. */
  var pending = [].slice.call(document.querySelectorAll('.reveal'));

  if (!animates) {
    for (var i = 0; i < pending.length; i++) pending[i].classList.add('in');
    pending.length = 0;
  } else {
    var queued = false;

    function sweep() {
      queued = false;
      var line = (window.innerHeight || 0) * 0.92;
      for (var k = pending.length - 1; k >= 0; k--) {
        var el = pending[k];
        var box = el.getBoundingClientRect();
        if (box.top < line && box.bottom > 0) {
          el.classList.add('in');
          pending.splice(k, 1);
        }
      }
      if (!pending.length) {
        window.removeEventListener('scroll', request);
        window.removeEventListener('resize', request);
      }
    }

    function request() {
      if (queued) return;
      queued = true;
      window.requestAnimationFrame(sweep);
    }

    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request);
    sweep();
    /* A hash landing scrolls after layout, and webfonts move everything again. */
    window.addEventListener('load', request);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(request);
  }

  /* -- 3. the conditions dial ------------------------------------------ */

  var PIECES = {
    crosswind:  { name: 'Crosswind',  role: 'Shell', price: 215, href: 'crosswind.html' },
    hardFrost:  { name: 'Hard Frost', role: 'Top',   price: 95,  href: 'range.html#hard-frost' },
    halfLight:  { name: 'Half Light', role: 'Legs',  price: 135, href: 'range.html#half-light' },
    dewPoint:   { name: 'Dew Point',  role: 'Top',   price: 52,  href: 'range.html#dew-point' },
    drySpell:   { name: 'Dry Spell',  role: 'Legs',  price: 68,  href: 'range.html#dry-spell' },
    lowSun:     { name: 'Low Sun',    role: 'Head',  price: 38,  href: 'range.html#low-sun' }
  };

  /* Bands are closed at the top: the first whose `to` the temperature does not
     exceed wins. They are contiguous by construction, so there is no gap and
     no overlap to get wrong later. */
  var BANDS = [
    { to: 1,  name: 'Hard frost',
      note: 'Three layers and a grudge. The tight is the one that matters; everything above it is a conversation.',
      kit: ['crosswind', 'hardFrost', 'halfLight'] },
    { to: 7,  name: 'Raw',
      note: 'The temperature British runners complain about most and dress for least. Long sleeve, long leg, nothing over the top of it.',
      kit: ['hardFrost', 'halfLight'] },
    { to: 13, name: 'The good bit',
      note: 'Long sleeve, bare legs. Get this one wrong in either direction and you will be fine again within four minutes.',
      kit: ['hardFrost', 'drySpell'] },
    { to: 19, name: 'Mild',
      note: 'Singlet weather, whatever the forecast says. Start slightly cold and you will be right within a mile.',
      kit: ['dewPoint', 'drySpell'] },
    { to: 25, name: 'Warm',
      note: 'A cap earns its place here. Shade on the eyes is worth roughly two degrees of air temperature.',
      kit: ['dewPoint', 'drySpell', 'lowSun'] },
    { to: 99, name: 'Too warm',
      note: 'Go earlier. There is no fabric on earth that fixes noon, and we would rather say so than sell you one.',
      kit: ['dewPoint', 'drySpell', 'lowSun'] }
  ];

  var slider = document.getElementById('temp');
  if (slider) {
    var plate    = document.getElementById('dialPlate');
    var tempOut  = document.getElementById('tempOut');
    var condName = document.getElementById('condName');
    var condNote = document.getElementById('condNote');
    var kitOut   = document.getElementById('kitOut');
    var lo = Number(slider.min), hi = Number(slider.max);
    var lastBand = null;

    function bandFor(t) {
      for (var b = 0; b < BANDS.length; b++) if (t <= BANDS[b].to) return BANDS[b];
      return BANDS[BANDS.length - 1];
    }

    function renderKit(band) {
      var html = '';
      for (var k = 0; k < band.kit.length; k++) {
        var p = PIECES[band.kit[k]];
        html += '<li><a href="' + p.href + '">' +
                '<span class="role">' + p.role + '</span>' +
                '<span class="piece">' + p.name + '</span>' +
                '<span class="price">£' + p.price + '</span></a></li>';
      }
      kitOut.innerHTML = html;
    }

    function update() {
      var t = Number(slider.value);
      /* The wipe runs cold-from-the-left: at the bottom of the scale the cold
         plate covers the frame, at the top it has gone entirely. */
      var cold = (hi - t) / (hi - lo);
      plate.style.setProperty('--w', (cold * 100).toFixed(2) + '%');
      tempOut.textContent = t;

      var band = bandFor(t);
      if (band === lastBand) return;
      lastBand = band;
      condName.textContent = band.name;
      condNote.textContent = band.note;
      renderKit(band);
    }

    slider.addEventListener('input', update);
    slider.addEventListener('change', update);
    update();
  }

  /* -- 4. computed numbers --------------------------------------------- */

  /* Every cloth figure on the spec pages is derived from three measured
     numbers — the cut area, the cloth weight per square metre, and the
     finished weight of the garment. The fabric weight and the share of the
     garment that is fabric are arithmetic, not copy, so they cannot disagree
     with the fabric page. */
  var cells = document.querySelectorAll('[data-area][data-gsm][data-g]');
  for (var c = 0; c < cells.length; c++) {
    var el = cells[c];
    var area = parseFloat(el.getAttribute('data-area'));
    var gsm  = parseFloat(el.getAttribute('data-gsm'));
    var g    = parseFloat(el.getAttribute('data-g'));
    if (!(area > 0 && gsm > 0 && g > 0)) continue;
    var cloth = area * gsm;
    el.textContent = Math.round(cloth) + ' g — ' + Math.round((cloth / g) * 100) + '% of the garment';
  }

  /* -- 5. the product page chooser -------------------------------------- */

  var pdp = document.getElementById('pdp');
  if (pdp) {
    var lineOut = document.getElementById('pdpLine');
    var reserve = document.getElementById('reserve');
    var base    = pdp.getAttribute('data-piece') || 'this piece';
    var price   = pdp.getAttribute('data-price') || '';

    function chosen(group) {
      var input = pdp.querySelector('input[name="' + group + '"]:checked');
      return input ? input.value : '';
    }

    function sync() {
      var size = chosen('size');
      var way  = chosen('way');
      lineOut.textContent = base + ' · ' + way + ' · size ' + size + ' · ' + price;
      if (reserve) {
        var subject = 'Reserve: ' + base + ', ' + way + ', size ' + size;
        var body = 'Please hold one ' + base + ' in ' + way + ', size ' + size + ' (' + price + ').'
                 + '\n\nName:\nDelivery address:\n';
        reserve.setAttribute('href',
          'mailto:kit@anorak.cc?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body));
      }
    }

    pdp.addEventListener('change', function (e) {
      if (e.target && e.target.type === 'radio') sync();
    });
    sync();
  }

})();

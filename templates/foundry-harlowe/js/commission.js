/* HARLOWE commission — the note names the bell.
   Everything on the spec sheet comes from HB.model; this file only formats
   and draws. If a number looks wrong, fix the model, never the label. */
(function () {
  'use strict';
  var U = window.HB;
  var fmt = U.model.fmt;

  var state = { note: 'D', octave: 4 };
  try {
    var saved = JSON.parse(localStorage.getItem('harlowe.spec.v1') || 'null');
    if (saved && saved.note) state = saved;
  } catch (e) { /* fresh visit */ }

  /* ---------- build the keybed ---------- */

  var keybed = document.getElementById('keybed');
  var keys = [];
  keybed.querySelectorAll('.octave-row').forEach(function (row) {
    var oct = parseInt(row.getAttribute('data-octave'), 10);
    row.getAttribute('data-notes').split(' ').forEach(function (n) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'key';
      b.setAttribute('aria-pressed', 'false');
      b.textContent = n + oct;
      b.__note = n; b.__oct = oct;
      b.addEventListener('click', function () {
        state = { note: n, octave: oct };
        try { localStorage.setItem('harlowe.spec.v1', JSON.stringify(state)); } catch (e) { /* private mode */ }
        paint();
        U.strike(U.model.freqOf(n, oct), { gain: 0.55 });
      });
      row.appendChild(b);
      keys.push(b);
    });
  });

  /* ---------- the sheet ---------- */

  var roleOf = function (f) {
    if (f < 180) return 'A great bell’s note';
    if (f < 330) return 'A tenor’s note';
    if (f < 620) return 'A treble’s note';
    return 'A chapel bell’s note';
  };

  function drawProfile(spec) {
    // width in the box follows the real mouth on a square-root scale so the
    // small end stays legible; the scale bar below is honest to the metre.
    var w = 70 + 150 * Math.sqrt(spec.d / 2.4);
    var h = w * 0.84;
    var mouthY = 228, topY = mouthY - h, ax = 150;
    function half(sign) {
      var s = function (v) { return ax + sign * v; };
      return 'M' + s(0.06 * w) + ',' + topY.toFixed(1) +
        ' L' + s(0.30 * w) + ',' + topY.toFixed(1) +
        ' C' + s(0.37 * w) + ',' + (topY + 0.10 * h).toFixed(1) + ' ' + s(0.375 * w) + ',' + (topY + 0.24 * h).toFixed(1) + ' ' + s(0.365 * w) + ',' + (topY + 0.40 * h).toFixed(1) +
        ' C' + s(0.355 * w) + ',' + (topY + 0.58 * h).toFixed(1) + ' ' + s(0.38 * w) + ',' + (topY + 0.72 * h).toFixed(1) + ' ' + s(0.46 * w) + ',' + (topY + 0.86 * h).toFixed(1) +
        ' C' + s(0.50 * w) + ',' + (topY + 0.93 * h).toFixed(1) + ' ' + s(0.50 * w) + ',' + (topY + 0.97 * h).toFixed(1) + ' ' + s(0.50 * w) + ',' + mouthY +
        ' L' + s(0.42 * w) + ',' + mouthY;
    }
    document.getElementById('pCurveR').setAttribute('d', half(1));
    document.getElementById('pCurveL').setAttribute('d', half(-1));
    var bar = document.getElementById('pScaleBar');
    bar.setAttribute('x1', (ax - 0.5 * w).toFixed(1));
    bar.setAttribute('x2', (ax + 0.5 * w).toFixed(1));
    document.getElementById('pScaleTxt').textContent = fmt.mm(spec.d) + ' across the mouth';
  }

  var chosenLine = document.getElementById('chosenLine');

  function paint() {
    var f = U.model.freqOf(state.note, state.octave);
    var spec = U.model.specOf(f);
    keys.forEach(function (k) {
      k.setAttribute('aria-pressed', (k.__note === state.note && k.__oct === state.octave) ? 'true' : 'false');
    });
    document.getElementById('specNote').textContent = state.note + state.octave;
    document.getElementById('specRole').textContent = roleOf(f);
    document.getElementById('oF').textContent = fmt.hz(f);
    document.getElementById('oNom').textContent = fmt.hz(spec.nominal) + ' · ' + fmt.hz(spec.hum);
    document.getElementById('oD').textContent = fmt.mm(spec.d);
    document.getElementById('oW').textContent = fmt.kg(spec.w);
    document.getElementById('oCwt').textContent = '≈ ' + fmt.cwt(spec.cwt);
    document.getElementById('oPrice').textContent = fmt.gbp(spec.priceLo) + ' – ' + fmt.gbp(spec.priceHi);
    document.getElementById('oWeeks').textContent = spec.weeks + ' weeks';
    chosenLine.textContent = state.note + state.octave + ' · ' + fmt.hz(f) + ' · ' +
      fmt.mm(spec.d) + ' · ' + fmt.kg(spec.w) + ' · ' +
      fmt.gbp(spec.priceLo) + ' – ' + fmt.gbp(spec.priceHi);
    drawProfile(spec);
  }
  paint();

  document.getElementById('hearBtn').addEventListener('click', function () {
    U.strike(U.model.freqOf(state.note, state.octave), { gain: 0.6 });
  });

  /* ---------- the day book ---------- */

  var form = document.getElementById('enqForm');
  var noted = document.getElementById('enqNoted');

  function bad(id, is) {
    document.getElementById(id).closest('.field').classList.toggle('bad', is);
    return is;
  }

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var name = document.getElementById('fName');
    var mail = document.getElementById('fMail');
    var msg = document.getElementById('fMsg');
    var anyBad =
      bad('fName', !name.value.trim());
    anyBad = bad('fMail', !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail.value.trim())) || anyBad;
    anyBad = bad('fMsg', !msg.value.trim()) || anyBad;
    if (anyBad) {
      var firstBad = form.querySelector('.field.bad input, .field.bad textarea');
      if (firstBad) firstBad.focus();
      return;
    }
    var n = 0;
    try {
      n = parseInt(localStorage.getItem('harlowe.orders.v1') || '0', 10) + 1;
      localStorage.setItem('harlowe.orders.v1', String(n));
    } catch (e) { n = 1; }
    var orderNo = 'HL-' + new Date().getFullYear() + '-' + String(240 + n);
    var first = name.value.trim().split(/\s+/)[0];
    noted.innerHTML = '';
    var strong = document.createElement('span');
    strong.className = 'order-no';
    strong.textContent = orderNo;
    noted.appendChild(document.createTextNode('Entered in the day book as '));
    noted.appendChild(strong);
    noted.appendChild(document.createTextNode('. Thank you, ' + first +
      ' — a founder will write to you within three working days. The kettle here is always on.'));
    noted.hidden = false;
    form.querySelectorAll('input, textarea, select, button[type="submit"]').forEach(function (el) { el.disabled = true; });
    U.strike(U.model.freqOf(state.note, state.octave), { gain: 0.45 });
    noted.scrollIntoView({ behavior: U.reduced ? 'auto' : 'smooth', block: 'nearest' });
  });
}());

/* GRATICULE — the brief estimator and the enquiry form.

   The estimator is real arithmetic, not a lookup table with three answers.
   It computes field days from a base mobilisation plus a per-hectare rate for
   the discipline, multiplies by the tolerance class and the access condition,
   adds the office days each deliverable actually costs, and prices the two
   halves at their own day rates. Every one of those terms is then printed
   back underneath the total, because a fee with no breakdown makes it
   impossible for a client to see which half is expensive — and it is nearly
   always the office half. */

(function (root, doc) {
  'use strict';

  /* baseDays: mobilisation, recon and control, before any detail is measured.
     perUnit: field days per hectare, or per 1000 m² GIA for building work. */
  var TYPES = {
    topographic: { label: 'Topographic survey',      base: 0.8, perUnit: 0.22, unit: 'ha',    office: 0.62 },
    building:    { label: 'Measured building survey', base: 1.0, perUnit: 0.95, unit: '1000 m² GIA', office: 1.15 },
    scanning:    { label: 'Laser scan record',        base: 0.8, perUnit: 0.70, unit: '1000 m² GIA', office: 0.90 },
    hydrographic:{ label: 'Bathymetric survey',       base: 1.6, perUnit: 0.16, unit: 'ha',    office: 0.70 },
    uav:         { label: 'UAV photogrammetry',       base: 0.7, perUnit: 0.05, unit: 'ha',    office: 0.85 },
    setting:     { label: 'Setting out & as-built',   base: 1.2, perUnit: 0.30, unit: 'ha',    office: 0.45 },
    monitoring:  { label: 'Structural monitoring',    base: 2.0, perUnit: 0.12, unit: 'ha',    office: 0.80 },
    utilities:   { label: 'Utility detection',        base: 0.9, perUnit: 0.55, unit: 'ha',    office: 0.75 }
  };

  var ACCURACY = {
    standard: { label: 'Standard, ±25 mm', k: 1.00 },
    enhanced: { label: 'Enhanced, ±10 mm', k: 1.35 },
    precise:  { label: 'Precise, ±3 mm',   k: 1.90 }
  };

  var ACCESS = {
    open:      { label: 'Open ground',            k: 1.00 },
    live:      { label: 'Live site or occupied',  k: 1.25 },
    tidal:     { label: 'Tidal or intertidal',    k: 1.50 },
    difficult: { label: 'Steep or rope access',   k: 1.60 }
  };

  /* Office days added by each deliverable on top of the discipline's own
     office ratio. */
  var EXTRAS = {
    dtm:   { label: 'Levelled DTM surface',   days: 0.5 },
    revit: { label: 'Revit model',            days: 2.0 },
    cloud: { label: 'Published point cloud',  days: 0.75 },
    pas:   { label: 'PAS 128 attribution',    days: 1.0 }
  };

  var FIELD_RATE = 780, OFFICE_RATE = 520;

  /* Quoting a survey to the pound implies a precision the estimate does not
     have. The two components round to £10 so they still visibly sum; only the
     headline band rounds to £50. */
  function money(n, step) {
    var s = step || 10;
    return '£' + (Math.round(n / s) * s).toLocaleString('en-GB');
  }

  function initEstimator() {
    var form = doc.getElementById('estForm');
    if (!form) return;

    var typeSel = doc.getElementById('estType');
    var extent  = doc.getElementById('estExtent');
    var unitLbl = doc.getElementById('estUnit');
    var accSel  = doc.getElementById('estAccuracy');
    var acsSel  = doc.getElementById('estAccess');
    var out     = doc.getElementById('estOut');
    var work    = doc.getElementById('estWork');

    function compute() {
      var t = TYPES[typeSel.value] || TYPES.topographic;
      var acc = ACCURACY[accSel.value] || ACCURACY.standard;
      var acs = ACCESS[acsSel.value] || ACCESS.open;
      var size = Math.max(0.1, Math.min(400, parseFloat(extent.value) || 1));

      unitLbl.textContent = t.unit;

      var rawField = (t.base + t.perUnit * size) * acc.k * acs.k;
      /* Field time is bought in half days — a crew does not mobilise for
         two tenths of one. */
      var fieldDays = Math.max(0.5, Math.ceil(rawField * 2) / 2);

      var extras = 0, extraNames = [];
      Object.keys(EXTRAS).forEach(function (k) {
        var box = doc.getElementById('extra-' + k);
        if (box && box.checked) { extras += EXTRAS[k].days; extraNames.push(EXTRAS[k].label); }
      });

      var officeDays = Math.max(0.5, Math.ceil((fieldDays * t.office + extras) * 2) / 2);
      var fee = fieldDays * FIELD_RATE + officeDays * OFFICE_RATE;
      var lo = fee * 0.88, hi = fee * 1.12;

      out.innerHTML =
        line('Discipline', t.label) +
        line('Extent', size.toLocaleString('en-GB') + ' ' + t.unit) +
        line('Field days', fieldDays.toFixed(1)) +
        line('Office days', officeDays.toFixed(1)) +
        line('Field, at £' + FIELD_RATE + '/day', money(fieldDays * FIELD_RATE)) +
        line('Office, at £' + OFFICE_RATE + '/day', money(officeDays * OFFICE_RATE)) +
        '<div class="est__total"><dt>Indicative fee</dt><dd>' +
          money(lo, 50) + '&ndash;' + money(hi, 50) + '</dd></div>';

      work.innerHTML =
        'How this is worked out: (' + t.base + ' base + ' + t.perUnit + ' × ' +
        size.toLocaleString('en-GB') + ' ' + t.unit + ') × ' + acc.k.toFixed(2) +
        ' tolerance × ' + acs.k.toFixed(2) + ' access = ' + fieldDays.toFixed(1) +
        ' field days. Office = ' + fieldDays.toFixed(1) + ' × ' + t.office +
        (extras ? ' + ' + extras.toFixed(2) + ' for ' + extraNames.join(', ').toLowerCase() : '') +
        ' = ' + officeDays.toFixed(1) + ' days. The band is ±' +
        '12% either side, which is the spread we actually deliver within.' +
        ' A written proposal replaces this with a fixed figure after a site visit.';
    }

    function line(k, v) { return '<div><dt>' + k + '</dt><dd>' + v + '</dd></div>'; }

    form.addEventListener('input', compute);
    form.addEventListener('change', compute);
    form.addEventListener('submit', function (e) { e.preventDefault(); });
    compute();
  }

  /* ---- enquiry form ------------------------------------------------------- */

  function initEnquiry() {
    var form = doc.getElementById('enquiry');
    if (!form) return;

    function fail(input, msg) {
      var field = input.closest('.field');
      field.classList.add('field--bad');
      input.setAttribute('aria-invalid', 'true');
      var err = field.querySelector('.field__err');
      if (err) err.textContent = msg;
    }

    function clear(input) {
      var field = input.closest('.field');
      field.classList.remove('field--bad');
      input.removeAttribute('aria-invalid');
      var err = field.querySelector('.field__err');
      if (err) err.textContent = '';
    }

    Array.prototype.forEach.call(form.elements, function (el) {
      if (el.tagName === 'BUTTON') return;
      el.addEventListener('input', function () { clear(el); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true, first = null;

      var name = doc.getElementById('f-name'),
          email = doc.getElementById('f-email'),
          msg = doc.getElementById('f-message');

      if (!name.value.trim()) { fail(name, 'We need a name to reply to.'); ok = false; first = first || name; }
      /* Deliberately permissive: an address that looks like an address. The
         only real test of an email is sending to it. */
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) {
        fail(email, 'That address does not look complete.'); ok = false; first = first || email;
      }
      if (msg.value.trim().length < 12) {
        fail(msg, 'A sentence about the site is enough to price it.'); ok = false; first = first || msg;
      }

      if (!ok) { first.focus(); return; }

      var ref = 'E-' + String(new Date().getFullYear()).slice(2) +
                String(Math.floor(1000 + Math.random() * 8999));
      var note = doc.getElementById('sent');
      note.innerHTML = '<b>Enquiry ' + ref + ' received.</b> Elin or Rhys will read this ' +
        'today and come back within one working day, usually with a question about access ' +
        'before a price.';
      note.hidden = false;
      form.reset();
      note.setAttribute('tabindex', '-1');
      note.focus();
    });
  }

  function start() { initEstimator(); initEnquiry(); }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', start);
  else start();

})(window, document);

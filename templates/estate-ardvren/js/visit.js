/* ARDVREN — book a viewing: the next viewing days, their start times, the form. */
(function () {
  'use strict';

  var A = window.ARDVREN;
  var form = document.getElementById('bookForm');
  if (!form || !A) return;

  var SLOTS = { 6: ['10.00', '12.00', '14.00'], 3: ['13.00', '15.00'] }; // Saturday, Wednesday
  var dateSel = document.getElementById('bkDate');
  var slots = document.getElementById('bkSlots');
  var slotErr = document.getElementById('bkSlotErr');

  function closed(d) {
    // 25 December to 3 January, every year.
    var m = d.getMonth(), day = d.getDate();
    return (m === 11 && day >= 25) || (m === 0 && day <= 3);
  }

  // The next eight viewing days, starting tomorrow.
  var days = [];
  var d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + 1);
  while (days.length < 8) {
    if (SLOTS[d.getDay()] && !closed(d)) days.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  days.forEach(function (day, i) {
    var o = document.createElement('option');
    o.value = A.iso(day);
    o.textContent = A.fmtDate(day) + (i === 0 ? ' — next' : '');
    dateSel.appendChild(o);
  });

  function renderSlots() {
    var day = days[dateSel.selectedIndex] || days[0];
    var list = SLOTS[day.getDay()];
    slots.innerHTML = list.map(function (t, i) {
      return '<label><input type="radio" name="slot" value="' + t + '"' + (i === 0 ? ' checked' : '') + '>' + t + '</label>';
    }).join('');
    slotErr.hidden = true;
  }
  dateSel.addEventListener('change', renderSlots);
  renderSlots();

  // Deep links from the schedule: visit.html?plot=17  /  ?plot=18&wait=1
  var plot = A.qs('plot');
  var interest = document.getElementById('bkInterest');
  var plotField = document.getElementById('bkPlot');
  var notes = document.getElementById('bkNotes');
  if (plot && /^\d+$/.test(plot)) {
    interest.value = 'specific';
    plotField.value = plot;
    if (A.qs('wait')) notes.value = 'Please tell me if plot ' + plot + ' comes back to the schedule.';
  }

  /* ---- submit ---- */
  var req = ['bkName', 'bkEmail', 'bkPhone'].map(function (id) { return document.getElementById(id); });
  function validate(input) {
    var v = input.value.trim(), ok;
    if (input.type === 'email') ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    else if (input.type === 'tel') ok = v.replace(/[^\d]/g, '').length >= 9;
    else ok = v.length > 1;
    input.closest('.field').classList.toggle('field--err', !ok);
    return ok;
  }
  req.forEach(function (i) {
    i.addEventListener('input', function () { if (i.closest('.field').classList.contains('field--err')) validate(i); });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var ok = true, first = null;
    req.forEach(function (i) { if (!validate(i)) { ok = false; first = first || i; } });
    var slot = form.querySelector('input[name="slot"]:checked');
    if (!slot) { slotErr.hidden = false; ok = false; }
    if (!ok) { (first || slots.querySelector('input')).focus(); return; }

    var day = days[dateSel.selectedIndex];
    var party = document.getElementById('bkParty').value;
    var INTEREST = {
      'not-sure': 'the three kinds of plot', woodland: 'the woodland plots', ridge: 'the ridge plots',
      lochside: 'the lochside plots', specific: 'plot ' + (plotField.value.trim() || '—')
    };
    document.getElementById('bkSentText').textContent =
      A.fmtDate(day) + ' at ' + slot.value + ', for ' + party + ', to see ' + INTEREST[interest.value] + '.';
    document.getElementById('bkSentList').innerHTML =
      '<li><b>Name</b><span>' + A.esc(req[0].value.trim()) + '</span></li>' +
      '<li><b>Confirmation to</b><span>' + A.esc(req[1].value.trim()) + '</span></li>' +
      '<li><b>On the day</b><span>' + A.esc(req[2].value.trim()) + '</span></li>';

    form.querySelectorAll('.config__form > .form-grid, .config__form > fieldset').forEach(function (el) { el.hidden = true; });
    document.getElementById('bkSubmit').parentElement.hidden = true;
    var sent = document.getElementById('bkSent');
    sent.hidden = false;
    sent.setAttribute('tabindex', '-1');
    sent.focus();
  });
})();

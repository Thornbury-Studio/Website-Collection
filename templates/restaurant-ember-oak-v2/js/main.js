/* Ember & Oak
   Everything on the site reads without this file. It adds three things:
   the open-now line in the header, today's row in the hours table, and
   the table form that writes an email in the visitor's own mail app. */
(function () {
  'use strict';

  var EMAIL = 'tables@emberandoak.example';
  var TZ = 'America/New_York';

  // Minutes from midnight, first seating to last order. Index = getDay().
  var HOURS = [
    [750, 1200],  // Sunday    12:30 to 8:00
    null,         // Monday
    null,         // Tuesday
    [1020, 1290], // Wednesday 5:00 to 9:30
    [1020, 1290], // Thursday
    [1020, 1350], // Friday    5:00 to 10:30
    [1020, 1350]  // Saturday
  ];
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  function clock(mins) {
    var h = Math.floor(mins / 60);
    var m = mins % 60;
    var h12 = h % 12 === 0 ? 12 : h % 12;
    return h12 + (m ? ':' + (m < 10 ? '0' + m : m) : '');
  }

  // The restaurant's own wall clock, whatever timezone the visitor is in.
  function nowInHudson() {
    try {
      var parts = new Intl.DateTimeFormat('en-US', {
        timeZone: TZ, weekday: 'long', hour: 'numeric', minute: 'numeric', hour12: false
      }).formatToParts(new Date());
      var got = {};
      parts.forEach(function (p) { got[p.type] = p.value; });
      var day = DAYS.indexOf(got.weekday);
      if (day < 0) return null;
      return { day: day, mins: (parseInt(got.hour, 10) % 24) * 60 + parseInt(got.minute, 10) };
    } catch (e) {
      return null;
    }
  }

  function nextOpen(fromDay) {
    for (var i = 1; i <= 7; i++) {
      var d = (fromDay + i) % 7;
      if (HOURS[d]) return { day: d, offset: i };
    }
    return null;
  }

  function statusFor(now) {
    var today = HOURS[now.day];
    if (today && now.mins >= today[0] && now.mins < today[1]) {
      return { open: true, text: 'Open now, last orders at ' + clock(today[1]) };
    }
    if (today && now.mins < today[0]) {
      return { open: false, text: 'Open today from ' + clock(today[0]) };
    }
    var next = nextOpen(now.day);
    if (!next) return null;
    var when = next.offset === 1 ? 'tomorrow' : DAYS[next.day];
    return { open: false, text: 'Closed now. Back ' + when + ' at ' + clock(HOURS[next.day][0]) };
  }

  var now = nowInHudson();
  if (now) {
    var state = statusFor(now);
    if (state) {
      document.querySelectorAll('[data-status]').forEach(function (el) {
        el.textContent = '';
        var dot = document.createElement('span');
        dot.className = 'dot';
        dot.setAttribute('aria-hidden', 'true');
        el.appendChild(dot);
        el.appendChild(document.createTextNode(state.text));
        el.classList.toggle('is-open', state.open);
      });
    }
    document.querySelectorAll('[data-hours] tr[data-day="' + now.day + '"]').forEach(function (row) {
      row.classList.add('is-today');
    });
  }

  /* ---------- the table form ---------- */

  var form = document.querySelector('[data-book]');
  if (!form) return;

  var dateEl = form.elements.date;
  var timeEl = form.elements.time;
  var dateMsg = document.getElementById('b-date-msg');
  var errorEl = form.querySelector('[data-book-error]');
  var outEl = document.querySelector('[data-book-out]');
  var textEl = document.querySelector('[data-book-text]');
  var copyBtn = document.querySelector('[data-book-copy]');
  var copiedEl = document.querySelector('[data-book-copied]');

  form.hidden = false;

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  // Earliest date offered is today on the visitor's calendar.
  var t = new Date();
  dateEl.min = t.getFullYear() + '-' + pad(t.getMonth() + 1) + '-' + pad(t.getDate());

  function parseDate(value) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!m) return null;
    var d = new Date(+m[1], +m[2] - 1, +m[3]);
    return isNaN(d.getTime()) ? null : d;
  }

  function fillTimes() {
    var d = parseDate(dateEl.value);
    timeEl.innerHTML = '';
    dateEl.removeAttribute('aria-invalid');

    function only(label) {
      var o = document.createElement('option');
      o.value = '';
      o.textContent = label;
      timeEl.appendChild(o);
      timeEl.disabled = true;
    }

    if (!d) {
      only('Pick a date first');
      dateMsg.textContent = 'Wednesday to Sunday.';
      dateMsg.className = 'hint';
      return;
    }
    var hours = HOURS[d.getDay()];
    if (!hours) {
      only('Closed that day');
      dateEl.setAttribute('aria-invalid', 'true');
      dateMsg.textContent = 'We are closed on ' + DAYS[d.getDay()] + 's. Pick a Wednesday to Sunday.';
      dateMsg.className = 'err';
      return;
    }
    dateMsg.textContent = DAYS[d.getDay()] + ': ' + clock(hours[0]) + ' to ' + clock(hours[1]) + ' pm.';
    dateMsg.className = 'hint';
    timeEl.disabled = false;
    // Last table is seated an hour before last orders.
    for (var m = hours[0]; m <= hours[1] - 60; m += 30) {
      var o = document.createElement('option');
      o.value = clock(m) + ' pm';
      o.textContent = clock(m) + ' pm';
      timeEl.appendChild(o);
    }
  }

  dateEl.addEventListener('change', fillTimes);
  dateEl.addEventListener('input', fillTimes);
  fillTimes();

  function fail(message, el) {
    errorEl.textContent = message;
    errorEl.hidden = false;
    if (el) {
      el.setAttribute('aria-invalid', 'true');
      el.focus();
    }
  }

  ['name', 'phone'].forEach(function (key) {
    form.elements[key].addEventListener('input', function () {
      this.removeAttribute('aria-invalid');
    });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    errorEl.hidden = true;
    form.querySelectorAll('[aria-invalid]').forEach(function (el) { el.removeAttribute('aria-invalid'); });

    var name = form.elements.name.value.trim();
    var phone = form.elements.phone.value.trim();
    var d = parseDate(dateEl.value);

    if (!name) return fail('Please tell us your name.', form.elements.name);
    if (phone.replace(/\D/g, '').length < 7) return fail('Please give a phone number we can reach you on.', form.elements.phone);
    if (!d) return fail('Please pick a date.', dateEl);
    if (!HOURS[d.getDay()]) return fail('We are closed on ' + DAYS[d.getDay()] + 's. Pick a Wednesday to Sunday.', dateEl);
    if (!timeEl.value) return fail('Please pick a time.', timeEl);

    var party = form.elements.party.value;
    var chair = form.elements.highchair.value;
    var notes = form.elements.notes.value.trim();
    var dateLine = DAYS[d.getDay()] + ', ' + MONTHS[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();

    var subject = 'Table request: ' + party + ' people, ' + dateLine + ', ' + timeEl.value;
    var lines = [
      'Hello,',
      '',
      'Could I have a table?',
      '',
      'Name: ' + name,
      'Date: ' + dateLine,
      'Time: ' + timeEl.value,
      'People: ' + party,
      'Phone: ' + phone
    ];
    if (chair !== 'No') lines.push('High chairs: ' + chair);
    if (notes) lines.push('Notes: ' + notes);
    lines.push('', 'Thank you,', name);
    var body = lines.join('\n');

    textEl.textContent = 'To: ' + EMAIL + '\nSubject: ' + subject + '\n\n' + body;
    outEl.hidden = false;
    copiedEl.textContent = '';

    window.location.href = 'mailto:' + EMAIL +
      '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(body.replace(/\n/g, '\r\n'));

    outEl.scrollIntoView({ block: 'nearest' });
  });

  copyBtn.addEventListener('click', function () {
    var text = textEl.textContent;
    function done() { copiedEl.textContent = 'Copied.'; }
    function manual() {
      var range = document.createRange();
      range.selectNodeContents(textEl);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      copiedEl.textContent = 'Selected. Press Ctrl or Cmd and C to copy.';
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, manual);
    } else {
      manual();
    }
  });
})();

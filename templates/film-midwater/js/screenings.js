/* MIDWATER — screenings: a live calendar computed from today's date, with
   an inline reservation drawer per row. Reservations persist to
   localStorage under midwater.reservations.v1 and re-render as held seats
   on return visits. Confirmation is an inline noted line with a manifest
   code, never a toast. */
(function () {
  'use strict';
  var MW = window.MW;

  var VENUES = [
    { venue: 'Tidal House', city: 'Singapore', fmt: '2.39:1 · 5.1', qa: true },
    { venue: 'The Harbourlight', city: 'Sydney', fmt: '2.39:1 · 5.1', qa: false },
    { venue: 'Kino Undine', city: 'Berlin', fmt: '2.39:1 · 5.1', qa: false },
    { venue: 'The Cartographers’ Hall', city: 'London', fmt: '2.39:1 · 5.1', qa: true },
    { venue: 'Cinéma la Sonde', city: 'Montréal', fmt: '2.39:1 · 5.1', qa: false },
    { venue: 'Deepline Theatre', city: 'Wellington', fmt: '2.39:1 · 5.1', qa: false },
    { venue: 'Tidal House', city: 'Singapore', fmt: '2.39:1 · 5.1 · encore', qa: false },
    { venue: 'Salt Cathedral Cinema', city: 'Lisbon', fmt: '2.39:1 · 5.1', qa: true }
  ];

  var STORE_KEY = 'midwater.reservations.v1';

  function loadStore() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; }
    catch (e) { return {}; }
  }
  function saveStore(s) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch (e) { /* private mode */ }
  }

  function hash(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = (h * 16777619) >>> 0; }
    return h;
  }

  /* dates: upcoming Fridays and Saturdays, one per venue, starting 4 days out */
  function buildShows() {
    var shows = [];
    var d = new Date();
    d.setDate(d.getDate() + 3);
    var vi = 0;
    while (shows.length < VENUES.length) {
      d.setDate(d.getDate() + 1);
      var day = d.getDay();
      if (day !== 5 && day !== 6) continue;
      var v = VENUES[vi++];
      var when = new Date(d.getTime());
      var key = v.venue.replace(/\W+/g, '-').toLowerCase() + '-' + when.toISOString().slice(0, 10);
      var h = hash(key);
      var state = h % 5 === 0 ? 'full' : (h % 3 === 0 ? 'limited' : 'open');
      shows.push({ v: v, when: when, key: key, state: state });
      if (day === 6) d.setDate(d.getDate() + 4); /* skip into the next week */
    }
    return shows;
  }

  var MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  var DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  function fmtDate(dt) {
    return DAYS[dt.getDay()] + ' ' + dt.getDate() + ' ' + MONTHS[dt.getMonth()];
  }

  var list = document.getElementById('list');
  var store = loadStore();

  function stateLabel(show) {
    var r = store[show.key];
    if (r) return { cls: 'open', text: 'HELD · ' + r.code };
    if (show.state === 'full') return { cls: 'full', text: 'FULL — WAITLIST' };
    if (show.state === 'limited') return { cls: 'limited', text: 'LAST SEATS' };
    return { cls: 'open', text: 'SEATS OPEN' };
  }

  function render() {
    var shows = buildShows();
    var frag = document.createDocumentFragment();
    shows.forEach(function (show, i) {
      var row = document.createElement('article');
      row.className = 'scr-row' + (store[show.key] ? ' reserved' : '');
      var st = stateLabel(show);
      var reserved = !!store[show.key];
      var full = show.state === 'full';
      row.innerHTML =
        '<div class="scr-main">' +
          '<p class="scr-date">' + fmtDate(show.when) + '<small>20:00 LOCAL</small></p>' +
          '<p class="scr-venue">' + show.v.venue + '<small>' + show.v.city + '</small></p>' +
          '<p class="scr-fmt">' + show.v.fmt + (show.v.qa ? '<br>Q&amp;A WITH THE CREW' : '') + '</p>' +
          '<p class="scr-state ' + st.cls + '">' + st.text + '</p>' +
          '<p class="scr-act"><button class="btn-row" type="button" aria-expanded="false">' +
            (reserved ? 'View hold' : (full ? 'Join waitlist' : 'Reserve')) + '</button></p>' +
        '</div>' +
        '<div class="scr-form" id="drawer-' + i + '"><div class="scr-form-wrap"><div class="scr-form-in"></div></div></div>';
      frag.appendChild(row);
      wireRow(row, show, i);
    });
    list.appendChild(frag);
  }

  function wireRow(row, show, i) {
    var btn = row.querySelector('.btn-row');
    var drawer = row.querySelector('.scr-form');
    var inner = row.querySelector('.scr-form-in');
    var open = false;

    function openDrawer() {
      buildDrawer();
      open = true;
      btn.setAttribute('aria-expanded', 'true');
      drawer.classList.add('open');
      if (MW.ping) MW.ping();
    }
    function closeDrawer() {
      open = false;
      btn.setAttribute('aria-expanded', 'false');
      drawer.classList.remove('open');
    }

    btn.addEventListener('click', function () { open ? closeDrawer() : openDrawer(); });

    function buildDrawer() {
      var r = store[show.key];
      if (r) {
        inner.innerHTML =
          '<p class="noted" style="grid-column: 1 / -1;">Held for ' + escapeHtml(r.name) + ' — ' + r.seats +
          (r.seats > 1 ? ' seats' : ' seat') + ' at ' + escapeHtml(show.v.venue) + ', ' + fmtDate(show.when) +
          '. Quote <span class="code">' + r.code + '</span> at the door.' +
          ' <button class="btn-quiet" type="button" data-release style="margin-left:14px; padding:8px 14px;">Release seats</button></p>';
        var rel = inner.querySelector('[data-release]');
        rel.addEventListener('click', function () {
          delete store[show.key];
          saveStore(store);
          refreshRow();
          buildDrawer();
        });
        return;
      }
      var wait = show.state === 'full';
      inner.innerHTML =
        '<div class="field"><label for="nm-' + i + '">Name</label>' +
          '<input id="nm-' + i + '" type="text" autocomplete="name">' +
          '<span class="field-err" aria-live="polite"></span></div>' +
        '<div class="field"><label for="em-' + i + '">Email</label>' +
          '<input id="em-' + i + '" type="email" autocomplete="email">' +
          '<span class="field-err" aria-live="polite"></span></div>' +
        (wait ? '' :
        '<div class="field"><label id="se-l-' + i + '">Seats</label>' +
          '<div class="seats" role="group" aria-labelledby="se-l-' + i + '">' +
            '<button type="button" data-d="-1" aria-label="One seat fewer" disabled>−</button>' +
            '<output>1</output>' +
            '<button type="button" data-d="1" aria-label="One seat more">+</button>' +
          '</div><span class="field-err"></span></div>') +
        '<div class="field"><span class="field-err"></span>' +
          '<button class="btn-signal" type="button" data-go style="border:1px solid var(--amber); cursor:pointer;">' +
          (wait ? 'Hold my place' : 'Log the reservation') + '</button></div>';

      var seats = 1;
      var out = inner.querySelector('output');
      Array.prototype.forEach.call(inner.querySelectorAll('.seats button'), function (b) {
        b.addEventListener('click', function () {
          seats = MW.clamp(seats + parseInt(b.getAttribute('data-d'), 10), 1, 4);
          out.textContent = seats;
          inner.querySelector('.seats button[data-d="-1"]').disabled = seats === 1;
          inner.querySelector('.seats button[data-d="1"]').disabled = seats === 4;
        });
      });

      inner.querySelector('[data-go]').addEventListener('click', function () {
        var nm = inner.querySelector('#nm-' + i);
        var em = inner.querySelector('#em-' + i);
        var ok = true;
        ok = check(nm, function (v) { return v.trim().length >= 2; }, 'The door list needs a name.') && ok;
        ok = check(em, function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); }, 'That email will not survive the depth — check it.') && ok;
        if (!ok) return;
        var code = 'MW-' + (hash(show.key + em.value.trim()) % 9000 + 1000);
        store[show.key] = {
          name: nm.value.trim(), email: em.value.trim(),
          seats: wait ? 0 : seats, code: code, wait: wait,
          at: new Date().toISOString()
        };
        saveStore(store);
        if (MW.ping) MW.ping();
        refreshRow();
        inner.innerHTML =
          '<p class="noted" style="grid-column: 1 / -1;">' +
          (wait
            ? 'You are on the waitlist for ' + escapeHtml(show.v.venue) + ', ' + fmtDate(show.when) +
              '. If the sea gives a seat back, the desk writes to ' + escapeHtml(em.value.trim()) + '.'
            : 'Logged. ' + seats + (seats > 1 ? ' seats' : ' seat') + ' held at ' + escapeHtml(show.v.venue) +
              ', ' + fmtDate(show.when) + ' — quote <span class="code">' + code + '</span> at the door.') +
          '</p>';
      });
    }

    function refreshRow() {
      var st = stateLabel(show);
      var stEl = row.querySelector('.scr-state');
      stEl.className = 'scr-state ' + st.cls;
      stEl.textContent = st.text;
      row.classList.toggle('reserved', !!store[show.key]);
      btn.textContent = store[show.key] ? 'View hold' : (show.state === 'full' ? 'Join waitlist' : 'Reserve');
    }

    function check(input, fn, msg) {
      var field = input.closest('.field');
      var err = field.querySelector('.field-err');
      if (!fn(input.value)) { field.classList.add('err'); err.textContent = msg; return false; }
      field.classList.remove('err'); err.textContent = '';
      return true;
    }
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ---------------- host a screening ---------------- */
  var hostForm = document.getElementById('hostForm');
  if (hostForm) {
    hostForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var venue = document.getElementById('hostVenue');
      var email = document.getElementById('hostEmail');
      var ok = true;
      ok = fieldCheck(venue, function (v) { return v.trim().length >= 2; }, 'Tell us where the film would play.') && ok;
      ok = fieldCheck(email, function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); }, 'The desk needs a working address to reply to.') && ok;
      if (!ok) return;
      var noted = document.getElementById('hostNoted');
      noted.hidden = false;
      noted.innerHTML = 'Noted at the desk. A booking sheet for ' + escapeHtml(venue.value.trim()) +
        ' goes out to <span class="code">' + escapeHtml(email.value.trim()) + '</span> within three days.';
      hostForm.querySelector('button[type="submit"]').disabled = true;
      if (MW.ping) MW.ping();
    });
  }
  function fieldCheck(input, fn, msg) {
    var field = input.closest('.field');
    var err = field.querySelector('.field-err');
    if (!fn(input.value)) { field.classList.add('err'); err.textContent = msg; return false; }
    field.classList.remove('err'); err.textContent = '';
    return true;
  }

  render();
  MW.observeRise(document);
})();

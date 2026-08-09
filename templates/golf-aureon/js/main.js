/* AUREON — zero dependencies. One shared file; each page wakes only its own module. */
(function () {
  'use strict';

  var doc = document;
  var page = doc.body.getAttribute('data-page');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- helpers ---------- */
  function $(sel, ctx) { return (ctx || doc).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); }
  function hash(str) {
    var h = 5381, i;
    for (i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
    return h;
  }
  function store(key, val) {
    try {
      if (val === undefined) return JSON.parse(localStorage.getItem(key) || 'null');
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) { return null; }
  }
  function nextDays(n) {
    var out = [], d = new Date(), i;
    for (i = 0; i < n; i++) {
      out.push(new Date(d.getFullYear(), d.getMonth(), d.getDate() + i));
    }
    return out;
  }
  function fmtDay(d, style) {
    return d.toLocaleDateString('en-GB', style || { weekday: 'short', day: 'numeric', month: 'short' });
  }
  var KIND_LABEL = {
    locker: 'Lockers & storage', transport: 'Transport & travel', guest: 'Guest arrangements',
    private: 'A private event', coaching: 'Coaching with the pro', fitting: 'Club fitting',
    recovery: 'Recovery suite', practice: 'Practice bays', other: 'Something else entirely'
  };

  /* ---------- toast ---------- */
  var toastEl = $('#toast');
  var toastTimer;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.innerHTML = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12.5l5 5L20 6.5"/></svg><span></span>';
    toastEl.lastElementChild.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-on'); }, 3600);
  }

  /* ---------- engrave: letters settle into the plate ---------- */
  function engrave(el, text) {
    el.textContent = '';
    if (reduceMotion) { el.textContent = text; return; }
    var frag = doc.createDocumentFragment();
    text.split('').forEach(function (ch, i) {
      var s = doc.createElement('span');
      s.textContent = ch;
      if (ch === ' ') s.style.whiteSpace = 'pre';
      s.style.animationDelay = (i * 28) + 'ms';
      frag.appendChild(s);
    });
    el.classList.add('engrave');
    el.appendChild(frag);
  }

  /* ---------- busy button ---------- */
  function busy(btn, labelEl, busyText, ms, then) {
    var old = labelEl.textContent;
    btn.classList.add('is-busy');
    btn.setAttribute('disabled', '');
    labelEl.textContent = busyText;
    setTimeout(function () {
      btn.classList.remove('is-busy');
      btn.removeAttribute('disabled');
      labelEl.textContent = old;
      then();
    }, reduceMotion ? 60 : ms);
  }

  /* ---------- .ics download ---------- */
  function downloadIcs(title, d, startHM, hours) {
    try {
      function p2(n) { return (n < 10 ? '0' : '') + n; }
      var start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), startHM[0], startHM[1]);
      var end = new Date(start.getTime() + hours * 3600000);
      function stamp(x) {
        return x.getFullYear() + p2(x.getMonth() + 1) + p2(x.getDate()) + 'T' + p2(x.getHours()) + p2(x.getMinutes()) + '00';
      }
      var ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Aureon Club//Member Portal//EN',
        'BEGIN:VEVENT', 'UID:' + Date.now() + '@aureon', 'DTSTART:' + stamp(start), 'DTEND:' + stamp(end),
        'SUMMARY:' + title, 'LOCATION:Aureon Club\\, One Fairway Lane', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
      var a = doc.createElement('a');
      a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
      a.download = 'aureon-round.ics';
      doc.body.appendChild(a); a.click(); a.remove();
      toast('In your calendar — ' + title + '.');
    } catch (e) {
      toast('The desk can send a calendar invitation — one line to the concierge.');
    }
  }

  /* ---------- mobile nav ---------- */
  var burger = $('#navBurger');
  if (burger) {
    burger.addEventListener('click', function () {
      var nav = $('.top-nav');
      var open = nav.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', String(open));
    });
  }

  /* ================= HOME ================= */
  if (page === 'home') {
    var hr = new Date().getHours();
    $('#greetWord').textContent = hr < 12 ? 'Good morning' : hr < 18 ? 'Good afternoon' : 'Good evening';
    $('#greetDate').textContent = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
    $('#todayStamp').textContent = fmtDay(new Date(), { weekday: 'short', day: 'numeric' });
    $('#baysState').textContent = hr < 9 ? '5 of 6 free' : hr < 12 ? '4 of 6 free' : hr < 16 ? '2 of 6 free' : 'Free from 5:00 pm';

    /* next round from the last issued tag, else the standing Saturday game */
    var bk = store('aureon.booking.v1');
    var nextD, nextHM, meta;
    if (bk) {
      nextD = new Date(bk.y, bk.m, bk.d);
      nextHM = bk.hm;
      $('#nextWhen').textContent = fmtDay(nextD, { weekday: 'long' }) + ' · ' + bk.time;
      meta = 'White tees · ' + bk.players + (bk.players === 1 ? ' player' : ' players');
      if (bk.caddie) meta += ' · caddie reserved';
      if (bk.buggy) meta += ' · buggy';
      if (bk.lunch) meta += ' · lunch after';
      $('#nextMeta').textContent = meta;
      $('#nextSerial').textContent = '№ ' + bk.serial;
    } else {
      nextD = (function () {
        var d = new Date();
        d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7 || 7));
        return d;
      })();
      nextHM = [7, 12];
    }
    $('#calChip').addEventListener('click', function () {
      downloadIcs('Golf at Aureon — ' + (bk ? bk.time : '07:12'), nextD, nextHM, 4.5);
    });

    /* fixture states from RSVPs */
    var rsvp = store('aureon.rsvp.v1') || {};
    $$('.fx-state').forEach(function (el) {
      var on = rsvp[el.getAttribute('data-ev')];
      el.textContent = on ? 'Entered' : '—';
      el.classList.toggle('is-on', !!on);
    });

    /* five-round spark */
    (function () {
      var svg = $('#homeSpark');
      var scores = [88, 86, 89, 85, 84];
      var min = 83, max = 90, W = 220, H = 56, pad = 6;
      var pts = scores.map(function (s, i) {
        var x = pad + i * ((W - pad * 2) / (scores.length - 1));
        var y = pad + (s - min) / (max - min) * (H - pad * 2); /* value-true: lower score sits lower */
        y = H - y;
        return [x, y];
      });
      var poly = doc.createElementNS('http://www.w3.org/2000/svg', 'polyline');
      poly.setAttribute('points', pts.map(function (p) { return p.join(','); }).join(' '));
      svg.appendChild(poly);
      pts.forEach(function (p, i) {
        var c = doc.createElementNS('http://www.w3.org/2000/svg', 'circle');
        c.setAttribute('cx', p[0]); c.setAttribute('cy', p[1]);
        c.setAttribute('r', i === pts.length - 1 ? 3.4 : 2.2);
        svg.appendChild(c);
      });
    })();
  }

  /* ================= BOOK ================= */
  if (page === 'book') {
    var days = nextDays(7);
    var state = { day: null, time: null, players: 3, caddie: true, buggy: false, lunch: false, guests: [] };

    var dayRow = $('#dayRow');
    days.forEach(function (d, i) {
      var b = doc.createElement('button');
      b.type = 'button';
      b.className = 'day-btn';
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', 'false');
      b.innerHTML = '<strong></strong><em></em><span></span>';
      b.firstChild.textContent = i === 0 ? 'Today' : d.toLocaleDateString('en-GB', { weekday: 'short' });
      b.children[1].textContent = d.getDate();
      b.lastChild.textContent = d.toLocaleDateString('en-GB', { month: 'short' });
      b.addEventListener('click', function () { pickDay(i); });
      dayRow.appendChild(b);
    });

    function slotList(d) {
      /* 18 times from 6:48, every 8 minutes; availability is the sheet's own business */
      var seedBase = d.toDateString();
      var out = [], t = 6 * 60 + 48, i;
      for (i = 0; i < 18; i++) {
        var hm = [Math.floor(t / 60), t % 60];
        var label = (hm[0] < 10 ? '0' : '') + hm[0] + ':' + (hm[1] < 10 ? '0' : '') + hm[1];
        var r = hash(seedBase + label) % 100;
        out.push({ time: label, hm: hm, state: r < 34 ? 'taken' : (r < 42 ? 'held' : 'open') });
        t += 8;
      }
      return out;
    }

    var teeSheet = $('#teeSheet');
    function renderSheet() {
      teeSheet.innerHTML = '';
      slotList(days[state.day]).forEach(function (s) {
        var b = doc.createElement('button');
        b.type = 'button';
        b.className = 'slot' + (s.state !== 'open' ? ' is-' + s.state : '');
        b.setAttribute('role', 'radio');
        b.setAttribute('aria-checked', String(state.time === s.time));
        if (s.state !== 'open') b.setAttribute('disabled', '');
        b.innerHTML = '<span class="slot-time"></span><span class="slot-state"></span>';
        b.firstChild.textContent = s.time;
        b.lastChild.textContent = s.state === 'taken' ? '———' : s.state === 'held' ? "starter's hold" : 'open';
        if (state.time === s.time) b.classList.add('is-on');
        b.addEventListener('click', function () {
          state.time = s.time; state.hm = s.hm;
          $$('.slot', teeSheet).forEach(function (x) { x.classList.remove('is-on'); x.setAttribute('aria-checked', 'false'); });
          b.classList.add('is-on'); b.setAttribute('aria-checked', 'true');
          folio();
        });
        teeSheet.appendChild(b);
      });
    }

    function pickDay(i) {
      state.day = i; state.time = null;
      $$('.day-btn', dayRow).forEach(function (x, j) {
        x.classList.toggle('is-on', j === i);
        x.setAttribute('aria-checked', String(j === i));
      });
      renderSheet();
      folio();
    }

    /* party */
    var countEl = $('#playerCount');
    var guestRows = $('#guestRows');
    function renderGuests() {
      guestRows.innerHTML = '';
      var i;
      for (i = 1; i < state.players; i++) {
        var row = doc.createElement('div');
        row.className = 'guest-row';
        var id = 'guest' + i;
        row.innerHTML = '<label for="' + id + '">Player ' + (i + 1) + '</label>' +
          '<input class="b-input" id="' + id + '" type="text" autocomplete="off" placeholder="A member, or a guest of № 0212">';
        row.lastChild.value = state.guests[i - 1] || '';
        row.lastChild.addEventListener('input', function (idx) {
          return function (e) { state.guests[idx] = e.target.value; };
        }(i - 1));
        guestRows.appendChild(row);
      }
    }
    $('#fewerBtn').addEventListener('click', function () {
      if (state.players > 1) { state.players--; countEl.textContent = state.players; renderGuests(); folio(); }
    });
    $('#moreBtn').addEventListener('click', function () {
      if (state.players < 4) { state.players++; countEl.textContent = state.players; renderGuests(); folio(); }
    });

    ['caddie', 'buggy', 'lunch'].forEach(function (k) {
      $('#' + k + 'Tgl').addEventListener('change', function (e) { state[k] = e.target.checked; folio(); });
    });

    /* the folio writes itself */
    var issueBtn = $('#issueBtn');
    var issueLabel = $('#issueLabel');
    function setLine(id, val) {
      var el = $('#' + id);
      el.textContent = val || '—';
      el.classList.toggle('is-set', !!val);
    }
    function folio() {
      var d = state.day !== null ? days[state.day] : null;
      setLine('fDay', d ? fmtDay(d, { weekday: 'long', day: 'numeric', month: 'long' }) : '');
      setLine('fTee', state.time ? state.time + ' off the first' : '');
      setLine('fParty', state.players + (state.players === 1 ? ' player' : ' players') +
        (state.players > 1 ? ', your party' : ''));
      setLine('fBag', state.caddie && state.buggy ? 'Caddie and buggy' : state.caddie ? 'Caddie, walking' : state.buggy ? 'Buggy' : 'Carrying');
      setLine('fAfter', state.lunch ? 'Lunch in the Morning Room' : '');
      var ready = state.day !== null && state.time;
      issueBtn.disabled = !ready;
      issueLabel.textContent = ready ? 'Issue the tag' : (state.day === null ? 'Choose a day' : 'Choose a tee time');
    }

    /* issue */
    issueBtn.addEventListener('click', function () {
      var d = days[state.day];
      busy(issueBtn, issueLabel, 'Engraving…', 1100, function () {
        var serial = 4000 + hash(d.toDateString() + state.time) % 1000;
        var booking = {
          y: d.getFullYear(), m: d.getMonth(), d: d.getDate(),
          time: state.time, hm: state.hm, players: state.players,
          caddie: state.caddie, buggy: state.buggy, lunch: state.lunch, serial: serial
        };
        store('aureon.booking.v1', booking);
        $('#folioSerial').textContent = '№ ' + serial;
        var wrap = $('#issuedWrap');
        wrap.hidden = false;
        engrave($('#issuedTitle'), fmtDay(d, { weekday: 'long' }) + ' · ' + state.time + ' · № ' + serial);
        $('#issuedMeta').textContent = 'White tees · ' + state.players +
          (state.players === 1 ? ' player' : ' players') +
          (state.caddie ? ' · caddie' : '') + (state.buggy ? ' · buggy' : '') +
          (state.lunch ? ' · lunch after' : '');
        renderAnticipation(booking, d);
        toast('Tagged. The starter has you at ' + state.time + ' ' + fmtDay(d, { weekday: 'long' }) + '.');
        issueLabel.textContent = 'Issued — amend any time';
        wrap.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' });
      });
    });

    function renderAnticipation(booking, d) {
      var row = $('#anticipateRow');
      row.innerHTML = '';
      function chip(svgPath, label, fn) {
        var b = doc.createElement('button');
        b.type = 'button'; b.className = 'chip';
        b.innerHTML = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="' + svgPath + '"/></svg><span></span>';
        b.lastElementChild.textContent = label;
        b.addEventListener('click', function () { fn(b); });
        row.appendChild(b);
        return b;
      }
      chip('M3 5h18v16H3zM3 10h18M8 3v4M16 3v4', 'Add to calendar', function () {
        downloadIcs('Golf at Aureon — ' + booking.time, d, booking.hm, 4.5);
      });
      if (!booking.lunch) {
        chip('M7 3v8m4-8v8M7 7h4M9 11v10M16 3c-1.5 1.8-2 3.8-2 6 0 2 .8 3 2 3v9', 'Add lunch after', function (b) {
          booking.lunch = true; state.lunch = true;
          $('#lunchTgl').checked = true;
          store('aureon.booking.v1', booking);
          $('#issuedMeta').textContent += ' · lunch after';
          folio();
          b.classList.add('is-done');
          b.lastElementChild.textContent = 'Lunch is held';
          toast('A table in the Morning Room, about an hour past your finish.');
        });
      }
      chip('M8 3v2m8-2v2M4 8h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z', 'A note for your guests', function (b) {
        var text = 'You’re playing Aureon with me — ' +
          fmtDay(d, { weekday: 'long', day: 'numeric', month: 'long' }) + ', ' + booking.time +
          ' off the first. Meet at the starter’s hut twenty minutes before; everything else is arranged.';
        function done() {
          b.classList.add('is-done');
          b.lastElementChild.textContent = 'Copied for sending';
          toast('The invitation is on your clipboard.');
        }
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, done);
        else done();
      });
      var a = doc.createElement('a');
      a.className = 'chip'; a.href = 'club.html#notices';
      a.innerHTML = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 21V4l7 3 7-3v13M5 21h14"/></svg><span>Course conditions</span>';
      row.appendChild(a);
    }

    pickDay(0);
    folio();
  }

  /* ================= GAME ================= */
  if (page === 'game') {
    (function () {
      var svg = $('#hcpTrend');
      var series = [13.6, 13.4, 13.5, 13.2, 13.0, 13.1, 12.9, 12.8, 12.9, 12.6, 12.5, 12.4];
      var min = 12.2, max = 13.8, W = 560, H = 150, pad = 10;
      var pts = series.map(function (v, i) {
        var x = pad + i * ((W - pad * 2) / (series.length - 1));
        var y = pad + (v - min) / (max - min) * (H - pad * 2); /* value-true: the index eases downward */
        y = H - y;
        return [x, y];
      });
      var dPath = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' ');
      var area = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
      area.setAttribute('class', 'trend-area');
      area.setAttribute('d', dPath + ' V' + (H - 2) + ' H' + pad + ' Z');
      svg.appendChild(area);
      var path = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', dPath);
      svg.appendChild(path);
      pts.forEach(function (p, i) {
        var c = doc.createElementNS('http://www.w3.org/2000/svg', 'circle');
        c.setAttribute('cx', p[0]); c.setAttribute('cy', p[1]);
        c.setAttribute('r', i === pts.length - 1 ? 4 : 2.4);
        if (i === pts.length - 1) c.setAttribute('class', 'trend-dot-last');
        svg.appendChild(c);
      });
    })();

    /* one card open at a time keeps the record tidy */
    $$('.round').forEach(function (d) {
      d.addEventListener('toggle', function () {
        if (d.open) $$('.round[open]').forEach(function (x) { if (x !== d) x.open = false; });
      });
    });
  }

  /* ================= CLUB ================= */
  if (page === 'club') {
    var rsvp = store('aureon.rsvp.v1') || {};
    var RSVP_ON = { captains: 'Entered — draw Thursday', twilight: 'Name down', cellar: 'Two places held', autumn: 'Entered' };
    var RSVP_TOAST = {
      captains: 'Entered. The draw goes up Thursday evening.',
      twilight: 'Your name is down — supper follows the nine.',
      cellar: 'Two places at the long table, held.',
      autumn: 'Entered for the Autumn Meeting.'
    };
    $$('.rsvp').forEach(function (b) {
      var ev = b.getAttribute('data-ev');
      var offLabel = b.textContent;
      function paint() {
        var on = !!rsvp[ev];
        b.classList.toggle('is-on', on);
        b.textContent = on ? RSVP_ON[ev] : offLabel;
      }
      paint();
      b.addEventListener('click', function () {
        var was = !!rsvp[ev];
        if (was) {
          rsvp[ev] = false; store('aureon.rsvp.v1', rsvp); paint();
          toast('Taken off the sheet — no questions asked.');
        } else {
          b.setAttribute('disabled', '');
          setTimeout(function () {
            b.removeAttribute('disabled');
            rsvp[ev] = true; store('aureon.rsvp.v1', rsvp); paint();
            toast(RSVP_TOAST[ev]);
          }, reduceMotion ? 40 : 500);
        }
      });
    });

    /* table booking */
    var tDay = $('#tableDay');
    nextDays(7).forEach(function (d, i) {
      var o = doc.createElement('option');
      o.value = i;
      o.textContent = i === 0 ? 'Today' : fmtDay(d);
      tDay.appendChild(o);
    });
    $('#tableForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = $('#tableBtn');
      busy(btn, $('#tableLabel'), 'Speaking to the room…', 900, function () {
        var d = nextDays(7)[+tDay.value];
        var t = $('#tableTime').value, party = $('#tableParty').value;
        var text = 'The corner table. ' + fmtDay(d, { weekday: 'long' }) + ' at ' + t + ', ' + party + ' covers — held.';
        store('aureon.table.v1', { when: d.toDateString(), time: t, party: party });
        engrave($('#tableConfirm'), text);
        toast('The Morning Room has you. ' + fmtDay(d, { weekday: 'long' }) + ', ' + t + '.');
      });
    });
  }

  /* ================= CONCIERGE ================= */
  if (page === 'concierge') {
    /* arrive with intent: ?service= prefills the matter */
    var svc = new URLSearchParams(location.search).get('service');
    if (svc && KIND_LABEL[svc]) $('#reqKind').value = svc;

    var ledger = $('#ledger');
    var ledgerEmpty = $('#ledgerEmpty');
    var ledgerCount = $('#ledgerCount');
    var reqs = store('aureon.requests.v1') || [];

    function renderLedger() {
      ledger.innerHTML = '';
      reqs.slice().reverse().forEach(function (r) {
        var li = doc.createElement('li');
        li.innerHTML =
          '<div class="ledger-head"><span class="ledger-kind"></span><span class="ledger-serial"></span></div>' +
          '<p class="ledger-text"></p>' +
          '<div class="ledger-foot"><span class="ledger-when"></span><span class="ledger-state">Received</span></div>';
        $('.ledger-kind', li).textContent = KIND_LABEL[r.kind] || r.kind;
        $('.ledger-serial', li).textContent = '№ ' + r.serial;
        $('.ledger-text', li).textContent = r.text;
        $('.ledger-when', li).textContent = r.when ? 'For: ' + r.when : r.at;
        ledger.appendChild(li);
      });
      ledgerEmpty.hidden = reqs.length > 0;
      ledgerCount.textContent = reqs.length ? (reqs.length + (reqs.length === 1 ? ' matter' : ' matters')) : '—';
    }
    renderLedger();

    var reqText = $('#reqText');
    var reqHint = $('#reqHint');
    var HINT = reqHint.textContent;
    reqText.addEventListener('input', function () {
      if (reqHint.classList.contains('is-error')) {
        reqHint.textContent = HINT;
        reqHint.classList.remove('is-error');
        reqText.setAttribute('aria-invalid', 'false');
      }
    });

    $('#deskForm').addEventListener('submit', function (e) {
      e.preventDefault();
      if (!reqText.value.trim()) {
        reqHint.textContent = 'A line is all the desk needs — but it does need the line.';
        reqHint.classList.add('is-error');
        reqText.setAttribute('aria-invalid', 'true');
        reqText.focus();
        return;
      }
      var btn = $('#deskBtn');
      busy(btn, $('#deskLabel'), 'Sealing…', 900, function () {
        var serial = 7000 + hash(reqText.value + Date.now()) % 1000;
        reqs.push({
          kind: $('#reqKind').value,
          text: reqText.value.trim(),
          when: $('#reqWhen').value.trim(),
          at: new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }),
          serial: serial
        });
        store('aureon.requests.v1', reqs);
        renderLedger();
        reqText.value = ''; $('#reqWhen').value = '';
        toast('In hand. № ' + serial + ' — the desk will come back to you today.');
      });
    });
  }
})();

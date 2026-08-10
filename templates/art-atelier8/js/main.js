/* ATELIER № 8 — zero dependencies. Tissue leaves, quiet confirmations, nothing loud. */
(function () {
  'use strict';

  var doc = document;
  var page = doc.body.getAttribute('data-page');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function $(sel, ctx) { return (ctx || doc).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); }
  function store(key, val) {
    try {
      if (val === undefined) return JSON.parse(localStorage.getItem(key) || 'null');
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) { return null; }
  }
  function busy(btn, labelEl, busyText, ms, then) {
    btn.classList.add('is-busy');
    btn.setAttribute('disabled', '');
    labelEl.textContent = busyText;
    setTimeout(then, reduceMotion ? 50 : ms);
  }
  function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); }
  function setHint(input, hintEl, msg) {
    hintEl.textContent = msg || '';
    hintEl.classList.toggle('is-error', !!msg);
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
  }

  /* ---------- tissue leaves lift as plates enter view ---------- */
  var reveals = $$('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.35 });
    reveals.forEach(function (el) { io.observe(el); });
    setTimeout(function () {          /* background-tab safety */
      reveals.forEach(function (el) {
        if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('is-in');
      });
    }, 2600);
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ================= THE HANG ================= */
  if (page === 'hang') {
    var enquiries = store('no8.enquiries.v1') || {};
    $$('.enq').forEach(function (btn) {
      var id = btn.getAttribute('data-plate');
      function noted() {
        var p = doc.createElement('p');
        p.className = 'noted';
        p.innerHTML = '<strong>Noted.</strong> The dossier follows by hand — provenance, condition, and the price the room heard first.';
        btn.replaceWith(p);
      }
      if (enquiries[id]) { noted(); return; }
      btn.addEventListener('click', function () {
        var label = doc.createElement('span');
        btn.textContent = '';
        label.textContent = 'A moment…';
        btn.appendChild(label);
        btn.classList.add('is-busy');
        btn.setAttribute('disabled', '');
        setTimeout(function () {
          enquiries[id] = true;
          store('no8.enquiries.v1', enquiries);
          noted();
        }, reduceMotion ? 50 : 750);
      });
    });
  }

  /* ================= CALENDAR ================= */
  if (page === 'cal') {
    var rsvp = store('no8.places.v1') || {};
    var FULL = { dinner: true };   /* the dinner is nearly full — one place at a time */
    $$('.cal-act').forEach(function (cell) {
      var ev = cell.getAttribute('data-ev');
      function paintNoted() {
        cell.innerHTML = '';
        var p = doc.createElement('p');
        p.className = 'noted';
        p.innerHTML = '<strong>Requested.</strong> Confirmation follows by note.';
        cell.appendChild(p);
      }
      if (rsvp[ev]) { paintNoted(); return; }
      var btn = doc.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn-quiet';
      btn.textContent = ev === 'dinner' ? 'Ask for a place' : 'Request a place';
      btn.addEventListener('click', function () {
        btn.textContent = 'A moment…';
        btn.setAttribute('disabled', '');
        setTimeout(function () {
          rsvp[ev] = true;
          store('no8.places.v1', rsvp);
          paintNoted();
        }, reduceMotion ? 50 : 750);
      });
      cell.appendChild(btn);
    });
  }

  /* ================= MEMBERSHIP ================= */
  if (page === 'apply') {
    var form = $('#applyForm');
    var done = $('#applyDone');
    var notedEl = $('#applyNoted');

    var existing = store('no8.application.v1');
    if (existing) {
      form.hidden = true;
      notedEl.innerHTML = '<strong>Your registration is with the committee.</strong> Filed ' +
        existing.at + ' — the next reading is in September, and the club writes to everyone, either way.';
      done.hidden = false;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = $('#aName'), mail = $('#aMail'), line = $('#aLine');
      var ok = true;
      if (!validEmail(mail.value)) {
        setHint(mail, $('#mailHint'), 'The committee replies by letter, but it files by email — this one doesn’t read.');
        ok = false;
      } else setHint(mail, $('#mailHint'), '');
      if (!name.value.trim() || !line.value.trim()) {
        setHint(line, $('#lineHint'), 'Your name and the line about what you live with are the two things the committee actually reads.');
        ok = false;
      } else setHint(line, $('#lineHint'), '');
      if (!ok) return;

      var btn = $('#applyBtn');
      busy(btn, $('#applyLabel'), 'Filing…', 1000, function () {
        var at = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
        store('no8.application.v1', { name: name.value.trim(), at: at });
        form.hidden = true;
        notedEl.innerHTML = '<strong>Received, ' + (name.value.trim().split(' ')[0] || 'and filed') +
          '.</strong> The committee reads in September — twelve places, and it writes to everyone, either way.';
        done.hidden = false;
        done.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
      });
    });
  }

  /* ================= SIGN IN ================= */
  if (page === 'login') {
    var lform = $('#loginForm');
    lform.addEventListener('submit', function (e) {
      e.preventDefault();
      var mail = $('#lMail');
      if (!validEmail(mail.value)) {
        setHint(mail, $('#loginHint'), 'That address doesn’t read — keys only travel to real ones.');
        return;
      }
      setHint(mail, $('#loginHint'), '');
      var btn = $('#loginBtn');
      busy(btn, $('#loginLabel'), 'Sending…', 900, function () {
        $('#loginEcho').textContent = mail.value.trim();
        lform.hidden = true;
        $('#loginDone').hidden = false;
      });
    });
  }
})();

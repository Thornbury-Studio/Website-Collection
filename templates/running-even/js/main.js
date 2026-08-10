/* EVEN — zero dependencies. One scroll-driven rail, one pointer sheen,
   one pace-band builder. Nothing runs when nothing moves. */
(function () {
  'use strict';

  var doc = document;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- helpers ---------- */
  function $(sel, ctx) { return (ctx || doc).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); }
  function fmtClock(totalSec) {
    totalSec = Math.max(0, Math.round(totalSec));
    var h = Math.floor(totalSec / 3600);
    var m = Math.floor((totalSec % 3600) / 60);
    var s = totalSec % 60;
    var mm = (h && m < 10 ? '0' : '') + m;
    var ss = (s < 10 ? '0' : '') + s;
    return h ? h + ':' + mm + ':' + ss : m + ':' + ss;
  }

  /* ---------- toast ---------- */
  var toastEl = $('#toast');
  var toastTimer;
  function toast(msg) {
    toastEl.innerHTML =
      '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12.5l5 5L20 6.5"/></svg><span></span>';
    toastEl.lastElementChild.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-on'); }, 3400);
  }

  /* ---------- header ---------- */
  var top = $('#top');

  /* ---------- split rail: scroll read as distance ---------- */
  var railThumb = $('#railThumb');
  var railFill = $('#railFill');
  var railKm = $('#railKm');
  var railAt = $('#railAt');
  var railbar = $('#railbar');
  var railbarFill = $('#railbarFill');
  var railbarKm = $('#railbarKm');
  var heroCue = $('#heroCue');
  var EASY_PACE = 340;                    // 5:40/km, the page's easy pace
  var anchors = [];                       // [{y, km}] monotonic
  var lastWholeKm = 0;
  var tickTimer;

  function mapAnchors() {
    var winH = window.innerHeight;
    var maxY = Math.max(1, doc.documentElement.scrollHeight - winH);
    anchors = [{ y: 0, km: 0 }];
    $$('[data-km]').forEach(function (el) {
      var km = parseFloat(el.getAttribute('data-km'));
      if (!km) return;
      var y = el.getBoundingClientRect().top + window.scrollY - winH * 0.55;
      anchors.push({ y: Math.min(Math.max(y, 0), maxY), km: km });
    });
    anchors.push({ y: maxY, km: 10 });
    anchors.sort(function (a, b) { return a.y - b.y || a.km - b.km; });
  }

  function kmAt(y) {
    var i;
    for (i = anchors.length - 1; i > 0; i--) {
      if (y >= anchors[i - 1].y) break;
    }
    var a = anchors[i - 1], b = anchors[i] || a;
    if (b.y <= a.y) return b.km;
    var t = Math.min(1, Math.max(0, (y - a.y) / (b.y - a.y)));
    return a.km + (b.km - a.km) * t;
  }

  var railTicking = false;
  function paintRail() {
    railTicking = false;
    var km = kmAt(window.scrollY);
    var pct = km / 10 * 100;
    railFill.style.height = pct + '%';
    railThumb.style.top = (3.5 + km / 10 * 93) + '%';  /* keep the chip off the end labels */
    railKm.textContent = km.toFixed(1);
    railAt.textContent = fmtClock(km * EASY_PACE);
    railbarFill.style.width = pct + '%';
    railbarKm.textContent = km.toFixed(1) + ' km';
    railbar.classList.toggle('is-on', km > 0.05 && km < 9.9);
    top.classList.toggle('is-solid', window.scrollY > 40);
    if (heroCue) heroCue.classList.toggle('is-done', km > 0.15);
    var whole = Math.floor(km);
    if (whole !== lastWholeKm) {
      lastWholeKm = whole;
      railThumb.classList.add('is-tick');
      clearTimeout(tickTimer);
      tickTimer = setTimeout(function () { railThumb.classList.remove('is-tick'); }, 350);
    }
  }
  function onScroll() {
    if (!railTicking) { railTicking = true; requestAnimationFrame(paintRail); }
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { mapAnchors(); paintRail(); }, 180);
  });
  window.addEventListener('load', function () { mapAnchors(); paintRail(); });
  mapAnchors(); paintRail();

  /* ---------- hero band read-in: stagger indices for the cell tick ---------- */
  $$('#heroStrip .band-cells li').forEach(function (li, i) {
    li.style.setProperty('--i', i);
  });

  /* ---------- lamination sheen follows the pointer ---------- */
  if (!reduceMotion && window.matchMedia('(pointer: fine)').matches) {
    doc.addEventListener('pointermove', function (e) {
      $$('.band-sheen').forEach(function (band) {
        var r = band.getBoundingClientRect();
        if (r.bottom < -80 || r.top > window.innerHeight + 80) return;
        band.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
        band.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
      });
    }, { passive: true });
  }

  /* ---------- reveals (IO + fallback for backgrounded tabs) ---------- */
  var reveals = $$('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
    setTimeout(function () {           // background-tab safety: above-the-fold never stays hidden
      reveals.forEach(function (el) {
        if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('is-in');
      });
    }, 2500);
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- evenness dial counts up when seen ---------- */
  var scoreEl = $('#evenScore');
  var arcEl = $('#evenArc');
  var numEl = $('#evenNum');
  var SCORE = 94, CIRC = 175.9;
  function playScore() {
    if (reduceMotion) {
      numEl.textContent = SCORE;
      arcEl.style.strokeDashoffset = CIRC * (1 - SCORE / 100);
      return;
    }
    arcEl.style.strokeDashoffset = CIRC * (1 - SCORE / 100);
    var t0 = performance.now();
    (function step(t) {
      var p = Math.min(1, (t - t0) / 1300);
      numEl.textContent = Math.round(SCORE * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }
  if (scoreEl) {
    if ('IntersectionObserver' in window) {
      var sio = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { playScore(); sio.disconnect(); }
      }, { threshold: 0.6 });
      sio.observe(scoreEl);
      setTimeout(function () {
        if (numEl.textContent === '0' && scoreEl.getBoundingClientRect().top < window.innerHeight) {
          playScore(); sio.disconnect();
        }
      }, 3000);
    } else { playScore(); }
  }

  /* ---------- splits: tap support for the delta chips ---------- */
  $$('#splitTable tbody tr').forEach(function (tr) {
    tr.addEventListener('click', function () {
      var was = tr.classList.contains('is-hot');
      $$('#splitTable tbody tr').forEach(function (r) { r.classList.remove('is-hot'); });
      if (!was) tr.classList.add('is-hot');
    });
  });

  /* ---------- training weeks ---------- */
  $$('.week-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      btn.closest('.week').classList.toggle('is-open', !open);
    });
  });

  /* ---------- the pace-band builder ---------- */
  var builder = $('#builder');
  var goalInput = $('#goalTime');
  var goalHint = $('#goalHint');
  var buildBtn = $('#buildBtn');
  var buildLabel = $('.b-go-label', buildBtn);
  var result = $('#bandResult');
  var emptyState = $('#bandEmpty');
  var ghostBand = $('.band-ghost', emptyState);
  var HINT_DEFAULT = goalHint.textContent;
  var STORE_KEY = 'even.band.v1';
  var DIST_NAME = { '5': '5 K', '10': '10 K', '21.0975': 'Half marathon', '42.195': 'Marathon' };

  function setHint(msg, isError) {
    goalHint.textContent = msg;
    goalHint.classList.toggle('is-error', !!isError);
    goalInput.setAttribute('aria-invalid', isError ? 'true' : 'false');
  }

  function parseTime(raw) {
    var m = /^(\d{1,2})(?::([0-5]?\d))?(?::([0-5]?\d))?$/.exec(raw.trim());
    if (!m) return null;
    if (m[3] !== undefined) return (+m[1]) * 3600 + (+m[2]) * 60 + (+m[3]);
    if (m[2] !== undefined) return (+m[1]) * 60 + (+m[2]);
    return (+m[1]) * 60;
  }

  function buildSplits(distKm, totalSec, strat) {
    var whole = Math.floor(distKm);
    var per = totalSec / distKm;
    var weights = [], i, sum = 0;
    for (i = 0; i < whole; i++) {
      var f = 0;
      if (strat === 'neg' && whole > 1) f = 0.02 - 0.04 * (i / (whole - 1)); // +2% → −2%
      weights.push(per * (1 + f));
    }
    var rows = [], cum = 0, prevCum = 0;
    for (i = 0; i < whole; i++) {
      cum += weights[i];
      var cumR = Math.round(cum);
      rows.push({ km: i + 1, split: cumR - prevCum, cum: cumR });
      prevCum = cumR;
    }
    return rows;
  }

  function renderBand(distKm, totalSec, strat) {
    var rows = buildSplits(distKm, totalSec, strat);
    var name = DIST_NAME[String(distKm)] || distKm + ' km';
    var avg = fmtClock(totalSec / distKm);
    var cells = rows.map(function (r) {
      return '<li><span>km ' + r.km + '</span><strong>' + fmtClock(r.split) +
        '</strong><em>' + fmtClock(r.cum) + '</em></li>';
    }).join('');
    var out = doc.createElement('div');
    out.className = 'b-out';
    out.innerHTML =
      '<div class="b-out-head"><h3></h3><p></p></div>' +
      '<div class="band band-sheen" id="printBand">' +
        '<div class="band-clasp"><span class="band-title"></span><span class="band-goal">' + fmtClock(totalSec) + '</span></div>' +
        '<ol class="band-cells">' + cells + '</ol>' +
        '<div class="band-clasp band-clasp-end"><span class="band-title">FINISH</span><span class="band-goal">' + avg + '&nbsp;/km</span></div>' +
      '</div>' +
      '<div class="b-actions">' +
        '<button class="btn btn-solid btn-sm" type="button" id="printBtn">' +
          '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 8V3h10v5M7 17H4a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-3M7 14h10v7H7z"/></svg>' +
          'Print the band</button>' +
        '<button class="btn btn-ghost btn-sm" type="button" id="copyBtn">' +
          '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>' +
          'Copy the splits</button>' +
      '</div>' +
      '<p class="b-note">Trim at the clasps, fold, tape it on the inside of your wrist. Laminate if it might rain — it might rain.</p>';
    $('h3', out).textContent = name + ' · ' + fmtClock(totalSec);
    $('.b-out-head p', out).textContent =
      (strat === 'neg' ? 'gentle negative — first kays relaxed, last kays honest' : 'dead even — ' + avg + ' every kilometre');
    $('.band-title', out).textContent = name.toUpperCase().replace(/\s/g, ' ');

    result.innerHTML = '';
    result.appendChild(out);

    $('#printBtn').addEventListener('click', function () {
      doc.body.classList.add('print-band');
      window.print();
    });
    window.addEventListener('afterprint', function () { doc.body.classList.remove('print-band'); });

    $('#copyBtn').addEventListener('click', function () {
      var text = name + ' — goal ' + fmtClock(totalSec) + '\n' +
        rows.map(function (r) { return 'km ' + r.km + '  ' + fmtClock(r.split) + '  (' + fmtClock(r.cum) + ')'; }).join('\n');
      var btn = $('#copyBtn');
      function done() {
        var label = btn.lastChild;
        label.textContent = 'Copied';
        setTimeout(function () { label.textContent = 'Copy the splits'; }, 1800);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, done);
      } else { done(); }
    });
  }

  function submitBand() {
    var distKm = parseFloat(builder.dist.value);
    var strat = builder.strat.value;
    var raw = goalInput.value;
    if (!raw.trim()) { setHint('Give it a goal — like 52:30.', true); goalInput.focus(); return; }
    var totalSec = parseTime(raw);
    if (totalSec === null) { setHint('That doesn’t read as a time. Try 52:30, or 1:55:00.', true); goalInput.focus(); return; }
    var pace = totalSec / distKm;
    if (pace < 170) { setHint('That’s ' + fmtClock(pace) + '/km — a world-class day. Check the time?', true); goalInput.focus(); return; }
    if (pace > 750) { setHint('That’s a lovely walk, not a race pace. Check the time?', true); goalInput.focus(); return; }
    setHint(HINT_DEFAULT, false);

    buildBtn.classList.add('is-busy');
    buildBtn.setAttribute('disabled', '');
    buildLabel.textContent = 'Setting splits…';
    if (ghostBand) ghostBand.classList.add('is-building');

    setTimeout(function () {
      renderBand(distKm, totalSec, strat);
      buildBtn.classList.remove('is-busy');
      buildBtn.removeAttribute('disabled');
      buildLabel.textContent = 'Set my splits';
      var name = DIST_NAME[String(distKm)] || distKm + ' km';
      toast('Band ready — ' + name + ' at ' + fmtClock(totalSec / distKm) + '/km.');
      try { localStorage.setItem(STORE_KEY, JSON.stringify({ d: String(distKm), t: raw.trim(), s: strat })); } catch (e) {}
    }, reduceMotion ? 60 : 950);
  }

  builder.addEventListener('submit', function (e) { e.preventDefault(); submitBand(); });
  goalInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); submitBand(); }
  });
  goalInput.addEventListener('input', function () {
    if (goalHint.classList.contains('is-error')) setHint(HINT_DEFAULT, false);
  });

  /* last band → restore chip in the empty state */
  try {
    var saved = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
    if (saved && saved.d && saved.t) {
      var chip = doc.createElement('button');
      chip.type = 'button';
      chip.className = 'restore';
      chip.innerHTML = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5"/></svg><span></span>';
      chip.lastElementChild.textContent =
        'Last time: ' + (DIST_NAME[saved.d] || saved.d + ' km') + ' in ' + saved.t + ' — rebuild it';
      chip.addEventListener('click', function () {
        var radio = builder.querySelector('input[name="dist"][value="' + saved.d + '"]');
        if (radio) radio.checked = true;
        var sradio = builder.querySelector('input[name="strat"][value="' + (saved.s || 'even') + '"]');
        if (sradio) sradio.checked = true;
        goalInput.value = saved.t;
        submitBand();
      });
      emptyState.appendChild(chip);
    }
  } catch (e) {}

  /* ---------- plan buttons ---------- */
  $$('.plan-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var old = btn.textContent;
      btn.setAttribute('disabled', '');
      btn.textContent = 'One second…';
      setTimeout(function () {
        btn.removeAttribute('disabled');
        btn.textContent = old;
        toast(btn.dataset.plan === 'EVEN Club'
          ? 'Club trial noted — grab EVEN on the App Store or Google Play to start.'
          : 'Good call — EVEN is free on the App Store and Google Play.');
      }, reduceMotion ? 60 : 650);
    });
  });
})();

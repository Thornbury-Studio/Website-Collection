/* COL NOIR — pass desk. Seven days ahead, each carrying its own forecast
   bulletin from the model; price follows conditions honestly (a likely
   wind-hold day is discounted and says why). Issued passes render as
   canvas cards with a seeded gate code and persist in
   colnoir.passes.v1 on this device. */
(function () {
  'use strict';
  var CN = window.CN, U = window.CNUI;
  var $ = function (id) { return document.getElementById(id); };
  var KEY = 'colnoir.passes.v1';
  var BASE_CHF = 72;
  var DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function loadW() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } }
  function saveW(w) { try { localStorage.setItem(KEY, JSON.stringify(w)); } catch (e) { /* private mode */ } }

  /* per-day forecast + honest price */
  function dayInfo(off) {
    var m = CN.forOffset(off);
    var holds = m.lifts.filter(function (l) { return l.state === 'hold' || l.state === 'closed'; }).length;
    var factor = 1;
    var flag = '';
    if (holds >= 4) { factor = 0.55; flag = 'Storm risk — upper cables likely held'; }
    else if (holds >= 2) { factor = 0.8; flag = 'Wind watch on the top cables'; }
    else if (m.snow24 >= 20) { flag = m.snow24 + ' cm forecast — expect first-bin queues'; }
    return { m: m, price: Math.round(BASE_CHF * factor), factor: factor, flag: flag, holds: holds };
  }
  var DAYS = [];
  for (var i = 1; i <= 7; i++) DAYS.push(dayInfo(i));

  /* ---------------- day strip ---------------- */
  var sel = 0;
  var strip = $('dayStrip');
  strip.innerHTML = DAYS.map(function (d, i) {
    var dt = d.m.date;
    return '<button class="day" type="button" aria-pressed="' + (i === sel) + '">' +
      '<span class="dow">' + DOW[dt.getDay()] + ' · ' + MON[dt.getMonth()] + '</span>' +
      '<span class="dnum">' + dt.getDate() + '</span>' +
      '<span class="dmeta"><i class="dd l' + d.m.danger.max + '"></i>DGR ' + d.m.danger.max +
      '<br>' + d.m.snow24 + ' cm new<br>' + d.m.weather.dir + ' ' + d.m.weather.wind + ' km/h' +
      '<br><b style="font-weight:500;color:inherit;">CHF ' + d.price + '</b>' +
      (d.factor < 1 ? ' · −' + Math.round((1 - d.factor) * 100) + '%' : '') + '</span>' +
      '</button>';
  }).join('');
  var dayBtns = Array.prototype.slice.call(strip.children);
  dayBtns.forEach(function (b, i) {
    b.addEventListener('click', function () {
      sel = i;
      dayBtns.forEach(function (x, j) { x.setAttribute('aria-pressed', String(j === i)); });
      paintPrice();
    });
  });

  /* ---------------- form ---------------- */
  var qty = 1;
  var CATF = { adult: 1, youth: 0.6, dawn: 0.55 };
  function unit() { return Math.round(DAYS[sel].price * CATF[$('pfCat').value]); }
  function total() { return unit() * qty; }
  function paintPrice() {
    var d = DAYS[sel];
    $('pfGo').textContent = 'Issue — CHF ' + total();
    var noted = $('passNoted');
    if (d.flag) {
      noted.hidden = false;
      noted.innerHTML = DOW[d.m.date.getDay()] + ' ' + d.m.date.getDate() + ' — <span class="code">' + (d.factor < 1 ? 'PRICED DOWN' : 'NOTE') + '</span> · ' + d.flag + '.';
    } else { noted.hidden = true; }
  }
  Array.prototype.forEach.call(document.querySelectorAll('.count button'), function (b) {
    b.addEventListener('click', function () {
      qty = U.clamp(qty + parseInt(b.getAttribute('data-d'), 10), 1, 6);
      $('pfQty').textContent = qty;
      document.querySelector('.count button[data-d="-1"]').disabled = qty === 1;
      document.querySelector('.count button[data-d="1"]').disabled = qty === 6;
      paintPrice();
    });
  });
  $('pfCat').addEventListener('change', paintPrice);
  paintPrice();

  function check(input, fn, msg) {
    var field = input.closest('.field');
    var err = field.querySelector('.field-err');
    if (!fn(input.value)) { field.classList.add('err'); err.textContent = msg; return false; }
    field.classList.remove('err'); err.textContent = '';
    return true;
  }

  $('passForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var nm = $('pfName'), em = $('pfEmail');
    var ok = true;
    ok = check(nm, function (v) { return v.trim().length >= 2; }, 'The gate reads a name off every pass.') && ok;
    ok = check(em, function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); }, 'Receipts need a working address.') && ok;
    if (!ok) return;
    var d = DAYS[sel];
    var w = loadW();
    var code = 'CN-' + (CN.fnv(d.m.dateStr + em.value.trim() + w.length) % 90000 + 10000);
    w.push({
      code: code, name: nm.value.trim(), email: em.value.trim(),
      date: d.m.dateStr, cat: $('pfCat').value, qty: qty,
      chf: total(), danger: d.m.danger.max, snow: d.m.snow24,
      wind: d.m.weather.dir + ' ' + d.m.weather.wind
    });
    saveW(w);
    U.beep();
    var noted = $('passNoted');
    noted.hidden = false;
    noted.innerHTML = 'Issued. ' + qty + (qty > 1 ? ' passes' : ' pass') + ' for ' +
      DOW[d.m.date.getDay()] + ' ' + d.m.date.getDate() + ' ' + MON[d.m.date.getMonth()] +
      ' under <span class="code">' + code + '</span> — CHF ' + total() +
      '. It is in your wallet below; the gate reads the code, not paper.';
    renderWallet();
    document.getElementById('wallet').scrollIntoView({ behavior: U.reduced ? 'auto' : 'smooth', block: 'center' });
  });

  /* ---------------- pass card drawing ---------------- */
  function drawCard(cv, p) {
    var W = 640, H = 360;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = W * dpr; cv.height = H * dpr;
    var c = cv.getContext('2d');
    c.scale(dpr, dpr);
    c.fillStyle = '#ffffff'; c.fillRect(0, 0, W, H);
    /* header bar */
    c.fillStyle = '#16181a'; c.fillRect(0, 0, W, 64);
    c.fillStyle = '#f5f6f4';
    c.font = '900 26px Archivo, sans-serif';
    c.fillText('COL NOIR', 24, 42);
    c.fillStyle = '#d8272c'; c.fillRect(162, 22, 4, 24);
    c.fillStyle = '#9aa3a6';
    c.font = '11px "Chivo Mono", monospace';
    c.fillText('DAY PASS · 1 840 – 3 260 M', 180, 40);
    /* holder + date */
    c.fillStyle = '#667074'; c.font = '10px "Chivo Mono", monospace';
    c.fillText('HOLDER', 24, 100);
    c.fillStyle = '#16181a'; c.font = '700 24px Archivo, sans-serif';
    c.fillText(p.name.toUpperCase().slice(0, 24), 24, 128);
    c.fillStyle = '#667074'; c.font = '10px "Chivo Mono", monospace';
    c.fillText('VALID', 24, 168);
    c.fillStyle = '#16181a'; c.font = '500 16px "Chivo Mono", monospace';
    var dt = new Date(p.date + 'T12:00:00');
    c.fillText(DOW[dt.getDay()].toUpperCase() + ' ' + dt.getDate() + ' ' + MON[dt.getMonth()].toUpperCase() + ' · 08:30–16:00', 24, 190);
    c.fillStyle = '#667074'; c.font = '10px "Chivo Mono", monospace';
    c.fillText('CATEGORY', 24, 228);
    c.fillStyle = '#16181a'; c.font = '500 14px "Chivo Mono", monospace';
    c.fillText((p.cat === 'dawn' ? 'DAWN PATROL' : p.cat.toUpperCase()) + (p.qty > 1 ? ' × ' + p.qty : ''), 24, 248);
    c.fillStyle = '#667074'; c.font = '10px "Chivo Mono", monospace';
    c.fillText('FORECAST AT ISSUE', 24, 286);
    c.fillStyle = '#16181a'; c.font = '500 12px "Chivo Mono", monospace';
    c.fillText('DGR ' + p.danger + ' · ' + p.snow + 'CM NEW · ' + p.wind + ' KM/H', 24, 305);
    /* seeded gate matrix (aztec-ish) */
    var rng = CN.mulberry(CN.fnv(p.code));
    var mx = 420, my = 92, cell = 11, n = 16;
    for (var y = 0; y < n; y++) {
      for (var x = 0; x < n; x++) {
        var edge = x === 0 || y === 0 || x === n - 1 || y === n - 1;
        var onp = edge ? (x + y) % 2 === 0 : rng() > 0.52;
        if (onp) { c.fillStyle = '#16181a'; c.fillRect(mx + x * cell, my + y * cell, cell - 1, cell - 1); }
      }
    }
    c.fillStyle = '#d8272c';
    c.fillRect(mx + 7 * cell, my + 7 * cell, cell * 2 - 1, cell * 2 - 1);
    c.fillStyle = '#16181a'; c.font = '500 13px "Chivo Mono", monospace';
    c.fillText(p.code, mx, my + n * cell + 24);
    c.fillStyle = '#667074'; c.font = '10px "Chivo Mono", monospace';
    c.fillText('CHF ' + p.chf, mx, my + n * cell + 44);
    /* punched corner */
    c.fillStyle = '#f5f6f4';
    c.beginPath(); c.arc(W, H, 26, 0, 6.2832); c.fill();
  }

  function renderWallet() {
    var w = loadW();
    var wallet = $('wallet');
    $('walletEmpty').style.display = w.length ? 'none' : '';
    $('walletAside').textContent = w.length ? w.length + (w.length > 1 ? ' passes' : ' pass') + ' on this device' : 'Stored on this device';
    wallet.innerHTML = '';
    w.forEach(function (p, i) {
      var el = document.createElement('div');
      el.className = 'passcard rise lit';
      var cv = document.createElement('canvas');
      cv.setAttribute('role', 'img');
      cv.setAttribute('aria-label', 'Day pass ' + p.code + ' for ' + p.name + ', ' + p.date);
      el.appendChild(cv);
      var foot = document.createElement('div');
      foot.className = 'passcard-foot';
      foot.innerHTML = '<span>' + p.code + '</span>';
      var rel = document.createElement('button');
      rel.type = 'button';
      rel.textContent = 'Release · refund CHF ' + p.chf;
      rel.addEventListener('click', function () {
        var w2 = loadW();
        w2.splice(i, 1);
        saveW(w2);
        var noted = $('passNoted');
        noted.hidden = false;
        noted.innerHTML = 'Released. <span class="code">' + p.code + '</span> refunded CHF ' + p.chf + ' to the card that paid.';
        renderWallet();
      });
      foot.appendChild(rel);
      el.appendChild(foot);
      wallet.appendChild(el);
      /* draw after fonts settle so the card uses the real faces */
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () { drawCard(cv, p); });
      } else drawCard(cv, p);
    });
  }
  renderWallet();

  U.setWind(CN.today().weather.wind);
  U.rise();
  U.video(document);
})();

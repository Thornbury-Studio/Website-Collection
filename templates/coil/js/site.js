/* COIL — one oolong, one tin.
   Every number on the page comes from CATALOGUE and STEEPS below and is written
   into [data-fig] / [data-steep-time] / [data-steep-words]. The HTML carries the
   same values as a no-JS fallback; tools/check-figs.mjs fails if they drift. */
(function () {
  'use strict';

  var CATALOGUE = {
    price: 42,            // S$ per tin
    grams: 75,            // per tin
    dose: 5,              // g per session
    water: 300,           // ml per session
    temp: 95,             // °C
    altitude: 1000,       // m, the garden in Lugu
    harvest: 'Spring 2026',
    subOff: 0.10,         // subscription discount
    subWeeks: 6,
    postage: 4,           // S$, free from `freeFrom` tins or on a subscription
    freeFrom: 2,
    maxQty: 6,
    email: 'orders@coiltea.sg'
  };

  // One session, western style. The second steep is SHORTER than the first:
  // the rolled leaf spends the first pour opening, then gives faster.
  var STEEPS = [
    { secs: 240 },
    { secs: 180 },
    { secs: 210 },
    { secs: 270 },
    { secs: 360 }
  ];

  var C = CATALOGUE;
  var steeps = STEEPS.length;
  var sessions = C.grams / C.dose;
  var cups = sessions * steeps;
  var subPrice = round2(C.price * (1 - C.subOff));

  function round2(n) { return Math.round(n * 100) / 100; }
  // Prices are Singapore dollars, said once on the page. "S$" is not used:
  // Anybody's dollar is an S with a hairline, so "S$42" reads as "SS42".
  function money(n, dp) {
    var d = dp === 2 || n % 1 ? 2 : 0;
    return new Intl.NumberFormat('en-SG', { style: 'currency', currency: 'SGD', minimumFractionDigits: d, maximumFractionDigits: d }).format(n);
  }
  function thousands(n) { return new Intl.NumberFormat('en-SG').format(n); }
  function clock(secs) { var m = Math.floor(secs / 60), s = secs % 60; return m + ':' + (s < 10 ? '0' : '') + s; }
  var WORDS = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];
  function minutesWords(secs) {
    var m = Math.floor(secs / 60), half = secs % 60 === 30;
    return WORDS[m] + (half ? ' and a half minutes' : (m === 1 ? ' minute' : ' minutes'));
  }

  var FIGS = {
    'price': money(C.price),
    'price-2dp': money(C.price, 2),
    'sub-price': money(subPrice, 2),
    'sub-off': Math.round(C.subOff * 100) + '%',
    'sub-weeks': String(C.subWeeks),
    'grams': String(C.grams),
    'dose': C.dose + ' g',
    'water': C.water + ' ml',
    'temp': C.temp + ' °C',
    'altitude': thousands(C.altitude),
    'harvest': C.harvest,
    'steeps': String(steeps),
    'sessions': String(sessions),
    'cups': String(cups),
    'per-cup': money(round2(C.price / cups), 2),
    'postage': money(C.postage),
    'free-from': C.freeFrom + ' tins',
    'max-qty': String(C.maxQty),
    'email': C.email
  };

  function renderFigures() {
    document.querySelectorAll('[data-fig]').forEach(function (el) {
      var v = FIGS[el.getAttribute('data-fig')];
      if (v !== undefined) el.textContent = v;
    });
    document.querySelectorAll('[data-fig-href="email"]').forEach(function (el) {
      el.setAttribute('href', 'mailto:' + C.email);
    });
    document.querySelectorAll('[data-steep-time]').forEach(function (el) {
      var s = STEEPS[+el.getAttribute('data-steep-time') - 1];
      if (s) el.textContent = clock(s.secs);
    });
    document.querySelectorAll('[data-steep-words]').forEach(function (el) {
      var s = STEEPS[+el.getAttribute('data-steep-words') - 1];
      if (s) el.textContent = minutesWords(s.secs);
    });
    var qty = document.getElementById('qty');
    if (qty) qty.max = String(C.maxQty);
  }

  /* ---------- the uncoil ----------
     When a steep's heading first comes into view, a copy of it is laid over the
     real one and run from the previous steep's width and weight to its own. The
     real heading keeps its final layout the whole time, so nothing below moves,
     and it stays in the accessibility tree (it is only made transparent). */
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  function uncoil(el) {
    if (reduce.matches || el.getAttribute('data-uncoiled')) return;
    el.setAttribute('data-uncoiled', '1');
    var ghost = document.createElement('span');
    ghost.className = 'uncoil is-from';
    ghost.setAttribute('aria-hidden', 'true');
    ghost.textContent = el.textContent;
    el.appendChild(ghost);
    el.classList.add('is-uncoiling');
    var done = false;
    function finish() {
      if (done) return;
      done = true;
      el.classList.remove('is-uncoiling');
      if (ghost.parentNode) ghost.parentNode.removeChild(ghost);
    }
    void ghost.offsetWidth;                    // commit the narrow cut before transitioning
    requestAnimationFrame(function () {
      ghost.classList.remove('is-from');
      ghost.addEventListener('transitionend', function (e) { if (e.propertyName === 'font-stretch') finish(); });
    });
    setTimeout(finish, 2600);                  // hidden tabs never fire transitionend
  }

  function watchUncoils() {
    var targets = document.querySelectorAll('.steep .h2, .buy .h2, .foot__word');
    if (!('IntersectionObserver' in window) || reduce.matches) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { uncoil(e.target); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -18% 0px', threshold: 0.6 });
    targets.forEach(function (t) {
      // anything already on screen at load stays still: motion only answers the reader arriving
      var r = t.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) { t.setAttribute('data-uncoiled', '1'); return; }
      io.observe(t);
    });
  }

  /* ---------- which steep you're in ---------- */
  function watchNav() {
    var links = Array.prototype.slice.call(document.querySelectorAll('[data-nav]'));
    if (!links.length || !('IntersectionObserver' in window)) return;
    var sections = links.map(function (a) { return document.querySelector(a.getAttribute('href')); });
    var visible = {};
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { visible[e.target.id] = e.isIntersecting; });
      var here = null;
      sections.forEach(function (s) { if (s && visible[s.id]) here = s.id; });
      links.forEach(function (a) { a.classList.toggle('is-here', a.getAttribute('href') === '#' + here); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { if (s) io.observe(s); });
  }

  /* ---------- order ---------- */
  function watchOrder() {
    var form = document.querySelector('[data-order]');
    if (!form) return;
    var qty = form.querySelector('#qty');
    var status = form.querySelector('[data-order-status]');
    var out = {
      line: form.querySelector('[data-sum-line]'),
      sub: form.querySelector('[data-sum-sub]'),
      post: form.querySelector('[data-sum-post]'),
      total: form.querySelector('[data-sum-total]')
    };

    function read() {
      var n = parseInt(qty.value, 10);
      if (!isFinite(n)) n = 1;
      n = Math.max(1, Math.min(C.maxQty, n));
      var freq = (form.querySelector('input[name="freq"]:checked') || {}).value || 'once';
      var each = freq === 'sub' ? subPrice : C.price;
      var sub = round2(each * n);
      var post = freq === 'sub' || n >= C.freeFrom ? 0 : C.postage;
      return { n: n, freq: freq, each: each, sub: sub, post: post, total: round2(sub + post) };
    }

    function render() {
      var o = read();
      out.line.textContent = o.n + (o.n === 1 ? ' tin' : ' tins') + ' × ' + money(o.each, 2);
      out.sub.textContent = money(o.sub, 2);
      out.post.textContent = o.post ? money(o.post, 2) : 'Free';
      out.total.textContent = money(o.total, 2) + (o.freq === 'sub' ? ' every ' + C.subWeeks + ' weeks' : '');
      form.querySelector('[data-step="-1"]').disabled = o.n <= 1;
      form.querySelector('[data-step="1"]').disabled = o.n >= C.maxQty;
      status.textContent = '';
      return o;
    }

    form.addEventListener('click', function (e) {
      var b = e.target.closest('[data-step]');
      if (!b) return;
      var n = read().n + parseInt(b.getAttribute('data-step'), 10);
      qty.value = String(Math.max(1, Math.min(C.maxQty, n)));
      render();
    });
    form.addEventListener('change', render);
    qty.addEventListener('input', render);
    qty.addEventListener('blur', function () { qty.value = String(read().n); render(); });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      qty.value = String(read().n);
      var o = render();
      var lines = [
        'Hello COIL,', '',
        'I would like to order:',
        o.n + ' x ' + C.grams + ' g tin (' + C.harvest + ') at ' + money(o.each, 2) +
          (o.freq === 'sub' ? ', every ' + C.subWeeks + ' weeks' : ', once'),
        'Postage: ' + (o.post ? money(o.post, 2) : 'free'),
        'Total: ' + money(o.total, 2) + (o.freq === 'sub' ? ' per delivery' : ''),
        '', 'Deliver to:', '', 'Name:', 'Address:', 'Phone:'
      ];
      var href = 'mailto:' + C.email + '?subject=' + encodeURIComponent('Order: ' + o.n + (o.n === 1 ? ' tin' : ' tins') + ' of COIL') +
        '&body=' + encodeURIComponent(lines.join('\n'));
      window.location.href = href;
      status.textContent = 'Your email app should open with the order written out. Add your address and send it; we reply with payment details within one working day.';
    });

    render();
  }

  renderFigures();
  watchUncoils();
  watchNav();
  watchOrder();

  window.COIL = { CATALOGUE: CATALOGUE, STEEPS: STEEPS, FIGS: FIGS, cups: cups, sessions: sessions, uncoil: uncoil };
})();

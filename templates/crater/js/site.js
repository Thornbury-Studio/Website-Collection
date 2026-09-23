/* CRATER — one page, one clock.
   Every figure the page quotes comes from CATALOGUE (data-fig), every roast
   date from the Singapore calendar, and the bloom clock reads the film's own
   currentTime, so a stall stops the clock rather than letting it lie.
   ?today=YYYY-MM-DD pins the calendar for screenshots. */
(function () {
  'use strict';

  var doc = document;
  doc.documentElement.classList.add('js');
  function $(s, r) { return (r || doc).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); }

  var CATALOGUE = {
    price: 26,          // S$ per 250 g bag
    subOff: 0.10,       // subscription discount
    postage: 4,         // S$ per delivery under freeFrom bags
    freeFrom: 2,        // bags at which postage is free
    maxQty: 6,
    roastDay: 1,        // Monday
    email: 'orders@cratercoffee.sg'
  };

  var DURATION = 45;
  var PHASES = [
    { id: 'rise', name: 'Rise', from: 0, to: 10, say: 'Rise. The bed is swelling into a dome.', still: 'img/bloom-5-480.webp' },
    { id: 'crater', name: 'Crater', from: 10, to: 30, say: 'Crater. The dome is splitting open.', still: 'img/bloom-20-480.webp' },
    { id: 'settle', name: 'Settle', from: 30, to: 45, say: 'Settle. The bed is sinking.', still: 'img/bloom-40-480.webp' }
  ];
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------------------------------------------------------------- */
  /* Money and dates                                                   */
  /* ---------------------------------------------------------------- */

  function money(n) { return 'S$' + n.toFixed(2); }
  function moneyShort(n) { return n % 1 === 0 ? 'S$' + n : money(n); }

  // today's calendar date in Singapore, as a UTC-midnight Date
  function todaySG() {
    var pin = /[?&]today=(\d{4})-(\d{2})-(\d{2})/.exec(location.search);
    if (pin) return new Date(Date.UTC(+pin[1], +pin[2] - 1, +pin[3]));
    try {
      var parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Singapore', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
      var get = function (t) { return +parts.filter(function (p) { return p.type === t; })[0].value; };
      return new Date(Date.UTC(get('year'), get('month') - 1, get('day')));
    } catch (e) {
      var n = new Date();
      return new Date(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()));
    }
  }
  function addDays(d, n) { return new Date(d.getTime() + n * 864e5); }
  function fmtLong(d) { return new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long' }).format(d); }

  // orders taken today go into the next Monday's roast (a Monday order waits a week)
  var today = todaySG();
  var ahead = (CATALOGUE.roastDay - today.getUTCDay() + 7) % 7 || 7;
  var roast = addDays(today, ahead);
  var ship = addDays(roast, 1);

  var FIGS = {
    'price': moneyShort(CATALOGUE.price),
    'price-2dp': money(CATALOGUE.price),
    'sub-price': money(CATALOGUE.price * (1 - CATALOGUE.subOff)),
    'sub-off': Math.round(CATALOGUE.subOff * 100) + '%',
    'free-from': CATALOGUE.freeFrom + ' bags',
    'roast': fmtLong(roast),
    'ship': fmtLong(ship)
  };
  $$('[data-fig]').forEach(function (el) {
    var v = FIGS[el.getAttribute('data-fig')];
    if (v != null) el.textContent = v;
  });

  /* ---------------------------------------------------------------- */
  /* Header                                                            */
  /* ---------------------------------------------------------------- */

  var top = $('[data-top]');
  function onScroll() { top.classList.toggle('is-scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------------------------------------------------------------- */
  /* The bloom                                                         */
  /* ---------------------------------------------------------------- */

  var bloom = $('#bloom');
  var film = $('[data-film]');
  var still = $('[data-still]');
  var btn = $('[data-pour]');
  var btnLabel = $('[data-pour-label]');
  var clock = $('[data-clock]');
  var digits = $$('.clock__d', clock);
  var note = $('[data-note]');
  var status = $('[data-status]');
  var ruler = $('[data-ruler]');
  var phaseEls = $$('[data-phase]');
  var chip = $('[data-chip]');
  var chipClock = $('[data-chip-clock]');
  var chipPhase = $('[data-chip-phase]');

  // With JS the page drives the film; without it the native controls stay.
  film.removeAttribute('controls');
  btn.hidden = false;
  phaseEls.forEach(function (li) {
    var bar = doc.createElement('span');
    bar.className = 'phase__bar';
    bar.setAttribute('aria-hidden', 'true');
    li.appendChild(bar);
  });

  var state = 'idle';          // idle | running | paused | done
  var fallback = false;        // true when the film cannot play: wall clock + stills
  var filmBroken = false;      // a source failed before anyone pressed Pour
  var wallStart = 0, wallOffset = 0, pouredAt = 0;
  var lastShown = '', lastPhase = null, raf = 0;

  function now() {
    if (!fallback) return film.currentTime || 0;
    return state === 'running' ? wallOffset + (performance.now() - wallStart) / 1000 : wallOffset;
  }
  function phaseAt(t) {
    for (var i = 0; i < PHASES.length; i++) if (t < PHASES[i].to) return PHASES[i];
    return PHASES[PHASES.length - 1];
  }
  function fmt(t) {
    var s = Math.min(DURATION, Math.floor(t + 1e-6));
    return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2);
  }

  function setClock(text) {
    if (text === lastShown) return;
    var chars = text.replace(':', '').split('');
    var prev = lastShown.replace(':', '').split('');
    digits.forEach(function (d, i) {
      if (chars[i] === d.textContent) return;
      d.textContent = chars[i];
      if (prev.length && !reduceMotion.matches) {
        d.classList.remove('tick');
        void d.offsetWidth;
        d.classList.add('tick');
      }
    });
    chipClock.textContent = text;
    lastShown = text;
  }

  function render() {
    var t = Math.min(DURATION, now());
    var p = t / DURATION;
    setClock(fmt(t));
    ruler.style.setProperty('--p', p.toFixed(4));
    var ph = phaseAt(t);
    phaseEls.forEach(function (li) {
      var from = +li.getAttribute('data-from'), to = +li.getAttribute('data-to');
      var lp = Math.max(0, Math.min(1, (t - from) / (to - from)));
      li.style.setProperty('--lp', lp.toFixed(4));
      li.classList.toggle('is-now', state !== 'idle' && state !== 'done' && li.getAttribute('data-phase') === ph.id);
      li.classList.toggle('is-past', state !== 'idle' && (t >= to || state === 'done'));
    });
    if (state !== 'idle' && ph !== lastPhase) {
      lastPhase = ph;
      if (state !== 'done') {
        announce(ph.say);
        note.textContent = ph.say;
      }
      chipPhase.textContent = ph.name;
      if (fallback) showStill(ph.still);
    }
  }

  function loop() {
    // the film never got going (no source the browser can play, or a dead
    // connection): keep the page's promise on the wall clock instead
    if (state === 'running' && !fallback && (film.currentTime || 0) < 0.05 && performance.now() - pouredAt > 5000) {
      film.pause();
      useFallback();
    }
    render();
    if (state === 'running' && fallback && now() >= DURATION) finish();
    if (state === 'running') raf = requestAnimationFrame(loop);
  }

  function announce(text) {
    status.textContent = '';
    window.setTimeout(function () { status.textContent = text; }, 60);
  }

  function setState(s) {
    state = s;
    bloom.classList.toggle('is-started', s !== 'idle');
    bloom.classList.toggle('is-running', s === 'running');
    bloom.classList.toggle('is-paused', s === 'paused');
    bloom.classList.toggle('is-done', s === 'done');
    btnLabel.textContent = s === 'running' ? 'Pause' : s === 'paused' ? 'Resume' : s === 'done' ? 'Pour again' : 'Pour';
    btn.setAttribute('aria-pressed', s === 'running' ? 'true' : 'false');
    chip.classList.toggle('is-done', s === 'done');
    updateChip();
  }

  function showStill(src) {
    still.src = src;
    still.hidden = false;
  }

  function useFallback() {
    if (fallback) return;
    fallback = true;
    wallOffset = Math.min(DURATION, film.currentTime || 0);
    wallStart = performance.now();
    showStill(phaseAt(wallOffset).still);
    if (state === 'running') note.textContent = phaseAt(wallOffset).say;
  }

  function start(fromZero) {
    cancelAnimationFrame(raf);
    if (!fallback && (filmBroken || film.error || film.networkState === 3)) useFallback();
    pouredAt = performance.now();
    if (fromZero) {
      lastPhase = null;
      wallOffset = 0;
      if (!fallback) { try { film.currentTime = 0; } catch (e) { /* not loaded yet */ } }
    }
    setState('running');
    if (fallback) {
      wallStart = performance.now();
      if (fromZero) showStill(PHASES[0].still);
    } else {
      var p = film.play();
      if (p && typeof p.catch === 'function') p.catch(function () { useFallback(); loop(); });
    }
    loop();
  }

  function pause() {
    if (fallback) wallOffset = now();
    else film.pause();
    setState('paused');
    cancelAnimationFrame(raf);
    render();
    note.textContent = 'Paused at ' + fmt(now()) + '. The coffee wouldn’t wait, but we will.';
  }

  function finish() {
    cancelAnimationFrame(raf);
    if (fallback) wallOffset = DURATION;
    setState('done');
    render();
    setClock('0:45');
    ruler.style.setProperty('--p', '1');
    note.textContent = 'Settled. Now pour the rest.';
    chipPhase.textContent = 'Bloomed';
    announce('Forty-five seconds. The bloom has settled. Now pour the rest.');
  }

  btn.addEventListener('click', function () {
    if (state === 'running') pause();
    else if (state === 'paused') start(false);
    else start(true);
  });

  film.addEventListener('ended', function () { if (!fallback) finish(); });
  // <source> errors don't bubble, so listen in the capture phase
  film.addEventListener('error', function () {
    filmBroken = true;
    if (state === 'running' && !fallback) { film.pause(); useFallback(); }
  }, true);
  // a stall stops the clock with the picture; resuming picks it back up
  film.addEventListener('waiting', function () { if (state === 'running') note.textContent = 'Loading the film…'; });
  film.addEventListener('playing', function () { if (state === 'running' && lastPhase) note.textContent = lastPhase.say; });

  // warm the first seconds once the page has settled, so Pour starts at once
  window.addEventListener('load', function () {
    window.setTimeout(function () { if (state === 'idle' && film.preload === 'none') film.preload = 'metadata'; }, 1200);
  });

  // "Time it with the film" in the brew steps
  $$('[data-pour-link]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      bloom.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'start' });
      if (state !== 'running') start(state !== 'paused');
      btn.focus({ preventScroll: true });
    });
  });

  // the header chip carries the clock once the film is off screen
  var bloomVisible = true;
  function updateChip() { chip.hidden = state === 'idle' || bloomVisible; }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      bloomVisible = entries[0].isIntersecting;
      updateChip();
    }, { threshold: 0.15 }).observe($('.bloom__stage'));
  }

  render();

  /* ---------------------------------------------------------------- */
  /* The order                                                         */
  /* ---------------------------------------------------------------- */

  var form = $('[data-order]');
  var qty = $('#qty', form);
  var steps = $$('[data-step]', form);
  var done = $('[data-order-done]', form);
  var orderBtn = $('[data-order-btn]', form);
  var sum = {
    coffee: $('[data-sum="coffee"]', form),
    post: $('[data-sum="post"]', form),
    total: $('[data-sum="total"]', form)
  };

  function readOrder() {
    var n = parseInt(qty.value, 10);
    if (!isFinite(n)) n = 1;
    n = Math.max(1, Math.min(CATALOGUE.maxQty, n));
    var freq = form.elements.freq.value;
    var sub = freq !== 'once';
    var unit = CATALOGUE.price * (sub ? 1 - CATALOGUE.subOff : 1);
    var coffee = Math.round(unit * n * 100) / 100;
    var post = sub || n >= CATALOGUE.freeFrom ? 0 : CATALOGUE.postage;
    return {
      n: n, freq: freq, sub: sub, unit: unit, coffee: coffee, post: post,
      total: Math.round((coffee + post) * 100) / 100,
      grind: form.elements.grind.value
    };
  }

  function every(freq) { return freq === '2' ? 'every two weeks' : 'every four weeks'; }

  function renderOrder() {
    var o = readOrder();
    steps.forEach(function (b) {
      var d = +b.getAttribute('data-step');
      b.disabled = d < 0 ? o.n <= 1 : o.n >= CATALOGUE.maxQty;
    });
    sum.coffee.textContent = o.n + ' × ' + money(o.unit);
    sum.post.textContent = o.post ? money(o.post) : 'Free';
    sum.total.textContent = money(o.total) + (o.sub ? ' ' + every(o.freq) : '');
    orderBtn.textContent = o.sub ? 'Subscribe for ' + money(o.total) + ' a delivery' : 'Order for ' + money(o.total);
    done.hidden = true;
  }

  steps.forEach(function (b) {
    b.addEventListener('click', function () {
      var o = readOrder();
      qty.value = Math.max(1, Math.min(CATALOGUE.maxQty, o.n + +b.getAttribute('data-step')));
      renderOrder();
    });
  });
  qty.addEventListener('input', renderOrder);
  qty.addEventListener('change', function () { qty.value = readOrder().n; renderOrder(); });
  form.addEventListener('change', renderOrder);

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    qty.value = readOrder().n;
    renderOrder();
    var o = readOrder();
    var lines = [
      'Order for CRATER, from ' + fmtLong(roast) + '’s roast',
      '',
      o.n + (o.n === 1 ? ' bag' : ' bags') + ' of 250 g, ' + o.grind.toLowerCase(),
      o.sub ? 'Subscription: ' + every(o.freq) + ', ' + Math.round(CATALOGUE.subOff * 100) + '% off' : 'One delivery',
      'Coffee: ' + money(o.coffee),
      'Postage: ' + (o.post ? money(o.post) : 'free'),
      'Total: ' + money(o.total) + (o.sub ? ' per delivery' : ''),
      '',
      'Name:',
      'Delivery address:',
      'Phone:'
    ];
    var subject = (o.sub ? 'Subscription' : 'Order') + ' for ' + fmtLong(roast) + '’s roast';
    var mailto = 'mailto:' + CATALOGUE.email + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(lines.join('\n'));
    done.hidden = false;
    done.textContent = 'Your order is written out in a new email to ' + CATALOGUE.email + '. Add your address and send it; we reply with one payment link. If no email opened, write to us at that address.';
    var go = form.dispatchEvent(new CustomEvent('crater:order', { cancelable: true, detail: { mailto: mailto, order: o } }));
    if (go) window.location.href = mailto;
  });

  renderOrder();

  window.CRATER = { catalogue: CATALOGUE, roast: roast, readOrder: readOrder, state: function () { return { state: state, t: now(), fallback: fallback }; } };
})();

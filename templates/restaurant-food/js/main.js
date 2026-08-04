/* ============================================================
   EMBER — a wood-fire kitchen
   No dependencies. One rAF loop, IntersectionObserver reveals,
   and a canvas ember field that scales to the device.
   ============================================================ */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Shared with js/ember-3d.js. The WebGL coal reads its heat from here so the
  // object and the number beside it can never disagree.
  window.EMBER = window.EMBER || { heat: 1 };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };

  /* ----------------------------------------------------------
     Hero ignition
     A rAF callback never fires in a background tab, so pair it
     with a timeout — otherwise the headline stays hidden for
     anyone who opened the page in a background tab.
     ---------------------------------------------------------- */
  var hero = document.querySelector('.hero');
  var lit = false;
  function light() {
    if (lit || !hero) return;
    lit = true;
    hero.classList.add('is-lit');
  }
  requestAnimationFrame(function () { requestAnimationFrame(light); });
  setTimeout(light, 350);

  /* ----------------------------------------------------------
     Nav
     ---------------------------------------------------------- */
  var nav = document.getElementById('nav');
  function onNav() {
    if (!nav) return;
    nav.classList.toggle('is-stuck', window.scrollY > 40);
  }
  onNav();

  /* ----------------------------------------------------------
     Reveals
     ---------------------------------------------------------- */
  var revealables = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduced) {
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        ro.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
    revealables.forEach(function (el) { ro.observe(el); });
    // Safety net: anything still hidden after 2.5s gets shown anyway.
    setTimeout(function () {
      revealables.forEach(function (el) { el.classList.add('is-in'); });
    }, 2500);
  } else {
    revealables.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ----------------------------------------------------------
     Tables left tonight — stable for the whole day
     ---------------------------------------------------------- */
  var tablesLeft = document.getElementById('tablesLeft');
  if (tablesLeft) {
    var d = new Date();
    if (d.getDay() === 1) {
      // Monday: the kitchen is shut, so don't advertise tables for tonight.
      var chip = tablesLeft.closest('.hero-eyebrow');
      if (chip) {
        chip.innerHTML = '<span class="live-dot" aria-hidden="true"></span>' +
          'Closed Mondays — the fire is relit tomorrow at 16:00';
      }
    } else {
      tablesLeft.textContent = 2 + ((d.getDate() * 7 + d.getMonth() * 3) % 8);
    }
  }

  /* ----------------------------------------------------------
     Ember field
     Particles are seeded once; per frame each one gets a rise,
     one sine call for drift, and a fade. Nothing is allocated
     in the loop.
     ---------------------------------------------------------- */
  var canvas = document.getElementById('embers');
  var ctx = canvas && canvas.getContext ? canvas.getContext('2d') : null;
  var embers = [];
  var dpr = 1;
  var heroVisible = true;

  function emberBudget() {
    var w = window.innerWidth;
    var cores = navigator.hardwareConcurrency || 4;
    if (w < 620 || cores <= 4) return 34;
    if (w < 1100 || cores <= 8) return 62;
    return 90;
  }

  function sizeCanvas() {
    if (!canvas) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(canvas.offsetWidth * dpr);
    canvas.height = Math.floor(canvas.offsetHeight * dpr);
  }

  function seedEmbers() {
    if (!canvas) return;
    var n = emberBudget();
    embers.length = 0;
    for (var i = 0; i < n; i++) {
      embers.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: (Math.random() * 1.6 + 0.5) * dpr,
        v: (Math.random() * 0.42 + 0.16) * dpr,
        a: Math.random() * 0.55 + 0.15,
        p: Math.random() * Math.PI * 2,
        s: Math.random() * 0.018 + 0.006,
        w: Math.random() * 0.5 + 0.18,
        hot: Math.random() > 0.72
      });
    }
  }

  function drawEmbers() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (var i = 0; i < embers.length; i++) {
      var e = embers[i];
      e.y -= e.v;
      e.p += e.s;
      e.x += Math.sin(e.p) * e.w;

      if (e.y < -10) {
        e.y = canvas.height + Math.random() * 60;
        e.x = Math.random() * canvas.width;
      }

      var life = e.y / canvas.height;              // 1 at the bottom, 0 at the top
      var alpha = e.a * clamp(life * 1.35, 0, 1);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = e.hot ? '#ffd08a' : '#e8531f';
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r, 0, 6.2832);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  if (canvas && ctx && !reduced) {
    sizeCanvas();
    seedEmbers();
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        heroVisible = entries[0].isIntersecting;
      }, { threshold: 0 }).observe(canvas);
    }
  }

  /* ----------------------------------------------------------
     Hero parallax
     ---------------------------------------------------------- */
  var coals = document.getElementById('heroCoals');
  var sprigs = document.querySelectorAll('.sprig');
  var pointer = { x: 0, y: 0, tx: 0, ty: 0 };

  if (!reduced) {
    window.addEventListener('pointermove', function (ev) {
      pointer.tx = (ev.clientX / window.innerWidth - 0.5) * 2;
      pointer.ty = (ev.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });
  }

  /* ----------------------------------------------------------
     Heat gauge
     ---------------------------------------------------------- */
  var stages = Array.prototype.slice.call(document.querySelectorAll('.stage'));
  var gaugeNum = document.getElementById('gaugeNum');
  var gaugeLabel = document.getElementById('gaugeLabel');
  var targetTemp = 900;
  var shownTemp = 900;
  var activeStage = null;

  function pickStage() {
    if (!stages.length) return;
    var mid = window.innerHeight * 0.5;
    var best = null;
    var bestD = Infinity;
    for (var i = 0; i < stages.length; i++) {
      var r = stages[i].getBoundingClientRect();
      var d = Math.abs(r.top + r.height / 2 - mid);
      if (d < bestD) { bestD = d; best = stages[i]; }
    }
    if (best === activeStage) return;
    if (activeStage) activeStage.classList.remove('is-hot');
    activeStage = best;
    activeStage.classList.add('is-hot');
    targetTemp = parseFloat(activeStage.dataset.temp) || 900;
  }

  // The needle lags behind the target the way a real gauge does, so the label
  // has to follow the number that is actually on screen — otherwise you get
  // readings like "679°C / ASH" all the way through the transition.
  function labelFor(temp) {
    var best = '';
    var bestD = Infinity;
    for (var i = 0; i < stages.length; i++) {
      var d = Math.abs((parseFloat(stages[i].dataset.temp) || 0) - temp);
      if (d < bestD) { bestD = d; best = stages[i].dataset.label || ''; }
    }
    return best;
  }

  function paintGauge() {
    if (Math.abs(shownTemp - targetTemp) < 0.5) shownTemp = targetTemp;
    else shownTemp = lerp(shownTemp, targetTemp, 0.11);
    if (gaugeNum) gaugeNum.textContent = Math.round(shownTemp);
    if (gaugeLabel) {
      var lbl = labelFor(shownTemp);
      if (lbl !== gaugeLabel.textContent) gaugeLabel.textContent = lbl;
    }
    window.EMBER.heat = clamp((shownTemp - 60) / 880, 0, 1);
  }

  /* ----------------------------------------------------------
     Menu — tabs + the dish photograph that follows the cursor
     ---------------------------------------------------------- */
  var tabs = document.querySelectorAll('.mtab');
  var courses = document.querySelectorAll('.course');

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      var id = 'course-' + tab.dataset.course;
      tabs.forEach(function (t) {
        var on = t === tab;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      courses.forEach(function (c) {
        var on = c.id === id;
        c.classList.toggle('is-active', on);
        c.hidden = !on;
      });
      hidePeek();
    });
  });

  var peek = document.getElementById('dishPeek');
  var peekImg = document.getElementById('dishPeekImg');
  var peekOn = false;
  var peekPos = { x: 0, y: 0, tx: 0, ty: 0 };
  var canPeek = window.matchMedia('(hover: hover) and (pointer: fine)').matches && !reduced;

  function hidePeek() {
    peekOn = false;
    if (peek) peek.classList.remove('is-on');
  }

  if (canPeek && peek && peekImg) {
    document.querySelectorAll('.dish[data-img]').forEach(function (dish) {
      dish.addEventListener('pointerenter', function (ev) {
        peekImg.src = dish.dataset.img;
        peekPos.x = peekPos.tx = ev.clientX;
        peekPos.y = peekPos.ty = ev.clientY;
        // Place it before the class lands, or the first paint shows it at 0,0.
        peek.style.left = peekPos.x + 'px';
        peek.style.top = peekPos.y + 'px';
        peekOn = true;
        peek.classList.add('is-on');
      });
      dish.addEventListener('pointermove', function (ev) {
        peekPos.tx = ev.clientX;
        peekPos.ty = ev.clientY;
      });
      dish.addEventListener('pointerleave', hidePeek);
    });
    window.addEventListener('scroll', hidePeek, { passive: true });
  }

  /* ----------------------------------------------------------
     Counters
     ---------------------------------------------------------- */
  var counters = document.querySelectorAll('.count');
  if ('IntersectionObserver' in window && counters.length) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        co.unobserve(e.target);
        runCount(e.target);
      });
    }, { threshold: 0.5 });
    counters.forEach(function (c) { co.observe(c); });
    setTimeout(function () {
      counters.forEach(function (c) {
        if (c.dataset.done !== '1') runCount(c);
      });
    }, 3000);
  } else {
    counters.forEach(function (c) { c.textContent = c.dataset.to; });
  }

  function runCount(el) {
    if (el.dataset.done === '1') return;
    el.dataset.done = '1';
    var to = parseFloat(el.dataset.to) || 0;
    if (reduced || to === 0) { el.textContent = to; return; }
    var start = performance.now();
    var dur = 1100;
    (function tick(now) {
      var t = clamp((now - start) / dur, 0, 1);
      var eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(to * eased);
      if (t < 1) requestAnimationFrame(tick);
    })(start);
  }

  /* ----------------------------------------------------------
     Booking
     ---------------------------------------------------------- */
  var DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var SLOTS = ['17:00', '17:45', '18:30', '19:15', '20:00', '20:45', '21:30'];

  var dayChips = document.getElementById('dayChips');
  var timeChips = document.getElementById('timeChips');
  var booking = document.getElementById('booking');
  var state = { date: null, time: null, guests: 2 };

  // Deterministic per date + slot, so availability doesn't reshuffle on every render.
  function seatsFor(date, slotIndex) {
    var h = (date.getDate() * 31 + date.getMonth() * 17 + slotIndex * 7) % 11;
    if (h === 0) return 0;
    if (h < 3) return h;
    return 9;
  }

  function buildDays() {
    if (!dayChips) return;
    var today = new Date();
    var made = 0;
    for (var i = 0; i < 12 && made < 6; i++) {
      var d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
      if (d.getDay() === 1) continue;               // Monday — the fire rests
      made++;
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chip';
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-checked', 'false');
      btn.innerHTML = (i === 0 ? 'Tonight' : DAY[d.getDay()]) +
        '<small>' + d.getDate() + ' ' + MON[d.getMonth()] + '</small>';
      btn.dataset.iso = d.toISOString().slice(0, 10);
      (function (dateObj, button) {
        button.addEventListener('click', function () {
          state.date = dateObj;
          Array.prototype.forEach.call(dayChips.children, function (c) {
            var on = c === button;
            c.classList.toggle('is-on', on);
            c.setAttribute('aria-checked', on ? 'true' : 'false');
          });
          buildTimes();
        });
      })(d, btn);
      dayChips.appendChild(btn);
    }
    if (dayChips.firstChild) dayChips.firstChild.click();
  }

  function buildTimes() {
    if (!timeChips || !state.date) return;
    timeChips.innerHTML = '';
    state.time = null;
    SLOTS.forEach(function (slot, i) {
      var seats = seatsFor(state.date, i);
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chip';
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-checked', 'false');
      btn.innerHTML = slot + (seats === 0
        ? '<small>full</small>'
        : seats < 3 ? '<small>' + seats + ' left</small>' : '');
      if (seats === 0 || seats < state.guests) {
        btn.disabled = true;
        btn.setAttribute('aria-disabled', 'true');
      }
      btn.addEventListener('click', function () {
        state.time = slot;
        Array.prototype.forEach.call(timeChips.children, function (c) {
          var on = c === btn;
          c.classList.toggle('is-on', on);
          c.setAttribute('aria-checked', on ? 'true' : 'false');
        });
      });
      timeChips.appendChild(btn);
    });
  }

  var guestsOut = document.getElementById('guestsOut');
  var gUp = document.getElementById('guestsUp');
  var gDown = document.getElementById('guestsDown');

  function paintGuests() {
    if (guestsOut) {
      guestsOut.innerHTML = '<strong>' + state.guests + '</strong> guest' + (state.guests === 1 ? '' : 's');
    }
    if (gDown) gDown.disabled = state.guests <= 1;
    if (gUp) gUp.disabled = state.guests >= 6;
    buildTimes();
  }
  if (gUp) gUp.addEventListener('click', function () { state.guests = Math.min(6, state.guests + 1); paintGuests(); });
  if (gDown) gDown.addEventListener('click', function () { state.guests = Math.max(1, state.guests - 1); paintGuests(); });

  buildDays();
  paintGuests();

  var bookError = document.getElementById('bookError');
  var bookDone = document.getElementById('bookDone');
  var bookSummary = document.getElementById('bookSummary');
  var bName = document.getElementById('bName');
  var bEmail = document.getElementById('bEmail');

  function fail(msg, field) {
    if (bookError) { bookError.textContent = msg; bookError.hidden = false; }
    if (field) { field.classList.add('is-bad'); field.focus(); }
    return false;
  }

  if (booking) {
    booking.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (bookError) bookError.hidden = true;
      if (bName) bName.classList.remove('is-bad');
      if (bEmail) bEmail.classList.remove('is-bad');

      if (!state.date) return fail('Pick a night first.');
      if (!state.time) return fail('Pick a time — the greyed-out ones are already full.');
      if (!bName.value.trim()) return fail('We need a name for the table.', bName);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(bEmail.value.trim())) {
        return fail('That email address does not look right.', bEmail);
      }

      var d = state.date;
      bookSummary.innerHTML = '<strong>' + state.guests + '</strong> at <strong>' + state.time +
        '</strong> on <strong>' + DAY[d.getDay()] + ' ' + d.getDate() + ' ' + MON[d.getMonth()] +
        '</strong>. We have sent a note to <strong>' + bEmail.value.trim() +
        '</strong>. Come hungry, and expect to smell of woodsmoke.';
      booking.hidden = true;
      bookDone.hidden = false;
      bookDone.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
    });
  }

  var bookAgain = document.getElementById('bookAgain');
  if (bookAgain) {
    bookAgain.addEventListener('click', function () {
      bookDone.hidden = true;
      booking.hidden = false;
      booking.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
    });
  }

  /* ----------------------------------------------------------
     One loop for everything that moves
     ---------------------------------------------------------- */
  var running = false;
  var scrollDirty = true;

  window.addEventListener('scroll', function () { scrollDirty = true; }, { passive: true });
  window.addEventListener('resize', function () {
    scrollDirty = true;
    if (canvas && ctx && !reduced) { sizeCanvas(); seedEmbers(); }
  });

  function frame() {
    if (!running) return;

    if (scrollDirty) {
      scrollDirty = false;
      onNav();
      pickStage();
    }

    paintGauge();

    // pointer easing
    pointer.x = lerp(pointer.x, pointer.tx, 0.06);
    pointer.y = lerp(pointer.y, pointer.ty, 0.06);

    if (!reduced) {
      var y = window.scrollY;
      if (coals && y < window.innerHeight * 1.2) {
        coals.style.transform = 'translate3d(' + (pointer.x * -10).toFixed(2) + 'px,' +
          (y * 0.16 - 20).toFixed(2) + 'px,0) scale(1.06)';
      }
      for (var i = 0; i < sprigs.length; i++) {
        var depth = i === 0 ? 26 : -18;
        var base = i === 0 ? 14 : -160;
        sprigs[i].style.transform =
          'translate3d(' + (pointer.x * depth).toFixed(2) + 'px,' +
          (pointer.y * depth * 0.6 - y * 0.05).toFixed(2) + 'px,0) rotate(' +
          (base + pointer.x * 2).toFixed(2) + 'deg)';
      }
    }

    if (peek && peekOn) {
      peekPos.x = lerp(peekPos.x, peekPos.tx, 0.14);
      peekPos.y = lerp(peekPos.y, peekPos.ty, 0.14);
      peek.style.left = peekPos.x.toFixed(1) + 'px';
      peek.style.top = peekPos.y.toFixed(1) + 'px';
    }

    if (ctx && heroVisible && !reduced) drawEmbers();

    requestAnimationFrame(frame);
  }

  function start() {
    if (running) return;
    running = true;
    requestAnimationFrame(frame);
  }
  function stop() { running = false; }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop(); else start();
  });

  pickStage();
  start();
})();

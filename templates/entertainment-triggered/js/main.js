/* ============================================================
   Triggered Games — concept redesign
   No dependencies. The pricing calculator is the point of this
   redesign: the real rate card is peak/off-peak crossed with two
   stacking discount tiers, which is a lot to hold in your head.
   ============================================================ */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var money = function (n) { return '$' + n.toFixed(2); };

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
  setTimeout(light, 320);

  /* ----------------------------------------------------------
     Shared "is the hero visible" flag for the two effects below —
     tracked independently of either effect's own DOM nodes so one
     effect's markup can't silently disable the other's gating.
     ---------------------------------------------------------- */
  var heroOnScreen = true;
  if (hero && !reduced && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (e) { heroOnScreen = e[0].isIntersecting; }, { threshold: 0 }).observe(hero);
  }

  /* ----------------------------------------------------------
     Random hero glitch
     A brief chromatic-split jolt on the headline at an irregular
     interval — never the same gap twice, so it reads as an
     unstable signal rather than a metronome. Only while the hero
     is on screen, and never for reduced-motion.
     ---------------------------------------------------------- */
  // The class goes on .hero, not the headline, because the scanline field
  // covers the whole hero. Removed once the run finishes so :hover can still
  // fire the same animations independently.
  if (hero && !reduced) {
    (function scheduleGlitch() {
      // Infrequent on purpose. A glitch every few seconds stops being an accent
      // and starts being the page's personality — and reads as a fault.
      var wait = 9000 + Math.random() * 11000; // 9s – 20s, never a fixed beat
      setTimeout(function () {
        if (heroOnScreen && !document.hidden) {
          hero.classList.remove('is-glitching');
          hero.offsetWidth; // restart the animation cleanly
          hero.classList.add('is-glitching');
          setTimeout(function () { hero.classList.remove('is-glitching'); }, 520);
        }
        scheduleGlitch();
      }, wait);
    })();
  }

  /* ----------------------------------------------------------
     Random hero sparks
     Small embers popping at random positions/times inside the
     hero. Capped concurrency so it stays a texture, not noise.
     ---------------------------------------------------------- */
  var sparkField = document.getElementById('sparkField');
  if (sparkField && !reduced) {
    var liveSparks = 0;
    var SPARK_CAP = 3;   // a suggestion of embers, not a particle system
    var SPARK_COLORS = ['var(--volt)', 'var(--hot)', 'var(--flame)'];
    (function scheduleSpark() {
      var wait = 1100 + Math.random() * 2200;
      setTimeout(function () {
        if (liveSparks < SPARK_CAP && heroOnScreen && !document.hidden) {
          var s = document.createElement('span');
          var color = SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)];
          var dur = (1.1 + Math.random() * 1.3).toFixed(2);
          s.className = 'spark';
          s.style.left = (4 + Math.random() * 92) + '%';
          s.style.top = (30 + Math.random() * 68) + '%';
          s.style.background = color;
          s.style.boxShadow = '0 0 7px 1px ' + color;
          s.style.animationDuration = dur + 's';
          sparkField.appendChild(s);
          liveSparks++;
          setTimeout(function () {
            s.remove();
            liveSparks--;
          }, dur * 1000);
        }
        scheduleSpark();
      }, wait);
    })();
  }

  /* ----------------------------------------------------------
     Nav
     ---------------------------------------------------------- */
  var nav = document.getElementById('nav');
  function onScroll() {
    if (nav) nav.classList.toggle('is-stuck', window.scrollY > 30);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

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
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.06 });
    revealables.forEach(function (el) { ro.observe(el); });
    // Safety net: anything still hidden after 2.5s gets shown anyway.
    setTimeout(function () {
      revealables.forEach(function (el) { el.classList.add('is-in'); });
    }, 2500);
  } else {
    revealables.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ----------------------------------------------------------
     Pricing calculator

     Real rate card (per person, per 20-minute round):
       standard   off-peak $16.00 · peak $20.00
       10% off    follow on IG/TikTok
       15% off    HomeTeamNS / SAFRA / NEBO / PAssion, min 4 pax

     Peak = Fri from 18:00, plus all day Sat/Sun (and public
     holidays, which can't be derived from a weekday picker).
     ---------------------------------------------------------- */
  var BASE = { off: 16, peak: 20 };
  var DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  var DISCOUNTS = [
    { id: 'none', label: 'None', off: 0, min: 1, hint: 'Standard rate.' },
    { id: 'social', label: 'IG / TikTok', off: 0.10, min: 1, hint: 'Follow them and use code TTIG10 — 10% off, any group size.' },
    { id: 'member', label: 'Member card', off: 0.15, min: 4, hint: 'HomeTeamNS, SAFRA, NEBO or PAssion — 15% off, minimum 4 players.' }
  ];

  var state = { day: 5, hour: 19, pax: 4, rounds: 1, disc: 'none' };

  var dayChips = document.getElementById('dayChips');
  var discChips = document.getElementById('discChips');
  var timeSel = document.getElementById('timeSel');
  var paxOut = document.getElementById('paxOut');
  var roundOut = document.getElementById('roundOut');
  var perPax = document.getElementById('perPax');
  var totalOut = document.getElementById('totalOut');
  var rateBadge = document.getElementById('rateBadge');
  var rateWhy = document.getElementById('rateWhy');
  var rateStrike = document.getElementById('rateStrike');
  var breakdown = document.getElementById('breakdown');
  var discHint = document.getElementById('discHint');

  function isPeak() {
    if (state.day >= 5) return true;              // Sat, Sun
    if (state.day === 4 && state.hour >= 18) return true;  // Fri from 6pm
    return false;
  }

  function activeDiscount() {
    var d = DISCOUNTS.filter(function (x) { return x.id === state.disc; })[0] || DISCOUNTS[0];
    // The member tier legitimately doesn't apply below 4 players, so fall
    // back rather than quoting a price they can't actually get.
    if (state.pax < d.min) return { applied: DISCOUNTS[0], blocked: d };
    return { applied: d, blocked: null };
  }

  function render() {
    if (!perPax) return;

    var peak = isPeak();
    var base = peak ? BASE.peak : BASE.off;
    var res = activeDiscount();
    var rate = base * (1 - res.applied.off);
    var total = rate * state.pax * state.rounds;

    perPax.textContent = rate.toFixed(2);
    totalOut.textContent = money(total);

    rateBadge.textContent = peak ? 'Peak' : 'Off-peak';
    rateBadge.classList.toggle('is-peak', peak);
    rateWhy.textContent = peak
      ? 'Fri from 6pm, all day Sat & Sun, and public holidays.'
      : 'Mon–Thu all day, and Fri before 6pm.';

    if (res.applied.off > 0) {
      rateStrike.hidden = false;
      rateStrike.innerHTML = 'Was <s>' + money(base) + '</s> — saving ' +
        money((base - rate) * state.pax * state.rounds) + ' on this booking.';
    } else {
      rateStrike.hidden = true;
    }

    breakdown.textContent = state.pax + (state.pax === 1 ? ' player · ' : ' players · ') +
      state.rounds + (state.rounds === 1 ? ' round' : ' rounds') +
      (state.rounds > 1 ? ' · same room back-to-back adds 10 free minutes' : '');

    discHint.textContent = res.blocked
      ? res.blocked.label + ' needs at least ' + res.blocked.min + ' players — showing the standard rate.'
      : res.applied.hint;
  }

  function buildDays() {
    if (!dayChips) return;
    DAYS.forEach(function (label, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip' + (i === state.day ? ' is-on' : '');
      b.textContent = label;
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', i === state.day ? 'true' : 'false');
      b.addEventListener('click', function () {
        state.day = i;
        Array.prototype.forEach.call(dayChips.children, function (c) {
          var on = c === b;
          c.classList.toggle('is-on', on);
          c.setAttribute('aria-checked', on ? 'true' : 'false');
        });
        render();
      });
      dayChips.appendChild(b);
    });
  }

  function buildTimes() {
    if (!timeSel) return;
    // Venue runs 11:00–22:30; last sensible start is 22:00.
    for (var h = 11; h <= 22; h++) {
      var o = document.createElement('option');
      o.value = String(h);
      o.textContent = (h < 10 ? '0' : '') + h + ':00';
      if (h === state.hour) o.selected = true;
      timeSel.appendChild(o);
    }
    timeSel.addEventListener('change', function () {
      state.hour = parseInt(timeSel.value, 10);
      render();
    });
  }

  function buildDiscounts() {
    if (!discChips) return;
    DISCOUNTS.forEach(function (d) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip' + (d.id === state.disc ? ' is-on' : '');
      b.textContent = d.label + (d.off ? ' · ' + (d.off * 100) + '%' : '');
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', d.id === state.disc ? 'true' : 'false');
      b.addEventListener('click', function () {
        state.disc = d.id;
        Array.prototype.forEach.call(discChips.children, function (c) {
          var on = c === b;
          c.classList.toggle('is-on', on);
          c.setAttribute('aria-checked', on ? 'true' : 'false');
        });
        render();
      });
      discChips.appendChild(b);
    });
  }

  function paintPax() {
    if (paxOut) paxOut.innerHTML = '<strong>' + state.pax + '</strong> pax';
    var d = document.getElementById('paxDown');
    var u = document.getElementById('paxUp');
    if (d) d.disabled = state.pax <= 2;
    if (u) u.disabled = state.pax >= 10;
    render();
  }
  function paintRounds() {
    if (roundOut) roundOut.innerHTML = '<strong>' + state.rounds + '</strong> ' + (state.rounds === 1 ? 'round' : 'rounds');
    var d = document.getElementById('roundDown');
    var u = document.getElementById('roundUp');
    if (d) d.disabled = state.rounds <= 1;
    if (u) u.disabled = state.rounds >= 4;
    render();
  }

  var paxUp = document.getElementById('paxUp');
  var paxDown = document.getElementById('paxDown');
  var roundUp = document.getElementById('roundUp');
  var roundDown = document.getElementById('roundDown');
  if (paxUp) paxUp.addEventListener('click', function () { state.pax = clamp(state.pax + 1, 2, 10); paintPax(); });
  if (paxDown) paxDown.addEventListener('click', function () { state.pax = clamp(state.pax - 1, 2, 10); paintPax(); });
  if (roundUp) roundUp.addEventListener('click', function () { state.rounds = clamp(state.rounds + 1, 1, 4); paintRounds(); });
  if (roundDown) roundDown.addEventListener('click', function () { state.rounds = clamp(state.rounds - 1, 1, 4); paintRounds(); });

  buildDays();
  buildTimes();
  buildDiscounts();
  paintPax();
  paintRounds();
  render();
})();

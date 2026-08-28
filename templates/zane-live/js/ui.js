/* ZAN.E — the whole site's JavaScript.
   Reveals, a true-loop ticker, and one broadcast clock that drives everything
   time-related: the on-air/countdown strip, the mobile action bar, the live
   cue highlight in the run sheet and the upcoming-Sunday list.

   Every time value is computed in Singapore time (Asia/Singapore, no DST), so
   the page tells a visitor in any timezone the same truth about the show.
   No frameworks, no inline scripts, no cookies, no storage, no third parties. */
(function () {
  'use strict';

  var root = document.documentElement;
  root.classList.remove('no-js');
  root.classList.add('js-anim');

  /* =====================================================================
     Reveals
     ===================================================================== */
  function revealNow(el) { el.classList.add('is-in'); }

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { revealNow(entry.target); io.unobserve(entry.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });

    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });

    // Failsafe: if nothing has revealed shortly after load, show everything
    // rather than serve a page of blank space.
    setTimeout(function () {
      if (!document.querySelector('.reveal.is-in')) {
        document.querySelectorAll('.reveal').forEach(revealNow);
      }
    }, 1400);

    // IO can miss anchor jumps; a cheap throttled sweep catches anything
    // already on screen that never fired.
    var ticking = false;
    function sweep() {
      document.querySelectorAll('.reveal:not(.is-in)').forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < (window.innerHeight || 0) && r.bottom > 0) revealNow(el);
      });
    }
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      setTimeout(function () { ticking = false; sweep(); }, 200);
    }, { passive: true });
    window.addEventListener('resize', sweep, { passive: true });
    window.addEventListener('hashchange', sweep);
  } else {
    document.querySelectorAll('.reveal').forEach(revealNow);
  }

  /* =====================================================================
     Singapore clock

     The show: Sunday 19:00–20:00 SGT, every week. Change SHOW_* and the
     rundown's data-start/data-end together — the page reads its cue times
     from the markup, so the run sheet and the highlight cannot drift apart.
     ===================================================================== */
  var SHOW_DAY = 0;             // 0 = Sunday
  var SHOW_START = 19 * 3600;   // 19:00, seconds into the day
  var SHOW_END = 20 * 3600;     // 20:00
  var WEEK = 7 * 86400;

  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];
  var DAY_INDEX = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

  /* Current wall clock in Singapore, as plain numbers. Returns null if Intl
     cannot resolve the zone, which is the signal to fall back to static copy. */
  function sgNow() {
    try {
      var parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Singapore',
        weekday: 'short', year: 'numeric', month: 'numeric', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
      }).formatToParts(new Date());

      var v = {};
      parts.forEach(function (p) { if (p.type !== 'literal') v[p.type] = p.value; });

      var dow = DAY_INDEX[v.weekday];
      if (dow === undefined) return null;

      // "24" is a legal hour string for midnight in some engines.
      var h = parseInt(v.hour, 10) % 24;

      return {
        dow: dow,
        y: parseInt(v.year, 10),
        m: parseInt(v.month, 10),
        d: parseInt(v.day, 10),
        h: h,
        mi: parseInt(v.minute, 10),
        s: parseInt(v.second, 10),
        sec: h * 3600 + parseInt(v.minute, 10) * 60 + parseInt(v.second, 10)
      };
    } catch (e) { return null; }
  }

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  /* Seconds from now until the given Sunday-offset broadcast starts. */
  function secondsToNextStart(now) {
    var daysAhead = (SHOW_DAY - now.dow + 7) % 7;
    var t = daysAhead * 86400 + SHOW_START - now.sec;
    if (t <= 0) t += WEEK;
    return t;
  }

  /* Calendar date of the broadcast `weeksAhead` weeks after the next one.
     Built on a UTC date so month and year rollovers are handled by the engine
     rather than by hand, and read back in UTC so no local zone leaks in. */
  function broadcastDate(now, weeksAhead) {
    var daysAhead = (SHOW_DAY - now.dow + 7) % 7;
    // Already past this week's slot? The next one is a week later.
    if (daysAhead === 0 && now.sec >= SHOW_END) daysAhead = 7;
    var base = Date.UTC(now.y, now.m - 1, now.d);
    var d = new Date(base + (daysAhead + weeksAhead * 7) * 86400000);
    return { day: d.getUTCDay(), date: d.getUTCDate(), month: d.getUTCMonth(), year: d.getUTCFullYear() };
  }

  function longDate(x) { return DAYS[x.day] + ' ' + x.date + ' ' + MONTHS[x.month]; }
  // Zero-padded so the column of dates lines up in the mono face.
  function shortDate(x) { return pad(x.date) + ' ' + MONTHS[x.month].slice(0, 3); }

  function countdown(total) {
    var d = Math.floor(total / 86400);
    var h = Math.floor((total % 86400) / 3600);
    var m = Math.floor((total % 3600) / 60);
    var s = total % 60;
    return (d > 0 ? d + 'd ' : '') + pad(h) + ':' + pad(m) + ':' + pad(s);
  }

  /* =====================================================================
     Paint everything the clock drives
     ===================================================================== */
  var strip = document.querySelector('[data-status]');
  var stripLabel = document.querySelector('[data-status-label]');
  var stripMain = document.querySelector('[data-status-main]');
  var stripSub = document.querySelector('[data-status-sub]');
  var clock = document.querySelector('[data-clock]');
  var abBar = document.querySelector('[data-actionbar]');
  var abLabel = document.querySelector('[data-ab-label]');
  var abValue = document.querySelector('[data-ab-value]');
  var nextDate = document.querySelector('[data-next-date]');
  var nextCount = document.querySelector('[data-next-count]');
  var upcoming = document.querySelector('[data-upcoming]');
  var cues = document.querySelectorAll('[data-cue]');

  var upcomingPainted = false;

  function setState(el, state) { if (el) el.setAttribute('data-state', state); }

  function paint() {
    var now = sgNow();

    if (!now) {
      // No usable timezone data: keep the page honest with the static facts.
      if (stripMain) stripMain.textContent = 'Every Sunday, 19:00 – 20:00 SGT';
      if (stripSub) stripSub.textContent = 'Live on Douyin';
      if (nextDate) nextDate.textContent = 'Sunday';
      if (nextCount) nextCount.textContent = 'Live on Douyin, every week';
      if (abValue) abValue.textContent = 'Sunday 19:00 SGT';
      return;
    }

    if (clock) clock.textContent = pad(now.h) + ':' + pad(now.mi) + ':' + pad(now.s);

    var live = now.dow === SHOW_DAY && now.sec >= SHOW_START && now.sec < SHOW_END;

    if (live) {
      var inSec = now.sec - SHOW_START;
      var leftSec = SHOW_END - now.sec;
      var minsIn = Math.floor(inSec / 60);

      setState(strip, 'live');
      setState(abBar, 'live');
      if (stripLabel) stripLabel.textContent = 'On air';
      if (stripMain) {
        stripMain.textContent = minsIn < 1
          ? 'Live now — just started'
          : 'Live now — ' + minsIn + ' min in';
      }
      if (stripSub) stripSub.textContent = countdown(leftSec) + ' left on air';
      if (abLabel) abLabel.textContent = 'On air now';
      if (abValue) {
        abValue.textContent = (minsIn < 1 ? 'Just started' : minsIn + ' min in')
          + ' · ' + countdown(leftSec) + ' left';
      }
    } else {
      var toStart = secondsToNextStart(now);
      var soon = toStart <= 3600;

      setState(strip, soon ? 'soon' : 'off');
      setState(abBar, soon ? 'soon' : 'off');
      if (stripLabel) stripLabel.textContent = soon ? 'Starting soon' : 'Off air';
      if (stripMain) stripMain.textContent = 'Next live in ' + countdown(toStart);
      if (stripSub) stripSub.textContent = longDate(broadcastDate(now, 0)) + ', 19:00 SGT';
      if (abLabel) abLabel.textContent = soon ? 'Starting soon' : 'Next live';
      if (abValue) abValue.textContent = countdown(toStart);
    }

    // Next-broadcast card
    if (nextDate) nextDate.textContent = longDate(broadcastDate(now, 0));
    if (nextCount) {
      nextCount.textContent = live
        ? 'On air right now'
        : 'Starts in ' + countdown(secondsToNextStart(now));
    }

    // The upcoming list only changes once a week; paint it once.
    if (upcoming && !upcomingPainted) {
      var html = '';
      for (var w = 1; w <= 4; w++) {
        var b = broadcastDate(now, w);
        html += '<li>' + shortDate(b) + '<span>19:00 – 20:00 SGT</span></li>';
      }
      upcoming.innerHTML = html;
      upcomingPainted = true;
    }

    // Live cue highlight in the run sheet
    var minuteOfDay = Math.floor(now.sec / 60);
    cues.forEach(function (cue) {
      var start = parseInt(cue.getAttribute('data-start'), 10);
      var end = parseInt(cue.getAttribute('data-end'), 10);
      var flag = cue.querySelector('[data-cue-flag]');
      var on = live && minuteOfDay >= start && minuteOfDay < end;
      if (on) { cue.setAttribute('data-now', ''); } else { cue.removeAttribute('data-now'); }
      if (flag) flag.hidden = !on;
    });
  }

  paint();
  setInterval(paint, 1000);

  /* The run sheet's own arithmetic, so the printed total can never disagree
     with the cues above it. */
  var totalEl = document.querySelector('[data-total]');
  if (totalEl && cues.length) {
    var mins = 0;
    cues.forEach(function (cue) {
      mins += parseInt(cue.getAttribute('data-end'), 10) - parseInt(cue.getAttribute('data-start'), 10);
    });
    totalEl.textContent = mins + ' minutes';
  }

  /* =====================================================================
     True-loop marquee — see PATTERNS.md.
     Clones one full copy of the content until half the track covers its
     container, keeping the total even so -50% stays a whole period.
     ===================================================================== */
  function trueLoopMarquee(track, secondsPerCopy) {
    if (!track || !track.firstElementChild) return;
    var master = track.firstElementChild.cloneNode(true);
    var timer;

    function build() {
      // Detach the animation before touching duration/children, or the browser
      // recomputes the played fraction against the new duration using the OLD
      // elapsed time — a visible jump the instant this runs.
      track.style.animationName = 'none';

      while (track.children.length > 1) track.removeChild(track.lastElementChild);
      var rowW = track.firstElementChild.getBoundingClientRect().width;
      var boxW = (track.parentElement || document.body).getBoundingClientRect().width;
      if (rowW < 1) { track.style.animationName = ''; return; }

      var perHalf = Math.max(1, Math.ceil(boxW / rowW));
      for (var i = 1; i < perHalf * 2; i++) {
        var copy = master.cloneNode(true);
        copy.setAttribute('aria-hidden', 'true');
        track.appendChild(copy);
      }
      track.style.animationDuration = (secondsPerCopy * perHalf) + 's';

      void track.offsetWidth; // force layout so animation-name:none commits first
      track.style.animationName = '';
    }

    build();
    window.addEventListener('resize', function () {
      clearTimeout(timer);
      timer = setTimeout(build, 200);
    });
  }

  trueLoopMarquee(document.getElementById('ticker'), 26);

  /* =====================================================================
     Footer year
     ===================================================================== */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();

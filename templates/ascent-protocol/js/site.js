/* ASCENT — shared behaviour for every page. Blocks that do not exist on
   the current page are skipped by the presence check at the top of each. */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var anim = root.classList.contains('js-anim');
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var smooth = function (t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  var sstep = function (a, b, t) { return smooth((t - a) / (b - a)); };
  var mobile = function () { return window.innerWidth < 861; };

  /* Business facts. Every date on the site derives from these. */
  var COHORT = { n: 9, opens: '2026-11-02', next: { n: 10, opens: '2027-02-01' }, places: 12, days: 84 };
  var DAY = 86400000;
  var WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var MO = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function parseISO(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function iso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function fmt(d) { return WD[d.getDay()] + ' ' + String(d.getDate()).padStart(2, '0') + ' ' + MO[d.getMonth()] + ' ' + d.getFullYear(); }
  function fmtShort(d) { return String(d.getDate()).padStart(2, '0') + ' ' + MO[d.getMonth()]; }
  function today() { var d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function addDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
  function daysBetween(a, b) { return Math.round((b - a) / DAY); }
  var store = {
    get: function (k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* private mode */ } },
    del: function (k) { try { window.localStorage.removeItem(k); } catch (e) { /* private mode */ } }
  };

  /* ------------------------------------------------------------------ */
  /* Header                                                              */
  /* ------------------------------------------------------------------ */
  var top = $('#top');
  var lastY = window.scrollY, drawerOpen = false;
  function headerState() {
    if (!top) return;
    var y = window.scrollY;
    top.classList.toggle('is-solid', y > 12 || drawerOpen);
    if (!drawerOpen) top.classList.toggle('is-hidden', y > 520 && y > lastY + 4);
    if (y < lastY - 4 || y < 520) top.classList.remove('is-hidden');
    lastY = y;
  }
  var burger = $('#burger'), drawer = $('#drawer');
  if (burger && drawer) {
    burger.addEventListener('click', function () {
      drawerOpen = burger.getAttribute('aria-expanded') !== 'true';
      burger.setAttribute('aria-expanded', String(drawerOpen));
      burger.setAttribute('aria-label', drawerOpen ? 'Close menu' : 'Open menu');
      drawer.setAttribute('data-open', String(drawerOpen));
      doc.body.style.overflow = drawerOpen ? 'hidden' : '';
      headerState();
    });
    $$('a', drawer).forEach(function (a) { a.addEventListener('click', function () { if (drawerOpen) burger.click(); }); });
  }

  /* ------------------------------------------------------------------ */
  /* Footage: source by viewport, load near the viewport, play in view.  */
  /* Under reduced motion nothing loads and the posters stand.           */
  /* ------------------------------------------------------------------ */
  var vids = $$('video[data-src]');
  if (vids.length && anim && 'IntersectionObserver' in window) {
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting) {
          if (!v.getAttribute('src')) {
            var small = v.getAttribute('data-src-sm');
            v.src = (small && window.innerWidth < 760) ? small : v.getAttribute('data-src');
            v.load();
          }
          var p = v.play();
          if (p && p.then) p.then(function () { v.classList.add('is-live'); }).catch(function () { /* autoplay refused: poster stays */ });
          else v.classList.add('is-live');
        } else if (v.getAttribute('src')) {
          v.pause();
        }
      });
    }, { rootMargin: '60% 0px 60% 0px', threshold: 0 });
    vids.forEach(function (v) { vio.observe(v); });
  }

  /* ------------------------------------------------------------------ */
  /* Reveals                                                             */
  /* ------------------------------------------------------------------ */
  var revealSel = '.rv';
  function revealAll() { $$(revealSel).forEach(function (n) { n.classList.add('is-in'); }); }
  if (anim && 'IntersectionObserver' in window) {
    var rio = new IntersectionObserver(function (entries) {
      var vh = window.innerHeight;
      entries.forEach(function (e) {
        var r = e.boundingClientRect;
        if (e.isIntersecting || (r.top < vh * 0.94 && r.bottom > 0)) { e.target.classList.add('is-in'); rio.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0 });
    $$(revealSel).forEach(function (n) { rio.observe(n); });
    setTimeout(revealAll, 4000);
    var sweepT = 0;
    var sweep = function () {
      if (sweepT) return;
      sweepT = setTimeout(function () {
        sweepT = 0;
        var vh = window.innerHeight;
        $$(revealSel).forEach(function (n) {
          if (n.classList.contains('is-in')) return;
          var r = n.getBoundingClientRect();
          if (r.top < vh && r.bottom > 0) n.classList.add('is-in');
        });
      }, 140);
    };
    window.addEventListener('load', sweep);
    window.addEventListener('scroll', sweep, { passive: true });
  } else {
    revealAll();
  }
  var hero = $('.hero, .pagehero, .apply-hero');
  if (hero) requestAnimationFrame(function () { requestAnimationFrame(function () { hero.classList.add('is-in'); }); });

  /* ------------------------------------------------------------------ */
  /* The spine: one hairline down the page; a dot for every anchor,     */
  /* a fixed marker that reads which one the visitor has reached.       */
  /* ------------------------------------------------------------------ */
  var spine = $('#spine'), dotsEl = $('#dots'), marker = $('#marker');
  var anchors = $$('[data-dot]');
  var dots = [];
  var offs = $$('[data-marker-off]');
  function dotLabel(a) { var p = a.getAttribute('data-dot').split('|'); return { n: p[0], t: p[1] || p[0] }; }
  if (spine && dotsEl && anchors.length) {
    anchors.forEach(function (a) {
      var d = doc.createElement('span');
      d.className = 'spine-dot';
      d.innerHTML = '<b></b>';
      d.firstChild.textContent = dotLabel(a).t;
      if (a.closest('[data-marker-off]')) d.classList.add('is-flip');
      dotsEl.appendChild(d);
      dots.push({ el: d, a: a, y: 0 });
    });
  }
  var spineFrom = $('[data-spine-from]'), foot = $('.foot');
  function layoutSpine() {
    if (!spine) return;
    var sy = window.scrollY;
    var fromAttr = spineFrom ? spineFrom.getAttribute('data-spine-from') : '';
    var from = 0;
    if (spineFrom && fromAttr === 'top') from = parseFloat(getComputedStyle(root).getPropertyValue('--top-h')) || 72;
    else if (spineFrom) from = spineFrom.getBoundingClientRect().bottom + sy;
    spine.style.top = dotsEl.style.top = from + 'px';
    if (foot) spine.style.bottom = dotsEl.style.bottom = foot.offsetHeight + 'px';
    dots.forEach(function (d) {
      d.y = d.a.getBoundingClientRect().top + sy;
      d.el.style.top = (d.y - from) + 'px';
    });
  }
  var markerLabel = marker ? $('i', marker) : null;
  function spineState() {
    if (!spine) return;
    var line = window.scrollY + window.innerHeight * (mobile() ? 0.62 : 0.5);
    var current = null;
    dots.forEach(function (d) {
      var lit = d.y <= line + 2;
      d.el.classList.toggle('is-lit', lit);
      if (lit) current = d;
    });
    if (marker) {
      var topOfSpine = parseFloat(spine.style.top || 0);
      var sy = window.scrollY;
      var on = line > topOfSpine + 40 && (!foot || line < foot.getBoundingClientRect().top + sy - 40);
      if (on) offs.some(function (o) {
        var r = o.getBoundingClientRect();
        if (line > r.top + sy - 12 && line < r.bottom + sy + 12) { on = false; return true; }
        return false;
      });
      marker.classList.toggle('is-on', on);
      if (markerLabel && current) {
        var l = dotLabel(current.a);
        markerLabel.innerHTML = '';
        if (l.n) { var b = doc.createElement('b'); b.textContent = l.n; markerLabel.appendChild(b); markerLabel.appendChild(doc.createTextNode(' — ')); }
        markerLabel.appendChild(doc.createTextNode(l.t));
      }
    }
  }

  /* ------------------------------------------------------------------ */
  /* Parallax: the big plates lag the scroll a little.                   */
  /* ------------------------------------------------------------------ */
  var pxs = anim ? $$('.px') : [];
  function parallax() {
    var vh = window.innerHeight;
    pxs.forEach(function (n) {
      var r = n.parentElement.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) return;
      var c = (r.top + r.height / 2) - vh / 2;
      n.style.transform = 'translate3d(0,' + clamp(c * -0.08, -80, 80).toFixed(1) + 'px,0)';
    });
  }

  /* ------------------------------------------------------------------ */
  /* Scroll loop                                                         */
  /* ------------------------------------------------------------------ */
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { ticking = false; headerState(); spineState(); parallax(); });
  }
  var relayoutT = 0;
  function relayout() { layoutSpine(); spineState(); parallax(); }
  function relayoutSoon() { clearTimeout(relayoutT); relayoutT = setTimeout(relayout, 120); }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', relayoutSoon);
  window.addEventListener('load', relayout);
  if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(relayoutSoon);
  if ('ResizeObserver' in window) new ResizeObserver(relayoutSoon).observe(doc.body);
  relayout();
  headerState();

  /* ------------------------------------------------------------------ */
  /* Live readouts: days until the cohort opens.                         */
  /* ------------------------------------------------------------------ */
  $$('[data-opens]').forEach(function (n) {
    var t = today(), open = parseISO(COHORT.opens), close = addDays(open, COHORT.days);
    var d = daysBetween(t, open);
    var html;
    if (d > 1) html = 'Cohort ' + String(COHORT.n).padStart(2, '0') + ' · opens in <b>' + d + ' days</b>';
    else if (d === 1) html = 'Cohort ' + String(COHORT.n).padStart(2, '0') + ' · opens <b>tomorrow</b>';
    else if (t < close) html = 'Cohort ' + String(COHORT.n).padStart(2, '0') + ' · <b>in session</b> · day ' + String(daysBetween(open, t) + 1).padStart(2, '0');
    else html = 'Cohort ' + COHORT.next.n + ' · opens <b>' + fmtShort(parseISO(COHORT.next.opens)) + '</b>';
    n.innerHTML = html;
  });

  /* ------------------------------------------------------------------ */
  /* The decision: ONE DAY becomes DAY ONE. A drag, not a caption.       */
  /* The fog clears, the glass sharpens, the words cross, and the date   */
  /* on the right becomes real. The choice is kept, so day one counts.   */
  /* ------------------------------------------------------------------ */
  var dec = $('#decide');
  if (dec) {
    var KEY = 'ascent.dayone';
    var rail = $('#rail'), puck = $('#puck'), fill = $('#rail-fill');
    var words = $('#words'), wOne = $('#w-one'), wDay = $('#w-day');
    var labA = $('#lab-a'), labB = $('#lab-b');
    var roState = $('#ro-state'), roDay = $('#ro-day'), roStart = $('#ro-start');
    var grid = $('#days'), gridCap = $('#days-cap');
    var capA = $('#cap-a'), capB = $('#cap-b');
    var cta = $('#decide-cta'), ctaText = $('span', cta), undo = $('#decide-undo');
    var t = 0, geo = { W: 0, w1: 0, w2: 0, g: 0, x0: 0, h: 0 }, dragging = false, moved = false, tweenId = 0, setState = false;

    for (var i = 0; i < COHORT.days; i++) grid.appendChild(doc.createElement('i'));
    var cells = $$('i', grid);

    function measure() {
      geo.W = words.clientWidth;
      geo.h = words.clientHeight;
      geo.w1 = wOne.offsetWidth;
      geo.w2 = wDay.offsetWidth;
      geo.g = clamp(geo.W * 0.06, 12, 56);
      var total = geo.w1 + geo.g + geo.w2;
      if (total > geo.W) { geo.g = Math.max(8, geo.W - geo.w1 - geo.w2); total = geo.w1 + geo.g + geo.w2; }
      geo.x0 = Math.max(0, (geo.W - total) / 2);
    }
    function paint(v) {
      var s = smooth(v);
      var xOne = lerp(geo.x0, geo.x0 + geo.w2 + geo.g, s);
      var xDay = lerp(geo.x0 + geo.w1 + geo.g, geo.x0, s);
      var arc = Math.sin(s * Math.PI) * geo.h * 0.22;
      wOne.style.transform = 'translate3d(' + xOne.toFixed(1) + 'px,' + (-arc).toFixed(1) + 'px,0)';
      wDay.style.transform = 'translate3d(' + xDay.toFixed(1) + 'px,' + arc.toFixed(1) + 'px,0)';
      wOne.style.zIndex = v > 0.5 ? 2 : 1;
      wDay.style.zIndex = v > 0.5 ? 1 : 2;
      var k = sstep(0.36, 0.64, v);
      $('.it', wOne).style.opacity = $('.it', wDay).style.opacity = (1 - k).toFixed(3);
      $('.ro', wOne).style.opacity = $('.ro', wDay).style.opacity = k.toFixed(3);
      dec.style.setProperty('--decide-blur', (26 * (1 - v)).toFixed(2) + 'px');
      dec.style.setProperty('--decide-fog', (1 - v).toFixed(3));
      dec.style.setProperty('--decide-tint', 'rgba(28,34,42,' + (0.34 - 0.16 * v).toFixed(3) + ')');
      rail.style.setProperty('--t', v.toFixed(4));
      puck.setAttribute('aria-valuenow', String(Math.round(v * 100)));
      labA.classList.toggle('is-on', v < 0.5);
      labB.classList.toggle('is-on', v >= 0.5);
    }
    function render() {
      var stored = store.get(KEY);
      var start = stored ? parseISO(stored) : null;
      var n = start ? daysBetween(start, today()) + 1 : 0;
      dec.classList.toggle('is-set', setState);
      puck.setAttribute('aria-valuetext', setState ? 'Day one. A decision.' : 'One day. A dream.');
      if (setState && start) {
        var done = n > COHORT.days;
        roState.textContent = done ? 'Cycle complete' : 'Day one';
        roState.classList.remove('dim');
        roDay.innerHTML = done ? '<b>' + COHORT.days + '</b> of ' + COHORT.days : '<b>' + String(clamp(n, 1, COHORT.days)).padStart(2, '0') + '</b> of ' + COHORT.days;
        roDay.classList.remove('dim');
        roStart.textContent = fmt(start);
        roStart.classList.remove('dim');
        cells.forEach(function (c, i) {
          c.className = (i + 1 < n) ? 'past' : (i + 1 === clamp(n, 1, COHORT.days) && !done ? 'now' : (done ? 'past' : ''));
        });
        gridCap.textContent = done ? 'Twelve weeks, done. Cycle two starts at a higher floor.' : (n === 1 ? 'Eighty-four days. This is the first.' : 'Day ' + n + ' of eighty-four.');
        capA.style.opacity = 0; capB.style.opacity = 1;
        capA.setAttribute('aria-hidden', 'true'); capB.removeAttribute('aria-hidden');
        ctaText.textContent = n === 1 ? 'Start on ' + fmtShort(start) : 'Continue from day ' + n;
        cta.setAttribute('href', 'apply.html?start=' + iso(start));
        undo.hidden = false;
      } else {
        roState.textContent = 'Someday';
        roState.classList.add('dim');
        roDay.innerHTML = '— of ' + COHORT.days;
        roDay.classList.add('dim');
        roStart.textContent = 'Not set';
        roStart.classList.add('dim');
        cells.forEach(function (c) { c.className = ''; });
        gridCap.textContent = 'Eighty-four days, none of them started.';
        capA.style.opacity = 1; capB.style.opacity = 0;
        capB.setAttribute('aria-hidden', 'true'); capA.removeAttribute('aria-hidden');
        ctaText.textContent = 'Choose a start date';
        cta.setAttribute('href', 'apply.html');
        undo.hidden = true;
      }
    }
    function commit(on) {
      setState = on;
      if (on) { if (!store.get(KEY)) store.set(KEY, iso(today())); }
      else store.del(KEY);
      render();
      dec.dispatchEvent(new CustomEvent('ascent:decide', { detail: { dayOne: on, start: store.get(KEY) } }));
    }
    function tweenTo(v, done) {
      cancelAnimationFrame(tweenId);
      if (!anim) { t = v; paint(t); if (done) done(); return; }
      var from = t, t0 = performance.now(), dur = 520;
      var step = function (now) {
        var p = clamp((now - t0) / dur, 0, 1);
        var e = 1 - Math.pow(1 - p, 3);
        t = lerp(from, v, e);
        paint(t);
        if (p < 1) tweenId = requestAnimationFrame(step); else if (done) done();
      };
      tweenId = requestAnimationFrame(step);
    }
    function settle() { var on = t >= 0.5; tweenTo(on ? 1 : 0, function () { commit(on); }); }
    function tFromX(x) {
      var r = rail.getBoundingClientRect();
      return clamp((x - r.left - 22) / (r.width - 44), 0, 1);
    }
    rail.addEventListener('pointerdown', function (e) {
      if (e.button !== undefined && e.button !== 0) return;
      dragging = true; moved = false;
      cancelAnimationFrame(tweenId);
      rail.setPointerCapture(e.pointerId);
      rail.classList.add('is-drag');
      var start = tFromX(e.clientX);
      if (Math.abs(start - t) > 0.12) moved = true;
      t = start; paint(t);
      e.preventDefault();
    });
    rail.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var v = tFromX(e.clientX);
      if (Math.abs(v - t) > 0.004) moved = true;
      t = v; paint(t);
    });
    function endDrag(e) {
      if (!dragging) return;
      dragging = false;
      rail.classList.remove('is-drag');
      if (!moved) t = setState ? 0.49 : 0.51;
      settle();
    }
    rail.addEventListener('pointerup', endDrag);
    rail.addEventListener('pointercancel', endDrag);
    puck.addEventListener('keydown', function (e) {
      var k = e.key;
      if (k === 'ArrowRight' || k === 'ArrowUp') { t = clamp(t + 0.1, 0, 1); paint(t); settle(); }
      else if (k === 'ArrowLeft' || k === 'ArrowDown') { t = clamp(t - 0.1, 0, 1); paint(t); settle(); }
      else if (k === 'Home') { t = 0; settle(); }
      else if (k === 'End') { t = 1; settle(); }
      else if (k === 'Enter' || k === ' ') { t = setState ? 0.49 : 0.51; settle(); }
      else return;
      e.preventDefault();
    });
    undo.addEventListener('click', function () { t = 1; tweenTo(0, function () { commit(false); }); });
    window.addEventListener('resize', function () { measure(); paint(t); });
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(function () { measure(); paint(t); });
    measure();
    if (store.get(KEY)) { setState = true; t = 1; }
    paint(t);
    render();
  }

  /* ------------------------------------------------------------------ */
  /* The week: minimums by profile.                                      */
  /* ------------------------------------------------------------------ */
  var seg = $('#seg');
  if (seg) {
    var MINS = {
      founder: ['Ninety minutes of unbroken work before the first meeting', 'Thirty minutes of movement, any kind, logged', 'Lights out by 23:00, phone outside the room'],
      operator: ['The first hour without the inbox', 'One hard conversation had, not deferred', 'Thirty minutes of movement, logged'],
      athlete: ['Eight hours of sleep, logged', 'Tomorrow’s fuel planned tonight', 'Twenty minutes of nothing, no screen']
    };
    var sched = $('#sched'), mins = $('#mins');
    function setRole(role) {
      $$('button', seg).forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-role') === role)); });
      var swap = function () {
        mins.innerHTML = '';
        MINS[role].forEach(function (m, i) {
          var li = doc.createElement('li');
          var n = doc.createElement('i'); n.textContent = String(i + 1).padStart(2, '0');
          li.appendChild(n); li.appendChild(doc.createTextNode(m));
          mins.appendChild(li);
        });
        sched.classList.remove('is-swap');
      };
      if (anim) { sched.classList.add('is-swap'); setTimeout(swap, 180); } else swap();
    }
    $$('button', seg).forEach(function (b) { b.addEventListener('click', function () { setRole(b.getAttribute('data-role')); }); });
    setRole('founder');
  }

  /* ------------------------------------------------------------------ */
  /* Apply: prefill the start from the decision, fall through to mail.   */
  /* ------------------------------------------------------------------ */
  var form = $('#apply');
  if (form) {
    var startIn = $('#f-start'), fmtSel = $('#f-format'), startField = $('#start-field');
    var q = new URLSearchParams(window.location.search).get('start');
    var stored = store.get('ascent.dayone');
    var pre = q || stored;
    var cohortStart = parseISO(COHORT.opens);
    if (pre && /^\d{4}-\d{2}-\d{2}$/.test(pre)) { fmtSel.value = 'one'; startIn.value = pre; }
    else { startIn.value = iso(cohortStart); }
    function syncFormat() {
      var one = fmtSel.value === 'one';
      startField.hidden = !one;
      if (!one) startIn.value = iso(fmtSel.value === 'c10' ? parseISO(COHORT.next.opens) : cohortStart);
    }
    fmtSel.addEventListener('change', syncFormat);
    syncFormat();
    var note = $('#form-sent');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      var fd = new FormData(form);
      var role = fd.get('role') || 'unspecified';
      var fmtLabel = fmtSel.options[fmtSel.selectedIndex].text;
      var lines = [
        'Application — ASCENT',
        '',
        'Name: ' + fd.get('name'),
        'Email: ' + fd.get('email'),
        'Role: ' + role,
        'Format: ' + fmtLabel,
        'Start: ' + fmt(parseISO(startIn.value)),
        '',
        'What I am under:',
        fd.get('pressure'),
        '',
        'Floor on a bad day:',
        fd.get('floor') || '—'
      ];
      var mailto = 'mailto:apply@ascentprotocol.co?subject=' + encodeURIComponent('Application — ' + fd.get('name') + ' — ' + fmtLabel) + '&body=' + encodeURIComponent(lines.join('\n'));
      var ev = new CustomEvent('ascent:apply', { cancelable: true, detail: { mailto: mailto, data: Object.fromEntries(fd.entries()) } });
      var go = form.dispatchEvent(ev);
      note.hidden = false;
      note.scrollIntoView({ block: 'nearest', behavior: anim ? 'smooth' : 'auto' });
      if (go) window.location.href = mailto;
    });
  }

  /* ------------------------------------------------------------------ */
  /* Cohort dates written into the page.                                 */
  /* ------------------------------------------------------------------ */
  $$('[data-date]').forEach(function (n) {
    var k = n.getAttribute('data-date');
    var open = parseISO(COHORT.opens);
    if (k === 'open') n.textContent = fmt(open);
    else if (k === 'open-short') n.textContent = fmtShort(open) + ' ' + open.getFullYear();
    else if (k === 'close') n.textContent = fmt(addDays(open, COHORT.days - 1));
    else if (k === 'next') { var nx = parseISO(COHORT.next.opens); n.textContent = fmtShort(nx) + ' ' + nx.getFullYear(); }
    else if (k === 'year') n.textContent = String(today().getFullYear());
  });
})();

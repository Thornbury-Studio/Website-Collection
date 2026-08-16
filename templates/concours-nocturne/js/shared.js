/* NOCTURNE — shared chrome: the rosette store, the tray drawer, the lamp
   mechanic, reveals, and the submerging masthead. Zero dependencies. */
(function () {
  'use strict';
  document.documentElement.classList.remove('no-js');

  var N = window.NOC = {
    reduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    hoverable: window.matchMedia('(hover: hover)').matches
  };

  var KEY = 'nocturne.rosettes.v1';
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } }
  function save(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) { /* private mode */ } }
  N.pins = load();
  N.isPinned = function (id) { return N.pins.indexOf(id) !== -1; };
  N.togglePin = function (id) {
    var i = N.pins.indexOf(id);
    if (i === -1) N.pins.push(id); else N.pins.splice(i, 1);
    save(N.pins);
    N.paintPins();
    return i === -1;
  };

  /* the rosette SVG, one source of truth */
  N.rosette = function (cls) {
    return '<svg class="ros ' + (cls || '') + '" viewBox="0 0 20 20" aria-hidden="true">' +
      '<circle class="ros-fill" cx="10" cy="8" r="3.1"/>' +
      '<circle cx="10" cy="8" r="5.4"/>' +
      '<path d="M10 8m-3.1 0a3.1 3.1 0 1 0 6.2 0a3.1 3.1 0 1 0-6.2 0"/>' +
      '<path d="M7.8 12.8 6.4 18l3.6-2.4L13.6 18l-1.4-5.2"/>' +
      '</svg>';
  };

  /* repaint every pin control + tray count on the page */
  N.paintPins = function () {
    var count = N.pins.length;
    Array.prototype.forEach.call(document.querySelectorAll('.tray-btn output'), function (o) {
      o.textContent = count;
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-pin]'), function (b) {
      var on = N.isPinned(b.getAttribute('data-pin'));
      b.classList.toggle('pinned', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      var lbl = b.querySelector('.pin-label');
      if (lbl) lbl.textContent = on ? 'Rosette pinned' : 'Pin a rosette';
    });
    renderTray();
  };

  /* wire any pin button: stamp animation + toggle */
  N.bindPin = function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      var pinned = N.togglePin(btn.getAttribute('data-pin'));
      if (pinned && !N.reduced) {
        btn.classList.remove('stamp');
        btn.offsetWidth;
        btn.classList.add('stamp');
      }
    });
  };

  /* ---------------- the tray ---------------- */
  var tray, scrim, lastFocus = null;
  function buildTray() {
    tray = document.createElement('aside');
    tray.className = 'tray';
    tray.setAttribute('aria-label', 'Your rosettes');
    tray.innerHTML =
      '<div class="tray-head"><h2>Your rosettes</h2>' +
      '<button class="tray-close" type="button" aria-label="Close the tray">' +
      '<svg viewBox="0 0 14 14" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M2 2l10 10M12 2 2 12"/></svg>' +
      '</button></div>' +
      '<div class="tray-list"></div>' +
      '<div class="tray-foot"><a class="btn-ghost" href="invitation.html">Request an invitation</a></div>';
    scrim = document.createElement('div');
    scrim.className = 'tray-scrim';
    document.body.appendChild(scrim);
    document.body.appendChild(tray);
    tray.querySelector('.tray-close').addEventListener('click', closeTray);
    scrim.addEventListener('click', closeTray);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && tray.classList.contains('open')) closeTray();
    });
  }
  function openTray() {
    lastFocus = document.activeElement;
    renderTray();
    tray.classList.add('open');
    scrim.classList.add('on');
    tray.querySelector('.tray-close').focus();
  }
  function closeTray() {
    tray.classList.remove('open');
    scrim.classList.remove('on');
    if (lastFocus) lastFocus.focus();
  }
  function renderTray() {
    if (!tray) return;
    var list = tray.querySelector('.tray-list');
    var entries = (window.NOCTURNE_ENTRIES || []).filter(function (e) { return N.isPinned(e.id); });
    if (!entries.length) {
      list.innerHTML = '<p class="tray-empty">No rosettes pinned yet. Walk the field; when an entry deserves one, pin it — the tray keeps your picks for judging night.</p>';
      return;
    }
    list.innerHTML = entries.map(function (e) {
      return '<div class="tray-item">' +
        '<a href="entry.html?e=' + e.id + '"><img src="' + e.plate.src + '-800.webp" alt="" width="86" height="58" loading="lazy"></a>' +
        '<a href="entry.html?e=' + e.id + '"><span class="nm">' + e.name +
        '<small>Entry ' + e.no + ' · ' + (window.NOCTURNE_CLASSES[e.cls] || '') + '</small></span></a>' +
        '<button class="tray-unpin" type="button" data-unpin="' + e.id + '">Unpin</button>' +
        '</div>';
    }).join('');
    Array.prototype.forEach.call(list.querySelectorAll('[data-unpin]'), function (b) {
      b.addEventListener('click', function () { N.togglePin(b.getAttribute('data-unpin')); });
    });
  }
  buildTray();
  Array.prototype.forEach.call(document.querySelectorAll('.tray-btn'), function (b) {
    b.addEventListener('click', openTray);
  });

  /* ---------------- the lamp ---------------- */
  /* pointer position becomes --lx/--ly on any element carrying a .lamp */
  N.bindLamp = function (el) {
    if (!N.hoverable || N.reduced) return;
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect();
      el.style.setProperty('--lx', ((e.clientX - r.left) / r.width * 100).toFixed(2) + '%');
      el.style.setProperty('--ly', ((e.clientY - r.top) / r.height * 100).toFixed(2) + '%');
    });
    el.addEventListener('pointerleave', function () {
      el.style.setProperty('--ly', '140%');
    });
  };

  /* ---------------- masthead submerge ---------------- */
  (function () {
    var bar = document.querySelector('.mast');
    if (!bar) return;
    var last = window.scrollY, ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var y = window.scrollY;
        if (y < 120) bar.classList.remove('dived');
        else if (y > last + 4) bar.classList.add('dived');
        else if (y < last - 4) bar.classList.remove('dived');
        last = y;
        ticking = false;
      });
    }, { passive: true });
  })();

  /* ---------------- reveals ---------------- */
  N.rise = function () {
    var els = document.querySelectorAll('.rise');
    if (!('IntersectionObserver' in window) || N.reduced) {
      Array.prototype.forEach.call(els, function (el) { el.classList.add('lit'); });
      return;
    }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('lit'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.04 });
    Array.prototype.forEach.call(els, function (el) { io.observe(el); });
    setTimeout(function () {
      Array.prototype.forEach.call(els, function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('lit');
      });
    }, 1800);
  };

  /* srcset helper: our images ship at 2560 / 1600 / 800 */
  N.srcset = function (base) {
    return base + '-800.webp 800w, ' + base + '-1600.webp 1600w, ' + base + '-2560.webp 2560w';
  };
})();

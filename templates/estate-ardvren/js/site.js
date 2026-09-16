/* ARDVREN — shared behaviour: header drawer, reveal on entry, helpers. */
(function () {
  'use strict';

  var A = window.ARDVREN = window.ARDVREN || {};

  /* ---- helpers ---- */
  A.money = function (n) {
    return '£' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };
  A.esc = function (s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  };
  A.qs = function (name) {
    var m = new RegExp('[?&]' + name + '=([^&#]*)').exec(window.location.search);
    return m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : '';
  };
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  A.fmtDate = function (d) {
    return DAYS[d.getDay()] + ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()];
  };
  A.iso = function (d) {
    var m = d.getMonth() + 1, day = d.getDate();
    return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (day < 10 ? '0' : '') + day;
  };

  /* ---- header: drawer ---- */
  var burger = document.getElementById('burger');
  var drawer = document.getElementById('drawer');
  if (burger && drawer) {
    burger.addEventListener('click', function () {
      var open = burger.getAttribute('aria-expanded') !== 'true';
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      drawer.setAttribute('data-open', String(open));
      document.body.classList.toggle('is-locked', open);
    });
    drawer.addEventListener('click', function (e) {
      if (e.target.closest('a')) burger.click();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawer.getAttribute('data-open') === 'true') {
        burger.click();
        burger.focus();
      }
    });
  }

  /* ---- a page header clip, on wide screens only ---- */
  var headClip = document.querySelector('.hero__media video[data-src]');
  if (headClip && window.matchMedia('(min-width: 861px)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    headClip.setAttribute('src', headClip.getAttribute('data-src'));
    headClip.load();
    var hp = headClip.play();
    var hm = headClip.parentElement;
    if (hp && hp.then) hp.then(function () { hm.classList.add('has-video'); }).catch(function () { /* poster stands */ });
    else hm.classList.add('has-video');
  }

  /* ---- 3D tilt on photo tiles: pointer only, never on touch ---- */
  var tilts = document.querySelectorAll('[data-tilt]');
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (tilts.length && fine && !reduce) {
    tilts.forEach(function (el) {
      var glare = document.createElement('i');
      glare.className = 'glare';
      el.appendChild(glare);
      var raf = 0, px = 0.5, py = 0.5;
      function paint() {
        raf = 0;
        var rx = (0.5 - py) * 9;   // degrees
        var ry = (px - 0.5) * 9;
        el.style.transform = 'perspective(1200px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg) translateZ(8px)';
        el.style.setProperty('--gx', (px * 100).toFixed(1) + '%');
        el.style.setProperty('--gy', (py * 100).toFixed(1) + '%');
      }
      el.addEventListener('pointerenter', function () { el.classList.add('tilt-on'); });
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        px = (e.clientX - r.left) / r.width;
        py = (e.clientY - r.top) / r.height;
        if (!raf) raf = requestAnimationFrame(paint);
      });
      el.addEventListener('pointerleave', function () {
        el.classList.remove('tilt-on');
        el.style.transform = '';
      });
    });
  }

  /* ---- reveal on entry: the one motion ---- */
  var items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && items.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('is-in');
          io.unobserve(en.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('is-in'); });
  }
})();

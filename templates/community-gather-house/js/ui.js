/* Gather House — shared chrome, reveals, video IO */
(function () {
  'use strict';

  document.documentElement.classList.remove('no-js');
  document.documentElement.classList.add('js-anim');

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.GH = { reduced: reduced };

  /* ---------- mobile nav ---------- */
  var burger = document.getElementById('burger');
  var drawer = document.getElementById('drawer');
  if (burger && drawer) {
    burger.addEventListener('click', function () {
      var open = burger.getAttribute('aria-expanded') === 'true';
      burger.setAttribute('aria-expanded', open ? 'false' : 'true');
      drawer.hidden = open;
      document.body.classList.toggle('nav-open', !open);
    });
    drawer.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        burger.setAttribute('aria-expanded', 'false');
        drawer.hidden = true;
        document.body.classList.remove('nav-open');
      });
    });
  }

  /* ---------- header settle ---------- */
  var bar = document.querySelector('.site-header');
  if (bar) {
    var onScroll = function () {
      bar.classList.toggle('is-settled', window.scrollY > 20);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- reveals ---------- */
  var seen = false;
  var io = 'IntersectionObserver' in window
    ? new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            seen = true;
            en.target.classList.add('is-in');
            io.unobserve(en.target);
          }
        });
      }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 })
    : null;

  function rescan(root) {
    var els = (root || document).querySelectorAll('.reveal:not(.is-in)');
    if (!io || reduced) {
      els.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    els.forEach(function (el) { io.observe(el); });
  }
  window.GH.rescanReveals = rescan;
  rescan();

  function sweep() {
    var els = document.querySelectorAll('.reveal:not(.is-in)');
    if (!els.length) return;
    var vh = window.innerHeight;
    els.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < vh + 60 && r.bottom > -60) el.classList.add('is-in');
    });
  }
  var queued = false;
  function queueSweep() {
    if (queued) return;
    queued = true;
    setTimeout(function () { queued = false; sweep(); }, 120);
  }
  window.addEventListener('scroll', queueSweep, { passive: true });
  window.addEventListener('resize', queueSweep);
  setTimeout(function () {
    if (!seen) document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('is-in'); });
    else sweep();
  }, 1600);

  /* ---------- gallery stagger root ---------- */
  var staggerRoots = document.querySelectorAll('[data-stagger]');
  if (staggerRoots.length && !reduced && 'IntersectionObserver' in window) {
    var sio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-staggered');
        sio.unobserve(en.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -4% 0px' });
    staggerRoots.forEach(function (el) { sio.observe(el); });
  } else {
    staggerRoots.forEach(function (el) { el.classList.add('is-staggered'); });
  }

  /* ---------- video: play in view ---------- */
  var vio = 'IntersectionObserver' in window
    ? new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          var v = en.target;
          if (reduced) { v.pause(); return; }
          if (en.isIntersecting) {
            var p = v.play();
            if (p && p.catch) p.catch(function () {});
          } else {
            v.pause();
          }
        });
      }, { rootMargin: '80px 0px' })
    : null;

  document.querySelectorAll('video[data-io]').forEach(function (v) {
    if (reduced) {
      v.removeAttribute('autoplay');
      v.pause();
      return;
    }
    if (vio) vio.observe(v);
    else {
      var p = v.play();
      if (p && p.catch) p.catch(function () {});
    }
  });

  /* ---------- year ---------- */
  var y = document.querySelectorAll('[data-year]');
  var yr = String(new Date().getFullYear());
  y.forEach(function (el) { el.textContent = yr; });
}());

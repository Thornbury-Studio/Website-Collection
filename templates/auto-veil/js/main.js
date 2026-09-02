/* VEIL — snap screens, play only the film in view. */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var nav = document.getElementById('nav');
  var burger = document.getElementById('burger');
  var links = document.getElementById('navLinks');

  window.addEventListener('scroll', function () {
    nav.classList.toggle('is-solid', window.scrollY > 12 && !nav.classList.contains('on-paper'));
  }, { passive: true });

  if (burger) {
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      burger.setAttribute('aria-expanded', String(open));
    });
  }
  if (links) {
    links.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        nav.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  var videos = document.querySelectorAll('video.bg');
  videos.forEach(function (v) {
    var src = v.getAttribute('data-src');
    if (src) v.src = src;
  });

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var v = en.target;
        if (en.isIntersecting && en.intersectionRatio > 0.45) {
          if (!reduce) v.play().catch(function () {});
        } else {
          v.pause();
        }
      });
    }, { threshold: [0.45, 0.75] });
    videos.forEach(function (v) { io.observe(v); });
  } else if (!reduce) {
    videos.forEach(function (v) { v.play().catch(function () {}); });
  }

  var spec = document.getElementById('spec');
  if (spec && 'IntersectionObserver' in window) {
    var specIO = new IntersectionObserver(function (entries) {
      nav.classList.toggle('on-paper', entries[0].isIntersecting && entries[0].intersectionRatio > 0.35);
    }, { threshold: [0.35, 0.6] });
    specIO.observe(spec);
  }

  var prices = { sedan: 2400, coupe: 2800, suv: 3200 };
  var labels = { sedan: 'Sedan', coupe: 'Coupe', suv: 'SUV' };
  var inc = {
    sedan: 'Full front · 8-year hold · colour lock',
    coupe: 'Full front + roof · 8-year hold',
    suv: 'Full body · 8-year hold · rockers'
  };
  var priceEl = document.getElementById('price');
  var incEl = document.getElementById('inc');
  var orderBtn = document.getElementById('orderBtn');
  var tabs = document.querySelectorAll('.models button');

  tabs.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var m = btn.getAttribute('data-m');
      tabs.forEach(function (t) {
        t.classList.toggle('on', t === btn);
        t.setAttribute('aria-selected', t === btn ? 'true' : 'false');
      });
      if (priceEl) priceEl.textContent = prices[m].toLocaleString('en-SG');
      if (incEl) incEl.textContent = inc[m];
      if (orderBtn) orderBtn.textContent = 'Order ' + labels[m];
    });
  });
})();

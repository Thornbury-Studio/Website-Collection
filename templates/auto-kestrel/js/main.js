/* Kestrel Automobiles — homepage behaviour.
   Everything here is scroll-driven or a small piece of chrome; no libraries. */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- loader ---------- */
  var loader = $('#loader');
  function finishLoad() {
    if (!loader || loader.classList.contains('is-done')) return;
    loader.classList.add('is-done');
    document.body.classList.add('is-loaded');
  }
  window.addEventListener('load', function () { setTimeout(finishLoad, 350); });
  setTimeout(finishLoad, 2200); // never hold the page hostage to a slow asset

  /* ---------- year ---------- */
  $$('[data-year]').forEach(function (el) { el.textContent = String(new Date().getFullYear()); });

  /* ---------- menu ---------- */
  var menuBtn = $('#menuBtn');
  var menu = $('#menu');
  var lastFocus = null;

  function openMenu() {
    lastFocus = document.activeElement;
    menu.hidden = false;
    // next frame so the transform transition runs
    requestAnimationFrame(function () { menu.classList.add('is-open'); });
    menuBtn.setAttribute('aria-expanded', 'true');
    menuBtn.setAttribute('aria-label', 'Close menu');
    document.body.classList.add('menu-open');
    var first = $('a', menu);
    if (first) setTimeout(function () { first.focus(); }, 300);
  }
  function closeMenu() {
    menu.classList.remove('is-open');
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.setAttribute('aria-label', 'Open menu');
    document.body.classList.remove('menu-open');
    var onEnd = function () { if (!menu.classList.contains('is-open')) menu.hidden = true; menu.removeEventListener('transitionend', onEnd); };
    menu.addEventListener('transitionend', onEnd);
    setTimeout(onEnd, 800);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  if (menuBtn && menu) {
    menuBtn.addEventListener('click', function () {
      if (menu.classList.contains('is-open')) closeMenu(); else openMenu();
    });
    $$('[data-menu-link]', menu).forEach(function (a) { a.addEventListener('click', closeMenu); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) closeMenu();
    });
  }

  /* ---------- reveal on scroll ---------- */
  var reveals = $$('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- scroll-driven pieces ---------- */
  var hero = $('#hero');
  var heroVideo = $('#heroVideo');
  var heroCopy = $('.hero-copy', hero);
  var axiomFrame = $('#axiomFrame');
  var heritage = $('#heritage');
  var floats = $$('.hf', heritage).map(function (el) {
    return { el: el, speed: parseFloat(el.getAttribute('data-speed')) || 0 };
  });

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }

  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

  function update() {
    ticking = false;
    var vh = window.innerHeight;

    // Hero: the film fades to black across the first viewport of travel while
    // the headline stays pinned, then the white "making of" panel rides over it.
    if (hero && heroVideo) {
      var r = hero.getBoundingClientRect();
      var travel = r.height - vh;
      var p = travel > 0 ? clamp01(-r.top / travel) : 0;
      var fade = 1 - clamp01((p - 0.15) / 0.6);
      heroVideo.style.opacity = fade.toFixed(3);
      if (heroCopy) heroCopy.style.opacity = (1 - clamp01((p - 0.94) / 0.06)).toFixed(3);
      if (r.bottom < 0 && !heroVideo.paused) heroVideo.pause();
      else if (r.bottom >= 0 && heroVideo.paused && !reduceMotion) heroVideo.play().catch(function () {});
    }

    // Axiom frame: full-bleed when it enters, then clips inward to a framed
    // panel as it scrolls up — the black band becomes a picture in a white mat.
    if (axiomFrame && !reduceMotion) {
      var a = axiomFrame.getBoundingClientRect();
      var ap = clamp01((vh - a.top) / (vh + a.height * 0.6));
      var inset = Math.round(ap * Math.min(56, window.innerWidth * 0.035));
      axiomFrame.style.clipPath = 'inset(0 ' + inset + 'px 0 ' + inset + 'px)';
    }

    // Heritage: each archive image drifts at its own rate.
    if (heritage && floats.length && !reduceMotion && window.innerWidth > 760) {
      var h = heritage.getBoundingClientRect();
      var center = (h.top + h.height / 2) - vh / 2;
      floats.forEach(function (f) {
        f.el.style.transform = 'translate3d(0,' + (center * f.speed).toFixed(1) + 'px,0)';
      });
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();

  /* ---------- axiom video ---------- */
  var axiomVideo = $('#axiomVideo');
  var axiomPlay = $('#axiomPlay');
  if (axiomVideo && axiomPlay) {
    // Start the loop silently once it comes near; the button then unmutes.
    if ('IntersectionObserver' in window && !reduceMotion) {
      var vio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { axiomVideo.preload = 'auto'; axiomVideo.play().catch(function () {}); }
          else axiomVideo.pause();
        });
      }, { rootMargin: '200px 0px' });
      vio.observe(axiomVideo);
    }
    axiomPlay.addEventListener('click', function () {
      axiomVideo.muted = false;
      axiomVideo.currentTime = 0;
      axiomVideo.controls = true;
      axiomVideo.play().catch(function () {});
      axiomFrame.classList.add('is-playing');
    });
  }

  /* ---------- register form ---------- */
  var form = $('#registerForm');
  var note = $('#registerNote');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = $('#regEmail');
      if (!email.value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
        email.focus();
        email.setAttribute('aria-invalid', 'true');
        note.textContent = 'Please enter a valid email address.';
        note.hidden = false;
        return;
      }
      email.removeAttribute('aria-invalid');
      note.textContent = "Thank you. You'll hear from us first.";
      note.hidden = false;
      form.reset();
    });
  }
})();

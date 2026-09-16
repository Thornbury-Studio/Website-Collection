/* ARDVREN — home page: the hero slider, the film band and its dialog, the gallery lightbox. */
(function () {
  'use strict';

  var A = window.ARDVREN;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var wide = window.matchMedia('(min-width: 861px)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---- video only where it earns its bytes: wide screens, no reduced motion ---- */
  function wake(video) {
    if (!video || !wide || reduce) return false;
    if (!video.getAttribute('src')) {
      video.setAttribute('src', video.getAttribute('data-src'));
      video.load();
    }
    var p = video.play();
    if (p && p.catch) p.catch(function () { /* autoplay refused: the poster stands */ });
    return true;
  }

  /* ---- hero slider ---- */
  var hero = document.getElementById('hero');
  var stage = document.getElementById('heroStage');
  if (hero && stage) {
    var slides = stage.querySelectorAll('.slide');
    var caps = document.querySelectorAll('#heroCaps .hero__cap');
    var tabs = document.querySelectorAll('#heroIndex button');
    var DWELL = 7000;
    var cur = 0, timer = 0, paused = false;

    function show(n) {
      cur = (n + slides.length) % slides.length;
      slides.forEach(function (s, i) {
        var on = i === cur;
        s.setAttribute('aria-hidden', String(!on));
        var v = s.querySelector('video');
        if (v) {
          if (on) { if (wake(v)) s.classList.add('has-video'); }
          else if (!v.paused) v.pause();
        }
      });
      caps.forEach(function (c, i) { c.hidden = i !== cur; });
      tabs.forEach(function (t, i) {
        t.setAttribute('aria-current', String(i === cur));
        // restart the progress line by re-inserting it
        var bar = t.querySelector('i');
        if (bar && i === cur) { var nb = bar.cloneNode(false); t.replaceChild(nb, bar); }
      });
      var nextImg = slides[(cur + 1) % slides.length].querySelector('img');
      if (nextImg) nextImg.loading = 'eager';
      arm();
    }
    function arm() {
      clearTimeout(timer);
      if (reduce || paused) return;
      timer = setTimeout(function () { show(cur + 1); }, DWELL);
    }
    function pause(on) {
      paused = on;
      hero.classList.toggle('is-paused', on);
      if (on) clearTimeout(timer); else arm();
    }
    tabs.forEach(function (t) { t.addEventListener('click', function () { show(+t.getAttribute('data-go')); }); });
    document.getElementById('heroPrev').addEventListener('click', function () { show(cur - 1); });
    document.getElementById('heroNext').addEventListener('click', function () { show(cur + 1); });
    document.addEventListener('keydown', function (e) {
      if (document.querySelector('dialog[open]')) return;
      if (e.key === 'ArrowRight') show(cur + 1);
      if (e.key === 'ArrowLeft') show(cur - 1);
    });
    var x0 = null;
    stage.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 48) show(dx < 0 ? cur + 1 : cur - 1);
      x0 = null;
    }, { passive: true });
    hero.addEventListener('mouseenter', function () { pause(true); });
    hero.addEventListener('mouseleave', function () { pause(false); });
    hero.addEventListener('focusin', function () { pause(true); });
    hero.addEventListener('focusout', function () { pause(false); });
    document.addEventListener('visibilitychange', function () { pause(document.hidden); });

    // 2.5D: the photograph and the caption drift against the pointer at different rates
    if (fine && !reduce) {
      var par = stage.querySelector('.hero__par');
      var body = hero.querySelector('.hero__body');
      var raf = 0, mx = 0, my = 0;
      hero.addEventListener('pointermove', function (e) {
        var r = hero.getBoundingClientRect();
        mx = (e.clientX - r.left) / r.width - 0.5;
        my = (e.clientY - r.top) / r.height - 0.5;
        if (!raf) raf = requestAnimationFrame(function () {
          raf = 0;
          if (par) par.style.transform = 'translate3d(' + (-mx * 22).toFixed(1) + 'px,' + (-my * 14).toFixed(1) + 'px,0)';
          if (body) body.style.transform = 'translate3d(' + (mx * 8).toFixed(1) + 'px,' + (my * 5).toFixed(1) + 'px,0)';
        });
      });
      hero.addEventListener('pointerleave', function () {
        if (par) par.style.transform = '';
        if (body) body.style.transform = '';
      });
    }
    show(0);
  }

  /* ---- film band: the loop wakes when the band nears the viewport ---- */
  var film = document.getElementById('film');
  if (film) {
    var loop = film.querySelector('.film__bg video');
    if (loop && 'IntersectionObserver' in window) {
      var fio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { if (wake(loop)) film.classList.add('has-video'); }
          else if (!loop.paused) loop.pause();
        });
      }, { rootMargin: '200px 0px' });
      fio.observe(film);
    }
  }

  /* ---- film dialog with three chapters ---- */
  var CHAPTERS = [
    { src: 'video/film-forest.mp4', poster: 'img/film-forest-poster.webp' },
    { src: 'video/film-loch.mp4', poster: 'img/film-loch-poster.webp' },
    { src: 'video/film-shore.mp4', poster: 'img/film-shore-poster.webp' }
  ];
  var modal = document.getElementById('filmModal');
  var video = document.getElementById('filmVideo');
  if (modal && video && typeof modal.showModal === 'function') {
    var chips = modal.querySelectorAll('.chip');
    function load(n, play) {
      chips.forEach(function (c, i) { c.setAttribute('aria-pressed', String(i === n)); });
      video.pause();
      video.poster = CHAPTERS[n].poster;
      video.querySelector('source').src = CHAPTERS[n].src;
      video.load();
      if (play) {
        var p = video.play();
        if (p && p.catch) p.catch(function () { /* the controls are there */ });
      }
    }
    function open(n) {
      modal.showModal();
      document.body.classList.add('is-locked');
      load(n, true);
    }
    function close() { video.pause(); modal.close(); }
    document.querySelectorAll('[data-chapter]').forEach(function (btn) {
      if (btn.classList.contains('chip')) btn.addEventListener('click', function () { load(+btn.getAttribute('data-chapter'), true); });
      else btn.addEventListener('click', function () { open(+btn.getAttribute('data-chapter')); });
    });
    document.getElementById('filmClose').addEventListener('click', close);
    modal.addEventListener('click', function (e) { if (e.target === modal) close(); });
    modal.addEventListener('close', function () {
      video.pause();
      document.body.classList.remove('is-locked');
    });
    video.addEventListener('ended', function () {
      var n = 0;
      chips.forEach(function (c, i) { if (c.getAttribute('aria-pressed') === 'true') n = i; });
      if (n < CHAPTERS.length - 1) load(n + 1, true);
    });
  }

  /* ---- gallery lightbox ---- */
  var gal = document.getElementById('gallery');
  var box = document.getElementById('lightbox');
  if (gal && box && typeof box.showModal === 'function') {
    var shots = Array.prototype.slice.call(gal.querySelectorAll('button'));
    var big = document.getElementById('lbImg');
    var cap = document.getElementById('lbCap');
    var count = document.getElementById('lbCount');
    var at = 0;
    function put(n) {
      at = (n + shots.length) % shots.length;
      var b = shots[at];
      big.src = b.getAttribute('data-full');
      big.alt = b.querySelector('img').alt;
      cap.innerHTML = '<b>' + A.esc(b.getAttribute('data-title')) + '</b>' + A.esc(b.getAttribute('data-when'));
      count.textContent = (at + 1) + ' / ' + shots.length;
    }
    shots.forEach(function (b, i) {
      b.addEventListener('click', function () {
        put(i);
        box.showModal();
        document.body.classList.add('is-locked');
      });
    });
    document.getElementById('lbPrev').addEventListener('click', function () { put(at - 1); });
    document.getElementById('lbNext').addEventListener('click', function () { put(at + 1); });
    document.getElementById('lbClose').addEventListener('click', function () { box.close(); });
    box.addEventListener('click', function (e) { if (e.target === box) box.close(); });
    box.addEventListener('close', function () { document.body.classList.remove('is-locked'); });
    document.addEventListener('keydown', function (e) {
      if (!box.open) return;
      if (e.key === 'ArrowRight') put(at + 1);
      if (e.key === 'ArrowLeft') put(at - 1);
    });
  }
})();

/* AUREL — main.js (shared by index.html and collection.html)
   Vanilla, no dependencies. Every page-specific block is guarded, so the
   same file runs on both pages. Chapter switching, reveals, and video
   play/pause are IO-driven; there are no persistent rAF loops. */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (id) { return document.getElementById(id); };

  /* ---------- nav scrolled state ---------- */

  var nav = $('nav');
  if (nav && !nav.classList.contains('is-solid')) {
    var lastScrolled = false;
    var onScroll = function () {
      var scrolled = window.scrollY > 30;
      if (scrolled !== lastScrolled) {
        lastScrolled = scrolled;
        nav.classList.toggle('is-scrolled', scrolled);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- hero entrance + video ---------- */

  var hero = document.querySelector('.hero');
  if (hero) {
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { hero.classList.add('is-ready'); });
    });
    var heroVideo = $('heroVideo');
    if (heroVideo && reduceMotion) {
      heroVideo.removeAttribute('autoplay');
      heroVideo.pause();
    }
  }

  /* ---------- reveal on scroll (single IO) ---------- */

  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var revealIO = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) {
          entries[i].target.classList.add('is-in');
          revealIO.unobserve(entries[i].target);
        }
      }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    revealEls.forEach(function (el) { revealIO.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- movements: scroll-driven chapters ----------
     The sticky stage lives inside a 340vh track. Scroll progress through
     the track picks the chapter, derived from one getBoundingClientRect
     per scroll event, throttled through rAF. On mobile (<=900px) the
     section is static and this is skipped entirely. */

  var track = $('movementsTrack');
  if (track && 'IntersectionObserver' in window) {
    var chapters = document.querySelectorAll('.chapter');
    var mediaItems = document.querySelectorAll('.media-item');
    var progressPips = document.querySelectorAll('.chapter-progress i');
    var dialVideo = $('dialVideo');
    var currentChapter = 0;
    var ticking = false;

    var setChapter = function (idx) {
      if (idx === currentChapter) return;
      currentChapter = idx;
      chapters.forEach(function (c) { c.classList.toggle('is-active', +c.dataset.chapter === idx); });
      mediaItems.forEach(function (m) { m.classList.toggle('is-active', +m.dataset.chapter === idx); });
      progressPips.forEach(function (p, i) { p.classList.toggle('is-on', i <= idx); });
      if (dialVideo) {
        if (idx === 0 && !reduceMotion) { dialVideo.play().catch(function () {}); }
        else { dialVideo.pause(); }
      }
    };

    var updateChapter = function () {
      ticking = false;
      var r = track.getBoundingClientRect();
      var scrollable = r.height - window.innerHeight;
      if (scrollable <= 0) return;
      var p = Math.min(Math.max(-r.top / scrollable, 0), 0.999);
      setChapter(Math.floor(p * 3));
    };

    var onStageScroll = function () {
      if (!ticking && window.matchMedia('(min-width: 901px)').matches) {
        ticking = true;
        requestAnimationFrame(updateChapter);
      }
    };

    new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) {
        window.addEventListener('scroll', onStageScroll, { passive: true });
        onStageScroll();
        if (dialVideo && currentChapter === 0 && !reduceMotion) dialVideo.play().catch(function () {});
      } else {
        window.removeEventListener('scroll', onStageScroll);
        if (dialVideo) dialVideo.pause();
      }
    }, { threshold: 0 }).observe(track);
  }

  /* ---------- collectors' quotes ---------- */

  var stage = $('quoteStage');
  if (stage) {
    var quotes = stage.querySelectorAll('.quote');
    var dotsWrap = $('qDots');
    var current = 0;
    var timer = null;

    quotes.forEach(function (_, i) {
      var dot = document.createElement('button');
      dot.className = 'q-dot';
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', 'Quote ' + (i + 1));
      dot.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      dot.addEventListener('click', function () { goTo(i, true); });
      dotsWrap.appendChild(dot);
    });
    var dots = dotsWrap.children;

    var startAuto = function () {
      if (reduceMotion || timer) return;
      timer = setInterval(function () { goTo(current + 1, false); }, 7000);
    };
    var stopAuto = function () { if (timer) { clearInterval(timer); timer = null; } };

    function goTo(i, manual) {
      quotes[current].classList.remove('is-active');
      dots[current].setAttribute('aria-selected', 'false');
      current = (i + quotes.length) % quotes.length;
      quotes[current].classList.add('is-active');
      dots[current].setAttribute('aria-selected', 'true');
      if (manual) { stopAuto(); startAuto(); }
    }

    $('qPrev').addEventListener('click', function () { goTo(current - 1, true); });
    $('qNext').addEventListener('click', function () { goTo(current + 1, true); });

    stage.addEventListener('pointerenter', stopAuto);
    stage.addEventListener('pointerleave', startAuto);
    stage.addEventListener('focusin', stopAuto);
    stage.addEventListener('focusout', startAuto);

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries[0].isIntersecting ? startAuto() : stopAuto();
      }, { threshold: 0.3 }).observe(stage);
    } else {
      startAuto();
    }
  }

  /* ---------- reserve dialog (both pages) ---------- */

  var dialog = $('reserveDialog');
  if (dialog) {
    var stepForm = $('rdStepForm');
    var stepDone = $('rdStepDone');
    var rdKicker = $('rdKicker');
    var rdName = $('rdName');
    var rdEmail = $('rdEmail');
    var rdError = $('rdError');

    // exposed so collection.js can hand off from the quick-look dialog
    window.aurelOpenReserve = function (label) {
      rdKicker.textContent = label ? 'AUREL — ' + label : 'AUREL';
      stepForm.hidden = false;
      stepDone.hidden = true;
      rdError.hidden = true;
      rdName.classList.remove('is-invalid');
      rdEmail.classList.remove('is-invalid');
      dialog.showModal();
    };

    document.addEventListener('click', function (e) {
      var trigger = e.target.closest('[data-reserve]');
      if (!trigger) return;
      window.aurelOpenReserve(trigger.getAttribute('data-reserve'));
    });

    $('rdClose').addEventListener('click', function () { dialog.close(); });
    $('rdDoneClose').addEventListener('click', function () { dialog.close(); });
    dialog.addEventListener('click', function (e) {
      if (e.target === dialog) dialog.close();
    });

    $('reserveForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      [rdName, rdEmail].forEach(function (input) {
        var valid = input.value.trim().length > 1;
        input.classList.toggle('is-invalid', !valid);
        if (!valid) ok = false;
      });
      rdError.hidden = ok;
      if (!ok) return;
      stepForm.hidden = true;
      stepDone.hidden = false;
      $('rdDoneTitle').textContent = 'Noted, and held, ' + rdName.value.trim().split(/\s+/)[0] + '.';
    });
  }

  /* ---------- footer year ---------- */

  var year = $('year');
  if (year) year.textContent = new Date().getFullYear();
})();

/* AMICUS — main.js
   Vanilla, no dependencies. Everything is IO-gated or event-driven;
   there are no persistent rAF loops. Effects: transform/opacity only. */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- nav: scrolled state + mobile menu ---------- */

  var nav = document.getElementById('nav');
  var lastScrolled = false;
  function onScroll() {
    var scrolled = window.scrollY > 24;
    if (scrolled !== lastScrolled) {
      lastScrolled = scrolled;
      nav.classList.toggle('is-scrolled', scrolled);
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var burger = document.getElementById('navBurger');
  var navLinks = document.getElementById('navLinks');
  burger.addEventListener('click', function () {
    var open = nav.classList.toggle('menu-open');
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  navLinks.addEventListener('click', function (e) {
    if (e.target.tagName === 'A' && nav.classList.contains('menu-open')) {
      nav.classList.remove('menu-open');
      burger.setAttribute('aria-expanded', 'false');
    }
  });

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

  /* ---------- count-up numbers (IO-gated, one-shot) ---------- */

  function countUp(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    var suffix = el.getAttribute('data-suffix') || '';
    if (reduceMotion) {
      el.textContent = target.toLocaleString('en-US') + suffix;
      return;
    }
    var dur = 1400;
    var start = null;
    function frame(t) {
      if (start === null) start = t;
      var p = Math.min((t - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString('en-US') + suffix;
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  var counts = document.querySelectorAll('.count');
  if ('IntersectionObserver' in window) {
    var countIO = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) {
          countUp(entries[i].target);
          countIO.unobserve(entries[i].target);
        }
      }
    }, { threshold: 0.6 });
    counts.forEach(function (el) { countIO.observe(el); });
  } else {
    counts.forEach(countUp);
  }

  /* ---------- intake form: two panes + honest fake submit ---------- */

  var form = document.getElementById('intakeForm');
  var paneType = document.getElementById('paneType');
  var paneDetails = document.getElementById('paneDetails');
  var paneDone = document.getElementById('paneDone');
  var stepLabel = document.getElementById('intakeStep');
  var fieldError = document.getElementById('fieldError');
  var chosenCase = 'your matter';

  function showPane(pane) {
    [paneType, paneDetails, paneDone].forEach(function (p) {
      p.classList.toggle('is-active', p === pane);
    });
  }

  document.getElementById('chipGrid').addEventListener('click', function (e) {
    var chip = e.target.closest('.chip');
    if (!chip) return;
    chosenCase = chip.getAttribute('data-case');
    showPane(paneDetails);
    stepLabel.textContent = 'Step 2 of 2';
    document.getElementById('fName').focus();
  });

  document.getElementById('backBtn').addEventListener('click', function () {
    showPane(paneType);
    stepLabel.textContent = 'Takes ~30 seconds';
    fieldError.hidden = true;
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = document.getElementById('fName');
    var contact = document.getElementById('fPhone');
    var ok = true;
    [name, contact].forEach(function (input) {
      var valid = input.value.trim().length > 1;
      input.classList.toggle('is-invalid', !valid);
      if (!valid) ok = false;
    });
    fieldError.hidden = ok;
    if (!ok) return;

    var first = name.value.trim().split(/\s+/)[0];
    first = first.charAt(0).toUpperCase() + first.slice(1);
    document.getElementById('doneTitle').textContent = 'Thank you, ' + first + '.';
    showPane(paneDone);
    stepLabel.textContent = 'Request received';
  });

  form.addEventListener('input', function (e) {
    if (e.target.classList.contains('is-invalid') && e.target.value.trim().length > 1) {
      e.target.classList.remove('is-invalid');
      if (paneDetails.querySelectorAll('.is-invalid').length === 0) fieldError.hidden = true;
    }
  });

  /* ---------- case ledger accordion (delegated) ---------- */

  document.getElementById('ledger').addEventListener('click', function (e) {
    var row = e.target.closest('.case-row');
    if (!row) return;
    var item = row.closest('.case');
    var open = item.classList.toggle('is-open');
    row.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  /* ---------- testimonials rotator ---------- */

  var stage = document.getElementById('quoteStage');
  var quotes = stage.querySelectorAll('.quote');
  var dotsWrap = document.getElementById('qDots');
  var current = 0;
  var timer = null;

  quotes.forEach(function (_, i) {
    var dot = document.createElement('button');
    dot.className = 'q-dot';
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', 'Testimonial ' + (i + 1));
    dot.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    dot.addEventListener('click', function () { goTo(i, true); });
    dotsWrap.appendChild(dot);
  });
  var dots = dotsWrap.children;

  function goTo(i, manual) {
    quotes[current].classList.remove('is-active');
    dots[current].setAttribute('aria-selected', 'false');
    current = (i + quotes.length) % quotes.length;
    quotes[current].classList.add('is-active');
    dots[current].setAttribute('aria-selected', 'true');
    if (manual) restartAuto();
  }

  document.getElementById('qPrev').addEventListener('click', function () { goTo(current - 1, true); });
  document.getElementById('qNext').addEventListener('click', function () { goTo(current + 1, true); });

  function startAuto() {
    if (reduceMotion || timer) return;
    timer = setInterval(function () { goTo(current + 1, false); }, 6500);
  }
  function stopAuto() {
    if (timer) { clearInterval(timer); timer = null; }
  }
  function restartAuto() { stopAuto(); startAuto(); }

  stage.addEventListener('pointerenter', stopAuto);
  stage.addEventListener('pointerleave', startAuto);
  stage.addEventListener('focusin', stopAuto);
  stage.addEventListener('focusout', startAuto);

  /* only rotate while on screen */
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      entries[0].isIntersecting ? startAuto() : stopAuto();
    }, { threshold: 0.3 }).observe(stage);
  } else {
    startAuto();
  }

  /* ---------- footer year ---------- */

  document.getElementById('year').textContent = new Date().getFullYear();
})();

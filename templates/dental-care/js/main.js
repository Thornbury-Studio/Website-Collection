/* BRIGHTSIDE — main.js
   Vanilla, no dependencies. Reveals and count-ups are IO-gated; the
   testimonial rotator only runs while on screen. No persistent rAF loops.
   Effects: transform/opacity only. */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (id) { return document.getElementById(id); };

  /* ---------- nav ---------- */

  var nav = $('nav');
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

  var burger = $('navBurger');
  var navLinks = $('navLinks');
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

  /* ---------- reveal on scroll ---------- */

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

  /* ---------- count-ups ---------- */

  function countUp(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    var suffix = el.getAttribute('data-suffix') || '';
    if (reduceMotion) {
      el.textContent = target.toLocaleString('en-US') + suffix;
      return;
    }
    var dur = 1300;
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

  var counts = document.querySelectorAll('.count:not([data-prefix])');
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

  /* ---------- comfort menu (delegated) ---------- */

  var comfortNote = $('comfortNote');
  var comfortMsgs = [
    'Choose anything that helps. We’ll have it ready.',
    'Noted — one thing ready for you.',
    'Two things ready. This is going to be fine.',
    'Three! You’re basically checking into a spa.',
    'Four — the deluxe treatment. Genuinely no judgment.',
    'Five. Dr. Rosa approves of thoroughness.',
    'All six. You may never want to leave.'
  ];
  $('comfortList').addEventListener('click', function (e) {
    var chip = e.target.closest('.comfort-chip');
    if (!chip) return;
    var on = chip.getAttribute('aria-pressed') !== 'true';
    chip.setAttribute('aria-pressed', on ? 'true' : 'false');
    var picked = document.querySelectorAll('.comfort-chip[aria-pressed="true"]').length;
    comfortNote.textContent = comfortMsgs[Math.min(picked, comfortMsgs.length - 1)];
  });

  /* ---------- testimonials ---------- */

  var stage = $('quoteStage');
  var quotes = stage.querySelectorAll('.quote');
  var dotsWrap = $('qDots');
  var current = 0;
  var timer = null;

  quotes.forEach(function (_, i) {
    var dot = document.createElement('button');
    dot.className = 'q-dot';
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', 'Review ' + (i + 1));
    dot.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    dot.addEventListener('click', function () { goTo(i, true); });
    dotsWrap.appendChild(dot);
  });
  var dots = dotsWrap.children;

  function startAuto() {
    if (reduceMotion || timer) return;
    timer = setInterval(function () { goTo(current + 1, false); }, 6500);
  }
  function stopAuto() { if (timer) { clearInterval(timer); timer = null; } }

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

  /* ---------- booking form ---------- */

  var chosenSlot = '';
  $('slotGrid').addEventListener('click', function (e) {
    var slot = e.target.closest('.slot');
    if (!slot) return;
    document.querySelectorAll('.slot').forEach(function (s) {
      s.classList.toggle('is-picked', s === slot);
    });
    chosenSlot = slot.getAttribute('data-slot');
  });

  $('bookForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var name = $('bkName');
    var phone = $('bkPhone');
    var ok = true;
    [name, phone].forEach(function (input) {
      var valid = input.value.trim().length > 1;
      input.classList.toggle('is-invalid', !valid);
      if (!valid) ok = false;
    });
    $('bkError').hidden = ok;
    if (!ok) return;

    var first = name.value.trim().split(/\s+/)[0];
    first = first.charAt(0).toUpperCase() + first.slice(1);
    $('bookDoneTitle').textContent = 'Lovely, ' + first + ' — request in.';
    if (chosenSlot) {
      // "Saturday" keeps its capital; "Weekday mornings" reads better lowercased
      var slotText = chosenSlot === 'Saturday' ? chosenSlot : chosenSlot.toLowerCase();
      $('bookDoneCopy').textContent =
        'A real person will call you back within the hour (open hours) with ' +
        slotText + ' options to choose from. Nothing is booked until you say so.';
    }
    $('bookStepForm').hidden = true;
    $('bookStepDone').hidden = false;
  });

  $('bookForm').addEventListener('input', function (e) {
    if (e.target.classList.contains('is-invalid') && e.target.value.trim().length > 1) {
      e.target.classList.remove('is-invalid');
      if (document.querySelectorAll('#bookForm .is-invalid').length === 0) $('bkError').hidden = true;
    }
  });

  /* ---------- footer year ---------- */

  $('year').textContent = new Date().getFullYear();
})();

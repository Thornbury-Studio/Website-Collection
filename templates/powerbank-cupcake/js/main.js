/* CUPCAKE — main.js
   Vanilla, no dependencies. One rAF-throttled scroll listener drives the
   nav battery; everything else is IO-gated or event-driven. Effects:
   transform/opacity only (the battery fill is a scaleX transform). */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (id) { return document.getElementById(id); };

  /* ---------- hero entrance ---------- */

  requestAnimationFrame(function () {
    requestAnimationFrame(function () { document.body.classList.add('is-ready'); });
  });

  /* ---------- nav + scroll-to-charge battery ----------
     One passive scroll listener, throttled through rAF. The fill is a
     scaleX transform (compositor-only) and the label only rewrites when
     the rounded percentage actually changes. */

  var nav = $('nav');
  var chargeFill = $('chargeFill');
  var chargeLabel = $('chargeLabel');
  var chargeWrap = chargeFill.closest('.charge');
  var lastPct = -1;
  var lastScrolled = false;
  var scrollRaf = 0;

  function onScrollFrame() {
    scrollRaf = 0;
    var y = window.scrollY;

    var scrolled = y > 24;
    if (scrolled !== lastScrolled) {
      lastScrolled = scrolled;
      nav.classList.toggle('is-scrolled', scrolled);
    }

    var max = document.documentElement.scrollHeight - window.innerHeight;
    var p = max > 0 ? Math.min(Math.max(y / max, 0), 1) : 0;
    var pct = Math.round(p * 100);
    chargeFill.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    if (pct !== lastPct) {
      lastPct = pct;
      chargeLabel.textContent = pct + '%';
      chargeWrap.classList.toggle('is-full', pct >= 100);
    }
  }

  window.addEventListener('scroll', function () {
    if (!scrollRaf) scrollRaf = requestAnimationFrame(onScrollFrame);
  }, { passive: true });
  onScrollFrame();

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

  /* ---------- true-loop ticker (see PATTERNS.md) ----------
     Clones the first row until half the track covers the container,
     detaching the animation first so the duration change can't jump. */

  function trueLoopMarquee(track, secondsPerCopy) {
    if (!track || !track.firstElementChild) return;
    var master = track.firstElementChild.cloneNode(true);
    var timer;

    function build() {
      track.style.animationName = 'none';

      while (track.children.length > 1) track.removeChild(track.lastElementChild);
      var rowW = track.firstElementChild.getBoundingClientRect().width;
      var boxW = (track.parentElement || document.body).getBoundingClientRect().width;
      if (rowW < 1) { track.style.animationName = ''; return; }

      var perHalf = Math.max(1, Math.ceil(boxW / rowW));
      for (var i = 1; i < perHalf * 2; i++) {
        var copy = master.cloneNode(true);
        copy.setAttribute('aria-hidden', 'true');
        track.appendChild(copy);
      }
      track.style.animationDuration = (secondsPerCopy * perHalf) + 's';

      void track.offsetWidth; // commit animation-name:none before restoring
      track.style.animationName = '';
    }

    build();
    window.addEventListener('resize', function () {
      clearTimeout(timer);
      timer = setTimeout(build, 200);
    });
  }
  trueLoopMarquee($('ticker'), 24);

  /* ---------- spec count-ups ---------- */

  function countUp(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    if (reduceMotion) { el.textContent = target.toLocaleString('en-US'); return; }
    var dur = 1400;
    var start = null;
    function frame(t) {
      if (start === null) start = t;
      var p = Math.min((t - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString('en-US');
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  var counts = document.querySelectorAll('.spec-num');
  if ('IntersectionObserver' in window) {
    var countIO = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) {
          countUp(entries[i].target);
          countIO.unobserve(entries[i].target);
        }
      }
    }, { threshold: 0.5 });
    counts.forEach(function (el) { countIO.observe(el); });
  } else {
    counts.forEach(countUp);
  }

  /* ---------- "cake left" readout ticks down slowly while visible ---------- */

  var cakeEl = $('cakeLeft');
  if (cakeEl && 'IntersectionObserver' in window && !reduceMotion) {
    var cake = 87;
    var cakeTimer = null;
    new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) {
        if (!cakeTimer) cakeTimer = setInterval(function () {
          cake = cake > 80 ? cake - 1 : 87;   // drains a little, then "recharges"
          cakeEl.textContent = cake;
        }, 2400);
      } else if (cakeTimer) {
        clearInterval(cakeTimer); cakeTimer = null;
      }
    }, { threshold: 0.4 }).observe(cakeEl);
  }

  /* ---------- flavor switcher ---------- */

  var flavors = $('flavors');
  flavors.addEventListener('click', function (e) {
    var btn = e.target.closest('.flavor');
    if (!btn) return;
    document.body.setAttribute('data-flavor', btn.getAttribute('data-flavor'));
    flavors.querySelectorAll('.flavor').forEach(function (f) {
      f.classList.toggle('is-on', f === btn);
    });
  });

  /* ---------- fake cart button ---------- */

  var buyBtn = $('buyBtn');
  var bought = false;
  buyBtn.addEventListener('click', function () {
    if (bought) return;
    bought = true;
    buyBtn.querySelector('span').textContent = 'In cart — it isn’t, this is a demo';
    setTimeout(function () {
      buyBtn.querySelector('span').textContent = 'Add to cart';
      bought = false;
    }, 2600);
  });

  /* ---------- footer year ---------- */

  $('year').textContent = new Date().getFullYear();
})();

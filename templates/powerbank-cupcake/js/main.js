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
  var chargeWrap = chargeFill ? chargeFill.closest('.charge') : null;
  var lastPct = -1;
  var lastScrolled = false;
  var scrollRaf = 0;

  function onScrollFrame() {
    scrollRaf = 0;
    var y = window.scrollY;

    var scrolled = y > 24;
    if (scrolled !== lastScrolled) {
      lastScrolled = scrolled;
      if (nav) nav.classList.toggle('is-scrolled', scrolled);
    }

    var max = document.documentElement.scrollHeight - window.innerHeight;
    var p = max > 0 ? Math.min(Math.max(y / max, 0), 1) : 0;
    var pct = Math.round(p * 100);
    if (chargeFill) chargeFill.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    if (pct !== lastPct) {
      lastPct = pct;
      if (chargeLabel) chargeLabel.textContent = pct + '%';
      if (chargeWrap) chargeWrap.classList.toggle('is-full', pct >= 100);
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
    // Safety net, same as the sibling templates: if the observer never fires
    // (layout quirk, odd engine), show everything rather than leave the page
    // blank. The CSS `scripting` guard covers JS being off entirely.
    setTimeout(function () {
      revealEls.forEach(function (el) { el.classList.add('is-in'); });
    }, 2500);
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

      track.offsetWidth; // commit animation-name:none before restoring
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
  if ('IntersectionObserver' in window && counts.length) {
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
  if (flavors) {
    var setFlavor = function (name) {
      document.body.setAttribute('data-flavor', name);
      flavors.querySelectorAll('.flavor').forEach(function (f) {
        var on = f.getAttribute('data-flavor') === name;
        f.classList.toggle('is-on', on);
        f.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      // Survives a reload — picking a colorway then losing it on refresh
      // reads as a bug rather than a demo.
      try { localStorage.setItem('cupcake.flavor', name); } catch (err) {}
    };

    flavors.addEventListener('click', function (e) {
      var btn = e.target.closest('.flavor');
      if (btn) setFlavor(btn.getAttribute('data-flavor'));
    });

    try {
      var saved = localStorage.getItem('cupcake.flavor');
      if (saved && flavors.querySelector('.flavor[data-flavor="' + saved + '"]')) setFlavor(saved);
    } catch (err) {}
  }

  /* ---------- fake cart button ---------- */

  var buyBtn = $('buyBtn');
  if (buyBtn) {
    var buyLabel = buyBtn.querySelector('span');
    var bought = false;
    buyBtn.addEventListener('click', function () {
      if (bought || !buyLabel) return;
      bought = true;
      buyLabel.textContent = 'Added to cart';
      setTimeout(function () {
        buyLabel.textContent = 'Add to cart';
        bought = false;
      }, 2600);
    });
  }

  /* ---------- founder portrait fallback ----------
     CSP here is script-src 'self', so an inline onerror attribute would be
     blocked. If the portrait ever goes missing the monogram underneath it
     shows instead of a broken-image icon. */

  var founderImg = document.querySelector('.founder-frame img');
  if (founderImg) {
    var markBroken = function () {
      founderImg.parentNode.classList.add('is-broken');
    };
    founderImg.addEventListener('error', markBroken);
    // Covers the case where the error fired before this script ran.
    if (founderImg.complete && founderImg.naturalWidth === 0) markBroken();
  }

  /* ---------- disclaimer modal ----------
     Native <dialog>: Esc, focus trapping and background inertness are the
     browser's job. Older engines without showModal() fall back to the plain
     `open` attribute, which still shows the content rather than nothing. */

  var infoModal = $('infoModal');
  var infoOpen = $('infoOpen');
  var infoClose = $('infoClose');

  if (infoModal && infoOpen) {
    infoOpen.addEventListener('click', function () {
      if (typeof infoModal.showModal === 'function') infoModal.showModal();
      else infoModal.setAttribute('open', '');
    });

    var closeInfo = function () {
      if (typeof infoModal.close === 'function') infoModal.close();
      else infoModal.removeAttribute('open');
    };
    if (infoClose) infoClose.addEventListener('click', closeInfo);

    // Clicking the backdrop lands on the <dialog> itself, not its contents.
    infoModal.addEventListener('click', function (e) {
      if (e.target === infoModal) closeInfo();
    });
  }

  /* ---------- footer year ---------- */

  var yearEl = $('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();

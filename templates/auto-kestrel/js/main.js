/* Kestrel Automobiles — homepage behaviour.
   No libraries. Everything is either scroll-driven (lerped wheel scroll, hero
   scale + film parallax, figure parallax, axiom clip, heritage drift), a mask
   reveal (characters / lines / figures), or a small piece of chrome (loader
   fly-in, header theme, menu, looping drag slider, register form). */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(pointer: fine)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp01 = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
  var headH = function () { return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--head-h')) || 72; };

  document.body.classList.add('is-loading');

  /* =====================================================================
     Smooth scroll — a Lenis-style lerp on wheel input. Native scrolling is
     left alone for touch, keyboard and the scrollbar; we only re-sync to it.
     ===================================================================== */
  var smooth = { active: false, target: 0, current: 0, raf: null };
  function maxScroll() { return Math.max(0, document.documentElement.scrollHeight - window.innerHeight); }
  function smoothTick() {
    smooth.current += (smooth.target - smooth.current) * 0.1;
    if (Math.abs(smooth.target - smooth.current) < 0.5) { smooth.current = smooth.target; smooth.raf = null; }
    else smooth.raf = requestAnimationFrame(smoothTick);
    window.scrollTo(0, smooth.current);
  }
  function smoothTo(y) {
    smooth.target = Math.max(0, Math.min(maxScroll(), y));
    if (!smooth.raf) smooth.raf = requestAnimationFrame(smoothTick);
  }
  if (!reduceMotion && finePointer) {
    smooth.active = true;
    smooth.target = smooth.current = window.scrollY;
    window.addEventListener('wheel', function (e) {
      if (e.ctrlKey || document.body.classList.contains('menu-open')) return;
      if (e.target.closest && e.target.closest('[data-native-scroll]')) return;
      e.preventDefault();
      var dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * window.innerHeight : e.deltaY;
      smoothTo(smooth.target + dy);
    }, { passive: false });
    window.addEventListener('scroll', function () {
      if (!smooth.raf) smooth.target = smooth.current = window.scrollY;
    }, { passive: true });
  } else {
    document.documentElement.style.scrollBehavior = reduceMotion ? 'auto' : 'smooth';
  }
  // In-page anchors ride the same easing.
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a || a.getAttribute('href').length < 2) return;
    var el = document.getElementById(a.getAttribute('href').slice(1));
    if (!el) return;
    e.preventDefault();
    var y = el.getBoundingClientRect().top + window.scrollY;
    if (el.classList.contains('anchor')) y = 0;
    if (smooth.active) smoothTo(y); else window.scrollTo({ top: y, behavior: reduceMotion ? 'auto' : 'smooth' });
    if (history.pushState) history.pushState(null, '', a.getAttribute('href'));
  });

  /* =====================================================================
     Text splitting — characters rise out of clip masks; paragraphs reveal
     line by line. The element keeps an aria-label so the split is invisible
     to assistive tech.
     ===================================================================== */
  function splitChars(el) {
    if (el.dataset.split) return;
    el.dataset.split = 'chars';
    el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    var stagger = parseFloat(el.style.getPropertyValue('--stagger')) || 18;
    var idx = 0;
    var frag = document.createDocumentFragment();
    Array.prototype.slice.call(el.childNodes).forEach(function (node) {
      if (node.nodeType === 3) {
        var words = node.textContent.split(/(\s+)/);
        words.forEach(function (w) {
          if (!w) return;
          if (/^\s+$/.test(w)) { frag.appendChild(document.createTextNode(' ')); return; }
          var word = document.createElement('span');
          word.className = 'rv-word';
          word.setAttribute('aria-hidden', 'true');
          Array.prototype.forEach.call(w, function (ch) {
            var mask = document.createElement('span');
            mask.className = 'rv-mask';
            var c = document.createElement('span');
            c.className = 'rv-char';
            c.textContent = ch;
            c.style.setProperty('--d', (idx++ * stagger) + 'ms');
            mask.appendChild(c);
            word.appendChild(mask);
          });
          frag.appendChild(word);
        });
      } else {
        frag.appendChild(node.cloneNode(true));
      }
    });
    el.textContent = '';
    el.appendChild(frag);
  }

  function splitLines(el) {
    if (!el.dataset.rvSource) el.dataset.rvSource = el.textContent.replace(/\s+/g, ' ').trim();
    var wasIn = el.classList.contains('is-in');
    el.setAttribute('aria-label', el.dataset.rvSource);
    el.textContent = '';
    // 1. lay out words, 2. group by offsetTop, 3. rebuild as masked lines
    var words = el.dataset.rvSource.split(' ');
    var probes = words.map(function (w) {
      var s = document.createElement('span');
      s.textContent = w;
      s.style.display = 'inline-block';
      el.appendChild(s);
      el.appendChild(document.createTextNode(' '));
      return s;
    });
    var lines = [], lastTop = null;
    probes.forEach(function (s, i) {
      var t = s.offsetTop;
      if (t !== lastTop) { lines.push([]); lastTop = t; }
      lines[lines.length - 1].push(words[i]);
    });
    el.textContent = '';
    lines.forEach(function (ws, i) {
      var mask = document.createElement('span');
      mask.className = 'rv-line-mask';
      mask.setAttribute('aria-hidden', 'true');
      var line = document.createElement('span');
      line.className = 'rv-line';
      line.textContent = ws.join(' ');
      line.style.setProperty('--d', (i * 90) + 'ms');
      mask.appendChild(line);
      el.appendChild(mask);
    });
    el.dataset.split = 'lines';
    if (wasIn) el.classList.add('is-in');
  }

  var charEls = $$('[data-reveal="chars"]');
  var lineEls = $$('[data-reveal="lines"]');
  if (!reduceMotion) {
    charEls.forEach(splitChars);
    lineEls.forEach(splitLines);
    var lastW = window.innerWidth, lineTimer;
    window.addEventListener('resize', function () {
      if (window.innerWidth === lastW) return;
      lastW = window.innerWidth;
      clearTimeout(lineTimer);
      lineTimer = setTimeout(function () { lineEls.forEach(splitLines); }, 150);
    });
  }

  /* Buttons: two stacked copies of every character; hover slides both up. */
  $$('[data-btn]').forEach(function (btn) {
    var text = btn.textContent.trim();
    btn.setAttribute('aria-label', text);
    btn.textContent = '';
    var label = document.createElement('span');
    label.className = 'btn-label';
    label.setAttribute('aria-hidden', 'true');
    Array.prototype.forEach.call(text, function (ch, i) {
      if (ch === ' ') { label.appendChild(document.createTextNode(' ')); return; }
      var m = document.createElement('span');
      m.className = 'bm';
      m.style.setProperty('--d', (i * 14) + 'ms');
      var a = document.createElement('span'); a.className = 'bm-a'; a.textContent = ch;
      var b = document.createElement('span'); b.className = 'bm-b'; b.textContent = ch;
      m.appendChild(a); m.appendChild(b);
      label.appendChild(m);
    });
    btn.appendChild(label);
  });

  /* =====================================================================
     Reveal on scroll
     ===================================================================== */
  var revealTargets = $$('[data-reveal]:not([data-reveal-hold]), .reveal:not([data-reveal-hold]), [data-fig]');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
    revealTargets.forEach(function (el) { io.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add('is-in'); });
  }
  function releaseHero() {
    $$('[data-reveal-hold]').forEach(function (el, i) {
      setTimeout(function () { el.classList.add('is-in'); }, i * 220);
    });
  }

  /* =====================================================================
     Loader — the mark draws itself, flies into the header slot, then the
     curtain lifts and the hero copy rises.
     ===================================================================== */
  var loader = $('#loader');
  var loaderMark = $('#loaderMark');
  var brand = $('#brand');
  var loadDone = false;
  function finishLoad() {
    if (loadDone) return;
    loadDone = true;
    var mark = $('.brand-mark', brand);
    if (loaderMark && mark && !reduceMotion) {
      var from = loaderMark.getBoundingClientRect();
      var to = mark.getBoundingClientRect();
      var dx = (to.left + to.width / 2) - (from.left + from.width / 2);
      var dy = (to.top + to.height / 2) - (from.top + from.height / 2);
      var sc = to.width / from.width;
      loaderMark.style.transform = 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px) scale(' + sc.toFixed(3) + ')';
      setTimeout(function () {
        loader.classList.add('is-flying');
        document.body.classList.remove('is-loading');
      }, 780);
      setTimeout(function () { loader.classList.add('is-done'); releaseHero(); }, 900);
    } else {
      loader.classList.add('is-done');
      document.body.classList.remove('is-loading');
      releaseHero();
    }
  }
  window.addEventListener('load', function () { setTimeout(finishLoad, 900); });
  setTimeout(finishLoad, 2600); // never hold the page hostage to a slow asset

  /* ---------- year ---------- */
  $$('[data-year]').forEach(function (el) { el.textContent = String(new Date().getFullYear()); });

  /* =====================================================================
     Menu
     ===================================================================== */
  var menuBtn = $('#menuBtn');
  var menu = $('#menu');
  var backdrop = $('#menuBackdrop');
  var head = $('#siteHead');
  var lastFocus = null;
  $$('.menu-list a', menu).forEach(function (a, i) { a.style.setProperty('--i', i); });

  function openMenu() {
    lastFocus = document.activeElement;
    menu.hidden = false; backdrop.hidden = false;
    requestAnimationFrame(function () { menu.classList.add('is-open'); backdrop.classList.add('is-open'); });
    menuBtn.setAttribute('aria-expanded', 'true');
    menuBtn.setAttribute('aria-label', 'Close menu');
    document.body.classList.add('menu-open');
    head.dataset.theme = 'light';
    var first = $('a', menu);
    if (first) setTimeout(function () { first.focus(); }, 400);
  }
  function closeMenu() {
    menu.classList.remove('is-open'); backdrop.classList.remove('is-open');
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.setAttribute('aria-label', 'Open menu');
    document.body.classList.remove('menu-open');
    setTimeout(function () { if (!menu.classList.contains('is-open')) { menu.hidden = true; backdrop.hidden = true; } }, 800);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
    updateHeaderTheme();
  }
  if (menuBtn && menu) {
    menuBtn.addEventListener('click', function () { menu.classList.contains('is-open') ? closeMenu() : openMenu(); });
    backdrop.addEventListener('click', closeMenu);
    $$('[data-menu-link]', menu).forEach(function (a) { a.addEventListener('click', closeMenu); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu.classList.contains('is-open')) closeMenu(); });
  }

  /* =====================================================================
     Scroll-driven pieces
     ===================================================================== */
  var themed = $$('main [data-theme], footer[data-theme]');
  function updateHeaderTheme() {
    if (document.body.classList.contains('menu-open')) return;
    var probe = headH() / 2;
    var theme = 'dark';
    for (var i = 0; i < themed.length; i++) {
      var r = themed[i].getBoundingClientRect();
      if (r.top <= probe && r.bottom > probe) { theme = themed[i].dataset.theme; break; }
    }
    if (head.dataset.theme !== theme) head.dataset.theme = theme;
  }

  var hero = $('#hero');
  var heroScale = $('#heroScale');
  var heroMedia = $('#heroMedia');
  var heroVideo = $('#heroVideo');
  var figs = $$('.fig-par').map(function (p) { return { el: p, box: p.parentElement }; });
  var drifts = $$('[data-drift]').map(function (el) { return { el: el, k: parseFloat(el.getAttribute('data-drift')) || 0 }; });
  var axiom = $('#axiom');
  var heritage = $('#heritage');
  var floats = $$('.hf', heritage).map(function (el) {
    el.style.opacity = el.getAttribute('data-op') || '1';
    return { el: el, speed: parseFloat(el.getAttribute('data-speed')) || 0, centered: el.classList.contains('hf-9') };
  });

  var ticking = false;
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }

  function update() {
    ticking = false;
    var vh = window.innerHeight;
    var y = window.scrollY;
    updateHeaderTheme();
    if (reduceMotion) return;

    // Hero: the whole frame shrinks toward its centre as it leaves; the film
    // drifts inside its 120%-tall mask so it never hits the edge of the frame.
    if (hero && heroScale) {
      var hH = hero.offsetHeight;
      var p = clamp01(y / hH);
      var s = 1 - 0.2 * clamp01((y - hH * 0.22) / (hH * 0.85));
      heroScale.style.transform = 'scale(' + s.toFixed(4) + ')';
      if (heroMedia) heroMedia.style.transform = 'translate3d(0,' + (Math.min(y, hH) * 0.19).toFixed(1) + 'px,0)';
      if (heroVideo) {
        if (p >= 1 && !heroVideo.paused) heroVideo.pause();
        else if (p < 1 && heroVideo.paused) heroVideo.play().catch(function () {});
      }
    }

    // Making-of: each photograph slides slowly inside its frame, and the
    // figures themselves drift at their own rates so the columns desynchronise.
    figs.forEach(function (f) {
      var r = f.box.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      var pct = clamp01((vh - r.top) / (vh + r.height));
      f.el.style.transform = 'translate3d(0,' + ((0.5 - pct) * 0.2 * r.height).toFixed(1) + 'px,0)';
    });
    drifts.forEach(function (d) {
      var r = d.el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      var c = (r.top + r.height / 2) - vh / 2;
      d.el.style.transform = 'translate3d(0,' + (c * d.k).toFixed(1) + 'px,0)';
    });

    // Axiom: once its bottom edge lifts off the viewport floor, the entire
    // black band clips inward uniformly — a full-bleed film becomes a matted print.
    if (axiom) {
      var a = axiom.getBoundingClientRect();
      var ap = clamp01((vh - a.bottom + 120) / (vh * 0.9));
      axiom.style.clipPath = 'inset(' + (ap * 8).toFixed(3) + '%)';
    }

    // Heritage: each archive photograph drifts at its own rate.
    if (heritage && floats.length && window.innerWidth > 760) {
      var h = heritage.getBoundingClientRect();
      if (h.bottom > 0 && h.top < vh) {
        var center = (h.top + h.height / 2) - vh / 2;
        floats.forEach(function (f) {
          var ty = (center * f.speed).toFixed(1);
          f.el.style.transform = (f.centered ? 'translate3d(-50%,' : 'translate3d(0,') + ty + 'px,0)';
        });
      }
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();

  /* ---------- axiom video ---------- */
  var axiomVideo = $('#axiomVideo');
  var axiomPlay = $('#axiomPlay');
  var axiomFrame = $('#axiomFrame');
  if (axiomVideo && axiomPlay) {
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

  /* =====================================================================
     News slider — draggable, infinite, snaps to a card. Slides are cloned
     once on each side; when a snap lands in a clone we silently re-centre.
     ===================================================================== */
  function loopSlider(root) {
    var track = $('.slider-track', root);
    if (!track) return;
    var originals = Array.prototype.slice.call(track.children);
    var n = originals.length;
    if (n < 2) return;
    originals.slice().forEach(function (s) { var c = s.cloneNode(true); c.setAttribute('aria-hidden', 'true'); c.tabIndex = -1; track.appendChild(c); });
    originals.slice().reverse().forEach(function (s) { var c = s.cloneNode(true); c.setAttribute('aria-hidden', 'true'); c.tabIndex = -1; track.insertBefore(c, track.firstChild); });
    $$('a', track).forEach(function (a) { if (a.closest('[aria-hidden="true"]')) a.tabIndex = -1; });

    var index = 0, x = 0, target = 0, raf = null, dragging = false, moved = false, startX = 0, startT = 0, stepPx = 1;
    function measure() {
      var first = track.children[0];
      stepPx = first.getBoundingClientRect().width + (parseFloat(getComputedStyle(track).columnGap) || 0);
    }
    function base() { return -n * stepPx; }
    function apply() { track.style.transform = 'translate3d(' + x.toFixed(2) + 'px,0,0)'; }
    function settle() {
      x += (target - x) * 0.16;
      if (Math.abs(target - x) < 0.3) {
        x = target; raf = null;
        // landed in a clone → jump back into the originals without motion
        if (index < 0 || index >= n) { index = ((index % n) + n) % n; x = target = base() - index * stepPx; }
      } else raf = requestAnimationFrame(settle);
      apply();
    }
    function goTo(i) {
      index = i;
      target = base() - index * stepPx;
      if (!raf) raf = requestAnimationFrame(settle);
    }
    measure();
    x = target = base();
    apply();

    root.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      dragging = true; moved = false;
      startX = e.clientX; startT = x;
      if (raf) { cancelAnimationFrame(raf); raf = null; }
      root.classList.add('is-dragging');
      root.setPointerCapture(e.pointerId);
    });
    root.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var dx = e.clientX - startX;
      if (Math.abs(dx) > 4) moved = true;
      x = startT + dx;
      apply();
    });
    function release(e) {
      if (!dragging) return;
      dragging = false;
      root.classList.remove('is-dragging');
      var dx = e.clientX - startX;
      var delta = Math.abs(dx) > stepPx * 0.15 ? (dx < 0 ? 1 : -1) : 0;
      var nearest = Math.round((base() - x) / stepPx);
      goTo(delta ? Math.round((base() - startT) / stepPx) + delta : nearest);
    }
    root.addEventListener('pointerup', release);
    root.addEventListener('pointercancel', release);
    root.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
    root.setAttribute('tabindex', '0');
    root.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); goTo(index + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(index - 1); }
    });
    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () { measure(); x = target = base() - index * stepPx; apply(); }, 120);
    });
  }
  loopSlider($('#newsSlider'));

  /* =====================================================================
     Register form
     ===================================================================== */
  var form = $('#registerForm');
  var note = $('#registerNote');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var fields = ['regFirst', 'regLast', 'regEmail'].map(function (id) { return $('#' + id); });
      var bad = fields.filter(function (f) {
        var ok = f.type === 'email' ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.value) : f.value.trim().length > 0;
        f.setAttribute('aria-invalid', ok ? 'false' : 'true');
        return !ok;
      });
      if (bad.length) {
        bad[0].focus();
        note.textContent = 'Please complete your name and a valid email address.';
        note.hidden = false;
        return;
      }
      note.textContent = "Thank you. You'll hear from us first.";
      note.hidden = false;
      form.reset();
    });
  }
})();

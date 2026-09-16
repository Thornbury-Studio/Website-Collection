/* LODE — motion layer
   Signature: kinetic image trail on #clientWall (L2).
   Everything else: GSAP springs + ScrollTrigger. No Lenis. */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var hasGSAP = typeof window.gsap !== 'undefined';
  var hasST = typeof window.ScrollTrigger !== 'undefined';

  if (reduced) document.body.classList.add('is-reduced');
  if (hasGSAP && hasST) window.gsap.registerPlugin(window.ScrollTrigger);

  /* ---------- nav ---------- */
  var nav = document.getElementById('nav');
  var toggle = document.getElementById('navToggle');
  var menu = document.getElementById('mobileMenu');

  function onScroll() {
    if (nav) nav.classList.toggle('is-scrolled', window.scrollY > 12);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  function closeMenu() {
    if (!menu || !toggle) return;
    menu.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }
  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      var open = menu.hidden;
      menu.hidden = !open;
      toggle.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
    });
    menu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', closeMenu);
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMenu();
  });

  /* ---------- true-loop marquee (PATTERNS.md) ---------- */
  function trueLoopMarquee(track, secondsPerCopy) {
    if (!track || !track.firstElementChild) return;
    var timer;
    function build() {
      track.style.animationName = 'none';
      while (track.children.length > 1) track.removeChild(track.lastElementChild);
      var rowW = track.firstElementChild.getBoundingClientRect().width;
      var boxW = (track.parentElement || document.body).getBoundingClientRect().width;
      if (rowW < 1) { track.style.animationName = ''; return; }
      var perHalf = Math.max(1, Math.ceil(boxW / rowW));
      for (var i = 1; i < perHalf * 2; i++) {
        track.appendChild(track.firstElementChild.cloneNode(true));
      }
      track.style.animationDuration = (secondsPerCopy * perHalf) + 's';
      void track.offsetWidth;
      track.style.animationName = '';
    }
    build();
    window.addEventListener('resize', function () {
      clearTimeout(timer);
      timer = setTimeout(build, 150);
    }, { passive: true });
  }
  document.querySelectorAll('[data-marquee] .marquee-track').forEach(function (t) {
    if (!reduced) trueLoopMarquee(t, 14);
  });

  /* ---------- font playground (works without GSAP) ---------- */
  var fontSwitch = document.getElementById('fontSwitch');
  if (fontSwitch) {
    var saved = localStorage.getItem('lode-font');
    if (saved) {
      document.body.classList.remove('font-unbounded', 'font-syne', 'font-fraunces');
      document.body.classList.add('font-' + saved);
      fontSwitch.querySelectorAll('button').forEach(function (b) {
        b.classList.toggle('is-on', b.getAttribute('data-font') === saved);
      });
    }
    fontSwitch.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-font]');
      if (!btn) return;
      var name = btn.getAttribute('data-font');
      document.body.classList.remove('font-unbounded', 'font-syne', 'font-fraunces');
      document.body.classList.add('font-' + name);
      fontSwitch.querySelectorAll('button').forEach(function (b) {
        b.classList.toggle('is-on', b === btn);
      });
      try { localStorage.setItem('lode-font', name); } catch (err) {}
    });
  }

  /* ---------- studio video ---------- */
  var studioVideo = document.getElementById('studioVideo');
  var studioPoster = document.querySelector('.studio-poster');
  if (studioVideo) {
    if (reduced) {
      studioVideo.removeAttribute('autoplay');
      studioVideo.pause();
      studioVideo.style.display = 'none';
    } else {
      studioVideo.addEventListener('playing', function () {
        if (studioPoster) studioPoster.style.opacity = '0';
      });
      var playPromise = studioVideo.play();
      if (playPromise && playPromise.catch) playPromise.catch(function () {});
    }
  }

  /* ---------- news category filter (no GSAP needed) ---------- */
  var newsList = document.getElementById('newsList');
  if (newsList) {
    document.querySelectorAll('.news-filters button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var cat = btn.getAttribute('data-filter');
        document.querySelectorAll('.news-filters button').forEach(function (b) {
          b.classList.toggle('is-on', b === btn);
          b.setAttribute('aria-selected', String(b === btn));
        });
        newsList.querySelectorAll('.news-item').forEach(function (item) {
          var show = cat === 'all' || item.getAttribute('data-cat') === cat;
          item.style.display = show ? '' : 'none';
        });
      });
    });
  }

  if (!hasGSAP) return;

  var gsap = window.gsap;

  /* ---------- hero ---------- */
  if (!reduced) {
    gsap.set('.reveal-line span', { y: 16, opacity: 0 });
    gsap.set('.reveal-fade', { y: 18, opacity: 0 });
    gsap.timeline({ defaults: { ease: 'power4.out' } })
      .to('.hero-line-inner', { y: 0, duration: 1.05, stagger: 0.12 }, 0.05)
      .to('.reveal-line span', { opacity: 1, y: 0, duration: 0.7 }, 0.35)
      .to('.reveal-fade', { opacity: 1, y: 0, duration: 0.8, stagger: 0.08 }, 0.55);
  }

  /* ---------- stats count ---------- */
  document.querySelectorAll('.stat strong[data-count]').forEach(function (el) {
    var target = parseInt(el.getAttribute('data-count'), 10) || 0;
    if (reduced || !hasST) {
      el.textContent = String(target) + (target >= 100 ? '+' : '');
      return;
    }
    var obj = { v: 0 };
    ScrollTrigger.create({
      trigger: el,
      start: 'top 90%',
      once: true,
      onEnter: function () {
        gsap.to(obj, {
          v: target,
          duration: 1.4,
          ease: 'power2.out',
          onUpdate: function () {
            var n = Math.round(obj.v);
            el.textContent = String(n) + (target >= 100 ? '+' : '');
          }
        });
      }
    });
  });

  /* ---------- scroll reveals ---------- */
  if (hasST && !reduced) {
    gsap.utils.toArray('.work-card, .service, .quotes blockquote, .section-head').forEach(function (el) {
      gsap.from(el, {
        opacity: 0,
        y: 28,
        filter: 'blur(8px)',
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true }
      });
    });

    gsap.utils.toArray('[data-service]').forEach(function (svc) {
      var num = svc.querySelector('[data-scrub]');
      if (!num) return;
      gsap.fromTo(num,
        { y: 40, opacity: 0.25 },
        {
          y: 0,
          opacity: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: svc,
            start: 'top 80%',
            end: 'top 35%',
            scrub: true
          }
        }
      );
    });
  }

  /* ---------- news: cursor-follow preview ---------- */
  var newsFloat = document.getElementById('newsFloat');
  var newsFloatImg = document.getElementById('newsFloatImg');
  if (newsList && newsFloat && newsFloatImg && fine && !reduced && hasGSAP) {
    var gsapNF = window.gsap;
    var qx = gsapNF.quickTo(newsFloat, 'x', { duration: 0.45, ease: 'power3.out' });
    var qy = gsapNF.quickTo(newsFloat, 'y', { duration: 0.45, ease: 'power3.out' });
    gsapNF.set(newsFloat, { xPercent: -50, yPercent: -50 });

    newsList.querySelectorAll('.news-item').forEach(function (item) {
      item.addEventListener('mouseenter', function () {
        var src = item.getAttribute('data-img');
        if (src) newsFloatImg.src = src;
        newsFloat.classList.add('is-on');
      });
      item.addEventListener('mousemove', function (e) {
        qx(e.clientX + 28);
        qy(e.clientY + 18);
      });
      item.addEventListener('mouseleave', function () {
        newsFloat.classList.remove('is-on');
      });
    });
  }

  /* ---------- magnetic team cards ---------- */
  if (fine && !reduced && hasGSAP) {
    document.querySelectorAll('[data-magnetic]').forEach(function (card) {
      var strength = 14;
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2);
        var dy = e.clientY - (r.top + r.height / 2);
        window.gsap.to(card, {
          x: (dx / r.width) * strength,
          y: (dy / r.height) * strength,
          duration: 0.35,
          ease: 'power3.out'
        });
      });
      card.addEventListener('mouseleave', function () {
        window.gsap.to(card, { x: 0, y: 0, duration: 0.55, ease: 'elastic.out(1, 0.45)' });
      });
    });
  }

  /* ---------- L2 signature: kinetic image trail ---------- */
  var wall = document.getElementById('clientWall');
  var trail = document.getElementById('trail');
  if (!wall || !trail || reduced || !fine || !hasGSAP) return;

  var imgs = Array.prototype.slice.call(trail.querySelectorAll('img'));
  if (!imgs.length) return;

  var gsap = window.gsap;
  var idx = 0;
  var last = 0;
  var gap = 55;
  var rect = null;

  function measure() { rect = wall.getBoundingClientRect(); }
  measure();
  window.addEventListener('resize', measure, { passive: true });
  window.addEventListener('scroll', measure, { passive: true });

  imgs.forEach(function (img) {
    gsap.set(img, {
      xPercent: -50,
      yPercent: -50,
      scale: 0.65,
      opacity: 0,
      visibility: 'hidden',
      clipPath: 'inset(40% 40% 40% 40%)'
    });
  });

  wall.addEventListener('mousemove', function (e) {
    var now = performance.now();
    if (now - last < gap) return;
    last = now;
    if (!rect) measure();

    var x = e.clientX - rect.left;
    var y = e.clientY - rect.top;
    var img = imgs[idx % imgs.length];
    idx++;

    gsap.killTweensOf(img);
    gsap.set(img, {
      x: x,
      y: y,
      visibility: 'visible',
      opacity: 1,
      scale: 0.62,
      rotation: (Math.random() * 10) - 5,
      clipPath: 'inset(45% 45% 45% 45%)',
      zIndex: idx
    });
    gsap.timeline()
      .to(img, {
        clipPath: 'inset(0% 0% 0% 0%)',
        scale: 1,
        duration: 0.5,
        ease: 'power3.out'
      }, 0)
      .to(img, {
        opacity: 0,
        scale: 1.06,
        duration: 0.65,
        ease: 'power2.in',
        onComplete: function () {
          gsap.set(img, { visibility: 'hidden', rotation: 0 });
        }
      }, 1.1);
  }, { passive: true });

  wall.addEventListener('mouseleave', function () {
    imgs.forEach(function (img) {
      gsap.to(img, {
        opacity: 0,
        duration: 0.25,
        onComplete: function () {
          gsap.set(img, { visibility: 'hidden' });
        }
      });
    });
  });
})();

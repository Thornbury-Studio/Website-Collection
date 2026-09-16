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

  /* ---------- font playground (lazy-load non-default) ---------- */
  var FONT_HREFS = {
    syne: 'https://fonts.googleapis.com/css2?family=Instrument+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Syne:wght@600;700;800&display=swap',
    fraunces: 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;700;800&display=swap'
  };
  var loadedFonts = { unbounded: true };

  function ensureFont(name) {
    if (loadedFonts[name] || !FONT_HREFS[name]) return;
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = FONT_HREFS[name];
    document.head.appendChild(link);
    loadedFonts[name] = true;
  }

  var fontSwitch = document.getElementById('fontSwitch');
  if (fontSwitch) {
    var saved = localStorage.getItem('lode-font');
    if (saved && saved !== 'unbounded') {
      ensureFont(saved);
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
      ensureFont(name);
      document.body.classList.remove('font-unbounded', 'font-syne', 'font-fraunces');
      document.body.classList.add('font-' + name);
      fontSwitch.querySelectorAll('button').forEach(function (b) {
        b.classList.toggle('is-on', b === btn);
      });
      try { localStorage.setItem('lode-font', name); } catch (err) {}
    });
  }

  /* ---------- all videos respect reduced motion ---------- */
  function pauseVideosForReducedMotion() {
    document.querySelectorAll('video').forEach(function (vid) {
      vid.removeAttribute('autoplay');
      try { vid.pause(); } catch (e) {}
      vid.style.display = 'none';
      var poster = vid.parentElement && vid.parentElement.querySelector('.studio-poster');
      if (poster) poster.style.opacity = '1';
    });
  }

  var studioVideo = document.getElementById('studioVideo');
  var studioPoster = document.querySelector('.studio-poster');
  if (reduced) {
    pauseVideosForReducedMotion();
  } else if (studioVideo) {
    studioVideo.addEventListener('playing', function () {
      if (studioPoster) studioPoster.style.opacity = '0';
    });
    var playPromise = studioVideo.play();
    if (playPromise && playPromise.catch) playPromise.catch(function () {});
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

  /* ---------- case / article stubs ---------- */
  var CASES = {
    hale: {
      title: 'HALE',
      tag: 'Care platform',
      date: '2025',
      cover: 'img/news-06.png',
      body: 'HALE needed a site that felt clinical without going cold — a care platform that patients and investors could both trust. We rebuilt the brand system, then shipped a conversion-led marketing site with product storytelling that scales across fundraising and go-to-market.'
    },
    pike: {
      title: 'PIKE',
      tag: 'Venture brand',
      date: '2025',
      cover: 'img/news-02.png',
      body: 'PIKE came to us with a mission deck and a half-finished logo. We defined the visual system, voice, and a site architecture that lets partners move from thesis to portfolio without another redesign.'
    },
    quill: {
      title: 'QUILL',
      tag: 'Finance brand',
      date: '2026',
      cover: 'img/news-01.png',
      body: 'QUILL expanded into a second product line and needed the brand to stretch without snapping. We redesigned the mark, type, and web presence so the finance story reads premium on day one and still holds after the next launch.'
    },
    north: {
      title: 'NORTH',
      tag: 'Design system',
      date: '2026',
      cover: 'img/news-05.png',
      body: 'NORTH asked for a product-grade design system — tokens, components, and documentation their eng team could ship from. We delivered a living library that cut design debt and kept marketing and product in the same visual language.'
    },
    arc: {
      title: 'ARC',
      tag: 'RIA growth site',
      date: '2025',
      cover: 'img/news-03.png',
      body: 'ARC needed a growth site that felt as careful as their advice. We built a calm, high-trust marketing experience with clear CTAs for prospects and a CMS their team can update without calling us every Friday.'
    },
    vox: {
      title: 'VOX',
      tag: 'Venture firm',
      date: '2024',
      cover: 'img/news-04.png',
      body: 'VOX wanted a redesign that signaled conviction without the usual VC chrome. We stripped the noise, rebuilt the narrative around thesis and team, and shipped a site partners still send when they open a conversation.'
    }
  };

  var ARTICLES = {
    'north-system': {
      title: 'New launch: NORTH design system',
      date: 'Sep 1, 2026',
      datetime: '2026-09-01',
      cover: 'img/news-06.png',
      tag: 'Launch',
      body: 'NORTH’s component library is live — tokens, documentation, and a marketing site that finally matches the product. Here’s how we kept design and engineering in the same room from kickoff to ship.'
    },
    storytelling: {
      title: 'Why visual storytelling beats better copy',
      date: 'May 26, 2026',
      datetime: '2026-05-26',
      cover: 'img/news-02.png',
      tag: 'Essay',
      body: 'Stronger sentences help. Stronger scenes convert. We argue for image-led narratives on B2B sites — not decoration, but the argument itself — and how to brief them without bloating the timeline.'
    },
    expertise: {
      title: 'The expertise agency and AI augmentation',
      date: 'Apr 28, 2026',
      datetime: '2026-04-28',
      cover: 'img/news-03.png',
      tag: 'Essay',
      body: 'AI accelerates production. It does not replace judgment. We share how LODE uses tooling to move faster on systems work while keeping principals on the creative calls that still decide the brand.'
    },
    sotd: {
      title: 'LODE ships a Site of the Day contender',
      date: 'Jan 17, 2026',
      datetime: '2026-01-17',
      cover: 'img/news-04.png',
      tag: 'Studio',
      body: 'A look at the build that earned us a nod — motion restraint, poster-scale type, and a launch checklist we now run on every high-stakes project.'
    },
    'behind-build': {
      title: 'Behind the build: a product-grade system',
      date: 'Jan 13, 2026',
      datetime: '2026-01-13',
      cover: 'img/news-05.png',
      tag: 'Essay',
      body: 'From Figma tokens to production CSS variables — the decisions that kept NORTH’s system coherent across product UI and the marketing site without a second brand file.'
    },
    hale: {
      title: 'New launch: HALE care platform',
      date: 'Jan 8, 2026',
      datetime: '2026-01-08',
      cover: 'img/news-01.png',
      tag: 'Launch',
      body: 'HALE is live. A care platform site that balances clinical clarity with investor-grade polish — and a CMS their team owns from day one.'
    }
  };

  function fillStub(map, rootId) {
    var root = document.getElementById(rootId);
    if (!root) return;
    var key = (location.hash || '').replace(/^#/, '') ||
      new URLSearchParams(location.search).get('id') ||
      Object.keys(map)[0];
    var data = map[key] || map[Object.keys(map)[0]];
    if (!data) return;
    var titleEl = root.querySelector('[data-stub-title]');
    var tagEl = root.querySelector('[data-stub-tag]');
    var dateEl = root.querySelector('[data-stub-date]');
    var coverEl = root.querySelector('[data-stub-cover]');
    var bodyEl = root.querySelector('[data-stub-body]');
    if (titleEl) titleEl.textContent = data.title;
    if (tagEl) tagEl.textContent = data.tag || '';
    if (dateEl) {
      dateEl.textContent = data.date;
      if (data.datetime) dateEl.setAttribute('datetime', data.datetime);
    }
    if (coverEl) {
      coverEl.src = data.cover;
      coverEl.alt = data.title;
    }
    if (bodyEl) bodyEl.textContent = data.body;
    document.title = data.title + ' — LODE';
  }
  fillStub(CASES, 'caseStub');
  fillStub(ARTICLES, 'articleStub');
  window.addEventListener('hashchange', function () {
    fillStub(CASES, 'caseStub');
    fillStub(ARTICLES, 'articleStub');
  });

  /* ---------- client wall: touch / coarse fallback ---------- */
  var wall = document.getElementById('clientWall');
  var trail = document.getElementById('trail');
  if (wall && trail && (!fine || reduced)) {
    wall.classList.add('is-touch');
    if (reduced) wall.classList.add('is-reduced-trail');
    var note = wall.parentElement && wall.parentElement.querySelector('.section-note');
    if (note) {
      note.textContent = reduced
        ? 'Selected client posters.'
        : 'Tap the wall to cycle posters.';
    }

    var imgs = Array.prototype.slice.call(trail.querySelectorAll('img'));
    var touchIdx = 0;
    imgs.forEach(function (img, i) {
      img.style.visibility = 'visible';
      img.style.clipPath = 'none';
      if (reduced) {
        img.classList.toggle('is-active', i < 4);
        img.style.opacity = i < 4 ? '1' : '0';
      } else {
        img.classList.toggle('is-active', i === 0);
        img.style.opacity = i === 0 ? '1' : '0';
      }
    });

    if (!reduced && !fine) {
      wall.addEventListener('click', function () {
        imgs.forEach(function (img) {
          img.classList.remove('is-active');
          img.style.opacity = '0';
        });
        touchIdx = (touchIdx + 1) % imgs.length;
        var next = imgs[touchIdx];
        next.classList.add('is-active');
        next.style.opacity = '1';
      });
    }
  }

  /* ---------- hero FOUC guard (before GSAP gate) ---------- */
  function showHero() {
    document.body.classList.remove('hero-animating');
    document.body.classList.add('hero-ready');
    if (hasGSAP) {
      try {
        window.gsap.set('.hero-brand-inner, .hero-line-inner, .reveal-line span, .reveal-fade', { clearProps: 'transform,opacity' });
      } catch (e) {}
    }
  }

  var heroEl = document.querySelector('.hero');
  if (heroEl && !reduced && hasGSAP) {
    /* wait — animation starts below */
  } else {
    showHero();
  }

  if (!hasGSAP) return;

  var gsap = window.gsap;

  /* ---------- hero (only hide text once GSAP timeline starts) ---------- */
  if (heroEl && !reduced) {
    var heroSafety = setTimeout(showHero, 2200);
    try {
      document.body.classList.add('hero-animating');
      gsap.set('.hero-brand-inner, .hero-line-inner', { yPercent: 110 });
      gsap.set('.reveal-line span', { y: 16, opacity: 0 });
      gsap.set('.reveal-fade', { y: 18, opacity: 0 });
      gsap.timeline({
        defaults: { ease: 'power4.out' },
        onComplete: function () {
          clearTimeout(heroSafety);
          document.body.classList.remove('hero-animating');
          document.body.classList.add('hero-ready');
        }
      })
        .to('.hero-brand-inner', { yPercent: 0, duration: 0.95 }, 0)
        .to('.hero-line-inner', { yPercent: 0, duration: 1.0, stagger: 0.1 }, 0.15)
        .to('.reveal-line span', { opacity: 1, y: 0, duration: 0.65 }, 0.4)
        .to('.reveal-fade', { opacity: 1, y: 0, duration: 0.75, stagger: 0.08 }, 0.55);
    } catch (err) {
      clearTimeout(heroSafety);
      showHero();
    }
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
  if (newsList && newsFloat && newsFloatImg && fine && !reduced) {
    var qx = gsap.quickTo(newsFloat, 'x', { duration: 0.45, ease: 'power3.out' });
    var qy = gsap.quickTo(newsFloat, 'y', { duration: 0.45, ease: 'power3.out' });
    gsap.set(newsFloat, { xPercent: -50, yPercent: -50, scale: 0.92 });

    /* preload covers */
    var seen = {};
    newsList.querySelectorAll('.news-item').forEach(function (item) {
      var src = item.getAttribute('data-img');
      if (src && !seen[src]) {
        seen[src] = true;
        var pre = new Image();
        pre.src = src;
      }
    });

    newsList.querySelectorAll('.news-item').forEach(function (item) {
      item.addEventListener('mouseenter', function () {
        var src = item.getAttribute('data-img');
        if (src) newsFloatImg.src = src;
        newsFloat.classList.add('is-on');
        gsap.to(newsFloat, { scale: 1, duration: 0.45, ease: 'power3.out', overwrite: 'auto' });
      });
      item.addEventListener('mousemove', function (e) {
        qx(e.clientX + 28);
        qy(e.clientY + 18);
      });
      item.addEventListener('mouseleave', function () {
        newsFloat.classList.remove('is-on');
        gsap.to(newsFloat, { scale: 0.94, duration: 0.35, ease: 'power2.in', overwrite: 'auto' });
      });
    });
  }

  /* ---------- magnetic team cards ---------- */
  if (fine && !reduced) {
    document.querySelectorAll('[data-magnetic]').forEach(function (card) {
      var strength = 14;
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2);
        var dy = e.clientY - (r.top + r.height / 2);
        gsap.to(card, {
          x: (dx / r.width) * strength,
          y: (dy / r.height) * strength,
          duration: 0.35,
          ease: 'power3.out'
        });
      });
      card.addEventListener('mouseleave', function () {
        gsap.to(card, { x: 0, y: 0, duration: 0.55, ease: 'elastic.out(1, 0.45)' });
      });
    });
  }

  /* ---------- L2 signature: kinetic image trail ---------- */
  if (!wall || !trail || reduced || !fine) return;

  var trailImgs = Array.prototype.slice.call(trail.querySelectorAll('img'));
  if (!trailImgs.length) return;

  var idx = 0;
  var last = 0;
  var gap = 55;
  var rect = null;

  function measure() { rect = wall.getBoundingClientRect(); }
  measure();
  window.addEventListener('resize', measure, { passive: true });
  window.addEventListener('scroll', measure, { passive: true });

  trailImgs.forEach(function (img) {
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
    var img = trailImgs[idx % trailImgs.length];
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
    trailImgs.forEach(function (img) {
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

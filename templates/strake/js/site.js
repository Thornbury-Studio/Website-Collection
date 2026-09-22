/* STRAKE — header state, section tracking, the heritage timeline fallback, the configurator, the enquiry form. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------------------------------------------------------- header */
  const top = $('#top');
  const menu = $('.menu', top);
  const onScroll = () => top.classList.toggle('is-scrolled', scrollY > 24);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  menu.addEventListener('click', () => {
    const open = top.classList.toggle('is-open');
    menu.setAttribute('aria-expanded', String(open));
    menu.textContent = open ? 'Close' : 'Menu';
  });
  $$('.nav a').forEach((a) => a.addEventListener('click', () => {
    top.classList.remove('is-open');
    menu.setAttribute('aria-expanded', 'false');
    menu.textContent = 'Menu';
  }));

  // the nav underline follows the section in view
  const links = new Map($$('.nav a:not(.button)').map((a) => [a.getAttribute('href').slice(1), a]));
  const seen = new Map();
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => seen.set(e.target.id, e.intersectionRatio));
    let best = null, ratio = 0.08;
    for (const [id, r] of seen) if (r > ratio) { best = id; ratio = r; }
    links.forEach((a, id) => { if (id === best) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
  }, { threshold: [0, 0.1, 0.25, 0.5, 0.75, 1] });
  links.forEach((_, id) => { const el = document.getElementById(id); if (el) io.observe(el); });

  /* ---------------------------------------------------------- heritage: scroll-linked slide without native scroll timelines */
  const heritage = $('#heritage');
  const track = $('#heritage-track');
  const nativeTimeline = CSS.supports('animation-timeline: view()');
  const wideEnough = () => matchMedia('(min-width: 801px)').matches;
  if (heritage && track && !nativeTimeline) {
    let ticking = false;
    const place = () => {
      ticking = false;
      if (!wideEnough() || reduced.matches) { track.style.transform = ''; return; }
      const rect = heritage.getBoundingClientRect();
      const span = heritage.offsetHeight - innerHeight;
      const p = Math.min(1, Math.max(0, -rect.top / span));
      track.style.transform = `translateX(${(innerWidth - track.offsetWidth) * p}px)`;
    };
    const ask = () => { if (!ticking) { ticking = true; requestAnimationFrame(place); } };
    addEventListener('scroll', ask, { passive: true });
    addEventListener('resize', ask);
    ask();
  }

  /* ---------------------------------------------------------- the 2.5D stage */
  // One render, exported as three layers. The pointer opens a little parallax between them and
  // the scroll drifts them apart; both are damped so the car settles rather than tracking.
  const hero = $('#hero-stage');
  if (hero && !reduced.matches) {
    let tx = 0, ty = 0, cx = 0, cy = 0, sy = 0, raf = 0;
    const tick = () => {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      hero.style.setProperty('--px', cx.toFixed(3));
      hero.style.setProperty('--py', cy.toFixed(3));
      raf = Math.abs(tx - cx) > 0.002 || Math.abs(ty - cy) > 0.002 ? requestAnimationFrame(tick) : 0;
    };
    const wake = () => { if (!raf) raf = requestAnimationFrame(tick); };
    addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      tx = (e.clientX / innerWidth - 0.5) * 2;
      ty = (e.clientY / innerHeight - 0.5) * 2;
      wake();
    }, { passive: true });
    addEventListener('pointerleave', () => { tx = 0; ty = 0; wake(); });
    let ticking = false;
    const drift = () => {
      ticking = false;
      const p = Math.min(1, Math.max(0, scrollY / innerHeight));
      hero.style.setProperty('--sy', p.toFixed(3));
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(drift); } }, { passive: true });
    drift();
  }

  /* ---------------------------------------------------------- configurator */
  const form = $('#cfg-form');
  if (form) {
    const stage = $('#cfg-stage');
    const body = $('#cfg-body');
    const next = $('#cfg-next');
    const wheels = $('#cfg-wheels');
    const sweep = $('#cfg-sweep');
    const spec = $('#cfg-spec');
    const priceEl = $('#cfg-price');
    const reserve = $('#cfg-reserve');
    const BASE_PRICE = 248000;
    const NAMES = {
      paint: { solent: 'Solent silver', sailcloth: 'Sailcloth', keel: 'Keel black', ebb: 'Ebb', redlead: 'Red lead' },
      wheels: { graphite: 'satin graphite wheels', bronze: 'cast bronze wheels' },
      hide: { tan: 'tan hide', peat: 'peat hide', sailcloth: 'sailcloth seats' },
    };
    const value = (name) => form.elements[name].value;
    const bodySrc = (paint, w) => `img/car-${paint}-${w}.webp`;
    const wheelSrc = (fin, w) => `img/car-wheels-${fin}-${w}.webp`;
    const setSrc = (img, src) => { img.src = src(1600); img.srcset = `${src(2400)} 2400w, ${src(1600)} 1600w`; };
    const gbp = (n) => '£' + n.toLocaleString('en-GB');

    // a damped spring, so the paint pass has weight and settles rather than easing in a line
    let x = 0, v = 0, target = 0, raf = 0, last = 0, swapping = false, guard = 0, pending = null;
    const STIFF = 120, DAMP = 17;
    const step = (t) => {
      const dt = Math.min(0.032, (t - last) / 1000 || 0.016);
      last = t;
      v += (-STIFF * (x - target) - DAMP * v) * dt;
      x += v * dt;
      stage.style.setProperty('--wipe', String(Math.min(1.08, Math.max(0, x))));
      if (Math.abs(x - target) < 0.002 && Math.abs(v) < 0.02) { finish(); return; }
      raf = requestAnimationFrame(step);
    };
    const finish = () => {
      cancelAnimationFrame(raf); raf = 0;
      clearTimeout(guard); guard = 0;
      x = target; v = 0;
      stage.classList.remove('is-wiping');
      body.src = next.src;
      body.srcset = next.srcset;
      body.alt = next.dataset.alt || body.alt;
      stage.style.setProperty('--wipe', '0');
      swapping = false;
      if (pending) { const p = pending; pending = null; paintTo(p); }
    };
    const paintTo = (paint) => {
      if (swapping) { pending = paint; return; }
      if (body.src.includes(`car-${paint}-`)) return;
      swapping = true;
      const img = new Image();
      img.src = bodySrc(paint, 2400);
      // decode() can stay pending forever in a hidden tab, so don't wait on it past a beat
      Promise.race([img.decode().catch(() => {}), new Promise((r) => setTimeout(r, 600))]).then(() => {
        setSrc(next, (w) => bodySrc(paint, w));
        next.sizes = body.sizes;
        next.dataset.alt = `The Carvel in ${NAMES.paint[paint]} on ${NAMES.wheels[value('wheels')]}`;
        // set from JS so the url resolves against the document, not the stylesheet
        sweep.style.maskImage = sweep.style.webkitMaskImage = `url(${bodySrc(paint, 1600)})`;
        if (reduced.matches) { target = 1; x = 1; finish(); return; }
        stage.classList.add('is-wiping');
        target = 1; x = 0; v = 0; last = performance.now();
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(step);
        clearTimeout(guard);
        guard = setTimeout(finish, 1200);
      });
    };

    const update = () => {
      const paint = value('paint'), wheel = value('wheels'), hide = value('hide');
      let price = BASE_PRICE;
      $$('input:checked', form).forEach((i) => { price += Number(i.dataset.price || 0); });
      spec.textContent = `${NAMES.paint[paint]}, ${NAMES.wheels[wheel]}, ${NAMES.hide[hide]}.`;
      priceEl.textContent = gbp(price);
      reserve.dataset.spec = `${NAMES.paint[paint]}, ${NAMES.wheels[wheel]}, ${NAMES.hide[hide]} — ${gbp(price)}`;
      // the wheels are their own layer, so a finish change swaps only the wheels
      if (!wheels.src.includes(`car-wheels-${wheel}-`)) setSrc(wheels, (w) => wheelSrc(wheel, w));
      body.alt = `The Carvel in ${NAMES.paint[paint]} on ${NAMES.wheels[wheel]}`;
      paintTo(paint);
    };
    form.addEventListener('change', update);
    form.addEventListener('submit', (e) => e.preventDefault());
    update();

    // "Reserve this hull" carries the spec into the enquiry form
    reserve.addEventListener('click', () => {
      const msg = $('#f-msg');
      if (msg) msg.value = `I'd like to reserve a Carvel: ${reserve.dataset.spec}.`;
    });
  }

  /* ---------------------------------------------------------- enquiry */
  const enquiry = $('#enquiry');
  if (enquiry) {
    const note = $('#enquiry-note');
    enquiry.addEventListener('submit', (e) => {
      e.preventDefault();
      enquiry.classList.add('was-submitted');
      if (!enquiry.checkValidity()) {
        const bad = $(':invalid', enquiry);
        note.textContent = bad && bad.type === 'email' ? 'That email address doesn’t look right.' : 'We need your name and an email address to reply.';
        bad && bad.focus();
        return;
      }
      const name = enquiry.elements.name.value.trim().split(' ')[0];
      note.textContent = `Thank you, ${name}. Anna or Tom will write back within two working days.`;
      $$('input, textarea, button', enquiry).forEach((el) => { el.disabled = true; });
    });
  }
})();

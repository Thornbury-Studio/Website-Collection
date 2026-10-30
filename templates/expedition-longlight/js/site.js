// Longlight — page behaviour shared by every page: nav, smooth scroll,
// reveals, hero depth-parallax, card tilt, the enquiry form.
// GSAP + ScrollTrigger + Lenis are vendored (see LICENSES.md).
(function () {
  'use strict';
  const LL = window.LL || { reduced: false, fine: false };
  const hasGsap = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);

  /* ---------- smooth scroll (not under reduced motion) ---------- */
  if (!LL.reduced && typeof Lenis !== 'undefined' && hasGsap) {
    const lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 0.9, anchors: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    window.LL.lenis = lenis;
  }

  /* ---------- nav / menu ---------- */
  const toggle = document.querySelector('.nav-toggle');
  const menu = document.getElementById('menu');
  if (toggle && menu) {
    const close = () => { menu.removeAttribute('data-open'); toggle.setAttribute('aria-expanded', 'false'); document.body.removeAttribute('data-menu-open'); toggle.focus(); };
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') === 'true';
      if (open) return close();
      menu.setAttribute('data-open', ''); toggle.setAttribute('aria-expanded', 'true'); document.body.setAttribute('data-menu-open', '');
      menu.querySelector('a').focus();
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu.hasAttribute('data-open')) close(); });
  }

  /* ---------- nav backing: solid once the top 48px of the page has scrolled away.
     A sentinel + IntersectionObserver rather than a scroll listener, so it is
     independent of Lenis and of how the scroll happened. ---------- */
  const nav = document.querySelector('.nav');
  if (nav && 'IntersectionObserver' in window) {
    const sentinel = document.createElement('div');
    sentinel.setAttribute('aria-hidden', 'true');
    sentinel.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:48px;pointer-events:none;visibility:hidden';
    document.body.prepend(sentinel);
    new IntersectionObserver((en) => nav.toggleAttribute('data-solid', !en[0].isIntersecting), { threshold: 0 }).observe(sentinel);
  }

  /* ---------- reveals ---------- */
  const reveals = document.querySelectorAll('.reveal');
  if (reveals.length && 'IntersectionObserver' in window && !LL.reduced) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.setAttribute('data-in', ''); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0 });
    reveals.forEach((el) => io.observe(el));
  } else reveals.forEach((el) => el.setAttribute('data-in', ''));

  /* ---------- hero depth-parallax ---------- */
  const hero = document.querySelector('.hero');
  const media = hero && hero.querySelector('.hero-media');
  if (hero && media && hasGsap && !LL.reduced) {
    gsap.fromTo(media, { yPercent: -4, scale: 1 }, {
      yPercent: 10, scale: 1.12, ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true }
    });
    gsap.to(hero.querySelector('.hero-body'), {
      yPercent: 18, opacity: 0.2, ease: 'none',
      scrollTrigger: { trigger: hero, start: '50% top', end: 'bottom top', scrub: true }
    });
    if (LL.fine) {
      const px = gsap.quickTo(media, 'x', { duration: 1.2, ease: 'power3' });
      const py = gsap.quickTo(media, 'y', { duration: 1.2, ease: 'power3' });
      hero.addEventListener('pointermove', (e) => {
        const r = hero.getBoundingClientRect();
        px(((e.clientX - r.left) / r.width - 0.5) * -20);
        py(((e.clientY - r.top) / r.height - 0.5) * -12);
      });
      hero.addEventListener('pointerleave', () => { px(0); py(0); });
    }
  }

  /* ---------- card tilt (fine pointers only) ---------- */
  if (hasGsap && LL.fine && !LL.reduced) {
    document.querySelectorAll('.card').forEach((card) => {
      const rx = gsap.quickTo(card, '--rx', { duration: 0.7, ease: 'power3' });
      const ry = gsap.quickTo(card, '--ry', { duration: 0.7, ease: 'power3' });
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        rx(`${(-y * 7).toFixed(2)}deg`); ry(`${(x * 7).toFixed(2)}deg`);
      });
      card.addEventListener('pointerleave', () => { rx('0deg'); ry('0deg'); });
    });
  }

  /* ---------- enquiry form (front-end only) ---------- */
  const form = document.getElementById('enquiry');
  if (form) {
    const done = document.getElementById('done');
    const fields = form.querySelectorAll('.field');
    const check = (f) => {
      const input = f.querySelector('input, select, textarea');
      const ok = input.checkValidity();
      if (ok) f.removeAttribute('data-invalid'); else f.setAttribute('data-invalid', '');
      return ok;
    };
    fields.forEach((f) => f.querySelector('input, select, textarea').addEventListener('input', () => { if (f.hasAttribute('data-invalid')) check(f); }));
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let first = null;
      fields.forEach((f) => { if (!check(f) && !first) first = f; });
      if (first) { first.querySelector('input, select, textarea').focus(); return; }
      const name = form.elements.name.value.trim().split(' ')[0];
      const route = form.elements.route.options[form.elements.route.selectedIndex].text.split(' · ')[0];
      done.querySelector('[data-name]').textContent = name;
      done.querySelector('[data-route]').textContent = route;
      form.hidden = true; done.setAttribute('data-show', '');
      done.querySelector('h2').focus();
    });
  }

  /* ---------- footer year is baked, not computed: see DESIGN.md §7 ---------- */
})();

/* GROUND. — restrained motion: Lenis for the scroll, GSAP ScrollTrigger for
   the ledger stagger, SplitType for the display lines. Nothing is pinned,
   nothing is scrubbed, no parallax. Everything below is off under
   prefers-reduced-motion. */
(function () {
  'use strict';
  const doc = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  doc.classList.add('js');

  // year in the footer, every page
  document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = String(new Date().getFullYear()); });

  // mark the current page in the nav
  const here = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.top nav a').forEach((a) => {
    const href = a.getAttribute('href').split('#')[0];
    if (href === here) a.setAttribute('aria-current', 'page');
  });

  const hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';

  // ── smooth scroll ───────────────────────────────────────────────────
  if (!reduced && typeof window.Lenis !== 'undefined') {
    const lenis = new window.Lenis({ lerp: 0.11, wheelMultiplier: 0.95, smoothWheel: true });
    window.lenis = lenis;
    if (hasGsap) {
      lenis.on('scroll', window.ScrollTrigger.update);
      window.gsap.ticker.add((t) => lenis.raf(t * 1000));
      window.gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
    // anchors stay native-feeling but go through lenis so the position is right
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href').slice(1);
        const target = id && document.getElementById(id);
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: -70 });
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      });
    });
  }

  // ── reveals ─────────────────────────────────────────────────────────
  const reveals = document.querySelectorAll('.reveal, .reveal-frame');
  const show = (el) => el.classList.add('in');
  if (reduced) {
    reveals.forEach(show);
    document.querySelectorAll('.split').forEach(show);
  } else {
    // display lines: one SplitType pass, lines only, then a stagger
    if (typeof window.SplitType !== 'undefined') {
      document.querySelectorAll('.split').forEach((el) => {
        const split = new window.SplitType(el, { types: 'lines', lineClass: 'line' });
        split.lines.forEach((line) => {
          const inner = document.createElement('span');
          while (line.firstChild) inner.appendChild(line.firstChild);
          line.appendChild(inner);
        });
        // rebalance if the viewport changes width: re-split once, cheaply
        let w = window.innerWidth;
        window.addEventListener('resize', () => {
          if (Math.abs(window.innerWidth - w) < 80) return;
          w = window.innerWidth;
          split.split({ types: 'lines', lineClass: 'line' });
          split.lines.forEach((line) => {
            const inner = document.createElement('span');
            while (line.firstChild) inner.appendChild(line.firstChild);
            line.appendChild(inner);
          });
          el.classList.add('in');
        }, { passive: true });
      });
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        if (el.classList.contains('split')) {
          const spans = el.querySelectorAll('.line > span');
          spans.forEach((s, i) => { s.style.transitionDelay = (i * 0.09) + 's'; });
        }
        show(el);
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach((el) => io.observe(el));
    document.querySelectorAll('.split').forEach((el) => io.observe(el));

    // failsafe: anything already in view after load, or that IO missed on an
    // anchor jump, is revealed by a throttled sweep
    let tick = false;
    const sweep = () => {
      tick = false;
      const vh = window.innerHeight;
      document.querySelectorAll('.reveal:not(.in), .reveal-frame:not(.in), .split:not(.in)').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < vh * 0.98 && r.bottom > 0) show(el);
      });
    };
    const onScroll = () => { if (!tick) { tick = true; requestAnimationFrame(sweep); } };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    window.addEventListener('hashchange', onScroll);
    window.addEventListener('load', () => setTimeout(sweep, 1200));
  }

  // ── ledger rows stagger in, GSAP only, never under reduced ─────────
  if (!reduced && hasGsap) {
    window.gsap.registerPlugin(window.ScrollTrigger);
    document.querySelectorAll('.ledger').forEach((list) => {
      const rows = list.querySelectorAll('li');
      window.gsap.from(rows, {
        opacity: 0, y: 14, duration: .8, ease: 'power3.out', stagger: 0.07,
        scrollTrigger: { trigger: list, start: 'top 88%', once: true }
      });
    });
  }

  // ── order form (no backend: produces a reference and a mailto) ────
  const form = document.querySelector('[data-order]');
  if (form) {
    const widths = {
      round: [['ef', 'Extra fine · 0.4 mm'], ['f', 'Fine · 0.5 mm'], ['m', 'Medium · 0.6 mm'], ['b', 'Broad · 0.8 mm']],
      stub: [['0.7', 'Stub · 0.7 mm'], ['0.9', 'Stub · 0.9 mm']],
      italic: [['0.55', 'Cursive italic · 0.55 mm'], ['0.7', 'Cursive italic · 0.7 mm'], ['0.9', 'Cursive italic · 0.9 mm']],
      needle: [['0.25', 'Needlepoint · 0.25 mm']],
      oblique: [['0.6', 'Left-foot oblique · 0.6 mm · 15°'], ['0.8', 'Left-foot oblique · 0.8 mm · 15°']],
      architect: [['0.6', 'Architect · 0.6 mm across']]
    };
    const sel = form.querySelector('#width');
    const fill = (grind) => {
      const opts = widths[grind] || widths.round;
      sel.innerHTML = '';
      opts.forEach(([v, label]) => {
        const o = document.createElement('option');
        o.value = v; o.textContent = label; sel.appendChild(o);
      });
      sel.disabled = opts.length === 1;
    };
    form.querySelectorAll('input[name="grind"]').forEach((r) => r.addEventListener('change', () => fill(r.value)));
    fill((form.querySelector('input[name="grind"]:checked') || {}).value || 'round');

    const err = (field, msg) => {
      const el = form.querySelector('#' + field + '-err');
      if (el) el.textContent = msg || '';
      const input = form.querySelector('#' + field);
      if (input) input.setAttribute('aria-invalid', msg ? 'true' : 'false');
      return !msg;
    };
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = form.querySelector('#name').value.trim();
      const email = form.querySelector('#email').value.trim();
      let ok = err('name', name ? '' : 'We need a name for the box.');
      ok = err('email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? '' : 'That email does not look right.') && ok;
      if (!ok) { form.querySelector('[aria-invalid="true"]').focus(); return; }
      const grind = form.querySelector('input[name="grind"]:checked');
      const grindLabel = grind ? grind.parentElement.querySelector('span').firstChild.textContent.trim() : 'Round';
      const width = sel.options[sel.selectedIndex].textContent;
      const angle = form.querySelector('input[name="angle"]:checked');
      const ink = form.querySelector('#ink').value.trim() || 'not stated';
      const line = form.querySelector('#line').value.trim() || 'the alphabet';
      const ref = 'GR-' + new Date().getFullYear().toString().slice(2) + '-' + String(Math.floor(1000 + Math.random() * 9000));
      const body = [
        'Reference: ' + ref,
        'Grind: ' + grindLabel + ' (' + width + ')',
        'Hand: ' + (angle ? angle.value : 'not stated'),
        'Ink: ' + ink,
        'Test line: ' + line,
        'Name: ' + name,
        '', 'Attach a photo of a page you wrote with any pen.'
      ].join('\n');
      const mail = 'mailto:bench@groundpens.co.uk?subject=' + encodeURIComponent('Order ' + ref + ' — ' + grindLabel) + '&body=' + encodeURIComponent(body);
      const out = document.querySelector('[data-receipt]');
      out.querySelector('.ref').textContent = ref;
      out.querySelector('[data-r-grind]').textContent = width;
      out.querySelector('[data-r-line]').textContent = line;
      out.querySelector('[data-r-mail]').setAttribute('href', mail);
      form.hidden = true;
      out.hidden = false;
      out.setAttribute('tabindex', '-1');
      out.focus();
      if (window.lenis) window.lenis.scrollTo(out, { offset: -90 }); else out.scrollIntoView({ block: 'start' });
    });
    const undo = document.querySelector('[data-undo]');
    if (undo) undo.addEventListener('click', () => {
      const out = document.querySelector('[data-receipt]');
      out.hidden = true; form.hidden = false; form.querySelector('#name').focus();
    });
  }
})();

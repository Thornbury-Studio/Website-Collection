// Slake — the page's one moving part is --heat (1 → 0). In browsers with CSS
// scroll-driven animations the stylesheet drives it; here we only (a) supply the
// same value for browsers without them, (b) start/stop the two clips so nothing
// decodes off-screen and the user can pause them, and (c) handle the order form.

(() => {
  const root = document.documentElement;
  const stage = document.querySelector('.stage');
  const furnace = document.querySelector('.furnace');
  const coals = document.querySelector('.furnace__video');
  const pour = document.querySelector('.pour');
  const motionButton = document.querySelector('.top__motion');
  if (!stage || !coals || !pour) return;

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const native = CSS.supports('(animation-timeline: view()) and (animation-range: entry)');
  const clamp01 = (n) => Math.min(1, Math.max(0, n));

  // --- playback policy: system preference first, then the user's own toggle ---
  let userPaused = false;
  let stageInView = false;
  let stagePast = false;
  const allowPlayback = () => !reduceMotion.matches && !userPaused;
  const play = (v) => { const p = v.play(); if (p && p.catch) p.catch(() => {}); };
  const syncPlayback = () => {
    furnace.classList.toggle('is-off', stagePast);          // invisible past the stage: stop compositing it
    if (allowPlayback() && !stagePast) play(coals); else coals.pause();
    if (allowPlayback() && stageInView) play(pour); else pour.pause();
  };

  if (motionButton) {
    motionButton.hidden = reduceMotion.matches;             // the system preference already stops the footage
    motionButton.addEventListener('click', () => {
      userPaused = !userPaused;
      motionButton.setAttribute('aria-pressed', String(userPaused));
      motionButton.textContent = userPaused ? 'Play footage' : 'Pause footage';
      syncPlayback();
    });
  }
  reduceMotion.addEventListener('change', () => {
    if (motionButton) motionButton.hidden = reduceMotion.matches;
    syncPlayback();
  });

  // --- the stage: the pour plays once when the stage arrives and holds its last frame;
  //     it rewinds when the stage leaves. The same observer tells us when the coals are behind us. ---
  new IntersectionObserver((entries) => {
    for (const e of entries) {
      stageInView = e.isIntersecting;
      stagePast = !e.isIntersecting && e.boundingClientRect.bottom <= 0;
      if (!e.isIntersecting) { try { pour.currentTime = 0; } catch (_) {} }
    }
    syncPlayback();
  }, { threshold: 0 }).observe(stage);

  // fetch the pour a screen early so it's decoded before the crossfade starts
  const preloadWatch = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) { pour.preload = 'auto'; preloadWatch.disconnect(); }
  }, { rootMargin: '100% 0px' });
  preloadWatch.observe(stage);

  // --- --heat fallback (Firefox): same curve as the CSS, cover 30% → cover 70% of the stage ---
  if (!native) {
    let ticking = false;
    const update = () => {
      ticking = false;
      const r = stage.getBoundingClientRect();
      const cover = (innerHeight - r.top) / (r.height + innerHeight);
      root.style.setProperty('--heat', (1 - clamp01((cover - 0.30) / 0.40)).toFixed(4));
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    update();
  }

  syncPlayback();

  // --- order form (this build has no backend; it confirms in place) ---
  const form = document.querySelector('.order__form');
  if (form) {
    const done = form.querySelector('.order__done');
    const button = form.querySelector('.button');
    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      if (!form.reportValidity()) return;
      const email = form.elements.email.value.trim();
      const cases = Number(form.elements.cases.value) || 1;
      done.textContent = `Thanks. A payment link for ${cases} ${cases === 1 ? 'case' : 'cases'} is on its way to ${email}.`;
      button.disabled = true;
      button.textContent = 'Sent';
    });
    form.addEventListener('input', () => {
      if (button.disabled) { button.disabled = false; button.textContent = 'Get a case'; done.textContent = ''; }
    });
  }
})();

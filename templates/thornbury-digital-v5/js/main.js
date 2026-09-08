/* Thornbury Digital v5 — js/main.js
   Wires one page: route marking, blueprint labels, marquee, brief form, motion.
   Everything here is re-runnable, because js/bg.js swaps <main> in place and the
   same wiring has to happen again on the new content without a reload. All motion
   lives in a gsap.context so a single revert() takes the tweens *and* their
   ScrollTriggers back out. Nothing here hides content before it runs. */
(function (global) {
  'use strict';

  var html = document.documentElement;
  var prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* The visitor's own switch, thrown from the studio page's article 03 or from
     any footer. It joins the OS preference at the same junction, so everything
     that already respected reduced motion respects this too and no code has to
     learn about it twice. */
  var fxOff = false;
  function reducedNow() { return prefersReduced || fxOff; }
  html.classList.add('js');
  if (prefersReduced) html.classList.add('rm');

  /* ---------- field ---------- */

  var canvas = document.getElementById('field');
  var field = null;
  var fieldCbs = [];
  /* two independent reasons to run: a page that wants the field live, and a
     hold from bg.js (a transition needs it live regardless) */
  var fieldWant = true, fieldHold = false, fieldOff = false;

  function applyFieldGate() {
    if (!field || !field.setActive) return;
    /* a mode that hides the canvas outright wins over every other reason to run */
    if (fieldOff) { field.setActive(false); return; }
    if (fieldHold) { field.setActive(true); return; }
    field.setActive(fieldWant);
  }

  function startField() {
    if (!canvas || !global.TBField) { html.classList.add('no-field'); return; }
    var mode = html.getAttribute('data-field') || 'live';
    var page = html.getAttribute('data-page') || 'home';
    var anchors = {
      home: [0.5, 0.5], work: [0.5, 0.45], services: [0.44, 0.54],
      studio: [0.62, 0.48], contact: [0.68, 0.5]
    };
    var seeds = { home: 0, work: 23, services: 5, studio: 11, contact: 37 };
    var an = anchors[page] || anchors.home;
    try {
      field = global.TBField.start(canvas, {
        still: mode === 'still' || reducedNow(),
        seed: seeds[page] || 0,
        ax: an[0],
        ay: an[1]
      });
      if (!field) { html.classList.add('no-field'); return; }
      applyFieldGate();
      for (var i = 0; i < fieldCbs.length; i++) fieldCbs[i](field);
      fieldCbs.length = 0;
    } catch (err) {
      html.classList.add('no-field');
    }
  }
  /* The field is the first picture on Home, so it starts on the load path
     there. Other pages keep it off the critical path. */
  if ((html.getAttribute('data-page') || '') === 'home') startField();
  else if (global.requestIdleCallback) requestIdleCallback(startField, { timeout: 1200 });
  else setTimeout(startField, 200);

  /* ---------- per-page wiring ---------- */

  var offs = [];          /* listeners this page added, undone on teardown */
  var ctxMotion = null;   /* the gsap context for this page */

  function on(target, type, fn, opt) {
    target.addEventListener(type, fn, opt);
    offs.push(function () { target.removeEventListener(type, fn, opt); });
  }

  function markNav(page) {
    /* a case page belongs to Work */
    if (page.indexOf('case') === 0) page = 'work';
    document.querySelectorAll('.nav a, .menu-nav a, .foot-nav a').forEach(function (a) {
      if ((a.getAttribute('href') || '') === page + '.html' ||
          (page === 'home' && (a.getAttribute('href') || '') === 'index.html')) {
        a.setAttribute('aria-current', 'page');
      } else {
        a.removeAttribute('aria-current');
      }
    });
  }

  /* The mobile menu is a page of its own, so it is a real modal dialog: the
     browser gives it the focus trap, Escape, and inert content behind it. The
     markup lives outside <main>, which bg.js swaps, so it survives navigation.
     Without dialog support the bar keeps its links instead. */
  function menu() {
    var dlg = document.getElementById('menu');
    var btn = document.getElementById('menuBtn');
    if (!dlg || !btn) return;
    if (typeof dlg.showModal !== 'function') { html.classList.add('no-dialog'); return; }
    btn.setAttribute('aria-haspopup', 'dialog');
    btn.setAttribute('aria-expanded', 'false');
    on(btn, 'click', function (e) {
      e.preventDefault();
      dlg.showModal();
      btn.setAttribute('aria-expanded', 'true');
    });
    on(dlg, 'close', function () { btn.setAttribute('aria-expanded', 'false'); });
    on(dlg, 'click', function (e) {
      var el = e.target.closest && e.target.closest('[data-close], a[href]');
      if (el) dlg.close();
    });
  }

  /* True-loop marquee — see PATTERNS.md. */
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
      void track.offsetWidth;
      track.style.animationName = '';
    }
    build();
    on(global, 'resize', function () {
      clearTimeout(timer);
      timer = setTimeout(build, 200);
    });
  }

  /* Brief form: validate natively, then swap to the sent note. */
  function briefForm(root) {
    var form = root.querySelector('#brief');
    var note = root.querySelector('#brief-note');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      form.querySelectorAll('input, textarea, select').forEach(function (el) { el.setCustomValidity(''); });
      if (!form.reportValidity()) return;
      var btn = form.querySelector('[type=submit]');
      if (btn) btn.disabled = true;
      form.hidden = true;
      if (note) {
        note.hidden = false;
        note.focus();
      }
    });
    form.querySelectorAll('input, textarea, select').forEach(function (el) {
      el.addEventListener('invalid', function () {
        el.setCustomValidity(el.validity.valueMissing ? 'This field is needed.' : '');
      });
      el.addEventListener('input', function () { el.setCustomValidity(''); });
    });
  }

  /* ---------- the claims, demonstrated ----------
     Three things the charter and the pillars assert are things a visitor can
     check. Printing the instruction is weaker than doing it on the page, so
     these three do it: the switch below actually throws, the policy block is
     read out of this document's own head, and the stylesheet excerpt is fetched
     from the file it is describing. Each degrades to the printed sentence that
     is still there beside it. */

  /* Effects: the same junction reduced motion uses, thrown by hand. Everything
     is torn down and rebuilt through the path bg.js already uses for a page
     swap, so there is no second code path to keep true. */
  function paintFx() {
    document.querySelectorAll('[data-fx]').forEach(function (b) {
      b.setAttribute('aria-pressed', fxOff ? 'false' : 'true');
      var st = b.querySelector('.fx-state');
      if (st) st.textContent = fxOff ? 'Off' : 'On';
    });
  }

  function setEffects(on) {
    fxOff = !on;
    html.classList.toggle('rm', reducedNow());
    if (global.TBPage) global.TBPage.reduced = reducedNow();
    var root = document.getElementById('main');
    teardown();
    if (field) {
      field.setStill(reducedNow());
      field.setActive(!reducedNow());
    }
    if (root) init(root, { intro: false });
    if (global.ScrollTrigger) global.ScrollTrigger.refresh();
    paintFx();
  }

  function fxSwitch() {
    var btns = document.querySelectorAll('[data-fx]');
    if (!btns.length) return;
    btns.forEach(function (b) {
      on(b, 'click', function () { setEffects(fxOff); });
    });
    paintFx();
  }

  /* The policy block is this document's own Content-Security-Policy, split into
     its directives at run time. If the header changes, the page changes. */
  function cspBlock(root) {
    var host = root.querySelector('[data-csp]');
    if (!host) return;
    var meta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (!meta) return;
    var content = meta.getAttribute('content') || '';
    host.textContent = '';
    content.split(';').forEach(function (d) {
      d = d.trim();
      if (!d) return;
      var sp = d.indexOf(' ');
      var row = document.createElement('div');
      var dt = document.createElement('dt');
      var dd = document.createElement('dd');
      dt.textContent = sp < 0 ? d : d.slice(0, sp);
      dd.textContent = sp < 0 ? '\u2014' : d.slice(sp + 1);
      row.appendChild(dt);
      row.appendChild(dd);
      host.appendChild(row);
    });
    host.hidden = false;
  }

  /* The stylesheet excerpt is fetched from the stylesheet. The line count and
     the byte count are measured off what comes back, not typed in. */
  function cssBlock(root) {
    var host = root.querySelector('[data-css]');
    if (!host) return;
    var pre = host.querySelector('pre');
    var stat = host.querySelector('[data-css-stat]');
    if (!pre || !stat) return;
    var go = function () {
      fetch('css/layout.css', { credentials: 'same-origin' })
        .then(function (r) { return r.ok ? r.text() : null; })
        .then(function (txt) {
          if (!txt || !pre.isConnected) return;
          var lines = txt.split('\n');
          pre.textContent = lines.slice(0, 10).join('\n');
          var kb = (new TextEncoder().encode(txt).length / 1024).toFixed(1);
          stat.textContent = lines.length.toLocaleString('en') +
            ' lines \u00b7 ' + kb + ' kB of source \u00b7 read from the file just now';
          host.hidden = false;
        })
        .catch(function () { /* the sentence beside it still stands */ });
    };
    if (global.requestIdleCallback) requestIdleCallback(go, { timeout: 2500 });
    else setTimeout(go, 500);
  }

  /* The traced figure. Three.js and the point cloud are a lot of weight for
     something decorative, so nothing is fetched until the band is within a
     screen of the viewport, and nothing is fetched at all without WebGL, or
     under reduced motion, or with effects switched off — which is the priority
     the charter's article 02 states out loud: effects are cut first. */
  var figureHandle = null;
  var whoScene = null;    /* set by whoBeats; fed by the stage's own sequence */
  var whoLayout = null;

  /* Answered once per document. The probe is a real context, so it is released
     the moment it has answered rather than left for the collector — a page swap
     runs this again, and the browser's context budget is small. */
  var webglOK = null;
  /* the probe costs ~30 ms of context creation: paid once at idle, never in a transition */
  if (global.requestIdleCallback) requestIdleCallback(function () { hasWebGL(); }, { timeout: 3000 });
  else setTimeout(function () { hasWebGL(); }, 1500);
  function hasWebGL() {
    if (webglOK !== null) return webglOK;
    webglOK = false;
    try {
      var c = document.createElement('canvas');
      var gl = window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'));
      if (gl) {
        webglOK = true;
        var lose = gl.getExtension('WEBGL_lose_context');
        if (lose) lose.loseContext();
      }
    } catch (e) { webglOK = false; }
    return webglOK;
  }

  /* The hero's rhythm. Three clocks over the field: the wordmark decodes once
     on arrival; the process line cycles the four steps, decoding each; the
     facts arrive one after another, hold, and go again; the band loops. The
     pointer sets the process line's width axis; the wordmark stays still —
     the studio's name is the one fixed thing on the page. Everything is bound in init and
     released in teardown, so a routed return rebuilds it — the failure mode
     the last pointer feature died of was listeners left on a swapped <main>,
     and this one has none. */
  var heroNow = null;
  var HERO_STEPS = ['We look before we draw', 'We decide in the open', 'We build it to survive us', 'We hand over everything'];
  function heroType(root) {
    var hero = root.querySelector('.hero');
    if (!hero) return;
    var word = hero.querySelector('.wordmark');
    var step = hero.querySelector('[data-step]');
    var facts = hero.querySelector('[data-facts]');
    var band = hero.querySelector('#hero-band');
    var state = { step: 0, cycles: 0, facts: 0, decodes: 0, wdth: 92, pointer: null, live: true };
    heroNow = function () { return state; };
    if (band) trueLoopMarquee(band, 26);
    if (reducedNow()) {
      state.live = false;
      if (facts) [].forEach.call(facts.children, function (li) { li.classList.add('is-on'); });
      return;
    }
    var stops = [], timers = [];
    import('./rig.js').then(function (mod) {
      if (!hero.isConnected || !heroNow) return;
      var dec = mod.decoder;
      if (word) { stops.push(dec(word, word.textContent, false)); state.decodes++; }
      var k = 0, stopStep = null;
      if (step) {
        timers.push(setInterval(function () {
          k = (k + 1) % HERO_STEPS.length;
          state.step = k; state.cycles++; state.decodes++;
          if (stopStep) stopStep();
          stopStep = dec(step, HERO_STEPS[k], false);
        }, 3400));
        stops.push(function () { if (stopStep) stopStep(); });
      }
      if (facts) {
        var items = [].slice.call(facts.children), phase = 0;
        timers.push(setInterval(function () {
          if (phase < items.length) {
            items[phase].classList.add('is-on');
            stops.push(dec(items[phase], items[phase].textContent, false));
            state.facts++; state.decodes++;
          } else if (phase === items.length + 4) {
            items.forEach(function (li) { li.classList.remove('is-on'); });
            phase = -1;
          }
          phase++;
        }, 1100));
      }
    }).catch(function () { /* the lines stand still; nothing else is affected */ });
    /* the pointer's width, on the process line only: the wordmark is fixed */
    var target = 92, cur = 92, raf = 0;
    function tick() {
      raf = 0;
      cur += (target - cur) * 0.14;
      if (step) step.style.setProperty('--wd2', (cur + 4).toFixed(1));
      state.wdth = +cur.toFixed(1);
      if (Math.abs(target - cur) > 0.05) raf = requestAnimationFrame(tick);
    }
    on(global, 'pointermove', function (e) {
      var nx = Math.max(0, Math.min(1, e.clientX / Math.max(1, innerWidth)));
      target = 82 + nx * 34;
      state.pointer = +nx.toFixed(3);
      if (!raf) raf = requestAnimationFrame(tick);
    }, { passive: true });
    offs.push(function () {
      timers.forEach(clearInterval);
      stops.forEach(function (s) { if (s) s(); });
      if (raf) cancelAnimationFrame(raf);
      heroNow = null;
    });
  }

  function figure(root) {
    var host = root.querySelector('[data-figure]');
    if (!host || reducedNow() || !hasWebGL()) return;
    var io = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      /* a dynamic import resolves against this script's own URL, not the
         document's, so the specifier is relative to js/ and not to the page */
      import('./figure.js').then(function (mod) {
        if (!host.isConnected || reducedNow()) return;
        /* the stage is the clipped box the canvas lives in; the caption is
           outside it so a phone can put it underneath instead of on top */
        figureHandle = mod.mount(host.querySelector('.fig3d-stage') || host, {
          onLayout: function (anchors) { if (whoLayout) whoLayout(anchors); },
          onScene: function (ev) { if (whoScene) whoScene(ev); },
          onReady: function (n) {
            var out = host.querySelector('[data-figure-count]');
            if (out) out.textContent = n.toLocaleString('en');
            host.classList.add('is-on');
          }
        });
      }).catch(function () { /* the band stays empty; nothing else is affected */ });
    }, { rootMargin: '400px 0px' });
    io.observe(host);
    offs.push(function () {
      io.disconnect();
      if (figureHandle) { figureHandle.destroy(); figureHandle = null; }
    });
  }

  /* Who we are: the stage runs the studio's four steps as a sequence — one
     tableau holds, then becomes the next — and the page captions whichever
     one is on stage: its step lit in the row, its sentence open, a leader
     line drawn to the form it names (from the stage's own projection, so it
     lands on the figure rather than on a guess) and a hairline that fills
     over the hold. Any step can be chosen from the row. Without motion the
     steps are a plain list; on a phone the row is a list under the stage
     and the one on stage is marked. */
  function whoBeats(root) {
    var track = root.querySelector('[data-who]');
    if (!track) return;
    var stage = track.querySelector('.who-stage');
    var svg = track.querySelector('.who-leads');
    var lead = track.querySelector('.who-leads path');
    var beats = [].slice.call(track.querySelectorAll('.who-beat'));
    var phone = matchMedia('(max-width: 760px)').matches;
    var anchors = null, active = -1, holdS = 4.8;

    function draw() {
      if (!anchors || !svg || !lead || phone || active < 0) return;
      var W = stage.clientWidth, H = stage.clientHeight;
      if (!W || !H) return;
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      var s = stage.getBoundingClientRect();
      var b = beats[active], an = anchors[active];
      if (!b || !an) return;
      var r = b.getBoundingClientRect();
      var x0 = r.left - s.left + r.width / 2, y0 = r.bottom - s.top + 4;
      var x1 = an.u * W, y1 = an.v * H;
      var ym = y0 + (y1 - y0) * 0.5;
      lead.setAttribute('d', 'M' + x0.toFixed(1) + ' ' + y0.toFixed(1) + ' L' + x0.toFixed(1) + ' ' + ym.toFixed(1) + ' L' + x1.toFixed(1) + ' ' + y1.toFixed(1));
      lead.style.setProperty('--len', lead.getTotalLength().toFixed(1));
    }
    function show(i, phase) {
      active = i;
      beats.forEach(function (b, k) {
        b.classList.toggle('is-on', k === i);
        b.setAttribute('aria-current', k === i ? 'step' : 'false');
        /* the hold hairline restarts on every settle */
        b.classList.remove('is-holding');
      });
      if (phase === 'hold' && beats[i]) {
        void beats[i].offsetWidth;
        beats[i].style.setProperty('--hold', holdS + 's');
        beats[i].classList.add('is-holding');
      }
      track.setAttribute('data-who-scene', String(i));
      if (lead) {
        /* redrawn from the caption to the arriving form, so the line travels
           with the change rather than snapping after it */
        lead.classList.remove('is-in');
        draw();
        void lead.getBoundingClientRect();
        lead.classList.add('is-in');
      }
    }
    whoLayout = function (a) { anchors = a; draw(); };
    whoScene = function (ev) {
      anchors = ev.anchors || anchors;
      holdS = ev.hold || holdS;
      show(ev.index, ev.phase);
    };
    offs.push(function () { whoLayout = null; whoScene = null; });

    beats.forEach(function (b, i) {
      var btn = b.querySelector('button');
      if (!btn) return;
      on(btn, 'click', function () { if (figureHandle && figureHandle.go) figureHandle.go(i); });
    });

    if (reducedNow() || !hasWebGL()) {
      track.setAttribute('data-who-mode', 'list');
      beats.forEach(function (b) { b.classList.add('is-on'); });
      return;
    }
    track.setAttribute('data-who-mode', phone ? 'cycle-list' : 'cycle');
    on(global, 'resize', draw);
  }

  /* The platform rig. Unlike the figure this one is not decorative — without it
     the section is still a readable list, but with it the section is the whole
     point of that part of the page, so it loads on approach regardless of WebGL.
     It is handed the reduced state rather than reading it, because the switch can
     be thrown after the module is already mounted. */
  var rigHandle = null;

  function rig(root) {
    var host = root.querySelector('[data-rig-root]');
    if (!host) return;
    var io = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      import('./rig.js').then(function (mod) {
        if (!host.isConnected) return;
        rigHandle = mod.mount(host, { reduced: reducedNow() });
      }).catch(function () { /* the plain list stays; nothing else is affected */ });
    }, { rootMargin: '500px 0px' });
    io.observe(host);
    offs.push(function () {
      io.disconnect();
      if (rigHandle) { rigHandle.destroy(); rigHandle = null; }
    });
  }

  /* The second look. Decorative in the same sense the figure is — the sentence
     beside it carries the claim — so it waits for approach and never mounts
     under reduced motion or with effects off. */
  var revealHandle = null;

  function reveal(root) {
    var host = root.querySelector('[data-reveal] .reveal-stage');
    if (!host || reducedNow()) return;
    var io = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      import('./reveal.js').then(function (mod) {
        if (!host.isConnected || reducedNow()) return;
        revealHandle = mod.mount(host);
      }).catch(function () { /* the surface and the sentence stand */ });
    }, { rootMargin: '300px 0px' });
    io.observe(host);
    offs.push(function () {
      io.disconnect();
      if (revealHandle) { revealHandle.destroy(); revealHandle = null; }
    });
  }

  /* Scroll is felt in the object rather than only behind it: speed becomes a
     push on the world's rotation, which decays on its own in about a third of a
     second. Sampled once per frame, never per scroll event. */
  function scrollFeel() {
    var lastY = global.scrollY, lastT = 0, queued = false;
    function sample() {
      queued = false;
      var y = global.scrollY, now = performance.now();
      var dt = lastT ? Math.max(16, now - lastT) : 16;
      var v = Math.abs(y - lastY) / dt;
      lastY = y;
      lastT = now;
      if (v > 0.4) {
        var push = Math.min(0.3, (v - 0.4) * 0.16);
        if (field && field.impulse) field.impulse(push);
        /* the same gesture pushes the Team band's floor: one system, two objects */
        if (figureHandle && figureHandle.impulse) figureHandle.impulse(push * 2.4);
      }
    }
    on(global, 'scroll', function () {
      if (queued || reducedNow()) return;
      queued = true;
      requestAnimationFrame(sample);
    }, { passive: true });
  }

  /* Motion. GSAP stays on the critical path deliberately: moving it after first
     paint meant the hero copy had to be hidden until it arrived, and an
     opacity-0 element does not count as painted — LCP went from 1.28 s to 3.33 s
     on a 4x-throttled phone. Every tween clears its inline styles when done, so
     no transform or opacity is left behind to open a stacking context under the
     glass layers. */
  function motion(root, intro) {
    var g = global.gsap;
    if (!g || reducedNow()) return;
    var ST = global.ScrollTrigger;
    if (ST) g.registerPlugin(ST);

    ctxMotion = g.context(function () {
      var hero = root.querySelector('.hero');
      if (hero && intro) {
        var tl = g.timeline({ defaults: { ease: 'power4.out', clearProps: 'all' } });
        var rise = function (sel, y, dur, at, stagger) {
          var els = hero.querySelectorAll(sel);
          if (els.length) tl.fromTo(els, { y: y, opacity: 0 },
            { y: 0, opacity: 1, duration: dur, stagger: stagger || 0, clearProps: 'all' }, at);
        };
        rise('.hero-copy .meta', 14, 0.9, 0.15);
        rise('.wordmark', 28, 1.2, 0.28);
        rise('.hero-line', 16, 0.9, 0.48);
        rise('.hero-act > *', 14, 0.9, 0.6, 0.08);
      }

      var head = root.querySelector('.page-head');
      if (head && intro) {
        g.from(head.children, { y: 30, opacity: 0, duration: 1.2, stagger: 0.12, ease: 'power4.out', clearProps: 'all' });
      }

      if (!ST) return;

      fieldWant = true;
      applyFieldGate();

      g.utils.toArray('.reveal').forEach(function (el) {
        g.from(el, {
          y: 34, opacity: 0, duration: 1.2, ease: 'power4.out', clearProps: 'all',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true }
        });
      });

      g.utils.toArray('.entry').forEach(function (el) {
        var pl = el.querySelector('.fig-plate');
        if (pl) {
          g.fromTo(pl, { clipPath: 'inset(0% 0% 100% 0%)' }, {
            clipPath: 'inset(0% 0% 0% 0%)', duration: 1.1, ease: 'power4.inOut', clearProps: 'all',
            scrollTrigger: { trigger: el, start: 'top 92%', once: true }
          });
        }
        g.from(el.querySelectorAll('.entry-body > *'), {
          y: 22, opacity: 0, duration: 1, stagger: .08, ease: 'power4.out', clearProps: 'all',
          scrollTrigger: { trigger: el, start: 'top 92%', once: true }
        });
      });

      g.utils.toArray('.case').forEach(function (el) {
        var pl = el.querySelector('.plate');
        if (pl) {
          g.fromTo(pl, { clipPath: 'inset(0% 0% 100% 0%)' }, {
            clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'power4.inOut', clearProps: 'all',
            scrollTrigger: { trigger: el, start: 'top 84%', once: true }
          });
        }
        var rest = el.querySelectorAll('.idx, .cap');
        if (rest.length) {
          g.from(rest, {
            y: 20, opacity: 0, duration: 1, stagger: 0.1, ease: 'power4.out', clearProps: 'all',
            scrollTrigger: { trigger: el, start: 'top 78%', once: true }
          });
        }
      });
    }, root);
  }

  /* On a phone, long copy folds into native <details> so the page is a list of
     claims you can open. Desktop keeps every panel open and hides the summary
     chrome, so the layout does not change. Find-in-page still reaches the body. */
  var foldMq = matchMedia('(max-width: 760px)');
  function folds(root) {
    if (!root) return;
    var phone = foldMq.matches;
    root.querySelectorAll('details.fold').forEach(function (el) {
      var group = el.getAttribute('data-group');
      if (phone) {
        el.removeAttribute('open');
        if (group) el.setAttribute('name', group);
      } else {
        el.setAttribute('open', '');
        el.removeAttribute('name');
      }
    });
  }
  foldMq.addEventListener('change', function () {
    folds(document.getElementById('main'));
  });

  function init(root, opts) {
    opts = opts || {};
    root = root || document.getElementById('main');
    if (!root) return;
    var page = html.getAttribute('data-page') || 'home';
    markNav(page);

    fieldWant = true;
    applyFieldGate();

    menu();
    fxSwitch();
    cspBlock(root);
    cssBlock(root);
    whoBeats(root);
    folds(root);
    heroType(root);
    figure(root);
    rig(root);
    reveal(root);
    scrollFeel();
    trueLoopMarquee(root.querySelector('#mq'), 22);
    briefForm(root);
    /* a routed arrival is faded in from nothing, so the scroll motion can be
       set up one frame later, out of the frame that swapped the page */
    if (opts.intro === false && global.requestAnimationFrame) {
      var r = root;
      requestAnimationFrame(function () { if (r.isConnected) motion(r, false); });
    } else motion(root, opts.intro !== false);
  }

  function teardown(opts) {
    /* a page on its way out of the document has nothing to revert to; a
       switch thrown on a page that stays does */
    if (ctxMotion) { if (opts && opts.discard) ctxMotion.kill(); else ctxMotion.revert(); ctxMotion = null; }
    for (var i = 0; i < offs.length; i++) offs[i]();
    offs.length = 0;
  }

  global.TBPage = {
    init: init,
    teardown: teardown,
    reduced: prefersReduced,
    setEffects: setEffects,
    field: function () { return field; },
    onField: function (cb) { if (field) cb(field); else fieldCbs.push(cb); },
    /* bg.js holds the field live across a transition */
    holdField: function (on) { fieldHold = !!on; applyFieldGate(); },
    /* the verification harness and the phone probe read the hero's own state */
    heroState: function () { return heroNow ? heroNow() : null; },
    /* ...and switches it off entirely for a mode that does not use the canvas */
    suspendField: function (on) { fieldOff = !!on; applyFieldGate(); }
  };

  init(document.getElementById('main'), { intro: true });
})(window);

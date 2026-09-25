/* REDLINE. — the one mechanism.
 *
 * Measured scroll velocity (px/s, from the real scroll position every frame)
 * → REDLINE.demand() → REDLINE.step() advances the machine → every readout on
 * the page is painted from REDLINE.text(REDLINE.readout(state)). The aria-live
 * summary is REDLINE.sentence() of the same readouts. There is no second copy
 * of any number: visible, stage, chart and screen-reader text all come from
 * the model's one formatter.
 *
 * Off entirely under prefers-reduced-motion (the pages carry a static frame
 * instead), and when the visitor switches the readout off.
 */
(function () {
  'use strict';
  var R = window.REDLINE;
  if (!R) return;
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduce.matches) { root.dataset.state = 'idle'; return; }

  var KEY = 'redline:telemetry';
  var hud = document.querySelector('[data-hud]');
  var toggle = document.querySelector('[data-hud-toggle]');
  var live = document.querySelector('[data-live]');
  var outs = [].slice.call(document.querySelectorAll('[data-t]'));
  var now = document.querySelector('[data-now]');   // the dot on the fan curve (airflow.html)
  var cue = document.querySelector('[data-cue]');   // the stage's one line of direction (index.html)
  // what the stage says to do next — words about the state, never a number
  function cueFor(r) {
    if (r.state === 'redline') return r.rpm ? 'That’s the redline.' : 'Redline. Fans still stopped.';
    if (r.state === 'working' && r.rpm && r.load < 8) return 'Idling back down.';
    if (r.state === 'working') return r.rpm ? 'Fans awake. Stop, and watch it idle.' : 'Working. Keep going — the fans wake at ' + R.SPEC.gpu.fanStopC + ' °C.';
    return 'Scroll hard. Keep going.';
  }

  var enabled = true;
  try { enabled = localStorage.getItem(KEY) !== 'off'; } catch (e) { /* private mode */ }

  var s = R.idle();
  var lastY = window.scrollY, lastT = 0, vel = 0, running = false, quietFor = 0;
  var burst = null;      // the peak readout of the current burst, for the aria-live summary

  /* ---------- painting: one formatter, every surface ---------- */

  var prevState = '';
  function paint() {
    var r = R.readout(s);
    var t = R.text(r);
    for (var i = 0; i < outs.length; i++) {
      var el = outs[i], v = t[el.getAttribute('data-t')];
      if (v !== undefined && el.textContent !== v) el.textContent = v;
    }
    if (cue) { var c = cueFor(r); if (cue.textContent !== c) cue.textContent = c; }
    root.style.setProperty('--load', s.load.toFixed(3));
    root.style.setProperty('--heat', s.heat.toFixed(3));
    if (r.state !== prevState) {
      root.dataset.state = r.state;
      if (r.state === 'redline' && window.gsap && hud) {
        window.gsap.fromTo(hud.querySelector('.hud-state span'), { letterSpacing: '0.42em' },
          { letterSpacing: '0.12em', duration: 0.5, ease: 'power3.out' });
      }
      prevState = r.state;
    }
    if (window.REDLINE_HEAT) window.REDLINE_HEAT.set(s.heat, s.load);
    if (now && window.REDLINE_CURVE) window.REDLINE_CURVE(now, s);
    return r;
  }

  // one summary per burst, spoken when the machine is back at idle
  function announce(r) {
    if (r.state !== 'idle') {
      burst = burst || { load: 0, temp: 0, rpm: 0, watts: 0, state: r.state };
      burst.load = Math.max(burst.load, r.load);
      burst.temp = Math.max(burst.temp, r.temp);
      burst.rpm = Math.max(burst.rpm, r.rpm);
      burst.watts = Math.max(burst.watts, r.watts);
      return;
    }
    if (burst && live) {
      live.textContent = 'Peak this burst: ' + R.sentence(burst) + ' Back at idle: ' + R.sentence(r);
      burst = null;
    }
  }

  /* ---------- the stage: a real fan, indexed by its own speed ---------- */

  var stage = document.querySelector('[data-fan]');
  var fan = null;
  if (stage && window.FAN) {
    var F = window.FAN;
    var ctx = stage.getContext('2d');
    var frames = [], loaded = false, phase = 0, drawn = -1;
    var wakeRPM = R.SPEC.gpu.fanStartRPM, full = R.readout(R.settled(1)).rpm;
    var size = window.matchMedia('(max-width: 700px)').matches ? 's' : 'l';
    stage.width = stage.height = F.sizes[size];
    var load = function () {
      if (loaded) return; loaded = true;
      for (var i = 0; i < F.count; i++) {
        var im = new Image();
        im.decoding = 'async';
        im.src = 'film/fan/' + size + '/' + String(i).padStart(3, '0') + '.webp';
        frames.push(im);
      }
    };
    new IntersectionObserver(function (es) {
      if (es.some(function (e) { return e.isIntersecting; })) load();
    }, { rootMargin: '150% 0px' }).observe(stage);

    fan = function (dt) {
      if (!loaded) return;
      var idx;
      if (s.rpm <= 0) idx = 0;
      else if (s.rpm < wakeRPM) idx = F.dark + 1 + Math.round(s.rpm / wakeRPM * (F.wake - F.dark - 2));
      else {
        phase += dt * F.fps * (s.rpm / full);
        idx = F.wake + Math.floor(phase) % (F.count - F.wake);
      }
      var im = frames[idx];
      if (idx !== drawn && im && im.complete && im.naturalWidth) {
        ctx.drawImage(im, 0, 0, stage.width, stage.height);
        drawn = idx;
        stage.parentNode.classList.add('live');
      }
    };
  }

  /* ---------- the loop ---------- */

  function frame(time) {
    var t = typeof time === 'number' ? time * 1000 : performance.now();  // gsap ticker passes seconds
    var dt = lastT ? (t - lastT) / 1000 : 1 / 60;
    lastT = t;
    var y = window.scrollY;
    var dy = y - lastY;
    lastY = y;
    // a jump of more than a screen in one frame is navigation (an anchor, a
    // restored position), not scrolling — it doesn't count as speed
    if (Math.abs(dy) > window.innerHeight * 1.5) dy = 0;
    var v = dt > 0 ? dy / dt : 0;
    vel = vel * 0.55 + v * 0.45;
    if (Math.abs(vel) < 1) vel = 0;
    R.step(s, enabled ? R.demand(vel, window.innerHeight) : 0, dt);
    if (fan) fan(dt);
    var r = paint();
    announce(r);
    // sleep once the machine is fully idle and nothing is moving
    if (r.state === 'idle' && vel === 0 && s.heat < 0.002) {
      quietFor += dt;
      if (quietFor > 0.5) stop();
    } else quietFor = 0;
  }

  function start() {
    if (running) return;
    running = true; lastT = 0; lastY = window.scrollY; quietFor = 0;
    if (window.gsap) window.gsap.ticker.add(frame);
    else (function raf(ts) { if (!running) return; frame(ts / 1000); requestAnimationFrame(raf); })(performance.now());
  }
  function stop() {
    if (!running) return;
    running = false;
    if (window.gsap) window.gsap.ticker.remove(frame);
  }

  window.addEventListener('scroll', start, { passive: true });
  document.addEventListener('visibilitychange', function () { if (document.hidden) { s = R.idle(); paint(); stop(); } });

  function setEnabled(on) {
    enabled = on;
    try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch (e) { /* ignore */ }
    if (toggle) {
      toggle.setAttribute('aria-pressed', String(on));
      toggle.textContent = on ? 'Readout on' : 'Readout off';
      toggle.setAttribute('data-short', on ? 'On' : 'Off');
    }
    if (hud) hud.toggleAttribute('data-off', !on);
    start();
  }
  if (toggle) toggle.addEventListener('click', function () { setEnabled(!enabled); });
  setEnabled(enabled);
  paint();
  if (fan) setTimeout(function () { fan(0); }, 400);
})();

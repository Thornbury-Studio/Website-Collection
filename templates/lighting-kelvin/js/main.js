/* KELVIN — vanilla interaction. No rAF unless the filament is on screen. */
(function () {
  'use strict';

  document.documentElement.classList.add('js');

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }

  /* ---------- nav ---------- */

  var nav = document.getElementById('nav');
  var burger = document.getElementById('navBurger');
  var navLinks = document.getElementById('navLinks');
  var lastScrolled = false;

  function onScroll() {
    var scrolled = window.scrollY > 16;
    if (scrolled !== lastScrolled) {
      lastScrolled = scrolled;
      nav.classList.toggle('is-scrolled', scrolled);
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  function closeMenu() {
    nav.classList.remove('menu-open');
    if (burger) burger.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('is-locked');
  }

  if (burger) {
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('menu-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.classList.toggle('is-locked', open);
    });
  }
  if (navLinks) {
    navLinks.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') closeMenu();
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMenu();
  });

  /* ---------- reveal ---------- */

  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) {
          entries[i].target.classList.add('is-in');
          io.unobserve(entries[i].target);
        }
      }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- kelvin colour ---------- */

  function kelvinToRgb(k) {
    k = k / 100;
    var r, g, b;
    if (k <= 66) {
      r = 255;
      g = 99.4708025861 * Math.log(k) - 161.1195681661;
    } else {
      r = 329.698727446 * Math.pow(k - 60, -0.1332047592);
      g = 288.1221695283 * Math.pow(k - 60, -0.0755148492);
    }
    if (k >= 66) b = 255;
    else if (k <= 19) b = 0;
    else b = 138.5177312231 * Math.log(k - 10) - 305.0447927307;
    return [
      Math.round(clamp(r, 0, 255)),
      Math.round(clamp(g, 0, 255)),
      Math.round(clamp(b, 0, 255))
    ];
  }

  var slider = document.getElementById('kelvinSlider');
  var readout = document.getElementById('kelvinReadout');
  var pills = document.querySelectorAll('.scene-pills button');
  var root = document.documentElement;

  function setKelvin(k, fromSlider) {
    k = Math.round(clamp(Number(k), 1800, 5600) / 50) * 50;
    var rgb = kelvinToRgb(k);
    root.style.setProperty('--filament', 'rgb(' + rgb.join(',') + ')');
    root.style.setProperty('--filament-rgb', rgb.join(', '));
    root.style.setProperty('--wash', 'rgba(' + rgb.join(',') + ',0.12)');
    if (readout) readout.value = k + 'K';
    if (slider && !fromSlider) {
      slider.value = String(k);
    }
    if (slider) {
      slider.setAttribute('aria-valuenow', String(k));
      slider.setAttribute('aria-valuetext', k + ' kelvin');
    }
    pills.forEach(function (btn) {
      btn.classList.toggle('on', Number(btn.getAttribute('data-k')) === k);
    });
  }

  if (slider) {
    slider.addEventListener('input', function () {
      setKelvin(slider.value, true);
    });
  }
  pills.forEach(function (btn) {
    btn.addEventListener('click', function () {
      setKelvin(btn.getAttribute('data-k'), false);
    });
  });
  setKelvin(slider ? slider.value : 2700, true);

  /* ---------- floorplan zones ---------- */

  var zones = document.querySelectorAll('.floorplan .z');
  zones.forEach(function (z) {
    z.addEventListener('mouseenter', function () {
      zones.forEach(function (other) { other.classList.toggle('on', other === z); });
    });
  });

  /* ---------- load sheet ---------- */

  var form = document.getElementById('roomCalc');
  var outC = document.getElementById('outCircuits');
  var outW = document.getElementById('outWatts');
  var outP = document.getElementById('outPlan');
  var outN = document.getElementById('outNote');

  function planFor(covers, circuits) {
    if (covers <= 40 && circuits <= 5) return 'Studio';
    if (covers >= 180) return 'Estate';
    return 'House';
  }

  function recalc() {
    if (!form) return;
    var covers = Number((form.querySelector('input[name="covers"]:checked') || {}).value || 80);
    var ceiling = Number((form.querySelector('input[name="ceiling"]:checked') || {}).value || 3.4);
    var room = (form.querySelector('input[name="room"]:checked') || {}).value || 'dining';

    var circuits = Math.ceil(covers / 18);
    if (ceiling >= 4.2) circuits += 2;
    if (room === 'bar') circuits += 1;
    if (room === 'lobby') circuits += 2;
    circuits = Math.max(3, circuits);

    var watts = circuits * 42;
    var plan = planFor(covers, circuits);
    var roomLabel = room === 'dining' ? 'dining room' : room;

    if (outC) outC.textContent = String(circuits);
    if (outW) outW.textContent = watts + ' W';
    if (outP) outP.textContent = plan;
    if (outN) {
      outN.textContent = 'A ' + covers + '-cover ' + roomLabel + ' at ' + ceiling +
        ' m: ' + circuits + ' circuits, ' + plan + ' plan, colour lock included.';
    }

    document.querySelectorAll('.plan').forEach(function (el) {
      var match = el.getAttribute('data-plan') === plan;
      el.classList.toggle('featured', match);
      var flag = el.querySelector('.plan-flag');
      if (match) {
        if (!flag) {
          flag = document.createElement('span');
          flag.className = 'plan-flag';
          el.insertBefore(flag, el.firstChild);
        }
        flag.textContent = 'On this load sheet';
      } else if (flag) {
        flag.remove();
      }
    });
  }

  if (form) {
    form.addEventListener('change', recalc);
    recalc();
  }

  /* ---------- billing toggle ---------- */

  var toggle = document.getElementById('billToggle');
  var labM = document.getElementById('labMonthly');
  var labA = document.getElementById('labAnnual');
  var annual = false;

  function setBilling(next) {
    annual = next;
    if (toggle) {
      toggle.classList.toggle('annual', annual);
      toggle.setAttribute('aria-checked', String(annual));
    }
    if (labM) labM.classList.toggle('on', !annual);
    if (labA) labA.classList.toggle('on', annual);
    document.querySelectorAll('.amount').forEach(function (el) {
      el.textContent = annual ? el.getAttribute('data-a') : el.getAttribute('data-m');
    });
    document.querySelectorAll('[data-billed]').forEach(function (el) {
      el.textContent = annual ? 'Billed annually (two months held)' : 'Billed monthly';
    });
  }
  if (toggle) {
    toggle.addEventListener('click', function () { setBilling(!annual); });
  }

  /* ---------- newsletter ---------- */

  var news = document.getElementById('newsForm');
  if (news) {
    news.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = document.getElementById('newsEmail');
      var msg = document.getElementById('newsMsg');
      if (!input || !input.value || !input.checkValidity()) {
        if (input) input.focus();
        return;
      }
      input.value = '';
      if (msg) msg.hidden = false;
    });
  }

  /* True-loop marquee — see PATTERNS.md.
     Clones the first child until half the track covers its container,
     keeping the total even so -50% stays a whole period.
     Duration scales with the clone count so the speed never changes. */
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
    window.addEventListener('resize', function () {
      clearTimeout(timer);
      timer = setTimeout(build, 200);
    });
  }

  if (!reduceMotion) {
    trueLoopMarquee(document.getElementById('houseTrack'), 28);
  }
})();

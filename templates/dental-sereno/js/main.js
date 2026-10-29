/* Sereno Dental — smooth scroll, the first-visit clock, the hero line, the enquiry form.
   Everything here is enhancement: the page reads fully with no JavaScript. */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
  var lenis = null;

  /* ---------- smooth scroll (native when reduced motion is asked for) ---------- */
  if (!reduced && typeof Lenis !== 'undefined') {
    lenis = new Lenis({ lerp: 0.11, smoothWheel: true });
    if (hasGsap) {
      gsap.registerPlugin(ScrollTrigger);
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      var tick = function (t) { lenis.raf(t); requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    }
  }

  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      var el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(el, { offset: -72, duration: 1.2 });
      else el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
      history.replaceState(null, '', id);
      el.setAttribute('tabindex', '-1');
      el.focus({ preventScroll: true });
    });
  });

  /* ---------- hero line: one SplitType reveal, lines only ---------- */
  var title = document.querySelector('.hero-title');
  if (title && !reduced && typeof SplitType !== 'undefined' && hasGsap && window.matchMedia('(min-width: 900px)').matches) {
    var rise = function () {
      var split = new SplitType(title, { types: 'lines', lineClass: 'line' });
      split.lines.forEach(function (line) {
        var inner = document.createElement('span');
        while (line.firstChild) inner.appendChild(line.firstChild);
        line.appendChild(inner);
      });
      gsap.set(title, { opacity: 1 });
      gsap.from(title.querySelectorAll('.line > span'), {
        yPercent: 104, duration: 1.1, ease: 'power4.out', stagger: 0.09, delay: 0.05,
        onComplete: function () { split.revert(); }
      });
    };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(rise); else rise();
  } else if (title) {
    title.style.opacity = '1';
  }

  /* ---------- the first visit: hairline clock, 0:00 to 0:45 ---------- */
  var stage = document.querySelector('[data-visit]');
  if (stage) {
    var hand = stage.querySelector('.hand');
    var read = stage.querySelector('[data-min]');
    var readNote = read.nextElementSibling;
    var feelOut = stage.querySelector('[data-feel]');
    var list = stage.querySelector('[data-beats]');
    var rail = stage.querySelector('.rail');
    var beats = Array.prototype.slice.call(stage.querySelectorAll('.beat'));
    var marks = beats.map(function (b) { return Number(b.getAttribute('data-m')); });
    var TOTAL = 45;

    var setMinute = function (m) {
      m = Math.max(0, Math.min(TOTAL, Math.round(m)));
      read.textContent = '0:' + (m < 10 ? '0' + m : m);
      hand.style.transform = 'rotate(' + (m / 60 * 360) + 'deg)';
      var i = 0;
      for (var k = 0; k < marks.length; k++) if (marks[k] <= m) i = k;
      beats.forEach(function (b, k) { b.classList.toggle('on', k === i); });
      if (rail) rail.style.transform = 'translateY(' + (beats[i].offsetTop + 10) + 'px)';
      if (feelOut && feelOut.getAttribute('data-i') !== String(i)) {
        feelOut.setAttribute('data-i', String(i));
        feelOut.innerHTML = beats[i].querySelector('.feel').innerHTML;
      }
    };
    /* stacked and static modes: the ring reads as a total, not a running clock */
    var setStatic = function () {
      hand.style.transform = 'rotate(270deg)';
      read.textContent = '45 min';
      if (readNote) readNote.textContent = 'from the front desk to the door, every time';
      beats.forEach(function (b) { b.classList.remove('on'); });
    };

    if (reduced || !hasGsap) {
      setStatic();
    } else {
      var mm = gsap.matchMedia();
      mm.add('(min-width: 900px) and (min-height: 700px)', function () {
        stage.classList.add('is-pinned');
        if (readNote) readNote.textContent = 'of a 45-minute first visit';
        setMinute(0);
        var st = ScrollTrigger.create({
          trigger: stage,
          start: 'top top+=88',
          end: '+=' + (beats.length * 300),
          pin: true,
          pinSpacing: true,
          scrub: 0.5,
          onUpdate: function (self) { setMinute(self.progress * TOTAL); }
        });
        return function () {
          st.kill();
          stage.classList.remove('is-pinned');
          setStatic();
        };
      });
      mm.add('(max-width: 899px), (max-height: 699px)', function () {
        setStatic();
        var tweens = beats.map(function (b) {
          return gsap.fromTo(b, { opacity: 0, y: 14 }, {
            opacity: 1, y: 0, duration: 0.7, ease: 'power3.out',
            scrollTrigger: { trigger: b, start: 'top 92%', once: true }
          });
        });
        return function () { tweens.forEach(function (t) { t.scrollTrigger && t.scrollTrigger.kill(); t.kill(); }); gsap.set(beats, { clearProps: 'all' }); };
      });
    }
  }

  /* ---------- enquiry form: composes a WhatsApp message, nothing is sent from here ---------- */
  var form = document.querySelector('[data-enquiry]');
  if (form) {
    var out = form.querySelector('[data-out]');
    var compose = function () {
      var name = form.elements.name.value.trim();
      var phone = form.elements.phone.value.trim();
      var when = form.elements.when.value;
      var msg = form.elements.message.value.trim();
      var text = 'Hello Sereno Dental. ' + (name ? 'My name is ' + name + '. ' : '') +
        (msg ? msg + ' ' : '') + (when ? 'Preferred time: ' + when + '. ' : '') +
        (phone ? 'You can reach me on ' + phone + '.' : '');
      return text.trim();
    };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      var url = 'https://wa.me/6582190450?text=' + encodeURIComponent(compose());
      out.textContent = 'Opening WhatsApp with your message. If nothing happens, your message is below so you can paste it.';
      form.querySelector('[data-copy]').textContent = compose();
      form.setAttribute('data-ready', url);
      if (!form.hasAttribute('data-hold')) window.location.href = url;
    });
    var mail = form.querySelector('[data-mail]');
    if (mail) mail.addEventListener('click', function () {
      mail.href = 'mailto:hello@serenodental.sg?subject=' + encodeURIComponent('Enquiry from the website') + '&body=' + encodeURIComponent(compose());
    });
  }
})();

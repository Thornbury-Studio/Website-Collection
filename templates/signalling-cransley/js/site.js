/* Cransley Signal Works — page furniture: drawer, reveals, docket form. */
(function () {
  'use strict';

  /* ---- mobile drawer ---- */
  var burger = document.getElementById('burger');
  var drawer = document.getElementById('drawer');
  if (burger && drawer) {
    burger.addEventListener('click', function () {
      var open = burger.getAttribute('aria-expanded') === 'true';
      burger.setAttribute('aria-expanded', open ? 'false' : 'true');
      drawer.dataset.open = open ? 'false' : 'true';
    });
    drawer.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        burger.setAttribute('aria-expanded', 'false');
        drawer.dataset.open = 'false';
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawer.dataset.open === 'true') {
        burger.setAttribute('aria-expanded', 'false');
        drawer.dataset.open = 'false';
        burger.focus();
      }
    });
  }

  /* ---- section reveals ---- */
  var targets = document.querySelectorAll('.sec-head, .sched-row, .rule blockquote, .book-scroll, .docket-grid, .foot-grid');
  if ('IntersectionObserver' in window && targets.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    targets.forEach(function (t) { t.classList.add('reveal'); io.observe(t); });
  }

  /* ---- docket form ---- */
  var form = document.getElementById('docketForm');
  var note = document.getElementById('formNote');
  if (form && note) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var required = form.querySelectorAll('[required]');
      var bad = null;
      required.forEach(function (f) {
        var ok = f.value.trim() !== '' && (f.type !== 'email' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.value));
        f.setAttribute('aria-invalid', ok ? 'false' : 'true');
        if (!ok && !bad) bad = f;
      });
      if (bad) {
        note.dataset.state = 'error';
        note.textContent = 'We need the box name, the railway and an email before we can raise a docket.';
        bad.focus();
        return;
      }
      var box = form.querySelector('#f-box').value.trim();
      var num = 'CSW-' + String(1180 + Math.floor(Math.random() * 90));
      note.dataset.state = 'sent';
      note.textContent = 'Docket ' + num + ' raised for ' + box + '. Someone from the shop will call within two working days.';
      form.reset();
      required.forEach(function (f) { f.setAttribute('aria-invalid', 'false'); });
    });
  }
}());

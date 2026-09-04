/* Gather House — enquiry form → mailto */
(function () {
  'use strict';

  var form = document.getElementById('contactForm');
  var noted = document.getElementById('formSuccess');
  if (!form || !noted) return;

  function fieldOf(el) {
    return el.closest('.field');
  }

  function fail(el, msg) {
    var f = fieldOf(el);
    f.classList.add('is-bad');
    el.setAttribute('aria-invalid', 'true');
    var err = f.querySelector('.field__err');
    if (err) err.textContent = msg;
  }

  function clear(el) {
    var f = fieldOf(el);
    f.classList.remove('is-bad');
    el.removeAttribute('aria-invalid');
    var err = f.querySelector('.field__err');
    if (err) err.textContent = '';
  }

  Array.prototype.forEach.call(form.elements, function (el) {
    if (el.tagName === 'BUTTON') return;
    el.addEventListener('input', function () { clear(el); });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = document.getElementById('cName');
    var email = document.getElementById('cEmail');
    var date = document.getElementById('cDate');
    var size = document.getElementById('cSize');
    var msg = document.getElementById('cMsg');
    var ok = true;
    var first = null;

    if (!name.value.trim()) {
      fail(name, 'Please leave a name so we can reply.');
      ok = false; first = first || name;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) {
      fail(email, 'That email does not look complete.');
      ok = false; first = first || email;
    }
    if (!date.value) {
      fail(date, 'Pick a preferred date for your gathering.');
      ok = false; first = first || date;
    }
    var n = parseInt(size.value, 10);
    if (!n || n < 1 || n > 80) {
      fail(size, 'Party size should be between 1 and 80.');
      ok = false; first = first || size;
    }
    if (msg.value.trim().length < 10) {
      fail(msg, 'A short note about the occasion helps us prepare.');
      ok = false; first = first || msg;
    }

    if (!ok) {
      if (first) first.focus();
      return;
    }

    var subject = 'Gather House enquiry — ' + name.value.trim();
    var body =
      'Name: ' + name.value.trim() + '\n' +
      'Email: ' + email.value.trim() + '\n' +
      'Preferred date: ' + date.value + '\n' +
      'Party size: ' + n + '\n\n' +
      msg.value.trim();

    var mailto =
      'mailto:hello@gatherhouse.sg' +
      '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(body);

    window.location.href = mailto;

    var firstName = name.value.trim().split(/\s+/)[0];
    noted.hidden = false;
    noted.innerHTML =
      '<strong>Almost there, ' + firstName + '.</strong> Your mail client should open with the enquiry ready. ' +
      'If it does not, write us at <a href="mailto:hello@gatherhouse.sg">hello@gatherhouse.sg</a> — we reply within one working day.';
    form.querySelectorAll('input, textarea, button[type="submit"]').forEach(function (el) {
      el.disabled = true;
    });
    noted.setAttribute('tabindex', '-1');
    noted.focus();
  });
}());

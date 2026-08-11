/* VELA — the contact form. Validates in place and answers with the response
   time for the subject chosen, rather than a generic thank-you. */
(function (root, doc) {
  'use strict';

  var R = root.VelaRender;

  /* Who picks the message up, and how long they realistically take. */
  var ROUTES = {
    visit: ['the bookings desk', 'the same working day'],
    access: ['our access lead', 'one working day'],
    schools: ['the learning team', 'two working days'],
    data: ['the duty astronomer', 'about a week — data requests are answered in batches'],
    lighting: ['the dark sky officer', 'a week, and the survey itself takes longer'],
    patron: ['the director', 'two working days'],
    press: ['the office', 'the same working day']
  };

  function boot() {
    var form = doc.getElementById('contactForm');
    if (!form) return;
    var done = doc.getElementById('contactDone');
    var hint = doc.getElementById('formHint');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = doc.getElementById('fName');
      var email = doc.getElementById('fEmail');
      var msg = doc.getElementById('fMessage');
      var subject = doc.getElementById('fSubject');

      var bad = null;
      if (!name.value.trim()) bad = name;
      else if (!email.value.trim() || !email.checkValidity()) bad = email;
      else if (!msg.value.trim()) bad = msg;

      if (bad) {
        bad.focus();
        if (hint) {
          hint.textContent = bad === email && email.value.trim()
            ? 'That email address does not look right — check it and try again.'
            : 'Please fill in your name, a working email and a message.';
        }
        return;
      }

      var route = ROUTES[subject.value] || ROUTES.visit;
      form.hidden = true;
      done.hidden = false;
      done.innerHTML = '<div class="note"><p><strong>Thank you, ' +
        R.esc(name.value.trim().split(' ')[0]) + '.</strong></p>' +
        '<p>This has gone to ' + route[0] + ', who will reply to ' +
        R.esc(email.value.trim()) + ' within ' + route[1] + '.</p>' +
        '<p>If it turns out to be urgent before then, the office number is ' +
        '<a href="tel:+441229717400">+44 1229 717 400</a>.</p></div>';
      done.setAttribute('tabindex', '-1');
      done.focus();
    });
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window, document);

/* UNSTILL — contact form: validates in place, answers with who picks it up. */
(function (root, doc) {
  'use strict';

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  var ROUTES = {
    order: ['whoever packed your crate', 'the same working day'],
    wholesale: ['the founders directly', 'two working days'],
    press: ['the office', 'the same working day'],
    flavour: ['the brewer whose recipe you have opinions about', 'when they have recovered'],
    other: ['all four of us', 'two working days']
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

      var bad = !name.value.trim() ? name
        : (!email.value.trim() || !email.checkValidity()) ? email
        : !msg.value.trim() ? msg : null;
      if (bad) {
        bad.focus();
        if (hint) {
          hint.textContent = bad === email && email.value.trim()
            ? 'That email does not look deliverable — check it and go again.'
            : 'Name, working email, message. Then we can talk.';
        }
        return;
      }

      var route = ROUTES[subject.value] || ROUTES.other;
      form.hidden = true;
      done.hidden = false;
      done.innerHTML = '<div class="note"><p><strong>Got it, ' +
        esc(name.value.trim().split(' ')[0]) + '.</strong></p>' +
        '<p>This goes to ' + route[0] + ', and a reply lands at ' +
        esc(email.value.trim()) + ' within ' + route[1] + '.</p></div>';
      done.setAttribute('tabindex', '-1');
      done.focus();
    });
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window, document);

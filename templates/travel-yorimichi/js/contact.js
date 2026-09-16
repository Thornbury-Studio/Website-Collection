/* YORIMICHI — contact page: tour list in the form, and a sent state. */
(function () {
  'use strict';
  var Y = window.YORI;
  var sel = document.getElementById('cTour');
  if (sel) {
    (window.YORI_TOURS || []).forEach(function (t) {
      var o = document.createElement('option');
      o.value = t.slug;
      o.textContent = t.name + ' — ' + t.days + ' days';
      sel.appendChild(o);
    });
    var pre = Y.qs('tour');
    if (pre) sel.value = pre;
  }

  var form = document.getElementById('enquiry');
  if (!form) return;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = document.getElementById('cName');
    var email = document.getElementById('cEmail');
    var ok = true;
    [name, email].forEach(function (f) {
      var bad = !f.value.trim() || (f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.value));
      f.setAttribute('aria-invalid', String(bad));
      f.style.borderColor = bad ? 'var(--shu)' : '';
      if (bad) ok = false;
    });
    if (!ok) { (name.value.trim() ? email : name).focus(); return; }
    var tour = sel.options[sel.selectedIndex].text;
    var when = document.getElementById('cWhen');
    document.getElementById('enquiryText').textContent =
      'Thanks, ' + name.value.trim().split(' ')[0] + '. We have your note about ' +
      (sel.value ? tour : 'which tour to take') + (when.value ? ' for ' + when.options[when.selectedIndex].text : '') +
      ' and will write to ' + email.value.trim() + '.';
    form.hidden = true;
    var done = document.getElementById('enquiryDone');
    done.hidden = false;
    done.scrollIntoView({ block: 'nearest' });
    /* Hiding the form takes the submit button — and with it the keyboard
       focus — out of the document, dropping focus to <body>. A screen reader
       user would be told nothing and land back at the top of the page. Move
       focus onto the confirmation, which carries role="status" and
       tabindex="-1" for exactly this. */
    done.focus();
  });
})();

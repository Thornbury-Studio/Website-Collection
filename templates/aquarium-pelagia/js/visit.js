/* PELAGIA — visit page: the hours list and the enquiry form. */
(function () {
  'use strict';
  var P = window.PELAGIA;
  var $ = function (id) { return document.getElementById(id); };
  var now = new Date();
  var names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var hours = $('hoursList');
  if (hours) {
    hours.innerHTML = [1, 2, 3, 4, 5, 6, 0].map(function (d) {
      var late = P.hours.lateDays.indexOf(d) > -1;
      return '<li' + (d === now.getDay() ? ' class="is-today"' : '') + '><span>' + names[d] + '</span><span>' + P.hours.open + ' – ' + (late ? P.hours.lateClose + ' · After Dark' : P.hours.close) + '</span></li>';
    }).join('');
  }

  var form = $('enquiry');
  if (!form) return;
  var about = P.qs('about');
  if (about) {
    var sel = $('cType');
    var x = P.experiences.filter(function (e) { return e.slug === about; })[0];
    if (x) { sel.value = 'An experience booking'; $('cMsg').value = x.name + ' — '; }
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = $('cName'), email = $('cEmail'), ok = true;
    [name, email].forEach(function (f) {
      var bad = !f.value.trim() || (f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.value));
      f.setAttribute('aria-invalid', String(bad)); f.style.borderColor = bad ? 'var(--warn)' : ''; if (bad) ok = false;
    });
    if (!ok) { (name.value.trim() ? email : name).focus(); return; }
    var type = $('cType'); var size = $('cSize');
    $('enquiryText').textContent = 'Thanks, ' + name.value.trim().split(' ')[0] + '. We have your note about ' + type.options[type.selectedIndex].text.toLowerCase() + ' for ' + size.options[size.selectedIndex].text + ' people, and will write to ' + email.value.trim() + '.';
    form.hidden = true;
    $('enquiryDone').hidden = false;
    $('enquiryDone').scrollIntoView({ block: 'nearest' });
  });
})();

/* Contact — composes the enquiry into a WhatsApp message client-side.
   Nothing is stored or sent to any server. */

(function () {
  'use strict';

  var WHATSAPP_NUMBER = '6596924113';

  document.addEventListener('DOMContentLoaded', function () {
    var form = document.getElementById('qform');
    if (!form) return;

    var nameField = document.getElementById('qf-name-field');
    var phoneField = document.getElementById('qf-phone-field');
    var done = document.getElementById('qform-done');
    var fallback = document.getElementById('qform-fallback');

    [nameField, phoneField].forEach(function (f) {
      f.querySelector('input').addEventListener('input', function () {
        f.classList.remove('has-error');
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      done.classList.remove('is-visible');

      var name = document.getElementById('qf-name').value.trim();
      var phone = document.getElementById('qf-phone').value.trim();
      var vehicle = document.getElementById('qf-vehicle').value.trim();
      var category = document.getElementById('qf-category').value;
      var service = document.getElementById('qf-service').value;
      var coverage = document.getElementById('qf-coverage').value;
      var msg = document.getElementById('qf-msg').value.trim();

      nameField.classList.toggle('has-error', !name);
      phoneField.classList.toggle('has-error', !phone);
      if (!name || !phone) {
        (!name ? nameField : phoneField).querySelector('input').focus();
        return;
      }

      var lines = [
        "Hi Esteem Auto Medics, I'd like a quote.",
        'Name: ' + name,
        'Phone: ' + phone
      ];
      if (vehicle) lines.push('Vehicle: ' + vehicle);
      lines.push('Category: ' + category);
      lines.push('Looking at: ' + service);
      if (coverage !== 'Not applicable') lines.push('PPF coverage: ' + coverage);
      if (msg) lines.push('Details: ' + msg);

      var url = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(lines.join('\n'));
      window.open(url, '_blank', 'noopener');
      fallback.href = url;
      done.classList.add('is-visible');
    });
  });
}());

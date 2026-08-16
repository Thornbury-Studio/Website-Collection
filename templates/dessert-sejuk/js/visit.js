/* SEJUK visit — message form with honest validation and clear feedback. */
(function () {
  "use strict";

  var ui = window.SEJUK.ui;
  var form = document.getElementById("counter-form");
  if (!form) return;

  function fieldWrap(input) {
    return input.closest(".field");
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = form.querySelector('input[name="name"]');
    var email = form.querySelector('input[name="email"]');
    var msg = form.querySelector('textarea[name="message"]');
    var ok = true;

    [name, email, msg].forEach(function (f) {
      fieldWrap(f).classList.remove("is-bad");
    });
    if (!name.value || name.value.trim().length < 2) {
      fieldWrap(name).classList.add("is-bad");
      ok = false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) {
      fieldWrap(email).classList.add("is-bad");
      ok = false;
    }
    if (!msg.value || msg.value.trim().length < 10) {
      fieldWrap(msg).classList.add("is-bad");
      ok = false;
    }
    if (!ok) {
      ui.toast("A blank or two needs filling first.");
      return;
    }

    var done = document.getElementById("form-done");
    form.hidden = true;
    done.hidden = false;
    done.querySelector("[data-done-name]").textContent = name.value.trim().split(/\s+/)[0];
    ui.toast("Noted — we read these between shaves.");
  });
})();

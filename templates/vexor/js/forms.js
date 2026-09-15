/* ride.html + contact.html forms */
(function () {
  "use strict";
  function $(s) { return document.querySelector(s); }

  function tomorrowISO() {
    var d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }

  function fillSelects() {
    var modelSel = $("#f-model");
    var centreSel = $("#f-centre");
    if (modelSel) {
      var pref = new URLSearchParams(location.search).get("model");
      VEXOR.MODELS.forEach(function (m) {
        var opt = document.createElement("option");
        opt.value = m.id;
        opt.textContent = m.name + " — " + m.class;
        if (pref && pref === m.id) opt.selected = true;
        modelSel.appendChild(opt);
      });
    }
    if (centreSel) {
      VEXOR.LOCATIONS.forEach(function (l) {
        var opt = document.createElement("option");
        opt.value = l.id;
        opt.textContent = l.name;
        centreSel.appendChild(opt);
      });
    }
    var date = $("#f-date");
    if (date) {
      date.min = tomorrowISO();
      if (!date.value) date.value = tomorrowISO();
    }
  }

  function showError(id, msg) {
    var el = document.querySelector('[data-error-for="' + id + '"]');
    if (el) el.textContent = msg || "";
  }

  function validateRide(form) {
    var ok = true;
    var name = form.name.value.trim();
    var phone = form.phone.value.trim();
    var email = form.email.value.trim();
    var date = form.date.value;

    showError("name", "");
    showError("phone", "");
    showError("email", "");
    showError("date", "");

    if (!name) { showError("name", "Enter your name."); ok = false; }
    if (!VexorUI.sgMobileOk(phone)) { showError("phone", "Use a Singapore mobile (+65 and 8 digits)."); ok = false; }
    if (!VexorUI.emailOk(email)) { showError("email", "Enter a valid email."); ok = false; }
    if (!date || date < tomorrowISO()) { showError("date", "Choose a date from tomorrow onward."); ok = false; }
    return ok;
  }

  function validateContact(form) {
    var ok = true;
    showError("name", "");
    showError("phone", "");
    showError("email", "");
    showError("message", "");
    if (!form.name.value.trim()) { showError("name", "Enter your name."); ok = false; }
    if (!VexorUI.sgMobileOk(form.phone.value.trim())) { showError("phone", "Use a Singapore mobile."); ok = false; }
    if (!VexorUI.emailOk(form.email.value.trim())) { showError("email", "Enter a valid email."); ok = false; }
    if (!form.message.value.trim() || form.message.value.trim().length < 8) {
      showError("message", "Write a short message (8+ characters).");
      ok = false;
    }
    return ok;
  }

  function waLink(text) {
    return "https://wa.me/6562489100?text=" + encodeURIComponent(text);
  }

  document.addEventListener("DOMContentLoaded", function () {
    fillSelects();

    var ride = $("#ride-form");
    if (ride) {
      ride.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!validateRide(ride)) return;
        var model = VEXOR.byId(ride.model.value);
        var centre = VEXOR.LOCATIONS.filter(function (l) { return l.id === ride.centre.value; })[0];
        var summary =
          "Ride request — " + ride.name.value.trim() +
          "\nMobile: " + ride.phone.value.trim() +
          "\nEmail: " + ride.email.value.trim() +
          "\nModel: " + (model ? model.name : ride.model.value) +
          "\nCentre: " + (centre ? centre.name : ride.centre.value) +
          "\nDate: " + ride.date.value + " · " + ride.slot.value +
          (ride.notes.value.trim() ? ("\nNotes: " + ride.notes.value.trim()) : "");

        $("#ride-form-wrap").hidden = true;
        var panel = $("#ride-success");
        panel.hidden = false;
        $("#success-summary").textContent = summary;
        $("#wa-link").href = waLink(summary);
        panel.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }

    var contact = $("#contact-form");
    if (contact) {
      contact.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!validateContact(contact)) return;
        var summary =
          "Contact — " + contact.name.value.trim() +
          "\n" + contact.phone.value.trim() +
          "\n" + contact.email.value.trim() +
          "\n" + contact.message.value.trim();
        $("#contact-form-wrap").hidden = true;
        var panel = $("#contact-success");
        panel.hidden = false;
        $("#success-summary").textContent = summary;
        $("#wa-link").href = waLink(summary);
      });
    }

    var locRoot = $("#locations-list");
    if (locRoot) {
      locRoot.innerHTML = VEXOR.LOCATIONS.map(function (l) {
        return '<article class="loc-card"><div class="label">' + l.id + '</div><h3 style="margin:8px 0 10px;text-transform:none;font-variation-settings:\'wdth\' 110, \'wght\' 700">' + l.name + '</h3><p class="muted">' + l.address + '<br>' + l.hours + '<br>' + l.phone + '</p><p style="margin-top:12px"><a href="' + l.maps + '" rel="noopener" target="_blank">Open in Maps</a></p></article>';
      }).join("");
    }
  });
})();

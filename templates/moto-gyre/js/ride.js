/* GYRE — ride: demonstration booking. Machine list from the catalogue;
   submit composes a mailto (fictional-marque contact pattern — no live
   endpoints, no phone numbers). */
(function () {
  "use strict";

  var G = window.GYRE;
  if (!G) return;

  var sel = document.getElementById("f-machine");
  if (sel) {
    G.machines.forEach(function (m) {
      var o = document.createElement("option");
      o.value = m.id;
      o.textContent = m.name + " — " + m.cls;
      sel.appendChild(o);
    });
    var want = new URLSearchParams(location.search).get("m");
    if (want && G.byId(want)) sel.value = want;
  }

  var form = document.getElementById("ride-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = (document.getElementById("f-name").value || "").trim();
      var machine = G.byId(sel.value);
      var licence = document.getElementById("f-licence").value;
      var when = document.getElementById("f-date").value;
      var subject = "Demonstration ride — " + (machine ? machine.name : "GYRE");
      var body = "Name: " + name +
        "\nMachine: " + (machine ? machine.name + " (" + machine.cls + ")" : "-") +
        "\nLicence class: " + licence +
        "\nPreferred date: " + (when || "-") +
        "\n\nSent from the GYRE site.";
      location.href = "mailto:" + G.contactEmail +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(body);
    });
  }
})();

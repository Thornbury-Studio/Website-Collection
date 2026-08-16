/* NEAP — reservations: computed release windows, the request form,
   and the held state (neap.request.v1). */
(function () {
  "use strict";

  var H = window.NEAP_HOUSE, T = window.NEAP_TIDE;
  if (!H) return;

  var KEY = "neap.request.v1";

  function pad(n) { return n < 10 ? "0" + n : String(n); }
  function iso(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function monthName(d) { return d.toLocaleDateString("en-GB", { month: "long" }); }
  function longDate(d) {
    return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  }

  /* ---------- release arithmetic (computed, never typed) ----------
     On the 1st of each month at noon, the month two ahead opens.
     So the bookable window runs from tomorrow to the end of the month
     (horizonMonths) ahead of the most recent release. */
  var now = new Date();
  var thisRelease = new Date(now.getFullYear(), now.getMonth(), H.releaseDay, H.releaseHour);
  var lastRelease = now >= thisRelease ? thisRelease
    : new Date(now.getFullYear(), now.getMonth() - 1, H.releaseDay, H.releaseHour);
  var nextRelease = new Date(lastRelease.getFullYear(), lastRelease.getMonth() + 1, H.releaseDay, H.releaseHour);

  var openThrough = new Date(lastRelease.getFullYear(), lastRelease.getMonth() + H.horizonMonths + 1, 0); // last day
  var opensNextMonth = new Date(nextRelease.getFullYear(), nextRelease.getMonth() + H.horizonMonths, 1);

  var minDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  function put(sel, text) {
    var els = document.querySelectorAll(sel);
    for (var i = 0; i < els.length; i++) els[i].textContent = text;
  }

  var WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven",
    "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen"];
  function word(n) { return WORDS[n] || String(n); }

  put("[data-open-through]", monthName(openThrough) + " " + openThrough.getFullYear());
  put("[data-next-release]", "Noon, " + longDate(nextRelease));
  put("[data-next-month]", monthName(opensNextMonth) + " " + opensNextMonth.getFullYear());
  put("[data-seats]", word(H.seats));
  put("[data-max-party]", word(H.maxParty));
  put("[data-notice-hours]", String(H.noticeHours));
  put("[data-deposit]", String(H.depositPerGuest));
  put("[data-seatings]", H.seatings.join(" and "));

  /* ---------- form ---------- */
  var form = document.querySelector("[data-res-form]");
  var heldEl = document.querySelector("[data-held]");
  if (!form || !heldEl) return;

  var dateInput = form.querySelector("#r-date");
  if (dateInput) {
    dateInput.min = iso(minDate);
    dateInput.max = iso(openThrough);
  }

  var seatSel = form.querySelector("#r-seating");
  if (seatSel) {
    var opts = "";
    for (var i = 0; i < H.seatings.length; i++) {
      opts += '<option value="' + H.seatings[i] + '">' + H.seatings[i] + "</option>";
    }
    seatSel.innerHTML = opts;
  }

  var seatsSel = form.querySelector("#r-seats");
  if (seatsSel) {
    var sopts = "";
    for (var s = 1; s <= H.maxParty; s++) {
      sopts += '<option value="' + s + '"' + (s === 2 ? " selected" : "") + ">" + s + "</option>";
    }
    seatsSel.innerHTML = sopts;
  }

  function fieldOf(input) {
    var el = input;
    while (el && el !== form) {
      if (el.classList && el.classList.contains("field")) return el;
      el = el.parentNode;
    }
    return null;
  }

  function setErr(input, msg) {
    var f = fieldOf(input);
    if (!f) return;
    var e = f.querySelector(".err");
    if (msg) { f.classList.add("invalid"); if (e) e.textContent = msg; }
    else f.classList.remove("invalid");
  }

  function validate() {
    var ok = true;
    var name = form.querySelector("#r-name");
    var email = form.querySelector("#r-email");
    var date = form.querySelector("#r-date");
    var seats = form.querySelector("#r-seats");

    if (!name.value.trim()) { setErr(name, "The counter needs a name to hold."); ok = false; }
    else setErr(name, null);

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.value.trim())) {
      setErr(email, "That address will not reach you; look again."); ok = false;
    } else setErr(email, null);

    var d = date.value ? new Date(date.value + "T21:00") : null;
    if (!d || isNaN(d.getTime())) { setErr(date, "Choose a night."); ok = false; }
    else if (date.value < iso(minDate)) { setErr(date, "That night has already gone out with the tide."); ok = false; }
    else if (date.value > iso(openThrough)) {
      setErr(date, "The counter is not yet open past " + monthName(openThrough) + "."); ok = false;
    } else setErr(date, null);

    var n = parseInt(seats.value, 10);
    if (!(n >= 1 && n <= H.maxParty)) {
      setErr(seats, "The counter takes parties of " + H.maxParty + " at most."); ok = false;
    } else setErr(seats, null);

    return ok;
  }

  function requestCode(d) {
    // NP-<date compact>-<two letters from the name of the tide>
    var t = T ? T.tonight(d) : null;
    var tide = t ? (t.regime === "spring" ? "FL" : "ST") : "NP";
    return "NP-" + d.getTime().toString(36).toUpperCase().slice(-6) + "-" + tide;
  }

  function showHeld(req) {
    form.closest("[data-form-wrap]").hidden = true;
    heldEl.hidden = false;

    var d = new Date(req.date + "T21:00");
    var t = T ? T.tonight(d) : null;
    var moonLine = t
      ? "That night the moon will be " + t.phase + "; " +
        (t.regime === "spring" ? "the Flood menu will be served." : "the Still menu will be served.")
      : "";

    put("[data-held-line]",
      req.seats + (req.seats === 1 ? " seat" : " seats") + " · " + longDate(d) + " · " + req.seating);
    put("[data-held-moon]", moonLine);
    put("[data-held-code]", req.code);
    put("[data-held-name]", req.name);

    if (window.NEAP_UI) window.NEAP_UI.rescanReveals();
  }

  var stored = null;
  try { stored = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { stored = null; }
  if (stored && stored.code) showHeld(stored);

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    if (!validate()) return;
    var req = {
      code: requestCode(new Date(form.querySelector("#r-date").value + "T21:00")),
      name: form.querySelector("#r-name").value.trim(),
      email: form.querySelector("#r-email").value.trim(),
      date: form.querySelector("#r-date").value,
      seating: form.querySelector("#r-seating").value,
      seats: parseInt(form.querySelector("#r-seats").value, 10),
      notes: form.querySelector("#r-notes").value.trim(),
      ts: Date.now()
    };
    try { localStorage.setItem(KEY, JSON.stringify(req)); } catch (e) { /* held for the visit only */ }
    showHeld(req);
  });

  var release = document.querySelector("[data-release]");
  if (release) {
    release.addEventListener("click", function () {
      try { localStorage.removeItem(KEY); } catch (e) { /* nothing held */ }
      heldEl.hidden = true;
      form.closest("[data-form-wrap]").hidden = false;
      form.reset();
    });
  }
})();

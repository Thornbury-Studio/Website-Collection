/* LOAM — visit: the week's hours with today marked, and the note
   customers leave for the counter. */
(function () {
  "use strict";

  var C = window.LOAM, S = window.LOAM_SERVICE;
  if (!C || !S) return;

  var KEY = "loam.note.v1";
  var service = S.state();

  /* ---------- the week ---------- */
  var table = document.querySelector("[data-hours]");
  if (table) {
    var todayIdx = service.now.getDay();
    // Start the list on Monday; Sunday is day 0 but reads last.
    var order = [1, 2, 3, 4, 5, 6, 0];
    var html = "";
    for (var i = 0; i < order.length; i++) {
      var day = order[i];
      var h = S.hoursFor(day);
      var isToday = day === todayIdx;
      html +=
        '<div class="hours-row' + (isToday ? " today" : "") + '">' +
          '<span class="day">' + S.DAY_NAMES[day] +
            (isToday ? ' <span class="today-flag">Today</span>' : "") + "</span>" +
          "<span>" + (h ? S.clock(h.open) + "–" + S.clock(h.close) : "closed") +
            (h ? '<br><span class="hours-kitchen">kitchen ' + S.clock(h.kitchen[0]) + "–" + S.clock(h.kitchen[1]) + "</span>" : "") +
          "</span>" +
        "</div>";
    }
    table.innerHTML = html;
  }

  var seatLine = document.querySelector("[data-seat-line]");
  if (seatLine) {
    seatLine.textContent = C.HOUSE.seats + " seats, and a long window bench that fits more at a squeeze.";
  }

  /* ---------- the note to the counter ---------- */
  var form = document.querySelector("[data-note-form]");
  var thanks = document.querySelector("[data-note-thanks]");
  if (!form || !thanks) return;

  var mood = null;

  var faces = form.querySelectorAll("[data-mood]");
  for (var f = 0; f < faces.length; f++) {
    faces[f].addEventListener("click", function (ev) {
      var btn = ev.currentTarget;
      mood = btn.getAttribute("data-mood");
      for (var j = 0; j < faces.length; j++) {
        faces[j].setAttribute("aria-pressed", faces[j] === btn ? "true" : "false");
      }
      var err = form.querySelector("[data-mood-field]");
      if (err) err.classList.remove("invalid");
    });
  }

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var ok = true;

    var moodField = form.querySelector("[data-mood-field]");
    if (!mood) { moodField.classList.add("invalid"); ok = false; }
    else moodField.classList.remove("invalid");

    var textField = form.querySelector("[data-text-field]");
    var text = form.querySelector("#note-text").value.trim();
    if (text.length < 4) { textField.classList.add("invalid"); ok = false; }
    else textField.classList.remove("invalid");

    if (!ok) return;

    var record = { mood: mood, text: text.slice(0, 600), at: Date.now() };
    try { localStorage.setItem(KEY, JSON.stringify(record)); } catch (e) { /* visit only */ }

    form.hidden = true;
    thanks.hidden = false;
    var line = thanks.querySelector("[data-thanks-line]");
    if (line) {
      line.textContent = mood === "good"
        ? "Glad it landed. We'll tell whoever was on the machine."
        : mood === "fine"
          ? "Noted — and we'd rather know than not."
          : "Sorry. That one goes on the board in the back, and we'll fix it.";
    }
    if (window.LOAM_UI) window.LOAM_UI.toast("Note left. Thank you.");
  });

  var again = document.querySelector("[data-note-again]");
  if (again) {
    again.addEventListener("click", function () {
      try { localStorage.removeItem(KEY); } catch (e) { /* nothing kept */ }
      thanks.hidden = true;
      form.hidden = false;
      form.reset();
      mood = null;
      for (var j = 0; j < faces.length; j++) faces[j].setAttribute("aria-pressed", "false");
    });
  }
})();

/* SEJUK service clock — outlets, hours, open state, pickup slots.
   Everything the site says about time is derived here, never hand-typed. */
(function () {
  "use strict";

  /* Hours per weekday, minutes since midnight, null = closed.
     LAST_SHAVE_MIN: the blade stops taking new chits this long before close. */
  var LAST_SHAVE_MIN = 20;

  var OUTLETS = [
    {
      id: "tiong-bahru",
      name: "Tiong Bahru",
      short: "TB",
      addr: "56 Eng Hoon Street, #01-70",
      postal: "Singapore 160056",
      mrt: "8 min from Tiong Bahru MRT",
      phone: "6220 4141",
      maps: "https://maps.google.com/?q=56+Eng+Hoon+Street+Singapore",
      /* Sun..Sat (Date.getDay order). Closed Mondays. */
      hours: [[720, 1320], null, [720, 1320], [720, 1320], [720, 1320], [720, 1320], [720, 1320]],
      note: "The original room. Eight stools, one blade.",
    },
    {
      id: "joo-chiat",
      name: "Joo Chiat",
      short: "JC",
      addr: "208 Joo Chiat Road",
      postal: "Singapore 427469",
      mrt: "6 min from Marine Parade MRT",
      phone: "6344 5252",
      maps: "https://maps.google.com/?q=208+Joo+Chiat+Road+Singapore",
      hours: [[720, 1350], [720, 1350], [720, 1350], [720, 1350], [720, 1350], [720, 1350], [720, 1350]],
      note: "The east room. More stools, same blade speed.",
    },
  ];

  var DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  function hhmm(mins) {
    var h = Math.floor(mins / 60);
    var m = mins % 60;
    return h + ":" + (m < 10 ? "0" : "") + m;
  }

  function outletById(id) {
    for (var i = 0; i < OUTLETS.length; i++) if (OUTLETS[i].id === id) return OUTLETS[i];
    return null;
  }

  /* Full status for an outlet at a given Date (default now). */
  function status(outlet, at) {
    var now = at || new Date();
    var day = now.getDay();
    var mins = now.getHours() * 60 + now.getMinutes();
    var today = outlet.hours[day];

    if (today && mins >= today[0] && mins < today[1]) {
      var toClose = today[1] - mins;
      var lastChit = today[1] - LAST_SHAVE_MIN;
      return {
        open: true,
        closesAt: hhmm(today[1]),
        minsToClose: toClose,
        takingChits: mins < lastChit,
        lastChitAt: hhmm(lastChit),
        line:
          toClose <= 60
            ? "Open — closes " + hhmm(today[1]) + ", last shave " + hhmm(lastChit)
            : "Open till " + hhmm(today[1]),
      };
    }

    /* Find next opening, walking forward up to a week. */
    for (var d = 0; d < 8; d++) {
      var idx = (day + d) % 7;
      var span = outlet.hours[idx];
      if (!span) continue;
      if (d === 0 && mins >= span[1]) continue;
      var when;
      if (d === 0) when = "today " + hhmm(span[0]);
      else if (d === 1) when = "tomorrow " + hhmm(span[0]);
      else when = DAY_NAMES[idx] + " " + hhmm(span[0]);
      return { open: false, takingChits: false, opensLine: "Opens " + when, line: "Closed — opens " + when };
    }
    return { open: false, takingChits: false, line: "Closed" };
  }

  /* Pickup slots for an outlet: every 10 min from (now + readyMin, rounded up)
     until last shave today. Empty array = no more slots today. */
  function slots(outlet, readyMin, at) {
    var now = at || new Date();
    var day = now.getDay();
    var today = outlet.hours[day];
    if (!today) return [];
    var mins = now.getHours() * 60 + now.getMinutes();
    var earliest = Math.max(mins + readyMin, today[0] + readyMin);
    earliest = Math.ceil(earliest / 10) * 10;
    var last = today[1] - LAST_SHAVE_MIN;
    var out = [];
    for (var t = earliest; t <= last && out.length < 12; t += 10) out.push({ mins: t, label: hhmm(t) });
    return out;
  }

  window.SEJUK = window.SEJUK || {};
  window.SEJUK.service = {
    OUTLETS: OUTLETS,
    LAST_SHAVE_MIN: LAST_SHAVE_MIN,
    DAY_NAMES: DAY_NAMES,
    hhmm: hhmm,
    outletById: outletById,
    status: status,
    slots: slots,
  };
})();

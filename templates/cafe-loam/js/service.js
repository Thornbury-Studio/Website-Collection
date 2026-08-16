/* LOAM — the service clock. Whether the door is open, whether the
   kitchen is on, and when either changes. All computed from HOURS. */
(function () {
  "use strict";

  var C = window.LOAM;
  if (!C) return;

  var DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  function hoursFor(day) {
    for (var i = 0; i < C.HOURS.length; i++) if (C.HOURS[i].day === day) return C.HOURS[i];
    return null;
  }

  // 7.5 -> "7:30", 17 -> "17:00"
  function clock(h) {
    var whole = Math.floor(h);
    var mins = Math.round((h - whole) * 60);
    return whole + ":" + (mins < 10 ? "0" + mins : mins);
  }

  function decimal(date) {
    return date.getHours() + date.getMinutes() / 60;
  }

  function state(now) {
    var d = now || new Date();
    var today = hoursFor(d.getDay());
    var t = decimal(d);
    var open = !!today && t >= today.open && t < today.close;
    var kitchen = open && t >= today.kitchen[0] && t < today.kitchen[1];

    var s = {
      now: d,
      dayName: DAY_NAMES[d.getDay()],
      today: today,
      open: open,
      kitchen: kitchen,
      openAt: today ? clock(today.open) : null,
      closeAt: today ? clock(today.close) : null,
      kitchenFrom: today ? clock(today.kitchen[0]) : null,
      kitchenUntil: today ? clock(today.kitchen[1]) : null
    };

    // Minutes until the next thing that changes.
    if (open) {
      s.minutesToClose = Math.round((today.close - t) * 60);
      s.closingSoon = s.minutesToClose <= 45;
    } else if (today && t < today.open) {
      s.minutesToOpen = Math.round((today.open - t) * 60);
      s.nextOpenLabel = "today at " + clock(today.open);
    } else {
      // Look forward for the next open day.
      for (var i = 1; i <= 7; i++) {
        var nd = new Date(d.getFullYear(), d.getMonth(), d.getDate() + i);
        var nh = hoursFor(nd.getDay());
        if (nh) {
          s.nextOpenLabel = (i === 1 ? "tomorrow" : DAY_NAMES[nd.getDay()]) + " at " + clock(nh.open);
          break;
        }
      }
    }

    if (open && !s.kitchen && today) {
      s.kitchenNext = t < today.kitchen[0]
        ? "The kitchen opens at " + clock(today.kitchen[0]) + "."
        : "The kitchen closed at " + clock(today.kitchen[1]) + " — the counter is still on.";
    }

    // When the kitchen next fires, which is not the same clock as the door.
    if (today && t < today.kitchen[0]) {
      s.nextKitchenLabel = "today at " + clock(today.kitchen[0]);
    } else {
      for (var k = 1; k <= 7; k++) {
        var kd = new Date(d.getFullYear(), d.getMonth(), d.getDate() + k);
        var kh = hoursFor(kd.getDay());
        if (kh) {
          s.nextKitchenLabel = (k === 1 ? "tomorrow" : DAY_NAMES[kd.getDay()]) + " at " + clock(kh.kitchen[0]);
          break;
        }
      }
    }

    return s;
  }

  // One sentence for the header/hero, in the house's voice.
  function headline(s) {
    if (s.open && s.closingSoon) {
      return "Open — last orders in about " + s.minutesToClose + " minutes.";
    }
    if (s.open) return "Open now until " + s.closeAt + ".";
    if (s.minutesToOpen != null && s.minutesToOpen <= 90) {
      return "Not yet — the grinder starts in about " + s.minutesToOpen + " minutes.";
    }
    return "Closed — back " + (s.nextOpenLabel || "soon") + ".";
  }

  function isAvailable(item, s) {
    if (!item.kitchen) return true;
    return s.kitchen;
  }

  function unavailableReason(item, s) {
    if (!item.kitchen || s.kitchen) return "";
    if (!s.open) return "Kitchen back " + (s.nextKitchenLabel || "soon");
    return decimal(s.now) < s.today.kitchen[0]
      ? "From " + s.kitchenFrom
      : "Kitchen closed at " + s.kitchenUntil;
  }

  window.LOAM_SERVICE = {
    DAY_NAMES: DAY_NAMES,
    hoursFor: hoursFor,
    clock: clock,
    state: state,
    headline: headline,
    isAvailable: isAvailable,
    unavailableReason: unavailableReason
  };
})();

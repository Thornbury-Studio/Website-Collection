(function () {
  "use strict";

  var rail = document.getElementById("rail");
  var progress = document.getElementById("progress");
  var panelLabel = document.getElementById("panelLabel");
  var steps = Array.prototype.slice.call(document.querySelectorAll(".step"));
  var navLinks = Array.prototype.slice.call(document.querySelectorAll("[data-nav]"));
  var panels = Array.prototype.slice.call(document.querySelectorAll(".panel"));
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var panelCount = panels.length;
  var current = 0;
  var ticking = false;

  function goTo(index) {
    index = Math.max(0, Math.min(panelCount - 1, index));
    rail.scrollTo({
      left: index * rail.clientWidth,
      behavior: reduceMotion ? "auto" : "smooth"
    });
  }

  function updateParallax() {
    panels.forEach(function (panel, i) {
      var offset = (rail.scrollLeft - i * rail.clientWidth) / Math.max(1, rail.clientWidth);
      panel.querySelectorAll(".layer").forEach(function (layer) {
        if (reduceMotion) {
          layer.style.transform = "";
          return;
        }
        var depth = parseFloat(layer.getAttribute("data-depth") || "0.2");
        layer.style.transform = "translate3d(" + (offset * depth * -56) + "px, 0, 0)";
      });
    });
  }

  function updateChrome() {
    var max = Math.max(0, rail.scrollWidth - rail.clientWidth);
    var ratio = max ? rail.scrollLeft / max : 0;
    current = Math.max(0, Math.min(panelCount - 1, Math.round(rail.scrollLeft / rail.clientWidth)));

    if (progress) progress.style.transform = "scaleX(" + (0.25 + ratio * 0.75) + ")";
    if (panelLabel) panelLabel.textContent = String(current + 1).padStart(2, "0") + " / 0" + panelCount;

    steps.forEach(function (step, i) {
      var on = i === current;
      step.classList.toggle("is-active", on);
      if (on) step.setAttribute("aria-current", "true");
      else step.removeAttribute("aria-current");
    });
    navLinks.forEach(function (link) {
      link.classList.toggle("is-active", parseInt(link.getAttribute("data-nav"), 10) === current);
    });
    updateParallax();
    ticking = false;
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(updateChrome);
    }
  }

  rail.addEventListener(
    "wheel",
    function (e) {
      var scrollBox = e.target.closest && e.target.closest(".panel__scroll");
      if (scrollBox && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        var canScroll = scrollBox.scrollHeight > scrollBox.clientHeight + 1;
        if (canScroll) {
          var atTop = scrollBox.scrollTop <= 0;
          var atBottom = scrollBox.scrollTop + scrollBox.clientHeight >= scrollBox.scrollHeight - 1;
          if ((e.deltaY < 0 && !atTop) || (e.deltaY > 0 && !atBottom)) return;
        }
      }
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        rail.scrollLeft += e.deltaY + e.deltaX;
      }
    },
    { passive: false }
  );

  rail.addEventListener("scroll", onScroll, { passive: true });

  window.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight" || e.key === "PageDown") {
      e.preventDefault();
      goTo(current + 1);
    } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
      e.preventDefault();
      goTo(current - 1);
    } else if (e.key === "Home") {
      e.preventDefault();
      goTo(0);
    } else if (e.key === "End") {
      e.preventDefault();
      goTo(panelCount - 1);
    }
  });

  document.querySelectorAll("[data-go]").forEach(function (el) {
    el.addEventListener("click", function (e) {
      var idx = el.getAttribute("data-go");
      if (idx == null) return;
      e.preventDefault();
      goTo(parseInt(idx, 10));
    });
  });

  window.addEventListener("resize", function () {
    goTo(current);
    updateChrome();
    placeHotspots();
  });

  /* ---------- product viewer ---------- */
  var ANGLES = {
    front: {
      studio: "img/ao-front.jpg",
      detail: "img/ao-detail.jpg",
      alt: "AURIS One front product photograph",
      spots: { latency: [34, 44], band: [64, 40], housing: [50, 70] }
    },
    macro: {
      studio: "img/ao-macro.jpg",
      detail: "img/ao-pad.jpg",
      alt: "Macro earcup and pad",
      spots: { latency: [40, 48], band: [58, 36], housing: [52, 72] }
    },
    side: {
      studio: "img/ao-side.jpg",
      detail: "img/ao-detail.jpg",
      alt: "Side profile of headphones",
      spots: { latency: [42, 50], band: [60, 42], housing: [48, 68] }
    },
    detail: {
      studio: "img/ao-detail.jpg",
      detail: "img/ao-pad.jpg",
      alt: "Control cluster detail",
      spots: { latency: [46, 52], band: [55, 38], housing: [50, 66] }
    },
    studio: {
      studio: "img/ao-studio.jpg",
      detail: "img/ao-detail.jpg",
      alt: "Studio product plate",
      spots: { latency: [36, 46], band: [62, 40], housing: [50, 72] }
    }
  };

  var HOTSPOTS = {
    latency: {
      key: "wireless latency",
      val: "4.2 ms",
      desc: "LC3plus end-to-end path measured at 4.2 ms — tight enough for click tracks and live monitoring."
    },
    band: {
      key: "frequency response",
      val: "5 Hz – 40 kHz",
      desc: "Twelve balanced-armature drivers cover sub-bass through ultrasonic air without EQ boost."
    },
    housing: {
      key: "housing",
      val: "CNC 6061-T6",
      desc: "Aerospace aluminum cups with protein-leather pads. Mass: 312 g."
    }
  };

  var viewerImg = document.getElementById("viewerImg");
  var viewerFrame = document.getElementById("viewerFrame");
  var tilt = document.getElementById("tilt");
  var tiltLabel = tilt && tilt.closest(".tilt-label");
  var lightLabel = document.getElementById("lightLabel");
  var angle = "front";
  var light = "studio";
  var tiltX = -6;
  var dragY = 0;
  var hotspotOpen = false;

  function applyViewer() {
    if (!viewerImg) return;
    var pack = ANGLES[angle] || ANGLES.front;
    viewerImg.src = pack[light] || pack.studio;
    viewerImg.alt = pack.alt;
    viewerImg.classList.toggle("is-detail", light === "detail");
    viewerImg.style.transform =
      "perspective(900px) rotateY(" + tiltX + "deg) rotateX(" + dragY + "deg) scale(1.03)";
    if (lightLabel) lightLabel.textContent = light;
    placeHotspots();
  }

  function placeHotspots() {
    var pack = ANGLES[angle] || ANGLES.front;
    document.querySelectorAll(".hotspot").forEach(function (btn) {
      var id = btn.getAttribute("data-hotspot");
      var xy = pack.spots[id];
      if (!xy) return;
      btn.style.left = xy[0] + "%";
      btn.style.top = xy[1] + "%";
    });
  }

  function setTiltLocked(locked) {
    hotspotOpen = locked;
    if (viewerFrame) viewerFrame.classList.toggle("is-locked", locked);
    if (tiltLabel) tiltLabel.classList.toggle("is-disabled", locked);
    if (tilt) tilt.disabled = locked;
  }

  document.querySelectorAll("[data-angle]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      angle = btn.getAttribute("data-angle");
      document.querySelectorAll("[data-angle]").forEach(function (b) {
        b.classList.toggle("is-active", b === btn);
      });
      closeHotspot();
      applyViewer();
    });
  });

  document.querySelectorAll("[data-light]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      light = btn.getAttribute("data-light");
      document.querySelectorAll("[data-light]").forEach(function (b) {
        b.classList.toggle("is-active", b === btn);
      });
      var orderLight = document.getElementById("orderLight");
      if (orderLight) orderLight.value = light;
      applyViewer();
    });
  });

  if (tilt) {
    tilt.addEventListener("input", function () {
      if (hotspotOpen) return;
      tiltX = parseFloat(tilt.value);
      applyViewer();
    });
  }

  if (viewerFrame) {
    var dragging = false;
    var startX = 0;
    var startY = 0;
    var baseTilt = -6;
    var baseDrag = 0;

    viewerFrame.addEventListener("pointerdown", function (e) {
      if (hotspotOpen || e.target.closest(".hotspot") || e.target.closest(".hotspot-card")) return;
      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      baseTilt = tiltX;
      baseDrag = dragY;
      viewerFrame.setPointerCapture(e.pointerId);
    });
    viewerFrame.addEventListener("pointermove", function (e) {
      if (!dragging || hotspotOpen) return;
      tiltX = Math.max(-24, Math.min(24, baseTilt + (e.clientX - startX) * 0.08));
      dragY = Math.max(-10, Math.min(10, baseDrag - (e.clientY - startY) * 0.04));
      if (tilt) tilt.value = String(Math.round(tiltX));
      applyViewer();
    });
    function endDrag(e) {
      dragging = false;
      try { viewerFrame.releasePointerCapture(e.pointerId); } catch (err) {}
    }
    viewerFrame.addEventListener("pointerup", endDrag);
    viewerFrame.addEventListener("pointercancel", endDrag);
  }

  var card = document.getElementById("hotspotCard");
  var hotspotKey = document.getElementById("hotspotKey");
  var hotspotVal = document.getElementById("hotspotVal");
  var hotspotDesc = document.getElementById("hotspotDesc");
  var hotspotClose = document.getElementById("hotspotClose");

  function closeHotspot() {
    if (card) card.hidden = true;
    document.querySelectorAll(".hotspot").forEach(function (h) {
      h.setAttribute("aria-expanded", "false");
    });
    setTiltLocked(false);
  }

  document.querySelectorAll("[data-hotspot]").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var id = btn.getAttribute("data-hotspot");
      var data = HOTSPOTS[id];
      if (!data || !card) return;
      var open = btn.getAttribute("aria-expanded") === "true";
      closeHotspot();
      if (open) return;
      btn.setAttribute("aria-expanded", "true");
      hotspotKey.textContent = data.key;
      hotspotVal.textContent = data.val;
      hotspotDesc.textContent = data.desc;
      card.hidden = false;
      setTiltLocked(true);
    });
  });
  if (hotspotClose) hotspotClose.addEventListener("click", closeHotspot);
  if (viewerFrame) {
    viewerFrame.addEventListener("click", function (e) {
      if (!e.target.closest(".hotspot") && !e.target.closest(".hotspot-card")) closeHotspot();
    });
  }

  /* ---------- field demo ---------- */
  var fieldToggle = document.getElementById("fieldToggle");
  var fieldStatus = document.getElementById("fieldStatus");
  var fieldMeter = document.getElementById("fieldMeter");
  var audioCtx = null;
  var fieldNodes = null;
  var fieldRaf = null;

  function stopField() {
    if (fieldNodes) {
      try { fieldNodes.osc.stop(); } catch (err) {}
      try { fieldNodes.osc2.stop(); } catch (err) {}
      fieldNodes = null;
    }
    if (fieldRaf) cancelAnimationFrame(fieldRaf);
    if (fieldMeter) fieldMeter.style.transform = "scaleX(0)";
    if (fieldToggle) {
      fieldToggle.setAttribute("aria-pressed", "false");
      fieldToggle.textContent = "play spatial field";
    }
    if (fieldStatus) fieldStatus.textContent = "idle · generated stereo tone (not a music sample)";
  }

  function startField() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) {
      if (fieldStatus) fieldStatus.textContent = "web audio unavailable in this browser";
      return;
    }
    audioCtx = audioCtx || new AC();
    if (audioCtx.state === "suspended") audioCtx.resume();

    var osc = audioCtx.createOscillator();
    var osc2 = audioCtx.createOscillator();
    var gain = audioCtx.createGain();
    var pan = audioCtx.createStereoPanner ? audioCtx.createStereoPanner() : null;
    var filter = audioCtx.createBiquadFilter();

    osc.type = "sine";
    osc.frequency.value = 220;
    osc2.type = "triangle";
    osc2.frequency.value = 330;
    filter.type = "lowpass";
    filter.frequency.value = 1800;
    gain.gain.value = 0.0001;

    osc.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    if (pan) {
      gain.connect(pan);
      pan.connect(audioCtx.destination);
    } else {
      gain.connect(audioCtx.destination);
    }

    var now = audioCtx.currentTime;
    gain.gain.exponentialRampToValueAtTime(0.08, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 4.2);
    osc.frequency.linearRampToValueAtTime(660, now + 2);
    osc.frequency.linearRampToValueAtTime(180, now + 4);
    osc2.frequency.linearRampToValueAtTime(440, now + 4);
    osc.start(now);
    osc2.start(now);
    osc.stop(now + 4.3);
    osc2.stop(now + 4.3);
    fieldNodes = { osc: osc, osc2: osc2, pan: pan, start: performance.now() };

    if (fieldToggle) {
      fieldToggle.setAttribute("aria-pressed", "true");
      fieldToggle.textContent = "stop field";
    }
    if (fieldStatus) fieldStatus.textContent = "playing · generated L/R sweep · 4.2 s";

    function tick() {
      if (!fieldNodes) return;
      var t = (performance.now() - fieldNodes.start) / 4200;
      if (t >= 1) {
        stopField();
        return;
      }
      if (fieldNodes.pan) fieldNodes.pan.pan.value = Math.sin(t * Math.PI * 2) * 0.85;
      if (fieldMeter) fieldMeter.style.transform = "scaleX(" + t + ")";
      fieldRaf = requestAnimationFrame(tick);
    }
    fieldRaf = requestAnimationFrame(tick);
  }

  if (fieldToggle) {
    fieldToggle.addEventListener("click", function () {
      if (fieldToggle.getAttribute("aria-pressed") === "true") stopField();
      else startField();
    });
  }

  /* ---------- specs + order ---------- */
  var copySku = document.getElementById("copySku");
  var copyStatus = document.getElementById("copyStatus");
  if (copySku) {
    copySku.addEventListener("click", function () {
      function done(ok) {
        if (copyStatus) copyStatus.textContent = ok ? "copied AO-01" : "copy failed";
        setTimeout(function () { if (copyStatus) copyStatus.textContent = ""; }, 1800);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText("AO-01").then(function () { done(true); }, function () { done(false); });
      } else done(false);
    });
  }

  document.querySelectorAll("#specSheet tr").forEach(function (row) {
    row.addEventListener("mouseenter", function () { row.classList.add("is-lit"); });
    row.addEventListener("mouseleave", function () { row.classList.remove("is-lit"); });
    row.addEventListener("focus", function () { row.classList.add("is-lit"); });
    row.addEventListener("blur", function () { row.classList.remove("is-lit"); });
  });

  var order = document.getElementById("order");
  var orderStatus = document.getElementById("orderStatus");
  var orderSuccess = document.getElementById("orderSuccess");
  var orderSuccessMsg = document.getElementById("orderSuccessMsg");
  var orderReset = document.getElementById("orderReset");

  if (order) {
    order.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = document.getElementById("orderEmail");
      var qty = document.getElementById("orderQty");
      var lightSel = document.getElementById("orderLight");
      if (!email.checkValidity()) {
        email.reportValidity();
        return;
      }
      var q = Math.max(1, Math.min(4, parseInt(qty.value, 10) || 1));
      qty.value = String(q);
      var total = q * 429;
      var finish = lightSel.value;
      var subject = encodeURIComponent("AURIS AO-01 reserve ×" + q);
      var body = encodeURIComponent(
        "Reserve request\n\nEmail: " + email.value +
        "\nQty: " + q +
        "\nLighting pref: " + finish +
        "\nTotal hold: $" + total +
        "\n\n(Generated from templates.thornburystudio.com/templates/audio-auris/)"
      );
      window.location.href = "mailto:orders@auris.example?subject=" + subject + "&body=" + body;

      order.classList.add("is-ok");
      if (orderSuccess) orderSuccess.hidden = false;
      if (orderSuccessMsg) {
        orderSuccessMsg.textContent =
          q + " × AO-01 · $" + total + " · " + finish + " · " + email.value;
      }
      if (orderStatus) orderStatus.textContent = "mail client opened · reservation also saved on this device";
      try {
        localStorage.setItem(
          "auris-preorder",
          JSON.stringify({ email: email.value, qty: q, light: finish, at: Date.now() })
        );
      } catch (err) {}
    });
  }

  if (orderReset) {
    orderReset.addEventListener("click", function () {
      order.classList.remove("is-ok");
      if (orderSuccess) orderSuccess.hidden = true;
      if (orderStatus) orderStatus.textContent = "opens your mail client with the reserve details · nothing is charged here";
    });
  }

  applyViewer();
  updateChrome();
  rail.focus({ preventScroll: true });
})();

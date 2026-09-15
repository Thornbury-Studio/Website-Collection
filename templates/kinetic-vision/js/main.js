(function () {
  "use strict";

  var navToggle = document.getElementById("navToggle");
  var mobileMenu = document.getElementById("mobileMenu");
  if (navToggle && mobileMenu) {
    navToggle.addEventListener("click", function () {
      var open = navToggle.getAttribute("aria-expanded") === "true";
      navToggle.setAttribute("aria-expanded", String(!open));
      mobileMenu.hidden = open;
    });
    mobileMenu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        mobileMenu.hidden = true;
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* —— 1. Scroll-driven reel —— */
  var STAGES = [
    {
      meta: "On camera",
      title: "Lens-true plates, held still long enough to believe.",
      body: "We start on location and in camera — dense stills and motion that carry specular truth into every generative pass."
    },
    {
      meta: "In volume",
      title: "Volumes grown from sparse views.",
      body: "Spatial reconstruction fills the set between frames — camera moves that feel surveyed, not hallucinated."
    },
    {
      meta: "In the cut",
      title: "A finished cut, graded for the room.",
      body: "Realtime preview loops keep creative decisions in the session. What leaves the studio is already cinema."
    }
  ];

  var reel = document.getElementById("reel");
  var frames = document.querySelectorAll(".reel-frame");
  var dots = document.querySelectorAll(".reel-dot");
  var reelMeta = document.getElementById("reelMeta");
  var reelTitle = document.getElementById("reelTitle");
  var reelBody = document.getElementById("reelBody");
  var currentStage = 0;

  function setStage(index) {
    if (index === currentStage) return;
    currentStage = index;
    frames.forEach(function (frame) {
      frame.classList.toggle("is-active", Number(frame.getAttribute("data-stage")) === index);
    });
    dots.forEach(function (dot) {
      dot.classList.toggle("is-active", Number(dot.getAttribute("data-dot")) === index);
    });
    var stage = STAGES[index];
    if (reelMeta) reelMeta.textContent = stage.meta;
    if (reelTitle) reelTitle.textContent = stage.title;
    if (reelBody) reelBody.textContent = stage.body;
  }

  function updateReel() {
    if (!reel) return;
    var rect = reel.getBoundingClientRect();
    var total = reel.offsetHeight - window.innerHeight;
    if (total <= 0) return;
    var scrolled = Math.min(Math.max(-rect.top, 0), total);
    var t = scrolled / total;
    var index = Math.min(STAGES.length - 1, Math.floor(t * STAGES.length));
    setStage(index);
  }

  var reelRaf = 0;
  function onScroll() {
    if (reelRaf) return;
    reelRaf = requestAnimationFrame(function () {
      reelRaf = 0;
      updateReel();
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", updateReel);
  updateReel();

  /* —— 2. Mode pill + crossfade —— */
  var modeBar = document.querySelector(".mode-bar");
  var modeBtns = document.querySelectorAll(".mode-btn");
  var modePill = document.getElementById("modePill");
  var previewImgs = document.querySelectorAll(".preview-img");
  var previewStatus = document.getElementById("previewStatus");
  var STATUS = {
    video: "Generative video plate",
    spatial: "Spatial volume plate",
    live: "Realtime preview plate"
  };

  function placePill(btn) {
    if (!modePill || !modeBar || !btn) return;
    var barRect = modeBar.getBoundingClientRect();
    var btnRect = btn.getBoundingClientRect();
    var left = btnRect.left - barRect.left;
    modePill.style.width = btnRect.width + "px";
    modePill.style.transform = "translate3d(" + left + "px, 0, 0)";
  }

  function setMode(mode, btn) {
    modeBtns.forEach(function (b) {
      var on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    previewImgs.forEach(function (img) {
      img.classList.toggle("is-active", img.getAttribute("data-mode-img") === mode);
    });
    if (previewStatus) previewStatus.textContent = STATUS[mode] || STATUS.video;
    placePill(btn);
    resetTimeline();
  }

  modeBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      setMode(btn.getAttribute("data-mode"), btn);
    });
  });

  window.addEventListener("resize", function () {
    var active = document.querySelector(".mode-btn.is-active");
    if (active) placePill(active);
  });

  var firstMode = document.querySelector(".mode-btn.is-active");
  if (firstMode) {
    requestAnimationFrame(function () {
      placePill(firstMode);
    });
  }

  /* —— 3. Play + timeline —— */
  var playBtn = document.getElementById("playBtn");
  var timelineFill = document.getElementById("timelineFill");
  var tcIn = document.getElementById("tcIn");
  var playing = false;
  var playStart = 0;
  var playRaf = 0;
  var DURATION = 3200;

  function formatTc(ms) {
    var totalFrames = Math.floor((ms / 1000) * 24);
    var f = totalFrames % 24;
    var totalSec = Math.floor(totalFrames / 24);
    var s = totalSec % 60;
    var m = Math.floor(totalSec / 60) % 60;
    var h = Math.floor(totalSec / 3600);
    function pad(n) {
      return String(n).padStart(2, "0");
    }
    return pad(h) + ":" + pad(m) + ":" + pad(s) + ":" + pad(f);
  }

  function resetTimeline() {
    playing = false;
    if (playRaf) cancelAnimationFrame(playRaf);
    playRaf = 0;
    if (timelineFill) {
      timelineFill.style.width = "0%";
      timelineFill.classList.remove("is-complete");
    }
    if (tcIn) tcIn.textContent = "00:00:00:00";
    if (playBtn) playBtn.classList.remove("is-playing");
  }

  function tick(now) {
    var elapsed = now - playStart;
    var t = Math.min(1, elapsed / DURATION);
    if (timelineFill) timelineFill.style.width = t * 100 + "%";
    if (tcIn) tcIn.textContent = formatTc(elapsed);
    if (t < 1) {
      playRaf = requestAnimationFrame(tick);
    } else {
      playing = false;
      playRaf = 0;
      if (timelineFill) timelineFill.classList.add("is-complete");
      if (playBtn) playBtn.classList.remove("is-playing");
      if (previewStatus) {
        var prev = previewStatus.textContent;
        previewStatus.textContent = "Ready for grade";
        setTimeout(function () {
          if (previewStatus && previewStatus.textContent === "Ready for grade") {
            var active = document.querySelector(".mode-btn.is-active");
            var mode = active ? active.getAttribute("data-mode") : "video";
            previewStatus.textContent = STATUS[mode] || prev;
          }
        }, 1600);
      }
    }
  }

  if (playBtn) {
    playBtn.addEventListener("click", function () {
      if (playing) {
        resetTimeline();
        return;
      }
      playing = true;
      playBtn.classList.add("is-playing");
      if (timelineFill) timelineFill.classList.remove("is-complete");
      playStart = performance.now();
      playRaf = requestAnimationFrame(tick);
    });
  }

  /* —— 4. Hero mute loop —— */
  var heroMedia = document.querySelector(".hero-media");
  var heroVideo = document.querySelector(".hero-video");
  if (heroMedia && heroVideo) {
    function markVideoReady() {
      heroMedia.classList.add("is-video-ready");
    }
    heroVideo.addEventListener("playing", markVideoReady);
    heroVideo.addEventListener("loadeddata", function () {
      var playPromise = heroVideo.play();
      if (playPromise && playPromise.catch) {
        playPromise.catch(function () {
          /* Autoplay blocked — keep poster fallback visible */
        });
      }
    });
    if (heroVideo.readyState >= 2) markVideoReady();
  }
})();

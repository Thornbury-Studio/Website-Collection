/* Splash gate, chrome, drawer, reveals */
(function () {
  const splash = document.getElementById("splash");
  const enterBtn = document.getElementById("splash-enter");
  const burger = document.getElementById("burger");
  const drawer = document.getElementById("drawer");
  const scrim = document.getElementById("scrim");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function enter() {
    if (!splash || splash.classList.contains("is-gone")) return;
    splash.classList.add("is-gone");
    document.body.classList.add("is-live");
    splash.setAttribute("aria-hidden", "true");
    window.setTimeout(() => {
      if (splash.parentNode) splash.remove();
    }, 800);
  }

  if (reduce) enter();
  else {
    enterBtn && enterBtn.addEventListener("click", enter);
    window.addEventListener("keydown", (e) => {
      if (e.code === "Space" || e.key === " ") {
        if (!document.body.classList.contains("is-live")) {
          e.preventDefault();
          enter();
        }
      }
    });
  }

  function closeDrawer() {
    drawer && drawer.classList.remove("is-open");
    burger && burger.setAttribute("aria-expanded", "false");
    if (scrim) scrim.hidden = true;
  }

  function openDrawer() {
    drawer && drawer.classList.add("is-open");
    burger && burger.setAttribute("aria-expanded", "true");
    if (scrim) scrim.hidden = false;
  }

  burger &&
    burger.addEventListener("click", () => {
      if (drawer && drawer.classList.contains("is-open")) closeDrawer();
      else openDrawer();
    });
  scrim && scrim.addEventListener("click", closeDrawer);
  drawer &&
    drawer.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeDrawer));

  // reveals
  const nodes = document.querySelectorAll(".reveal");
  if (reduce) {
    nodes.forEach((n) => n.classList.add("is-in"));
  } else if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );
    nodes.forEach((n) => io.observe(n));
  } else {
    nodes.forEach((n) => n.classList.add("is-in"));
  }

  // pause about video when offscreen
  const vid = document.querySelector(".about-video");
  if (vid && "IntersectionObserver" in window) {
    const vio = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) vid.play().catch(() => {});
          else vid.pause();
        }
      },
      { threshold: 0.2 }
    );
    vio.observe(vid);
  }
})();

/* CINDER — Motion vanilla. Five named effects. */
import { animate, hover, press, inView, scroll } from "https://cdn.jsdelivr.net/npm/motion@12.23.24/+esm";

document.documentElement.classList.add("js");

const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const coarse = window.matchMedia("(hover: none)").matches;

const head = document.getElementById("siteHead");
const nav = document.getElementById("nav");
const toggle = document.getElementById("navToggle");
const stack = document.getElementById("stack");
const inner = document.getElementById("stackInner");
const trayEl = document.getElementById("trayCount");
const toast = document.getElementById("toast");
const toastItem = document.getElementById("toastItem");
const toastCount = document.getElementById("toastCount");

let tray = 0;
let toastTimer = 0;
let tickerFrom = 0;

/* Header blur + mobile nav */

function onScrollChrome() {
  if (!head) return;
  head.classList.toggle("is-scrolled", window.scrollY > 12);
}
onScrollChrome();
window.addEventListener("scroll", onScrollChrome, { passive: true });

if (toggle && nav) {
  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") !== "true";
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    nav.classList.toggle("is-open", open);
    nav.setAttribute("aria-hidden", open ? "false" : "true");
  });
  nav.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => {
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open menu");
      nav.classList.remove("is-open");
    });
  });
}

/* 1 + 2  — 2.5D stack + scroll-linked rotate */

const layers = inner ? [...inner.querySelectorAll(".layer")] : [];
const pointer = { x: 0, y: 0 };
let scrollRx = 0;
let raf = 0;

function paintStack() {
  raf = 0;
  if (!inner) return;
  const rx = pointer.y * -9 + scrollRx;
  const ry = pointer.x * 11;
  inner.style.transform = `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
  layers.forEach((el) => {
    const z = Number(el.dataset.z) || 0;
    const dx = pointer.x * z * 0.22;
    const dy = pointer.y * z * 0.16;
    const extra = el.classList.contains("layer--ghost") ? " scale(1.08)" : "";
    el.style.transform = `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, ${z}px)${extra}`;
  });
}

function requestPaint() {
  if (!raf) raf = requestAnimationFrame(paintStack);
}

if (stack && inner && !reduce) {
  stack.addEventListener("pointermove", (e) => {
    const r = stack.getBoundingClientRect();
    pointer.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
    pointer.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
    requestPaint();
  });
  stack.addEventListener("pointerleave", () => {
    animate(pointer, { x: 0, y: 0 }, {
      type: "spring",
      stiffness: 180,
      damping: 22,
      onUpdate: requestPaint,
    });
  });

  scroll(
    (progress) => {
      scrollRx = progress * 14;
      requestPaint();
    },
    { target: stack, offset: ["start start", "end start"] }
  );
  requestPaint();
}

/* 3 — tilt + glare on menu cards */

if (!reduce && !coarse) {
  document.querySelectorAll("[data-tilt]").forEach((card) => {
    const face = card.querySelector(".card-inner");
    if (!face) return;
    hover(card, () => {
      card.classList.add("is-lit");
      const move = (e) => {
        const r = card.getBoundingClientRect();
        const px = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
        const py = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
        card.style.setProperty("--px", (px * 100).toFixed(1) + "%");
        card.style.setProperty("--py", (py * 100).toFixed(1) + "%");
        animate(
          face,
          {
            transformPerspective: 800,
            rotateX: (0.5 - py) * 10,
            rotateY: (px - 0.5) * 12,
            z: 12,
          },
          { duration: 0.28 }
        );
      };
      card.addEventListener("pointermove", move);
      return () => {
        card.removeEventListener("pointermove", move);
        card.classList.remove("is-lit");
        animate(face, { rotateX: 0, rotateY: 0, z: 0 }, { type: "spring", visualDuration: 0.45, bounce: 0.12 });
      };
    });
  });
}

/* 4 — magnetic hero CTA */

const cta = document.getElementById("heroCta");
if (cta && !reduce && !coarse) {
  hover(cta, () => {
    const move = (e) => {
      const r = cta.getBoundingClientRect();
      const x = e.clientX - (r.left + r.width / 2);
      const y = e.clientY - (r.top + r.height / 2);
      animate(cta, { x: x * 0.28, y: y * 0.28 }, { type: "spring", stiffness: 280, damping: 18 });
    };
    window.addEventListener("pointermove", move);
    return () => {
      window.removeEventListener("pointermove", move);
      animate(cta, { x: 0, y: 0 }, { type: "spring", stiffness: 260, damping: 16 });
    };
  });
}

/* 5 — press spring + ticker toast */

press(".btn", (el) => {
  animate(el, { scale: 0.97 }, { type: "spring", visualDuration: 0.2, bounce: 0 });
  return () => animate(el, { scale: 1 }, { type: "spring", visualDuration: 0.35, bounce: 0.18 });
});

function tickCount(el, from, to) {
  el.textContent = String(to);
  if (Math.abs(to - from) <= 1) return;
  const start = performance.now();
  const dur = 420;
  function frame(now) {
    const t = Math.min(1, (now - start) / dur);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = String(Math.round(from + (to - from) * eased));
    if (t < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

function showToast(name) {
  if (!toast) return;
  toast.hidden = false;
  toastItem.textContent = name;
  toast.classList.add("is-on");
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.classList.remove("is-on");
  }, 2200);
}

document.querySelectorAll(".add-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const card = btn.closest("[data-item]");
    const name = card ? card.getAttribute("data-item") : "Item";
    tickerFrom = tray;
    tray += 1;
    tickCount(trayEl, tickerFrom, tray);
    tickCount(toastCount, tickerFrom, tray);
    showToast(name);
  });
});

/* Supporting — inView stagger */

if (!reduce) {
  const items = [...document.querySelectorAll(".reveal")];
  items.forEach((el, i) => {
    el.style.transitionDelay = Math.min(i % 4, 3) * 70 + "ms";
  });
  inView(".reveal", (el) => {
    el.classList.add("is-in");
  }, { amount: 0.2 });
} else {
  document.querySelectorAll(".reveal").forEach((el) => el.classList.add("is-in"));
}

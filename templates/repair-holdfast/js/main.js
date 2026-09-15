/* HOLDFAST triage engine */

const PROBLEMS = [
  {
    id: "water",
    title: "Water where it shouldn’t be",
    hint: "Leak, burst, slow drain, heater",
    zone: "plumbing",
    details: [
      {
        id: "spray",
        title: "Actively spraying or flooding",
        urgency: "emergency",
        trade: "Plumbing",
        low: 180,
        high: 450,
        window: "Under 90 minutes",
        now: "Shut the main valve if you can reach it safely. Keep clear of electrics.",
        do: ["Open the lowest taps to relieve pressure", "Move furniture and rugs", "Photograph the source if safe"]
      },
      {
        id: "drip",
        title: "Steady drip or wet ceiling",
        urgency: "same-day",
        trade: "Plumbing",
        low: 120,
        high: 320,
        window: "2–4 hours",
        now: "Catch water in a basin. Avoid drilling into the wet patch.",
        do: ["Note which fixture was last used", "Check the unit above if you’re in a flat", "Keep the area ventilated"]
      },
      {
        id: "slow",
        title: "Slow drain or noisy pipes",
        urgency: "scheduled",
        trade: "Plumbing",
        low: 90,
        high: 220,
        window: "Next open slot",
        now: "Stop using chemical unblockers until we inspect.",
        do: ["Try a plunger once", "List every affected fixture", "Clear access under the sink"]
      }
    ]
  },
  {
    id: "power",
    title: "Power or sparks",
    hint: "Trip, dead socket, burning smell",
    zone: "electrical",
    details: [
      {
        id: "burn",
        title: "Burning smell, smoke, or sparking",
        urgency: "emergency",
        trade: "Electrical",
        low: 200,
        high: 520,
        window: "Under 90 minutes",
        now: "Kill the main breaker if you can do it safely. Leave the premises if smoke continues.",
        do: ["Do not reset repeatedly", "Unplug nearby appliances", "Call if anyone feels shock symptoms"]
      },
      {
        id: "partial",
        title: "Part of the home is dark",
        urgency: "same-day",
        trade: "Electrical",
        low: 130,
        high: 360,
        window: "2–5 hours",
        now: "Check the DB for a flipped breaker once. Leave it off if it trips again.",
        do: ["List dead circuits", "Note recent renovations or new loads", "Keep fridge closed if affected"]
      },
      {
        id: "outlet",
        title: "One outlet or light failed",
        urgency: "scheduled",
        trade: "Electrical",
        low: 80,
        high: 200,
        window: "Next open slot",
        now: "Stop using that point. Swap the bulb only if the fitting is cool and dry.",
        do: ["Try another known-good device", "Photograph the outlet face", "Keep children away from the point"]
      }
    ]
  },
  {
    id: "cool",
    title: "Air-con or heat pump",
    hint: "No cool air, water from indoor unit",
    zone: "hvac",
    details: [
      {
        id: "flood-ac",
        title: "Indoor unit leaking onto electrics",
        urgency: "emergency",
        trade: "HVAC",
        low: 160,
        high: 380,
        window: "Under 2 hours",
        now: "Power off the indoor unit at the isolator. Catch water.",
        do: ["Protect flooring", "Do not tilt the unit yourself", "Note error codes on the display"]
      },
      {
        id: "dead-ac",
        title: "No cooling in an occupied home",
        urgency: "same-day",
        trade: "HVAC",
        low: 120,
        high: 340,
        window: "3–6 hours",
        now: "Clean or replace the filter. Keep curtains drawn on the sunny side.",
        do: ["Check outdoor unit clearance", "Listen for fan or compressor noise", "List every indoor unit affected"]
      },
      {
        id: "noise-ac",
        title: "Noise, odour, or weak airflow",
        urgency: "scheduled",
        trade: "HVAC",
        low: 90,
        high: 260,
        window: "Next open slot",
        now: "Run a short self-clean cycle if your unit has one. Avoid DIY refrigerant work.",
        do: ["Note when the noise started", "Share brand and model", "Keep pets away from the outdoor unit"]
      }
    ]
  },
  {
    id: "build",
    title: "Door, lock, or building fabric",
    hint: "Won’t secure, ceiling stain, loose fitting",
    zone: "structure",
    details: [
      {
        id: "insecure",
        title: "Cannot secure the home",
        urgency: "emergency",
        trade: "Structure",
        low: 140,
        high: 400,
        window: "Under 2 hours",
        now: "Stay with the opening if safe. Use a secondary lock or furniture brace temporarily.",
        do: ["Do not force a jammed cylinder", "Keep valuables in sight", "Note any signs of forced entry"]
      },
      {
        id: "stain",
        title: "Ceiling stain or soft patch",
        urgency: "same-day",
        trade: "Structure",
        low: 110,
        high: 300,
        window: "3–6 hours",
        now: "Treat it as a possible hidden leak. Avoid loading the patch.",
        do: ["Photograph growth of the stain", "Check wet walls above", "Move beds and desks clear"]
      },
      {
        id: "fixture",
        title: "Loose rail, hinge, or fitting",
        urgency: "scheduled",
        trade: "Structure",
        low: 70,
        high: 180,
        window: "Next open slot",
        now: "Stop using the fitting. A temporary prop is fine if stable.",
        do: ["Keep screws you removed", "Measure the opening", "Flag if it’s load-bearing adjacent"]
      }
    ]
  }
];

const PLACES = [
  { id: "kitchen", title: "Kitchen" },
  { id: "bath", title: "Bathroom" },
  { id: "living", title: "Living / bedroom" },
  { id: "service", title: "Service yard / DB" },
  { id: "outdoor", title: "Outdoor / corridor" },
  { id: "whole", title: "Whole home" }
];

const state = {
  step: 1,
  problem: null,
  detail: null,
  place: null
};

const el = {
  bar: document.getElementById("triageBar"),
  stepLabel: document.getElementById("triageStepLabel"),
  step1: document.getElementById("step1"),
  step2: document.getElementById("step2"),
  step3: document.getElementById("step3"),
  result: document.getElementById("stepResult"),
  problems: document.getElementById("problemChoices"),
  details: document.getElementById("detailChoices"),
  places: document.getElementById("placeChoices"),
  detailQ: document.getElementById("detailQuestion"),
  code: document.getElementById("resultCode"),
  urgency: document.getElementById("resultUrgency"),
  fill: document.getElementById("resultFill"),
  trade: document.getElementById("resultTrade"),
  price: document.getElementById("resultPrice"),
  window: document.getElementById("resultWindow"),
  now: document.getElementById("resultNow"),
  dos: document.getElementById("resultDo"),
  bookCode: document.getElementById("bookCode"),
  burger: document.getElementById("burger"),
  drawer: document.getElementById("drawer"),
  form: document.getElementById("bookForm"),
  formMsg: document.getElementById("formMsg")
};

function money(n) {
  return `S$${n.toLocaleString("en-SG")}`;
}

function dispatchCode(detail, place) {
  const u = detail.urgency === "emergency" ? "E" : detail.urgency === "same-day" ? "S" : "P";
  const t = detail.trade.slice(0, 2).toUpperCase();
  const p = (place?.id || "xx").slice(0, 2).toUpperCase();
  const n = String(Math.abs(hash(`${detail.id}-${place?.id}`)) % 900 + 100);
  return `HF-${u}${t}${p}-${n}`;
}

function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h << 5) - h + str.charCodeAt(i);
  return h | 0;
}

function setStep(n) {
  state.step = n;
  const showResult = n === 4;
  el.step1.hidden = n !== 1;
  el.step2.hidden = n !== 2;
  el.step3.hidden = n !== 3;
  el.result.hidden = !showResult;
  el.bar.style.width = `${Math.min(n, 3) * 33.34}%`;
  el.stepLabel.textContent = showResult ? "Dispatch ready" : `Step ${n} of 3`;
}

function choiceButton(item, onPick) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "choice";
  btn.setAttribute("role", "option");
  btn.innerHTML = `<span class="choice__title">${item.title}</span>${
    item.hint ? `<span class="choice__hint">${item.hint}</span>` : ""
  }`;
  btn.addEventListener("click", () => onPick(item, btn));
  return btn;
}

function renderProblems() {
  el.problems.innerHTML = "";
  PROBLEMS.forEach((p) => {
    el.problems.appendChild(
      choiceButton(p, (item) => {
        state.problem = item;
        state.detail = null;
        renderDetails();
        setStep(2);
        highlightZone(item.zone);
      })
    );
  });
}

function renderDetails() {
  el.details.innerHTML = "";
  el.detailQ.textContent = `How bad is the ${state.problem.title.toLowerCase()}?`;
  state.problem.details.forEach((d) => {
    el.details.appendChild(
      choiceButton(d, (item) => {
        state.detail = item;
        setStep(3);
      })
    );
  });
}

function renderPlaces() {
  el.places.innerHTML = "";
  PLACES.forEach((p) => {
    el.places.appendChild(
      choiceButton(p, (item) => {
        state.place = item;
        showResult();
      })
    );
  });
}

function showResult() {
  const d = state.detail;
  const code = dispatchCode(d, state.place);
  const level = d.urgency;
  const label =
    level === "emergency" ? "Emergency" : level === "same-day" ? "Same-day" : "Scheduled";

  el.code.textContent = code;
  el.urgency.textContent = label;
  el.urgency.dataset.level = level;
  el.fill.dataset.level = level;
  el.trade.textContent = d.trade;
  el.price.textContent = `${money(d.low)}–${money(d.high)}`;
  el.window.textContent = d.window;
  el.now.textContent = d.now;
  el.dos.innerHTML = d.do.map((line) => `<li>${line}</li>`).join("");
  if (el.bookCode) el.bookCode.value = code;

  setStep(4);
  requestAnimationFrame(() => {
    const widths = { emergency: "92%", "same-day": "64%", scheduled: "34%" };
    el.fill.style.width = widths[level] || "50%";
  });
}

function resetTriage() {
  state.problem = null;
  state.detail = null;
  state.place = null;
  el.fill.style.width = "0";
  if (el.bookCode) el.bookCode.value = "";
  document.querySelectorAll(".zone").forEach((z) => z.classList.remove("is-hot"));
  setStep(1);
}

function highlightZone(zone) {
  document.querySelectorAll(".zone").forEach((z) => {
    z.classList.toggle("is-hot", z.dataset.zone === zone);
  });
}

function jumpFromHouse(zone) {
  const match = PROBLEMS.find((p) => p.zone === zone);
  if (!match) return;
  state.problem = match;
  state.detail = null;
  highlightZone(zone);
  renderDetails();
  setStep(2);
  document.getElementById("triage")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* nav */
el.burger?.addEventListener("click", () => {
  const open = el.drawer.hasAttribute("hidden");
  if (open) el.drawer.removeAttribute("hidden");
  else el.drawer.setAttribute("hidden", "");
  el.burger.setAttribute("aria-expanded", String(open));
});

el.drawer?.querySelectorAll("a").forEach((a) => {
  a.addEventListener("click", () => {
    el.drawer.setAttribute("hidden", "");
    el.burger?.setAttribute("aria-expanded", "false");
  });
});

document.querySelectorAll("[data-back]").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (state.step === 3) setStep(2);
    else if (state.step === 2) setStep(1);
  });
});

document.getElementById("triageReset")?.addEventListener("click", resetTriage);

document.querySelectorAll(".zone").forEach((zone) => {
  zone.addEventListener("click", () => jumpFromHouse(zone.dataset.zone));
  zone.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      jumpFromHouse(zone.dataset.zone);
    }
  });
  zone.setAttribute("tabindex", "0");
  zone.setAttribute("role", "button");
});

el.form?.addEventListener("submit", (e) => {
  e.preventDefault();
  const data = new FormData(el.form);
  if (![...data.values()].slice(0, 3).every(Boolean)) {
    el.formMsg.hidden = false;
    el.formMsg.textContent = "Name, mobile, and postal code are required.";
    el.formMsg.style.color = "var(--danger)";
    return;
  }
  el.formMsg.hidden = false;
  el.formMsg.style.color = "var(--ok)";
  const code = data.get("code") || "pending triage";
  el.formMsg.textContent = `Request logged for ${data.get("postal")} · ${code}. We’ll SMS ETA shortly.`;
  el.form.reset();
  if (el.bookCode && code !== "pending triage") el.bookCode.value = String(code);
});

renderProblems();
renderPlaces();
setStep(1);

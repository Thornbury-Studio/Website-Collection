/* holdfast — aircon servicing conversion kit */

const COMPANY = {
  name: "Holdfast Aircon",
  whatsapp: "6561234500"
};

const ICONS = {
  drip: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3c-2.8 4-4.8 6.6-4.8 9a4.8 4.8 0 0 0 9.6 0c0-2.4-2-5-4.8-9Z"/></svg>',
  "dead-ac": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 10h16v5H4zM8 15v3M16 15v3M7 10V8a5 5 0 0 1 10 0v2"/></svg>',
  odor: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M8 16c0-4 2-7 4-10 2 3 4 6 4 10M4 20h16"/></svg>',
  "noise-ac": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 10v4M8 8v8M12 6v12M16 8v8M20 10v4"/></svg>',
  cool: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3v18M5.5 6.5 12 12l6.5-5.5M5.5 17.5 12 12l6.5 5.5"/><circle cx="12" cy="12" r="2.2"/></svg>',
  place: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10Z"/><circle cx="12" cy="11" r="2.2"/></svg>',
  units: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="4" width="7" height="7"/><rect x="13" y="4" width="7" height="7"/><rect x="4" y="13" width="7" height="7"/><rect x="13" y="13" width="7" height="7"/></svg>'
};

const SYMPTOMS = [
  {
    id: "leak",
    code: "S1",
    title: "Water leaking / dripping",
    hint: "漏水 / 滴水",
    icon: "drip",
    urgency: "emergency",
    service: "Chemical flush + drain line clear",
    low: 90,
    high: 280,
    window: "< 4 hr",
    now: "Power off the affected unit. Place a towel under the indoor unit.",
    do: ["Note if leak is steady or only when AC runs", "Photo the drip point", "Clear floor items under the unit"]
  },
  {
    id: "warm",
    code: "S2",
    title: "Blowing warm air / not cold",
    hint: "吹热风 / 不冷",
    icon: "dead-ac",
    urgency: "same-day",
    service: "Diagnostic + gas top-up or chemical wash",
    low: 70,
    high: 350,
    window: "same day",
    now: "Check Cool mode and filter. Stop if the compressor sounds strained.",
    do: ["Set thermostat to 22°C for test", "Check outdoor fan is spinning", "Note brand if visible"]
  },
  {
    id: "odor",
    code: "S3",
    title: "Bad odor / musty smell",
    hint: "异味 / 霉味",
    icon: "odor",
    urgency: "scheduled",
    service: "Chemical wash + anti-microbial treatment",
    low: 60,
    high: 180,
    window: "next slot",
    now: "Avoid masking sprays. Keep the room ventilated until the visit.",
    do: ["Note if smell starts when cooling begins", "Check vents for mould", "Keep windows open until visit"]
  },
  {
    id: "noise",
    code: "S4",
    title: "Loud noise / vibration",
    hint: "异响 / 震动",
    icon: "noise-ac",
    urgency: "scheduled",
    service: "Fan coil inspection + mounting check",
    low: 65,
    high: 220,
    window: "next slot",
    now: "Stop the loudest unit if rattling worsens. Do not open the cover yourself.",
    do: ["Record a short video of the noise", "Note indoor vs outdoor source", "Check if the wall bracket feels loose"]
  },
  {
    id: "routine",
    code: "S5",
    title: "Routine servicing",
    hint: "常规定期清洗",
    icon: "cool",
    urgency: "scheduled",
    service: "General aircon service (per unit)",
    low: 35,
    high: 90,
    window: "flexible",
    now: "Clear space in front of each indoor unit for access.",
    do: ["Count units accurately", "Share last service date if known", "Ask about quarterly contract if interested"]
  }
];

const PROPERTIES = [
  { id: "hdb", code: "HDB", title: "HDB", hint: "Flat", icon: "place" },
  { id: "condo", code: "CD", title: "Condo", hint: "Private estate", icon: "place" },
  { id: "landed", code: "LD", title: "Landed", hint: "Terrace / semi / bungalow", icon: "place" }
];

const UNITS = [
  { id: "12", code: "U1", title: "1–2 units", hint: "Single or dual split", icon: "units" },
  { id: "34", code: "U2", title: "3–4 units", hint: "Typical whole flat", icon: "units" },
  { id: "whole", code: "U3", title: "Whole system", hint: "All indoor + outdoor", icon: "units" }
];

const state = { step: 1, symptom: null, property: null, units: null, photoName: null, photoUrl: null };

const el = {
  bar: document.getElementById("triageBar"),
  stepLabel: document.getElementById("triageStepLabel"),
  step1: document.getElementById("step1"),
  step2: document.getElementById("step2"),
  result: document.getElementById("stepResult"),
  problems: document.getElementById("problemChoices"),
  properties: document.getElementById("propertyChoices"),
  units: document.getElementById("unitChoices"),
  step2Continue: document.getElementById("step2Continue"),
  code: document.getElementById("resultCode"),
  urgency: document.getElementById("resultUrgency"),
  fill: document.getElementById("resultFill"),
  service: document.getElementById("resultService"),
  price: document.getElementById("resultPrice"),
  window: document.getElementById("resultWindow"),
  now: document.getElementById("resultNow"),
  dos: document.getElementById("resultDo"),
  stamp: document.getElementById("resultStamp"),
  waPreview: document.getElementById("waPreview"),
  waLink: document.getElementById("waDispatch"),
  bookCode: document.getElementById("bookCode"),
  burger: document.getElementById("burger"),
  drawer: document.getElementById("drawer"),
  form: document.getElementById("bookForm"),
  formMsg: document.getElementById("formMsg"),
  heroVisual: document.getElementById("heroVisual"),
  heroGlow: document.getElementById("heroGlow"),
  heroImg: document.querySelector(".hero__media img"),
  photoInput: document.getElementById("photoInput"),
  photoPreview: document.getElementById("photoPreview"),
  photoThumb: document.getElementById("photoThumb"),
  photoClear: document.getElementById("photoClear"),
  waFab: document.getElementById("waFab")
};

function money(n) {
  return `S$${n.toLocaleString("en-SG")}`;
}

function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h << 5) - h + str.charCodeAt(i);
  return h | 0;
}

function dispatchCode(symptom, property, units) {
  const u = symptom.urgency === "emergency" ? "E" : symptom.urgency === "same-day" ? "S" : "P";
  const n = String(Math.abs(hash(`${symptom.id}-${property.id}-${units.id}`)) % 900 + 100);
  return `AC-${u}${property.code}${units.code}-${n}`;
}

function urgencyLabel(level) {
  if (level === "emergency") return "urgent";
  if (level === "same-day") return "same-day";
  return "scheduled";
}

function symptomShort(symptom) {
  const map = {
    leak: "Leaking Water",
    warm: "Not Cold",
    odor: "Bad Odor",
    noise: "Loud Noise",
    routine: "Routine Servicing"
  };
  return map[symptom.id] || symptom.title;
}

function unitsCountPhrase(units) {
  if (units.id === "12") return "1–2x";
  if (units.id === "34") return "3–4x";
  return "whole-home";
}

function buildWhatsAppMessage(symptom, property, units) {
  const urgent = symptom.urgency === "emergency" ? "urgent" : urgencyLabel(symptom.urgency);
  const photoLine = state.photoName
    ? `Photo ready to attach: ${state.photoName}.`
    : "Photo attached below.";
  return (
    `Hi ${COMPANY.name}, I diagnosed my issue on HOLDFAST: ${unitsCountPhrase(units)} ${property.title} Units, ${symptomShort(symptom)} (${urgent}). ` +
    `${photoLine} Please confirm quote and earliest slot.`
  );
}

function refreshWhatsAppLinks() {
  if (!state.symptom || !state.property || !state.units) {
    const defaultText = `Hi ${COMPANY.name}, I'd like to book aircon service.`;
    if (el.waFab) el.waFab.href = whatsAppUrl(defaultText);
    return;
  }
  const waText = buildWhatsAppMessage(state.symptom, state.property, state.units);
  if (el.waPreview) el.waPreview.textContent = waText;
  if (el.waLink) {
    el.waLink.href = whatsAppUrl(waText);
    el.waLink.setAttribute("aria-label", `WhatsApp ${COMPANY.name}`);
  }
  if (el.waFab) el.waFab.href = whatsAppUrl(waText);
}

function clearPhoto() {
  if (state.photoUrl) URL.revokeObjectURL(state.photoUrl);
  state.photoName = null;
  state.photoUrl = null;
  if (el.photoInput) el.photoInput.value = "";
  if (el.photoPreview) el.photoPreview.hidden = true;
  if (el.photoThumb) el.photoThumb.removeAttribute("src");
  refreshWhatsAppLinks();
}

function whatsAppUrl(text) {
  return `https://wa.me/${COMPANY.whatsapp}?text=${encodeURIComponent(text)}`;
}

function iconFor(item) {
  return ICONS[item.icon] || ICONS.place;
}

function setStep(n) {
  state.step = n;
  const showResult = n === 3;
  el.step1.hidden = n !== 1;
  el.step2.hidden = n !== 2;
  el.result.hidden = !showResult;
  el.bar.style.width = `${Math.min(n, 3) * 33.34}%`;
  el.stepLabel.textContent = showResult ? "Ready" : `${n} / 3`;
}

function choiceButton(item, onPick, group) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "choice";
  btn.dataset.group = group || "";
  btn.setAttribute("role", "option");
  btn.innerHTML = `
    <span class="choice__icon" aria-hidden="true">${iconFor(item)}</span>
    <span class="choice__body">
      <span class="choice__title">${item.title}</span>
      ${item.hint ? `<span class="choice__hint">${item.hint}</span>` : ""}
    </span>`;
  btn.addEventListener("click", () => onPick(item, btn));
  return btn;
}

function updateStep2Continue() {
  if (!el.step2Continue) return;
  el.step2Continue.disabled = !(state.property && state.units);
}

function renderSymptoms() {
  el.problems.innerHTML = "";
  SYMPTOMS.forEach((s) => {
    el.problems.appendChild(
      choiceButton(s, (item) => {
        state.symptom = item;
        state.property = null;
        state.units = null;
        clearGroupSelection("property");
        clearGroupSelection("units");
        setStep(2);
        updateStep2Continue();
      })
    );
  });
}

function renderPropertyUnits() {
  el.properties.innerHTML = "";
  PROPERTIES.forEach((p) => {
    el.properties.appendChild(
      choiceButton(p, (item, btn) => {
        state.property = item;
        document.querySelectorAll('[data-group="property"]').forEach((b) => b.classList.remove("is-selected"));
        btn.classList.add("is-selected");
        updateStep2Continue();
      }, "property")
    );
  });

  el.units.innerHTML = "";
  UNITS.forEach((u) => {
    el.units.appendChild(
      choiceButton(u, (item, btn) => {
        state.units = item;
        document.querySelectorAll('[data-group="units"]').forEach((b) => b.classList.remove("is-selected"));
        btn.classList.add("is-selected");
        updateStep2Continue();
      }, "units")
    );
  });
}

function clearGroupSelection(group) {
  document.querySelectorAll(`[data-group="${group}"]`).forEach((b) => b.classList.remove("is-selected"));
}

function showResult() {
  const s = state.symptom;
  const p = state.property;
  const u = state.units;
  if (!s || !p || !u) return;

  const code = dispatchCode(s, p, u);
  const level = s.urgency;
  const label = urgencyLabel(level);

  el.code.textContent = code;
  el.urgency.textContent = label;
  el.urgency.dataset.level = level;
  if (el.stamp) {
    el.stamp.textContent = label;
    el.stamp.dataset.level = level;
  }
  el.fill.dataset.level = level;
  el.service.textContent = s.service;
  el.price.textContent = `${money(s.low)}–${money(s.high)} per unit`;
  el.window.textContent = s.window;
  el.now.textContent = s.now;
  el.dos.innerHTML = s.do.map((line) => `<li>${line}</li>`).join("");
  if (el.bookCode) el.bookCode.value = code;
  refreshWhatsAppLinks();

  setStep(3);
  requestAnimationFrame(() => {
    const widths = { emergency: "92%", "same-day": "64%", scheduled: "34%" };
    el.fill.style.width = widths[level] || "50%";
  });
}

function resetTriage() {
  state.symptom = null;
  state.property = null;
  state.units = null;
  clearPhoto();
  el.fill.style.width = "0";
  if (el.bookCode) el.bookCode.value = "";
  clearGroupSelection("property");
  clearGroupSelection("units");
  updateStep2Continue();
  setStep(1);
}

function onHeroScroll() {
  if (!el.heroImg || !el.heroVisual) return;
  const rect = el.heroVisual.getBoundingClientRect();
  const view = Math.max(window.innerHeight, 1);
  const progress = Math.min(1, Math.max(0, 1 - rect.bottom / (view + rect.height * 0.35)));
  const scale = 1.04 + progress * 0.1;
  const y = progress * 6;
  el.heroImg.style.transform = `scale(${scale}) translate3d(0, ${y}%, 0)`;
}

if (el.heroVisual && el.heroGlow) {
  el.heroVisual.addEventListener("pointermove", (e) => {
    const rect = el.heroVisual.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    el.heroGlow.style.setProperty("--mx", `${x}%`);
    el.heroGlow.style.setProperty("--my", `${y}%`);
  });
}

window.addEventListener("scroll", onHeroScroll, { passive: true });
onHeroScroll();

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
    if (state.step === 2) setStep(1);
    else if (state.step === 3) setStep(2);
  });
});

el.step2Continue?.addEventListener("click", () => {
  if (state.property && state.units) showResult();
});

document.getElementById("triageReset")?.addEventListener("click", resetTriage);

el.photoInput?.addEventListener("change", () => {
  const file = el.photoInput.files?.[0];
  if (!file) {
    clearPhoto();
    return;
  }
  if (state.photoUrl) URL.revokeObjectURL(state.photoUrl);
  state.photoName = file.name;
  state.photoUrl = URL.createObjectURL(file);
  if (el.photoThumb) el.photoThumb.src = state.photoUrl;
  if (el.photoPreview) el.photoPreview.hidden = false;
  refreshWhatsAppLinks();
});

el.photoClear?.addEventListener("click", clearPhoto);

el.form?.addEventListener("submit", (e) => {
  e.preventDefault();
  const data = new FormData(el.form);
  if (![...data.values()].slice(0, 3).every(Boolean)) {
    el.formMsg.hidden = false;
    el.formMsg.textContent = "Name, mobile, and postal are required.";
    el.formMsg.style.color = "var(--danger)";
    return;
  }
  el.formMsg.hidden = false;
  el.formMsg.style.color = "var(--ok)";
  const code = data.get("code") || "pending";
  el.formMsg.textContent = `Request logged for ${data.get("postal")} · ${code}.`;
  el.form.reset();
  if (el.bookCode && code !== "pending") el.bookCode.value = String(code);
});

refreshWhatsAppLinks();
renderSymptoms();
renderPropertyUnits();
setStep(1);

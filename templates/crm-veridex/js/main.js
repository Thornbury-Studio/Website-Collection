/* VERIDEX — interactions */

(function () {
  "use strict";

  const seats = {
    marketing: {
      pain: "Campaigns go out to a list that's quietly rotting. Bounces, dead numbers, the same household hit three times. You're paying for reach you don't actually have.",
      fixes: ["Email append", "Phone append", "Deduplication", "NCOA"],
      outcome: "Stop marketing to ghosts. Every campaign reaches more of the customers you already own — for the same spend."
    },
    crm: {
      pain: "Duplicates multiply, formats never match across systems, and every report is subtly wrong. You're the one who answers for numbers that don't reconcile.",
      fixes: ["Deduplication & householding", "USPS standardization", "Continuous cadence"],
      outcome: "One clean source of truth that stays clean — and reports that finally reconcile."
    },
    ops: {
      pain: "Someone on your team spends hours every week scrubbing lists by hand. It's slow, inconsistent, and it never actually ends.",
      fixes: ["Deduplication", "USPS standardization"],
      outcome: "Reclaim the hours spent on manual cleanup and let the process run itself."
    },
    exec: {
      pain: "You're making decisions — and increasingly betting on AI — off data you can't fully trust. Every report starts with a database nobody's confident in.",
      fixes: ["Full enrichment suite", "Continuous cadence"],
      outcome: "A trusted foundation under every report and every AI initiative you plan."
    },
    fixed: {
      pain: "Service reminders miss because the customer moved, changed numbers, or shows up twice. Your most loyal revenue slips through the cracks.",
      fixes: ["NCOA / moved", "Phone append", "USPS standardization"],
      outcome: "Service reminders that actually arrive — so retention revenue doesn't leak out the door."
    },
    bdc: {
      pain: "Your team burns hours dialing dead numbers, leaving voicemails on landlines, and risking DNC violations — all because contact data is stale.",
      fixes: ["Email append", "Phone append", "Deduplication", "NCOA", "DNC screening"],
      outcome: "Every dial connects to a real, reachable, compliant number. Less wasted effort. Less risk."
    }
  };

  /* ---------- nav ---------- */
  const nav = document.getElementById("nav");
  const burger = document.getElementById("burger");
  const drawer = document.getElementById("drawer");

  const onScroll = () => {
    if (!nav) return;
    nav.classList.toggle("is-scrolled", window.scrollY > 24);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (burger && drawer) {
    burger.addEventListener("click", () => {
      const open = burger.getAttribute("aria-expanded") === "true";
      burger.setAttribute("aria-expanded", String(!open));
      drawer.hidden = open;
    });
    drawer.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => {
        burger.setAttribute("aria-expanded", "false");
        drawer.hidden = true;
      });
    });
  }

  /* ---------- seat tabs ---------- */
  const panel = document.getElementById("seatPanel");
  const painEl = panel?.querySelector('[data-field="pain"]');
  const fixesEl = panel?.querySelector('[data-field="fixes"]');
  const outcomeEl = panel?.querySelector('[data-field="outcome"]');
  const tabs = document.querySelectorAll(".seat");

  function renderSeat(key) {
    const data = seats[key];
    if (!data || !painEl || !fixesEl || !outcomeEl || !panel) return;
    panel.style.opacity = "0.35";
    panel.style.transform = "translateY(6px)";
    window.setTimeout(() => {
      painEl.textContent = data.pain;
      outcomeEl.textContent = data.outcome;
      fixesEl.innerHTML = data.fixes.map((f) => `<li>${f}</li>`).join("");
      panel.style.opacity = "1";
      panel.style.transform = "none";
      panel.style.transition = "opacity 0.35s ease, transform 0.35s ease";
    }, 120);
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const key = tab.dataset.seat;
      tabs.forEach((t) => {
        t.classList.toggle("is-active", t === tab);
        t.setAttribute("aria-selected", t === tab ? "true" : "false");
      });
      panel?.setAttribute("aria-labelledby", tab.id);
      renderSeat(key);
    });
  });
  renderSeat("marketing");

  /* ---------- reconcile ---------- */
  const runBtn = document.getElementById("runReconcile");
  const dirtyCards = document.querySelectorAll(".rcard--dirty");
  const cleanCard = document.getElementById("cleanCard");
  let reconDone = false;

  function runReconcile() {
    dirtyCards.forEach((card, i) => {
      window.setTimeout(() => card.classList.add("is-fading"), i * 120);
    });
    window.setTimeout(() => cleanCard?.classList.add("is-lit"), 520);
    if (runBtn) runBtn.textContent = reconDone ? "Run again" : "Cleansed";
    reconDone = true;
  }

  runBtn?.addEventListener("click", () => {
    dirtyCards.forEach((c) => c.classList.remove("is-fading"));
    cleanCard?.classList.remove("is-lit");
    window.setTimeout(runReconcile, 80);
  });

  const reconSection = document.getElementById("reconcile");
  if (reconSection && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && !reconDone) {
            runReconcile();
            io.disconnect();
          }
        });
      },
      { threshold: 0.35 }
    );
    io.observe(reconSection);
  }

  /* ---------- calculator ---------- */
  const listSize = document.getElementById("listSize");
  const calcDynamic = document.getElementById("calcDynamic");
  const calcAmount = document.getElementById("calcAmount");
  const calcStory = document.getElementById("calcStory");
  const calcEyebrow = document.getElementById("calcEyebrow");
  const calcStat1 = document.getElementById("calcStat1");
  const calcStat1Label = document.getElementById("calcStat1Label");
  const calcStat2 = document.getElementById("calcStat2");
  const calcStat2Label = document.getElementById("calcStat2Label");
  const calcRecover = document.getElementById("calcRecover");
  const calcFine = document.getElementById("calcFine");

  const money = (n) =>
    Math.round(n).toLocaleString("en-US");

  function seatInputs(seat) {
    if (!calcDynamic) return;
    if (seat === "marketing") {
      calcDynamic.innerHTML = `
        <label class="calc__field">
          <span>Monthly marketing spend (optional)</span>
          <input type="number" id="mktSpend" min="0" step="500" value="8000" inputmode="numeric">
        </label>`;
    } else if (seat === "bdc") {
      calcDynamic.innerHTML = `
        <label class="calc__field">
          <span>Number of agents</span>
          <input type="number" id="agents" min="1" step="1" value="6" inputmode="numeric">
        </label>
        <label class="calc__field">
          <span>Dials per agent per day</span>
          <input type="number" id="dials" min="10" step="5" value="80" inputmode="numeric">
        </label>`;
    } else if (seat === "fixed") {
      calcDynamic.innerHTML = `
        <label class="calc__field">
          <span>Average repair-order value</span>
          <input type="number" id="roValue" min="50" step="25" value="400" inputmode="numeric">
        </label>
        <label class="calc__field">
          <span>Service visits per customer / year</span>
          <input type="number" id="visits" min="1" step="0.5" value="2" inputmode="numeric">
        </label>`;
    } else {
      calcDynamic.innerHTML = `<p style="color:var(--muted);font-size:0.95rem;">Blended estimate across marketing waste, dial labor, and missed service revenue.</p>`;
    }
    calcDynamic.querySelectorAll("input").forEach((el) => {
      el.addEventListener("input", updateCalc);
    });
  }

  function currentSeat() {
    return document.querySelector('input[name="calcSeat"]:checked')?.value || "marketing";
  }

  function updateCalc() {
    const seat = currentSeat();
    const list = Number(listSize?.value || 17500);
    const decay = 0.15;
    const unreachable = Math.round(list * decay);
    const recovered = Math.round(unreachable * 0.8);

    if (seat === "marketing") {
      const spend = Number(document.getElementById("mktSpend")?.value || 8000);
      const annual = spend * 12;
      const waste = annual * decay;
      const attempts = Math.round(list * 12 * decay);
      if (calcEyebrow) calcEyebrow.textContent = "Bleeding out of your budget every year";
      if (calcAmount) calcAmount.textContent = money(waste);
      if (calcStory) {
        calcStory.textContent = `Across ~${attempts.toLocaleString("en-US")} wasted contact attempts a year — reaching people who aren't there anymore.`;
      }
      if (calcStat1) calcStat1.textContent = unreachable.toLocaleString("en-US");
      if (calcStat1Label) calcStat1Label.textContent = "contacts unreachable within a year";
      if (calcStat2) calcStat2.textContent = "15%";
      if (calcStat2Label) calcStat2Label.textContent = "of your list decays every year";
      if (calcRecover) {
        calcRecover.textContent = `One cleanse recovers an estimated ${recovered.toLocaleString("en-US")} contacts and stops most of that waste at the source.`;
      }
      if (calcFine) {
        calcFine.textContent =
          "Uses a conservative 15% annual contactability decay. Assumes 12 campaigns a year. Directional — your actual numbers will vary.";
      }
    } else if (seat === "bdc") {
      const agents = Number(document.getElementById("agents")?.value || 6);
      const dials = Number(document.getElementById("dials")?.value || 80);
      const badDials = Math.round(agents * dials * 250 * decay);
      const hours = Math.round((badDials * 45) / 3600);
      const labor = hours * 25;
      if (calcEyebrow) calcEyebrow.textContent = "Wasted labor on dead numbers every year";
      if (calcAmount) calcAmount.textContent = money(labor);
      if (calcStory) {
        calcStory.textContent = `About ${hours.toLocaleString("en-US")} agent-hours a year spent dialing numbers that go nowhere.`;
      }
      if (calcStat1) calcStat1.textContent = badDials.toLocaleString("en-US");
      if (calcStat1Label) calcStat1Label.textContent = "dead / wrong-number dials a year";
      if (calcStat2) calcStat2.textContent = hours.toLocaleString("en-US");
      if (calcStat2Label) calcStat2Label.textContent = "agent-hours lost a year";
      if (calcRecover) {
        calcRecover.textContent =
          "A clean list with cell-vs-landline flags and DNC screening points your team at numbers that actually connect.";
      }
      if (calcFine) {
        calcFine.textContent =
          "Assumes 250 working days, ~45 seconds per bad dial, and a loaded $25/hour labor cost. DNC risk is not dollarized here.";
      }
    } else if (seat === "fixed") {
      const ro = Number(document.getElementById("roValue")?.value || 400);
      const visits = Number(document.getElementById("visits")?.value || 2);
      const missedVisits = Math.round(unreachable * visits);
      const revenue = missedVisits * ro;
      if (calcEyebrow) calcEyebrow.textContent = "Service revenue you can't reach each year";
      if (calcAmount) calcAmount.textContent = money(revenue);
      if (calcStory) {
        calcStory.textContent = `From ${unreachable.toLocaleString("en-US")} service customers your reminders can no longer reach.`;
      }
      if (calcStat1) calcStat1.textContent = unreachable.toLocaleString("en-US");
      if (calcStat1Label) calcStat1Label.textContent = "unreachable service customers";
      if (calcStat2) calcStat2.textContent = missedVisits.toLocaleString("en-US");
      if (calcStat2Label) calcStat2Label.textContent = "missed service visits a year";
      if (calcRecover) {
        calcRecover.textContent = `Updating movers and appending fresh phones puts an estimated ${recovered.toLocaleString("en-US")} customers back within reach.`;
      }
      if (calcFine) {
        calcFine.textContent =
          "Directional estimate from list decay × visit frequency × average RO. Your actual retention mix will vary.";
      }
    } else {
      const mkt = 8000 * 12 * decay;
      const labor = 6 * 80 * 250 * decay * (45 / 3600) * 25;
      const service = unreachable * 2 * 400;
      const total = mkt + labor + service;
      if (calcEyebrow) calcEyebrow.textContent = "Estimated annual cost of bad customer data";
      if (calcAmount) calcAmount.textContent = money(total);
      if (calcStory) {
        calcStory.textContent =
          "Across wasted marketing spend, call-center labor, and missed service revenue on a conservative 15% decay.";
      }
      if (calcStat1) calcStat1.textContent = unreachable.toLocaleString("en-US");
      if (calcStat1Label) calcStat1Label.textContent = "unreachable customers";
      if (calcStat2) calcStat2.textContent = "15%";
      if (calcStat2Label) calcStat2Label.textContent = "of your database decays yearly";
      if (calcRecover) {
        calcRecover.textContent = `A single cleanse addresses all three at once, recovering an estimated ${Math.round(unreachable * 1.7).toLocaleString("en-US")} reachable contacts.`;
      }
      if (calcFine) {
        calcFine.textContent =
          "Blended directional estimate — not an audit. Your actual numbers will vary by rooftop mix and cadence.";
      }
    }
  }

  document.querySelectorAll('input[name="calcSeat"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      seatInputs(currentSeat());
      updateCalc();
    });
  });
  listSize?.addEventListener("change", updateCalc);
  seatInputs("marketing");
  updateCalc();

  /* ---------- access form ---------- */
  const form = document.getElementById("accessForm");
  const formMsg = document.getElementById("formMsg");
  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = form.email?.value?.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      if (formMsg) {
        formMsg.hidden = false;
        formMsg.style.color = "var(--warn)";
        formMsg.textContent = "Enter a valid work email to continue.";
      }
      return;
    }
    if (formMsg) {
      formMsg.hidden = false;
      formMsg.style.color = "var(--signal)";
      formMsg.textContent = "You're on the list. We'll email once at launch — nothing else.";
    }
    form.reset();
  });

  /* ---------- count-up ---------- */
  const counters = document.querySelectorAll("[data-count]");
  if ("IntersectionObserver" in window) {
    const cio = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          const target = Number(el.dataset.count);
          const isFloat = String(el.dataset.count).includes(".");
          const start = performance.now();
          const dur = 1100;
          const tick = (now) => {
            const t = Math.min(1, (now - start) / dur);
            const eased = 1 - Math.pow(1 - t, 3);
            const val = target * eased;
            el.textContent = isFloat ? val.toFixed(1) : String(Math.round(val));
            if (t < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
          cio.unobserve(el);
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach((c) => cio.observe(c));
  } else {
    counters.forEach((c) => {
      c.textContent = c.dataset.count;
    });
  }

  /* ---------- scroll reveal ---------- */
  document.querySelectorAll(".section__head, .svc, .steps li, .use-list li, .calc, .access__form, .seat-panel, .recon").forEach((el) => {
    el.classList.add("reveal");
  });
  if ("IntersectionObserver" in window) {
    const rio = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            rio.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    document.querySelectorAll(".reveal").forEach((el) => rio.observe(el));
  } else {
    document.querySelectorAll(".reveal").forEach((el) => el.classList.add("is-in"));
  }
})();

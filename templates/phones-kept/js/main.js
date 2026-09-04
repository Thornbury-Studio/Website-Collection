/* KEPT — interactions */

(function () {
  "use strict";

  const products = [
    { id: "p1", brand: "Apple", name: "iPhone 14 Pro", storage: 256, grade: "A", price: 1180, battery: 94, color: "Space Black", img: "img/phone-01.jpg", note: "Face ID verified. Original box not included. Screen protector fitted." },
    { id: "p2", brand: "Apple", name: "iPhone 13", storage: 128, grade: "B", price: 720, battery: 89, color: "Midnight", img: "img/phone-02.jpg", note: "Light hairlines on the frame. Display and cameras pass all checks." },
    { id: "p3", brand: "Samsung", name: "Galaxy S23", storage: 256, grade: "A", price: 780, battery: 96, color: "Phantom Black", img: "img/phone-03.jpg", note: "Factory reset with Samsung Knox clean. Dual SIM tray included." },
    { id: "p4", brand: "Google", name: "Pixel 8", storage: 128, grade: "A", price: 690, battery: 95, color: "Obsidian", img: "img/phone-04.jpg", note: "Bootloader locked. Latest security patch applied before listing." },
    { id: "p5", brand: "Apple", name: "iPhone 12", storage: 128, grade: "C", price: 480, battery: 84, color: "Blue", img: "img/phone-05.jpg", note: "Visible scuffs on back glass. Front display is clear with no burn-in." },
    { id: "p6", brand: "Samsung", name: "Galaxy S22 Ultra", storage: 512, grade: "B", price: 820, battery: 88, color: "Burgundy", img: "img/phone-06.jpg", note: "S Pen included. Minor wear on aluminium frame corners." },
    { id: "p7", brand: "Google", name: "Pixel 7 Pro", storage: 256, grade: "B", price: 560, battery: 90, color: "Hazel", img: "img/phone-07.jpg", note: "Telephoto and ultrawide calibrated. Soft case free with purchase." },
    { id: "p8", brand: "Apple", name: "iPhone 15", storage: 128, grade: "A", price: 980, battery: 98, color: "Black", img: "img/phone-08.jpg", note: "Near-new intake. USB-C cable included. Grade A cosmetic." },
    { id: "p9", brand: "Samsung", name: "Galaxy A54", storage: 128, grade: "A", price: 340, battery: 97, color: "Awesome Violet", img: "img/phone-02.jpg", note: "Everyday workhorse. Full inspection pass, no repair history." },
    { id: "p10", brand: "Apple", name: "iPhone 11 Pro", storage: 256, grade: "B", price: 520, battery: 86, color: "Gold", img: "img/phone-03.jpg", note: "Battery serviceable. True Tone and Face ID confirmed." },
    { id: "p11", brand: "Google", name: "Pixel 6a", storage: 128, grade: "C", price: 260, battery: 82, color: "Chalk", img: "img/phone-04.jpg", note: "Matte finish shows pocket wear. Camera and charging solid." },
    { id: "p12", brand: "Samsung", name: "Galaxy Z Flip5", storage: 256, grade: "B", price: 740, battery: 91, color: "Mint", img: "img/phone-01.jpg", note: "Fold crease normal for age. Hinge smooth through full travel." }
  ];

  const grades = {
    A: {
      letter: "A",
      title: "Like new",
      body: "Looks freshly unboxed from an arm’s length. Tiny marks you may only notice under bright light.",
      points: ["Screen and body nearly pristine", "Battery health typically 90%+", "Best if you want it to feel new"],
      delta: "Baseline",
      note: "Highest price band. Closest to a new retail unit without the new-unit premium."
    },
    B: {
      letter: "B",
      title: "Light wear",
      body: "Honest daily use — fine hairlines or small marks that don’t interrupt the screen.",
      points: ["Minor frame or back wear", "Display clear, no cracks", "Battery health typically mid-80s to low-90s"],
      delta: "−8% to −15%",
      note: "Sweet spot for value. Most of our Singapore buyers land here."
    },
    C: {
      letter: "C",
      title: "Visible wear",
      body: "Clear signs of life — scuffs, denser marks, or heavier frame wear. Fully tested and working.",
      points: ["Visible cosmetic wear", "No functional faults on the 28-point check", "Battery health disclosed per unit"],
      delta: "−18% to −30%",
      note: "Lowest price band. Ideal if function matters more than looks."
    }
  };

  /* ---------- nav ---------- */
  const nav = document.getElementById("nav");
  const burger = document.getElementById("burger");
  const drawer = document.getElementById("drawer");

  const onScroll = () => {
    if (!nav) return;
    nav.classList.toggle("is-scrolled", window.scrollY > 40);
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

  /* ---------- grades ---------- */
  const gradePanel = document.getElementById("gradePanel");
  const gradeTabs = document.querySelectorAll(".grade-tab");

  function renderGrade(key) {
    const g = grades[key];
    if (!g || !gradePanel) return;
    gradePanel.style.opacity = "0.4";
    window.setTimeout(() => {
      gradePanel.querySelector('[data-field="letter"]').textContent = g.letter;
      gradePanel.querySelector('[data-field="title"]').textContent = g.title;
      gradePanel.querySelector('[data-field="body"]').textContent = g.body;
      gradePanel.querySelector('[data-field="points"]').innerHTML = g.points.map((p) => `<li>${p}</li>`).join("");
      gradePanel.querySelector('[data-field="delta"]').textContent = g.delta;
      gradePanel.querySelector('[data-field="note"]').textContent = g.note;
      gradePanel.style.opacity = "1";
      gradePanel.style.transition = "opacity 0.3s ease";
    }, 100);
  }

  gradeTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      gradeTabs.forEach((t) => {
        t.classList.toggle("is-active", t === tab);
        t.setAttribute("aria-selected", t === tab ? "true" : "false");
      });
      gradePanel?.setAttribute("aria-labelledby", tab.id);
      renderGrade(tab.dataset.grade);
    });
  });
  renderGrade("A");

  /* ---------- shop ---------- */
  const grid = document.getElementById("productGrid");
  const filterBrand = document.getElementById("filterBrand");
  const filterGrade = document.getElementById("filterGrade");
  const filterStorage = document.getElementById("filterStorage");
  const filterCount = document.getElementById("filterCount");

  const money = (n) => `S$${n.toLocaleString("en-SG")}`;

  function filtered() {
    const b = filterBrand?.value || "all";
    const g = filterGrade?.value || "all";
    const s = filterStorage?.value || "all";
    return products.filter((p) => {
      if (b !== "all" && p.brand !== b) return false;
      if (g !== "all" && p.grade !== g) return false;
      if (s !== "all" && String(p.storage) !== s) return false;
      return true;
    });
  }

  function renderGrid() {
    if (!grid) return;
    const list = filtered();
    if (filterCount) {
      filterCount.textContent = `${list.length} phone${list.length === 1 ? "" : "s"}`;
    }
    if (!list.length) {
      grid.innerHTML = `<p style="color:var(--muted);grid-column:1/-1;">No phones match those filters. Try widening grade or storage.</p>`;
      return;
    }
    grid.innerHTML = list
      .map(
        (p) => `
      <button class="card" type="button" data-id="${p.id}">
        <div class="card__media"><img src="${p.img}" alt="" width="800" height="800" loading="lazy" decoding="async"></div>
        <div class="card__body">
          <div class="card__meta">
            <span>${p.brand}</span>
            <span class="grade-${p.grade.toLowerCase()}">Grade ${p.grade}</span>
          </div>
          <h3>${p.name} · ${p.storage} GB</h3>
          <p class="card__price">${money(p.price)}</p>
          <p class="card__batt">Battery ${p.battery}%</p>
        </div>
      </button>`
      )
      .join("");

    grid.querySelectorAll(".card").forEach((btn) => {
      btn.addEventListener("click", () => openPanel(btn.dataset.id));
    });
  }

  [filterBrand, filterGrade, filterStorage].forEach((el) => {
    el?.addEventListener("change", renderGrid);
  });
  renderGrid();

  /* ---------- panel ---------- */
  const panel = document.getElementById("panel");
  const panelImg = document.getElementById("panelImg");
  const panelGrade = document.getElementById("panelGrade");
  const panelTitle = document.getElementById("panelTitle");
  const panelPrice = document.getElementById("panelPrice");
  const panelSpecs = document.getElementById("panelSpecs");
  const panelNote = document.getElementById("panelNote");
  const panelEnquire = document.getElementById("panelEnquire");

  function openPanel(id) {
    const p = products.find((x) => x.id === id);
    if (!p || !panel) return;
    panelImg.src = p.img;
    panelImg.alt = `${p.name} ${p.storage} GB`;
    panelGrade.textContent = `Grade ${p.grade} · ${p.color}`;
    panelTitle.textContent = `${p.name} · ${p.storage} GB`;
    panelPrice.textContent = money(p.price);
    panelSpecs.innerHTML = `
      <li><span>Brand</span><b>${p.brand}</b></li>
      <li><span>Storage</span><b>${p.storage} GB</b></li>
      <li><span>Battery health</span><b>${p.battery}%</b></li>
      <li><span>Warranty</span><b>90 days</b></li>
      <li><span>IMEI</span><b>Checked · clean</b></li>`;
    panelNote.textContent = p.note;
    panelEnquire.href = `#visit`;
    panelEnquire.dataset.model = `${p.name} ${p.storage}GB Grade ${p.grade}`;
    panel.hidden = false;
    document.body.classList.add("panel-open");
  }

  function closePanel() {
    if (!panel) return;
    panel.hidden = true;
    document.body.classList.remove("panel-open");
  }

  panel?.querySelectorAll("[data-close-panel]").forEach((el) => {
    el.addEventListener("click", closePanel);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closePanel();
  });
  panelEnquire?.addEventListener("click", () => {
    const note = document.querySelector('#enquireForm input[name="note"]');
    if (note && panelEnquire.dataset.model) {
      note.value = `Interested in: ${panelEnquire.dataset.model}`;
    }
    closePanel();
  });

  /* ---------- trade-in ---------- */
  const tradeBrand = document.getElementById("tradeBrand");
  const tradeTier = document.getElementById("tradeTier");
  const tradeCond = document.getElementById("tradeCond");
  const tradeStorage = document.getElementById("tradeStorage");
  const tradeLow = document.getElementById("tradeLow");
  const tradeHigh = document.getElementById("tradeHigh");
  const tradeStory = document.getElementById("tradeStory");

  const baseByTier = { flagship: 900, mid: 520, entry: 220 };
  const brandMul = { Apple: 1.15, Samsung: 1.0, Google: 0.95 };
  const condMul = { A: 1.0, B: 0.82, C: 0.64 };
  const storageMul = { "128": 0.95, "256": 1.0, "512": 1.12 };

  function updateTrade() {
    const brand = tradeBrand?.value || "Apple";
    const tier = tradeTier?.value || "mid";
    const cond = tradeCond?.value || "B";
    const storage = tradeStorage?.value || "256";
    const mid =
      baseByTier[tier] * brandMul[brand] * condMul[cond] * storageMul[storage];
    const low = Math.round(mid * 0.9 / 10) * 10;
    const high = Math.round(mid * 1.08 / 10) * 10;
    if (tradeLow) tradeLow.textContent = low.toLocaleString("en-SG");
    if (tradeHigh) tradeHigh.textContent = high.toLocaleString("en-SG");
    if (tradeStory) {
      tradeStory.textContent = `For ${brand === "Apple" ? "an" : "a"} ${brand} ${tier} phone in Grade ${cond} condition at ${storage} GB — subject to unlock status and diagnostics at the counter.`;
    }
  }

  [tradeBrand, tradeTier, tradeCond, tradeStorage].forEach((el) => {
    el?.addEventListener("change", updateTrade);
  });
  updateTrade();

  /* ---------- form ---------- */
  const form = document.getElementById("enquireForm");
  const formMsg = document.getElementById("formMsg");
  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = form.name?.value?.trim();
    const contact = form.contact?.value?.trim();
    if (!name || !contact) {
      if (formMsg) {
        formMsg.hidden = false;
        formMsg.style.color = "var(--warn)";
        formMsg.textContent = "Add your name and a WhatsApp number or email.";
      }
      return;
    }
    if (formMsg) {
      formMsg.hidden = false;
      formMsg.style.color = "var(--accent)";
      formMsg.textContent = "Received. We’ll reply on WhatsApp or email within the day.";
    }
    form.reset();
  });

  /* ---------- reveal ---------- */
  document
    .querySelectorAll(".section__head, .grade-panel, .filters, .trade-box, .visit__grid, .trust__item")
    .forEach((el) => el.classList.add("reveal"));

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -30px 0px" }
    );
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
  } else {
    document.querySelectorAll(".reveal").forEach((el) => el.classList.add("is-in"));
  }
})();

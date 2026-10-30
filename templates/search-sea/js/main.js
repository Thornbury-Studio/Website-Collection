(() => {
  const WIKI =
    /\b(wiki|wikipedia|what is|what's|whats|meaning of|define|definition of|who is|who's)\b/i;

  const COPY = {
    ask: {
      pill: "ChatGPT",
      reason: 'Ends with <code>?</code> — you asked a question, so SEA answers.',
    },
    define: {
      pill: "Wikipedia",
      reason: "Sounds like a definition — SEA opens Wikipedia.",
    },
    find: {
      pill: "Google",
      reason: "No special trigger — SEA searches Google.",
    },
  };

  const form = document.getElementById("form");
  const input = document.getElementById("q");
  const out = document.getElementById("out");
  const pill = document.getElementById("pill");
  const reason = document.getElementById("reason");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  function route(q) {
    const s = (q || "").trim();
    if (!s) return "find";
    if (/\?\s*$/.test(s)) return "ask";
    if (WIKI.test(s)) return "define";
    return "find";
  }

  function paint(key) {
    const c = COPY[key];
    out.dataset.route = key;
    pill.textContent = c.pill;
    reason.innerHTML = c.reason;
    document.querySelectorAll(".route-list li").forEach((li) => {
      li.classList.toggle("is-on", li.dataset.route === key);
    });
    document.querySelectorAll(".examples button").forEach((b) => {
      b.classList.toggle("is-on", route(b.dataset.q) === key && input.value.trim() === (b.dataset.q || "").trim());
    });
    if (!reduce) {
      out.classList.remove("is-flash");
      void out.offsetWidth;
      out.classList.add("is-flash");
      setTimeout(() => out.classList.remove("is-flash"), 280);
    }
  }

  let t = 0;
  input.addEventListener("input", () => {
    clearTimeout(t);
    t = setTimeout(() => paint(route(input.value)), 80);
  });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    paint(route(input.value));
  });
  document.querySelectorAll("[data-q]").forEach((btn) => {
    btn.addEventListener("click", () => {
      input.value = btn.getAttribute("data-q") || "";
      paint(route(input.value));
      input.focus();
    });
  });

  paint(route(input.value));
})();

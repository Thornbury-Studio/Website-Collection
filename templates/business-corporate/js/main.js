// Meridian Partners — shared interactivity for the business template

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initWork();
  initMethod();
  initWriting();
  initScrollReveal();
  initFaq();
  initContactForm();
  setYear();
});

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* Selected work — tabs across the top, one engagement open at a time. */
function initWork() {
  const tabs = document.querySelector('#workTabs');
  const panel = document.querySelector('#workPanel');
  if (!tabs || !panel || !window.MERIDIAN_WORK) return;

  const work = window.MERIDIAN_WORK;

  work.forEach((w, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'work-tab' + (i === 0 ? ' is-on' : '');
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    b.innerHTML = `<span class="wt-client">${esc(w.client)}</span><span class="wt-sector">${esc(w.sector)}</span>`;
    b.addEventListener('click', () => show(i));
    tabs.appendChild(b);
  });

  function show(i) {
    const w = work[i];
    tabs.querySelectorAll('.work-tab').forEach((t, ti) => {
      t.classList.toggle('is-on', ti === i);
      t.setAttribute('aria-selected', ti === i ? 'true' : 'false');
    });

    panel.innerHTML = `
      <figure class="work-photo">
        <img src="${w.img}" alt="${esc(w.alt)}" width="880" height="660" loading="lazy">
      </figure>
      <div class="work-body">
        <p class="work-brief">${esc(w.brief)}</p>
        <h3>${esc(w.title)}</h3>
        <p class="work-detail">${esc(w.detail)}</p>
        <ul class="work-outcomes">
          ${w.outcomes.map((o) => `<li>${esc(o)}</li>`).join('')}
        </ul>
        <blockquote class="work-quote">
          <p>&ldquo;${esc(w.quote)}&rdquo;</p>
          <cite>${esc(w.person)}<span>${esc(w.role)}, ${esc(w.client)}</span></cite>
        </blockquote>
      </div>
      <aside class="work-metric">
        <div class="wm-figure">${esc(w.metric)}</div>
        <div class="wm-label">${esc(w.metricLabel)}</div>
        <dl class="wm-meta">
          <div><dt>Sector</dt><dd>${esc(w.sector)}</dd></div>
          <div><dt>Engagement</dt><dd>${esc(w.duration)}</dd></div>
        </dl>
      </aside>`;
    panel.classList.remove('is-swapping');
    void panel.offsetWidth;
    panel.classList.add('is-swapping');
  }

  show(0);
}

/* The engagement — click a stage, read what it involves. */
function initMethod() {
  const track = document.querySelector('#methodTrack');
  const detail = document.querySelector('#methodDetail');
  if (!track || !detail || !window.MERIDIAN_METHOD) return;

  const stages = window.MERIDIAN_METHOD;

  stages.forEach((s, i) => {
    const li = document.createElement('li');
    li.className = 'method-step';
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'ms-btn' + (i === 0 ? ' is-on' : '');
    b.setAttribute('aria-expanded', i === 0 ? 'true' : 'false');
    b.innerHTML =
      `<span class="ms-n">${esc(s.n)}</span>` +
      `<span class="ms-name">${esc(s.name)}</span>` +
      `<span class="ms-len">${esc(s.length)}</span>`;
    b.addEventListener('click', () => show(i));
    li.appendChild(b);
    track.appendChild(li);
  });

  function show(i) {
    const s = stages[i];
    track.querySelectorAll('.ms-btn').forEach((b, bi) => {
      b.classList.toggle('is-on', bi === i);
      b.setAttribute('aria-expanded', bi === i ? 'true' : 'false');
    });
    track.style.setProperty('--progress', ((i + 1) / stages.length).toFixed(3));
    detail.innerHTML = `
      <p class="md-line">${esc(s.line)}</p>
      <p class="md-detail">${esc(s.detail)}</p>
      <p class="md-gives"><span>You hold at the end</span>${esc(s.gives)}</p>`;
    detail.classList.remove('is-swapping');
    void detail.offsetWidth;
    detail.classList.add('is-swapping');
  }

  show(0);
}

/* Perspectives — a short reading list. */
function initWriting() {
  const list = document.querySelector('#writingList');
  if (!list || !window.MERIDIAN_WRITING) return;

  window.MERIDIAN_WRITING.forEach((w) => {
    const a = document.createElement('a');
    a.className = 'writing-row reveal';
    a.href = 'contact.html';
    a.innerHTML =
      `<span class="wr-meta"><span class="wr-tag">${esc(w.tag)}</span><span class="wr-date">${esc(w.date)}</span></span>` +
      `<span class="wr-main"><span class="wr-title">${esc(w.title)}</span>` +
      `<span class="wr-line">${esc(w.line)}</span></span>` +
      `<span class="wr-go" aria-hidden="true">→</span>`;
    list.appendChild(a);
  });
}

function initNav() {
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (!toggle || !links) return;

  toggle.addEventListener('click', () => {
    links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', links.classList.contains('open'));
  });

  links.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => links.classList.remove('open'));
  });
}

function initScrollReveal() {
  const items = document.querySelectorAll('.reveal');
  if (!items.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  items.forEach((item) => observer.observe(item));
}

function initFaq() {
  const items = document.querySelectorAll('.faq-item');
  items.forEach((item) => {
    const question = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');
    if (!question || !answer) return;

    question.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');

      items.forEach((other) => {
        other.classList.remove('open');
        other.querySelector('.faq-answer').style.maxHeight = null;
      });

      if (!isOpen) {
        item.classList.add('open');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });
}

function initContactForm() {
  const form = document.querySelector('#contact-form');
  if (!form) return;

  const success = document.querySelector('.form-success');

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    if (success) success.classList.add('visible');
    form.reset();

    if (success) {
      setTimeout(() => success.classList.remove('visible'), 5000);
    }
  });
}

function setYear() {
  const el = document.querySelector('#current-year');
  if (el) el.textContent = new Date().getFullYear();
}

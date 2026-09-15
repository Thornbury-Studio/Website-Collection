/* ORRIS — nav, builder, spotlight, ritual, sample handoff */
(function () {
  'use strict';

  document.documentElement.classList.add('js');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var STORAGE_KEY = 'orris-formula-v1';

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  /* ---------- nav ---------- */
  var header = $('#siteHeader');
  var burger = $('#burger');
  var drawer = $('#drawer');
  var scrim = $('#scrim');

  function setMenu(open) {
    if (!header) return;
    header.classList.toggle('is-open', open);
    if (burger) burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (drawer) drawer.hidden = !open;
    if (scrim) scrim.hidden = !open;
    document.body.classList.toggle('is-locked', open);
  }

  if (burger) {
    burger.addEventListener('click', function () {
      setMenu(!header.classList.contains('is-open'));
    });
  }
  if (scrim) scrim.addEventListener('click', function () { setMenu(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setMenu(false);
  });
  $$('#drawer a').forEach(function (a) {
    a.addEventListener('click', function () { setMenu(false); });
  });

  var scrolled = false;
  function onScroll() {
    var s = window.scrollY > 12;
    if (s !== scrolled && header) {
      scrolled = s;
      header.classList.toggle('is-scrolled', s);
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- reveal ---------- */
  var reveals = $$('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- spotlight glare ---------- */
  $$('[data-glare]').forEach(function (card) {
    card.addEventListener('pointermove', function (e) {
      var rect = card.getBoundingClientRect();
      var x = ((e.clientX - rect.left) / rect.width) * 100;
      var y = ((e.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty('--gx', x + '%');
      card.style.setProperty('--gy', y + '%');
    });
  });

  /* ---------- formula storage ---------- */
  function loadFormula() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter(function (id) { return !!window.ORRIS.byId(id); }) : [];
    } catch (err) {
      return [];
    }
  }

  function saveFormula(ids) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(ids)); } catch (err) { /* ignore */ }
  }

  function formulaFromQuery() {
    var params = new URLSearchParams(window.location.search);
    var f = params.get('f');
    if (!f) return null;
    return f.split(',').map(function (s) { return s.trim(); }).filter(function (id) { return !!window.ORRIS.byId(id); });
  }

  /* ---------- vial ---------- */
  var vialCanvas = $('#vialCanvas');
  var vial = null;
  if (vialCanvas && window.ORRIS.Vial) {
    vial = new window.ORRIS.Vial(vialCanvas, {
      mode: vialCanvas.getAttribute('data-mode') || 'desk'
    });
    vial.mount();
  }

  /* ---------- accord builder ---------- */
  var selected = loadFormula();
  var fromQuery = formulaFromQuery();
  if (fromQuery && fromQuery.length) selected = fromQuery;

  var palette = $('#notePalette');
  var formulaList = $('#formulaList');
  var priceEl = $('#kitPrice');
  var concEl = $('#concentration');
  var countEl = $('#noteCount');
  var statusEl = $('#builderStatus');
  var sampleLink = $('#sampleCta');
  var clearBtn = $('#clearFormula');
  var blotterRack = $('#blotterRack');

  function tierCount(tier, ids) {
    var n = 0;
    ids.forEach(function (id) {
      var note = window.ORRIS.byId(id);
      if (note && note.tier === tier) n++;
    });
    return n;
  }

  function announce(msg) {
    if (statusEl) statusEl.textContent = msg;
  }

  function updateVial() {
    var stats = window.ORRIS.priceFormula(selected);
    if (vial) vial.setFormula(stats.rgb, stats.count ? stats.concentration / 100 : 0.28);
    document.documentElement.style.setProperty('--formula-r', String(stats.rgb[0]));
    document.documentElement.style.setProperty('--formula-g', String(stats.rgb[1]));
    document.documentElement.style.setProperty('--formula-b', String(stats.rgb[2]));
  }

  function renderBlotterRack() {
    if (!blotterRack) return;
    blotterRack.innerHTML = '';
    if (!selected.length) {
      blotterRack.innerHTML = '<p class="blotter-rack__empty">No strips yet — pick a note and it lands here.</p>';
      return;
    }
    selected.forEach(function (id, index) {
      var note = window.ORRIS.byId(id);
      if (!note) return;
      var strip = document.createElement('div');
      strip.className = 'blotter-strip';
      strip.style.setProperty('--sw', note.hue[0] + ',' + note.hue[1] + ',' + note.hue[2]);
      strip.style.setProperty('--tilt', ((index % 3) - 1) * 1.8 + 'deg');
      strip.style.setProperty('--nudge', (index % 2 === 0 ? 0.35 : -0.2) + 'rem');
      strip.innerHTML =
        '<span class="blotter-strip__paper">' +
          '<span class="blotter-strip__tier">' + note.tier + '</span>' +
          '<span class="blotter-strip__name">' + note.name + '</span>' +
          '<span class="blotter-strip__meta">' + note.origin + ' · ' + note.family + '</span>' +
        '</span>' +
        '<span class="blotter-strip__dip" aria-hidden="true">' +
          '<span class="blotter-strip__stain blotter-strip__stain--a"></span>' +
          '<span class="blotter-strip__stain blotter-strip__stain--b"></span>' +
          '<span class="blotter-strip__stain blotter-strip__stain--c"></span>' +
        '</span>';
      blotterRack.appendChild(strip);
    });
  }

  function renderFormulaStrip() {
    if (!formulaList) return;
    formulaList.innerHTML = '';
    if (!selected.length) {
      formulaList.innerHTML = '<li class="formula-empty">Choose a top, heart, and base note to begin.</li>';
    } else {
      selected.forEach(function (id) {
        var note = window.ORRIS.byId(id);
        if (!note) return;
        var li = document.createElement('li');
        li.className = 'formula-chip';
        li.innerHTML = '<span class="formula-chip__tier">' + note.tier + '</span><span class="formula-chip__name">' + note.name + '</span><button type="button" class="formula-chip__x" data-remove="' + note.id + '" aria-label="Remove ' + note.name + '">×</button>';
        formulaList.appendChild(li);
      });
    }

    var stats = window.ORRIS.priceFormula(selected);
    if (priceEl) priceEl.textContent = '$' + stats.price;
    if (concEl) concEl.textContent = (stats.count ? stats.concentration : 0) + '%';
    if (countEl) countEl.textContent = String(stats.count);

    if (sampleLink) {
      var qs = selected.length ? ('?f=' + encodeURIComponent(selected.join(','))) : '';
      sampleLink.href = 'sample.html' + qs;
      sampleLink.setAttribute('aria-disabled', selected.length ? 'false' : 'true');
      sampleLink.classList.toggle('is-disabled', !selected.length);
    }

    $$('.note-btn').forEach(function (btn) {
      var on = selected.indexOf(btn.dataset.note) !== -1;
      btn.classList.toggle('is-on', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });

    drawBeams();
    updateVial();
    renderBlotterRack();
    saveFormula(selected);
  }

  function toggleNote(id) {
    var note = window.ORRIS.byId(id);
    if (!note) return;
    var idx = selected.indexOf(id);
    if (idx !== -1) {
      selected.splice(idx, 1);
      announce(note.name + ' removed.');
    } else {
      if (tierCount(note.tier, selected) >= window.ORRIS.MAX_PER_TIER) {
        announce('At most ' + window.ORRIS.MAX_PER_TIER + ' notes per ' + note.tier + '.');
        return;
      }
      selected.push(id);
      announce(note.name + ' added to ' + note.tier + '.');
    }
    renderFormulaStrip();
  }

  function renderPalette() {
    if (!palette || !window.ORRIS.NOTES) return;
    var tiers = ['top', 'heart', 'base'];
    palette.innerHTML = '';
    tiers.forEach(function (tier) {
      var group = document.createElement('div');
      group.className = 'palette-group';
      group.innerHTML = '<h3 class="palette-group__title">' + tier + '</h3>';
      var row = document.createElement('div');
      row.className = 'palette-row';
      row.setAttribute('role', 'group');
      row.setAttribute('aria-label', tier + ' notes');
      window.ORRIS.NOTES.filter(function (n) { return n.tier === tier; }).forEach(function (note) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'note-btn';
        btn.dataset.note = note.id;
        btn.dataset.glare = '1';
        btn.setAttribute('aria-pressed', 'false');
        btn.innerHTML =
          '<span class="note-btn__swatch" style="--sw:' + note.hue[0] + ',' + note.hue[1] + ',' + note.hue[2] + '"></span>' +
          '<span class="note-btn__body">' +
            '<span class="note-btn__name">' + note.name + '</span>' +
            '<span class="note-btn__blurb">' + note.blurb + '</span>' +
            '<span class="note-btn__meta"><em>' + note.origin + '</em> · ' + note.family + ' · $' + note.cost + '</span>' +
          '</span>';
        btn.addEventListener('click', function () { toggleNote(note.id); });
        row.appendChild(btn);
      });
      group.appendChild(row);
      palette.appendChild(group);
    });
  }

  if (palette) {
    renderPalette();
    formulaList && formulaList.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-remove]');
      if (!btn) return;
      toggleNote(btn.getAttribute('data-remove'));
    });
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        selected = [];
        announce('Formula cleared.');
        renderFormulaStrip();
      });
    }
    renderFormulaStrip();
  } else {
    updateVial();
  }

  /* ---------- beams between selected notes ---------- */
  var beamCanvas = $('#beamCanvas');
  function drawBeams() {
    if (!beamCanvas || !palette) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var rect = beamCanvas.getBoundingClientRect();
    var w = Math.floor(rect.width * dpr);
    var h = Math.floor(rect.height * dpr);
    if (!w || !h) return;
    beamCanvas.width = w;
    beamCanvas.height = h;
    var ctx = beamCanvas.getContext('2d');
    ctx.clearRect(0, 0, w, h);
    if (selected.length < 2) return;

    var points = [];
    selected.forEach(function (id) {
      var btn = palette.querySelector('[data-note="' + id + '"]');
      if (!btn) return;
      var br = btn.getBoundingClientRect();
      var pr = beamCanvas.getBoundingClientRect();
      points.push({
        x: ((br.left + br.width / 2) - pr.left) * dpr,
        y: ((br.top + br.height / 2) - pr.top) * dpr
      });
    });

    ctx.strokeStyle = 'rgba(196, 92, 38, 0.4)';
    ctx.lineWidth = 1.1 * dpr;
    ctx.setLineDash([3 * dpr, 6 * dpr]);
    for (var i = 0; i < points.length - 1; i++) {
      ctx.beginPath();
      ctx.moveTo(points[i].x, points[i].y);
      ctx.lineTo(points[i + 1].x, points[i + 1].y);
      ctx.stroke();
    }
  }
  window.addEventListener('resize', drawBeams, { passive: true });

  /* ---------- notes page grid ---------- */
  var notesGrid = $('#notesGrid');
  if (notesGrid && window.ORRIS.NOTES) {
    notesGrid.innerHTML = '';
    window.ORRIS.NOTES.forEach(function (note) {
      var article = document.createElement('article');
      article.className = 'note-card reveal';
      article.dataset.glare = '1';
      article.innerHTML =
        '<div class="note-card__top">' +
          '<span class="note-card__swatch" style="--sw:' + note.hue[0] + ',' + note.hue[1] + ',' + note.hue[2] + '"></span>' +
          '<p class="note-card__tier">' + note.tier + ' · ' + note.family + '</p>' +
        '</div>' +
        '<h3>' + note.name + '</h3>' +
        '<p class="note-card__blurb">' + note.blurb + '</p>' +
        '<dl class="note-card__facts">' +
          '<div><dt>Origin</dt><dd>' + note.origin + '</dd></div>' +
          '<div><dt>On skin</dt><dd>' + note.lasting + '</dd></div>' +
          '<div><dt>Character</dt><dd>' + note.intensity + '</dd></div>' +
          '<div><dt>Kit add-on</dt><dd>$' + note.cost + '</dd></div>' +
        '</dl>';
      notesGrid.appendChild(article);
    });
    // re-bind glare + reveal for dynamic cards
    $$('[data-glare]', notesGrid).forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var rect = card.getBoundingClientRect();
        card.style.setProperty('--gx', ((e.clientX - rect.left) / rect.width) * 100 + '%');
        card.style.setProperty('--gy', ((e.clientY - rect.top) / rect.height) * 100 + '%');
      });
    });
    if ('IntersectionObserver' in window && !reduceMotion) {
      var io2 = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            io2.unobserve(entry.target);
          }
        });
      }, { threshold: 0.08 });
      $$('.reveal', notesGrid).forEach(function (el) { io2.observe(el); });
    } else {
      $$('.reveal', notesGrid).forEach(function (el) { el.classList.add('is-in'); });
    }
  }

  /* ---------- shop + collection product cards ---------- */
  function scentCardHtml(scent) {
    var names = scent.formula.map(function (id) {
      var n = window.ORRIS.byId(id);
      return n ? n.name : id;
    }).join(' · ');
    var low = scent.stock <= 8;
    return (
      '<div class="scent-card__stage">' +
        '<img src="' + scent.image + '" alt="' + scent.name + ' perfume bottle" width="800" height="1000" loading="lazy" decoding="async">' +
      '</div>' +
      '<div class="scent-card__head">' +
        '<p class="scent-card__stock' + (low ? ' is-low' : '') + '">' + (low ? 'Low stock · ' : 'In stock · ') + scent.stock + ' bottles</p>' +
        '<h3>' + scent.name + '</h3>' +
      '</div>' +
      '<p class="scent-card__line">' + scent.line + '</p>' +
      '<p class="scent-card__formula">' + names + '</p>' +
      '<p class="scent-card__wear">' + scent.wear + ' · ships in ' + scent.ships + '</p>' +
      '<div class="scent-card__buy">' +
        '<p class="scent-card__price"><strong>$' + scent.price + '</strong> · ' + scent.size + '</p>' +
        '<div class="scent-card__actions">' +
          '<a class="btn btn--sm" href="sample.html?f=' + encodeURIComponent(scent.formula.join(',')) + '">Buy sample set</a>' +
          '<a class="btn btn--ghost btn--sm" href="index.html?f=' + encodeURIComponent(scent.formula.join(',')) + '#builder">Open formula</a>' +
        '</div>' +
      '</div>'
    );
  }

  var shopGrid = $('#shopGrid');
  if (shopGrid && window.ORRIS.HOUSE) {
    shopGrid.innerHTML = '';
    window.ORRIS.HOUSE.slice(0, 3).forEach(function (scent) {
      var low = scent.stock <= 8;
      var a = document.createElement('a');
      a.className = 'product-card reveal';
      a.href = 'collection.html#' + scent.id;
      a.innerHTML =
        '<div class="product-card__stage">' +
          '<img src="' + scent.image + '" alt="' + scent.name + ' perfume bottle" width="800" height="1000" loading="lazy" decoding="async">' +
        '</div>' +
        '<div class="product-card__body">' +
          '<p class="product-card__meta' + (low ? ' is-low' : '') + '">' + (low ? 'Low stock' : 'In stock') + ' · ' + scent.stock + '</p>' +
          '<h3>' + scent.name + '</h3>' +
          '<p class="product-card__line">' + scent.line + '</p>' +
          '<div class="product-card__row">' +
            '<span class="product-card__price">$' + scent.price + '</span>' +
            '<span class="product-card__cta">Shop →</span>' +
          '</div>' +
        '</div>';
      shopGrid.appendChild(a);
    });
    $$('.reveal', shopGrid).forEach(function (el) { el.classList.add('is-in'); });
  }

  var collectionGrid = $('#collectionGrid');
  if (collectionGrid && window.ORRIS.HOUSE) {
    collectionGrid.innerHTML = '';
    window.ORRIS.HOUSE.forEach(function (scent) {
      var article = document.createElement('article');
      article.className = 'scent-card reveal';
      article.id = scent.id;
      article.innerHTML = scentCardHtml(scent);
      collectionGrid.appendChild(article);
    });
    $$('.reveal', collectionGrid).forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- sample form ---------- */
  var sampleForm = $('#sampleForm');
  if (sampleForm) {
    var ids = formulaFromQuery() || loadFormula();
    var preview = $('#samplePreview');
    var hidden = $('#sampleFormulaField');
    var stats = window.ORRIS.priceFormula(ids);
    if (preview) {
      if (!ids.length) {
        preview.innerHTML = '<p>No formula yet. <a href="index.html#builder">Build one first</a>.</p>';
      } else {
        preview.innerHTML = '<ul>' + ids.map(function (id) {
          var n = window.ORRIS.byId(id);
          return '<li><strong>' + n.tier + '</strong> ' + n.name + '</li>';
        }).join('') + '</ul><p class="sample-price">Discovery kit · <strong>$' + stats.price + '</strong> · ' + stats.concentration + '% concentrate profile</p>';
      }
    }
    if (hidden) hidden.value = ids.join(',');
    if (vial) vial.setFormula(stats.rgb, ids.length ? stats.concentration / 100 : 0.28);

    sampleForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!ids.length) {
        announce && announce('Add notes before requesting a kit.');
        return;
      }
      var done = $('#sampleDone');
      sampleForm.hidden = true;
      if (done) {
        done.hidden = false;
        done.focus();
      }
    });
  }

  /* ---------- ritual scroll chapters ---------- */
  var chapters = $$('.chapter');
  if (chapters.length && 'IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) entry.target.classList.add('is-active');
      });
    }, { threshold: 0.45 });
    chapters.forEach(function (ch) { cio.observe(ch); });
  }

  /* ---------- contact form ---------- */
  var contactForm = $('#contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      contactForm.hidden = true;
      var done = $('#contactDone');
      if (done) done.hidden = false;
    });
  }
})();

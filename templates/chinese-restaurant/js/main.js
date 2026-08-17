/* ============================================================
   Bái Hè 白鶴 — the table
   No dependencies.

   The menu is the control surface and the round table is the readout.
   Everything below exists to keep those two in sync: choose a dish and it
   lands on the table, change the party size and the settings redraw, and
   the advice line reads the composition back to you the way a waiter
   would ("you've no green yet").
   ============================================================ */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var money = function (n) { return '$' + n.toFixed(2); };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };

  var cards = Array.prototype.slice.call(document.querySelectorAll('.dish'));
  var byId = {};
  cards.forEach(function (el) {
    byId[el.dataset.id] = {
      el: el,
      id: el.dataset.id,
      name: el.dataset.name,
      price: parseFloat(el.dataset.price),
      cat: el.dataset.cat,
      spice: parseInt(el.dataset.spice, 10),
      veg: el.dataset.veg === '1'
    };
  });

  var state = { chosen: [], pax: 4, filter: 'all', maxHeat: 3 };

  var elPlates = document.getElementById('plates');
  var elSeats = document.getElementById('settings');
  var elTable = document.getElementById('table');
  var elAdvice = document.getElementById('advice');
  var elChosen = document.getElementById('chosen');
  var nodes = {};   // dish id -> the plate element currently on the table

  /* ----------------------------------------------------------
     Table geometry
     Dishes ring the lazy susan; the ring and the plates both shrink as the
     table fills so ten dishes still fit without overlapping.
     ---------------------------------------------------------- */
  function plateSize(n) {
    if (n <= 3) return 30;
    if (n <= 5) return 26;
    if (n <= 7) return 23;
    return 20;
  }
  function ringRadius(n) { return n <= 1 ? 0 : (n <= 4 ? 22 : 25); }

  function layoutPlates() {
    var n = state.chosen.length;
    var size = plateSize(n);
    var rad = ringRadius(n);
    state.chosen.forEach(function (id, i) {
      var el = nodes[id];
      if (!el) return;
      /* start at 12 o'clock and go clockwise, so the first dish always lands
         in the same place and additions read as "the table filling up" */
      var a = (-90 + (360 / Math.max(n, 1)) * i) * Math.PI / 180;
      el.style.width = size + '%';
      el.style.height = size + '%';
      el.style.left = (50 + Math.cos(a) * rad) + '%';
      el.style.top = (50 + Math.sin(a) * rad) + '%';
    });
  }

  function makePlate(id, ghost) {
    var d = byId[id];
    var el = document.createElement(ghost ? 'div' : 'button');
    el.className = 'tp' + (ghost ? ' ghost' : '');
    if (!ghost) {
      el.type = 'button';
      el.setAttribute('aria-label', 'Remove ' + d.name);
      el.addEventListener('click', function () { toggle(id); });
    }
    el.innerHTML = '<svg viewBox="0 0 120 120" aria-hidden="true"><use href="#p-' + id + '"/></svg>';
    return el;
  }

  /* ----------------------------------------------------------
     Place settings — one per guest, evenly around the rim
     ---------------------------------------------------------- */
  function drawSeats() {
    elSeats.innerHTML = '';
    for (var i = 0; i < state.pax; i++) {
      var a = (-90 + (360 / state.pax) * i) * Math.PI / 180;
      var s = document.createElement('div');
      s.className = 'seat';
      s.style.left = (50 + Math.cos(a) * 41) + '%';
      s.style.top = (50 + Math.sin(a) * 41) + '%';
      s.innerHTML = '<i></i><b></b>';
      elSeats.appendChild(s);
    }
  }

  /* ----------------------------------------------------------
     Advice — reads the table back the way a waiter would.
     The convention it encodes: roughly one dish per person, then a rice on
     top, and always a green.
     ---------------------------------------------------------- */
  function advise() {
    var n = state.chosen.length;
    var cats = state.chosen.map(function (id) { return byId[id].cat; });
    var has = function (c) { return cats.indexOf(c) !== -1; };
    var mains = cats.filter(function (c) { return c === 'main'; }).length;
    var target = state.pax;
    var good = false, msg;

    if (n === 0) {
      msg = 'Tap a dish to set the table.';
    } else if (n < target) {
      var short = target - n;
      msg = short + (short === 1 ? ' more dish' : ' more dishes') + ' for a table of ' + state.pax +
        ' — about one each is the rule.';
    } else if (!has('veg')) {
      msg = 'No green yet. Something blanched cuts through the rest of this.';
    } else if (!has('rice')) {
      msg = 'Add a rice or a noodle — it arrives with the mains and carries the sauce.';
    } else if (mains === 0) {
      msg = 'All small plates so far. One main would anchor the table.';
    } else if (n > target + 3) {
      msg = 'That is a lot of food for ' + state.pax + '. Generous, but you may be taking some home.';
    } else {
      good = true;
      msg = 'A balanced table for ' + state.pax + '. Order it exactly like this.';
    }
    elAdvice.textContent = msg;
    elAdvice.classList.toggle('is-good', good);
  }

  function renderList() {
    elChosen.innerHTML = '';
    state.chosen.forEach(function (id) {
      var d = byId[id];
      var li = document.createElement('li');
      li.innerHTML = '<button type="button" aria-label="Remove ' + d.name + '">&times;</button>' +
        '<span class="chosen-name">' + d.name + '</span><span>' + money(d.price) + '</span>';
      li.querySelector('button').addEventListener('click', function () { toggle(id); });
      elChosen.appendChild(li);
    });
  }

  function renderTotals() {
    var total = state.chosen.reduce(function (s, id) { return s + byId[id].price; }, 0);
    document.getElementById('tDishes').textContent = state.chosen.length;
    document.getElementById('tTotal').textContent = money(total);
    document.getElementById('tPer').textContent = money(state.chosen.length ? total / state.pax : 0);
    document.getElementById('dockCount').textContent =
      state.chosen.length + (state.chosen.length === 1 ? ' dish' : ' dishes');
    document.getElementById('dockTotal').textContent = money(total);
  }

  function render() {
    elTable.classList.toggle('has-dishes', state.chosen.length > 0);
    layoutPlates();
    renderTotals();
    renderList();
    advise();
  }

  /* ----------------------------------------------------------
     Add / remove
     ---------------------------------------------------------- */
  function toggle(id) {
    var d = byId[id];
    var i = state.chosen.indexOf(id);
    clearGhost();

    if (i === -1) {
      state.chosen.push(id);
      d.el.classList.add('is-on', 'just-added');
      d.el.setAttribute('aria-pressed', 'true');
      setTimeout(function () { d.el.classList.remove('just-added'); }, 500);
      var el = makePlate(id);
      nodes[id] = el;
      elPlates.appendChild(el);
    } else {
      state.chosen.splice(i, 1);
      d.el.classList.remove('is-on');
      d.el.setAttribute('aria-pressed', 'false');
      var old = nodes[id];
      delete nodes[id];
      if (old) {
        old.classList.add('leaving');
        var kill = function () { if (old.parentNode) old.parentNode.removeChild(old); };
        reduced ? kill() : setTimeout(kill, 300);
      }
    }
    render();
  }

  /* ----------------------------------------------------------
     Ghost preview — hovering a dish shows where it would land.
     Only for real pointers: on touch there is no hover, and firing this on
     tap would flash a ghost the instant before the real plate appears.
     ---------------------------------------------------------- */
  var ghostEl = null;
  function clearGhost() {
    if (ghostEl && ghostEl.parentNode) ghostEl.parentNode.removeChild(ghostEl);
    ghostEl = null;
    layoutPlates();
  }
  function showGhost(id) {
    if (state.chosen.indexOf(id) !== -1 || byId[id].el.classList.contains('is-muted')) return;
    clearGhost();
    ghostEl = makePlate(id, true);
    elPlates.appendChild(ghostEl);
    /* lay out as though this dish were already on the table, so the existing
       plates shuffle to make room and you see the arrangement you'd get */
    var n = state.chosen.length + 1;
    var size = plateSize(n), rad = ringRadius(n);
    state.chosen.concat([id]).forEach(function (cid, i) {
      var el = cid === id ? ghostEl : nodes[cid];
      if (!el) return;
      var a = (-90 + (360 / n) * i) * Math.PI / 180;
      el.style.width = size + '%';
      el.style.height = size + '%';
      el.style.left = (50 + Math.cos(a) * rad) + '%';
      el.style.top = (50 + Math.sin(a) * rad) + '%';
    });
  }

  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  cards.forEach(function (el) {
    el.addEventListener('click', function () { toggle(el.dataset.id); });
    if (finePointer && !reduced) {
      el.addEventListener('mouseenter', function () { showGhost(el.dataset.id); });
      el.addEventListener('mouseleave', clearGhost);
      el.addEventListener('focus', function () { showGhost(el.dataset.id); });
      el.addEventListener('blur', clearGhost);
    }
  });

  /* ----------------------------------------------------------
     Party size
     ---------------------------------------------------------- */
  var paxOut = document.getElementById('paxOut');
  function setPax(v) {
    state.pax = clamp(v, 1, 10);
    paxOut.textContent = state.pax;
    document.getElementById('paxDown').disabled = state.pax <= 1;
    document.getElementById('paxUp').disabled = state.pax >= 10;
    drawSeats();
    renderTotals();
    advise();
  }
  document.getElementById('paxUp').addEventListener('click', function () { setPax(state.pax + 1); });
  document.getElementById('paxDown').addEventListener('click', function () { setPax(state.pax - 1); });

  /* ----------------------------------------------------------
     Filters — dishes are dimmed, never removed, so the list never
     reflows under the cursor mid-decision.
     ---------------------------------------------------------- */
  function applyFilters() {
    cards.forEach(function (el) {
      var d = byId[el.dataset.id];
      var ok = (state.filter !== 'veg' || d.veg) && d.spice <= state.maxHeat;
      el.classList.toggle('is-muted', !ok);
    });
  }
  document.querySelectorAll('[data-filter]').forEach(function (b) {
    b.addEventListener('click', function () {
      state.filter = b.dataset.filter;
      document.querySelectorAll('[data-filter]').forEach(function (o) {
        var on = o === b;
        o.classList.toggle('is-on', on);
        o.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      applyFilters();
    });
  });

  /* heat control: 0..3, meaning "the hottest I want to see" */
  var heatCtl = document.getElementById('heatCtl');
  ['Mild', 'Warm', 'Hot', 'Numbing'].forEach(function (label, lvl) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'heat' + (lvl === 3 ? ' is-on' : '');
    b.title = label;
    b.setAttribute('role', 'radio');
    b.setAttribute('aria-label', label);
    b.setAttribute('aria-checked', lvl === 3 ? 'true' : 'false');
    b.innerHTML = '<i></i>';
    b.addEventListener('click', function () {
      state.maxHeat = lvl;
      Array.prototype.forEach.call(heatCtl.children, function (c, k) {
        var on = k <= lvl;
        c.classList.toggle('is-on', on);
        c.setAttribute('aria-checked', k === lvl ? 'true' : 'false');
      });
      applyFilters();
    });
    heatCtl.appendChild(b);
  });
  Array.prototype.forEach.call(heatCtl.children, function (c) { c.classList.add('is-on'); });

  /* heat dots on each card, drawn from the data rather than hand-written */
  document.querySelectorAll('.heat[data-level]').forEach(function (h) {
    var lvl = parseInt(h.dataset.level, 10);
    for (var i = 0; i < lvl; i++) h.appendChild(document.createElement('i'));
  });

  document.getElementById('clear').addEventListener('click', function () {
    state.chosen.slice().forEach(toggle);
  });

  /* ----------------------------------------------------------
     Chrome
     ---------------------------------------------------------- */
  var nav = document.getElementById('nav');
  function onScroll() { nav.classList.toggle('is-stuck', window.scrollY > 20); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var dock = document.getElementById('dock');
  function syncDock() { dock.hidden = window.innerWidth > 1080; }
  window.addEventListener('resize', syncDock);
  syncDock();

  var revealables = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduced) {
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        ro.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    revealables.forEach(function (el) { ro.observe(el); });
  } else {
    revealables.forEach(function (el) { el.classList.add('is-in'); });
  }

  setPax(4);
  applyFilters();
  render();
})();

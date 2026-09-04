/* CHALKLINE — start with your plan.

   Flat type → the plan redraws. Tick rooms on the plan or in the list →
   the estimate recomputes from the plan's geometry and prints the working.
   Then the whole thing composes into a WhatsApp message, or an email.
   Without script the page still works as a checklist: the baked 4-room
   plan highlights ticked rooms through CSS, and the WhatsApp link in the
   header opens a plain conversation. */

(function (root, doc) {
  'use strict';

  var P = root.CHALK_PLANS, E = root.CHALK_EST;
  if (!P || !E) return;

  var stage = doc.getElementById('pickPlan');
  var list = doc.getElementById('rooms');
  var typeInputs = Array.prototype.slice.call(doc.querySelectorAll('input[name="flat"]'));
  var out = {
    band: doc.getElementById('estBand'), meta: doc.getElementById('estMeta'), empty: doc.getElementById('estEmpty'),
    work: doc.getElementById('estWork'), line: doc.getElementById('estLine'), details: doc.getElementById('estDetails'),
    wa: doc.getElementById('sendWa'), mail: doc.getElementById('sendMail'), preview: doc.getElementById('msgPreview'),
    count: doc.getElementById('estCount'), bar: doc.getElementById('estBar'), barBand: doc.getElementById('estBarBand')
  };
  if (!stage || !list) return;

  var WA = '6582242558';
  var planId = 'hdb4';
  var picks = {};          /* roomId -> scope */
  var current = null;      /* last estimate */

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

  /* ---- plan + list ------------------------------------------------------- */

  function renderPlan() {
    stage.innerHTML = P.render(P.PLANS[planId], { uid: 'pick', mode: 'pick' });
    stage.querySelectorAll('.room').forEach(function (g) {
      var id = g.getAttribute('data-room');
      g.addEventListener('click', function () { toggle(id); });
      g.addEventListener('keydown', function (e) {
        if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(id); }
      });
    });
  }

  function renderList() {
    var plan = P.PLANS[planId], html = '';
    plan.rooms.forEach(function (r) {
      var m = P.measure(r), allowed = P.KINDS[r.kind].scopes;
      html += '<li class="rm" data-room="' + r.id + '">';
      html += '<input type="checkbox" id="r-' + r.id + '" data-room="' + r.id + '">';
      html += '<label for="r-' + r.id + '">' + esc(r.name) + '<small>' + (Math.round(m.area * 10) / 10) + ' m²</small></label>';
      html += '<span class="amt" data-amt="' + r.id + '">—</span>';
      html += '<span class="scope" role="radiogroup" aria-label="Scope for ' + esc(r.name) + '">';
      ['light', 'standard', 'full'].forEach(function (s) {
        var ok = allowed.indexOf(s) !== -1;
        html += '<label><input type="radio" name="s-' + r.id + '" value="' + s + '"' + (ok ? '' : ' disabled') + (s === 'standard' && ok ? ' checked' : '') + (s === 'light' && allowed.length === 1 ? ' checked' : '') + '><span>' + E.SCOPES[s].label + '</span></label>';
      });
      if (r.kind === 'hs') html += '<span class="scope__note">Shelter walls stay as built; paint and floor only.</span>';
      html += '</span></li>';
    });
    list.innerHTML = html;

    list.addEventListener('change', function (e) {
      var t = e.target;
      if (t.type === 'checkbox') { setPick(t.getAttribute('data-room'), t.checked ? scopeOf(t.getAttribute('data-room')) : null); }
      else if (t.type === 'radio') {
        var id = t.name.replace(/^s-/, '');
        var box = doc.getElementById('r-' + id);
        if (box && !box.checked) { box.checked = true; }
        setPick(id, t.value);
      }
    });
  }

  function scopeOf(id) {
    var r = list.querySelector('input[name="s-' + id + '"]:checked');
    return r ? r.value : 'standard';
  }

  function toggle(id) {
    var box = doc.getElementById('r-' + id);
    if (!box) return;
    box.checked = !box.checked;
    setPick(id, box.checked ? scopeOf(id) : null);
  }

  function setPick(id, scope) {
    if (scope) picks[id] = scope; else delete picks[id];
    var g = stage.querySelector('.room[data-room="' + id + '"]');
    if (g) { g.classList.toggle('is-picked', !!scope); g.setAttribute('aria-checked', scope ? 'true' : 'false'); }
    var box = doc.getElementById('r-' + id);
    if (box && box.checked !== !!scope) box.checked = !!scope;
    compute();
  }

  /* ---- estimate ---------------------------------------------------------- */

  function compute() {
    var e = E.estimate(planId, picks);
    current = e;
    var any = e && e.rooms.length;

    /* per-room amounts in the list */
    list.querySelectorAll('[data-amt]').forEach(function (el) { el.textContent = '—'; });
    if (any) e.rooms.forEach(function (r) {
      var el = list.querySelector('[data-amt="' + r.id + '"]');
      if (el) el.textContent = E.money(r.total);
    });

    if (out.empty) out.empty.hidden = !!any;
    if (out.band) { out.band.hidden = !any; out.band.textContent = any ? E.band(e) : ''; }
    if (out.meta) {
      out.meta.hidden = !any;
      if (any) out.meta.innerHTML = '<b>' + e.rooms.length + '</b> room' + (e.rooms.length === 1 ? '' : 's') + ' · about <b>' + E.weeks(e) + ' weeks</b> on site · ' + esc(e.plan.label);
    }
    if (out.line) out.line.style.setProperty('--fill', any ? Math.min(100, e.subtotal / 1200) + '%' : '0%');
    if (out.details) out.details.hidden = !any;
    if (out.count) out.count.textContent = any ? String(e.rooms.length) : '0';
    if (out.bar) { out.bar.hidden = !any; if (out.barBand) out.barBand.textContent = any ? E.band(e) : ''; }

    if (out.work) {
      var h = '';
      if (any) {
        e.rooms.forEach(function (r) {
          h += '<h4>' + esc(r.name) + ' <span>' + E.money(r.total) + '</span></h4><dl>';
          r.lines.forEach(function (l) {
            h += '<dt>' + esc(l.label) + ' <span class="qty">' + l.qty + ' ' + esc(l.unit) + ' × ' + l.rate + '</span></dt><dd>' + E.money(l.amount) + '</dd>';
          });
          h += '</dl>';
        });
        h += '<h4>Site <span>' + E.money(e.siteTotal) + '</span></h4><dl>';
        e.site.forEach(function (l) {
          h += '<dt>' + esc(l.label) + ' <span class="qty">' + l.qty + ' ' + esc(l.unit) + ' × ' + l.rate + '</span></dt><dd>' + E.money(l.amount) + '</dd>';
        });
        h += '</dl><div class="tot"><span>Subtotal before the band</span><span>' + E.money(e.subtotal) + '</span></div>';
      }
      out.work.innerHTML = h;
    }
    composeMessage();
  }

  /* ---- the message ------------------------------------------------------- */

  function field(id) { var el = doc.getElementById(id); return el ? el.value.trim() : ''; }

  function messageText() {
    var e = current, plan = P.PLANS[planId];
    var lines = ['Hi CHALKLINE, I’d like to start with my plan.'];
    var name = field('f-name'), keys = field('f-keys'), budget = field('f-budget'), notes = field('f-notes');
    if (name) lines.push('Name: ' + name);
    lines.push('Flat: ' + plan.label + (field('f-tenure') ? ', ' + field('f-tenure') : ''));
    if (keys) lines.push('Keys: ' + keys);
    if (e && e.rooms.length) {
      lines.push('Rooms (' + e.rooms.length + '):');
      e.rooms.forEach(function (r) { lines.push('• ' + r.name + ' — ' + E.SCOPES[r.scope].label.toLowerCase() + ' (' + E.money(r.total) + ')'); });
      lines.push('Your estimate: ' + E.band(e) + ', about ' + E.weeks(e) + ' weeks.');
    } else {
      lines.push('Rooms: not decided yet.');
    }
    if (budget) lines.push('My budget: ' + budget);
    if (notes) lines.push('Notes: ' + notes);
    return lines.join('\n');
  }

  function composeMessage() {
    var text = messageText();
    if (out.wa) out.wa.href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(text);
    if (out.mail) out.mail.href = 'mailto:hello@chalkline.sg?subject=' + encodeURIComponent('Start with my plan — ' + P.PLANS[planId].label) + '&body=' + encodeURIComponent(text);
    if (out.preview) out.preview.textContent = text;
  }

  /* ---- flat type ----------------------------------------------------------- */

  function setPlan(id, keepPicks) {
    if (!P.PLANS[id]) return;
    planId = id;
    if (!keepPicks) picks = {};
    renderPlan();
    renderList();
    Object.keys(picks).forEach(function (rid) {
      if (!P.room(planId, rid)) delete picks[rid];
      else {
        var box = doc.getElementById('r-' + rid);
        if (box) box.checked = true;
        var g = stage.querySelector('.room[data-room="' + rid + '"]');
        if (g) { g.classList.add('is-picked'); g.setAttribute('aria-checked', 'true'); }
        var rad = list.querySelector('input[name="s-' + rid + '"][value="' + picks[rid] + '"]');
        if (rad && !rad.disabled) rad.checked = true; else picks[rid] = scopeOf(rid);
      }
    });
    compute();
  }

  typeInputs.forEach(function (inp) {
    inp.addEventListener('change', function () { if (inp.checked) setPlan(inp.value, true); });
  });

  /* form: sync aria-invalid the way :user-invalid can't, and never fake a send */
  var form = doc.getElementById('sendForm');
  if (form) {
    form.addEventListener('input', composeMessage);
    form.addEventListener('change', composeMessage);
    form.addEventListener('blur', function (e) {
      var t = e.target;
      if (t && t.matches && t.matches('input[required], select[required]')) {
        if (!t.checkValidity()) t.setAttribute('aria-invalid', 'true'); else t.removeAttribute('aria-invalid');
      }
    }, true);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      if (out.wa) root.open(out.wa.href, '_blank', 'noopener');
    });
  }

  /* ?type=hdb5 preselects a flat, and a project's "want this" link uses it */
  var q = /[?&]type=([a-z0-9]+)/.exec(root.location.search);
  var start = q && P.PLANS[q[1]] ? q[1] : 'hdb4';
  typeInputs.forEach(function (inp) { inp.checked = inp.value === start; });
  setPlan(start, false);

})(window, document);

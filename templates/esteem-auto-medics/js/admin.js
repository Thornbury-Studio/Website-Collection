/* Staff console — job cards over the shared store. Prototype sign-in:
   any staff ID and PIN open the console; real authentication is wired
   at launch, on the client's infrastructure. */

(function () {
  'use strict';

  var TICK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" class="ds-tick" aria-hidden="true"><path d="M4 12.5l5 5L20 6.5"/></svg>';

  var currentId = null;
  var miniMaps = {};

  function text(id, value) {
    var node = document.getElementById(id);
    if (node) node.textContent = value;
  }

  function renderStats() {
    var jobs = EAMStore.all();
    var ppf = 0, claims = 0, ready = 0;
    jobs.forEach(function (j) {
      if (j.service === 'ppf') ppf += 1;
      if (j.service === 'accident') claims += 1;
      if (j.stageIndex === j.stages.length - 1) ready += 1;
    });
    text('stat-total', String(jobs.length));
    text('stat-ppf', String(ppf));
    text('stat-claims', String(claims));
    text('stat-ready', String(ready));
  }

  function renderList() {
    var list = document.getElementById('job-list');
    list.innerHTML = '';
    miniMaps = {};

    EAMStore.all().forEach(function (job) {
      var card = document.createElement('button');
      card.type = 'button';
      card.className = 'job-card' + (job.id === currentId ? ' is-current' : '');
      card.setAttribute('role', 'listitem');

      var plate = document.createElement('span');
      plate.className = 'jc-plate';
      plate.textContent = job.plate;

      var vehicle = document.createElement('span');
      vehicle.className = 'jc-vehicle';
      vehicle.textContent = job.vehicle + ' · ' + job.serviceLabel +
        (job.category ? ' · ' + job.category : '');

      var ready = job.stageIndex === job.stages.length - 1;
      var chip = document.createElement('span');
      chip.className = 'stage-chip jc-stage' + (ready ? ' stage-chip--ready' : '');
      chip.textContent = job.stages[job.stageIndex].label;

      var mapWrap = document.createElement('span');
      mapWrap.className = 'jc-map';

      card.appendChild(plate);
      card.appendChild(vehicle);
      card.appendChild(chip);
      card.appendChild(mapWrap);
      card.addEventListener('click', function () { select(job.id); });
      list.appendChild(card);

      if (window.EAMCoverage) {
        var svg = EAMCoverage.build(mapWrap, {
          mini: true,
          label: 'Work areas for ' + job.plate,
          clipId: 'covclip-list-' + job.id
        });
        EAMCoverage.setStates(svg, EAMCoverage.areaStates(job.areas, ready ? 'on' : 'active'));
        miniMaps[job.id] = svg;
      }
    });
  }

  function renderDetail() {
    var job = EAMStore.get(currentId);
    if (!job) return;

    text('ad-plate', job.plate);
    text('ad-vehicle', job.vehicle);
    text('ad-ref', 'Job ' + job.id + (job.coverage ? ' · ' + job.coverage : ''));
    text('ad-owner', job.customer);
    text('ad-bay', job.bay);
    text('ad-eta', job.eta);
    text('ad-service', job.serviceLabel);
    text('ad-category', job.category || '—');

    var ready = job.stageIndex === job.stages.length - 1;
    var chip = document.getElementById('ad-chip');
    chip.textContent = job.stages[job.stageIndex].label;
    chip.classList.toggle('stage-chip--ready', ready);

    var stages = document.getElementById('ad-stages');
    stages.innerHTML = '';
    job.stages.forEach(function (s, i) {
      var li = document.createElement('li');
      li.className = 'detail-stage' + (s.state === 'done' ? ' is-done' : '') + (s.state === 'active' ? ' is-active' : '');
      var n = document.createElement('span');
      n.className = 'ds-n';
      n.textContent = (i + 1 < 10 ? '0' : '') + (i + 1);
      var label = document.createElement('span');
      label.className = 'ds-label';
      label.textContent = s.label;
      li.appendChild(n);
      li.appendChild(label);
      if (s.state === 'done') li.insertAdjacentHTML('beforeend', TICK);
      stages.appendChild(li);
    });

    var advance = document.getElementById('ad-advance');
    advance.disabled = ready;
    advance.textContent = ready ? 'Job complete' : 'Complete: ' + job.stages[job.stageIndex].label;
  }

  function select(id) {
    currentId = id;
    renderList();
    renderDetail();
  }

  function renderAll() {
    renderStats();
    renderList();
    renderDetail();
  }

  document.addEventListener('DOMContentLoaded', function () {
    var gate = document.getElementById('gate');
    var gateForm = document.getElementById('gate-form');
    var consoleEl = document.getElementById('console');

    gateForm.addEventListener('submit', function (e) {
      e.preventDefault();
      gate.hidden = true;
      consoleEl.classList.add('is-open');
      var jobs = EAMStore.all();
      if (jobs.length) currentId = jobs[0].id;
      renderAll();
    });

    var now = new Date();
    text('console-date', now.toLocaleDateString('en-SG', { weekday: 'short', day: 'numeric', month: 'short' }));

    document.getElementById('ad-advance').addEventListener('click', function () {
      if (currentId) EAMStore.advance(currentId);
    });

    document.getElementById('ad-photos').addEventListener('click', function () {
      if (currentId) EAMStore.addPhotoSet(currentId, 'Progress photos');
    });

    document.getElementById('ad-noteform').addEventListener('submit', function (e) {
      e.preventDefault();
      var field = document.getElementById('ad-note');
      var value = field.value.trim();
      if (currentId && value) {
        EAMStore.addNote(currentId, value);
        field.value = '';
      }
    });

    document.getElementById('console-reset').addEventListener('click', function () {
      EAMStore.reset();
      var jobs = EAMStore.all();
      currentId = jobs.length ? jobs[0].id : null;
      renderAll();
    });

    EAMStore.onChange(function () {
      EAMStore.refresh();
      if (consoleEl.classList.contains('is-open')) renderAll();
    });
  });
}());

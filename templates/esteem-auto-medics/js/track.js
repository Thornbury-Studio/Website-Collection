/* Customer tracker — reads the shared job store and renders one job. */

(function () {
  'use strict';

  var TICK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12.5l5 5L20 6.5"/></svg>';
  var CAM = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="6.5" width="18" height="13" rx="2"/><path d="M8.5 6.5l1.5-2.5h4l1.5 2.5"/><circle cx="12" cy="12.8" r="3.4"/></svg>';

  var current = null;
  var mapSvg = null;

  function text(id, value) {
    var node = document.getElementById(id);
    if (node) node.textContent = value;
  }

  function render(job) {
    current = job;
    var view = document.getElementById('job-view');
    if (!view) return;
    view.classList.add('is-visible');

    text('jv-plate', job.plate);
    text('jv-vehicle', job.vehicle);
    text('jv-ref', 'Job ' + job.id + ' · ' + job.serviceLabel + (job.coverage ? ' · ' + job.coverage : ''));
    text('jv-service', job.serviceLabel);
    text('jv-category', job.category || '—');
    text('jv-bay', job.bay);
    text('jv-eta', job.eta);
    text('jv-owner', job.customer);

    var chip = document.getElementById('jv-chip');
    var active = job.stages[job.stageIndex];
    var ready = job.stageIndex === job.stages.length - 1;
    chip.textContent = active.label;
    chip.classList.toggle('stage-chip--ready', ready);

    var stages = document.getElementById('jv-stages');
    stages.innerHTML = '';
    job.stages.forEach(function (s) {
      var li = document.createElement('li');
      if (s.state === 'done') li.className = 'is-done';
      if (s.state === 'active') li.className = 'is-active';
      var dot = document.createElement('span');
      dot.className = 'tl-dot';
      if (s.state === 'done') dot.innerHTML = TICK;
      var label = document.createElement('span');
      label.className = 'tl-label';
      label.textContent = s.label;
      if (s.state === 'active' && !ready) {
        var when = document.createElement('span');
        when.className = 'tl-when';
        when.textContent = 'In progress';
        label.appendChild(when);
      }
      li.appendChild(dot);
      li.appendChild(label);
      stages.appendChild(li);
    });

    var notes = document.getElementById('jv-notes');
    notes.innerHTML = '';
    job.notes.slice().reverse().forEach(function (n) {
      var li = document.createElement('li');
      li.className = 'note';
      var when = document.createElement('span');
      when.className = 'when';
      when.textContent = EAMStore.noteWhen(n.day);
      var p = document.createElement('p');
      p.textContent = n.text;
      li.appendChild(when);
      li.appendChild(p);
      notes.appendChild(li);
    });

    var photos = document.getElementById('jv-photos');
    photos.innerHTML = '';
    job.photos.forEach(function (ph) {
      var tile = document.createElement('div');
      tile.className = 'photo-set';
      tile.innerHTML = CAM;
      var n = document.createElement('span');
      n.className = 'n';
      n.textContent = ph.label;
      var c = document.createElement('span');
      c.className = 'c';
      c.textContent = ph.count + ' photos · ' + EAMStore.noteWhen(ph.day);
      tile.appendChild(n);
      tile.appendChild(c);
      photos.appendChild(tile);
    });

    var mapMount = document.getElementById('jv-map');
    if (mapMount && window.EAMCoverage) {
      if (!mapSvg) {
        mapSvg = EAMCoverage.build(mapMount, { label: 'Panels included in this job', clipId: 'covclip-track' });
      }
      var mode = ready ? 'on' : 'active';
      EAMCoverage.setStates(mapSvg, EAMCoverage.areaStates(job.areas, mode));
      var cap = document.getElementById('jv-map-cap');
      if (cap) {
        cap.textContent = job.areas.length
          ? (ready ? 'Work complete on the highlighted panels' : 'Work in progress on the highlighted panels')
          : 'No body panels involved in this job';
      }
    }

    var wa = document.getElementById('jv-wa');
    if (wa) {
      wa.href = wa.href.split('?')[0] + '?text=' + encodeURIComponent(
        'Hi Esteem Auto Medics, checking in on ' + job.plate + ' (job ' + job.id + ').'
      );
    }
  }

  function lookupAndRender(q) {
    var err = document.getElementById('lookup-error');
    var job = EAMStore.find(q);
    if (job) {
      err.classList.remove('is-visible');
      render(job);
      document.getElementById('job-view').scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      err.classList.add('is-visible');
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    var form = document.getElementById('lookup-form');
    var input = document.getElementById('lookup-q');
    var samples = document.getElementById('lookup-samples');

    EAMStore.all().forEach(function (job) {
      var chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'sample-chip';
      chip.textContent = job.plate;
      chip.addEventListener('click', function () {
        input.value = job.plate;
        lookupAndRender(job.plate);
      });
      samples.appendChild(chip);
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (input.value.trim()) lookupAndRender(input.value);
    });

    EAMStore.onChange(function () {
      EAMStore.refresh();
      if (current) {
        var fresh = EAMStore.get(current.id);
        if (fresh) render(fresh);
      }
    });
  });
}());

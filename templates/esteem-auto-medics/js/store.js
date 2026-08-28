/* Esteem Auto Medics — shared job store.
   One client-side store powers both the customer tracker (track.html) and the
   staff console (admin.html): advancing a job in the console is immediately
   visible in the tracker. localStorage + a CustomEvent for same-tab updates,
   the native 'storage' event for cross-tab. */

(function () {
  'use strict';

  /* v2: job records carry a vehicle category (Sedan / SUV-MPV / Supercar) and
     a coverage level as separate fields — bumping the key retires any v1 demo
     state still sitting in a reviewer's browser. */
  var KEY = 'eam-jobs-v2';
  var EVT = 'eam:jobs-changed';

  var STAGE_LIBRARY = {
    ppf: [
      { key: 'in',      label: 'Checked in' },
      { key: 'prep',    label: 'Wash & decontamination' },
      { key: 'cut',     label: 'Film cut & fitted' },
      { key: 'cure',    label: 'Curing & edge seal' },
      { key: 'qc',      label: 'Quality check' },
      { key: 'ready',   label: 'Ready for collection' }
    ],
    accident: [
      { key: 'in',      label: 'Checked in' },
      { key: 'assess',  label: 'Damage assessment' },
      { key: 'claim',   label: 'Insurer liaison' },
      { key: 'body',    label: 'Bodywork' },
      { key: 'paint',   label: 'Paint & refinish' },
      { key: 'qc',      label: 'Quality check' },
      { key: 'ready',   label: 'Ready for collection' }
    ],
    spray: [
      { key: 'in',      label: 'Checked in' },
      { key: 'prep',    label: 'Surface prep & masking' },
      { key: 'match',   label: 'Colour matched' },
      { key: 'paint',   label: 'Spray booth' },
      { key: 'bake',    label: 'Bake & polish' },
      { key: 'qc',      label: 'Quality check' },
      { key: 'ready',   label: 'Ready for collection' }
    ],
    service: [
      { key: 'in',      label: 'Checked in' },
      { key: 'inspect', label: 'Inspection' },
      { key: 'work',    label: 'Service work' },
      { key: 'qc',      label: 'Quality check' },
      { key: 'ready',   label: 'Ready for collection' }
    ]
  };

  var SERVICE_LABELS = {
    ppf: 'Paint Protection Film',
    accident: 'Accident Repair & Claim',
    spray: 'Spray Painting',
    service: 'Servicing & Maintenance'
  };

  function daysAgo(n, h) {
    var d = new Date();
    d.setDate(d.getDate() - n);
    d.setHours(h || 10, 24, 0, 0);
    return d.getTime();
  }

  function seedJobs() {
    return [
      {
        id: 'EAM-2608-014',
        plate: 'SGX1234A',
        vehicle: 'BMW 320i · Mineral Grey',
        customer: 'Marcus T.',
        service: 'ppf',
        category: 'Sedan',
        coverage: 'High-impact panels',
        bay: 'Level 1 · Bay 3',
        stageIndex: 2,
        areas: ['bumper-f', 'lamp-l', 'lamp-r', 'bonnet', 'fender-l', 'fender-r', 'mirror-l', 'mirror-r', 'door-l', 'door-r'],
        eta: 'Sat, before noon',
        notes: [
          { day: 2, text: 'Vehicle received, walk-around photos taken with owner.' },
          { day: 1, text: 'Two-stage wash and clay done. Paint inspected under booth light — clean.' },
          { day: 0, text: 'Front bumper and bonnet film cut. Fenders fitting this afternoon.' }
        ],
        photos: [
          { label: 'Arrival walk-around', count: 6, day: 2 },
          { label: 'Paint inspection', count: 4, day: 1 },
          { label: 'Film fitting', count: 3, day: 0 }
        ]
      },
      {
        id: 'EAM-2608-011',
        plate: 'SLK5678B',
        vehicle: 'Toyota Corolla Altis · White',
        customer: 'Priya N.',
        service: 'accident',
        category: 'Sedan',
        coverage: null,
        bay: 'Level 1 · Bay 1',
        stageIndex: 3,
        areas: ['door-l', 'fender-l', 'bumper-f'],
        eta: 'Next Wed',
        notes: [
          { day: 6, text: 'Vehicle towed in. Front-left impact — bumper, fender, door skin.' },
          { day: 5, text: 'Assessment complete, report and photos sent to insurer.' },
          { day: 3, text: 'Claim approved. Parts ordered, panel work started.' },
          { day: 0, text: 'Fender aligned and primed. Door skin arriving tomorrow.' }
        ],
        photos: [
          { label: 'Damage report set', count: 12, day: 6 },
          { label: 'Insurer submission', count: 8, day: 5 },
          { label: 'Panel work', count: 5, day: 0 }
        ]
      },
      {
        id: 'EAM-2608-009',
        plate: 'SMT9012C',
        vehicle: 'Mazda CX-5 · Jet Black',
        customer: 'Daniel W.',
        service: 'spray',
        category: 'SUV / MPV',
        coverage: null,
        bay: 'Level 4 · Booth 2',
        stageIndex: 3,
        areas: ['bonnet', 'roof', 'boot', 'door-l', 'door-r', 'quarter-l', 'quarter-r', 'fender-l', 'fender-r', 'bumper-f', 'bumper-r'],
        eta: 'Mon',
        notes: [
          { day: 4, text: 'Full respray booked — colour code 41W confirmed against door jamb.' },
          { day: 2, text: 'Trim removed, panels sanded and masked.' },
          { day: 0, text: 'Base coat down, clear coat scheduled for this evening.' }
        ],
        photos: [
          { label: 'Colour match card', count: 2, day: 4 },
          { label: 'Prep & masking', count: 7, day: 2 },
          { label: 'In the booth', count: 4, day: 0 }
        ]
      },
      {
        id: 'EAM-2608-017',
        plate: 'SJH3456D',
        vehicle: 'Honda Vezel · Lunar Silver',
        customer: 'Aisyah R.',
        service: 'service',
        category: 'SUV / MPV',
        coverage: null,
        bay: 'Level 1 · Bay 5',
        stageIndex: 3,
        areas: [],
        eta: 'Today, 6pm',
        notes: [
          { day: 0, text: 'In for 60k service. Oil, filters, brake inspection.' },
          { day: 0, text: 'Front pads at 30% — replaced with owner’s go-ahead over WhatsApp.' }
        ],
        photos: [
          { label: 'Brake pad wear', count: 2, day: 0 }
        ]
      },
      {
        id: 'EAM-2608-019',
        plate: 'SPQ7788E',
        vehicle: 'Porsche 718 Cayman · Guards Red',
        customer: 'Terence L.',
        service: 'ppf',
        category: 'Supercar / Performance',
        coverage: 'Full body',
        bay: 'Level 1 · Bay 2',
        stageIndex: 1,
        areas: ['bumper-f', 'lamp-l', 'lamp-r', 'mirror-l', 'mirror-r', 'bonnet',
                'fender-l', 'fender-r', 'door-l', 'door-r', 'roof', 'quarter-l',
                'quarter-r', 'boot', 'bumper-r'],
        eta: 'Next Fri',
        notes: [
          { day: 1, text: 'Received for full-body film. Front splitter and side intakes photographed before any work.' },
          { day: 0, text: 'Decontamination wash done. Paint reading taken across every panel before film goes on.' }
        ],
        photos: [
          { label: 'Arrival walk-around', count: 9, day: 1 },
          { label: 'Paint depth readings', count: 5, day: 0 }
        ]
      }
    ];
  }

  function inflate(raw) {
    return raw.map(function (j) {
      var lib = STAGE_LIBRARY[j.service];
      j.serviceLabel = SERVICE_LABELS[j.service];
      j.stages = lib.map(function (s, i) {
        return {
          key: s.key,
          label: s.label,
          state: i < j.stageIndex ? 'done' : (i === j.stageIndex ? 'active' : 'todo')
        };
      });
      return j;
    });
  }

  function load() {
    try {
      // Drop the v1 blob so a reviewer's browser isn't carrying dead demo state.
      localStorage.removeItem('eam-jobs-v1');
    } catch (e) { /* storage unavailable */ }
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) return inflate(parsed);
      }
    } catch (e) { /* storage unavailable — fall through to seeds */ }
    return inflate(seedJobs());
  }

  function persist(jobs) {
    var slim = jobs.map(function (j) {
      var copy = {};
      Object.keys(j).forEach(function (k) {
        if (k !== 'stages' && k !== 'serviceLabel') copy[k] = j[k];
      });
      return copy;
    });
    try { localStorage.setItem(KEY, JSON.stringify(slim)); } catch (e) { /* demo still works in-memory */ }
    document.dispatchEvent(new CustomEvent(EVT));
  }

  var jobs = load();

  window.EAMStore = {
    stageLibrary: STAGE_LIBRARY,
    serviceLabels: SERVICE_LABELS,

    all: function () { return jobs; },

    find: function (q) {
      if (!q) return null;
      var needle = String(q).replace(/[\s-]/g, '').toUpperCase();
      for (var i = 0; i < jobs.length; i += 1) {
        var j = jobs[i];
        if (j.plate.replace(/\s/g, '').toUpperCase() === needle) return j;
        if (j.id.replace(/-/g, '').toUpperCase() === needle) return j;
      }
      return null;
    },

    advance: function (id) {
      var j = null;
      for (var i = 0; i < jobs.length; i += 1) if (jobs[i].id === id) j = jobs[i];
      if (!j) return null;
      var max = STAGE_LIBRARY[j.service].length - 1;
      if (j.stageIndex < max) {
        j.stageIndex += 1;
        jobs = inflate(jobs.map(function (x) { return x; }));
        persist(jobs);
      }
      return this.get(id);
    },

    addNote: function (id, text) {
      if (!text) return;
      for (var i = 0; i < jobs.length; i += 1) {
        if (jobs[i].id === id) {
          jobs[i].notes.push({ day: 0, text: text });
          persist(jobs);
          return;
        }
      }
    },

    addPhotoSet: function (id, label) {
      for (var i = 0; i < jobs.length; i += 1) {
        if (jobs[i].id === id) {
          jobs[i].photos.push({ label: label || 'Progress photos', count: 1 + Math.floor(Math.random() * 5), day: 0 });
          persist(jobs);
          return;
        }
      }
    },

    get: function (id) {
      for (var i = 0; i < jobs.length; i += 1) if (jobs[i].id === id) return jobs[i];
      return null;
    },

    reset: function () {
      try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
      jobs = inflate(seedJobs());
      document.dispatchEvent(new CustomEvent(EVT));
    },

    noteWhen: function (day) {
      if (day === 0) return 'Today';
      if (day === 1) return 'Yesterday';
      return day + ' days ago';
    },

    onChange: function (fn) {
      document.addEventListener(EVT, fn);
      window.addEventListener('storage', function (e) {
        if (e.key === KEY) { jobs = load(); fn(); }
      });
    },

    refresh: function () { jobs = load(); }
  };
}());

/* ============================================================================
   OSCILLA — the range, and the basket
   ----------------------------------------------------------------------------
   One source of truth for every page. The basket lives in localStorage so it
   survives navigation, and every page that shows a count listens to the same
   event.
   ========================================================================== */
(function (root) {
  'use strict';

  var KEY = 'oscilla.basket.v1';

  /* -- the range -----------------------------------------------------------
     `voice` describes what the on-page demo does when this instrument is
     being played, so the audio panel can reconfigure itself per product
     rather than sounding identical everywhere.                              */
  var ITEMS = [
    {
      id: 'field', code: 'OS-1', name: 'Field', kind: 'instrument',
      role: 'The voice',
      price: 1290, weight: '1.9 kg', size: '244 × 168 × 52 mm',
      img: 'i-field.webp',
      alt: 'The Field desktop synthesizer: a charcoal anodised panel with two columns of knobs, a row of amber buttons and two faders, oak end cheeks.',
      line: 'Two oscillators that never quite agree, a filter with a temper, and an envelope fast enough to bite.',
      body: 'Field is the instrument the other three were designed around. Two analogue-voiced oscillators sit a few cents apart and drift as they warm, which is the whole reason it sounds alive rather than correct. The filter is a four-pole lowpass with enough resonance to sing on its own, and the envelope will go from a click to a slow swell without ever sounding stepped.',
      specs: [
        ['Voices', 'Monophonic, with legato and glide'],
        ['Oscillators', 'Two, plus a sine sub an octave down'],
        ['Filter', '4-pole lowpass, resonant to self-oscillation'],
        ['Envelope', 'ADSR, 1.2 ms to 12 s'],
        ['Connections', 'Line out, headphone, MIDI in/thru, clock in'],
        ['Panel', 'Anodised aluminium, oak cheeks']
      ],
      voice: { wave: 'sawtooth', cutoff: 1400, resonance: 6, detune: 8, sub: 0.35 }
    },
    {
      id: 'tide', code: 'OS-2', name: 'Tide', kind: 'instrument',
      role: 'Filter & delay',
      price: 640, weight: '0.9 kg', size: '128 × 168 × 52 mm',
      img: 'i-tide.webp',
      alt: 'The Tide effects unit: four large knobs in a row on a charcoal panel with a single fader and oak cheeks.',
      line: 'A filter you can play and a delay that darkens as it dies. Put anything through it and it will sound like it belongs here.',
      body: 'Tide is four knobs because it only needs four. The filter tracks whatever you feed it, the delay damps its own repeats so they fall away rather than pile up, and the feedback path will run away if you ask it to — deliberately, and musically, because a delay that cannot be pushed is only a plugin.',
      specs: [
        ['Filter', 'Lowpass with cutoff and resonance, playable'],
        ['Delay', '20 ms to 2 s, damped feedback path'],
        ['Feedback', 'Runs to self-oscillation'],
        ['Connections', 'Stereo in/out, expression pedal, clock in'],
        ['Panel', 'Anodised aluminium, oak cheeks']
      ],
      voice: { wave: 'square', cutoff: 700, resonance: 12, detune: 4, sub: 0.2, delayTime: 0.34, feedback: 0.52, mix: 0.5 }
    },
    {
      id: 'dusk', code: 'OS-3', name: 'Dusk', kind: 'instrument',
      role: 'Percussion',
      price: 890, weight: '1.4 kg', size: '212 × 168 × 52 mm',
      img: 'i-dusk.webp',
      alt: 'The Dusk drum instrument: a grid of small knobs above six round rubber trigger pads on a charcoal panel with oak cheeks.',
      line: 'Six voices, none of them sampled. Hit a pad and something is actually being made.',
      body: 'Dusk builds its drums the hard way — oscillators, noise and envelopes, tuned by hand — so nothing sounds like a library and everything can be pushed somewhere strange. The pads are velocity sensitive across their whole range, which matters more on a kick than anyone expects until they play one.',
      specs: [
        ['Voices', 'Six, synthesised, no samples'],
        ['Pads', 'Velocity sensitive, pressure on the top two'],
        ['Per voice', 'Tune, decay, colour, level'],
        ['Connections', 'Mix out, two individual outs, clock in/out'],
        ['Panel', 'Anodised aluminium, oak cheeks']
      ],
      voice: { wave: 'triangle', cutoff: 2600, resonance: 3, detune: 2, sub: 0.6, attack: 0.002, decay: 0.11, sustain: 0.05, release: 0.12 }
    },
    {
      id: 'north', code: 'OS-4', name: 'North', kind: 'instrument',
      role: 'Sequencer',
      price: 720, weight: '1.1 kg', size: '212 × 168 × 52 mm',
      img: 'i-north.webp',
      alt: 'The North step sequencer: sixteen amber-lit square buttons in a row beneath eight small knobs, on a charcoal panel with oak cheeks.',
      line: 'Sixteen steps that hold their nerve. Clock everything else on the bench and let it run for an hour.',
      body: 'North keeps time for the rest of the range. Sixteen steps, four patterns chained or not, a swing control that goes far enough to be wrong, and a probability knob per step so a pattern can breathe instead of repeating. It clocks out to everything here and to whatever else is on your desk.',
      specs: [
        ['Steps', '16, four chainable patterns'],
        ['Per step', 'Pitch, gate length, probability, ratchet'],
        ['Swing', '50% to 75%'],
        ['Connections', 'Clock out ×2, reset, MIDI out, analogue gate/pitch'],
        ['Panel', 'Anodised aluminium, oak cheeks']
      ],
      voice: { wave: 'sawtooth', cutoff: 1800, resonance: 8, detune: 12, sub: 0.25 }
    },

    /* accessories — no photography, shown as typographic rows */
    { id: 'cables', code: 'AC-1', name: 'Patch cables', kind: 'accessory', price: 28,
      line: 'Ten, 30 cm, in the four panel colours. Woven, and stiff enough to stay where you put them.', img: null },
    { id: 'case', code: 'AC-2', name: 'Bench case', kind: 'accessory', price: 180,
      line: 'Waxed canvas over a moulded shell. Holds any two instruments, cables and a small interface.', img: null },
    { id: 'psu', code: 'AC-3', name: 'Spare supply', kind: 'accessory', price: 45,
      line: 'The same quiet linear supply that ships in the box. Worth having a second.', img: null }
  ];

  /* Buy the four together and one of them is effectively half price. The
     saving is derived from the catalogue, never typed in, so editing a price
     above cannot leave the promise on the page lying. */
  var BUNDLE_IDS = ['field', 'tide', 'dusk', 'north'];
  var BUNDLE_OFF = 0.12;

  function byId(id) {
    for (var i = 0; i < ITEMS.length; i++) if (ITEMS[i].id === id) return ITEMS[i];
    return null;
  }
  function instruments() { return ITEMS.filter(function (i) { return i.kind === 'instrument'; }); }
  function accessories() { return ITEMS.filter(function (i) { return i.kind === 'accessory'; }); }

  function money(n) {
    return '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function bundleFull() {
    return BUNDLE_IDS.reduce(function (s, id) { return s + byId(id).price; }, 0);
  }
  function bundlePrice() { return Math.round(bundleFull() * (1 - BUNDLE_OFF)); }

  /* -- basket --------------------------------------------------------------- */
  function read() {
    try {
      var raw = JSON.parse(localStorage.getItem(KEY) || '[]');
      return Array.isArray(raw) ? raw.filter(function (l) {
        return l && typeof l.id === 'string' && typeof l.qty === 'number' && l.qty > 0 && byId(l.id);
      }) : [];
    } catch (e) { return []; }
  }
  function write(lines) {
    try { localStorage.setItem(KEY, JSON.stringify(lines)); } catch (e) {}
    emit(lines);
  }
  function emit(lines) {
    document.dispatchEvent(new CustomEvent('oscilla:basket', {
      detail: {
        lines: lines, count: count(lines), subtotal: subtotal(lines),
        bundles: bundlesIn(lines), discount: discount(lines), total: total(lines)
      }
    }));
  }
  function count(lines) {
    return (lines || read()).reduce(function (n, l) { return n + l.qty; }, 0);
  }
  function subtotal(lines) {
    return (lines || read()).reduce(function (n, l) {
      var it = byId(l.id); return n + (it ? it.price * l.qty : 0);
    }, 0);
  }
  /* One of each of the four instruments is a bundle; two of each is two. */
  function bundlesIn(lines) {
    lines = lines || read();
    var q = {};
    lines.forEach(function (l) { q[l.id] = (q[l.id] || 0) + l.qty; });
    return Math.min.apply(null, BUNDLE_IDS.map(function (id) { return q[id] || 0; }));
  }
  function discount(lines) {
    lines = lines || read();
    return Math.round(bundlesIn(lines) * bundleFull() * BUNDLE_OFF * 100) / 100;
  }
  function total(lines) {
    lines = lines || read();
    return Math.max(0, subtotal(lines) - discount(lines));
  }

  function add(id, qty) {
    if (!byId(id)) return;
    qty = qty || 1;
    var lines = read(), found = false;
    for (var i = 0; i < lines.length; i++) {
      if (lines[i].id === id) { lines[i].qty = Math.min(9, lines[i].qty + qty); found = true; break; }
    }
    if (!found) lines.push({ id: id, qty: Math.min(9, qty) });
    write(lines);
  }
  function setQty(id, qty) {
    var lines = read();
    for (var i = 0; i < lines.length; i++) {
      if (lines[i].id === id) {
        if (qty <= 0) lines.splice(i, 1); else lines[i].qty = Math.min(9, qty);
        break;
      }
    }
    write(lines);
  }
  function addBundle() { BUNDLE_IDS.forEach(function (id) { add(id, 1); }); }

  root.OSCILLA = {
    items: ITEMS, byId: byId, instruments: instruments, accessories: accessories,
    money: money, bundleIds: BUNDLE_IDS, bundleOff: BUNDLE_OFF,
    bundleFull: bundleFull, bundlePrice: bundlePrice,
    basket: {
      read: read, add: add, setQty: setQty, addBundle: addBundle,
      remove: function (id) { setQty(id, 0); },
      clear: function () { write([]); },
      count: count, subtotal: subtotal, bundlesIn: bundlesIn,
      discount: discount, total: total,
      emit: function () { emit(read()); }
    }
  };
})(window);

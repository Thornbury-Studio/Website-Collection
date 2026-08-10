/* ============================================================================
   HOTLINE — catalogue + bag
   ----------------------------------------------------------------------------
   One source of truth for every page. The bag lives in localStorage so it
   survives navigation between index / menu / order, and every page that shows
   a bag count subscribes to the same change event.
   ========================================================================== */
(function (root) {
  'use strict';

  var KEY = 'hotline.bag.v1';

  /* -- catalogue ----------------------------------------------------------
     `heat` is the house scale, 0–5. Items with no `img` are shown as
     typographic rows rather than photo cards — the photography budget goes to
     the things people actually choose by looking.                          */
  var ITEMS = [
    { id: 'b01', no: '01', cat: 'bird',   name: 'The Hotline',     desc: 'Thigh, buttermilk-brined overnight, dredged twice, gochujang glaze and toasted sesame.', price: 12.50, heat: 4, img: 'p-hotline.webp',  alt: 'Glazed fried chicken pieces in a dark cast-iron pan, lacquered deep red and scattered with sesame.', tags: ['Signature'] },
    { id: 'b02', no: '02', cat: 'bird',   name: 'Half Bird',       desc: 'Half a bird, soy-garlic lacquer, pickled radish and a cold plate of kimchi.',              price: 16.00, heat: 2, img: 'p-halfbird.webp', alt: 'A white plate of soy-glazed fried chicken seen from above, with kimchi and pickled radish alongside.', tags: ['To share'] },
    { id: 'b03', no: '03', cat: 'bird',   name: 'Popcorn',         desc: 'Bite-size, honey butter, flaked salt. The one you eat walking.',                            price: 8.50,  heat: 1, img: 'p-popcorn.webp',  alt: 'A stacked tower of golden popcorn chicken beside a small pot of dipping sauce.', tags: [] },

    { id: 's04', no: '04', cat: 'stacks', name: 'The Double',      desc: 'Two smashed patties, American cheese, pickles, house sauce, sesame bun.',                   price: 14.00, heat: 2, img: 'p-classic.webp',  alt: 'A double cheeseburger on a sesame bun photographed against black, its reflection below.', tags: ['Signature'] },
    { id: 's05', no: '05', cat: 'stacks', name: 'Smoke Stack',     desc: 'Slow-smoked shoulder, aged cheddar, burnt-onion jam, brioche.',                             price: 15.50, heat: 3, img: 'p-smoke.webp',    alt: 'A tall burger on a wooden board in low light, cheese melting over the edge.', tags: [] },
    { id: 's06', no: '06', cat: 'stacks', name: 'The Late One',    desc: 'Bacon, molten cheese, crisp onion, black-pepper mayo. Built for 2am.',                      price: 15.00, heat: 3, img: 'p-late.webp',     alt: 'A close crop of a bacon cheeseburger, cheese pooling over a charred patty.', tags: ['After 11'] },

    { id: 'f07', no: '07', cat: 'fries',  name: 'House Fries',     desc: 'Twice-cooked, rosemary salt, served in the paper.',                                        price: 5.00,  heat: 0, img: 'p-fries.webp',    alt: 'Golden fries on a wooden board with a dark pot of ketchup, shot on slate.', tags: [] },
    { id: 'f08', no: '08', cat: 'fries',  name: 'Loaded Fries',    desc: 'Cheese sauce, scallion, chilli crisp, crumbled crackling.',                                price: 8.00,  heat: 3, img: null,              alt: null, tags: [] },
    { id: 'f09', no: '09', cat: 'fries',  name: 'Slaw',            desc: 'White cabbage, rice vinegar, black sesame. Cuts everything.',                              price: 4.00,  heat: 0, img: null,              alt: null, tags: [] },

    { id: 'd10', no: '10', cat: 'dips',   name: 'House Mayo',      desc: 'Garlic, lemon, a lot of black pepper.',                                                    price: 1.20,  heat: 0, img: null, alt: null, tags: [] },
    { id: 'd11', no: '11', cat: 'dips',   name: 'Smoked Ketchup',  desc: 'Tomato, smoked paprika, brown sugar.',                                                     price: 1.20,  heat: 1, img: null, alt: null, tags: [] },
    { id: 'd12', no: '12', cat: 'dips',   name: 'Fire Sauce',      desc: 'The whole point of the name. Ask for it on the side first.',                               price: 1.50,  heat: 5, img: null, alt: null, tags: ['Hottest'] },
    { id: 'd13', no: '13', cat: 'dips',   name: 'Blue Cheese',     desc: 'Cold, thick, for the wings.',                                                              price: 1.50,  heat: 0, img: null, alt: null, tags: [] },

    { id: 'k14', no: '14', cat: 'drinks', name: 'Fountain Soda',   desc: 'Free refills before midnight.',                                                            price: 3.00,  heat: 0, img: null, alt: null, tags: [] },
    { id: 'k15', no: '15', cat: 'drinks', name: 'Yuzu Lemonade',   desc: 'Sharp, cold, house-pressed.',                                                              price: 4.20,  heat: 0, img: null, alt: null, tags: [] },
    { id: 'k16', no: '16', cat: 'drinks', name: 'Soft Serve Shake',desc: 'Vanilla, malt, thick enough to stand a spoon in.',                                         price: 6.00,  heat: 0, img: null, alt: null, tags: [] },
    { id: 'k17', no: '17', cat: 'drinks', name: 'Black Coffee',    desc: 'Because it is 3am and you are driving.',                                                   price: 3.20,  heat: 0, img: null, alt: null, tags: [] }
  ];

  var CATS = [
    { id: 'all',    label: 'Everything' },
    { id: 'bird',   label: 'Bird' },
    { id: 'stacks', label: 'Stacks' },
    { id: 'fries',  label: 'Fries & Sides' },
    { id: 'dips',   label: 'Dips' },
    { id: 'drinks', label: 'Drinks' }
  ];

  /* The box: one main + one side + one dip + one drink, three dollars off the
     sum of the parts. The saving is computed, never hardcoded, so editing a
     price above can't leave the promise on the page lying. */
  var BOX_DISCOUNT = 3.00;

  function byId(id) {
    for (var i = 0; i < ITEMS.length; i++) if (ITEMS[i].id === id) return ITEMS[i];
    return null;
  }

  function inCat(cat) {
    return ITEMS.filter(function (it) { return cat === 'all' || it.cat === cat; });
  }

  function money(n) {
    return '$' + n.toFixed(2);
  }

  /* -- bag ---------------------------------------------------------------- */

  function read() {
    try {
      var raw = localStorage.getItem(KEY);
      var parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.filter(function (l) {
        return l && typeof l.id === 'string' && typeof l.qty === 'number' && l.qty > 0 && byId(l.id);
      }) : [];
    } catch (e) {
      return [];   // private mode, quota, corrupt value — an empty bag is the safe read
    }
  }

  function write(lines) {
    try { localStorage.setItem(KEY, JSON.stringify(lines)); } catch (e) { /* non-fatal */ }
    emit(lines);
  }

  function emit(lines) {
    document.dispatchEvent(new CustomEvent('hotline:bag', {
      detail: {
        lines: lines,
        count: count(lines),
        total: total(lines),
        boxes: boxesIn(lines),
        discount: discount(lines),
        payable: payable(lines)
      }
    }));
  }

  function count(lines) {
    return (lines || read()).reduce(function (n, l) { return n + l.qty; }, 0);
  }

  function total(lines) {
    return (lines || read()).reduce(function (n, l) {
      var it = byId(l.id);
      return n + (it ? it.price * l.qty : 0);
    }, 0);
  }

  /* How many complete boxes the bag contains: one main (bird or stack), one
     side, one dip and one drink make a box. Counting it this way means the
     saving the box builder promises is the same saving the checkout applies,
     however the items actually got into the bag. */
  function boxesIn(lines) {
    var n = { main: 0, fries: 0, dips: 0, drinks: 0 };
    (lines || read()).forEach(function (l) {
      var it = byId(l.id);
      if (!it) return;
      if (it.cat === 'bird' || it.cat === 'stacks') n.main += l.qty;
      else if (n[it.cat] !== undefined) n[it.cat] += l.qty;
    });
    return Math.min(n.main, n.fries, n.dips, n.drinks);
  }

  function discount(lines) { return boxesIn(lines) * BOX_DISCOUNT; }

  function payable(lines) {
    lines = lines || read();
    return Math.max(0, total(lines) - discount(lines));
  }

  function add(id, qty) {
    qty = qty || 1;
    if (!byId(id)) return;
    var lines = read(), found = false;
    for (var i = 0; i < lines.length; i++) {
      if (lines[i].id === id) { lines[i].qty = Math.min(99, lines[i].qty + qty); found = true; break; }
    }
    if (!found) lines.push({ id: id, qty: Math.min(99, qty) });
    write(lines);
  }

  function setQty(id, qty) {
    var lines = read();
    for (var i = 0; i < lines.length; i++) {
      if (lines[i].id === id) {
        if (qty <= 0) lines.splice(i, 1); else lines[i].qty = Math.min(99, qty);
        break;
      }
    }
    write(lines);
  }

  function remove(id) { setQty(id, 0); }
  function clear() { write([]); }

  /* -- trading hours ------------------------------------------------------
     Open 17:00 → 04:00 the next morning. Everything downstream (the status
     pip, the last-orders countdown) reads from this one function so the page
     can never claim to be open and closed at the same time.               */
  var OPEN_HOUR = 17, CLOSE_HOUR = 4;

  function service(now) {
    now = now || new Date();
    var h = now.getHours();
    var open = (h >= OPEN_HOUR) || (h < CLOSE_HOUR);
    var close = new Date(now);
    if (open) {
      // next 04:00
      if (h >= OPEN_HOUR) close.setDate(close.getDate() + 1);
      close.setHours(CLOSE_HOUR, 0, 0, 0);
    } else {
      close.setHours(OPEN_HOUR, 0, 0, 0);   // next opening
    }
    return { open: open, until: close, ms: close - now };
  }

  root.HOTLINE = {
    items: ITEMS, cats: CATS, byId: byId, inCat: inCat, money: money,
    boxDiscount: BOX_DISCOUNT,
    bag: {
      read: read, add: add, setQty: setQty, remove: remove, clear: clear,
      count: count, total: total,
      boxesIn: boxesIn, discount: discount, payable: payable,
      emit: function () { emit(read()); }
    },
    service: service
  };
})(window);

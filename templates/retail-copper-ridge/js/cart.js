/* Shared cart — localStorage key cr.cart.v1 */

(function (global) {
  'use strict';

  var LS_KEY = 'cr.cart.v1';
  var AGE_KEY = 'cr.age.ok';

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function money(cents) {
    return '$' + (cents / 100).toFixed(2);
  }

  function loadCart() {
    try {
      var arr = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }

  function saveCart(items) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(items)); } catch (e) { /* private */ }
  }

  function catalogById(id) {
    return (global.CR_CATALOG || []).find(function (p) { return p.id === id; });
  }

  function cartCount(items) {
    return items.reduce(function (s, l) { return s + l.qty; }, 0);
  }

  function cartGoods(items) {
    return items.reduce(function (s, l) { return s + l.unit * l.qty; }, 0);
  }

  function maxWeightClass(items) {
    var max = 1;
    items.forEach(function (l) {
      var p = catalogById(l.id);
      if (p && p.weightClass > max) max = p.weightClass;
    });
    return max;
  }

  function shippingCost(items, goods) {
    var ship = global.CR_SHIP;
    if (!ship || !items.length) return 0;
    if (goods >= ship.freeGroundOver) return 0;
    var cls = maxWeightClass(items);
    return ship.rates[cls] || ship.rates[2];
  }

  function hazmatFee(items) {
    var ship = global.CR_SHIP;
    if (!ship || !ship.hazmatFee) return 0;
    return hasHazmat(items) ? ship.hazmatFee : 0;
  }

  function hasHazmat(items) {
    return items.some(function (l) {
      var p = catalogById(l.id);
      return p && p.hazmat;
    });
  }

  function addToCart(id, qty) {
    qty = Math.max(1, parseInt(qty, 10) || 1);
    var p = catalogById(id);
    if (!p || p.stock === 'out') return false;
    var items = loadCart();
    var line = items.find(function (l) { return l.id === id; });
    if (line) line.qty += qty;
    else {
      items.push({
        id: p.id,
        name: p.name,
        sku: p.sku,
        unit: p.price,
        qty: qty,
        img: p.img
      });
    }
    saveCart(items);
    return true;
  }

  function setQty(id, qty) {
    qty = parseInt(qty, 10) || 0;
    var items = loadCart().filter(function (l) {
      if (l.id !== id) return true;
      if (qty <= 0) return false;
      l.qty = qty;
      return true;
    });
    saveCart(items);
  }

  function removeLine(id) {
    saveCart(loadCart().filter(function (l) { return l.id !== id; }));
  }

  function clearCart() { saveCart([]); }

  function canShipToState(state, items) {
    var ship = global.CR_SHIP;
    if (!ship || !state) return { ok: true };
    state = String(state).toUpperCase();
    var haz = hasHazmat(items);
    if (haz && ship.blockedAmmo.indexOf(state) !== -1) {
      return { ok: false, msg: ship.copy.blocked };
    }
    for (var i = 0; i < items.length; i++) {
      var p = catalogById(items[i].id);
      if (p && p.restrictions && p.restrictions.indexOf(state) !== -1) {
        return { ok: false, msg: ship.copy.productBlocked + ' (' + p.name + ')' };
      }
    }
    return { ok: true };
  }

  function purgeBlockedForState(state) {
    state = String(state || '').toUpperCase();
    if (!state) return { removed: [], items: loadCart() };
    var ship = global.CR_SHIP;
    var removed = [];
    var kept = loadCart().filter(function (l) {
      var p = catalogById(l.id);
      if (!p) return true;
      if (p.hazmat && ship && ship.blockedAmmo.indexOf(state) !== -1) {
        removed.push(l.name);
        return false;
      }
      if (p.restrictions && p.restrictions.indexOf(state) !== -1) {
        removed.push(l.name);
        return false;
      }
      return true;
    });
    saveCart(kept);
    return { removed: removed, items: kept };
  }

  global.CR = {
    esc: esc,
    money: money,
    loadCart: loadCart,
    saveCart: saveCart,
    addToCart: addToCart,
    setQty: setQty,
    removeLine: removeLine,
    clearCart: clearCart,
    cartCount: cartCount,
    cartGoods: cartGoods,
    shippingCost: shippingCost,
    hazmatFee: hazmatFee,
    hasHazmat: hasHazmat,
    canShipToState: canShipToState,
    purgeBlockedForState: purgeBlockedForState,
    catalogById: catalogById,
    AGE_KEY: AGE_KEY,
    LS_KEY: LS_KEY
  };
})(window);

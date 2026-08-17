/* ============================================================
   OVERCAST — store.js
   Shared across every page: the catalogue, the cart (persisted to
   localStorage so a bag survives navigation), the drawer, the
   header behaviour, reveals and the toast.
   Vanilla, no dependencies. Every page-specific block is guarded.
   ============================================================ */

window.OC = (function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------------- catalogue ---------------- */

  var CATALOGUE = {
    overshirt: { name: 'Haar Overshirt',        cat: 'Outerwear',   fabric: 'Waxed cotton',      price: 245, img: 'img/p-overshirt.webp', sizes: { XS: 1, S: 1, M: 1, L: 1, XL: 0 } },
    jacket:    { name: 'Drizzle Quilted Jacket', cat: 'Outerwear',  fabric: 'Recycled ripstop',  price: 310, img: 'img/p-jacket.webp',    sizes: { XS: 0, S: 1, M: 1, L: 1, XL: 1 } },
    cableknit: { name: 'Nimbus Cable Knit',     cat: 'Knitwear',    fabric: 'Merino lambswool',  price: 185, img: 'img/p-cableknit.webp', sizes: { XS: 1, S: 1, M: 0, L: 1, XL: 1 } },
    crew:      { name: 'Ashfield Crew',         cat: 'Knitwear',    fabric: 'Geelong lambswool', price: 155, img: 'img/p-crew.webp',      sizes: { XS: 1, S: 1, M: 1, L: 1, XL: 1 } },
    shirt:     { name: 'Gloaming Shirt',        cat: 'Shirting',    fabric: 'Brushed cotton',    price: 135, img: 'img/p-shirt.webp',     sizes: { XS: 1, S: 1, M: 1, L: 0, XL: 0 } },
    trouser:   { name: 'Slate Pleated Trouser', cat: 'Trousers',    fabric: 'Wool hopsack',      price: 175, img: 'img/p-trouser.webp',   sizes: { XS: 1, S: 1, M: 1, L: 1, XL: 1 } },
    scarf:     { name: 'Haar Scarf',            cat: 'Accessories', fabric: 'Lambswool',         price: 85,  img: 'img/p-scarf.webp',     sizes: { OS: 1 } },
    cap:       { name: 'Fieldcap',              cat: 'Accessories', fabric: 'Boiled wool',       price: 65,  img: 'img/p-cap.webp',       sizes: { OS: 1 } }
  };

  var FREE_SHIP = 150;
  var KEY = 'overcast.bag.v1';

  /* ---------------- cart state ---------------- */

  var bag = [];
  try { bag = JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { bag = []; }
  if (!Array.isArray(bag)) bag = [];

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(bag)); } catch (e) { /* private mode: bag stays in memory */ }
  }
  function count() { return bag.reduce(function (n, l) { return n + l.qty; }, 0); }
  function subtotal() {
    return bag.reduce(function (n, l) {
      var p = CATALOGUE[l.id]; return n + (p ? p.price * l.qty : 0);
    }, 0);
  }
  function money(n) { return '$' + n.toLocaleString('en-US'); }

  /* ---------------- drawer render ---------------- */

  function render() {
    var badge = $('#cartCount');
    if (badge) {
      var c = count();
      badge.textContent = c;
      badge.classList.toggle('on', c > 0);
    }

    var body = $('#cartBody');
    if (!body) return;

    if (!bag.length) {
      body.innerHTML =
        '<div class="cart-empty"><p>Your bag is empty.</p>' +
        '<a class="btn btn-block" href="shop.html"><span>Browse the collection</span></a></div>';
    } else {
      body.innerHTML = bag.map(function (l, i) {
        var p = CATALOGUE[l.id];
        if (!p) return '';
        return '<div class="ci">' +
          '<img src="' + p.img + '" alt="" width="74" height="99">' +
          '<div><div class="ci-top"><span class="ci-name">' + p.name + '</span>' +
          '<span class="ci-price">' + money(p.price * l.qty) + '</span></div>' +
          '<div class="ci-meta">' + p.fabric + ' &middot; Size ' + l.size + '</div>' +
          '<div class="ci-foot"><span class="qty">' +
          '<button type="button" data-dec="' + i + '" aria-label="Decrease quantity">&minus;</button>' +
          '<span>' + l.qty + '</span>' +
          '<button type="button" data-inc="' + i + '" aria-label="Increase quantity">+</button>' +
          '</span><button type="button" class="ci-rm" data-rm="' + i + '">Remove</button></div></div></div>';
      }).join('');
    }

    var sub = subtotal();
    var subEl = $('#cartSub'); if (subEl) subEl.textContent = money(sub);
    var totEl = $('#cartTotal'); if (totEl) totEl.textContent = money(sub);

    var fill = $('#shipFill'), note = $('#shipNote');
    if (fill && note) {
      var p = Math.min(sub / FREE_SHIP, 1);
      fill.style.transform = 'scaleX(' + p.toFixed(3) + ')';
      note.innerHTML = sub >= FREE_SHIP
        ? 'Complimentary shipping <b>unlocked</b>.'
        : '<b>' + money(FREE_SHIP - sub) + '</b> away from complimentary shipping.';
    }
  }

  /* ---------------- toast ---------------- */

  var toastTimer = null;
  function toast(msg) {
    var t = $('#toast');
    if (!t) return;
    $('#toastMsg').textContent = msg;
    t.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('on'); }, 2800);
  }

  /* ---------------- public actions ---------------- */

  function add(id, size, opts) {
    var p = CATALOGUE[id];
    if (!p) return;
    var line = bag.filter(function (l) { return l.id === id && l.size === size; })[0];
    if (line) line.qty++; else bag.push({ id: id, size: size, qty: 1 });
    save(); render();
    if (opts && opts.open) openCart();
    else toast(p.name + ' · ' + size + ' added to bag');
  }

  function openCart() {
    var c = $('#cart'), s = $('#scrim');
    if (!c) return;
    c.classList.add('on'); s.classList.add('on');
    document.body.classList.add('no-scroll');
    c.setAttribute('aria-hidden', 'false');
    var close = $('#cartClose'); if (close) close.focus();
  }
  function closeCart() {
    var c = $('#cart'), s = $('#scrim');
    if (!c) return;
    c.classList.remove('on'); s.classList.remove('on');
    document.body.classList.remove('no-scroll');
    c.setAttribute('aria-hidden', 'true');
  }

  /* ---------------- wiring ---------------- */

  function init() {
    render();

    // cart open/close
    var open = $('#cartBtn'); if (open) open.addEventListener('click', openCart);
    var close = $('#cartClose'); if (close) close.addEventListener('click', closeCart);
    var scrim = $('#scrim'); if (scrim) scrim.addEventListener('click', function () { closeCart(); closeNav(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { closeCart(); closeNav(); }
    });

    // quantity + remove, delegated
    var body = $('#cartBody');
    if (body) body.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var i;
      if ((i = b.getAttribute('data-inc')) !== null) { bag[+i].qty++; }
      else if ((i = b.getAttribute('data-dec')) !== null) { if (--bag[+i].qty < 1) bag.splice(+i, 1); }
      else if ((i = b.getAttribute('data-rm')) !== null) { bag.splice(+i, 1); }
      else return;
      save(); render();
    });

    // quick-add on cards, delegated across the whole page
    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-add]');
      if (!b || b.disabled) return;
      /* On the shop grid these size buttons sit inside the card's
         <a href="product.html">, so without this the click carries on to the
         anchor: the size is added to the bag and the visitor is navigated away
         from the grid in the same gesture, which reads as the quick-add being
         broken. Stop the click here — picking a size is the whole action. */
      e.preventDefault();
      e.stopPropagation();
      add(b.getAttribute('data-add'), b.getAttribute('data-size'), { open: false });
    });

    // demo checkout
    var co = $('#checkout');
    if (co) co.addEventListener('click', function () {
      if (!bag.length) return;
      toast('This is a demo storefront — no payment is taken.');
    });

    /* header: hide on scroll down, show on scroll up; transparent over hero */
    var head = $('#head');
    if (head) {
      var hero = $('.hero');
      var last = window.scrollY, raf = 0;
      var run = function () {
        raf = 0;
        var y = window.scrollY;
        if (hero) head.classList.toggle('over', y < hero.offsetHeight - 120);
        if (y > last && y > 260) head.classList.add('hide');
        else head.classList.remove('hide');
        last = y;
      };
      window.addEventListener('scroll', function () {
        if (!raf) raf = requestAnimationFrame(run);
      }, { passive: true });
      run();
    }

    /* mobile nav */
    var burger = $('#burger');
    if (burger) burger.addEventListener('click', function () {
      var n = $('#mnav');
      var on = n.classList.toggle('open');
      $('#scrim').classList.toggle('on', on);
      document.body.classList.toggle('no-scroll', on);
      burger.setAttribute('aria-expanded', on ? 'true' : 'false');
    });
    var mclose = $('#mnavClose'); if (mclose) mclose.addEventListener('click', closeNav);

    /* reveals */
    var els = $$('.rv, .img-rv');
    if ('IntersectionObserver' in window && !reduce) {
      var io = new IntersectionObserver(function (ents) {
        ents.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
        });
      }, { rootMargin: '0px 0px -7% 0px', threshold: 0.04 });
      els.forEach(function (el) { io.observe(el); });
    } else {
      els.forEach(function (el) { el.classList.add('in'); });
    }

    /* newsletter */
    var nf = $('#newsForm');
    if (nf) nf.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = $('#newsEmail').value.trim();
      $('#newsMsg').textContent = v.length > 3 && v.indexOf('@') > 0
        ? 'Thank you — look for the first dispatch on Thursday.'
        : 'Please enter an email address.';
      if (v.indexOf('@') > 0) nf.reset();
    });

    /* year */
    $$('.yr').forEach(function (el) { el.textContent = new Date().getFullYear(); });
  }

  function closeNav() {
    var n = $('#mnav');
    if (!n || !n.classList.contains('open')) return;
    n.classList.remove('open');
    $('#scrim').classList.remove('on');
    document.body.classList.remove('no-scroll');
    var b = $('#burger'); if (b) b.setAttribute('aria-expanded', 'false');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  return { CATALOGUE: CATALOGUE, add: add, openCart: openCart, toast: toast, money: money, $: $, $$: $$ };
})();

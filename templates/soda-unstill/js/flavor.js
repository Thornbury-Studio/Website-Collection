/* UNSTILL — one flavour, from ?id=. Unknown or missing ids fall back to the
   first flavour rather than a broken page. Sets the whole site's theme to the
   flavour being read, which is the correct kind of showing off. */
(function (root, doc) {
  'use strict';

  var U = root.UNSTILL;
  if (!U) return;

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function set(id, html) {
    var el = doc.getElementById(id);
    if (el) el.innerHTML = html;
  }

  function boot() {
    var id = new URLSearchParams(root.location.search).get('id');
    var f = U.flavor(id) || U.flavors[0];

    doc.title = f.name + ' — UNSTILL Sparkling Botanical Soda';
    U.setFlavor(f.id);

    set('fStrap', esc(f.strap));
    set('fName', esc(f.name));
    set('fTagline', esc(f.tagline));
    set('fStory', '<p>' + esc(f.story) + '</p>');
    set('fPairing', '<strong>Eat it with:</strong> ' + esc(f.pairing));

    var img = doc.getElementById('fCan');
    if (img) {
      img.src = 'img/can-' + f.id + '.webp';
      img.alt = 'The ' + f.name + ' can: ' + f.strap.toLowerCase() + '.';
    }

    var per = U.perCan(f);
    set('fStickers',
      '<span class="sticker tilt-r">' + per.kcal + ' kcal a can</span>' +
      '<span class="sticker sticker--band tilt-l">Chaos ' + f.chaos + '/5</span>' +
      '<span class="sticker sticker--bone tilt-0">' + U.money(U.pricing.can) + '</span>');

    set('fIngredients', f.ingredients.map(function (i) {
      return '<li>' + esc(i) + '</li>';
    }).join(''));

    var rows = [
      ['Energy', f.per100.kcal + ' kcal', per.kcal + ' kcal'],
      ['Sugar', f.per100.sugar + ' g', per.sugar + ' g'],
      ['Carbohydrate', f.per100.carbs + ' g', per.carbs + ' g'],
      ['Salt', f.per100.salt + ' g', per.salt + ' g']
    ];
    var body = doc.querySelector('#fNutrition tbody');
    if (body) {
      body.innerHTML = rows.map(function (r) {
        return '<tr><th scope="row">' + r[0] + '</th><td class="n">' + r[1] +
          '</td><td class="n">' + r[2] + '</td></tr>';
      }).join('');
    }

    var sw = doc.getElementById('fSwitch');
    if (sw) {
      /* Already themed on load; the button re-asserts it for anyone who
         switched away while reading. */
      sw.addEventListener('click', function () { U.setFlavor(f.id); });
    }
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window, document);

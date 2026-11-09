/* HOLLIN — feedback. There is no server, and the form says so.
   Submitting validates, keeps the note in this browser (localStorage, inside
   try/catch: the page works without it), shows the note back, and offers a
   prefilled mailto: to the club's placeholder address as the only way to
   actually send it. It never claims anything was sent. */
(function () {
  var KEY = 'hollin-guestbook-v1';
  var H = window.HOLLIN || { contact: { email: 'hello@example.com' } };
  var EMAIL = H.contact.email;

  function load() {
    try { var v = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(v) ? v : []; }
    catch (e) { return []; }
  }
  function store(list) {
    try { localStorage.setItem(KEY, JSON.stringify(list)); return true; }
    catch (e) { return false; }
  }
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function when(ts) {
    try { return new Date(ts).toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
    catch (e) { return new Date(ts).toISOString().slice(0, 16).replace('T', ' '); }
  }
  /* Built with textContent only: nothing a visitor types is parsed as HTML. */
  function renderEntry(e) {
    var art = el('article', 'entry');
    var meta = el('p', 'entry__meta');
    meta.appendChild(el('span', 'entry__rating', e.rating + '/5'));
    meta.appendChild(document.createTextNode(' · ' + (e.name ? e.name : 'No name') + ' · ' + when(e.ts)));
    art.appendChild(meta);
    art.appendChild(el('blockquote', null, e.message));
    if (e.worked || e.didnt) {
      var dl = el('dl');
      if (e.worked) { dl.appendChild(el('dt', null, 'Worked')); dl.appendChild(el('dd', null, e.worked)); }
      if (e.didnt) { dl.appendChild(el('dt', null, "Didn't")); dl.appendChild(el('dd', null, e.didnt)); }
      art.appendChild(dl);
    }
    return art;
  }
  function mailto(e) {
    var body = 'Rating: ' + e.rating + ' out of 5\n' +
      (e.worked ? '\nWhat worked: ' + e.worked + '\n' : '') +
      (e.didnt ? "\nWhat didn't: " + e.didnt + '\n' : '') +
      '\n' + e.message + '\n' + (e.name ? '\n— ' + e.name + '\n' : '');
    return 'mailto:' + EMAIL + '?subject=' + encodeURIComponent('Guest book note (' + e.rating + '/5)') + '&body=' + encodeURIComponent(body);
  }

  /* ---------- the list on the Guest Book page ---------- */
  var mine = document.getElementById('my-notes');
  function renderMine() {
    if (!mine) return;
    var list = load();
    mine.textContent = '';
    if (!list.length) { mine.appendChild(el('p', 'dim', 'No notes saved on this device yet.')); return; }
    list.slice().reverse().forEach(function (e) {
      var a = renderEntry(e);
      var acts = el('div', 'actions');
      acts.style.marginTop = '1rem';
      var m = el('a', 'btn', 'Email it to Hollin'); m.href = mailto(e);
      var d = el('button', 'btn btn--quiet', 'Delete'); d.type = 'button';
      d.setAttribute('aria-label', 'Delete the note from ' + when(e.ts) + ' from this device');
      d.addEventListener('click', function () {
        store(load().filter(function (x) { return x.id !== e.id; }));
        renderMine();
        mine.setAttribute('tabindex', '-1'); mine.focus();
      });
      acts.appendChild(m); acts.appendChild(d); a.appendChild(acts);
      mine.appendChild(a);
    });
  }
  renderMine();

  /* ---------- every feedback form ---------- */
  document.querySelectorAll('form[data-feedback]').forEach(function (form) {
    var id = form.id;
    var saved = document.getElementById(id + '-saved');
    var summary = document.getElementById(id + '-summary');
    var ratingErr = document.getElementById(id + '-rating-err');
    var ratingBox = document.getElementById(id + '-rating');
    var msg = form.elements.message, msgErr = document.getElementById(id + '-message-err');
    var lastId = null;

    function setErr(field, box, text) {
      box.textContent = text || '';
      if (field) { if (text) field.setAttribute('aria-invalid', 'true'); else field.removeAttribute('aria-invalid'); }
    }
    function rating() { var r = form.querySelector('input[name="rating"]:checked'); return r ? Number(r.value) : 0; }
    function validate() {
      var problems = [];
      if (!rating()) {
        setErr(null, ratingErr, 'Choose a rating from 1 to 5.');
        ratingBox.classList.add('is-invalid');
        form.querySelectorAll('input[name="rating"]').forEach(function (r) { r.setAttribute('aria-invalid', 'true'); });
        problems.push(form.querySelector('input[name="rating"]'));
      } else {
        setErr(null, ratingErr, '');
        ratingBox.classList.remove('is-invalid');
        form.querySelectorAll('input[name="rating"]').forEach(function (r) { r.removeAttribute('aria-invalid'); });
      }
      var m = msg.value.trim();
      if (!m) { setErr(msg, msgErr, 'Write a note before saving.'); problems.push(msg); }
      else if (m.length < 10) { setErr(msg, msgErr, 'A little more, please: at least 10 characters (you have ' + m.length + ').'); problems.push(msg); }
      else setErr(msg, msgErr, '');
      return problems;
    }

    form.addEventListener('change', function (e) { if (e.target.name === 'rating' && ratingErr.textContent) validate(); });
    msg.addEventListener('input', function () { if (msgErr.textContent) validate(); });

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var problems = validate();
      if (problems.length) {
        summary.textContent = problems.length === 1 ? 'One thing to fix before saving.' : problems.length + ' things to fix before saving.';
        problems[0].focus();
        return;
      }
      summary.textContent = '';
      var entry = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        ts: Date.now(),
        rating: rating(),
        worked: form.elements.worked.value.trim(),
        didnt: form.elements.didnt.value.trim(),
        name: form.elements.name.value.trim(),
        message: msg.value.trim()
      };
      var list = load(); list.push(entry);
      var ok = store(list);
      lastId = ok ? entry.id : null;
      var status = saved.querySelector('[data-saved-status]');
      status.textContent = ok
        ? 'Saved on this device. Nothing has been sent: Hollin only sees this if you email it.'
        : "Couldn't save on this device (this browser is blocking storage). Nothing has been sent; you can still email it.";
      var box = saved.querySelector('[data-saved-entry]');
      box.textContent = ''; box.appendChild(renderEntry(entry));
      saved.querySelector('[data-mailto]').href = mailto(entry);
      saved.querySelector('[data-delete]').hidden = !ok;
      form.hidden = true; saved.hidden = false; saved.focus();
      renderMine();
    });

    saved.querySelector('[data-again]').addEventListener('click', function () {
      form.reset(); summary.textContent = ''; setErr(msg, msgErr, ''); setErr(null, ratingErr, '');
      ratingBox.classList.remove('is-invalid');
      form.querySelectorAll('[aria-invalid]').forEach(function (n) { n.removeAttribute('aria-invalid'); });
      saved.hidden = true; form.hidden = false;
      var first = form.querySelector('input[name="rating"]'); if (first) first.focus();
    });
    saved.querySelector('[data-delete]').addEventListener('click', function () {
      if (lastId) store(load().filter(function (x) { return x.id !== lastId; }));
      lastId = null;
      saved.querySelector('[data-saved-status]').textContent = 'Deleted from this device. Nothing was ever sent.';
      saved.querySelector('[data-delete]').hidden = true;
      renderMine();
    });
  });

  /* ---------- the dialog, reachable from every page ---------- */
  var dlg = document.getElementById('fb');
  var opener = document.querySelector('[data-fb-open]');
  if (dlg && opener && typeof dlg.showModal === 'function') {
    opener.addEventListener('click', function () {
      dlg.showModal();
      if (window.HOLL && HOLL.lenis) HOLL.lenis.stop();
      var f = dlg.querySelector('form:not([hidden]) input[name="rating"]') || dlg.querySelector('[data-fb-close]');
      f.focus();
    });
    dlg.querySelector('[data-fb-close]').addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('close', function () { if (window.HOLL && HOLL.lenis) HOLL.lenis.start(); opener.focus(); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
  } else if (opener) {
    /* no <dialog> support: go to the Guest Book instead */
    opener.addEventListener('click', function () { location.href = 'guest-book.html#g-write'; });
  }
})();

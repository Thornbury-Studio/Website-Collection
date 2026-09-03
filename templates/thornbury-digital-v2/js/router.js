/* ══════════════════════════════════════════════════════════════════
   THORNBURY DIGITAL v2 — router.
   Every page is a real HTML file. Same-directory links are intercepted,
   fetched, and only <main> is swapped, so the WebGL core survives the
   navigation and the camera tweens to the next page's state instead of
   the browser tearing the canvas down. Anything odd falls back to a real
   navigation. Focus is routed to the new <main> after the wipe reveals.
   ══════════════════════════════════════════════════════════════════ */

export function initRouter({ onLeave, onEnter, wipe }) {
  const base = location.pathname.replace(/[^/]*$/, '');
  const cache = new Map();
  let busy = false;

  try { history.scrollRestoration = 'manual'; } catch (e) { /* older engines */ }

  function routable(u) {
    if (u.origin !== location.origin || !u.pathname.startsWith(base)) return false;
    return /^([a-z0-9-]+\.html)?$/.test(u.pathname.slice(base.length));
  }

  function load(href) {
    if (cache.has(href)) return cache.get(href);
    const p = fetch(href, { credentials: 'same-origin' })
      .then((r) => { if (!r.ok) throw new Error(r.status); return r.text(); })
      .then((html) => new DOMParser().parseFromString(html, 'text/html'))
      .catch((err) => { cache.delete(href); throw err; });
    cache.set(href, p);
    return p;
  }

  async function go(href, push) {
    if (busy) return;
    busy = true;
    const u = new URL(href, location.href);
    let doc;
    try { doc = await load(u.href); } catch (e) { location.href = u.href; return; }
    const next = doc.querySelector('main');
    if (!next) { location.href = u.href; return; }
    const name = next.dataset.page || 'home';

    document.querySelectorAll('dialog[open]').forEach((d) => d.close());
    if (push) history.pushState({ tb: 1 }, '', u.href);
    await wipe.cover(name);

    if (onLeave) onLeave(name);
    const cur = document.getElementById('main');
    const fresh = document.importNode(next, true);
    cur.replaceWith(fresh);
    document.title = doc.title;
    const md = doc.querySelector('meta[name="description"]');
    const mine = document.querySelector('meta[name="description"]');
    if (md && mine) mine.setAttribute('content', md.getAttribute('content'));
    document.documentElement.dataset.page = name;
    scrollTo({ top: 0, left: 0, behavior: 'instant' });

    if (onEnter) onEnter(fresh, name);
    await wipe.reveal();
    fresh.focus({ preventScroll: true });
    busy = false;
  }

  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target === '_blank' || a.hasAttribute('download') || a.hasAttribute('data-native')) return;
    const u = new URL(a.getAttribute('href'), location.href);
    if (!routable(u)) return;
    const samePage = (u.pathname === location.pathname) || (u.pathname === base && /index\.html$/.test(location.pathname)) || (location.pathname === base && /index\.html$/.test(u.pathname));
    if (samePage) {
      if (u.hash) return; // in-page anchor: native jump
      e.preventDefault();
      scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    e.preventDefault();
    go(u.href, true);
  });

  // warm the cache on intent
  const warm = (e) => {
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    const u = new URL(a.getAttribute('href'), location.href);
    if (routable(u) && u.pathname !== location.pathname) load(u.href).catch(() => {});
  };
  document.addEventListener('pointerenter', warm, true);
  document.addEventListener('focusin', warm);
  document.addEventListener('touchstart', warm, { passive: true });

  addEventListener('popstate', () => { go(location.href, false); });
}

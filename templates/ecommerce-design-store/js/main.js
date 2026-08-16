document.addEventListener('DOMContentLoaded', () => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const state = { cart: [], activeProduct: null };
  const body = document.body;
  const overlay = document.getElementById('overlay');
  const cartDrawer = document.getElementById('cartDrawer');
  const quickDrawer = document.getElementById('quickDrawer');
  const searchPanel = document.getElementById('searchPanel');
  const toast = document.getElementById('toast');

  document.getElementById('year').textContent = new Date().getFullYear();

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

  let ticking = false;
  let lastScroll = 0;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const max = document.documentElement.scrollHeight - innerHeight;
      document.getElementById('progress').style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
      const header = document.getElementById('siteHeader');
      header.classList.toggle('hidden', scrollY > lastScroll && scrollY > 500);
      lastScroll = Math.max(0, scrollY);
      ticking = false;
    });
  }, { passive: true });

  const mobileMenu = document.getElementById('mobileMenu');
  const menuButton = document.querySelector('.menu-button');
  menuButton.addEventListener('click', () => {
    const open = mobileMenu.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(open));
    mobileMenu.setAttribute('aria-hidden', String(!open));
  });
  mobileMenu.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
  }));

  if (!reducedMotion && window.matchMedia('(pointer: fine)').matches) {
    const stage = document.getElementById('heroStage');
    const heroPhoto = stage.querySelector('.hero-photo');
    let photoFrame;
    stage.addEventListener('pointermove', (event) => {
      if (photoFrame) return;
      photoFrame = requestAnimationFrame(() => {
        const rect = stage.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width - .5) * -10;
        const y = ((event.clientY - rect.top) / rect.height - .5) * -10;
        heroPhoto.style.transform = `scale(1.035) translate3d(${x}px,${y}px,0)`;
        photoFrame = null;
      });
    });
    stage.addEventListener('pointerleave', () => { heroPhoto.style.transform = ''; });

    document.querySelectorAll('.magnetic').forEach((element) => {
      element.addEventListener('pointermove', (event) => {
        const rect = element.getBoundingClientRect();
        const x = (event.clientX - rect.left - rect.width / 2) * .14;
        const y = (event.clientY - rect.top - rect.height / 2) * .14;
        element.style.transform = `translate3d(${x}px,${y}px,0)`;
      });
      element.addEventListener('pointerleave', () => { element.style.transform = ''; });
    });
  }

  document.querySelectorAll('[data-filter]').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelectorAll('[data-filter]').forEach((item) => item.classList.remove('active'));
      button.classList.add('active');
      const filter = button.dataset.filter;
      document.querySelectorAll('.product-card').forEach((card) => {
        card.classList.toggle('filtered-out', filter !== 'all' && card.dataset.category !== filter);
      });
    });
  });

  const productFromCard = (card) => ({
    name: card.dataset.name,
    price: Number(card.dataset.price),
    color: card.dataset.color,
    category: card.dataset.category,
    image: card.dataset.image,
  });

  const openLayer = (element) => {
    closeLayers(false);
    overlay.hidden = false;
    requestAnimationFrame(() => overlay.classList.add('show'));
    element.classList.add('open');
    element.setAttribute('aria-hidden', 'false');
    body.classList.add('no-scroll');
    element.querySelector('button, input, a')?.focus({ preventScroll: true });
  };

  const closeLayers = (hideOverlay = true) => {
    [cartDrawer, quickDrawer, searchPanel].forEach((element) => {
      element.classList.remove('open');
      element.setAttribute('aria-hidden', 'true');
    });
    body.classList.remove('no-scroll');
    if (hideOverlay) {
      overlay.classList.remove('show');
      setTimeout(() => { overlay.hidden = true; }, 350);
    }
  };

  const showToast = (message) => {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove('show'), 1800);
  };

  const updateCart = () => {
    document.querySelectorAll('.cart-count').forEach((count) => { count.textContent = state.cart.length; });
    document.querySelector('[data-cart-open]').setAttribute('aria-label', `Open cart, ${state.cart.length} items`);
    const items = document.getElementById('cartItems');
    const total = document.getElementById('cartTotal');
    if (!state.cart.length) {
      items.innerHTML = '<div class="empty-cart"><span>0</span><p>Your cart is beautifully empty.</p><a href="#shop" data-close>Meet the objects</a></div>';
      total.hidden = true;
      return;
    }
    items.innerHTML = state.cart.map((item, index) => `
      <div class="cart-line">
        <div class="cart-thumb"><img src="${item.image}" alt=""></div>
        <div><h3>${item.name}</h3><p>${item.color} · $${item.price}</p></div>
        <button type="button" data-remove="${index}">Remove</button>
      </div>`).join('');
    total.hidden = false;
    total.querySelector('strong').textContent = `$${state.cart.reduce((sum, item) => sum + item.price, 0)}`;
    items.querySelectorAll('[data-remove]').forEach((button) => button.addEventListener('click', () => {
      state.cart.splice(Number(button.dataset.remove), 1);
      updateCart();
    }));
  };

  const addToCart = (product) => {
    state.cart.push(product);
    updateCart();
    showToast(`${product.name} added to cart`);
  };

  document.querySelectorAll('[data-quick-view]').forEach((button) => {
    button.addEventListener('click', () => {
      const card = button.closest('.product-card');
      state.activeProduct = productFromCard(card);
      document.getElementById('quickName').textContent = state.activeProduct.name;
      document.getElementById('quickColor').textContent = state.activeProduct.color;
      document.getElementById('quickPrice').textContent = `$${state.activeProduct.price}`;
      const image = document.getElementById('quickImage');
      image.src = state.activeProduct.image;
      image.alt = state.activeProduct.name;
      openLayer(quickDrawer);
    });
  });

  document.getElementById('quickAdd').addEventListener('click', () => {
    if (state.activeProduct) addToCart(state.activeProduct);
  });
  document.querySelector('[data-add-feature]').addEventListener('click', () => addToCart({ name: 'Halo Lamp', price: 189, color: 'Persimmon', category: 'light', image: 'img/halo-lifestyle.webp' }));
  document.querySelector('[data-cart-open]').addEventListener('click', () => openLayer(cartDrawer));
  document.querySelector('[data-search]').addEventListener('click', () => {
    openLayer(searchPanel);
    setTimeout(() => document.getElementById('searchInput').focus(), 450);
  });
  document.querySelectorAll('[data-close]').forEach((button) => button.addEventListener('click', () => closeLayers()));
  overlay.addEventListener('click', () => closeLayers());
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeLayers(); });

  document.getElementById('searchInput').addEventListener('input', (event) => {
    const query = event.target.value.trim().toLowerCase();
    const matches = [...document.querySelectorAll('.product-card')].filter((card) => `${card.dataset.name} ${card.dataset.category}`.toLowerCase().includes(query));
    document.getElementById('searchHint').textContent = query ? `${matches.length} object${matches.length === 1 ? '' : 's'} found` : 'Popular: Halo, portable light, tray';
  });

  document.getElementById('newsletterForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const status = document.getElementById('formStatus');
    out.textContent = 'Thanks — please contact us directly to continue.';
    event.target.reset();
  });

  updateCart();
});

/* True-loop marquee — see PATTERNS.md.
   Clones the first row until half the track covers its container, keeping the
   total even so -50% stays a whole period. Two copies is not enough on a wide
   monitor: the tail ran out mid-screen and you watched it reset. Duration
   scales with the clone count so the speed never changes. */
function trueLoopMarquee(track, secondsPerCopy) {
  if (!track || !track.firstElementChild) return;
  const master = track.firstElementChild.cloneNode(true);
  let timer;

  function build() {
    // Detach the animation before touching the track. The CSS animation
    // starts the instant the browser first paints this element, under
    // whatever duration the stylesheet declares. main.js is an external
    // <script src>, so real fetch+parse time passes before this runs — by
    // the time it does, the animation already has real elapsed time on the
    // clock. Changing animation-duration on that already-running animation
    // makes the browser recompute the played fraction against the NEW
    // duration using that SAME elapsed time, which is exactly the visible
    // "moves, then teleports a bit" jump. animation-name:none + a forced
    // reflow + reapplying the name restarts the animation as a clean new
    // instance at 0%, so there is nothing to recompute a jump from.
    track.style.animationName = 'none';

    while (track.children.length > 1) track.removeChild(track.lastElementChild);
    const rowW = track.firstElementChild.getBoundingClientRect().width;
    const boxW = (track.parentElement || document.body).getBoundingClientRect().width;
    if (rowW < 1) { track.style.animationName = ''; return; }

    const perHalf = Math.max(1, Math.ceil(boxW / rowW));
    for (let i = 1; i < perHalf * 2; i++) {
      const copy = master.cloneNode(true);
      copy.setAttribute('aria-hidden', 'true');
      track.appendChild(copy);
    }
    track.style.animationDuration = (secondsPerCopy * perHalf) + 's';

    track.offsetWidth; // force layout so the browser commits animation-name:none first
    track.style.animationName = '';
  }

  build();
  window.addEventListener('resize', () => {
    clearTimeout(timer);
    timer = setTimeout(build, 200);
  });
}
document.addEventListener('DOMContentLoaded', () => {
  trueLoopMarquee(document.getElementById('tickerTrack'), 24);
});

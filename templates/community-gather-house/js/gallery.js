/* Gather House — gallery lightbox */
(function () {
  'use strict';

  var grid = document.getElementById('galleryGrid');
  var lb = document.getElementById('lightbox');
  if (!grid || !lb) return;

  var stage = lb.querySelector('.lightbox__stage');
  var caption = lb.querySelector('.lightbox__caption');
  var btnClose = lb.querySelector('.lightbox__close');
  var btnPrev = lb.querySelector('.lightbox__prev');
  var btnNext = lb.querySelector('.lightbox__next');
  var items = Array.prototype.slice.call(grid.querySelectorAll('[data-full]'));
  var index = 0;
  var lastFocus = null;

  function mediaFor(item) {
    var type = item.getAttribute('data-type') || 'image';
    var src = item.getAttribute('data-full');
    var alt = item.getAttribute('data-alt') || '';
    stage.innerHTML = '';
    if (type === 'video') {
      var v = document.createElement('video');
      v.src = src;
      v.controls = true;
      v.playsInline = true;
      v.setAttribute('playsinline', '');
      if (!(window.GH && window.GH.reduced)) v.autoplay = true;
      stage.appendChild(v);
    } else {
      var img = document.createElement('img');
      img.src = src;
      img.alt = alt;
      stage.appendChild(img);
    }
    caption.textContent = alt;
  }

  function open(i) {
    index = (i + items.length) % items.length;
    lastFocus = document.activeElement;
    mediaFor(items[index]);
    lb.hidden = false;
    document.body.classList.add('lb-open');
    btnClose.focus();
  }

  function close() {
    lb.hidden = true;
    document.body.classList.remove('lb-open');
    stage.innerHTML = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function step(dir) {
    open(index + dir);
  }

  items.forEach(function (item, i) {
    item.addEventListener('click', function () { open(i); });
    item.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open(i);
      }
    });
  });

  btnClose.addEventListener('click', close);
  btnPrev.addEventListener('click', function () { step(-1); });
  btnNext.addEventListener('click', function () { step(1); });

  lb.addEventListener('click', function (e) {
    if (e.target === lb) close();
  });

  document.addEventListener('keydown', function (e) {
    if (lb.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
  });
}());

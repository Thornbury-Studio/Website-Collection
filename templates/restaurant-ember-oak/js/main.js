document.addEventListener('DOMContentLoaded', function () {
  var els = document.querySelectorAll('.card, .faq-item, .press-row, .dish, .stat, .section-title, .section-sub, .about-grid, .gallery-grid img, .booking, .contact-info, .cta .container');
  els.forEach(function (el) { el.classList.add('fade-in'); });

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  });
  els.forEach(function (el) { observer.observe(el); });

  document.getElementById('booking').addEventListener('submit', function (e) {
    e.preventDefault();
    alert('Thank you for your reservation! We will contact you shortly.');
  });
});

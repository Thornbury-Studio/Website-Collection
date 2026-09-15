/* Printable last-order receipt from sessionStorage */
(function () {
  'use strict';
  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
  if (!window.CR) return;
  var root = document.getElementById('receiptRoot');
  if (!root) return;
  var raw = null;
  try { raw = sessionStorage.getItem('cr.lastOrder'); } catch (e) {}
  if (!raw) return;
  var order;
  try { order = JSON.parse(raw); } catch (e) { return; }
  if (!order || !order.id) return;
  var empty = document.getElementById('receiptEmpty');
  if (empty) empty.hidden = true;
  var lines = (order.lines || []).map(function (l) {
    return (
      '<li><span>' + window.CR.esc(l.name) + ' × ' + l.qty + '</span><strong>' +
      window.CR.money(l.unit * l.qty) + '</strong></li>'
    );
  }).join('');
  root.innerHTML =
    '<h1>Order ' + window.CR.esc(order.id) + '</h1>' +
    '<p>Confirmation to ' + window.CR.esc(order.email) + '. Ship-to: ' +
    window.CR.esc(order.name) + ', ' + window.CR.esc(order.street) + ', ' +
    window.CR.esc(order.city) + ' ' + window.CR.esc(order.state) + ' ' + window.CR.esc(order.zip) + '.</p>' +
    '<ul class="receipt-lines">' + lines +
    '<li><span>Hazmat fee</span><strong>' + window.CR.money(order.hazmat || 0) + '</strong></li>' +
    '<li><span>Ground shipping</span><strong>' + (order.ship === 0 ? 'Free' : window.CR.money(order.ship || 0)) + '</strong></li>' +
    '<li><span>Total</span><strong>' + window.CR.money(order.total || 0) + '</strong></li>' +
    '</ul>' +
    '<p>Ground hazmat · signature required. We charge at fulfillment and email tracking.</p>' +
    '<p><a class="btn btn-brass" href="shop.html">Back to shop</a> ' +
    '<button class="btn btn-ghost" type="button" id="printReceipt">Print</button></p>';
  var printBtn = document.getElementById('printReceipt');
  if (printBtn) printBtn.addEventListener('click', function () { window.print(); });
})();

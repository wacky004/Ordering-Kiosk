/* Printable 80mm receipt with VAT + Senior/PWD breakdown. */
(function () {
  function barcode(code) {
    let seed = 0;
    for (const char of code) seed = (seed * 31 + char.charCodeAt(0)) % 100000;
    const bars = [];
    for (let i = 0; i < 46; i += 1) {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      bars.push(`<i style="height:${18 + (seed % 28)}px"></i>`);
    }
    return bars.join('');
  }

  Router.on('#/receipt/:id', {
    active: 'orders',
    async render(ctx) {
      const data = await api(`/api/orders/${ctx.params.id}`);
      const order = data.order;
      const method = { card: 'Card', gcash: 'GCash', cash: 'Cash' }[order.payment_method] || order.payment_method;
      return `
        <div class="page">
          <div class="no-print" style="text-align:center;margin-bottom:18px">
            <h1 class="page-title">Payment successful 🎉</h1>
            <p class="page-subtitle">Show this order code at the counter.</p>
          </div>
          <div class="receipt" id="receipt">
            <div class="receipt__logo">${UI.logoMark()}</div>
            <h2>MCDONALD'S</h2>
            <div class="receipt__meta">McDo Self-Order Kiosk<br />Store #2026 · Metro Manila<br />VAT REG TIN 000-123-456-000</div>
            <div class="receipt__row"><span>Order</span><span>${UI.escapeHtml(order.code)}</span></div>
            <div class="receipt__row"><span>Date</span><span>${UI.formatDate(order.created_at)}</span></div>
            <div class="receipt__row"><span>Customer</span><span>${UI.escapeHtml(ctx.user.name)}</span></div>
            <div class="receipt__row"><span>Type</span><span>${order.order_type === 'takeout' ? 'Take-out' : 'Dine-in'}</span></div>
            <div class="receipt__row"><span>Payment</span><span>${method} (paid)</span></div>
            <hr />
            ${order.items
              .map(
                (item) => `<div class="receipt__row"><span>${item.qty} x ${UI.escapeHtml(item.name)}</span><span>${Money.format(
                  item.line_total
                )}</span></div>
                ${
                  (item.options || []).length
                    ? `<div class="receipt__sub">${item.options.map((o) => UI.escapeHtml(o.option_name)).join(', ')}</div>`
                    : ''
                }`
              )
              .join('')}
            <hr />
            <div class="receipt__row"><span>Subtotal</span><span>${Money.format(order.subtotal)}</span></div>
            ${
              order.senior_pwd_count > 0
                ? `<div class="receipt__row"><span>Senior/PWD discount</span><span>-${Money.format(order.senior_discount)}</span></div>
                   <div class="receipt__row"><span>VAT-exempt sales</span><span>${Money.format(order.vat_exempt_sales)}</span></div>`
                : `<div class="receipt__row"><span>VATable sales</span><span>${Money.format(order.vatable_sales)}</span></div>
                   <div class="receipt__row"><span>VAT (12%)</span><span>${Money.format(order.vat_amount)}</span></div>`
            }
            ${
              order.discount > 0
                ? `<div class="receipt__row"><span>Points discount (${order.points_redeemed} pts)</span><span>-${Money.format(order.discount)}</span></div>`
                : ''
            }
            <div class="receipt__row" style="font-weight:bold;font-size:15px"><span>TOTAL</span><span>${Money.format(order.total)}</span></div>
            <hr />
            <div class="receipt__row"><span>Points earned</span><span>+${order.points_earned} pts</span></div>
            ${
              order.points_redeemed > 0
                ? `<div class="receipt__row"><span>Points redeemed</span><span>-${order.points_redeemed} pts</span></div>`
                : ''
            }
            <div class="barcode">${barcode(order.code)}</div>
            <div style="text-align:center;letter-spacing:3px">${UI.escapeHtml(order.code)}</div>
            <div class="receipt__foot">Thank you for dining with us!<br />This serves as your official receipt.</div>
          </div>
          <div class="no-print" style="text-align:center;margin-top:22px">
            <button class="btn btn--dark" type="button" id="printBtn">🖨️ Print</button>
            <a class="btn btn--yellow" href="#/order/${order.id}" style="margin-left:8px">📦 Track order</a>
            <a class="btn btn--ghost" href="#/menu" style="margin-left:8px">Order again</a>
          </div>
        </div>`;
    },
    mount() {
      document.getElementById('printBtn').addEventListener('click', () => window.print());
    }
  });
})();

/* Customer order history. */
(function () {
  Router.on('#/orders', {
    active: 'orders',
    async render(ctx) {
      const data = await api('/api/orders');
      if (data.orders.length === 0) {
        return `<div class="page"><div class="card" style="text-align:center">🍔<br /><br />You have no orders yet.<br /><a class="btn btn--primary" href="#/menu" style="margin-top:14px">Browse the menu</a></div></div>`;
      }
      return `
        <div class="page">
          <h1 class="page-title">My Orders</h1>
          <p class="page-subtitle">Track orders and view receipts.</p>
          <section>
            ${data.orders
              .map((order) => {
                const items = order.items.map((item) => `${item.qty}× ${UI.escapeHtml(item.name)}`).join(', ');
                return `<article class="order-card card">
                  <div class="order-card__head">
                    <div>
                      <div class="order-card__code">${UI.escapeHtml(order.code)}</div>
                      <div class="hint">${UI.formatDate(order.created_at)} · ${
                        order.order_type === 'takeout' ? 'Take-out' : 'Dine-in'
                      }</div>
                    </div>
                    ${UI.statusBadge(order.status)}
                  </div>
                  <div class="order-card__items">${items}</div>
                  <div class="order-card__foot">
                    <div><strong>${Money.format(order.total)}</strong> <span class="hint">· +${order.points_earned} pts</span></div>
                    <div class="row-actions">
                      <a class="btn btn--primary btn--sm" href="#/order/${order.id}">Track</a>
                      <a class="btn btn--ghost btn--sm" href="#/receipt/${order.id}">Receipt</a>
                      <button class="btn btn--ghost btn--sm" type="button" data-reorder="${order.id}">Reorder</button>
                      ${
                        order.status === 'received'
                          ? `<button class="btn btn--ghost btn--sm" type="button" data-cancel="${order.id}">Cancel</button>`
                          : ''
                      }
                    </div>
                  </div>
                </article>`;
              })
              .join('')}
          </section>
        </div>`;
    },
    mount(ctx) {
      document.querySelectorAll('[data-cancel]').forEach((button) => {
        button.addEventListener('click', async () => {
          if (!confirm('Cancel this order?')) return;
          try {
            await api(`/api/orders/${button.dataset.cancel}/cancel`, { method: 'POST' });
            UI.toast('Order cancelled.', 'success');
            Router.render();
          } catch (err) {
            UI.toast(err.message, 'error');
          }
        });
      });
      document.querySelectorAll('[data-reorder]').forEach((button) => {
        button.addEventListener('click', async () => {
          const order = await api(`/api/orders/${button.dataset.reorder}`);
          (order.order.items || []).forEach((item) => {
            Cart.add({
              id: item.menu_item_id,
              name: item.name,
              price: item.unit_price,
              icon: '🍔',
              options: (item.options || []).map((option) => ({
                id: option.option_id,
                name: option.option_name,
                delta: option.price_delta
              })),
              qty: item.qty
            });
          });
          UI.toast('Items added to your cart.', 'success');
          Router.navigate('#/checkout');
        });
      });
    }
  });
})();

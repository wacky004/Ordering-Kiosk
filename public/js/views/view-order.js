/* Order tracker with live updates (SSE or offline polling). */
(function () {
  const STEP_TEXT = {
    received: 'We got your order and sent it to the kitchen.',
    preparing: 'The crew is cooking your food fresh.',
    ready: 'Your order is ready! Please proceed to the counter.',
    completed: 'Order picked up. Enjoy your meal!'
  };

  function renderOrder(order) {
    const flow = UI.STATUS_STEPS;
    const currentIndex = flow.indexOf(order.status);
    const events = {};
    (order.events || []).forEach((event) => {
      events[event.status] = event;
    });
    const cancelled = order.status === 'cancelled';

    const timeline = flow
      .map((status, index) => {
        const event = events[status];
        const done = Boolean(event) || (!cancelled && index < currentIndex);
        const current = !cancelled && index === currentIndex && status !== 'completed';
        return `<li class="${done ? 'done' : current ? 'current' : ''}">
          <span class="timeline__dot">${done ? '✓' : current ? UI.STATUS_ICONS[status] : index + 1}</span>
          <div>
            <div class="timeline__title">${UI.escapeHtml(UI.STATUS_LABELS[status])}</div>
            <div class="timeline__time">${event ? UI.formatDate(event.created_at) : current ? 'In progress…' : 'Pending'}</div>
            <div class="hint">${STEP_TEXT[status]}</div>
          </div>
        </li>`;
      })
      .join('');

    return `
      <div class="page">
        <div class="order-card card">
          <div class="order-card__head">
            <div>
              <h1 class="page-title" style="margin:0">${UI.escapeHtml(order.code)}</h1>
              <div class="hint">Placed ${UI.formatDate(order.created_at)} · ${
                order.order_type === 'takeout' ? '🥡 Take-out' : '🍽️ Dine-in'
              }</div>
            </div>
            ${UI.statusBadge(order.status)}
          </div>
          ${UI.progressStrip(order.status)}
          <ul class="timeline">${timeline}</ul>
          ${
            cancelled
              ? `<div class="error-text" style="margin-top:10px">❌ This order was cancelled.</div>`
              : ''
          }
        </div>

        <div class="checkout-grid">
          <div class="card">
            <h3>Order Summary</h3>
            ${order.items
              .map(
                (item) => `<div class="summary-line"><span>${item.qty}× ${UI.escapeHtml(item.name)}${
                  (item.options || []).length
                    ? ` <span class="hint">(${item.options.map((o) => UI.escapeHtml(o.option_name)).join(', ')})</span>`
                    : ''
                }</span><span>${Money.format(item.line_total)}</span></div>`
              )
              .join('')}
            <div class="summary-line" style="border-top:1px solid var(--line);margin-top:8px;padding-top:10px"><span>Subtotal</span><span>${Money.format(
              order.subtotal
            )}</span></div>
            ${
              order.senior_discount > 0
                ? `<div class="summary-line"><span>Senior / PWD discount</span><span>-${Money.format(order.senior_discount)}</span></div>`
                : ''
            }
            ${
              order.discount > 0
                ? `<div class="summary-line"><span>Points discount (${order.points_redeemed} pts)</span><span>-${Money.format(order.discount)}</span></div>`
                : ''
            }
            <div class="summary-total"><span>Total paid</span><span>${Money.format(order.total)}</span></div>
            <div class="summary-line" style="margin-top:8px"><span>Points earned</span><span>+${order.points_earned} pts</span></div>
          </div>
          <div class="card">
            <h3>Need help?</h3>
            <p class="hint">Show order code <strong>${UI.escapeHtml(order.code)}</strong> at the counter. This page updates automatically.</p>
            <a class="btn btn--ghost btn--block" href="#/receipt/${order.id}" style="margin-bottom:10px">View receipt</a>
            <a class="btn btn--ghost btn--block" href="#/orders" style="margin-bottom:10px">All my orders</a>
            ${
              order.status === 'received'
                ? '<button class="btn btn--primary btn--block" type="button" id="cancelOrder">Cancel order</button>'
                : ''
            }
            <p class="hint" style="margin-top:12px" id="liveNote">Live updates: connecting…</p>
          </div>
        </div>
      </div>`;
  }

  Router.on('#/order/:id', {
    active: 'orders',
    async render(ctx) {
      const data = await api(`/api/orders/${ctx.params.id}`);
      return renderOrder(data.order);
    },
    mount(ctx) {
      const id = Number(ctx.params.id);
      async function refresh() {
        try {
          const data = await api(`/api/orders/${id}`);
          document.getElementById('app').innerHTML = renderOrder(data.order);
          bind();
        } catch (err) {
          UI.toast(err.message, 'error');
        }
      }
      function bind() {
        const cancel = document.getElementById('cancelOrder');
        if (cancel) {
          cancel.addEventListener('click', async () => {
            if (!confirm('Cancel this order?')) return;
            try {
              await api(`/api/orders/${id}/cancel`, { method: 'POST' });
              UI.toast('Order cancelled.', 'success');
              refresh();
            } catch (err) {
              UI.toast(err.message, 'error');
            }
          });
        }
        const note = document.getElementById('liveNote');
        if (note) note.textContent = window.IS_OFFLINE ? 'Live updates: offline mode (local polling)' : 'Live updates: connected';
      }
      const disconnect = Live.connect((event) => {
        if (event.type === 'order:updated' && Number(event.data.id) === id) refresh();
        if (event.type === 'demo:reset') refresh();
      });
      ctx.onCleanup(disconnect);
      bind();
    }
  });
})();

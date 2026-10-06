/* Kitchen Display System: live tickets with one-tap progression. */
(function () {
  const COLUMNS = [
    { status: 'received', action: 'preparing', actionLabel: 'Start cooking' },
    { status: 'preparing', action: 'ready', actionLabel: 'Mark ready' }
  ];

  function ticket(order) {
    const column = COLUMNS.find((entry) => entry.status === order.status);
    const elapsed = Math.max(
      0,
      Math.floor((Date.now() - new Date(String(order.created_at).replace(' ', 'T') + 'Z').getTime()) / 60000)
    );
    return `<article class="ticket card">
      <div class="ticket__head">
        <strong>${UI.escapeHtml(order.code)}</strong>
        <span class="hint">${elapsed} min ago</span>
      </div>
      <div class="hint">${UI.escapeHtml(order.customer_name || 'Customer')} · ${
        order.order_type === 'takeout' ? 'Take-out' : 'Dine-in'
      }</div>
      <ul class="ticket__items">
        ${order.items
          .map(
            (item) => `<li>${item.qty}× ${UI.escapeHtml(item.name)}${
              (item.options || []).length
                ? `<span class="hint"> ${item.options.map((o) => UI.escapeHtml(o.option_name)).join(', ')}</span>`
                : ''
            }</li>`
          )
          .join('')}
      </ul>
      <button class="btn btn--primary btn--block" type="button" data-advance="${order.id}" data-next="${column.action}">
        ${column.actionLabel}
      </button>
    </article>`;
  }

  Router.on('#/kitchen', {
    active: 'kitchen',
    roles: ['kitchen', 'manager', 'admin'],
    async render() {
      return `<div class="page">
        <h1 class="page-title">Kitchen Display</h1>
        <p class="page-subtitle">New and in-progress orders. Updates live.</p>
        <div class="kanban kanban--kitchen" id="kitchenBoard"></div>
      </div>`;
    },
    async mount(ctx) {
      async function load() {
        const data = await api('/api/admin/kitchen');
        const board = document.getElementById('kitchenBoard');
        if (!board) return;
        board.innerHTML = COLUMNS.map((column) => {
          const orders = data.orders.filter((order) => order.status === column.status);
          return `<div class="kanban__col">
            <h3>${UI.escapeHtml(UI.STATUS_LABELS[column.status])} <span class="kanban__count">${orders.length}</span></h3>
            ${orders.map(ticket).join('') || '<p class="empty-note">No orders</p>'}
          </div>`;
        }).join('');
      }

      document.getElementById('app').addEventListener('click', async (event) => {
        const button = event.target.closest('[data-advance]');
        if (!button) return;
        try {
          await api(`/api/admin/orders/${button.dataset.advance}/status`, {
            method: 'PATCH',
            body: { status: button.dataset.next }
          });
          UI.toast('Order updated.', 'success');
          load();
        } catch (err) {
          UI.toast(err.message, 'error');
        }
      });

      await load();
      const disconnect = Live.connect((event) => {
        if (['order:new', 'order:updated', 'demo:reset'].includes(event.type)) load();
      });
      ctx.onCleanup(disconnect);
    }
  });
})();

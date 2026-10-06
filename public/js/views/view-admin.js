/* Admin dashboard: orders board, menu + options, staff, customers, demo reset. */
(function () {
  const FLOW = ['received', 'preparing', 'ready', 'completed'];
  const COLUMN_TITLES = { received: 'New Orders', preparing: 'Preparing', ready: 'Ready for Pickup', completed: 'Completed' };
  const TYPE_LABELS = { 'dine-in': 'Dine-in', takeout: 'Take-out' };
  const PAY_LABELS = { card: 'Card', gcash: 'GCash', cash: 'Cash' };

  let state = { orders: [], items: [], staff: [], customers: [] };

  function itemsSummary(order) {
    return order.items.map((item) => `${item.qty}× ${UI.escapeHtml(item.name)}`).join(', ');
  }

  function statsHtml(stats) {
    const cards = [
      ['Orders today', stats.todayOrders],
      ['Revenue today', Money.format(stats.todayRevenue)],
      ['Active orders', stats.activeOrders],
      ['Total orders', stats.totalOrders],
      ['Customers', stats.totalUsers],
      ['Points issued', stats.pointsIssued]
    ];
    return cards
      .map(
        ([label, value]) =>
          `<div class="stat-card"><div class="stat-card__label">${label}</div><div class="stat-card__value">${value}</div></div>`
      )
      .join('');
  }

  function kanbanHtml() {
    return FLOW.map((status) => {
      const column = state.orders.filter((order) => order.status === status);
      const cards = column
        .map((order) => {
          const next = FLOW[FLOW.indexOf(status) + 1];
          return `<div class="kanban-card" data-open="${order.id}" data-status="${status}">
            <div class="kanban-card__code"><span>${UI.escapeHtml(order.code)}</span><span>${Money.format(order.total)}</span></div>
            <div class="kanban-card__cust">${UI.escapeHtml(order.customer_name)} · ${TYPE_LABELS[order.order_type]}</div>
            <div class="kanban-card__items">${itemsSummary(order)}</div>
            <div class="kanban-card__actions">
              ${
                next
                  ? `<button class="btn btn--primary btn--sm" type="button" data-advance="${order.id}" data-next="${next}">→ ${COLUMN_TITLES[next]}</button>`
                  : '<span class="hint">Done</span>'
              }
              ${order.status !== 'completed' && order.status !== 'cancelled' ? `<button class="btn btn--ghost btn--sm" type="button" data-cancel="${order.id}">Cancel</button>` : ''}
            </div>
          </div>`;
        })
        .join('');
      return `<div class="kanban__col"><h3>${COLUMN_TITLES[status]} <span class="kanban__count">${column.length}</span></h3>${
        cards || '<p class="empty-note">No orders</p>'
      }</div>`;
    }).join('');
  }

  function menuHtml() {
    return `<div class="table-scroll"><table class="data"><thead><tr><th></th><th>Item</th><th>Category</th><th>Price</th><th>Status</th><th></th></tr></thead><tbody>
      ${state.items
        .map(
          (item) => `<tr>
            <td><span class="thumb">${item.icon}${
            item.image ? `<img src="${UI.escapeHtml(item.image)}" alt="" loading="lazy" onerror="this.remove()">` : ''
          }</span></td>
            <td><strong>${UI.escapeHtml(item.name)}</strong><br /><span class="hint">${UI.escapeHtml(item.description)}</span></td>
            <td>${UI.escapeHtml(item.category)}</td>
            <td><input class="mini-input" type="number" min="1" value="${item.price}" data-price="${item.id}" /></td>
            <td>${item.available ? '<span class="status status--completed">Available</span>' : '<span class="status status--cancelled">Unavailable</span>'}</td>
            <td class="row-actions">
              <button class="btn btn--ghost btn--sm" type="button" data-save="${item.id}">Save</button>
              <button class="btn btn--ghost btn--sm" type="button" data-toggle="${item.id}" data-avail="${item.available ? 1 : 0}">${item.available ? 'Disable' : 'Enable'}</button>
              <button class="btn btn--ghost btn--sm" type="button" data-options="${item.id}">Options</button>
              <button class="btn btn--ghost btn--sm" type="button" data-delete="${item.id}">🗑️</button>
            </td>
          </tr>`
        )
        .join('')}
    </tbody></table></div>`;
  }

  function staffHtml(isAdmin) {
    if (!isAdmin) return '<p class="empty-note">Only administrators can manage staff.</p>';
    return `<div class="card section">
        <h3>Add staff</h3>
        <form id="staffForm" class="form-inline">
          <input id="staffName" placeholder="Name" required />
          <input id="staffEmail" type="email" placeholder="Email" required />
          <input id="staffPassword" type="password" placeholder="Password" required />
          <select id="staffRole"><option value="kitchen">Kitchen</option><option value="cashier">Cashier</option><option value="manager">Manager</option><option value="admin">Admin</option></select>
          <button class="btn btn--primary" type="submit">Add staff</button>
        </form>
      </div>
      <div class="table-scroll"><table class="data"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th></th></tr></thead><tbody>
        ${state.staff
          .map(
            (member) => `<tr>
              <td><strong>${UI.escapeHtml(member.name)}</strong></td>
              <td>${UI.escapeHtml(member.email)}</td>
              <td>${UI.escapeHtml(member.roleLabel)}</td>
              <td><select class="mini-input" data-role="${member.id}">
                ${['kitchen', 'cashier', 'manager', 'admin']
                  .map((role) => `<option value="${role}" ${role === member.role ? 'selected' : ''}>${UI.ROLE_LABELS[role]}</option>`)
                  .join('')}
              </select></td>
            </tr>`
          )
          .join('')}
      </tbody></table></div>`;
  }

  function customersHtml() {
    return `<div class="table-scroll"><table class="data"><thead><tr><th>Name</th><th>Email</th><th>Points</th><th>Value</th><th>Joined</th></tr></thead><tbody>
      ${state.customers
        .map(
          (customer) => `<tr>
            <td><strong>${UI.escapeHtml(customer.name)}</strong></td>
            <td>${UI.escapeHtml(customer.email)}</td>
            <td class="pos">${customer.points} pts</td>
            <td>${Money.format(Math.floor(customer.points / 100) * 10)}</td>
            <td>${UI.formatDate(customer.created_at)}</td>
          </tr>`
        )
        .join('')}
    </tbody></table></div>`;
  }

  function orderModal(order) {
    const events = (order.events || [])
      .map(
        (event) =>
          `<div class="summary-line"><span>${UI.STATUS_ICONS[event.status] || ''} ${
            UI.STATUS_LABELS[event.status] || event.status
          }</span><span>${UI.formatDate(event.created_at)}</span></div>`
      )
      .join('');
    const buttons = FLOW.concat('cancelled')
      .map(
        (status) =>
          `<button class="btn ${status === order.status ? 'btn--dark' : 'btn--ghost'} btn--sm" type="button" data-set="${status}">${
            UI.STATUS_LABELS[status]
          }</button>`
      )
      .join(' ');
    UI.openModal(
      `<div class="modal__head">
        <div><h3 style="margin:0">${UI.escapeHtml(order.code)}</h3><p class="hint">${UI.escapeHtml(
        order.customer_name
      )} · ${UI.escapeHtml(order.customer_email)}</p></div>
        <button class="icon-btn" data-modal-close type="button">✕</button>
      </div>
      <div style="margin-bottom:12px">${UI.statusBadge(order.status)}</div>
      <div class="section">
        ${order.items
          .map(
            (item) => `<div class="summary-line"><span>${item.qty}× ${UI.escapeHtml(item.name)}${
              (item.options || []).length
                ? ` <span class="hint">(${item.options.map((o) => UI.escapeHtml(o.option_name)).join(', ')})</span>`
                : ''
            }</span><span>${Money.format(item.line_total)}</span></div>`
          )
          .join('')}
        <div class="summary-line"><span>Subtotal</span><span>${Money.format(order.subtotal)}</span></div>
        ${order.senior_discount > 0 ? `<div class="summary-line"><span>Senior/PWD</span><span>-${Money.format(order.senior_discount)}</span></div>` : ''}
        ${order.discount > 0 ? `<div class="summary-line"><span>Points (${order.points_redeemed})</span><span>-${Money.format(order.discount)}</span></div>` : ''}
        <div class="summary-line"><span>Payment</span><span>${PAY_LABELS[order.payment_method]}</span></div>
        <div class="summary-total"><span>Total</span><span>${Money.format(order.total)}</span></div>
      </div>
      <h4>Timeline</h4><div class="section">${events}</div>
      <h4>Update status</h4><div class="choice-row">${buttons}</div>`,
      (modal) => {
        modal.querySelectorAll('[data-set]').forEach((button) => {
          button.addEventListener('click', async () => {
            try {
              await api(`/api/admin/orders/${order.id}/status`, {
                method: 'PATCH',
                body: { status: button.dataset.set }
              });
              UI.closeModal();
              UI.toast('Order updated.', 'success');
              refresh();
            } catch (err) {
              UI.toast(err.message, 'error');
            }
          });
        });
      }
    );
  }

  function optionsModal(item) {
    UI.openModal(
      `<div class="modal__head">
        <div><h3 style="margin:0">Options · ${UI.escapeHtml(item.name)}</h3><p class="hint">Sizes, drinks and add-ons.</p></div>
        <button class="icon-btn" data-modal-close type="button">✕</button>
      </div>
      <div id="optionGroups">
        ${
          (item.options || [])
            .map(
              (group) => `<div class="option-admin card">
                <div class="option-admin__head">
                  <strong>${UI.escapeHtml(group.name)}</strong>
                  <span class="hint">${group.type === 'multi' ? 'multiple' : 'single'}${group.required ? ' · required' : ''}</span>
                  <button class="btn btn--ghost btn--sm" type="button" data-del-group="${group.id}">Delete group</button>
                </div>
                <ul class="option-admin__list">
                  ${group.options
                    .map(
                      (option) => `<li>${UI.escapeHtml(option.name)} <span class="hint">+${Money.format(option.delta)}</span>
                        <button class="icon-btn" type="button" data-del-value="${option.id}">✕</button></li>`
                    )
                    .join('') || '<li class="hint">No values yet</li>'}
                </ul>
                <form class="form-inline" data-add-value="${group.id}">
                  <input name="name" placeholder="Value e.g. Large" required />
                  <input name="delta" type="number" placeholder="Price delta" value="0" />
                  <button class="btn btn--ghost btn--sm" type="submit">Add value</button>
                </form>
              </div>`
            )
            .join('') || '<p class="hint">No option groups yet.</p>'
        }
      </div>
      <hr class="rule" />
      <form class="form-inline" id="addGroupForm">
        <input name="name" placeholder="New group e.g. Size" required />
        <select name="type"><option value="single">single choice</option><option value="multi">multiple choice</option></select>
        <label class="inline-check"><input type="checkbox" name="required" /> required</label>
        <button class="btn btn--primary btn--sm" type="submit">Add group</button>
      </form>`,
      (modal) => {
        modal.querySelectorAll('[data-del-group]').forEach((button) => {
          button.addEventListener('click', async () => {
            if (!confirm('Delete this option group?')) return;
            await api(`/api/admin/options/${button.dataset.delGroup}`, { method: 'DELETE' });
            UI.toast('Group deleted.', 'success');
            refresh().then(() => optionsModal(state.items.find((entry) => entry.id === item.id)));
          });
        });
        modal.querySelectorAll('[data-del-value]').forEach((button) => {
          button.addEventListener('click', async () => {
            await api(`/api/admin/option-values/${button.dataset.delValue}`, { method: 'DELETE' });
            refresh().then(() => optionsModal(state.items.find((entry) => entry.id === item.id)));
          });
        });
        modal.querySelectorAll('[data-add-value]').forEach((form) => {
          form.addEventListener('submit', async (event) => {
            event.preventDefault();
            await api(`/api/admin/options/${form.dataset.addValue}/values`, {
              method: 'POST',
              body: { name: form.name.value, delta: Number(form.delta.value) || 0 }
            });
            UI.toast('Value added.', 'success');
            refresh().then(() => optionsModal(state.items.find((entry) => entry.id === item.id)));
          });
        });
        modal.querySelector('#addGroupForm').addEventListener('submit', async (event) => {
          event.preventDefault();
          const form = event.target;
          await api(`/api/admin/menu/${item.id}/options`, {
            method: 'POST',
            body: { name: form.name.value, type: form.type.value, required: form.required.checked }
          });
          UI.toast('Group added.', 'success');
          refresh().then(() => optionsModal(state.items.find((entry) => entry.id === item.id)));
        });
      }
    );
  }

  Router.on('#/admin', {
    active: 'admin',
    roles: ['cashier', 'manager', 'admin'],
    async render(ctx) {
      const isAdmin = ctx.user.role === 'admin';
      return `<div class="page">
        <div class="page-head">
          <div><h1 class="page-title">Admin Dashboard</h1><p class="page-subtitle">Manage orders, menu, staff and customers.</p></div>
          <div class="row-actions">
            ${isAdmin ? '<button class="btn btn--ghost btn--sm" type="button" id="resetDemo">Reset demo data</button>' : ''}
            <button class="btn btn--ghost btn--sm" type="button" id="refreshBtn">🔄 Refresh</button>
          </div>
        </div>
        <div class="stats-grid" id="statsGrid"></div>
        <div class="tabs" id="adminTabs">
          <button type="button" data-tab="orders" class="active">📦 Orders</button>
          <button type="button" data-tab="menu">🍔 Menu</button>
          ${isAdmin ? '<button type="button" data-tab="staff">👨‍💼 Staff</button>' : ''}
          <button type="button" data-tab="customers">🏅 Customers</button>
        </div>
        <section id="tab-orders"><div class="kanban" id="kanban"></div></section>
        <section id="tab-menu" class="hidden">
          <div class="card section">
            <h3>Add menu item</h3>
            <form id="addItemForm" class="form-inline">
              <input id="newName" placeholder="Name" required />
              <input id="newDesc" placeholder="Description" />
              <input id="newCategory" placeholder="Category" required />
              <input id="newPrice" type="number" min="1" placeholder="Price" required />
              <input id="newIcon" maxlength="4" placeholder="🍔" />
              <button class="btn btn--primary" type="submit">Add item</button>
            </form>
          </div>
          <div class="card"><h3>Menu items</h3><div id="menuTable">${menuHtml()}</div></div>
        </section>
        ${isAdmin ? `<section id="tab-staff" class="hidden"><div id="staffTable">${staffHtml(true)}</div></section>` : ''}
        <section id="tab-customers" class="hidden"><div class="card"><h3>Customers</h3><div id="customersTable">${customersHtml()}</div></div></section>
      </div>`;
    },
    async mount(ctx) {
      const isAdmin = ctx.user.role === 'admin';
      const canEditMenu = ['admin', 'manager'].includes(ctx.user.role);

      async function refresh() {
        const [orders, stats, menu, customers] = await Promise.all([
          api('/api/admin/orders'),
          api('/api/admin/stats'),
          canEditMenu ? api('/api/admin/menu') : Promise.resolve({ items: [] }),
          api('/api/admin/customers')
        ]);
        state.orders = orders.orders;
        state.items = menu.items;
        state.customers = customers.customers;
        if (isAdmin) state.staff = (await api('/api/admin/staff')).staff;

        document.getElementById('statsGrid').innerHTML = statsHtml(stats);
        document.getElementById('kanban').innerHTML = kanbanHtml();
        if (canEditMenu) {
          const menuTable = document.getElementById('menuTable');
          if (menuTable) menuTable.innerHTML = menuHtml();
        }
        const customersTable = document.getElementById('customersTable');
        if (customersTable) customersTable.innerHTML = customersHtml();
        if (isAdmin) {
          const staffTable = document.getElementById('staffTable');
          if (staffTable) staffTable.innerHTML = staffHtml(true);
        }
      }

      document.getElementById('adminTabs').addEventListener('click', (event) => {
        const button = event.target.closest('[data-tab]');
        if (!button) return;
        document.querySelectorAll('#adminTabs button').forEach((entry) => entry.classList.toggle('active', entry === button));
        ['orders', 'menu', 'staff', 'customers'].forEach((tab) => {
          const section = document.getElementById(`tab-${tab}`);
          if (section) section.classList.toggle('hidden', tab !== button.dataset.tab);
        });
      });

      document.getElementById('kanban').addEventListener('click', async (event) => {
        const advance = event.target.closest('[data-advance]');
        const cancel = event.target.closest('[data-cancel]');
        const open = event.target.closest('[data-open]');
        if (advance) {
          event.stopPropagation();
          try {
            await api(`/api/admin/orders/${advance.dataset.advance}/status`, {
              method: 'PATCH',
              body: { status: advance.dataset.next }
            });
            UI.toast('Order updated.', 'success');
            refresh();
          } catch (err) {
            UI.toast(err.message, 'error');
          }
        } else if (cancel) {
          event.stopPropagation();
          if (!confirm('Cancel this order?')) return;
          try {
            await api(`/api/admin/orders/${cancel.dataset.cancel}/status`, {
              method: 'PATCH',
              body: { status: 'cancelled' }
            });
            refresh();
          } catch (err) {
            UI.toast(err.message, 'error');
          }
        } else if (open) {
          const order = state.orders.find((entry) => entry.id === Number(open.dataset.open));
          if (order) orderModal(order);
        }
      });

      const menuTable = document.getElementById('menuTable');
      if (menuTable) {
        menuTable.addEventListener('click', async (event) => {
          const save = event.target.closest('[data-save]');
          const toggle = event.target.closest('[data-toggle]');
          const del = event.target.closest('[data-delete]');
          const options = event.target.closest('[data-options]');
          try {
            if (save) {
              const price = Number(document.querySelector(`[data-price="${save.dataset.save}"]`).value);
              await api(`/api/admin/menu/${save.dataset.save}`, { method: 'PATCH', body: { price } });
              UI.toast('Price updated.', 'success');
              refresh();
            } else if (toggle) {
              await api(`/api/admin/menu/${toggle.dataset.toggle}`, {
                method: 'PATCH',
                body: { available: toggle.dataset.avail === '0' }
              });
              refresh();
            } else if (del) {
              if (!confirm('Delete this item?')) return;
              const result = await api(`/api/admin/menu/${del.dataset.delete}`, { method: 'DELETE' });
              UI.toast(result.disabled ? result.message : 'Item deleted.', 'success');
              refresh();
            } else if (options) {
              optionsModal(state.items.find((entry) => entry.id === Number(options.dataset.options)));
            }
          } catch (err) {
            UI.toast(err.message, 'error');
          }
        });
      }

      const addItemForm = document.getElementById('addItemForm');
      if (addItemForm) {
        addItemForm.addEventListener('submit', async (event) => {
          event.preventDefault();
          try {
            await api('/api/admin/menu', {
              method: 'POST',
              body: {
                name: document.getElementById('newName').value,
                description: document.getElementById('newDesc').value,
                category: document.getElementById('newCategory').value,
                price: Number(document.getElementById('newPrice').value),
                icon: document.getElementById('newIcon').value || '🍔'
              }
            });
            UI.toast('Item added.', 'success');
            event.target.reset();
            document.getElementById('newIcon').value = '🍔';
            refresh();
          } catch (err) {
            UI.toast(err.message, 'error');
          }
        });
      }

      if (isAdmin) {
        document.getElementById('staffTable').addEventListener('submit', async (event) => {
          if (event.target.id !== 'staffForm') return;
          event.preventDefault();
          try {
            await api('/api/admin/staff', {
              method: 'POST',
              body: {
                name: document.getElementById('staffName').value,
                email: document.getElementById('staffEmail').value,
                password: document.getElementById('staffPassword').value,
                role: document.getElementById('staffRole').value
              }
            });
            UI.toast('Staff added.', 'success');
            event.target.reset();
            refresh();
          } catch (err) {
            UI.toast(err.message, 'error');
          }
        });
        document.getElementById('staffTable').addEventListener('change', async (event) => {
          const select = event.target.closest('[data-role]');
          if (!select) return;
          try {
            await api(`/api/admin/staff/${select.dataset.role}`, { method: 'PATCH', body: { role: select.value } });
            UI.toast('Role updated.', 'success');
            refresh();
          } catch (err) {
            UI.toast(err.message, 'error');
          }
        });
        const resetBtn = document.getElementById('resetDemo');
        if (resetBtn) {
          resetBtn.addEventListener('click', async () => {
            if (!confirm('Reset all demo orders and customer points?')) return;
            await api('/api/admin/demo/reset', { method: 'POST' });
            UI.toast('Demo data reset.', 'success');
            UI.clearUser();
            refresh();
          });
        }
      }

      document.getElementById('refreshBtn').addEventListener('click', () => {
        refresh();
        UI.toast('Refreshed.', 'success');
      });

      await refresh();
      const disconnect = Live.connect((event) => {
        if (['order:new', 'order:updated', 'stats:changed', 'demo:reset'].includes(event.type)) refresh();
      });
      ctx.onCleanup(disconnect);
    }
  });
})();

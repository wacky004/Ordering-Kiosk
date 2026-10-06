/* Menu ordering view + reusable menu card + item option modal + cart drawer. */
(function () {
  window.menuCard = function menuCard(item, opts = {}) {
    const media = `<div class="menu-card__media">
        <span class="menu-card__emoji">${item.icon || '🍔'}</span>
        ${
          item.image
            ? `<img loading="lazy" decoding="async" src="${item.image}" alt="" onerror="this.remove()">`
            : ''
        }
        ${item.badge ? `<span class="badge">${UI.escapeHtml(item.badge)}</span>` : ''}
      </div>`;
    return `<article class="menu-card ${item.available ? '' : 'menu-card--out'}" data-card="${item.id}">
      ${media}
      <div class="menu-card__body">
        <h4 class="menu-card__name">${UI.escapeHtml(item.name)}</h4>
        ${opts.compact ? '' : `<p class="menu-card__desc">${UI.escapeHtml(item.description)}</p>`}
        <div class="menu-card__foot">
          <span class="price">${Money.format(item.price)}</span>
          ${
            item.available
              ? `<button class="add-btn" type="button" data-pick="${item.id}" aria-label="Add ${UI.escapeHtml(
                  item.name
                )}">+</button>`
              : '<span class="hint">Unavailable</span>'
          }
        </div>
      </div>
    </article>`;
  };

  Router.on('#/menu', {
    active: 'menu',
    auth: false,
    async render(ctx) {
      const data = await api('/api/menu');
      const state = {
        items: data.items,
        categories: data.categories,
        activeCategory: ctx.query.get('category') || 'All',
        query: ''
      };
      window.__menuState = state;

      if (!state.categories.some((c) => c.name === state.activeCategory)) {
        state.activeCategory = 'All';
      }
      const tabs = ['All', ...state.categories.map((c) => c.name)]
        .map(
          (name) =>
            `<button type="button" class="chip ${name === state.activeCategory ? 'active' : ''}" data-cat="${UI.escapeHtml(
              name
            )}">${UI.escapeHtml(name)}</button>`
        )
        .join('');

      return `
        <div class="page">
          <div class="menu-toolbar">
            <div class="search">
              <input type="search" id="menuSearch" placeholder="Search the menu, e.g. Big Mac, fries..." />
            </div>
            <span class="hint menu-toolbar__hint">Tap a card to choose options.</span>
          </div>
          <div class="chips" id="categoryChips">${tabs}</div>
          <section class="menu-grid" id="menuGrid"></section>
        </div>

        <button class="cart-fab" id="cartFab" type="button">
          🛒 <span>Cart</span> <span class="cart-fab__count" id="cartFabCount">0</span>
        </button>

        <aside class="cart-drawer" id="cartDrawer" aria-label="Your order">
          <div class="cart-drawer__head">
            <strong>Your Order</strong>
            <button class="icon-btn" id="cartClose" type="button" aria-label="Close">✕</button>
          </div>
          <div class="cart-drawer__body" id="cartBody"></div>
          <div class="cart-drawer__foot">
            <div class="totals-row"><span>Subtotal</span><span id="cartSubtotal">₱0.00</span></div>
            <div class="totals-row"><span>Points you'll earn</span><span id="cartPoints">0 pts</span></div>
            <button class="btn btn--primary btn--block" id="cartCheckout" type="button">Proceed to Checkout</button>
          </div>
        </aside>
        <div class="drawer-backdrop" id="drawerBackdrop"></div>`;
    },
    mount(ctx) {
      const state = window.__menuState;
      const grid = document.getElementById('menuGrid');
      const chips = document.getElementById('categoryChips');
      const drawer = document.getElementById('cartDrawer');
      const backdrop = document.getElementById('drawerBackdrop');
      const search = document.getElementById('menuSearch');

      function visible() {
        const needle = state.query.trim().toLowerCase();
        return state.items.filter((item) => {
          const inCat = state.activeCategory === 'All' || item.category === state.activeCategory;
          const matches =
            !needle ||
            item.name.toLowerCase().includes(needle) ||
            item.description.toLowerCase().includes(needle) ||
            item.category.toLowerCase().includes(needle);
          return inCat && matches;
        });
      }

      function draw() {
        const list = visible();
        grid.innerHTML = list.length
          ? list.map((item) => menuCard(item)).join('')
          : '<p class="hint">No menu items matched your search.</p>';
      }

      function openDrawer() {
        drawer.classList.add('open');
        backdrop.classList.add('open');
      }
      function closeDrawer() {
        drawer.classList.remove('open');
        backdrop.classList.remove('open');
      }

      function drawCart() {
        const lines = Cart.detailed();
        document.getElementById('cartFabCount').textContent = Cart.count();
        document.getElementById('cartSubtotal').textContent = Money.format(Cart.subtotal());
        document.getElementById('cartPoints').textContent = Math.floor(Cart.subtotal()) + ' pts';
        const body = document.getElementById('cartBody');
        if (lines.length === 0) {
          body.innerHTML = '<div class="cart-empty">🛒<br />Your cart is empty.<br />Add something delicious!</div>';
          document.getElementById('cartCheckout').disabled = true;
          return;
        }
        document.getElementById('cartCheckout').disabled = false;
        body.innerHTML = lines
          .map(
            (line) => `<div class="cart-line">
              <span class="cart-line__icon">${line.icon || '🍔'}</span>
              <div class="cart-line__info">
                <div class="cart-line__name">${UI.escapeHtml(line.name)}</div>
                ${
                  line.options.length
                    ? `<div class="cart-line__opts">${line.options
                        .map((o) => UI.escapeHtml(o.name))
                        .join(' · ')}</div>`
                    : ''
                }
                <div class="cart-line__price">${Money.format(line.unit)} each</div>
              </div>
              <div class="qty">
                <button type="button" data-dec="${line.key}">−</button>
                <span>${line.qty}</span>
                <button type="button" data-inc="${line.key}">+</button>
              </div>
              <strong class="cart-line__total">${Money.format(line.lineTotal)}</strong>
            </div>`
          )
          .join('');
      }

      function openItem(item) {
        const groups = item.options || [];
        UI.openModal(
          `<div class="modal__head">
             <div>
               <h3>${UI.escapeHtml(item.name)}</h3>
               <p class="hint">${UI.escapeHtml(item.description)}</p>
             </div>
             <button class="icon-btn" data-modal-close type="button">✕</button>
           </div>
           <div class="modal__media"><span class="menu-card__emoji">${item.icon || '🍔'}</span>${
            item.image ? `<img src="${item.image}" alt="" onerror="this.remove()">` : ''
          }</div>
           <div class="option-groups">
             ${groups
               .map(
                 (group) => `<div class="option-group" data-group="${group.id}">
                   <div class="option-group__head">
                     <strong>${UI.escapeHtml(group.name)}</strong>
                     <span class="hint">${group.type === 'multi' ? 'Choose any' : group.required ? 'Required' : 'Optional'}</span>
                   </div>
                   <div class="option-list">
                     ${group.options
                       .map(
                         (option) => `<button type="button" class="option-card ${
                           group.type === 'single' && option.is_default ? 'active' : ''
                         }" data-opt="${option.id}" data-group="${group.id}" data-type="${group.type}" data-delta="${
                           option.delta
                         }">
                           <span>${UI.escapeHtml(option.name)}</span>
                           <span class="option-card__delta">${option.delta ? '+' + Money.format(option.delta) : 'Included'}</span>
                         </button>`
                       )
                       .join('')}
                   </div>
                 </div>`
               )
               .join('') || '<p class="hint">No options for this item.</p>'}
           </div>
           <div class="modal__foot">
             <div class="qty qty--lg">
               <button type="button" data-modal-dec>−</button>
               <span data-modal-qty>1</span>
               <button type="button" data-modal-inc>+</button>
             </div>
             <button class="btn btn--primary btn--block" type="button" data-modal-add>
               Add to Order · <span data-modal-total></span>
             </button>
           </div>`,
          (modal) => {
            let qty = 1;
            const selected = new Map();
            groups.forEach((group) => {
              group.options.forEach((option) => {
                if (group.type === 'single' && option.is_default) selected.set(option.id, option);
              });
            });

            function recalc() {
              const delta = [...selected.values()].reduce((sum, option) => sum + Number(option.delta || 0), 0);
              const unit = item.price + delta;
              modal.querySelector('[data-modal-qty]').textContent = qty;
              modal.querySelector('[data-modal-total]').textContent = Money.format(unit * qty);
            }

            modal.querySelectorAll('[data-opt]').forEach((button) => {
              button.addEventListener('click', () => {
                const id = Number(button.dataset.opt);
                const groupId = button.dataset.group;
                const type = button.dataset.type;
                if (type === 'single') {
                  modal
                    .querySelectorAll(`[data-opt][data-group="${groupId}"]`)
                    .forEach((entry) => entry.classList.remove('active'));
                  button.classList.add('active');
                  selected.set(
                    id,
                    groups
                      .find((g) => String(g.id) === groupId)
                      .options.find((o) => o.id === id)
                  );
                } else {
                  button.classList.toggle('active');
                  const group = groups.find((g) => String(g.id) === groupId);
                  const option = group.options.find((o) => o.id === id);
                  if (selected.has(id)) selected.delete(id);
                  else selected.set(id, option);
                }
                recalc();
              });
            });

            modal.querySelector('[data-modal-inc]').addEventListener('click', () => {
              qty = Math.min(50, qty + 1);
              recalc();
            });
            modal.querySelector('[data-modal-dec]').addEventListener('click', () => {
              qty = Math.max(1, qty - 1);
              recalc();
            });

            modal.querySelector('[data-modal-add]').addEventListener('click', () => {
              const resolved = [...selected.values()].map((option) => ({
                id: option.id,
                name: option.name,
                delta: option.delta
              }));
              Cart.add({
                id: item.id,
                name: item.name,
                price: item.price,
                icon: item.icon,
                image: item.image,
                options: resolved,
                qty
              });
              UI.closeModal();
              UI.toast(`${item.name} added to order`, 'success');
              openDrawer();
            });

            recalc();
          }
        );
      }

      chips.addEventListener('click', (event) => {
        const button = event.target.closest('[data-cat]');
        if (!button) return;
        state.activeCategory = button.dataset.cat;
        chips.querySelectorAll('[data-cat]').forEach((entry) =>
          entry.classList.toggle('active', entry === button)
        );
        draw();
      });

      grid.addEventListener('click', (event) => {
        const pick = event.target.closest('[data-pick]');
        if (!pick) return;
        const item = state.items.find((entry) => entry.id === Number(pick.dataset.pick));
        if (item) openItem(item);
      });

      search.addEventListener('input', () => {
        state.query = search.value;
        draw();
      });

      const body = document.getElementById('cartBody');
      body.addEventListener('click', (event) => {
        const inc = event.target.closest('[data-inc]');
        const dec = event.target.closest('[data-dec]');
        if (inc) {
          const line = Cart.read().find((entry) => entry.key === inc.dataset.inc);
          Cart.setQty(line.key, line.qty + 1);
        } else if (dec) {
          const line = Cart.read().find((entry) => entry.key === dec.dataset.dec);
          Cart.setQty(line.key, line.qty - 1);
        }
      });

      document.getElementById('cartFab').addEventListener('click', openDrawer);
      document.getElementById('cartClose').addEventListener('click', closeDrawer);
      backdrop.addEventListener('click', closeDrawer);
      document.getElementById('cartCheckout').addEventListener('click', () => {
        if (Cart.count() === 0) return;
        if (!ctx.user) {
          Router.navigate('#/login?next=' + encodeURIComponent('#/checkout'));
          return;
        }
        Router.navigate('#/checkout');
      });

      const onCartChanged = () => drawCart();
      document.addEventListener('cart:changed', onCartChanged);
      ctx.onCleanup(() => document.removeEventListener('cart:changed', onCartChanged));

      draw();
      drawCart();
    }
  });
})();

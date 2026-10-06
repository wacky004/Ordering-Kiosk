/* Checkout: order type, senior/PWD, points, payment method, summary. */
(function () {
  const VAT_RATE = 0.12;
  const SENIOR_RATE = 0.2;
  const BLOCK = 100;
  const VALUE = 10;

  function round2(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  function preview(lines, availablePoints, redeemPoints, seniorCount) {
    const subtotal = round2(lines.reduce((sum, line) => sum + line.lineTotal, 0));
    const net = round2(subtotal / (1 + VAT_RATE));
    let vatableSales = 0;
    let vatAmount = 0;
    let vatExemptSales = 0;
    let seniorDiscount = 0;
    let afterSenior = subtotal;
    if (seniorCount > 0) {
      vatExemptSales = net;
      seniorDiscount = round2(net * SENIOR_RATE);
      afterSenior = round2(net - seniorDiscount);
    } else {
      vatableSales = net;
      vatAmount = round2(subtotal - net);
    }
    const maxRedeemable = Math.max(0, Math.min(Math.floor(availablePoints / BLOCK) * BLOCK, Math.floor(afterSenior / VALUE) * BLOCK));
    let redeem = redeemPoints - (redeemPoints % BLOCK);
    if (redeem > maxRedeemable) redeem = Math.max(0, maxRedeemable);
    const pointsDiscount = round2((redeem / BLOCK) * VALUE);
    const total = round2(Math.max(0, afterSenior - pointsDiscount));
    return {
      subtotal,
      vatableSales,
      vatAmount,
      vatExemptSales,
      seniorDiscount,
      afterSenior,
      maxRedeemable,
      redeem,
      pointsDiscount,
      total,
      pointsEarned: Math.floor(total)
    };
  }

  Router.on('#/checkout', {
    active: 'menu',
    async render(ctx) {
      if (Cart.count() === 0) {
        return '<div class="page"><div class="card"><h2>Your cart is empty</h2><a class="btn btn--primary" href="#/menu">Browse the menu</a></div></div>';
      }
      const points = ctx.user.points;
      return `
        <div class="page">
          <h1 class="page-title">Checkout</h1>
          <p class="page-subtitle">Review your order, apply discounts and choose a payment method.</p>
          <div class="checkout-grid">
            <div>
              <div class="card section">
                <h3>1. Your order</h3>
                <div id="checkoutItems"></div>
              </div>
              <div class="card section">
                <h3>2. How would you like it?</h3>
                <div class="choice-row" id="typeChoices">
                  <button class="choice active" type="button" data-type="dine-in">🍽️ Dine-in<small>Eat at the store</small></button>
                  <button class="choice" type="button" data-type="takeout">🥡 Take-out<small>Pick up at counter</small></button>
                </div>
              </div>
              <div class="card section">
                <h3>3. Senior / PWD discount</h3>
                <p class="hint">VAT-exempt plus 20% off the net amount, per Philippine law.</p>
                <label class="switch">
                  <input type="checkbox" id="seniorToggle" />
                  <span>Apply Senior / PWD discount</span>
                </label>
                <div class="field hidden" id="seniorCountField">
                  <label for="seniorCount">Number of Senior / PWD diners</label>
                  <input type="number" id="seniorCount" min="1" max="10" value="1" />
                </div>
              </div>
              <div class="card section">
                <h3>4. Payment method</h3>
                <div class="choice-row" id="paymentChoices">
                  <button class="choice active" type="button" data-pay="card">💳 Card<small>Credit / debit</small></button>
                  <button class="choice" type="button" data-pay="gcash">📱 GCash<small>E-wallet</small></button>
                  <button class="choice" type="button" data-pay="cash">💵 Cash<small>Pay at counter</small></button>
                </div>
                <p class="hint" style="margin-top:10px">Simulated payment — no real money is charged.</p>
              </div>
            </div>
            <aside class="card checkout-summary">
              <h3>Order Summary</h3>
              <div id="summaryLines"></div>
              <div class="field" style="margin-top:14px">
                <label for="redeemInput">Redeem points (100 pts = ₱10)</label>
                <input type="number" id="redeemInput" min="0" step="100" value="0" />
                <p class="hint" id="pointsHint"></p>
                <button class="btn btn--ghost btn--sm" type="button" id="maxRedeem" style="margin-top:8px">Use maximum</button>
              </div>
              <div class="summary-line"><span>Subtotal</span><span id="sumSubtotal">₱0.00</span></div>
              <div class="summary-line" id="sumSeniorRow"><span>Senior / PWD discount</span><span id="sumSenior">-₱0.00</span></div>
              <div class="summary-line"><span>Points discount</span><span id="sumPoints">-₱0.00</span></div>
              <div class="summary-line hint" id="sumVatRow"><span>VAT (12%) included</span><span id="sumVat">₱0.00</span></div>
              <div class="summary-total"><span>Total</span><span id="sumTotal">₱0.00</span></div>
              <p class="hint" id="earnHint"></p>
              <button class="btn btn--primary btn--block" id="payBtn" type="button" style="margin-top:12px">Pay & Place Order</button>
              <a class="btn btn--ghost btn--block" href="#/menu" style="margin-top:10px">Back to menu</a>
            </aside>
          </div>
        </div>`;
    },
    mount(ctx) {
      let orderType = 'dine-in';
      let paymentMethod = 'card';
      let senior = false;
      let seniorCount = 1;
      let redeemPoints = 0;
      const availablePoints = ctx.user.points;

      function renderItems() {
        document.getElementById('checkoutItems').innerHTML = Cart.detailed()
          .map(
            (line) => `<div class="cart-line">
              <span class="cart-line__icon">${line.icon || '🍔'}</span>
              <div class="cart-line__info">
                <div class="cart-line__name">${UI.escapeHtml(line.name)}</div>
                ${
                  line.options.length
                    ? `<div class="cart-line__opts">${line.options.map((o) => UI.escapeHtml(o.name)).join(' · ')}</div>`
                    : ''
                }
                <div class="cart-line__price">${Money.format(line.unit)} each</div>
              </div>
              <div class="qty">
                <button type="button" data-dec="${line.key}">−</button>
                <span>${line.qty}</span>
                <button type="button" data-inc="${line.key}">+</button>
              </div>
              <strong>${Money.format(line.lineTotal)}</strong>
            </div>`
          )
          .join('');
      }

      function renderSummary() {
        const lines = Cart.detailed();
        const t = preview(lines, availablePoints, redeemPoints, senior ? seniorCount : 0);
        redeemPoints = t.redeem;

        document.getElementById('summaryLines').innerHTML = lines
          .map(
            (line) =>
              `<div class="summary-line"><span>${line.qty}× ${UI.escapeHtml(line.name)}</span><span>${Money.format(
                line.lineTotal
              )}</span></div>`
          )
          .join('');
        document.getElementById('sumSubtotal').textContent = Money.format(t.subtotal);
        document.getElementById('sumSeniorRow').classList.toggle('hidden', !senior);
        document.getElementById('sumSenior').textContent = '-' + Money.format(t.seniorDiscount);
        document.getElementById('sumPoints').textContent = '-' + Money.format(t.pointsDiscount);
        document.getElementById('sumVatRow').classList.toggle('hidden', senior);
        document.getElementById('sumVat').textContent = Money.format(t.vatAmount);
        document.getElementById('sumTotal').textContent = Money.format(t.total);
        document.getElementById('earnHint').innerHTML = `You will earn <strong>${t.pointsEarned} points</strong> from this order.`;
        document.getElementById('pointsHint').textContent = senior
          ? `You have ${availablePoints} points. After the Senior/PWD discount you can redeem up to ${t.maxRedeemable}.`
          : `You have ${availablePoints} points. You can redeem up to ${t.maxRedeemable} (₱${(t.maxRedeemable / 10).toFixed(
              0
            )} off).`;
        const redeemInput = document.getElementById('redeemInput');
        redeemInput.value = redeemPoints;
        redeemInput.max = String(t.maxRedeemable);
        document.getElementById('maxRedeem').disabled = t.maxRedeemable === 0;
      }

      document.getElementById('checkoutItems').addEventListener('click', (event) => {
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

      document.getElementById('typeChoices').addEventListener('click', (event) => {
        const button = event.target.closest('[data-type]');
        if (!button) return;
        orderType = button.dataset.type;
        document.querySelectorAll('#typeChoices .choice').forEach((entry) => entry.classList.toggle('active', entry === button));
      });

      document.getElementById('paymentChoices').addEventListener('click', (event) => {
        const button = event.target.closest('[data-pay]');
        if (!button) return;
        paymentMethod = button.dataset.pay;
        document.querySelectorAll('#paymentChoices .choice').forEach((entry) => entry.classList.toggle('active', entry === button));
      });

      document.getElementById('seniorToggle').addEventListener('change', (event) => {
        senior = event.target.checked;
        document.getElementById('seniorCountField').classList.toggle('hidden', !senior);
        renderSummary();
      });
      document.getElementById('seniorCount').addEventListener('input', (event) => {
        seniorCount = Math.max(1, Math.min(10, Number(event.target.value) || 1));
        renderSummary();
      });

      document.getElementById('redeemInput').addEventListener('input', (event) => {
        redeemPoints = Number(event.target.value) || 0;
        renderSummary();
      });
      document.getElementById('maxRedeem').addEventListener('click', () => {
        const lines = Cart.detailed();
        redeemPoints = preview(lines, availablePoints, 999999, senior ? seniorCount : 0).maxRedeemable;
        renderSummary();
      });

      let placing = false;
      const onCartChanged = () => {
        if (placing) return; // ignore the empty-cart event we cause when placing
        if (Cart.count() === 0) {
          Router.navigate('#/menu');
          return;
        }
        renderItems();
        renderSummary();
      };
      document.addEventListener('cart:changed', onCartChanged);
      ctx.onCleanup(() => document.removeEventListener('cart:changed', onCartChanged));

      document.getElementById('payBtn').addEventListener('click', async () => {
        const button = document.getElementById('payBtn');
        button.disabled = true;
        const overlay = document.createElement('div');
        overlay.className = 'pay-overlay';
        const label = { card: 'Processing card payment', gcash: 'Waiting for GCash confirmation', cash: 'Confirming your order' }[
          paymentMethod
        ];
        overlay.innerHTML = `<div class="pay-box"><div class="spinner"></div><h3>${label}…</h3><p class="hint">Please do not close this window.</p></div>`;
        document.body.appendChild(overlay);

        const payload = {
          items: Cart.read().map((line) => ({
            id: line.id,
            qty: line.qty,
            options: line.options.map((option) => option.id)
          })),
          orderType,
          paymentMethod,
          redeemPoints,
          seniorPwdCount: senior ? seniorCount : 0
        };

        setTimeout(async () => {
          try {
            const data = await api('/api/orders', { method: 'POST', body: payload });
            placing = true;
            Cart.clear();
            UI.setUser({ ...ctx.user, points: data.points });
            Router.navigate(`#/receipt/${data.order.id}`);
          } catch (err) {
            button.disabled = false;
            UI.toast(err.message, 'error');
          } finally {
            overlay.remove();
          }
        }, paymentMethod === 'cash' ? 800 : 1500);
      });

      renderItems();
      renderSummary();
    }
  });
})();

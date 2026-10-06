/* Loyalty points dashboard. */
(function () {
  Router.on('#/points', {
    active: 'points',
    async render(ctx) {
      const data = await api('/api/orders');
      const worth = Math.floor(ctx.user.points / 100) * 10;
      const tier = ctx.user.points >= 1000 ? '🥇 Gold Member' : ctx.user.points >= 300 ? '🥈 Silver Member' : '🥉 Bronze Member';
      return `
        <div class="page">
          <h1 class="page-title">My Rewards</h1>
          <p class="page-subtitle">Earn points on every order and redeem them for discounts.</p>
          <div class="card points-hero">
            <div>
              <div class="hint">Available points</div>
              <div class="points-hero__value">${ctx.user.points}</div>
              <div>Worth ${Money.format(worth)} off</div>
            </div>
            <div style="text-align:right">
              <div class="points-hero__tier">${tier}</div>
              <a class="btn btn--yellow" href="#/menu" style="margin-top:12px">Order & earn more</a>
            </div>
          </div>

          <div class="card section">
            <h3>How it works</h3>
            <div class="summary-line"><span>Earning</span><span>1 point for every ₱1 spent</span></div>
            <div class="summary-line"><span>Redeeming</span><span>100 points = ₱10 discount</span></div>
            <div class="summary-line"><span>Where to use</span><span>At checkout, before payment</span></div>
          </div>

          <div class="card section">
            <h3>Points history</h3>
            ${
              data.orders.length
                ? `<div class="table-scroll"><table class="data">
                    <thead><tr><th>Order</th><th>Date</th><th>Earned</th><th>Redeemed</th><th>Total</th></tr></thead>
                    <tbody>${data.orders
                      .map(
                        (order) => `<tr>
                          <td><a href="#/order/${order.id}">${UI.escapeHtml(order.code)}</a></td>
                          <td>${UI.formatDate(order.created_at)}</td>
                          <td class="pos">+${order.points_earned}</td>
                          <td class="neg">${order.points_redeemed ? '-' + order.points_redeemed : '—'}</td>
                          <td>${Money.format(order.total)}</td>
                        </tr>`
                      )
                      .join('')}</tbody>
                  </table></div>`
                : '<p class="empty-note">No points activity yet. Place your first order!</p>'
            }
          </div>
        </div>`;
    }
  });
})();

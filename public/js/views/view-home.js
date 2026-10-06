/* Landing page (route #/). */
(function () {
  const arches = `<svg class="hero__arches" viewBox="0 0 100 100" aria-hidden="true"><path d="${UI.LOGO_PATH}" fill="#fff"/></svg>`;

  const steps = [
    { icon: '🍔', title: '1. Pick your food', text: 'Browse by category and tap any card to choose size, drink or add-ons.' },
    { icon: '🛒', title: '2. Review your order', text: 'Your card stays in the order panel with a running total.' },
    { icon: '💳', title: '3. Pay your way', text: 'Card, GCash or cash — then get a printable receipt.' },
    { icon: '📦', title: '4. Track & earn', text: 'Follow your order live and earn 1 point for every ₱1 spent.' }
  ];

  Router.on('#/', {
    active: 'home',
    auth: false,
    async render(ctx) {
      let featured = [];
      let categories = [];
      try {
        const data = await api('/api/menu');
        featured = data.items.filter((item) => item.available && item.badge === 'Bestseller').slice(0, 6);
        categories = data.categories;
      } catch (err) {
        /* menu is optional on the landing page */
      }

      const featuredHtml = featured.length
        ? `<div class="menu-grid menu-grid--landing">${featured
            .map((item) => window.menuCard(item, { compact: true }))
            .join('')}</div>`
        : '<p class="hint">Menu is loading…</p>';

      return `
        <section class="hero">
          ${arches}
          <div class="hero__inner">
            <span class="hero__eyebrow">Self-order kiosk demo</span>
            <h1>Welcome to the McDo Kiosk</h1>
            <p>Pick your favorites, pay, track your order live and collect points — the same app runs on desktop, mobile, tablet and kiosk screens.</p>
            <div class="hero__actions">
              <a class="btn btn--yellow" href="#/menu">Order now</a>
              ${
                ctx.user
                  ? '<a class="btn btn--ghost-light" href="#/orders">My orders</a>'
                  : '<a class="btn btn--ghost-light" href="#/login">Sign in</a>'
              }
              <a class="btn btn--ghost-light" href="#/platforms">See all platforms</a>
              <a class="btn btn--ghost-light" href="#/demo">Class demo accounts</a>
            </div>
            <div class="hero__stats">
              <span><strong>49</strong> menu items</span>
              <span><strong>1 pt</strong> per ₱1 spent</span>
              <span><strong>12%</strong> VAT-ready receipts</span>
            </div>
          </div>
        </section>

        <section class="page page--tight">
          <div class="section__head">
            <h2>Bestsellers</h2>
            <a href="#/menu">View full menu →</a>
          </div>
          ${featuredHtml}

          <div class="section__head section__head--spaced">
            <h2>Browse by category</h2>
          </div>
          <div class="category-tiles">
            ${categories
              .map(
                (cat) => `<a class="category-tile" href="#/menu?category=${encodeURIComponent(cat.name)}">
                  <span class="category-tile__icon">${cat.icon}</span>
                  <span>${UI.escapeHtml(cat.name)}</span>
                </a>`
              )
              .join('')}
          </div>

          <div class="section__head section__head--spaced"><h2>How it works</h2></div>
          <div class="steps">
            ${steps
              .map(
                (step) => `<div class="step card">
                  <span class="step__icon">${step.icon}</span>
                  <h4>${step.title}</h4>
                  <p class="hint">${step.text}</p>
                </div>`
              )
              .join('')}
          </div>

          <section class="promo-band card">
            <div>
              <h2>Earn rewards every visit</h2>
              <p class="hint">1 point for every ₱1 spent. Redeem 100 points for ₱10 off at checkout.</p>
            </div>
            <a class="btn btn--yellow" href="#/points">See my points</a>
          </section>

          <footer class="site-footer">
            <span>McDo Kiosk demo · teaching project</span>
            <nav>
              <a href="#/menu">Menu</a>
              <a href="#/platforms">Platforms</a>
              <a href="#/demo">Demo</a>
              <a href="#/credits">Photo credits</a>
              <a href="#/login">Sign in</a>
            </nav>
          </footer>
        </section>`;
    }
  });
})();

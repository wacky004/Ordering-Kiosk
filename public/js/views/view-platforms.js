/* Multi-device showcase: live iframes when served, static previews offline. */
(function () {
  const DEVICES = [
    { kind: 'phone', label: 'Phone', note: 'Mobile-first: bottom nav, bottom-sheet cart' },
    { kind: 'tablet', label: 'Tablet', note: 'Two-column grid, larger touch targets' },
    { kind: 'desktop', label: 'Desktop', note: 'Category rail + dense grid + order panel' },
    { kind: 'kiosk', label: 'Kiosk', note: 'Big tiles and oversized buttons' }
  ];

  function canUseIframes() {
    return !window.IS_OFFLINE && !window.__SINGLE_FILE__ && location.protocol !== 'file:';
  }

  function staticPreview(kind) {
    const card = (icon, name, price) => `<div class="pv-card"><span>${icon}</span><b>${name}</b><i>${price}</i></div>`;
    if (kind === 'phone') {
      return `<div class="pv pv--phone">
        <div class="pv-bar">${UI.logoMark()}<span>McDonald's</span></div>
        <div class="pv-search">Search the menu…</div>
        <div class="pv-grid">${card('🍔', 'Big Mac', '₱178')}${card('🍗', 'Chicken', '₱95')}</div>
        <div class="pv-nav"><span class="on">Menu</span><span>Orders</span><span>Points</span></div>
      </div>`;
    }
    if (kind === 'tablet') {
      return `<div class="pv pv--tablet">
        <div class="pv-bar">${UI.logoMark()}<span>McDonald's</span></div>
        <div class="pv-chips"><span class="on">All</span><span>Burgers</span><span>Chicken</span><span>Drinks</span></div>
        <div class="pv-grid">${card('🍔', 'Big Mac', '₱178')}${card('🍟', 'Fries', '₱65')}${card('🍝', 'Spaghetti', '₱78')}${card('🥤', 'Coke', '₱55')}</div>
      </div>`;
    }
    if (kind === 'kiosk') {
      return `<div class="pv pv--kiosk">
        <div class="pv-rail">${['🍔', '🍗', '🍝', '🍟', '🍨', '🥤'].map((i) => `<span>${i}</span>`).join('')}</div>
        <div class="pv-main">
          <div class="pv-tiles">${card('🍔', 'Big Mac', '₱178')}${card('🍗', 'Chicken', '₱95')}${card('🍟', 'Fries', '₱65')}${card('🥤', 'Coke', '₱55')}</div>
          <div class="pv-cart"><b>Your Order</b><div class="pv-line">2× Big Mac <i>₱356</i></div><div class="pv-line">1× Fries <i>₱65</i></div><div class="pv-total">Total ₱421</div><button>Place Order</button></div>
        </div>
      </div>`;
    }
    return `<div class="pv pv--desktop">
      <div class="pv-bar">${UI.logoMark()}<span>McDonald's</span><nav><a>Menu</a><a>Orders</a><a>Points</a></nav></div>
      <div class="pv-body">
        <div class="pv-rail">${['🍔 Burgers', '🍗 Chicken', '🍟 Fries', '🥤 Drinks'].map((i) => `<span>${i}</span>`).join('')}</div>
        <div class="pv-grid">${card('🍔', 'Big Mac', '₱178')}${card('🍗', 'Chicken', '₱95')}${card('🍝', 'Spaghetti', '₱78')}${card('🍟', 'Fries', '₱65')}${card('🍨', 'McFlurry', '₱65')}${card('🥤', 'Coke', '₱55')}</div>
      </div>
    </div>`;
  }

  Router.on('#/platforms', {
    active: 'platforms',
    auth: false,
    async render() {
      const live = canUseIframes();
      return `
        <div class="page">
          <h1 class="page-title">One app, every platform</h1>
          <p class="page-subtitle">The same code and data render for phone, tablet, desktop and kiosk. ${
            live ? 'These frames are live — click around inside them.' : 'Offline preview shown (live frames need the server).'
          }</p>
          <div class="platform-grid">
            ${DEVICES.map(
              (device) => `<section class="platform">
                <header><h3>${device.label}</h3><span class="hint">${device.note}</span></header>
                <div class="device device--${device.kind}">
                  <div class="device__screen" data-frame="${device.kind}">
                    ${
                      live
                        ? `<iframe title="${device.label}" loading="lazy" src="index.html?embed=1&layout=${device.kind}#/menu"></iframe>`
                        : staticPreview(device.kind)
                    }
                  </div>
                </div>
              </section>`
            ).join('')}
          </div>
          <div class="card section">
            <h3>Try the layout switcher</h3>
            <p class="hint">Force any of these profiles on your own screen:</p>
            <div class="choice-row">
              <button class="choice" data-layout="auto">Auto<small>Follow screen size</small></button>
              <button class="choice" data-layout="mobile">Mobile<small>Bottom nav</small></button>
              <button class="choice" data-layout="desktop">Desktop<small>Side rails</small></button>
              <button class="choice" data-layout="kiosk">Kiosk<small>Big tiles</small></button>
            </div>
          </div>
        </div>`;
    },
    mount() {
      document.querySelectorAll('[data-layout]').forEach((button) => {
        button.addEventListener('click', () => {
          UI.setLayout(button.dataset.layout);
          document
            .querySelectorAll('[data-layout]')
            .forEach((entry) => entry.classList.toggle('active', entry === button));
          UI.toast(`Layout: ${button.dataset.layout}`, 'success');
        });
      });
    }
  });
})();

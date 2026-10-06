/* Shared UI helpers: logo, header, toasts, modals, theme/layout profiles. */
(function () {
  const LOGO_PATH =
    'M12 94 L12 46 C12 22 18 8 33 8 C43 8 48 26 50 46 C52 26 57 8 67 8 C82 8 88 22 88 46 L88 94 L74 94 L74 46 C74 30 70 20 66 20 C60 20 57 36 56 54 L56 94 L44 94 L44 54 C43 36 40 20 34 20 C30 20 26 30 26 46 L26 94 Z';

  const STATUS_LABELS = {
    received: 'Order Received',
    preparing: 'Preparing',
    ready: 'Ready for Pickup',
    completed: 'Completed',
    cancelled: 'Cancelled'
  };
  const STATUS_ICONS = {
    received: '🧾',
    preparing: '👨‍🍳',
    ready: '🔔',
    completed: '✅',
    cancelled: '❌'
  };
  const STATUS_STEPS = ['received', 'preparing', 'ready', 'completed'];
  const ROLE_LABELS = {
    user: 'Customer',
    kitchen: 'Kitchen',
    cashier: 'Cashier',
    manager: 'Manager',
    admin: 'Administrator'
  };

  let cachedUser = null;
  let userLoaded = false;

  function logoMark() {
    return `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="${LOGO_PATH}" fill="#FFC72C"/></svg>`;
  }

  function escapeHtml(value) {
    return String(value === undefined || value === null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function statusBadge(status) {
    return `<span class="status status--${status}">${STATUS_ICONS[status] || ''} ${
      STATUS_LABELS[status] || status
    }</span>`;
  }

  function relativeTime(value) {
    if (!value) return '';
    const normalized = String(value).includes('T') ? value : String(value).replace(' ', 'T') + 'Z';
    const date = new Date(normalized);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' });
  }

  function formatDate(value) {
    if (!value) return '';
    const normalized = String(value).includes('T') ? value : String(value).replace(' ', 'T') + 'Z';
    const date = new Date(normalized);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString('en-PH', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  function toast(message, type = '') {
    const wrap = document.getElementById('toastWrap');
    if (!wrap) return;
    const el = document.createElement('div');
    el.className = 'toast' + (type ? ` toast--${type}` : '');
    el.textContent = message;
    wrap.appendChild(el);
    setTimeout(() => el.remove(), 2800);
  }

  /* ----- theme + layout profiles ----- */
  function getTheme() {
    return localStorage.getItem('mcdo.theme') || 'kiosk';
  }
  function setTheme(theme) {
    localStorage.setItem('mcdo.theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }
  function getLayout() {
    return localStorage.getItem('mcdo.layout') || 'auto';
  }
  function setLayout(layout) {
    localStorage.setItem('mcdo.layout', layout);
    document.documentElement.setAttribute('data-layout', layout);
  }
  function toggleTheme() {
    setTheme(getTheme() === 'kiosk' ? 'classic' : 'kiosk');
  }

  async function currentUser(force = false) {
    if (userLoaded && !force) return cachedUser;
    try {
      const data = await api('/api/auth/me');
      cachedUser = data.user;
    } catch (err) {
      cachedUser = null;
    }
    userLoaded = true;
    return cachedUser;
  }
  function setUser(user) {
    cachedUser = user;
    userLoaded = true;
  }
  function clearUser() {
    cachedUser = null;
    userLoaded = true;
  }

  function navLink(href, label, active, key) {
    return `<a href="${href}" class="nav-link ${active === key ? 'active' : ''}">${escapeHtml(
      label
    )}</a>`;
  }

  function renderHeader(user, active) {
    const holder = document.getElementById('header');
    if (!holder) return;
    const isStaff = user && ['kitchen', 'cashier', 'manager', 'admin'].includes(user.role);
    const canAdmin = user && ['cashier', 'manager', 'admin'].includes(user.role);
    const canKitchen = user && ['kitchen', 'manager', 'admin'].includes(user.role);

    const links = [
      navLink('#/', 'Home', active, 'home'),
      navLink('#/menu', 'Menu', active, 'menu'),
      navLink('#/platforms', 'Platforms', active, 'platforms')
    ];
    if (user) {
      links.push(navLink('#/orders', 'My Orders', active, 'orders'));
      links.push(navLink('#/points', 'Points', active, 'points'));
    }
    if (canKitchen) links.push(navLink('#/kitchen', 'Kitchen', active, 'kitchen'));
    if (canAdmin) links.push(navLink('#/admin', 'Admin', active, 'admin'));

    const controls = user
      ? `<span class="points-chip" title="Loyalty points">🏅 ${user.points} pts</span>
         <span class="role-chip">${escapeHtml(ROLE_LABELS[user.role] || user.role)}</span>
         <button type="button" class="nav-btn" data-logout>Log out</button>`
      : `<a class="nav-btn" href="#/login">Sign in</a>
         <a class="nav-btn nav-btn--solid" href="#/register">Register</a>`;

    holder.innerHTML = `
      <header class="site-header">
        <div class="site-header__inner">
          <a class="brand" href="#/">
            <span class="brand__logo">${logoMark()}</span>
            <span class="brand__text">McDonald's<small>Order Kiosk</small></span>
          </a>
          <button type="button" class="hamburger" data-menu-toggle aria-label="Toggle navigation">
            <span></span><span></span><span></span>
          </button>
          <nav class="nav" data-nav>
            ${links.join('')}
            <div class="nav__controls">${controls}</div>
          </nav>
          <div class="header-tools">
            <button type="button" class="tool-btn" data-theme-toggle title="Toggle kiosk / classic look">
              ${getTheme() === 'kiosk' ? '🖥️ Kiosk' : '🎛️ Classic'}
            </button>
          </div>
        </div>
      </header>`;

    holder.querySelector('[data-menu-toggle]').addEventListener('click', () => {
      holder.querySelector('[data-nav]').classList.toggle('open');
    });
    const themeBtn = holder.querySelector('[data-theme-toggle]');
    themeBtn.addEventListener('click', () => {
      toggleTheme();
      themeBtn.textContent = getTheme() === 'kiosk' ? '🖥️ Kiosk' : '🎛️ Classic';
      document.dispatchEvent(new CustomEvent('theme:changed'));
    });
    const logout = holder.querySelector('[data-logout]');
    if (logout) {
      logout.addEventListener('click', async () => {
        try {
          await api('/api/auth/logout', { method: 'POST' });
        } catch (err) {
          /* ignore */
        }
        clearUser();
        Cart.clear();
        toast('Signed out.', 'success');
        Router.navigate('#/');
      });
    }
  }

  /* ----- modal ----- */
  function openModal(html, onMount) {
    const root = document.getElementById('modal-root');
    root.innerHTML = `<div class="modal-back" data-modal-back><div class="modal" role="dialog">${html}</div></div>`;
    const back = root.querySelector('[data-modal-back]');
    back.addEventListener('click', (event) => {
      if (event.target === back || event.target.closest('[data-modal-close]')) closeModal();
    });
    if (onMount) onMount(root.querySelector('.modal'));
  }
  function closeModal() {
    document.getElementById('modal-root').innerHTML = '';
  }

  function closeOverlays() {
    document.querySelectorAll('.pay-overlay').forEach((el) => el.remove());
    const drawer = document.querySelector('.cart-drawer.open');
    const backdrop = document.querySelector('.drawer-backdrop.open');
    if (drawer) drawer.classList.remove('open');
    if (backdrop) backdrop.classList.remove('open');
  }

  /* ----- device preview frame (used by the platforms showcase) ----- */
  function deviceFrame(kind) {
    return `<div class="device device--${kind}"><div class="device__screen" data-frame="${kind}"></div></div>`;
  }

  function progressStrip(status) {
    const currentIndex = STATUS_STEPS.indexOf(status);
    return `<div class="progress-track">${STATUS_STEPS.map((step, index) => {
      const on = status !== 'cancelled' && index <= currentIndex;
      const active = status !== 'cancelled' && index === currentIndex && step !== 'completed';
      return `<i class="${on ? 'on' : ''} ${active ? 'active' : ''}"></i>`;
    }).join('')}</div>`;
  }

  window.UI = {
    LOGO_PATH,
    STATUS_LABELS,
    STATUS_ICONS,
    STATUS_STEPS,
    ROLE_LABELS,
    logoMark,
    escapeHtml,
    statusBadge,
    formatDate,
    relativeTime,
    toast,
    currentUser,
    setUser,
    clearUser,
    renderHeader,
    openModal,
    closeModal,
    closeOverlays,
    deviceFrame,
    progressStrip,
    getTheme,
    setTheme,
    toggleTheme,
    getLayout,
    setLayout
  };
})();

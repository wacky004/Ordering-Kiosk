/* Auth views: login, register, and the classroom demo launcher. */
(function () {
  function homeFor(user) {
    if (user.role === 'kitchen') return '#/kitchen';
    if (['admin', 'manager', 'cashier'].includes(user.role)) return '#/admin';
    return '#/menu';
  }

  async function signIn(email, password) {
    const data = await api('/api/auth/login', { method: 'POST', body: { email, password } });
    UI.setUser(data.user);
    return data.user;
  }

  Router.on('#/login', {
    active: 'login',
    auth: false,
    async render(ctx) {
      if (ctx.user) return `<div class="page"><div class="card"><h2>You are already signed in</h2><a class="btn btn--primary" href="${homeFor(
        ctx.user
      )}">Continue</a></div></div>`;
      return `
        <div class="auth-wrap">
          <div class="auth-card card">
            <div class="auth-logo">${UI.logoMark()}</div>
            <h2 style="text-align:center">Welcome back!</h2>
            <p class="hint" style="text-align:center;margin-bottom:18px">Sign in to order and earn points.</p>
            <div class="error-text hidden" id="authError"></div>
            <form id="loginForm">
              <div class="field"><label for="email">Email</label><input type="email" id="email" required placeholder="you@email.com" /></div>
              <div class="field"><label for="password">Password</label><input type="password" id="password" required placeholder="••••••" /></div>
              <button class="btn btn--primary btn--block" type="submit">Sign in</button>
            </form>
            <p class="hint" style="text-align:center;margin-top:16px">No account? <a href="#/register">Create one</a></p>
            <hr class="rule" />
            <p class="hint" style="text-align:center">Quick demo accounts</p>
            <div class="choice-row">
              <button class="choice" type="button" data-fill="juan@email.com|user123">Customer<small>juan@email.com</small></button>
              <button class="choice" type="button" data-fill="kitchen@mcdo.ph|kitchen123">Kitchen<small>kitchen@mcdo.ph</small></button>
              <button class="choice" type="button" data-fill="admin@mcdo.ph|admin123">Admin<small>admin@mcdo.ph</small></button>
            </div>
          </div>
        </div>`;
    },
    mount(ctx) {
      const next = ctx.query.get('next');
      document.querySelectorAll('[data-fill]').forEach((button) => {
        button.addEventListener('click', () => {
          const [email, password] = button.dataset.fill.split('|');
          document.getElementById('email').value = email;
          document.getElementById('password').value = password;
        });
      });
      document.getElementById('loginForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        const errorBox = document.getElementById('authError');
        errorBox.classList.add('hidden');
        try {
          const user = await signIn(
            document.getElementById('email').value,
            document.getElementById('password').value
          );
          UI.toast(`Welcome, ${user.name}!`, 'success');
          Router.navigate(next || homeFor(user));
        } catch (err) {
          errorBox.textContent = err.message;
          errorBox.classList.remove('hidden');
        }
      });
    }
  });

  Router.on('#/register', {
    active: 'register',
    auth: false,
    async render(ctx) {
      if (ctx.user) return '<div class="page"><div class="card"><h2>You are already signed in</h2><a class="btn btn--primary" href="#/menu">Go to menu</a></div></div>';
      return `
        <div class="auth-wrap">
          <div class="auth-card card">
            <div class="auth-logo">${UI.logoMark()}</div>
            <h2 style="text-align:center">Create your account</h2>
            <p class="hint" style="text-align:center;margin-bottom:18px">Earn 1 point for every ₱1 you spend.</p>
            <div class="error-text hidden" id="authError"></div>
            <form id="registerForm">
              <div class="field"><label for="name">Full name</label><input type="text" id="name" required placeholder="Juan Dela Cruz" /></div>
              <div class="field"><label for="email">Email</label><input type="email" id="email" required placeholder="you@email.com" /></div>
              <div class="field"><label for="password">Password</label><input type="password" id="password" required minlength="6" placeholder="At least 6 characters" /></div>
              <button class="btn btn--primary btn--block" type="submit">Create account</button>
            </form>
            <p class="hint" style="text-align:center;margin-top:16px">Already registered? <a href="#/login">Sign in</a></p>
          </div>
        </div>`;
    },
    mount() {
      document.getElementById('registerForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        const errorBox = document.getElementById('authError');
        errorBox.classList.add('hidden');
        try {
          const data = await api('/api/auth/register', {
            method: 'POST',
            body: {
              name: document.getElementById('name').value,
              email: document.getElementById('email').value,
              password: document.getElementById('password').value
            }
          });
          UI.setUser(data.user);
          UI.toast(`Welcome, ${data.user.name}!`, 'success');
          Router.navigate('#/menu');
        } catch (err) {
          errorBox.textContent = err.message;
          errorBox.classList.remove('hidden');
        }
      });
    }
  });

  Router.on('#/demo', {
    active: 'demo',
    auth: false,
    async render(ctx) {
      const demo = (window.SEED && window.SEED.DEMO_ACCOUNTS) || {
        customer: { email: 'juan@email.com', password: 'user123', label: 'Customer Kiosk', icon: '🍔', route: '#/menu' },
        kitchen: { email: 'kitchen@mcdo.ph', password: 'kitchen123', label: 'Kitchen Display', icon: '👨‍🍳', route: '#/kitchen' },
        admin: { email: 'admin@mcdo.ph', password: 'admin123', label: 'Admin Dashboard', icon: '📊', route: '#/admin' }
      };
      return `
        <div class="page">
          <h1 class="page-title">Class demo launcher</h1>
          <p class="page-subtitle">One tap signs you in as each role. Open two browser tabs to watch orders update live.</p>
          <div class="demo-grid">
            ${Object.values(demo)
              .map(
                (account) => `<button class="demo-card card" type="button" data-demo='${UI.escapeHtml(
                  JSON.stringify(account)
                )}'>
                  <span class="demo-card__icon">${account.icon}</span>
                  <h3>${UI.escapeHtml(account.label)}</h3>
                  <p class="hint">${UI.escapeHtml(account.email)}</p>
                  <span class="btn btn--primary btn--sm">Enter</span>
                </button>`
              )
              .join('')}
          </div>
          <div class="card section" style="margin-top:20px">
            <h3>How to demo live updates</h3>
            <p class="hint">Open the Customer kiosk in one tab and the Kitchen display in another. Place an order in the kiosk, then advance it in the kitchen — the customer tracker updates without a refresh.</p>
          </div>
        </div>`;
    },
    mount() {
      document.querySelectorAll('[data-demo]').forEach((button) => {
        button.addEventListener('click', async () => {
          const account = JSON.parse(button.dataset.demo);
          try {
            const user = await signIn(account.email, account.password);
            UI.toast(`Signed in as ${user.name}`, 'success');
            Router.navigate(account.route);
          } catch (err) {
            UI.toast(err.message, 'error');
          }
        });
      });
    }
  });
})();

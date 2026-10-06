/* Hash router. Views register with Router.on(pattern, view). */
(function () {
  const routes = [];
  let cleanups = [];

  function on(pattern, view) {
    // Normalise patterns so both '#/menu' and '/menu' work.
    routes.push({ pattern: String(pattern).replace(/^#/, ''), view });
  }

  function navigate(hash) {
    if (location.hash === hash) render();
    else location.hash = hash;
  }

  function parse() {
    const raw = (location.hash || '#/').slice(1) || '/';
    const qIndex = raw.indexOf('?');
    const path = qIndex === -1 ? raw : raw.slice(0, qIndex);
    const queryString = qIndex === -1 ? '' : raw.slice(qIndex + 1);
    return {
      segments: path.split('/').filter(Boolean),
      query: new URLSearchParams(queryString),
      hash: location.hash || '#/'
    };
  }

  function match(segments) {
    for (const route of routes) {
      const parts = route.pattern.split('/').filter(Boolean);
      if (parts.length !== segments.length) continue;
      const params = {};
      let ok = true;
      for (let i = 0; i < parts.length; i += 1) {
        if (parts[i][0] === ':') params[parts[i].slice(1)] = decodeURIComponent(segments[i]);
        else if (parts[i] !== segments[i]) {
          ok = false;
          break;
        }
      }
      if (ok) return { view: route.view, params };
    }
    return null;
  }

  async function render() {
    const { segments, query, hash } = parse();
    const matched = match(segments);
    const app = document.getElementById('app');
    if (!matched) {
      // Unknown route: go home, but never recurse if we are already there.
      if (location.hash === '#/' || location.hash === '') {
        app.innerHTML =
          '<div class="page"><div class="card error-card"><h2>Page not found</h2>' +
          '<p class="hint">That screen does not exist.</p>' +
          '<a class="btn btn--primary" href="#/">Back to home</a></div></div>';
        window.__kioskReady = true;
        return;
      }
      location.hash = '#/';
      return;
    }
    const view = matched.view;
    const user = await UI.currentUser();

    if (view.auth !== false && !user) {
      const next = encodeURIComponent(hash);
      if (location.hash !== `#/login?next=${next}`) {
        location.hash = `#/login?next=${next}`;
        return;
      }
    }
    if (view.roles && (!user || !view.roles.includes(user.role))) {
      UI.toast('You do not have access to that page.', 'error');
      location.hash = '#/';
      return;
    }

    cleanups.forEach((fn) => {
      try {
        fn();
      } catch (err) {
        /* ignore teardown errors */
      }
    });
    cleanups = [];
    UI.closeModal();
    UI.closeOverlays();
    UI.renderHeader(user, view.active || '');
    app.innerHTML = '<div class="view-loading"><div class="spinner"></div><p class="hint">Loading…</p></div>';

    const ctx = {
      params: matched.params || {},
      query,
      path: segments.join('/'),
      hash,
      user,
      view,
      navigate,
      onCleanup(fn) {
        cleanups.push(fn);
      }
    };

    try {
      const html = await view.render(ctx);
      app.innerHTML = html || '';
      window.__kioskReady = true;
      document.body.dataset.view = view.active || segments.join('-') || 'home';
      if (view.mount) view.mount(ctx);
      window.scrollTo({ top: 0 });
    } catch (err) {
      app.innerHTML = `<div class="page"><div class="card error-card"><h2>Something went wrong</h2><p>${UI.escapeHtml(
        err.message || String(err)
      )}</p><a class="btn btn--primary" href="#/">Back to home</a></div></div>`;
    }
  }

  function start() {
    window.addEventListener('hashchange', render);
    if (!location.hash) location.hash = '#/';
    else render();
  }

  window.Router = { on, start, render, navigate, routes };
})();

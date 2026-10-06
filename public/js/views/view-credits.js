/* Photo credits for the downloaded menu images. */
(function () {
  Router.on('#/credits', {
    active: 'credits',
    auth: false,
    async render() {
      let credits = window.__CREDITS__ || null;
      if (!credits && !window.IS_OFFLINE) {
        try {
          const response = await fetch('/img/menu/credits.json');
          if (response.ok) credits = await response.json();
        } catch (err) {
          credits = null;
        }
      }
      const list = Array.isArray(credits) ? credits : credits && credits.items;
      return `
        <div class="page page--narrow">
          <h1 class="page-title">Photo credits</h1>
          <p class="page-subtitle">Menu photos are downloaded from Wikimedia Commons with an Openverse fallback. Attribution is listed below.</p>
          <div class="card">
            ${
              list && list.length
                ? `<div class="table-scroll"><table class="data">
                    <thead><tr><th>Item</th><th>Author</th><th>License</th><th>Source</th></tr></thead>
                    <tbody>${list
                      .map(
                        (credit) => `<tr>
                          <td>${UI.escapeHtml(credit.slug || credit.title || '')}</td>
                          <td>${UI.escapeHtml(credit.author || 'Unknown')}</td>
                          <td>${UI.escapeHtml(credit.license || '')}</td>
                          <td>${
                            credit.sourceUrl
                              ? `<a href="${UI.escapeHtml(credit.sourceUrl)}" target="_blank" rel="noopener">link</a>`
                              : '—'
                          }</td>
                        </tr>`
                      )
                      .join('')}</tbody>
                  </table></div>`
                : `<p class="hint">No credits file found yet. Run <code>npm run images</code> to download menu photos and generate <code>public/img/menu/credits.json</code>.</p>`
            }
          </div>
        </div>`;
    }
  });
})();

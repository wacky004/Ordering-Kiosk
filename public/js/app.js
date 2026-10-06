(function () {
  const params = new URLSearchParams(location.search);
  if (params.has('layout')) {
    document.documentElement.setAttribute('data-layout', params.get('layout'));
  }
  if (params.get('embed') === '1') {
    document.body.classList.add('embed');
  }

  // Skip the service worker on localhost so development is never served from a
  // stale cache. It still runs on a real host (for the installable PWA demo).
  const host = location.hostname;
  const isLocalHost = host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '0.0.0.0';
  if ('serviceWorker' in navigator && location.protocol !== 'file:' && !isLocalHost) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    });
  } else if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    // Clear any previously installed worker on localhost.
    navigator.serviceWorker
      .getRegistrations()
      .then((regs) => regs.forEach((reg) => reg.unregister()))
      .catch(() => {});
  }

  Router.start();
})();

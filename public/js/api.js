/* API adapter: talks to the Express server when online, or the localStorage
   mock backend when the single-file build is opened from file://. */
(function () {
  const isOffline =
    (typeof location !== 'undefined' && location.protocol === 'file:') ||
    window.__OFFLINE__ === true;

  async function api(path, options = {}) {
    if (isOffline && window.MockApi) {
      return window.MockApi.request(path, options);
    }
    const config = {
      method: options.method || 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin'
    };
    if (options.body !== undefined) config.body = JSON.stringify(options.body);

    const response = await fetch(path, config);
    const text = await response.text();
    let data = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch (err) {
        data = null;
      }
    }
    if (!response.ok) {
      const error = new Error((data && data.error) || `Request failed (${response.status})`);
      error.status = response.status;
      throw error;
    }
    return data;
  }

  const Money = {
    format(value) {
      return (
        '₱' +
        Number(value || 0).toLocaleString('en-PH', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })
      );
    }
  };

  window.api = api;
  window.Money = Money;
  window.IS_OFFLINE = isOffline;
})();

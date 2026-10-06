/* Live updates: SSE when served, localStorage polling when offline. */
(function () {
  const TYPES = ['ready', 'order:new', 'order:updated', 'stats:changed', 'demo:reset'];

  function connect(onEvent) {
    if (window.IS_OFFLINE && window.MockApi) {
      return window.MockApi.subscribe(onEvent);
    }
    let source;
    try {
      source = new EventSource('/api/events');
    } catch (err) {
      return function () {};
    }
    const handlers = TYPES.map((type) => {
      const handler = (event) => {
        let data = {};
        try {
          data = JSON.parse(event.data || '{}');
        } catch (err) {
          /* ignore malformed payloads */
        }
        onEvent({ type, data });
      };
      source.addEventListener(type, handler);
      return [type, handler];
    });
    return function () {
      handlers.forEach(([type, handler]) => source.removeEventListener(type, handler));
      source.close();
    };
  }

  window.Live = { connect };
})();

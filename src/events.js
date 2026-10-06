'use strict';

const { EventEmitter } = require('node:events');

const bus = new EventEmitter();
bus.setMaxListeners(0);

/** Publish an application event to every connected SSE client. */
function emit(type, payload = {}) {
  bus.emit('event', { type, payload, at: new Date().toISOString() });
}

/** Express handler for GET /api/events (Server-Sent Events). */
function sseHandler(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no'
  });
  res.write('retry: 3000\n\n');
  res.write('event: ready\ndata: {"ok":true}\n\n');

  const listener = (message) => {
    res.write(`event: ${message.type}\ndata: ${JSON.stringify(message.payload)}\n\n`);
  };
  bus.on('event', listener);

  const ping = setInterval(() => res.write(': ping\n\n'), 25000);
  req.on('close', () => {
    clearInterval(ping);
    bus.off('event', listener);
  });
}

module.exports = { emit, sseHandler, bus };

'use strict';

const path = require('node:path');
const { exec } = require('node:child_process');
const express = require('express');
const session = require('express-session');

const { DB_PATH } = require('./src/db');

const authRoutes = require('./src/auth').router;
const menuRoutes = require('./src/menu');
const orderRoutes = require('./src/orders').router;
const adminRoutes = require('./src/admin');
const { sseHandler } = require('./src/events');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

app.use(express.json({ limit: '1mb' }));
app.use(
  session({
    name: 'mcdo.sid',
    secret: process.env.SESSION_SECRET || 'mcdo-kiosk-dev-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: 'lax', maxAge: 1000 * 60 * 60 * 8 }
  })
);

// Never let the browser cache the HTML shell, so a stale copy can't linger.
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api/')) {
    const looksLikeHtml = req.path === '/' || req.path.endsWith('.html') || !path.extname(req.path);
    if (looksLikeHtml) res.set('Cache-Control', 'no-store');
  }
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.get('/api/events', sseHandler);
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));

app.use(express.static(PUBLIC_DIR));

app.get('/menu', (req, res) => res.redirect('/#/menu'));

// SPA fallback for deep links (hash routing still loads the shell).
app.get('*', (req, res) => res.sendFile(path.join(PUBLIC_DIR, 'index.html')));

app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

function openBrowser(url) {
  const command =
    process.platform === 'win32'
      ? `start "" "${url}"`
      : process.platform === 'darwin'
      ? `open "${url}"`
      : `xdg-open "${url}"`;
  exec(command, () => {
    /* if it fails, the user can open the URL manually */
  });
}

if (require.main === module) {
  const url = `http://localhost:${PORT}`;
  const server = app.listen(PORT, () => {
    console.log('');
    console.log(`  McDo Kiosk is running at ${url}`);
    console.log(`  Working folder : ${process.cwd()}`);
    console.log(`  Database       : ${DB_PATH}`);
    console.log('');
    console.log('  Keep this window open while using the website.');
    console.log('  Press Ctrl+C to stop the server.');
    console.log('');
    if (process.env.NO_OPEN !== '1') openBrowser(url);
  });

  server.on('error', (err) => {
    console.error('');
    if (err && err.code === 'EADDRINUSE') {
      console.error(`  ERROR: Port ${PORT} is already in use.`);
      console.error('  Another server window may still be running.');
      console.error('  Close it, or start on a different port:');
      console.error(`      set PORT=3001 && node server.js`);
    } else {
      console.error('  ERROR: The server failed to start.');
      console.error(`  ${err && err.message ? err.message : err}`);
    }
    console.error('');
    process.exitCode = 1;
  });
}

module.exports = app;

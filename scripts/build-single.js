'use strict';

/**
 * Builds self-contained single-file versions of the kiosk for offline use
 * (e.g. uploading to an LMS). Everything — CSS, JS, seed data and images —
 * is inlined so students can just double-click the file, no server needed.
 *
 * Run:  npm run build:single
 * Output: dist/mcdo-kiosk.html, dist/mcdo-kiosk-mobile.html, dist/mcdo-kiosk-desktop.html
 */

const fs = require('node:fs');
const path = require('node:path');
const seed = require('../src/seed-data');

const ROOT = path.join(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const IMG_DIR = path.join(PUBLIC_DIR, 'img', 'menu');
const DIST_DIR = path.join(ROOT, 'dist');

const SCRIPT_FILES = [
  'js/api.js',
  'js/cart.js',
  'js/ui.js',
  'js/router.js',
  'js/live.js',
  'js/views/view-home.js',
  'js/views/view-platforms.js',
  'js/views/view-menu.js',
  'js/views/view-checkout.js',
  'js/views/view-orders.js',
  'js/views/view-order.js',
  'js/views/view-receipt.js',
  'js/views/view-points.js',
  'js/views/view-auth.js',
  'js/views/view-admin.js',
  'js/views/view-kitchen.js',
  'js/views/view-credits.js',
  'js/app.js'
];

const MIME = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml' };

function slugify(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function inlineImages() {
  const map = {};
  if (!fs.existsSync(IMG_DIR)) return map;
  const files = fs.readdirSync(IMG_DIR).filter((file) => file !== 'credits.json');
  files.forEach((file) => {
    const ext = path.extname(file).toLowerCase();
    const mime = MIME[ext];
    if (!mime) return;
    const base64 = fs.readFileSync(path.join(IMG_DIR, file)).toString('base64');
    map[file] = `data:${mime};base64,${base64}`;
  });
  return map;
}

function readCredits() {
  const file = path.join(IMG_DIR, 'credits.json');
  if (!fs.existsSync(file)) return { items: [] };
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    return { items: [] };
  }
}

function escapeScript(text) {
  return text.replace(/<\/script>/gi, '<\\/script>');
}

function build() {
  const imageMap = inlineImages();
  const credits = readCredits();

  const seedCopy = JSON.parse(JSON.stringify(seed));
  seedCopy.MENU = seedCopy.MENU.map((item) => {
    const slug = slugify(item.name);
    const filename = Object.keys(imageMap).find((file) => file.startsWith(`${slug}.`));
    return { ...item, image: filename ? imageMap[filename] : `/img/menu/${slug}.jpg` };
  });

  const html = fs.readFileSync(path.join(PUBLIC_DIR, 'index.html'), 'utf8');
  const css = fs.readFileSync(path.join(PUBLIC_DIR, 'css', 'styles.css'), 'utf8');
  const bcrypt = fs.readFileSync(path.join(ROOT, 'node_modules', 'bcryptjs', 'dist', 'bcrypt.js'), 'utf8');

  const bundle = [
    '<script>window.__OFFLINE__ = true; window.__SINGLE_FILE__ = true;</script>',
    `<script>${escapeScript(bcrypt)}</script>`,
    '<script>window.bcrypt = window.bcrypt || (window.dcodeIO && window.dcodeIO.bcrypt);</script>',
    `<script>window.SEED = ${escapeScript(JSON.stringify(seedCopy))};</script>`,
    `<script>window.__CREDITS__ = ${escapeScript(JSON.stringify(credits))};</script>`,
    `<script>${escapeScript(fs.readFileSync(path.join(PUBLIC_DIR, 'js', 'mock-api.js'), 'utf8'))}</script>`,
    ...SCRIPT_FILES.map(
      (file) =>
        `<script>${escapeScript(fs.readFileSync(path.join(PUBLIC_DIR, file), 'utf8'))}</script>`
    )
  ].join('\n');

  let output = html
    .replace(/<link rel="manifest"[^>]*>\s*/, '')
    .replace(/<link rel="stylesheet" href="css\/styles\.css"\s*\/>/, `<style>\n${css}\n</style>`);

  const start = output.indexOf('<script src="js/api.js">');
  const endMarker = '<script src="js/app.js"></script>';
  const end = output.indexOf(endMarker) + endMarker.length;
  if (start === -1 || end < endMarker.length) throw new Error('Could not locate script block in index.html');
  output = output.slice(0, start) + bundle + output.slice(end);

  output = output.replace(
    '<title>McDonald\'s Kiosk</title>',
    "<title>McDonald's Kiosk - offline demo</title>\n    <!-- Single-file offline build. Open this file directly in a browser. -->"
  );

  if (!fs.existsSync(DIST_DIR)) fs.mkdirSync(DIST_DIR, { recursive: true });

  const variants = [
    { name: 'mcdo-kiosk.html', layout: null },
    { name: 'index.html', layout: null },
    { name: 'mcdo-kiosk-mobile.html', layout: 'mobile' },
    { name: 'mcdo-kiosk-desktop.html', layout: 'desktop' }
  ];

  const results = [];
  variants.forEach((variant) => {
    let content = output;
    if (variant.layout) {
      content = content.replace(
        '</head>',
        `  <script>try{document.documentElement.setAttribute('data-layout','${variant.layout}')}catch(e){}</script>\n  </head>`
      );
    }
    const target = path.join(DIST_DIR, variant.name);
    fs.writeFileSync(target, content);
    results.push({ file: variant.name, mb: (Buffer.byteLength(content) / (1024 * 1024)).toFixed(2) });
  });

  const embedded = Object.keys(imageMap).length;
  console.log(`Inlined ${embedded} image(s).`);
  results.forEach((result) => console.log(`Built dist/${result.file} (${result.mb} MB)`));
  const largest = Math.max(...results.map((result) => Number(result.mb)));
  if (largest > 8) console.log('Note: the largest file is over 8 MB — some LMS upload limits are lower.');

  fs.writeFileSync(
    path.join(DIST_DIR, 'START-HERE.txt'),
    [
      "McDonald's Kiosk - offline demo",
      '================================',
      '',
      'HOW TO OPEN',
      '  1. Double-click mcdo-kiosk.html',
      '     That is the whole app - no server, no install, no internet needed.',
      '',
      '  Optional layouts:',
      '   mcdo-kiosk-mobile.html   always uses the phone layout',
      '   mcdo-kiosk-desktop.html  always uses the desktop layout',
      '',
      'DEMO ACCOUNTS',
      '  Customer : juan@email.com    / user123',
      '  Kitchen  : kitchen@mcdo.ph   / kitchen123',
      '  Cashier  : cashier@mcdo.ph   / cashier123',
      '  Manager  : manager@mcdo.ph   / manager123',
      '  Admin    : admin@mcdo.ph     / admin123',
      '',
      'TIP: open the guest launcher at #/demo to enter any role with one click.',
      '',
      'LIVE DEMO WITH TWO TABS',
      '  Open the Customer kiosk in one tab and the Kitchen display in another,',
      '  then place an order and advance it in the kitchen. The tracker updates live.',
      '',
      'Data is stored in this browser only (localStorage). Use the Admin screen',
      '"Reset demo data" button to start over.',
      '',
      'WANT THE FULL WEBSITE (with a real server and accounts)?',
      '  Go to the project folder and double-click:  START-WEBSITE.bat',
      '  Then open http://localhost:3000',
      '',
      'IF THE PAGE LOOKS BLANK',
      '  Press Ctrl+Shift+R once (hard refresh) to clear an old cached copy.'
    ].join('\n')
  );
  console.log('Wrote dist/START-HERE.txt');
}

build();

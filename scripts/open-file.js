'use strict';

/** Opens the built offline file in the OS default browser. */
const { exec } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const file = path.resolve(__dirname, '..', 'dist', 'mcdo-kiosk.html');
if (!fs.existsSync(file)) {
  console.error('Offline build not found. Run:  npm run build:single');
  process.exit(1);
}

const command =
  process.platform === 'win32'
    ? `start "" "${file}"`
    : process.platform === 'darwin'
    ? `open "${file}"`
    : `xdg-open "${file}"`;

exec(command, (err) => {
  if (err) {
    console.error('Could not open a browser automatically. Open this file manually:');
    console.error(`  ${file}`);
    return;
  }
  console.log(`Opened ${file}`);
  console.log('No server needed - the whole app is inside that one file.');
});

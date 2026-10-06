# 08 · Deployment & LMS Upload

## A. Run on your machine (server)

**Easiest:** double-click **`START-WEBSITE.bat`** (Windows) or run
**`./start-website.sh`** (Mac/Linux). It installs dependencies on first run, starts the
server, and the browser opens automatically at http://localhost:3000.

**Fallbacks** (if batch files are restricted on your PC):

```powershell
powershell -ExecutionPolicy Bypass -File .\start-website.ps1
```
```bash
python start-website.py
```

**From a terminal:**

```bash
npm install
npm run images     # once
npm start          # or:  node server.js
```

Finish with Ctrl+C in the server window.

> **Windows note:** PowerShell may block `npm` with *"running scripts is disabled on this
> system"*. Use `START-WEBSITE.bat`, `start-website.ps1`, `python start-website.py`, or
> `node server.js`.

> **Never open `public/index.html` by double-clicking** — that page needs the server.
> The standalone file is `dist/index.html`.

### Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| **"localhost refused to connect"** | Nothing is listening on port 3000 — the server window was closed or failed to start. Re-run the launcher and keep the window open; the window prints the error if it fails. |
| Blank or broken page | A stale cache. Press **Ctrl+Shift+R**; or DevTools (F12) → Application → Storage → Clear site data. (The server now sends `Cache-Control: no-store` for HTML to prevent this.) |
| Port 3000 already in use | Stop the other server window, or run `set PORT=3001 && node server.js`. |
| No menu photos | Run `npm run images` (needs internet once). |
| Server starts then window closes | The window shows why (for example a missing module). Keep it open and read the last lines. |

The service worker only registers on a real host (not `localhost`), so local development
is always served fresh.

### Configuration

Environment variables (see `.env.example`):

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | 3000 | HTTP port |
| `SESSION_SECRET` | dev value | sign the session cookie |
| `KIOSK_DB_PATH` | `data/kiosk.db` | SQLite file location (used by tests) |

## B. Upload to your LMS (offline single file)

1. Run:
   ```bash
   npm install
   npm run images
   npm run build:single
   ```
2. Take the whole `dist/` folder (or zip it) containing:
   - `mcdo-kiosk.html` — the app (about 5 MB, images included)
   - `mcdo-kiosk-mobile.html` — always phone layout
   - `mcdo-kiosk-desktop.html` — always desktop layout
   - `START-HERE.txt` — student instructions
3. Upload that zip as a File resource in your LMS.

**Important:** students must **download and open the file locally** (double-click).
Do **not** rely on an LMS in-page preview: iframes are often sandboxed and can block
`localStorage`, and some LMS previewers strip JavaScript.

### Why it works with no server

`scripts/build-single.js` reads `index.html`, then inlines the stylesheet, every script,
the seed data, `bcryptjs` and all menu images as base64 data URIs into one HTML file. The
`mock-api.js` backend stores everything in the browser, so there is nothing to install
and no network calls.

### If the file is too big for your LMS

- The full build is roughly 5 MB. Some LMSs cap at 5 MB — re-run
  `node scripts/fetch-images.js --force` after lowering `THUMB_WIDTH` in
  `scripts/fetch-images.js` to 320, or
- The offline build degrades gracefully with no images at all: delete
  `public/img/menu/*` and rebuild, and cards fall back to emoji icons (well under 1 MB).

## C. Install as a PWA (optional)

1. `npm start` (or host the app over HTTPS).
2. Open it in Chrome/Edge → **Install**; on mobile use **Add to Home Screen**.
3. The service worker (`public/sw.js`) precaches the shell so it opens offline.

> A PWA cannot be installed from a `file://` page — service workers require a real
> origin. Use the single-file build for the purely offline demo.

## D. Desktop kiosk mode (optional)

`start-kiosk.bat` (Windows) or `start-kiosk.sh` (macOS/Linux) opens the offline build in
Chrome/Edge `--app --kiosk` fullscreen, which looks like a real self-order machine and
needs no extra software.

## E. Production notes (beyond the classroom)

The demo is intentionally simple. For a real deployment you would also add:

- A persistent session store (SQLite/Redis) instead of the in-memory default.
- HTTPS and a strong `SESSION_SECRET`.
- Rate limiting, CSRF protection and Helmet security headers.
- Payment provider integration (Stripe/PayMongo) instead of the simulated payment.
- Backups for the SQLite file, or a move to PostgreSQL.

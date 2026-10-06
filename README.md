# McDonald's-style Ordering Kiosk

A classroom reference implementation of a fast-food self-ordering kiosk with loyalty
points, VAT/Senior-PWD receipts, live order tracking, a kitchen display and an admin
dashboard. The same codebase runs **three ways**:

| Platform | How | Best for |
| --- | --- | --- |
| **Server (web)** | `npm start` → http://localhost:3000 | Development, real APIs, SQLite, SSE |
| **Offline single file** | `npm run build:single` → open `dist/mcdo-kiosk.html` | Uploading to an LMS — double-click, no server |
| **Installable PWA** | Serve the app, then "Install" / "Add to Home Screen" | Mobile and desktop app demo |
| **Mobile app (React Native)** | `cd mobile && npm install && npx expo start` | Real Android/iOS app from one codebase |
| **Desktop app (Python)** | `python desktop/mcdo_kiosk.py` | Native desktop GUI, zero dependencies |

---

## Open the website

**Windows:** double-click **`START-WEBSITE.bat`**.
**Mac/Linux:** run **`./start-website.sh`**.

It installs dependencies on first run, starts the server, and **your browser opens by
itself** at http://localhost:3000. Keep the black window open while using the site; press
**Ctrl+C** there to stop it.

**If the `.bat` is blocked** on your PC, use one of the fallbacks (all do the same thing):

- PowerShell: `powershell -ExecutionPolicy Bypass -File .\start-website.ps1`
- Python: `python start-website.py`
- Plainest: open a terminal in this folder and run `node server.js`

> **Do not double-click `public/index.html`** — that file only works through the server.
> For a no-server version, double-click **`dist/index.html`** instead.

### If it doesn't work

| Symptom | Fix |
| --- | --- |
| **"localhost refused to connect"** | The server isn't running. Look at the window you launched — it either shows an error or was closed. Re-run the launcher and **keep that window open**. |
| `npm` says *"running scripts is disabled on this system"* | Use `START-WEBSITE.bat`, `start-website.ps1`, `python start-website.py`, or run `node server.js`. |
| Page is blank or looks broken | Press **Ctrl+Shift+R** once. Still bad? DevTools (F12) → Application → Storage → Clear site data. |
| Port 3000 already in use | Close the other server window, or run `set PORT=3001 && node server.js`. |
| Page loads but the menu has no photos | Run `npm run images` once (needs internet). |

## Run from a terminal (alternative)

```bash
npm install
npm run images      # one-time: download menu photos (needs internet)
npm start           # http://localhost:3000
```

`node server.js` is equivalent to `npm start` and always works, even when npm is blocked.

## Quick start (offline / LMS)

```bash
npm install
npm run images
npm run build:single
# open dist/mcdo-kiosk.html in any browser (no server, no internet)
```

`dist/` also contains `mcdo-kiosk-mobile.html`, `mcdo-kiosk-desktop.html` and
`START-HERE.txt` with student instructions.

## Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Customer | juan@email.com | user123 |
| Kitchen | kitchen@mcdo.ph | kitchen123 |
| Cashier | cashier@mcdo.ph | cashier123 |
| Manager | manager@mcdo.ph | manager123 |
| Admin | admin@mcdo.ph | admin123 |

The guest screen `#/demo` signs you into any role with one click.

## Scripts

| Command | What it does |
| --- | --- |
| `npm start` | Run the Express + SQLite server |
| `npm run reset` | Delete and re-seed the database |
| `npm run images` | Download menu photos from Wikimedia/Openverse into `public/img/menu/` |
| `npm run build:single` | Build the self-contained offline HTML files |
| `npm run open` | Build, then open the offline file in your default browser |
| `npm test` | Run the unit + API + offline tests (no network needed) |
| `npm run kiosk` | Build, then open the fullscreen desktop kiosk launcher (Windows) |

## Project structure

```
server.js                 Express app + SPA fallback + SSE
src/
  seed-data.js            Single source of truth for menu/users/options/demo orders
  migrations.js           Versioned SQL migrations
  db.js                   SQLite setup + seeding
  pricing.js              Pure pricing: options, VAT, Senior/PWD, points
  order-status.js         Order state machine + role permissions
  events.js               SSE event bus
  middleware.js           Auth + RBAC
  auth.js menu.js orders.js admin.js options.js
public/
  index.html              SPA shell
  css/styles.css          Design system + responsive layouts
  js/api.js               Transport adapter (fetch | mock)
  js/mock-api.js          Offline backend on localStorage
  js/router.js            Hash router
  js/live.js              Live updates (SSE | localStorage polling)
  js/ui.js js/cart.js     Shared UI helpers + cart
  js/views/*.js           One file per screen
scripts/
  fetch-images.js         Image downloader + credits
  build-single.js         Inlines everything into one HTML file
  open-file.js            Opens the built file in the default browser
test/                     Unit + integration + offline tests
docs/                     Teaching package (start at 01)
mobile/                   React Native (Expo) mobile app demo
desktop/                  Python (Tkinter) desktop app demo
```

## Documentation

Start with [`docs/01-architecture.md`](docs/01-architecture.md). The full teaching
package covers architecture, data model, the order state machine, a milestone build
guide, feature specs, the API, testing, deployment/LMS steps, exercises, a rubric and a
demo script.

## Notes

- Payments are **simulated** — no real money moves.
- Offline mode keeps data in the browser's `localStorage`; use **Reset demo data** in
  Admin to start over.
- Menu photos come from Wikimedia Commons / Openverse. Attribution is listed on the
  in-app `#/credits` page.
- Menu prices are estimates of Philippine pricing and are for teaching only.

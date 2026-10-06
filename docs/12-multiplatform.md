# 12 · Multi-Platform

One codebase, several delivery targets. This is the "show that AI can build for every
platform" part of the demo.

| Target | How it is produced | Needs a server? | Needs internet? |
| --- | --- | --- | --- |
| Desktop web | `npm start` | yes | only for images once |
| Mobile web | same app, mobile-first layout | yes | same |
| Offline single file | `npm run build:single` → `dist/mcdo-kiosk.html` | **no** | **no** |
| Installable app (PWA) | serve the app, then Install / Add to Home Screen | yes (HTTPS) | no (precached) |
| Desktop kiosk | `start-kiosk.bat` / `.sh` (Chrome `--app --kiosk`) | **no** | **no** |
| Device showcase | `#/platforms` route | either | either |
| **Native mobile app** | `mobile/` — React Native + Expo | **no** (self-contained) | no |
| **Native desktop app** | `desktop/mcdo_kiosk.py` — Python + Tkinter | **no** | no |

## Layout profiles

The `data-layout` attribute on `<html>` drives the layout:

- `auto` — follow the screen size (default)
- `mobile` — 2-column grid, hamburger nav, bottom-sheet cart
- `desktop` — wide grid, side panels
- `kiosk` — oversized tiles and buttons

Switch it from `#/platforms`, or force one permanently by opening
`mcdo-kiosk-mobile.html` / `mcdo-kiosk-desktop.html`.

## How the offline build is made

`scripts/build-single.js`:

1. reads `public/index.html`,
2. inlines `css/styles.css` into a `<style>` tag,
3. inlines `bcryptjs`, the seed data, `mock-api.js` and every view as `<script>` tags,
4. converts each menu photo into a base64 `data:` URI and rewrites the seed,
5. writes the responsive, mobile-first and desktop variants plus `START-HERE.txt`.

The result is a single HTML file with no external requests at all.

## PWA vs single file — why both?

- **Single file** is perfect for an LMS: download, double-click, done. It has no origin,
  so it cannot be installed and cannot use a service worker.
- **PWA** needs a real origin, but in exchange you get an app icon, a splash screen,
  offline precaching and a standalone window — which is what makes it feel like a native
  mobile/desktop app.

## Native wrappers (included as demos)

Two genuinely native demos ship with the project to show the same system on other
platforms:

### React Native mobile app — `mobile/`

- Built with **Expo**, so it targets **Android, iOS and web** from one codebase.
- Run: `cd mobile && npm install && npx expo start`, then scan the QR with Expo Go (or
  press `w` for web).
- Self-contained: it has its own menu data and `src/pricing.js`, a direct port of the
  server pricing rules, so it runs with no server and no internet.
- Screens: Menu, Item options, Cart, Checkout, Orders (with a demo "advance status").
- Verified in this repo with `npx expo export --platform web` and a headless render.

### Python desktop app — `desktop/`

- **Tkinter only** — no `pip install` required.
- Run: `python desktop/mcdo_kiosk.py`.
- Headless logic checks: `python desktop/mcdo_kiosk.py --selftest`.
- Category list, product cards, option picker, checkout dialog, printed receipt and
  loyalty points — mirroring the web rules (VAT, Senior/PWD, points).

### Going further

- **Desktop:** swap Tkinter for Electron/Tauri (web tech) or PyQt/PySide for a richer
  native UI.
- **Mobile:** `npx eas build -p android` (with a free Expo account) produces an
  installable APK/IPA.

Because the UI already talks to an adapter (`api.js`), it works unchanged inside any of
these shells. That is the payoff of separating the UI from the data layer.

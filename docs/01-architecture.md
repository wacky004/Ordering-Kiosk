# 01 · Architecture

## Big picture

```
                    ┌──────────────────────────────────────────┐
                    │              Browser (SPA)               │
                    │  index.html + hash router + views        │
                    │  ┌───────────────┐  ┌────────────────┐   │
                    │  │    api.js     │  │    live.js     │   │
                    │  │  transport     │  │ update source  │   │
                    │  └───────┬───────┘  └───────┬────────┘   │
                    │   online │      offline │   │            │
                    │          ▼              ▼   ▼            │
                    │   fetch('/api')   mock-api.js  SSE/poll  │
                    └──────────┬───────────────┬───────────────┘
                               │               │
                  HTTP/JSON    │               │  localStorage
                               ▼               ▼
                    ┌─────────────────┐  ┌──────────────────┐
                    │  Express server │  │  Browser storage │
                    │  routes → logic │  │  (offline build) │
                    │  SQLite         │  └──────────────────┘
                    │  SSE event bus  │
                    └─────────────────┘
```

## Why two transports?

The app must run (a) as a normal web app and (b) as a single HTML file opened directly
from disk. A `file://` page cannot call `/api`, keep sessions or use Server-Sent Events,
so the browser code is written against a thin adapter and swapped at load time:

- **`public/js/api.js`** — `api(path, options)`. If `location.protocol === 'file:'`
  (or `window.__OFFLINE__`) it delegates to `window.MockApi.request`, otherwise it uses
  `fetch`. Views never care which one answered.
- **`public/js/mock-api.js`** — implements the exact same routes and JSON shapes on top
  of `localStorage`. It even mirrors the pricing and state-machine rules.
- **`public/js/live.js`** — Server-Sent Events when served; `storage` events plus a
  1.2 s poll of `localStorage` when offline. The UI subscribes to one callback either way.

This is the **adapter / repository pattern**: one UI, two data sources.

## Server layers

```
server.js            wiring: JSON, sessions, routes, static files, SPA fallback
src/middleware.js    requireAuth / requireRole (RBAC)
src/auth.js          register, login, logout, me
src/menu.js          public menu with options
src/orders.js        place/list/track/cancel orders
src/admin.js         order board, menu + options, staff, customers, demo reset
src/options.js       option group loader
src/pricing.js       PURE pricing math (no I/O) — easy to unit test
src/order-status.js  PURE state machine + role rules
src/events.js        EventEmitter + SSE handler
src/db.js            SQLite (node:sqlite), migrations, seeding
src/migrations.js    ordered, idempotent schema migrations
```

Keeping `pricing.js` and `order-status.js` free of I/O is deliberate: the business rules
are the easiest thing to test and the most important thing to get right.

## Request lifecycle (place an order)

1. Cart lives in `localStorage` (`public/js/cart.js`), keyed by item **and** chosen options.
2. Checkout posts `{ items, orderType, paymentMethod, redeemPoints, seniorPwdCount }`.
3. `orders.js` re-loads items from the database (never trusts client prices), resolves
   option deltas, and calls `pricing.computeOrder`.
4. A transaction inserts the order, its items, its option snapshots and a `received`
   event, then updates the customer's points.
5. `events.emit('order:new')` pushes an SSE message.
6. The kitchen display and admin board receive it and refresh instantly.

## Routing

Client-side hash routes keep server and offline behaviour identical:

`#/` `#/menu` `#/platforms` `#/demo` `#/checkout` `#/orders` `#/order/:id`
`#/receipt/:id` `#/points` `#/login` `#/register` `#/admin` `#/kitchen` `#/credits`

Express additionally redirects `/menu` → `/#/menu` and serves `index.html` for any other
non-API path (SPA fallback).

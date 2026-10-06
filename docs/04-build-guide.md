# 04 · Build Guide (milestones for students)

This is a suggested path to rebuild the kiosk from scratch. Each milestone ends with
something you can demo, and most map directly to a folder in this repo.

## Milestone 0 — Setup

- `npm init`, install `express`, `express-session`, `bcryptjs`.
- A `server.js` that returns "hello" and serves a static folder.
- **Demo:** a page loads at http://localhost:3000.

## Milestone 1 — Menu (read-only)

- Hard-code the menu in a data file.
- `GET /api/menu` and a simple grid of cards.
- **Demo:** browse the menu; filter by category; search.

## Milestone 2 — Accounts and sessions

- `users` table, bcrypt hashing, register/login/logout, `GET /api/auth/me`.
- A login page and a header that shows the signed-in user.
- **Demo:** sign up, refresh, stay signed in, log out.

## Milestone 3 — Cart and orders

- Cart in `localStorage` (survives refresh).
- `POST /api/orders` computing totals **server-side**; `GET /api/orders`.
- **Demo:** add items, check out, see the order in "My Orders".

## Milestone 4 — Status and live tracking

- Add `order_events`; a `received → preparing → ready → completed` flow.
- An admin screen with buttons to advance status.
- A tracker page that refreshes automatically.
- **Demo:** advance an order in one tab, watch the other tab update.

## Milestone 5 — Receipt and points

- Printable receipt with order code and a barcode.
- 1 point per ₱1; redeem 100 points = ₱10 at checkout.
- **Demo:** earn points, print a receipt.

## Milestone 6 — Options (size / drink / add-ons)

- `option_groups` + `options`; store chosen options per line.
- Effective price = base + deltas; cart lines merge by item + options.
- **Demo:** order a Large with extra cheese and see the price change.

## Milestone 7 — Roles and the kitchen display

- RBAC middleware; roles `kitchen, cashier, manager, admin`.
- A Kitchen Display screen that only kitchen staff can open.
- **Demo:** kitchen starts an order; cashier completes it.

## Milestone 8 — Money rules (VAT + Senior/PWD)

- Extract pricing into a pure module.
- VAT-inclusive totals, Senior/PWD = VAT-exempt + 20% off net.
- **Demo:** the same order with and without the senior discount.

## Milestone 9 — Real-time with SSE

- Replace polling with an event bus and `GET /api/events`.
- **Demo:** no refresh anywhere; everything updates live.

## Milestone 10 — Tests and hardening

- Unit tests for pricing and the state machine; API tests for auth and rules.
- Input validation, rate limiting, helmet headers.
- **Demo:** `npm test` goes green.

## Milestone 11 — Offline single file + multi-platform

- Build a mock backend and inline everything into one HTML file.
- Device showcase page; PWA manifest; kiosk launcher.
- **Demo:** open `dist/mcdo-kiosk.html` with no server and no internet.

## Milestone 12 — Documentation and presentation

- README, architecture diagram, ERD, this guide, demo script.
- **Demo:** present the system and walk through the code.

> Tip: commit after every milestone. A green `npm test` plus a working demo is the
> definition of "done" for each one.

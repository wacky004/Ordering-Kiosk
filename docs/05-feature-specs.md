# 05 · Feature Specs

Each feature is stated as **requirement → acceptance criteria** so it can be graded or
turned into tests.

## F1 · Menu browsing
- R: Customers see all available items grouped into categories.
- AC: `/api/menu` returns 49 items and 9 categories; cards show photo, name, price,
  badge; search filters by name/description/category; unavailable items cannot be added.

## F2 · Accounts
- R: Email + password accounts with sessions.
- AC: register validates email and 6+ char password; duplicate email returns 409;
  passwords are hashed with bcrypt; the session survives refresh; logout clears it.

## F3 · Cart
- R: A persistent cart that survives refresh and merges identical lines.
- AC: quantity stepper 1–50; lines merge by item + chosen options; subtotal updates live;
  an empty cart redirects away from checkout.

## F4 · Checkout and pricing
- R: Server computes all money; clients never send prices.
- AC: `POST /api/orders` returns `subtotal, vatable_sales, vat_amount, vat_exempt_sales,
  senior_discount, discount, total, points_earned`; totals are VAT-inclusive at 12%.

## F5 · Item options
- R: Size / drink / add-ons change the price.
- AC: required single-choice groups default to the marked option; deltas sum into the
  unit price; the chosen options are snapshotted onto the order line.

## F6 · Loyalty points
- R: Earn and redeem points.
- AC: `points_earned = floor(total)`; redemption is in 100-point blocks worth ₱10;
  redemption cannot exceed the block-aligned balance or the order value; balance updates
  atomically with the order.

## F7 · Order status and tracking
- R: `received → preparing → ready → completed` with cancellation rules.
- AC: see FSM in `docs/03`; invalid or role-disallowed transitions return 400; the
  tracker timeline shows timestamps for each reached status.

## F8 · Role-based access
- R: Different screens for different staff.
- AC: unauthenticated → 401; wrong role → 403; kitchen can only start/ready; cashier can
  complete/cancel; only admins manage staff.

## F9 · Receipts
- R: An official-receipt style printout.
- AC: order code, cashier-readable barcode, items, VAT breakdown (or VAT-exempt line for
  Senior/PWD), points earned/redeemed, printable via `window.print()`.

## F10 · Real-time updates
- R: No manual refresh anywhere.
- AC: placing an order updates the kitchen and admin screens; a status change updates the
  customer tracker; works via SSE when served and via localStorage polling offline.

## F11 · Admin tools
- R: Manage the shop.
- AC: stats cards, kanban board with one-tap advance, menu price/availability edits,
  option editor, staff creation and roles, customer points table, demo reset.

## F12 · Multi-platform
- R: One codebase for phone, tablet, desktop, kiosk and offline.
- AC: `#/platforms` shows device frames; layout profiles switch layout; PWA installs on
  mobile; `dist/mcdo-kiosk.html` runs with no server; the kiosk launcher opens fullscreen.

## F13 · Offline mode
- R: The whole app works with no server.
- AC: `mock-api.js` mirrors every endpoint; data persists in `localStorage`; "Reset demo
  data" restores the seed; the file opens directly from disk.

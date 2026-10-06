# 11 · Five-Minute Demo Script

A tight walkthrough for showing the kiosk on a projector.

## Setup (before class)

- `npm start` and open http://localhost:3000 in **two** windows side by side.
- Optional: open `#/platforms` in a third tab for the finale.
- Have `dist/mcdo-kiosk.html` ready to prove the offline build.

## 0:00 — The pitch

> "This is a self-ordering kiosk like the ones at McDonald's: pick food, pay, get a
> receipt, then track the order while the kitchen prepares it. Everything you see is one
> codebase that also runs offline, on mobile, and as a desktop kiosk."

## 0:30 — Customer orders

1. `#/demo` → **Customer Kiosk** (one click).
2. Open **Big Mac** → choose **Large**-style add-ons (**Extra Cheese**, **Bacon**) → note
   the price update → **Add to Order**.
3. Show the cart subtotal. Go to checkout.
4. Toggle **Senior/PWD** and point at the VAT line switching to VAT-exempt.
5. Redeem 100 points. Show the total drop by ₱10.
6. **Pay & Place Order**.

## 1:45 — Receipt and points

- Show the receipt: VAT breakdown, points earned, barcode.
- Mention points now appear in the header.

## 2:15 — Kitchen updates it live

- In the second window: `#/demo` → **Kitchen Display**.
- Click **Start cooking** → switch to the customer tab → the tracker advanced **without a
  refresh**.
- Back to kitchen → **Mark ready**.
- Explain: "That's Server-Sent Events — the server pushes, the browser listens."

## 3:00 — Cashier completes, points land

- `#/demo` → switch to Admin (or sign in as cashier) → advance to **Completed**.
- Open **My Rewards** and show the points history.

## 3:30 — Admin tools

- Admin board: stats, kanban, one-tap advance.
- Menu tab: change a price, disable an item, show the **Options** editor.
- Staff tab: create a kitchen account and change a role.

## 4:15 — Multi-platform finale

- Open `#/platforms`: phone, tablet, desktop and kiosk frames side by side.
- Press the layout switcher.
- Open `dist/mcdo-kiosk.html` **with no server running** and place an order — proving the
  offline build.
- Show the native demos: run `cd mobile && npx expo start` to show the **React Native**
  app on a phone, and `python desktop/mcdo_kiosk.py` for the **Python** desktop app.
- Message: "Same system, five platforms — web, offline file, PWA, native mobile, native
  desktop — all from one design."

## 4:45 — Close and open the code

- Show `src/order-status.js` (the state machine) and `src/pricing.js` (the money rules).
- "The rules live in small, pure, testable modules — and there are tests for both."

## Talking points

- Client never sends prices; the server recomputes everything.
- One UI, two backends (adapter pattern).
- The state machine prevents impossible orders.
- The same rules run in the offline demo, so behaviour never drifts.

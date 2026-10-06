# 09 · Student Exercises

Organised from warm-up to challenge. Solutions can be checked against the existing code.

## Warm-up

1. **Add a menu item.** Insert a new product in `src/seed-data.js`, `npm run reset`, and
   confirm it appears with an emoji fallback image.
2. **Change a price.** Update a price and watch every screen reflect it.
3. **Add a category.** Create a new category with two items and give it an icon in
   `CATEGORY_ICONS`.
4. **Tune the theme.** Change `--red` and `--yellow` in `public/css/styles.css`.

## Core

5. **Sort the menu differently.** Order items by price instead of `sort_order`.
6. **Search by price.** Extend the menu search to match numbers (e.g. "50").
7. **Quantity limit.** Change the per-line maximum from 50 to 10 everywhere.
8. **Receipt logo.** Add the store address and a random "cashier" name to the receipt.
9. **Points tiers.** Add a fourth tier and adjust `view-points.js`.
10. **Empty-state art.** Improve the empty cart and empty order-list states.

## Business rules

11. **Happy hour.** Apply 10% off drinks between 2–5 PM (server-side!).
12. **Free item threshold.** Add a free Vanilla Cone when the subtotal exceeds ₱500.
13. **Blocked combos.** Prevent ordering a Happy Meal with a Senior/PWD discount.
14. **Points expiry.** Record `points_expire_at` and ignore expired points.
15. **VAT rounding.** Prove the current rounding matches a BIR-style receipt; fix it if
    not.

## State machine & real-time

16. **New status.** Insert `quality_check` between `preparing` and `ready`, update the
    FSM, the roles, the tracker and the tests.
17. **Timestamps.** Show the elapsed minutes on each timeline step.
18. **Sound alert.** Play a beep on the kitchen screen when a new order arrives.
19. **Optimistic UI.** Update the admin board instantly, then reconcile with the server.

## Architecture

20. **Repository layer.** Refactor the admin routes to call a `repository` module instead
    of using `db.prepare` directly.
21. **OpenAPI docs.** Generate an OpenAPI file from the endpoints and serve a docs page.
22. **Rate limiting.** Add a simple per-IP limiter to `/api/auth/login`.
23. **Validation layer.** Introduce a schema validator and a shared error envelope.
24. **CSRF protection.** Issue and verify a CSRF token for state-changing requests.

## Multi-platform

25. **New device frame.** Add a "wall-mounted display" frame to `#/platforms`.
26. **Landscape phone.** Add a `data-layout="phone-landscape"` profile.
27. **Offline banner.** Show "Offline demo mode" in the header when
    `window.__OFFLINE__` is true.
28. **Deep-link the tracker.** Make `#/order/:id` openable from the receipt QR/barcode.

## Challenge

29. **Inventory.** Track stock per item, decrement on order, block when zero.
30. **Refunds.** Add a refund flow with a reason and an audit entry, keeping the original
    order immutable.
31. **Analytics.** Build a chart of revenue per hour from `orders.created_at`.
32. **Multi-store.** Add stores, assign orders to a store, and scope the admin board.

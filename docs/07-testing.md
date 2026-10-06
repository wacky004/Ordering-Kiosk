# 07 · Testing

The project uses Node's built-in test runner — no extra dependencies.

```bash
npm test
```

## What is covered

| File | Type | Focus |
| --- | --- | --- |
| `test/pricing.test.js` | Unit | option deltas, 12% VAT, Senior/PWD, point redemption blocks |
| `test/order-status.test.js` | Unit | state machine + role permissions |
| `test/api.test.js` | Integration | real HTTP against a temporary database |

The integration tests:

1. set `KIOSK_DB_PATH` to a temp file **before** requiring `server.js`,
2. listen on port `0` (a free port),
3. drive the API with `fetch`, capturing the session cookie manually,
4. delete the temp database afterwards.

Because the DB path comes from an environment variable, tests never touch your real data.

## Why business logic is separated

`src/pricing.js` and `src/order-status.js` are **pure** (no database, no network). That
makes them trivial to unit test and means the same rules can be reused by the offline
mock backend.

## Writing a new test

```js
const test = require('node:test');
const assert = require('node:assert');
const { computeOrder } = require('../src/pricing');

test('a Large drink adds the size delta', () => {
  const t = computeOrder(
    [{ price: 55, qty: 1, options: [{ delta: 40 }] }],
    { availablePoints: 0, redeemPoints: 0, seniorPwdCount: 0 }
  );
  assert.strictEqual(t.subtotal, 95);
});
```

For an API test, use the `req()` / `login()` helpers already defined in
`test/api.test.js`.

## Suggested student exercises

- Add a test that a 500-point customer can redeem at most the order value.
- Add a test that the kitchen can cancel nothing.
- Add a test that a new customer starts with 0 points.
- Add a test that `received → completed` is rejected.

## Manual smoke checklist

1. `npm start`, open http://localhost:3000.
2. Sign in as the customer, add a Large with extra cheese, check the total.
3. Apply the Senior/PWD discount and watch the VAT line change to VAT-exempt.
4. Pay, print the receipt, then track the order.
5. In another tab sign in as kitchen and click **Start cooking**, then **Mark ready**.
6. Watch the tracker update on its own.
7. As cashier, complete the order. Confirm points were credited.

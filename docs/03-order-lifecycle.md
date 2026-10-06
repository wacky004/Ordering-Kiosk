# 03 · Order Lifecycle

## State machine

```
                    ┌──────────┐
                    │ received │  (new order)
                    └────┬─────┘
             start       │        cancel
        ┌────────────────┤────────────────┐
        ▼                │                ▼
   ┌───────────┐         │          ┌───────────┐
   │ preparing │─────────┤          │ cancelled │  (terminal)
   └─────┬─────┘  cancel │          └───────────┘
         │               │
         ▼               │
   ┌───────────┐         │
   │   ready   │─────────┘
   └─────┬─────┘
         │ complete
         ▼
   ┌───────────┐
   │ completed │  (terminal)
   └───────────┘
```

Defined in `src/order-status.js`:

```js
TRANSITIONS = {
  received:  ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready:     ['completed'],
  completed: [],
  cancelled: []
};
```

Skipping a step (for example `received → completed`) is always rejected with HTTP 400.

## Role permission matrix

| Transition | Customer | Kitchen | Cashier | Manager | Admin |
| --- | :---: | :---: | :---: | :---: | :---: |
| received → preparing | ✗ | ✓ | ✗ | ✓ | ✓ |
| preparing → ready | ✗ | ✓ | ✗ | ✓ | ✓ |
| ready → completed | ✗ | ✗ | ✓ | ✓ | ✓ |
| received → cancelled | ✓ (own) | ✗ | ✓ | ✓ | ✓ |
| preparing → cancelled | ✗ | ✗ | ✓ | ✓ | ✓ |

`canTransition(role, from, to)` enforces both the state machine and the role rule.
Customers are additionally restricted to **their own** orders in `orders.js`.

## Live tracking

Every status change inserts a row into `order_events` and emits an SSE message:

```js
emit('order:updated', { id, status, code });
```

- **Served:** `EventSource('/api/events')` pushes it to every open tab.
- **Offline:** the same event is appended to `localStorage`, and `live.js` polls it
  (plus `storage` events for cross-tab) so the tracker still updates without a server.

## Tracking timeline per status

| Status | Customer sees | Kitchen action |
| --- | --- | --- |
| `received` | "Order received" | Start cooking |
| `preparing` | "Preparing" | Mark ready |
| `ready` | "Ready for pickup" | — |
| `completed` | "Completed" | — |
| `cancelled` | "Cancelled" | — |

## Why a state machine?

It is a small, testable, self-contained business rule. Students can see the diagram,
read ~20 lines of code, and immediately write tests for valid and invalid transitions —
exactly the kind of logic that causes real bugs when it lives as scattered `if`
statements.

# 06 · API Reference

All JSON. Sessions use an httpOnly cookie (`mcdo.sid`). Errors are
`{ "error": "message" }` with an appropriate HTTP status.

## Auth

| Method | Path | Body | Returns |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | `{ name, email, password }` | `{ user }` |
| POST | `/api/auth/login` | `{ email, password }` | `{ user }` |
| POST | `/api/auth/logout` | — | `{ ok: true }` |
| GET | `/api/auth/me` | — | `{ user }` or 401 |

`user` = `{ id, name, email, role, roleLabel, points }`.

## Menu

| Method | Path | Returns |
| --- | --- | --- |
| GET | `/api/menu` | `{ categories: [{ name, icon }], items: [...] }` |

Each item: `{ id, name, description, category, price, icon, badge, image, available,
options: [{ id, name, type, required, options: [{ id, name, delta, is_default }] }] }`.

## Orders (customer)

| Method | Path | Body | Returns |
| --- | --- | --- | --- |
| POST | `/api/orders` | see below | `{ order, points, statusLabels }` |
| GET | `/api/orders` | — | `{ orders, statusLabels, statusFlow }` |
| GET | `/api/orders/:id` | — | `{ order, statusLabels, statusFlow }` |
| POST | `/api/orders/:id/cancel` | — | `{ order, statusLabels }` |

Place-order body:

```json
{
  "items": [ { "id": 4, "qty": 1, "options": [12, 13] } ],
  "orderType": "dine-in",
  "paymentMethod": "card",
  "redeemPoints": 100,
  "seniorPwdCount": 1
}
```

Order object:

```json
{
  "id": 5, "code": "MC-1005", "status": "received",
  "subtotal": 233, "discount": 10, "senior_discount": 41.61,
  "vat_amount": 0, "vatable_sales": 0, "vat_exempt_sales": 208.04,
  "senior_pwd_count": 1, "points_redeemed": 100, "points_earned": 156,
  "total": 156.43, "order_type": "dine-in", "payment_method": "card",
  "items": [ { "name": "Big Mac", "unit_price": 233, "qty": 1, "line_total": 233,
               "options": [ { "option_name": "Extra Cheese", "price_delta": 20 } ] } ],
  "events": [ { "status": "received", "note": "...", "created_at": "..." } ]
}
```

## Live events

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/events` | Server-Sent Events stream. Message types: `ready`, `order:new`, `order:updated`, `stats:changed`, `demo:reset` |

## Admin / staff

| Method | Path | Roles | Purpose |
| --- | --- | --- | --- |
| GET | `/api/admin/orders` | admin, manager, cashier | all orders (+ `customer_name`) |
| GET | `/api/admin/kitchen` | admin, manager, kitchen | received + preparing queue |
| PATCH | `/api/admin/orders/:id/status` | admin, manager, cashier, kitchen | `{ status }` |
| GET | `/api/admin/stats` | admin, manager, cashier | dashboard counters |
| GET | `/api/admin/menu` | admin, manager | items with options |
| POST | `/api/admin/menu` | admin, manager | create item |
| PATCH | `/api/admin/menu/:id` | admin, manager | price / availability / fields |
| DELETE | `/api/admin/menu/:id` | admin, manager | delete (or disable if used) |
| POST | `/api/admin/menu/:id/options` | admin, manager | create option group |
| DELETE | `/api/admin/options/:groupId` | admin, manager | delete group |
| POST | `/api/admin/options/:groupId/values` | admin, manager | add option value |
| DELETE | `/api/admin/option-values/:optionId` | admin, manager | delete option value |
| GET | `/api/admin/customers` | admin, manager, cashier | customers by points |
| GET | `/api/admin/staff` | admin | staff list |
| POST | `/api/admin/staff` | admin | create staff |
| PATCH | `/api/admin/staff/:id` | admin | change role |
| POST | `/api/admin/demo/reset` | admin | wipe orders, re-seed demo |

## Status codes

| Code | Meaning |
| --- | --- |
| 400 | Validation failed or invalid state transition |
| 401 | Not signed in |
| 403 | Signed in but wrong role |
| 404 | Not found (or not yours) |
| 409 | Duplicate email |

## Offline mode

`mock-api.js` implements the same paths, bodies, responses and status codes, so the same
frontend code works with no server. See `docs/12-multiplatform.md`.

# 02 · Data Model

## Entity relationship diagram

```
users                menu_items              option_groups
─────                ──────────              ─────────────
id (PK)              id (PK)                 id (PK)
name                 name                    menu_item_id  ──┐ FK
email (UNIQUE)       description             name            │
password_hash        category                type (single|multi)
role                 price                   required
points               icon / badge / image    sort_order
created_at           available / sort_order
                     │                             options
                     │                             ───────
orders               │                             id (PK)
──────               │                             group_id  ──┘ FK
id (PK)              │                             name
code (UNIQUE)        │                             price_delta
user_id ─────────────┘                             is_default
subtotal             │                             sort_order
discount                                                           
senior_discount      │        order_items              order_item_options
vat_amount           │        ───────────              ──────────────────
vatable_sales        │        id (PK)                  id (PK)
vat_exempt_sales     │        order_id ──┐ FK          order_item_id ──┐ FK
senior_pwd_count     │        menu_item_id ──┘         option_id       │
points_redeemed      │        name                     group_name      │
points_earned        │        unit_price               option_name     │
total                │        qty                      price_delta     │
order_type           │        line_total                                │
payment_method       │                                                │
payment_status       │     order_events                               │
status               │     ────────────                               │
created_at           └────→ id (PK)                                  │
updated_at                  order_id ──────────────────────────────────┘
                            status
                            note
                            created_at
```

`order_item_options` is a **snapshot**: it stores the option name and delta at purchase
time, so editing a menu later never changes historical receipts.

## Tables

| Table | Purpose | Notes |
| --- | --- | --- |
| `users` | Customers and staff | `role` is one of `user, kitchen, cashier, manager, admin`; `points` is the loyalty balance |
| `menu_items` | Products | `available` toggles ordering; `image` is a path to `public/img/menu/*` |
| `option_groups` | A set of choices for an item | `type` = `single` or `multi`; `required` forces a pick |
| `options` | One choice inside a group | `price_delta` is added to the base price |
| `orders` | Order header + money | All amounts are VAT-inclusive |
| `order_items` | Line items | `unit_price` already includes option deltas |
| `order_item_options` | Chosen options per line | Historical snapshot |
| `order_events` | Status audit trail | Powers the tracker timeline |
| `schema_migrations` | Applied migration ids | Managed by `src/migrations.js` |

## Money model (Philippines)

Prices are **VAT-inclusive** at 12%:

```
net (vatable sales) = subtotal / 1.12
vat                  = subtotal - net
```

Senior/PWD (per law): the sale is **VAT-exempt**, then **20% off the net amount**:

```
vat_exempt_sales = net
senior_discount  = net × 0.20
payable          = net - senior_discount
```

Loyalty: `100 points = ₱10`, redeemable in blocks, and **1 point per ₱1 paid**
(`points_earned = floor(total)`).

## Migrations

`src/migrations.js` holds an ordered list. On boot `runMigrations` creates
`schema_migrations`, skips already-applied ids, and wraps each migration in a
transaction. Add new schema by appending a migration — never by editing an old one.

```js
{ id: 6, name: 'wishlists', up(db) { db.exec('CREATE TABLE ...'); } }
```

## Reset / seed

- `npm run reset` deletes `data/kiosk.db` and re-seeds.
- `src/seed-data.js` is the single source of truth used by both the server seed and the
  offline build (so the demo menu is identical in every mode).

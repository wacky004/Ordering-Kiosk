# McDo Kiosk — Desktop App (Python + Tkinter)

A native **desktop** version of the kiosk written in Python. It uses only the standard
library — **no `pip install` needed** — so it runs anywhere Python 3.8+ is installed.

This covers the "desktop platform" part of the multi-platform demo.

## Run it

```bash
python desktop/mcdo_kiosk.py
```

Run the headless logic checks (no display required):

```bash
python desktop/mcdo_kiosk.py --selftest
```

## What's inside

- **Category list** on the left, **product cards** in the middle, **cart** on the right.
- Tapping **+ Add** opens the option picker (size, drink, add-ons) with a live price.
- **Checkout** dialog: dine-in / take-out, Senior/PWD discount, redeem points, and a
  payment method (Card / GCash / Cash).
- A printable **receipt** with the VAT breakdown and points balance.
- Loyalty points (1 point per ₱1, 100 points = ₱10) exactly like the web app.

## Business rules

The money rules are a direct port of `src/pricing.js`:

- Prices are **VAT-inclusive** at 12%.
- **Senior/PWD:** VAT-exempt plus 20% off the net amount.
- **Points:** redeem in blocks of 100; earning is `floor(total)`.

`--selftest` asserts all of these (VAT, Senior/PWD, point blocks, cart merging) so the
desktop demo can be verified in CI or in class without opening a window.

## Why Tkinter?

It ships with Python, so students can run a real desktop GUI with zero setup. Swapping in
PyQt/PySide or a web view (pywebview) would be the next step for a production desktop app.

## Structure

```
desktop/
  mcdo_kiosk.py     GUI + business logic + --selftest
```

## Verified

`python -m py_compile desktop/mcdo_kiosk.py` compiles, and
`python desktop/mcdo_kiosk.py --selftest` passes all 17 checks.

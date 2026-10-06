# McDo Kiosk — Mobile App (React Native / Expo)

A native mobile version of the kiosk, built with **React Native** and **Expo**, running on
**Android, iOS and web** from one codebase.

This covers the "mobile platform" part of the multi-platform demo.

## Run it

```bash
cd mobile
npm install
npx expo start
```

Then:

- **Phone:** install the **Expo Go** app and scan the QR code.
- **Android emulator:** press `a`.
- **iOS simulator (macOS):** press `i`.
- **Browser:** press `w` (or `npm run web`).

The app is self-contained: it ships with its own menu, points balance and order state, so
it runs with **no server and no internet**. Menu prices and the pricing rules mirror the
web app (`src/pricing.js` is a direct port of `src/pricing.js`).

## Screens

| Screen | File | What it does |
| --- | --- | --- |
| Menu | `src/screens/MenuScreen.js` | Category chips, search, 2-column product cards |
| Item options | `src/components/ProductModal.js` | Size / drink / add-ons with live price, quantity |
| Cart | `src/screens/CartScreen.js` | Quantity steppers, subtotal, points preview |
| Checkout | `src/screens/CheckoutScreen.js` | Order type, Senior/PWD, redeem points, payment, summary |
| Orders | `src/screens/OrdersScreen.js` | Order history + receipt, live status, demo "advance status" |

Global state lives in `src/store.js` (React Context). Theme colours and helpers are in
`src/theme.js`.

## Structure

```
mobile/
  App.js                     Header + bottom tab bar
  app.json                   Expo config (name, icon, splash)
  index.js                   Expo entry point
  src/
    data.js                  Menu + option groups (mirrors src/seed-data.js)
    pricing.js               VAT / Senior-PWD / points rules (mirrors the server)
    store.js                 Cart, points, orders (React Context)
    theme.js                 Colours, status labels, money()
    components/ProductModal.js
    screens/MenuScreen.js
    screens/CartScreen.js
    screens/CheckoutScreen.js
    screens/OrdersScreen.js
```

## Connecting it to the real server (optional)

The demo keeps everything on the device. To use the live Express API instead, point the
app at your server and swap the store's local `placeOrder` for a `fetch` call:

```bash
EXPO_PUBLIC_API_URL=http://192.168.1.10:3000 npx expo start
```

Useful endpoints are documented in `../docs/06-api-reference.md`.

## Build a real installable app (optional)

```bash
npx expo install expo-dev-client
npx eas build -p android     # needs a free Expo account
```

Or via Capacitor/Expo prebuild for a native project you can open in Android Studio.

## Verified

`npx expo export --platform web` bundles the app successfully, and the exported web build
renders the menu (verified with headless Chrome). The native targets are produced by the
same Metro bundle.

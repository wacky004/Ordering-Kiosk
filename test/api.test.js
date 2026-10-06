'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

// Point the database at a throwaway file BEFORE the app is loaded.
process.env.KIOSK_DB_PATH = path.join(os.tmpdir(), `mcdo-test-${process.pid}-${Date.now()}.db`);
process.env.SESSION_SECRET = 'test-secret';

const app = require('../server');

let server;
let base;

test.before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  base = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  for (const suffix of ['', '-journal', '-wal', '-shm']) {
    try {
      fs.rmSync(process.env.KIOSK_DB_PATH + suffix, { force: true });
    } catch (err) {
      /* ignore */
    }
  }
});

async function req(pathname, options = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (options.cookie) headers.Cookie = options.cookie;
  const response = await fetch(base + pathname, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (err) {
    data = null;
  }
  const setCookie = response.headers.get('set-cookie');
  return { status: response.status, body: data, cookie: setCookie ? setCookie.split(';')[0] : null };
}

async function login(email, password) {
  const result = await req('/api/auth/login', { method: 'POST', body: { email, password } });
  assert.strictEqual(result.status, 200, `login failed for ${email}`);
  return result.cookie;
}

test('menu endpoint returns items with options and images', async () => {
  const result = await req('/api/menu');
  assert.strictEqual(result.status, 200);
  assert.strictEqual(result.body.items.length, 49);
  assert.strictEqual(result.body.categories.length, 9);
  const bigMac = result.body.items.find((item) => item.name === 'Big Mac');
  assert.ok(bigMac.image.endsWith('.jpg'));
  assert.ok(bigMac.options.some((group) => group.name === 'Add-ons'));
});

test('anonymous users cannot reach protected endpoints', async () => {
  assert.strictEqual((await req('/api/orders')).status, 401);
  assert.strictEqual((await req('/api/admin/stats')).status, 401);
});

test('placing an order prices options, applies senior discount and awards points', async () => {
  const cookie = await login('juan@email.com', 'user123');
  const menu = await req('/api/menu');
  const bigMac = menu.body.items.find((item) => item.name === 'Big Mac');
  const addons = bigMac.options.find((group) => group.name === 'Add-ons');
  const selected = addons.options.filter((option) => ['Extra Cheese', 'Bacon'].includes(option.name));

  const result = await req('/api/orders', {
    method: 'POST',
    cookie,
    body: {
      items: [{ id: bigMac.id, qty: 1, options: selected.map((option) => option.id) }],
      orderType: 'dine-in',
      paymentMethod: 'card',
      seniorPwdCount: 1
    }
  });

  assert.strictEqual(result.status, 201, JSON.stringify(result.body));
  const order = result.body.order;
  assert.strictEqual(order.subtotal, 233);
  assert.strictEqual(order.vat_amount, 0);
  assert.strictEqual(order.senior_discount, 41.61);
  assert.strictEqual(order.total, 166.43);
  assert.strictEqual(order.points_earned, 166);
  assert.strictEqual(order.items[0].options.length, 2);
  assert.strictEqual(result.body.points, 250 + 166);
});

test('a customer can only cancel a freshly received order once', async () => {
  const cookie = await login('juan@email.com', 'user123');
  const menu = await req('/api/menu');
  const cone = menu.body.items.find((item) => item.name === 'Vanilla Cone');
  const created = await req('/api/orders', {
    method: 'POST',
    cookie,
    body: { items: [{ id: cone.id, qty: 1, options: [] }], paymentMethod: 'cash' }
  });
  const id = created.body.order.id;

  const first = await req(`/api/orders/${id}/cancel`, { method: 'POST', cookie });
  assert.strictEqual(first.status, 200);
  assert.strictEqual(first.body.order.status, 'cancelled');

  const second = await req(`/api/orders/${id}/cancel`, { method: 'POST', cookie });
  assert.strictEqual(second.status, 400);
});

test('role guards: kitchen cooks, cashier completes, users are blocked from admin', async () => {
  const customerCookie = await login('juan@email.com', 'user123');
  const menu = await req('/api/menu');
  const fries = menu.body.items.find((item) => item.name === 'McFries Regular');
  const created = await req('/api/orders', {
    method: 'POST',
    cookie: customerCookie,
    body: { items: [{ id: fries.id, qty: 1, options: [] }], paymentMethod: 'cash' }
  });
  const id = created.body.order.id;

  assert.strictEqual((await req('/api/admin/stats', { cookie: customerCookie })).status, 403);

  const kitchenCookie = await login('kitchen@mcdo.ph', 'kitchen123');
  const start = await req(`/api/admin/orders/${id}/status`, {
    method: 'PATCH',
    cookie: kitchenCookie,
    body: { status: 'preparing' }
  });
  assert.strictEqual(start.status, 200);

  const ready = await req(`/api/admin/orders/${id}/status`, {
    method: 'PATCH',
    cookie: kitchenCookie,
    body: { status: 'ready' }
  });
  assert.strictEqual(ready.status, 200);

  const kitchenCannotComplete = await req(`/api/admin/orders/${id}/status`, {
    method: 'PATCH',
    cookie: kitchenCookie,
    body: { status: 'completed' }
  });
  assert.strictEqual(kitchenCannotComplete.status, 400);

  const cashierCookie = await login('cashier@mcdo.ph', 'cashier123');
  const completed = await req(`/api/admin/orders/${id}/status`, {
    method: 'PATCH',
    cookie: cashierCookie,
    body: { status: 'completed' }
  });
  assert.strictEqual(completed.status, 200);
  assert.strictEqual(completed.body.order.status, 'completed');
});

test('status changes are rejected when they skip the state machine', async () => {
  const cookie = await login('admin@mcdo.ph', 'admin123');
  const menu = await req('/api/menu');
  const tea = menu.body.items.find((item) => item.name === 'Iced Tea');
  const created = await req('/api/orders', {
    method: 'POST',
    cookie,
    body: { items: [{ id: tea.id, qty: 1, options: [] }], paymentMethod: 'cash' }
  });
  const result = await req(`/api/admin/orders/${created.body.order.id}/status`, {
    method: 'PATCH',
    cookie,
    body: { status: 'completed' }
  });
  assert.strictEqual(result.status, 400);
});

test('only admins can list staff', async () => {
  const managerCookie = await login('manager@mcdo.ph', 'manager123');
  assert.strictEqual((await req('/api/admin/staff', { cookie: managerCookie })).status, 403);
  const adminCookie = await login('admin@mcdo.ph', 'admin123');
  const result = await req('/api/admin/staff', { cookie: adminCookie });
  assert.strictEqual(result.status, 200);
  assert.ok(result.body.staff.length >= 4);
});

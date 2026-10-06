'use strict';

const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert');
const bcrypt = require('bcryptjs');

/** Loads public/js/mock-api.js in a fake browser environment. */
function loadMockApi() {
  const store = new Map();
  const fakeWindow = {};
  fakeWindow.window = fakeWindow;
  fakeWindow.self = fakeWindow;
  fakeWindow.location = { protocol: 'file:' };
  fakeWindow.localStorage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear()
  };
  fakeWindow.dcodeIO = { bcrypt };
  fakeWindow.SEED = require('../src/seed-data');

  const source = fs.readFileSync(path.join(__dirname, '..', 'public', 'js', 'mock-api.js'), 'utf8');
  const factory = new Function(
    'window',
    'localStorage',
    'location',
    'setInterval',
    'clearInterval',
    source + '\nreturn window.MockApi;'
  );
  const MockApi = factory(
    fakeWindow,
    fakeWindow.localStorage,
    fakeWindow.location,
    () => 0,
    () => {}
  );
  return MockApi;
}

function call(MockApi, pathname, method = 'GET', body = null) {
  return MockApi.request(pathname, { method, body });
}

test('offline mock backend mirrors the menu', () => {
  const MockApi = loadMockApi();
  const menu = call(MockApi, '/api/menu');
  assert.strictEqual(menu.items.length, 49);
  assert.strictEqual(menu.categories.length, 9);
  const bigMac = menu.items.find((item) => item.name === 'Big Mac');
  assert.ok(bigMac.options.some((group) => group.name === 'Add-ons'));
});

test('offline mock backend authenticates and protects routes', () => {
  const MockApi = loadMockApi();
  assert.throws(() => call(MockApi, '/api/orders'), /sign in/i);

  const login = call(MockApi, '/api/auth/login', 'POST', { email: 'juan@email.com', password: 'user123' });
  assert.strictEqual(login.user.role, 'user');
  const me = call(MockApi, '/api/auth/me');
  assert.strictEqual(me.user.email, 'juan@email.com');
});

test('offline pricing matches the server pricing rules', () => {
  const MockApi = loadMockApi();
  const customer = call(MockApi, '/api/auth/login', 'POST', { email: 'juan@email.com', password: 'user123' });
  const menu = call(MockApi, '/api/menu');
  const bigMac = menu.items.find((item) => item.name === 'Big Mac');
  const addons = bigMac.options.find((group) => group.name === 'Add-ons');
  const selected = addons.options.filter((option) => ['Extra Cheese', 'Bacon'].includes(option.name));

  const result = call(MockApi, '/api/orders', 'POST', {
    items: [{ id: bigMac.id, qty: 1, options: selected.map((option) => option.id) }],
    orderType: 'dine-in',
    paymentMethod: 'card',
    seniorPwdCount: 1
  });

  assert.strictEqual(result.order.subtotal, 233);
  assert.strictEqual(result.order.senior_discount, 41.61);
  assert.strictEqual(result.order.total, 166.43);
  assert.strictEqual(result.order.points_earned, 166);
  assert.strictEqual(result.points, customer.user.points + 166);
});

test('offline state machine enforces roles', () => {
  const MockApi = loadMockApi();
  const customer = call(MockApi, '/api/auth/login', 'POST', { email: 'juan@email.com', password: 'user123' });
  const menu = call(MockApi, '/api/menu');
  const cone = menu.items.find((item) => item.name === 'Vanilla Cone');
  const order = call(MockApi, '/api/orders', 'POST', {
    items: [{ id: cone.id, qty: 1, options: [] }],
    paymentMethod: 'cash'
  }).order;

  call(MockApi, '/api/auth/login', 'POST', { email: 'kitchen@mcdo.ph', password: 'kitchen123' });
  const started = call(MockApi, `/api/admin/orders/${order.id}/status`, 'PATCH', { status: 'preparing' });
  assert.strictEqual(started.order.status, 'preparing');
  call(MockApi, `/api/admin/orders/${order.id}/status`, 'PATCH', { status: 'ready' });
  assert.throws(
    () => call(MockApi, `/api/admin/orders/${order.id}/status`, 'PATCH', { status: 'completed' }),
    /Cannot move/
  );

  call(MockApi, '/api/auth/login', 'POST', { email: 'cashier@mcdo.ph', password: 'cashier123' });
  const completed = call(MockApi, `/api/admin/orders/${order.id}/status`, 'PATCH', { status: 'completed' });
  assert.strictEqual(completed.order.status, 'completed');
  assert.ok(customer.user);
});

test('demo reset restores the seeded orders and points', () => {
  const MockApi = loadMockApi();
  call(MockApi, '/api/auth/login', 'POST', { email: 'admin@mcdo.ph', password: 'admin123' });
  const before = call(MockApi, '/api/admin/stats');
  assert.strictEqual(before.totalOrders, 4);
  assert.strictEqual(call(MockApi, '/api/admin/demo/reset', 'POST').ok, true);
  const after = call(MockApi, '/api/admin/stats');
  assert.strictEqual(after.totalOrders, 4);
});

'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { canTransition, nextStatus, TRANSITIONS } = require('../src/order-status');

test('valid forward transitions are allowed for privileged roles', () => {
  assert.ok(canTransition('admin', 'received', 'preparing'));
  assert.ok(canTransition('manager', 'preparing', 'ready'));
  assert.ok(canTransition('manager', 'ready', 'completed'));
});

test('a completed order cannot move anywhere', () => {
  assert.deepStrictEqual(TRANSITIONS.completed, []);
  assert.ok(!canTransition('admin', 'completed', 'preparing'));
});

test('kitchen may only start and finish cooking', () => {
  assert.ok(canTransition('kitchen', 'received', 'preparing'));
  assert.ok(canTransition('kitchen', 'preparing', 'ready'));
  assert.ok(!canTransition('kitchen', 'ready', 'completed'));
  assert.ok(!canTransition('kitchen', 'received', 'cancelled'));
});

test('cashier may complete and cancel but not cook', () => {
  assert.ok(canTransition('cashier', 'ready', 'completed'));
  assert.ok(canTransition('cashier', 'received', 'cancelled'));
  assert.ok(!canTransition('cashier', 'received', 'preparing'));
});

test('customers may only cancel a freshly received order', () => {
  assert.ok(canTransition('user', 'received', 'cancelled'));
  assert.ok(!canTransition('user', 'preparing', 'cancelled'));
  assert.ok(!canTransition('user', 'received', 'preparing'));
});

test('skipping steps is rejected', () => {
  assert.ok(!canTransition('admin', 'received', 'completed'));
  assert.ok(!canTransition('admin', 'preparing', 'completed'));
});

test('nextStatus walks the happy path', () => {
  assert.strictEqual(nextStatus('received'), 'preparing');
  assert.strictEqual(nextStatus('preparing'), 'ready');
  assert.strictEqual(nextStatus('ready'), 'completed');
  assert.strictEqual(nextStatus('completed'), null);
});

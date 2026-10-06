'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { computeOrder, unitPrice } = require('../src/pricing');

test('unit price adds option deltas', () => {
  assert.strictEqual(unitPrice(100, [20, 35]), 155);
  assert.strictEqual(unitPrice(100, []), 100);
});

test('subtotal and 12% VAT are computed from VAT-inclusive prices', () => {
  const totals = computeOrder(
    [{ price: 112, qty: 1, options: [] }],
    { availablePoints: 0, redeemPoints: 0, seniorPwdCount: 0 }
  );
  assert.strictEqual(totals.subtotal, 112);
  assert.strictEqual(totals.vatableSales, 100);
  assert.strictEqual(totals.vatAmount, 12);
  assert.strictEqual(totals.total, 112);
  assert.strictEqual(totals.pointsEarned, 112);
});

test('options increase the line total', () => {
  const totals = computeOrder(
    [{ price: 178, qty: 1, options: [{ delta: 20 }, { delta: 35 }] }],
    { availablePoints: 0, redeemPoints: 0, seniorPwdCount: 0 }
  );
  assert.strictEqual(totals.subtotal, 233);
  assert.strictEqual(totals.lines[0].unit, 233);
});

test('senior/PWD discount is 20% off the net-of-VAT amount and is VAT-exempt', () => {
  const totals = computeOrder(
    [{ price: 233, qty: 1, options: [] }],
    { availablePoints: 0, redeemPoints: 0, seniorPwdCount: 1 }
  );
  assert.strictEqual(totals.vatAmount, 0);
  assert.strictEqual(totals.vatExemptSales, 208.04);
  assert.strictEqual(totals.seniorDiscount, 41.61);
  assert.strictEqual(totals.total, 166.43);
});

test('points redeem in blocks of 100 and cap at the order value', () => {
  const totals = computeOrder(
    [{ price: 250, qty: 1, options: [] }],
    { availablePoints: 500, redeemPoints: 150, seniorPwdCount: 0 }
  );
  assert.strictEqual(totals.redeemPoints, 100);
  assert.strictEqual(totals.pointsDiscount, 10);
  assert.strictEqual(totals.total, 240);
  assert.strictEqual(totals.pointsEarned, 240);
});

test('cannot redeem more points than the customer owns', () => {
  const totals = computeOrder(
    [{ price: 500, qty: 1, options: [] }],
    { availablePoints: 50, redeemPoints: 100, seniorPwdCount: 0 }
  );
  assert.strictEqual(totals.redeemPoints, 0);
  assert.strictEqual(totals.pointsDiscount, 0);
});

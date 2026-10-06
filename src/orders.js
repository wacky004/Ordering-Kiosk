'use strict';

const express = require('express');
const { db } = require('./db');
const { requireAuth } = require('./middleware');
const { computeOrder } = require('./pricing');
const { getOptionsForItems } = require('./options');
const { canTransition } = require('./order-status');
const { emit } = require('./events');
const { STATUS_FLOW, STATUS_LABELS, STATUS_NOTES } = require('./seed-data');

const router = express.Router();

const PAYMENT_METHODS = ['card', 'gcash', 'cash'];
const ORDER_TYPES = ['dine-in', 'takeout'];

function loadOrder(id) {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (!order) return null;
  order.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(id);
  order.items.forEach((item) => {
    item.options = db
      .prepare('SELECT * FROM order_item_options WHERE order_item_id = ?')
      .all(item.id);
  });
  order.events = db.prepare('SELECT * FROM order_events WHERE order_id = ? ORDER BY id').all(id);
  return order;
}

router.post('/', requireAuth, (req, res) => {
  const rawItems = Array.isArray(req.body.items) ? req.body.items : [];
  const orderType = ORDER_TYPES.includes(req.body.orderType) ? req.body.orderType : 'dine-in';
  const paymentMethod = PAYMENT_METHODS.includes(req.body.paymentMethod)
    ? req.body.paymentMethod
    : 'cash';
  const seniorPwdCount = Math.max(0, Math.floor(Number(req.body.seniorPwdCount) || 0));
  const redeemPoints = Math.max(0, Math.floor(Number(req.body.redeemPoints) || 0));

  if (rawItems.length === 0) {
    return res.status(400).json({ error: 'Your cart is empty.' });
  }

  const menuIds = [...new Set(rawItems.map((entry) => Number(entry && entry.id)).filter(Boolean))];
  if (menuIds.length === 0) {
    return res.status(400).json({ error: 'Invalid cart item.' });
  }
  const placeholders = menuIds.map(() => '?').join(',');
  const menuItems = db.prepare(`SELECT * FROM menu_items WHERE id IN (${placeholders})`).all(...menuIds);
  const itemMap = {};
  menuItems.forEach((item) => {
    itemMap[item.id] = item;
  });
  const optionsMap = getOptionsForItems(menuIds);

  const lines = [];
  const resolvedByLine = [];

  for (const entry of rawItems) {
    const id = Number(entry && entry.id);
    const qty = Math.floor(Number(entry && entry.qty));
    if (!itemMap[id]) return res.status(400).json({ error: 'Invalid cart item.' });
    if (!qty || qty < 1 || qty > 50) {
      return res.status(400).json({ error: 'Quantity must be between 1 and 50.' });
    }
    const menuItem = itemMap[id];
    if (!menuItem.available) {
      return res.status(400).json({ error: `"${menuItem.name}" is no longer available.` });
    }

    const chosen = Array.isArray(entry.options) ? entry.options.map(Number) : [];
    const groups = optionsMap[id] || [];
    const resolved = [];
    groups.forEach((group) => {
      let selected = group.options.filter((option) => chosen.includes(option.id));
      if (group.type === 'single') {
        if (selected.length === 0 && group.required) {
          selected = [group.options.find((option) => option.is_default) || group.options[0]].filter(Boolean);
        }
        selected = selected.slice(0, 1);
      }
      selected.forEach((option) => {
        resolved.push({
          optionId: option.id,
          groupName: group.name,
          optionName: option.name,
          delta: option.delta
        });
      });
    });

    lines.push({ price: menuItem.price, qty, options: resolved.map((r) => ({ delta: r.delta })) });
    resolvedByLine.push({ menuItem, qty, resolved });
  }

  const totals = computeOrder(lines, {
    availablePoints: req.user.points,
    redeemPoints,
    seniorPwdCount
  });

  let orderId;
  db.exec('BEGIN');
  try {
    const info = db
      .prepare(
        `INSERT INTO orders (user_id, subtotal, discount, senior_discount, vat_amount, vatable_sales,
           vat_exempt_sales, senior_pwd_count, points_redeemed, points_earned, total,
           order_type, payment_method, payment_status, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'paid', 'received')`
      )
      .run(
        req.user.id,
        totals.subtotal,
        totals.pointsDiscount,
        totals.seniorDiscount,
        totals.vatAmount,
        totals.vatableSales,
        totals.vatExemptSales,
        totals.seniorPwdCount,
        totals.redeemPoints,
        totals.pointsEarned,
        totals.total,
        orderType,
        paymentMethod
      );
    orderId = Number(info.lastInsertRowid);
    db.prepare('UPDATE orders SET code = ? WHERE id = ?').run(`MC-${1000 + orderId}`, orderId);

    const insertItem = db.prepare(
      `INSERT INTO order_items (order_id, menu_item_id, name, unit_price, qty, line_total)
       VALUES (?, ?, ?, ?, ?, ?)`
    );
    const insertOption = db.prepare(
      `INSERT INTO order_item_options (order_item_id, option_id, group_name, option_name, price_delta)
       VALUES (?, ?, ?, ?, ?)`
    );

    resolvedByLine.forEach((line, index) => {
      const priced = totals.lines[index];
      const itemInfo = insertItem.run(
        orderId,
        line.menuItem.id,
        line.menuItem.name,
        priced.unit,
        line.qty,
        priced.lineTotal
      );
      const orderItemId = Number(itemInfo.lastInsertRowid);
      line.resolved.forEach((option) => {
        insertOption.run(
          orderItemId,
          option.optionId,
          option.groupName,
          option.optionName,
          option.delta
        );
      });
    });

    db.prepare('INSERT INTO order_events (order_id, status, note) VALUES (?, ?, ?)').run(
      orderId,
      'received',
      STATUS_NOTES.received
    );
    db.prepare('UPDATE users SET points = points - ? + ? WHERE id = ?').run(
      totals.redeemPoints,
      totals.pointsEarned,
      req.user.id
    );
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }

  const order = loadOrder(orderId);
  const points = db.prepare('SELECT points FROM users WHERE id = ?').get(req.user.id).points;
  emit('order:new', { id: orderId, code: order.code, status: order.status });
  emit('stats:changed', {});
  res.status(201).json({ order, points, statusLabels: STATUS_LABELS });
});

router.get('/', requireAuth, (req, res) => {
  const orders = db
    .prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC')
    .all(req.user.id);
  orders.forEach((order) => {
    order.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
    order.item_count = order.items.reduce((sum, item) => sum + item.qty, 0);
  });
  res.json({ orders, statusLabels: STATUS_LABELS, statusFlow: STATUS_FLOW });
});

router.get('/:id', requireAuth, (req, res) => {
  const order = loadOrder(Number(req.params.id));
  if (!order || (order.user_id !== req.user.id && req.user.role === 'user')) {
    return res.status(404).json({ error: 'Order not found.' });
  }
  res.json({ order, statusLabels: STATUS_LABELS, statusFlow: STATUS_FLOW });
});

router.post('/:id/cancel', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (!order || (order.user_id !== req.user.id && req.user.role === 'user')) {
    return res.status(404).json({ error: 'Order not found.' });
  }
  const role = req.user.role === 'user' ? 'user' : req.user.role;
  if (!canTransition(role, order.status, 'cancelled')) {
    return res.status(400).json({ error: 'This order can no longer be cancelled.' });
  }
  db.prepare("UPDATE orders SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?").run(id);
  db.prepare('INSERT INTO order_events (order_id, status, note) VALUES (?, ?, ?)').run(
    id,
    'cancelled',
    STATUS_NOTES.cancelled
  );
  emit('order:updated', { id, status: 'cancelled', code: order.code });
  emit('stats:changed', {});
  res.json({ order: loadOrder(id), statusLabels: STATUS_LABELS });
});

module.exports = { router, loadOrder, PAYMENT_METHODS, ORDER_TYPES };

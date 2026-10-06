'use strict';

const express = require('express');
const bcrypt = require('bcryptjs');
const { db, resetDemoData } = require('./db');
const { requireRole, STAFF_ROLES } = require('./middleware');
const { loadOrder } = require('./orders');
const { getOptionsForItems } = require('./options');
const { canTransition, nextStatus } = require('./order-status');
const { emit } = require('./events');
const { STATUS_FLOW, STATUS_LABELS, STATUS_NOTES, ROLE_LABELS } = require('./seed-data');

const router = express.Router();

const OPS = requireRole('admin', 'manager', 'cashier');
const KITCHEN = requireRole('admin', 'manager', 'kitchen');
const MENU_ADMIN = requireRole('admin', 'manager');

function attachMeta(order) {
  order.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  order.events = db.prepare('SELECT * FROM order_events WHERE order_id = ? ORDER BY id').all(order.id);
  return order;
}

/* ---------------- Orders ---------------- */
router.get('/orders', OPS, (req, res) => {
  const status = String(req.query.status || '');
  const params = [];
  let query = `SELECT orders.*, users.name AS customer_name, users.email AS customer_email
               FROM orders JOIN users ON users.id = orders.user_id`;
  if (STATUS_FLOW.includes(status) || status === 'cancelled') {
    query += ' WHERE orders.status = ?';
    params.push(status);
  }
  query += ' ORDER BY orders.id DESC';
  const orders = db.prepare(query).all(...params).map(attachMeta);
  res.json({ orders, statusFlow: STATUS_FLOW, statusLabels: STATUS_LABELS });
});

router.get('/kitchen', KITCHEN, (req, res) => {
  const orders = db
    .prepare(
      `SELECT orders.*, users.name AS customer_name
       FROM orders JOIN users ON users.id = orders.user_id
       WHERE orders.status IN ('received', 'preparing')
       ORDER BY orders.id ASC`
    )
    .all()
    .map(attachMeta);
  res.json({ orders, statusFlow: STATUS_FLOW, statusLabels: STATUS_LABELS });
});

router.patch('/orders/:id/status', requireRole('admin', 'manager', 'cashier', 'kitchen'), (req, res) => {
  const status = String(req.body.status || '');
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(Number(req.params.id));
  if (!order) return res.status(404).json({ error: 'Order not found.' });
  if (!canTransition(req.user.role, order.status, status)) {
    return res
      .status(400)
      .json({ error: `Cannot move this order from "${order.status}" to "${status}".` });
  }
  db.prepare("UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?").run(
    status,
    order.id
  );
  db.prepare('INSERT INTO order_events (order_id, status, note) VALUES (?, ?, ?)').run(
    order.id,
    status,
    STATUS_NOTES[status] || ''
  );
  emit('order:updated', { id: order.id, status, code: order.code });
  emit('stats:changed', {});
  res.json({ order: loadOrder(order.id), statusLabels: STATUS_LABELS, next: nextStatus(status) });
});

/* ---------------- Stats ---------------- */
router.get('/stats', OPS, (req, res) => {
  const todayOrders = db
    .prepare("SELECT COUNT(*) AS n FROM orders WHERE date(created_at) = date('now')")
    .get().n;
  const todayRevenue = db
    .prepare(
      "SELECT COALESCE(SUM(total), 0) AS v FROM orders WHERE date(created_at) = date('now') AND status != 'cancelled'"
    )
    .get().v;
  const activeOrders = db
    .prepare("SELECT COUNT(*) AS n FROM orders WHERE status IN ('received', 'preparing', 'ready')")
    .get().n;
  const totalOrders = db.prepare('SELECT COUNT(*) AS n FROM orders').get().n;
  const totalUsers = db.prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'user'").get().n;
  const pointsIssued = db.prepare('SELECT COALESCE(SUM(points_earned), 0) AS v FROM orders').get().v;
  res.json({ todayOrders, todayRevenue, activeOrders, totalOrders, totalUsers, pointsIssued });
});

/* ---------------- Menu ---------------- */
router.get('/menu', MENU_ADMIN, (req, res) => {
  const items = db
    .prepare('SELECT * FROM menu_items ORDER BY sort_order, id')
    .all()
    .map((item) => ({ ...item, available: Boolean(item.available) }));
  const optionsMap = getOptionsForItems(items.map((item) => item.id));
  items.forEach((item) => {
    item.options = optionsMap[item.id] || [];
  });
  res.json({ items });
});

router.post('/menu', MENU_ADMIN, (req, res) => {
  const name = String(req.body.name || '').trim();
  const category = String(req.body.category || '').trim();
  const price = Number(req.body.price);
  if (!name || !category || !Number.isFinite(price) || price <= 0) {
    return res.status(400).json({ error: 'Name, category and a valid price are required.' });
  }
  const maxSort = db.prepare('SELECT COALESCE(MAX(sort_order), 0) AS m FROM menu_items').get().m;
  const image =
    String(req.body.image || '').trim() || `/img/menu/${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.jpg`;
  const info = db
    .prepare(
      `INSERT INTO menu_items (name, description, category, price, icon, badge, image, available, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`
    )
    .run(name, String(req.body.description || ''), category, price, String(req.body.icon || '🍔'), String(req.body.badge || ''), image, maxSort + 1);
  const item = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(Number(info.lastInsertRowid));
  res.status(201).json({ item: { ...item, available: true, options: [] } });
});

router.patch('/menu/:id', MENU_ADMIN, (req, res) => {
  const id = Number(req.params.id);
  const item = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(id);
  if (!item) return res.status(404).json({ error: 'Menu item not found.' });
  const updates = {
    name: req.body.name !== undefined ? String(req.body.name) : item.name,
    description: req.body.description !== undefined ? String(req.body.description) : item.description,
    category: req.body.category !== undefined ? String(req.body.category) : item.category,
    price: req.body.price !== undefined ? Number(req.body.price) : item.price,
    icon: req.body.icon !== undefined ? String(req.body.icon) : item.icon,
    badge: req.body.badge !== undefined ? String(req.body.badge) : item.badge,
    image: req.body.image !== undefined ? String(req.body.image) : item.image,
    available: req.body.available !== undefined ? (req.body.available ? 1 : 0) : item.available
  };
  if (!Number.isFinite(updates.price) || updates.price <= 0) {
    return res.status(400).json({ error: 'Price must be a positive number.' });
  }
  db.prepare(
    `UPDATE menu_items SET name = ?, description = ?, category = ?, price = ?, icon = ?,
       badge = ?, image = ?, available = ? WHERE id = ?`
  ).run(
    updates.name,
    updates.description,
    updates.category,
    updates.price,
    updates.icon,
    updates.badge,
    updates.image,
    updates.available,
    id
  );
  const updated = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(id);
  res.json({ item: { ...updated, available: Boolean(updated.available) } });
});

router.delete('/menu/:id', MENU_ADMIN, (req, res) => {
  const id = Number(req.params.id);
  if (!db.prepare('SELECT id FROM menu_items WHERE id = ?').get(id)) {
    return res.status(404).json({ error: 'Menu item not found.' });
  }
  try {
    db.prepare('DELETE FROM menu_items WHERE id = ?').run(id);
    res.json({ deleted: true });
  } catch (err) {
    db.prepare('UPDATE menu_items SET available = 0 WHERE id = ?').run(id);
    res.json({
      deleted: false,
      disabled: true,
      message: 'Item has past orders, so it was marked unavailable instead.'
    });
  }
});

/* ---------------- Option groups ---------------- */
router.post('/menu/:id/options', MENU_ADMIN, (req, res) => {
  const itemId = Number(req.params.id);
  if (!db.prepare('SELECT id FROM menu_items WHERE id = ?').get(itemId)) {
    return res.status(404).json({ error: 'Menu item not found.' });
  }
  const name = String(req.body.name || '').trim();
  if (!name) return res.status(400).json({ error: 'Option group name is required.' });
  const type = req.body.type === 'multi' ? 'multi' : 'single';
  const maxSort = db
    .prepare('SELECT COALESCE(MAX(sort_order), 0) AS m FROM option_groups WHERE menu_item_id = ?')
    .get(itemId).m;
  const info = db
    .prepare('INSERT INTO option_groups (menu_item_id, name, type, required, sort_order) VALUES (?, ?, ?, ?, ?)')
    .run(itemId, name, type, req.body.required ? 1 : 0, maxSort + 1);
  res.status(201).json({ groupId: Number(info.lastInsertRowid) });
});

router.delete('/options/:groupId', MENU_ADMIN, (req, res) => {
  const groupId = Number(req.params.groupId);
  const group = db.prepare('SELECT * FROM option_groups WHERE id = ?').get(groupId);
  if (!group) return res.status(404).json({ error: 'Option group not found.' });
  db.prepare('DELETE FROM options WHERE group_id = ?').run(groupId);
  db.prepare('DELETE FROM option_groups WHERE id = ?').run(groupId);
  res.json({ deleted: true });
});

router.post('/options/:groupId/values', MENU_ADMIN, (req, res) => {
  const groupId = Number(req.params.groupId);
  if (!db.prepare('SELECT id FROM option_groups WHERE id = ?').get(groupId)) {
    return res.status(404).json({ error: 'Option group not found.' });
  }
  const name = String(req.body.name || '').trim();
  const delta = Number(req.body.delta || 0);
  if (!name) return res.status(400).json({ error: 'Option name is required.' });
  const info = db
    .prepare('INSERT INTO options (group_id, name, price_delta, is_default, sort_order) VALUES (?, ?, ?, ?, ?)')
    .run(groupId, name, delta, req.body.is_default ? 1 : 0, 0);
  res.status(201).json({ optionId: Number(info.lastInsertRowid) });
});

router.delete('/option-values/:optionId', MENU_ADMIN, (req, res) => {
  db.prepare('DELETE FROM options WHERE id = ?').run(Number(req.params.optionId));
  res.json({ deleted: true });
});

/* ---------------- Customers & staff ---------------- */
router.get('/customers', OPS, (req, res) => {
  const customers = db
    .prepare("SELECT id, name, email, points, created_at FROM users WHERE role = 'user' ORDER BY points DESC")
    .all();
  res.json({ customers });
});

router.get('/staff', requireRole('admin'), (req, res) => {
  const staff = db
    .prepare("SELECT id, name, email, role, created_at FROM users WHERE role != 'user' ORDER BY id")
    .all()
    .map((user) => ({ ...user, roleLabel: ROLE_LABELS[user.role] || user.role }));
  res.json({ staff, roles: STAFF_ROLES });
});

router.post('/staff', requireRole('admin'), (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const role = String(req.body.role || '');
  if (!name || !email || password.length < 6 || !STAFF_ROLES.includes(role)) {
    return res.status(400).json({ error: 'Name, valid email, 6+ char password and a staff role are required.' });
  }
  if (db.prepare('SELECT id FROM users WHERE email = ?').get(email)) {
    return res.status(409).json({ error: 'That email is already registered.' });
  }
  const info = db
    .prepare('INSERT INTO users (name, email, password_hash, role, points) VALUES (?, ?, ?, ?, 0)')
    .run(name, email, bcrypt.hashSync(password, 10), role);
  const user = db.prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?').get(Number(info.lastInsertRowid));
  res.status(201).json({ staff: { ...user, roleLabel: ROLE_LABELS[role] || role } });
});

router.patch('/staff/:id', requireRole('admin'), (req, res) => {
  const id = Number(req.params.id);
  const user = db.prepare("SELECT * FROM users WHERE id = ? AND role != 'user'").get(id);
  if (!user) return res.status(404).json({ error: 'Staff member not found.' });
  const role = STAFF_ROLES.includes(String(req.body.role)) ? String(req.body.role) : user.role;
  db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, id);
  res.json({ updated: true, role });
});

/* ---------------- Demo ---------------- */
router.post('/demo/reset', requireRole('admin'), (req, res) => {
  resetDemoData();
  emit('stats:changed', {});
  emit('demo:reset', {});
  res.json({ ok: true });
});

module.exports = router;

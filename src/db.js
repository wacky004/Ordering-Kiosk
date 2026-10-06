'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const bcrypt = require('bcryptjs');

const { runMigrations } = require('./migrations');
const { slugify } = require('./slug');
const { computeOrder } = require('./pricing');
const seed = require('./seed-data');

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = process.env.KIOSK_DB_PATH
  ? path.resolve(process.env.KIOSK_DB_PATH)
  : path.join(DATA_DIR, 'kiosk.db');

const reset = process.argv.includes('--reset');
if (reset && fs.existsSync(DB_PATH)) {
  fs.rmSync(DB_PATH);
  console.log('Existing database removed.');
}

const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA foreign_keys = ON;');
runMigrations(db);

function imagePathFor(name) {
  return `/img/menu/${slugify(name)}.jpg`;
}

function seedMenu() {
  if (db.prepare('SELECT COUNT(*) AS n FROM menu_items').get().n > 0) return;
  const insertItem = db.prepare(
    `INSERT INTO menu_items (name, description, category, price, icon, badge, image, available, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`
  );
  const insertGroup = db.prepare(
    `INSERT INTO option_groups (menu_item_id, name, type, required, sort_order) VALUES (?, ?, ?, ?, ?)`
  );
  const insertOption = db.prepare(
    `INSERT INTO options (group_id, name, price_delta, is_default, sort_order) VALUES (?, ?, ?, ?, ?)`
  );

  seed.MENU.forEach((item, index) => {
    const info = insertItem.run(
      item.name,
      item.description,
      item.category,
      item.price,
      item.icon,
      item.badge,
      imagePathFor(item.name),
      index
    );
    const itemId = Number(info.lastInsertRowid);
    const groupKeys = seed.CATEGORY_OPTIONS[item.category] || [];
    groupKeys.forEach((key, groupIndex) => {
      const template = seed.OPTION_TEMPLATES[key];
      if (!template) return;
      const groupInfo = insertGroup.run(
        itemId,
        template.name,
        template.type,
        template.required,
        groupIndex
      );
      const groupId = Number(groupInfo.lastInsertRowid);
      template.options.forEach((option, optionIndex) => {
        insertOption.run(groupId, option.name, option.delta, option.is_default, optionIndex);
      });
    });
  });
  console.log(`Seeded ${seed.MENU.length} menu items with options.`);
}

function seedUsers() {
  if (db.prepare('SELECT COUNT(*) AS n FROM users').get().n > 0) return;
  const insert = db.prepare(
    'INSERT INTO users (name, email, password_hash, role, points) VALUES (?, ?, ?, ?, ?)'
  );
  seed.USERS.forEach((user) => {
    insert.run(user.name, user.email, bcrypt.hashSync(user.password, 10), user.role, user.points);
  });
  console.log(`Seeded ${seed.USERS.length} accounts (admin@mcdo.ph / admin123, juan@email.com / user123).`);
}

function seedDemoOrders() {
  if (db.prepare('SELECT COUNT(*) AS n FROM orders').get().n > 0) return;
  const customer = db.prepare("SELECT id FROM users WHERE role = 'user' ORDER BY id LIMIT 1").get();
  if (!customer) return;

  seed.DEMO_ORDERS.forEach((demo, index) => {
    const items = demo.items
      .map((name) => db.prepare('SELECT * FROM menu_items WHERE name = ?').get(name))
      .filter(Boolean);
    if (items.length === 0) return;

    const totals = computeOrder(
      items.map((item) => ({ price: item.price, qty: 1, options: [] })),
      { availablePoints: 0, redeemPoints: 0, seniorPwdCount: 0 }
    );

    const info = db
      .prepare(
        `INSERT INTO orders (user_id, subtotal, discount, senior_discount, vat_amount, vatable_sales,
           vat_exempt_sales, senior_pwd_count, points_redeemed, points_earned, total,
           order_type, payment_method, payment_status, status)
         VALUES (?, ?, 0, 0, ?, ?, 0, 0, 0, ?, ?, 'dine-in', 'cash', 'paid', ?)`
      )
      .run(
        customer.id,
        totals.subtotal,
        totals.vatAmount,
        totals.vatableSales,
        totals.pointsEarned,
        totals.total,
        demo.status
      );
    const orderId = Number(info.lastInsertRowid);
    db.prepare('UPDATE orders SET code = ? WHERE id = ?').run(`MC-${1000 + orderId}`, orderId);

    const insertItem = db.prepare(
      `INSERT INTO order_items (order_id, menu_item_id, name, unit_price, qty, line_total)
       VALUES (?, ?, ?, ?, 1, ?)`
    );
    items.forEach((item) => {
      insertItem.run(orderId, item.id, item.name, item.price, item.price);
    });

    const flow = seed.STATUS_FLOW;
    const upto = flow.indexOf(demo.status);
    flow.slice(0, upto + 1).forEach((status) => {
      db.prepare('INSERT INTO order_events (order_id, status, note) VALUES (?, ?, ?)').run(
        orderId,
        status,
        seed.STATUS_NOTES[status]
      );
    });
  });
  console.log('Seeded demo orders.');
}

function seedAll() {
  seedMenu();
  seedUsers();
  seedDemoOrders();
}

/** Wipe transactional data and re-seed demo orders (used by the Reset demo button). */
function resetDemoData() {
  db.exec('BEGIN');
  try {
    db.exec('DELETE FROM order_item_options');
    db.exec('DELETE FROM order_events');
    db.exec('DELETE FROM order_items');
    db.exec('DELETE FROM orders');
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
  const customer = db.prepare("SELECT id FROM users WHERE role = 'user' ORDER BY id LIMIT 1").get();
  if (customer) {
    db.prepare('UPDATE users SET points = ? WHERE id = ?').run(
      seed.USERS.find((user) => user.role === 'user').points,
      customer.id
    );
  }
  seedDemoOrders();
}

seedAll();
if (reset) console.log('Database reset complete.');

module.exports = { db, DB_PATH, imagePathFor, resetDemoData, seedAll };

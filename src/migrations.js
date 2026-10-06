'use strict';

function hasTable(db, table) {
  const row = db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
    .get(table);
  return Boolean(row);
}

function hasColumn(db, table, column) {
  if (!hasTable(db, table)) return false;
  return db
    .prepare(`PRAGMA table_info(${table})`)
    .all()
    .some((row) => row.name === column);
}

function addColumnIfMissing(db, table, column, definition) {
  if (!hasColumn(db, table, column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

const MIGRATIONS = [
  {
    id: 1,
    name: 'base_schema',
    up(db) {
      db.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'user',
          points INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS menu_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT NOT NULL DEFAULT '',
          category TEXT NOT NULL,
          price REAL NOT NULL,
          icon TEXT NOT NULL DEFAULT '🍔',
          badge TEXT NOT NULL DEFAULT '',
          available INTEGER NOT NULL DEFAULT 1,
          sort_order INTEGER NOT NULL DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS orders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          code TEXT NOT NULL UNIQUE DEFAULT '',
          user_id INTEGER NOT NULL,
          subtotal REAL NOT NULL,
          discount REAL NOT NULL DEFAULT 0,
          points_redeemed INTEGER NOT NULL DEFAULT 0,
          points_earned INTEGER NOT NULL DEFAULT 0,
          total REAL NOT NULL,
          order_type TEXT NOT NULL DEFAULT 'dine-in',
          payment_method TEXT NOT NULL,
          payment_status TEXT NOT NULL DEFAULT 'paid',
          status TEXT NOT NULL DEFAULT 'received',
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS order_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          order_id INTEGER NOT NULL,
          menu_item_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          unit_price REAL NOT NULL,
          qty INTEGER NOT NULL,
          line_total REAL NOT NULL
        );
        CREATE TABLE IF NOT EXISTS order_events (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          order_id INTEGER NOT NULL,
          status TEXT NOT NULL,
          note TEXT NOT NULL DEFAULT '',
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
      `);
    }
  },
  {
    id: 2,
    name: 'menu_item_images',
    up(db) {
      addColumnIfMissing(db, 'menu_items', 'image', "TEXT NOT NULL DEFAULT ''");
    }
  },
  {
    id: 3,
    name: 'item_options',
    up(db) {
      db.exec(`
        CREATE TABLE IF NOT EXISTS option_groups (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          menu_item_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          type TEXT NOT NULL DEFAULT 'single',
          required INTEGER NOT NULL DEFAULT 0,
          sort_order INTEGER NOT NULL DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS options (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          group_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          price_delta REAL NOT NULL DEFAULT 0,
          is_default INTEGER NOT NULL DEFAULT 0,
          sort_order INTEGER NOT NULL DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS order_item_options (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          order_item_id INTEGER NOT NULL,
          option_id INTEGER,
          group_name TEXT NOT NULL,
          option_name TEXT NOT NULL,
          price_delta REAL NOT NULL DEFAULT 0
        );
      `);
    }
  },
  {
    id: 4,
    name: 'order_billing_fields',
    up(db) {
      addColumnIfMissing(db, 'orders', 'senior_discount', 'REAL NOT NULL DEFAULT 0');
      addColumnIfMissing(db, 'orders', 'vat_amount', 'REAL NOT NULL DEFAULT 0');
      addColumnIfMissing(db, 'orders', 'vatable_sales', 'REAL NOT NULL DEFAULT 0');
      addColumnIfMissing(db, 'orders', 'vat_exempt_sales', 'REAL NOT NULL DEFAULT 0');
      addColumnIfMissing(db, 'orders', 'senior_pwd_count', 'INTEGER NOT NULL DEFAULT 0');
    }
  },
  {
    id: 5,
    name: 'indexes',
    up(db) {
      db.exec(`
        CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
        CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
        CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
        CREATE INDEX IF NOT EXISTS idx_order_events_order ON order_events(order_id);
        CREATE INDEX IF NOT EXISTS idx_option_groups_item ON option_groups(menu_item_id);
        CREATE INDEX IF NOT EXISTS idx_options_group ON options(group_id);
      `);
    }
  }
];

function runMigrations(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  const applied = new Set(
    db.prepare('SELECT id FROM schema_migrations').all().map((row) => row.id)
  );
  for (const migration of MIGRATIONS) {
    if (applied.has(migration.id)) continue;
    db.exec('BEGIN');
    try {
      migration.up(db);
      db.prepare('INSERT INTO schema_migrations (id, name) VALUES (?, ?)').run(
        migration.id,
        migration.name
      );
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  }
}

module.exports = { runMigrations, MIGRATIONS, hasColumn, addColumnIfMissing };

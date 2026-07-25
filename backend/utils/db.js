const path = require('path');
const Database = require('better-sqlite3');

// SQLite database file — created automatically on first run.
const DB_FILE = path.join(__dirname, '..', 'data', 'database.sqlite');
const db = new Database(DB_FILE);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    image TEXT,
    name TEXT NOT NULL,
    desc TEXT NOT NULL,
    price TEXT NOT NULL,
    available INTEGER NOT NULL DEFAULT 1
  );
`);

// Seed a starter menu the very first time the database is created.
// No photo yet for these — the storefront falls back to a category icon
// until an admin uploads a real photo for them.
(function seedIfEmpty() {
  const { count } = db.prepare('SELECT COUNT(*) AS count FROM products').get();
  if (count > 0) return;

  const insert = db.prepare(`
    INSERT INTO products (category, image, name, desc, price, available)
    VALUES (@category, @image, @name, @desc, @price, @available)
  `);
  const seedItems = [
    {
      category: 'beef', image: null, name: 'The Baptiste Classic',
      desc: 'Angus beef patty, aged cheddar, lettuce, tomato & house sauce on a toasted bun, served with fries.',
      price: '$14.50', available: 1,
    },
    {
      category: 'chicken', image: null, name: 'Crispy Chicken Burger',
      desc: 'Buttermilk-fried chicken breast, pickles, lettuce and mayo on a toasted bun, served with fries.',
      price: '$13.50', available: 1,
    },
    {
      category: 'drink', image: null, name: 'Real Ice Cream Milkshake',
      desc: 'Thick vanilla bean milkshake blended with real ice cream — a lakeside summer favourite.',
      price: '$7.00', available: 1,
    },
  ];
  const insertMany = db.transaction((rows) => rows.forEach((r) => insert.run(r)));
  insertMany(seedItems);
})();

function rowToProduct(row) {
  if (!row) return null;
  return { ...row, available: !!row.available };
}

function getAllProducts() {
  return db.prepare('SELECT * FROM products ORDER BY id ASC').all().map(rowToProduct);
}

function getProductById(id) {
  return rowToProduct(db.prepare('SELECT * FROM products WHERE id = ?').get(id));
}

function createProduct(data) {
  const info = db.prepare(`
    INSERT INTO products (category, image, name, desc, price, available)
    VALUES (@category, @image, @name, @desc, @price, @available)
  `).run({
    category: data.category,
    image: data.image || null,
    name: data.name,
    desc: data.desc,
    price: data.price,
    available: data.available ? 1 : 0,
  });
  return getProductById(info.lastInsertRowid);
}

function updateProduct(id, data) {
  const existing = getProductById(id);
  if (!existing) return null;
  const merged = { ...existing, ...data };

  db.prepare(`
    UPDATE products
    SET category = @category, image = @image, name = @name, desc = @desc, price = @price, available = @available
    WHERE id = @id
  `).run({
    id,
    category: merged.category,
    image: merged.image,
    name: merged.name,
    desc: merged.desc,
    price: merged.price,
    available: merged.available ? 1 : 0,
  });

  return getProductById(id);
}

function deleteProduct(id) {
  const existing = getProductById(id);
  if (!existing) return null;
  db.prepare('DELETE FROM products WHERE id = ?').run(id);
  return existing;
}

module.exports = { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct };

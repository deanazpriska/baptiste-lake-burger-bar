const path = require('path');
const Database = require('better-sqlite3');

// SQLite database file — created automatically on first run.
const DB_FILE = path.join(__dirname, '..', 'data', 'database.sqlite');
const db = new Database(DB_FILE);
// Using the default rollback journal (not WAL) so every write lands
// directly in database.sqlite — simpler and safer for a workflow where
// this file gets committed to git as-is before each deploy.

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
      category: 'beef', image: 'cheeseburger.jpg', name: 'Cheeseburger',
      desc: 'Sesame seed bun topped with a grilled beef patty, cheese, pickles, diced onion, mustard and ketchup.',
      price: '$8.50', available: 1,
    },
    {
      category: 'beef', image: 'beef-burger.jpg', name: 'Beef Burger',
      desc: 'Sesame seed bun with a grilled beef patty, pickles, diced onion, mustard and ketchup.',
      price: '$8.00', available: 1,
    },
    {
      category: 'beef', image: 'cali-classic.jpg', name: 'Cali Classic',
      desc: 'Grilled beef patty with melted cheese, crisp lettuce, tomato and a creamy classic sauce on a toasted bun.',
      price: '$11.50', available: 1,
    },
    {
      category: 'beef', image: 'bbq-beef-rasher-burger.jpg', name: 'BBQ Beef Rasher Burger',
      desc: 'Grilled beef patty topped with thin beef rashers, melted cheese and smoky BBQ sauce.',
      price: '$12.00', available: 1,
    },
    {
      category: 'chicken', image: 'bbq-chicken.jpg', name: 'BBQ Chicken',
      desc: 'Boneless grilled chicken, lettuce, tomato and BBQ sauce on a sesame seed bun.',
      price: '$10.50', available: 1,
    },
    {
      category: 'chicken', image: 'teriyaki-chicken.jpg', name: 'Teriyaki Chicken',
      desc: 'Boneless grilled chicken with grilled pineapple, cheese, lettuce, onion, tomato, teriyaki sauce and mayo.',
      price: '$11.00', available: 1,
    },
    {
      category: 'chicken', image: 'crispy-chicken.jpg', name: 'Crispy Chicken',
      desc: 'Premium boneless chicken, buttermilk-dipped and breaded to a golden crisp, with lettuce and mayo.',
      price: '$11.50', available: 1,
    },
    {
      category: 'chicken', image: 'chicken-tender.jpg', name: 'Chicken Tender',
      desc: 'Premium boneless chicken, buttermilk-dipped and breaded to a golden crisp, tomato, lettuce and a choice of sauce.',
      price: '$11.50', available: 1,
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
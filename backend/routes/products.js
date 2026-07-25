const express = require('express');
const { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct } = require('../utils/db');
const { requireAuth } = require('../middleware/auth');
const { upload, deleteUploadedFile } = require('../middleware/upload');

const router = express.Router();
const CATEGORIES = ['beef', 'chicken', 'drink'];

// Multer + FormData sends everything as strings — normalize "available" to a real boolean.
function parseAvailable(value) {
  if (value === undefined) return undefined;
  if (typeof value === 'boolean') return value;
  return value === 'true' || value === '1';
}

function validateProductBody(body, { partial = false } = {}) {
  const errors = [];
  const { category, name, desc, price } = body;

  if (!partial || category !== undefined) {
    if (!CATEGORIES.includes(category)) errors.push(`category must be one of: ${CATEGORIES.join(', ')}`);
  }
  if (!partial || name !== undefined) {
    if (!name || !String(name).trim()) errors.push('name is required');
  }
  if (!partial || desc !== undefined) {
    if (!desc || !String(desc).trim()) errors.push('desc is required');
  }
  if (!partial || price !== undefined) {
    if (!price || !String(price).trim()) errors.push('price is required');
  }
  return errors;
}

// Wraps multer so a bad/oversized file returns a clean JSON 400 instead of crashing.
function handleUpload(req, res, next) {
  upload.single('image')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}

// GET /api/products — public menu listing, consumed by the storefront.
router.get('/', (req, res) => {
  res.json(getAllProducts());
});

// GET /api/products/:id — single product lookup.
router.get('/:id', (req, res) => {
  const product = getProductById(Number(req.params.id));
  if (!product) return res.status(404).json({ error: 'Product not found.' });
  res.json(product);
});

// POST /api/products — admin only: add a new menu item, with an optional photo upload.
router.post('/', requireAuth, handleUpload, (req, res) => {
  const errors = validateProductBody(req.body);
  if (errors.length) return res.status(400).json({ error: errors.join('; ') });

  const created = createProduct({
    category: req.body.category,
    name: String(req.body.name).trim(),
    desc: String(req.body.desc).trim(),
    price: String(req.body.price).trim(),
    available: parseAvailable(req.body.available) ?? true,
    image: req.file ? req.file.filename : null,
  });
  res.status(201).json(created);
});

// PUT /api/products/:id — admin only: edit an existing item.
// Uploading a new photo replaces the old one; leaving the photo field empty keeps it.
router.put('/:id', requireAuth, handleUpload, (req, res) => {
  const errors = validateProductBody(req.body, { partial: true });
  if (errors.length) return res.status(400).json({ error: errors.join('; ') });

  const existing = getProductById(Number(req.params.id));
  if (!existing) return res.status(404).json({ error: 'Product not found.' });

  const patch = {
    category: req.body.category,
    name: req.body.name !== undefined ? String(req.body.name).trim() : undefined,
    desc: req.body.desc !== undefined ? String(req.body.desc).trim() : undefined,
    price: req.body.price !== undefined ? String(req.body.price).trim() : undefined,
    available: parseAvailable(req.body.available),
  };
  if (req.file) {
    patch.image = req.file.filename;
    deleteUploadedFile(existing.image); // clean up the replaced photo
  }
  Object.keys(patch).forEach((k) => patch[k] === undefined && delete patch[k]);

  const updated = updateProduct(Number(req.params.id), patch);
  res.json(updated);
});

// DELETE /api/products/:id — admin only: remove an item from the menu (and its photo, if any).
router.delete('/:id', requireAuth, (req, res) => {
  const removed = deleteProduct(Number(req.params.id));
  if (!removed) return res.status(404).json({ error: 'Product not found.' });
  deleteUploadedFile(removed.image);
  res.json({ deleted: removed });
});

module.exports = router;

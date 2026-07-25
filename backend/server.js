require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');

const app = express();
const PORT = process.env.PORT || 4000;
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'baptiste-lake-burger-bar-api' }));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);

// Serve uploaded product photos.
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve the website itself, so one server shows both the site and the API.
// http://localhost:4000        -> frontend/index.html
// http://localhost:4000/admin  -> frontend/admin.html
app.use(express.static(FRONTEND_DIR));
app.get('/admin', (req, res) => res.sendFile(path.join(FRONTEND_DIR, 'admin.html')));

// Fallback for unknown routes
app.use((req, res) => res.status(404).json({ error: 'Route not found.' }));

app.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log(`Baptiste Lake Burger Bar server running at ${url}`);
  console.log(`  → Website: ${url}`);
  console.log(`  → Admin:   ${url}/admin`);

  // Only auto-open a browser for local development — hosting platforms like
  // Render/Railway run this headless, so skip it there.
  const isHosted = process.env.RENDER || process.env.RAILWAY_ENVIRONMENT || process.env.NODE_ENV === 'production';
  if (!isHosted) {
    import('open').then(({ default: open }) => open(url)).catch(() => {
      console.log('  (Could not auto-open the browser — open the URL above manually.)');
    });
  }
});
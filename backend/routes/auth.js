const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const router = express.Router();

// Hash the admin password once at startup so it's never compared as plain text.
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD_HASH = bcrypt.hashSync(process.env.ADMIN_PASSWORD, 10);

// POST /api/auth/login — verify admin credentials, return a signed session token.
router.post('/login', (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const validUsername = username === ADMIN_USERNAME;
  const validPassword = bcrypt.compareSync(password, ADMIN_PASSWORD_HASH);

  if (!validUsername || !validPassword) {
    return res.status(401).json({ error: 'Incorrect username or password.' });
  }

  const token = jwt.sign(
    { username, role: 'admin' },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  res.json({ token, expiresIn: '8h', username });
});

module.exports = router;

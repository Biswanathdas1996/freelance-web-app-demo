const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const SALT_ROUNDS = 10;

function signToken(user) {
  return jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

function publicUser(user) {
  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    profession: user.profession || '',
    role: user.role
  };
}

router.post('/register', async (req, res) => {
  try {
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: 'JWT_SECRET is not configured' });
    }
    let { email, password, name, role, profession } = req.body;
    email = typeof email === 'string' ? email.trim().toLowerCase() : '';
    name = typeof name === 'string' ? name.trim() : '';
    password = typeof password === 'string' ? password : '';
    role = role === 'owner' || role === 'bidder' ? role : '';
    profession =
      typeof profession === 'string' ? profession.trim().slice(0, 120) : '';

    if (!email || !password || !name || !role) {
      return res.status(400).json({
        error: 'email, password, name, and role (owner or bidder) are required'
      });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({ email, passwordHash, name, role, profession });
    const token = signToken(user);
    res.status(201).json({ token, user: publicUser(user) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: 'JWT_SECRET is not configured' });
    }
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid email or password' });

    const token = signToken(user);
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/me', requireAuth(), async (req, res) => {
  res.json(publicUser(req.user));
});

module.exports = router;

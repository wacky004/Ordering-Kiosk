'use strict';

const express = require('express');
const bcrypt = require('bcryptjs');
const { db } = require('./db');
const { ROLE_LABELS } = require('./seed-data');

const router = express.Router();

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    roleLabel: ROLE_LABELS[user.role] || user.role,
    points: user.points
  };
}

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

router.post('/register', (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password are required.' });
  }
  if (!validEmail(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }
  if (db.prepare('SELECT id FROM users WHERE email = ?').get(email)) {
    return res.status(409).json({ error: 'An account with that email already exists.' });
  }

  const info = db
    .prepare("INSERT INTO users (name, email, password_hash, role, points) VALUES (?, ?, ?, 'user', 0)")
    .run(name, email, bcrypt.hashSync(password, 10));
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(Number(info.lastInsertRowid));
  req.session.userId = user.id;
  res.status(201).json({ user: publicUser(user) });
});

router.post('/login', (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }
  req.session.userId = user.id;
  res.json({ user: publicUser(user) });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('mcdo.sid');
    res.json({ ok: true });
  });
});

router.get('/me', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not signed in.' });
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.userId);
  if (!user) return res.status(401).json({ error: 'Not signed in.' });
  res.json({ user: publicUser(user) });
});

module.exports = { router, publicUser };

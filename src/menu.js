'use strict';

const express = require('express');
const { db } = require('./db');
const { getOptionsForItems } = require('./options');
const { CATEGORY_ORDER, CATEGORY_ICONS } = require('./seed-data');

const router = express.Router();

router.get('/', (req, res) => {
  const items = db
    .prepare('SELECT * FROM menu_items ORDER BY sort_order, id')
    .all()
    .map((item) => ({ ...item, available: Boolean(item.available) }));

  const optionsMap = getOptionsForItems(items.map((item) => item.id));
  items.forEach((item) => {
    item.options = optionsMap[item.id] || [];
  });

  const present = new Set(items.map((item) => item.category));
  const categories = CATEGORY_ORDER.filter((name) => present.has(name))
    .concat([...present].filter((name) => !CATEGORY_ORDER.includes(name)))
    .map((name) => ({ name, icon: CATEGORY_ICONS[name] || '🍽️' }));

  res.json({ categories, items });
});

module.exports = router;

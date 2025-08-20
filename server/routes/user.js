const express = require('express');
const User = require('../models/user');
const router = express.Router();

router.get('/suggested', async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 }).limit(10).lean();
  res.json({ users: users.map(u => ({ id: u._id, username: u.username, displayName: u.displayName })) });
});

router.get('/by-name', async (req, res) => {
  const name = (req.query.name || '').trim();
  const u = await User.findOne({ username: name }) || await User.findOne({ displayName: name });
  if (!u) return res.status(404).json({ error: 'Not found' });
  res.json({ user: { id: u._id, username: u.username, displayName: u.displayName } });
});

module.exports = router;

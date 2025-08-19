const express = require('express');
const { auth } = require('../src/middleware/auth');
const Message = require('../models/message');
const User = require('../models/User');

const router = express.Router();

function roomFor(a, b) {
  return [String(a), String(b)].sort().join('|');
}

router.get('/:partner', auth, async (req, res) => {
  const partnerName = req.params.partner;
  const partner = await User.findOne({ username: partnerName }) || await User.findOne({ displayName: partnerName });
  if (!partner) return res.status(404).json({ error: 'Partner not found' });
  const room = roomFor(req.user.sub, partner._id);
  const msgs = await Message.find({ room }).sort({ createdAt: 1 }).limit(200).lean();
  res.json({ partner: { id: partner._id, username: partner.username, displayName: partner.displayName }, messages: msgs });
});

module.exports = router;

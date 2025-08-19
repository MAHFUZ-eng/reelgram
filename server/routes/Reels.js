const express = require('express');
const multer = require('multer');
const path = require('path');
const { auth } = require('../src/middleware/Auth');
const Reel = require('../models/reel');
const Like = require('../models/Like');
const Comment = require('../models/comment');

const router = express.Router();

// Uploads (local disk for demo)
const uploadDir = path.resolve(process.env.UPLOAD_DIR || 'uploads');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(uploadDir, 'reels')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '.mp4');
    cb(null, `${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`);
  }
});
const upload = multer({ storage });

// Create a reel
router.post('/', auth, upload.single('video'), async (req, res) => {
  const url = `/uploads/reels/${req.file.filename}`;
  const doc = await Reel.create({
    userId: req.user.sub,
    caption: req.body.caption || '',
    videoUrl: url
  });
  res.json({ ok: true, reel: doc });
});

// List reels (newest first, simple paging)
router.get('/', async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Math.min(20, Number(req.query.limit || 10));
  const reels = await Reel.find().sort({ createdAt: -1 }).skip((page-1)*limit).limit(limit).lean();
  res.json({ reels });
});

// Like/unlike
router.post('/:id/like', auth, async (req, res) => {
  const rId = req.params.id;
  try {
    const like = await Like.create({ userId: req.user.sub, reelId: rId });
    await Reel.findByIdAndUpdate(rId, { $inc: { likesCount: 1 } });
    return res.json({ liked: true });
  } catch (e) {
    // already liked -> toggle off
    await Like.deleteOne({ userId: req.user.sub, reelId: rId });
    await Reel.findByIdAndUpdate(rId, { $inc: { likesCount: -1 } });
    return res.json({ liked: false });
  }
});

// Comments
router.get('/:id/comments', async (req, res) => {
  const list = await Comment.find({ reelId: req.params.id }).sort({ createdAt: 1 }).lean();
  res.json({ comments: list });
});
router.post('/:id/comments', auth, async (req, res) => {
  const c = await Comment.create({
    reelId: req.params.id,
    userId: req.user.sub,
    text: (req.body.text || '').slice(0, 500)
  });
  await Reel.findByIdAndUpdate(req.params.id, { $inc: { commentsCount: 1 } });
  res.json({ ok: true, comment: c });
});

module.exports = router;

const { Schema, model, Types } = require('mongoose');

const reelSchema = new Schema({
  userId: { type: Types.ObjectId, ref: 'User', required: true },
  caption: { type: String, default: '' },
  videoUrl: { type: String, required: true },
  likesCount: { type: Number, default: 0 },
  commentsCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = model('Reel', reelSchema);

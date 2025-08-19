const { Schema, model, Types } = require('mongoose');

const likeSchema = new Schema({
  userId: { type: Types.ObjectId, ref: 'User', required: true },
  reelId: { type: Types.ObjectId, ref: 'Reel', required: true },
  createdAt: { type: Date, default: Date.now }
});

// Create compound index to prevent duplicate likes
likeSchema.index({ userId: 1, reelId: 1 }, { unique: true });

module.exports = model('Like', likeSchema);

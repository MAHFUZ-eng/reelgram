const { Schema, model, Types } = require('mongoose');

const commentSchema = new Schema({
  reelId: { type: Types.ObjectId, ref: 'Reel', required: true },
  userId: { type: Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = model('Comment', commentSchema);

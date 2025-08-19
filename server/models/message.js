const { Schema, model, Types } = require('mongoose');

const messageSchema = new Schema({
  room: { type: String, index: true }, // "userA|userB" (sorted)
  fromUser: { type: Types.ObjectId, ref: 'User', required: true },
  toUser: { type: Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = model('Message', messageSchema);

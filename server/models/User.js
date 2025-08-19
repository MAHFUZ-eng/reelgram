const { Schema, model } = require('mongoose');

const userSchema = new Schema({
  username: { type: String, unique: true, required: true, index: true },
  displayName: { type: String, required: true },
  email: { type: String, unique: true, required: true, index: true },
  password: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String },
  verificationTokenExpires: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

module.exports = model('User', userSchema);

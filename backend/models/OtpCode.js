const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  identifier: { type: String, required: true }, // email atau telegram username
  code:       { type: String, required: true },
  type:       { type: String, enum: ['login', 'register', 'telegram'], default: 'telegram' },
  chatId:     { type: String }, // telegram chat_id jika sudah diketahui
  expiresAt:  { type: Date, required: true, index: { expires: 0 } }, // TTL auto-delete
}, { timestamps: true });

module.exports = mongoose.model('OtpCode', otpSchema);

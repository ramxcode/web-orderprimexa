const mongoose = require('mongoose');

const emailTokenSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  token:     { type: String, required: true, unique: true },
  type:      { type: String, enum: ['verify', 'reset'], default: 'verify' },
  expiresAt: { type: Date, required: true, index: { expires: 0 } }, // TTL auto-delete
}, { timestamps: true });

module.exports = mongoose.model('EmailToken', emailTokenSchema);

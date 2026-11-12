const mongoose = require('mongoose');

const tgDepositSchema = new mongoose.Schema({
  deposit_id: { type: String, unique: true, required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'TgUser', required: true },
  telegram_id: { type: String, required: true },
  amount: { type: Number, required: true },
  payment_method: { type: String, default: 'qris' },
  payment_reference: { type: String },
  qris_url: { type: String },
  status: { type: String, enum: ['pending', 'paid', 'expired', 'cancelled', 'failed'], default: 'pending' },
  expired_at: { type: Date },
  paid_at: { type: Date },
  idempotency_key: { type: String, unique: true, sparse: true }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('TgDeposit', tgDepositSchema);

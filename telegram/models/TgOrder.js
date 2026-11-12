const mongoose = require('mongoose');

const tgOrderSchema = new mongoose.Schema({
  order_id: { type: String, unique: true, required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'TgUser', required: true },
  telegram_id: { type: String, required: true },
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  product_name: { type: String },
  variant_id: { type: mongoose.Schema.Types.ObjectId },
  variant_name: { type: String },
  quantity: { type: Number, default: 1 },
  unit_price: { type: Number, default: 0 },
  total_price: { type: Number, default: 0 },
  payment_method: { type: String, enum: ['balance', 'qris'], default: 'balance' },
  status: { type: String, enum: ['pending', 'processing', 'success', 'failed', 'cancelled', 'refunded'], default: 'pending' },
  delivery_data: { type: String },
  note: { type: String }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('TgOrder', tgOrderSchema);

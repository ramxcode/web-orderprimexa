const mongoose = require('mongoose');
const StockItemSchema = new mongoose.Schema({
  productId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  variantId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  content:    { type: String, required: true }, // isi stok: akun/kode/lisensi
  status:     { type: String, enum: ['available','reserved','used','expired'], default: 'available' },
  notes:      { type: String, default: '' },
  invoiceId:  { type: String, default: '' },
  usedAt:     { type: Date },
  expiredAt:  { type: Date },
}, { timestamps: true });
module.exports = mongoose.model('StockItem', StockItemSchema);

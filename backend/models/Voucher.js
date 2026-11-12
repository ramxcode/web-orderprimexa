/* ============================================================
   Voucher.js — Mongoose Model
   ============================================================ */
const mongoose = require('mongoose');

const usageHistorySchema = new mongoose.Schema({
  userId:         { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  orderId:        { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  discountAmount: { type: Number, default: 0 },
  usedAt:         { type: Date, default: Date.now },
}, { _id: false });

const voucherSchema = new mongoose.Schema({
  code:         { type: String, required: true, unique: true, uppercase: true, trim: true },
  name:         { type: String, required: true, trim: true },
  description:  { type: String, default: '' },
  type:         { type: String, enum: ['percent', 'nominal'], required: true },
  value:        { type: Number, required: true, min: 0 },       // % atau Rp
  minPurchase:  { type: Number, default: 0 },                   // min subtotal
  maxDiscount:  { type: Number, default: null },                 // cap untuk type=percent
  startDate:    { type: Date, default: null },
  endDate:      { type: Date, default: null },
  quota:        { type: Number, default: -1 },                  // -1 = unlimited
  quotaUsed:    { type: Number, default: 0 },
  quotaPerUser: { type: Number, default: 1 },                   // max pemakaian per user
  scope:        { type: String, enum: ['all', 'products', 'variants'], default: 'all' },
  scopeIds:     [{ type: mongoose.Schema.Types.ObjectId }],
  isFeatured:   { type: Boolean, default: false },
  isActive:     { type: Boolean, default: true },
  usageHistory: [usageHistorySchema],
}, { timestamps: true });

// Virtual: pemakaian per user
voucherSchema.methods.usageByUser = function(userId) {
  return this.usageHistory.filter(h => String(h.userId) === String(userId)).length;
};

// Validasi apakah voucher bisa dipakai (bukan nama 'validate' agar tidak clash dengan Mongoose internal)
voucherSchema.methods.checkValidity = function(userId, subtotal) {
  if (!this.isActive) return { valid: false, reason: 'Voucher tidak aktif' };

  const now = new Date();
  if (this.startDate && now < this.startDate) return { valid: false, reason: 'Voucher belum aktif' };
  if (this.endDate   && now > this.endDate)   return { valid: false, reason: 'Voucher sudah kedaluwarsa' };

  if (this.quota !== -1 && this.quotaUsed >= this.quota)
    return { valid: false, reason: 'Kuota voucher habis' };

  if (userId && this.usageByUser(userId) >= this.quotaPerUser)
    return { valid: false, reason: `Anda sudah menggunakan voucher ini ${this.quotaPerUser}x` };

  if (subtotal < this.minPurchase)
    return { valid: false, reason: `Minimum pembelian Rp ${this.minPurchase.toLocaleString('id-ID')}` };

  return { valid: true };
};

// Hitung diskon
voucherSchema.methods.calcDiscount = function(subtotal) {
  let discount = 0;
  if (this.type === 'percent') {
    discount = Math.floor(subtotal * (this.value / 100));
    if (this.maxDiscount) discount = Math.min(discount, this.maxDiscount);
  } else {
    discount = Math.min(this.value, subtotal);
  }
  return discount;
};

module.exports = mongoose.model('Voucher', voucherSchema);

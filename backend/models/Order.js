const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId:       { type: String, unique: true },
  userId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  customerName:  { type: String },
  customerEmail: { type: String },
  customerPhone: { type: String },
  items: [{
    productId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    productName: String,
    variant:     String,
    quantity:    { type: Number, default: 1 },
    price:       Number,
    subtotal:    Number,
  }],
  total:         { type: Number, required: true },
  subtotal:      { type: Number, default: 0 },
  discount:      { type: Number, default: 0 },
  voucherCode:   { type: String, default: '' },
  uniqueCode:    { type: Number, default: 0 },
  productId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  productName:   { type: String, default: '' },
  variantName:   { type: String, default: '' },
  productImage:  { type: String, default: '' },
  qty:           { type: Number, default: 1 },
  price:         { type: Number, default: 0 },
  status:        { type: String, enum: ['pending','paid','processing','completed','cancelled','refunded'], default: 'pending' },
  paymentMethod: { type: String },
  paymentRef:    { type: String },
  notes:         { type: String },
  paidAt:        { type: Date },
  completedAt:   { type: Date },
  // ── Pending Payment Email ────────────────────────────────────
  pendingEmailSentAt:  { type: Date, default: null },
  failedEmailSentAt:   { type: Date, default: null },

  transactionPin:      { type: String, default: null },   // bcrypt hash
  pinCreatedAt:        { type: Date,   default: null },
  pinLastSentAt:       { type: Date,   default: null },
  pinFailedAttempts:   { type: Number, default: 0 },
  pinLockedUntil:      { type: Date,   default: null },   // brute-force lockout
  pinResendLockedUntil:{ type: Date,   default: null },   // resend rate limit
  // ── Review ───────────────────────────────────────────────────
  hasReview:           { type: Boolean, default: false },

}, { timestamps: true });

// Generate orderId otomatis
orderSchema.pre('save', async function(next) {
  if (!this.orderId) {
    const date = new Date();
    const ymd = date.getFullYear().toString().slice(-2) +
      String(date.getMonth()+1).padStart(2,'0') +
      String(date.getDate()).padStart(2,'0');
    const rand = Math.floor(1000 + Math.random() * 9000);
    this.orderId = `RX${ymd}${rand}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);

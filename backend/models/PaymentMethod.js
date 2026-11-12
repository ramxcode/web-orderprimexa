const mongoose = require('mongoose');

const PaymentMethodSchema = new mongoose.Schema({
  code:        { type: String, required: true, unique: true, uppercase: true },
  name:        { type: String, required: true },
  group:       { type: String, default: 'Other' },
  provider:    { type: String, default: 'Sistem' },
  icon:        { type: String, default: 'fa-credit-card' },
  fee:         { type: String, default: 'Gratis' },
  min:         { type: Number, default: 0 },
  max:         { type: Number, default: 0 },
  desc:        { type: String, default: '' },
  active:      { type: Boolean, default: true },
  needsSetup:  { type: Boolean, default: false },
  sortOrder:   { type: Number, default: 99 },
}, { timestamps: true });

// Seed 2 default methods if collection is empty
PaymentMethodSchema.statics.seedDefaults = async function () {
  const count = await this.countDocuments();
  if (count === 0) {
    await this.insertMany([
      {
        code: 'GOPAYM_QRIS', name: 'QRIS GatePay',
        group: 'QRIS', provider: 'GatePay',
        icon: 'fa-qrcode', fee: 'Gratis ≤ Rp 500.000, 0,7% di atasnya',
        min: 100, max: 10_000_000, active: true, needsSetup: true, sortOrder: 1,
      },
      {
        code: 'BALANCE', name: 'Saldo Akun',
        group: 'Saldo', provider: 'Sistem',
        icon: 'fa-coins', fee: 'Gratis',
        min: 0, max: 0, active: true, needsSetup: false, sortOrder: 2,
      },
    ]);
  }
};

module.exports = mongoose.model('PaymentMethod', PaymentMethodSchema);

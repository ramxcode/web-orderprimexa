const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  slug:        { type: String, unique: true, lowercase: true },
  category:    { type: String, trim: true },
  description: { type: String },
  imageUrl:    { type: String },
  price:       { type: Number, default: 0 },
  stock:       { type: Number, default: -1 }, // -1 = unlimited
  isActive:    { type: Boolean, default: true },
  isFeatured:  { type: Boolean, default: false },
  variants:    [{
    name:          String,
    price:         { type: Number, default: 0 },  // selling price
    costPrice:     { type: Number, default: 0 },
    processType:   { type: String, default: 'auto' },
    productTypeId: { type: String, default: '' },
    isActive:      { type: Boolean, default: true },
    showInBot:     { type: Boolean, default: true },
    stock:         { type: Number, default: -1 },
    source:        { type: String, default: 'lokal' },
    description:         { type: String, default: '' },
    termsAndConditions:  { type: String, default: '' },
    requiredFieldLabel:  { type: String, default: '' },
  }],
  sortOrder: { type: Number, default: 0 },
}, { timestamps: true });

productSchema.pre('save', function(next) {
  if (!this.slug) {
    this.slug = this.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);

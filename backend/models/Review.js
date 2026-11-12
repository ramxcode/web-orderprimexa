const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  orderId:       { type: String, required: true, unique: true }, // 1 order = 1 review
  productId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  productName:   { type: String, default: '' },
  variantName:   { type: String, default: '' },
  rating:        { type: Number, required: true, min: 1, max: 5 },
  reviewText:    { type: String, default: '', maxlength: 500 },
  customerEmail: { type: String, default: '' },
  customerId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

module.exports = mongoose.model('Review', reviewSchema);

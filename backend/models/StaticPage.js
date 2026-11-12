const mongoose = require('mongoose');

const staticPageSchema = new mongoose.Schema({
  slug:    { type: String, unique: true, required: true }, // 'faq' | 'terms' | 'privacy'
  title:   { type: String, required: true },
  content: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('StaticPage', staticPageSchema);

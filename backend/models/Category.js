const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true },
  slug:      { type: String, unique: true, lowercase: true },
  icon:      { type: String, default: 'fa-box' },
  color:     { type: String, default: '#6366f1' },
  isActive:  { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
}, { timestamps: true });

categorySchema.pre('save', function(next) {
  if (!this.slug) {
    this.slug = this.name.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'');
  }
  next();
});

module.exports = mongoose.model('Category', categorySchema);

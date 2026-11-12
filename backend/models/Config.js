const mongoose = require('mongoose');

// Key-value store untuk semua konfigurasi toko
const configSchema = new mongoose.Schema({
  key:   { type: String, unique: true, required: true },
  value: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

module.exports = mongoose.model('Config', configSchema);

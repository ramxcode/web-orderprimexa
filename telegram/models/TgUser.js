const mongoose = require('mongoose');

const tgUserSchema = new mongoose.Schema({
  telegram_id: { type: String, unique: true, required: true },
  username: { type: String },
  first_name: { type: String },
  last_name: { type: String },
  balance: { type: Number, default: 0, min: 0 },
  total_orders: { type: Number, default: 0 },
  total_spending: { type: Number, default: 0 },
  language: { type: String, default: 'id', enum: ['id', 'en'] },
  status: { type: String, default: 'active', enum: ['active', 'banned'] }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

tgUserSchema.statics.findOrCreate = async function(telegramUser) {
  const query = { telegram_id: String(telegramUser.id) };
  const update = {
    $set: {
      username: telegramUser.username || '',
      first_name: telegramUser.first_name || '',
      last_name: telegramUser.last_name || ''
    }
  };
  const options = { upsert: true, new: true, setDefaultsOnInsert: true };
  return await this.findOneAndUpdate(query, update, options);
};

module.exports = mongoose.model('TgUser', tgUserSchema);

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:             { type: String, required: true, trim: true },
  email:            { type: String, unique: true, sparse: true, lowercase: true, trim: true },
  phone:            { type: String, trim: true },
  passwordHash:     { type: String },
  role:             { type: String, enum: ['admin', 'customer'], default: 'customer' },
  telegramUsername: { type: String, lowercase: true, trim: true },
  telegramChatId:   { type: String },
  isVerified:       { type: Boolean, default: false },
  isActive:         { type: Boolean, default: true },
  balance:          { type: Number, default: 0 },
  balanceNote:      { type: String, trim: true },
  verifiedAt:       { type: Date },
  lastLogin:        { type: Date },
  avatar:           { type: String, default: '' },  // base64 data URL foto profil
}, { timestamps: true });

// Hash password sebelum save
userSchema.pre('save', async function(next) {
  if (!this.isModified('passwordHash')) return next();
  if (this.passwordHash) {
    this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  }
  next();
});

userSchema.methods.comparePassword = function(plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

module.exports = mongoose.model('User', userSchema);

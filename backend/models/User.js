const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  googleId: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
});

// Avoid OverwriteModelError
module.exports = mongoose.models.User || mongoose.model('User', userSchema);

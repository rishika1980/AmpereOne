const mongoose = require('mongoose');

const BuilderSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Builder', BuilderSchema);

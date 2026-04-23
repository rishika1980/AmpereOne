const mongoose = require('mongoose');

const BlockSchema = new mongoose.Schema({
  societyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Society', required: true },
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

BlockSchema.index({ societyId: 1 });

module.exports = mongoose.model('Block', BlockSchema);

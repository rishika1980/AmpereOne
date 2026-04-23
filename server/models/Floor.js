const mongoose = require('mongoose');

const FloorSchema = new mongoose.Schema({
  blockId: { type: mongoose.Schema.Types.ObjectId, ref: 'Block', required: true },
  societyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Society', required: true },
  floorNumber: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

FloorSchema.index({ blockId: 1 });

module.exports = mongoose.model('Floor', FloorSchema);

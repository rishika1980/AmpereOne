const mongoose = require('mongoose');

const FlatSchema = new mongoose.Schema({
  floorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Floor', required: true },
  blockId: { type: mongoose.Schema.Types.ObjectId, ref: 'Block', required: true },
  societyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Society', required: true },
  flatNumber: { type: String, required: true },
  bhkType: { type: String, default: '2BHK' },
  status: { type: String, enum: ['occupied', 'vacant'], default: 'occupied' },
  occupantName: { type: String, default: '' },
  baseMultiplier: { type: Number, default: 1.0 },
  createdAt: { type: Date, default: Date.now }
});

FlatSchema.index({ societyId: 1, blockId: 1 });

module.exports = mongoose.model('Flat', FlatSchema);

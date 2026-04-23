const mongoose = require('mongoose');

const SocietySchema = new mongoose.Schema({
  builderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Builder', required: true },
  name: { type: String, required: true, trim: true },
  address: { type: String, default: '' },
  city: { type: String, default: '' },
  pincode: { type: String, default: '' },
  societyCode: { type: String, unique: true, sparse: true },
  inviteOnlyMode: { type: Boolean, default: false },
  alertThresholds: {
    monthlyLimitUnits: { type: Number, default: 900 },
    escalationHours: { type: Number, default: 24, enum: [6, 12, 24, 48] }
  },
  totalBlocks: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Society', SocietySchema);

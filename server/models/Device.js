const mongoose = require('mongoose');

const DeviceSchema = new mongoose.Schema({
  deviceSerial: { type: String, required: true, unique: true, trim: true },
  deviceType: {
    type: String,
    enum: ['Flat Meter', 'Common Area Meter'],
    required: true
  },
  mappedFlatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Flat', default: null },
  mappedCommonAreaId: { type: mongoose.Schema.Types.ObjectId, ref: 'CommonArea', default: null },
  societyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Society', required: true },
  status: {
    type: String,
    enum: ['Registered', 'Live', 'Offline', 'Deregistered'],
    default: 'Registered'
  },
  isDeregistered: { type: Boolean, default: false },
  registeredAt: { type: Date, default: Date.now },
  lastSeenAt: { type: Date, default: null }
});

DeviceSchema.index({ societyId: 1, status: 1 });
DeviceSchema.index({ mappedFlatId: 1 });

module.exports = mongoose.model('Device', DeviceSchema);

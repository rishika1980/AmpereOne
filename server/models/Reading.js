const mongoose = require('mongoose');

const ReadingSchema = new mongoose.Schema({
  deviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Device', required: true },
  flatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Flat', default: null },
  commonAreaId: { type: mongoose.Schema.Types.ObjectId, ref: 'CommonArea', default: null },
  societyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Society', required: true },
  timestamp: { type: Date, default: Date.now },
  kw: { type: Number, required: true },
  kwhToday: { type: Number, required: true },
  hourOfDay: { type: Number },
  dayOfWeek: { type: Number },
  createdAt: { type: Date, default: Date.now }
});

ReadingSchema.pre('save', function(next) {
  const d = new Date(this.timestamp);
  this.hourOfDay = d.getHours();
  this.dayOfWeek = d.getDay();
  next();
});

ReadingSchema.index({ deviceId: 1, timestamp: -1 });
ReadingSchema.index({ flatId: 1, timestamp: -1 });
ReadingSchema.index({ societyId: 1, timestamp: -1 });
ReadingSchema.index({ societyId: 1, hourOfDay: 1, dayOfWeek: 1 });

module.exports = mongoose.model('Reading', ReadingSchema);

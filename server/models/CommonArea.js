const mongoose = require('mongoose');

const CommonAreaSchema = new mongoose.Schema({
  societyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Society', required: true },
  name: { type: String, required: true },
  category: {
    type: String,
    enum: ['Vertical Transport', 'Water Systems', 'Lighting', 'Recreational'],
    required: true
  },
  floorOrLocation: { type: String, default: 'Common' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CommonArea', CommonAreaSchema);

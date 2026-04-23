const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
  societyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Society', required: true },
  title: { type: String, required: true },
  desc: { type: String, required: true },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high'], 
    default: 'medium' 
  },
  category: { 
    type: String, 
    enum: ['Escalations', 'Device health', 'Approvals'], 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['Unacknowledged', 'Resolved', 'Pending'], 
    default: 'Unacknowledged' 
  },
  type: { 
    type: String, 
    enum: ['threshold', 'device_offline', 'registration', 'anomaly'], 
    required: true 
  },
  metadata: {
    flatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Flat' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // For registration approvals
    deviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Device' }
  },
  needsAttention: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Alert', AlertSchema);

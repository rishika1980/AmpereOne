const mongoose = require('mongoose');
const Society = require('../models/Society');
const Flat = require('../models/Flat');
const Alert = require('../models/Alert');
const User = require('../models/User');
require('dotenv').config();

async function seedAlerts() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to DB');

  const society = await Society.findOne({ name: 'Green Valley Apartments' });
  if (!society) {
    console.error('❌ Society not found. Run seed.js first.');
    process.exit(1);
  }

  // Clear existing non-resolved alerts for this society to avoid clutter
  await Alert.deleteMany({ societyId: society._id });
  console.log('🗑  Cleared old alerts');

  // Create a pending resident for approval testing
  let pendingUser = await User.findOne({ email: 'amit@example.com' });
  if (pendingUser) await User.deleteOne({ _id: pendingUser._id });
  
  pendingUser = await User.create({
    name: 'Amit Singh',
    email: 'amit@example.com',
    password: 'password123',
    role: 'flat_owner',
    societyId: society._id,
    isActive: false
  });
  console.log('👤 Created pending user for logic verification');

  const flats = await Flat.find({ societyId: society._id });
  
  // Find specific flats for metadata (or just use first few)
  const flat402 = flats.find(f => f.flatNumber.includes('402')) || flats[0];
  const flat112 = flats.find(f => f.flatNumber.includes('112')) || flats[1];
  const flat305 = flats.find(f => f.flatNumber.includes('305')) || flats[2];

  const alerts = [
    {
      societyId: society._id,
      title: 'Flat 402 crossed monthly limit',
      desc: 'Consumer has exceeded the 300kWh threshold set for this month.',
      priority: 'high',
      category: 'Escalations',
      type: 'threshold',
      needsAttention: true,
      metadata: { flatId: flat402._id },
      createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000) // 26 hours ago
    },
    {
      societyId: society._id,
      title: 'Flat 112 — unusual overnight spike',
      desc: 'Drawing 4.2 kWh at 11 PM — 2.8x usual. Resident notified via app.',
      priority: 'high',
      category: 'Escalations',
      type: 'anomaly',
      needsAttention: true,
      metadata: { flatId: flat112._id },
      createdAt: new Date(Date.now() - 14 * 60 * 60 * 1000) // 14 hours ago
    },
    {
      societyId: society._id,
      title: 'Meter offline — Flat 305',
      desc: 'Gateway has lost communication with this node. Last seen 2 hrs ago.',
      priority: 'medium',
      category: 'Device health',
      type: 'device_offline',
      metadata: { flatId: flat305._id },
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
    },
    {
      societyId: society._id,
      title: 'Meter intermittent — Pump 2',
      desc: 'Signal strength (RSSI) dropped below -95dBm. Connection unstable.',
      priority: 'low',
      category: 'Device health',
      type: 'anomaly',
      createdAt: new Date(Date.now() - 8 * 60 * 1000) // 8 min ago
    },
    {
      societyId: society._id,
      title: 'New registration — Amit Singh',
      desc: 'Requested Flat 301, Block A. Role: Owner. Verification required.',
      priority: 'medium',
      category: 'Approvals',
      type: 'registration',
      status: 'Pending',
      metadata: { userId: pendingUser._id },
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000) // 3 hours ago
    }
  ];

  await Alert.insertMany(alerts);
  console.log(`✅ Seeded ${alerts.length} alerts with valid user linkages.`);
  process.exit(0);
}

seedAlerts();

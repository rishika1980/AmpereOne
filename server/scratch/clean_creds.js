const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');

async function clean() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected...');

  // Delete all other management accounts
  const deleted = await User.deleteMany({ 
    role: { $in: ['society_admin', 'builder_admin'] }, 
    email: { $nin: ['admin@ampereone.io', 'builder@ampereone.io'] } 
  });
  console.log(`Deleted ${deleted.deletedCount} old management accounts.`);

  // Reset Admin
  const admin = await User.findOne({ email: 'admin@ampereone.io' });
  if (admin) {
    admin.password = 'password123';
    await admin.save();
    console.log('Admin password reset to: password123');
  }

  // Reset Builder
  const builder = await User.findOne({ email: 'builder@ampereone.io' });
  if (builder) {
    builder.password = 'password123';
    await builder.save();
    console.log('Builder password reset to: password123');
  }

  console.log('Done!');
  process.exit();
}

clean().catch(err => { console.error(err); process.exit(1); });

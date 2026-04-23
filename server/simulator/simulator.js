const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const fetch = require('node-fetch');
let chalk;
try { chalk = require('chalk'); } catch { chalk = { green: s=>s, red: s=>s, yellow: s=>s, gray: s=>s, cyan: s=>s, blue: s=>s }; }

const BASE_URL = 'http://localhost:5000/api/v1';
const POLL_INTERVAL = 30000; // 30 seconds

const getKw = (hour, multiplier, isCommon, category) => {
  if (isCommon) {
    const base = {
      'Vertical Transport': hour >= 7 && hour <= 22 ? 2.5 + Math.random() * 2.0 : 0.5,
      'Water Systems': (hour >= 5 && hour <= 9) || (hour >= 18 && hour <= 22) ? 4.0 + Math.random() * 3.0 : 1.0,
      'Lighting': hour >= 18 || hour <= 6 ? 3.0 + Math.random() * 2.0 : 0.3,
      'Recreational': hour >= 6 && hour <= 22 ? 1.5 + Math.random() * 1.0 : 0.1
    };
    return parseFloat((base[category] || 1.0).toFixed(2));
  }
  let base;
  if (hour < 5) base = 0.2 + Math.random() * 0.3;
  else if (hour < 7) base = 0.5 + Math.random() * 0.4;
  else if (hour < 10) base = 2.0 + Math.random() * 2.0;
  else if (hour < 17) base = 0.8 + Math.random() * 0.8;
  else if (hour < 22) base = 2.5 + Math.random() * 2.0;
  else base = 0.5 + Math.random() * 0.4;
  return parseFloat((base * (multiplier || 1)).toFixed(2));
};

async function run() {
  console.log(chalk.cyan('\n⚡ GridWise Simulator Starting...'));
  await mongoose.connect(process.env.MONGODB_URI);
  console.log(chalk.green('✅ Connected to MongoDB\n'));

  const Device = require('../models/Device');
  const Flat = require('../models/Flat');
  const CommonArea = require('../models/CommonArea');
  const Reading = require('../models/Reading');

  const poll = async () => {
    const hour = new Date().getHours();
    const devices = await Device.find({ isDeregistered: false, status: { $ne: 'Deregistered' } });
    let inserted = 0;

    for (const device of devices) {
      let kw = 0, flat = null, commonArea = null;
      if (device.mappedFlatId) {
        flat = await Flat.findById(device.mappedFlatId);
        kw = getKw(hour, flat?.baseMultiplier || 1.0, false);
      } else if (device.mappedCommonAreaId) {
        commonArea = await CommonArea.findById(device.mappedCommonAreaId);
        kw = getKw(hour, 1.0, true, commonArea?.category);
      }

      // Calculate kwhToday
      const startOfToday = new Date(); startOfToday.setHours(0,0,0,0);
      const todayResult = await Reading.aggregate([
        { $match: { deviceId: device._id, timestamp: { $gte: startOfToday } } },
        { $group: { _id: null, total: { $sum: '$kw' } } }
      ]);
      const kwhToday = parseFloat(((todayResult[0]?.total || 0) + kw).toFixed(2));

      await Reading.create({
        deviceId: device._id,
        flatId: device.mappedFlatId || null,
        commonAreaId: device.mappedCommonAreaId || null,
        societyId: device.societyId,
        timestamp: new Date(),
        kw,
        kwhToday,
        hourOfDay: hour,
        dayOfWeek: new Date().getDay()
      });

      await Device.findByIdAndUpdate(device._id, { status: 'Live', lastSeenAt: new Date() });
      inserted++;
    }

    const time = new Date().toLocaleTimeString('en-IN');
    console.log(chalk.gray(`[${time}] Polled ${inserted} devices`));
  };

  await poll();
  setInterval(poll, POLL_INTERVAL);
  console.log(chalk.cyan(`📡 Polling every ${POLL_INTERVAL/1000}s\n`));
}

run().catch(err => { console.error(err); process.exit(1); });

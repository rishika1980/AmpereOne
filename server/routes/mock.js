const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Reading = require('../models/Reading');
const Device = require('../models/Device');
const Flat = require('../models/Flat');
const CommonArea = require('../models/CommonArea');
const { getKwForFlat, getKwForCommonArea } = require('../utils/mockGenerator');

// GET /api/v1/readings/live?device_id=xxx
router.get('/live', async (req, res) => {
  try {
    const { device_id } = req.query;
    if (!device_id) return res.status(400).json({ success: false, message: 'device_id required' });

    const device = await Device.findOne({ deviceSerial: device_id, isDeregistered: false });
    if (!device) return res.status(404).json({ success: false, message: 'Device not found' });

    const latest = await Reading.findOne({ deviceId: device._id }).sort({ timestamp: -1 });
    if (!latest) return res.json({ success: true, data: { status: 'offline', kw: 0, kwhToday: 0 } });

    res.json({
      success: true,
      data: {
        device_id: device.deviceSerial,
        flat_id: latest.flatId,
        timestamp: latest.timestamp,
        kw: latest.kw,
        kwh_today: latest.kwhToday,
        status: 'live'
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/readings/history?flat_id=&from=&to=&granularity=hour|day
router.get('/history', async (req, res) => {
  try {
    const { flat_id, from, to, granularity = 'day' } = req.query;
    if (!flat_id) return res.status(400).json({ success: false, message: 'flat_id required' });

    const startDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = to ? new Date(to) : new Date();

    const format = granularity === 'hour' ? '%Y-%m-%dT%H:00:00' : '%Y-%m-%d';

    const data = await Reading.aggregate([
      { $match: { flatId: new mongoose.Types.ObjectId(flat_id), timestamp: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: { $dateToString: { format, date: '$timestamp' } }, totalKwh: { $sum: '$kw' }, avgKw: { $avg: '$kw' } } },
      { $sort: { _id: 1 } }
    ]);

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/v1/mock/seed — Seed historical data
router.post('/seed', async (req, res) => {
  try {
    const devices = await Device.find({ isDeregistered: false });
    if (devices.length === 0) return res.status(400).json({ success: false, message: 'No devices found. Register devices first.' });

    const DAYS = 30;
    let count = 0;
    const allReadings = [];

    for (const device of devices) {
      let flat = null, commonArea = null;
      if (device.mappedFlatId) flat = await Flat.findById(device.mappedFlatId);
      if (device.mappedCommonAreaId) commonArea = await CommonArea.findById(device.mappedCommonAreaId);

      for (let day = DAYS; day >= 1; day--) {
        let kwhAccumulated = 0;
        for (let hour = 0; hour < 24; hour++) {
          const ts = new Date();
          ts.setDate(ts.getDate() - day);
          ts.setHours(hour, Math.floor(Math.random() * 60), 0, 0);

          const kw = flat
            ? getKwForFlat(hour, flat.baseMultiplier)
            : getKwForCommonArea(hour, commonArea?.category || 'Lighting');

          kwhAccumulated += kw;

          allReadings.push({
            deviceId: device._id,
            flatId: device.mappedFlatId || null,
            commonAreaId: device.mappedCommonAreaId || null,
            societyId: device.societyId,
            timestamp: ts,
            kw,
            kwhToday: parseFloat(kwhAccumulated.toFixed(2)),
            hourOfDay: hour,
            dayOfWeek: ts.getDay()
          });
          count++;
        }
      }
    }

    // Insert in batches of 500
    for (let i = 0; i < allReadings.length; i += 500) {
      await Reading.insertMany(allReadings.slice(i, i + 500));
    }

    // Update device status to Live
    await Device.updateMany({ _id: { $in: devices.map(d => d._id) } }, { status: 'Live', lastSeenAt: new Date() });

    res.json({ success: true, message: `Seeded ${count} readings for ${devices.length} devices` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

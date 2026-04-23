const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Reading = require('../models/Reading');
const Device = require('../models/Device');
const Flat = require('../models/Flat');
const { protect, isFlatOwner } = require('../middleware/auth');

router.use(protect, isFlatOwner);

const RATE_PER_UNIT = 10;

const startOfDay = (date = new Date()) => { const d = new Date(date); d.setHours(0,0,0,0); return d; };
const startOfMonth = (date = new Date()) => { const d = new Date(date); d.setDate(1); d.setHours(0,0,0,0); return d; };

// GET /api/v1/flats/:id/live
router.get('/:id/live', async (req, res) => {
  try {
    const flatId = req.params.id;
    const device = await Device.findOne({ mappedFlatId: flatId, isDeregistered: false });

    if (!device) {
      return res.json({ success: true, data: { status: 'no_device', kw: 0, kwhToday: 0, lastUpdated: null } });
    }

    const latest = await Reading.findOne({ flatId }).sort({ timestamp: -1 });
    if (!latest) {
      return res.json({ success: true, data: { status: 'offline', kw: 0, kwhToday: 0, lastUpdated: null, message: 'Meter offline — no readings yet' } });
    }

    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    const isOnline = latest.timestamp >= fiveMinAgo;

    const flat = await Flat.findById(flatId);
    const avgResult = await Reading.aggregate([
      { $match: { flatId: new mongoose.Types.ObjectId(flatId), timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
      { $group: { _id: null, avg: { $avg: '$kw' } } }
    ]);
    const avgKw = avgResult[0]?.avg || 1.5;

    let colorStatus = 'green';
    if (latest.kw > avgKw * 1.5) colorStatus = 'red';
    else if (latest.kw > avgKw * 1.1) colorStatus = 'amber';

    const diffPct = avgKw > 0 ? Math.round(((latest.kw - avgKw) / avgKw) * 100) : 0;
    const hour = new Date(latest.timestamp).getHours();
    const comparisonText = `${Math.abs(diffPct)}% ${diffPct >= 0 ? 'above' : 'below'} your usual ${hour}:00 usage`;

    res.json({
      success: true,
      data: {
        status: isOnline ? 'live' : 'offline',
        kw: latest.kw,
        kwhToday: latest.kwhToday,
        colorStatus,
        comparisonText,
        lastUpdated: latest.timestamp,
        deviceId: device.deviceSerial,
        message: isOnline ? null : `Meter offline — last reading at ${new Date(latest.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/flats/:id/readings?from=&to=&granularity=hour|day
router.get('/:id/readings', async (req, res) => {
  try {
    const flatId = req.params.id;
    const { from, to, granularity = 'day' } = req.query;

    const startDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = to ? new Date(to) : new Date();

    let groupFormat;
    if (granularity === 'hour') groupFormat = '%Y-%m-%dT%H:00:00';
    else groupFormat = '%Y-%m-%d';

    const readings = await Reading.aggregate([
      { $match: { flatId: new mongoose.Types.ObjectId(flatId), timestamp: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: { $dateToString: { format: groupFormat, date: '$timestamp' } },
          totalKwh: { $sum: '$kw' },
          avgKw: { $avg: '$kw' },
          maxKw: { $max: '$kw' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Build rolling 7-day average for day granularity
    const withAvg = readings.map((r, i) => {
      const window = readings.slice(Math.max(0, i - 6), i + 1);
      const avg = window.reduce((s, x) => s + x.totalKwh, 0) / window.length;
      return { ...r, avg7day: parseFloat(avg.toFixed(2)) };
    });

    // Find highest day and mark weekends
    const maxKwh = Math.max(...withAvg.map(r => r.totalKwh));

    const result = withAvg.map(r => {
      const date = new Date(r._id);
      const dayOfWeek = date.getDay();
      return {
        period: r._id,
        totalKwh: parseFloat(r.totalKwh.toFixed(2)),
        avgKw: parseFloat(r.avgKw.toFixed(2)),
        avg7day: r.avg7day,
        estimatedCost: Math.round(r.totalKwh * RATE_PER_UNIT),
        isHighest: r.totalKwh === maxKwh,
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6
      };
    });

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/flats/:id/summary?month=YYYY-MM
router.get('/:id/summary', async (req, res) => {
  try {
    const flatId = req.params.id;
    const monthParam = req.query.month;

    let monthStart, monthEnd;
    if (monthParam) {
      monthStart = new Date(monthParam + '-01');
      monthEnd = new Date(new Date(monthStart).setMonth(monthStart.getMonth() + 1));
    } else {
      monthStart = startOfMonth();
      monthEnd = new Date();
    }

    const result = await Reading.aggregate([
      { $match: { flatId: new mongoose.Types.ObjectId(flatId), timestamp: { $gte: monthStart, $lt: monthEnd } } },
      { $group: { _id: null, totalKwh: { $sum: '$kw' }, count: { $sum: 1 } } }
    ]);

    const totalKwh = parseFloat((result[0]?.totalKwh || 0).toFixed(2));
    const now = new Date();
    const daysElapsed = Math.max(now.getDate(), 1);
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const projectedKwh = parseFloat(((totalKwh / daysElapsed) * daysInMonth).toFixed(2));

    // Last month comparison
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    const lastMonthResult = await Reading.aggregate([
      { $match: { flatId: new mongoose.Types.ObjectId(flatId), timestamp: { $gte: lastMonthStart, $lte: lastMonthEnd } } },
      { $group: { _id: null, totalKwh: { $sum: '$kw' } } }
    ]);
    const lastMonthKwh = parseFloat((lastMonthResult[0]?.totalKwh || 0).toFixed(2));
    const trendPct = lastMonthKwh > 0 ? parseFloat(((totalKwh - lastMonthKwh) / lastMonthKwh * 100).toFixed(1)) : 0;

    res.json({
      success: true,
      data: {
        totalKwh,
        estimatedCost: Math.round(totalKwh * RATE_PER_UNIT),
        projectedKwh,
        projectedCost: Math.round(projectedKwh * RATE_PER_UNIT),
        trendVsLastMonth: trendPct,
        trendText: `${trendPct > 0 ? 'Up' : 'Down'} ${Math.abs(trendPct)}% vs previous 30 days`,
        daysElapsed,
        daysInMonth
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/flats/:id/hourly-profile
router.get('/:id/hourly-profile', async (req, res) => {
  try {
    const flatId = req.params.id;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const readings = await Reading.aggregate([
      { $match: { flatId: new mongoose.Types.ObjectId(flatId), timestamp: { $gte: thirtyDaysAgo } } },
      { $group: { _id: '$hourOfDay', avgKwh: { $avg: '$kw' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    const maxAvg = Math.max(...readings.map(r => r.avgKwh));
    const result = Array.from({ length: 24 }, (_, h) => {
      const found = readings.find(r => r._id === h);
      const avg = found ? parseFloat(found.avgKwh.toFixed(2)) : 0;
      let level = 'low';
      if (avg > maxAvg * 0.66) level = 'high';
      else if (avg > maxAvg * 0.33) level = 'medium';
      return { hour: h, avgKwh: avg, level };
    });

    // Top 3 peak hours
    const sorted = [...result].sort((a, b) => b.avgKwh - a.avgKwh).slice(0, 3).map(r => r.hour);

    res.json({ success: true, data: { hourly: result, peakHours: sorted } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

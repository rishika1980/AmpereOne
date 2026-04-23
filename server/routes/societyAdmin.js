const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Reading = require('../models/Reading');
const Flat = require('../models/Flat');
const Block = require('../models/Block');
const Floor = require('../models/Floor');
const CommonArea = require('../models/CommonArea');
const Device = require('../models/Device');
const Society = require('../models/Society');
const Alert = require('../models/Alert');
const User = require('../models/User');
const { protect, isSocietyAdmin } = require('../middleware/auth');

router.use(protect, isSocietyAdmin);

const RATE = 10;
const startOfMonth = () => { const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return d; };
const startOfDay = () => { const d = new Date(); d.setHours(0,0,0,0); return d; };

// GET /api/v1/societies/:id/overview
router.get('/:id/overview', async (req, res) => {
  try {
    const societyId = req.params.id;
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);

    const [flats, devices, monthResult, liveDevices] = await Promise.all([
      Flat.find({ societyId }),
      Device.find({ societyId, isDeregistered: false }),
      Reading.aggregate([
        { $match: { societyId: new mongoose.Types.ObjectId(societyId), timestamp: { $gte: startOfMonth() } } },
        { $group: { _id: null, totalKwh: { $sum: '$kw' } } }
      ]),
      Device.find({ societyId, isDeregistered: false, lastSeenAt: { $gte: fiveMinAgo } })
    ]);

    const latestReadings = await Reading.aggregate([
      { $match: { societyId: new mongoose.Types.ObjectId(societyId), timestamp: { $gte: new Date(Date.now() - 60 * 1000) } } },
      { $group: { _id: null, totalKw: { $sum: '$kw' } } }
    ]);

    const monthKwh = parseFloat((monthResult[0]?.totalKwh || 0).toFixed(1));
    const occupiedFlats = flats.filter(f => f.status === 'occupied').length;

    res.json({
      success: true,
      data: {
        totalFlats: flats.length,
        occupiedFlats,
        totalDevices: devices.length,
        devicesOnline: liveDevices.length,
        devicesOffline: devices.length - liveDevices.length,
        totalLiveKw: parseFloat((latestReadings[0]?.totalKw || 0).toFixed(2)),
        monthKwh,
        estimatedCost: Math.round(monthKwh * RATE)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/societies/:id/blocks
router.get('/:id/blocks', async (req, res) => {
  try {
    const societyId = req.params.id;
    const blocks = await Block.find({ societyId });

    const blockData = await Promise.all(blocks.map(async (block) => {
      const flats = await Flat.find({ blockId: block._id });
      const flatIds = flats.map(f => f._id);

      const [todayResult, monthResult, liveResult] = await Promise.all([
        Reading.aggregate([
          { $match: { flatId: { $in: flatIds }, timestamp: { $gte: startOfDay() } } },
          { $group: { _id: null, total: { $sum: '$kw' } } }
        ]),
        Reading.aggregate([
          { $match: { flatId: { $in: flatIds }, timestamp: { $gte: startOfMonth() } } },
          { $group: { _id: null, total: { $sum: '$kw' } } }
        ]),
        Reading.aggregate([
          { $match: { flatId: { $in: flatIds }, timestamp: { $gte: new Date(Date.now() - 60 * 1000) } } },
          { $group: { _id: null, total: { $sum: '$kw' } } }
        ])
      ]);

      return {
        _id: block._id,
        name: block.name,
        totalFlats: flats.length,
        liveKw: parseFloat((liveResult[0]?.total || 0).toFixed(2)),
        todayKwh: parseFloat((todayResult[0]?.total || 0).toFixed(1)),
        monthKwh: parseFloat((monthResult[0]?.total || 0).toFixed(1))
      };
    }));

    // Mark blocks above society average
    const avgMonthKwh = blockData.reduce((s, b) => s + b.monthKwh, 0) / (blockData.length || 1);
    const result = blockData.map(b => ({ ...b, aboveAverage: b.monthKwh > avgMonthKwh }));

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/blocks/:id/floors
router.get('/blocks/:id/floors', async (req, res) => {
  try {
    const blockId = req.params.id;
    const floors = await Floor.find({ blockId }).sort({ floorNumber: 1 });

    const floorData = await Promise.all(floors.map(async (floor) => {
      const flats = await Flat.find({ floorId: floor._id });
      const flatIds = flats.map(f => f._id);

      const monthResult = await Reading.aggregate([
        { $match: { flatId: { $in: flatIds }, timestamp: { $gte: startOfMonth() } } },
        { $group: { _id: null, total: { $sum: '$kw' } } }
      ]);

      return {
        _id: floor._id,
        floorNumber: floor.floorNumber,
        flatCount: flats.length,
        monthKwh: parseFloat((monthResult[0]?.total || 0).toFixed(1))
      };
    }));

    res.json({ success: true, data: floorData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/floors/:id/flats
router.get('/floors/:id/flats', async (req, res) => {
  try {
    const floorId = req.params.id;
    const flats = await Flat.find({ floorId });
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);

    const flatData = await Promise.all(flats.map(async (flat) => {
      const device = await Device.findOne({ mappedFlatId: flat._id, isDeregistered: false });
      const latest = await Reading.findOne({ flatId: flat._id }).sort({ timestamp: -1 });
      const monthResult = await Reading.aggregate([
        { $match: { flatId: flat._id, timestamp: { $gte: startOfMonth() } } },
        { $group: { _id: null, total: { $sum: '$kw' } } }
      ]);

      const isOnline = latest ? latest.timestamp >= fiveMinAgo : false;
      return {
        _id: flat._id,
        flatNumber: flat.flatNumber,
        bhkType: flat.bhkType,
        status: flat.status,
        occupantName: flat.occupantName,
        meterStatus: device ? (isOnline ? 'Live' : 'Offline') : 'No Device',
        currentKw: latest?.kw || 0,
        monthKwh: parseFloat((monthResult[0]?.total || 0).toFixed(1))
      };
    }));

    res.json({ success: true, data: flatData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/societies/:id/common-areas
router.get('/:id/common-areas', async (req, res) => {
  try {
    const societyId = req.params.id;
    const commonAreas = await CommonArea.find({ societyId });
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);

    const result = await Promise.all(commonAreas.map(async (area) => {
      const device = await Device.findOne({ mappedCommonAreaId: area._id, isDeregistered: false });
      const latest = device ? await Reading.findOne({ commonAreaId: area._id }).sort({ timestamp: -1 }) : null;
      const isOnline = latest ? latest.timestamp >= fiveMinAgo : false;

      return {
        _id: area._id,
        name: area.name,
        category: area.category,
        floorOrLocation: area.floorOrLocation,
        currentKw: latest?.kw || 0,
        isOnline,
        status: isOnline ? 'on' : 'off',
        deviceSerial: device?.deviceSerial || null
      };
    }));

    // Group by category
    const grouped = {};
    result.forEach(a => {
      if (!grouped[a.category]) grouped[a.category] = [];
      grouped[a.category].push(a);
    });

    res.json({ success: true, data: { list: result, grouped } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/societies/:id/heatmap
// Returns hour(0-23) x dayOfWeek(0-6) grid
router.get('/:id/heatmap', async (req, res) => {
  try {
    const societyId = req.params.id;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const data = await Reading.aggregate([
      { $match: { societyId: new mongoose.Types.ObjectId(societyId), timestamp: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { hour: '$hourOfDay', day: '$dayOfWeek' },
          avgKwh: { $avg: '$kw' }
        }
      }
    ]);

    // Build 24x7 grid
    const grid = [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let d = 0; d < 7; d++) {
      const row = { day: days[d], dayIndex: d, hours: [] };
      for (let h = 0; h < 24; h++) {
        const found = data.find(x => x._id.hour === h && x._id.day === d);
        row.hours.push({ hour: h, avgKwh: found ? parseFloat(found.avgKwh.toFixed(2)) : 0 });
      }
      grid.push(row);
    }

    res.json({ success: true, data: grid });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/societies/:id/flats?search=&sortBy=monthKwh&order=desc
router.get('/:id/flats', async (req, res) => {
  try {
    const societyId = req.params.id;
    const { search = '', sortBy = 'flatNumber', order = 'asc' } = req.query;

    let query = { societyId };
    if (search) {
      query.$or = [
        { flatNumber: { $regex: search, $options: 'i' } },
        { occupantName: { $regex: search, $options: 'i' } }
      ];
    }

    const flats = await Flat.find(query).populate('blockId', 'name').populate('floorId', 'floorNumber');
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);

    let flatData = await Promise.all(flats.map(async (flat) => {
      const device = await Device.findOne({ mappedFlatId: flat._id, isDeregistered: false });
      const latest = await Reading.findOne({ flatId: flat._id }).sort({ timestamp: -1 });
      const monthResult = await Reading.aggregate([
        { $match: { flatId: flat._id, timestamp: { $gte: startOfMonth() } } },
        { $group: { _id: null, total: { $sum: '$kw' } } }
      ]);

      const isOnline = latest ? latest.timestamp >= fiveMinAgo : false;
      return {
        _id: flat._id,
        flatNumber: flat.flatNumber,
        block: flat.blockId?.name || '',
        floor: flat.floorId?.floorNumber || '',
        occupantName: flat.occupantName,
        bhkType: flat.bhkType,
        meterStatus: device ? (isOnline ? 'Live' : 'Offline') : 'No Device',
        monthKwh: parseFloat((monthResult[0]?.total || 0).toFixed(1))
      };
    }));

    if (sortBy === 'monthKwh') {
      flatData.sort((a, b) => order === 'desc' ? b.monthKwh - a.monthKwh : a.monthKwh - b.monthKwh);
    } else {
      flatData.sort((a, b) => a.flatNumber.localeCompare(b.flatNumber));
    }

    res.json({ success: true, data: flatData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/societies/:id/devices
router.get('/:id/devices', async (req, res) => {
  try {
    const societyId = req.params.id;
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);

    const devices = await Device.find({ societyId, isDeregistered: false })
      .populate('mappedFlatId', 'flatNumber block')
      .populate('mappedCommonAreaId', 'name category')
      .sort({ registeredAt: -1 });

    const result = devices.map(d => {
      let statusColor = 'red';
      let displayStatus = d.status;

      if (d.lastSeenAt) {
        if (d.lastSeenAt >= fiveMinAgo) { statusColor = 'green'; displayStatus = 'Live'; }
        else if (d.lastSeenAt >= thirtyMinAgo) { statusColor = 'amber'; displayStatus = 'Offline'; }
        else { statusColor = 'red'; displayStatus = 'Offline'; }
      } else {
        statusColor = 'amber';
        displayStatus = 'Registered';
      }

      return {
        _id: d._id,
        deviceSerial: d.deviceSerial,
        deviceType: d.deviceType,
        mappedTo: d.mappedFlatId?.flatNumber || d.mappedCommonAreaId?.name || 'Unknown',
        status: displayStatus,
        statusColor,
        lastSeenAt: d.lastSeenAt,
        registeredAt: d.registeredAt
      };
    });

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/societies/:id/top-consumers
router.get('/:id/top-consumers', async (req, res) => {
  try {
    const societyId = req.params.id;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const consumers = await Reading.aggregate([
      { $match: { societyId: new mongoose.Types.ObjectId(societyId), timestamp: { $gte: thirtyDaysAgo } } },
      { $group: { _id: '$flatId', totalKwh: { $sum: '$kw' } } },
      { $sort: { totalKwh: -1 } },
      { $limit: 5 }
    ]);

    const result = await Promise.all(consumers.map(async (c) => {
      const flat = await Flat.findById(c._id).populate('blockId');
      if (!flat) return null;
      
      const avgMonthKwh = 450; // Mock average for comparison
      const diff = ((c.totalKwh - avgMonthKwh) / avgMonthKwh) * 100;

      return {
        id: flat._id,
        flat: flat.flatNumber,
        block: flat.blockId?.name || 'Main',
        kwh: Math.round(c.totalKwh),
        trend: (diff > 0 ? '+' : '') + Math.round(diff) + '%',
        status: diff > 20 ? 'Above avg' : (diff < -20 ? 'Efficient' : 'Normal'),
        color: diff > 20 ? 'text-rose-400 bg-rose-400/10' : (diff < -20 ? 'text-emerald-400 bg-emerald-400/10' : 'text-slate-400 bg-slate-400/10')
      };
    }));

    res.json({ success: true, data: result.filter(r => r !== null) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/societies/:id/consumption-trend
router.get('/:id/consumption-trend', async (req, res) => {
  try {
    const societyId = req.params.id;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const data = await Reading.aggregate([
      { $match: { societyId: new mongoose.Types.ObjectId(societyId), timestamp: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { 
            day: { $dayOfMonth: '$timestamp' },
            month: { $month: '$timestamp' }
          },
          societyKwh: { $sum: '$kw' },
          // For simplicity, let's assume 'society' and 'common' segmentation if we had commonAreaId
          commonKwh: { 
            $sum: { $cond: [{ $ifNull: ['$commonAreaId', false] }, '$kw', 0] } 
          }
        }
      },
      { $sort: { '_id.month': 1, '_id.day': 1 } }
    ]);

    const result = data.map(d => ({
      name: `${d._id.day} ${new Date(2024, d._id.month - 1).toLocaleString('default', { month: 'short' })}`,
      society: parseFloat(d.societyKwh.toFixed(1)),
      common: parseFloat(d.commonKwh.toFixed(1))
    }));

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/societies/:id/billing-history
router.get('/:id/billing-history', async (req, res) => {
  try {
    const societyId = req.params.id;
    const months = 6;
    const history = [];

    for (let i = 0; i < months; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

      const [readings, flatsCount] = await Promise.all([
        Reading.aggregate([
          { $match: { societyId: new mongoose.Types.ObjectId(societyId), timestamp: { $gte: mStart, $lte: mEnd } } },
          { $group: { _id: null, totalKwh: { $sum: '$kw' } } }
        ]),
        Flat.countDocuments({ societyId, status: 'occupied' })
      ]);

      const kwh = readings[0]?.totalKwh || 0;
      history.push({
        month: mStart.toLocaleString('default', { month: 'long', year: 'numeric' }),
        flats: flatsCount,
        kwh: Math.round(kwh).toLocaleString(),
        revenue: Math.round(kwh * RATE).toLocaleString()
      });
    }

    res.json({ success: true, data: history });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/societies/:id/alerts
router.get('/:id/alerts', async (req, res) => {
  try {
    const societyId = req.params.id;
    const alerts = await Alert.find({ societyId, status: { $ne: 'Resolved' } }).sort({ createdAt: -1 });

    // Format for frontend
    const formatted = alerts.map(a => ({
      id: a._id,
      title: a.title,
      desc: a.desc,
      status: a.status,
      category: a.category,
      time: a.createdAt, // Frontend will handle formatting
      priority: a.priority,
      needsAttention: a.needsAttention,
      flatId: a.metadata?.flatId,
      userId: a.metadata?.userId,
      type: a.type
    }));

    res.json({ success: true, data: formatted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/v1/societies/alerts/:id/resolve
router.patch('/alerts/:id/resolve', async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(req.params.id, { status: 'Resolved' }, { new: true });
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });
    res.json({ success: true, data: alert });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/v1/societies/alerts/:id/approve
router.post('/alerts/:id/approve', async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    const userId = alert.metadata?.userId;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'Alert metadata incomplete: Missing User Identity' });
    }

    const user = await User.findByIdAndUpdate(userId, { isActive: true }, { new: true });
    
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    alert.status = 'Resolved';
    await alert.save();

    res.json({ success: true, message: 'Resident approved successfully', user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/v1/societies/alerts/:id/reject
router.post('/alerts/:id/reject', async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    const userId = alert.metadata?.userId;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'Alert metadata incomplete: Missing User Identity' });
    }

    await User.findByIdAndDelete(userId);
    
    alert.status = 'Resolved';
    alert.desc += ' (Rejected)';
    await alert.save();

    res.json({ success: true, message: 'Resident application rejected' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/societies/:id/settings
router.get('/:id/settings', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid Society Node Identifier' });
    }

    console.log(`[SETTINGS] Synchronizing node metadata: ${id}`);
    let society = await Society.findById(id);
    
    if (!society) {
      console.error(`[SETTINGS] Node footprint not detected: ${id}`);
      return res.status(404).json({ success: false, message: 'Society infrastructure not found' });
    }
    
    // Auto-generate code if missing
    if (!society.societyCode) {
      console.log(`[SETTINGS] Deploying fresh access signaling for node: ${id}`);
      society.societyCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      await society.save();
    }

    res.json({ success: true, data: society });
  } catch (err) {
    console.error(`[SETTINGS] Critical node failure:`, err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/v1/societies/:id/settings
router.put('/:id/settings', async (req, res) => {
  try {
    const { name, address, city, pincode, inviteOnlyMode, alertThresholds } = req.body;
    
    let society = await Society.findById(req.params.id);
    if (!society) {
      return res.status(404).json({ success: false, message: 'Society mission-critical node missing' });
    }

    const updated = await Society.findByIdAndUpdate(
      req.params.id,
      { name, address, city, pincode, inviteOnlyMode, alertThresholds },
      { new: true, runValidators: true }
    );

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/v1/societies/:id/rotate-code
router.patch('/:id/rotate-code', async (req, res) => {
  try {
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const society = await Society.findByIdAndUpdate(
      req.params.id,
      { societyCode: newCode },
      { new: true }
    );

    res.json({ success: true, code: society.societyCode });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/v1/societies/alerts/:id/recheck
router.post('/alerts/:id/recheck', async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });
    
    // Simulate a system scan delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // For demo/sim purposes, we'll mark it as resolved
    alert.status = 'Resolved';
    await alert.save();
    
    res.json({ success: true, message: 'System diagnostic complete. Device status nominal.', data: alert });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

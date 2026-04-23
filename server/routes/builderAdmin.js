const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Society = require('../models/Society');
const Flat = require('../models/Flat');
const Block = require('../models/Block');
const Floor = require('../models/Floor');
const Device = require('../models/Device');
const Reading = require('../models/Reading');
const { protect, isBuilderAdmin } = require('../middleware/auth');

router.use(protect, isBuilderAdmin);

const startOfMonth = () => { const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return d; };

// GET /api/v1/builders/:id/overview
router.get('/:id/overview', async (req, res) => {
  try {
    const builderId = req.params.id;
    const societies = await Society.find({ builderId });
    const societyIds = societies.map(s => s._id);

    const [flats, devices, monthResult] = await Promise.all([
      Flat.find({ societyId: { $in: societyIds } }),
      Device.find({ societyId: { $in: societyIds }, isDeregistered: false }),
      Reading.aggregate([
        { $match: { societyId: { $in: societyIds.map(id => new mongoose.Types.ObjectId(id)) }, timestamp: { $gte: startOfMonth() } } },
        { $group: { _id: null, totalKwh: { $sum: '$kw' } } }
      ])
    ]);

    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    const onlineDevices = await Device.countDocuments({ societyId: { $in: societyIds }, isDeregistered: false, lastSeenAt: { $gte: fiveMinAgo } });

    res.json({
      success: true,
      data: {
        totalSocieties: societies.length,
        totalFlats: flats.length,
        totalDevicesOnline: onlineDevices,
        portfolioMonthKwh: parseFloat((monthResult[0]?.totalKwh || 0).toFixed(1)),
        estimatedCost: Math.round((monthResult[0]?.totalKwh || 0) * 10)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/builders/:id/societies?sortBy=monthKwh&order=desc
router.get('/:id/societies', async (req, res) => {
  try {
    const builderId = req.params.id;
    const { sortBy = 'name', order = 'asc' } = req.query;
    const societies = await Society.find({ builderId });

    let societyData = await Promise.all(societies.map(async (society) => {
      const flats = await Flat.find({ societyId: society._id });
      const occupiedFlats = flats.filter(f => f.status === 'occupied').length;

      const monthResult = await Reading.aggregate([
        { $match: { societyId: new mongoose.Types.ObjectId(society._id), timestamp: { $gte: startOfMonth() } } },
        { $group: { _id: null, totalKwh: { $sum: '$kw' } } }
      ]);

      const monthKwh = parseFloat((monthResult[0]?.totalKwh || 0).toFixed(1));
      return {
        _id: society._id,
        name: society.name,
        city: society.city,
        totalFlats: flats.length,
        occupiedFlats,
        monthKwh,
        avgKwhPerFlat: flats.length > 0 ? parseFloat((monthKwh / flats.length).toFixed(1)) : 0,
        estimatedCost: Math.round(monthKwh * 10)
      };
    }));

    if (sortBy === 'monthKwh') {
      societyData.sort((a, b) => order === 'desc' ? b.monthKwh - a.monthKwh : a.monthKwh - b.monthKwh);
    }

    res.json({ success: true, data: societyData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/v1/builders/:id/societies
router.post('/:id/societies', async (req, res) => {
  try {
    const builderId = req.params.id;
    const { name, city, address, flatsData = [] } = req.body;

    if (!name || !city) {
      return res.status(400).json({ success: false, message: 'Name and City are required' });
    }

    console.log(`[Society Creation] Provisioning nodes for ${name} (${city})`);

    // 1. Create Society
    const society = new Society({
      builderId,
      name,
      city,
      address,
      societyCode: Math.random().toString(36).substring(2, 8).toUpperCase()
    });
    await society.save();

    // 2. Process Flats Data (Bulk)
    const blockMap = {}; 
    const floorMap = {}; 

    for (const item of flatsData) {
      if (!item.block || !item.floor || !item.flatNo) continue;

      // Create Block if not exists
      if (!blockMap[item.block]) {
        const block = new Block({ societyId: society._id, name: item.block });
        await block.save();
        blockMap[item.block] = block._id;
      }

      // Create Floor if not exists
      const floorKey = `${item.block}_${item.floor}`;
      const floorNum = parseInt(item.floor);
      if (!floorMap[floorKey]) {
        const floor = new Floor({ 
          societyId: society._id, 
          blockId: blockMap[item.block], 
          floorNumber: isNaN(floorNum) ? 0 : floorNum 
        });
        await floor.save();
        floorMap[floorKey] = floor._id;
      }

      // Create Flat
      const flat = new Flat({
        societyId: society._id,
        blockId: blockMap[item.block],
        floorId: floorMap[floorKey],
        flatNumber: item.flatNo,
        bhkType: item.type || '2BHK',
        status: 'vacant'
      });
      await flat.save();
    }

    console.log(`[Society Creation] Success: ${flatsData.length} flats provisioned for ${society.name}`);
    res.json({ success: true, data: society });
  } catch (err) {
    console.error('CRITICAL: Society Creation Failed:', err);
    res.status(500).json({ success: false, message: err.message || 'Internal server error during node provisioning' });
  }
});

module.exports = router;

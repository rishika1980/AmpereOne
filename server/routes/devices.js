const express = require('express');
const router = express.Router();
const Device = require('../models/Device');
const Flat = require('../models/Flat');
const CommonArea = require('../models/CommonArea');
const { protect, isSocietyAdmin } = require('../middleware/auth');

router.use(protect, isSocietyAdmin);

// POST /api/v1/devices — Register new device
router.post('/', async (req, res) => {
  try {
    const { deviceSerial, deviceType, mappedFlatId, mappedCommonAreaId } = req.body;
    const societyId = req.user.societyId._id || req.user.societyId;

    if (!deviceSerial || !deviceType) {
      return res.status(400).json({ success: false, message: 'Device serial and type are required' });
    }

    // Check duplicate
    const existing = await Device.findOne({ deviceSerial });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Device ID already registered. Please check and try again.' });
    }

    // Validate serial format (MTR-XX-XX-XXX)
    const serialRegex = /^MTR-[A-Z0-9]{1,4}-[A-Z0-9]{1,4}-[A-Z0-9]{3,6}$/;
    if (!serialRegex.test(deviceSerial)) {
      return res.status(400).json({ success: false, message: 'Invalid device ID format. Use: MTR-B1-F2-101' });
    }

    // Validate mapped entity exists
    if (mappedFlatId) {
      const flat = await Flat.findById(mappedFlatId);
      if (!flat) return res.status(400).json({ success: false, message: 'Flat not found' });
    }
    if (mappedCommonAreaId) {
      const area = await CommonArea.findById(mappedCommonAreaId);
      if (!area) return res.status(400).json({ success: false, message: 'Common area not found' });
    }

    const device = await Device.create({
      deviceSerial,
      deviceType,
      mappedFlatId: mappedFlatId || null,
      mappedCommonAreaId: mappedCommonAreaId || null,
      societyId,
      status: 'Registered'
    });

    res.status(201).json({ success: true, data: device, message: 'Device registered successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/v1/devices/:id — Deregister (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);
    if (!device) return res.status(404).json({ success: false, message: 'Device not found' });

    device.isDeregistered = true;
    device.status = 'Deregistered';
    await device.save();

    res.json({ success: true, message: 'Device deregistered. Historical data has been preserved.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

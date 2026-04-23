const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Alert = require('../models/Alert');
const Society = require('../models/Society');
const Flat = require('../models/Flat');
const { protect } = require('../middleware/auth');

const generateToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

// POST /api/v1/auth/login
router.post('/login', [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });

  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email })
      .populate('flatId')
      .populate('societyId')
      .populate('builderId');

    if (!user) return res.status(401).json({ success: false, message: 'Invalid email or password. Please try again.' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid email or password. Please try again.' });

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account pending administrator approval.' });
    }

    const token = generateToken(user._id, user.role);

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          flatId: user.flatId,
          societyId: user.societyId,
          builderId: user.builderId
        }
      }
    });
  } catch (err) {
    console.error('LOGIN_ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/v1/auth/me
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('flatId')
      .populate('societyId')
      .populate('builderId')
      .select('-password');
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/v1/auth/switch-role
router.post('/switch-role', protect, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['flat_owner', 'society_admin', 'builder_admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    // Assign Demo IDs if missing during role switch (for seamless demo experience)
    const updates = { role };
    if (role === 'society_admin' && !req.user.societyId) {
      const s = await mongoose.model('Society').findOne();
      if (s) updates.societyId = s._id;
    }
    if (role === 'builder_admin' && !req.user.builderId) {
       const b = await mongoose.model('Builder').findOne();
       if (b) updates.builderId = b._id;
    }
    if (role === 'flat_owner' && !req.user.flatId) {
       const f = await mongoose.model('Flat').findOne();
       if (f) updates.flatId = f._id;
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true })
      .populate('flatId')
      .populate('societyId')
      .populate('builderId');

    const token = generateToken(user._id, user.role);
    res.json({ success: true, data: { token, user } });
  } catch (err) {
    console.error('ROLE_SWITCH_ERROR:', err);
    res.status(500).json({ success: false, message: 'Switch failed' });
  }
});

// POST /api/v1/auth/register
router.post('/register', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be 6+ chars'),
  body('flatId').optional()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });

  try {
    const { name, email, password, flatId, role = 'flat_owner', flatNumber, code } = req.body;
    let { societyId } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ success: false, message: 'Email already registered' });

    // Resolve societyId from code if missing
    if (!societyId && code) {
      const Society = mongoose.model('Society');
      const found = await Society.findOne({ societyCode: code.toUpperCase() });
      if (found) societyId = found._id;
    }

    if (!societyId && role === 'flat_owner') {
      return res.status(400).json({ success: false, message: 'Society Node Identification required' });
    }

    let finalFlatId = flatId;

    // Dynamic Flat Creation if flatId is missing but flatNumber is provided
    if (role === 'flat_owner' && !finalFlatId && flatNumber) {
      const Flat = mongoose.model('Flat');
      const Block = mongoose.model('Block');
      const Floor = mongoose.model('Floor');

      let flat = await Flat.findOne({ societyId, flatNumber: flatNumber.trim() });
      
      if (!flat) {
        // Create a default block/floor if none exist
        let block = await Block.findOne({ societyId });
        if (!block) block = await Block.create({ societyId, name: 'Block A' });
        
        let floor = await Floor.findOne({ blockId: block._id });
        if (!floor) floor = await Floor.create({ blockId: block._id, societyId, floorNumber: 1 });

        flat = await Flat.create({
          societyId,
          blockId: block._id,
          floorId: floor._id,
          flatNumber: flatNumber.trim(),
          status: 'occupied',
          occupantName: name
        });
      }
      finalFlatId = flat._id;
    }

    // SMART DATA LOGIC: 
    // 1. For Demo Accounts: Auto-seed history data so they are "Demo Ready"
    // 2. For Normal Accounts: Clean slate (Zero data)
    const DEMO_EMAILS = ['admin@ampereone.io', 'builder@ampereone.io', 'resident@ampereone.io'];

    if (role === 'flat_owner' && finalFlatId) {
      const Reading = mongoose.model('Reading');
      
      if (DEMO_EMAILS.includes(email)) {
        // AUTO-SEED for Demo Resident
        const Device = mongoose.model('Device');
        let device = await Device.findOne({ mappedFlatId: finalFlatId });
        if (!device) {
          device = await Device.create({
            deviceSerial: `SN-DEMO-${Date.now()}`,
            societyId,
            mappedFlatId: finalFlatId,
            status: 'Live'
          });
        }

        const readings = [];
        for (let d = 30; d >= 0; d--) {
          let dailyAcc = 0;
          for (let h = 0; h < 24; h++) {
            const ts = new Date();
            ts.setDate(ts.getDate() - d);
            ts.setHours(h, 0, 0, 0);
            const kw = 0.8 + Math.random() * 2.2;
            dailyAcc += kw;
            readings.push({
              deviceId: device._id,
              flatId: finalFlatId,
              societyId,
              timestamp: ts,
              kw,
              kwhToday: parseFloat(dailyAcc.toFixed(2)),
              hourOfDay: h,
              dayOfWeek: ts.getDay()
            });
          }
        }
        await Reading.insertMany(readings);
        console.log(`✨ Auto-Seeded Demo Data for: ${email}`);
      } else {
        // CLEAN SLATE for Normal Resident
        const AlertModel = mongoose.model('Alert');
        await Promise.all([
          Reading.deleteMany({ flatId: finalFlatId }),
          AlertModel.deleteMany({ flatId: finalFlatId })
        ]);
        console.log(`🧹 Clean Slate applied for new resident: ${email}`);
      }
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      societyId,
      flatId: finalFlatId,
      isActive: DEMO_EMAILS.includes(email) // Auto-activate demo accounts
    });

    // Create Approval Alert
    await Alert.create({
      societyId,
      title: `New Registration — ${name}`,
      desc: `New resident requested access for Flat ${flatNumber || 'Unknown'}.`,
      category: 'Approvals',
      type: 'registration',
      priority: 'low',
      metadata: { userId: user._id, flatId: finalFlatId },
      status: 'Pending'
    });

    res.status(201).json({ 
      success: true, 
      message: 'Registration successful. Waiting for admin approval.' 
    });
  } catch (err) {
    console.error('REGISTER_ERROR:', err);
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
});

// GET /api/v1/auth/verify-society/:code
router.get('/verify-society/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const society = await mongoose.model('Society').findOne({ societyCode: code.toUpperCase() });
    
    if (!society) {
      return res.status(404).json({ success: false, message: 'Invalid society code. Please check with your administrator.' });
    }

    const flats = await mongoose.model('Flat').find({ societyId: society._id }).sort({ flatNumber: 1 });

    res.json({
      success: true,
      data: {
        id: society._id,
        name: society.name,
        flats: flats.map(f => ({ id: f._id, number: f.flatNumber, bhk: f.bhkType, societyId: f.societyId }))
      }
    });
  } catch (err) {
    console.error('VERIFY_SOCIETY_ERROR:', err);
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
});

module.exports = router;

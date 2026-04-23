require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');

// Load Models
require('./models/Builder');
require('./models/Society');
require('./models/Block');
require('./models/Floor');
require('./models/Flat');
require('./models/CommonArea');
require('./models/Device');
require('./models/Reading');
require('./models/User');

// const connectDB = require('./config/db');

const app = express();
connectDB();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));

// Routes
app.use('/api/v1/auth',      require('./routes/auth'));
app.use('/api/v1/flats',     require('./routes/flatOwner'));
app.use('/api/v1/societies', require('./routes/societyAdmin'));
app.use('/api/v1/builders',  require('./routes/builderAdmin'));
app.use('/api/v1/devices',   require('./routes/devices'));
app.use('/api/v1/mock',      require('./routes/mock'));

// Health check
app.get('/api/v1', (req, res) => res.json({ message: 'GridWise API v1 running ⚡', status: 'ok' }));

// 404
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 GridWise Server running on port ${PORT}`));

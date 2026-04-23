const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// I'll just check the code again.
// The code had: await mongoose.startSession()
// If it's a standalone node, it will throw.

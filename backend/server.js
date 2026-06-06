// ============================================================
// O'BARBA FAMILY SALON - BACKEND SERVER (VERCEL READY)
// ============================================================

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
const rateLimit = require('express-rate-limit');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors()); // Vercel ke liye simply cors() use karein

// Rate Limiting Corrected: Variable ka naam fix kiya
const bookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 10,
  message: { success: false, message: 'Bahut zyada requests!' }
});

// MongoDB Connection
const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.MONGODB_URI);
};

// Model (Yahan re-use karne ke liye check lagaya)
const Booking = mongoose.models.Booking || mongoose.model('Booking', new mongoose.Schema({
  name: String, phone: String, date: String, service: String, branch: String,
  status: { type: String, default: 'pending' }, notes: String, createdAt: { type: Date, default: Date.now }
}));

// API Routes
app.post('/api/booking', bookingLimiter, async (req, res) => {
  await connectDB();
  try {
    const { name, phone, date, service, branch } = req.body;
    const newBooking = new Booking({ name, phone, date, service, branch });
    await newBooking.save();
    res.status(201).json({ success: true, message: 'Booking successful!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Admin Login Route (await add kiya)
app.post('/api/admin/login', async (req, res) => {
  await connectDB();
  const { password } = req.body;
  if (password === process.env.ADMIN_PASSWORD) {
    res.json({ success: true, token: Buffer.from(password).toString('base64') });
  } else {
    res.status(401).json({ success: false });
  }
});

// Admin Auth Middleware
function adminAuth(req, res, next) {
  const auth = req.headers['authorization'];
  if (auth && Buffer.from(auth, 'base64').toString('utf-8') === process.env.ADMIN_PASSWORD) {
    next();
  } else {
    res.status(401).json({ success: false });
  }
}

// Admin Routes (Same as yours, bas 'adminAuth' middleware ke saath)
app.get('/api/admin/bookings', adminAuth, async (req, res) => {
  await connectDB();
  const bookings = await Booking.find().sort({ createdAt: -1 });
  res.json({ success: true, bookings });
});

// Vercel ke liye export
module.exports = app;

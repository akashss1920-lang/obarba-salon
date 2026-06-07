// ============================================================
// O'BARBA FAMILY SALON - BACKEND SERVER
// Node.js + Express + MongoDB + WhatsApp Notifications
// ============================================================

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================
// MIDDLEWARE SETUP
// ============================================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS - Frontend ko allow karo
app.use(cors({
  origin: [
    'https://obarbafamilysalon.com',
    'http://obarbafamilysalon.com',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'null' // Local file open karne ke liye
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate Limiting - Spam se bachao
const bookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 bookings per 15 min per IP
  message: { success: false, message: 'Bahut zyada requests! Thodi der baad try karo.' }
});

// ============================================================
// MONGODB CONNECTION
// ============================================================
mongoose.connect('mongodb+srv://obarba:Obarba%400501@obarba-cluster.ee6o9ev.mongodb.net/?retryWrites=true&w=majority')
.then(() => console.log('✅ Database connected!'))
  .catch(err => console.error('❌ connection error:', err));

// ============================================================
// BOOKING SCHEMA & MODEL
// ============================================================
const bookingSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: String,
    required: true
  },
  service: {
    type: String,
    required: true
  },
  branch: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  notes: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Booking = mongoose.model('Booking', bookingSchema);

// ============================================================
// WHATSAPP NOTIFICATION FUNCTION (CallMeBot - FREE)
// ============================================================
async function sendWhatsAppAlert(booking) {
  try {
    const phone = process.env.WHATSAPP_PHONE;
    const apiKey = process.env.WHATSAPP_API_KEY;

    if (!phone || !apiKey || phone.includes('X') || apiKey.includes('X')) {
      console.log('⚠️ WhatsApp credentials set nahi hain - notification skip');
      return;
    }

    const message = `🌟 *O'BARBA SALON - NAYI BOOKING!*

👤 *Naam:* ${booking.name}
📞 *Phone:* ${booking.phone}
📅 *Date:* ${booking.date}
💇 *Service:* ${booking.service}
📍 *Branch:* ${booking.branch}

🕐 *Booking Time:* ${new Date().toLocaleString('hi-IN', {timeZone: 'Asia/Kolkata'})}

👉 Admin panel: https://your-app.onrender.com/admin`;

    const encodedMessage = encodeURIComponent(message);
    const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodedMessage}&apikey=${apiKey}`;

    await axios.get(url, { timeout: 10000 });
    console.log('✅ WhatsApp notification bhej diya!');
  } catch (err) {
    // WhatsApp fail ho toh bhi booking save ho
    console.error('⚠️ WhatsApp notification failed (booking saved anyway):', err.message);
  }
}

// ============================================================
// API ROUTES
// ============================================================

// --- Health Check ---
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: "O'BARBA Salon Backend chal raha hai! 🚀",
    status: 'online',
    timestamp: new Date().toISOString()
  });
});

// --- NEW BOOKING Submit karo ---
app.post('/api/booking', bookingLimiter, async (req, res) => {
  try {
    console.log("Browser se aaya data:", req.body);
    const { name, phone, date, service, branch } = req.body;

    // Validation
    if (!name || !phone || !date || !service || !branch) {
      return res.status(400).json({
        success: false,
        message: 'Sab fields bharna zaroori hai!'
      });
    }

    // Phone number validate karo
    const phoneRegex = /^[6-9]\d{9}$|^\+91[6-9]\d{9}$/;
    const cleanPhone = phone.replace(/[\s\-\+]/g, '').replace(/^91/, '');
    if (!phoneRegex.test(cleanPhone) && !phone.includes('+91')) {
      return res.status(400).json({
        success: false,
        message: 'Valid phone number dalo!'
      });
    }

    // Booking save karo
    const newBooking = new Booking({
      name: name.trim(),
      phone: phone.trim(),
      date,
      service,
      branch,
      status: 'pending'
    });

    await newBooking.save();
    console.log(`✅ New booking saved: ${name} - ${service} at ${branch}`);

    // WhatsApp alert bhejo (async - user ko wait nahi karana)
    sendWhatsAppAlert(newBooking);

    res.status(201).json({
      success: true,
      message: 'Booking successful! Hum jald aapse contact karenge. 😊',
      bookingId: newBooking._id
    });

  } catch (error) {
    console.error('❌ Booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error! Thodi der baad try karo.'
    });
  }
});

// --- ADMIN: Saari bookings dekho ---
app.get('/api/admin/bookings', adminAuth, async (req, res) => {
  try {
    const { status, branch, date, page = 1, limit = 50 } = req.query;

    let filter = {};
    if (status && status !== 'all') filter.status = status;
    if (branch && branch !== 'all') filter.branch = branch;
    if (date) filter.date = date;

    const totalCount = await Booking.countDocuments(filter);
    const bookings = await Booking.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Stats
    const stats = {
      total: await Booking.countDocuments(),
      pending: await Booking.countDocuments({ status: 'pending' }),
      confirmed: await Booking.countDocuments({ status: 'confirmed' }),
      completed: await Booking.countDocuments({ status: 'completed' }),
      cancelled: await Booking.countDocuments({ status: 'cancelled' }),
      todayCount: await Booking.countDocuments({
        date: new Date().toISOString().split('T')[0]
      })
    };

    res.json({
      success: true,
      bookings,
      stats,
      totalCount,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalCount / limit)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching bookings' });
  }
});

// --- ADMIN: Booking status update karo ---
app.put('/api/admin/bookings/:id', adminAuth, async (req, res) => {
  try {
    const { status, notes } = req.body;
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status, notes },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking nahi mili!' });
    }

    res.json({ success: true, message: 'Status update ho gaya!', booking });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Update failed' });
  }
});

// --- ADMIN: Booking delete karo ---
app.delete('/api/admin/bookings/:id', adminAuth, async (req, res) => {
  try {
    await Booking.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Booking delete ho gayi!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Delete failed' });
  }
});

// --- ADMIN: Login verify karo ---
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === process.env.ADMIN_PASSWORD) {
    res.json({ success: true, token: Buffer.from(password).toString('base64') });
  } else {
    res.status(401).json({ success: false, message: 'Galat password!' });
  }
});

// ============================================================
// ADMIN AUTH MIDDLEWARE
// ============================================================
function adminAuth(req, res, next) {
  const auth = req.headers['authorization'];
  if (!auth) {
    return res.status(401).json({ success: false, message: 'Login karo pehle!' });
  }
  try {
    const password = Buffer.from(auth, 'base64').toString('utf-8');
    if (password === process.env.ADMIN_PASSWORD) {
      next();
    } else {
      res.status(401).json({ success: false, message: 'Unauthorized!' });
    }
  } catch (e) {
    res.status(401).json({ success: false, message: 'Invalid token!' });
  }
}

// ============================================================
// START SERVER
// ============================================================
app.listen(PORT, () => {
  console.log(`\n🚀 O'BARBA Backend Server chal raha hai!`);
  console.log(`📡 Port: ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`📊 Admin API: http://localhost:${PORT}/api/admin/bookings\n`);
});

module.exports = app;

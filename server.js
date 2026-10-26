const express = require('express');
const session = require('express-session');
const path = require('path');

// Ensure database tables and seed are loaded
require('./database/db');

// Import routes
const authRoutes = require('./routes/auth');
const vehicleRoutes = require('./routes/vehicles');
const bookingRoutes = require('./routes/bookings');

const app = express();
const PORT = process.env.PORT || 3000;

// Body parsing middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Express Session configuration
app.use(
  session({
    secret: 'online_vehicle_rental_secret_key_12345',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Set to true if running over HTTPS in production
      maxAge: 1000 * 60 * 60 * 24 // 24 hours
    }
  })
);

// Serve static frontend files from 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/bookings', bookingRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    message: 'An internal server error occurred.'
  });
});

// Keepalive timer to guarantee event loop persistence
setInterval(() => {}, 1000 * 60 * 60);

// Log process exit events if any signal is received
process.on('exit', (code) => {
  console.log(`Server process exiting with code: ${code}`);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start Express Server
const server = app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` Online Vehicle Rental System Server Running!`);
  console.log(` Local URL: http://localhost:${PORT}`);
  console.log(`====================================================`);
});

module.exports = server;

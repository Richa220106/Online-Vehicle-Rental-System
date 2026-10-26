const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../database/db');

// Email regex pattern for validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Basic phone regex (at least 10 digits)
const PHONE_REGEX = /^[0-9+\s-]{10,15}$/;

/**
 * POST /api/auth/register
 * Register a new customer
 */
router.post('/register', (req, res) => {
  const { name, email, phone, password } = req.body;

  // 1. Validate inputs
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Full name is required.' });
  }

  if (!email || !EMAIL_REGEX.test(email.trim())) {
    return res.status(400).json({ success: false, message: 'A valid email address is required.' });
  }

  if (!phone || !PHONE_REGEX.test(phone.trim())) {
    return res.status(400).json({ success: false, message: 'A valid phone number (10-15 digits) is required.' });
  }

  if (!password || password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long.'
    });
  }

  const cleanName = name.trim();
  const cleanEmail = email.trim().toLowerCase();
  const cleanPhone = phone.trim();

  // 2. Check if email already exists using parameterized query
  db.get('SELECT id FROM Customers WHERE email = ?', [cleanEmail], (err, existingUser) => {
    if (err) {
      console.error('Error checking existing email:', err.message);
      return res.status(500).json({ success: false, message: 'Database error occurred.' });
    }

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'This email is already registered. Please log in instead.'
      });
    }

    // 3. Hash password using bcrypt
    const saltRounds = 10;
    bcrypt.hash(password, saltRounds, (hashErr, hash) => {
      if (hashErr) {
        console.error('Error hashing password:', hashErr.message);
        return res.status(500).json({ success: false, message: 'Failed to secure password.' });
      }

      // 4. Insert new customer into database
      const insertQuery = `
        INSERT INTO Customers (name, email, phone, password_hash)
        VALUES (?, ?, ?, ?)
      `;

      db.run(insertQuery, [cleanName, cleanEmail, cleanPhone, hash], function (insertErr) {
        if (insertErr) {
          console.error('Error creating customer:', insertErr.message);
          return res.status(500).json({ success: false, message: 'Failed to create customer account.' });
        }

        // Auto-login newly registered customer via session
        req.session.customer = {
          id: this.lastID,
          name: cleanName,
          email: cleanEmail,
          phone: cleanPhone
        };

        return res.status(201).json({
          success: true,
          message: 'Account created successfully!',
          customer: req.session.customer
        });
      });
    });
  });
});

/**
 * POST /api/auth/login
 * Customer login using sessions
 */
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required.'
    });
  }

  const cleanEmail = email.trim().toLowerCase();

  // Find customer by email using parameterized query
  db.get('SELECT * FROM Customers WHERE email = ?', [cleanEmail], (err, customer) => {
    if (err) {
      console.error('Error fetching customer for login:', err.message);
      return res.status(500).json({ success: false, message: 'Database error occurred.' });
    }

    if (!customer) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Compare password with hashed password
    bcrypt.compare(password, customer.password_hash, (compareErr, isMatch) => {
      if (compareErr) {
        console.error('Error comparing password:', compareErr.message);
        return res.status(500).json({ success: false, message: 'Authentication error occurred.' });
      }

      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password.'
        });
      }

      // Store customer info in session (excluding password hash)
      req.session.customer = {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone
      };

      return res.json({
        success: true,
        message: 'Login successful!',
        customer: req.session.customer
      });
    });
  });
});

/**
 * GET /api/auth/current-user
 * Check current logged-in customer session
 */
router.get('/current-user', (req, res) => {
  if (req.session && req.session.customer) {
    return res.json({
      authenticated: true,
      customer: req.session.customer
    });
  }

  return res.json({
    authenticated: false,
    customer: null
  });
});

/**
 * POST /api/auth/logout
 * Destroy session and log out customer
 */
router.post('/logout', (req, res) => {
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Failed to log out.'
        });
      }
      res.clearCookie('connect.sid');
      return res.json({
        success: true,
        message: 'Logged out successfully.'
      });
    });
  } else {
    return res.json({
      success: true,
      message: 'Already logged out.'
    });
  }
});

module.exports = router;

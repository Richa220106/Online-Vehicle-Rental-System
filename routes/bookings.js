const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { requireAuth } = require('../middleware/authMiddleware');

/**
 * Helper function to validate date format (YYYY-MM-DD)
 */
function isValidDate(dateString) {
  const regEx = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateString || !dateString.match(regEx)) return false;
  const d = new Date(dateString);
  const dNum = d.getTime();
  if (!dNum && dNum !== 0) return false;
  return d.toISOString().slice(0, 10) === dateString;
}

/**
 * Helper to calculate total rental days (inclusive)
 */
function calculateDays(startDateStr, endDateStr) {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.round(diffTime / (1000 * 3600 * 24)) + 1;
  return diffDays > 0 ? diffDays : 0;
}

/**
 * POST /api/bookings/check-availability
 * Check if a vehicle is available for given dates and calculate total cost
 */
router.post('/check-availability', (req, res) => {
  const { vehicle_id, start_date, end_date } = req.body;

  if (!vehicle_id || !start_date || !end_date) {
    return res.status(400).json({
      success: false,
      message: 'Vehicle ID, start date, and end date are required.'
    });
  }

  if (!isValidDate(start_date) || !isValidDate(end_date)) {
    return res.status(400).json({
      success: false,
      message: 'Dates must be in valid YYYY-MM-DD format.'
    });
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  if (start_date < todayStr) {
    return res.status(400).json({
      success: false,
      message: 'Start date cannot be in the past.'
    });
  }

  if (end_date < start_date) {
    return res.status(400).json({
      success: false,
      message: 'End date must be greater than or equal to start date.'
    });
  }

  // 1. Fetch vehicle to get price per day
  db.get('SELECT * FROM Vehicles WHERE id = ?', [vehicle_id], (vErr, vehicle) => {
    if (vErr) {
      console.error('Error finding vehicle:', vErr.message);
      return res.status(500).json({ success: false, message: 'Database error.' });
    }

    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found.' });
    }

    // 2. Check for overlapping active confirmed bookings
    const overlapQuery = `
      SELECT id, start_date, end_date
      FROM Bookings
      WHERE vehicle_id = ?
        AND booking_status = 'CONFIRMED'
        AND (start_date <= ? AND end_date >= ?)
      LIMIT 1
    `;

    db.get(overlapQuery, [vehicle_id, end_date, start_date], (overlapErr, overlappingBooking) => {
      if (overlapErr) {
        console.error('Error checking overlap:', overlapErr.message);
        return res.status(500).json({ success: false, message: 'Database error checking availability.' });
      }

      const totalDays = calculateDays(start_date, end_date);
      const totalPrice = totalDays * vehicle.price_per_day;

      if (overlappingBooking) {
        return res.json({
          success: true,
          available: false,
          message: `Vehicle is already booked from ${overlappingBooking.start_date} to ${overlappingBooking.end_date}. Please pick different dates.`,
          total_days: totalDays,
          total_price: totalPrice,
          price_per_day: vehicle.price_per_day
        });
      }

      return res.json({
        success: true,
        available: true,
        message: 'Vehicle is available for the selected dates!',
        total_days: totalDays,
        price_per_day: vehicle.price_per_day,
        total_price: totalPrice,
        vehicle: {
          id: vehicle.id,
          name: vehicle.name,
          model: vehicle.model,
          type: vehicle.type
        }
      });
    });
  });
});

/**
 * POST /api/bookings/confirm
 * Requires customer login: Validates payment simulation and confirms booking
 */
router.post('/confirm', requireAuth, (req, res) => {
  const customerId = req.session.customer.id;
  const { vehicle_id, start_date, end_date, payment_method, payment_info } = req.body;

  if (!vehicle_id || !start_date || !end_date) {
    return res.status(400).json({
      success: false,
      message: 'Vehicle ID, start date, and end date are required.'
    });
  }

  if (!payment_info || !payment_info.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Please provide simulated payment details (e.g. dummy Card or UPI).'
    });
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  if (start_date < todayStr || end_date < start_date) {
    return res.status(400).json({
      success: false,
      message: 'Invalid booking date range.'
    });
  }

  // 1. Fetch vehicle
  db.get('SELECT * FROM Vehicles WHERE id = ?', [vehicle_id], (vErr, vehicle) => {
    if (vErr || !vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found.' });
    }

    // 2. Re-verify overlap against confirmed bookings to prevent race conditions
    const overlapQuery = `
      SELECT id FROM Bookings
      WHERE vehicle_id = ?
        AND booking_status = 'CONFIRMED'
        AND (start_date <= ? AND end_date >= ?)
      LIMIT 1
    `;

    db.get(overlapQuery, [vehicle_id, end_date, start_date], (overlapErr, overlappingBooking) => {
      if (overlapErr) {
        return res.status(500).json({ success: false, message: 'Database error verifying availability.' });
      }

      if (overlappingBooking) {
        return res.status(409).json({
          success: false,
          message: 'Vehicle was just reserved by another customer for these dates. Please choose different dates.'
        });
      }

      // 3. Calculate final totals
      const totalDays = calculateDays(start_date, end_date);
      const totalPrice = totalDays * vehicle.price_per_day;

      // 4. Simulated payment step succeeded -> Insert confirmed booking with status
      const insertBookingQuery = `
        INSERT INTO Bookings (customer_id, vehicle_id, start_date, end_date, total_days, total_price, booking_status, payment_status)
        VALUES (?, ?, ?, ?, ?, ?, 'CONFIRMED', 'PAID')
      `;

      db.run(
        insertBookingQuery,
        [customerId, vehicle_id, start_date, end_date, totalDays, totalPrice],
        function (insertErr) {
          if (insertErr) {
            console.error('Error inserting booking:', insertErr.message);
            return res.status(500).json({ success: false, message: 'Failed to save booking.' });
          }

          return res.status(201).json({
            success: true,
            message: 'Payment received! Booking successfully confirmed.',
            booking: {
              booking_id: this.lastID,
              vehicle_name: `${vehicle.name} (${vehicle.model})`,
              start_date,
              end_date,
              total_days: totalDays,
              total_price: totalPrice,
              booking_status: 'CONFIRMED',
              payment_status: 'PAID',
              payment_method: payment_method || 'Simulated Card/UPI'
            }
          });
        }
      );
    });
  });
});

/**
 * GET /api/bookings/my-bookings
 * Requires login: Fetch all bookings for logged-in customer
 */
router.get('/my-bookings', requireAuth, (req, res) => {
  const customerId = req.session.customer.id;

  const query = `
    SELECT 
      b.id,
      b.customer_id,
      b.vehicle_id,
      b.start_date,
      b.end_date,
      b.total_days,
      b.total_price,
      b.booking_status,
      b.payment_status,
      b.created_at,
      v.name AS vehicle_name,
      v.model AS vehicle_model,
      v.type AS vehicle_type,
      v.price_per_day,
      v.image_url,
      v.transmission,
      v.fuel_type
    FROM Bookings b
    JOIN Vehicles v ON b.vehicle_id = v.id
    WHERE b.customer_id = ?
    ORDER BY b.id DESC
  `;

  db.all(query, [customerId], (err, rows) => {
    if (err) {
      console.error('Error fetching customer bookings:', err.message);
      return res.status(500).json({ success: false, message: 'Failed to retrieve bookings.' });
    }

    return res.json({
      success: true,
      bookings: rows
    });
  });
});

/**
 * POST /api/bookings/:id/cancel
 * Requires login: Cancel a customer's own booking
 */
router.post('/:id/cancel', requireAuth, (req, res) => {
  const bookingId = req.params.id;
  const customerId = req.session.customer.id;

  // First check if booking exists and belongs to this customer
  db.get('SELECT * FROM Bookings WHERE id = ? AND customer_id = ?', [bookingId, customerId], (err, booking) => {
    if (err) {
      console.error('Error checking booking for cancellation:', err.message);
      return res.status(500).json({ success: false, message: 'Database error.' });
    }

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or does not belong to your account.'
      });
    }

    if (booking.booking_status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        message: 'This booking is already cancelled.'
      });
    }

    // Check if the rental end date has already passed
    const todayStr = new Date().toISOString().slice(0, 10);
    if (booking.end_date < todayStr) {
      return res.status(400).json({
        success: false,
        message: 'Cancellation is not allowed because the rental end date has already passed.'
      });
    }

    // Update booking_status to CANCELLED
    db.run(
      'UPDATE Bookings SET booking_status = "CANCELLED" WHERE id = ?',
      [bookingId],
      function (updateErr) {
        if (updateErr) {
          console.error('Error cancelling booking:', updateErr.message);
          return res.status(500).json({ success: false, message: 'Failed to cancel booking.' });
        }

        return res.json({
          success: true,
          message: 'Booking cancelled successfully. Simulated refund initiated.'
        });
      }
    );
  });
});

module.exports = router;

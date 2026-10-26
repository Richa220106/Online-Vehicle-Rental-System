const express = require('express');
const router = express.Router();
const db = require('../database/db');

/**
 * GET /api/vehicles/cities/list
 * Get list of all distinct cities where vehicles are available
 */
router.get('/cities/list', (req, res) => {
  db.all('SELECT DISTINCT city FROM Vehicles WHERE city IS NOT NULL AND status = "Available" ORDER BY city ASC', (err, rows) => {
    if (err) {
      console.error('Error fetching cities:', err.message);
      return res.status(500).json({ success: false, message: 'Database error fetching cities.' });
    }
    const cities = rows.map(r => r.city);
    return res.json({ success: true, cities });
  });
});

/**
 * GET /api/vehicles
 * Get all vehicles with optional filtering by type, city, search, and date availability
 */
router.get('/', (req, res) => {
  const { type, search, start_date, end_date, city } = req.query;
  let query = 'SELECT * FROM Vehicles WHERE status = "Available"';
  const params = [];

  // Filter by City
  if (city && city !== 'All') {
    query += ' AND city = ?';
    params.push(city.trim());
  }

  // Filter by Vehicle Type (Category)
  if (type && type !== 'All') {
    query += ' AND type = ?';
    params.push(type);
  }

  // Filter by Keyword Search
  if (search && search.trim()) {
    query += ' AND (name LIKE ? OR model LIKE ?)';
    params.push(`%${search.trim()}%`, `%${search.trim()}%`);
  }

  // Filter only vehicles that are NOT booked during the selected date range
  if (start_date && end_date) {
    query += ` AND NOT EXISTS (
      SELECT 1 FROM Bookings b
      WHERE b.vehicle_id = Vehicles.id
        AND b.booking_status = 'CONFIRMED'
        AND (b.start_date <= ? AND b.end_date >= ?)
    )`;
    params.push(end_date, start_date);
  }

  query += ' ORDER BY price_per_day ASC';

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Error fetching vehicles:', err.message);
      return res.status(500).json({ success: false, message: 'Database error fetching vehicles.' });
    }
    return res.json({ success: true, vehicles: rows });
  });
});

/**
 * GET /api/vehicles/:id
 * Get single vehicle details
 */
router.get('/:id', (req, res) => {
  const vehicleId = req.params.id;

  db.get('SELECT * FROM Vehicles WHERE id = ?', [vehicleId], (err, vehicle) => {
    if (err) {
      console.error('Error fetching vehicle by id:', err.message);
      return res.status(500).json({ success: false, message: 'Database error fetching vehicle.' });
    }

    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found.' });
    }

    return res.json({ success: true, vehicle });
  });
});

module.exports = router;

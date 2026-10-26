const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Resolve path to database file
const dbPath = path.resolve(__dirname, 'rental.db');

// Initialize SQLite database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to SQLite database:', err.message);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
  }
});

// Enable foreign key constraints in SQLite
db.run('PRAGMA foreign_keys = ON;');

// Initialize tables and seed initial sample data
function initDatabase() {
  db.serialize(() => {
    // 1. Customers Table
    db.run(`
      CREATE TABLE IF NOT EXISTS Customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        phone TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Vehicles Table
    db.run(`
      CREATE TABLE IF NOT EXISTS Vehicles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        model TEXT NOT NULL,
        type TEXT NOT NULL,
        price_per_day REAL NOT NULL,
        fuel_type TEXT DEFAULT 'Petrol',
        transmission TEXT DEFAULT 'Automatic',
        seats INTEGER DEFAULT 5,
        image_url TEXT,
        status TEXT DEFAULT 'Available',
        city TEXT DEFAULT 'Mumbai'
      )
    `);

    // Ensure migration for Vehicles table if city column needs updating
    db.all("PRAGMA table_info(Vehicles)", (err, columns) => {
      if (!err && columns) {
        const columnNames = columns.map(c => c.name);
        if (!columnNames.includes('city')) {
          db.run("ALTER TABLE Vehicles ADD COLUMN city TEXT DEFAULT 'Mumbai'", (alterErr) => {
            if (!alterErr) {
              console.log("Added city column to Vehicles table.");
              db.run("UPDATE Vehicles SET city = 'Mumbai' WHERE name LIKE '%Honda City%' OR name LIKE '%Swift%' OR name LIKE '%Mercedes%'");
              db.run("UPDATE Vehicles SET city = 'Delhi' WHERE name LIKE '%Fortuner%' OR name LIKE '%BMW%'");
              db.run("UPDATE Vehicles SET city = 'Bangalore' WHERE name LIKE '%Creta%' OR name LIKE '%Thar%'");
              db.run("UPDATE Vehicles SET city = 'Pune' WHERE name LIKE '%Hunter%' OR name LIKE '%Enfield%'");
            }
          });
        } else {
          // Ensure diverse cities are assigned to existing seeded vehicles
          db.run("UPDATE Vehicles SET city = 'Mumbai' WHERE (name LIKE '%Honda City%' OR name LIKE '%Swift%' OR name LIKE '%Mercedes%') AND (city IS NULL OR city = 'Mumbai')");
          db.run("UPDATE Vehicles SET city = 'Delhi' WHERE name LIKE '%Fortuner%' OR name LIKE '%BMW%'");
          db.run("UPDATE Vehicles SET city = 'Bangalore' WHERE name LIKE '%Creta%' OR name LIKE '%Thar%'");
          db.run("UPDATE Vehicles SET city = 'Pune' WHERE name LIKE '%Hunter%' OR name LIKE '%Enfield%'");
        }
      }
    });

    // 3. Bookings Table
    db.run(`
      CREATE TABLE IF NOT EXISTS Bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL,
        vehicle_id INTEGER NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        total_days INTEGER NOT NULL,
        total_price REAL NOT NULL,
        booking_status TEXT DEFAULT 'CONFIRMED',
        payment_status TEXT DEFAULT 'PAID',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES Customers(id) ON DELETE CASCADE,
        FOREIGN KEY (vehicle_id) REFERENCES Vehicles(id) ON DELETE CASCADE
      )
    `);

    // Ensure migration for existing Bookings table if columns need updating
    db.all("PRAGMA table_info(Bookings)", (err, columns) => {
      if (!err && columns) {
        const columnNames = columns.map(c => c.name);
        if (!columnNames.includes('booking_status')) {
          db.run("ALTER TABLE Bookings ADD COLUMN booking_status TEXT DEFAULT 'CONFIRMED'", (alterErr) => {
            if (!alterErr) {
              console.log("Added booking_status column to Bookings table.");
              db.run("UPDATE Bookings SET booking_status = 'CONFIRMED' WHERE booking_status IS NULL");
              db.run("UPDATE Bookings SET booking_status = 'CANCELLED' WHERE payment_status = 'Cancelled'");
              db.run("UPDATE Bookings SET payment_status = 'PAID' WHERE payment_status = 'Paid'");
            }
          });
        } else {
          db.run("UPDATE Bookings SET payment_status = 'PAID' WHERE payment_status = 'Paid'");
          db.run("UPDATE Bookings SET booking_status = 'CANCELLED' WHERE payment_status = 'Cancelled'");
        }
      }
    });

    // Check if Vehicles table already has records; if not, seed realistic sample vehicles
    db.get('SELECT COUNT(*) AS count FROM Vehicles', (err, row) => {
      if (err) {
        console.error('Error checking vehicles count:', err.message);
        return;
      }

      if (row.count === 0) {
        console.log('Seeding initial vehicle fleet...');
        const sampleVehicles = [
          [
            'Honda City',
            '2024 V-Gen',
            'Sedan',
            2200,
            'Petrol',
            'Automatic',
            5,
            'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=800&q=80',
            'Available',
            'Mumbai'
          ],
          [
            'Toyota Fortuner 4x4',
            '2023 Legender',
            'SUV',
            4500,
            'Diesel',
            'Automatic',
            7,
            'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80',
            'Available',
            'Delhi'
          ],
          [
            'Hyundai Creta',
            '2024 SX(O)',
            'SUV',
            2800,
            'Petrol',
            'Automatic',
            5,
            'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
            'Available',
            'Bangalore'
          ],
          [
            'Maruti Suzuki Swift',
            '2023 ZXi',
            'Hatchback',
            1500,
            'Petrol',
            'Manual',
            5,
            'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=800&q=80',
            'Available',
            'Mumbai'
          ],
          [
            'BMW 3 Series Gran Limousine',
            '2024 330Li',
            'Luxury',
            7500,
            'Petrol',
            'Automatic',
            5,
            'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=800&q=80',
            'Available',
            'Delhi'
          ],
          [
            'Royal Enfield Hunter 350',
            '2024 Metro',
            'Bike',
            900,
            'Petrol',
            'Manual',
            2,
            'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80',
            'Available',
            'Pune'
          ],
          [
            'Mercedes-Benz C-Class',
            '2024 C200',
            'Luxury',
            8500,
            'Petrol',
            'Automatic',
            5,
            'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80',
            'Available',
            'Mumbai'
          ],
          [
            'Mahindra Thar 4x4',
            '2024 Hard Top',
            'SUV',
            3500,
            'Diesel',
            'Manual',
            4,
            'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80',
            'Available',
            'Bangalore'
          ]
        ];

        const insertStmt = db.prepare(`
          INSERT INTO Vehicles (name, model, type, price_per_day, fuel_type, transmission, seats, image_url, status, city)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        sampleVehicles.forEach((vehicle) => {
          insertStmt.run(vehicle);
        });

        insertStmt.finalize(() => {
          console.log('Sample vehicle fleet seeded successfully.');
        });
      }
    });
  });
}

// Run initialization
initDatabase();

module.exports = db;

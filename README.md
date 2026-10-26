# 🚗 Online Vehicle Rental System

A full-stack web application for renting vehicles online. Customers can browse vehicles by city and date, book them, and manage their reservations — all through a clean, modern interface.

---

## ✨ Features

- **Customer Authentication** — Register, log in, and manage your profile securely.
- **Vehicle Catalog** — Browse all available vehicles with search and category filters.
- **City Filter** — Select a city (Mumbai, Delhi, Bangalore, Pune) to see local vehicles only.
- **Date Availability Check** — Enter pickup and return dates to see only vehicles available during that period.
- **Vehicle Details Page** — View full specifications, amenities, and city info for each vehicle.
- **Online Booking** — Book a vehicle directly from the catalog or the details page.
- **My Bookings** — View all bookings with separate `Booking Status` (CONFIRMED / CANCELLED) and `Payment Status` (PAID / FAILED).
- **Cancellation Guard** — Cancellations are blocked for bookings whose rental end date has already passed.
- **Admin Panel** — Admins can manage vehicles, view all bookings, and oversee the system.

---

## 🛠️ Tech Stack

| Layer      | Technology               |
|------------|--------------------------|
| Backend    | Node.js, Express.js      |
| Database   | SQLite (via `better-sqlite3`) |
| Frontend   | HTML, CSS, JavaScript    |
| Auth       | `express-session`, `bcryptjs` |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher recommended)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   cd YOUR_REPO_NAME
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Open your browser** and go to:
   ```
   http://localhost:3000
   ```

> The SQLite database and all tables are created automatically on first run. Sample vehicle data is seeded automatically.

---

## 📁 Project Structure

```
se project/
├── database/
│   └── db.js              # Database setup, schema creation & seeding
├── public/                # Frontend static files
│   ├── index.html         # Landing page
│   ├── vehicles.html      # Vehicle catalog with filters
│   ├── vehicle-details.html # Single vehicle detail view
│   ├── my-bookings.html   # Customer bookings management
│   ├── admin.html         # Admin dashboard
│   └── js/                # Frontend JavaScript modules
│       ├── vehicles.js
│       ├── vehicle-details.js
│       ├── my-bookings.js
│       └── ...
├── routes/
│   ├── auth.js            # Login / Register routes
│   ├── vehicles.js        # Vehicle API routes
│   └── bookings.js        # Booking API routes
├── server.js              # Express app entry point
├── package.json
├── .gitignore
└── README.md
```

---

## 🔑 Default Admin Credentials

> If sample admin data is seeded automatically, use these credentials:

| Field    | Value              |
|----------|--------------------|
| Email    | admin@rental.com   |
| Password | admin123           |

*(Change these after first login in a production environment.)*

---

## 📸 Key Pages

| URL | Description |
|-----|-------------|
| `/` | Home / Landing page |
| `/vehicles.html` | Browse & filter vehicles |
| `/vehicle-details.html?id=<ID>` | Single vehicle detail view |
| `/my-bookings.html` | Customer booking history |
| `/admin.html` | Admin panel |

---

## 📝 Notes

- The `database/rental.db` file is excluded from version control via `.gitignore`. It will be created fresh on first run.
- All SQL queries use parameterized statements to prevent SQL injection.
- Foreign key constraints are enabled via `PRAGMA foreign_keys = ON`.

---

## 📄 License

This project is for educational purposes (Software Engineering coursework).

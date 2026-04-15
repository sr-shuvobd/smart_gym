const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');

// Remove existing DB file if you want to start fresh (optional)
// if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    
    db.serialize(() => {
      // 1. Members Table
      db.run(`CREATE TABLE IF NOT EXISTS members (
        id TEXT PRIMARY KEY,
        name TEXT,
        age TEXT,
        email TEXT UNIQUE,
        password TEXT,
        contact TEXT,
        plan TEXT,
        start TEXT,
        expiry TEXT,
        active INTEGER
      )`);

      // 2. Trainers Table
      db.run(`CREATE TABLE IF NOT EXISTS trainers (
        id TEXT PRIMARY KEY,
        name TEXT,
        age TEXT,
        email TEXT UNIQUE,
        password TEXT,
        contact TEXT,
        specialty TEXT
      )`);

      // 3. Sessions (Scheduling) Table
      db.run(`CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        memberId TEXT,
        trainerId TEXT,
        time TEXT
      )`);

      // 4. Assigned Plans Table
      db.run(`CREATE TABLE IF NOT EXISTS plans (
        id TEXT PRIMARY KEY,
        memberId TEXT,
        workout TEXT,
        diet TEXT,
        assignedAt TEXT
      )`);

      // 5. Payments Table
      db.run(`CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY,
        memberId TEXT,
        amount REAL,
        method TEXT,
        at TEXT
      )`);

      // 6. Packages Table
      db.run(`CREATE TABLE IF NOT EXISTS packages (
        id TEXT PRIMARY KEY,
        name TEXT,
        price REAL,
        description TEXT
      )`, () => {
        // Initial seeding for packages if empty
        db.get("SELECT COUNT(*) as count FROM packages", (err, row) => {
          if (!err && row.count === 0) {
            db.run(`INSERT INTO packages (id, name, price, description) VALUES 
              ('monthly', 'Monthly Plan', 2500, 'Full access for 1 month'),
              ('quarterly', 'Quarterly Plan', 7000, 'Full access for 3 months'),
              ('yearly', 'Yearly Plan', 25000, 'Full access for 1 year')`);
          }
        });
      });

      console.log('All tables created successfully.');
    });
  }
});

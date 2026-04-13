const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Serve static files from the current directory (HTML, CSS, JS)
app.use(express.static(path.join(__dirname)));

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('Database connection error:', err.message);
  else console.log('Connected to SQLite database endpoint.');
});

// Helper for Promisifying db.all and db.run
const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};
const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

// ---------------- API ROUTES ----------------

// --- AUTH ---
app.post('/api/login', async (req, res) => {
  const { email, password, role } = req.body;
  
  if (role === 'admin' && email === 'srs@gmail.com' && password === '1234') {
    return res.json({ success: true, user: { name: 'Admin', role: 'admin', email: 'srs@gmail.com' } });
  }

  try {
    let table = role === 'member' ? 'members' : 'trainers';
    const users = await query(`SELECT * FROM ${table} WHERE email = ?`, [email]);
    if (users.length > 0) {
      const user = users[0];
      const match = await bcrypt.compare(password, user.password);
      if (match) {
        // Do not send password back
        delete user.password;
        user.role = role;
        res.json({ success: true, user });
      } else {
        res.json({ success: false, message: 'Invalid credentials' });
      }
    } else {
      res.json({ success: false, message: 'User not found' });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- MEMBERS ---
app.get('/api/members', async (req, res) => {
  try {
    const members = await query('SELECT id, name, age, email, contact, plan, start, expiry, active FROM members');
    res.json(members);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/members', async (req, res) => {
  const { id, name, age, email, password, contact, plan, start, expiry, active } = req.body;
  try {
    const existing = await query('SELECT email FROM members WHERE email = ?', [email]);
    if (existing.length > 0) return res.status(400).json({ error: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 10);
    await run(`INSERT INTO members (id, name, age, email, password, contact, plan, start, expiry, active) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
      [id, name, age, email, hashedPassword, contact, plan, start, expiry, active ? 1 : 0]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/members/:id', async (req, res) => {
  const updates = [];
  const params = [];
  for (const [key, value] of Object.entries(req.body)) {
    updates.push(`${key} = ?`);
    params.push(value);
  }
  params.push(req.params.id);
  
  if (updates.length === 0) return res.json({ success: true });

  try {
    await run(`UPDATE members SET ${updates.join(', ')} WHERE id = ?`, params);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/members/:id', async (req, res) => {
  try {
    await run('DELETE FROM members WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- TRAINERS ---
app.get('/api/trainers', async (req, res) => {
  try {
    const trainers = await query('SELECT id, name, age, email, contact, specialty FROM trainers');
    res.json(trainers);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/trainers', async (req, res) => {
  const { id, name, age, email, password, contact, specialty } = req.body;
  try {
    const existing = await query('SELECT email FROM trainers WHERE email = ?', [email]);
    if (existing.length > 0) return res.status(400).json({ error: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 10);
    await run(`INSERT INTO trainers (id, name, age, email, password, contact, specialty) 
               VALUES (?, ?, ?, ?, ?, ?, ?)`, 
      [id, name, age, email, hashedPassword, contact, specialty]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/trainers/:id', async (req, res) => {
  const updates = [];
  const params = [];
  for (const [key, value] of Object.entries(req.body)) {
    updates.push(`${key} = ?`);
    params.push(value);
  }
  params.push(req.params.id);
  if (updates.length === 0) return res.json({ success: true });

  try {
    await run(`UPDATE trainers SET ${updates.join(', ')} WHERE id = ?`, params);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/trainers/:id', async (req, res) => {
  try {
    await run('DELETE FROM trainers WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- SESSIONS ---
app.get('/api/sessions', async (req, res) => {
  try {
    const sessions = await query('SELECT * FROM sessions');
    res.json(sessions);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/sessions', async (req, res) => {
  const { id, memberId, trainerId, time } = req.body;
  try {
    const existing = await query('SELECT * FROM sessions WHERE trainerId = ? AND time = ?', [trainerId, time]);
    if (existing.length > 0) return res.status(400).json({ error: 'Trainer is busy at this time' });

    await run('INSERT INTO sessions (id, memberId, trainerId, time) VALUES (?, ?, ?, ?)', 
      [id, memberId, trainerId, time]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- PLANS ---
app.get('/api/plans', async (req, res) => {
  try {
    const plans = await query('SELECT * FROM plans');
    res.json(plans);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/plans', async (req, res) => {
  const { id, memberId, workout, diet, assignedAt } = req.body;
  try {
    await run('INSERT INTO plans (id, memberId, workout, diet, assignedAt) VALUES (?, ?, ?, ?, ?)', 
      [id, memberId, workout, diet, assignedAt]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- PAYMENTS ---
app.get('/api/payments', async (req, res) => {
  try {
    const payments = await query('SELECT * FROM payments');
    res.json(payments);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/payments', async (req, res) => {
  const { id, memberId, amount, method, at } = req.body;
  try {
    await run('INSERT INTO payments (id, memberId, amount, method, at) VALUES (?, ?, ?, ?, ?)', 
      [id, memberId, amount, method, at]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Initialize dummy defaults if trainers are empty
app.get('/api/init', async (req, res) => {
  try {
    const trainers = await query('SELECT * FROM trainers');
    if (trainers.length === 0) {
      const hash = await bcrypt.hash('password', 10);
      await run(`INSERT INTO trainers (id, name, email, password, specialty) VALUES ('t1', 'Arif Hasan', 'arif@gym.com', '${hash}', 'Strength')`);
      await run(`INSERT INTO trainers (id, name, email, password, specialty) VALUES ('t2', 'Nusrat Jahan', 'nusrat@gym.com', '${hash}', 'Yoga')`);
      await run(`INSERT INTO trainers (id, name, email, password, specialty) VALUES ('t3', 'Rafi Ahmed', 'rafi@gym.com', '${hash}', 'Cardio')`);
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.listen(port, () => {
  console.log(`Smart Gym Backend running at http://localhost:${port}`);
});

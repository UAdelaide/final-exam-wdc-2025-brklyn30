const express = require('express');
const path = require('path');
require('dotenv').config();
const db = require('./models/db.js');

const app = express();

// Managing user sessions
const session = require('express-session');

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '/public')));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'walksecret',
  resave: false,
  saveUninitialized: false
}));

// Routes
const walkRoutes = require('./routes/walkRoutes');
const userRoutes = require('./routes/userRoutes');
const dogRoutes = require('./routes/dogRoutes.js');

app.use('/api/walks', walkRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dogs', dogRoutes);


// Login route to authenticate user and start session
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const [rows] = await db.query('SELECT user_id, username, password_hash, role FROM Users WHERE username = ?', [username]);

    if (rows.length === 0) {
      return res.status(401).send('Invalid credentials');
    }

    const user = rows[0];

    // Simple plain-text password check:
    if (user.password_hash !== password) {
      return res.status(401).send('Invalid credentials');
    }

    req.session.user = {
      user_id: user.user_id,
      username: user.username,
      role: user.role
    };

    if (user.role === 'owner') {
      return res.redirect('/owner-dashboard.html');
    } else {
      return res.redirect('/walker-dashboard.html');
    }
  } catch (error) {
    console.error('Login DB error:', error);
    return res.status(500).send('Internal Server Error');
  }
});

//logout session
app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send('Logout failed');
    }
    res.clearCookie('connect.sid'); // clears session cookie
    res.redirect('/'); // back to login page
  });
});

// Export the app instead of listening here
module.exports = app;
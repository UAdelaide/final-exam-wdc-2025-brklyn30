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
    // Query DB for user with given username
    const [rows] = await db.query('SELECT * FROM Users WHERE username = ?', [username]);

    if (rows.length === 0) {
      // No user found
      return res.status(401).send('Invalid credentials');
    }

    const user = rows[0];

    // Check password matches
    if (user.password !== password) {
      return res.status(401).send('Invalid credentials');
    }

    // Set session user data
    req.session.user = {
      user_id: user.user_id,
      username: user.username,
      role: user.role
    };

    // Redirect based on role
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
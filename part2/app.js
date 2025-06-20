const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();

// Managing user sessions
const session = require('express-session');

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '/public')));

app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'walksecret',
  resave: false,
  saveUninitialized: false
}));

// Routes
const walkRoutes = require('./routes/walkRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/api/walks', walkRoutes);
app.use('/api/users', userRoutes);

// Login Logic
const users = [
  { username: 'owner1', password: '123', role: 'owner' },
  { username: 'walker1', password: '456', role: 'walker' }
];

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);

  if (!user) {
    return res.status(401).send('Invalid credentials');
  }

  req.session.user = {
    username: user.username,
    role: user.role
  };

  if (user.role === 'owner') {
    return res.redirect('/owner-dashboard.html');
  } else {
    return res.redirect('/walker-dashboard.html');
  }
});

// Export the app instead of listening here
module.exports = app;
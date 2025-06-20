var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mysql = require('mysql2/promise');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

let db;

(async () => {
  try {
    // Connect to MySQL without specifying a database
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '' // Set your MySQL root password
    });

    // Create the database if it doesn't exist
    await connection.query('CREATE DATABASE IF NOT EXISTS test1');
    await connection.end();

    // Now connect to the created database
    db = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'test1'
    });

    // Create a table if it doesn't exist
    // await db.execute(`
    //   CREATE TABLE IF NOT EXISTS books (
    //     id INT AUTO_INCREMENT PRIMARY KEY,
    //     title VARCHAR(255),
    //     author VARCHAR(255)
    //   )
    // `);

    await db.execute(`CREATE TABLE IF NOT EXISTS Walkers (walker_username VARCHAR(255) PRIMARY KEY)`);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS Dogs (
        dog_id INT AUTO_INCREMENT PRIMARY KEY,
        dog_name VARCHAR(255),
        size VARCHAR(255),
        owner_username VARCHAR(255)
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS WalkRequests (
        request_id INT AUTO_INCREMENT PRIMARY KEY,
        dog_name VARCHAR(255),
        requested_time DATETIME,
        duration_minutes INT,
        location VARCHAR(255),
        owner_username VARCHAR(255),
        walker_username VARCHAR(255),
        status VARCHAR(50)
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS WalkRatings (
        rating_id INT AUTO_INCREMENT PRIMARY KEY,
        walker_username VARCHAR(255),
        rating INT,
        request_id INT
      )
    `);

    // Seed data
    const [walkerRows] = await db.execute('SELECT COUNT(*) AS count FROM Walkers');
    if (walkerRows[0].count === 0) {
      await db.execute(`INSERT INTO Walkers (walker_username) VALUES ('bobwalker'), ('newwalker')`);
    }

    const [dogRows] = await db.execute('SELECT COUNT(*) AS count FROM Dogs');
    if (dogRows[0].count === 0) {
      await db.execute(`
        INSERT INTO Dogs (dog_name, size, owner_username) VALUES
        ('Max', 'medium', 'alice123'),
        ('Bella', 'small', 'carol123'),
        ('Rocky', 'large', 'jason123'),
        ('Luna', 'medium', 'symba123'),
        ('Daisy', 'small', 'kate123')
      `);
    }

    const [requestRows] = await db.execute('SELECT COUNT(*) AS count FROM WalkRequests');
    if (requestRows[0].count === 0) {
      await db.execute(`
        INSERT INTO WalkRequests (dog_name, requested_time, duration_minutes, location, owner_username, walker_username, status) VALUES
        ('Max', '2025-06-10 08:00:00', 30, 'Parklands', 'alice123', 'bobwalker', 'completed'),
        ('Bella', '2025-06-10 09:30:00', 45, 'Beachside Ave', 'carol123', 'bobwalker', 'completed'),
        ('Rocky', '2025-06-11 07:15:00', 60, 'Lake View', 'jason123', NULL, 'open'),
        ('Luna', '2025-06-11 10:00:00', 30, 'Central Park', 'symba123', NULL, 'open'),
        ('Daisy', '2025-06-12 11:00:00', 30, 'High Street', 'kate123', NULL, 'open')
      `);
    }

    const [ratingRows] = await db.execute('SELECT COUNT(*) AS count FROM WalkRatings');
    if (ratingRows[0].count === 0) {
      await db.execute(`
        INSERT INTO WalkRatings (walker_username, rating, request_id) VALUES
        ('bobwalker', 5, 1),
        ('bobwalker', 4, 2)
      `);
    }

    console.log('Database initialized');
  } catch (err) {
    console.error('DB setup failed:', err);
  }
})();

app.get('/api/dogs', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT dog_name, size, owner_username FROM Dogs');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dogs' });
  }
});

app.get('/api/walkrequests/open', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT request_id, dog_name, requested_time, duration_minutes, location, owner_username
      FROM WalkRequests
      WHERE status = 'open'
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch open walk requests' });
  }
});

app.get('/api/walkers/summary', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT
        w.walker_username,
        COUNT(r.rating_id) AS total_ratings,
        ROUND(AVG(r.rating), 1) AS average_rating,
        COUNT(CASE WHEN wr.status = 'completed' THEN 1 END) AS completed_walks
      FROM Walkers w
      LEFT JOIN WalkRatings r ON w.walker_username = r.walker_username
      LEFT JOIN WalkRequests wr ON wr.walker_username = w.walker_username AND wr.status = 'completed'
      GROUP BY w.walker_username
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch walker summary' });
  }
});

app.use(express.static(path.join(__dirname, 'public')));

module.exports = app;
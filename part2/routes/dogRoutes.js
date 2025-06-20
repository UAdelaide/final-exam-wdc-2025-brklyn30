const express = require('express');
const router = express.Router();
const db = require('../models/db');

router.get('/dogs', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT dog_id, owner_id, name, size FROM Dogs');
    console.log('Dogs fetched:', rows);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching dogs:', error);
    res.status(500).json({ error: 'Failed to fetch dogs' });
  }
});


module.exports = router;

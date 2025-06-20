const express = require('express');
const router = express.Router();
const db = require('../models/db');


// GET all walk requests (for walkers to view)
router.get('/dogs', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT dog_id, owner_id, name, size FROM Dogs');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching dogs:', error);
    res.status(500).json({ error: 'Failed to fetch dogs' });
  }
});

// GET a new walk request (from owner)
router.get('/requests', async (req, res) => {
  try {
    // Example query to get walk requests related to logged-in user
    const userId = req.session.user_id;  // or however you get current user ID
    const [rows] = await db.query(
      `SELECT wr.request_id, wr.dog_id, wr.status, d.name AS dog_name
       FROM WalkRequests wr
       JOIN Dogs d ON wr.dog_id = d.dog_id
       WHERE wr.walker_id = ?`,
      [userId]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching walk requests:', error);
    res.status(500).json({ error: 'Failed to fetch walk requests' });
  }
});

// POST an application to walk a dog (from walker)
router.post('/:id/apply', async (req, res) => {
  const requestId = req.params.id;
  const { walker_id } = req.body;

  try {
    await db.query(`
      INSERT INTO WalkApplications (request_id, walker_id)
      VALUES (?, ?)
    `, [requestId, walker_id]);

    await db.query(`
      UPDATE WalkRequests
      SET status = 'accepted'
      WHERE request_id = ?
    `, [requestId]);

    res.status(201).json({ message: 'Application submitted' });
  } catch (error) {
    console.error('SQL Error:', error);
    res.status(500).json({ error: 'Failed to apply for walk' });
  }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const mysql = require('../db/mysql');
const getMongo = require('../db/mongo');

// Get all routes
router.get('/routes', (req,res) => {
    mysql.query("SELECT * FROM routes", (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// Get stops for a route
router.get('/stops/:route_id', (req, res) => {
    const { route_id } = req.params;
    const sql = `SELECT s.* FROM stops s
    JOIN route_stops rs ON s.id = rs.stop_id
    WHERE rs.route_id = ?
    ORDER BY rs.sequence ASC`;
    
    mysql.query(sql, [route_id], (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// Get schedule from MongoDB
router.get('/schedule/:route_id', async (req, res) => {
    const db = getMongo();
    const collection = db.collection('schedules');
    const { route_id } = req.params;
    const schedule = await collection.findOne({ route_id });
    res.json(schedule || {});
});

// Update schedule
router.post('/schedule/:route_id', async (req, res) => {
    const db = getMongo();
    const collection = db.collection('schedules');
    const { route_id } = req.params;
    const { schedule } = req.body;
    await collection.updateOne(
        { route_id },
        { $set: { schedule } },
        { upsert: true }
    );
    res.sendStatus(200);
});

module.exports = router;

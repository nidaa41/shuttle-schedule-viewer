const { connectMongo, getMongoDB } = require('./db/mongo');
const path = require('path');
const express = require('express');
const mysql = require('./db/mysql');

const app = express();

const session = require('express-session');

// Using express-session
app.use(session({
    secret: '$yghffs',
    resave: false,
    saveUninitialized: true,
}));

connectMongo();

const port = 3000;
app.use(express.json());

// Serving static files
app.use('/static', express.static(path.join(__dirname, '../frontend/static')));

// Serving the HTML pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

app.get('/admin.html', (req, res) => {                                
    if (req.session && req.session.isAdmin) {
        res.sendFile(path.join(__dirname, '../frontend/admin.html'));
    } else {
        res.redirect('/login.html');
    }
});                                                                             


// ROUTES:  

// Test MySQL routes
app.get('/test-mysql', (req, res) => {
    mysql.query('SELECT * FROM routes', (err, results) => {
        if (err) {
            console.error('MySQL error:', err);
            return res.status(500).send('MySQL Error');
        }
        res.json(results);
    });
});

// Test MongoDB
app.get('/test-mongo', async (req, res) => {
    const db = getMongoDB();
    const schedules = await db.collection('schedules').find({}).toArray();
    res.json(schedules);
});

// Fetch all stops 
app.get('/test-stops', (req, res) => {
    mysql.query('SELECT * FROM stops', (err, results) => {
        if (err) return res.status(500).send('MySQL Error');
        res.json(results);
    });
});

// Get stops for a specific route
app.get('/routes/:id/stops', (req, res) => {
    const routeId = Number(req.params.id);
    const query = `SELECT stops.id AS stop_id, stops.name, route_stops.sequence
    FROM route_stops
    JOIN stops ON route_stops.stop_id = stops.id
    WHERE route_stops.route_id = ?
    ORDER BY route_stops.sequence ASC`;

    mysql.query(query, [routeId], (err, results) => {
        if (err) {
            console.error('MySQL Error:', err);
            return res.status(500).send('Error fetching stops');
        }
        res.json(results);
    });
});

// Update stops for a route
app.post('/routes/:id/stops', (req, res) => {
    const routeId = Number(req.params.id);
    const stops = req.body.stops;

    const updatePromises = stops.map(stop => {
        const query = `UPDATE stops
        JOIN route_stops ON stops.id = route_stops.stop_id
        SET stops.name = ?, route_stops.sequence = ?
        WHERE stops.id = ? AND route_stops.route_id = ?`;
        
        const values = [stop.name, stop.sequence, stop.stop_id, routeId];
        
        return new Promise((resolve, reject) => {
            mysql.query(query, values, (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    });

    Promise.all(updatePromises)
    .then(() => res.sendStatus(200))
    .catch(err => {
        console.error('Error updating stops:', err);
        res.status(500).send('Error updating stops');
    });
});

// Get schedule for a route (MongoDB)
app.get('/routes/:id/schedule', async (req, res) => {
    const routeId = Number(req.params.id);
    const db = getMongoDB();
    
    try {
        const schedule = await db.collection('schedules').findOne({ route_id: routeId });
        
        if (!schedule) {
            return res.status(404).json({ error: 'Schedule not found' });
        }
        
        res.json(schedule);
    } catch (err) {
        console.error('Error fetching schedule:', err);
        res.status(500).send('Server Error');
    }
});

// Update schedule for a specific route
app.post('/routes/:id/schedule', async (req, res) => {       
    const routeId = Number(req.params.id);
    const db = getMongoDB();
    let { weekday, weekend, special } = req.body;
    
    try {
        // Convert to arrays if they are strings
        if (typeof weekday === 'string') weekday = weekday.split(',').map(s => s.trim());
        if (typeof weekend === 'string') weekend = weekend.split(',').map(s => s.trim());

        if (typeof special === 'string') {
            special = special.split('\n').map(entry => {
                const [date, times] = entry.split(':');
                return {
                    date: date.trim(),
                    times: times ? times.split(',').map(t => t.trim()) : [],
                };
            });
        }
        
        await db.collection('schedules').updateOne(
            { route_id: routeId },
            { $set: { route_id: routeId, weekday, weekend, special } },
            { upsert: true }
        );

    res.sendStatus(200);
    } catch (err) {
        console.error('Error updating schedule:', err);
        res.status(500).send('Error updating schedule');
    }
});

app.post('/admin-login', express.json(), (req, res) => {
  const { email, password } = req.body;

  const query = 'SELECT * FROM admins WHERE email = ? AND password = ?';
  mysql.query(query, [email, password], (err, results) => {
    if (err) {
      console.error('Login error:', err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }

    if (results.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // SET SESSION AFTER SUCCESSFUL LOGIN
    req.session.isAdmin = true;
    res.json({ success: true });
  });
});

// Logout admin
app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).send('Error logging out');
    }
    res.redirect('/');
  });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
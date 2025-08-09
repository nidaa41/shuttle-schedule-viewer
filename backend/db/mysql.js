const mysql = require("mysql2");

// Create a connection to the MySQL database
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'shuttle_schedule',
    port: 3307
});

// Connect to the database
connection.connect(err => {
    if(err) {
        console.error('MySQL Connection Failed: ', err.message);
        return;
    }
    console.log("Connected to MySQL");
});

module.exports = connection;
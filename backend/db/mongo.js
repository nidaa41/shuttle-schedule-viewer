const { MongoClient } = require('mongodb');

// MongoDB connection URI and client setup
const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);

let db;

// Connect to MongoDB and select the database
async function connectMongo() {
    try {
        await client.connect();
        db = client.db('shuttle_schedule_mongo');
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('MongoDB connection error:', error);
    }
}

// Return the connected MongoDB instance
function getMongoDB() {
    if (!db) {
        throw new Error("MongoDB not connected. Call connectMongo() first.");
    }
    return db;
}

module.exports = {
    connectMongo,
    getMongoDB
};

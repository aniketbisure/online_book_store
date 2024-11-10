
const { MongoClient } = require('mongodb');
const url = 'mongodb://localhost:27017/';
const client = new MongoClient(url);

async function main() {
    try {
        await client.connect();
        console.log("Connected successfully to the database server");
        
        const db = client.db("MERN");
        
        return db;
    } catch (err) {
        console.error("Error connecting to the database:", err);
        throw err;
    }
}

module.exports = main;

// MongoDB Configuration for Vercel Deployment
const { MongoClient } = require('mongodb');

// MongoDB connection string (use environment variable in production)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lpulive';

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  // Return cached connection if available
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  // Create new connection
  const client = await MongoClient.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const db = client.db('lpulive');

  // Cache the connection
  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

// Database collections
async function getCollections() {
  const { db } = await connectToDatabase();
  
  return {
    users: db.collection('users'),
    chats: db.collection('chats'),
    messages: db.collection('messages'),
    groups: db.collection('groups'),
    universityGroups: db.collection('university_groups'),
    announcements: db.collection('announcements')
  };
}

module.exports = {
  connectToDatabase,
  getCollections
};

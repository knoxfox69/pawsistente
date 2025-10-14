// Purpose: MongoDB connection and database utilities
// Context: Handles database connection and provides utilities for event management

import { MongoClient, Db } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const MONGODB_DB = process.env.MONGODB_DB || 'confuror_calendar';

let client: MongoClient;
let db: Db;

export async function connectToDatabase() {
  if (client && db) {
    return { client, db };
  }

  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(MONGODB_DB);
    
    console.log('Connected to MongoDB');
    return { client, db };
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

export async function getDatabase() {
  if (!db) {
    await connectToDatabase();
  }
  return db;
}

export async function closeDatabase() {
  if (client) {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

// Collection helpers
export async function getEventsCollection() {
  const database = await getDatabase();
  return database.collection('events');
}

export async function getUsersCollection() {
  const database = await getDatabase();
  return database.collection('users');
}

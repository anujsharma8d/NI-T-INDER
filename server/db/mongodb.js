import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DATABASE_NAME = process.env.DATABASE_NAME || 'nitinder';

let client;
let db;

export async function connectToDatabase() {
  if (client) {
    return db;
  }

  try {
    // MongoDB connection options with SSL configuration
    const options = {
      tls: true,
      tlsAllowInvalidCertificates: true,
      tlsAllowInvalidHostnames: true,
    };

    client = new MongoClient(MONGODB_URI, options);
    await client.connect();
    db = client.db(DATABASE_NAME);
    
    console.log(`[MongoDB] Connected to database: ${DATABASE_NAME}`);
    
    // Create indexes for better performance
    await createIndexes();
    
    return db;
  } catch (error) {
    console.error('[MongoDB] Connection error:', error);
    throw error;
  }
}

export async function closeDatabaseConnection() {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('[MongoDB] Connection closed');
  }
}

export function getDatabase() {
  if (!db) {
    throw new Error('Database not connected. Call connectToDatabase() first.');
  }
  return db;
}

async function createIndexes() {
  try {
    // Users indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    
    // Sessions indexes
    await db.collection('sessions').createIndex({ session_token: 1 });
    await db.collection('sessions').createIndex({ user_id: 1 });
    await db.collection('sessions').createIndex({ expires_at: 1 });
    
    // Profiles indexes
    await db.collection('profiles').createIndex({ user_id: 1 }, { unique: true });
    await db.collection('profiles').createIndex({ location: '2dsphere' });
    
    // Swipes indexes
    await db.collection('swipes').createIndex({ swiper_id: 1, swipee_id: 1 });
    await db.collection('swipes').createIndex({ created_at: 1 });
    
    // Matches indexes
    await db.collection('matches').createIndex({ user1_id: 1, user2_id: 1 }, { unique: true });
    
    // Conversations indexes
    await db.collection('conversations').createIndex({ match_id: 1 });
    
    // Messages indexes
    await db.collection('messages').createIndex({ conversation_id: 1, created_at: 1 });
    await db.collection('messages').createIndex({ sender_id: 1 });
    
    // Game sessions indexes
    await db.collection('game_sessions').createIndex({ match_id: 1 });
    
    // Game responses indexes
    await db.collection('game_responses').createIndex({ session_id: 1 });
    
    // Email OTPs indexes
    await db.collection('email_otps').createIndex({ email: 1, expires_at: 1 });
    
    console.log('[MongoDB] Indexes created successfully');
  } catch (error) {
    console.error('[MongoDB] Error creating indexes:', error);
  }
}

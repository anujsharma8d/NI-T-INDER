import { connectToDatabase, getDatabase } from './mongodb.js';

// Initialize database connection
let db;

export async function initializeDatabase() {
  try {
    db = await connectToDatabase();
    console.log('[DB] Database initialized successfully');
    return db;
  } catch (error) {
    console.error('[DB] Error initializing database:', error);
    throw error;
  }
}

export function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

// Export for backward compatibility
export { db as default };
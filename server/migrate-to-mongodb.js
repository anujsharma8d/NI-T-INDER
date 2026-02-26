import Database from 'better-sqlite3';
import { MongoClient } from 'mongodb';
import 'dotenv/config';

const SQLITE_DB = 'test.db';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DATABASE_NAME = process.env.DATABASE_NAME || 'nitinder';

async function migrateSQLiteToMongoDB() {
  console.log('🚀 Starting migration from SQLite to MongoDB...\n');

  // Connect to SQLite
  const sqlite = Database(SQLITE_DB);
  console.log('✓ Connected to SQLite database');

  // Connect to MongoDB
  const mongoClient = new MongoClient(MONGODB_URI);
  await mongoClient.connect();
  const mongodb = mongoClient.db(DATABASE_NAME);
  console.log('✓ Connected to MongoDB database\n');

  try {
    // Migrate Users
    console.log('Migrating users...');
    const users = sqlite.prepare('SELECT * FROM users').all();
    if (users.length > 0) {
      await mongodb.collection('users').insertMany(
        users.map(user => ({
          _id: user.id,
          email: user.email,
          password_hash: user.password_hash,
          created_at: user.created_at,
          deleted_at: user.deleted_at
        }))
      );
      console.log(`✓ Migrated ${users.length} users`);
    } else {
      console.log('  No users to migrate');
    }

    // Migrate Sessions
    console.log('Migrating sessions...');
    const sessions = sqlite.prepare('SELECT * FROM sessions').all();
    if (sessions.length > 0) {
      await mongodb.collection('sessions').insertMany(
        sessions.map(session => ({
          _id: session.id,
          user_id: session.user_id,
          session_token: session.session_token,
          created_at: session.created_at,
          expires_at: session.expires_at,
          revoked_at: session.revoked_at
        }))
      );
      console.log(`✓ Migrated ${sessions.length} sessions`);
    } else {
      console.log('  No sessions to migrate');
    }

    // Migrate Profiles
    console.log('Migrating profiles...');
    const profiles = sqlite.prepare('SELECT * FROM profiles').all();
    if (profiles.length > 0) {
      await mongodb.collection('profiles').insertMany(
        profiles.map(profile => ({
          _id: profile.id,
          user_id: profile.user_id,
          name: profile.name,
          age: profile.age,
          bio: profile.bio,
          gender: profile.gender,
          looking_for: profile.looking_for,
          location: profile.latitude && profile.longitude ? {
            type: 'Point',
            coordinates: [profile.longitude, profile.latitude]
          } : null,
          latitude: profile.latitude,
          longitude: profile.longitude,
          profile_image: profile.profile_image,
          created_at: profile.created_at,
          updated_at: profile.updated_at
        }))
      );
      console.log(`✓ Migrated ${profiles.length} profiles`);
    } else {
      console.log('  No profiles to migrate');
    }

    // Migrate Swipes
    console.log('Migrating swipes...');
    const swipes = sqlite.prepare('SELECT * FROM swipes').all();
    if (swipes.length > 0) {
      await mongodb.collection('swipes').insertMany(
        swipes.map(swipe => ({
          _id: swipe.id,
          swiper_id: swipe.swiper_id,
          swipee_id: swipe.swipee_id,
          direction: swipe.direction,
          created_at: swipe.created_at
        }))
      );
      console.log(`✓ Migrated ${swipes.length} swipes`);
    } else {
      console.log('  No swipes to migrate');
    }

    // Migrate Matches
    console.log('Migrating matches...');
    const matches = sqlite.prepare('SELECT * FROM matches').all();
    if (matches.length > 0) {
      await mongodb.collection('matches').insertMany(
        matches.map(match => ({
          _id: match.id,
          user1_id: match.user1_id,
          user2_id: match.user2_id,
          created_at: match.created_at
        }))
      );
      console.log(`✓ Migrated ${matches.length} matches`);
    } else {
      console.log('  No matches to migrate');
    }

    // Migrate Conversations
    console.log('Migrating conversations...');
    const conversations = sqlite.prepare('SELECT * FROM conversations').all();
    if (conversations.length > 0) {
      await mongodb.collection('conversations').insertMany(
        conversations.map(conv => ({
          _id: conv.id,
          match_id: conv.match_id,
          created_at: conv.created_at
        }))
      );
      console.log(`✓ Migrated ${conversations.length} conversations`);
    } else {
      console.log('  No conversations to migrate');
    }

    // Migrate Messages
    console.log('Migrating messages...');
    const messages = sqlite.prepare('SELECT * FROM messages').all();
    if (messages.length > 0) {
      await mongodb.collection('messages').insertMany(
        messages.map(msg => ({
          _id: msg.id,
          conversation_id: msg.conversation_id,
          sender_id: msg.sender_id,
          content: msg.content,
          created_at: msg.created_at,
          deleted_at: msg.deleted_at
        }))
      );
      console.log(`✓ Migrated ${messages.length} messages`);
    } else {
      console.log('  No messages to migrate');
    }

    // Migrate Game Sessions
    console.log('Migrating game sessions...');
    const gameSessions = sqlite.prepare('SELECT * FROM game_sessions').all();
    if (gameSessions.length > 0) {
      await mongodb.collection('game_sessions').insertMany(
        gameSessions.map(session => ({
          _id: session.id,
          match_id: session.match_id,
          game_type: session.game_type,
          status: session.status,
          initiator_id: session.initiator_id,
          created_at: session.created_at,
          completed_at: session.completed_at
        }))
      );
      console.log(`✓ Migrated ${gameSessions.length} game sessions`);
    } else {
      console.log('  No game sessions to migrate');
    }

    // Migrate Game Responses
    console.log('Migrating game responses...');
    const gameResponses = sqlite.prepare('SELECT * FROM game_responses').all();
    if (gameResponses.length > 0) {
      await mongodb.collection('game_responses').insertMany(
        gameResponses.map(response => ({
          _id: response.id,
          session_id: response.session_id,
          user_id: response.user_id,
          response_data: response.response_data,
          created_at: response.created_at
        }))
      );
      console.log(`✓ Migrated ${gameResponses.length} game responses`);
    } else {
      console.log('  No game responses to migrate');
    }

    // Migrate Email OTPs
    console.log('Migrating email OTPs...');
    const otps = sqlite.prepare('SELECT * FROM email_otps').all();
    if (otps.length > 0) {
      await mongodb.collection('email_otps').insertMany(
        otps.map(otp => ({
          _id: otp.id,
          email: otp.email,
          otp_code: otp.otp_code,
          created_at: otp.created_at,
          expires_at: otp.expires_at,
          verified_at: otp.verified_at,
          attempts: otp.attempts
        }))
      );
      console.log(`✓ Migrated ${otps.length} email OTPs`);
    } else {
      console.log('  No email OTPs to migrate');
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Update your .env file with MONGODB_URI');
    console.log('2. Deploy to Render with MongoDB connection string');
    console.log('3. Test the application');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    sqlite.close();
    await mongoClient.close();
  }
}

// Run migration
migrateSQLiteToMongoDB().catch(console.error);

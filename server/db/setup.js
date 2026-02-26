import { db } from "./index.js";

function setupTables() {
  db.exec(`CREATE TABLE IF NOT EXISTS users(
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at    TEXT,
  deleted_at    TEXT
)`);
  db.exec(`
CREATE TABLE IF NOT EXISTS sessions(
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL,
  session_token TEXT NOT NULL,
  created_at    TEXT,
  expires_at    TEXT,
  revoked_at    TEXT,
  FOREIGN KEY(user_id) REFERENCES users(id)
)`);
  db.exec(`CREATE TABLE IF NOT EXISTS profiles(
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL,
  name          TEXT,
  age           INTEGER,
  bio           TEXT,
  gender        CHAR(1), -- 'M'(male) or 'F'(female)
  looking_for   CHAR(1), -- 'M'(male), 'F'(female) or 'A'(any)
  latitude      REAL,
  longitude     REAL,
  created_at    TEXT,
  updated_at    TEXT,
  profile_image TEXT,
  FOREIGN KEY(user_id) REFERENCES users(id)
)`);
  db.exec(`CREATE TABLE IF NOT EXISTS swipes(
  id         TEXT PRIMARY KEY,
  swiper_id  TEXT NOT NULL,
  swipee_id  TEXT NOT NULL,
  direction  CHAR(1), -- 'L'(left) or 'R'(right)
  created_at TEXT,
  FOREIGN KEY(swiper_id) REFERENCES users(id),
  FOREIGN KEY(swipee_id) REFERENCES users(id)
  )`);
  db.exec(`CREATE TABLE IF NOT EXISTS matches(
  id TEXT PRIMARY KEY,
  user1_id TEXT NOT NULL,
  user2_id TEXT NOT NULL,
  created_at TEXT,
  FOREIGN KEY(user1_id) REFERENCES users(id),
  FOREIGN KEY(user2_id) REFERENCES users(id)
)`);
  db.exec(`CREATE TABLE IF NOT EXISTS conversations(
  id         TEXT PRIMARY KEY,
  match_id   TEXT NOT NULL,
  created_at TEXT,
  FOREIGN KEY(match_id) REFERENCES matches(id)
)`);
  db.exec(`CREATE TABLE IF NOT EXISTS messages(
  id              TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  sender_id       TEXT NOT NULL,
  content         TEXT,
  created_at      TEXT,
  deleted_at      TEXT,
  FOREIGN KEY(conversation_id) REFERENCES conversations(id),
  FOREIGN KEY(sender_id)       REFERENCES users(id)
)`);
  db.exec(`CREATE TABLE IF NOT EXISTS game_sessions(
  id              TEXT PRIMARY KEY,
  match_id        TEXT NOT NULL,
  game_type       TEXT NOT NULL, -- 'two_truths_lie', 'would_you_rather', etc.
  status          TEXT NOT NULL, -- 'pending', 'active', 'completed'
  initiator_id    TEXT NOT NULL,
  created_at      TEXT,
  completed_at    TEXT,
  FOREIGN KEY(match_id) REFERENCES matches(id),
  FOREIGN KEY(initiator_id) REFERENCES users(id)
)`);
  db.exec(`CREATE TABLE IF NOT EXISTS game_responses(
  id              TEXT PRIMARY KEY,
  session_id      TEXT NOT NULL,
  user_id         TEXT NOT NULL,
  response_data   TEXT NOT NULL, -- JSON string with game-specific data
  created_at      TEXT,
  FOREIGN KEY(session_id) REFERENCES game_sessions(id),
  FOREIGN KEY(user_id) REFERENCES users(id)
)`);
  db.exec(`CREATE TABLE IF NOT EXISTS user_rewards(
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL,
  points          INTEGER DEFAULT 0,
  level           INTEGER DEFAULT 1,
  games_played    INTEGER DEFAULT 0,
  games_won       INTEGER DEFAULT 0,
  streak_days     INTEGER DEFAULT 0,
  last_played_at  TEXT,
  created_at      TEXT,
  updated_at      TEXT,
  FOREIGN KEY(user_id) REFERENCES users(id)
)`);
  db.exec(`CREATE TABLE IF NOT EXISTS achievements(
  id              TEXT PRIMARY KEY,
  code            TEXT NOT NULL UNIQUE,
  name            TEXT NOT NULL,
  description     TEXT NOT NULL,
  icon            TEXT NOT NULL,
  points_reward   INTEGER DEFAULT 0,
  requirement     TEXT NOT NULL, -- JSON string with achievement criteria
  tier            TEXT NOT NULL, -- 'bronze', 'silver', 'gold', 'platinum'
  created_at      TEXT
)`);
  db.exec(`CREATE TABLE IF NOT EXISTS user_achievements(
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL,
  achievement_id  TEXT NOT NULL,
  unlocked_at     TEXT,
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(achievement_id) REFERENCES achievements(id),
  UNIQUE(user_id, achievement_id)
)`);
  db.exec(`CREATE TABLE IF NOT EXISTS reward_transactions(
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL,
  points          INTEGER NOT NULL,
  reason          TEXT NOT NULL,
  reference_id    TEXT, -- game_session_id or achievement_id
  reference_type  TEXT, -- 'game', 'achievement', 'bonus', 'streak'
  created_at      TEXT,
  FOREIGN KEY(user_id) REFERENCES users(id)
)`);
  db.exec(`CREATE TABLE IF NOT EXISTS email_otps(
  id              TEXT PRIMARY KEY,
  email           TEXT NOT NULL,
  otp_code        TEXT NOT NULL,
  created_at      TEXT NOT NULL,
  expires_at      TEXT NOT NULL,
  verified_at     TEXT,
  attempts        INTEGER DEFAULT 0
)`);
  console.log("[LOG] tables created");
}

function setupTriggers() {
  db.exec(`CREATE TRIGGER IF NOT EXISTS match_on_mutual_swipe
  AFTER INSERT ON swipes
  FOR EACH ROW
  WHEN NEW.direction = 'R'
  BEGIN
    INSERT OR IGNORE INTO matches (id, user1_id, user2_id, created_at)
    SELECT 
      lower(hex(randomblob(16))),
      CASE WHEN NEW.swiper_id < NEW.swipee_id THEN NEW.swiper_id ELSE NEW.swipee_id END,
      CASE WHEN NEW.swiper_id < NEW.swipee_id THEN NEW.swipee_id ELSE NEW.swiper_id END,
      datetime('now')
    WHERE EXISTS (
      SELECT 1 FROM swipes 
      WHERE swiper_id = NEW.swipee_id 
      AND swipee_id = NEW.swiper_id 
      AND direction = 'R'
    );
  END`);
  console.log("[LOG] triggers created");
}

function setupIndexes() {
  // Users indexes
  db.exec(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);

  // Sessions indexes
  db.exec(
    `CREATE INDEX IF NOT EXISTS idx_sessions_session_token ON sessions(session_token)`,
  );
  db.exec(
    `CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)`,
  );
  db.exec(
    `CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at)`,
  );

  // Profiles indexes
  db.exec(
    `CREATE INDEX IF NOT EXISTS idx_profiles_geo ON profiles(latitude, longitude)`,
  );

  // Conversations indexes
  db.exec(
    `CREATE INDEX IF NOT EXISTS idx_conversations_match_id ON conversations(match_id)`,
  );

  // Messages indexes
  db.exec(
    `CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON messages(conversation_id, created_at)`,
  );
  db.exec(
    `CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id)`,
  );

  // Game sessions indexes
  db.exec(
    `CREATE INDEX IF NOT EXISTS idx_game_sessions_match_id ON game_sessions(match_id)`,
  );
  db.exec(
    `CREATE INDEX IF NOT EXISTS idx_game_responses_session_id ON game_responses(session_id)`,
  );

  console.log("[LOG] indexes created");
}

function main() {
  setupTables();
  setupTriggers();
  setupIndexes();
}
main();

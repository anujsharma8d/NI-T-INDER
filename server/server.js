import "dotenv/config";

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import { router as auth } from "./controllers/auth.js";
import { router as profiles } from "./controllers/profile.js";
import { router as swipes } from "./controllers/swipe.js";
import { router as matches } from "./controllers/match.js";
import { router as dateSuggestions } from "./controllers/date-suggestions.js";
import { router as conversations } from "./controllers/conversation.js";
import { router as games } from "./controllers/game.js";

import { authMiddleware } from "./middleware.js";

// Initialize database tables on startup
// This wrapper loads the real initializer from `db/index.js`. Any error
// is logged and re-thrown so the caller can react (e.g. exit the process).
async function initializeDatabase() {
  try {
    const { initializeDatabase } = await import('./db/index.js');
    await initializeDatabase();
  } catch (error) {
    console.error("[DB] Error initializing database:", error);
    throw error; // << propagate so outer caller can terminate
  }
}

// Determine port early so logs can reference it
const PORT = process.env.PORT || 3000;

// Log important configuration so issues can be diagnosed in deployment
console.log('[Config] NODE_ENV=', process.env.NODE_ENV);
console.log('[Config] PORT=', PORT);
console.log('[Config] FRONTEND_URL=', process.env.FRONTEND_URL);
console.log('[Config] MONGODB_URI=', process.env.MONGODB_URI ? '[redacted]' : '<<not set>>');

// Initialize database before starting server and prevent the app from
// listening if the connection fails.  Older behavior allowed the server to
// start and then every request would error with 
// "Database not initialized. Call initializeDatabase() first." which makes
// debugging harder.
(async () => {
  try {
    await initializeDatabase();
  } catch (err) {
    console.error('[DB] Initialization failed, exiting.');
    process.exit(1);
  }
})();

const app = express();

/* ================= PORT ================= */

/* (already declared above for logging) */

/* ============= MIDDLEWARES ============ */

// ✅ Simple & Stable CORS
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:3000",
      "https://ni-t-inder.vercel.app",
      process.env.FRONTEND_URL
    ].filter(Boolean),
    credentials: true,
    exposedHeaders: ["Authorization"]
  })
);

app.use(helmet());
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.static("./static/"));

// Apply auth middleware only to API routes (except auth routes)
app.use("/auth", auth);
app.use("/profiles", authMiddleware, profiles);
app.use("/swipes", authMiddleware, swipes);
app.use("/matches", authMiddleware, matches);
app.use("/conversations", authMiddleware, conversations);
app.use("/date-suggestions", authMiddleware, dateSuggestions);
app.use("/games", authMiddleware, games);

/* ============ HEALTH CHECK ============ */

app.get("/", (_, res) => {
  res.json({ message: "Hello, World!" });
});

/* ============== START SERVER ============== */

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
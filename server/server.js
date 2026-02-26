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
async function initializeDatabase() {
  try {
    const { initializeDatabase } = await import('./db/index.js');
    await initializeDatabase();
  } catch (error) {
    console.error("[DB] Error initializing database:", error);
  }
}

// Initialize database before starting server
initializeDatabase();

const app = express();

/* ================= PORT ================= */

const PORT = process.env.PORT || 3000;

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
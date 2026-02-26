import { Router } from "express";
import { getDb } from "../db/index.js";
import { v4 as uuid } from "uuid";

export const router = Router({});

// POST /games
// Create a new game session for a match
router.post("/", async (req, res) => {
  try {
    const userId = req.session.user_id;
    const { match_id, game_type } = req.body;

    if (!match_id) {
      return res.status(400).json({ detail: "match_id required" });
    }

    if (!game_type) {
      return res.status(400).json({ detail: "game_type required" });
    }

    // Verify user is part of this match
    const match = db
      .prepare(
        `SELECT * FROM matches 
         WHERE id = @matchId AND (user1_id = @userId OR user2_id = @userId)`,
      )
      .get({ matchId: match_id, userId });

    if (!match) {
      return res.status(403).json({ detail: "you are not part of this match" });
    }

    const sessionId = uuid();
    const createdAt = new Date().toISOString();

    db.prepare(
      `INSERT INTO game_sessions (id, match_id, game_type, status, initiator_id, created_at, completed_at)
       VALUES (@id, @match_id, @game_type, 'pending', @initiator_id, @created_at, NULL)`,
    ).run({
      id: sessionId,
      match_id,
      game_type,
      initiator_id: userId,
      created_at: createdAt,
    });

    return res.status(201).json({
      id: sessionId,
      match_id,
      game_type,
      status: "pending",
      initiator_id: userId,
      created_at: createdAt,
    });
  } catch (error) {
    console.error(`[ERROR] creating game session: ${error}`);
    return res.status(500).json({ detail: "could not create game session" });
  }
});

// GET /games/:matchId
// Get all game sessions for a match
router.get("/:matchId", async (req, res) => {
  try {
    const userId = req.session.user_id;
    const matchId = req.params.matchId?.trim();

    if (!matchId) {
      return res.status(400).json({ detail: "match ID required" });
    }

    // Verify user is part of this match
    const match = db
      .prepare(
        `SELECT * FROM matches 
         WHERE id = @matchId AND (user1_id = @userId OR user2_id = @userId)`,
      )
      .get({ matchId, userId });

    if (!match) {
      return res.status(403).json({ detail: "you are not part of this match" });
    }

    const sessions = db
      .prepare(
        `SELECT gs.*, p.name as initiator_name
         FROM game_sessions gs
         JOIN profiles p ON gs.initiator_id = p.user_id
         WHERE gs.match_id = @matchId
         ORDER BY gs.created_at DESC`,
      )
      .all({ matchId });

    return res.json(sessions);
  } catch (error) {
    console.error(`[ERROR] retrieving game sessions: ${error}`);
    return res.status(500).json({ detail: "could not retrieve game sessions" });
  }
});

// GET /games/session/:sessionId
// Get a specific game session with all responses
router.get("/session/:sessionId", async (req, res) => {
  try {
    const userId = req.session.user_id;
    const sessionId = req.params.sessionId?.trim();

    if (!sessionId) {
      return res.status(400).json({ detail: "session ID required" });
    }

    // Get session and verify access
    const session = db
      .prepare(
        `SELECT gs.*, m.user1_id, m.user2_id
         FROM game_sessions gs
         JOIN matches m ON gs.match_id = m.id
         WHERE gs.id = @sessionId AND (m.user1_id = @userId OR m.user2_id = @userId)`,
      )
      .get({ sessionId, userId });

    if (!session) {
      return res.status(403).json({ detail: "you do not have access to this game session" });
    }

    // Get all responses for this session
    const responses = db
      .prepare(
        `SELECT gr.*, p.name as user_name
         FROM game_responses gr
         JOIN profiles p ON gr.user_id = p.user_id
         WHERE gr.session_id = @sessionId
         ORDER BY gr.created_at ASC`,
      )
      .all({ sessionId });

    return res.json({
      ...session,
      responses: responses.map(r => ({
        id: r.id,
        user_id: r.user_id,
        user_name: r.user_name,
        response_data: JSON.parse(r.response_data),
        created_at: r.created_at,
      })),
    });
  } catch (error) {
    console.error(`[ERROR] retrieving game session: ${error}`);
    return res.status(500).json({ detail: "could not retrieve game session" });
  }
});

// POST /games/session/:sessionId/response
// Submit a response to a game session
router.post("/session/:sessionId/response", async (req, res) => {
  try {
    const userId = req.session.user_id;
    const sessionId = req.params.sessionId?.trim();
    const { response_data } = req.body;

    if (!sessionId) {
      return res.status(400).json({ detail: "session ID required" });
    }

    if (!response_data) {
      return res.status(400).json({ detail: "response_data required" });
    }

    // Get session and verify access
    const session = db
      .prepare(
        `SELECT gs.*, m.user1_id, m.user2_id
         FROM game_sessions gs
         JOIN matches m ON gs.match_id = m.id
         WHERE gs.id = @sessionId AND (m.user1_id = @userId OR m.user2_id = @userId)`,
      )
      .get({ sessionId, userId });

    if (!session) {
      return res.status(403).json({ detail: "you do not have access to this game session" });
    }

    if (session.status === "completed") {
      return res.status(400).json({ detail: "game session already completed" });
    }

    // Check if user already responded
    const existingResponse = db
      .prepare(
        `SELECT * FROM game_responses 
         WHERE session_id = @sessionId AND user_id = @userId`,
      )
      .get({ sessionId, userId });

    if (existingResponse) {
      return res.status(400).json({ detail: "you have already responded to this game" });
    }

    const responseId = uuid();
    const createdAt = new Date().toISOString();

    db.prepare(
      `INSERT INTO game_responses (id, session_id, user_id, response_data, created_at)
       VALUES (@id, @session_id, @user_id, @response_data, @created_at)`,
    ).run({
      id: responseId,
      session_id: sessionId,
      user_id: userId,
      response_data: JSON.stringify(response_data),
      created_at: createdAt,
    });

    // Check if both users have responded
    const responseCount = db
      .prepare(
        `SELECT COUNT(*) as count FROM game_responses WHERE session_id = @sessionId`,
      )
      .get({ sessionId }).count;

    // If both users responded, mark as active
    if (responseCount === 2 && session.status === "pending") {
      db.prepare(
        `UPDATE game_sessions SET status = 'active' WHERE id = @sessionId`,
      ).run({ sessionId });
    }

    return res.status(201).json({
      id: responseId,
      session_id: sessionId,
      user_id: userId,
      response_data,
      created_at: createdAt,
    });
  } catch (error) {
    console.error(`[ERROR] submitting game response: ${error}`);
    return res.status(500).json({ detail: "could not submit game response" });
  }
});

// PUT /games/session/:sessionId/complete
// Mark a game session as completed
router.put("/session/:sessionId/complete", async (req, res) => {
  try {
    const userId = req.session.user_id;
    const sessionId = req.params.sessionId?.trim();

    if (!sessionId) {
      return res.status(400).json({ detail: "session ID required" });
    }

    // Get session and verify access
    const session = db
      .prepare(
        `SELECT gs.*, m.user1_id, m.user2_id
         FROM game_sessions gs
         JOIN matches m ON gs.match_id = m.id
         WHERE gs.id = @sessionId AND (m.user1_id = @userId OR m.user2_id = @userId)`,
      )
      .get({ sessionId, userId });

    if (!session) {
      return res.status(403).json({ detail: "you do not have access to this game session" });
    }

    const completedAt = new Date().toISOString();

    db.prepare(
      `UPDATE game_sessions SET status = 'completed', completed_at = @completed_at 
       WHERE id = @sessionId`,
    ).run({ sessionId, completed_at: completedAt });

    return res.json({
      id: sessionId,
      status: "completed",
      completed_at: completedAt,
    });
  } catch (error) {
    console.error(`[ERROR] completing game session: ${error}`);
    return res.status(500).json({ detail: "could not complete game session" });
  }
});

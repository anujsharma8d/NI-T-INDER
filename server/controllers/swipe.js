import { Router } from "express";
import { v4 as uuid } from "uuid";
import { getDb } from "../db/index.js";

export const router = Router({});

const validDirections = new Set(["L", "R"]);

router.get("/", async (req, res) => {
  try {
    const { swiper_id: swiperId, swipee_id: swipeeId } = req.query;

    const db = getDb();
    let filter = {};

    if (swiperId) {
      filter.swiper_id = swiperId;
    }

    if (swipeeId) {
      filter.swipee_id = swipeeId;
    }

    const swipes = await db.collection('swipes').find(filter).toArray();
    return res.json({ swipes });
  } catch (error) {
    console.error('[ERROR] get swipes:', error);
    return res.status(500).json({ detail: "failed to get swipes" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const db = getDb();
    const swipe = await db.collection('swipes').findOne({ _id: req.params.id });

    if (!swipe) {
      return res.status(404).json({ detail: "swipe not found" });
    }

    return res.json({ swipe });
  } catch (error) {
    console.error('[ERROR] get swipe by id:', error);
    return res.status(500).json({ detail: "failed to get swipe" });
  }
});

router.post("/", async (req, res) => {
  try {
    const userId = req.session?.user_id;
    if (!userId) {
      return res.status(401).json({ detail: "missing session" });
    }

    const swipeeId = req.body.swipee_id?.trim();
    const direction = req.body.direction?.trim()?.toUpperCase();

    if (!swipeeId || !direction) {
      return res.status(400).json({ detail: "swipee_id and direction required" });
    }

    if (!validDirections.has(direction)) {
      return res.status(400).json({ detail: "direction must be 'L' or 'R'" });
    }

    const db = getDb();

    // The client sends a profile ID, but swipee_id references users(id).
    // Resolve the profile ID to a user ID if needed.
    let resolvedSwipeeId = swipeeId;
    const userExists = await db.collection('users').findOne({ _id: swipeeId });

    if (!userExists) {
      const profile = await db.collection('profiles').findOne({ _id: swipeeId });
      if (!profile) {
        return res.status(404).json({ detail: "swipee not found" });
      }
      resolvedSwipeeId = profile.user_id;
    }

    const payload = {
      _id: uuid(),
      swiper_id: userId,
      swipee_id: resolvedSwipeeId,
      direction,
      created_at: new Date().toISOString(),
    };

    await db.collection('swipes').insertOne(payload);

    // Check for mutual match (if this is a right swipe)
    if (direction === 'R') {
      const mutualSwipe = await db.collection('swipes').findOne({
        swiper_id: resolvedSwipeeId,
        swipee_id: userId,
        direction: 'R'
      });

      if (mutualSwipe) {
        // Create a match
        const matchId = uuid();
        const user1Id = userId < resolvedSwipeeId ? userId : resolvedSwipeeId;
        const user2Id = userId < resolvedSwipeeId ? resolvedSwipeeId : userId;

        await db.collection('matches').insertOne({
          _id: matchId,
          user1_id: user1Id,
          user2_id: user2Id,
          created_at: new Date().toISOString()
        });

        return res.status(201).json({ 
          swipe: payload, 
          match: { 
            id: matchId, 
            user1_id: user1Id, 
            user2_id: user2Id 
          } 
        });
      }
    }

    return res.status(201).json({ swipe: payload });
  } catch (error) {
    console.error('[ERROR] create swipe:', error);
    return res.status(500).json({ detail: "failed to create swipe" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const userId = req.session?.user_id;
    if (!userId) {
      return res.status(401).json({ detail: "missing session" });
    }

    const db = getDb();
    const swipe = await db.collection('swipes').findOne({ _id: req.params.id });

    if (!swipe) {
      return res.status(404).json({ detail: "swipe not found" });
    }

    if (swipe.swiper_id !== userId) {
      return res.status(403).json({ detail: "forbidden" });
    }

    await db.collection('swipes').deleteOne({ _id: req.params.id });
    return res.json({ message: "swipe deleted" });
  } catch (error) {
    console.error('[ERROR] delete swipe:', error);
    return res.status(500).json({ detail: "failed to delete swipe" });
  }
});

export default router;

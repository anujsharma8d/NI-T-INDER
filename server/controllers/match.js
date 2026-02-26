import { Router } from "express";
import { getDb } from "../db/index.js";
import { v4 as uuid } from "uuid";

export const router = Router({});

// GET /matches
// Retrieve all matches for the authenticated user
router.get("/", async (req, res) => {
  try {
    const userId = req.session.user_id;
    
    const db = getDb();
    
    const matches = await db.collection('matches').aggregate([
      {
        $match: {
          $or: [
            { user1_id: userId },
            { user2_id: userId }
          ]
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user1_id',
          foreignField: '_id',
          as: 'user1'
        }
      },
      {
        $lookup: {
          from: 'profiles',
          localField: 'user1_id',
          foreignField: 'user_id',
          as: 'user1_profile'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user2_id',
          foreignField: '_id',
          as: 'user2'
        }
      },
      {
        $lookup: {
          from: 'profiles',
          localField: 'user2_id',
          foreignField: 'user_id',
          as: 'user2_profile'
        }
      },
      {
        $unwind: '$user1'
      },
      {
        $unwind: '$user1_profile'
      },
      {
        $unwind: '$user2'
      },
      {
        $unwind: '$user2_profile'
      },
      {
        $project: {
          _id: 0,
          id: '$_id',
          created_at: 1,
          user1: {
            id: '$user1_id',
            email: '$user1.email',
            name: '$user1_profile.name',
            age: '$user1_profile.age',
            bio: '$user1_profile.bio',
            gender: '$user1_profile.gender'
          },
          user2: {
            id: '$user2_id',
            email: '$user2.email',
            name: '$user2_profile.name',
            age: '$user2_profile.age',
            bio: '$user2_profile.bio',
            gender: '$user2_profile.gender'
          }
        }
      },
      { $sort: { created_at: -1 } }
    ]).toArray();
      
    return res.json(matches);
  } catch (error) {
    console.error(`[ERROR] retrieving matches: ${error}`);
    return res.status(500).json({ detail: "could not retrieve matches" });
  }
});

// POST /matches
// Create a match between two users using their user IDs
router.post("/", async (req, res) => {
  try {
    const { user1_id, user2_id } = req.body;

    if (!user1_id || !user2_id) {
      return res.status(400).json({ detail: "user1_id and user2_id are required" });
    }

    if (user1_id === user2_id) {
      return res.status(400).json({ detail: "cannot create a match with yourself" });
    }

    const db = getDb();

    // Verify both users exist
    const user1 = await db.collection('users').findOne({ _id: user1_id });
    const user2 = await db.collection('users').findOne({ _id: user2_id });

    if (!user1 || !user2) {
      return res.status(404).json({ detail: "one or both users not found" });
    }

    // Check for existing match (normalize ordering)
    const sortedUser1 = user1_id < user2_id ? user1_id : user2_id;
    const sortedUser2 = user1_id < user2_id ? user2_id : user1_id;

    const existingMatch = await db.collection('matches').findOne({
      user1_id: sortedUser1,
      user2_id: sortedUser2
    });

    if (existingMatch) {
      return res.status(409).json({ detail: "match already exists between these users" });
    }

    const matchId = uuid();
    await db.collection('matches').insertOne({
      _id: matchId,
      user1_id: sortedUser1,
      user2_id: sortedUser2,
      created_at: new Date().toISOString()
    });

    // Retrieve the created match with profile info
    const match = await db.collection('matches').aggregate([
      { $match: { _id: matchId } },
      {
        $lookup: {
          from: 'users',
          localField: 'user1_id',
          foreignField: '_id',
          as: 'user1'
        }
      },
      {
        $lookup: {
          from: 'profiles',
          localField: 'user1_id',
          foreignField: 'user_id',
          as: 'user1_profile'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user2_id',
          foreignField: '_id',
          as: 'user2'
        }
      },
      {
        $lookup: {
          from: 'profiles',
          localField: 'user2_id',
          foreignField: 'user_id',
          as: 'user2_profile'
        }
      },
      {
        $unwind: '$user1'
      },
      {
        $unwind: '$user1_profile'
      },
      {
        $unwind: '$user2'
      },
      {
        $unwind: '$user2_profile'
      },
      {
        $project: {
          _id: 0,
          id: '$_id',
          created_at: 1,
          user1: {
            id: '$user1_id',
            email: '$user1.email',
            name: '$user1_profile.name',
            age: '$user1_profile.age',
            bio: '$user1_profile.bio',
            gender: '$user1_profile.gender'
          },
          user2: {
            id: '$user2_id',
            email: '$user2.email',
            name: '$user2_profile.name',
            age: '$user2_profile.age',
            bio: '$user2_profile.bio',
            gender: '$user2_profile.gender'
          }
        }
      }
    ]).toArray();

    return res.status(201).json(match[0]);
  } catch (error) {
    console.error(`[ERROR] creating match: ${error}`);
    return res.status(500).json({ detail: "could not create match" });
  }
});

// GET /matches/:matchId
// Retrieve a match by ID with profile information for both users
router.get("/:matchId", async (req, res) => {
  try {
    const matchId = req.params.matchId?.trim();
    if (!matchId) {
      return res.status(400).json({ detail: "match ID required" });
    }

    const db = getDb();
    
    const matches = await db.collection('matches').aggregate([
      { $match: { _id: matchId } },
      {
        $lookup: {
          from: 'users',
          localField: 'user1_id',
          foreignField: '_id',
          as: 'user1'
        }
      },
      {
        $lookup: {
          from: 'profiles',
          localField: 'user1_id',
          foreignField: 'user_id',
          as: 'user1_profile'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user2_id',
          foreignField: '_id',
          as: 'user2'
        }
      },
      {
        $lookup: {
          from: 'profiles',
          localField: 'user2_id',
          foreignField: 'user_id',
          as: 'user2_profile'
        }
      },
      {
        $unwind: '$user1'
      },
      {
        $unwind: '$user1_profile'
      },
      {
        $unwind: '$user2'
      },
      {
        $unwind: '$user2_profile'
      },
      {
        $project: {
          _id: 0,
          id: '$_id',
          created_at: 1,
          user1: {
            id: '$user1_id',
            email: '$user1.email',
            name: '$user1_profile.name',
            age: '$user1_profile.age',
            bio: '$user1_profile.bio',
            gender: '$user1_profile.gender'
          },
          user2: {
            id: '$user2_id',
            email: '$user2.email',
            name: '$user2_profile.name',
            age: '$user2_profile.age',
            bio: '$user2_profile.bio',
            gender: '$user2_profile.gender'
          }
        }
      }
    ]).toArray();

    if (matches.length === 0) {
      return res.status(404).json({ detail: "match not found" });
    }

    return res.json(matches[0]);
  } catch (error) {
    console.error(`[ERROR] retrieving match: ${error}`);
    return res.status(500).json({ detail: "could not retrieve match" });
  }
});

export default router;

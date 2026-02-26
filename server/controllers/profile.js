import { Router } from "express";
import { v4 as uuid } from "uuid";
import { getDb } from "../db/index.js";

export const router = Router({});

const profileFields = [
  "name",
  "age",
  "bio",
  "gender",
  "looking_for",
  "latitude",
  "longitude",
  "profile_image",
];

// GET: unswiped profiles for the current user's feed
router.get("/feed", async (req, res) => {
  try {
    const userId = req.session?.user_id;
    if (!userId) {
      return res.status(401).json({ detail: "missing session" });
    }

    const db = getDb();

    // Get current user's profile to check their preference
    const currentUserProfile = await db.collection('profiles').findOne({ user_id: userId });

    // Build aggregation pipeline
    const pipeline = [
      // Match profiles that are not the current user
      { $match: { user_id: { $ne: userId } } },
      
      // Lookup swipes to exclude already swiped profiles
      {
        $lookup: {
          from: 'swipes',
          let: { profileUserId: '$user_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$swiper_id', userId] },
                    { $eq: ['$swipee_id', '$$profileUserId'] }
                  ]
                }
              }
            }
          ],
          as: 'swipes'
        }
      },
      
      // Exclude profiles that have been swiped
      { $match: { swipes: { $size: 0 } } },
      
      // Project only profile fields
      { $project: { swipes: 0 } }
    ];

    // Add gender filter based on user's preference
    if (currentUserProfile && currentUserProfile.looking_for) {
      const preference = currentUserProfile.looking_for.toUpperCase();
      if (preference === 'M') {
        pipeline.unshift({ $match: { gender: 'M' } });
      } else if (preference === 'F') {
        pipeline.unshift({ $match: { gender: 'F' } });
      }
      // If preference is 'A' (any), don't add filter
    }

    const profiles = await db.collection('profiles').aggregate(pipeline).toArray();
    
    return res.json({ profiles });
  } catch (error) {
    console.error('[ERROR] get feed profiles:', error);
    return res.status(500).json({ detail: "failed to get feed profiles" });
  }
});

// GET: all profiles
router.get("/", async (req, res) => {
  try {
    const { user_id: userId } = req.query;
    const currentUserId = req.session?.user_id;
    
    const db = getDb();
    let profiles;
    
    if (userId) {
      profiles = await db.collection('profiles').find({ user_id: userId }).toArray();
    } else {
      // Return profiles based on current user's preference
      if (currentUserId) {
        // Get current user's profile to check their preference
        const currentUserProfile = await db.collection('profiles').findOne({ user_id: currentUserId });

        let filter = { user_id: { $ne: currentUserId } };
        
        // Add gender filter based on user's preference
        if (currentUserProfile && currentUserProfile.looking_for) {
          const preference = currentUserProfile.looking_for.toUpperCase();
          if (preference === 'M') {
            filter.gender = 'M';
          } else if (preference === 'F') {
            filter.gender = 'F';
          }
          // If preference is 'A' (any), don't add filter
        }
        
        profiles = await db.collection('profiles').find(filter).toArray();
      } else {
        profiles = await db.collection('profiles').find({}).toArray();
      }
    }
    
    return res.json({ profiles });
  } catch (error) {
    console.error('[ERROR] get profiles:', error);
    return res.status(500).json({ detail: "failed to get profiles" });
  }
});

// GET: current user's profile
router.get("/me", async (req, res) => {
  try {
    const userId = req.session?.user_id;
    if (!userId) {
      return res.status(401).json({ detail: "missing session" });
    }

    const db = getDb();
    const profile = await db.collection('profiles').findOne({ user_id: userId });

    if (!profile) {
      return res.status(404).json({ detail: "profile not found" });
    }

    return res.json({ profile });
  } catch (error) {
    console.error('[ERROR] get my profile:', error);
    return res.status(500).json({ detail: "failed to get profile" });
  }
});

// GET: profile image
// Accepts either the profile ID or the associated user ID for convenience
router.get("/:id/image", async (req, res) => {
  try {
    const db = getDb();
    const profile = await db.collection('profiles').findOne({
      $or: [{ _id: req.params.id }, { user_id: req.params.id }]
    });
    
    if (!profile || !profile.profile_image) {
      return res.status(404).json({ detail: "image not found" });
    }

    let imageBuffer;
    if (Buffer.isBuffer(profile.profile_image)) {
      imageBuffer = profile.profile_image;
    } else if (typeof profile.profile_image === 'string') {
      // Likely base64-encoded from the client
      imageBuffer = Buffer.from(profile.profile_image, 'base64');
    } else {
      imageBuffer = Buffer.from(profile.profile_image);
    }

    res.set("Content-Type", "image/png");
    res.set("Content-Length", imageBuffer.length);
    return res.send(imageBuffer);
  } catch (error) {
    console.error('[ERROR] get profile image:', error);
    return res.status(500).json({ detail: "failed to get image" });
  }
});

// GET: specific profile
router.get("/:id", async (req, res) => {
  try {
    const db = getDb();
    const profile = await db.collection('profiles').findOne({ _id: req.params.id });
    
    if (!profile) {
      return res.status(404).json({ detail: "profile not found" });
    }
    
    return res.json({ profile });
  } catch (error) {
    console.error('[ERROR] get profile by id:', error);
    return res.status(500).json({ detail: "failed to get profile" });
  }
});

// POST: create profile (with optional image upload)
router.post("/", async (req, res) => {
  try {
    const userId = req.session?.user_id;
    if (!userId) {
      return res.status(401).json({ detail: "missing session" });
    }

    const db = getDb();
    const existing = await db.collection('profiles').findOne({ user_id: userId });
    
    if (existing) {
      return res.status(409).json({ detail: "profile already exists" });
    }

    const payload = {
      _id: uuid(),
      user_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    for (const field of profileFields) {
      if (req.body[field] !== undefined) {
        payload[field] = req.body[field];
      }
    }

    await db.collection('profiles').insertOne(payload);

    return res.status(201).json({ profile: payload });
  } catch (error) {
    console.error('[ERROR] create profile:', error);
    return res.status(500).json({ detail: "failed to create profile" });
  }
});

// PUT: update profile (with optional image upload)
router.put("/:id", async (req, res) => {
  try {
    const userId = req.session?.user_id;
    if (!userId) {
      return res.status(401).json({ detail: "missing session" });
    }

    const db = getDb();
    const profile = await db.collection('profiles').findOne({ _id: req.params.id });
    
    if (!profile) {
      return res.status(404).json({ detail: "profile not found" });
    }
    if (profile.user_id !== userId) {
      return res.status(403).json({ detail: "forbidden" });
    }

    const updates = {
      updated_at: new Date().toISOString(),
    };

    for (const field of profileFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 1) { // Only updated_at
      return res.status(400).json({ detail: "no fields to update" });
    }

    await db.collection('profiles').updateOne(
      { _id: req.params.id },
      { $set: updates }
    );

    const updated = await db.collection('profiles').findOne({ _id: req.params.id });
    return res.json({ profile: updated });
  } catch (error) {
    console.error('[ERROR] update profile:', error);
    return res.status(500).json({ detail: "failed to update profile" });
  }
});

// DELETE: delete profile
router.delete("/:id", async (req, res) => {
  try {
    const userId = req.session?.user_id;
    if (!userId) {
      return res.status(401).json({ detail: "missing session" });
    }

    const db = getDb();
    const profile = await db.collection('profiles').findOne({ _id: req.params.id });
    
    if (!profile) {
      return res.status(404).json({ detail: "profile not found" });
    }
    if (profile.user_id !== userId) {
      return res.status(403).json({ detail: "forbidden" });
    }

    await db.collection('profiles').deleteOne({ _id: req.params.id });
    return res.status(204).send();
  } catch (error) {
    console.error('[ERROR] delete profile:', error);
    return res.status(500).json({ detail: "failed to delete profile" });
  }
});

export default router;

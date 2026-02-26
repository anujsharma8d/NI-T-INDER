import { Router } from "express";
import { v4 as uuid } from "uuid";
import { getPasswordHash, verifyPasswordHash, createAccessToken } from "../utils.js";
import { sendOTPEmail } from "../email-api.js";
import { getDb } from "../db/index.js";

const router = Router();

// Validate NITJ student email format: name.branch.year@nitj.ac.in
function isValidNITJEmail(email) {
  const nitjEmailRegex = /^[a-zA-Z]+\.[a-zA-Z]+\.\d{2}@nitj\.ac\.in$/i;
  return nitjEmailRegex.test(email);
}

// Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP endpoint
router.post("/send-otp", async (req, res) => {
  try {
    const email = req.body.email?.trim();

    if (!email)
      return res.status(400).json({ detail: "email is required" });

    if (!isValidNITJEmail(email))
      return res.status(400).json({ detail: "only NITJ student emails are allowed (format: name.branch.year@nitj.ac.in)" });

    // Check if user already exists
    const db = getDb();
    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser)
      return res.status(409).json({ detail: "user already exists with this email" });

    // Generate OTP
    const otpCode = generateOTP();
    const otpId = uuid();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes

    // Delete any existing OTPs for this email
    await db.collection('email_otps').deleteMany({ email });

    // Store OTP in database
    await db.collection('email_otps').insertOne({
      _id: otpId,
      email,
      otp_code: otpCode,
      created_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      verified_at: null,
      attempts: 0
    });

    // Send OTP via email
    const emailSent = await sendOTPEmail(email, otpCode);

    if (!emailSent) {
      console.error('[OTP] Failed to send email, but OTP stored in database');
    }

    return res.json({ 
      message: "OTP sent to your email",
      expiresIn: 600 // seconds
    });
  } catch (error) {
    console.error(`[ERROR] send-otp error: ${error}`);
    return res.status(500).json({ detail: "failed to send OTP" });
  }
});

// Verify OTP and register user
router.post("/verify-otp", async (req, res) => {
  try {
    const email = req.body.email?.trim();
    const otpCode = req.body.otp?.trim();
    const password = req.body.password?.trim();
    const firstName = req.body.firstName?.trim();
    const lastName = req.body.lastName?.trim();

    if (!email || !otpCode || !password || !firstName || !lastName)
      return res.status(400).json({ detail: "missing required fields" });

    if (!isValidNITJEmail(email))
      return res.status(400).json({ detail: "only NITJ student emails are allowed" });

    const db = getDb();

    // Get OTP record
    const otpRecord = await db.collection('email_otps').findOne({
      email,
      verified_at: null
    }, {
      sort: { created_at: -1 }
    });

    if (!otpRecord)
      return res.status(400).json({ detail: "no OTP found for this email" });

    // Check if OTP is expired
    const now = new Date();
    const expiresAt = new Date(otpRecord.expires_at);
    if (now > expiresAt) {
      return res.status(400).json({ detail: "OTP has expired. Please request a new one" });
    }

    // Check attempts
    if (otpRecord.attempts >= 5) {
      return res.status(400).json({ detail: "too many failed attempts. Please request a new OTP" });
    }

    // Verify OTP
    if (otpRecord.otp_code !== otpCode) {
      // Increment attempts
      await db.collection('email_otps').updateOne(
        { _id: otpRecord._id },
        { $inc: { attempts: 1 } }
      );

      return res.status(400).json({ detail: "invalid OTP code" });
    }

    // Mark OTP as verified
    await db.collection('email_otps').updateOne(
      { _id: otpRecord._id },
      { $set: { verified_at: now.toISOString() } }
    );

    // Create the user
    const userId = uuid();
    const nowISO = now.toISOString();

    await db.collection('users').insertOne({
      _id: userId,
      email,
      password_hash: await getPasswordHash(password),
      created_at: nowISO,
      deleted_at: null
    });

    // Create a profile for the user
    const profileId = uuid();
    const fullName = `${firstName} ${lastName}`.trim();
    
    await db.collection('profiles').insertOne({
      _id: profileId,
      user_id: userId,
      name: fullName,
      age: null,
      bio: null,
      gender: null,
      looking_for: null,
      latitude: null,
      longitude: null,
      profile_image: null,
      created_at: nowISO,
      updated_at: nowISO
    });

    const user = { id: userId, email };
    const token = await createAccessToken(user);
    
    return res
      .header({
        Authorization: `Bearer ${token}`,
      })
      .json({
        message: `Registered user: ${fullName}`,
        token,
      });
  } catch (error) {
    console.error(`[ERROR] verify-otp error: ${error}`);
    return res.status(500).json({ detail: "could not register user" });
  }
});


router.post("/login", async (req, res) => {
  try {
    const email = req.body.email?.trim();
    const password = req.body.password?.trim();
    if (!email || !password)
      return res.status(400).json({ detail: "email and password required" });
    
    if (!isValidNITJEmail(email))
      return res.status(400).json({ detail: "only NITJ student emails are allowed (format: name.branch.year@nitj.ac.in)" });

    const db = getDb();
    const user = await db.collection('users').findOne({ email });
    
    if (!user) return res.status(401).json({ detail: "invalid credentials" });

    if (!(await verifyPasswordHash(user.password_hash, password)))
      return res.status(401).json({ detail: "invalid credentials" });
      
    const profile = await db.collection('profiles').findOne({ user_id: user._id });
    const name = profile?.name || user.email;
    const token = await createAccessToken({ id: user._id, email });
    
    // send token both in header and response body for easier consumption
    return res
      .header({
        Authorization: `Bearer ${token}`,
      })
      .json({
        message: `Welcome back ${name}!`,
        token,
      });
  } catch (error) {
    console.error(`[ERROR] unexpected error: ${error}`);
    return res.status(500).json({ detail: "unexpected server error" });
  }
});

router.post("/register", async (req, res) => {
  try {
    const email = req.body.email?.trim();
    const password = req.body.password?.trim();
    const firstName = req.body.firstName?.trim();
    const lastName = req.body.lastName?.trim();

    if (!email || !password || !firstName || !lastName)
      return res.status(400).json({ detail: "missing required fields" });
    
    if (!isValidNITJEmail(email))
      return res.status(400).json({ detail: "only NITJ student emails are allowed (format: name.branch.year@nitj.ac.in)" });

    const userId = uuid();
    const now = new Date().toISOString();

    // Create the user
    db.prepare(`
      INSERT INTO users(id, email, password_hash, created_at, deleted_at)
      VALUES (@id, @email, @password_hash, @created_at, NULL)`,
    ).run({
      id: userId,
      email,
      password_hash: await getPasswordHash(password),
      created_at: now,
    });

    // Create a profile for the user
    const profileId = uuid();
    const fullName = `${firstName} ${lastName}`.trim();
    db.prepare(`
      INSERT INTO profiles (id, user_id, name, age, bio, gender, looking_for,
        latitude, longitude, profile_image, created_at, updated_at)
      VALUES (@id, @user_id, @name, NULL, NULL, NULL, NULL,
        NULL, NULL, NULL, @created_at, @updated_at)`,
    ).run({
      id: profileId,
      user_id: userId,
      name: fullName,
      created_at: now,
      updated_at: now,
    });

    const user = { id: userId, email };
    const token = createAccessToken(user);
    return res
      .header({
        Authorization: `Bearer ${token}`,
      })
      .json({
        message: `Registered user: ${fullName}`,
        token,
      });
  } catch (error) {
    if (error instanceof SqliteError) {
      console.error(`[ERROR] (${error.code}) ${error.message}`);
      if (error.code == "SQLITE_CONSTRAINT_UNIQUE") {
        res.status(409).json({ detail: "user already exists" });
        return;
      }
    }

    console.error(`[ERROR] unexpected server error: ${error}`);
    return res.status(500).json({ detail: "could not register user" });
  }
});

router.get("/logout", async (req, res) => {
  if (
    db
      .prepare(
        `UPDATE sessions SET revoked_at = @revoked_at WHERE id = @session_id`,
      )
      .run({
        session_id: req.session.session_id,
        revoked_at: new Date().toISOString(),
      }).changes !== 0
  ) {
    return res.json({ message: "Goodbye!" });
  }
  return res.status(404).json({ detail: "session not found" });
});

export { router };

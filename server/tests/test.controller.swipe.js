import { jest } from "@jest/globals";
import { describe, it, expect, beforeEach } from "@jest/globals";
import request from "supertest";
import express from "express";

// Create mock functions
const mockDbPrepare = jest.fn();

// Mock modules before importing
jest.unstable_mockModule("../db/index.js", () => ({
  db: { prepare: mockDbPrepare },
}));

// Import router after mocking
const { router: swipeRouter } = await import("../controllers/swipe.js");

describe("Swipe Controller", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Mock session middleware
    app.use((req, res, next) => {
      req.session = { user_id: "user-123" };
      next();
    });
    
    app.use("/swipes", swipeRouter);
    jest.clearAllMocks();
  });

  describe("GET /swipes", () => {
    it("should return all swipes", async () => {
      const mockSwipes = [
        { id: "swipe-1", swiper_id: "user-1", swipee_id: "user-2", direction: "R" },
        { id: "swipe-2", swiper_id: "user-2", swipee_id: "user-3", direction: "L" },
      ];

      mockDbPrepare.mockReturnValue({
        all: jest.fn().mockReturnValue(mockSwipes),
      });

      const response = await request(app).get("/swipes");

      expect(response.status).toBe(200);
      expect(response.body.swipes).toEqual(mockSwipes);
    });

    it("should filter swipes by swiper_id", async () => {
      const mockSwipes = [
        { id: "swipe-1", swiper_id: "user-1", swipee_id: "user-2", direction: "R" },
      ];

      mockDbPrepare.mockReturnValue({
        all: jest.fn().mockReturnValue(mockSwipes),
      });

      const response = await request(app).get("/swipes?swiper_id=user-1");

      expect(response.status).toBe(200);
      expect(response.body.swipes).toEqual(mockSwipes);
    });

    it("should filter swipes by swipee_id", async () => {
      const mockSwipes = [
        { id: "swipe-1", swiper_id: "user-1", swipee_id: "user-2", direction: "R" },
      ];

      mockDbPrepare.mockReturnValue({
        all: jest.fn().mockReturnValue(mockSwipes),
      });

      const response = await request(app).get("/swipes?swipee_id=user-2");

      expect(response.status).toBe(200);
      expect(response.body.swipes).toEqual(mockSwipes);
    });

    it("should filter swipes by both swiper_id and swipee_id", async () => {
      const mockSwipes = [
        { id: "swipe-1", swiper_id: "user-1", swipee_id: "user-2", direction: "R" },
      ];

      mockDbPrepare.mockReturnValue({
        all: jest.fn().mockReturnValue(mockSwipes),
      });

      const response = await request(app).get("/swipes?swiper_id=user-1&swipee_id=user-2");

      expect(response.status).toBe(200);
      expect(response.body.swipes).toEqual(mockSwipes);
    });
  });

  describe("GET /swipes/:id", () => {
    it("should return a specific swipe", async () => {
      const mockSwipe = {
        id: "swipe-1",
        swiper_id: "user-1",
        swipee_id: "user-2",
        direction: "R",
      };

      mockDbPrepare.mockReturnValue({
        get: jest.fn().mockReturnValue(mockSwipe),
      });

      const response = await request(app).get("/swipes/swipe-1");

      expect(response.status).toBe(200);
      expect(response.body.swipe).toEqual(mockSwipe);
    });

    it("should return 404 when swipe not found", async () => {
      mockDbPrepare.mockReturnValue({
        get: jest.fn().mockReturnValue(null),
      });

      const response = await request(app).get("/swipes/nonexistent");

      expect(response.status).toBe(404);
      expect(response.body.detail).toBe("swipe not found");
    });
  });

  describe("POST /swipes", () => {
    it("should create a swipe with direction R", async () => {
      mockDbPrepare.mockImplementation((sql) => {
        if (sql.includes("INSERT INTO swipes")) {
          return { run: jest.fn().mockReturnValue({ changes: 1 }) };
        }
        if (sql.includes("SELECT id FROM users")) {
          return { get: jest.fn().mockReturnValue({ id: "user-456" }) };
        }
        if (sql.includes("swiper_id = @swipee")) {
          // reciprocal check should return null so no match
          return { get: jest.fn().mockReturnValue(null) };
        }
        return { run: jest.fn(), get: jest.fn(), all: jest.fn() };
      });

      const response = await request(app)
        .post("/swipes")
        .send({
          swipee_id: "user-456",
          direction: "R",
        });

      expect(response.status).toBe(201);
      expect(response.body.swipe).toMatchObject({
        swiper_id: "user-123",
        swipee_id: "user-456",
        direction: "R",
      });
      expect(response.body.match_created).toBeUndefined();
    });

    it("should create a swipe with direction L", async () => {
      mockDbPrepare.mockImplementation((sql) => {
        if (sql.includes("INSERT INTO swipes")) {
          return { run: jest.fn().mockReturnValue({ changes: 1 }) };
        }
        if (sql.includes("SELECT id FROM users")) {
          return { get: jest.fn().mockReturnValue({ id: "user-456" }) };
        }
        // L swipe won't check reciprocal but we still return null
        return { run: jest.fn(), get: jest.fn(), all: jest.fn() };
      });

      const response = await request(app)
        .post("/swipes")
        .send({
          swipee_id: "user-456",
          direction: "L",
        });

      expect(response.status).toBe(201);
      expect(response.body.swipe).toMatchObject({
        swiper_id: "user-123",
        swipee_id: "user-456",
        direction: "L",
      });
      expect(response.body.match_created).toBeUndefined();
    });

    it("should accept lowercase direction and convert to uppercase", async () => {
      mockDbPrepare.mockImplementation((sql) => {
        if (sql.includes("INSERT INTO swipes")) {
          return { run: jest.fn().mockReturnValue({ changes: 1 }) };
        }
        if (sql.includes("SELECT id FROM users")) {
          return { get: jest.fn().mockReturnValue({ id: "user-456" }) };
        }
        if (sql.includes("swiper_id = @swipee")) {
          return { get: jest.fn().mockReturnValue(null) };
        }
        return { run: jest.fn(), get: jest.fn(), all: jest.fn() };
      });

      const response = await request(app)
        .post("/swipes")
        .send({
          swipee_id: "user-456",
          direction: "r",
        });

      expect(response.status).toBe(201);
      expect(response.body.swipe.direction).toBe("R");
      expect(response.body.match_created).toBeUndefined();
    });

    it("should return 400 when swipee_id is missing", async () => {
      const response = await request(app)
        .post("/swipes")
        .send({
          direction: "R",
        });

      expect(response.status).toBe(400);
      expect(response.body.detail).toBe("swipee_id and direction required");
    });

    it("should return 400 when direction is missing", async () => {
      const response = await request(app)
        .post("/swipes")
        .send({
          swipee_id: "user-456",
        });

      expect(response.status).toBe(400);
      expect(response.body.detail).toBe("swipee_id and direction required");
    });

    it("should return 400 for invalid direction", async () => {
      const response = await request(app)
        .post("/swipes")
        .send({
          swipee_id: "user-456",
          direction: "X",
        });

      expect(response.status).toBe(400);
      expect(response.body.detail).toBe("direction must be 'L' or 'R'");
    });

    it("should create a match and conversation when a reciprocal right swipe exists", async () => {
      // custom mock implementation to simulate DB behavior
      mockDbPrepare.mockImplementation((sql) => {
        if (sql.includes("INSERT INTO swipes")) {
          return { run: jest.fn().mockReturnValue({ changes: 1 }) };
        }
        if (sql.includes("SELECT id FROM users")) {
          return { get: jest.fn().mockReturnValue({ id: "user-456" }) };
        }
        if (
          sql.includes("FROM swipes") &&
          sql.includes("swiper_id = @swipee")
        ) {
          // reciprocal like is present
          return {
            get: jest.fn().mockReturnValue({
              id: "swipe-recip",
              swiper_id: "user-456",
              swipee_id: "user-123",
              direction: "R",
            }),
          };
        }
        if (sql.includes("SELECT id FROM matches")) {
          return { get: jest.fn().mockReturnValue(null) };
        }
        if (sql.startsWith("INSERT INTO matches")) {
          return { run: jest.fn().mockReturnValue({ changes: 1 }) };
        }
        if (sql.startsWith("INSERT INTO conversations")) {
          return { run: jest.fn().mockReturnValue({ changes: 1 }) };
        }
        // default stub
        return { run: jest.fn(), get: jest.fn(), all: jest.fn() };
      });

      const response = await request(app)
        .post("/swipes")
        .send({
          swipee_id: "user-456",
          direction: "R",
        });

      expect(response.status).toBe(201);
      expect(response.body.swipe).toMatchObject({
        swiper_id: "user-123",
        swipee_id: "user-456",
        direction: "R",
      });
      expect(response.body.match_created).toBe(true);
      expect(response.body.match_id).toBeDefined();
      expect(response.body.conversation_id).toBeDefined();
    });

    it("should create a conversation when a match already exists but no conversation", async () => {
      mockDbPrepare.mockImplementation((sql) => {
        if (sql.includes("INSERT INTO swipes")) {
          return { run: jest.fn().mockReturnValue({ changes: 1 }) };
        }
        if (sql.includes("SELECT id FROM users")) {
          return { get: jest.fn().mockReturnValue({ id: "user-456" }) };
        }
        if (
          sql.includes("FROM swipes") &&
          sql.includes("swiper_id = @swipee")
        ) {
          // reciprocal like is present
          return {
            get: jest.fn().mockReturnValue({
              id: "swipe-recip",
              swiper_id: "user-456",
              swipee_id: "user-123",
              direction: "R",
            }),
          };
        }
        if (sql.includes("SELECT id FROM matches")) {
          return { get: jest.fn().mockReturnValue({ id: "match-1" }) };
        }
        if (sql.includes("SELECT id FROM conversations")) {
          return { get: jest.fn().mockReturnValue(null) };
        }
        if (sql.startsWith("INSERT INTO conversations")) {
          return { run: jest.fn().mockReturnValue({ changes: 1 }) };
        }
        // default stub
        return { run: jest.fn(), get: jest.fn(), all: jest.fn() };
      });

      const response = await request(app)
        .post("/swipes")
        .send({
          swipee_id: "user-456",
          direction: "R",
        });

      expect(response.status).toBe(201);
      expect(response.body.match_created).toBe(true);
      expect(response.body.conversation_id).toBeDefined();
    });
  });

  describe("DELETE /swipes/:id", () => {
    it("should delete a swipe", async () => {
      const mockSwipe = {
        id: "swipe-1",
        swiper_id: "user-123",
        swipee_id: "user-456",
        direction: "R",
      };

      mockDbPrepare
        .mockReturnValueOnce({
          get: jest.fn().mockReturnValue(mockSwipe),
        })
        .mockReturnValueOnce({
          run: jest.fn().mockReturnValue({ changes: 1 }),
        });

      const response = await request(app).delete("/swipes/swipe-1");

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("swipe deleted");
    });

    it("should return 404 when swipe not found", async () => {
      mockDbPrepare.mockReturnValue({
        get: jest.fn().mockReturnValue(null),
      });

      const response = await request(app).delete("/swipes/nonexistent");

      expect(response.status).toBe(404);
      expect(response.body.detail).toBe("swipe not found");
    });

    it("should return 403 when user is not the swiper", async () => {
      const mockSwipe = {
        id: "swipe-1",
        swiper_id: "different-user",
        swipee_id: "user-456",
        direction: "R",
      };

      mockDbPrepare.mockReturnValue({
        get: jest.fn().mockReturnValue(mockSwipe),
      });

      const response = await request(app).delete("/swipes/swipe-1");

      expect(response.status).toBe(403);
      expect(response.body.detail).toBe("forbidden");
    });
  });
});

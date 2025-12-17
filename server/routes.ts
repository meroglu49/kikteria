import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { insertUserSchema, insertLeaderboardSchema } from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

const scryptAsync = promisify(scrypt);
const crypto = { scrypt: scryptAsync, randomBytes, timingSafeEqual };

// Password hashing utilities
async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  const buf = (await crypto.scrypt(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(
  supplied: string,
  stored: string,
): Promise<boolean> {
  const [hashedPassword, salt] = stored.split(".");
  const hashedPasswordBuf = Buffer.from(hashedPassword, "hex");
  const suppliedPasswordBuf = (await crypto.scrypt(
    supplied,
    salt,
    64,
  )) as Buffer;
  return crypto.timingSafeEqual(hashedPasswordBuf, suppliedPasswordBuf);
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Session configuration
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "snake-clash-secret-key-change-in-production",
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
      },
    })
  );

  // Passport configuration
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: "Invalid username or password" });
        }
        const isValid = await comparePasswords(password, user.password);
        if (!isValid) {
          return done(null, false, { message: "Invalid username or password" });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Auth middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    next();
  };

  // ==================== AUTH ROUTES ====================
  
  // Register
  app.post("/api/auth/register", async (req, res) => {
    try {
      const result = insertUserSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          error: fromZodError(result.error).message 
        });
      }

      const { username, password } = result.data;

      // Check if user exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }

      // Hash password and create user
      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        username,
        password: hashedPassword,
      });

      // Create player profile with default values
      await storage.createPlayerProfile({
        userId: user.id,
        coins: 500,
        highScore: 0,
        speedUpgrade: 1,
        startSizeUpgrade: 1,
        magnetUpgrade: 1,
      });

      // Auto-login after registration
      req.login(user, (err: any) => {
        if (err) {
          return res.status(500).json({ error: "Login failed after registration" });
        }
        res.json({ 
          id: user.id, 
          username: user.username 
        });
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Login
  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!user) {
        return res.status(401).json({ error: info.message || "Login failed" });
      }
      req.login(user, (loginErr) => {
        if (loginErr) {
          return res.status(500).json({ error: "Login failed" });
        }
        res.json({ 
          id: user.id, 
          username: user.username 
        });
      });
    })(req, res, next);
  });

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ success: true });
    });
  });

  // Get current user
  app.get("/api/auth/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const user = req.user as any;
    res.json({ 
      id: user.id, 
      username: user.username 
    });
  });

  // ==================== PLAYER PROFILE ROUTES ====================

  // Get player profile
  app.get("/api/profile", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const profile = await storage.getPlayerProfile(user.id);
      
      if (!profile) {
        // Create default profile if it doesn't exist
        const newProfile = await storage.createPlayerProfile({
          userId: user.id,
          coins: 500,
          highScore: 0,
          speedUpgrade: 1,
          startSizeUpgrade: 1,
          magnetUpgrade: 1,
        });
        return res.json(newProfile);
      }
      
      res.json(profile);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update player profile
  app.patch("/api/profile", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      
      // Validate updates
      const updateSchema = z.object({
        coins: z.number().optional(),
        highScore: z.number().optional(),
        speedUpgrade: z.number().optional(),
        startSizeUpgrade: z.number().optional(),
        magnetUpgrade: z.number().optional(),
      });
      
      const result = updateSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          error: fromZodError(result.error).message 
        });
      }

      const updatedProfile = await storage.updatePlayerProfile(user.id, result.data);
      res.json(updatedProfile);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== LEADERBOARD ROUTES ====================

  // Get top scores
  app.get("/api/leaderboard", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const topScores = await storage.getTopScores(limit);
      res.json(topScores);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Submit score to leaderboard
  app.post("/api/leaderboard", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      
      const scoreSchema = z.object({
        score: z.number().min(0),
      });
      
      const result = scoreSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          error: fromZodError(result.error).message 
        });
      }

      const { score } = result.data;

      // Add to leaderboard
      const entry = await storage.addLeaderboardEntry({
        userId: user.id,
        username: user.username,
        score,
      });

      // Update high score in profile if this is a new record
      const profile = await storage.getPlayerProfile(user.id);
      if (profile && score > profile.highScore) {
        await storage.updatePlayerProfile(user.id, { highScore: score });
      }

      res.json(entry);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== LEVEL PROGRESS ROUTES ====================

  // Get user's level progress
  app.get("/api/levels/progress", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const progress = await storage.getLevelProgressByUser(user.id);
      res.json(progress);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update level progress (complete a level)
  app.post("/api/levels/progress", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      
      const progressSchema = z.object({
        levelNumber: z.number().min(1),
        score: z.number().min(0),
        completed: z.boolean(),
      });
      
      const result = progressSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          error: fromZodError(result.error).message 
        });
      }

      const { levelNumber, score, completed } = result.data;
      const progress = await storage.upsertLevelProgress(user.id, levelNumber, score, completed);
      res.json(progress);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return httpServer;
}

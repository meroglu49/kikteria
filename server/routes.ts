import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

// Achievement definitions for auto-seeding
const ACHIEVEMENT_DEFS = [
  { id: 'first_placement', name: 'First Contact', description: 'Place your first bacteria', category: 'mastery', tier: 1, requirement: 1, coinReward: 10, badgeIcon: '🦠' },
  { id: 'placements_100', name: 'Lab Technician', description: 'Place 100 bacteria', category: 'mastery', tier: 1, requirement: 100, coinReward: 50, badgeIcon: '🔬' },
  { id: 'placements_500', name: 'Senior Researcher', description: 'Place 500 bacteria', category: 'mastery', tier: 2, requirement: 500, coinReward: 150, badgeIcon: '👨‍🔬' },
  { id: 'placements_2000', name: 'Chief Scientist', description: 'Place 2000 bacteria', category: 'mastery', tier: 3, requirement: 2000, coinReward: 500, badgeIcon: '🧬' },
  { id: 'score_1000', name: 'Coin Collector', description: 'Earn 1,000 total coins', category: 'collection', tier: 1, requirement: 1000, coinReward: 100, badgeIcon: '💰' },
  { id: 'score_5000', name: 'Treasure Hunter', description: 'Earn 5,000 total coins', category: 'collection', tier: 2, requirement: 5000, coinReward: 300, badgeIcon: '💎' },
  { id: 'score_20000', name: 'Wealthy Scientist', description: 'Earn 20,000 total coins', category: 'collection', tier: 3, requirement: 20000, coinReward: 1000, badgeIcon: '👑' },
  { id: 'level_1', name: 'Getting Started', description: 'Complete Level 1', category: 'challenge', tier: 1, requirement: 1, coinReward: 25, badgeIcon: '⭐' },
  { id: 'level_3', name: 'Making Progress', description: 'Complete Level 3', category: 'challenge', tier: 1, requirement: 3, coinReward: 75, badgeIcon: '🌟' },
  { id: 'level_5', name: 'Lab Veteran', description: 'Complete Level 5', category: 'challenge', tier: 2, requirement: 5, coinReward: 200, badgeIcon: '✨' },
  { id: 'level_7', name: 'Master Containment', description: 'Complete all 7 levels', category: 'challenge', tier: 3, requirement: 7, coinReward: 500, badgeIcon: '🏆' },
  { id: 'daily_1', name: 'First Order', description: 'Complete your first daily order', category: 'social', tier: 1, requirement: 1, coinReward: 50, badgeIcon: '📋' },
  { id: 'daily_7', name: 'Weekly Regular', description: 'Complete 7 daily orders', category: 'social', tier: 2, requirement: 7, coinReward: 200, badgeIcon: '📅' },
  { id: 'daily_30', name: 'Dedicated Scientist', description: 'Complete 30 daily orders', category: 'social', tier: 3, requirement: 30, coinReward: 750, badgeIcon: '🎖️' },
  { id: 'endless_10', name: 'Survivor', description: 'Reach wave 10 in Endless Mode', category: 'challenge', tier: 2, requirement: 10, coinReward: 300, badgeIcon: '♾️' },
  { id: 'endless_25', name: 'Containment Expert', description: 'Reach wave 25 in Endless Mode', category: 'challenge', tier: 3, requirement: 25, coinReward: 1000, badgeIcon: '🔥' },
  { id: 'bomb_master', name: 'Demolition Expert', description: 'Use 50 bombs', category: 'challenge', tier: 2, requirement: 50, coinReward: 200, badgeIcon: '💣' },
];

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Replit Auth (BEFORE other routes)
  await setupAuth(app);
  registerAuthRoutes(app);
  
  // Auto-seed achievements on startup
  try {
    await storage.seedAchievements(ACHIEVEMENT_DEFS);
    console.log('[achievements] Seeded achievements on startup');
  } catch (e) {
    console.error('[achievements] Failed to seed achievements:', e);
  }

  // ==================== PLAYER PROFILE ROUTES ====================

  // Get player profile
  app.get("/api/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const profile = await storage.getPlayerProfile(userId);
      
      if (!profile) {
        // Create default profile if it doesn't exist
        const newProfile = await storage.createPlayerProfile({
          userId: userId,
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
  app.patch("/api/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      
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

      const updatedProfile = await storage.updatePlayerProfile(userId, result.data);
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
  app.post("/api/leaderboard", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const displayName = req.user?.claims?.first_name || req.user?.claims?.email?.split('@')[0] || 'Player';
      
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
        userId: userId,
        username: displayName,
        score,
      });

      // Update high score in profile if this is a new record
      const profile = await storage.getPlayerProfile(userId);
      if (profile && score > profile.highScore) {
        await storage.updatePlayerProfile(userId, { highScore: score });
      }

      res.json(entry);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== LEVEL PROGRESS ROUTES ====================

  // Get user's level progress
  app.get("/api/levels/progress", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const progress = await storage.getLevelProgressByUser(userId);
      res.json(progress);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update level progress
  app.post("/api/levels/progress", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      
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
      const progress = await storage.upsertLevelProgress(userId, levelNumber, score, completed);
      res.json(progress);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== VERSION CHECK ROUTES ====================

  // Get current update policy (public, no auth required)
  app.get("/api/version", async (_req, res) => {
    try {
      const policy = await storage.getActiveUpdatePolicy();
      
      if (!policy) {
        return res.json({
          latestVersion: "1.2.0",
          minSupportedVersion: "1.0.0",
          downloadUrl: "/",
          releaseNotes: null,
        });
      }
      
      res.json({
        latestVersion: policy.latestVersion,
        minSupportedVersion: policy.minSupportedVersion,
        downloadUrl: policy.downloadUrl,
        releaseNotes: policy.releaseNotes,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== ANALYTICS/METADATA ROUTES ====================

  // Submit error logs (synced then deleted from client)
  app.post("/api/errors", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || null;
      
      const errorLogSchema = z.object({
        severity: z.enum(['error', 'warn', 'info']),
        category: z.enum(['runtime', 'api', 'sync', 'game', 'asset']),
        message: z.string(),
        stack: z.string().optional(),
        component: z.string().optional(),
        currentScreen: z.string().optional(),
        gameState: z.string().optional(),
        apiInfo: z.string().optional(),
        sessionId: z.string(),
        deviceInfo: z.string(),
        networkStatus: z.string(),
        lastUserAction: z.string().optional(),
        eventTime: z.string(),
      });
      
      const logsSchema = z.object({
        logs: z.array(errorLogSchema),
      });
      
      const result = logsSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          error: fromZodError(result.error).message 
        });
      }

      const logsWithUser = result.data.logs.map(log => ({
        userId,
        severity: log.severity,
        category: log.category,
        message: log.message,
        stack: log.stack ?? null,
        component: log.component ?? null,
        currentScreen: log.currentScreen ?? null,
        gameState: log.gameState ?? null,
        apiInfo: log.apiInfo ?? null,
        sessionId: log.sessionId,
        deviceInfo: log.deviceInfo,
        networkStatus: log.networkStatus,
        lastUserAction: log.lastUserAction ?? null,
        eventTime: new Date(log.eventTime),
      }));

      await storage.insertErrorLogs(logsWithUser);
      res.json({ success: true, count: logsWithUser.length });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Submit analytics events (metadata - synced then deleted from client)
  app.post("/api/analytics", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      
      const eventSchema = z.object({
        eventType: z.enum(['level_play', 'level_success', 'level_fail', 'session_start', 'session_end']),
        levelNumber: z.number().optional(),
        score: z.number().optional(),
        playDuration: z.number().optional(),
        eventDate: z.string(),
        eventTime: z.string(),
        sessionId: z.string(),
        deviceInfo: z.string(),
      });
      
      const eventsSchema = z.object({
        events: z.array(eventSchema),
      });
      
      const result = eventsSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          error: fromZodError(result.error).message 
        });
      }

      const eventsWithUser = result.data.events.map(event => ({
        userId,
        eventType: event.eventType,
        levelNumber: event.levelNumber ?? null,
        score: event.score ?? null,
        playDuration: event.playDuration ?? null,
        eventDate: event.eventDate,
        eventTime: new Date(event.eventTime),
        sessionId: event.sessionId,
        deviceInfo: event.deviceInfo,
      }));

      await storage.insertAnalyticsEvents(eventsWithUser);
      res.json({ success: true, count: eventsWithUser.length });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== ADMIN ROUTES ====================
  
  const ADMIN_USER_IDS = ['51476893'];
  
  const isAdmin = (req: any, res: any, next: any) => {
    if (!req.user?.claims?.sub) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    if (!ADMIN_USER_IDS.includes(req.user.claims.sub)) {
      return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }
    next();
  };

  app.get("/api/admin/stats", isAuthenticated, isAdmin, async (_req, res) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/users", isAuthenticated, isAdmin, async (_req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/profiles", isAuthenticated, isAdmin, async (_req, res) => {
    try {
      const profiles = await storage.getAllProfiles();
      res.json(profiles);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/levels", isAuthenticated, isAdmin, async (_req, res) => {
    try {
      const levels = await storage.getAllLevelProgress();
      res.json(levels);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/leaderboard", isAuthenticated, isAdmin, async (_req, res) => {
    try {
      const entries = await storage.getTopScores(100);
      res.json(entries);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/analytics", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const analytics = await storage.getAllAnalytics(limit);
      res.json(analytics);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/errors", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const errors = await storage.getAllErrorLogs(limit);
      res.json(errors);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/update-policy", isAuthenticated, isAdmin, async (_req, res) => {
    try {
      const policy = await storage.getActiveUpdatePolicy();
      res.json(policy || { latestVersion: '1.3.0', minSupportedVersion: '1.0.0', downloadUrl: '/', releaseNotes: null });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/update-policy", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const policySchema = z.object({
        latestVersion: z.string(),
        minSupportedVersion: z.string(),
        downloadUrl: z.string(),
        releaseNotes: z.string().optional(),
      });
      
      const result = policySchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: fromZodError(result.error).message });
      }
      
      const policy = await storage.upsertUpdatePolicy(result.data);
      res.json(policy);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/admin/user/:userId", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteUserData(req.params.userId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== DAILY LAB ORDERS ROUTES ====================

  app.get("/api/daily-order", async (req: any, res) => {
    try {
      let order = await storage.getTodaysDailyOrder();
      
      // Auto-generate daily order if none exists
      if (!order) {
        const templates = [
          { id: 'speed_run', title: 'Speed Containment', description: 'Complete a round in record time!', difficulty: 'medium', targetScore: 150, coinReward: 200, modifiers: JSON.stringify({ timeLimit: 30, speedMultiplier: 1.5 }) },
          { id: 'big_bacteria', title: 'Giant Outbreak', description: 'Handle oversized bacteria!', difficulty: 'hard', targetScore: 200, coinReward: 350, modifiers: JSON.stringify({ sizeMultiplier: 1.4 }) },
          { id: 'calm_waters', title: 'Calm Lab Day', description: 'Slower vibrations make placement easier.', difficulty: 'easy', targetScore: 100, coinReward: 100, modifiers: JSON.stringify({ speedMultiplier: 0.7 }) },
        ];
        const today = new Date().toISOString().split('T')[0];
        const dayIndex = new Date().getDay();
        const template = templates[dayIndex % templates.length];
        
        order = await storage.createDailyOrder({
          orderDate: today,
          ...template,
        });
      }
      
      // Check if user has completed today's order
      const userId = req.user?.claims?.sub;
      let completion = null;
      if (userId) {
        completion = await storage.getDailyOrderCompletion(userId, order.orderDate);
      }
      
      res.json({ order, completion, isCompleted: !!completion });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/daily-order/complete", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      
      const schema = z.object({
        scoreAchieved: z.number().min(0),
      });
      
      const result = schema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: fromZodError(result.error).message });
      }
      
      const order = await storage.getTodaysDailyOrder();
      if (!order) {
        return res.status(404).json({ error: 'No daily order available today' });
      }
      
      // Check if already completed
      const existing = await storage.getDailyOrderCompletion(userId, order.orderDate);
      if (existing) {
        return res.status(400).json({ error: 'Already completed today\'s order' });
      }
      
      const completion = await storage.completeDailyOrder({
        userId,
        orderDate: order.orderDate,
        scoreAchieved: result.data.scoreAchieved,
      });
      
      // Award coins if target reached
      let coinsAwarded = 0;
      if (result.data.scoreAchieved >= order.targetScore) {
        coinsAwarded = order.coinReward;
        const profile = await storage.getPlayerProfile(userId);
        if (profile) {
          await storage.updatePlayerProfile(userId, { coins: profile.coins + coinsAwarded });
        }
      }
      
      res.json({ completion, coinsAwarded, success: result.data.scoreAchieved >= order.targetScore });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== WEEKLY COMMUNITY GOALS ROUTES ====================

  app.get("/api/community-goal", async (req: any, res) => {
    try {
      let goal = await storage.getCurrentWeeklyGoal();
      
      // Auto-generate weekly goal if none exists
      if (!goal) {
        const now = new Date();
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(now.setDate(diff));
        const weekStart = monday.toISOString().split('T')[0];
        
        const templates = [
          { title: 'Mass Containment Protocol', description: 'Community Goal: Place 50,000 bacteria together!', goalType: 'total_placements', targetValue: 50000, rewardType: 'coins', rewardData: JSON.stringify({ amount: 500 }) },
          { title: 'Score Summit', description: 'Community Goal: Reach 1,000,000 combined score!', goalType: 'total_score', targetValue: 1000000, rewardType: 'cosmetic', rewardData: JSON.stringify({ cosmeticId: 'neon_glow', cosmeticName: 'Neon Glow Effect' }) },
        ];
        const weekIndex = Math.floor(now.getTime() / (7 * 24 * 60 * 60 * 1000)) % templates.length;
        const template = templates[weekIndex];
        
        goal = await storage.createWeeklyGoal({
          weekStart,
          ...template,
          currentValue: 0,
          isCompleted: 0,
        });
      }
      
      // Get user's contribution if authenticated
      const userId = req.user?.claims?.sub;
      let userContribution = null;
      if (userId) {
        userContribution = await storage.getUserWeeklyContribution(userId, goal.weekStart);
      }
      
      const progressPercentage = Math.min(100, (goal.currentValue / goal.targetValue) * 100);
      
      res.json({ 
        goal, 
        userContribution: userContribution?.contribution || 0,
        progressPercentage,
        isCompleted: goal.isCompleted === 1
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/community-goal/contribute", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      
      const schema = z.object({
        amount: z.number().min(1),
      });
      
      const result = schema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: fromZodError(result.error).message });
      }
      
      const goal = await storage.getCurrentWeeklyGoal();
      if (!goal) {
        return res.status(404).json({ error: 'No weekly goal available' });
      }
      
      // Record user's contribution
      const contribution = await storage.recordUserContribution(userId, goal.weekStart, result.data.amount);
      
      // Update global goal progress
      const updatedGoal = await storage.contributeToWeeklyGoal(goal.weekStart, result.data.amount);
      
      res.json({ contribution, goal: updatedGoal });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== ACHIEVEMENTS ROUTES ====================

  app.get("/api/achievements", async (_req, res) => {
    try {
      const achievementsList = await storage.getAllAchievements();
      res.json(achievementsList);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/achievements/progress", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const progress = await storage.getUserAchievementProgress(userId);
      res.json(progress);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/achievements/progress", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      
      const schema = z.object({
        achievementId: z.string(),
        progress: z.number().min(0),
      });
      
      const result = schema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: fromZodError(result.error).message });
      }
      
      // Get previous state to check if newly unlocked
      const existingProgress = await storage.getUserAchievementProgress(userId);
      const previousState = existingProgress.find(p => p.achievementId === result.data.achievementId);
      const wasUnlocked = previousState?.isUnlocked === 1;
      
      const updated = await storage.updateAchievementProgress(userId, result.data.achievementId, result.data.progress);
      const newlyUnlocked = updated.isUnlocked === 1 && !wasUnlocked;
      
      // Get achievement details if newly unlocked
      let achievementDetails = null;
      if (newlyUnlocked) {
        const allAchievements = await storage.getAllAchievements();
        achievementDetails = allAchievements.find(a => a.id === result.data.achievementId);
      }
      
      res.json({ 
        ...updated, 
        newlyUnlocked,
        achievementDetails
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/achievements/claim", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      
      const schema = z.object({
        achievementId: z.string(),
      });
      
      const result = schema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: fromZodError(result.error).message });
      }
      
      const claimed = await storage.claimAchievement(userId, result.data.achievementId);
      if (!claimed) {
        return res.status(400).json({ error: 'Achievement cannot be claimed' });
      }
      
      // Get achievement details for coin reward
      const achievements = await storage.getAllAchievements();
      const achievement = achievements.find(a => a.id === result.data.achievementId);
      
      if (achievement) {
        const profile = await storage.getPlayerProfile(userId);
        if (profile) {
          await storage.updatePlayerProfile(userId, { coins: profile.coins + achievement.coinReward });
        }
      }
      
      res.json({ claimed, coinsAwarded: achievement?.coinReward || 0 });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Generate documentation to Google Docs
  app.post("/api/admin/generate-docs", isAuthenticated, isAdmin, async (_req, res) => {
    try {
      const { generateAllDocumentation } = await import('./generate-docs');
      const urls = await generateAllDocumentation();
      res.json({ success: true, documents: urls });
    } catch (error: any) {
      console.error('[docs] Failed to generate documentation:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Seed achievements on startup (admin only but useful for initial setup)
  app.post("/api/admin/seed-achievements", isAuthenticated, isAdmin, async (_req, res) => {
    try {
      const achievementDefs = [
        { id: 'first_placement', name: 'First Contact', description: 'Place your first bacteria', category: 'mastery', tier: 1, requirement: 1, coinReward: 10, badgeIcon: '🦠' },
        { id: 'placements_100', name: 'Lab Technician', description: 'Place 100 bacteria', category: 'mastery', tier: 1, requirement: 100, coinReward: 50, badgeIcon: '🔬' },
        { id: 'placements_500', name: 'Senior Researcher', description: 'Place 500 bacteria', category: 'mastery', tier: 2, requirement: 500, coinReward: 150, badgeIcon: '👨‍🔬' },
        { id: 'placements_2000', name: 'Chief Scientist', description: 'Place 2000 bacteria', category: 'mastery', tier: 3, requirement: 2000, coinReward: 500, badgeIcon: '🧬' },
        { id: 'score_1000', name: 'Coin Collector', description: 'Earn 1,000 total coins', category: 'collection', tier: 1, requirement: 1000, coinReward: 100, badgeIcon: '💰' },
        { id: 'score_5000', name: 'Treasure Hunter', description: 'Earn 5,000 total coins', category: 'collection', tier: 2, requirement: 5000, coinReward: 300, badgeIcon: '💎' },
        { id: 'level_1', name: 'Getting Started', description: 'Complete Level 1', category: 'challenge', tier: 1, requirement: 1, coinReward: 25, badgeIcon: '⭐' },
        { id: 'level_7', name: 'Master Containment', description: 'Complete all 7 levels', category: 'challenge', tier: 3, requirement: 7, coinReward: 500, badgeIcon: '🏆' },
        { id: 'daily_1', name: 'First Order', description: 'Complete your first daily order', category: 'social', tier: 1, requirement: 1, coinReward: 50, badgeIcon: '📋' },
        { id: 'endless_10', name: 'Survivor', description: 'Reach wave 10 in Endless Mode', category: 'challenge', tier: 2, requirement: 10, coinReward: 300, badgeIcon: '♾️' },
      ];
      
      await storage.seedAchievements(achievementDefs);
      res.json({ success: true, count: achievementDefs.length });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return httpServer;
}

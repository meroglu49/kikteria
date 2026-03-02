import { 
  playerProfiles,
  leaderboard,
  levelProgress,
  userAnalytics,
  errorLogs,
  appUpdatePolicy,
  users,
  dailyLabOrders,
  dailyOrderCompletions,
  weeklyGoals,
  weeklyGoalContributions,
  achievements,
  userAchievementProgress,
  type PlayerProfile,
  type InsertPlayerProfile,
  type Leaderboard,
  type InsertLeaderboard,
  type LevelProgress,
  type InsertLevelProgress,
  type InsertUserAnalytics,
  type InsertErrorLog,
  type AppUpdatePolicy,
  type User,
  type InsertAppUpdatePolicy,
  type DailyLabOrder,
  type InsertDailyLabOrder,
  type DailyOrderCompletion,
  type InsertDailyOrderCompletion,
  type WeeklyGoal,
  type InsertWeeklyGoal,
  type WeeklyGoalContribution,
  type Achievement,
  type InsertAchievement,
  type UserAchievementProgress,
  type InsertUserAchievementProgress
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  // Player Profile Management
  getPlayerProfile(userId: string): Promise<PlayerProfile | undefined>;
  createPlayerProfile(profile: InsertPlayerProfile): Promise<PlayerProfile>;
  updatePlayerProfile(userId: string, updates: Partial<InsertPlayerProfile>): Promise<PlayerProfile>;
  
  // Leaderboard Management
  getTopScores(limit: number): Promise<Leaderboard[]>;
  addLeaderboardEntry(entry: InsertLeaderboard): Promise<Leaderboard>;
  getUserBestScore(userId: string): Promise<number>;
  
  // Level Progress Management
  getLevelProgressByUser(userId: string): Promise<LevelProgress[]>;
  upsertLevelProgress(userId: string, levelNumber: number, score: number, completed: boolean): Promise<LevelProgress>;
  
  // Analytics/Metadata Management
  insertAnalyticsEvents(events: InsertUserAnalytics[]): Promise<void>;
  
  // Error Logs Management
  insertErrorLogs(logs: InsertErrorLog[]): Promise<void>;
  
  // App Update Policy
  getActiveUpdatePolicy(): Promise<AppUpdatePolicy | undefined>;
  upsertUpdatePolicy(policy: Omit<InsertAppUpdatePolicy, 'isActive'>): Promise<AppUpdatePolicy>;
  
  // Admin Methods
  getAllUsers(): Promise<User[]>;
  getAllProfiles(): Promise<(PlayerProfile & { email?: string; firstName?: string; lastName?: string })[]>;
  getAllLevelProgress(): Promise<LevelProgress[]>;
  getAllAnalytics(limit?: number): Promise<any[]>;
  getAllErrorLogs(limit?: number): Promise<any[]>;
  getAdminStats(): Promise<{ totalUsers: number; totalGamesPlayed: number; totalErrors: number }>;
  deleteUserData(userId: string): Promise<void>;
  
  // Daily Lab Orders
  getTodaysDailyOrder(): Promise<DailyLabOrder | undefined>;
  createDailyOrder(order: InsertDailyLabOrder): Promise<DailyLabOrder>;
  getDailyOrderCompletion(userId: string, orderDate: string): Promise<DailyOrderCompletion | undefined>;
  completeDailyOrder(completion: InsertDailyOrderCompletion): Promise<DailyOrderCompletion>;
  
  // Weekly Community Goals
  getCurrentWeeklyGoal(): Promise<WeeklyGoal | undefined>;
  createWeeklyGoal(goal: InsertWeeklyGoal): Promise<WeeklyGoal>;
  contributeToWeeklyGoal(weekStart: string, amount: number): Promise<WeeklyGoal | undefined>;
  getUserWeeklyContribution(userId: string, weekStart: string): Promise<WeeklyGoalContribution | undefined>;
  recordUserContribution(userId: string, weekStart: string, amount: number): Promise<WeeklyGoalContribution>;
  
  // Achievements
  getAllAchievements(): Promise<Achievement[]>;
  seedAchievements(achievementsList: InsertAchievement[]): Promise<void>;
  getUserAchievementProgress(userId: string): Promise<UserAchievementProgress[]>;
  updateAchievementProgress(userId: string, achievementId: string, progress: number): Promise<UserAchievementProgress>;
  claimAchievement(userId: string, achievementId: string): Promise<UserAchievementProgress | undefined>;
}

export class DatabaseStorage implements IStorage {
  // Player Profile Methods
  async getPlayerProfile(userId: string): Promise<PlayerProfile | undefined> {
    const [profile] = await db
      .select()
      .from(playerProfiles)
      .where(eq(playerProfiles.userId, userId));
    return profile || undefined;
  }
  
  async createPlayerProfile(profile: InsertPlayerProfile): Promise<PlayerProfile> {
    const [newProfile] = await db
      .insert(playerProfiles)
      .values(profile)
      .returning();
    return newProfile;
  }
  
  async updatePlayerProfile(userId: string, updates: Partial<InsertPlayerProfile>): Promise<PlayerProfile> {
    const [updatedProfile] = await db
      .update(playerProfiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(playerProfiles.userId, userId))
      .returning();
    return updatedProfile;
  }
  
  // Leaderboard Methods
  async getTopScores(limit: number = 10): Promise<Leaderboard[]> {
    return await db
      .select()
      .from(leaderboard)
      .orderBy(desc(leaderboard.score))
      .limit(limit);
  }
  
  async addLeaderboardEntry(entry: InsertLeaderboard): Promise<Leaderboard> {
    // Check if user already has a leaderboard entry
    const [existing] = await db
      .select()
      .from(leaderboard)
      .where(eq(leaderboard.userId, entry.userId));
    
    if (existing) {
      // Only update if new score is higher
      if (entry.score > existing.score) {
        const [updated] = await db
          .update(leaderboard)
          .set({ 
            score: entry.score, 
            createdAt: new Date() 
          })
          .where(eq(leaderboard.id, existing.id))
          .returning();
        return updated;
      }
      return existing;
    }
    
    // Create new entry
    const [newEntry] = await db
      .insert(leaderboard)
      .values(entry)
      .returning();
    return newEntry;
  }
  
  async getUserBestScore(userId: string): Promise<number> {
    const [result] = await db
      .select()
      .from(leaderboard)
      .where(eq(leaderboard.userId, userId))
      .orderBy(desc(leaderboard.score))
      .limit(1);
    return result?.score || 0;
  }
  
  // Level Progress Methods
  async getLevelProgressByUser(userId: string): Promise<LevelProgress[]> {
    return await db
      .select()
      .from(levelProgress)
      .where(eq(levelProgress.userId, userId))
      .orderBy(levelProgress.levelNumber);
  }
  
  async upsertLevelProgress(userId: string, levelNumber: number, score: number, completed: boolean): Promise<LevelProgress> {
    const [existing] = await db
      .select()
      .from(levelProgress)
      .where(and(eq(levelProgress.userId, userId), eq(levelProgress.levelNumber, levelNumber)));
    
    if (existing) {
      const [updated] = await db
        .update(levelProgress)
        .set({
          bestScore: score > existing.bestScore ? score : existing.bestScore,
          isCompleted: completed ? 1 : existing.isCompleted,
        })
        .where(eq(levelProgress.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(levelProgress)
        .values({
          userId,
          levelNumber,
          bestScore: score,
          isCompleted: completed ? 1 : 0,
        })
        .returning();
      return created;
    }
  }
  
  // Analytics/Metadata Methods
  async insertAnalyticsEvents(events: InsertUserAnalytics[]): Promise<void> {
    if (events.length === 0) return;
    await db.insert(userAnalytics).values(events);
  }
  
  // Error Logs Methods
  async insertErrorLogs(logs: InsertErrorLog[]): Promise<void> {
    if (logs.length === 0) return;
    await db.insert(errorLogs).values(logs);
  }
  
  // App Update Policy Methods
  async getActiveUpdatePolicy(): Promise<AppUpdatePolicy | undefined> {
    const [policy] = await db
      .select()
      .from(appUpdatePolicy)
      .where(eq(appUpdatePolicy.isActive, 1))
      .limit(1);
    return policy;
  }
  
  async upsertUpdatePolicy(policy: Omit<InsertAppUpdatePolicy, 'isActive'>): Promise<AppUpdatePolicy> {
    await db.update(appUpdatePolicy).set({ isActive: 0 });
    
    const [created] = await db
      .insert(appUpdatePolicy)
      .values({ ...policy, isActive: 1 })
      .returning();
    return created;
  }
  
  // Admin Methods
  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }
  
  async getAllProfiles(): Promise<(PlayerProfile & { email?: string; firstName?: string; lastName?: string })[]> {
    const results = await db
      .select({
        id: playerProfiles.id,
        userId: playerProfiles.userId,
        coins: playerProfiles.coins,
        highScore: playerProfiles.highScore,
        speedUpgrade: playerProfiles.speedUpgrade,
        startSizeUpgrade: playerProfiles.startSizeUpgrade,
        magnetUpgrade: playerProfiles.magnetUpgrade,
        updatedAt: playerProfiles.updatedAt,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(playerProfiles)
      .leftJoin(users, eq(playerProfiles.userId, users.id))
      .orderBy(desc(playerProfiles.highScore));
    return results.map(r => ({
      ...r,
      email: r.email || undefined,
      firstName: r.firstName || undefined,
      lastName: r.lastName || undefined,
    }));
  }
  
  async getAllLevelProgress(): Promise<LevelProgress[]> {
    return db.select().from(levelProgress).orderBy(desc(levelProgress.bestScore));
  }
  
  async getAllAnalytics(limit = 100): Promise<any[]> {
    return db
      .select()
      .from(userAnalytics)
      .orderBy(desc(userAnalytics.createdAt))
      .limit(limit);
  }
  
  async getAllErrorLogs(limit = 100): Promise<any[]> {
    return db
      .select()
      .from(errorLogs)
      .orderBy(desc(errorLogs.createdAt))
      .limit(limit);
  }
  
  async getAdminStats(): Promise<{ totalUsers: number; totalGamesPlayed: number; totalErrors: number }> {
    const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
    const [gamesCount] = await db.select({ count: sql<number>`count(*)` }).from(userAnalytics).where(eq(userAnalytics.eventType, 'level_play'));
    const [errorsCount] = await db.select({ count: sql<number>`count(*)` }).from(errorLogs);
    
    return {
      totalUsers: Number(userCount?.count || 0),
      totalGamesPlayed: Number(gamesCount?.count || 0),
      totalErrors: Number(errorsCount?.count || 0),
    };
  }
  
  async deleteUserData(userId: string): Promise<void> {
    await db.delete(levelProgress).where(eq(levelProgress.userId, userId));
    await db.delete(leaderboard).where(eq(leaderboard.userId, userId));
    await db.delete(playerProfiles).where(eq(playerProfiles.userId, userId));
    await db.delete(userAnalytics).where(eq(userAnalytics.userId, userId));
  }
  
  // Daily Lab Orders Methods
  async getTodaysDailyOrder(): Promise<DailyLabOrder | undefined> {
    const today = new Date().toISOString().split('T')[0];
    const [order] = await db
      .select()
      .from(dailyLabOrders)
      .where(eq(dailyLabOrders.orderDate, today));
    return order || undefined;
  }
  
  async createDailyOrder(order: InsertDailyLabOrder): Promise<DailyLabOrder> {
    const [created] = await db.insert(dailyLabOrders).values(order).returning();
    return created;
  }
  
  async getDailyOrderCompletion(userId: string, orderDate: string): Promise<DailyOrderCompletion | undefined> {
    const [completion] = await db
      .select()
      .from(dailyOrderCompletions)
      .where(and(
        eq(dailyOrderCompletions.userId, userId),
        eq(dailyOrderCompletions.orderDate, orderDate)
      ));
    return completion || undefined;
  }
  
  async completeDailyOrder(completion: InsertDailyOrderCompletion): Promise<DailyOrderCompletion> {
    const [created] = await db.insert(dailyOrderCompletions).values(completion).returning();
    return created;
  }
  
  // Weekly Community Goals Methods
  async getCurrentWeeklyGoal(): Promise<WeeklyGoal | undefined> {
    // Get the Monday of current week
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    const weekStart = monday.toISOString().split('T')[0];
    
    const [goal] = await db
      .select()
      .from(weeklyGoals)
      .where(eq(weeklyGoals.weekStart, weekStart));
    return goal || undefined;
  }
  
  async createWeeklyGoal(goal: InsertWeeklyGoal): Promise<WeeklyGoal> {
    const [created] = await db.insert(weeklyGoals).values(goal).returning();
    return created;
  }
  
  async contributeToWeeklyGoal(weekStart: string, amount: number): Promise<WeeklyGoal | undefined> {
    const [goal] = await db
      .select()
      .from(weeklyGoals)
      .where(eq(weeklyGoals.weekStart, weekStart));
    
    if (!goal) return undefined;
    
    const newValue = goal.currentValue + amount;
    const isCompleted = newValue >= goal.targetValue ? 1 : 0;
    
    const [updated] = await db
      .update(weeklyGoals)
      .set({ currentValue: newValue, isCompleted })
      .where(eq(weeklyGoals.id, goal.id))
      .returning();
    return updated;
  }
  
  async getUserWeeklyContribution(userId: string, weekStart: string): Promise<WeeklyGoalContribution | undefined> {
    const [contribution] = await db
      .select()
      .from(weeklyGoalContributions)
      .where(and(
        eq(weeklyGoalContributions.userId, userId),
        eq(weeklyGoalContributions.weekStart, weekStart)
      ));
    return contribution || undefined;
  }
  
  async recordUserContribution(userId: string, weekStart: string, amount: number): Promise<WeeklyGoalContribution> {
    const existing = await this.getUserWeeklyContribution(userId, weekStart);
    
    if (existing) {
      const [updated] = await db
        .update(weeklyGoalContributions)
        .set({ 
          contribution: existing.contribution + amount,
          lastUpdated: new Date()
        })
        .where(eq(weeklyGoalContributions.id, existing.id))
        .returning();
      return updated;
    }
    
    const [created] = await db
      .insert(weeklyGoalContributions)
      .values({ userId, weekStart, contribution: amount })
      .returning();
    return created;
  }
  
  // Achievement Methods
  async getAllAchievements(): Promise<Achievement[]> {
    return db.select().from(achievements).orderBy(achievements.tier, achievements.category);
  }
  
  async seedAchievements(achievementsList: InsertAchievement[]): Promise<void> {
    for (const achievement of achievementsList) {
      const [existing] = await db.select().from(achievements).where(eq(achievements.id, achievement.id));
      if (!existing) {
        await db.insert(achievements).values(achievement);
      }
    }
  }
  
  async getUserAchievementProgress(userId: string): Promise<UserAchievementProgress[]> {
    return db
      .select()
      .from(userAchievementProgress)
      .where(eq(userAchievementProgress.userId, userId));
  }
  
  async updateAchievementProgress(userId: string, achievementId: string, progress: number): Promise<UserAchievementProgress> {
    const [existing] = await db
      .select()
      .from(userAchievementProgress)
      .where(and(
        eq(userAchievementProgress.userId, userId),
        eq(userAchievementProgress.achievementId, achievementId)
      ));
    
    // Get the achievement to check if unlocked
    const [achievement] = await db.select().from(achievements).where(eq(achievements.id, achievementId));
    const isUnlocked = achievement && progress >= achievement.requirement ? 1 : 0;
    
    if (existing) {
      const [updated] = await db
        .update(userAchievementProgress)
        .set({ 
          currentProgress: progress,
          isUnlocked,
          unlockedAt: isUnlocked && !existing.isUnlocked ? new Date() : existing.unlockedAt
        })
        .where(eq(userAchievementProgress.id, existing.id))
        .returning();
      return updated;
    }
    
    const [created] = await db
      .insert(userAchievementProgress)
      .values({ 
        userId, 
        achievementId, 
        currentProgress: progress,
        isUnlocked,
        unlockedAt: isUnlocked ? new Date() : null
      })
      .returning();
    return created;
  }
  
  async claimAchievement(userId: string, achievementId: string): Promise<UserAchievementProgress | undefined> {
    const [progress] = await db
      .select()
      .from(userAchievementProgress)
      .where(and(
        eq(userAchievementProgress.userId, userId),
        eq(userAchievementProgress.achievementId, achievementId)
      ));
    
    if (!progress || !progress.isUnlocked || progress.isClaimed) {
      return undefined;
    }
    
    const [updated] = await db
      .update(userAchievementProgress)
      .set({ isClaimed: 1, claimedAt: new Date() })
      .where(eq(userAchievementProgress.id, progress.id))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();

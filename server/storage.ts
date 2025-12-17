import { 
  users, 
  playerProfiles,
  leaderboard,
  levelProgress,
  type User, 
  type InsertUser,
  type PlayerProfile,
  type InsertPlayerProfile,
  type Leaderboard,
  type InsertLeaderboard,
  type LevelProgress,
  type InsertLevelProgress
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // User Management
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
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
}

export class DatabaseStorage implements IStorage {
  // User Methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
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
}

export const storage = new DatabaseStorage();

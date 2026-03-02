import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '../db';
import { DatabaseStorage } from '../storage';
import { 
  users, 
  playerProfiles, 
  leaderboard, 
  levelProgress,
} from '@shared/schema';
import { eq } from 'drizzle-orm';

const storage = new DatabaseStorage();
const testId = Date.now().toString();
const TEST_USER_ID = `test-user-${testId}`;
const TEST_USER_ID_2 = `test-user-2-${testId}`;
const TEST_EMAIL = `test-${testId}@example.com`;
const TEST_EMAIL_2 = `test2-${testId}@example.com`;

describe('DatabaseStorage', () => {
  beforeAll(async () => {
    await db.insert(users).values({
      id: TEST_USER_ID,
      email: TEST_EMAIL,
      firstName: 'Test',
      lastName: 'User',
    });
    await db.insert(users).values({
      id: TEST_USER_ID_2,
      email: TEST_EMAIL_2,
      firstName: 'Test2',
      lastName: 'User2',
    });
  });

  afterAll(async () => {
    try {
      await db.delete(levelProgress).where(eq(levelProgress.userId, TEST_USER_ID));
      await db.delete(levelProgress).where(eq(levelProgress.userId, TEST_USER_ID_2));
      await db.delete(leaderboard).where(eq(leaderboard.userId, TEST_USER_ID));
      await db.delete(leaderboard).where(eq(leaderboard.userId, TEST_USER_ID_2));
      await db.delete(playerProfiles).where(eq(playerProfiles.userId, TEST_USER_ID));
      await db.delete(playerProfiles).where(eq(playerProfiles.userId, TEST_USER_ID_2));
      await db.delete(users).where(eq(users.id, TEST_USER_ID));
      await db.delete(users).where(eq(users.id, TEST_USER_ID_2));
    } catch (e) {
      console.error('Cleanup error:', e);
    }
  });

  describe('Player Profile', () => {
    it('getPlayerProfile returns undefined for non-existent user', async () => {
      const profile = await storage.getPlayerProfile('non-existent-user');
      expect(profile).toBeUndefined();
    });

    it('createPlayerProfile creates a new profile', async () => {
      const profile = await storage.createPlayerProfile({
        userId: TEST_USER_ID,
        coins: 100,
        highScore: 500,
      });

      expect(profile).toBeDefined();
      expect(profile.userId).toBe(TEST_USER_ID);
      expect(profile.coins).toBe(100);
      expect(profile.highScore).toBe(500);
    });

    it('getPlayerProfile retrieves existing profile', async () => {
      const profile = await storage.getPlayerProfile(TEST_USER_ID);
      expect(profile).toBeDefined();
      expect(profile?.coins).toBe(100);
    });

    it('updatePlayerProfile updates coins', async () => {
      const updated = await storage.updatePlayerProfile(TEST_USER_ID, { coins: 200 });
      expect(updated.coins).toBe(200);
    });

    it('updatePlayerProfile updates multiple fields', async () => {
      const updated = await storage.updatePlayerProfile(TEST_USER_ID, {
        coins: 300,
        highScore: 1000,
        speedUpgrade: 2,
      });
      expect(updated.coins).toBe(300);
      expect(updated.highScore).toBe(1000);
      expect(updated.speedUpgrade).toBe(2);
    });
  });

  describe('Leaderboard', () => {
    it('addLeaderboardEntry creates new entry', async () => {
      const entry = await storage.addLeaderboardEntry({
        userId: TEST_USER_ID,
        username: 'TestUser',
        score: 500,
      });

      expect(entry.userId).toBe(TEST_USER_ID);
      expect(entry.score).toBe(500);
    });

    it('addLeaderboardEntry updates if score is higher', async () => {
      const entry = await storage.addLeaderboardEntry({
        userId: TEST_USER_ID,
        username: 'TestUser',
        score: 1000,
      });

      expect(entry.score).toBe(1000);
    });

    it('addLeaderboardEntry does not update if score is lower', async () => {
      const entry = await storage.addLeaderboardEntry({
        userId: TEST_USER_ID,
        username: 'TestUser',
        score: 100,
      });

      expect(entry.score).toBe(1000);
    });

    it('getTopScores returns sorted entries', async () => {
      await storage.addLeaderboardEntry({
        userId: TEST_USER_ID_2,
        username: 'TestUser2',
        score: 2000,
      });

      const scores = await storage.getTopScores(10);
      expect(scores.length).toBeGreaterThanOrEqual(2);
      
      for (let i = 1; i < scores.length; i++) {
        expect(scores[i - 1].score).toBeGreaterThanOrEqual(scores[i].score);
      }
    });

    it('getUserBestScore returns correct score', async () => {
      const score = await storage.getUserBestScore(TEST_USER_ID);
      expect(score).toBe(1000);
    });

    it('getUserBestScore returns 0 for non-existent user', async () => {
      const score = await storage.getUserBestScore('non-existent');
      expect(score).toBe(0);
    });
  });

  describe('Level Progress', () => {
    it('getLevelProgressByUser returns empty for new user', async () => {
      const progress = await storage.getLevelProgressByUser(TEST_USER_ID);
      expect(progress).toEqual([]);
    });

    it('upsertLevelProgress creates new entry', async () => {
      const progress = await storage.upsertLevelProgress(TEST_USER_ID, 1, 150, true);

      expect(progress.levelNumber).toBe(1);
      expect(progress.bestScore).toBe(150);
      expect(progress.isCompleted).toBe(1);
    });

    it('upsertLevelProgress updates existing entry with higher score', async () => {
      const progress = await storage.upsertLevelProgress(TEST_USER_ID, 1, 200, true);
      expect(progress.bestScore).toBe(200);
    });

    it('upsertLevelProgress keeps higher score', async () => {
      const progress = await storage.upsertLevelProgress(TEST_USER_ID, 1, 100, true);
      expect(progress.bestScore).toBe(200);
    });

    it('getLevelProgressByUser returns all levels', async () => {
      await storage.upsertLevelProgress(TEST_USER_ID, 2, 175, true);
      await storage.upsertLevelProgress(TEST_USER_ID, 3, 180, false);

      const progress = await storage.getLevelProgressByUser(TEST_USER_ID);
      expect(progress.length).toBe(3);
    });
  });

  describe('Admin Methods', () => {
    it('getAdminStats returns stats object', async () => {
      const stats = await storage.getAdminStats();

      expect(stats).toHaveProperty('totalUsers');
      expect(stats).toHaveProperty('totalGamesPlayed');
      expect(stats).toHaveProperty('totalErrors');
      expect(typeof stats.totalUsers).toBe('number');
    });

    it('getAllUsers returns users array', async () => {
      const allUsers = await storage.getAllUsers();
      expect(Array.isArray(allUsers)).toBe(true);
      expect(allUsers.length).toBeGreaterThan(0);
    });

    it('getAllProfiles returns profiles array', async () => {
      const profiles = await storage.getAllProfiles();
      expect(Array.isArray(profiles)).toBe(true);
    });
  });
});

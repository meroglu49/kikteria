import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockStorage: Record<string, string> = {};
const mockLocalStorage = {
  getItem: vi.fn((key: string) => mockStorage[key] || null),
  setItem: vi.fn((key: string, value: string) => { mockStorage[key] = value; }),
  removeItem: vi.fn((key: string) => { delete mockStorage[key]; }),
  clear: vi.fn(() => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); }),
  length: 0,
  key: vi.fn(),
};

vi.stubGlobal('localStorage', mockLocalStorage);
vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (Test) Chrome/100.0' });

import { offlineStorage, LocalLevelProgress, LocalPlayerStats } from '../offline-storage';

describe('offlineStorage', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    vi.clearAllMocks();
  });

  describe('Level Progress', () => {
    it('getLevelProgress returns empty array by default', () => {
      const progress = offlineStorage.getLevelProgress();
      expect(progress).toEqual([]);
    });

    it('setLevelProgress saves and retrieves progress', () => {
      const progress: LocalLevelProgress[] = [
        { levelNumber: 1, bestScore: 100, isCompleted: true },
        { levelNumber: 2, bestScore: 150, isCompleted: true },
      ];
      offlineStorage.setLevelProgress(progress);
      
      const retrieved = offlineStorage.getLevelProgress();
      expect(retrieved).toEqual(progress);
    });

    it('updateLevelProgress creates new entry if not exists', () => {
      offlineStorage.updateLevelProgress(1, 100, true);
      
      const progress = offlineStorage.getLevelProgress();
      expect(progress).toHaveLength(1);
      expect(progress[0]).toMatchObject({
        levelNumber: 1,
        bestScore: 100,
        isCompleted: true,
      });
    });

    it('updateLevelProgress updates best score if higher', () => {
      offlineStorage.updateLevelProgress(1, 100, true);
      offlineStorage.updateLevelProgress(1, 150, true);
      
      const progress = offlineStorage.getLevelProgress();
      expect(progress[0].bestScore).toBe(150);
    });

    it('updateLevelProgress keeps higher score', () => {
      offlineStorage.updateLevelProgress(1, 200, true);
      offlineStorage.updateLevelProgress(1, 100, true);
      
      const progress = offlineStorage.getLevelProgress();
      expect(progress[0].bestScore).toBe(200);
    });

    it('updateLevelProgress unlocks next level on completion', () => {
      offlineStorage.updateLevelProgress(1, 100, true);
      
      const unlocked = offlineStorage.getUnlockedLevels();
      expect(unlocked).toBe(2);
    });
  });

  describe('Unlocked Levels', () => {
    it('getUnlockedLevels returns 1 by default', () => {
      expect(offlineStorage.getUnlockedLevels()).toBe(1);
    });

    it('unlockLevel increases unlocked count', () => {
      offlineStorage.unlockLevel(3);
      expect(offlineStorage.getUnlockedLevels()).toBe(3);
    });

    it('unlockLevel does not decrease unlocked count', () => {
      offlineStorage.unlockLevel(5);
      offlineStorage.unlockLevel(3);
      expect(offlineStorage.getUnlockedLevels()).toBe(5);
    });
  });

  describe('Player Stats', () => {
    it('getPlayerStats returns defaults', () => {
      const stats = offlineStorage.getPlayerStats();
      expect(stats.coins).toBe(0);
      expect(stats.highScore).toBe(0);
      expect(stats.bombCount).toBe(1);
    });

    it('setPlayerStats updates stats', () => {
      offlineStorage.setPlayerStats({ coins: 500, highScore: 1000 });
      
      const stats = offlineStorage.getPlayerStats();
      expect(stats.coins).toBe(500);
      expect(stats.highScore).toBe(1000);
    });

    it('setPlayerStats preserves unset values', () => {
      offlineStorage.setPlayerStats({ coins: 100 });
      offlineStorage.setPlayerStats({ highScore: 200 });
      
      const stats = offlineStorage.getPlayerStats();
      expect(stats.coins).toBe(100);
      expect(stats.highScore).toBe(200);
    });

    it('updateHighScore updates if higher', () => {
      offlineStorage.updateHighScore(100);
      offlineStorage.updateHighScore(200);
      
      const stats = offlineStorage.getPlayerStats();
      expect(stats.highScore).toBe(200);
    });

    it('updateHighScore keeps higher score', () => {
      offlineStorage.updateHighScore(300);
      offlineStorage.updateHighScore(100);
      
      const stats = offlineStorage.getPlayerStats();
      expect(stats.highScore).toBe(300);
    });
  });

  describe('Pending Sync', () => {
    it('getPendingSync returns empty defaults', () => {
      const pending = offlineStorage.getPendingSync();
      expect(pending.levelProgress).toEqual([]);
      expect(pending.highScore).toBeNull();
    });

    it('hasPendingSync returns false when empty', () => {
      expect(offlineStorage.hasPendingSync()).toBe(false);
    });

    it('addPendingSync adds level progress', () => {
      offlineStorage.updateLevelProgress(1, 100, true);
      
      expect(offlineStorage.hasPendingSync()).toBe(true);
      const pending = offlineStorage.getPendingSync();
      expect(pending.levelProgress.length).toBeGreaterThan(0);
    });

    it('clearPendingSync clears all pending data', () => {
      offlineStorage.updateLevelProgress(1, 100, true);
      offlineStorage.updateHighScore(500);
      
      offlineStorage.clearPendingSync();
      
      expect(offlineStorage.hasPendingSync()).toBe(false);
    });
  });

  describe('Session Management', () => {
    it('getSessionId returns a string', () => {
      const sessionId = offlineStorage.getSessionId();
      expect(typeof sessionId).toBe('string');
      expect(sessionId.length).toBeGreaterThan(0);
    });

    it('getSessionId returns same id on subsequent calls', () => {
      const id1 = offlineStorage.getSessionId();
      const id2 = offlineStorage.getSessionId();
      expect(id1).toBe(id2);
    });

    it('generateNewSession creates new session id', () => {
      const id1 = offlineStorage.getSessionId();
      offlineStorage.generateNewSession();
      const id2 = offlineStorage.getSessionId();
      expect(id1).not.toBe(id2);
    });
  });

  describe('Device Info', () => {
    it('getDeviceInfo returns device string', () => {
      const info = offlineStorage.getDeviceInfo();
      expect(typeof info).toBe('string');
    });
  });

  describe('Metadata Events', () => {
    it('getMetadata returns empty array by default', () => {
      expect(offlineStorage.getMetadata()).toEqual([]);
    });

    it('hasMetadataToSync returns false when empty', () => {
      expect(offlineStorage.hasMetadataToSync()).toBe(false);
    });

    it('trackLevelPlay adds metadata event', () => {
      offlineStorage.trackLevelPlay(1);
      
      expect(offlineStorage.hasMetadataToSync()).toBe(true);
      const metadata = offlineStorage.getMetadata();
      expect(metadata.length).toBe(1);
      expect(metadata[0].eventType).toBe('level_play');
    });

    it('trackLevelSuccess adds success event', () => {
      offlineStorage.trackLevelSuccess(1, 100, 30);
      
      const metadata = offlineStorage.getMetadata();
      expect(metadata[0].eventType).toBe('level_success');
      expect(metadata[0].score).toBe(100);
    });

    it('trackLevelFail adds fail event', () => {
      offlineStorage.trackLevelFail(1, 50, 15);
      
      const metadata = offlineStorage.getMetadata();
      expect(metadata[0].eventType).toBe('level_fail');
    });

    it('clearMetadata removes all metadata', () => {
      offlineStorage.trackLevelPlay(1);
      offlineStorage.trackLevelSuccess(1, 100, 30);
      
      offlineStorage.clearMetadata();
      
      expect(offlineStorage.hasMetadataToSync()).toBe(false);
    });
  });

  describe('Error Logs', () => {
    it('getErrorLogs returns empty array by default', () => {
      expect(offlineStorage.getErrorLogs()).toEqual([]);
    });

    it('hasErrorLogsToSync returns false when empty', () => {
      expect(offlineStorage.hasErrorLogsToSync()).toBe(false);
    });

    it('addErrorLog adds error entry', () => {
      offlineStorage.addErrorLog({
        severity: 'error',
        category: 'runtime',
        message: 'Test error',
      });
      
      expect(offlineStorage.hasErrorLogsToSync()).toBe(true);
      const logs = offlineStorage.getErrorLogs();
      expect(logs.length).toBe(1);
      expect(logs[0].message).toBe('Test error');
    });

    it('clearErrorLogs removes all logs', () => {
      offlineStorage.addErrorLog({
        severity: 'error',
        category: 'runtime',
        message: 'Test error',
      });
      
      offlineStorage.clearErrorLogs();
      
      expect(offlineStorage.hasErrorLogsToSync()).toBe(false);
    });
  });

  describe('User Actions', () => {
    it('setLastUserAction stores action', () => {
      offlineStorage.setLastUserAction('click:button');
      expect(offlineStorage.getLastUserAction()).toBe('click:button');
    });

    it('getLastUserAction returns undefined when not set', () => {
      expect(offlineStorage.getLastUserAction()).toBeUndefined();
    });
  });

  describe('Settings', () => {
    it('getSettings returns defaults', () => {
      const settings = offlineStorage.getSettings();
      expect(settings).toHaveProperty('soundEnabled');
      expect(settings).toHaveProperty('musicEnabled');
    });

    it('setSettings updates settings', () => {
      offlineStorage.setSettings({ soundEnabled: false });
      const settings = offlineStorage.getSettings();
      expect(settings.soundEnabled).toBe(false);
    });
  });

  describe('Leaderboard Cache', () => {
    it('getLeaderboardCache returns empty array by default', () => {
      expect(offlineStorage.getLeaderboardCache()).toEqual([]);
    });

    it('setLeaderboardCache stores entries', () => {
      const entries = [
        { id: '1', username: 'Player1', score: 100, userId: 'u1', createdAt: new Date() },
      ];
      offlineStorage.setLeaderboardCache(entries as any);
      
      const cached = offlineStorage.getLeaderboardCache();
      expect(cached.length).toBe(1);
    });
  });

  describe('Clear All', () => {
    it('clearAll removes all storage data', () => {
      offlineStorage.setPlayerStats({ coins: 100 });
      offlineStorage.updateLevelProgress(1, 100, true);
      offlineStorage.trackLevelPlay(1);
      
      offlineStorage.clearAll();
      
      expect(offlineStorage.getLevelProgress()).toEqual([]);
      expect(offlineStorage.getPlayerStats().coins).toBe(0);
      expect(offlineStorage.getMetadata()).toEqual([]);
    });
  });
});

const STORAGE_KEYS = {
  LEVEL_PROGRESS: 'kikteria_level_progress',
  BEST_SCORES: 'kikteria_best_scores',
  UNLOCKED_LEVELS: 'kikteria_unlocked_levels',
  PLAYER_STATS: 'kikteria_player_stats',
  PENDING_SYNC: 'kikteria_pending_sync',
  SETTINGS: 'kikteria_settings',
} as const;

export interface LocalLevelProgress {
  levelNumber: number;
  bestScore: number;
  isCompleted: boolean;
}

export interface LocalPlayerStats {
  coins: number;
  highScore: number;
  bombCount: number;
  figureSize: number;
  queueSize: number;
  lastUpdated: number;
}

export interface PendingSync {
  levelProgress: LocalLevelProgress[];
  highScore: number | null;
  timestamp: number;
}

function safeGet<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (item) {
      return JSON.parse(item) as T;
    }
  } catch (e) {
    console.warn(`Failed to read ${key} from localStorage:`, e);
  }
  return defaultValue;
}

function safeSet(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.warn(`Failed to write ${key} to localStorage:`, e);
    return false;
  }
}

export const offlineStorage = {
  getLevelProgress(): LocalLevelProgress[] {
    return safeGet(STORAGE_KEYS.LEVEL_PROGRESS, []);
  },

  setLevelProgress(progress: LocalLevelProgress[]): void {
    safeSet(STORAGE_KEYS.LEVEL_PROGRESS, progress);
  },

  updateLevelProgress(levelNumber: number, score: number, completed: boolean): void {
    const progress = this.getLevelProgress();
    const existing = progress.find(p => p.levelNumber === levelNumber);
    
    if (existing) {
      existing.bestScore = Math.max(existing.bestScore, score);
      existing.isCompleted = existing.isCompleted || completed;
    } else {
      progress.push({ levelNumber, bestScore: score, isCompleted: completed });
    }
    
    this.setLevelProgress(progress);
    
    if (completed) {
      this.unlockLevel(levelNumber + 1);
    }
    
    this.addPendingSync({ levelNumber, bestScore: score, isCompleted: completed });
  },

  getUnlockedLevels(): number {
    return safeGet(STORAGE_KEYS.UNLOCKED_LEVELS, 1);
  },

  unlockLevel(level: number): void {
    const current = this.getUnlockedLevels();
    if (level > current) {
      safeSet(STORAGE_KEYS.UNLOCKED_LEVELS, level);
    }
  },

  getPlayerStats(): LocalPlayerStats {
    return safeGet(STORAGE_KEYS.PLAYER_STATS, {
      coins: 0,
      highScore: 0,
      bombCount: 3,
      figureSize: 0,
      queueSize: 1,
      lastUpdated: Date.now(),
    });
  },

  setPlayerStats(stats: Partial<LocalPlayerStats>): void {
    const current = this.getPlayerStats();
    safeSet(STORAGE_KEYS.PLAYER_STATS, { 
      ...current, 
      ...stats, 
      lastUpdated: Date.now() 
    });
  },

  updateHighScore(score: number): void {
    const stats = this.getPlayerStats();
    if (score > stats.highScore) {
      this.setPlayerStats({ highScore: score });
      this.addPendingHighScore(score);
    }
  },

  getPendingSync(): PendingSync {
    return safeGet(STORAGE_KEYS.PENDING_SYNC, {
      levelProgress: [],
      highScore: null,
      timestamp: 0,
    });
  },

  addPendingSync(progress: LocalLevelProgress): void {
    const pending = this.getPendingSync();
    const existing = pending.levelProgress.find(p => p.levelNumber === progress.levelNumber);
    
    if (existing) {
      existing.bestScore = Math.max(existing.bestScore, progress.bestScore);
      existing.isCompleted = existing.isCompleted || progress.isCompleted;
    } else {
      pending.levelProgress.push(progress);
    }
    
    pending.timestamp = Date.now();
    safeSet(STORAGE_KEYS.PENDING_SYNC, pending);
  },

  addPendingHighScore(score: number): void {
    const pending = this.getPendingSync();
    pending.highScore = Math.max(pending.highScore || 0, score);
    pending.timestamp = Date.now();
    safeSet(STORAGE_KEYS.PENDING_SYNC, pending);
  },

  clearPendingSync(): void {
    safeSet(STORAGE_KEYS.PENDING_SYNC, {
      levelProgress: [],
      highScore: null,
      timestamp: 0,
    });
  },

  hasPendingSync(): boolean {
    const pending = this.getPendingSync();
    return pending.levelProgress.length > 0 || pending.highScore !== null;
  },

  mergeServerProgress(serverProgress: { levelNumber: number; bestScore: number; isCompleted: number }[]): void {
    const local = this.getLevelProgress();
    const currentMaxUnlocked = this.getUnlockedLevels();
    
    for (const server of serverProgress) {
      const localEntry = local.find(l => l.levelNumber === server.levelNumber);
      if (localEntry) {
        localEntry.bestScore = Math.max(localEntry.bestScore, server.bestScore);
        localEntry.isCompleted = localEntry.isCompleted || server.isCompleted === 1;
      } else {
        local.push({
          levelNumber: server.levelNumber,
          bestScore: server.bestScore,
          isCompleted: server.isCompleted === 1,
        });
      }
    }
    
    this.setLevelProgress(local);
    
    const newMaxUnlocked = local
      .filter(l => l.isCompleted)
      .reduce((max, l) => Math.max(max, l.levelNumber + 1), 1);
    
    const finalMaxUnlocked = Math.max(currentMaxUnlocked, newMaxUnlocked);
    if (finalMaxUnlocked > currentMaxUnlocked) {
      this.unlockLevel(finalMaxUnlocked);
    }
  },

  getSettings(): { soundEnabled: boolean; musicEnabled: boolean } {
    return safeGet(STORAGE_KEYS.SETTINGS, {
      soundEnabled: true,
      musicEnabled: true,
    });
  },

  setSettings(settings: { soundEnabled?: boolean; musicEnabled?: boolean }): void {
    const current = this.getSettings();
    safeSet(STORAGE_KEYS.SETTINGS, { ...current, ...settings });
  },

  clearAll(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.warn(`Failed to remove ${key}:`, e);
      }
    });
  },
};

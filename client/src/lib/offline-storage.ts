const STORAGE_KEYS = {
  LEVEL_PROGRESS: 'kikteria_level_progress',
  BEST_SCORES: 'kikteria_best_scores',
  UNLOCKED_LEVELS: 'kikteria_unlocked_levels',
  PLAYER_STATS: 'kikteria_player_stats',
  PENDING_SYNC: 'kikteria_pending_sync',
  SETTINGS: 'kikteria_settings',
  LEADERBOARD_CACHE: 'kikteria_leaderboard_cache',
  METADATA: 'kikteria_metadata',
  SESSION_ID: 'kikteria_session_id',
  ERROR_LOGS: 'kikteria_error_logs',
  LAST_USER_ACTION: 'kikteria_last_action',
} as const;

const MAX_ERROR_LOGS = 50;

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
  timeBonus: number;
  placementBonus: number;
  slowMo: number;
  shield: number;
  coinBoost: number;
  lucky: number;
  secondChance: number;
  lastUpdated: number;
}

export interface PendingProfileSync {
  coins: number | null;
  speedUpgrade: number | null;
  startSizeUpgrade: number | null;
  magnetUpgrade: number | null;
}

export interface PendingSync {
  levelProgress: LocalLevelProgress[];
  highScore: number | null;
  profile: PendingProfileSync | null;
  timestamp: number;
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  score: number;
}

// Metadata - user behavior tracking (synced then deleted)
export interface MetadataEvent {
  id: string;
  eventType: 'level_play' | 'level_success' | 'level_fail' | 'session_start' | 'session_end';
  levelNumber?: number;
  score?: number;
  playDuration?: number;
  eventDate: string;
  eventTime: string;
  sessionId: string;
  deviceInfo: string;
}

// Error Logs - for debugging (synced then deleted)
export interface ErrorLogEntry {
  id: string;
  severity: 'error' | 'warn' | 'info';
  category: 'runtime' | 'api' | 'sync' | 'game' | 'asset';
  message: string;
  stack?: string;
  component?: string;
  currentScreen?: string;
  gameState?: string;
  apiInfo?: string;
  sessionId: string;
  deviceInfo: string;
  networkStatus: 'online' | 'offline';
  lastUserAction?: string;
  eventTime: string;
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
    const stored = safeGet<Partial<LocalPlayerStats>>(STORAGE_KEYS.PLAYER_STATS, {});
    // Merge with defaults to handle missing properties from old saves
    return {
      coins: stored.coins ?? 0,
      highScore: stored.highScore ?? 0,
      bombCount: stored.bombCount ?? 1,
      figureSize: stored.figureSize ?? 1,
      queueSize: stored.queueSize ?? 1,
      timeBonus: stored.timeBonus ?? 1,
      placementBonus: stored.placementBonus ?? 1,
      slowMo: stored.slowMo ?? 1,
      shield: stored.shield ?? 0,
      coinBoost: stored.coinBoost ?? 1,
      lucky: stored.lucky ?? 1,
      secondChance: stored.secondChance ?? 0,
      lastUpdated: stored.lastUpdated ?? 0,
    };
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
      profile: null,
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

  addPendingProfileSync(updates: Partial<PendingProfileSync>): void {
    const pending = this.getPendingSync();
    pending.profile = {
      coins: updates.coins ?? pending.profile?.coins ?? null,
      speedUpgrade: updates.speedUpgrade ?? pending.profile?.speedUpgrade ?? null,
      startSizeUpgrade: updates.startSizeUpgrade ?? pending.profile?.startSizeUpgrade ?? null,
      magnetUpgrade: updates.magnetUpgrade ?? pending.profile?.magnetUpgrade ?? null,
    };
    pending.timestamp = Date.now();
    safeSet(STORAGE_KEYS.PENDING_SYNC, pending);
  },

  clearPendingSync(): void {
    safeSet(STORAGE_KEYS.PENDING_SYNC, {
      levelProgress: [],
      highScore: null,
      profile: null,
      timestamp: 0,
    });
  },

  clearPendingProfileSync(): void {
    const pending = this.getPendingSync();
    pending.profile = null;
    safeSet(STORAGE_KEYS.PENDING_SYNC, pending);
  },

  hasPendingSync(): boolean {
    const pending = this.getPendingSync();
    return pending.levelProgress.length > 0 || pending.highScore !== null || pending.profile !== null;
  },

  getLeaderboardCache(): LeaderboardEntry[] {
    return safeGet(STORAGE_KEYS.LEADERBOARD_CACHE, []);
  },

  setLeaderboardCache(entries: LeaderboardEntry[]): void {
    safeSet(STORAGE_KEYS.LEADERBOARD_CACHE, entries);
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

  // Metadata functions - user behavior tracking
  getSessionId(): string {
    let sessionId = safeGet<string | null>(STORAGE_KEYS.SESSION_ID, null);
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      safeSet(STORAGE_KEYS.SESSION_ID, sessionId);
    }
    return sessionId;
  },

  generateNewSession(): string {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    safeSet(STORAGE_KEYS.SESSION_ID, sessionId);
    return sessionId;
  },

  getDeviceInfo(): string {
    const ua = navigator.userAgent;
    const isMobile = /Mobile|Android|iPhone|iPad/.test(ua);
    const browser = /Chrome/.test(ua) ? 'Chrome' : /Firefox/.test(ua) ? 'Firefox' : /Safari/.test(ua) ? 'Safari' : 'Other';
    return `${isMobile ? 'Mobile' : 'Desktop'}-${browser}`;
  },

  getMetadata(): MetadataEvent[] {
    return safeGet(STORAGE_KEYS.METADATA, []);
  },

  addMetadataEvent(event: Omit<MetadataEvent, 'id' | 'eventDate' | 'eventTime' | 'sessionId' | 'deviceInfo'>): void {
    const metadata = this.getMetadata();
    const now = new Date();
    
    metadata.push({
      ...event,
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      eventDate: now.toISOString().split('T')[0],
      eventTime: now.toISOString(),
      sessionId: this.getSessionId(),
      deviceInfo: this.getDeviceInfo(),
    });
    
    safeSet(STORAGE_KEYS.METADATA, metadata);
  },

  trackLevelPlay(levelNumber: number): void {
    this.addMetadataEvent({ eventType: 'level_play', levelNumber });
  },

  trackLevelSuccess(levelNumber: number, score: number, playDuration: number): void {
    this.addMetadataEvent({ eventType: 'level_success', levelNumber, score, playDuration });
  },

  trackLevelFail(levelNumber: number, score: number, playDuration: number): void {
    this.addMetadataEvent({ eventType: 'level_fail', levelNumber, score, playDuration });
  },

  trackSessionStart(): void {
    this.generateNewSession();
    this.addMetadataEvent({ eventType: 'session_start' });
  },

  trackSessionEnd(): void {
    this.addMetadataEvent({ eventType: 'session_end' });
  },

  hasMetadataToSync(): boolean {
    return this.getMetadata().length > 0;
  },

  clearMetadata(): void {
    safeSet(STORAGE_KEYS.METADATA, []);
  },

  // Error log functions
  getErrorLogs(): ErrorLogEntry[] {
    return safeGet(STORAGE_KEYS.ERROR_LOGS, []);
  },

  addErrorLog(entry: Omit<ErrorLogEntry, 'id' | 'sessionId' | 'deviceInfo' | 'networkStatus' | 'eventTime' | 'lastUserAction'>): void {
    const logs = this.getErrorLogs();
    
    logs.push({
      ...entry,
      id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sessionId: this.getSessionId(),
      deviceInfo: this.getDeviceInfo(),
      networkStatus: navigator.onLine ? 'online' : 'offline',
      lastUserAction: this.getLastUserAction(),
      eventTime: new Date().toISOString(),
    });
    
    // Keep only the most recent logs to prevent storage overflow
    while (logs.length > MAX_ERROR_LOGS) {
      logs.shift();
    }
    
    safeSet(STORAGE_KEYS.ERROR_LOGS, logs);
  },

  hasErrorLogsToSync(): boolean {
    return this.getErrorLogs().length > 0;
  },

  clearErrorLogs(): void {
    safeSet(STORAGE_KEYS.ERROR_LOGS, []);
  },

  // Track user actions for error context
  setLastUserAction(action: string): void {
    safeSet(STORAGE_KEYS.LAST_USER_ACTION, action);
  },

  getLastUserAction(): string | undefined {
    return safeGet<string | undefined>(STORAGE_KEYS.LAST_USER_ACTION, undefined);
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

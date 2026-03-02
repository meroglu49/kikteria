import { communityGoalAPI, achievementsAPI } from './api';

export interface UnlockedAchievement {
  id: string;
  name: string;
  description: string;
  badgeIcon: string;
  coinReward: number;
  tier: number;
}

type AchievementCallback = (achievement: UnlockedAchievement) => void;

class EngagementService {
  private totalPlacements = 0;
  private totalCoinsEarned = 0;
  private highestLevel = 0;
  private dailyOrdersCompleted = 0;
  private endlessBestWave = 0;
  private bombsUsed = 0;
  private pendingContributions = 0;
  private contributionTimer: number | null = null;
  private saveTimer: number | null = null;
  private isDirty = false;
  private isAuthenticated = false;
  private currentUserId: string | null = null;
  private achievementCallbacks: AchievementCallback[] = [];
  private celebratedAchievements: Set<string> = new Set();

  initialize() {
    const saved = localStorage.getItem('engagement_stats');
    if (saved) {
      try {
        const stats = JSON.parse(saved);
        this.totalPlacements = stats.totalPlacements || 0;
        this.totalCoinsEarned = stats.totalCoinsEarned || 0;
        this.highestLevel = stats.highestLevel || 0;
        this.dailyOrdersCompleted = stats.dailyOrdersCompleted || 0;
        this.endlessBestWave = stats.endlessBestWave || 0;
        this.bombsUsed = stats.bombsUsed || 0;
      } catch {
        // Reset to defaults on parse error
      }
    }
  }

  private getCelebratedCacheKey(): string {
    return this.currentUserId ? `celebrated_achievements_${this.currentUserId}` : 'celebrated_achievements';
  }

  private loadCelebratedCache() {
    this.celebratedAchievements = new Set();
    const cacheKey = this.getCelebratedCacheKey();
    const celebratedCache = localStorage.getItem(cacheKey);
    if (celebratedCache) {
      try {
        const ids = JSON.parse(celebratedCache);
        this.celebratedAchievements = new Set(ids);
      } catch {
        // Reset to empty set on parse error
      }
    }
  }

  private saveCelebratedCache() {
    const cacheKey = this.getCelebratedCacheKey();
    localStorage.setItem(cacheKey, JSON.stringify([...this.celebratedAchievements]));
  }

  setAuthenticated(authenticated: boolean, userId?: string) {
    const userChanged = userId !== this.currentUserId;
    this.isAuthenticated = authenticated;
    this.currentUserId = userId || null;
    
    if (userChanged) {
      this.loadCelebratedCache();
    }
    
    if (!authenticated) {
      this.currentUserId = null;
      this.celebratedAchievements = new Set();
    }
  }

  onAchievementUnlocked(callback: AchievementCallback) {
    this.achievementCallbacks.push(callback);
    return () => {
      this.achievementCallbacks = this.achievementCallbacks.filter(cb => cb !== callback);
    };
  }

  private notifyAchievementUnlocked(achievement: UnlockedAchievement) {
    if (this.celebratedAchievements.has(achievement.id)) {
      return;
    }
    this.celebratedAchievements.add(achievement.id);
    this.saveCelebratedCache();
    this.achievementCallbacks.forEach(cb => cb(achievement));
  }

  private saveStats() {
    this.isDirty = true;
    
    // Throttle localStorage writes to once per second max
    if (!this.saveTimer) {
      this.saveTimer = window.setTimeout(() => {
        this.flushSave();
      }, 1000);
    }
  }

  private flushSave() {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
    
    if (this.isDirty) {
      this.isDirty = false;
      localStorage.setItem('engagement_stats', JSON.stringify({
        totalPlacements: this.totalPlacements,
        totalCoinsEarned: this.totalCoinsEarned,
        highestLevel: this.highestLevel,
        dailyOrdersCompleted: this.dailyOrdersCompleted,
        endlessBestWave: this.endlessBestWave,
        bombsUsed: this.bombsUsed,
      }));
    }
  }

  recordPlacement() {
    this.totalPlacements++;
    this.saveStats();
    
    // Only batch contributions if authenticated and online
    if (!this.isAuthenticated || !navigator.onLine) return;
    
    this.pendingContributions++;
    
    if (this.pendingContributions >= 10) {
      this.flushContributions();
    } else if (!this.contributionTimer) {
      this.contributionTimer = window.setTimeout(() => {
        // Re-check online status when timer fires
        if (navigator.onLine && this.isAuthenticated) {
          this.flushContributions();
        }
      }, 5000);
    }
  }

  private async flushContributions() {
    if (this.contributionTimer) {
      clearTimeout(this.contributionTimer);
      this.contributionTimer = null;
    }
    
    if (this.pendingContributions > 0 && this.isAuthenticated && navigator.onLine) {
      const amount = this.pendingContributions;
      this.pendingContributions = 0;
      try {
        await communityGoalAPI.contribute(amount);
      } catch (e) {
        // Silently fail - contributions are best-effort
      }
    }
  }

  async recordLevelComplete(levelNumber: number, _score: number) {
    if (levelNumber > this.highestLevel) {
      this.highestLevel = levelNumber;
    }
    this.saveStats();
    this.flushSave(); // Important event - save immediately
    
    // Flush any pending contributions if authenticated and online
    if (this.isAuthenticated && navigator.onLine) {
      await this.flushContributions();
      await this.syncAchievements();
    }
  }

  async recordCoinsEarned(amount: number) {
    this.totalCoinsEarned += amount;
    this.saveStats();
    this.flushSave(); // High-value event - save immediately
    if (this.isAuthenticated && navigator.onLine) {
      await this.syncAchievements();
    }
  }

  async recordEndlessWave(wave: number) {
    if (wave > this.endlessBestWave) {
      this.endlessBestWave = wave;
      this.saveStats();
      this.flushSave(); // High-value event - save immediately
      if (this.isAuthenticated && navigator.onLine) {
        await this.syncAchievements();
      }
    }
  }

  async recordBombUsed() {
    this.bombsUsed++;
    this.saveStats();
    this.flushSave(); // High-value event - save immediately
    if (this.isAuthenticated && navigator.onLine) {
      await this.syncAchievements();
    }
  }

  async recordDailyOrderComplete() {
    this.dailyOrdersCompleted++;
    this.saveStats();
    this.flushSave(); // High-value event - save immediately
    if (this.isAuthenticated && navigator.onLine) {
      await this.syncAchievements();
    }
  }

  getStats() {
    return {
      totalPlacements: this.totalPlacements,
      totalCoinsEarned: this.totalCoinsEarned,
      highestLevel: this.highestLevel,
      dailyOrdersCompleted: this.dailyOrdersCompleted,
      endlessBestWave: this.endlessBestWave,
      bombsUsed: this.bombsUsed,
    };
  }

  private async syncAchievements() {
    if (!this.isAuthenticated || !navigator.onLine) return;
    
    const stats = this.getStats();
    const achievementMappings = [
      { id: 'first_placement', key: 'totalPlacements' },
      { id: 'placements_100', key: 'totalPlacements' },
      { id: 'placements_500', key: 'totalPlacements' },
      { id: 'placements_2000', key: 'totalPlacements' },
      { id: 'score_1000', key: 'totalCoinsEarned' },
      { id: 'score_5000', key: 'totalCoinsEarned' },
      { id: 'score_20000', key: 'totalCoinsEarned' },
      { id: 'level_1', key: 'highestLevel' },
      { id: 'level_3', key: 'highestLevel' },
      { id: 'level_5', key: 'highestLevel' },
      { id: 'level_7', key: 'highestLevel' },
      { id: 'daily_1', key: 'dailyOrdersCompleted' },
      { id: 'daily_7', key: 'dailyOrdersCompleted' },
      { id: 'daily_30', key: 'dailyOrdersCompleted' },
      { id: 'endless_10', key: 'endlessBestWave' },
      { id: 'endless_25', key: 'endlessBestWave' },
      { id: 'bomb_master', key: 'bombsUsed' },
    ];

    for (const mapping of achievementMappings) {
      if (this.celebratedAchievements.has(mapping.id)) {
        continue;
      }
      
      const value = stats[mapping.key as keyof typeof stats];
      if (value > 0) {
        try {
          const result = await achievementsAPI.updateProgress(mapping.id, value);
          if (result.newlyUnlocked && result.achievementDetails) {
            this.notifyAchievementUnlocked({
              id: result.achievementDetails.id,
              name: result.achievementDetails.name,
              description: result.achievementDetails.description,
              badgeIcon: result.achievementDetails.badgeIcon,
              coinReward: result.achievementDetails.coinReward,
              tier: result.achievementDetails.tier,
            });
          }
        } catch (e) {
          // Silently fail
        }
      }
    }
  }
}

export const engagementService = new EngagementService();
engagementService.initialize();

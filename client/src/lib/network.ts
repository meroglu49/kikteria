import { useState, useEffect, useCallback } from 'react';
import { offlineStorage } from './offline-storage';
import { levelProgressAPI, leaderboardAPI, profileAPI, analyticsAPI, errorLogsAPI } from './api';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const syncToServer = useCallback(async () => {
    if (!navigator.onLine) return false;
    
    const pending = offlineStorage.getPendingSync();
    const hasMetadata = offlineStorage.hasMetadataToSync();
    const hasErrorLogs = offlineStorage.hasErrorLogsToSync();
    const hasMasterdata = pending.levelProgress.length > 0 || pending.highScore !== null || pending.profile !== null;
    
    // Exit early only if there's nothing to sync at all
    if (!hasMasterdata && !hasMetadata && !hasErrorLogs) {
      return true;
    }

    setIsSyncing(true);
    
    try {
      const remainingProgress = [...pending.levelProgress];
      let highScoreSynced = pending.highScore === null;
      let profileSynced = pending.profile === null;
      let metadataSynced = !hasMetadata;
      
      // Sync level progress
      for (let i = 0; i < remainingProgress.length; i++) {
        const progress = remainingProgress[i];
        try {
          await levelProgressAPI.updateProgress(
            progress.levelNumber,
            progress.bestScore,
            progress.isCompleted
          );
          remainingProgress.splice(i, 1);
          i--;
        } catch (error) {
          console.warn(`Failed to sync level ${progress.levelNumber}:`, error);
        }
      }

      // Sync high score to leaderboard
      if (pending.highScore !== null) {
        try {
          await leaderboardAPI.submitScore(pending.highScore);
          highScoreSynced = true;
        } catch (error) {
          console.warn('Failed to sync high score:', error);
        }
      }

      // Sync profile (coins, upgrades)
      if (pending.profile !== null) {
        try {
          const updates: Record<string, number> = {};
          if (pending.profile.coins !== null) updates.coins = pending.profile.coins;
          if (pending.profile.speedUpgrade !== null) updates.speedUpgrade = pending.profile.speedUpgrade;
          if (pending.profile.startSizeUpgrade !== null) updates.startSizeUpgrade = pending.profile.startSizeUpgrade;
          if (pending.profile.magnetUpgrade !== null) updates.magnetUpgrade = pending.profile.magnetUpgrade;
          
          if (Object.keys(updates).length > 0) {
            await profileAPI.updateProfile(updates);
          }
          profileSynced = true;
        } catch (error) {
          console.warn('Failed to sync profile:', error);
        }
      }

      // Update pending sync state for masterdata
      if (remainingProgress.length === 0 && highScoreSynced && profileSynced) {
        offlineStorage.clearPendingSync();
      } else {
        const newPending = {
          levelProgress: remainingProgress,
          highScore: highScoreSynced ? null : pending.highScore,
          profile: profileSynced ? null : pending.profile,
          timestamp: Date.now(),
        };
        localStorage.setItem('kikteria_pending_sync', JSON.stringify(newPending));
      }

      // Sync metadata (user behavior analytics) - delete after successful sync
      if (hasMetadata) {
        const metadata = offlineStorage.getMetadata();
        try {
          await analyticsAPI.submitEvents(metadata);
          // Delete metadata from local storage after successful sync
          offlineStorage.clearMetadata();
          metadataSynced = true;
        } catch (error) {
          console.warn('Failed to sync metadata:', error);
          // Metadata remains in local storage for next sync attempt
        }
      }

      // Sync error logs - delete after successful sync
      let errorLogsSynced = !hasErrorLogs;
      if (hasErrorLogs) {
        const errorLogs = offlineStorage.getErrorLogs();
        try {
          await errorLogsAPI.submitLogs(errorLogs);
          // Delete error logs from local storage after successful sync
          offlineStorage.clearErrorLogs();
          errorLogsSynced = true;
        } catch (error) {
          console.warn('Failed to sync error logs:', error);
          // Error logs remain in local storage for next sync attempt
        }
      }
      
      const masterdataSynced = remainingProgress.length === 0 && highScoreSynced && profileSynced;
      return masterdataSynced && metadataSynced && errorLogsSynced;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    // Sync masterdata, metadata, and error logs when online
    if (isOnline && (offlineStorage.hasPendingSync() || offlineStorage.hasMetadataToSync() || offlineStorage.hasErrorLogsToSync())) {
      syncToServer();
    }
  }, [isOnline, syncToServer]);

  return { isOnline, isSyncing, syncToServer };
}

export function useOfflineAwareLevelProgress() {
  const localProgress = offlineStorage.getLevelProgress();
  const maxUnlocked = offlineStorage.getUnlockedLevels();
  
  return {
    data: localProgress,
    maxUnlockedLevel: maxUnlocked,
  };
}

import { useState, useEffect, useCallback } from 'react';
import { offlineStorage } from './offline-storage';
import { levelProgressAPI, leaderboardAPI } from './api';

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
    if (!pending.levelProgress.length && !pending.highScore) {
      return true;
    }

    setIsSyncing(true);
    
    const remainingProgress = [...pending.levelProgress];
    let highScoreSynced = pending.highScore === null;
    
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

    if (pending.highScore !== null) {
      try {
        await leaderboardAPI.submitScore(pending.highScore);
        highScoreSynced = true;
      } catch (error) {
        console.warn('Failed to sync high score:', error);
      }
    }

    if (remainingProgress.length === 0 && highScoreSynced) {
      offlineStorage.clearPendingSync();
    } else {
      const newPending = {
        levelProgress: remainingProgress,
        highScore: highScoreSynced ? null : pending.highScore,
        timestamp: Date.now(),
      };
      localStorage.setItem('kikteria_pending_sync', JSON.stringify(newPending));
    }
    
    setIsSyncing(false);
    return remainingProgress.length === 0 && highScoreSynced;
  }, []);

  useEffect(() => {
    if (isOnline && offlineStorage.hasPendingSync()) {
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

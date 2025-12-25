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

vi.mock('../engagement-service', () => ({
  engagementService: {
    initialize: vi.fn(),
    setAuthenticated: vi.fn(),
    onAchievementUnlocked: vi.fn(() => () => {}),
    recordPlacement: vi.fn(),
    recordLevelComplete: vi.fn(),
    recordCoinsEarned: vi.fn(),
    recordEndlessWave: vi.fn(),
    recordBombUsed: vi.fn(),
    recordDailyOrderComplete: vi.fn(),
  },
}));

import { useGameStore } from '../store';
import { LEVELS } from '../game-constants';

describe('useGameStore', () => {
  beforeEach(() => {
    const store = useGameStore.getState();
    store.setGameState('MENU');
    Object.keys(mockStorage).forEach(k => delete mockStorage[k]);
  });

  describe('Initial State', () => {
    it('starts with MENU game state', () => {
      const { gameState } = useGameStore.getState();
      expect(gameState).toBe('MENU');
    });

    it('starts with score of 0', () => {
      const { score } = useGameStore.getState();
      expect(score).toBe(0);
    });

    it('starts at level 1', () => {
      const { currentLevel } = useGameStore.getState();
      expect(currentLevel).toBe(1);
    });

    it('starts with level 1 config', () => {
      const { currentLevelConfig } = useGameStore.getState();
      expect(currentLevelConfig).toEqual(LEVELS[0]);
    });

    it('starts with empty placed figures', () => {
      const { placedFigures } = useGameStore.getState();
      expect(placedFigures).toEqual([]);
    });

    it('starts with empty figure queue', () => {
      const { figureQueue } = useGameStore.getState();
      expect(figureQueue).toEqual([]);
    });

    it('starts with shield not used', () => {
      const { shieldUsed } = useGameStore.getState();
      expect(shieldUsed).toBe(false);
    });

    it('starts with second chance not used', () => {
      const { secondChanceUsed } = useGameStore.getState();
      expect(secondChanceUsed).toBe(false);
    });

    it('starts not in endless mode', () => {
      const { isEndlessMode } = useGameStore.getState();
      expect(isEndlessMode).toBe(false);
    });

    it('starts not frozen', () => {
      const { isFrozen } = useGameStore.getState();
      expect(isFrozen).toBe(false);
    });
  });

  describe('setGameState', () => {
    it('changes game state to PLAYING', () => {
      useGameStore.getState().setGameState('PLAYING');
      expect(useGameStore.getState().gameState).toBe('PLAYING');
    });

    it('changes game state to WIN', () => {
      useGameStore.getState().setGameState('WIN');
      expect(useGameStore.getState().gameState).toBe('WIN');
    });

    it('changes game state to LOSE', () => {
      useGameStore.getState().setGameState('LOSE');
      expect(useGameStore.getState().gameState).toBe('LOSE');
    });
  });

  describe('setNotification', () => {
    it('sets notification message', () => {
      useGameStore.getState().setNotification('Test message');
      expect(useGameStore.getState().notification).toBe('Test message');
    });

    it('clears notification with null', () => {
      useGameStore.getState().setNotification('Test');
      useGameStore.getState().setNotification(null);
      expect(useGameStore.getState().notification).toBeNull();
    });
  });

  describe('toggleBombTargeting', () => {
    it('toggles bomb targeting mode when bombs available', () => {
      const store = useGameStore.getState();
      const initialMode = store.bombTargetingMode;
      store.toggleBombTargeting();
      
      if (store.bombsRemaining > 0) {
        expect(useGameStore.getState().bombTargetingMode).toBe(!initialMode);
      }
    });
  });

  describe('Level Selection', () => {
    it('selectLevel updates selected level when unlocked', () => {
      useGameStore.setState({ maxUnlockedLevel: 5 });
      useGameStore.getState().selectLevel(3);
      expect(useGameStore.getState().selectedLevel).toBe(3);
    });

    it('selectLevel respects maxUnlockedLevel', () => {
      useGameStore.setState({ maxUnlockedLevel: 2, selectedLevel: 1 });
      useGameStore.getState().selectLevel(5);
      expect(useGameStore.getState().selectedLevel).toBe(1);
    });
  });

  describe('Endless Mode', () => {
    it('starts endless mode with wave 1', () => {
      const { endlessWave } = useGameStore.getState();
      expect(endlessWave).toBe(1);
    });

    it('tracks endless high score', () => {
      const { endlessHighScore } = useGameStore.getState();
      expect(endlessHighScore).toBeGreaterThanOrEqual(0);
    });

    it('tracks best endless wave', () => {
      const { endlessBestWave } = useGameStore.getState();
      expect(endlessBestWave).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Consumables', () => {
    it('tracks freeze count', () => {
      const { freezeCount } = useGameStore.getState();
      expect(freezeCount).toBeGreaterThanOrEqual(0);
    });

    it('tracks cleanser count', () => {
      const { cleanserCount } = useGameStore.getState();
      expect(cleanserCount).toBeGreaterThanOrEqual(0);
    });

    it('tracks lasso mode', () => {
      const { isLassoMode } = useGameStore.getState();
      expect(typeof isLassoMode).toBe('boolean');
    });

    it('tracks lasso points', () => {
      const { lassoPoints } = useGameStore.getState();
      expect(Array.isArray(lassoPoints)).toBe(true);
    });
  });

  describe('Level Stats', () => {
    it('tracks bombs used in level', () => {
      const { levelStats } = useGameStore.getState();
      expect(levelStats.bombsUsed).toBeGreaterThanOrEqual(0);
    });

    it('tracks shields used in level', () => {
      const { levelStats } = useGameStore.getState();
      expect(levelStats.shieldsUsed).toBeGreaterThanOrEqual(0);
    });

    it('tracks second chances used in level', () => {
      const { levelStats } = useGameStore.getState();
      expect(levelStats.secondChancesUsed).toBeGreaterThanOrEqual(0);
    });

    it('tracks time remaining', () => {
      const { levelStats } = useGameStore.getState();
      expect(levelStats.timeRemaining).toBeGreaterThanOrEqual(0);
    });

    it('tracks perfect placements', () => {
      const { levelStats } = useGameStore.getState();
      expect(levelStats.perfectPlacements).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Mutation Events', () => {
    it('has no active mutation by default', () => {
      const { activeMutation } = useGameStore.getState();
      expect(activeMutation).toBeNull();
    });

    it('has default mutation modifiers', () => {
      const { mutationModifiers } = useGameStore.getState();
      expect(mutationModifiers.vibrationMultiplier).toBe(1);
      expect(mutationModifiers.sizeMultiplier).toBe(1);
      expect(mutationModifiers.speedMultiplier).toBe(1);
      expect(mutationModifiers.driftEnabled).toBe(false);
    });
  });

  describe('Close Call Tracking', () => {
    it('starts with zero close calls', () => {
      const { closeCallCount } = useGameStore.getState();
      expect(closeCallCount).toBe(0);
    });
  });
});

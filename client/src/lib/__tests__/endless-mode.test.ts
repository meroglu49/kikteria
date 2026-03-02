import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

const mockStorage: Record<string, string> = {};
vi.stubGlobal('localStorage', {
  getItem: vi.fn((key: string) => mockStorage[key] || null),
  setItem: vi.fn((key: string, value: string) => { mockStorage[key] = value; }),
  removeItem: vi.fn((key: string) => { delete mockStorage[key]; }),
  clear: vi.fn(() => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); }),
});
vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (Test) Chrome/100.0' });
vi.stubGlobal('window', {
  setInterval: setInterval,
  clearInterval: clearInterval,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
});

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
  },
}));

import { useGameStore } from '../store';

describe('Endless Mode', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useGameStore.setState({
      gameState: 'MENU',
      isEndlessMode: false,
      endlessWave: 1,
      endlessScore: 0,
      endlessHighScore: 100,
      endlessBestWave: 5,
      score: 0,
      coins: 1000,
      upgrades: {
        bombCount: 1,
        figureSize: 1,
        queueSize: 1,
        timeBonus: 1,
        placementBonus: 1,
        slowMo: 1,
        shield: 0,
        coinBoost: 1,
        lucky: 1,
        secondChance: 0,
      },
      timerInterval: null,
    });
  });

  afterEach(() => {
    const state = useGameStore.getState();
    if (state.timerInterval) {
      clearInterval(state.timerInterval);
      useGameStore.setState({ timerInterval: null });
    }
    vi.useRealTimers();
  });

  describe('startEndlessMode', () => {
    it('sets isEndlessMode to true', () => {
      useGameStore.getState().startEndlessMode();
      expect(useGameStore.getState().isEndlessMode).toBe(true);
    });

    it('sets game state to ENDLESS_PLAYING', () => {
      useGameStore.getState().startEndlessMode();
      expect(useGameStore.getState().gameState).toBe('ENDLESS_PLAYING');
    });

    it('resets wave to 1', () => {
      useGameStore.setState({ endlessWave: 10 });
      useGameStore.getState().startEndlessMode();
      expect(useGameStore.getState().endlessWave).toBe(1);
    });

    it('resets endless score to 0', () => {
      useGameStore.setState({ endlessScore: 500 });
      useGameStore.getState().startEndlessMode();
      expect(useGameStore.getState().endlessScore).toBe(0);
    });

    it('sets high totalFigures for endless play', () => {
      useGameStore.getState().startEndlessMode();
      expect(useGameStore.getState().totalFigures).toBe(999999);
    });

    it('generates figure queue', () => {
      useGameStore.getState().startEndlessMode();
      expect(useGameStore.getState().figureQueue.length).toBeGreaterThan(0);
    });

    it('sets currentFigureId', () => {
      useGameStore.getState().startEndlessMode();
      expect(useGameStore.getState().currentFigureId).not.toBeNull();
    });

    it('clears placed figures', () => {
      useGameStore.setState({ placedFigures: [{ id: 'test', x: 0, y: 0 }] as any });
      useGameStore.getState().startEndlessMode();
      expect(useGameStore.getState().placedFigures).toEqual([]);
    });

    it('applies time bonus upgrade', () => {
      useGameStore.setState({ 
        upgrades: { ...useGameStore.getState().upgrades, timeBonus: 3 }
      });
      useGameStore.getState().startEndlessMode();
      expect(useGameStore.getState().timeRemaining).toBe(60 + 6);
    });

    it('applies bomb count upgrade', () => {
      useGameStore.setState({ 
        upgrades: { ...useGameStore.getState().upgrades, bombCount: 3 }
      });
      useGameStore.getState().startEndlessMode();
      // Formula: STARTING_BOMBS (2) + (bombCount - 1) = 2 + 2 = 4
      expect(useGameStore.getState().bombsRemaining).toBe(4);
    });
  });

  describe('advanceEndlessWave', () => {
    beforeEach(() => {
      useGameStore.getState().startEndlessMode();
      useGameStore.setState({ score: 50, figureQueue: ['blobby', 'grumpus'] });
    });

    it('increments wave number', () => {
      const initialWave = useGameStore.getState().endlessWave;
      useGameStore.getState().advanceEndlessWave();
      expect(useGameStore.getState().endlessWave).toBe(initialWave + 1);
    });

    it('accumulates score into endlessScore', () => {
      useGameStore.setState({ endlessScore: 100, score: 50 });
      useGameStore.getState().advanceEndlessWave();
      expect(useGameStore.getState().endlessScore).toBe(150);
    });

    it('adds time bonus on wave advance', () => {
      const initialTime = useGameStore.getState().timeRemaining;
      useGameStore.getState().advanceEndlessWave();
      expect(useGameStore.getState().timeRemaining).toBe(initialTime + 30);
    });

    it('adds more figures to queue', () => {
      const initialQueueLength = useGameStore.getState().figureQueue.length;
      useGameStore.getState().advanceEndlessWave();
      expect(useGameStore.getState().figureQueue.length).toBeGreaterThan(initialQueueLength);
    });

    it('sets wave notification', () => {
      useGameStore.getState().advanceEndlessWave();
      expect(useGameStore.getState().notification).toContain('WAVE');
    });
  });

  describe('Endless Mode High Score Tracking', () => {
    it('preserves endlessHighScore', () => {
      useGameStore.setState({ endlessHighScore: 500 });
      expect(useGameStore.getState().endlessHighScore).toBe(500);
    });

    it('preserves endlessBestWave', () => {
      useGameStore.setState({ endlessBestWave: 10 });
      expect(useGameStore.getState().endlessBestWave).toBe(10);
    });
  });
});

import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockStorage: Record<string, string> = {};
vi.stubGlobal('localStorage', {
  getItem: vi.fn((key: string) => mockStorage[key] || null),
  setItem: vi.fn((key: string, value: string) => { mockStorage[key] = value; }),
  removeItem: vi.fn((key: string) => { delete mockStorage[key]; }),
  clear: vi.fn(() => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); }),
});
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
  },
}));

import { useGameStore } from '../store';
import { FigureInstance } from '../game-constants';

const createFigure = (id: string, x: number, y: number): FigureInstance => ({
  id,
  templateId: 'blobby',
  x,
  y,
  rotation: 0,
  scale: 1,
  vibrationOffset: 0,
  isPlaced: true,
});

describe('Bomb Mechanics', () => {
  beforeEach(() => {
    useGameStore.setState({
      gameState: 'PLAYING',
      bombsRemaining: 3,
      bombTargetingMode: false,
      placedFigures: [],
      figuresPlaced: 0,
    });
  });

  describe('toggleBombTargeting', () => {
    it('enables bomb targeting when bombs available', () => {
      useGameStore.setState({ bombsRemaining: 2, bombTargetingMode: false });
      useGameStore.getState().toggleBombTargeting();
      expect(useGameStore.getState().bombTargetingMode).toBe(true);
    });

    it('disables bomb targeting when already enabled', () => {
      useGameStore.setState({ bombsRemaining: 2, bombTargetingMode: true });
      useGameStore.getState().toggleBombTargeting();
      expect(useGameStore.getState().bombTargetingMode).toBe(false);
    });

    it('does not enable when no bombs remaining', () => {
      useGameStore.setState({ bombsRemaining: 0, bombTargetingMode: false });
      useGameStore.getState().toggleBombTargeting();
      expect(useGameStore.getState().bombTargetingMode).toBe(false);
    });
  });

  describe('detonateBombAt', () => {
    it('clears figures within blast radius', () => {
      const figures = [
        createFigure('fig1', 100, 100),
        createFigure('fig2', 120, 120),
        createFigure('fig3', 500, 500),
      ];
      
      useGameStore.setState({
        placedFigures: figures,
        bombsRemaining: 3,
        bombTargetingMode: true,
        figuresPlaced: 3,
      });
      
      const result = useGameStore.getState().detonateBombAt(100, 100);
      
      expect(result.success).toBe(true);
      expect(result.cleared).toBe(2);
      expect(useGameStore.getState().placedFigures).toHaveLength(1);
    });

    it('decrements bombs remaining', () => {
      useGameStore.setState({
        bombsRemaining: 3,
        bombTargetingMode: true,
      });
      
      useGameStore.getState().detonateBombAt(100, 100);
      
      expect(useGameStore.getState().bombsRemaining).toBe(2);
    });

    it('disables targeting mode after detonation', () => {
      useGameStore.setState({
        bombsRemaining: 3,
        bombTargetingMode: true,
      });
      
      useGameStore.getState().detonateBombAt(100, 100);
      
      expect(useGameStore.getState().bombTargetingMode).toBe(false);
    });

    it('fails when not in targeting mode', () => {
      useGameStore.setState({
        bombsRemaining: 3,
        bombTargetingMode: false,
      });
      
      const result = useGameStore.getState().detonateBombAt(100, 100);
      
      expect(result.success).toBe(false);
    });

    it('fails when no bombs remaining', () => {
      useGameStore.setState({
        bombsRemaining: 0,
        bombTargetingMode: true,
      });
      
      const result = useGameStore.getState().detonateBombAt(100, 100);
      
      expect(result.success).toBe(false);
    });

    it('updates figuresPlaced count', () => {
      const figures = [
        createFigure('fig1', 100, 100),
        createFigure('fig2', 110, 110),
      ];
      
      useGameStore.setState({
        placedFigures: figures,
        bombsRemaining: 3,
        bombTargetingMode: true,
        figuresPlaced: 5,
      });
      
      useGameStore.getState().detonateBombAt(100, 100);
      
      expect(useGameStore.getState().figuresPlaced).toBe(3);
    });

    it('sets notification on detonation', () => {
      useGameStore.setState({
        bombsRemaining: 3,
        bombTargetingMode: true,
      });
      
      useGameStore.getState().detonateBombAt(100, 100);
      
      expect(useGameStore.getState().notification).toContain('BOOM');
    });

    it('clears nothing when no figures in range', () => {
      const figures = [createFigure('fig1', 500, 500)];
      
      useGameStore.setState({
        placedFigures: figures,
        bombsRemaining: 3,
        bombTargetingMode: true,
        figuresPlaced: 1,
      });
      
      const result = useGameStore.getState().detonateBombAt(100, 100);
      
      expect(result.cleared).toBe(0);
      expect(useGameStore.getState().placedFigures).toHaveLength(1);
    });
  });

  describe('Blast Radius', () => {
    it('uses 150px blast radius', () => {
      const figures = [
        createFigure('near', 100, 100),
        createFigure('edge', 249, 100),
        createFigure('far', 251, 100),
      ];
      
      useGameStore.setState({
        placedFigures: figures,
        bombsRemaining: 3,
        bombTargetingMode: true,
      });
      
      useGameStore.getState().detonateBombAt(100, 100);
      
      const remaining = useGameStore.getState().placedFigures;
      expect(remaining.some(f => f.id === 'far')).toBe(true);
    });
  });
});

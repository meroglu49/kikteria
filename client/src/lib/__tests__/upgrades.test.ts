import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UPGRADE_COSTS, UPGRADE_MAX_LEVELS } from '../store';

type UpgradeType = keyof typeof UPGRADE_COSTS;

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

describe('Upgrade System', () => {
  beforeEach(() => {
    useGameStore.setState({
      coins: 10000,
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
    });
    Object.keys(mockStorage).forEach(k => delete mockStorage[k]);
  });

  describe('UPGRADE_COSTS', () => {
    it('has costs for all upgrade types', () => {
      const upgradeTypes: UpgradeType[] = [
        'bombCount', 'figureSize', 'queueSize', 'timeBonus',
        'placementBonus', 'slowMo', 'shield', 'coinBoost', 'lucky', 'secondChance'
      ];
      
      for (const type of upgradeTypes) {
        expect(UPGRADE_COSTS[type]).toBeDefined();
        expect(UPGRADE_COSTS[type]).toBeGreaterThan(0);
      }
    });

    it('has reasonable cost progression', () => {
      // Tiered pricing: Core (80-120), Power (150-200), Premium (220+)
      expect(UPGRADE_COSTS.queueSize).toBe(80);      // Core tier
      expect(UPGRADE_COSTS.timeBonus).toBe(100);     // Core tier
      expect(UPGRADE_COSTS.coinBoost).toBe(120);     // Core tier
      expect(UPGRADE_COSTS.figureSize).toBe(150);    // Power tier
      expect(UPGRADE_COSTS.bombCount).toBe(220);     // Premium tier
      expect(UPGRADE_COSTS.shield).toBe(220);        // Consumable
      expect(UPGRADE_COSTS.secondChance).toBe(360);  // Most valuable consumable
    });
  });

  describe('UPGRADE_MAX_LEVELS', () => {
    it('has max levels for all upgrade types', () => {
      const upgradeTypes: UpgradeType[] = [
        'bombCount', 'figureSize', 'queueSize', 'timeBonus',
        'placementBonus', 'slowMo', 'shield', 'coinBoost', 'lucky', 'secondChance'
      ];
      
      for (const type of upgradeTypes) {
        expect(UPGRADE_MAX_LEVELS[type]).toBeDefined();
        expect(UPGRADE_MAX_LEVELS[type]).toBeGreaterThan(0);
      }
    });

    it('consumables have high max levels', () => {
      expect(UPGRADE_MAX_LEVELS.shield).toBe(99);
      expect(UPGRADE_MAX_LEVELS.secondChance).toBe(99);
    });

    it('regular upgrades have limited max levels', () => {
      expect(UPGRADE_MAX_LEVELS.bombCount).toBe(5);
      expect(UPGRADE_MAX_LEVELS.figureSize).toBe(5);
      expect(UPGRADE_MAX_LEVELS.queueSize).toBe(4);
      expect(UPGRADE_MAX_LEVELS.timeBonus).toBe(3);
    });
  });

  describe('buyUpgrade', () => {
    it('successfully purchases upgrade when affordable', () => {
      const initialCoins = useGameStore.getState().coins;
      const result = useGameStore.getState().buyUpgrade('bombCount');
      
      expect(result).toBe(true);
      expect(useGameStore.getState().upgrades.bombCount).toBe(2);
      expect(useGameStore.getState().coins).toBeLessThan(initialCoins);
    });

    it('fails when not enough coins', () => {
      useGameStore.setState({ coins: 0 });
      const result = useGameStore.getState().buyUpgrade('bombCount');
      
      expect(result).toBe(false);
      expect(useGameStore.getState().upgrades.bombCount).toBe(1);
    });

    it('calculates scaled cost for leveled upgrades', () => {
      useGameStore.setState({ 
        coins: 10000,
        upgrades: { ...useGameStore.getState().upgrades, bombCount: 3 }
      });
      
      const initialCoins = useGameStore.getState().coins;
      useGameStore.getState().buyUpgrade('bombCount');
      const spent = initialCoins - useGameStore.getState().coins;
      
      expect(spent).toBe(UPGRADE_COSTS.bombCount * 3);
    });

    it('uses flat cost for consumables', () => {
      const initialCoins = useGameStore.getState().coins;
      useGameStore.getState().buyUpgrade('shield');
      const spent = initialCoins - useGameStore.getState().coins;
      
      expect(spent).toBe(UPGRADE_COSTS.shield);
    });

    it('allows multiple consumable purchases', () => {
      useGameStore.getState().buyUpgrade('shield');
      useGameStore.getState().buyUpgrade('shield');
      useGameStore.getState().buyUpgrade('shield');
      
      expect(useGameStore.getState().upgrades.shield).toBe(3);
    });

    it('blocks purchase at max level for non-consumables', () => {
      useGameStore.setState({ 
        upgrades: { ...useGameStore.getState().upgrades, bombCount: 5 }
      });
      
      const result = useGameStore.getState().buyUpgrade('bombCount');
      expect(result).toBe(false);
    });

    it('allows consumable purchase beyond typical max', () => {
      useGameStore.setState({ 
        upgrades: { ...useGameStore.getState().upgrades, shield: 50 }
      });
      
      const result = useGameStore.getState().buyUpgrade('shield');
      expect(result).toBe(true);
      expect(useGameStore.getState().upgrades.shield).toBe(51);
    });
  });

  describe('Skill Consumables', () => {
    it('buySkillConsumable purchases freeze', () => {
      useGameStore.setState({ coins: 1000, freezeCount: 0 });
      const result = useGameStore.getState().buySkillConsumable('freeze');
      
      expect(result).toBe(true);
      expect(useGameStore.getState().freezeCount).toBe(1);
    });

    it('buySkillConsumable purchases cleanser', () => {
      useGameStore.setState({ coins: 1000, cleanserCount: 0 });
      const result = useGameStore.getState().buySkillConsumable('cleanser');
      
      expect(result).toBe(true);
      expect(useGameStore.getState().cleanserCount).toBe(1);
    });

    it('buySkillConsumable fails without enough coins', () => {
      useGameStore.setState({ coins: 0, freezeCount: 0 });
      const result = useGameStore.getState().buySkillConsumable('freeze');
      
      expect(result).toBe(false);
      expect(useGameStore.getState().freezeCount).toBe(0);
    });
  });
});

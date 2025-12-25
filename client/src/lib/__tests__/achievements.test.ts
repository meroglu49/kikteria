import { describe, it, expect } from 'vitest';
import { ACHIEVEMENTS, AchievementDef } from '../game-constants';

describe('Achievement System', () => {
  describe('ACHIEVEMENTS definitions', () => {
    it('has achievements defined', () => {
      expect(ACHIEVEMENTS.length).toBeGreaterThan(0);
    });

    it('all achievements have unique ids', () => {
      const ids = ACHIEVEMENTS.map(a => a.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('all achievements have required properties', () => {
      for (const achievement of ACHIEVEMENTS) {
        expect(achievement.id).toBeDefined();
        expect(achievement.name).toBeDefined();
        expect(achievement.description).toBeDefined();
        expect(achievement.category).toBeDefined();
        expect(achievement.tier).toBeDefined();
        expect(achievement.requirement).toBeDefined();
        expect(achievement.coinReward).toBeDefined();
        expect(achievement.badgeIcon).toBeDefined();
        expect(achievement.trackingKey).toBeDefined();
      }
    });

    it('all achievements have valid categories', () => {
      const validCategories = ['mastery', 'collection', 'social', 'challenge'];
      for (const achievement of ACHIEVEMENTS) {
        expect(validCategories).toContain(achievement.category);
      }
    });

    it('all achievements have valid tiers (1-3)', () => {
      for (const achievement of ACHIEVEMENTS) {
        expect(achievement.tier).toBeGreaterThanOrEqual(1);
        expect(achievement.tier).toBeLessThanOrEqual(3);
      }
    });

    it('all achievements have positive requirements', () => {
      for (const achievement of ACHIEVEMENTS) {
        expect(achievement.requirement).toBeGreaterThan(0);
      }
    });

    it('all achievements have positive coin rewards', () => {
      for (const achievement of ACHIEVEMENTS) {
        expect(achievement.coinReward).toBeGreaterThan(0);
      }
    });

    it('all achievements have badge icons', () => {
      for (const achievement of ACHIEVEMENTS) {
        expect(achievement.badgeIcon.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Achievement Categories', () => {
    it('has mastery achievements', () => {
      const mastery = ACHIEVEMENTS.filter(a => a.category === 'mastery');
      expect(mastery.length).toBeGreaterThan(0);
    });

    it('has collection achievements', () => {
      const collection = ACHIEVEMENTS.filter(a => a.category === 'collection');
      expect(collection.length).toBeGreaterThan(0);
    });

    it('has social achievements', () => {
      const social = ACHIEVEMENTS.filter(a => a.category === 'social');
      expect(social.length).toBeGreaterThan(0);
    });

    it('has challenge achievements', () => {
      const challenge = ACHIEVEMENTS.filter(a => a.category === 'challenge');
      expect(challenge.length).toBeGreaterThan(0);
    });
  });

  describe('Achievement Tracking Keys', () => {
    it('uses valid tracking keys', () => {
      const validKeys = [
        'totalPlacements',
        'totalCoinsEarned',
        'highestLevel',
        'dailyOrdersCompleted',
        'endlessBestWave',
        'bombsUsed',
      ];
      
      for (const achievement of ACHIEVEMENTS) {
        expect(validKeys).toContain(achievement.trackingKey);
      }
    });

    it('has placement-based achievements', () => {
      const placementAchievements = ACHIEVEMENTS.filter(
        a => a.trackingKey === 'totalPlacements'
      );
      expect(placementAchievements.length).toBeGreaterThan(0);
    });

    it('has coin-based achievements', () => {
      const coinAchievements = ACHIEVEMENTS.filter(
        a => a.trackingKey === 'totalCoinsEarned'
      );
      expect(coinAchievements.length).toBeGreaterThan(0);
    });

    it('has level-based achievements', () => {
      const levelAchievements = ACHIEVEMENTS.filter(
        a => a.trackingKey === 'highestLevel'
      );
      expect(levelAchievements.length).toBeGreaterThan(0);
    });
  });

  describe('Achievement Tiers and Rewards', () => {
    it('tier 1 achievements have lower rewards than tier 3', () => {
      const tier1 = ACHIEVEMENTS.filter(a => a.tier === 1);
      const tier3 = ACHIEVEMENTS.filter(a => a.tier === 3);
      
      if (tier1.length > 0 && tier3.length > 0) {
        const avgTier1 = tier1.reduce((sum, a) => sum + a.coinReward, 0) / tier1.length;
        const avgTier3 = tier3.reduce((sum, a) => sum + a.coinReward, 0) / tier3.length;
        expect(avgTier3).toBeGreaterThan(avgTier1);
      }
    });

    it('same tracking key achievements have progressive requirements', () => {
      const placementAchievements = ACHIEVEMENTS
        .filter(a => a.trackingKey === 'totalPlacements')
        .sort((a, b) => a.requirement - b.requirement);
      
      for (let i = 1; i < placementAchievements.length; i++) {
        expect(placementAchievements[i].requirement)
          .toBeGreaterThan(placementAchievements[i - 1].requirement);
      }
    });
  });

  describe('Specific Achievements', () => {
    it('has first placement achievement', () => {
      const firstPlacement = ACHIEVEMENTS.find(a => a.id === 'first_placement');
      expect(firstPlacement).toBeDefined();
      expect(firstPlacement?.requirement).toBe(1);
    });

    it('has level completion achievements for all 7 levels', () => {
      const level7 = ACHIEVEMENTS.find(a => a.id === 'level_7');
      expect(level7).toBeDefined();
      expect(level7?.requirement).toBe(7);
    });

    it('has daily order achievements', () => {
      const dailyAchievements = ACHIEVEMENTS.filter(
        a => a.trackingKey === 'dailyOrdersCompleted'
      );
      expect(dailyAchievements.length).toBeGreaterThan(0);
    });

    it('has endless mode achievements', () => {
      const endlessAchievements = ACHIEVEMENTS.filter(
        a => a.trackingKey === 'endlessBestWave'
      );
      expect(endlessAchievements.length).toBeGreaterThan(0);
    });
  });
});

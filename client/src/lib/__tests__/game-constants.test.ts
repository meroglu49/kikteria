import { describe, it, expect } from 'vitest';
import {
  getVibrationEnvelope,
  computeEffectiveRadius,
  BACTERIA_TEMPLATES,
  BOMB_TEMPLATE,
  GAME_CONFIG,
  LEVELS,
  FigureTemplate,
  FigureInstance,
} from '../game-constants';

describe('getVibrationEnvelope', () => {
  const createTemplate = (pattern: string, amplitude: number): FigureTemplate => ({
    id: 'test',
    name: 'Test',
    shapes: [],
    vibrationPattern: pattern as any,
    vibrationSpeed: 1,
    vibrationAmplitude: amplitude,
    baseScale: 1,
    rarity: 'common',
    coinValue: 10,
  });

  it('returns amplitude for horizontal pattern', () => {
    const template = createTemplate('horizontal', 10);
    expect(getVibrationEnvelope(template, 1)).toBe(10);
  });

  it('returns amplitude for vertical pattern', () => {
    const template = createTemplate('vertical', 15);
    expect(getVibrationEnvelope(template, 1)).toBe(15);
  });

  it('returns amplitude for circular pattern', () => {
    const template = createTemplate('circular', 8);
    expect(getVibrationEnvelope(template, 1)).toBe(8);
  });

  it('returns scaled pulse envelope for pulse pattern', () => {
    const template = createTemplate('pulse', 10);
    const scale = 1.5;
    const expected = GAME_CONFIG.FIGURE_BASE_SIZE * scale * 0.1;
    expect(getVibrationEnvelope(template, scale)).toBe(expected);
  });

  it('returns diagonal envelope with sqrt(2) factor', () => {
    const template = createTemplate('diagonal', 10);
    const expected = 10 * 0.7 * Math.sqrt(2);
    expect(getVibrationEnvelope(template, 1)).toBeCloseTo(expected);
  });

  it('handles different scales correctly', () => {
    const template = createTemplate('horizontal', 10);
    expect(getVibrationEnvelope(template, 2)).toBe(10);
  });
});

describe('computeEffectiveRadius', () => {
  const createFigure = (templateId: string, scale: number): FigureInstance => ({
    id: 'fig1',
    templateId,
    x: 100,
    y: 100,
    rotation: 0,
    scale,
    vibrationOffset: 0,
    isPlaced: true,
  });

  it('computes radius for common bacteria', () => {
    const figure = createFigure('blobby', 1);
    const radius = computeEffectiveRadius(figure, BACTERIA_TEMPLATES, BOMB_TEMPLATE);
    expect(radius).toBeGreaterThan(0);
    expect(radius).toBeGreaterThan(GAME_CONFIG.FIGURE_BASE_SIZE);
  });

  it('computes radius for bomb template', () => {
    const figure = createFigure('bomb', 1);
    const radius = computeEffectiveRadius(figure, BACTERIA_TEMPLATES, BOMB_TEMPLATE);
    expect(radius).toBeGreaterThan(0);
  });

  it('scales radius with figure scale', () => {
    const figure1 = createFigure('blobby', 1);
    const figure2 = createFigure('blobby', 2);
    const radius1 = computeEffectiveRadius(figure1, BACTERIA_TEMPLATES, BOMB_TEMPLATE);
    const radius2 = computeEffectiveRadius(figure2, BACTERIA_TEMPLATES, BOMB_TEMPLATE);
    expect(radius2).toBeGreaterThan(radius1);
  });

  it('returns base radius for unknown template', () => {
    const figure = createFigure('unknown', 1.5);
    const radius = computeEffectiveRadius(figure, BACTERIA_TEMPLATES, BOMB_TEMPLATE);
    expect(radius).toBe(GAME_CONFIG.FIGURE_BASE_SIZE * 1.5);
  });

  it('handles all bacteria templates', () => {
    for (const template of BACTERIA_TEMPLATES) {
      const figure = createFigure(template.id, 1);
      const radius = computeEffectiveRadius(figure, BACTERIA_TEMPLATES, BOMB_TEMPLATE);
      expect(radius).toBeGreaterThan(0);
    }
  });
});

describe('GAME_CONFIG', () => {
  it('has valid canvas padding', () => {
    expect(GAME_CONFIG.CANVAS_PADDING).toBeGreaterThan(0);
  });

  it('has valid figure base size', () => {
    expect(GAME_CONFIG.FIGURE_BASE_SIZE).toBeGreaterThan(0);
  });

  it('has valid collision padding', () => {
    expect(GAME_CONFIG.COLLISION_PADDING).toBeGreaterThanOrEqual(0);
  });

  it('has valid queue size', () => {
    expect(GAME_CONFIG.QUEUE_SIZE).toBeGreaterThan(0);
  });

  it('has valid starting bombs', () => {
    expect(GAME_CONFIG.STARTING_BOMBS).toBeGreaterThanOrEqual(0);
  });
});

describe('LEVELS', () => {
  it('has 100 levels', () => {
    expect(LEVELS).toHaveLength(100);
  });

  it('overall difficulty increases from start to end', () => {
    const firstLevel = LEVELS[0];
    const lastLevel = LEVELS[99];
    expect(lastLevel.figuresCount).toBeGreaterThan(firstLevel.figuresCount);
    expect(lastLevel.speedMultiplier).toBeGreaterThan(firstLevel.speedMultiplier);
    expect(lastLevel.sizeMultiplier).toBeGreaterThan(firstLevel.sizeMultiplier);
  });

  it('all levels have valid properties', () => {
    for (const level of LEVELS) {
      expect(level.figuresCount).toBeGreaterThan(0);
      expect(level.startTime).toBeGreaterThan(0);
      expect(level.speedMultiplier).toBeGreaterThan(0);
      expect(level.sizeMultiplier).toBeGreaterThan(0);
    }
  });

  it('level numbers are sequential', () => {
    for (let i = 0; i < LEVELS.length; i++) {
      expect(LEVELS[i].level).toBe(i + 1);
    }
  });

  it('all levels have names', () => {
    for (const level of LEVELS) {
      expect(level.name).toBeDefined();
      expect(level.name.length).toBeGreaterThan(0);
    }
  });

  it('has milestone levels with increased difficulty', () => {
    const milestones = [10, 25, 50, 75, 100];
    for (const m of milestones) {
      const level = LEVELS[m - 1];
      expect(level.isMilestone).toBe(true);
    }
  });

  it('has breather levels with reduced difficulty', () => {
    const breathers = [7, 17, 27, 37, 47, 57, 67, 77, 87, 97];
    for (const b of breathers) {
      const level = LEVELS[b - 1];
      expect(level.isBreather).toBe(true);
    }
  });

  it('figures count stays within bounds', () => {
    for (const level of LEVELS) {
      expect(level.figuresCount).toBeGreaterThanOrEqual(8);
      expect(level.figuresCount).toBeLessThanOrEqual(40);
    }
  });

  it('speed multiplier stays within bounds', () => {
    for (const level of LEVELS) {
      expect(level.speedMultiplier).toBeGreaterThanOrEqual(1);
      expect(level.speedMultiplier).toBeLessThanOrEqual(2.9);
    }
  });
});

describe('BACTERIA_TEMPLATES', () => {
  it('has at least 10 templates', () => {
    expect(BACTERIA_TEMPLATES.length).toBeGreaterThanOrEqual(10);
  });

  it('all templates have unique ids', () => {
    const ids = BACTERIA_TEMPLATES.map(t => t.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('all templates have valid rarity', () => {
    for (const template of BACTERIA_TEMPLATES) {
      expect(['common', 'rare', 'epic']).toContain(template.rarity);
    }
  });

  it('all templates have positive coin value', () => {
    for (const template of BACTERIA_TEMPLATES) {
      expect(template.coinValue).toBeGreaterThan(0);
    }
  });

  it('all templates have at least one shape', () => {
    for (const template of BACTERIA_TEMPLATES) {
      expect(template.shapes.length).toBeGreaterThan(0);
    }
  });

  it('all templates have valid vibration patterns', () => {
    const validPatterns = ['horizontal', 'vertical', 'circular', 'pulse', 'diagonal'];
    for (const template of BACTERIA_TEMPLATES) {
      expect(validPatterns).toContain(template.vibrationPattern);
    }
  });

  it('all templates have positive vibration speed', () => {
    for (const template of BACTERIA_TEMPLATES) {
      expect(template.vibrationSpeed).toBeGreaterThan(0);
    }
  });

  it('all templates have names', () => {
    for (const template of BACTERIA_TEMPLATES) {
      expect(template.name).toBeDefined();
      expect(template.name.length).toBeGreaterThan(0);
    }
  });
});

describe('BOMB_TEMPLATE', () => {
  it('has bomb id', () => {
    expect(BOMB_TEMPLATE.id).toBe('bomb');
  });

  it('has shapes', () => {
    expect(BOMB_TEMPLATE.shapes.length).toBeGreaterThan(0);
  });

  it('has valid vibration properties', () => {
    expect(BOMB_TEMPLATE.vibrationSpeed).toBeGreaterThan(0);
    expect(BOMB_TEMPLATE.vibrationAmplitude).toBeGreaterThanOrEqual(0);
  });
});

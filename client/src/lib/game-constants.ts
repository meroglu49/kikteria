// Game Constants for Kikteria - Bacteria Placement Game

export type GameState = 'MENU' | 'LEVEL_SELECT' | 'PLAYING' | 'PAUSED' | 'GAME_OVER' | 'SHOP' | 'WIN' | 'CELEBRATING';

// Vibration pattern types
export type VibrationPattern = 'horizontal' | 'vertical' | 'circular' | 'pulse' | 'diagonal';

// Basic shape types that make up figures
export type ShapeType = 'circle' | 'square' | 'triangle' | 'line' | 'oval' | 'rect';

// Single shape component of a figure
export interface ShapeComponent {
  type: ShapeType;
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
  rotation: number;
  color: string;
  strokeColor?: string;
  strokeWidth?: number;
}

// Figure template
export interface FigureTemplate {
  id: string;
  name: string;
  shapes: ShapeComponent[];
  vibrationPattern: VibrationPattern;
  vibrationSpeed: number;
  vibrationAmplitude: number;
  baseScale: number;
  rarity: 'common' | 'rare' | 'epic';
  coinValue: number;
}

// Instance of a placed or queued figure
export interface FigureInstance {
  id: string;
  templateId: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  vibrationOffset: number;
  isPlaced: boolean;
}

export const GAME_CONFIG = {
  CANVAS_PADDING: 50,
  FIGURE_BASE_SIZE: 35,
  COLLISION_PADDING: 5,
  QUEUE_SIZE: 3,
  STARTING_BOMBS: 2,
  FIGURES_PER_ROUND: 15,
  GAME_TIME: 15,
  TIME_BONUS_PER_FIGURE: 1,
  
  COLORS: {
    BACKGROUND: '#E8F4F4',
    GRID: '#B8D8D8',
    PREVIEW_AREA: '#D0E8E8',
    PLACED_BORDER: '#2DD4BF',
    COLLISION_WARNING: '#EF4444',
  }
} as const;

export interface LevelConfig {
  level: number;
  name: string;
  figuresCount: number;
  startTime: number;
  timeBonusPerFigure: number;
  speedMultiplier: number;
  sizeMultiplier: number;
  areaShrinkRate: number;
}

export const LEVELS: LevelConfig[] = [
  {
    level: 1,
    name: 'Petri Dish',
    figuresCount: 8,
    startTime: 20,
    timeBonusPerFigure: 2,
    speedMultiplier: 1.0,
    sizeMultiplier: 0.9,
    areaShrinkRate: 0,
  },
  {
    level: 2,
    name: 'Lab Sample',
    figuresCount: 10,
    startTime: 18,
    timeBonusPerFigure: 1.5,
    speedMultiplier: 1.2,
    sizeMultiplier: 1.0,
    areaShrinkRate: 0,
  },
  {
    level: 3,
    name: 'Culture Growth',
    figuresCount: 12,
    startTime: 16,
    timeBonusPerFigure: 1.5,
    speedMultiplier: 1.4,
    sizeMultiplier: 1.0,
    areaShrinkRate: 0.5,
  },
  {
    level: 4,
    name: 'Outbreak',
    figuresCount: 14,
    startTime: 15,
    timeBonusPerFigure: 1,
    speedMultiplier: 1.6,
    sizeMultiplier: 1.1,
    areaShrinkRate: 1,
  },
  {
    level: 5,
    name: 'Pandemic',
    figuresCount: 16,
    startTime: 14,
    timeBonusPerFigure: 1,
    speedMultiplier: 1.8,
    sizeMultiplier: 1.15,
    areaShrinkRate: 1.5,
  },
  {
    level: 6,
    name: 'Biohazard',
    figuresCount: 18,
    startTime: 13,
    timeBonusPerFigure: 0.8,
    speedMultiplier: 2.0,
    sizeMultiplier: 1.2,
    areaShrinkRate: 2,
  },
  {
    level: 7,
    name: 'Extinction',
    figuresCount: 20,
    startTime: 12,
    timeBonusPerFigure: 0.5,
    speedMultiplier: 2.2,
    sizeMultiplier: 1.25,
    areaShrinkRate: 2.5,
  },
];

// Creative funny-ugly bacteria figures with expressive faces
export const BACTERIA_TEMPLATES: FigureTemplate[] = [
  // 1. Blobby - A goofy yellow slime
  {
    id: 'blobby',
    name: 'Blobby',
    baseScale: 1.0,
    shapes: [
      // Body - irregular blob shape made of overlapping circles
      { type: 'circle', offsetX: 0, offsetY: 5, width: 50, height: 50, rotation: 0, color: '#FFE066', strokeColor: '#E6B800', strokeWidth: 3 },
      { type: 'circle', offsetX: -15, offsetY: 0, width: 30, height: 30, rotation: 0, color: '#FFE066', strokeColor: '#E6B800', strokeWidth: 2 },
      { type: 'circle', offsetX: 18, offsetY: 2, width: 28, height: 28, rotation: 0, color: '#FFE066', strokeColor: '#E6B800', strokeWidth: 2 },
      // Big goofy eyes - different sizes
      { type: 'circle', offsetX: -10, offsetY: -8, width: 22, height: 22, rotation: 0, color: '#FFFFFF', strokeColor: '#333', strokeWidth: 2 },
      { type: 'circle', offsetX: 12, offsetY: -5, width: 18, height: 18, rotation: 0, color: '#FFFFFF', strokeColor: '#333', strokeWidth: 2 },
      // Pupils looking different directions
      { type: 'circle', offsetX: -6, offsetY: -6, width: 10, height: 10, rotation: 0, color: '#000000' },
      { type: 'circle', offsetX: 16, offsetY: -3, width: 8, height: 8, rotation: 0, color: '#000000' },
      // Silly wide smile
      { type: 'circle', offsetX: 0, offsetY: 12, width: 28, height: 16, rotation: 0, color: '#FF6B6B', strokeColor: '#CC4444', strokeWidth: 2 },
      { type: 'circle', offsetX: 0, offsetY: 8, width: 28, height: 12, rotation: 0, color: '#FFE066' },
      // Blush spots
      { type: 'circle', offsetX: -22, offsetY: 5, width: 10, height: 8, rotation: 0, color: '#FFB3B3' },
      { type: 'circle', offsetX: 22, offsetY: 5, width: 10, height: 8, rotation: 0, color: '#FFB3B3' },
    ],
    vibrationPattern: 'pulse',
    vibrationSpeed: 5,
    vibrationAmplitude: 8,
    rarity: 'common',
    coinValue: 10
  },
  // 2. Grumpus - An angry green square
  {
    id: 'grumpus',
    name: 'Grumpus',
    baseScale: 0.9,
    shapes: [
      // Blocky body
      { type: 'square', offsetX: 0, offsetY: 0, width: 48, height: 48, rotation: 3, color: '#7FD17F', strokeColor: '#4CAF50', strokeWidth: 3 },
      // Angry slanted eyes
      { type: 'square', offsetX: -12, offsetY: -8, width: 14, height: 10, rotation: -15, color: '#FFFFFF', strokeColor: '#333', strokeWidth: 2 },
      { type: 'square', offsetX: 12, offsetY: -8, width: 14, height: 10, rotation: 15, color: '#FFFFFF', strokeColor: '#333', strokeWidth: 2 },
      { type: 'circle', offsetX: -10, offsetY: -6, width: 6, height: 6, rotation: 0, color: '#000000' },
      { type: 'circle', offsetX: 14, offsetY: -6, width: 6, height: 6, rotation: 0, color: '#000000' },
      // Angry eyebrows
      { type: 'rect', offsetX: -14, offsetY: -16, width: 16, height: 4, rotation: 25, color: '#2E7D32' },
      { type: 'rect', offsetX: 14, offsetY: -16, width: 16, height: 4, rotation: -25, color: '#2E7D32' },
      // Grumpy frown
      { type: 'rect', offsetX: 0, offsetY: 14, width: 24, height: 6, rotation: 0, color: '#4CAF50', strokeColor: '#2E7D32', strokeWidth: 2 },
      // Little legs
      { type: 'rect', offsetX: -14, offsetY: 28, width: 8, height: 12, rotation: 0, color: '#4CAF50', strokeColor: '#2E7D32', strokeWidth: 2 },
      { type: 'rect', offsetX: 14, offsetY: 28, width: 8, height: 12, rotation: 0, color: '#4CAF50', strokeColor: '#2E7D32', strokeWidth: 2 },
    ],
    vibrationPattern: 'horizontal',
    vibrationSpeed: 8,
    vibrationAmplitude: 12,
    rarity: 'common',
    coinValue: 10
  },
  // 3. Wobbly - A wobbly blue teardrop
  {
    id: 'wobbly',
    name: 'Wobbly',
    baseScale: 1.1,
    shapes: [
      // Teardrop body
      { type: 'circle', offsetX: 0, offsetY: 8, width: 55, height: 55, rotation: 0, color: '#64B5F6', strokeColor: '#1976D2', strokeWidth: 3 },
      { type: 'triangle', offsetX: 0, offsetY: -25, width: 30, height: 35, rotation: 0, color: '#64B5F6', strokeColor: '#1976D2', strokeWidth: 3 },
      // Worried eyes
      { type: 'circle', offsetX: -12, offsetY: 0, width: 20, height: 24, rotation: 0, color: '#FFFFFF', strokeColor: '#333', strokeWidth: 2 },
      { type: 'circle', offsetX: 12, offsetY: 0, width: 20, height: 24, rotation: 0, color: '#FFFFFF', strokeColor: '#333', strokeWidth: 2 },
      { type: 'circle', offsetX: -12, offsetY: 4, width: 10, height: 10, rotation: 0, color: '#1565C0' },
      { type: 'circle', offsetX: 12, offsetY: 4, width: 10, height: 10, rotation: 0, color: '#1565C0' },
      // Worried eyebrows
      { type: 'rect', offsetX: -12, offsetY: -14, width: 14, height: 3, rotation: -20, color: '#1976D2' },
      { type: 'rect', offsetX: 12, offsetY: -14, width: 14, height: 3, rotation: 20, color: '#1976D2' },
      // Small worried mouth
      { type: 'circle', offsetX: 0, offsetY: 18, width: 14, height: 10, rotation: 0, color: '#1565C0' },
      // Sweat drop
      { type: 'circle', offsetX: 22, offsetY: -5, width: 8, height: 10, rotation: 0, color: '#90CAF9' },
    ],
    vibrationPattern: 'vertical',
    vibrationSpeed: 6,
    vibrationAmplitude: 14,
    rarity: 'common',
    coinValue: 10
  },
  // 4. Cyclops - A one-eyed purple monster
  {
    id: 'cyclops',
    name: 'Cyclops',
    baseScale: 1.2,
    shapes: [
      // Round body
      { type: 'circle', offsetX: 0, offsetY: 0, width: 58, height: 58, rotation: 0, color: '#BA68C8', strokeColor: '#7B1FA2', strokeWidth: 3 },
      // Horns
      { type: 'triangle', offsetX: -20, offsetY: -28, width: 14, height: 20, rotation: -15, color: '#7B1FA2', strokeColor: '#4A148C', strokeWidth: 2 },
      { type: 'triangle', offsetX: 20, offsetY: -28, width: 14, height: 20, rotation: 15, color: '#7B1FA2', strokeColor: '#4A148C', strokeWidth: 2 },
      // Giant single eye
      { type: 'circle', offsetX: 0, offsetY: -5, width: 36, height: 36, rotation: 0, color: '#FFFFFF', strokeColor: '#333', strokeWidth: 3 },
      { type: 'circle', offsetX: 0, offsetY: -5, width: 18, height: 18, rotation: 0, color: '#E040FB' },
      { type: 'circle', offsetX: 0, offsetY: -5, width: 8, height: 8, rotation: 0, color: '#000000' },
      { type: 'circle', offsetX: -5, offsetY: -10, width: 6, height: 6, rotation: 0, color: '#FFFFFF' },
      // Wide toothy grin
      { type: 'rect', offsetX: 0, offsetY: 18, width: 30, height: 12, rotation: 0, color: '#FFFFFF', strokeColor: '#333', strokeWidth: 2 },
      { type: 'rect', offsetX: -10, offsetY: 18, width: 3, height: 12, rotation: 0, color: '#4A148C' },
      { type: 'rect', offsetX: 0, offsetY: 18, width: 3, height: 12, rotation: 0, color: '#4A148C' },
      { type: 'rect', offsetX: 10, offsetY: 18, width: 3, height: 12, rotation: 0, color: '#4A148C' },
    ],
    vibrationPattern: 'circular',
    vibrationSpeed: 4,
    vibrationAmplitude: 10,
    rarity: 'rare',
    coinValue: 20
  },
  // 5. Squish - A pink squishy blob
  {
    id: 'squish',
    name: 'Squish',
    baseScale: 0.85,
    shapes: [
      // Squishy body
      { type: 'oval', offsetX: 0, offsetY: 0, width: 55, height: 40, rotation: 0, color: '#F48FB1', strokeColor: '#EC407A', strokeWidth: 3 },
      // Cute round eyes
      { type: 'circle', offsetX: -14, offsetY: -5, width: 16, height: 18, rotation: 0, color: '#FFFFFF', strokeColor: '#333', strokeWidth: 2 },
      { type: 'circle', offsetX: 14, offsetY: -5, width: 16, height: 18, rotation: 0, color: '#FFFFFF', strokeColor: '#333', strokeWidth: 2 },
      { type: 'circle', offsetX: -12, offsetY: -3, width: 8, height: 8, rotation: 0, color: '#000000' },
      { type: 'circle', offsetX: 16, offsetY: -3, width: 8, height: 8, rotation: 0, color: '#000000' },
      { type: 'circle', offsetX: -10, offsetY: -5, width: 3, height: 3, rotation: 0, color: '#FFFFFF' },
      { type: 'circle', offsetX: 18, offsetY: -5, width: 3, height: 3, rotation: 0, color: '#FFFFFF' },
      // Cat-like mouth
      { type: 'triangle', offsetX: 0, offsetY: 8, width: 8, height: 6, rotation: 180, color: '#EC407A' },
      // Rosy cheeks
      { type: 'circle', offsetX: -22, offsetY: 2, width: 10, height: 8, rotation: 0, color: '#FF8A80' },
      { type: 'circle', offsetX: 22, offsetY: 2, width: 10, height: 8, rotation: 0, color: '#FF8A80' },
      // Little ears
      { type: 'triangle', offsetX: -22, offsetY: -18, width: 14, height: 16, rotation: -20, color: '#F48FB1', strokeColor: '#EC407A', strokeWidth: 2 },
      { type: 'triangle', offsetX: 22, offsetY: -18, width: 14, height: 16, rotation: 20, color: '#F48FB1', strokeColor: '#EC407A', strokeWidth: 2 },
    ],
    vibrationPattern: 'diagonal',
    vibrationSpeed: 7,
    vibrationAmplitude: 9,
    rarity: 'common',
    coinValue: 10
  },
  // 6. Chompy - An orange monster with big teeth
  {
    id: 'chompy',
    name: 'Chompy',
    baseScale: 1.0,
    shapes: [
      // Round body
      { type: 'circle', offsetX: 0, offsetY: 0, width: 52, height: 52, rotation: 0, color: '#FF9800', strokeColor: '#E65100', strokeWidth: 3 },
      // Small angry eyes
      { type: 'circle', offsetX: -12, offsetY: -12, width: 14, height: 14, rotation: 0, color: '#FFFFFF', strokeColor: '#333', strokeWidth: 2 },
      { type: 'circle', offsetX: 12, offsetY: -12, width: 14, height: 14, rotation: 0, color: '#FFFFFF', strokeColor: '#333', strokeWidth: 2 },
      { type: 'circle', offsetX: -10, offsetY: -10, width: 6, height: 6, rotation: 0, color: '#000000' },
      { type: 'circle', offsetX: 14, offsetY: -10, width: 6, height: 6, rotation: 0, color: '#000000' },
      // Angry eyebrows
      { type: 'rect', offsetX: -14, offsetY: -22, width: 14, height: 4, rotation: 20, color: '#E65100' },
      { type: 'rect', offsetX: 14, offsetY: -22, width: 14, height: 4, rotation: -20, color: '#E65100' },
      // HUGE mouth with teeth
      { type: 'circle', offsetX: 0, offsetY: 8, width: 40, height: 30, rotation: 0, color: '#D32F2F', strokeColor: '#B71C1C', strokeWidth: 2 },
      // Top teeth
      { type: 'triangle', offsetX: -14, offsetY: 2, width: 8, height: 12, rotation: 180, color: '#FFFFFF', strokeColor: '#DDD', strokeWidth: 1 },
      { type: 'triangle', offsetX: -5, offsetY: 2, width: 10, height: 14, rotation: 180, color: '#FFFFFF', strokeColor: '#DDD', strokeWidth: 1 },
      { type: 'triangle', offsetX: 5, offsetY: 2, width: 10, height: 14, rotation: 180, color: '#FFFFFF', strokeColor: '#DDD', strokeWidth: 1 },
      { type: 'triangle', offsetX: 14, offsetY: 2, width: 8, height: 12, rotation: 180, color: '#FFFFFF', strokeColor: '#DDD', strokeWidth: 1 },
      // Bottom teeth
      { type: 'triangle', offsetX: -10, offsetY: 18, width: 8, height: 10, rotation: 0, color: '#FFFFFF', strokeColor: '#DDD', strokeWidth: 1 },
      { type: 'triangle', offsetX: 0, offsetY: 18, width: 10, height: 12, rotation: 0, color: '#FFFFFF', strokeColor: '#DDD', strokeWidth: 1 },
      { type: 'triangle', offsetX: 10, offsetY: 18, width: 8, height: 10, rotation: 0, color: '#FFFFFF', strokeColor: '#DDD', strokeWidth: 1 },
    ],
    vibrationPattern: 'horizontal',
    vibrationSpeed: 9,
    vibrationAmplitude: 16,
    rarity: 'rare',
    coinValue: 20
  },
  // 7. Derp - A derpy looking creature
  {
    id: 'derp',
    name: 'Derp',
    baseScale: 0.95,
    shapes: [
      // Potato-shaped body
      { type: 'oval', offsetX: 0, offsetY: 0, width: 50, height: 45, rotation: 8, color: '#A1887F', strokeColor: '#6D4C41', strokeWidth: 3 },
      // Derpy misaligned eyes
      { type: 'circle', offsetX: -14, offsetY: -8, width: 20, height: 16, rotation: -10, color: '#FFFFFF', strokeColor: '#333', strokeWidth: 2 },
      { type: 'circle', offsetX: 10, offsetY: -2, width: 16, height: 20, rotation: 10, color: '#FFFFFF', strokeColor: '#333', strokeWidth: 2 },
      // Pupils looking different ways
      { type: 'circle', offsetX: -18, offsetY: -6, width: 8, height: 8, rotation: 0, color: '#000000' },
      { type: 'circle', offsetX: 6, offsetY: 2, width: 7, height: 7, rotation: 0, color: '#000000' },
      // Crooked smile
      { type: 'rect', offsetX: -5, offsetY: 14, width: 22, height: 6, rotation: 12, color: '#5D4037', strokeColor: '#3E2723', strokeWidth: 2 },
      // Tongue sticking out
      { type: 'circle', offsetX: 8, offsetY: 18, width: 10, height: 8, rotation: 0, color: '#EF5350' },
      // Messy hair/bumps
      { type: 'circle', offsetX: -12, offsetY: -25, width: 12, height: 10, rotation: 0, color: '#8D6E63' },
      { type: 'circle', offsetX: 0, offsetY: -28, width: 10, height: 12, rotation: 0, color: '#8D6E63' },
      { type: 'circle', offsetX: 14, offsetY: -24, width: 14, height: 10, rotation: 0, color: '#8D6E63' },
    ],
    vibrationPattern: 'diagonal',
    vibrationSpeed: 5,
    vibrationAmplitude: 11,
    rarity: 'common',
    coinValue: 10
  },
  // 8. Ghosty - A spooky but cute ghost
  {
    id: 'ghosty',
    name: 'Ghosty',
    baseScale: 1.05,
    shapes: [
      // Ghost body
      { type: 'circle', offsetX: 0, offsetY: -8, width: 48, height: 48, rotation: 0, color: '#F5F5F5', strokeColor: '#BDBDBD', strokeWidth: 2 },
      { type: 'rect', offsetX: 0, offsetY: 16, width: 48, height: 28, rotation: 0, color: '#F5F5F5', strokeColor: '#BDBDBD', strokeWidth: 2 },
      // Wavy bottom
      { type: 'circle', offsetX: -16, offsetY: 32, width: 16, height: 12, rotation: 0, color: '#F5F5F5' },
      { type: 'circle', offsetX: 0, offsetY: 35, width: 16, height: 12, rotation: 0, color: '#F5F5F5' },
      { type: 'circle', offsetX: 16, offsetY: 32, width: 16, height: 12, rotation: 0, color: '#F5F5F5' },
      // Big spooky eyes
      { type: 'circle', offsetX: -10, offsetY: -8, width: 18, height: 22, rotation: 0, color: '#212121' },
      { type: 'circle', offsetX: 10, offsetY: -8, width: 18, height: 22, rotation: 0, color: '#212121' },
      // Eye highlights
      { type: 'circle', offsetX: -8, offsetY: -12, width: 6, height: 6, rotation: 0, color: '#FFFFFF' },
      { type: 'circle', offsetX: 12, offsetY: -12, width: 6, height: 6, rotation: 0, color: '#FFFFFF' },
      // Small surprised mouth
      { type: 'circle', offsetX: 0, offsetY: 10, width: 12, height: 14, rotation: 0, color: '#424242' },
      // Blush
      { type: 'circle', offsetX: -20, offsetY: 0, width: 8, height: 6, rotation: 0, color: '#FFCDD2' },
      { type: 'circle', offsetX: 20, offsetY: 0, width: 8, height: 6, rotation: 0, color: '#FFCDD2' },
    ],
    vibrationPattern: 'vertical',
    vibrationSpeed: 4,
    vibrationAmplitude: 12,
    rarity: 'rare',
    coinValue: 25
  },
  // 9. Spiky - A red spiky ball
  {
    id: 'spiky',
    name: 'Spiky',
    baseScale: 0.8,
    shapes: [
      // Core body
      { type: 'circle', offsetX: 0, offsetY: 0, width: 40, height: 40, rotation: 0, color: '#EF5350', strokeColor: '#C62828', strokeWidth: 3 },
      // Spikes around
      { type: 'triangle', offsetX: 0, offsetY: -28, width: 12, height: 18, rotation: 0, color: '#C62828', strokeColor: '#B71C1C', strokeWidth: 1 },
      { type: 'triangle', offsetX: 20, offsetY: -20, width: 12, height: 16, rotation: 45, color: '#C62828', strokeColor: '#B71C1C', strokeWidth: 1 },
      { type: 'triangle', offsetX: 28, offsetY: 0, width: 12, height: 18, rotation: 90, color: '#C62828', strokeColor: '#B71C1C', strokeWidth: 1 },
      { type: 'triangle', offsetX: 20, offsetY: 20, width: 12, height: 16, rotation: 135, color: '#C62828', strokeColor: '#B71C1C', strokeWidth: 1 },
      { type: 'triangle', offsetX: 0, offsetY: 28, width: 12, height: 18, rotation: 180, color: '#C62828', strokeColor: '#B71C1C', strokeWidth: 1 },
      { type: 'triangle', offsetX: -20, offsetY: 20, width: 12, height: 16, rotation: 225, color: '#C62828', strokeColor: '#B71C1C', strokeWidth: 1 },
      { type: 'triangle', offsetX: -28, offsetY: 0, width: 12, height: 18, rotation: 270, color: '#C62828', strokeColor: '#B71C1C', strokeWidth: 1 },
      { type: 'triangle', offsetX: -20, offsetY: -20, width: 12, height: 16, rotation: 315, color: '#C62828', strokeColor: '#B71C1C', strokeWidth: 1 },
      // Angry eyes
      { type: 'circle', offsetX: -8, offsetY: -5, width: 12, height: 12, rotation: 0, color: '#FFFFFF', strokeColor: '#333', strokeWidth: 1 },
      { type: 'circle', offsetX: 8, offsetY: -5, width: 12, height: 12, rotation: 0, color: '#FFFFFF', strokeColor: '#333', strokeWidth: 1 },
      { type: 'circle', offsetX: -6, offsetY: -4, width: 5, height: 5, rotation: 0, color: '#000000' },
      { type: 'circle', offsetX: 10, offsetY: -4, width: 5, height: 5, rotation: 0, color: '#000000' },
      // Angry mouth
      { type: 'rect', offsetX: 0, offsetY: 8, width: 16, height: 5, rotation: 0, color: '#B71C1C' },
    ],
    vibrationPattern: 'circular',
    vibrationSpeed: 8,
    vibrationAmplitude: 8,
    rarity: 'common',
    coinValue: 10
  },
  // 10. Gloop - A toxic green slime
  {
    id: 'gloop',
    name: 'Gloop',
    baseScale: 1.15,
    shapes: [
      // Main slime body
      { type: 'circle', offsetX: 0, offsetY: 5, width: 55, height: 50, rotation: 0, color: '#8BC34A', strokeColor: '#558B2F', strokeWidth: 3 },
      // Dripping parts
      { type: 'circle', offsetX: -18, offsetY: 20, width: 14, height: 18, rotation: 0, color: '#8BC34A', strokeColor: '#558B2F', strokeWidth: 2 },
      { type: 'circle', offsetX: 20, offsetY: 22, width: 12, height: 20, rotation: 0, color: '#8BC34A', strokeColor: '#558B2F', strokeWidth: 2 },
      { type: 'circle', offsetX: 5, offsetY: 25, width: 10, height: 16, rotation: 0, color: '#9CCC65', strokeColor: '#558B2F', strokeWidth: 2 },
      // Sleepy half-closed eyes
      { type: 'rect', offsetX: -12, offsetY: -5, width: 16, height: 10, rotation: 0, color: '#FFFFFF', strokeColor: '#333', strokeWidth: 2 },
      { type: 'rect', offsetX: 12, offsetY: -5, width: 16, height: 10, rotation: 0, color: '#FFFFFF', strokeColor: '#333', strokeWidth: 2 },
      // Droopy eyelids
      { type: 'rect', offsetX: -12, offsetY: -8, width: 16, height: 6, rotation: 0, color: '#689F38' },
      { type: 'rect', offsetX: 12, offsetY: -8, width: 16, height: 6, rotation: 0, color: '#689F38' },
      // Pupils
      { type: 'circle', offsetX: -12, offsetY: -2, width: 6, height: 6, rotation: 0, color: '#000000' },
      { type: 'circle', offsetX: 12, offsetY: -2, width: 6, height: 6, rotation: 0, color: '#000000' },
      // Drooling mouth
      { type: 'rect', offsetX: 0, offsetY: 10, width: 18, height: 6, rotation: 0, color: '#558B2F' },
      { type: 'circle', offsetX: 8, offsetY: 16, width: 6, height: 10, rotation: 0, color: '#CDDC39' },
    ],
    vibrationPattern: 'pulse',
    vibrationSpeed: 3,
    vibrationAmplitude: 6,
    rarity: 'epic',
    coinValue: 50
  },
];

// Bomb special figure
export const BOMB_TEMPLATE: FigureTemplate = {
  id: 'bomb',
  name: 'Bomb',
  baseScale: 1.0,
  shapes: [
    { type: 'circle', offsetX: 0, offsetY: 0, width: 38, height: 38, rotation: 0, color: '#424242', strokeColor: '#212121', strokeWidth: 3 },
    { type: 'rect', offsetX: 0, offsetY: -22, width: 10, height: 14, rotation: 0, color: '#795548', strokeColor: '#5D4037', strokeWidth: 2 },
    { type: 'circle', offsetX: 0, offsetY: -32, width: 12, height: 12, rotation: 0, color: '#FF9800' },
    { type: 'circle', offsetX: 0, offsetY: -32, width: 8, height: 8, rotation: 0, color: '#FFEB3B' },
    { type: 'circle', offsetX: 0, offsetY: -32, width: 4, height: 4, rotation: 0, color: '#FFFFFF' },
    // Highlight
    { type: 'circle', offsetX: -8, offsetY: -8, width: 8, height: 8, rotation: 0, color: '#616161' },
  ],
  vibrationPattern: 'pulse',
  vibrationSpeed: 6,
  vibrationAmplitude: 3,
  rarity: 'common',
  coinValue: 0
};

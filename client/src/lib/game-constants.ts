// Game Constants for Kikteria - Bacteria Placement Game

export type GameState = 'MENU' | 'LEVEL_SELECT' | 'PLAYING' | 'PAUSED' | 'GAME_OVER' | 'SHOP' | 'WIN' | 'CELEBRATING' | 'CHRONICLES' | 'CODEX' | 'MUTATION_CHOICE' | 'ENDLESS_MODE' | 'ENDLESS_PLAYING';

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
  REFERENCE_WIDTH: 540,
  REFERENCE_HEIGHT: 720,
  MAX_CANVAS_WIDTH: 600,
  MAX_CANVAS_HEIGHT: 800,
  MIN_SCALE: 0.65,
  MAX_SCALE: 1.1,
  ASPECT_RATIO: 3 / 4,
  CANVAS_PADDING: 50,
  FIGURE_BASE_SIZE: 35,
  COLLISION_PADDING: 5,
  QUEUE_SIZE: 3,
  STARTING_BOMBS: 2,
  FIGURES_PER_ROUND: 15,
  GAME_TIME: 15,
  TIME_BONUS_PER_FIGURE: 1,
  BOMB_BLAST_RADIUS: 150,
  
  COLORS: {
    BACKGROUND: '#0E1C1F',
    GRID: '#1A3038',
    PREVIEW_AREA: '#123842',
    PLACED_BORDER: '#22F2A2',
    COLLISION_WARNING: '#FF4444',
  }
} as const;

export function getCanvasScaleFactor(canvasWidth: number, canvasHeight: number): number {
  const widthRatio = canvasWidth / GAME_CONFIG.REFERENCE_WIDTH;
  const heightRatio = canvasHeight / GAME_CONFIG.REFERENCE_HEIGHT;
  const rawScale = Math.min(widthRatio, heightRatio);
  return Math.max(GAME_CONFIG.MIN_SCALE, Math.min(GAME_CONFIG.MAX_SCALE, rawScale));
}

export function calculateCanvasDimensions(containerWidth: number, containerHeight: number): { width: number; height: number } {
  // First, fit within container while maintaining aspect ratio
  let width = containerWidth;
  let height = width / GAME_CONFIG.ASPECT_RATIO;
  
  // If height exceeds container, constrain by height instead
  if (height > containerHeight) {
    height = containerHeight;
    width = height * GAME_CONFIG.ASPECT_RATIO;
  }
  
  // Apply max constraints
  if (width > GAME_CONFIG.MAX_CANVAS_WIDTH) {
    width = GAME_CONFIG.MAX_CANVAS_WIDTH;
    height = width / GAME_CONFIG.ASPECT_RATIO;
  }
  if (height > GAME_CONFIG.MAX_CANVAS_HEIGHT) {
    height = GAME_CONFIG.MAX_CANVAS_HEIGHT;
    width = height * GAME_CONFIG.ASPECT_RATIO;
  }
  
  return { width: Math.floor(width), height: Math.floor(height) };
}

export function getScaledValue(baseValue: number, scaleFactor: number): number {
  return baseValue * scaleFactor;
}

export function getVibrationEnvelope(template: FigureTemplate, scale: number, canvasScale: number = 1): number {
  const baseAmplitude = template.vibrationAmplitude * canvasScale;
  const baseRadius = GAME_CONFIG.FIGURE_BASE_SIZE * scale * canvasScale;
  
  switch (template.vibrationPattern) {
    case 'diagonal':
      return baseAmplitude * 0.7 * Math.sqrt(2);
    case 'circular':
      return baseAmplitude;
    case 'pulse':
      return baseRadius * 0.1;
    case 'horizontal':
    case 'vertical':
    default:
      return baseAmplitude;
  }
}

export function computeEffectiveRadius(figure: FigureInstance, templates: FigureTemplate[], bombTemplate: FigureTemplate, canvasScale: number = 1): number {
  const template = figure.templateId === 'bomb' 
    ? bombTemplate 
    : templates.find(t => t.id === figure.templateId);
  
  if (!template) return GAME_CONFIG.FIGURE_BASE_SIZE * figure.scale * canvasScale;
  
  const baseRadius = GAME_CONFIG.FIGURE_BASE_SIZE * figure.scale * canvasScale;
  const envelope = getVibrationEnvelope(template, figure.scale, canvasScale);
  
  return baseRadius + envelope;
}

export interface LevelConfig {
  level: number;
  name: string;
  figuresCount: number;
  startTime: number;
  timeBonusPerFigure: number;
  speedMultiplier: number;
  sizeMultiplier: number;
  areaShrinkRate: number;
  isMilestone?: boolean;
  isBreather?: boolean;
}

const LEVEL_ARCS = [
  { start: 1, end: 10, theme: 'Petri Lab', names: ['Petri Dish', 'Lab Sample', 'Culture Growth', 'First Colony', 'Cell Division', 'Micro World', 'Quiet Growth', 'Bacteria Bloom', 'Specimen A', 'Lab Graduation'] },
  { start: 11, end: 20, theme: 'Containment', names: ['Containment', 'Sealed Chamber', 'Quarantine', 'Isolation Ward', 'Pressure Test', 'Locked Lab', 'Safe Zone', 'Protocol Alpha', 'Warning Signs', 'Containment Breach'] },
  { start: 21, end: 30, theme: 'Outbreak', names: ['First Outbreak', 'Spreading Fast', 'Chain Reaction', 'Emergency', 'Red Alert', 'Critical Mass', 'Calm Storm', 'Viral Load', 'Infection Peak', 'Ground Zero'] },
  { start: 31, end: 40, theme: 'Mutation', names: ['Mutation X', 'Genetic Drift', 'Evolution', 'Adaptation', 'New Strain', 'Resistance', 'Recovery Phase', 'Mutant Colony', 'DNA Shift', 'Mutation Master'] },
  { start: 41, end: 50, theme: 'Epidemic', names: ['Epidemic Dawn', 'Wave Two', 'Hospital Chaos', 'Survival Mode', 'Last Stand', 'Hope Fading', 'Second Wind', 'Desperate Measures', 'Critical Hour', 'Epidemic End'] },
  { start: 51, end: 60, theme: 'Global Crisis', names: ['Global Spread', 'Borders Fall', 'World Alert', 'International', 'Crisis Summit', 'United Front', 'Brief Respite', 'Counter Attack', 'Turning Point', 'Crisis Control'] },
  { start: 61, end: 70, theme: 'Resistance', names: ['Resistance Forms', 'Immune Response', 'Fighting Back', 'Antibody War', 'Defense Line', 'Strong Hold', 'Battle Rest', 'Offensive Push', 'Victory Near', 'Resistance Victory'] },
  { start: 71, end: 80, theme: 'Eradication', names: ['Eradication Start', 'Cleansing Wave', 'Purification', 'Sterilization', 'Clean Sweep', 'Final Push', 'Calm Before', 'Last Bacteria', 'Almost Done', 'Eradication Complete'] },
  { start: 81, end: 90, theme: 'Aftermath', names: ['Aftermath', 'Recovery', 'Rebuilding', 'New Normal', 'Lessons Learned', 'Prevention', 'Rest & Heal', 'Vigilance', 'Forever Changed', 'Aftermath Master'] },
  { start: 91, end: 100, theme: 'Apex', names: ['Apex Challenge', 'Ultimate Test', 'Grand Master', 'Legend Trial', 'Impossible Odds', 'Perfect Storm', 'Final Rest', 'Championship', 'Hall of Fame', 'Extinction Event'] },
];

const MILESTONE_LEVELS = [10, 25, 50, 75, 100];
const BREATHER_LEVELS = [7, 17, 27, 37, 47, 57, 67, 77, 87, 97];

function generateLevelConfig(level: number): LevelConfig {
  const isMilestone = MILESTONE_LEVELS.includes(level);
  const isBreather = BREATHER_LEVELS.includes(level);
  
  const arc = LEVEL_ARCS.find(a => level >= a.start && level <= a.end);
  const nameIndex = arc ? level - arc.start : 0;
  const name = arc?.names[nameIndex] || `Level ${level}`;
  
  let figuresCount = Math.round(8 + 30 * (1 - Math.exp(-0.045 * (level - 1))));
  let startTime = Math.max(10, Math.min(22, 22 - 0.12 * level));
  let speedMultiplier = 1 + 1.9 * (1 - Math.exp(-0.05 * level));
  let sizeMultiplier = 0.9 + 0.55 * Math.min(1, Math.pow(level / 90, 1.4));
  let areaShrinkRate = level <= 10 ? 0 : Math.pow(Math.max(0, 0.2 * (level - 10)), 0.75) / 2;
  
  let timeBonusPerFigure: number;
  if (level <= 10) timeBonusPerFigure = 2;
  else if (level <= 25) timeBonusPerFigure = 1.5;
  else if (level <= 50) timeBonusPerFigure = 1;
  else if (level <= 75) timeBonusPerFigure = 0.7;
  else timeBonusPerFigure = 0.5;
  
  if (isBreather) {
    figuresCount = Math.max(8, Math.round(figuresCount * 0.85));
    startTime = Math.min(22, startTime * 1.15);
    speedMultiplier = Math.max(1, speedMultiplier * 0.9);
    timeBonusPerFigure = Math.min(2, timeBonusPerFigure * 1.2);
  }
  
  if (isMilestone) {
    figuresCount = Math.round(figuresCount * 1.15);
    speedMultiplier = speedMultiplier * 1.1;
    startTime = Math.max(10, startTime * 0.95);
  }
  
  speedMultiplier = Math.min(2.9, speedMultiplier);
  sizeMultiplier = Math.min(1.45, sizeMultiplier);
  areaShrinkRate = Math.min(3.5, areaShrinkRate);
  figuresCount = Math.min(40, figuresCount);
  
  return {
    level,
    name,
    figuresCount: Math.round(figuresCount),
    startTime: Math.round(startTime * 10) / 10,
    timeBonusPerFigure: Math.round(timeBonusPerFigure * 10) / 10,
    speedMultiplier: Math.round(speedMultiplier * 100) / 100,
    sizeMultiplier: Math.round(sizeMultiplier * 100) / 100,
    areaShrinkRate: Math.round(areaShrinkRate * 100) / 100,
    isMilestone,
    isBreather,
  };
}

export const LEVELS: LevelConfig[] = Array.from({ length: 100 }, (_, i) => generateLevelConfig(i + 1));

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
    coinValue: 12
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
    coinValue: 25
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
    coinValue: 28
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
    coinValue: 55
  },
];

// Bacteria Dossiers - Encyclopedia entries for each bacteria
export interface BacteriaDossier {
  id: string;
  name: string;
  classification: string;
  personality: string;
  backstory: string;
  quirk: string;
  rival: string;
  favoriteActivity: string;
  dangerLevel: 1 | 2 | 3 | 4 | 5;
}

export const BACTERIA_DOSSIERS: BacteriaDossier[] = [
  {
    id: 'blobby',
    name: 'Blobby',
    classification: 'Amorphous Gigglicus',
    personality: 'Cheerful, unpredictable, easily amused',
    backstory: 'Blobby was the first Kikteria discovered in Petri Dish Alpha. Despite being the "patient zero" of the outbreak, Blobby seems blissfully unaware of the chaos it causes. Scientists suspect its constant pulsing is actually... laughter.',
    quirk: 'Blushes bright pink when other bacteria get too close',
    rival: 'Grumpus (who finds Blobby insufferably cheerful)',
    favoriteActivity: 'Wobbling to imaginary music',
    dangerLevel: 2
  },
  {
    id: 'grumpus',
    name: 'Grumpus',
    classification: 'Cubus Irritabilis',
    personality: 'Perpetually annoyed, territorial, stompy',
    backstory: 'Grumpus evolved its square shape as a form of protest against "all those round, squishy idiots." It vibrates horizontally because it\'s constantly shaking with rage. Lab reports indicate it has never smiled. Not once.',
    quirk: 'Its angry eyebrows twitch more when someone mentions Blobby',
    rival: 'Blobby (too happy) and Derp (too stupid)',
    favoriteActivity: 'Glaring at things',
    dangerLevel: 3
  },
  {
    id: 'wobbly',
    name: 'Wobbly',
    classification: 'Teardropus Anxieticus',
    personality: 'Nervous, sweaty, perpetually worried',
    backstory: 'Wobbly developed its teardrop shape from crying too much. It worries about everything - collisions, the timer, whether the other bacteria like it. The sweat drop is permanent. Therapy has been... ineffective.',
    quirk: 'Vibrates faster when the timer gets low',
    rival: 'Nobody (too scared to have rivals)',
    favoriteActivity: 'Panicking about hypothetical scenarios',
    dangerLevel: 2
  },
  {
    id: 'cyclops',
    name: 'Cyclops',
    classification: 'Monoculus Hornicus',
    personality: 'Watchful, smug, intimidating',
    backstory: 'Cyclops traded its second eye for horns in a deal that "seemed like a good idea at the time." It spends most of its time rotating slowly, maintaining eye contact with everyone simultaneously. Unsettling.',
    quirk: 'That one giant eye never blinks. NEVER.',
    rival: 'Ghosty (who keeps disappearing when Cyclops tries to stare)',
    favoriteActivity: 'Intense, unblinking observation',
    dangerLevel: 4
  },
  {
    id: 'squish',
    name: 'Squish',
    classification: 'Flatulus Elasticus',
    personality: 'Laid-back, stretchy, goes with the flow',
    backstory: 'Squish got stepped on once and just... never recovered its original shape. But it\'s cool with that. Everything is cool with Squish. Too cool. Scientists worry it might be in denial about its trauma.',
    quirk: 'Sometimes stretches so thin it nearly phases through containment',
    rival: 'Spiky (polar opposites in texture philosophy)',
    favoriteActivity: 'Being horizontal',
    dangerLevel: 2
  },
  {
    id: 'chompy',
    name: 'Chompy',
    classification: 'Bittus Everythingus',
    personality: 'Hungry, bitey, no concept of personal space',
    backstory: 'Chompy bit through its first containment unit on Day 2. Then Day 3. Then every day after. Its massive teeth are actually surprisingly gentle - it just likes the FEELING of biting things. Still terrifying.',
    quirk: 'Makes "nom nom" motions even when nothing is nearby',
    rival: 'The containment walls (they know what they did)',
    favoriteActivity: 'Chewing on abstract concepts',
    dangerLevel: 4
  },
  {
    id: 'derp',
    name: 'Derp',
    classification: 'Confusicus Maximus',
    personality: 'Bewildered, spacey, accidentally destructive',
    backstory: 'Nobody knows how Derp escaped Lab 7. Derp doesn\'t know either. Derp doesn\'t know much of anything. Those crossed eyes aren\'t a medical condition - Derp is just trying REALLY hard to think. Results pending.',
    quirk: 'Frequently bumps into walls while looking at nothing',
    rival: 'Grumpus (who hates how oblivious Derp is to insults)',
    favoriteActivity: 'Forgetting what it was doing',
    dangerLevel: 3
  },
  {
    id: 'ghosty',
    name: 'Ghosty',
    classification: 'Transparentus Spookicus',
    personality: 'Mysterious, ethereal, dramatic',
    backstory: 'Ghosty isn\'t actually dead - it just has a flair for the theatrical. The translucent body is a genetic quirk it leans into HEAVILY. Insists on being called "The Specter" but nobody respects that.',
    quirk: 'Dramatically fades in and out for no reason',
    rival: 'Cyclops (hates being watched)',
    favoriteActivity: 'Appearing suddenly to startle the other bacteria',
    dangerLevel: 3
  },
  {
    id: 'spiky',
    name: 'Spiky',
    classification: 'Pointus Extremus',
    personality: 'Defensive, prickly (literally and emotionally)',
    backstory: 'Spiky grew all those spines for protection, but now nobody wants to get close to it. This has made Spiky more defensive, which grew more spines. It\'s a vicious cycle. Literally.',
    quirk: 'New tiny spikes appear when it feels threatened',
    rival: 'Squish (infuriatingly soft and approachable)',
    favoriteActivity: 'Keeping everyone at arm\'s length (spike\'s length?)',
    dangerLevel: 4
  },
  {
    id: 'gloop',
    name: 'Gloop',
    classification: 'Slimeus Droolicius',
    personality: 'Sleepy, drooly, surprisingly wise',
    backstory: 'Gloop is the oldest Kikteria in the facility. It\'s seen things. It knows things. It also drools constantly and falls asleep mid-sentence. Those half-closed eyes have witnessed the rise and fall of empires. Probably.',
    quirk: 'The drool is actually a defense mechanism (gross but effective)',
    rival: 'Nobody (too respected/feared by the others)',
    favoriteActivity: 'Ancient meditation techniques (or just napping)',
    dangerLevel: 5
  }
];

// Lab Chronicles - Story content from Chief Microbiologist Lyra Voss
export interface LabChronicle {
  level: number;
  title: string;
  date: string;
  content: string;
  signature: string;
}

export const LAB_CHRONICLES: LabChronicle[] = [
  {
    level: 1,
    title: "First Contact",
    date: "Day 1 - 0800 hours",
    content: "We've discovered something unprecedented. The organisms in Petri Dish Alpha are unlike anything in our databases. They vibrate constantly, as if dancing to music we cannot hear. Initial containment protocols engaged. I've nicknamed them 'Kikteria' - they seem to kick and squirm with personality. Each one appears unique. Must ensure they never touch - preliminary tests show... explosive reactions when they make contact.",
    signature: "Dr. Lyra Voss, Chief Microbiologist"
  },
  {
    level: 2,
    title: "Growing Concerns",
    date: "Day 3 - 1430 hours",
    content: "The lab samples are multiplying faster than anticipated. We've identified distinct personality types among the Kikteria. 'Blobby' is docile but unpredictable. 'Grumpus' seems perpetually agitated. They're more than microbes - they have faces, expressions, perhaps even emotions? The containment team is stretched thin. Every placement matters now. One wrong move and the chain reaction could compromise the entire facility.",
    signature: "Dr. Lyra Voss, Chief Microbiologist"
  },
  {
    level: 3,
    title: "Culture Shock",
    date: "Day 7 - 0600 hours",
    content: "The culture is growing beyond our control. New variants keep emerging - 'Wobbly' leaves trails of anxiety wherever it moves. 'Cyclops' watches everything with that single, unblinking eye. We've developed tactical bombs to clear overcrowded zones, but they're a last resort. The specimens seem to WANT to touch each other. Is it aggression? Loneliness? I haven't slept in 36 hours. The vibrations haunt my dreams.",
    signature: "Dr. Lyra Voss, Chief Microbiologist"
  },
  {
    level: 4,
    title: "Outbreak",
    date: "Day 12 - 2200 hours",
    content: "Containment breach in Sector 7. It's official - we have an outbreak. 'Spikeball' and 'Fuzzy' escaped their chambers and caused a cascade failure. Three labs quarantined. The Kikteria are faster now, more aggressive in their movements. We've deployed shields to absorb accidental collisions. Second chance protocols activated. Director Chen is demanding results. If we can't contain this... I don't want to think about the alternative.",
    signature: "Dr. Lyra Voss, Chief Microbiologist"
  },
  {
    level: 5,
    title: "Pandemic Protocol",
    date: "Day 18 - 0315 hours",
    content: "Pandemic-level protocols now in effect. The Kikteria have spread to every wing of the facility. 'Zappy' keeps short-circuiting our monitoring equipment with its electrical discharges. 'Chomper' actually BIT through a containment seal. They're evolving, adapting. But so are we. The team has developed new countermeasures. Precision. Speed. Anticipation. Every successful containment buys us time. We WILL survive this.",
    signature: "Dr. Lyra Voss, Chief Microbiologist"
  },
  {
    level: 6,
    title: "Biohazard",
    date: "Day 25 - 1100 hours",
    content: "Biohazard level MAXIMUM. We've lost contact with the eastern wing. 'Stinky' released toxic spores that corroded an entire airlock. 'Goopy' merged with the ventilation system. Only a handful of us remain operational. But there's hope - I've noticed patterns in their behavior. They're not mindless. They're playing a GAME. And if this is a game... we can win. Deploy everything. Shields. Bombs. Every second chance we've got.",
    signature: "Dr. Lyra Voss, Chief Microbiologist"
  },
  {
    level: 7,
    title: "Extinction Event",
    date: "Day 31 - Final Entry",
    content: "This is it. The final containment zone. Everything comes down to this moment. All ten Kikteria strains are present - Blobby, Grumpus, Wobbly, Cyclops, Spikeball, Fuzzy, Zappy, Chomper, Stinky, and Goopy. They're all here, dancing their chaotic dance. If we fail, it's extinction - for us, for them, for everything. But I believe in you, Containment Specialist. You've made it this far. Place them carefully. Keep them apart. Save us all. END TRANSMISSION.",
    signature: "Dr. Lyra Voss, Chief Microbiologist - SIGNING OFF"
  }
];

// K.I.K. Announcer AI - Adaptive commentary system
export interface AnnouncerMessage {
  trigger: string;
  messages: string[];
}

export const KIK_ANNOUNCER: Record<string, string[]> = {
  // Placement feedback
  goodPlacement: [
    "Nice placement!",
    "Precision work!",
    "That's the spot!",
    "Clean placement.",
    "Well calculated!",
    "Containment specialist!",
  ],
  closeCall: [
    "That was close!",
    "Cutting it tight!",
    "Risky move...",
    "Living dangerously!",
    "Barely fit!",
    "Squeezed it in!",
  ],
  perfectStreak: [
    "You're on fire!",
    "Unstoppable!",
    "Perfect streak!",
    "Flawless execution!",
    "Can't touch this!",
  ],
  
  // Time-based
  lowTime: [
    "Time's running out!",
    "Hurry!",
    "Clock is ticking!",
    "No time to waste!",
    "Speed up!",
  ],
  bonusTime: [
    "+TIME!",
    "Bought some time!",
    "Timer extended!",
  ],
  
  // Bomb usage
  bombUsed: [
    "BOOM! Area cleared!",
    "Explosive solution!",
    "Tactical detonation!",
    "That's one way to do it!",
    "Cleanup crew!",
  ],
  bombWasted: [
    "Empty zone...",
    "Wasted bomb!",
    "Nothing to clear!",
  ],
  
  // Shield activation
  shieldSave: [
    "Shield absorbed it!",
    "Protected!",
    "Lucky save!",
    "Shield deployed!",
    "Crisis averted!",
  ],
  
  // Second chance
  secondChanceUsed: [
    "Second chance!",
    "Try again!",
    "One more shot!",
    "Back in action!",
    "Undo successful!",
  ],
  
  // Progress milestones
  halfwayDone: [
    "Halfway there!",
    "Keep it up!",
    "50% contained!",
    "Going strong!",
  ],
  almostDone: [
    "Almost there!",
    "Just a few more!",
    "Final stretch!",
    "You've got this!",
  ],
  lastOne: [
    "LAST ONE!",
    "Final placement!",
    "Don't mess up now!",
    "This is it!",
  ],
  
  // Level start
  levelStart: [
    "Containment initiated.",
    "Let's do this!",
    "Good luck!",
    "Focus...",
    "Ready? GO!",
  ],
  
  // Collision warnings
  collisionClose: [
    "Watch out!",
    "Too close!",
    "Careful!",
    "Danger zone!",
  ],
  
  // Game over reactions
  gameOverCollision: [
    "They touched!",
    "Containment breach!",
    "Critical failure!",
  ],
  gameOverTime: [
    "Time's up!",
    "Too slow!",
    "Out of time!",
  ],
  
  // Victory
  victory: [
    "Level contained!",
    "Mission complete!",
    "Excellent work!",
    "Flawless!",
  ],
  victoryPerfect: [
    "PERFECT RUN!",
    "Absolutely flawless!",
    "Masterful!",
    "Outstanding!",
  ],
  
  // Encouragement after failure
  encouragement: [
    "You'll get it!",
    "Try again!",
    "Don't give up!",
    "Almost had it!",
  ],
};

export function getRandomKIKMessage(category: keyof typeof KIK_ANNOUNCER): string {
  const messages = KIK_ANNOUNCER[category];
  if (!messages || messages.length === 0) return '';
  return messages[Math.floor(Math.random() * messages.length)];
}

// Mutation Events System
export interface MutationEvent {
  id: string;
  name: string;
  description: string;
  effect: 'vibration_increase' | 'size_increase' | 'speed_increase' | 'random_movement';
  severity: 1 | 2 | 3;
  countermeasures: MutationCountermeasure[];
}

export interface MutationCountermeasure {
  id: string;
  name: string;
  description: string;
  cost: number; // time cost in seconds
  effect: 'nullify' | 'reduce' | 'reverse';
}

export const MUTATION_EVENTS: MutationEvent[] = [
  {
    id: 'hyperactive',
    name: 'Hyperactive Strain',
    description: 'Bacteria vibrations intensify dramatically!',
    effect: 'vibration_increase',
    severity: 2,
    countermeasures: [
      { id: 'stabilizer', name: 'Stabilizer Injection', description: 'Nullify the mutation completely', cost: 5, effect: 'nullify' },
      { id: 'dampener', name: 'Vibration Dampener', description: 'Reduce effect by 50%', cost: 2, effect: 'reduce' },
    ]
  },
  {
    id: 'gigantism',
    name: 'Gigantism Outbreak',
    description: 'All bacteria grow 30% larger!',
    effect: 'size_increase',
    severity: 2,
    countermeasures: [
      { id: 'shrink_ray', name: 'Emergency Shrink Ray', description: 'Reverse: bacteria shrink 20%', cost: 4, effect: 'reverse' },
      { id: 'containment', name: 'Containment Protocol', description: 'Reduce effect by 50%', cost: 2, effect: 'reduce' },
    ]
  },
  {
    id: 'accelerated',
    name: 'Accelerated Metabolism',
    description: 'Bacteria move faster and more erratically!',
    effect: 'speed_increase',
    severity: 3,
    countermeasures: [
      { id: 'cryo_burst', name: 'Cryo Burst', description: 'Slow all bacteria temporarily', cost: 6, effect: 'reverse' },
      { id: 'sedative', name: 'Mass Sedative', description: 'Nullify the mutation', cost: 4, effect: 'nullify' },
    ]
  },
  {
    id: 'drift',
    name: 'Spatial Drift',
    description: 'Bacteria slowly drift in random directions!',
    effect: 'random_movement',
    severity: 1,
    countermeasures: [
      { id: 'anchor', name: 'Molecular Anchor', description: 'Lock bacteria in place', cost: 3, effect: 'nullify' },
      { id: 'ignore', name: 'Risk It', description: 'Accept the challenge', cost: 0, effect: 'reduce' },
    ]
  },
];

// Level Mastery Goals
export interface MasteryGoal {
  id: string;
  name: string;
  description: string;
  icon: string;
  check: (stats: LevelCompletionStats) => boolean;
}

export interface LevelCompletionStats {
  bombsUsed: number;
  shieldsUsed: number;
  secondChancesUsed: number;
  timeRemaining: number;
  totalTime: number;
  perfectPlacements: number;
  totalPlacements: number;
}

export const MASTERY_GOALS: MasteryGoal[] = [
  {
    id: 'no_bombs',
    name: 'Pacifist',
    description: 'Complete without using any bombs',
    icon: '🕊️',
    check: (stats) => stats.bombsUsed === 0
  },
  {
    id: 'speed_run',
    name: 'Speed Demon',
    description: 'Complete with 50%+ time remaining',
    icon: '⚡',
    check: (stats) => stats.timeRemaining >= stats.totalTime * 0.5
  },
  {
    id: 'no_items',
    name: 'Purist',
    description: 'Complete without shields or second chances',
    icon: '🎯',
    check: (stats) => stats.shieldsUsed === 0 && stats.secondChancesUsed === 0
  },
  {
    id: 'perfect_streak',
    name: 'Perfectionist',
    description: 'Never trigger a close call warning',
    icon: '💎',
    check: (stats) => stats.perfectPlacements === stats.totalPlacements
  },
];

// Endless Mode Boss Bacteria
export interface BossBacteria {
  id: string;
  name: string;
  title: string;
  health: number;
  specialAbility: string;
  warningMessage: string;
}

export const BOSS_BACTERIA: BossBacteria[] = [
  {
    id: 'megablob',
    name: 'MEGABLOB',
    title: 'The Devourer',
    health: 3,
    specialAbility: 'Absorbs nearby bacteria on contact',
    warningMessage: 'WARNING: MEGABLOB DETECTED!'
  },
  {
    id: 'splitter',
    name: 'MITOSIS',
    title: 'The Divider',
    health: 2,
    specialAbility: 'Splits into two smaller bacteria when damaged',
    warningMessage: 'ALERT: MITOSIS INCOMING!'
  },
  {
    id: 'phantom',
    name: 'PHANTOM',
    title: 'The Invisible',
    health: 1,
    specialAbility: 'Phases in and out of visibility',
    warningMessage: 'CAUTION: PHANTOM MATERIALIZING!'
  },
];

// New Skill Consumables
export interface SkillConsumable {
  id: string;
  name: string;
  description: string;
  cost: number;
  icon: string;
  duration?: number;
}

export const SKILL_CONSUMABLES: SkillConsumable[] = [
  {
    id: 'freeze',
    name: 'Precision Freeze',
    description: 'Freeze all bacteria vibrations for 5 seconds',
    cost: 400,
    icon: '❄️',
    duration: 5000
  },
  {
    id: 'cleanser',
    name: 'Drag-Lasso Cleanser',
    description: 'Draw a circle to remove all bacteria inside',
    cost: 500,
    icon: '🔮',
  },
];

// ==========================================
// ENGAGEMENT & RETENTION SYSTEMS
// ==========================================

// Daily Lab Order Templates
export interface DailyOrderTemplate {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  targetScore: number;
  coinReward: number;
  modifiers?: {
    speedMultiplier?: number;
    sizeMultiplier?: number;
    timeLimit?: number;
    restrictedBacteria?: string[];
  };
}

export const DAILY_ORDER_TEMPLATES: DailyOrderTemplate[] = [
  {
    id: 'speed_run',
    title: 'Speed Containment',
    description: 'Complete a round in record time! Faster placements earn more points.',
    difficulty: 'medium',
    targetScore: 150,
    coinReward: 200,
    modifiers: { timeLimit: 30, speedMultiplier: 1.5 }
  },
  {
    id: 'big_bacteria',
    title: 'Giant Outbreak',
    description: 'Handle oversized bacteria in this challenging containment scenario.',
    difficulty: 'hard',
    targetScore: 200,
    coinReward: 350,
    modifiers: { sizeMultiplier: 1.4 }
  },
  {
    id: 'calm_waters',
    title: 'Calm Lab Day',
    description: 'A relaxed day in the lab. Slower vibrations make placement easier.',
    difficulty: 'easy',
    targetScore: 100,
    coinReward: 100,
    modifiers: { speedMultiplier: 0.7 }
  },
  {
    id: 'blobby_only',
    title: 'Blobby Invasion',
    description: 'Only Blobby bacteria today! Master their unique patterns.',
    difficulty: 'easy',
    targetScore: 120,
    coinReward: 150,
    modifiers: { restrictedBacteria: ['blobby'] }
  },
  {
    id: 'mixed_chaos',
    title: 'Lab Chaos',
    description: 'Maximum variety, maximum challenge. Every bacteria type is active!',
    difficulty: 'hard',
    targetScore: 250,
    coinReward: 400,
    modifiers: { speedMultiplier: 1.2, sizeMultiplier: 1.1 }
  },
  {
    id: 'precision_test',
    title: 'Precision Protocol',
    description: 'Tight spaces require perfect placement. No room for error.',
    difficulty: 'medium',
    targetScore: 180,
    coinReward: 250,
    modifiers: { sizeMultiplier: 1.25 }
  },
  {
    id: 'time_crunch',
    title: 'Emergency Response',
    description: 'Limited time! Move fast or fail the containment protocol.',
    difficulty: 'hard',
    targetScore: 180,
    coinReward: 300,
    modifiers: { timeLimit: 20, speedMultiplier: 1.3 }
  }
];

// Weekly Community Goal Templates
export interface WeeklyGoalTemplate {
  id: string;
  title: string;
  description: string;
  goalType: 'total_placements' | 'total_score' | 'levels_completed' | 'daily_orders_completed';
  targetValue: number;
  rewardType: 'coins' | 'cosmetic' | 'badge';
  rewardData: {
    amount?: number;
    cosmeticId?: string;
    cosmeticName?: string;
    badgeId?: string;
  };
}

export const WEEKLY_GOAL_TEMPLATES: WeeklyGoalTemplate[] = [
  {
    id: 'mass_containment',
    title: 'Mass Containment Protocol',
    description: 'Community Goal: Place 50,000 bacteria together!',
    goalType: 'total_placements',
    targetValue: 50000,
    rewardType: 'coins',
    rewardData: { amount: 500 }
  },
  {
    id: 'score_mountain',
    title: 'Score Summit',
    description: 'Community Goal: Reach 1,000,000 combined score!',
    goalType: 'total_score',
    targetValue: 1000000,
    rewardType: 'cosmetic',
    rewardData: { cosmeticId: 'neon_glow', cosmeticName: 'Neon Glow Effect' }
  },
  {
    id: 'level_masters',
    title: 'Level Conquest',
    description: 'Community Goal: Complete 10,000 levels together!',
    goalType: 'levels_completed',
    targetValue: 10000,
    rewardType: 'badge',
    rewardData: { badgeId: 'community_champion' }
  },
  {
    id: 'daily_dedication',
    title: 'Daily Dedication',
    description: 'Community Goal: Complete 5,000 daily orders this week!',
    goalType: 'daily_orders_completed',
    targetValue: 5000,
    rewardType: 'coins',
    rewardData: { amount: 750 }
  }
];

// Achievement Definitions
export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  category: 'mastery' | 'collection' | 'social' | 'challenge';
  tier: 1 | 2 | 3; // bronze, silver, gold
  requirement: number;
  coinReward: number;
  badgeIcon: string;
  trackingKey: string; // what stat to track
}

export const ACHIEVEMENTS: AchievementDef[] = [
  // Mastery - Placement skills
  { id: 'first_placement', name: 'First Contact', description: 'Place your first bacteria', category: 'mastery', tier: 1, requirement: 1, coinReward: 10, badgeIcon: '🦠', trackingKey: 'totalPlacements' },
  { id: 'placements_100', name: 'Lab Technician', description: 'Place 100 bacteria', category: 'mastery', tier: 1, requirement: 100, coinReward: 50, badgeIcon: '🔬', trackingKey: 'totalPlacements' },
  { id: 'placements_500', name: 'Senior Researcher', description: 'Place 500 bacteria', category: 'mastery', tier: 2, requirement: 500, coinReward: 150, badgeIcon: '👨‍🔬', trackingKey: 'totalPlacements' },
  { id: 'placements_2000', name: 'Chief Scientist', description: 'Place 2000 bacteria', category: 'mastery', tier: 3, requirement: 2000, coinReward: 500, badgeIcon: '🧬', trackingKey: 'totalPlacements' },
  
  // Collection - Score achievements
  { id: 'score_1000', name: 'Coin Collector', description: 'Earn 1,000 total coins', category: 'collection', tier: 1, requirement: 1000, coinReward: 100, badgeIcon: '💰', trackingKey: 'totalCoinsEarned' },
  { id: 'score_5000', name: 'Treasure Hunter', description: 'Earn 5,000 total coins', category: 'collection', tier: 2, requirement: 5000, coinReward: 300, badgeIcon: '💎', trackingKey: 'totalCoinsEarned' },
  { id: 'score_20000', name: 'Wealthy Scientist', description: 'Earn 20,000 total coins', category: 'collection', tier: 3, requirement: 20000, coinReward: 1000, badgeIcon: '👑', trackingKey: 'totalCoinsEarned' },
  
  // Challenge - Level completion
  { id: 'level_1', name: 'Getting Started', description: 'Complete Level 1', category: 'challenge', tier: 1, requirement: 1, coinReward: 25, badgeIcon: '⭐', trackingKey: 'highestLevel' },
  { id: 'level_3', name: 'Making Progress', description: 'Complete Level 3', category: 'challenge', tier: 1, requirement: 3, coinReward: 75, badgeIcon: '🌟', trackingKey: 'highestLevel' },
  { id: 'level_5', name: 'Lab Veteran', description: 'Complete Level 5', category: 'challenge', tier: 2, requirement: 5, coinReward: 200, badgeIcon: '✨', trackingKey: 'highestLevel' },
  { id: 'level_7', name: 'Master Containment', description: 'Complete all 7 levels', category: 'challenge', tier: 3, requirement: 7, coinReward: 500, badgeIcon: '🏆', trackingKey: 'highestLevel' },
  
  // Social - Daily & Community
  { id: 'daily_1', name: 'First Order', description: 'Complete your first daily order', category: 'social', tier: 1, requirement: 1, coinReward: 50, badgeIcon: '📋', trackingKey: 'dailyOrdersCompleted' },
  { id: 'daily_7', name: 'Weekly Regular', description: 'Complete 7 daily orders', category: 'social', tier: 2, requirement: 7, coinReward: 200, badgeIcon: '📅', trackingKey: 'dailyOrdersCompleted' },
  { id: 'daily_30', name: 'Dedicated Scientist', description: 'Complete 30 daily orders', category: 'social', tier: 3, requirement: 30, coinReward: 750, badgeIcon: '🎖️', trackingKey: 'dailyOrdersCompleted' },
  
  // Challenge - Special
  { id: 'endless_10', name: 'Survivor', description: 'Reach wave 10 in Endless Mode', category: 'challenge', tier: 2, requirement: 10, coinReward: 300, badgeIcon: '♾️', trackingKey: 'endlessBestWave' },
  { id: 'endless_25', name: 'Containment Expert', description: 'Reach wave 25 in Endless Mode', category: 'challenge', tier: 3, requirement: 25, coinReward: 1000, badgeIcon: '🔥', trackingKey: 'endlessBestWave' },
  { id: 'bomb_master', name: 'Demolition Expert', description: 'Use 50 bombs', category: 'challenge', tier: 2, requirement: 50, coinReward: 200, badgeIcon: '💣', trackingKey: 'bombsUsed' },
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

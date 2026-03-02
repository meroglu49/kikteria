import { create } from 'zustand';
import { GameState, FigureInstance, BACTERIA_TEMPLATES, BOMB_TEMPLATE, GAME_CONFIG, LEVELS, LevelConfig, computeEffectiveRadius, KIK_ANNOUNCER, MutationEvent, MUTATION_EVENTS, LevelCompletionStats, MASTERY_GOALS } from './game-constants';
import { playPlacementSound, playSuccessSound, playGameOverSound } from './sounds';
import { offlineStorage } from './offline-storage';
import { engagementService } from './engagement-service';

interface LevelProgressData {
  levelNumber: number;
  bestScore: number;
  isCompleted: boolean;
}

interface GameStore {
  gameState: GameState;
  score: number;
  highScore: number;
  coins: number;
  
  // Level system
  currentLevel: number;
  currentLevelConfig: LevelConfig;
  selectedLevel: number;
  
  // Level progress (unlocked levels and best scores)
  levelProgress: LevelProgressData[];
  maxUnlockedLevel: number;
  
  // Figure placement state
  placedFigures: FigureInstance[];
  figureQueue: string[];
  currentFigureId: string | null;
  bombsRemaining: number;
  figuresPlaced: number;
  totalFigures: number;
  
  // Timer
  timeRemaining: number;
  timerInterval: number | null;
  
  // Upgrades
  upgrades: {
    bombCount: number;
    figureSize: number;
    queueSize: number;
    timeBonus: number;
    placementBonus: number;
    slowMo: number;
    shield: number;
    coinBoost: number;
    lucky: number;
    secondChance: number;
  };
  
  // Second Chance tracking
  secondChanceUsed: boolean;
  lastPlacedFigure: FigureInstance | null;
  
  // Shield (collision forgiveness) tracking
  shieldUsed: boolean;
  shieldCooldownUntil: number;
  
  notification: string | null;
  
  // K.I.K. Announcer
  kikMessage: string | null;
  consecutivePlacements: number;
  
  // Bomb targeting mode
  bombTargetingMode: boolean;
  
  // Mutation Events
  activeMutation: MutationEvent | null;
  mutationModifiers: {
    vibrationMultiplier: number;
    sizeMultiplier: number;
    speedMultiplier: number;
    driftEnabled: boolean;
  };
  
  // Mastery Tracking
  levelStats: LevelCompletionStats;
  closeCallCount: number;
  
  // Endless Mode
  isEndlessMode: boolean;
  endlessWave: number;
  endlessScore: number;
  endlessHighScore: number;
  endlessBestWave: number;
  
  // New Skill Consumables
  freezeCount: number;
  cleanserCount: number;
  isFrozen: boolean;
  isLassoMode: boolean;
  lassoPoints: { x: number; y: number }[];
  
  // Canvas scaling for responsive sizing
  canvasScale: number;
  
  // Actions
  setGameState: (state: GameState) => void;
  setCanvasScale: (scale: number) => void;
  toggleBombTargeting: () => void;
  detonateBombAt: (x: number, y: number) => { cleared: number; success: boolean };
  addScore: (amount: number) => void;
  resetGame: () => void;
  collectCoin: (amount: number) => void;
  buyUpgrade: (type: keyof typeof UPGRADE_COSTS) => boolean;
  useShield: () => boolean;
  useSecondChance: () => boolean;
  setNotification: (msg: string | null) => void;
  setKikMessage: (msg: string | null) => void;
  triggerKikAnnouncement: (category: string) => void;
  
  // Timer actions
  startTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => void;
  tickTimer: () => void;
  
  // Level actions
  setLevel: (level: number) => void;
  selectLevel: (level: number) => void;
  advanceLevel: () => void;
  
  // Level progress actions
  setLevelProgress: (progress: LevelProgressData[]) => void;
  recordLevelCompletion: (levelNumber: number, score: number) => void;
  
  // Figure placement actions
  placeFigure: (x: number, y: number) => FigureInstance | null;
  nextFigure: () => void;
  checkCollision: (figure: FigureInstance) => boolean;
  removeFigure: (figureId: string) => void;
  initializeGame: () => void;
  
  syncWithProfile: (profile: {
    coins: number;
    highScore: number;
    speedUpgrade: number;
    startSizeUpgrade: number;
    magnetUpgrade: number;
  }) => void;
  
  loadFromLocalStorage: () => void;
  
  // Mutation actions
  triggerMutation: () => void;
  applyCountermeasure: (countermeasureId: string, cost: number) => void;
  
  // Endless mode actions
  startEndlessMode: () => void;
  advanceEndlessWave: () => void;
  
  // New consumable actions
  useFreeze: () => boolean;
  toggleLassoMode: () => void;
  addLassoPoint: (x: number, y: number) => void;
  executeLasso: () => number;
  buySkillConsumable: (type: 'freeze' | 'cleanser') => boolean;
}

export const UPGRADE_MAX_LEVELS = {
  bombCount: 5,
  figureSize: 5,
  queueSize: 4,
  timeBonus: 3,
  placementBonus: 3,
  slowMo: 3,
  shield: 99, // Consumable - no practical limit
  coinBoost: 4,
  lucky: 3,
  secondChance: 99, // Consumable - no practical limit
};

// Tiered pricing: Core (80-180), Power (150-300), Premium (220-400)
export const UPGRADE_COSTS = {
  // Core Utility tier
  queueSize: 80,      // Core - low priority
  timeBonus: 100,     // Core
  coinBoost: 120,     // Core
  // Power tier
  figureSize: 150,    // Power - reduces difficulty
  placementBonus: 160, // Power
  lucky: 180,         // Power - more bombs
  slowMo: 200,        // Power - slows game
  // Premium tier
  bombCount: 220,     // Premium - powerful utility
  // Consumables (value hierarchy: 2nd Chance > Shield > Bomb)
  shield: 220,        // High value consumable
  secondChance: 360,  // Most valuable - full revival
};

// Consumable prices for skill items
export const SKILL_COSTS = {
  freeze: 180,        // Situational utility
  cleanser: 160,      // Tactical removal
};

function generateRandomTemplateId(): string {
  const templates = BACTERIA_TEMPLATES;
  const weights = templates.map(t => t.rarity === 'common' ? 3 : t.rarity === 'rare' ? 2 : 1);
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;
  
  for (let i = 0; i < templates.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return templates[i].id;
    }
  }
  return templates[0].id;
}

function generateQueue(size: number, includesBomb: boolean = false, luckyLevel: number = 1): string[] {
  const queue: string[] = [];
  const bombChance = 0.05 + (luckyLevel - 1) * 0.03;
  
  for (let i = 0; i < size; i++) {
    if (includesBomb && i === Math.floor(size / 2)) {
      queue.push('bomb');
    } else if (Math.random() < bombChance) {
      queue.push('bomb');
    } else {
      queue.push(generateRandomTemplateId());
    }
  }
  return queue;
}

function getInitialState() {
  const localProgress = offlineStorage.getLevelProgress();
  const localStats = offlineStorage.getPlayerStats();
  const maxUnlocked = offlineStorage.getUnlockedLevels();
  
  const hasStoredData = localStats.lastUpdated > 0;
  
  return {
    levelProgress: localProgress,
    maxUnlockedLevel: Math.max(1, maxUnlocked),
    highScore: localStats.highScore,
    coins: hasStoredData ? localStats.coins : 500,
    upgrades: {
      bombCount: localStats.bombCount ?? 1,
      figureSize: localStats.figureSize ?? 1,
      queueSize: localStats.queueSize ?? 1,
      timeBonus: localStats.timeBonus ?? 1,
      placementBonus: localStats.placementBonus ?? 1,
      slowMo: localStats.slowMo ?? 1,
      shield: localStats.shield ?? 0,
      coinBoost: localStats.coinBoost ?? 1,
      lucky: localStats.lucky ?? 1,
      secondChance: localStats.secondChance ?? 0,
    },
  };
}

const initialState = getInitialState();

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: 'MENU',
  score: 0,
  highScore: initialState.highScore,
  coins: initialState.coins,
  
  // Level system - start at level 1
  currentLevel: 1,
  currentLevelConfig: LEVELS[0],
  selectedLevel: 1,
  
  // Level progress - hydrate from offline storage
  levelProgress: initialState.levelProgress,
  maxUnlockedLevel: initialState.maxUnlockedLevel,
  
  placedFigures: [],
  figureQueue: [],
  currentFigureId: null,
  bombsRemaining: GAME_CONFIG.STARTING_BOMBS,
  figuresPlaced: 0,
  totalFigures: LEVELS[0].figuresCount,
  
  timeRemaining: LEVELS[0].startTime,
  timerInterval: null,
  
  upgrades: initialState.upgrades,
  shieldUsed: false,
  shieldCooldownUntil: 0,
  secondChanceUsed: false,
  lastPlacedFigure: null,
  
  notification: null,
  kikMessage: null,
  consecutivePlacements: 0,
  bombTargetingMode: false,
  
  // Mutation Events
  activeMutation: null,
  mutationModifiers: {
    vibrationMultiplier: 1,
    sizeMultiplier: 1,
    speedMultiplier: 1,
    driftEnabled: false,
  },
  
  // Mastery Tracking
  levelStats: {
    bombsUsed: 0,
    shieldsUsed: 0,
    secondChancesUsed: 0,
    timeRemaining: 0,
    totalTime: 0,
    perfectPlacements: 0,
    totalPlacements: 0,
  },
  closeCallCount: 0,
  
  // Endless Mode
  isEndlessMode: false,
  endlessWave: 1,
  endlessScore: 0,
  endlessHighScore: 0,
  endlessBestWave: 1,
  
  // New Skill Consumables
  freezeCount: 0,
  cleanserCount: 0,
  isFrozen: false,
  isLassoMode: false,
  lassoPoints: [],
  
  // Canvas scaling for responsive sizing
  canvasScale: 1,
  
  setGameState: (state) => set({ gameState: state }),
  setCanvasScale: (scale) => set({ canvasScale: scale }),
  setNotification: (msg) => set({ notification: msg }),
  setKikMessage: (msg) => {
    set({ kikMessage: msg });
    if (msg) {
      setTimeout(() => set({ kikMessage: null }), 2000);
    }
  },
  triggerKikAnnouncement: (category: string) => {
    const messages = KIK_ANNOUNCER[category as keyof typeof KIK_ANNOUNCER];
    if (messages && messages.length > 0) {
      const randomMsg = messages[Math.floor(Math.random() * messages.length)];
      set({ kikMessage: randomMsg });
      setTimeout(() => set({ kikMessage: null }), 2000);
    }
  },
  
  toggleBombTargeting: () => {
    const state = get();
    if (state.bombsRemaining <= 0) return;
    set({ bombTargetingMode: !state.bombTargetingMode });
  },
  
  detonateBombAt: (x: number, y: number) => {
    const state = get();
    if (state.bombsRemaining <= 0 || !state.bombTargetingMode) {
      return { cleared: 0, success: false };
    }
    
    const blastRadius = GAME_CONFIG.BOMB_BLAST_RADIUS * state.canvasScale;
    
    const nearbyFigures = state.placedFigures.filter(f => {
      const dx = f.x - x;
      const dy = f.y - y;
      return Math.sqrt(dx * dx + dy * dy) < blastRadius;
    });
    
    const remainingFigures = state.placedFigures.filter(f => !nearbyFigures.includes(f));
    const clearedCount = nearbyFigures.length;
    
    set({
      placedFigures: remainingFigures,
      bombsRemaining: state.bombsRemaining - 1,
      bombTargetingMode: false,
      figuresPlaced: Math.max(0, state.figuresPlaced - clearedCount),
      notification: clearedCount > 0 
        ? `BOOM! ${clearedCount} figure${clearedCount > 1 ? 's' : ''} cleared!` 
        : 'BOOM! Area cleared!'
    });
    
    playPlacementSound('bomb');
    
    setTimeout(() => set({ notification: null }), 1500);
    return { cleared: clearedCount, success: true };
  },
  
  startTimer: () => {
    const state = get();
    if (state.timerInterval) {
      window.clearInterval(state.timerInterval);
    }
    
    // Use level-based start time + TIME+ bonus
    const timeBonusUpgrade = (state.upgrades.timeBonus - 1) * 3;
    set({ timeRemaining: state.currentLevelConfig.startTime + timeBonusUpgrade });
    
    const interval = window.setInterval(() => {
      const currentState = get();
      if (currentState.gameState !== 'PLAYING' && currentState.gameState !== 'ENDLESS_PLAYING') {
        window.clearInterval(interval);
        set({ timerInterval: null });
        return;
      }
      
      const newTime = currentState.timeRemaining - 1;
      
      if (newTime <= 0) {
        window.clearInterval(interval);
        playGameOverSound();
        const s = get();
        const updates: any = { timerInterval: null, timeRemaining: 0, gameState: 'GAME_OVER', notification: 'TIME OUT!' };
        if (s.isEndlessMode) {
          if (s.endlessScore > s.endlessHighScore) updates.endlessHighScore = s.endlessScore;
          if (s.endlessWave > s.endlessBestWave) updates.endlessBestWave = s.endlessWave;
        }
        set(updates);
        setTimeout(() => get().triggerKikAnnouncement('gameOverTime'), 300);
      } else {
        set({ timeRemaining: newTime });
        if (newTime === 10) {
          get().triggerKikAnnouncement('lowTime');
        }
      }
    }, 1000);
    
    set({ timerInterval: interval });
  },
  
  resumeTimer: () => {
    const state = get();
    if (state.timerInterval) {
      window.clearInterval(state.timerInterval);
    }
    
    // Resume from current time without resetting
    const interval = window.setInterval(() => {
      const currentState = get();
      if (currentState.gameState !== 'PLAYING' && currentState.gameState !== 'ENDLESS_PLAYING') {
        window.clearInterval(interval);
        set({ timerInterval: null });
        return;
      }
      
      const newTime = currentState.timeRemaining - 1;
      
      if (newTime <= 0) {
        window.clearInterval(interval);
        playGameOverSound();
        const s = get();
        const updates: any = { timerInterval: null, timeRemaining: 0, gameState: 'GAME_OVER', notification: 'TIME OUT!' };
        if (s.isEndlessMode) {
          if (s.endlessScore > s.endlessHighScore) updates.endlessHighScore = s.endlessScore;
          if (s.endlessWave > s.endlessBestWave) updates.endlessBestWave = s.endlessWave;
        }
        set(updates);
        setTimeout(() => get().triggerKikAnnouncement('gameOverTime'), 300);
      } else {
        set({ timeRemaining: newTime });
        if (newTime === 10) {
          get().triggerKikAnnouncement('lowTime');
        }
      }
    }, 1000);
    
    set({ timerInterval: interval });
  },
  
  setLevel: (level: number) => {
    const levelIndex = Math.min(level - 1, LEVELS.length - 1);
    const levelConfig = LEVELS[levelIndex];
    set({ 
      currentLevel: level,
      currentLevelConfig: levelConfig,
    });
  },
  
  selectLevel: (level: number) => {
    const state = get();
    if (level > state.maxUnlockedLevel) return;
    const levelIndex = Math.min(level - 1, LEVELS.length - 1);
    const levelConfig = LEVELS[levelIndex];
    set({ 
      selectedLevel: level,
      currentLevel: level,
      currentLevelConfig: levelConfig,
    });
  },
  
  advanceLevel: () => {
    const state = get();
    const nextLevel = state.currentLevel + 1;
    const levelIndex = Math.min(nextLevel - 1, LEVELS.length - 1);
    const levelConfig = LEVELS[levelIndex];
    set({ 
      currentLevel: nextLevel,
      currentLevelConfig: levelConfig,
      notification: `Level ${nextLevel}: ${levelConfig.name}!`
    });
    setTimeout(() => set({ notification: null }), 2000);
  },
  
  setLevelProgress: (progress: { levelNumber: number; bestScore: number; isCompleted: boolean }[]) => {
    const maxCompleted = progress.reduce((max, p) => {
      if (p.isCompleted && p.levelNumber > max) return p.levelNumber;
      return max;
    }, 0);
    set({ 
      levelProgress: progress,
      maxUnlockedLevel: Math.max(1, maxCompleted + 1),
    });
  },
  
  recordLevelCompletion: (levelNumber: number, score: number) => {
    const state = get();
    const existingProgress = state.levelProgress.find(p => p.levelNumber === levelNumber);
    
    let updatedProgress: { levelNumber: number; bestScore: number; isCompleted: boolean }[];
    if (existingProgress) {
      updatedProgress = state.levelProgress.map(p => 
        p.levelNumber === levelNumber 
          ? { ...p, bestScore: Math.max(p.bestScore, score), isCompleted: true }
          : p
      );
    } else {
      updatedProgress = [...state.levelProgress, { levelNumber, bestScore: score, isCompleted: true }];
    }
    
    const maxCompleted = updatedProgress.reduce((max, p) => {
      if (p.isCompleted && p.levelNumber > max) return p.levelNumber;
      return max;
    }, 0);
    
    set({
      levelProgress: updatedProgress,
      maxUnlockedLevel: Math.min(LEVELS.length, maxCompleted + 1),
    });
    
    offlineStorage.updateLevelProgress(levelNumber, score, true);
    offlineStorage.updateHighScore(state.score);
    
    // Track engagement
    engagementService.recordLevelComplete(levelNumber, score);
  },
  
  stopTimer: () => {
    const state = get();
    if (state.timerInterval) {
      window.clearInterval(state.timerInterval);
      set({ timerInterval: null });
    }
  },
  
  tickTimer: () => {
    // Timer logic moved to startTimer interval
  },
  
  addScore: (amount) => set((state) => {
    const newScore = state.score + amount;
    return {
      score: newScore,
      highScore: Math.max(newScore, state.highScore),
    };
  }),
  
  collectCoin: (amount) => {
    const newCoins = get().coins + amount;
    set({ coins: newCoins });
    offlineStorage.setPlayerStats({ coins: newCoins });
  },
  
  buyUpgrade: (type) => {
    const state = get();
    const currentLevel = state.upgrades[type];
    const maxLevel = UPGRADE_MAX_LEVELS[type];
    const isConsumable = type === 'secondChance' || type === 'shield';
    
    if (!isConsumable && currentLevel >= maxLevel) {
      return false;
    }
    
    // Consumables have flat cost, leveled upgrades scale with level
    const cost = isConsumable 
      ? UPGRADE_COSTS[type] 
      : UPGRADE_COSTS[type] * currentLevel;
    
    if (state.coins >= cost) {
      const newCoins = state.coins - cost;
      const newUpgrades = {
        ...state.upgrades,
        [type]: currentLevel + 1
      };
      set({
        coins: newCoins,
        upgrades: newUpgrades,
      });
      offlineStorage.setPlayerStats({
        coins: newCoins,
        ...newUpgrades,
      });
      return true;
    }
    return false;
  },
  
  useShield: () => {
    const state = get();
    // Check if already used this game session or no shields available
    if (state.shieldUsed || state.upgrades.shield <= 0) {
      return false;
    }
    
    // Decrement shield count
    const newShieldCount = state.upgrades.shield - 1;
    const newUpgrades = {
      ...state.upgrades,
      shield: newShieldCount,
    };
    
    const cooldownDuration = 2000;
    set({ 
      shieldUsed: true, 
      shieldCooldownUntil: Date.now() + cooldownDuration,
      upgrades: newUpgrades,
      notification: 'SHIELD ACTIVATED!',
      consecutivePlacements: 0, // Reset streak on shield use
    });
    
    // Save to local storage
    offlineStorage.setPlayerStats({
      ...newUpgrades,
    });
    
    // K.I.K. shield announcement
    setTimeout(() => get().triggerKikAnnouncement('shieldSave'), 300);
    
    setTimeout(() => set({ notification: null }), 1500);
    return true;
  },
  
  useSecondChance: () => {
    const state = get();
    // Check if already used this game session or no second chances available
    if (state.secondChanceUsed || state.upgrades.secondChance <= 0) {
      return false;
    }
    
    // Remove the last placed figure if exists
    const lastFigure = state.lastPlacedFigure;
    let newPlacedFigures = state.placedFigures;
    let newFiguresPlaced = state.figuresPlaced;
    
    if (lastFigure) {
      newPlacedFigures = state.placedFigures.filter(f => f.id !== lastFigure.id);
      newFiguresPlaced = Math.max(0, state.figuresPlaced - 1);
    }
    
    // Decrement second chance count and mark as used this session
    const newSecondChanceCount = state.upgrades.secondChance - 1;
    const newUpgrades = {
      ...state.upgrades,
      secondChance: newSecondChanceCount,
    };
    
    // Determine which game state to resume based on the mode flag
    const resumeState = state.isEndlessMode ? 'ENDLESS_PLAYING' : 'PLAYING';
    
    // Restore the game state and resume play
    set({ 
      secondChanceUsed: true,
      placedFigures: newPlacedFigures,
      figuresPlaced: newFiguresPlaced,
      timeRemaining: Math.max(5, state.timeRemaining + 3), // Give 3 extra seconds, minimum 5
      upgrades: newUpgrades,
      notification: 'SECOND CHANCE!',
      consecutivePlacements: 0, // Reset streak
      gameState: resumeState,
    });
    
    // Resume the timer
    get().resumeTimer();
    
    // Save to local storage
    offlineStorage.setPlayerStats({
      ...newUpgrades,
    });
    
    // K.I.K. second chance announcement
    setTimeout(() => get().triggerKikAnnouncement('secondChanceUsed'), 300);
    
    setTimeout(() => set({ notification: null }), 1500);
    return true;
  },
  
  initializeGame: () => {
    const state = get();
    const levelConfig = state.currentLevelConfig;
    const queueSize = GAME_CONFIG.QUEUE_SIZE + (state.upgrades.queueSize - 1);
    const bombCount = GAME_CONFIG.STARTING_BOMBS + (state.upgrades.bombCount - 1);
    const luckyLevel = state.upgrades.lucky;
    const queue = generateQueue(queueSize + levelConfig.figuresCount, true, luckyLevel);
    
    set({
      placedFigures: [],
      figureQueue: queue.slice(1),
      currentFigureId: queue[0],
      bombsRemaining: bombCount,
      figuresPlaced: 0,
      totalFigures: levelConfig.figuresCount,
      score: 0,
      notification: null,
      kikMessage: null,
      consecutivePlacements: 0,
      shieldUsed: false,
      shieldCooldownUntil: 0,
      secondChanceUsed: false,
      lastPlacedFigure: null,
      bombTargetingMode: false,
    });
    
    // K.I.K. level start announcement
    setTimeout(() => get().triggerKikAnnouncement('levelStart'), 500);
  },
  
  placeFigure: (x: number, y: number) => {
    const state = get();
    if (!state.currentFigureId) return null;
    
    const template = state.currentFigureId === 'bomb' 
      ? BOMB_TEMPLATE 
      : BACTERIA_TEMPLATES.find(t => t.id === state.currentFigureId);
    
    if (!template) return null;
    
    // Apply template baseScale, upgrade size reduction (5% per level, max 25%), and level size multiplier
    const upgradeMultiplier = 1 - (state.upgrades.figureSize - 1) * 0.05;
    const levelSizeMultiplier = state.currentLevelConfig.sizeMultiplier;
    const finalScale = template.baseScale * upgradeMultiplier * levelSizeMultiplier;
    
    const newFigure: FigureInstance = {
      id: `figure-${Date.now()}-${Math.random()}`,
      templateId: state.currentFigureId,
      x,
      y,
      rotation: Math.random() * Math.PI * 2,
      scale: finalScale,
      vibrationOffset: Math.random() * Math.PI * 2,
      isPlaced: true,
    };
    
    // Handle bomb placement - wipes out area where bomb is placed (bombs can be placed anywhere)
    if (state.currentFigureId === 'bomb') {
      const blastRadius = 150; // Large blast radius
      
      // Remove all figures within blast radius
      const nearbyFigures = state.placedFigures.filter(f => {
        const dx = f.x - x;
        const dy = f.y - y;
        return Math.sqrt(dx * dx + dy * dy) < blastRadius;
      });
      
      const remainingFigures = state.placedFigures.filter(f => !nearbyFigures.includes(f));
      const clearedCount = nearbyFigures.length;
      
      set({
        placedFigures: remainingFigures,
        currentFigureId: state.figureQueue[0] || null,
        figureQueue: state.figureQueue.slice(1),
        notification: clearedCount > 0 
          ? `BOOM! ${clearedCount} figure${clearedCount > 1 ? 's' : ''} cleared!` 
          : 'BOOM! Area cleared!'
      });
      
      // Play bomb sound
      playPlacementSound('bomb');
      
      // Track engagement - bomb usage
      engagementService.recordBombUsed();
      
      // K.I.K. bomb announcement
      setTimeout(() => get().triggerKikAnnouncement(clearedCount > 0 ? 'bombUsed' : 'bombWasted'), 300);
      
      // Replenish queue after bomb placement if running low
      const afterBombState = get();
      const remainingAfterBomb = afterBombState.totalFigures - afterBombState.figuresPlaced;
      if (afterBombState.figureQueue.length < 3 && remainingAfterBomb > 0) {
        const luckyLevel = afterBombState.upgrades.lucky;
        const additionalFigures = generateQueue(Math.max(5, remainingAfterBomb + 3), true, luckyLevel);
        set({ figureQueue: [...afterBombState.figureQueue, ...additionalFigures] });
      }
      
      setTimeout(() => set({ notification: null }), 1500);
      return newFigure;
    }
    
    // Check for collision with existing figures (only for non-bomb figures)
    if (state.checkCollision(newFigure)) {
      return null; // Collision detected - cannot place here
    }
    
    // Check for close call (very close but still valid placement)
    const effectiveRadius = computeEffectiveRadius(newFigure, BACTERIA_TEMPLATES, BOMB_TEMPLATE, state.canvasScale);
    let isCloseCall = false;
    for (const placed of state.placedFigures) {
      const placedEffectiveRadius = computeEffectiveRadius(placed, BACTERIA_TEMPLATES, BOMB_TEMPLATE, state.canvasScale);
      const dx = newFigure.x - placed.x;
      const dy = newFigure.y - placed.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const minDistance = effectiveRadius + placedEffectiveRadius + 1;
      // Close call if within 20% extra margin
      if (distance < minDistance * 1.2) {
        isCloseCall = true;
        break;
      }
    }
    
    // Increment streak BEFORE calculating coins so this placement benefits
    const newConsecutive = state.consecutivePlacements + 1;
    
    // Add coins for placing and apply upgrade bonuses + streak bonus
    const coinBoostMultiplier = 1 + (state.upgrades.coinBoost - 1) * 0.1;
    // Streak bonus: +10% per consecutive placement, caps at +50% (5 placements)
    const streakBonus = Math.min(newConsecutive * 0.1, 0.5);
    const coinValue = Math.floor(template.coinValue * coinBoostMultiplier * (1 + streakBonus));
    const baseBonusTime = state.currentLevelConfig.timeBonusPerFigure;
    const placementBonusExtra = (state.upgrades.placementBonus - 1) * 0.3;
    const timeBonus = baseBonusTime + placementBonusExtra;
    
    const newCoins = state.coins + coinValue;
    set({
      placedFigures: [...state.placedFigures, newFigure],
      currentFigureId: state.figureQueue[0] || null,
      figureQueue: state.figureQueue.slice(1),
      figuresPlaced: state.figuresPlaced + 1,
      score: state.score + coinValue,
      coins: newCoins,
      timeRemaining: state.timeRemaining + timeBonus,
      lastPlacedFigure: newFigure,
      consecutivePlacements: newConsecutive,
    });
    
    // Save coins to local storage after each placement
    offlineStorage.setPlayerStats({ coins: newCoins });
    
    // Track engagement - record placement and coins
    engagementService.recordPlacement();
    if (coinValue > 0) {
      engagementService.recordCoinsEarned(coinValue);
    }
    
    // Play placement sound for this bacteria type
    playPlacementSound(template.id);
    
    const newState = get();
    
    // Replenish queue if running low (applies to both regular and endless mode)
    const remainingToPlace = newState.totalFigures - newState.figuresPlaced;
    if (newState.figureQueue.length < 3 && remainingToPlace > 0) {
      const luckyLevel = newState.upgrades.lucky;
      const additionalFigures = generateQueue(Math.max(5, remainingToPlace + 3), true, luckyLevel);
      set({ figureQueue: [...newState.figureQueue, ...additionalFigures] });
    }
    
    // In endless mode, keep generating new figures and skip win condition
    if (newState.isEndlessMode) {
      // Add new figures to queue to keep it populated (maintain at least 3 in queue)
      if (newState.figureQueue.length < 3) {
        const newFigures: string[] = [];
        const templates = BACTERIA_TEMPLATES;
        for (let i = 0; i < 5; i++) {
          const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
          newFigures.push(randomTemplate.id);
        }
        set({ figureQueue: [...newState.figureQueue, ...newFigures] });
      }
      
      // K.I.K. announcements for endless mode
      if (newConsecutive >= 5 && newConsecutive % 5 === 0) {
        setTimeout(() => get().triggerKikAnnouncement('perfectStreak'), 200);
      } else if (isCloseCall) {
        setTimeout(() => get().triggerKikAnnouncement('closeCall'), 200);
      } else if (Math.random() < 0.15) {
        setTimeout(() => get().triggerKikAnnouncement('goodPlacement'), 200);
      }
      
      // Update endless score
      set({ endlessScore: newState.endlessScore + coinValue });
      
      return newFigure;
    }
    
    // Regular level mode - check win condition
    const remaining = newState.totalFigures - newState.figuresPlaced;
    const progress = newState.figuresPlaced / newState.totalFigures;
    
    // K.I.K. progress announcements (priority order)
    if (remaining === 0) {
      // Win - announced separately
    } else if (remaining === 1) {
      setTimeout(() => get().triggerKikAnnouncement('lastOne'), 200);
    } else if (progress >= 0.8 && progress < 0.85) {
      setTimeout(() => get().triggerKikAnnouncement('almostDone'), 200);
    } else if (progress >= 0.5 && progress < 0.55) {
      setTimeout(() => get().triggerKikAnnouncement('halfwayDone'), 200);
    } else if (newConsecutive >= 5 && newConsecutive % 5 === 0) {
      setTimeout(() => get().triggerKikAnnouncement('perfectStreak'), 200);
    } else if (isCloseCall) {
      setTimeout(() => get().triggerKikAnnouncement('closeCall'), 200);
    } else if (Math.random() < 0.15) {
      setTimeout(() => get().triggerKikAnnouncement('goodPlacement'), 200);
    }
    
    if (newState.figuresPlaced >= newState.totalFigures) {
      // Award level completion bonus + time bonus
      const levelNum = newState.currentLevel;
      const isMilestone = [10, 25, 50, 75, 100].includes(levelNum);
      const baseLevelBonus = 50 + levelNum; // Base bonus scales with level (50-150)
      const milestoneMultiplier = isMilestone ? 1.5 : 1;
      const levelCompletionBonus = Math.floor(baseLevelBonus * milestoneMultiplier);
      
      // Time bonus: 25 coins per second remaining
      const timeBonus = Math.floor(newState.timeRemaining * 25);
      const totalBonus = levelCompletionBonus + timeBonus;
      const finalCoins = newState.coins + totalBonus;
      const finalScore = newState.score + timeBonus;
      
      // Start celebration animation, then show WIN screen after delay
      playSuccessSound();
      set({ 
        coins: finalCoins,
        score: finalScore,
        highScore: Math.max(finalScore, newState.highScore),
        gameState: 'CELEBRATING',
        consecutivePlacements: 0, // Reset streak for next level
        notification: isMilestone 
          ? `🏆 MILESTONE! +${totalBonus} (⏱${timeBonus})` 
          : `COMPLETE! +${totalBonus} (⏱${timeBonus})`
      });
      
      // Save bonus coins and update high score
      offlineStorage.setPlayerStats({ coins: finalCoins });
      offlineStorage.updateHighScore(finalScore);
      engagementService.recordCoinsEarned(totalBonus);
      
      setTimeout(() => get().triggerKikAnnouncement('victory'), 300);
      setTimeout(() => {
        set({ gameState: 'WIN', notification: null });
      }, 2500);
    }
    
    return newFigure;
  },
  
  nextFigure: () => {
    const state = get();
    if (state.figureQueue.length === 0) {
      set({ currentFigureId: null });
      return;
    }
    
    set({
      currentFigureId: state.figureQueue[0],
      figureQueue: state.figureQueue.slice(1),
    });
  },
  
  checkCollision: (figure: FigureInstance) => {
    const state = get();
    const effectiveRadius = computeEffectiveRadius(figure, BACTERIA_TEMPLATES, BOMB_TEMPLATE, state.canvasScale);
    
    for (const placed of state.placedFigures) {
      const placedEffectiveRadius = computeEffectiveRadius(placed, BACTERIA_TEMPLATES, BOMB_TEMPLATE, state.canvasScale);
      const dx = figure.x - placed.x;
      const dy = figure.y - placed.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const minDistance = effectiveRadius + placedEffectiveRadius + 1;
      
      if (distance < minDistance) {
        return true;
      }
    }
    return false;
  },
  
  removeFigure: (figureId: string) => {
    set((state) => ({
      placedFigures: state.placedFigures.filter(f => f.id !== figureId)
    }));
  },
  
  resetGame: () => {
    const state = get();
    state.stopTimer();
    set({
      gameState: 'MENU',
      score: 0,
      placedFigures: [],
      figureQueue: [],
      currentFigureId: null,
      figuresPlaced: 0,
      notification: null,
      timeRemaining: GAME_CONFIG.GAME_TIME,
      isEndlessMode: false,
      isFrozen: false,
      isLassoMode: false,
    });
  },

  syncWithProfile: (profile) => {
    const state = get();
    const upgrades = {
      ...state.upgrades,
      bombCount: profile.speedUpgrade,
      figureSize: profile.startSizeUpgrade,
      queueSize: profile.magnetUpgrade,
    };
    set({
      coins: profile.coins,
      highScore: profile.highScore,
      upgrades,
    });
    offlineStorage.setPlayerStats({
      coins: profile.coins,
      highScore: profile.highScore,
      ...upgrades,
    });
  },

  loadFromLocalStorage: () => {
    const stats = offlineStorage.getPlayerStats();
    const levelProgress = offlineStorage.getLevelProgress();
    const maxUnlocked = offlineStorage.getUnlockedLevels();
    
    set({
      coins: stats.coins,
      highScore: stats.highScore,
      upgrades: {
        bombCount: stats.bombCount,
        figureSize: stats.figureSize,
        queueSize: stats.queueSize,
        timeBonus: stats.timeBonus,
        placementBonus: stats.placementBonus,
        slowMo: stats.slowMo,
        shield: stats.shield,
        coinBoost: stats.coinBoost,
        lucky: stats.lucky,
        secondChance: stats.secondChance,
      },
      levelProgress: levelProgress,
      maxUnlockedLevel: maxUnlocked,
    });
  },
  
  // Mutation Event Actions
  triggerMutation: () => {
    const randomMutation = MUTATION_EVENTS[Math.floor(Math.random() * MUTATION_EVENTS.length)];
    set({ 
      activeMutation: randomMutation,
      gameState: 'MUTATION_CHOICE'
    });
  },
  
  applyCountermeasure: (countermeasureId: string, cost: number) => {
    const state = get();
    if (!state.activeMutation) return;
    
    const countermeasure = state.activeMutation.countermeasures.find(c => c.id === countermeasureId);
    if (!countermeasure) return;
    
    let newModifiers = { ...state.mutationModifiers };
    
    if (countermeasure.effect === 'nullify') {
      // No effect applied
    } else if (countermeasure.effect === 'reduce') {
      // Apply 50% of mutation effect
      switch (state.activeMutation.effect) {
        case 'vibration_increase':
          newModifiers.vibrationMultiplier = 1.25;
          break;
        case 'size_increase':
          newModifiers.sizeMultiplier = 1.15;
          break;
        case 'speed_increase':
          newModifiers.speedMultiplier = 1.25;
          break;
        case 'random_movement':
          newModifiers.driftEnabled = true;
          break;
      }
    } else if (countermeasure.effect === 'reverse') {
      // Reverse effect - beneficial
      switch (state.activeMutation.effect) {
        case 'size_increase':
          newModifiers.sizeMultiplier = 0.8;
          break;
        case 'speed_increase':
          newModifiers.speedMultiplier = 0.7;
          break;
      }
    }
    
    set({
      activeMutation: null,
      mutationModifiers: newModifiers,
      timeRemaining: Math.max(1, state.timeRemaining - cost),
      gameState: 'PLAYING'
    });
    
    get().triggerKikAnnouncement('goodPlacement');
  },
  
  // Endless Mode Actions
  startEndlessMode: () => {
    const state = get();
    if (state.timerInterval) {
      window.clearInterval(state.timerInterval);
    }
    
    const queueSize = GAME_CONFIG.QUEUE_SIZE + (state.upgrades.queueSize - 1);
    const bombCount = GAME_CONFIG.STARTING_BOMBS + (state.upgrades.bombCount - 1);
    const luckyLevel = state.upgrades.lucky;
    const queue = generateQueue(queueSize + 50, true, luckyLevel);
    const timeBonusUpgrade = (state.upgrades.timeBonus - 1) * 3;
    const startTime = 60 + timeBonusUpgrade;
    
    set({
      isEndlessMode: true,
      endlessWave: 1,
      endlessScore: 0,
      gameState: 'ENDLESS_PLAYING',
      placedFigures: [],
      figureQueue: queue.slice(1),
      currentFigureId: queue[0],
      bombsRemaining: bombCount,
      figuresPlaced: 0,
      totalFigures: 999999,
      score: 0,
      notification: 'ENDLESS MODE - SURVIVE!',
      timeRemaining: startTime,
      shieldUsed: false,
      shieldCooldownUntil: 0,
      secondChanceUsed: false,
      lastPlacedFigure: null,
      bombTargetingMode: false,
      mutationModifiers: {
        vibrationMultiplier: 1,
        sizeMultiplier: 1,
        speedMultiplier: 1,
        driftEnabled: false,
      },
    });
    
    // Start endless mode timer
    const interval = window.setInterval(() => {
      const currentState = get();
      if (currentState.gameState !== 'ENDLESS_PLAYING') {
        window.clearInterval(interval);
        set({ timerInterval: null });
        return;
      }
      
      const newTime = currentState.timeRemaining - 1;
      
      if (newTime <= 0) {
        window.clearInterval(interval);
        playGameOverSound();
        const s = get();
        const updates: any = { 
          timerInterval: null, 
          timeRemaining: 0, 
          gameState: 'GAME_OVER', 
          notification: 'TIME OUT!' 
        };
        if (s.endlessScore > s.endlessHighScore) updates.endlessHighScore = s.endlessScore;
        if (s.endlessWave > s.endlessBestWave) updates.endlessBestWave = s.endlessWave;
        set(updates);
        setTimeout(() => get().triggerKikAnnouncement('gameOverTime'), 300);
      } else {
        set({ timeRemaining: newTime });
        if (newTime === 10) {
          get().triggerKikAnnouncement('lowTime');
        }
      }
    }, 1000);
    
    set({ timerInterval: interval });
    setTimeout(() => set({ notification: null }), 2000);
  },
  
  advanceEndlessWave: () => {
    const state = get();
    const nextWave = state.endlessWave + 1;
    const luckyLevel = state.upgrades.lucky;
    const additionalFigures = generateQueue(15, true, luckyLevel);
    
    set({
      endlessWave: nextWave,
      endlessScore: state.endlessScore + state.score,
      figureQueue: [...state.figureQueue, ...additionalFigures],
      totalFigures: state.totalFigures + 10 + Math.floor(nextWave / 2),
      notification: `WAVE ${nextWave}!`,
      timeRemaining: state.timeRemaining + 30,
    });
    
    // Track engagement - endless wave progress
    engagementService.recordEndlessWave(nextWave);
    
    // Trigger mutation every 3 waves
    if (nextWave % 3 === 0) {
      setTimeout(() => get().triggerMutation(), 1000);
    }
    
    get().triggerKikAnnouncement('perfectStreak');
    setTimeout(() => set({ notification: null }), 2000);
  },
  
  // New Consumable Actions
  useFreeze: () => {
    const state = get();
    if (state.freezeCount <= 0 || state.isFrozen) return false;
    
    set({ 
      freezeCount: state.freezeCount - 1,
      isFrozen: true,
      notification: 'FREEZE ACTIVATED!'
    });
    
    // Unfreeze after 5 seconds
    setTimeout(() => {
      set({ isFrozen: false });
    }, 5000);
    
    setTimeout(() => set({ notification: null }), 1500);
    return true;
  },
  
  toggleLassoMode: () => {
    const state = get();
    if (state.cleanserCount <= 0 && !state.isLassoMode) return;
    set({ 
      isLassoMode: !state.isLassoMode,
      lassoPoints: []
    });
  },
  
  addLassoPoint: (x: number, y: number) => {
    const state = get();
    if (!state.isLassoMode) return;
    set({ lassoPoints: [...state.lassoPoints, { x, y }] });
  },
  
  executeLasso: () => {
    const state = get();
    if (!state.isLassoMode || state.lassoPoints.length < 3) {
      set({ isLassoMode: false, lassoPoints: [] });
      return 0;
    }
    
    // Check which figures are inside the lasso polygon
    const insideFigures = state.placedFigures.filter(figure => {
      return isPointInPolygon(figure.x, figure.y, state.lassoPoints);
    });
    
    const remainingFigures = state.placedFigures.filter(f => !insideFigures.includes(f));
    const clearedCount = insideFigures.length;
    
    set({
      placedFigures: remainingFigures,
      figuresPlaced: Math.max(0, state.figuresPlaced - clearedCount),
      cleanserCount: state.cleanserCount - 1,
      isLassoMode: false,
      lassoPoints: [],
      notification: clearedCount > 0 ? `CLEANSED ${clearedCount} BACTERIA!` : 'NO BACTERIA CAUGHT!'
    });
    
    setTimeout(() => set({ notification: null }), 1500);
    return clearedCount;
  },
  
  buySkillConsumable: (type: 'freeze' | 'cleanser') => {
    const state = get();
    const cost = SKILL_COSTS[type];
    
    if (state.coins < cost) return false;
    
    const newCoins = state.coins - cost;
    if (type === 'freeze') {
      set({ coins: newCoins, freezeCount: state.freezeCount + 1 });
    } else {
      set({ coins: newCoins, cleanserCount: state.cleanserCount + 1 });
    }
    
    offlineStorage.setPlayerStats({ coins: newCoins });
    return true;
  },
}));

// Helper function to check if point is inside polygon
function isPointInPolygon(x: number, y: number, polygon: { x: number; y: number }[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
}

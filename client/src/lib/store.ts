import { create } from 'zustand';
import { GameState, FigureInstance, BACTERIA_TEMPLATES, BOMB_TEMPLATE, GAME_CONFIG, LEVELS, LevelConfig } from './game-constants';
import { playPlacementSound, playSuccessSound, playGameOverSound } from './sounds';
import { offlineStorage } from './offline-storage';

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
  };
  
  notification: string | null;
  
  // Actions
  setGameState: (state: GameState) => void;
  addScore: (amount: number) => void;
  resetGame: () => void;
  collectCoin: (amount: number) => void;
  buyUpgrade: (type: 'bombCount' | 'figureSize' | 'queueSize') => boolean;
  setNotification: (msg: string | null) => void;
  
  // Timer actions
  startTimer: () => void;
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
  useBomb: () => boolean;
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
}

const UPGRADE_COSTS = {
  bombCount: 150,
  figureSize: 100,
  queueSize: 200
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

function generateQueue(size: number, includesBomb: boolean = false): string[] {
  const queue: string[] = [];
  for (let i = 0; i < size; i++) {
    if (includesBomb && i === Math.floor(size / 2)) {
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
  
  notification: null,
  
  setGameState: (state) => set({ gameState: state }),
  setNotification: (msg) => set({ notification: msg }),
  
  startTimer: () => {
    const state = get();
    if (state.timerInterval) {
      window.clearInterval(state.timerInterval);
    }
    
    // Use level-based start time
    set({ timeRemaining: state.currentLevelConfig.startTime });
    
    const interval = window.setInterval(() => {
      const currentState = get();
      if (currentState.gameState !== 'PLAYING') {
        window.clearInterval(interval);
        set({ timerInterval: null });
        return;
      }
      
      const newTime = currentState.timeRemaining - 1;
      
      if (newTime <= 0) {
        window.clearInterval(interval);
        playGameOverSound();
        set({ timerInterval: null, timeRemaining: 0, gameState: 'GAME_OVER', notification: 'TIME OUT!' });
      } else {
        set({ timeRemaining: newTime });
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
    const cost = UPGRADE_COSTS[type] * state.upgrades[type];
    
    if (state.coins >= cost) {
      const newCoins = state.coins - cost;
      const newUpgrades = {
        ...state.upgrades,
        [type]: state.upgrades[type] + 1
      };
      set({
        coins: newCoins,
        upgrades: newUpgrades,
      });
      offlineStorage.setPlayerStats({
        coins: newCoins,
        bombCount: newUpgrades.bombCount,
        figureSize: newUpgrades.figureSize,
        queueSize: newUpgrades.queueSize,
      });
      return true;
    }
    return false;
  },
  
  initializeGame: () => {
    const state = get();
    const levelConfig = state.currentLevelConfig;
    const queueSize = GAME_CONFIG.QUEUE_SIZE + (state.upgrades.queueSize - 1);
    const bombCount = GAME_CONFIG.STARTING_BOMBS + (state.upgrades.bombCount - 1);
    const queue = generateQueue(queueSize + levelConfig.figuresCount, true);
    
    set({
      placedFigures: [],
      figureQueue: queue.slice(1),
      currentFigureId: queue[0],
      bombsRemaining: bombCount,
      figuresPlaced: 0,
      totalFigures: levelConfig.figuresCount,
      score: 0,
      notification: null,
    });
  },
  
  placeFigure: (x: number, y: number) => {
    const state = get();
    if (!state.currentFigureId) return null;
    
    const template = state.currentFigureId === 'bomb' 
      ? BOMB_TEMPLATE 
      : BACTERIA_TEMPLATES.find(t => t.id === state.currentFigureId);
    
    if (!template) return null;
    
    // Apply template baseScale, upgrade size reduction, and level size multiplier
    const upgradeMultiplier = 1 - (state.upgrades.figureSize - 1) * 0.1;
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
      
      setTimeout(() => set({ notification: null }), 1500);
      return newFigure;
    }
    
    // Check for collision with existing figures (only for non-bomb figures)
    if (state.checkCollision(newFigure)) {
      return null; // Collision detected - cannot place here
    }
    
    // Add coins for placing and level-based bonus time
    const coinValue = template.coinValue;
    const timeBonus = state.currentLevelConfig.timeBonusPerFigure;
    
    set({
      placedFigures: [...state.placedFigures, newFigure],
      currentFigureId: state.figureQueue[0] || null,
      figureQueue: state.figureQueue.slice(1),
      figuresPlaced: state.figuresPlaced + 1,
      score: state.score + coinValue,
      coins: state.coins + coinValue,
      timeRemaining: state.timeRemaining + timeBonus,
    });
    
    // Play placement sound for this bacteria type
    playPlacementSound(template.id);
    
    // Check win condition - level complete when all figures have been placed
    const newState = get();
    if (newState.figuresPlaced >= newState.totalFigures) {
      // Start celebration animation, then show WIN screen after delay
      playSuccessSound();
      set({ gameState: 'CELEBRATING', notification: 'LEVEL COMPLETE!' });
      setTimeout(() => {
        set({ gameState: 'WIN', notification: null });
      }, 2500);
    }
    
    return newFigure;
  },
  
  useBomb: () => {
    const state = get();
    if (state.bombsRemaining <= 0 || state.placedFigures.length === 0) return false;
    
    // Remove the last placed figure
    const newFigures = state.placedFigures.slice(0, -1);
    
    set({
      placedFigures: newFigures,
      bombsRemaining: state.bombsRemaining - 1,
      notification: 'Bomb used! Last figure removed!'
    });
    
    setTimeout(() => set({ notification: null }), 1500);
    return true;
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
    const baseRadius = GAME_CONFIG.FIGURE_BASE_SIZE * figure.scale;
    
    for (const placed of state.placedFigures) {
      const placedRadius = GAME_CONFIG.FIGURE_BASE_SIZE * placed.scale;
      const dx = figure.x - placed.x;
      const dy = figure.y - placed.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const minDistance = baseRadius + placedRadius - GAME_CONFIG.COLLISION_PADDING;
      
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
    });
  },

  syncWithProfile: (profile) => {
    const upgrades = {
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
      bombCount: upgrades.bombCount,
      figureSize: upgrades.figureSize,
      queueSize: upgrades.queueSize,
    });
  },
}));

import React from 'react';
import { useGameStore } from '../../lib/store';
import { Bomb, Target, Coins, Clock, Layers, X, Shield, RotateCcw, Snowflake, Wand2 } from 'lucide-react';

export function HUD() {
  const { 
    score, 
    figuresPlaced, 
    totalFigures, 
    bombsRemaining, 
    notification, 
    kikMessage,
    placedFigures, 
    timeRemaining, 
    currentLevel, 
    currentLevelConfig,
    bombTargetingMode,
    toggleBombTargeting,
    upgrades,
    freezeCount,
    cleanserCount,
    isFrozen,
    isLassoMode,
    useFreeze,
    toggleLassoMode,
    isEndlessMode,
    endlessWave,
  } = useGameStore();

  const handleBombClick = () => {
    toggleBombTargeting();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const secsFormatted = secs.toFixed(1).padStart(4, '0');
    return `${mins}:${secsFormatted}`;
  };

  const isLowTime = timeRemaining <= 10;

  return (
    <>
      <div className="absolute left-0 top-0 bottom-0 w-14 sm:w-24 bg-gradient-to-b from-muted to-background border-r-2 border-primary/30 flex flex-col items-center py-2 sm:py-4 gap-2 sm:gap-4 z-30">
        <div className="block-panel px-2 sm:px-3 py-2 sm:py-3 flex flex-col items-center gap-1">
          <Coins size={18} className="sm:w-6 sm:h-6 text-secondary" />
          <span className="font-display text-[10px] sm:text-xs coin-display" data-testid="text-score">
            {score}
          </span>
        </div>
        
        <div className="block-panel px-2 sm:px-3 py-2 sm:py-3 flex flex-col items-center gap-1">
          <Target size={18} className={`sm:w-6 sm:h-6 ${isEndlessMode ? 'text-purple-400' : 'text-primary'}`} />
          <span className={`font-display text-base sm:text-xl ${isEndlessMode ? 'text-purple-400' : 'text-primary'} text-glow`} data-testid="text-remaining">
            {isEndlessMode ? '∞' : Math.max(0, totalFigures - figuresPlaced)}
          </span>
          <span className="font-ui text-[10px] sm:text-xs text-muted-foreground">{isEndlessMode ? 'ENDLESS' : 'LEFT'}</span>
        </div>
        
        <div className="block-panel px-2 sm:px-3 py-2 sm:py-3 flex flex-col items-center gap-1">
          <span className="font-ui text-[10px] sm:text-sm text-muted-foreground">BOARD</span>
          <span className="font-display text-sm sm:text-lg text-foreground" data-testid="text-onboard">
            {placedFigures.length}
          </span>
        </div>
        
        <div className="flex-1" />
        
        <div className="flex flex-col gap-1 sm:gap-2">
          <button
            onClick={handleBombClick}
            disabled={bombsRemaining <= 0}
            className={`block-panel p-1.5 sm:p-3 flex flex-col items-center gap-0.5 sm:gap-1 transition-all relative
              ${bombTargetingMode 
                ? 'border-destructive shadow-[0_0_20px_rgba(255,68,68,0.6)] animate-pulse bg-destructive/20' 
                : bombsRemaining > 0 
                  ? 'hover:border-destructive hover:shadow-[0_0_15px_rgba(255,68,68,0.3)] cursor-pointer' 
                  : 'opacity-50 cursor-not-allowed'
              }`}
            data-testid="button-use-bomb"
          >
            {bombTargetingMode ? (
              <>
                <X size={20} className="sm:w-7 sm:h-7 text-destructive" />
                <span className="font-display text-[10px] sm:text-xs text-destructive">CANCEL</span>
              </>
            ) : (
              <>
                <Bomb size={20} className={`sm:w-7 sm:h-7 ${bombsRemaining > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
                <span className="font-display text-[10px] sm:text-xs text-foreground">{bombsRemaining}</span>
              </>
            )}
          </button>
          
          <div 
            className={`block-panel p-1 sm:p-2 flex flex-col items-center gap-0.5 ${upgrades.shield > 0 ? '' : 'opacity-50'}`}
            data-testid="display-shield"
          >
            <Shield size={16} className={`sm:w-5 sm:h-5 ${upgrades.shield > 0 ? 'text-cyan-400' : 'text-muted-foreground'}`} />
            <span className="font-display text-[10px] sm:text-xs text-foreground">x{upgrades.shield}</span>
          </div>
          
          <div 
            className={`block-panel p-1 sm:p-2 flex flex-col items-center gap-0.5 ${upgrades.secondChance > 0 ? '' : 'opacity-50'}`}
            data-testid="display-second-chance"
          >
            <RotateCcw size={16} className={`sm:w-5 sm:h-5 ${upgrades.secondChance > 0 ? 'text-orange-400' : 'text-muted-foreground'}`} />
            <span className="font-display text-[10px] sm:text-xs text-foreground">x{upgrades.secondChance}</span>
          </div>
          
          <button
            onClick={useFreeze}
            disabled={freezeCount <= 0 || isFrozen}
            className={`block-panel p-1 sm:p-2 flex flex-col items-center gap-0.5 transition-all
              ${isFrozen 
                ? 'border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)] bg-blue-500/20' 
                : freezeCount > 0 
                  ? 'hover:border-blue-400 cursor-pointer' 
                  : 'opacity-50 cursor-not-allowed'
              }`}
            data-testid="button-freeze"
          >
            <Snowflake size={16} className={`sm:w-5 sm:h-5 ${freezeCount > 0 || isFrozen ? 'text-blue-400' : 'text-muted-foreground'}`} />
            <span className="font-display text-[10px] sm:text-xs text-foreground">{isFrozen ? 'ON' : `x${freezeCount}`}</span>
          </button>
          
          <button
            onClick={toggleLassoMode}
            disabled={cleanserCount <= 0 && !isLassoMode}
            className={`block-panel p-1 sm:p-2 flex flex-col items-center gap-0.5 transition-all
              ${isLassoMode 
                ? 'border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.5)] bg-purple-500/20' 
                : cleanserCount > 0 
                  ? 'hover:border-purple-400 cursor-pointer' 
                  : 'opacity-50 cursor-not-allowed'
              }`}
            data-testid="button-cleanser"
          >
            <Wand2 size={16} className={`sm:w-5 sm:h-5 ${cleanserCount > 0 || isLassoMode ? 'text-purple-400' : 'text-muted-foreground'}`} />
            <span className="font-display text-[10px] sm:text-xs text-foreground">{isLassoMode ? 'DRAW' : `x${cleanserCount}`}</span>
          </button>
        </div>
      </div>

      <div className="absolute top-0 left-14 sm:left-24 right-0 h-12 sm:h-16 bg-gradient-to-r from-muted to-background border-b-2 border-primary/30 flex items-center justify-between px-2 sm:px-4 z-30">
        <div className="block-panel px-2 sm:px-4 py-1 sm:py-2 flex items-center gap-1 sm:gap-2">
          <Layers size={16} className={`sm:w-5 sm:h-5 ${isEndlessMode ? 'text-purple-400' : 'text-accent'}`} />
          <div className="flex flex-col">
            <span className={`font-display text-[10px] sm:text-xs ${isEndlessMode ? 'text-purple-400' : 'text-accent'}`} data-testid="text-level">
              {isEndlessMode ? `WAVE ${endlessWave}` : `LVL ${currentLevel}`}
            </span>
            <span className="font-ui text-[10px] sm:text-xs text-muted-foreground hidden sm:block">
              {isEndlessMode ? 'ENDLESS' : currentLevelConfig.name}
            </span>
          </div>
        </div>
        
        <div className={`block-panel px-3 sm:px-6 py-1 sm:py-2 flex items-center gap-1 sm:gap-3 ${isLowTime ? 'border-destructive shadow-[0_0_20px_rgba(255,68,68,0.4)]' : ''}`}>
          <Clock size={18} className={`sm:w-6 sm:h-6 ${isLowTime ? 'text-destructive' : 'text-primary'}`} />
          <span 
            className={`font-display text-base sm:text-xl ${isLowTime ? 'text-destructive animate-pulse' : 'text-primary text-glow'}`} 
            data-testid="text-timer"
          >
            {formatTime(timeRemaining)}
          </span>
        </div>
        
        <div className="w-16 sm:w-32" />
      </div>

      {notification && (
        <div 
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50"
          data-testid="notification-banner"
        >
          <div className="block-panel px-8 py-4 border-2 border-secondary shadow-[0_0_30px_rgba(249,233,0,0.4)]">
            <span className="font-display text-lg text-secondary text-glow">
              {notification}
            </span>
          </div>
        </div>
      )}
      
      {bombTargetingMode && (
        <div 
          className="absolute top-20 left-1/2 -translate-x-1/2 z-40"
          data-testid="targeting-mode-banner"
        >
          <div className="block-panel px-6 py-2 border-2 border-destructive shadow-[0_0_20px_rgba(255,68,68,0.4)] bg-background/90">
            <span className="font-display text-sm text-destructive animate-pulse">
              CLICK TO DETONATE BOMB
            </span>
          </div>
        </div>
      )}
      
      {isLassoMode && (
        <div 
          className="absolute top-20 left-1/2 -translate-x-1/2 z-40"
          data-testid="lasso-mode-banner"
        >
          <div className="block-panel px-6 py-2 border-2 border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.4)] bg-background/90">
            <span className="font-display text-sm text-purple-400 animate-pulse">
              DRAW TO CLEANSE BACTERIA
            </span>
          </div>
        </div>
      )}
      
      {kikMessage && (
        <div 
          className="absolute bottom-24 right-6 z-50 animate-in fade-in slide-in-from-right-3 duration-300"
          data-testid="kik-announcer"
        >
          <div className="relative">
            <div className="block-panel px-4 py-2 border-2 border-accent bg-background/95 shadow-[0_0_20px_rgba(255,106,213,0.4)]">
              <div className="flex items-center gap-2">
                <span className="font-display text-xs text-accent">K.I.K.</span>
                <span className="font-ui text-sm text-foreground">{kikMessage}</span>
              </div>
            </div>
            <div className="absolute -bottom-1 right-4 w-3 h-3 bg-background border-b-2 border-r-2 border-accent transform rotate-45" />
          </div>
        </div>
      )}
    </>
  );
}

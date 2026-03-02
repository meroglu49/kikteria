import React, { memo, useCallback } from 'react';
import { useGameStore } from '../../lib/store';
import { Bomb, Target, Coins, Clock, Layers, X, Shield, RotateCcw, Snowflake, Wand2 } from 'lucide-react';

const ScoreDisplay = memo(function ScoreDisplay() {
  const score = useGameStore(s => s.score);
  return (
    <div className="px-1 sm:px-2 py-1 sm:py-2 flex flex-col items-center">
      <Coins size={14} className="sm:w-5 sm:h-5 text-secondary" />
      <span className="font-display text-[9px] sm:text-xs coin-display" data-testid="text-score">
        {score}
      </span>
    </div>
  );
});

const RemainingDisplay = memo(function RemainingDisplay() {
  const figuresPlaced = useGameStore(s => s.figuresPlaced);
  const totalFigures = useGameStore(s => s.totalFigures);
  const isEndlessMode = useGameStore(s => s.isEndlessMode);
  return (
    <div className="px-1 sm:px-2 py-1 sm:py-2 flex flex-col items-center">
      <Target size={14} className={`sm:w-5 sm:h-5 ${isEndlessMode ? 'text-purple-400' : 'text-primary'}`} />
      <span className={`font-display text-sm sm:text-lg ${isEndlessMode ? 'text-purple-400' : 'text-primary'} text-glow`} data-testid="text-remaining">
        {isEndlessMode ? '\u221E' : Math.max(0, totalFigures - figuresPlaced)}
      </span>
    </div>
  );
});

const OnBoardDisplay = memo(function OnBoardDisplay() {
  const count = useGameStore(s => s.placedFigures.length);
  return (
    <div className="px-1 sm:px-2 py-1 flex flex-col items-center">
      <span className="font-display text-xs sm:text-base text-foreground" data-testid="text-onboard">
        {count}
      </span>
      <span className="font-ui text-[8px] sm:text-[10px] text-muted-foreground">ON</span>
    </div>
  );
});

const BombButton = memo(function BombButton() {
  const bombsRemaining = useGameStore(s => s.bombsRemaining);
  const bombTargetingMode = useGameStore(s => s.bombTargetingMode);
  const toggleBombTargeting = useGameStore(s => s.toggleBombTargeting);
  
  return (
    <button
      onClick={toggleBombTargeting}
      disabled={bombsRemaining <= 0}
      className={`p-1 sm:p-2 flex flex-col items-center transition-all relative
        ${bombTargetingMode 
          ? 'text-destructive' 
          : bombsRemaining > 0 
            ? 'hover:text-destructive cursor-pointer active:scale-90' 
            : 'opacity-40 cursor-not-allowed'
        }`}
      data-testid="button-use-bomb"
    >
      {bombTargetingMode ? (
        <X size={16} className="sm:w-5 sm:h-5 text-destructive" />
      ) : (
        <>
          <Bomb size={16} className={`sm:w-5 sm:h-5 ${bombsRemaining > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
          <span className="font-display text-[8px] sm:text-[10px]">{bombsRemaining}</span>
        </>
      )}
    </button>
  );
});

const ShieldDisplay = memo(function ShieldDisplay() {
  const shield = useGameStore(s => s.upgrades.shield);
  return (
    <div className={`p-1 flex flex-col items-center ${shield > 0 ? '' : 'opacity-40'}`} data-testid="display-shield">
      <Shield size={14} className={`sm:w-4 sm:h-4 ${shield > 0 ? 'text-cyan-400' : 'text-muted-foreground'}`} />
      <span className="font-display text-[8px] sm:text-[10px]">{shield}</span>
    </div>
  );
});

const SecondChanceDisplay = memo(function SecondChanceDisplay() {
  const secondChance = useGameStore(s => s.upgrades.secondChance);
  return (
    <div className={`p-1 flex flex-col items-center ${secondChance > 0 ? '' : 'opacity-40'}`} data-testid="display-second-chance">
      <RotateCcw size={14} className={`sm:w-4 sm:h-4 ${secondChance > 0 ? 'text-orange-400' : 'text-muted-foreground'}`} />
      <span className="font-display text-[8px] sm:text-[10px]">{secondChance}</span>
    </div>
  );
});

const FreezeButton = memo(function FreezeButton() {
  const freezeCount = useGameStore(s => s.freezeCount);
  const isFrozen = useGameStore(s => s.isFrozen);
  const useFreeze = useGameStore(s => s.useFreeze);
  
  return (
    <button
      onClick={useFreeze}
      disabled={freezeCount <= 0 || isFrozen}
      className={`p-1 flex flex-col items-center transition-all
        ${isFrozen 
          ? 'text-blue-400' 
          : freezeCount > 0 
            ? 'hover:text-blue-400 cursor-pointer active:scale-90' 
            : 'opacity-40 cursor-not-allowed'
        }`}
      data-testid="button-freeze"
    >
      <Snowflake size={14} className={`sm:w-4 sm:h-4 ${freezeCount > 0 || isFrozen ? 'text-blue-400' : 'text-muted-foreground'}`} />
      <span className="font-display text-[8px] sm:text-[10px]">{isFrozen ? '!' : freezeCount}</span>
    </button>
  );
});

const CleanserButton = memo(function CleanserButton() {
  const cleanserCount = useGameStore(s => s.cleanserCount);
  const isLassoMode = useGameStore(s => s.isLassoMode);
  const toggleLassoMode = useGameStore(s => s.toggleLassoMode);
  
  return (
    <button
      onClick={toggleLassoMode}
      disabled={cleanserCount <= 0 && !isLassoMode}
      className={`p-1 flex flex-col items-center transition-all
        ${isLassoMode 
          ? 'text-purple-400' 
          : cleanserCount > 0 
            ? 'hover:text-purple-400 cursor-pointer active:scale-90' 
            : 'opacity-40 cursor-not-allowed'
        }`}
      data-testid="button-cleanser"
    >
      <Wand2 size={14} className={`sm:w-4 sm:h-4 ${cleanserCount > 0 || isLassoMode ? 'text-purple-400' : 'text-muted-foreground'}`} />
      <span className="font-display text-[8px] sm:text-[10px]">{isLassoMode ? '!' : cleanserCount}</span>
    </button>
  );
});

const TimerDisplay = memo(function TimerDisplay() {
  const timeRemaining = useGameStore(s => s.timeRemaining);
  const isLowTime = timeRemaining <= 10;
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const secsFormatted = secs.toFixed(1).padStart(4, '0');
    return `${mins}:${secsFormatted}`;
  };

  return (
    <div className={`flex items-center gap-1 sm:gap-2 ${isLowTime ? 'text-destructive' : ''}`}>
      <Clock size={14} className={`sm:w-5 sm:h-5 ${isLowTime ? 'text-destructive' : 'text-primary'}`} />
      <span 
        className={`font-display text-sm sm:text-lg tabular-nums ${isLowTime ? 'text-destructive animate-pulse' : 'text-primary'}`} 
        data-testid="text-timer"
      >
        {formatTime(timeRemaining)}
      </span>
    </div>
  );
});

const LevelDisplay = memo(function LevelDisplay() {
  const currentLevel = useGameStore(s => s.currentLevel);
  const isEndlessMode = useGameStore(s => s.isEndlessMode);
  const endlessWave = useGameStore(s => s.endlessWave);
  
  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <Layers size={14} className={`sm:w-4 sm:h-4 ${isEndlessMode ? 'text-purple-400' : 'text-accent'}`} />
      <span className={`font-display text-[10px] sm:text-sm ${isEndlessMode ? 'text-purple-400' : 'text-accent'}`} data-testid="text-level">
        {isEndlessMode ? `W${endlessWave}` : `L${currentLevel}`}
      </span>
    </div>
  );
});

const NotificationBanner = memo(function NotificationBanner() {
  const notification = useGameStore(s => s.notification);
  if (!notification) return null;
  
  return (
    <div className="absolute top-1/3 left-1/2 z-50 animate-banner-in" data-testid="notification-banner">
      <div className="block-panel px-8 py-4 border-2 border-secondary shadow-[0_0_30px_rgba(249,233,0,0.4)]">
        <span className="font-display text-lg text-secondary text-glow">
          {notification}
        </span>
      </div>
    </div>
  );
});

const TargetingBanner = memo(function TargetingBanner() {
  const bombTargetingMode = useGameStore(s => s.bombTargetingMode);
  if (!bombTargetingMode) return null;
  
  return (
    <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 animate-slide-down" data-testid="targeting-mode-banner">
      <div className="block-panel px-6 py-2 border-2 border-destructive shadow-[0_0_20px_rgba(255,68,68,0.4)] bg-background/90">
        <span className="font-display text-sm text-destructive animate-pulse">
          CLICK TO DETONATE BOMB
        </span>
      </div>
    </div>
  );
});

const LassoBanner = memo(function LassoBanner() {
  const isLassoMode = useGameStore(s => s.isLassoMode);
  if (!isLassoMode) return null;
  
  return (
    <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 animate-slide-down" data-testid="lasso-mode-banner">
      <div className="block-panel px-6 py-2 border-2 border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.4)] bg-background/90">
        <span className="font-display text-sm text-purple-400 animate-pulse">
          DRAW TO CLEANSE BACTERIA
        </span>
      </div>
    </div>
  );
});

const KikMessage = memo(function KikMessage() {
  const kikMessage = useGameStore(s => s.kikMessage);
  if (!kikMessage) return null;
  
  return (
    <div className="absolute bottom-24 right-6 z-50 animate-slide-up" data-testid="kik-announcer">
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
  );
});

export const HUD = memo(function HUD() {
  return (
    <>
      <div className="absolute left-0 top-0 bottom-0 w-11 sm:w-20 bg-gradient-to-b from-muted/80 to-background/80 border-r border-primary/20 flex flex-col items-center py-1 sm:py-3 gap-1 sm:gap-3 z-30">
        <ScoreDisplay />
        <RemainingDisplay />
        <OnBoardDisplay />
        <div className="flex-1" />
        <div className="flex flex-col gap-0.5 sm:gap-1">
          <BombButton />
          <ShieldDisplay />
          <SecondChanceDisplay />
          <FreezeButton />
          <CleanserButton />
        </div>
      </div>

      <div className="absolute top-0 left-11 sm:left-20 right-0 h-9 sm:h-12 bg-gradient-to-r from-muted/80 to-background/80 border-b border-primary/20 flex items-center justify-between px-2 sm:px-3 z-30">
        <LevelDisplay />
        <TimerDisplay />
        <div className="w-8 sm:w-16" />
      </div>

      <NotificationBanner />
      <TargetingBanner />
      <LassoBanner />
      <KikMessage />
    </>
  );
});

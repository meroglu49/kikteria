import React from 'react';
import { useGameStore } from '../../lib/store';
import { Bomb, Target, Coins, Clock, Layers } from 'lucide-react';

export function HUD() {
  const { score, figuresPlaced, totalFigures, bombsRemaining, notification, useBomb, placedFigures, timeRemaining, currentLevel, currentLevelConfig } = useGameStore();

  const handleUseBomb = () => {
    useBomb();
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
      {/* Left sidebar - outside play area */}
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-b from-teal-100 to-cyan-100 border-r-4 border-teal-300 flex flex-col items-center py-4 gap-4 z-30">
        <div className="block-panel px-3 py-3 flex flex-col items-center gap-1">
          <Coins size={24} className="text-yellow-500" />
          <span className="font-display text-xs text-yellow-600" data-testid="text-score">
            {score}
          </span>
        </div>
        
        <div className="block-panel px-3 py-3 flex flex-col items-center gap-1">
          <Target size={24} className="text-teal-500" />
          <span className="font-display text-xl text-teal-600" data-testid="text-remaining">
            {Math.max(0, totalFigures - figuresPlaced)}
          </span>
          <span className="font-ui text-xs text-gray-500">LEFT</span>
        </div>
        
        <div className="block-panel px-3 py-3 flex flex-col items-center gap-1">
          <span className="font-ui text-sm text-gray-500">BOARD</span>
          <span className="font-display text-lg text-teal-600" data-testid="text-onboard">
            {placedFigures.length}
          </span>
        </div>
        
        <div className="flex-1" />
        
        <button
          onClick={handleUseBomb}
          disabled={bombsRemaining <= 0 || placedFigures.length === 0}
          className={`block-panel p-3 flex flex-col items-center gap-1 transition-all
            ${bombsRemaining > 0 && placedFigures.length > 0 
              ? 'hover:bg-red-100 hover:border-red-400 cursor-pointer' 
              : 'opacity-50 cursor-not-allowed'
            }`}
          data-testid="button-use-bomb"
        >
          <Bomb size={28} className={bombsRemaining > 0 ? 'text-red-500' : 'text-gray-400'} />
          <span className="font-display text-xs">{bombsRemaining}</span>
        </button>
      </div>

      {/* Top bar - timer and info */}
      <div className="absolute top-0 left-24 right-0 h-16 bg-gradient-to-r from-cyan-100 to-teal-100 border-b-4 border-teal-300 flex items-center justify-between px-4 z-30">
        <div className="block-panel px-4 py-2 flex items-center gap-2">
          <Layers size={20} className="text-purple-500" />
          <div className="flex flex-col">
            <span className="font-display text-xs text-purple-600" data-testid="text-level">
              LVL {currentLevel}
            </span>
            <span className="font-ui text-xs text-gray-500">
              {currentLevelConfig.name}
            </span>
          </div>
        </div>
        
        <div className={`block-panel px-6 py-2 flex items-center gap-3 ${isLowTime ? 'border-red-400 bg-red-50' : ''}`}>
          <Clock size={24} className={isLowTime ? 'text-red-500' : 'text-teal-500'} />
          <span 
            className={`font-display text-xl ${isLowTime ? 'text-red-500 animate-pulse' : 'text-teal-600'}`} 
            data-testid="text-timer"
          >
            {formatTime(timeRemaining)}
          </span>
        </div>
        
        <div className="w-32" />
      </div>

      {notification && (
        <div 
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50"
          data-testid="notification-banner"
        >
          <div className="block-panel px-8 py-4 border-4 border-yellow-400 bg-yellow-50">
            <span className="font-display text-lg text-yellow-600 text-shadow-pixel">
              {notification}
            </span>
          </div>
        </div>
      )}
    </>
  );
}

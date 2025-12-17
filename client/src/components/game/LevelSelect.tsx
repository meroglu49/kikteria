import { useEffect } from 'react';
import { useGameStore } from '../../lib/store';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock, Star, Trophy } from 'lucide-react';
import { LEVELS } from '../../lib/game-constants';
import { useLevelProgress, useCurrentUser } from '../../lib/api';

export function LevelSelect() {
  const { 
    setGameState, 
    selectLevel, 
    initializeGame, 
    startTimer, 
    maxUnlockedLevel,
    levelProgress,
    setLevelProgress 
  } = useGameStore();
  
  const { data: user } = useCurrentUser();
  const { data: progressData } = useLevelProgress();
  
  useEffect(() => {
    if (progressData && user) {
      const formattedProgress = progressData.map(p => ({
        levelNumber: p.levelNumber,
        bestScore: p.bestScore,
        isCompleted: p.isCompleted === 1,
      }));
      setLevelProgress(formattedProgress);
    }
  }, [progressData, user, setLevelProgress]);

  const handleLevelSelect = (levelNumber: number) => {
    if (levelNumber > maxUnlockedLevel) return;
    selectLevel(levelNumber);
    initializeGame();
    setGameState('PLAYING');
    startTimer();
  };

  const getLevelProgress = (levelNumber: number) => {
    return levelProgress.find(p => p.levelNumber === levelNumber);
  };

  return (
    <div className="absolute inset-0 bg-background flex items-center justify-center overflow-hidden scanlines crt-vignette">
      <div className="absolute inset-0 grid-bg opacity-30" />
      <div className="absolute inset-4 border-4 border-dashed border-primary/30 pointer-events-none" />

      <button
        onClick={() => setGameState('MENU')}
        className="absolute top-6 left-6 block-panel px-4 py-2 hover:bg-primary/20 transition-colors flex items-center gap-2 z-20"
        data-testid="button-back"
      >
        <ArrowLeft size={18} />
        <span className="font-ui text-lg">BACK</span>
      </button>

      <div className="relative z-10 w-full max-w-2xl px-6 flex flex-col items-center gap-8">
        <div className="text-center">
          <motion.h1 
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-3xl md:text-4xl font-display text-shadow-pixel"
            style={{
              color: '#4ADE80',
              textShadow: '3px 3px 0px #166534, 6px 6px 0px #000'
            }}
          >
            SELECT LEVEL
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="font-ui text-xl text-secondary tracking-widest mt-3"
          >
            Complete levels to unlock more!
          </motion.p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full">
          {LEVELS.map((level, index) => {
            const levelNumber = index + 1;
            const isUnlocked = levelNumber <= maxUnlockedLevel;
            const progress = getLevelProgress(levelNumber);
            const isCompleted = progress?.isCompleted;
            
            return (
              <motion.button
                key={level.level}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={isUnlocked ? { scale: 1.05 } : {}}
                whileTap={isUnlocked ? { scale: 0.98 } : {}}
                onClick={() => handleLevelSelect(levelNumber)}
                disabled={!isUnlocked}
                className={`
                  relative block-panel p-4 flex flex-col items-center gap-2 transition-all
                  ${isUnlocked 
                    ? 'hover:border-primary cursor-pointer' 
                    : 'opacity-50 cursor-not-allowed'
                  }
                  ${isCompleted ? 'border-primary' : ''}
                `}
                data-testid={`button-level-${levelNumber}`}
              >
                {!isUnlocked && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
                    <Lock size={32} className="text-foreground/60" />
                  </div>
                )}
                
                {isCompleted && (
                  <div className="absolute top-2 right-2">
                    <Star size={20} className="text-secondary fill-secondary" />
                  </div>
                )}

                <span className="font-display text-2xl text-primary">
                  {levelNumber}
                </span>
                <span className="font-ui text-sm text-foreground/80">
                  {level.name}
                </span>
                
                <div className="text-xs font-ui text-foreground/60 space-y-0.5">
                  <div>{level.figuresCount} figures</div>
                  <div>{level.startTime}s timer</div>
                </div>

                {progress && progress.bestScore > 0 && (
                  <div className="flex items-center gap-1 mt-1 text-secondary font-ui text-sm">
                    <Trophy size={14} />
                    <span>{progress.bestScore}</span>
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>

        {!user && (
          <div className="block-panel px-6 py-3 text-center">
            <p className="font-ui text-lg text-foreground/60">
              Log in to save your progress!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

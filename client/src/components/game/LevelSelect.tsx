import { useEffect } from 'react';
import { useGameStore } from '../../lib/store';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock, Star, Trophy } from 'lucide-react';
import { LEVELS } from '../../lib/game-constants';
import { useLevelProgress } from '../../lib/api';
import { useAuth } from '../../hooks/use-auth';
import { offlineStorage } from '../../lib/offline-storage';

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
  
  const { user } = useAuth();
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
    // Track metadata: level play event
    offlineStorage.trackLevelPlay(levelNumber);
  };

  const getLevelProgress = (levelNumber: number) => {
    return levelProgress.find(p => p.levelNumber === levelNumber);
  };

  return (
    <div className="min-h-screen overflow-y-auto bg-background scanlines crt-vignette scrollable-screen">
      <div className="fixed inset-0 grid-bg opacity-50 pointer-events-none" />

      <motion.button
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        onClick={() => setGameState('MENU')}
        className="fixed top-6 left-6 block-panel px-4 py-2 hover:border-primary transition-colors flex items-center gap-2 z-20"
        data-testid="button-back"
      >
        <ArrowLeft size={18} className="text-primary" />
        <span className="font-ui text-lg">BACK</span>
      </motion.button>

      <div className="relative z-10 w-full max-w-4xl mx-auto px-6 py-20 flex flex-col items-center gap-6">
        <div className="text-center">
          <motion.h1 
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-3xl md:text-4xl font-display"
            style={{
              color: '#22F2A2',
              textShadow: '0 0 10px #22F2A2, 0 0 20px #22F2A2, 3px 3px 0px #0a5c3a'
            }}
          >
            SELECT LEVEL
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="font-ui text-xl text-secondary text-glow tracking-widest mt-2"
          >
            Complete levels to unlock more!
          </motion.p>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 w-full pb-8">
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
                transition={{ delay: Math.min(index * 0.02, 0.5) }}
                whileHover={isUnlocked ? { scale: 1.05, y: -4 } : {}}
                whileTap={isUnlocked ? { scale: 0.98 } : {}}
                onClick={() => handleLevelSelect(levelNumber)}
                disabled={!isUnlocked}
                className={`
                  relative block-panel p-2 sm:p-3 flex flex-col items-center gap-1 transition-all rounded-lg
                  ${isUnlocked 
                    ? 'hover:border-primary cursor-pointer' 
                    : 'opacity-40 cursor-not-allowed'
                  }
                  ${isCompleted ? 'border-primary shadow-[0_0_15px_rgba(34,242,162,0.3)]' : ''}
                  ${level.isMilestone ? 'ring-2 ring-secondary/50' : ''}
                `}
                data-testid={`button-level-${levelNumber}`}
              >
                {!isUnlocked && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10 rounded-lg">
                    <Lock size={20} className="text-muted-foreground" />
                  </div>
                )}
                
                {isCompleted && (
                  <div className="absolute top-1 right-1">
                    <Star size={14} className="text-secondary fill-secondary drop-shadow-[0_0_6px_rgba(249,233,0,0.5)]" />
                  </div>
                )}

                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center ${isCompleted ? 'bg-primary/20' : 'bg-muted'}`}>
                  <span className={`font-display text-base sm:text-lg ${isCompleted ? 'text-primary text-glow' : 'text-foreground'}`}>
                    {levelNumber}
                  </span>
                </div>
                <span className="font-ui text-xs sm:text-sm text-foreground/80 text-center leading-tight line-clamp-1">
                  {level.name}
                </span>

                {progress && progress.bestScore > 0 && (
                  <div className="flex items-center gap-1 text-secondary font-ui text-xs">
                    <Trophy size={10} />
                    <span>{progress.bestScore}</span>
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>

        {!user && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="block-panel px-6 py-3 text-center"
          >
            <p className="font-ui text-lg text-muted-foreground">
              Sign in to save your progress!
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}

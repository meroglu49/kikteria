import React, { useState, useCallback } from 'react';
import { useGameStore } from '../../lib/store';
import { motion } from 'framer-motion';
import { Play, ShoppingBag, Trophy, LogIn, LogOut, User, Zap, Coins, BookOpen, Bug, Infinity, Calendar, Users, Award } from 'lucide-react';
import { usePlayerProfile } from '../../lib/api';
import { useAuth } from '../../hooks/use-auth';
import { Leaderboard } from './Leaderboard';
import { DailyLabOrders } from './DailyLabOrders';
import { WeeklyGoals } from './WeeklyGoals';
import { AchievementBoard } from './AchievementBoard';
import { offlineStorage } from '../../lib/offline-storage';

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
};

export function MainMenu() {
  const { setGameState, highScore, maxUnlockedLevel, selectLevel, initializeGame, startTimer } = useGameStore();
  const { user, login, logout } = useAuth();
  const { data: profile } = usePlayerProfile();
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showDailyOrders, setShowDailyOrders] = useState(false);
  const [showWeeklyGoals, setShowWeeklyGoals] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);

  const displayName = user?.firstName || user?.email?.split('@')[0] || 'Player';

  const handleQuickStart = useCallback(() => {
    selectLevel(maxUnlockedLevel);
    initializeGame();
    startTimer();
    setGameState('PLAYING');
    offlineStorage.trackLevelPlay(maxUnlockedLevel);
  }, [selectLevel, maxUnlockedLevel, initializeGame, startTimer, setGameState]);

  return (
    <div className="min-h-screen overflow-y-auto bg-background flex flex-col items-center scanlines crt-vignette pb-8 scrollable-screen">
      <div className="fixed inset-0 grid-bg opacity-50 pointer-events-none" />
      
      <div className="sticky top-0 w-full flex justify-end p-4 z-20 bg-background/80 backdrop-blur-sm">
        {user ? (
          <>
            <div className="flex items-center gap-3 block-panel px-4 py-2" data-testid="text-user-info">
              {user.profileImageUrl ? (
                <img src={user.profileImageUrl} alt="" className="w-8 h-8 rounded-full border-2 border-primary" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center">
                  <User size={16} className="text-primary" />
                </div>
              )}
              <span className="font-ui text-xl text-foreground">{displayName}</span>
              {profile && (
                <div className="flex items-center gap-1 coin-display font-ui text-xl">
                  <Coins size={18} />
                  <span>{profile.coins}</span>
                </div>
              )}
            </div>
            <button
              onClick={logout}
              className="block-panel px-3 py-2 hover:border-destructive transition-colors flex items-center gap-2 active:scale-95"
              data-testid="button-logout"
            >
              <LogOut size={18} className="text-destructive" />
            </button>
          </>
        ) : (
          <button
            onClick={login}
            className="pixel-btn px-5 py-2 flex items-center gap-2"
            data-testid="button-login"
          >
            <LogIn size={18} />
            <span className="text-xs">SIGN IN</span>
          </button>
        )}
      </div>

      <motion.div 
        className="relative z-10 w-full max-w-md px-4 flex flex-col items-center gap-4 mt-2"
        variants={stagger}
        initial="initial"
        animate="animate"
      >
        <motion.div className="text-center" variants={fadeUp}>
          <h1 
            className="text-3xl sm:text-4xl md:text-5xl font-display animate-neon-flicker"
            style={{
              color: '#22F2A2',
              textShadow: '0 0 10px #22F2A2, 0 0 20px #22F2A2, 0 0 40px #22F2A2, 4px 4px 0px #0a5c3a'
            }}
          >
            KIKTERIA
          </h1>
          <p className="font-ui text-lg sm:text-xl text-secondary tracking-widest mt-1 text-glow">
            BACTERIA PUZZLE
          </p>
        </motion.div>

        <motion.div variants={fadeUp} className="w-24 h-24 sm:w-32 sm:h-32 relative">
          <div className="absolute inset-0 rounded-full bg-primary/10 border-4 border-primary/50 animate-glow-pulse" />
          <div className="absolute inset-4 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 animate-float" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl sm:text-6xl animate-float drop-shadow-[0_0_20px_rgba(34,242,162,0.5)]">🦠</span>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="w-full">
          <button
            onClick={handleQuickStart}
            className="w-full py-3 pixel-btn text-base flex items-center justify-center gap-2 animate-glow-pulse"
            data-testid="button-start"
          >
            <Zap size={20} fill="currentColor" />
            <span>START LEVEL {maxUnlockedLevel}</span>
          </button>
        </motion.div>

        <motion.div variants={fadeUp} className="w-full">
          <button
            onClick={() => useGameStore.getState().setGameState('ENDLESS_MODE')}
            className="w-full py-2 block-panel text-sm flex items-center justify-center gap-2 hover:border-purple-400 transition-colors font-display active:scale-[0.98]"
            data-testid="button-endless"
          >
            <Infinity size={18} className="text-purple-400" />
            <span>ENDLESS MODE</span>
          </button>
        </motion.div>

        <motion.div variants={fadeUp} className="flex gap-2 w-full">
          <button
            onClick={() => useGameStore.getState().setGameState('SHOP')}
            className="flex-1 py-3 pixel-btn-secondary flex flex-col items-center gap-1"
            data-testid="button-shop"
          >
            <ShoppingBag size={20} />
            <span className="text-xs font-display">SHOP</span>
          </button>
          <button
            onClick={() => setShowLeaderboard(true)}
            className="flex-1 py-3 pixel-btn-accent flex flex-col items-center gap-1"
            data-testid="button-leaderboard"
          >
            <Trophy size={20} />
            <span className="text-xs font-display">RANKS</span>
          </button>
        </motion.div>
        
        <motion.div variants={fadeUp} className="flex gap-2 w-full">
          <button
            onClick={() => useGameStore.getState().setGameState('CHRONICLES')}
            className="flex-1 py-2 block-panel flex flex-col items-center gap-1 hover:border-cyan-400 transition-colors active:scale-[0.97]"
            data-testid="button-chronicles"
          >
            <BookOpen size={18} className="text-cyan-400" />
            <span className="text-xs font-display text-cyan-400">STORY</span>
          </button>
          <button
            onClick={() => useGameStore.getState().setGameState('CODEX')}
            className="flex-1 py-2 block-panel flex flex-col items-center gap-1 hover:border-pink-400 transition-colors active:scale-[0.97]"
            data-testid="button-codex"
          >
            <Bug size={18} className="text-pink-400" />
            <span className="text-xs font-display text-pink-400">CODEX</span>
          </button>
          <button
            onClick={() => setGameState('LEVEL_SELECT')}
            className="flex-1 py-2 block-panel flex flex-col items-center gap-1 hover:border-primary transition-colors active:scale-[0.97]"
            data-testid="button-level-select"
          >
            <Play size={18} className="text-primary" />
            <span className="text-xs font-display text-primary">LEVELS</span>
          </button>
        </motion.div>

        <motion.div variants={fadeUp} className="flex gap-2 w-full">
          <button
            onClick={() => setShowDailyOrders(true)}
            className="flex-1 py-2 block-panel flex flex-col items-center gap-1 hover:border-orange-400 transition-colors active:scale-[0.97]"
            data-testid="button-daily"
          >
            <Calendar size={16} className="text-orange-400" />
            <span className="text-xs font-display text-orange-400">DAILY</span>
          </button>
          <button
            onClick={() => setShowWeeklyGoals(true)}
            className="flex-1 py-2 block-panel flex flex-col items-center gap-1 hover:border-cyan-400 transition-colors active:scale-[0.97]"
            data-testid="button-weekly"
          >
            <Users size={16} className="text-cyan-400" />
            <span className="text-xs font-display text-cyan-400">GOALS</span>
          </button>
          <button
            onClick={() => setShowAchievements(true)}
            className="flex-1 py-2 block-panel flex flex-col items-center gap-1 hover:border-yellow-400 transition-colors active:scale-[0.97]"
            data-testid="button-achievements"
          >
            <Award size={16} className="text-yellow-400" />
            <span className="text-xs font-display text-yellow-400">BADGES</span>
          </button>
        </motion.div>

        <motion.div variants={fadeUp} className="block-panel px-4 py-2 text-center w-full">
          <p className="font-ui text-base text-primary">HOW TO PLAY</p>
          <p className="font-ui text-sm text-foreground/70">
            Click to place bacteria. Don't let them touch!
          </p>
        </motion.div>

        <motion.div variants={fadeUp} className="flex gap-4 font-ui text-base">
          <div className="text-muted-foreground">
            HIGH SCORE: <span className="text-secondary text-glow" data-testid="text-highscore">{profile?.highScore || highScore}</span>
          </div>
          <div className="text-muted-foreground">v10</div>
        </motion.div>
      </motion.div>

      <Leaderboard open={showLeaderboard} onClose={() => setShowLeaderboard(false)} />
      <DailyLabOrders open={showDailyOrders} onClose={() => setShowDailyOrders(false)} />
      <WeeklyGoals open={showWeeklyGoals} onClose={() => setShowWeeklyGoals(false)} />
      <AchievementBoard open={showAchievements} onClose={() => setShowAchievements(false)} />
    </div>
  );
}

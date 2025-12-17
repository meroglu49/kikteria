import React, { useState } from 'react';
import { useGameStore } from '../../lib/store';
import { motion } from 'framer-motion';
import { Play, ShoppingBag, Award, LogIn, LogOut, User, Zap } from 'lucide-react';
import { useCurrentUser, useLogout, usePlayerProfile } from '../../lib/api';
import { AuthModal } from './AuthModal';
import { Leaderboard } from './Leaderboard';

export function MainMenu() {
  const { setGameState, highScore, maxUnlockedLevel, selectLevel, initializeGame, startTimer } = useGameStore();
  const { data: user } = useCurrentUser();
  const { data: profile } = usePlayerProfile();
  const logoutMutation = useLogout();
  const [showAuth, setShowAuth] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
  };

  const handleQuickStart = () => {
    selectLevel(maxUnlockedLevel);
    initializeGame();
    startTimer();
    setGameState('PLAYING');
  };

  return (
    <div className="absolute inset-0 bg-background flex items-center justify-center overflow-hidden scanlines crt-vignette">
      <div className="absolute inset-0 grid-bg opacity-30" />
      <div className="absolute inset-4 border-4 border-dashed border-primary/30 pointer-events-none" />

      <div className="absolute top-6 right-6 flex items-center gap-4 z-20">
        {user ? (
          <>
            <div className="flex items-center gap-3 block-panel px-4 py-2" data-testid="text-user-info">
              <User size={20} className="text-secondary" />
              <span className="font-ui text-xl">{user.username}</span>
              {profile && (
                <span className="text-secondary font-ui text-xl">
                  {profile.coins} G
                </span>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="block-panel px-4 py-2 hover:bg-destructive/20 transition-colors flex items-center gap-2"
              data-testid="button-logout"
            >
              <LogOut size={18} />
              <span className="font-ui text-lg">EXIT</span>
            </button>
          </>
        ) : (
          <button
            onClick={() => setShowAuth(true)}
            className="pixel-btn px-6 py-3 flex items-center gap-3"
            data-testid="button-login"
          >
            <LogIn size={20} />
            <span className="text-sm">LOGIN</span>
          </button>
        )}
      </div>

      <div className="relative z-10 w-full max-w-lg px-6 flex flex-col items-center gap-8">
        <div className="text-center">
          <motion.h1 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-4xl md:text-5xl font-display text-shadow-pixel"
            style={{
              color: '#4ADE80',
              textShadow: '4px 4px 0px #166534, 8px 8px 0px #000'
            }}
          >
            KIKTERIA
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="font-ui text-2xl text-secondary tracking-widest mt-4"
          >
            ★ BACTERIA PUZZLE ★
          </motion.p>
        </div>

        <div className="w-48 h-48 relative">
          <div 
            className="absolute inset-0 bg-primary/20 border-4 border-primary"
            style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
          />
          <div className="absolute inset-4 bg-gradient-to-b from-primary to-accent opacity-60 animate-float"
            style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-6xl animate-float">🦠</span>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleQuickStart}
          className="w-full py-5 pixel-btn text-xl flex items-center justify-center gap-4 animate-pulse-scale"
          data-testid="button-start"
        >
          <Zap size={28} fill="currentColor" />
          START (LEVEL {maxUnlockedLevel})
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setGameState('LEVEL_SELECT')}
          className="w-full py-4 block-panel text-lg flex items-center justify-center gap-4 hover:bg-primary/20 transition-colors font-display"
          data-testid="button-level-select"
        >
          <Play size={24} />
          SELECT LEVEL
        </motion.button>

        <div className="flex gap-4 w-full">
          <MenuButton 
            icon={<ShoppingBag size={24} />} 
            label="SHOP" 
            color="bg-secondary" 
            onClick={() => useGameStore.getState().setGameState('SHOP')}
            dataTestId="button-shop"
          />
          <MenuButton 
            icon={<Award size={24} />} 
            label="RANKS" 
            color="bg-accent" 
            onClick={() => setShowLeaderboard(true)}
            dataTestId="button-leaderboard"
          />
        </div>

        <div className="block-panel px-6 py-3 text-center">
          <p className="font-ui text-lg text-foreground/60 mb-2">HOW TO PLAY</p>
          <p className="font-ui text-xl text-foreground/80">
            Click to place bacteria. Don't let them touch each other!
          </p>
        </div>

        <div className="flex gap-8 font-ui text-xl text-foreground/60">
          <div>HIGH SCORE: <span className="text-secondary" data-testid="text-highscore">{profile?.highScore || highScore}</span></div>
          <div>VER 1.0</div>
        </div>
      </div>

      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />
      <Leaderboard open={showLeaderboard} onClose={() => setShowLeaderboard(false)} />
    </div>
  );
}

function MenuButton({ 
  icon, 
  label, 
  color, 
  onClick,
  dataTestId 
}: { 
  icon: React.ReactNode; 
  label: string; 
  color: string; 
  onClick?: () => void;
  dataTestId?: string;
}) {
  return (
    <motion.button
      whileHover={{ y: -4 }}
      onClick={onClick}
      className="flex-1 block-panel p-4 flex flex-col items-center gap-3 hover:border-primary transition-colors"
      data-testid={dataTestId}
    >
      <span className={`${color} p-3 text-black`}>{icon}</span>
      <span className="font-display text-xs">{label}</span>
    </motion.button>
  );
}

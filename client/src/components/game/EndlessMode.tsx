import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, Infinity, Trophy, Zap, Skull } from 'lucide-react';
import { useGameStore } from '../../lib/store';
import { BOSS_BACTERIA } from '../../lib/game-constants';

export function EndlessMode() {
  const { setGameState, startEndlessMode, endlessHighScore, endlessBestWave, coins } = useGameStore();

  return (
    <div className="min-h-screen overflow-y-auto bg-background flex flex-col items-center p-4 scanlines crt-vignette scrollable-screen">
      <div className="fixed inset-0 grid-bg opacity-50 pointer-events-none" />
      
      <div className="w-full max-w-lg flex justify-between items-center mb-6 relative z-10">
        <motion.button 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          onClick={() => setGameState('MENU')}
          className="block-panel p-2 hover:border-primary transition-colors"
          data-testid="button-back"
        >
          <ArrowLeft className="text-primary" size={20} />
        </motion.button>
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center gap-2"
        >
          <Infinity className="text-purple-400" size={28} />
          <h1 
            className="text-xl font-display"
            style={{
              color: '#A855F7',
              textShadow: '0 0 10px #A855F7, 0 0 20px #A855F7'
            }}
          >
            CONTAINMENT NEXUS
          </h1>
        </motion.div>
        <div className="w-10" />
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center mb-6 relative z-10"
      >
        <p className="font-ui text-muted-foreground max-w-md">
          Survive endless waves of mutating bacteria. How long can you maintain containment?
        </p>
      </motion.div>

      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="block-panel p-6 mb-6 w-full max-w-md relative z-10"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="text-secondary" size={20} />
            <span className="font-ui text-muted-foreground">Best Wave:</span>
          </div>
          <span className="font-display text-xl text-secondary">{endlessBestWave}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="text-primary" size={20} />
            <span className="font-ui text-muted-foreground">High Score:</span>
          </div>
          <span className="font-display text-xl text-primary">{endlessHighScore}</span>
        </div>
      </motion.div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="w-full max-w-md mb-6 relative z-10"
      >
        <h3 className="font-display text-sm text-muted-foreground mb-3 flex items-center gap-2">
          <Skull size={16} className="text-red-400" />
          BOSS ENCOUNTERS
        </h3>
        <div className="space-y-2">
          {BOSS_BACTERIA.map((boss, index) => (
            <motion.div
              key={boss.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className="block-panel p-3 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-full bg-red-500/20 border-2 border-red-500/50 flex items-center justify-center">
                <span className="text-lg">👹</span>
              </div>
              <div className="flex-1">
                <div className="font-display text-sm text-red-400">{boss.name}</div>
                <div className="font-ui text-xs text-muted-foreground">{boss.title}</div>
              </div>
              <div className="text-xs text-muted-foreground">Wave {(index + 1) * 5}+</div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.button
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={startEndlessMode}
        className="w-full max-w-md py-4 pixel-btn text-lg flex items-center justify-center gap-3 relative z-10"
        style={{
          background: 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)',
          boxShadow: '0 0 20px rgba(168, 85, 247, 0.5)'
        }}
        data-testid="button-start-endless"
      >
        <Play size={24} fill="currentColor" />
        <span>ENTER THE NEXUS</span>
      </motion.button>

      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mt-4 font-ui text-xs text-muted-foreground text-center relative z-10"
      >
        Mutations occur every 3 waves. Boss bacteria appear every 5 waves.
      </motion.p>
    </div>
  );
}

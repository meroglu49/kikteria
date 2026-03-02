import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, Infinity, Trophy, Zap, Skull } from 'lucide-react';
import { useGameStore } from '../../lib/store';
import { BOSS_BACTERIA } from '../../lib/game-constants';

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
};

export function EndlessMode() {
  const { setGameState, startEndlessMode, endlessHighScore, endlessBestWave } = useGameStore();

  return (
    <div className="min-h-screen overflow-y-auto bg-background flex flex-col items-center p-4 scanlines crt-vignette scrollable-screen">
      <div className="fixed inset-0 grid-bg opacity-50 pointer-events-none" />
      
      <div className="w-full max-w-lg flex justify-between items-center mb-6 relative z-10">
        <button 
          onClick={() => setGameState('MENU')}
          className="block-panel p-2 hover:border-primary transition-colors active:scale-95"
          data-testid="button-back"
        >
          <ArrowLeft className="text-primary" size={20} />
        </button>
        <div className="flex items-center gap-2">
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
        </div>
        <div className="w-10" />
      </div>

      <motion.div 
        className="w-full max-w-md relative z-10 flex flex-col items-center gap-6"
        variants={stagger}
        initial="initial"
        animate="animate"
      >
        <motion.div variants={fadeUp} className="text-center">
          <p className="font-ui text-muted-foreground max-w-md">
            Survive endless waves of mutating bacteria. How long can you maintain containment?
          </p>
        </motion.div>

        <motion.div variants={fadeUp} className="block-panel p-6 w-full">
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

        <motion.div variants={fadeUp} className="w-full">
          <h3 className="font-display text-sm text-muted-foreground mb-3 flex items-center gap-2">
            <Skull size={16} className="text-red-400" />
            BOSS ENCOUNTERS
          </h3>
          <div className="space-y-2">
            {BOSS_BACTERIA.map((boss, index) => (
              <motion.div
                key={boss.id}
                variants={fadeUp}
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

        <motion.div variants={fadeUp} className="w-full">
          <button
            onClick={startEndlessMode}
            className="w-full py-4 pixel-btn text-lg flex items-center justify-center gap-3"
            style={{
              background: 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)',
              boxShadow: '0 0 20px rgba(168, 85, 247, 0.5)'
            }}
            data-testid="button-start-endless"
          >
            <Play size={24} fill="currentColor" />
            <span>ENTER THE NEXUS</span>
          </button>
        </motion.div>

        <motion.p variants={fadeUp} className="font-ui text-xs text-muted-foreground text-center">
          Mutations occur every 3 waves. Boss bacteria appear every 5 waves.
        </motion.p>
      </motion.div>
    </div>
  );
}

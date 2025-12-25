import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock, BookOpen, FileText } from 'lucide-react';
import { useGameStore } from '../../lib/store';
import { LAB_CHRONICLES } from '../../lib/game-constants';

export function LabChronicles() {
  const { setGameState, maxUnlockedLevel } = useGameStore();
  const [selectedLog, setSelectedLog] = React.useState<number | null>(null);

  const unlockedChronicles = LAB_CHRONICLES.filter(c => c.level <= maxUnlockedLevel);

  return (
    <div className="min-h-screen overflow-y-auto bg-background flex flex-col items-center p-4 scanlines crt-vignette scrollable-screen">
      <div className="fixed inset-0 grid-bg opacity-50 pointer-events-none" />
      
      <div className="w-full max-w-2xl flex justify-between items-center mb-6 relative z-10 sticky top-0 bg-background/80 backdrop-blur-sm py-2">
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
          <BookOpen className="text-cyan-400" size={24} />
          <h1 
            className="text-xl font-display"
            style={{
              color: '#22F2A2',
              textShadow: '0 0 10px #22F2A2, 0 0 20px #22F2A2'
            }}
          >
            LAB CHRONICLES
          </h1>
        </motion.div>
        <div className="w-10" />
      </div>

      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center text-muted-foreground font-ui mb-6 max-w-lg relative z-10"
      >
        Classified holo-logs from Dr. Lyra Voss documenting the Kikteria containment effort
      </motion.p>

      {selectedLog === null ? (
        <div className="w-full max-w-2xl grid grid-cols-1 gap-3 relative z-10 pb-4">
          {LAB_CHRONICLES.map((chronicle, index) => {
            const isUnlocked = chronicle.level <= maxUnlockedLevel;
            
            return (
              <motion.button
                key={chronicle.level}
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={isUnlocked ? { scale: 1.01 } : {}}
                onClick={() => isUnlocked && setSelectedLog(chronicle.level)}
                disabled={!isUnlocked}
                className={`block-panel p-4 text-left relative overflow-hidden transition-all
                  ${isUnlocked 
                    ? 'hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] cursor-pointer' 
                    : 'opacity-50 cursor-not-allowed'
                  }`}
                data-testid={`chronicle-${chronicle.level}`}
              >
                <div className="flex items-center gap-4">
                  <div 
                    className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0
                      ${isUnlocked ? 'bg-cyan-500/20 border border-cyan-500/50' : 'bg-muted border border-border'}`}
                    style={isUnlocked ? { boxShadow: '0 0 15px rgba(6,182,212,0.3)' } : {}}
                  >
                    {isUnlocked ? (
                      <FileText size={24} className="text-cyan-400" />
                    ) : (
                      <Lock size={24} className="text-muted-foreground" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="font-display text-sm text-foreground">
                        {isUnlocked ? chronicle.title : '???'}
                      </h3>
                      <span className="font-ui text-xs text-muted-foreground">
                        LOG #{chronicle.level}
                      </span>
                    </div>
                    <p className="font-ui text-sm text-muted-foreground">
                      {isUnlocked ? chronicle.date : 'Complete level to unlock'}
                    </p>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl relative z-10 pb-4"
        >
          {(() => {
            const chronicle = LAB_CHRONICLES.find(c => c.level === selectedLog);
            if (!chronicle) return null;
            
            return (
              <div className="block-panel p-6 border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center">
                      <FileText size={20} className="text-cyan-400" />
                    </div>
                    <div>
                      <h2 className="font-display text-lg text-cyan-400" style={{ textShadow: '0 0 10px rgba(6,182,212,0.5)' }}>
                        {chronicle.title}
                      </h2>
                      <p className="font-ui text-xs text-muted-foreground">{chronicle.date}</p>
                    </div>
                  </div>
                  <span className="font-display text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                    LOG #{chronicle.level}
                  </span>
                </div>
                
                <div className="bg-muted/50 rounded-lg p-4 mb-4 border border-border">
                  <p className="font-ui text-sm text-foreground leading-relaxed whitespace-pre-line">
                    {chronicle.content}
                  </p>
                </div>
                
                <p className="font-ui text-xs text-cyan-400 italic text-right">
                  — {chronicle.signature}
                </p>
                
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setSelectedLog(null)}
                    className="flex-1 py-3 block-panel font-display text-sm hover:border-primary transition-colors"
                    data-testid="button-back-to-list"
                  >
                    BACK TO LOGS
                  </button>
                  {selectedLog < LAB_CHRONICLES.length && selectedLog < maxUnlockedLevel && (
                    <button
                      onClick={() => setSelectedLog(selectedLog + 1)}
                      className="flex-1 py-3 pixel-btn font-display text-sm"
                      data-testid="button-next-log"
                    >
                      NEXT LOG →
                    </button>
                  )}
                </div>
              </div>
            );
          })()}
        </motion.div>
      )}
    </div>
  );
}

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Bug, AlertTriangle, Heart, Zap, Users } from 'lucide-react';
import { useGameStore } from '../../lib/store';
import { BACTERIA_DOSSIERS, BACTERIA_TEMPLATES } from '../../lib/game-constants';

export function BacteriaCodex() {
  const { setGameState } = useGameStore();
  const [selectedBacteria, setSelectedBacteria] = React.useState<string | null>(null);

  const getDangerColor = (level: number) => {
    switch (level) {
      case 1: return 'text-green-400';
      case 2: return 'text-yellow-400';
      case 3: return 'text-orange-400';
      case 4: return 'text-red-400';
      case 5: return 'text-purple-400';
      default: return 'text-muted-foreground';
    }
  };

  const getDangerBg = (level: number) => {
    switch (level) {
      case 1: return 'bg-green-500/20 border-green-500/50';
      case 2: return 'bg-yellow-500/20 border-yellow-500/50';
      case 3: return 'bg-orange-500/20 border-orange-500/50';
      case 4: return 'bg-red-500/20 border-red-500/50';
      case 5: return 'bg-purple-500/20 border-purple-500/50';
      default: return 'bg-muted border-border';
    }
  };

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
          <Bug className="text-pink-400" size={24} />
          <h1 
            className="text-xl font-display"
            style={{
              color: '#FF6AD5',
              textShadow: '0 0 10px #FF6AD5, 0 0 20px #FF6AD5'
            }}
          >
            BACTERIA CODEX
          </h1>
        </motion.div>
        <div className="w-10" />
      </div>

      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center text-muted-foreground font-ui mb-6 max-w-lg relative z-10"
      >
        Classified dossiers on all known Kikteria specimens
      </motion.p>

      {selectedBacteria === null ? (
        <div className="w-full max-w-2xl grid grid-cols-2 gap-3 relative z-10 pb-4">
          {BACTERIA_DOSSIERS.map((dossier, index) => {
            const template = BACTERIA_TEMPLATES.find(t => t.id === dossier.id);
            const mainColor = template?.shapes[0]?.color || '#888';
            
            return (
              <motion.button
                key={dossier.id}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => setSelectedBacteria(dossier.id)}
                className="block-panel p-4 text-left hover:border-pink-400 hover:shadow-[0_0_15px_rgba(255,106,213,0.3)] transition-all cursor-pointer"
                data-testid={`codex-${dossier.id}`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-2xl"
                    style={{ 
                      backgroundColor: mainColor + '30',
                      border: `2px solid ${mainColor}`,
                      boxShadow: `0 0 10px ${mainColor}40`
                    }}
                  >
                    🦠
                  </div>
                  <div>
                    <h3 className="font-display text-sm" style={{ color: mainColor }}>
                      {dossier.name}
                    </h3>
                    <p className="font-ui text-xs text-muted-foreground italic">
                      {dossier.classification}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-ui text-xs text-muted-foreground">
                    {dossier.personality.split(',')[0]}
                  </span>
                  <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs ${getDangerBg(dossier.dangerLevel)}`}>
                    <AlertTriangle size={12} className={getDangerColor(dossier.dangerLevel)} />
                    <span className={getDangerColor(dossier.dangerLevel)}>LV.{dossier.dangerLevel}</span>
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
            const dossier = BACTERIA_DOSSIERS.find(d => d.id === selectedBacteria);
            const template = BACTERIA_TEMPLATES.find(t => t.id === selectedBacteria);
            if (!dossier || !template) return null;
            const mainColor = template.shapes[0]?.color || '#888';
            
            return (
              <div 
                className="block-panel p-6 border-pink-500/30 shadow-[0_0_20px_rgba(255,106,213,0.2)]"
              >
                <div className="flex items-start gap-4 mb-6">
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center text-4xl flex-shrink-0"
                    style={{ 
                      backgroundColor: mainColor + '30',
                      border: `3px solid ${mainColor}`,
                      boxShadow: `0 0 20px ${mainColor}50`
                    }}
                  >
                    🦠
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h2 className="font-display text-2xl" style={{ color: mainColor, textShadow: `0 0 10px ${mainColor}50` }}>
                        {dossier.name}
                      </h2>
                      <div className={`flex items-center gap-1 px-3 py-1 rounded border ${getDangerBg(dossier.dangerLevel)}`}>
                        <AlertTriangle size={14} className={getDangerColor(dossier.dangerLevel)} />
                        <span className={`font-display text-sm ${getDangerColor(dossier.dangerLevel)}`}>
                          DANGER LV.{dossier.dangerLevel}
                        </span>
                      </div>
                    </div>
                    <p className="font-ui text-sm text-pink-400 italic mb-2">{dossier.classification}</p>
                    <p className="font-ui text-sm text-muted-foreground">{dossier.personality}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-muted/50 rounded-lg p-4 border border-border">
                    <h3 className="font-display text-xs text-pink-400 mb-2 flex items-center gap-2">
                      <Bug size={14} /> BACKSTORY
                    </h3>
                    <p className="font-ui text-sm text-foreground leading-relaxed">
                      {dossier.backstory}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-muted/50 rounded-lg p-3 border border-border">
                      <h3 className="font-display text-xs text-yellow-400 mb-1 flex items-center gap-2">
                        <Zap size={12} /> QUIRK
                      </h3>
                      <p className="font-ui text-xs text-foreground">{dossier.quirk}</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3 border border-border">
                      <h3 className="font-display text-xs text-red-400 mb-1 flex items-center gap-2">
                        <Users size={12} /> RIVAL
                      </h3>
                      <p className="font-ui text-xs text-foreground">{dossier.rival}</p>
                    </div>
                  </div>
                  
                  <div className="bg-muted/50 rounded-lg p-3 border border-border">
                    <h3 className="font-display text-xs text-green-400 mb-1 flex items-center gap-2">
                      <Heart size={12} /> FAVORITE ACTIVITY
                    </h3>
                    <p className="font-ui text-xs text-foreground">{dossier.favoriteActivity}</p>
                  </div>
                </div>
                
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setSelectedBacteria(null)}
                    className="flex-1 py-3 block-panel font-display text-sm hover:border-primary transition-colors"
                    data-testid="button-back-to-list"
                  >
                    BACK TO CODEX
                  </button>
                  {(() => {
                    const currentIndex = BACTERIA_DOSSIERS.findIndex(d => d.id === selectedBacteria);
                    const nextDossier = BACTERIA_DOSSIERS[currentIndex + 1];
                    if (nextDossier) {
                      return (
                        <button
                          onClick={() => setSelectedBacteria(nextDossier.id)}
                          className="flex-1 py-3 pixel-btn font-display text-sm"
                          data-testid="button-next-entry"
                        >
                          NEXT ENTRY →
                        </button>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
            );
          })()}
        </motion.div>
      )}
    </div>
  );
}

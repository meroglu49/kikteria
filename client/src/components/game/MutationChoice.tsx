import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Clock, Zap, Shield } from 'lucide-react';
import { useGameStore } from '../../lib/store';

export function MutationChoice() {
  const { activeMutation, applyCountermeasure, timeRemaining } = useGameStore();

  if (!activeMutation) return null;

  const getSeverityColor = (severity: number) => {
    switch (severity) {
      case 1: return 'text-yellow-400 border-yellow-400';
      case 2: return 'text-orange-400 border-orange-400';
      case 3: return 'text-red-400 border-red-400';
      default: return 'text-primary border-primary';
    }
  };

  return (
    <div className="absolute inset-0 bg-background/95 flex items-center justify-center z-50 scanlines">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md p-6"
      >
        <motion.div 
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          className="text-center mb-6"
        >
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 ${getSeverityColor(activeMutation.severity)} bg-background`}>
            <AlertTriangle className="animate-pulse" size={24} />
            <span className="font-display text-lg">MUTATION DETECTED</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="block-panel p-4 mb-6"
        >
          <h2 
            className="font-display text-xl mb-2"
            style={{
              color: '#FF6AD5',
              textShadow: '0 0 10px #FF6AD5'
            }}
          >
            {activeMutation.name}
          </h2>
          <p className="font-ui text-foreground/80 mb-4">
            {activeMutation.description}
          </p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock size={16} />
            <span>Time remaining: {timeRemaining.toFixed(0)}s</span>
          </div>
        </motion.div>

        <div className="space-y-3">
          <p className="font-ui text-sm text-center text-muted-foreground mb-2">
            Choose your countermeasure:
          </p>
          
          {activeMutation.countermeasures.map((countermeasure, index) => (
            <motion.button
              key={countermeasure.id}
              initial={{ x: -30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => applyCountermeasure(countermeasure.id, countermeasure.cost)}
              className="w-full block-panel p-4 text-left hover:border-primary transition-all"
              data-testid={`countermeasure-${countermeasure.id}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {countermeasure.effect === 'nullify' && <Shield size={18} className="text-cyan-400" />}
                    {countermeasure.effect === 'reduce' && <Zap size={18} className="text-yellow-400" />}
                    {countermeasure.effect === 'reverse' && <Zap size={18} className="text-green-400" />}
                    <span className="font-display text-foreground">{countermeasure.name}</span>
                  </div>
                  <p className="font-ui text-sm text-muted-foreground">
                    {countermeasure.description}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-destructive font-display">
                  <Clock size={14} />
                  <span>-{countermeasure.cost}s</span>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

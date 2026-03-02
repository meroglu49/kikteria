import React from 'react';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { MASTERY_GOALS, LevelCompletionStats } from '../../lib/game-constants';

interface LevelMasteryProps {
  stats: LevelCompletionStats;
  levelNumber: number;
}

export function LevelMastery({ stats, levelNumber }: LevelMasteryProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="w-full max-w-sm mt-4"
    >
      <h3 className="font-display text-sm text-muted-foreground mb-2 text-center">
        MASTERY GOALS
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {MASTERY_GOALS.map((goal, index) => {
          const achieved = goal.check(stats);
          
          return (
            <motion.div
              key={goal.id}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className={`block-panel p-2 flex items-center gap-2 ${
                achieved 
                  ? 'border-secondary shadow-[0_0_10px_rgba(249,233,0,0.3)]' 
                  : 'opacity-60'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                achieved ? 'bg-secondary/20' : 'bg-muted'
              }`}>
                {achieved ? (
                  <span className="text-lg">{goal.icon}</span>
                ) : (
                  <X size={16} className="text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`font-display text-xs ${achieved ? 'text-secondary' : 'text-muted-foreground'}`}>
                  {goal.name}
                </div>
                <div className="font-ui text-xs text-muted-foreground truncate">
                  {goal.description}
                </div>
              </div>
              {achieved && (
                <Check size={14} className="text-secondary flex-shrink-0" />
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

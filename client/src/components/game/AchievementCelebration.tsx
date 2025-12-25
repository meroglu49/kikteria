import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { engagementService, type UnlockedAchievement } from '@/lib/engagement-service';

const TIER_COLORS = {
  1: { bg: 'from-amber-700 to-amber-900', border: 'border-amber-500', text: 'text-amber-400', name: 'BRONZE' },
  2: { bg: 'from-gray-400 to-gray-600', border: 'border-gray-300', text: 'text-gray-200', name: 'SILVER' },
  3: { bg: 'from-yellow-400 to-yellow-600', border: 'border-yellow-300', text: 'text-yellow-200', name: 'GOLD' },
};

const CELEBRATION_MESSAGES = [
  "ACHIEVEMENT UNLOCKED!",
  "YOU DID IT!",
  "BADGE EARNED!",
  "INCREDIBLE!",
  "WELL DONE!",
];

export function AchievementCelebration() {
  const [currentAchievement, setCurrentAchievement] = useState<UnlockedAchievement | null>(null);
  const [queue, setQueue] = useState<UnlockedAchievement[]>([]);
  const [celebrationMessage] = useState(() => CELEBRATION_MESSAGES[Math.floor(Math.random() * CELEBRATION_MESSAGES.length)]);
  const dismissTimerRef = useRef<number | null>(null);
  const confettiAnimationRef = useRef<number | null>(null);
  const confettiEndTimeRef = useRef<number>(0);

  useEffect(() => {
    const unsubscribe = engagementService.onAchievementUnlocked((achievement) => {
      setQueue(prev => [...prev, achievement]);
    });
    return () => {
      unsubscribe();
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
      }
      if (confettiAnimationRef.current) {
        cancelAnimationFrame(confettiAnimationRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!currentAchievement && queue.length > 0) {
      const [next, ...rest] = queue;
      setCurrentAchievement(next);
      setQueue(rest);
      
      // Clear any existing timers
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
      }
      if (confettiAnimationRef.current) {
        cancelAnimationFrame(confettiAnimationRef.current);
      }
      
      // Fire confetti
      const duration = 2000;
      confettiEndTimeRef.current = Date.now() + duration;
      
      const frame = () => {
        if (Date.now() >= confettiEndTimeRef.current) {
          confettiAnimationRef.current = null;
          return;
        }
        
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.7 },
          colors: ['#FFD700', '#FFA500', '#FF6347', '#00FF00', '#00BFFF'],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.7 },
          colors: ['#FFD700', '#FFA500', '#FF6347', '#00FF00', '#00BFFF'],
        });
        
        confettiAnimationRef.current = requestAnimationFrame(frame);
      };
      confettiAnimationRef.current = requestAnimationFrame(frame);
      
      // Auto-dismiss after 4 seconds
      dismissTimerRef.current = window.setTimeout(() => {
        dismissTimerRef.current = null;
        setCurrentAchievement(null);
      }, 4000);
    }
  }, [currentAchievement, queue]);

  const dismiss = () => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
    if (confettiAnimationRef.current) {
      cancelAnimationFrame(confettiAnimationRef.current);
      confettiAnimationRef.current = null;
    }
    confettiEndTimeRef.current = 0;
    setCurrentAchievement(null);
  };

  const tierStyle = currentAchievement ? TIER_COLORS[currentAchievement.tier as keyof typeof TIER_COLORS] || TIER_COLORS[1] : TIER_COLORS[1];

  return (
    <AnimatePresence>
      {currentAchievement && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={dismiss}
          data-testid="achievement-celebration-overlay"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ type: 'spring', damping: 15, stiffness: 300 }}
            className={`relative p-8 rounded-2xl border-4 ${tierStyle.border} bg-gradient-to-br ${tierStyle.bg} shadow-2xl max-w-md mx-4`}
            onClick={(e) => e.stopPropagation()}
            data-testid="achievement-celebration-card"
          >
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <div className={`text-sm font-bold ${tierStyle.text} mb-1`}>
                {tierStyle.name} BADGE
              </div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring', damping: 10 }}
                className="text-6xl mb-4"
              >
                {currentAchievement.badgeIcon}
              </motion.div>
              
              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-2xl font-display text-white mb-1"
              >
                {celebrationMessage}
              </motion.h2>
              
              <motion.h3
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-xl font-bold text-white mb-2"
              >
                {currentAchievement.name}
              </motion.h3>
              
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-white/80 mb-4"
              >
                {currentAchievement.description}
              </motion.p>
              
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.7, type: 'spring' }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-black/30 rounded-full"
              >
                <span className="text-yellow-400 text-xl">🪙</span>
                <span className="text-yellow-400 font-bold text-lg">
                  +{currentAchievement.coinReward} coins reward!
                </span>
              </motion.div>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="text-white/50 text-sm mt-4"
              >
                Tap to continue
              </motion.p>
            </motion.div>
            
            <motion.div
              className="absolute -inset-1 rounded-2xl pointer-events-none"
              style={{
                background: `linear-gradient(45deg, transparent, ${tierStyle.text.includes('yellow') ? 'rgba(255,215,0,0.3)' : tierStyle.text.includes('gray') ? 'rgba(192,192,192,0.3)' : 'rgba(205,127,50,0.3)'}, transparent)`,
              }}
              animate={{
                rotate: [0, 360],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

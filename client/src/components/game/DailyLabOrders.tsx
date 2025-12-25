import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, Target, Coins, Check, Play } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/use-auth';
import { useGameStore } from '../../lib/store';
import { offlineStorage } from '../../lib/offline-storage';

interface DailyOrder {
  id: string;
  orderDate: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  targetScore: number;
  coinReward: number;
  modifiers?: string;
}

interface DailyOrderResponse {
  order: DailyOrder;
  completion: { scoreAchieved: number } | null;
  isCompleted: boolean;
}

const difficultyColors = {
  easy: 'text-green-400 border-green-400',
  medium: 'text-yellow-400 border-yellow-400',
  hard: 'text-red-400 border-red-400',
};

const difficultyLabels = {
  easy: 'EASY',
  medium: 'MEDIUM',
  hard: 'HARD',
};

export function DailyLabOrders({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { selectLevel, initializeGame, startTimer, setGameState } = useGameStore();
  
  const { data, isLoading } = useQuery<DailyOrderResponse>({
    queryKey: ['daily-order'],
    queryFn: async () => {
      const res = await fetch('/api/daily-order', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch daily order');
      return res.json();
    },
    enabled: open,
  });

  const getTimeUntilReset = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const diff = tomorrow.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const handleStartDaily = () => {
    if (!data?.order) return;
    
    selectLevel(1);
    initializeGame();
    startTimer();
    setGameState('PLAYING');
    offlineStorage.trackLevelPlay(1);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="block-panel w-full max-w-md p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
              data-testid="button-close-daily"
            >
              <X size={24} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <Calendar className="text-primary" size={28} />
              <h2 className="font-display text-2xl text-primary">DAILY LAB ORDER</h2>
            </div>

            {isLoading && user ? (
              <div className="text-center py-8">
                <p className="font-ui text-lg text-muted-foreground">Loading...</p>
              </div>
            ) : data?.order ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 border rounded font-ui text-sm ${difficultyColors[data.order.difficulty]}`}>
                    {difficultyLabels[data.order.difficulty]}
                  </span>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock size={16} />
                    <span className="font-ui text-sm">Resets in {getTimeUntilReset()}</span>
                  </div>
                </div>

                <div className="bg-background/50 rounded-lg p-4 border border-primary/20">
                  <h3 className="font-display text-xl text-secondary mb-2">{data.order.title}</h3>
                  <p className="font-ui text-base text-foreground/80">{data.order.description}</p>
                </div>

                <div className="flex items-center justify-between bg-background/30 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Target size={18} className="text-accent" />
                    <span className="font-ui text-base">Target Score:</span>
                  </div>
                  <span className="font-display text-xl text-accent">{data.order.targetScore}</span>
                </div>

                <div className="flex items-center justify-between bg-background/30 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Coins size={18} className="text-yellow-400" />
                    <span className="font-ui text-base">Reward:</span>
                  </div>
                  <span className="font-display text-xl text-yellow-400">{data.order.coinReward} G</span>
                </div>

                {data.isCompleted ? (
                  <div className="flex items-center justify-center gap-3 py-4 bg-green-400/20 rounded-lg border border-green-400/50">
                    <Check size={24} className="text-green-400" />
                    <span className="font-display text-lg text-green-400">COMPLETED TODAY!</span>
                  </div>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleStartDaily}
                    className="w-full py-4 pixel-btn flex items-center justify-center gap-3"
                    data-testid="button-start-daily"
                  >
                    <Play size={20} />
                    <span>START DAILY ORDER</span>
                  </motion.button>
                )}

                {!user && (
                  <p className="text-center font-ui text-sm text-muted-foreground">
                    Sign in to track your daily progress and earn rewards!
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="font-ui text-lg text-muted-foreground">No daily order available</p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

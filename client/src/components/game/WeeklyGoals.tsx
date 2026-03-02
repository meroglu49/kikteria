import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Target, Award, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/use-auth';

interface WeeklyGoal {
  id: string;
  weekStart: string;
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  goalType: string;
  rewardType: string;
  rewardData?: string;
  isCompleted: number;
}

interface WeeklyGoalResponse {
  goal: WeeklyGoal;
  userContribution: number;
  progressPercentage: number;
  isCompleted: boolean;
}

export function WeeklyGoals({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth();
  
  const { data, isLoading } = useQuery<WeeklyGoalResponse>({
    queryKey: ['community-goal'],
    queryFn: async () => {
      const res = await fetch('/api/community-goal', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch community goal');
      return res.json();
    },
    enabled: open,
  });

  const getTimeUntilWeekEnd = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
    const sunday = new Date(now);
    sunday.setDate(sunday.getDate() + daysUntilSunday);
    sunday.setHours(23, 59, 59, 999);
    const diff = sunday.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${days}d ${hours}h`;
  };

  const parseRewardData = (rewardData?: string) => {
    if (!rewardData) return null;
    try {
      return JSON.parse(rewardData);
    } catch {
      return null;
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
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
              data-testid="button-close-weekly"
            >
              <X size={24} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <Users className="text-cyan-400" size={28} />
              <h2 className="font-display text-2xl text-cyan-400">COMMUNITY GOAL</h2>
            </div>

            {isLoading && user ? (
              <div className="text-center py-8">
                <p className="font-ui text-lg text-muted-foreground">Loading...</p>
              </div>
            ) : data?.goal ? (
              <div className="space-y-5">
                <div className="text-center mb-2">
                  <span className="font-ui text-sm text-muted-foreground">Time Remaining: {getTimeUntilWeekEnd()}</span>
                </div>

                <div className="bg-background/50 rounded-lg p-4 border border-cyan-400/20">
                  <h3 className="font-display text-xl text-secondary mb-2">{data.goal.title}</h3>
                  <p className="font-ui text-base text-foreground/80">{data.goal.description}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between font-ui text-sm">
                    <span className="text-muted-foreground">Community Progress</span>
                    <span className="text-cyan-400">
                      {formatNumber(data.goal.currentValue)} / {formatNumber(data.goal.targetValue)}
                    </span>
                  </div>
                  
                  <div className="h-6 bg-background/50 rounded-full overflow-hidden border border-cyan-400/30">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${data.progressPercentage}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 relative"
                      style={{ 
                        boxShadow: '0 0 10px rgba(6,182,212,0.5), inset 0 0 20px rgba(255,255,255,0.2)'
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
                    </motion.div>
                  </div>
                  
                  <div className="text-center">
                    <span className="font-display text-2xl text-cyan-400">
                      {data.progressPercentage.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {user && (
                  <div className="flex items-center justify-between bg-background/30 rounded-lg p-3 border border-primary/20">
                    <div className="flex items-center gap-2">
                      <TrendingUp size={18} className="text-primary" />
                      <span className="font-ui text-base">Your Contribution:</span>
                    </div>
                    <span className="font-display text-lg text-primary">{formatNumber(data.userContribution)}</span>
                  </div>
                )}

                <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg p-4 border border-purple-400/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Award size={20} className="text-purple-400" />
                    <span className="font-display text-lg text-purple-400">COMMUNITY REWARD</span>
                  </div>
                  {(() => {
                    const reward = parseRewardData(data.goal.rewardData);
                    if (data.goal.rewardType === 'coins' && reward?.amount) {
                      return (
                        <p className="font-ui text-base text-foreground/80">
                          Everyone earns <span className="text-yellow-400 font-bold">{reward.amount} G</span> when goal is reached!
                        </p>
                      );
                    } else if (data.goal.rewardType === 'cosmetic' && reward?.cosmeticName) {
                      return (
                        <p className="font-ui text-base text-foreground/80">
                          Unlock the <span className="text-purple-400 font-bold">{reward.cosmeticName}</span> for everyone!
                        </p>
                      );
                    }
                    return <p className="font-ui text-base text-foreground/80">Special reward awaits!</p>;
                  })()}
                </div>

                {data.isCompleted && (
                  <motion.div
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    className="flex items-center justify-center gap-3 py-4 bg-green-400/20 rounded-lg border border-green-400/50"
                  >
                    <Award size={24} className="text-green-400" />
                    <span className="font-display text-lg text-green-400">GOAL COMPLETED!</span>
                  </motion.div>
                )}

                {!user && (
                  <p className="text-center font-ui text-sm text-muted-foreground">
                    Sign in to contribute and track your progress!
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="font-ui text-lg text-muted-foreground">No community goal this week</p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

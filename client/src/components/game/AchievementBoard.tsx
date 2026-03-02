import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Award, Lock, Check, Coins, Star } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/use-auth';
import { ACHIEVEMENTS, AchievementDef } from '../../lib/game-constants';

interface UserProgress {
  achievementId: string;
  currentProgress: number;
  isUnlocked: number;
  isClaimed: number;
}

const tierColors = {
  1: { bg: 'from-amber-700 to-amber-600', border: 'border-amber-500', text: 'text-amber-400', label: 'BRONZE' },
  2: { bg: 'from-gray-400 to-gray-300', border: 'border-gray-300', text: 'text-gray-300', label: 'SILVER' },
  3: { bg: 'from-yellow-500 to-yellow-400', border: 'border-yellow-400', text: 'text-yellow-400', label: 'GOLD' },
};

const categoryLabels = {
  mastery: 'Mastery',
  collection: 'Collection',
  social: 'Social',
  challenge: 'Challenge',
};

export function AchievementBoard({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: userProgress = [], isLoading } = useQuery<UserProgress[]>({
    queryKey: ['achievement-progress'],
    queryFn: async () => {
      const res = await fetch('/api/achievements/progress', { credentials: 'include' });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: open && !!user,
  });

  const claimMutation = useMutation({
    mutationFn: async (achievementId: string) => {
      const res = await fetch('/api/achievements/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ achievementId }),
      });
      if (!res.ok) throw new Error('Failed to claim');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['achievement-progress'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  const getProgressForAchievement = (id: string) => {
    return userProgress.find(p => p.achievementId === id);
  };

  const categories = Array.from(new Set(ACHIEVEMENTS.map(a => a.category)));
  const filteredAchievements = selectedCategory 
    ? ACHIEVEMENTS.filter(a => a.category === selectedCategory)
    : ACHIEVEMENTS;

  const unlockedCount = userProgress.filter(p => p.isUnlocked).length;
  const totalCount = ACHIEVEMENTS.length;

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
            className="block-panel w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-primary/20">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
                data-testid="button-close-achievements"
              >
                <X size={24} />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <Award className="text-yellow-400" size={28} />
                <h2 className="font-display text-2xl text-yellow-400">ACHIEVEMENT BOARD</h2>
              </div>

              <div className="flex items-center justify-between mb-4">
                <span className="font-ui text-sm text-muted-foreground">
                  Progress: {unlockedCount} / {totalCount} unlocked
                </span>
                <div className="h-2 w-32 bg-background/50 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-yellow-400"
                    style={{ width: `${(unlockedCount / totalCount) * 100}%` }}
                  />
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`px-3 py-1 rounded font-ui text-sm transition-colors ${
                    selectedCategory === null 
                      ? 'bg-primary text-background' 
                      : 'bg-background/30 text-muted-foreground hover:text-foreground'
                  }`}
                  data-testid="button-filter-all"
                >
                  All
                </button>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded font-ui text-sm transition-colors ${
                      selectedCategory === cat 
                        ? 'bg-primary text-background' 
                        : 'bg-background/30 text-muted-foreground hover:text-foreground'
                    }`}
                    data-testid={`button-filter-${cat}`}
                  >
                    {categoryLabels[cat as keyof typeof categoryLabels]}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {!user ? (
                <div className="text-center py-8">
                  <Lock size={48} className="mx-auto text-muted-foreground mb-4" />
                  <p className="font-ui text-lg text-muted-foreground">Sign in to track achievements!</p>
                </div>
              ) : isLoading ? (
                <div className="text-center py-8">
                  <p className="font-ui text-lg text-muted-foreground">Loading...</p>
                </div>
              ) : (
                filteredAchievements.map((achievement) => {
                  const progress = getProgressForAchievement(achievement.id);
                  const isUnlocked = progress?.isUnlocked === 1;
                  const isClaimed = progress?.isClaimed === 1;
                  const currentProgress = progress?.currentProgress || 0;
                  const progressPercent = Math.min(100, (currentProgress / achievement.requirement) * 100);
                  const tier = tierColors[achievement.tier as 1 | 2 | 3];

                  return (
                    <motion.div
                      key={achievement.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-4 rounded-lg border ${
                        isUnlocked 
                          ? isClaimed 
                            ? 'bg-background/30 border-green-400/30' 
                            : 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-400/50'
                          : 'bg-background/20 border-muted-foreground/20'
                      }`}
                      data-testid={`achievement-${achievement.id}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`text-3xl ${isUnlocked ? '' : 'grayscale opacity-50'}`}>
                          {achievement.badgeIcon}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`font-display text-lg ${isUnlocked ? tier.text : 'text-muted-foreground'}`}>
                              {achievement.name}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-xs font-ui ${tier.border} border bg-background/30 ${tier.text}`}>
                              {tier.label}
                            </span>
                          </div>
                          
                          <p className="font-ui text-sm text-foreground/70 mb-2">{achievement.description}</p>
                          
                          {!isUnlocked && (
                            <div className="space-y-1">
                              <div className="h-2 bg-background/50 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-primary/50"
                                  style={{ width: `${progressPercent}%` }}
                                />
                              </div>
                              <span className="font-ui text-xs text-muted-foreground">
                                {currentProgress} / {achievement.requirement}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <div className="flex items-center gap-1 text-yellow-400">
                            <Coins size={14} />
                            <span className="font-ui text-sm">{achievement.coinReward}</span>
                          </div>
                          
                          {isUnlocked && !isClaimed && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => claimMutation.mutate(achievement.id)}
                              disabled={claimMutation.isPending}
                              className="px-3 py-1 pixel-btn text-xs"
                              data-testid={`button-claim-${achievement.id}`}
                            >
                              CLAIM
                            </motion.button>
                          )}
                          
                          {isClaimed && (
                            <div className="flex items-center gap-1 text-green-400">
                              <Check size={16} />
                              <span className="font-ui text-xs">CLAIMED</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

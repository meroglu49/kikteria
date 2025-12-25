import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { useLeaderboard } from '../../lib/api';
import { Trophy, Medal, Award } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { offlineStorage } from '../../lib/offline-storage';

interface LeaderboardProps {
  open: boolean;
  onClose: () => void;
}

export function Leaderboard({ open, onClose }: LeaderboardProps) {
  const { data: serverLeaderboard, isLoading } = useLeaderboard(10);
  const [cachedLeaderboard, setCachedLeaderboard] = useState<Array<{id: string; username: string; score: number; createdAt: Date}>>([]);

  // Load cached leaderboard on mount
  useEffect(() => {
    const cached = offlineStorage.getLeaderboardCache();
    if (cached.length > 0) {
      setCachedLeaderboard(cached.map((entry, index) => ({
        id: `cached-${index}`,
        username: entry.username,
        score: entry.score,
        createdAt: new Date(),
      })));
    }
  }, []);

  // Cache server leaderboard when available
  useEffect(() => {
    if (serverLeaderboard && serverLeaderboard.length > 0) {
      offlineStorage.setLeaderboardCache(
        serverLeaderboard.map((entry, index) => ({
          rank: index + 1,
          username: entry.username,
          score: entry.score,
        }))
      );
    }
  }, [serverLeaderboard]);

  // Use server data if available, otherwise use cached
  const leaderboard = serverLeaderboard && serverLeaderboard.length > 0 ? serverLeaderboard : cachedLeaderboard;

  const getRankDisplay = (rank: number) => {
    if (rank === 1) return { icon: <Trophy className="text-secondary" size={20} />, color: 'text-secondary text-glow', bg: 'bg-secondary/10 border-secondary shadow-[0_0_15px_rgba(249,233,0,0.3)]' };
    if (rank === 2) return { icon: <Medal className="text-muted-foreground" size={20} />, color: 'text-foreground', bg: 'bg-muted border-border' };
    if (rank === 3) return { icon: <Award className="text-accent" size={20} />, color: 'text-accent', bg: 'bg-accent/10 border-accent/50' };
    return { icon: <span className="font-display text-xs text-muted-foreground">{rank}</span>, color: 'text-foreground', bg: 'border-border' };
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] block-panel border-2 border-secondary/50 bg-card shadow-[0_0_40px_rgba(249,233,0,0.2)]" data-testid="dialog-leaderboard">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center justify-center gap-3 text-secondary text-glow" data-testid="text-leaderboard-title">
            <Trophy className="text-secondary" />
            TOP PLAYERS
            <Trophy className="text-secondary" />
          </DialogTitle>
          <DialogDescription className="font-ui text-xl text-center text-muted-foreground" data-testid="text-leaderboard-description">
            Global Rankings
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 max-h-[400px] overflow-y-auto mt-4">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="block-panel p-3 flex items-center gap-4">
                <Skeleton className="h-8 w-8 bg-muted" />
                <Skeleton className="h-4 flex-1 bg-muted" />
                <Skeleton className="h-4 w-16 bg-muted" />
              </div>
            ))
          ) : leaderboard && leaderboard.length > 0 ? (
            leaderboard.map((entry, index) => {
              const rankInfo = getRankDisplay(index + 1);
              return (
                <div
                  key={entry.id}
                  className={`block-panel p-3 flex items-center gap-4 ${rankInfo.bg} border transition-colors`}
                  data-testid={`leaderboard-entry-${index + 1}`}
                >
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-muted border border-border">
                    {rankInfo.icon}
                  </div>
                  <div className="flex-1">
                    <p className={`font-display text-xs ${rankInfo.color}`} data-testid={`text-username-${index + 1}`}>
                      {entry.username}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-sm text-secondary text-glow" data-testid={`text-score-${index + 1}`}>
                      {entry.score.toLocaleString()}
                    </p>
                    <p className="font-ui text-sm text-muted-foreground">
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8" data-testid="text-no-entries">
              <Trophy size={48} className="mx-auto mb-4 text-muted-foreground" />
              <p className="font-display text-xs text-muted-foreground">NO RECORDS YET</p>
              <p className="font-ui text-lg text-muted-foreground mt-2">Be the first champion!</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { useLeaderboard } from '../../lib/api';
import { Trophy, Medal, Award } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

interface LeaderboardProps {
  open: boolean;
  onClose: () => void;
}

export function Leaderboard({ open, onClose }: LeaderboardProps) {
  const { data: leaderboard, isLoading } = useLeaderboard(10);

  const getRankDisplay = (rank: number) => {
    if (rank === 1) return { icon: <Trophy className="text-secondary" size={20} />, color: 'text-secondary', bg: 'bg-secondary/20 border-secondary' };
    if (rank === 2) return { icon: <Medal className="text-foreground/60" size={20} />, color: 'text-foreground/60', bg: 'bg-foreground/10 border-foreground/30' };
    if (rank === 3) return { icon: <Award className="text-orange-500" size={20} />, color: 'text-orange-500', bg: 'bg-orange-500/20 border-orange-500' };
    return { icon: <span className="font-display text-xs">{rank}</span>, color: 'text-foreground/60', bg: '' };
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] block-panel border-4 border-secondary/50 bg-card" data-testid="dialog-leaderboard">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center justify-center gap-3" data-testid="text-leaderboard-title">
            <Trophy className="text-secondary" />
            TOP PLAYERS
            <Trophy className="text-secondary" />
          </DialogTitle>
          <DialogDescription className="font-ui text-xl text-center text-foreground/60" data-testid="text-leaderboard-description">
            Global Rankings
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 max-h-[400px] overflow-y-auto mt-4">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="block-panel p-3 flex items-center gap-4">
                <Skeleton className="h-8 w-8 bg-foreground/10" />
                <Skeleton className="h-4 flex-1 bg-foreground/10" />
                <Skeleton className="h-4 w-16 bg-foreground/10" />
              </div>
            ))
          ) : leaderboard && leaderboard.length > 0 ? (
            leaderboard.map((entry, index) => {
              const rankInfo = getRankDisplay(index + 1);
              return (
                <div
                  key={entry.id}
                  className={`block-panel p-3 flex items-center gap-4 ${rankInfo.bg} border-2 transition-colors`}
                  data-testid={`leaderboard-entry-${index + 1}`}
                >
                  <div className="w-10 h-10 flex items-center justify-center bg-background/50 border-2 border-foreground/20">
                    {rankInfo.icon}
                  </div>
                  <div className="flex-1">
                    <p className={`font-display text-xs ${rankInfo.color}`} data-testid={`text-username-${index + 1}`}>
                      {entry.username}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-sm text-secondary" data-testid={`text-score-${index + 1}`}>
                      {entry.score.toLocaleString()}
                    </p>
                    <p className="font-ui text-lg text-foreground/40">
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8" data-testid="text-no-entries">
              <Trophy size={48} className="mx-auto mb-4 text-foreground/30" />
              <p className="font-display text-xs text-foreground/60">NO RECORDS YET</p>
              <p className="font-ui text-lg text-foreground/40 mt-2">Be the first champion!</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

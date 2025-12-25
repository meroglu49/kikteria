import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Types
interface PlayerProfile {
  id: string;
  userId: string;
  coins: number;
  highScore: number;
  speedUpgrade: number;
  startSizeUpgrade: number;
  magnetUpgrade: number;
  updatedAt: Date;
}

interface LeaderboardEntry {
  id: string;
  userId: string;
  username: string;
  score: number;
  createdAt: Date;
}

// API functions
async function fetchJSON(url: string, options?: RequestInit) {
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(`${response.status}: ${error.error || error.message || 'Request failed'}`);
  }

  return response.json();
}

// Profile API
export const profileAPI = {
  getProfile: (): Promise<PlayerProfile> => fetchJSON('/api/profile'),

  updateProfile: (updates: Partial<Omit<PlayerProfile, 'id' | 'userId' | 'updatedAt'>>) =>
    fetchJSON('/api/profile', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),
};

// Leaderboard API
export const leaderboardAPI = {
  getTopScores: (limit: number = 10): Promise<LeaderboardEntry[]> =>
    fetchJSON(`/api/leaderboard?limit=${limit}`),

  submitScore: (score: number) =>
    fetchJSON('/api/leaderboard', {
      method: 'POST',
      body: JSON.stringify({ score }),
    }),
};

// Level Progress types and API
interface LevelProgress {
  id: string;
  userId: string;
  levelNumber: number;
  bestScore: number;
  isCompleted: number;
}

export const levelProgressAPI = {
  getProgress: (): Promise<LevelProgress[]> =>
    fetchJSON('/api/levels/progress'),

  updateProgress: (levelNumber: number, score: number, completed: boolean) =>
    fetchJSON('/api/levels/progress', {
      method: 'POST',
      body: JSON.stringify({ levelNumber, score, completed }),
    }),
};

// React Query Hooks

// Profile Hooks
export function usePlayerProfile() {
  return useQuery<PlayerProfile>({
    queryKey: ['profile'],
    queryFn: profileAPI.getProfile,
    staleTime: 30000, // 30 seconds
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (updates: Partial<Omit<PlayerProfile, 'id' | 'userId' | 'updatedAt'>>) =>
      profileAPI.updateProfile(updates),
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(['profile'], updatedProfile);
    },
  });
}

// Leaderboard Hooks
export function useLeaderboard(limit: number = 10) {
  return useQuery<LeaderboardEntry[]>({
    queryKey: ['leaderboard', limit],
    queryFn: () => leaderboardAPI.getTopScores(limit),
    staleTime: 10000, // 10 seconds
  });
}

export function useSubmitScore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (score: number) => leaderboardAPI.submitScore(score),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

// Level Progress Hooks
export function useLevelProgress() {
  return useQuery({
    queryKey: ['levelProgress'],
    queryFn: levelProgressAPI.getProgress,
    staleTime: 30000,
  });
}

export function useUpdateLevelProgress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ levelNumber, score, completed }: { levelNumber: number; score: number; completed: boolean }) =>
      levelProgressAPI.updateProgress(levelNumber, score, completed),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['levelProgress'] });
    },
  });
}

// Analytics/Metadata API - for user behavior tracking
interface AnalyticsEvent {
  eventType: 'level_play' | 'level_success' | 'level_fail' | 'session_start' | 'session_end';
  levelNumber?: number;
  score?: number;
  playDuration?: number;
  eventDate: string;
  eventTime: string;
  sessionId: string;
  deviceInfo: string;
}

export const analyticsAPI = {
  submitEvents: (events: AnalyticsEvent[]): Promise<{ success: boolean; count: number }> =>
    fetchJSON('/api/analytics', {
      method: 'POST',
      body: JSON.stringify({ events }),
    }),
};

// Error Logs API - for debugging
interface ErrorLogEntry {
  severity: 'error' | 'warn' | 'info';
  category: 'runtime' | 'api' | 'sync' | 'game' | 'asset';
  message: string;
  stack?: string;
  component?: string;
  currentScreen?: string;
  gameState?: string;
  apiInfo?: string;
  sessionId: string;
  deviceInfo: string;
  networkStatus: string;
  lastUserAction?: string;
  eventTime: string;
}

export const errorLogsAPI = {
  submitLogs: (logs: ErrorLogEntry[]): Promise<{ success: boolean; count: number }> =>
    fetchJSON('/api/errors', {
      method: 'POST',
      body: JSON.stringify({ logs }),
    }),
};

// Version API - for update checking
interface UpdatePolicyResponse {
  latestVersion: string;
  minSupportedVersion: string;
  downloadUrl: string;
  releaseNotes: string | null;
}

export const versionAPI = {
  getUpdatePolicy: (): Promise<UpdatePolicyResponse> =>
    fetchJSON('/api/version'),
};

// ==================== ENGAGEMENT API ====================

// Daily Orders API
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

export const dailyOrderAPI = {
  getTodaysOrder: (): Promise<DailyOrderResponse> =>
    fetchJSON('/api/daily-order'),

  completeDailyOrder: (scoreAchieved: number): Promise<{ success: boolean; coinsAwarded: number }> =>
    fetchJSON('/api/daily-order/complete', {
      method: 'POST',
      body: JSON.stringify({ scoreAchieved }),
    }),
};

// Weekly Community Goals API
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

export const communityGoalAPI = {
  getCurrentGoal: (): Promise<WeeklyGoalResponse> =>
    fetchJSON('/api/community-goal'),

  contribute: (amount: number): Promise<{ contribution: any; goal: WeeklyGoal }> =>
    fetchJSON('/api/community-goal/contribute', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    }),
};

// Achievements API
export const achievementsAPI = {
  getProgress: (): Promise<any[]> =>
    fetchJSON('/api/achievements/progress'),

  updateProgress: (achievementId: string, progress: number): Promise<any> =>
    fetchJSON('/api/achievements/progress', {
      method: 'POST',
      body: JSON.stringify({ achievementId, progress }),
    }),

  claim: (achievementId: string): Promise<{ claimed: any; coinsAwarded: number }> =>
    fetchJSON('/api/achievements/claim', {
      method: 'POST',
      body: JSON.stringify({ achievementId }),
    }),
};

// Engagement hooks
export function useContributeToGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (amount: number) => communityGoalAPI.contribute(amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-goal'] });
    },
  });
}

export function useCompleteDailyOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (scoreAchieved: number) => dailyOrderAPI.completeDailyOrder(scoreAchieved),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-order'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

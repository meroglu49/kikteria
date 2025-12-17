import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Types
interface User {
  id: string;
  username: string;
}

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
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

// Auth API
export const authAPI = {
  register: (username: string, password: string) =>
    fetchJSON('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  login: (username: string, password: string) =>
    fetchJSON('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  logout: () =>
    fetchJSON('/api/auth/logout', {
      method: 'POST',
    }),

  getCurrentUser: () => fetchJSON('/api/auth/user'),
};

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

// Auth Hooks
export function useCurrentUser() {
  return useQuery<User>({
    queryKey: ['currentUser'],
    queryFn: authAPI.getCurrentUser,
    retry: false,
    staleTime: Infinity,
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ username, password }: { username: string; password: string }) =>
      authAPI.register(username, password),
    onSuccess: (user) => {
      queryClient.setQueryData(['currentUser'], user);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ username, password }: { username: string; password: string }) =>
      authAPI.login(username, password),
    onSuccess: (user) => {
      queryClient.setQueryData(['currentUser'], user);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authAPI.logout,
    onSuccess: () => {
      queryClient.setQueryData(['currentUser'], null);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

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

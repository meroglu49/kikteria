import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

const ADMIN_USER_IDS = ['51476893'];

interface AdminStats {
  totalUsers: number;
  totalGamesPlayed: number;
  totalErrors: number;
}

interface User {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  createdAt: string;
}

interface Profile {
  id: string;
  userId: string;
  coins: number;
  highScore: number;
  speedUpgrade: number;
  startSizeUpgrade: number;
  magnetUpgrade: number;
  email?: string;
  firstName?: string;
  lastName?: string;
}

interface UpdatePolicy {
  latestVersion: string;
  minSupportedVersion: string;
  downloadUrl: string;
  releaseNotes: string | null;
}

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || error.error || 'Request failed');
  }
  return res.json();
}

export function AdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [errors, setErrors] = useState<any[]>([]);
  const [updatePolicy, setUpdatePolicy] = useState<UpdatePolicy>({
    latestVersion: '1.3.0',
    minSupportedVersion: '1.0.0',
    downloadUrl: '/',
    releaseNotes: '',
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  const isAdmin = user && ADMIN_USER_IDS.includes(user.id);

  useEffect(() => {
    if (isAdmin) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  async function loadData() {
    try {
      const [statsData, usersData, profilesData, analyticsData, errorsData, policyData] = await Promise.all([
        fetchJSON<AdminStats>('/api/admin/stats'),
        fetchJSON<User[]>('/api/admin/users'),
        fetchJSON<Profile[]>('/api/admin/profiles'),
        fetchJSON<any[]>('/api/admin/analytics?limit=50'),
        fetchJSON<any[]>('/api/admin/errors?limit=50'),
        fetchJSON<UpdatePolicy>('/api/admin/update-policy'),
      ]);
      setStats(statsData);
      setUsers(usersData);
      setProfiles(profilesData);
      setAnalytics(analyticsData);
      setErrors(errorsData);
      setUpdatePolicy(policyData);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  async function saveUpdatePolicy() {
    try {
      await fetchJSON('/api/admin/update-policy', {
        method: 'POST',
        body: JSON.stringify(updatePolicy),
      });
      toast({ title: 'Success', description: 'Update policy saved' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  }

  async function deleteUserData(userId: string) {
    if (!confirm('Are you sure? This will delete all game data for this user.')) return;
    try {
      await fetchJSON(`/api/admin/user/${userId}`, { method: 'DELETE' });
      toast({ title: 'Success', description: 'User data deleted' });
      loadData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-2xl font-display text-primary">Loading...</div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Access Denied</CardTitle>
            <CardDescription>You do not have admin privileges.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = '/'} data-testid="button-back-home">
              Back to Game
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-display text-primary">Admin Panel</h1>
          <Button variant="outline" onClick={() => window.location.href = '/'} data-testid="button-back-game">
            Back to Game
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-5 w-full max-w-2xl">
            <TabsTrigger value="dashboard" data-testid="tab-dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-users">Users</TabsTrigger>
            <TabsTrigger value="analytics" data-testid="tab-analytics">Analytics</TabsTrigger>
            <TabsTrigger value="errors" data-testid="tab-errors">Errors</TabsTrigger>
            <TabsTrigger value="settings" data-testid="tab-settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total Users</CardDescription>
                  <CardTitle className="text-4xl text-primary" data-testid="stat-users">{stats?.totalUsers || 0}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Games Played</CardDescription>
                  <CardTitle className="text-4xl text-secondary" data-testid="stat-games">{stats?.totalGamesPlayed || 0}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Error Logs</CardDescription>
                  <CardTitle className="text-4xl text-destructive" data-testid="stat-errors">{stats?.totalErrors || 0}</CardTitle>
                </CardHeader>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Top Players</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {profiles.slice(0, 5).map((p, i) => (
                    <div key={p.id} className="flex justify-between items-center p-2 bg-muted rounded">
                      <span>#{i + 1} {p.firstName || p.email || p.userId}</span>
                      <span className="font-bold">{p.highScore} pts</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Users ({users.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-2">
                    {users.map(u => (
                      <div key={u.id} className="flex justify-between items-center p-3 bg-muted rounded" data-testid={`user-row-${u.id}`}>
                        <div>
                          <div className="font-medium">{u.firstName} {u.lastName}</div>
                          <div className="text-sm text-muted-foreground">{u.email}</div>
                          <div className="text-xs text-muted-foreground">ID: {u.id}</div>
                        </div>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => deleteUserData(u.id)}
                          data-testid={`delete-user-${u.id}`}
                        >
                          Delete Data
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Player Profiles ({profiles.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">User</th>
                        <th className="text-right p-2">Coins</th>
                        <th className="text-right p-2">High Score</th>
                        <th className="text-right p-2">Upgrades</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profiles.map(p => (
                        <tr key={p.id} className="border-b">
                          <td className="p-2">{p.firstName || p.email || p.userId}</td>
                          <td className="text-right p-2">{p.coins}</td>
                          <td className="text-right p-2">{p.highScore}</td>
                          <td className="text-right p-2">{p.speedUpgrade}/{p.startSizeUpgrade}/{p.magnetUpgrade}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Analytics (Last 50)</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Event</th>
                        <th className="text-left p-2">Level</th>
                        <th className="text-right p-2">Score</th>
                        <th className="text-right p-2">Duration</th>
                        <th className="text-left p-2">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.map((a, i) => (
                        <tr key={i} className="border-b">
                          <td className="p-2">{a.eventType}</td>
                          <td className="p-2">{a.levelNumber || '-'}</td>
                          <td className="text-right p-2">{a.score || '-'}</td>
                          <td className="text-right p-2">{a.playDuration ? `${a.playDuration}s` : '-'}</td>
                          <td className="p-2">{a.eventDate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="errors" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Error Logs (Last 50)</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-2">
                    {errors.map((e, i) => (
                      <div key={i} className={`p-3 rounded border ${e.severity === 'error' ? 'border-destructive bg-destructive/10' : 'border-yellow-500 bg-yellow-500/10'}`}>
                        <div className="flex justify-between">
                          <span className="font-medium">[{e.severity?.toUpperCase()}] {e.category}</span>
                          <span className="text-xs text-muted-foreground">{new Date(e.eventTime).toLocaleString()}</span>
                        </div>
                        <div className="text-sm mt-1">{e.message}</div>
                        {e.component && <div className="text-xs text-muted-foreground mt-1">Component: {e.component}</div>}
                        {e.currentScreen && <div className="text-xs text-muted-foreground">Screen: {e.currentScreen}</div>}
                      </div>
                    ))}
                    {errors.length === 0 && <div className="text-muted-foreground text-center py-8">No errors logged</div>}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Update Policy</CardTitle>
                <CardDescription>Configure version requirements for the game</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="latestVersion">Latest Version</Label>
                    <Input 
                      id="latestVersion"
                      value={updatePolicy.latestVersion}
                      onChange={e => setUpdatePolicy(p => ({ ...p, latestVersion: e.target.value }))}
                      placeholder="1.3.0"
                      data-testid="input-latest-version"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="minVersion">Min Supported Version</Label>
                    <Input 
                      id="minVersion"
                      value={updatePolicy.minSupportedVersion}
                      onChange={e => setUpdatePolicy(p => ({ ...p, minSupportedVersion: e.target.value }))}
                      placeholder="1.0.0"
                      data-testid="input-min-version"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="downloadUrl">Download URL</Label>
                  <Input 
                    id="downloadUrl"
                    value={updatePolicy.downloadUrl}
                    onChange={e => setUpdatePolicy(p => ({ ...p, downloadUrl: e.target.value }))}
                    placeholder="/"
                    data-testid="input-download-url"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="releaseNotes">Release Notes</Label>
                  <Input 
                    id="releaseNotes"
                    value={updatePolicy.releaseNotes || ''}
                    onChange={e => setUpdatePolicy(p => ({ ...p, releaseNotes: e.target.value }))}
                    placeholder="What's new in this version..."
                    data-testid="input-release-notes"
                  />
                </div>
                <Button onClick={saveUpdatePolicy} data-testid="button-save-policy">
                  Save Update Policy
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

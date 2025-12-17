import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useRegister, useLogin } from '../../lib/api';
import { Loader2 } from 'lucide-react';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

export function AuthModal({ open, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const registerMutation = useRegister();
  const loginMutation = useLogin();

  const isLoading = registerMutation.isPending || loginMutation.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('FILL ALL FIELDS');
      return;
    }

    if (password.length < 6) {
      setError('PASSWORD TOO SHORT');
      return;
    }

    try {
      if (mode === 'register') {
        await registerMutation.mutateAsync({ username, password });
      } else {
        await loginMutation.mutateAsync({ username, password });
      }
      onClose();
    } catch (err: any) {
      setError(err.message?.toUpperCase() || 'ERROR');
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px] block-panel border-4 border-primary/50 bg-card" data-testid="dialog-auth">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-center text-shadow-pixel" data-testid="text-auth-title">
            {mode === 'login' ? '★ LOGIN ★' : '★ NEW PLAYER ★'}
          </DialogTitle>
          <DialogDescription className="font-ui text-xl text-center text-foreground/60" data-testid="text-auth-description">
            {mode === 'login' 
              ? 'Enter to save progress' 
              : 'Create your account'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="font-display text-xs">NAME</Label>
            <Input
              id="username"
              data-testid="input-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter name..."
              disabled={isLoading}
              className="block-panel border-2 border-foreground/30 bg-background font-ui text-xl h-12"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="font-display text-xs">PASSWORD</Label>
            <Input
              id="password"
              data-testid="input-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password..."
              disabled={isLoading}
              className="block-panel border-2 border-foreground/30 bg-background font-ui text-xl h-12"
            />
          </div>
          {error && (
            <p className="font-display text-xs text-destructive text-center p-2 bg-destructive/20 border-2 border-destructive" data-testid="text-error">
              ! {error} !
            </p>
          )}
          <div className="flex flex-col gap-3 pt-2">
            <button 
              type="submit" 
              disabled={isLoading}
              data-testid="button-submit"
              className="w-full pixel-btn py-3 font-display text-sm flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="h-5 w-5 animate-spin" />}
              {mode === 'login' ? 'ENTER' : 'CREATE'}
            </button>
            <button
              type="button"
              onClick={toggleMode}
              disabled={isLoading}
              data-testid="button-toggle-mode"
              className="w-full block-panel py-2 font-ui text-lg hover:bg-foreground/10 transition-colors"
            >
              {mode === 'login' 
                ? '[ NEW PLAYER? ]' 
                : '[ HAVE ACCOUNT? ]'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

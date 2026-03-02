import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { versionAPI } from '@/lib/api';
import { CURRENT_VERSION, isUpdateRequired, isUpdateAvailable, type UpdatePolicy } from '@/lib/version';
import { offlineStorage } from '@/lib/offline-storage';

const UPDATE_DISMISSED_KEY = 'kikteria_update_dismissed';
const CACHE_KEY = 'kikteria_update_policy_cache';

interface UpdateModalProps {
  onReady: () => void;
}

export function UpdateModal({ onReady }: UpdateModalProps) {
  const [policy, setPolicy] = useState<UpdatePolicy | null>(null);
  const [updateType, setUpdateType] = useState<'mandatory' | 'optional' | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkForUpdates();
  }, []);

  async function checkForUpdates() {
    try {
      const response = await versionAPI.getUpdatePolicy();
      const updatePolicy: UpdatePolicy = {
        latestVersion: response.latestVersion,
        minSupportedVersion: response.minSupportedVersion,
        downloadUrl: response.downloadUrl,
        releaseNotes: response.releaseNotes || undefined,
      };
      
      localStorage.setItem(CACHE_KEY, JSON.stringify(updatePolicy));
      
      setPolicy(updatePolicy);
      evaluateUpdate(updatePolicy);
    } catch (error) {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          const cachedPolicy = JSON.parse(cached) as UpdatePolicy;
          setPolicy(cachedPolicy);
          evaluateUpdate(cachedPolicy);
        } catch {
          setIsChecking(false);
          onReady();
        }
      } else {
        setIsChecking(false);
        onReady();
      }
    }
  }

  function evaluateUpdate(updatePolicy: UpdatePolicy) {
    setIsChecking(false);
    
    if (isUpdateRequired(updatePolicy)) {
      setUpdateType('mandatory');
      setIsOpen(true);
      return;
    }
    
    if (isUpdateAvailable(updatePolicy)) {
      const dismissed = sessionStorage.getItem(UPDATE_DISMISSED_KEY);
      if (dismissed !== updatePolicy.latestVersion) {
        setUpdateType('optional');
        setIsOpen(true);
        return;
      }
    }
    
    onReady();
  }

  function handleUpdate() {
    if (policy?.downloadUrl) {
      if (policy.downloadUrl === '/' || policy.downloadUrl === window.location.origin) {
        window.location.reload();
      } else {
        window.open(policy.downloadUrl, '_blank');
        window.location.reload();
      }
    }
  }

  function handleSkip() {
    if (policy && updateType === 'optional') {
      sessionStorage.setItem(UPDATE_DISMISSED_KEY, policy.latestVersion);
      setIsOpen(false);
      onReady();
    }
  }

  function handleExit() {
    window.close();
    document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#1a1a2e;color:#fff;font-family:sans-serif;text-align:center;padding:20px;"><div><h1>Update Required</h1><p>Please update the app to continue playing.</p></div></div>';
  }

  if (isChecking) {
    return (
      <div className="fixed inset-0 bg-background/95 flex items-center justify-center z-50">
        <div className="text-center">
          <div className="animate-pulse text-2xl font-display text-primary mb-4">KIKTERIA</div>
          <p className="text-foreground/60 font-ui">Checking for updates...</p>
        </div>
      </div>
    );
  }

  if (!isOpen || !policy) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="block-panel border-4 border-primary max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-center text-primary">
            {updateType === 'mandatory' ? 'Update Required' : 'Update Available'}
          </DialogTitle>
          <DialogDescription className="text-center font-ui text-lg mt-4">
            {updateType === 'mandatory' ? (
              <>
                A new version is required to continue playing.
                <br />
                <span className="text-foreground/60">
                  Current: v{CURRENT_VERSION} → Required: v{policy.minSupportedVersion}+
                </span>
              </>
            ) : (
              <>
                A new version is available!
                <br />
                <span className="text-foreground/60">
                  Current: v{CURRENT_VERSION} → Latest: v{policy.latestVersion}
                </span>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {policy.releaseNotes && (
          <div className="my-4 p-3 bg-background/50 border-2 border-foreground/20 text-sm font-ui max-h-32 overflow-y-auto">
            <p className="text-foreground/80 font-semibold mb-1">What's new:</p>
            <p className="text-foreground/60">{policy.releaseNotes}</p>
          </div>
        )}

        <DialogFooter className="flex flex-col gap-3 mt-6">
          <Button 
            onClick={handleUpdate}
            className="w-full pixel-btn font-display"
            data-testid="button-update"
          >
            UPDATE NOW
          </Button>
          
          {updateType === 'optional' ? (
            <Button 
              onClick={handleSkip}
              variant="outline"
              className="w-full font-display"
              data-testid="button-skip-update"
            >
              SKIP FOR NOW
            </Button>
          ) : (
            <Button 
              onClick={handleExit}
              variant="destructive"
              className="w-full font-display"
              data-testid="button-exit-game"
            >
              EXIT GAME
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

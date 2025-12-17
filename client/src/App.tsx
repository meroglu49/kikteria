import { useEffect, useState, useRef } from "react";
import { useGameStore } from "./lib/store";
import { GameEngine } from "./components/game/GameEngine";
import { HUD } from "./components/game/HUD";
import { MainMenu } from "./components/game/MainMenu";
import { Shop } from "./components/game/Shop";
import { LevelSelect } from "./components/game/LevelSelect";
import { Toaster } from "@/components/ui/toaster";
import { useCurrentUser, usePlayerProfile, useUpdateProfile, useSubmitScore, useUpdateLevelProgress, useLevelProgress } from "./lib/api";
import { LEVELS } from "./lib/game-constants";
import { playGameOverSound } from "./lib/sounds";
import { offlineStorage } from "./lib/offline-storage";

interface WinScreenProps {
  score: number;
  currentLevel: number;
  maxUnlockedLevel: number;
  user: { id: string; username: string } | null | undefined;
  profile: { coins: number; highScore: number } | null | undefined;
  onReplay: () => void;
  onNextLevel: () => void;
  onMenu: () => void;
  onSaveProgress: () => Promise<void>;
}

function WinScreen({ score, currentLevel, maxUnlockedLevel, user, profile, onReplay, onNextLevel, onMenu, onSaveProgress }: WinScreenProps) {
  const hasNextLevel = currentLevel < LEVELS.length;
  const saveCalledRef = useRef(false);
  const [progressSaved, setProgressSaved] = useState(false);
  
  useEffect(() => {
    if (!saveCalledRef.current) {
      saveCalledRef.current = true;
      onSaveProgress().then(() => setProgressSaved(true)).catch(console.error);
    }
  }, []);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 scanlines">
      <div className="block-panel p-8 text-center max-w-sm w-full mx-4 border-4 border-primary">
        <h2 className="text-2xl font-display text-primary mb-3 text-shadow-pixel">
          ★ LEVEL {currentLevel} COMPLETE! ★
        </h2>
        <p className="font-ui text-2xl text-foreground/60 mb-6">All bacteria placed!</p>
        
        <div className="space-y-3 mb-8 bg-background/50 p-4 border-2 border-foreground/20">
          <div className="flex justify-between items-center">
            <span className="font-ui text-xl text-foreground/60">SCORE</span>
            <span className="font-display text-lg text-secondary" data-testid="text-win-score">
              {score.toLocaleString()}
            </span>
          </div>
          {user && (
            <div className="flex justify-between items-center">
              <span className="font-ui text-xl text-foreground/60">BONUS</span>
              <span className="font-display text-lg text-primary" data-testid="text-win-bonus">
                +{score} G
              </span>
            </div>
          )}
        </div>
        
        <div className="space-y-3">
          {hasNextLevel && (
            <button 
              onClick={onNextLevel}
              className="w-full py-4 pixel-btn font-display text-sm"
              data-testid="button-next-level"
            >
              NEXT LEVEL →
            </button>
          )}
          <button 
            onClick={onReplay}
            className="w-full py-3 block-panel font-display text-sm hover:border-primary transition-colors"
            data-testid="button-replay"
          >
            REPLAY LEVEL
          </button>
          <button 
            onClick={onMenu}
            className="w-full py-3 block-panel font-display text-sm hover:border-secondary transition-colors"
            data-testid="button-main-menu"
          >
            MAIN MENU
          </button>
        </div>
      </div>
    </div>
  );
}

function App() {
  const { 
    gameState, 
    setGameState, 
    score, 
    collectCoin, 
    syncWithProfile, 
    stopTimer, 
    notification,
    currentLevel,
    maxUnlockedLevel,
    recordLevelCompletion,
    setLevelProgress,
    selectLevel,
    initializeGame,
    startTimer,
  } = useGameStore();
  const { data: user } = useCurrentUser();
  const { data: profile } = usePlayerProfile();
  const { data: levelProgressData } = useLevelProgress();
  const updateProfile = useUpdateProfile();
  const submitScore = useSubmitScore();
  const updateLevelProgress = useUpdateLevelProgress();

  useEffect(() => {
    if (levelProgressData && user) {
      const formattedProgress = levelProgressData.map(p => ({
        levelNumber: p.levelNumber,
        bestScore: p.bestScore,
        isCompleted: p.isCompleted === 1,
      }));
      setLevelProgress(formattedProgress);
      offlineStorage.mergeServerProgress(levelProgressData);
    } else if (!user) {
      const localProgress = offlineStorage.getLevelProgress();
      if (localProgress.length > 0) {
        setLevelProgress(localProgress);
      }
    }
  }, [levelProgressData, user, setLevelProgress]);

  useEffect(() => {
    if (profile) {
      syncWithProfile(profile);
    }
  }, [profile, syncWithProfile]);

  const handleGameOver = async () => {
    stopTimer();
    playGameOverSound();
    setGameState('GAME_OVER');

    const finalScore = useGameStore.getState().score;
    offlineStorage.updateHighScore(finalScore);

    if (user && profile) {
      const coinsEarned = Math.floor(finalScore / 2);
      
      collectCoin(coinsEarned);
      
      try {
        await updateProfile.mutateAsync({
          coins: profile.coins + coinsEarned,
        });

        await submitScore.mutateAsync(finalScore);
      } catch (error) {
        console.error('Failed to save game progress:', error);
      }
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden bg-background">
      {gameState === 'MENU' && (
        <MainMenu />
      )}
      
      {gameState === 'SHOP' && (
        <Shop />
      )}

      {gameState === 'LEVEL_SELECT' && (
        <LevelSelect />
      )}

      {(gameState === 'PLAYING' || gameState === 'CELEBRATING') && (
        <div className="relative w-full h-full bg-gradient-to-br from-cyan-50 to-teal-100">
          <HUD />
          <div className="absolute left-24 top-16 right-0 bottom-0">
            <GameEngine onGameOver={handleGameOver} />
          </div>
        </div>
      )}

      {gameState === 'GAME_OVER' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 scanlines">
          <div className="block-panel p-8 text-center max-w-sm w-full mx-4 border-4 border-destructive">
            <h2 className="text-2xl font-display text-destructive mb-3 text-shadow-pixel">
              {notification === 'TIME OUT!' ? '★ TIME OUT! ★' : 
               notification === 'TOUCHED BOUNDARY!' ? '★ OUT OF BOUNDS! ★' : 
               '★ COLLISION! ★'}
            </h2>
            <p className="font-ui text-2xl text-foreground/60 mb-6">
              {notification === 'TIME OUT!' ? 'You ran out of time!' : 
               notification === 'TOUCHED BOUNDARY!' ? 'Figure touched the boundary!' : 
               'Two bacteria touched!'}
            </p>
            
            <div className="space-y-3 mb-8 bg-background/50 p-4 border-2 border-foreground/20">
              <div className="flex justify-between items-center">
                <span className="font-ui text-xl text-foreground/60">SCORE</span>
                <span className="font-display text-lg text-secondary" data-testid="text-final-score">
                  {score.toLocaleString()}
                </span>
              </div>
              {user && (
                <div className="flex justify-between items-center">
                  <span className="font-ui text-xl text-foreground/60">GOLD</span>
                  <span className="font-display text-lg text-secondary" data-testid="text-coins-earned">
                    +{Math.floor(score / 2)} G
                  </span>
                </div>
              )}
            </div>
            
            <div className="space-y-3">
              <button 
                onClick={() => {
                  initializeGame();
                  setGameState('PLAYING');
                  startTimer();
                }}
                className="w-full py-4 pixel-btn font-display text-sm"
                data-testid="button-retry"
              >
                RETRY LEVEL
              </button>
              <button 
                onClick={() => setGameState('MENU')}
                className="w-full py-3 block-panel font-display text-sm hover:border-secondary transition-colors"
                data-testid="button-main-menu"
              >
                MAIN MENU
              </button>
            </div>
          </div>
        </div>
      )}

      {gameState === 'WIN' && (
        <WinScreen 
          score={score}
          currentLevel={currentLevel}
          maxUnlockedLevel={maxUnlockedLevel}
          user={user}
          profile={profile}
          onReplay={() => {
            initializeGame();
            setGameState('PLAYING');
            startTimer();
          }}
          onNextLevel={() => {
            const nextLevel = currentLevel + 1;
            if (nextLevel <= LEVELS.length) {
              const levelIndex = nextLevel - 1;
              const levelConfig = LEVELS[levelIndex];
              useGameStore.setState({ 
                currentLevel: nextLevel,
                currentLevelConfig: levelConfig,
                selectedLevel: nextLevel,
              });
              initializeGame();
              setGameState('PLAYING');
              startTimer();
            }
          }}
          onMenu={() => setGameState('MENU')}
          onSaveProgress={async () => {
            recordLevelCompletion(currentLevel, score);
            if (user && profile) {
              try {
                await updateLevelProgress.mutateAsync({
                  levelNumber: currentLevel,
                  score,
                  completed: true,
                });
                await updateProfile.mutateAsync({
                  coins: profile.coins + score,
                });
                await submitScore.mutateAsync(score);
              } catch (error) {
                console.error('Failed to save progress:', error);
              }
            }
          }}
        />
      )}

      <Toaster />
    </div>
  );
}

export default App;

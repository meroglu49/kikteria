import { useEffect, useState, useRef } from "react";
import { Route, Switch } from "wouter";
import { useGameStore, UPGRADE_COSTS } from "./lib/store";
import { GameEngine } from "./components/game/GameEngine";
import { HUD } from "./components/game/HUD";
import { MainMenu } from "./components/game/MainMenu";
import { Shop } from "./components/game/Shop";
import { LevelSelect } from "./components/game/LevelSelect";
import { LabChronicles } from "./components/game/LabChronicles";
import { BacteriaCodex } from "./components/game/BacteriaCodex";
import { MutationChoice } from "./components/game/MutationChoice";
import { EndlessMode } from "./components/game/EndlessMode";
import { UpdateModal } from "./components/game/UpdateModal";
import { AdminPage } from "./pages/Admin";
import { Toaster } from "@/components/ui/toaster";
import { usePlayerProfile, useUpdateProfile, useSubmitScore, useUpdateLevelProgress, useLevelProgress } from "./lib/api";
import { useAuth } from "./hooks/use-auth";
import { LEVELS } from "./lib/game-constants";
import { playGameOverSound } from "./lib/sounds";
import { offlineStorage } from "./lib/offline-storage";
import { useNetworkStatus } from "./lib/network";
import { initGlobalErrorHandlers, trackUserAction } from "./lib/error-logger";
import { AchievementCelebration } from "./components/game/AchievementCelebration";
import { TutorialOverlay, useTutorialState } from "./components/game/Tutorial";
import { FigureQueue } from "./components/game/FigureQueue";

interface WinScreenProps {
  score: number;
  currentLevel: number;
  maxUnlockedLevel: number;
  user: { id: string } | null | undefined;
  profile: { coins: number; highScore: number } | null | undefined;
  onReplay: () => void;
  onNextLevel: () => void;
  onMenu: () => void;
  onSaveProgress: () => Promise<void>;
}

function WinScreen({ score, currentLevel, maxUnlockedLevel, user, profile, onReplay, onNextLevel, onMenu, onSaveProgress }: WinScreenProps) {
  const hasNextLevel = currentLevel < LEVELS.length;
  const isLastLevel = currentLevel >= LEVELS.length;
  const saveCalledRef = useRef(false);
  const [progressSaved, setProgressSaved] = useState(false);
  const { setGameState } = useGameStore();
  
  useEffect(() => {
    if (!saveCalledRef.current) {
      saveCalledRef.current = true;
      onSaveProgress().then(() => setProgressSaved(true)).catch(console.error);
    }
  }, []);

  const handleLevelSelect = () => {
    setGameState('LEVEL_SELECT');
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/95 scanlines crt-vignette">
      <div className="absolute inset-0 grid-bg opacity-20" />
      <div className="block-panel p-8 text-center max-w-sm w-full mx-4 border-2 border-primary shadow-[0_0_40px_rgba(34,242,162,0.4)] relative z-10">
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-black font-display text-xs">
          {isLastLevel ? 'GAME COMPLETE!' : 'SUCCESS'}
        </div>
        <h2 className="text-xl font-display text-primary text-glow mb-2 mt-2">
          {isLastLevel ? 'ALL LEVELS' : `LEVEL ${currentLevel}`}
        </h2>
        <h3 className="text-2xl font-display text-secondary text-glow mb-4">
          {isLastLevel ? '🏆 CHAMPION! 🏆' : '★ COMPLETE! ★'}
        </h3>
        <p className="font-ui text-xl text-muted-foreground mb-6">
          {isLastLevel ? 'You conquered all levels!' : 'All bacteria placed!'}
        </p>
        
        <div className="space-y-3 mb-6 bg-muted p-4 rounded-lg border border-border">
          <div className="flex justify-between items-center">
            <span className="font-ui text-lg text-muted-foreground">SCORE</span>
            <span className="font-display text-lg text-secondary text-glow" data-testid="text-win-score">
              {score.toLocaleString()}
            </span>
          </div>
          {user && (
            <div className="flex justify-between items-center">
              <span className="font-ui text-lg text-muted-foreground">BONUS</span>
              <span className="font-display text-lg coin-display" data-testid="text-win-bonus">
                +{score} G
              </span>
            </div>
          )}
        </div>
        
        <div className="space-y-3">
          {isLastLevel ? (
            <button 
              onClick={handleLevelSelect}
              className="w-full py-4 pixel-btn font-display text-sm animate-glow-pulse"
              data-testid="button-level-select"
            >
              VIEW ALL LEVELS
            </button>
          ) : hasNextLevel && (
            <button 
              onClick={onNextLevel}
              className="w-full py-4 pixel-btn font-display text-sm animate-glow-pulse"
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
  const [updateCheckComplete, setUpdateCheckComplete] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const { tutorialCompleted, completeTutorial } = useTutorialState();
  const { 
    gameState, 
    setGameState, 
    score, 
    coins,
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
    currentLevelConfig,
    buyUpgrade,
  } = useGameStore();
  const { user } = useAuth();
  const { data: profile } = usePlayerProfile();
  const { data: levelProgressData } = useLevelProgress();
  const updateProfile = useUpdateProfile();
  const submitScore = useSubmitScore();
  const updateLevelProgress = useUpdateLevelProgress();
  
  // Network sync for metadata
  useNetworkStatus();
  
  // Track session start on app mount and initialize error handlers
  const sessionStartedRef = useRef(false);
  useEffect(() => {
    if (!sessionStartedRef.current) {
      sessionStartedRef.current = true;
      offlineStorage.trackSessionStart();
      initGlobalErrorHandlers();
    }
  }, []);
  
  // Track level start time for play duration calculation
  const levelStartTimeRef = useRef<number>(0);
  useEffect(() => {
    if (gameState === 'PLAYING') {
      levelStartTimeRef.current = Date.now();
      // Show tutorial for first-time players on level 1
      if (currentLevel === 1 && !tutorialCompleted) {
        setShowTutorial(true);
      }
    }
  }, [gameState, currentLevel, tutorialCompleted]);
  
  // Toggle body class for game playing states (disable scroll during gameplay)
  useEffect(() => {
    const isPlaying = gameState === 'PLAYING' || gameState === 'ENDLESS_PLAYING';
    if (isPlaying) {
      document.body.classList.add('game-playing');
    } else {
      document.body.classList.remove('game-playing');
    }
    return () => document.body.classList.remove('game-playing');
  }, [gameState]);

  // Load from local storage on first mount (before server data arrives)
  useEffect(() => {
    useGameStore.getState().loadFromLocalStorage();
  }, []);

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
    
    // Track metadata: level failure
    const playDuration = Math.floor((Date.now() - levelStartTimeRef.current) / 1000);
    offlineStorage.trackLevelFail(currentLevel, finalScore, playDuration);

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

  const isGameScreen = gameState === 'PLAYING' || gameState === 'ENDLESS_PLAYING' || gameState === 'GAME_OVER' || gameState === 'WIN';
  
  return (
    <div className={`min-h-screen w-full bg-background ${isGameScreen ? 'fixed inset-0 overflow-hidden' : ''}`}>
      <UpdateModal onReady={() => setUpdateCheckComplete(true)} />
      
      {updateCheckComplete && gameState === 'MENU' && (
        <MainMenu />
      )}
      
      {updateCheckComplete && gameState === 'SHOP' && (
        <Shop />
      )}

      {updateCheckComplete && gameState === 'CHRONICLES' && (
        <LabChronicles />
      )}

      {updateCheckComplete && gameState === 'CODEX' && (
        <BacteriaCodex />
      )}

      {updateCheckComplete && gameState === 'ENDLESS_MODE' && (
        <EndlessMode />
      )}

      {updateCheckComplete && gameState === 'MUTATION_CHOICE' && (
        <MutationChoice />
      )}

      {updateCheckComplete && gameState === 'ENDLESS_PLAYING' && (
        <div className="relative w-full h-full bg-background scanlines flex flex-col">
          <div className="absolute inset-0 grid-bg opacity-30" />
          <HUD />
          <div className="flex-1 ml-14 sm:ml-24 mt-12 sm:mt-16 flex items-center justify-center">
            <GameEngine onGameOver={handleGameOver} />
          </div>
          <div className="ml-14 sm:ml-24 z-30">
            <FigureQueue />
          </div>
        </div>
      )}

      {updateCheckComplete && gameState === 'LEVEL_SELECT' && (
        <LevelSelect />
      )}

      {updateCheckComplete && (gameState === 'PLAYING' || gameState === 'CELEBRATING' || gameState === 'GAME_OVER') && (
        <div className="relative w-full h-full bg-background scanlines flex flex-col">
          <div className="absolute inset-0 grid-bg opacity-30" />
          <HUD />
          <div className="flex-1 ml-14 sm:ml-24 mt-12 sm:mt-16 flex items-center justify-center">
            <GameEngine onGameOver={handleGameOver} />
          </div>
          <div className="ml-14 sm:ml-24 z-30">
            <FigureQueue />
          </div>
          {showTutorial && currentLevel === 1 && (
            <TutorialOverlay 
              onComplete={() => {
                setShowTutorial(false);
                completeTutorial();
              }}
              onSkip={() => {
                setShowTutorial(false);
                completeTutorial();
              }}
            />
          )}
        </div>
      )}

      {updateCheckComplete && gameState === 'GAME_OVER' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/95 scanlines crt-vignette">
          <div className="absolute inset-0 grid-bg opacity-20" />
          <div className="block-panel p-8 text-center max-w-sm w-full mx-4 border-2 border-destructive shadow-[0_0_40px_rgba(255,68,68,0.4)] relative z-10">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-destructive text-white font-display text-xs">
              GAME OVER
            </div>
            <h2 className="text-xl font-display text-destructive mb-3 mt-2" style={{ textShadow: '0 0 10px rgba(255,68,68,0.5)' }}>
              {notification === 'TIME OUT!' ? 'TIME OUT!' : 
               notification === 'TOUCHED BOUNDARY!' ? 'OUT OF BOUNDS!' : 
               'COLLISION!'}
            </h2>
            <p className="font-ui text-xl text-muted-foreground mb-6">
              {notification === 'TIME OUT!' ? 'You ran out of time!' : 
               notification === 'TOUCHED BOUNDARY!' ? 'Figure touched the boundary!' : 
               'Two bacteria touched!'}
            </p>
            
            <div className="space-y-3 mb-6 bg-muted p-4 rounded-lg border border-border">
              <div className="flex justify-between items-center">
                <span className="font-ui text-lg text-muted-foreground">SCORE</span>
                <span className="font-display text-lg text-secondary text-glow" data-testid="text-final-score">
                  {score.toLocaleString()}
                </span>
              </div>
              {user && (
                <div className="flex justify-between items-center">
                  <span className="font-ui text-lg text-muted-foreground">GOLD</span>
                  <span className="font-display text-lg coin-display" data-testid="text-coins-earned">
                    +{Math.floor(score / 2)} G
                  </span>
                </div>
              )}
            </div>
            
            <div className="space-y-3">
              {/* Second Chance Button */}
              {(() => {
                const gameState = useGameStore.getState();
                const hasSecondChance = gameState.upgrades.secondChance > 0 && !gameState.secondChanceUsed;
                const canBuySecondChance = coins >= UPGRADE_COSTS.secondChance;
                
                if (hasSecondChance) {
                  return (
                    <button 
                      onClick={() => {
                        trackUserAction('click:second_chance');
                        const success = useGameStore.getState().useSecondChance();
                        if (success) {
                          setGameState('PLAYING');
                          useGameStore.getState().resumeTimer();
                        }
                      }}
                      className="w-full py-4 font-display text-sm bg-orange-500 text-black rounded-lg hover:bg-orange-400 transition-colors animate-pulse"
                      style={{ boxShadow: '0 0 20px rgba(249,115,22,0.6)' }}
                      data-testid="button-second-chance"
                    >
                      🔄 USE SECOND CHANCE ({gameState.upgrades.secondChance} left)
                    </button>
                  );
                } else if (canBuySecondChance && !gameState.secondChanceUsed) {
                  return (
                    <button 
                      onClick={() => {
                        trackUserAction('click:buy_second_chance');
                        const bought = buyUpgrade('secondChance');
                        if (bought) {
                          const success = useGameStore.getState().useSecondChance();
                          if (success) {
                            setGameState('PLAYING');
                            useGameStore.getState().resumeTimer();
                          }
                        }
                      }}
                      className="w-full py-4 font-display text-sm bg-orange-500/80 text-black rounded-lg hover:bg-orange-400 transition-colors border-2 border-orange-400"
                      style={{ boxShadow: '0 0 15px rgba(249,115,22,0.4)' }}
                      data-testid="button-buy-second-chance"
                    >
                      🔄 BUY & USE 2ND CHANCE ({UPGRADE_COSTS.secondChance}G)
                    </button>
                  );
                }
                return null;
              })()}
              
              <button 
                onClick={() => {
                  trackUserAction('click:retry_level');
                  initializeGame();
                  setGameState('PLAYING');
                  startTimer();
                  offlineStorage.trackLevelPlay(currentLevel);
                }}
                className="w-full py-4 pixel-btn font-display text-sm"
                data-testid="button-retry"
              >
                RETRY LEVEL
              </button>
              <button 
                onClick={() => {
                  trackUserAction('click:main_menu');
                  setGameState('MENU');
                }}
                className="w-full py-3 block-panel font-display text-sm hover:border-secondary transition-colors"
                data-testid="button-main-menu"
              >
                MAIN MENU
              </button>
            </div>
          </div>
        </div>
      )}

      {updateCheckComplete && gameState === 'WIN' && (
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
            offlineStorage.trackLevelPlay(currentLevel);
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
              offlineStorage.trackLevelPlay(nextLevel);
            }
          }}
          onMenu={() => setGameState('MENU')}
          onSaveProgress={async () => {
            // Track metadata: level success
            const playDuration = Math.floor((Date.now() - levelStartTimeRef.current) / 1000);
            offlineStorage.trackLevelSuccess(currentLevel, score, playDuration);
            
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
      <AchievementCelebration />
    </div>
  );
}

function AppRouter() {
  return (
    <Switch>
      <Route path="/admin" component={AdminPage} />
      <Route path="/" component={App} />
    </Switch>
  );
}

export default AppRouter;

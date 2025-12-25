import { useState, useEffect } from 'react';
import { useGameStore } from '../../lib/store';
import { X, ChevronRight, Target, AlertTriangle, Clock, Bomb, Trophy } from 'lucide-react';

interface TutorialStep {
  id: string;
  title: string;
  message: string;
  icon: React.ReactNode;
  waitForAction?: 'place' | 'complete';
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome!',
    message: 'Place bacteria without letting them touch each other or borders.',
    icon: <Target className="w-6 h-6 text-primary" />,
  },
  {
    id: 'goal',
    title: 'The Goal',
    message: 'Place ALL bacteria to complete the level!',
    icon: <Trophy className="w-6 h-6 text-secondary" />,
  },
  {
    id: 'placement',
    title: 'How to Play',
    message: 'Tap the quarantine zone to place bacteria. They vibrate!',
    icon: <Target className="w-6 h-6 text-primary" />,
  },
  {
    id: 'try-place',
    title: 'Try It!',
    message: 'Tap to place your first bacteria!',
    icon: <ChevronRight className="w-6 h-6 text-accent" />,
    waitForAction: 'place',
  },
  {
    id: 'collision',
    title: 'Avoid Collisions!',
    message: 'If bacteria touch = GAME OVER!',
    icon: <AlertTriangle className="w-6 h-6 text-destructive" />,
  },
  {
    id: 'timer',
    title: 'Timer',
    message: 'Place all bacteria before time runs out!',
    icon: <Clock className="w-6 h-6 text-primary" />,
  },
  {
    id: 'bombs',
    title: 'Bombs',
    message: 'Use bombs to clear bacteria and make space!',
    icon: <Bomb className="w-6 h-6 text-destructive" />,
  },
  {
    id: 'complete',
    title: 'Good Luck!',
    message: 'Place remaining bacteria to win!',
    icon: <Trophy className="w-6 h-6 text-secondary" />,
    waitForAction: 'complete',
  },
];

const TUTORIAL_KEY = 'kikteria_tutorial_completed';

export function useTutorialState() {
  const [tutorialCompleted, setTutorialCompleted] = useState(() => {
    return localStorage.getItem(TUTORIAL_KEY) === 'true';
  });

  const completeTutorial = () => {
    localStorage.setItem(TUTORIAL_KEY, 'true');
    setTutorialCompleted(true);
  };

  const resetTutorial = () => {
    localStorage.removeItem(TUTORIAL_KEY);
    setTutorialCompleted(false);
  };

  return { tutorialCompleted, completeTutorial, resetTutorial };
}

interface TutorialOverlayProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function TutorialOverlay({ onComplete, onSkip }: TutorialOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const { figuresPlaced, gameState } = useGameStore();
  const [initialFiguresPlaced, setInitialFiguresPlaced] = useState(0);
  
  const step = TUTORIAL_STEPS[currentStep];
  const isLastStep = currentStep === TUTORIAL_STEPS.length - 1;

  useEffect(() => {
    setInitialFiguresPlaced(figuresPlaced);
  }, []);

  useEffect(() => {
    if (step?.waitForAction === 'place' && figuresPlaced > initialFiguresPlaced) {
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
        setInitialFiguresPlaced(figuresPlaced);
      }, 500);
    }
  }, [figuresPlaced, step?.waitForAction, initialFiguresPlaced]);

  useEffect(() => {
    if (step?.waitForAction === 'complete' && gameState === 'WIN') {
      onComplete();
    }
  }, [gameState, step?.waitForAction, onComplete]);

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleSkip = () => {
    onSkip();
  };

  return (
    <div className="fixed left-1 top-20 z-[100] w-[90px]">
      <div className="bg-background/95 border-2 border-primary rounded-lg shadow-[0_0_20px_rgba(34,242,162,0.3)] p-2">
        <button
          onClick={handleSkip}
          className="absolute -top-2 -right-2 p-1 bg-background border border-border rounded-full text-muted-foreground hover:text-foreground transition-colors"
          data-testid="button-skip-tutorial"
        >
          <X size={14} />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 bg-muted rounded">
            {step.icon}
          </div>
        </div>
        
        <h3 className="font-display text-xs text-primary mb-1 leading-tight">{step.title}</h3>
        <p className="font-ui text-[10px] text-muted-foreground leading-tight mb-2">{step.message}</p>

        <div className="flex items-center justify-between gap-1">
          <div className="flex gap-0.5">
            {TUTORIAL_STEPS.map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i === currentStep ? 'bg-primary' : i < currentStep ? 'bg-primary/50' : 'bg-muted'
                }`}
              />
            ))}
          </div>

          {!step?.waitForAction && (
            <button
              onClick={handleNext}
              className="px-2 py-1 bg-primary text-primary-foreground rounded text-[10px] font-display flex items-center gap-0.5 hover:bg-primary/90"
              data-testid="button-tutorial-next"
            >
              {isLastStep ? 'GO' : 'OK'}
              <ChevronRight size={10} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

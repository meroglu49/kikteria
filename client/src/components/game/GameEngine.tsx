import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useGameStore } from '../../lib/store';
import { 
  GAME_CONFIG, 
  BACTERIA_TEMPLATES, 
  BOMB_TEMPLATE,
  FigureInstance,
  ShapeComponent,
  VibrationPattern,
  computeEffectiveRadius,
  getCanvasScaleFactor,
  calculateCanvasDimensions
} from '../../lib/game-constants';

interface GameEngineProps {
  onGameOver: () => void;
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
  color: string;
}

interface ExplosionParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  opacity: number;
  life: number;
}

interface Explosion {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
  shockwaveRadius: number;
  particles: ExplosionParticle[];
  flash: number;
}

interface CollisionHighlight {
  type: 'collision' | 'boundary';
  figureIds?: string[];
  position?: { x: number; y: number };
  timestamp: number;
}

interface ConfettiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  width: number;
  height: number;
  color: string;
  life: number;
}

export function GameEngine({ onGameOver }: GameEngineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  const ripplesRef = useRef<Ripple[]>([]);
  const explosionsRef = useRef<Explosion[]>([]);
  const collisionHighlightRef = useRef<CollisionHighlight | null>(null);
  const confettiRef = useRef<ConfettiParticle[]>([]);
  const celebrationStartedRef = useRef<boolean>(false);
  const gameOverTriggeredRef = useRef(false);
  const collisionHistoryRef = useRef<Map<string, number[]>>(new Map());
  const cleanFrameCountRef = useRef<Map<string, number>>(new Map());
  const [previewPosition, setPreviewPosition] = useState<{ x: number; y: number } | null>(null);
  const [isValidPlacement, setIsValidPlacement] = useState(true);
  const [canvasScale, setCanvasScale] = useState(1);
  const [isDrawingLasso, setIsDrawingLasso] = useState(false);
  
  const { 
    placedFigures, 
    currentFigureId, 
    figureQueue,
    placeFigure,
    upgrades,
    initializeGame,
    setGameState,
    startTimer,
    stopTimer,
    currentLevelConfig,
    timeRemaining,
    gameState,
    isLassoMode,
    lassoPoints,
    addLassoPoint,
    executeLasso,
  } = useGameStore();
  
  const prevGameStateRef = useRef(gameState);
  const mountedRef = useRef(false);

  // Initialize game on mount
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      gameOverTriggeredRef.current = false;
      collisionHighlightRef.current = null;
      celebrationStartedRef.current = false;
      confettiRef.current = [];
      collisionHistoryRef.current.clear();
      cleanFrameCountRef.current.clear();
      initializeGame();
      startTimer();
    }
    
    return () => {
      stopTimer();
      mountedRef.current = false;
    };
  }, [initializeGame, startTimer, stopTimer]);
  
  // Handle game state transitions
  useEffect(() => {
    const prev = prevGameStateRef.current;
    
    if (prev === 'GAME_OVER' && gameState === 'PLAYING') {
      // Resuming from second chance - reset collision detection but don't reinitialize game
      gameOverTriggeredRef.current = false;
      collisionHighlightRef.current = null;
      collisionHistoryRef.current.clear();
      cleanFrameCountRef.current.clear();
    }
    
    prevGameStateRef.current = gameState;
  }, [gameState]);

  const getVibrationOffset = useCallback((pattern: VibrationPattern, time: number, speed: number, amplitude: number) => {
    const t = time * speed;
    switch (pattern) {
      case 'horizontal':
        return { x: Math.sin(t) * amplitude, y: 0 };
      case 'vertical':
        return { x: 0, y: Math.sin(t) * amplitude };
      case 'circular':
        return { x: Math.cos(t) * amplitude, y: Math.sin(t) * amplitude };
      case 'pulse':
        return { x: 0, y: 0, scale: 1 + Math.sin(t) * 0.1 };
      case 'diagonal':
        return { x: Math.sin(t) * amplitude * 0.7, y: Math.sin(t) * amplitude * 0.7 };
      default:
        return { x: 0, y: 0 };
    }
  }, []);

  const drawShape = useCallback((ctx: CanvasRenderingContext2D, shape: ShapeComponent, x: number, y: number, scale: number = 1) => {
    ctx.save();
    ctx.translate(x + shape.offsetX * scale, y + shape.offsetY * scale);
    ctx.rotate((shape.rotation * Math.PI) / 180);
    ctx.fillStyle = shape.color;
    ctx.strokeStyle = shape.strokeColor || '#000';
    ctx.lineWidth = shape.strokeWidth || 2;

    const w = shape.width * scale;
    const h = shape.height * scale;

    switch (shape.type) {
      case 'circle':
        ctx.beginPath();
        ctx.arc(0, 0, w / 2, 0, Math.PI * 2);
        ctx.fill();
        if (shape.strokeColor) ctx.stroke();
        break;
      case 'square':
        ctx.fillRect(-w / 2, -h / 2, w, h);
        if (shape.strokeColor) ctx.strokeRect(-w / 2, -h / 2, w, h);
        break;
      case 'rect':
        ctx.fillRect(-w / 2, -h / 2, w, h);
        if (shape.strokeColor) ctx.strokeRect(-w / 2, -h / 2, w, h);
        break;
      case 'triangle':
        ctx.beginPath();
        ctx.moveTo(0, -h / 2);
        ctx.lineTo(w / 2, h / 2);
        ctx.lineTo(-w / 2, h / 2);
        ctx.closePath();
        ctx.fill();
        if (shape.strokeColor) ctx.stroke();
        break;
      case 'line':
        ctx.fillRect(-w / 2, -h / 2, w, h);
        if (shape.strokeColor) ctx.strokeRect(-w / 2, -h / 2, w, h);
        break;
      case 'oval':
        ctx.beginPath();
        ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        if (shape.strokeColor) ctx.stroke();
        break;
    }
    ctx.restore();
  }, []);

  const drawFigure = useCallback((
    ctx: CanvasRenderingContext2D, 
    figure: FigureInstance, 
    time: number,
    isPreview: boolean = false,
    isInvalid: boolean = false
  ) => {
    const template = figure.templateId === 'bomb' 
      ? BOMB_TEMPLATE 
      : BACTERIA_TEMPLATES.find(t => t.id === figure.templateId);
    
    if (!template) return;

    // Apply level-based speed multiplier and SLOW-MO upgrade
    const state = useGameStore.getState();
    const currentCanvasScale = state.canvasScale;
    const levelSpeedMultiplier = state.currentLevelConfig.speedMultiplier;
    const slowMoReduction = 1 - (state.upgrades.slowMo - 1) * 0.15;
    const speedMultiplier = levelSpeedMultiplier * slowMoReduction;
    const scaledAmplitude = template.vibrationAmplitude * currentCanvasScale;
    const vibration = getVibrationOffset(
      template.vibrationPattern, 
      time + figure.vibrationOffset, 
      template.vibrationSpeed * speedMultiplier, 
      scaledAmplitude
    );

    const x = figure.x + (vibration.x || 0);
    const y = figure.y + (vibration.y || 0);
    const pulseScale = (vibration as { scale?: number }).scale || 1;
    const finalScale = figure.scale * pulseScale * currentCanvasScale;

    ctx.save();
    
    if (isPreview) {
      ctx.globalAlpha = 0.6;
    }

    for (const shape of template.shapes) {
      const modifiedShape = isInvalid 
        ? { ...shape, color: '#FF4444' } 
        : shape;
      drawShape(ctx, modifiedShape, x, y, finalScale);
    }

    // Draw collision border (visible hit area)
    if (figure.isPlaced && figure.templateId !== 'bomb') {
      const collisionRadius = computeEffectiveRadius(
        { ...figure, scale: figure.scale * pulseScale },
        BACTERIA_TEMPLATES,
        BOMB_TEMPLATE,
        currentCanvasScale
      );
      
      ctx.beginPath();
      ctx.arc(x, y, collisionRadius, 0, Math.PI * 2);
      ctx.strokeStyle = isInvalid ? 'rgba(255, 68, 68, 0.6)' : 'rgba(34, 242, 162, 0.4)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();
  }, [drawShape, getVibrationOffset]);

  const getFigurePositionAtTime = useCallback((figure: FigureInstance, time: number) => {
    const template = figure.templateId === 'bomb' 
      ? BOMB_TEMPLATE 
      : BACTERIA_TEMPLATES.find(t => t.id === figure.templateId);
    
    const state = useGameStore.getState();
    const scale = state.canvasScale;
    
    if (!template) return { x: figure.x, y: figure.y, radius: GAME_CONFIG.FIGURE_BASE_SIZE * figure.scale * scale };

    // Apply level-based speed multiplier and SLOW-MO upgrade
    const levelSpeedMultiplier = state.currentLevelConfig.speedMultiplier;
    const slowMoReduction = 1 - (state.upgrades.slowMo - 1) * 0.15;
    const speedMultiplier = levelSpeedMultiplier * slowMoReduction;
    const scaledAmplitude = template.vibrationAmplitude * scale;
    const vibration = getVibrationOffset(
      template.vibrationPattern, 
      time + figure.vibrationOffset, 
      template.vibrationSpeed * speedMultiplier, 
      scaledAmplitude
    );

    const pulseScale = (vibration as { scale?: number }).scale || 1;
    const effectiveRadius = computeEffectiveRadius(
      { ...figure, scale: figure.scale * pulseScale },
      BACTERIA_TEMPLATES,
      BOMB_TEMPLATE,
      scale
    );

    return {
      x: figure.x + (vibration.x || 0),
      y: figure.y + (vibration.y || 0),
      radius: effectiveRadius
    };
  }, [getVibrationOffset]);

  const COLLISION_WINDOW_SIZE = 12;
  const CONTACT_RATIO_THRESHOLD = 0.5;
  
  const checkRuntimeCollisions = useCallback((time: number): { collided: boolean; figureIds?: string[] } => {
    const figures = useGameStore.getState().placedFigures;
    if (figures.length < 2) {
      collisionHistoryRef.current.clear();
      cleanFrameCountRef.current.clear();
      return { collided: false };
    }

    const activePairs = new Set<string>();
    
    for (let i = 0; i < figures.length; i++) {
      for (let j = i + 1; j < figures.length; j++) {
        const posA = getFigurePositionAtTime(figures[i], time);
        const posB = getFigurePositionAtTime(figures[j], time);
        
        const dx = posA.x - posB.x;
        const dy = posA.y - posB.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const rawMinDistance = posA.radius + posB.radius;
        
        const penetrationDepth = Math.max(0, rawMinDistance - distance);
        const isInContact = penetrationDepth > 0;
        
        const pairKey = `${figures[i].id}-${figures[j].id}`;
        activePairs.add(pairKey);
        
        let history = collisionHistoryRef.current.get(pairKey);
        if (!history) {
          history = [];
          collisionHistoryRef.current.set(pairKey, history);
        }
        
        let cleanFrames = cleanFrameCountRef.current.get(pairKey) || 0;
        
        if (isInContact) {
          cleanFrames = 0;
          history.push(penetrationDepth);
        } else {
          cleanFrames++;
          if (cleanFrames >= 3) {
            history.length = 0;
            cleanFrames = 0;
          } else {
            history.push(0);
          }
        }
        cleanFrameCountRef.current.set(pairKey, cleanFrames);
        
        if (history.length > COLLISION_WINDOW_SIZE) {
          history.shift();
        }
        
        const contactFrames = history.filter(d => d > 0).length;
        const contactRatio = history.length > 0 ? contactFrames / history.length : 0;
        
        if (contactRatio >= CONTACT_RATIO_THRESHOLD && history.length >= COLLISION_WINDOW_SIZE) {
          return { collided: true, figureIds: [figures[i].id, figures[j].id] };
        }
      }
    }
    
    Array.from(collisionHistoryRef.current.keys()).forEach(key => {
      if (!activePairs.has(key)) {
        collisionHistoryRef.current.delete(key);
        cleanFrameCountRef.current.delete(key);
      }
    });
    
    return { collided: false };
  }, [getFigurePositionAtTime]);
  
  const findCollidingFigures = useCallback((newFigure: FigureInstance): string[] => {
    const state = useGameStore.getState();
    const figures = state.placedFigures;
    const currentCanvasScale = state.canvasScale;
    const effectiveRadius = computeEffectiveRadius(newFigure, BACTERIA_TEMPLATES, BOMB_TEMPLATE, currentCanvasScale);
    const collidingIds: string[] = [];
    
    for (const placed of figures) {
      const placedEffectiveRadius = computeEffectiveRadius(placed, BACTERIA_TEMPLATES, BOMB_TEMPLATE, currentCanvasScale);
      const dx = newFigure.x - placed.x;
      const dy = newFigure.y - placed.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const minDistance = effectiveRadius + placedEffectiveRadius + 1;
      
      if (distance < minDistance) {
        collidingIds.push(placed.id);
      }
    }
    return collidingIds;
  }, []);

  const createRipple = useCallback((x: number, y: number, color: string = '#4ADE80') => {
    const ripple: Ripple = {
      x,
      y,
      radius: 10,
      maxRadius: 80,
      opacity: 0.6,
      color,
    };
    ripplesRef.current.push(ripple);
  }, []);

  const updateAndDrawRipples = useCallback((ctx: CanvasRenderingContext2D) => {
    const ripples = ripplesRef.current;
    
    for (let i = ripples.length - 1; i >= 0; i--) {
      const ripple = ripples[i];
      
      // Draw ripple
      ctx.save();
      ctx.beginPath();
      ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
      ctx.strokeStyle = ripple.color;
      ctx.lineWidth = 3;
      ctx.globalAlpha = ripple.opacity;
      ctx.stroke();
      
      // Draw inner ripple
      if (ripple.radius > 20) {
        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, ripple.radius * 0.6, 0, Math.PI * 2);
        ctx.lineWidth = 2;
        ctx.globalAlpha = ripple.opacity * 0.7;
        ctx.stroke();
      }
      
      // Draw outer ripple
      ctx.beginPath();
      ctx.arc(ripple.x, ripple.y, ripple.radius * 1.3, 0, Math.PI * 2);
      ctx.lineWidth = 1;
      ctx.globalAlpha = ripple.opacity * 0.4;
      ctx.stroke();
      
      ctx.restore();
      
      // Update ripple
      ripple.radius += 3;
      ripple.opacity -= 0.02;
      
      // Remove faded ripples
      if (ripple.opacity <= 0 || ripple.radius >= ripple.maxRadius) {
        ripples.splice(i, 1);
      }
    }
  }, []);

  const createExplosion = useCallback((x: number, y: number) => {
    const particles: ExplosionParticle[] = [];
    const colors = ['#FF4444', '#FF6600', '#FFAA00', '#FFDD00', '#FF8800'];
    
    // Create explosion particles
    for (let i = 0; i < 30; i++) {
      const angle = (Math.PI * 2 * i) / 30 + Math.random() * 0.3;
      const speed = 3 + Math.random() * 6;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 4 + Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity: 1,
        life: 1,
      });
    }
    
    const explosion: Explosion = {
      x,
      y,
      radius: 10,
      maxRadius: 160,
      opacity: 1,
      shockwaveRadius: 0,
      particles,
      flash: 1,
    };
    explosionsRef.current.push(explosion);
  }, []);

  const updateAndDrawExplosions = useCallback((ctx: CanvasRenderingContext2D) => {
    const explosions = explosionsRef.current;
    
    for (let i = explosions.length - 1; i >= 0; i--) {
      const explosion = explosions[i];
      
      ctx.save();
      
      // Draw flash effect
      if (explosion.flash > 0) {
        const gradient = ctx.createRadialGradient(
          explosion.x, explosion.y, 0,
          explosion.x, explosion.y, 150
        );
        gradient.addColorStop(0, `rgba(255, 255, 200, ${explosion.flash * 0.8})`);
        gradient.addColorStop(0.3, `rgba(255, 150, 50, ${explosion.flash * 0.5})`);
        gradient.addColorStop(1, `rgba(255, 50, 0, 0)`);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(explosion.x, explosion.y, 150, 0, Math.PI * 2);
        ctx.fill();
        explosion.flash -= 0.08;
      }
      
      // Draw shockwave rings
      if (explosion.shockwaveRadius < 180) {
        ctx.beginPath();
        ctx.arc(explosion.x, explosion.y, explosion.shockwaveRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 100, 0, ${1 - explosion.shockwaveRadius / 180})`;
        ctx.lineWidth = 4;
        ctx.stroke();
        
        // Second shockwave
        if (explosion.shockwaveRadius > 30) {
          ctx.beginPath();
          ctx.arc(explosion.x, explosion.y, explosion.shockwaveRadius - 30, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 200, 0, ${0.7 - explosion.shockwaveRadius / 250})`;
          ctx.lineWidth = 3;
          ctx.stroke();
        }
        
        explosion.shockwaveRadius += 8;
      }
      
      // Draw and update particles
      for (let j = explosion.particles.length - 1; j >= 0; j--) {
        const p = explosion.particles[j];
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * p.life, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity * p.life;
        ctx.fill();
        
        // Update particle
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15; // gravity
        p.vx *= 0.98; // friction
        p.life -= 0.025;
        
        if (p.life <= 0) {
          explosion.particles.splice(j, 1);
        }
      }
      
      ctx.restore();
      
      // Remove finished explosions
      if (explosion.particles.length === 0 && explosion.shockwaveRadius >= 180) {
        explosions.splice(i, 1);
      }
    }
  }, []);

  const spawnConfetti = useCallback((canvas: HTMLCanvasElement) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181', '#AA96DA', '#FCBAD3', '#A8D8EA', '#FF9F43', '#6BCB77'];
    const confetti = confettiRef.current;
    
    // Spawn confetti from top of screen
    for (let i = 0; i < 15; i++) {
      confetti.push({
        x: Math.random() * canvas.width,
        y: -20,
        vx: (Math.random() - 0.5) * 6,
        vy: Math.random() * 3 + 2,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 15,
        width: 8 + Math.random() * 8,
        height: 6 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1,
      });
    }
  }, []);

  const updateAndDrawConfetti = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const confetti = confettiRef.current;
    
    for (let i = confetti.length - 1; i >= 0; i--) {
      const p = confetti[i];
      
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life;
      ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
      ctx.restore();
      
      // Update particle
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1; // gravity
      p.vx *= 0.99; // air resistance
      p.rotation += p.rotationSpeed;
      
      // Fade out when near bottom
      if (p.y > canvas.height - 100) {
        p.life -= 0.02;
      }
      
      // Remove dead confetti
      if (p.life <= 0 || p.y > canvas.height + 50) {
        confetti.splice(i, 1);
      }
    }
  }, []);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const time = timeRef.current;
    timeRef.current += 0.016;

    const currentGameState = useGameStore.getState().gameState;
    
    // Handle celebration state - spawn confetti
    if (currentGameState === 'CELEBRATING') {
      if (!celebrationStartedRef.current) {
        celebrationStartedRef.current = true;
        confettiRef.current = [];
      }
      // Spawn confetti continuously during celebration
      if (Math.random() < 0.4) {
        spawnConfetti(canvas);
      }
    } else {
      celebrationStartedRef.current = false;
    }

    // Only check collisions when playing (not celebrating)
    if (currentGameState === 'PLAYING') {
      const gameState = useGameStore.getState();
      const isInCooldown = gameState.shieldCooldownUntil > Date.now();
      
      if (!isInCooldown) {
        const collisionResult = checkRuntimeCollisions(time);
        if (!gameOverTriggeredRef.current && collisionResult.collided) {
          const hasShield = gameState.upgrades.shield >= 1 && !gameState.shieldUsed;
          
          if (hasShield && collisionResult.figureIds && collisionResult.figureIds.length > 0) {
            const figureToRemove = collisionResult.figureIds[collisionResult.figureIds.length - 1];
            useGameStore.getState().removeFigure(figureToRemove);
            useGameStore.getState().useShield();
            collisionHistoryRef.current.clear();
            cleanFrameCountRef.current.clear();
          } else {
            gameOverTriggeredRef.current = true;
            collisionHighlightRef.current = {
              type: 'collision',
              figureIds: collisionResult.figureIds,
              timestamp: Date.now(),
            };
            useGameStore.getState().setNotification('COLLISION!');
            useGameStore.getState().triggerKikAnnouncement('gameOverCollision');
            setTimeout(() => {
              setGameState('GAME_OVER');
              onGameOver();
            }, 800);
          }
        }
      }
    }

    ctx.fillStyle = GAME_CONFIG.COLORS.BACKGROUND;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = GAME_CONFIG.COLORS.GRID;
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Calculate dynamic padding for shrinking play area with canvas scale
    const currentCanvasScale = useGameStore.getState().canvasScale;
    const basePadding = GAME_CONFIG.CANVAS_PADDING * currentCanvasScale;
    const levelConfig = useGameStore.getState().currentLevelConfig;
    const currentTime = useGameStore.getState().timeRemaining;
    const maxTime = levelConfig.startTime;
    const timeElapsed = maxTime - currentTime;
    const shrinkAmount = Math.max(0, timeElapsed * levelConfig.areaShrinkRate * currentCanvasScale);
    const dynamicPadding = basePadding + shrinkAmount;
    const isShrinking = shrinkAmount > 0;
    
    // Draw the play area boundary with dynamic padding
    const boundaryColor = isShrinking ? '#FF6B6B' : '#4ADE80';
    ctx.strokeStyle = boundaryColor;
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 5]);
    ctx.strokeRect(dynamicPadding, dynamicPadding, canvas.width - dynamicPadding * 2, canvas.height - dynamicPadding * 2);
    ctx.setLineDash([]);
    
    // Use dynamic padding for click handling
    const padding = dynamicPadding;

    for (const figure of placedFigures) {
      drawFigure(ctx, figure, time);
    }
    
    // Draw collision highlight on figures that caused game over
    const highlight = collisionHighlightRef.current;
    if (highlight && highlight.type === 'collision' && highlight.figureIds) {
      const elapsed = Date.now() - highlight.timestamp;
      const pulse = Math.sin(elapsed * 0.02) * 0.3 + 0.7;
      
      for (const figureId of highlight.figureIds) {
        const figure = placedFigures.find(f => f.id === figureId);
        if (figure) {
          const pos = getFigurePositionAtTime(figure, time);
          ctx.save();
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, pos.radius + 15, 0, Math.PI * 2);
          ctx.strokeStyle = '#FF0000';
          ctx.lineWidth = 6;
          ctx.globalAlpha = pulse;
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, pos.radius + 25, 0, Math.PI * 2);
          ctx.strokeStyle = '#FF6B6B';
          ctx.lineWidth = 3;
          ctx.globalAlpha = pulse * 0.5;
          ctx.stroke();
          ctx.restore();
        }
      }
    }
    
    // Draw boundary collision highlight
    if (highlight && highlight.type === 'boundary' && highlight.position) {
      const elapsed = Date.now() - highlight.timestamp;
      const pulse = Math.sin(elapsed * 0.02) * 0.3 + 0.7;
      
      ctx.save();
      ctx.beginPath();
      ctx.arc(highlight.position.x, highlight.position.y, 50, 0, Math.PI * 2);
      ctx.strokeStyle = '#FF0000';
      ctx.lineWidth = 8;
      ctx.globalAlpha = pulse;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(highlight.position.x, highlight.position.y, 70, 0, Math.PI * 2);
      ctx.strokeStyle = '#FF6B6B';
      ctx.lineWidth = 4;
      ctx.globalAlpha = pulse * 0.5;
      ctx.stroke();
      ctx.restore();
    }

    // Draw water drop ripples
    updateAndDrawRipples(ctx);
    
    // Draw bomb explosions
    updateAndDrawExplosions(ctx);
    
    // Draw confetti during celebration
    updateAndDrawConfetti(ctx, canvas);
    
    // Draw lasso path when in lasso mode
    const currentLassoPoints = useGameStore.getState().lassoPoints;
    if (currentLassoPoints.length > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(currentLassoPoints[0].x, currentLassoPoints[0].y);
      for (let i = 1; i < currentLassoPoints.length; i++) {
        ctx.lineTo(currentLassoPoints[i].x, currentLassoPoints[i].y);
      }
      ctx.strokeStyle = '#A855F7';
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      
      // Draw dots at each point
      for (const point of currentLassoPoints) {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#A855F7';
        ctx.fill();
      }
      ctx.restore();
    }

    if (previewPosition && currentFigureId) {
      const sizeMultiplier = 1 + (upgrades.figureSize - 1) * 0.1;
      const previewFigure: FigureInstance = {
        id: 'preview',
        templateId: currentFigureId,
        x: previewPosition.x,
        y: previewPosition.y,
        rotation: 0,
        scale: sizeMultiplier,
        vibrationOffset: 0,
        isPlaced: false,
      };
      drawFigure(ctx, previewFigure, time, true, !isValidPlacement);
    }

    animationRef.current = requestAnimationFrame(render);
  }, [placedFigures, currentFigureId, figureQueue, previewPosition, isValidPlacement, upgrades, drawFigure, checkRuntimeCollisions, setGameState, onGameOver, updateAndDrawRipples, updateAndDrawExplosions, getFigurePositionAtTime, spawnConfetti, updateAndDrawConfetti]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationRef.current);
  }, [render]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const container = canvas.parentElement;
      if (container) {
        const { width, height } = calculateCanvasDimensions(container.clientWidth, container.clientHeight);
        canvas.width = width;
        canvas.height = height;
        const scale = getCanvasScaleFactor(width, height);
        setCanvasScale(scale);
        useGameStore.getState().setCanvasScale(scale);
      }
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const getScaleForTemplate = useCallback((templateId: string) => {
    const template = templateId === 'bomb' 
      ? BOMB_TEMPLATE 
      : BACTERIA_TEMPLATES.find(t => t.id === templateId);
    if (!template) return 1;
    const upgradeMultiplier = 1 - (upgrades.figureSize - 1) * 0.1;
    const levelSizeMultiplier = useGameStore.getState().currentLevelConfig.sizeMultiplier;
    return template.baseScale * upgradeMultiplier * levelSizeMultiplier;
  }, [upgrades]);

  const getDynamicPadding = useCallback(() => {
    const state = useGameStore.getState();
    const basePadding = GAME_CONFIG.CANVAS_PADDING * state.canvasScale;
    const levelConfig = state.currentLevelConfig;
    const currentTime = state.timeRemaining;
    const maxTime = levelConfig.startTime;
    const timeElapsed = maxTime - currentTime;
    const shrinkAmount = Math.max(0, timeElapsed * levelConfig.areaShrinkRate * state.canvasScale);
    return basePadding + shrinkAmount;
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Always get fresh state from store to avoid stale closures
    const state = useGameStore.getState();
    
    // If in lasso mode, handle lasso drawing (no figure preview)
    if (state.isLassoMode) {
      setPreviewPosition(null);
      if (isDrawingLasso) {
        state.addLassoPoint(x, y);
      }
      return;
    }

    if (!currentFigureId) return;

    setPreviewPosition({ x, y });

    if (currentFigureId !== 'bomb') {
      // Check boundary collision with dynamic padding
      const scale = getScaleForTemplate(currentFigureId);
      const scaledBaseSize = GAME_CONFIG.FIGURE_BASE_SIZE * canvasScale;
      const radius = scaledBaseSize * scale;
      const padding = getDynamicPadding();
      
      const touchesBoundary = (
        x - radius < padding || 
        x + radius > canvas.width - padding || 
        y - radius < padding || 
        y + radius > canvas.height - padding
      );
      
      if (touchesBoundary) {
        setIsValidPlacement(false);
        return;
      }
      
      const testFigure: FigureInstance = {
        id: 'test',
        templateId: currentFigureId,
        x,
        y,
        rotation: 0,
        scale: scale,
        vibrationOffset: 0,
        isPlaced: false,
      };
      setIsValidPlacement(findCollidingFigures(testFigure).length === 0);
    } else {
      setIsValidPlacement(true);
    }
  }, [currentFigureId, findCollidingFigures, getScaleForTemplate, getDynamicPadding, canvasScale, isDrawingLasso]);

  const checkBoundaryCollision = useCallback((x: number, y: number, templateId: string, canvas: HTMLCanvasElement) => {
    const scale = getScaleForTemplate(templateId);
    const currentCanvasScale = useGameStore.getState().canvasScale;
    const scaledBaseSize = GAME_CONFIG.FIGURE_BASE_SIZE * currentCanvasScale;
    const radius = scaledBaseSize * scale;
    const padding = getDynamicPadding();
    
    // Check if figure touches or goes outside boundaries (using dynamic shrinking area)
    if (x - radius < padding || 
        x + radius > canvas.width - padding || 
        y - radius < padding || 
        y + radius > canvas.height - padding) {
      return true;
    }
    return false;
  }, [getScaleForTemplate, getDynamicPadding]);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const previewHeight = 120;
    if (y > canvas.height - previewHeight) return;

    const padding = getDynamicPadding();
    // Don't allow clicking outside play area at all
    if (x < padding || x > canvas.width - padding || y < padding) return;

    if (gameOverTriggeredRef.current) return;
    
    // Check for lasso mode first - start drawing
    const state = useGameStore.getState();
    if (state.isLassoMode) {
      setIsDrawingLasso(true);
      state.addLassoPoint(x, y);
      return;
    }
    
    // Check for bomb targeting mode
    if (state.bombTargetingMode) {
      const result = useGameStore.getState().detonateBombAt(x, y);
      if (result.success) {
        createExplosion(x, y);
      }
      return;
    }
    
    // Need a current figure for regular placement
    if (!currentFigureId) return;
    
    if (currentFigureId === 'bomb') {
      placeFigure(x, y);
      // Explosion effect for bomb
      createExplosion(x, y);
    } else {
      // Check boundary collision - figure would touch the border
      const touchesBoundary = checkBoundaryCollision(x, y, currentFigureId, canvas);
      if (touchesBoundary) {
        const gameState = useGameStore.getState();
        const hasShield = gameState.upgrades.shield >= 1 && !gameState.shieldUsed;
        
        if (hasShield) {
          useGameStore.getState().useShield();
          return;
        } else {
          gameOverTriggeredRef.current = true;
          collisionHighlightRef.current = {
            type: 'boundary',
            position: { x, y },
            timestamp: Date.now(),
          };
          useGameStore.getState().setNotification('TOUCHED BOUNDARY!');
          setTimeout(() => {
            setGameState('GAME_OVER');
            onGameOver();
          }, 800);
          return;
        }
      }
      
      // Check collision with other figures
      const testFigure: FigureInstance = {
        id: 'test',
        templateId: currentFigureId,
        x,
        y,
        rotation: 0,
        scale: getScaleForTemplate(currentFigureId),
        vibrationOffset: 0,
        isPlaced: false,
      };
      
      const collidingFigureIds = findCollidingFigures(testFigure);
      if (collidingFigureIds.length > 0) {
        const gameState = useGameStore.getState();
        const hasShield = gameState.upgrades.shield >= 1 && !gameState.shieldUsed;
        
        if (hasShield) {
          useGameStore.getState().useShield();
          return;
        } else {
          gameOverTriggeredRef.current = true;
          collisionHighlightRef.current = {
            type: 'collision',
            figureIds: collidingFigureIds,
            timestamp: Date.now(),
          };
          useGameStore.getState().setNotification('COLLISION!');
          setTimeout(() => {
            setGameState('GAME_OVER');
            onGameOver();
          }, 800);
          return;
        }
      }
      
      placeFigure(x, y);
      // Water drop ripple effect on successful placement
      createRipple(x, y, '#4ADE80');
    }
  }, [currentFigureId, placeFigure, findCollidingFigures, getScaleForTemplate, checkBoundaryCollision, setGameState, onGameOver, createRipple, createExplosion, getDynamicPadding]);

  const handlePointerLeave = useCallback(() => {
    setPreviewPosition(null);
  }, []);

  const handlePointerUp = useCallback(() => {
    // If we were drawing a lasso, execute it
    if (isDrawingLasso) {
      setIsDrawingLasso(false);
      useGameStore.getState().executeLasso();
    }
  }, [isDrawingLasso]);

  return (
    <canvas
      ref={canvasRef}
      className="cursor-crosshair touch-none"
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      data-testid="game-canvas"
    />
  );
}

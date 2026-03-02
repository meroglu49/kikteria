import { useEffect, useRef, memo } from 'react';
import { useGameStore } from '../../lib/store';
import { BACTERIA_TEMPLATES, BOMB_TEMPLATE, ShapeComponent } from '../../lib/game-constants';

const templateCache = new Map<string, typeof BACTERIA_TEMPLATES[0]>();
function getCachedTemplate(id: string) {
  let t = templateCache.get(id);
  if (!t) {
    t = id === 'bomb' ? BOMB_TEMPLATE : BACTERIA_TEMPLATES.find(x => x.id === id);
    if (t) templateCache.set(id, t);
  }
  return t;
}

export const FigureQueue = memo(function FigureQueue() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const currentFigureId = useGameStore(s => s.currentFigureId);
  const figureQueue = useGameStore(s => s.figureQueue);
  const queueSize = useGameStore(s => s.upgrades.queueSize);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const time = performance.now() / 1000;
      
      ctx.fillStyle = '#123842';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.strokeStyle = '#4ADE80';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, canvas.width, canvas.height);

      if (currentFigureId) {
        drawFigure(ctx, currentFigureId, 30, canvas.height / 2, 0.7, time);
      }

      const previewCount = Math.min(queueSize, 3, figureQueue.length);
      for (let i = 0; i < previewCount; i++) {
        const templateId = figureQueue[i];
        drawFigure(ctx, templateId, 70 + i * 18, canvas.height / 2, 0.3, time + i);
      }

      animationRef.current = requestAnimationFrame(render);
    };

    const drawFigure = (ctx: CanvasRenderingContext2D, templateId: string, x: number, y: number, scale: number, _time: number) => {
      const template = getCachedTemplate(templateId);
      if (!template) return;

      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale * template.baseScale, scale * template.baseScale);

      for (const shape of template.shapes) {
        drawShape(ctx, shape);
      }

      ctx.restore();
    };

    const drawShape = (ctx: CanvasRenderingContext2D, shape: ShapeComponent) => {
      ctx.save();
      ctx.translate(shape.offsetX, shape.offsetY);
      ctx.rotate(shape.rotation);
      ctx.fillStyle = shape.color;
      if (shape.strokeColor) {
        ctx.strokeStyle = shape.strokeColor;
        ctx.lineWidth = shape.strokeWidth || 2;
      }

      switch (shape.type) {
        case 'circle':
          ctx.beginPath();
          ctx.arc(0, 0, shape.width / 2, 0, Math.PI * 2);
          ctx.fill();
          if (shape.strokeColor) ctx.stroke();
          break;
        case 'oval':
          ctx.beginPath();
          ctx.ellipse(0, 0, shape.width / 2, shape.height / 2, 0, 0, Math.PI * 2);
          ctx.fill();
          if (shape.strokeColor) ctx.stroke();
          break;
        case 'square':
        case 'rect':
          ctx.fillRect(-shape.width / 2, -shape.height / 2, shape.width, shape.height);
          if (shape.strokeColor) ctx.strokeRect(-shape.width / 2, -shape.height / 2, shape.width, shape.height);
          break;
        case 'triangle':
          ctx.beginPath();
          ctx.moveTo(0, -shape.height / 2);
          ctx.lineTo(-shape.width / 2, shape.height / 2);
          ctx.lineTo(shape.width / 2, shape.height / 2);
          ctx.closePath();
          ctx.fill();
          if (shape.strokeColor) ctx.stroke();
          break;
        case 'line':
          ctx.beginPath();
          ctx.moveTo(-shape.width / 2, 0);
          ctx.lineTo(shape.width / 2, 0);
          ctx.strokeStyle = shape.color;
          ctx.lineWidth = shape.height;
          ctx.stroke();
          break;
      }

      ctx.restore();
    };

    animationRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationRef.current);
  }, [currentFigureId, figureQueue, queueSize]);

  return (
    <div className="w-full h-full bg-gradient-to-r from-muted/80 to-background/80 border-t border-primary/20 flex items-center justify-center">
      <canvas 
        ref={canvasRef} 
        width={120} 
        height={36}
        className="rounded"
      />
    </div>
  );
});

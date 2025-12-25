import { useEffect, useRef } from 'react';
import { useGameStore } from '../../lib/store';
import { BACTERIA_TEMPLATES, BOMB_TEMPLATE, FigureInstance, ShapeComponent } from '../../lib/game-constants';

export function FigureQueue() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const { currentFigureId, figureQueue, upgrades } = useGameStore();

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

      ctx.fillStyle = '#4ADE80';
      ctx.font = '10px "Press Start 2P"';
      ctx.textAlign = 'center';
      ctx.fillText('NEXT', canvas.width / 2, 14);

      if (currentFigureId) {
        drawFigure(ctx, currentFigureId, canvas.width / 2, 45, 1.0, time);
      }

      const previewCount = Math.min(upgrades.queueSize, 3, figureQueue.length);
      for (let i = 0; i < previewCount; i++) {
        const templateId = figureQueue[i];
        drawFigure(ctx, templateId, canvas.width - 25, 25 + i * 20, 0.35, time + i);
      }

      animationRef.current = requestAnimationFrame(render);
    };

    const drawFigure = (ctx: CanvasRenderingContext2D, templateId: string, x: number, y: number, scale: number, time: number) => {
      const template = templateId === 'bomb' 
        ? BOMB_TEMPLATE 
        : BACTERIA_TEMPLATES.find(t => t.id === templateId);
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
  }, [currentFigureId, figureQueue, upgrades.queueSize]);

  return (
    <div className="w-full h-16 sm:h-20 bg-gradient-to-r from-muted to-background border-t-2 border-primary/30 flex items-center justify-center">
      <canvas 
        ref={canvasRef} 
        width={160} 
        height={70}
        className="rounded"
      />
    </div>
  );
}

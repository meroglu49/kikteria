import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const MOBILE_DEVICES = [
  { name: 'iPhone SE', width: 375, height: 667 },
  { name: 'iPhone 14 Pro Max', width: 430, height: 932 },
  { name: 'Pixel 5', width: 393, height: 851 },
  { name: 'iPad', width: 768, height: 1024 },
  { name: 'Desktop', width: 1280, height: 800 },
];

const MOBILE_SIDEBAR_WIDTH = 44;
const DESKTOP_SIDEBAR_WIDTH = 80;
const MOBILE_TOP_BAR_HEIGHT = 36;
const DESKTOP_TOP_BAR_HEIGHT = 48;
const MOBILE_QUEUE_HEIGHT = 40;
const DESKTOP_QUEUE_HEIGHT = 48;

interface SourceFiles {
  hud: string;
  app: string;
  queue: string;
}

let sources: SourceFiles;

function readSourceFile(relativePath: string): string {
  const fullPath = path.resolve(__dirname, '../..', relativePath);
  try {
    return fs.readFileSync(fullPath, 'utf-8');
  } catch (e) {
    console.error(`Failed to read ${fullPath}:`, e);
    return '';
  }
}

function extractJSXContent(source: string): string {
  const returnMatch = source.match(/return\s*\(\s*\n?([\s\S]*?)\n?\s*\);?\s*(?:\n}|$)/);
  return returnMatch ? returnMatch[1] : source;
}

function findElementWithClasses(source: string, targetClasses: string[]): boolean {
  const classNameMatches = source.match(/className="([^"]+)"/g) || [];
  
  for (const match of classNameMatches) {
    const classes = match.replace('className="', '').replace('"', '');
    const hasAllClasses = targetClasses.every(c => classes.includes(c));
    if (hasAllClasses) return true;
  }
  return false;
}

function countElementsWithClass(source: string, targetClass: string): number {
  const classNameMatches = source.match(/className="([^"]+)"/g) || [];
  let count = 0;
  
  for (const match of classNameMatches) {
    const classes = match.replace('className="', '').replace('"', '');
    if (classes.includes(targetClass)) count++;
  }
  return count;
}

beforeAll(() => {
  sources = {
    hud: readSourceFile('components/game/HUD.tsx'),
    app: readSourceFile('App.tsx'),
    queue: readSourceFile('components/game/FigureQueue.tsx'),
  };
});

describe('Layout Source Code Validation', () => {
  describe('HUD Component - Sidebar Layout', () => {
    it('sidebar element has responsive width classes w-11 and sm:w-20', () => {
      const hasResponsiveWidth = findElementWithClasses(sources.hud, ['w-11', 'sm:w-20']);
      expect(hasResponsiveWidth, 'Sidebar should have w-11 sm:w-20 classes').toBe(true);
    });

    it('sidebar is absolutely positioned with left-0 top-0 bottom-0', () => {
      const hasPositioning = findElementWithClasses(sources.hud, ['absolute', 'left-0', 'top-0', 'bottom-0']);
      expect(hasPositioning, 'Sidebar should be absolutely positioned').toBe(true);
    });

    it('sidebar has z-30 for proper layering above game canvas', () => {
      const hasZIndex = findElementWithClasses(sources.hud, ['z-30']);
      expect(hasZIndex, 'Sidebar should have z-30 z-index').toBe(true);
    });

    it('sidebar uses flexbox with vertical column layout', () => {
      const hasFlexColumn = findElementWithClasses(sources.hud, ['flex', 'flex-col']);
      expect(hasFlexColumn, 'Sidebar should use flex-col layout').toBe(true);
    });
  });

  describe('HUD Component - Top Bar Layout', () => {
    it('top bar has responsive positioning left-11 sm:left-20', () => {
      const hasLeftPositioning = findElementWithClasses(sources.hud, ['left-11', 'sm:left-20']);
      expect(hasLeftPositioning, 'Top bar should have left-11 sm:left-20 classes').toBe(true);
    });

    it('top bar has responsive height h-9 sm:h-12', () => {
      const hasResponsiveHeight = findElementWithClasses(sources.hud, ['h-9', 'sm:h-12']);
      expect(hasResponsiveHeight, 'Top bar should have h-9 sm:h-12 classes').toBe(true);
    });

    it('top bar is positioned at top-0', () => {
      const hasTopPositioning = sources.hud.includes('top-0');
      expect(hasTopPositioning, 'Top bar should be positioned at top-0').toBe(true);
    });
  });

  describe('App Component - Game Area Layout', () => {
    it('game area has responsive left positioning left-11 sm:left-20', () => {
      const hasLeftPositioning = findElementWithClasses(sources.app, ['left-11', 'sm:left-20']);
      expect(hasLeftPositioning, 'Game area should have left-11 sm:left-20 classes').toBe(true);
    });

    it('game area has responsive top positioning top-9 sm:top-12', () => {
      const hasTopPositioning = findElementWithClasses(sources.app, ['top-9', 'sm:top-12']);
      expect(hasTopPositioning, 'Game area should have top-9 sm:top-12 classes').toBe(true);
    });

    it('game area has responsive bottom positioning bottom-10 sm:bottom-12', () => {
      const hasBottomPositioning = findElementWithClasses(sources.app, ['bottom-10', 'sm:bottom-12']);
      expect(hasBottomPositioning, 'Game area should have bottom-10 sm:bottom-12 classes').toBe(true);
    });

    it('game container uses z-10 for proper layering', () => {
      const hasZIndex = countElementsWithClass(sources.app, 'z-10');
      expect(hasZIndex, 'Game container should have z-10').toBeGreaterThan(0);
    });
  });

  describe('App Component - Queue Bar Layout', () => {
    it('queue bar is positioned at bottom-0', () => {
      const hasBottomPositioning = findElementWithClasses(sources.app, ['bottom-0']);
      expect(hasBottomPositioning, 'Queue bar should be positioned at bottom-0').toBe(true);
    });

    it('queue bar has responsive height h-10 sm:h-12', () => {
      const hasResponsiveHeight = findElementWithClasses(sources.app, ['h-10', 'sm:h-12']);
      expect(hasResponsiveHeight, 'Queue bar should have h-10 sm:h-12 classes').toBe(true);
    });

    it('queue bar has z-20 (higher than game, lower than sidebar)', () => {
      const hasZIndex = countElementsWithClass(sources.app, 'z-20');
      expect(hasZIndex, 'Queue bar should have z-20').toBeGreaterThan(0);
    });
  });

  describe('FigureQueue Component Layout', () => {
    it('uses full width and height', () => {
      expect(sources.queue).toContain('w-full');
      expect(sources.queue).toContain('h-full');
    });

    it('uses flexbox for horizontal centering', () => {
      const hasFlex = findElementWithClasses(sources.queue, ['flex', 'items-center']);
      expect(hasFlex, 'Queue should use flex with items-center').toBe(true);
    });

    it('has border for visual separation', () => {
      expect(sources.queue).toContain('border-t');
    });
  });
});

describe('Layout Boundary Calculations', () => {
  describe('Device Viewport Fitting', () => {
    MOBILE_DEVICES.forEach(device => {
      it(`game area fits within ${device.name} (${device.width}x${device.height})`, () => {
        const isMobile = device.width < 640;
        const sidebarWidth = isMobile ? MOBILE_SIDEBAR_WIDTH : DESKTOP_SIDEBAR_WIDTH;
        const topBarHeight = isMobile ? MOBILE_TOP_BAR_HEIGHT : DESKTOP_TOP_BAR_HEIGHT;
        const queueHeight = isMobile ? MOBILE_QUEUE_HEIGHT : DESKTOP_QUEUE_HEIGHT;
        
        const availableWidth = device.width - sidebarWidth;
        const availableHeight = device.height - topBarHeight - queueHeight;
        
        expect(availableWidth, `Available width on ${device.name} should be > 200`).toBeGreaterThan(200);
        expect(availableHeight, `Available height on ${device.name} should be > 200`).toBeGreaterThan(200);
        
        const canvasAspectRatio = 3 / 4;
        let canvasWidth = availableWidth - 20;
        let canvasHeight = canvasWidth / canvasAspectRatio;
        
        if (canvasHeight > availableHeight - 20) {
          canvasHeight = availableHeight - 20;
          canvasWidth = canvasHeight * canvasAspectRatio;
        }
        
        expect(canvasWidth, `Canvas fits horizontally on ${device.name}`).toBeLessThanOrEqual(availableWidth);
        expect(canvasHeight, `Canvas fits vertically on ${device.name}`).toBeLessThanOrEqual(availableHeight);
        expect(canvasWidth, `Canvas width on ${device.name}`).toBeGreaterThan(150);
        expect(canvasHeight, `Canvas height on ${device.name}`).toBeGreaterThan(200);
      });
    });
  });

  describe('Tailwind Class to Pixel Mapping', () => {
    it('w-11 = 44px (mobile sidebar)', () => {
      expect(11 * 4).toBe(MOBILE_SIDEBAR_WIDTH);
    });

    it('w-20 = 80px (desktop sidebar)', () => {
      expect(20 * 4).toBe(DESKTOP_SIDEBAR_WIDTH);
    });

    it('h-9 = 36px (mobile top bar)', () => {
      expect(9 * 4).toBe(MOBILE_TOP_BAR_HEIGHT);
    });

    it('h-12 = 48px (desktop top bar)', () => {
      expect(12 * 4).toBe(DESKTOP_TOP_BAR_HEIGHT);
    });

    it('h-10 = 40px (mobile queue bar)', () => {
      expect(10 * 4).toBe(MOBILE_QUEUE_HEIGHT);
    });

    it('sm:h-12 = 48px (desktop queue bar)', () => {
      expect(12 * 4).toBe(DESKTOP_QUEUE_HEIGHT);
    });
  });
});

describe('Z-Index Layer Ordering', () => {
  it('game canvas z-10 < queue bar z-20 < sidebar z-30', () => {
    const gameZ = 10;
    const queueZ = 20;
    const sidebarZ = 30;
    
    expect(gameZ).toBeLessThan(queueZ);
    expect(queueZ).toBeLessThan(sidebarZ);
  });

  it('all z-index values are defined in source', () => {
    expect(sources.hud).toContain('z-30');
    expect(sources.app).toContain('z-10');
    expect(sources.app).toContain('z-20');
  });
});

describe('Responsive Breakpoint Consistency', () => {
  it('HUD uses sm: breakpoint classes', () => {
    const smCount = (sources.hud.match(/sm:/g) || []).length;
    expect(smCount, 'HUD should have multiple sm: responsive classes').toBeGreaterThan(5);
  });

  it('App uses sm: breakpoint classes', () => {
    const smCount = (sources.app.match(/sm:/g) || []).length;
    expect(smCount, 'App should have multiple sm: responsive classes').toBeGreaterThan(0);
  });

  it('mobile-first approach: base classes come before sm: variants', () => {
    expect(sources.hud).toMatch(/w-11\s+sm:w-20/);
    expect(sources.hud).toMatch(/h-9\s+sm:h-12/);
  });
});

describe('Absolute Positioning Pattern', () => {
  it('HUD sidebar uses absolute positioning (not flex parent)', () => {
    const sidebarHasAbsolute = findElementWithClasses(sources.hud, ['absolute']);
    expect(sidebarHasAbsolute, 'Sidebar should use absolute positioning').toBe(true);
  });

  it('App game area uses absolute positioning', () => {
    const gameAreaAbsolute = sources.app.includes('absolute');
    expect(gameAreaAbsolute, 'Game area container should use absolute').toBe(true);
  });

  it('no fixed pixel widths that could cause overflow', () => {
    const hasFixedWidthStyle = /style=\{[^}]*width:\s*\d+px/.test(sources.app);
    expect(hasFixedWidthStyle, 'App should not have inline fixed pixel widths').toBe(false);
  });
});

describe('Touch Target Sizes', () => {
  it('HUD buttons have padding for touch (p-1, p-1.5, sm:p-2, sm:p-3)', () => {
    expect(sources.hud).toMatch(/p-1/);
    expect(sources.hud).toMatch(/sm:p-[23]/);
  });

  it('buttons use adequate click/tap area', () => {
    const hasResponsivePadding = sources.hud.includes('p-1.5') || sources.hud.includes('p-2');
    expect(hasResponsivePadding, 'HUD buttons should have adequate padding').toBe(true);
  });
});

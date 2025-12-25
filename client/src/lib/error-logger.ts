import { offlineStorage, type ErrorLogEntry } from './offline-storage';
import { useGameStore } from './store';

type ErrorSeverity = 'error' | 'warn' | 'info';
type ErrorCategory = 'runtime' | 'api' | 'sync' | 'game' | 'asset';

const SENSITIVE_KEYS = [
  'password', 'token', 'secret', 'auth', 'key', 'credential',
  'email', 'phone', 'address', 'ssn', 'credit', 'card',
  'cookie', 'session', 'bearer', 'oauth', 'jwt'
];

function sanitizeString(str: string): string {
  let result = str;
  for (const key of SENSITIVE_KEYS) {
    const regex = new RegExp(`(${key}[\\s]*[=:]?[\\s]*)([^\\s,;\\n"'\\]\\}]+)`, 'gi');
    result = result.replace(regex, '$1[REDACTED]');
  }
  return result;
}

function sanitizeStack(stack: string | undefined): string | undefined {
  if (!stack) return undefined;
  return sanitizeString(stack).slice(0, 2000);
}

function getCurrentScreen(): string {
  if (typeof window === 'undefined') return 'unknown';
  return window.location.pathname || '/';
}

function getSanitizedGameState(): string {
  try {
    const state = useGameStore.getState();
    return JSON.stringify({
      gameState: state.gameState,
      currentLevel: state.currentLevel,
      score: state.score,
      figuresPlaced: state.figuresPlaced,
      totalFigures: state.totalFigures,
      bombsRemaining: state.bombsRemaining,
      timeRemaining: state.timeRemaining,
      queueLength: state.figureQueue?.length || 0,
    });
  } catch {
    return '{}';
  }
}

interface LogOptions {
  severity?: ErrorSeverity;
  category?: ErrorCategory;
  component?: string;
  apiInfo?: {
    method?: string;
    endpoint?: string;
    status?: number;
    latency?: number;
  };
}

export const errorLogger = {
  log(message: string, options: LogOptions = {}): void {
    const { severity = 'error', category = 'runtime', component, apiInfo } = options;
    
    offlineStorage.addErrorLog({
      severity,
      category,
      message: sanitizeString(message).slice(0, 500),
      component,
      currentScreen: getCurrentScreen(),
      gameState: getSanitizedGameState(),
      apiInfo: apiInfo ? JSON.stringify(apiInfo) : undefined,
    });
  },

  logError(error: Error, options: LogOptions = {}): void {
    const { severity = 'error', category = 'runtime', component, apiInfo } = options;
    
    offlineStorage.addErrorLog({
      severity,
      category,
      message: sanitizeString(error.message).slice(0, 500),
      stack: sanitizeStack(error.stack),
      component,
      currentScreen: getCurrentScreen(),
      gameState: getSanitizedGameState(),
      apiInfo: apiInfo ? JSON.stringify(apiInfo) : undefined,
    });
  },

  logApiError(endpoint: string, method: string, status: number, message: string, latency?: number): void {
    offlineStorage.addErrorLog({
      severity: status >= 500 ? 'error' : 'warn',
      category: 'api',
      message: sanitizeString(message).slice(0, 500),
      currentScreen: getCurrentScreen(),
      gameState: getSanitizedGameState(),
      apiInfo: JSON.stringify({ method, endpoint, status, latency }),
    });
  },

  logGameError(message: string, component?: string): void {
    offlineStorage.addErrorLog({
      severity: 'error',
      category: 'game',
      message: sanitizeString(message).slice(0, 500),
      component,
      currentScreen: getCurrentScreen(),
      gameState: getSanitizedGameState(),
    });
  },

  logAssetError(assetUrl: string, message: string): void {
    offlineStorage.addErrorLog({
      severity: 'warn',
      category: 'asset',
      message: `Asset load failed: ${sanitizeString(assetUrl).slice(0, 200)} - ${sanitizeString(message).slice(0, 200)}`,
      currentScreen: getCurrentScreen(),
      gameState: getSanitizedGameState(),
    });
  },

  logSyncError(message: string): void {
    offlineStorage.addErrorLog({
      severity: 'error',
      category: 'sync',
      message: sanitizeString(message).slice(0, 500),
      currentScreen: getCurrentScreen(),
      gameState: getSanitizedGameState(),
    });
  },
};

export function initGlobalErrorHandlers(): void {
  if (typeof window === 'undefined') return;

  window.onerror = (message, source, lineno, colno, error) => {
    const errorMessage = typeof message === 'string' ? message : 'Unknown error';
    offlineStorage.addErrorLog({
      severity: 'error',
      category: 'runtime',
      message: sanitizeString(errorMessage).slice(0, 500),
      stack: error ? sanitizeStack(error.stack) : `${source}:${lineno}:${colno}`,
      component: 'window.onerror',
      currentScreen: getCurrentScreen(),
      gameState: getSanitizedGameState(),
    });
    return false;
  };

  window.onunhandledrejection = (event) => {
    const reason = event.reason;
    let message = 'Unhandled promise rejection';
    let stack: string | undefined;
    
    if (reason instanceof Error) {
      message = reason.message;
      stack = reason.stack;
    } else if (typeof reason === 'string') {
      message = reason;
    } else if (reason && typeof reason === 'object' && 'message' in reason) {
      message = String(reason.message);
    }
    
    offlineStorage.addErrorLog({
      severity: 'error',
      category: 'runtime',
      message: sanitizeString(message).slice(0, 500),
      stack: sanitizeStack(stack),
      component: 'window.onunhandledrejection',
      currentScreen: getCurrentScreen(),
      gameState: getSanitizedGameState(),
    });
  };
}

export function trackUserAction(action: string): void {
  offlineStorage.setLastUserAction(action);
}

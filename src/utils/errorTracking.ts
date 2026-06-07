// Error tracking utility
// Can be connected to Sentry, LogRocket, or other services in production

interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  extra?: Record<string, unknown>;
}

interface ErrorLogEntry {
  id: string;
  timestamp: Date;
  message: string;
  stack?: string;
  context?: ErrorContext;
  url: string;
  userAgent: string;
}

const ERROR_LOG_KEY = 'roofapp_error_log';
const MAX_ERROR_ENTRIES = 50;

function getErrorLog(): ErrorLogEntry[] {
  try {
    const data = localStorage.getItem(ERROR_LOG_KEY);
    if (data) {
      const logs = JSON.parse(data);
      return logs.map((log: ErrorLogEntry) => ({
        ...log,
        timestamp: new Date(log.timestamp),
      }));
    }
  } catch {
    // Ignore parse errors
  }
  return [];
}

function saveErrorLog(logs: ErrorLogEntry[]): void {
  try {
    localStorage.setItem(ERROR_LOG_KEY, JSON.stringify(logs.slice(0, MAX_ERROR_ENTRIES)));
  } catch {
    // Ignore storage errors
  }
}

export function logError(error: Error, context?: ErrorContext): void {
  const entry: ErrorLogEntry = {
    id: `err-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date(),
    message: error.message,
    stack: error.stack,
    context,
    url: window.location.href,
    userAgent: navigator.userAgent,
  };

  // Log to console in development
  if (import.meta.env.DEV) {
    console.error('[ErrorTracking]', entry);
  }

  // Save to localStorage for debugging
  const logs = getErrorLog();
  logs.unshift(entry);
  saveErrorLog(logs);

  // TODO: Send to external service in production
  // if (import.meta.env.PROD) {
  //   sendToSentry(entry);
  // }
}

export function logAPIError(
  endpoint: string,
  status: number,
  message: string,
  context?: ErrorContext
): void {
  logError(new Error(`API Error: ${endpoint} - ${status} - ${message}`), {
    ...context,
    action: 'api_call',
    extra: { endpoint, status, ...(context?.extra || {}) },
  });
}

export function getRecentErrors(): ErrorLogEntry[] {
  return getErrorLog();
}

export function clearErrorLog(): void {
  localStorage.removeItem(ERROR_LOG_KEY);
}

// Global error handler setup
export function initErrorTracking(): void {
  // Catch unhandled errors
  window.addEventListener('error', (event) => {
    logError(event.error || new Error(event.message), {
      action: 'unhandled_error',
      extra: { filename: event.filename, lineno: event.lineno, colno: event.colno },
    });
  });

  // Catch unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason instanceof Error
      ? event.reason
      : new Error(String(event.reason));
    logError(error, { action: 'unhandled_rejection' });
  });
}

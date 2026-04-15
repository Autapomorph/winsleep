import type { SelectorParam } from 'i18next';

import { logger } from '../logger/logger';

const FLOOD_PREVENTION_MS = 2000;

const IGNORED_ERROR_PATTERNS = [
  /ResizeObserver.*loop.*completed/i,
  /ResizeObserver.*loop.*limit.*exceeded/i,
];

const recentErrors = new Set<string>();

const isIgnoredError = (message: string): boolean => {
  return IGNORED_ERROR_PATTERNS.some(pattern => pattern.test(message));
};

const shouldShowError = (message: string): boolean => {
  if (isIgnoredError(message)) {
    return false;
  }

  if (recentErrors.has(message)) {
    return false;
  }

  recentErrors.add(message);
  setTimeout(() => {
    recentErrors.delete(message);
  }, FLOOD_PREVENTION_MS);

  return true;
};

export const getErrorMessage = (error: unknown): string => {
  if (!error) {
    return '';
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'object') {
    if ('message' in error && typeof error.message === 'string') {
      return error.message;
    }

    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }

  return String(error);
};

export const initGlobalErrorTracking = (
  onError: (titleSelector: SelectorParam) => void,
): (() => void) => {
  const handleError = (event: ErrorEvent) => {
    const message = event.message || 'Unknown runtime error';

    if (isIgnoredError(message)) {
      event.stopImmediatePropagation();
      event.preventDefault();
      return;
    }

    logger.error(`Unhandled runtime error: ${message}. Details: ${event.error}`);

    if (shouldShowError(message)) {
      onError($ => $.common.errors.messages.unhandledTitle);
    }
  };

  const handleRejection = (event: PromiseRejectionEvent) => {
    const errorMsg = getErrorMessage(event.reason);

    logger.error(`Unhandled promise rejection: ${errorMsg}`);

    if (shouldShowError(errorMsg)) {
      onError($ => $.common.errors.messages.unhandledRejectionTitle);
    }
  };

  window.addEventListener('error', handleError);
  window.addEventListener('unhandledrejection', handleRejection);
  logger.info('Global error tracking initialized');

  return () => {
    window.removeEventListener('error', handleError);
    window.removeEventListener('unhandledrejection', handleRejection);
    logger.info('Global error tracking deinitialized');
  };
};

import consola from 'consola';

import { logger } from './logger';
import { logToBackend } from './logToBackend';

vi.unmock('./logger');

vi.mock(import('./logToBackend'), async importOriginal => ({
  ...(await importOriginal()),
  logToBackend: vi.fn(),
}));

vi.mock(import('consola'), async importOriginal => {
  const original = await importOriginal();
  return {
    ...original,
    default: Object.assign(original.default, {
      trace: vi.fn(),
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    }),
  };
});

describe('logger', () => {
  test('logs trace messages', () => {
    logger.trace('trace message');
    expect(logToBackend).toHaveBeenCalledWith('TRACE', 'trace message');
    expect(consola.trace).toHaveBeenCalledWith('trace message');
  });

  test('logs debug messages', () => {
    logger.debug('debug message');
    expect(logToBackend).toHaveBeenCalledWith('DEBUG', 'debug message');
    expect(consola.debug).toHaveBeenCalledWith('debug message');
  });

  test('logs info messages', () => {
    logger.info('info message');
    expect(logToBackend).toHaveBeenCalledWith('INFO', 'info message');
    expect(consola.info).toHaveBeenCalledWith('info message');
  });

  test('logs warn messages', () => {
    logger.warn('warn message');
    expect(logToBackend).toHaveBeenCalledWith('WARN', 'warn message');
    expect(consola.warn).toHaveBeenCalledWith('warn message');
  });

  test('logs error messages', () => {
    logger.error('error message');
    expect(logToBackend).toHaveBeenCalledWith('ERROR', 'error message');
    expect(consola.error).toHaveBeenCalledWith('error message');
  });
});

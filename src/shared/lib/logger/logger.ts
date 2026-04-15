import consola from 'consola';

import { logToBackend } from './logToBackend';

export const logger = {
  trace: (message: string) => {
    logToBackend('TRACE', message);
    consola.trace(message);
  },
  debug: (message: string) => {
    logToBackend('DEBUG', message);
    consola.debug(message);
  },
  info: (message: string) => {
    logToBackend('INFO', message);
    consola.info(message);
  },
  warn: (message: string) => {
    logToBackend('WARN', message);
    consola.warn(message);
  },
  error: (message: string) => {
    logToBackend('ERROR', message);
    consola.error(message);
  },
};

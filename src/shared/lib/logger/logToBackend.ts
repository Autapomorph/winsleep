import { consola } from 'consola';

import { typedInvoke } from '@/shared/api';
import type { LogLevel } from './types';

export const logToBackend = (level: LogLevel, message: string) => {
  typedInvoke('log_message', { level, message }).catch(err => {
    consola.error(`Failed to log to backend: ${err}`);
  });
};

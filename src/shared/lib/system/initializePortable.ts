import { typedInvoke } from '@/shared/api';
import { config } from '@/shared/config';

export async function initializePortable(): Promise<void> {
  try {
    const isPortable = await typedInvoke('is_portable');
    config.isPortable = isPortable;
  } catch {
    // Retain default or build-time config
  }
}

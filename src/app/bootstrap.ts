import { initializeAppState } from '@/entities/app-state';
import { initializeSettings } from '@/entities/setting';
import { initializeI18n } from '@/shared/config';
import { initializePortable } from '@/shared/lib';

export async function bootstrap() {
  await initializePortable();
  initializeI18n();
  await initializeSettings();
  await initializeAppState();
}

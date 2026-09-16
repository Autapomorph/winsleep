import { initializeAppState } from '@/entities/app-state';
import { initializeSettings } from '@/entities/setting';
import { initializeI18n } from '@/shared/config';
import { initializePortable, isMainWindow } from '@/shared/lib';

export async function bootstrap(isMain = isMainWindow()) {
  await initializePortable();
  initializeI18n();

  if (isMain) {
    await initializeSettings();
    await initializeAppState();
  }
}

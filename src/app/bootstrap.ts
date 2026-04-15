import { initializeSettings } from '@/entities/setting';
import { initializeI18n } from '@/shared/config';

export async function bootstrap() {
  initializeI18n();
  await initializeSettings();
}

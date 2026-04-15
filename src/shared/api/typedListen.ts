import { type EventCallback, listen } from '@tauri-apps/api/event';

import type { Events } from './events';

export async function typedListen<T extends keyof Events>(
  event: T,
  callback: EventCallback<Events[T]>,
) {
  return listen<Events[T]>(event, callback);
}

import { emit } from '@tauri-apps/api/event';

import type { Events } from './events';

export async function typedEmit<E extends keyof Events>(
  event: E,
  ...payload: Events[E] extends undefined ? [] : [Events[E]]
) {
  return emit<Events[E]>(event, payload[0]);
}

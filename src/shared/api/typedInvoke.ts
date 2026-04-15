import { invoke } from '@tauri-apps/api/core';

import type { Commands } from './commands';

export async function typedInvoke<T extends keyof Commands>(
  cmd: T,
  ...args: Commands[T]['args'] extends undefined ? [] : [Commands[T]['args']]
) {
  return invoke<Commands[T]['result']>(cmd, args[0]);
}

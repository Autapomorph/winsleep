import type { InvokeArgs } from '@tauri-apps/api/core';

import type { LogMessageCommandArgs } from './logs';
import type { SetIsTrayModeEnabledCommandArgs, TrayMenuState } from './tray-menu';

type CommandsShape<T extends Record<string, CommandDef<unknown, InvokeArgs | undefined>>> = T;

export interface CommandDef<Result, Args extends InvokeArgs | undefined = undefined> {
  args: Args;
  result: Result;
}

export type Commands = CommandsShape<{
  start_timer: CommandDef<void, { durationMs: number; targetTimestampMs: number | null }>;
  cancel_timer: CommandDef<void>;
  pc_sleep: CommandDef<void>;
  pc_hibernate: CommandDef<void>;
  pc_shutdown: CommandDef<void>;
  pc_reboot: CommandDef<void>;
  pc_lock: CommandDef<void>;
  pc_signout: CommandDef<void>;
  play_notification_sound: CommandDef<void>;
  quit_app: CommandDef<void>;
  set_is_tray_mode_enabled: CommandDef<void, SetIsTrayModeEnabledCommandArgs>;
  update_tray_menu: CommandDef<void, TrayMenuState>;
  load_settings: CommandDef<Record<string, unknown> | null>;
  save_settings: CommandDef<void, { settings: Record<string, unknown> }>;
  open_settings_dir: CommandDef<void>;
  load_app_state: CommandDef<Record<string, unknown> | null>;
  save_app_state: CommandDef<void, { state: Record<string, unknown> }>;
  log_message: CommandDef<void, LogMessageCommandArgs>;
  read_logs: CommandDef<string>;
  clear_logs: CommandDef<void>;
  open_log_dir: CommandDef<void>;
}>;

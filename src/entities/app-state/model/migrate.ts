export interface LegacyAppState {
  version?: number;
  [key: string]: unknown;
}

export interface MigratedAppStateResult {
  state: Record<string, unknown>;
  version: number;
}

export const CURRENT_APP_STATE_VERSION = 0;

/**
 * Migration helper function demonstrating how we can transition app state schemas
 * over time when properties are renamed, restructured, or deprecated.
 */
export function migrateAppState(data: LegacyAppState): MigratedAppStateResult {
  const version = data.version ?? 0;
  const state = { ...data };
  delete state.version;

  // Example migration block showing how version updates work
  // if (version === 0) {
  //   version = 1;
  // }

  // Then update v1 to v2
  // if (version === 1) {
  // version = 2;
  // }

  // Then to v3
  // if (version === 2) {
  //   version = 3;
  // }

  return { state, version };
}

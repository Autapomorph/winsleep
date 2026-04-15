export interface LegacySettings {
  version?: number;
  [key: string]: unknown;
}

export const CURRENT_SETTINGS_VERSION = 0;

/**
 * Migration helper function demonstrating how we can transition settings schemas
 * over time when properties are renamed, restructured, or deprecated.
 */
export function migrateSettings(data: LegacySettings): {
  settings: Record<string, unknown>;
  version: number;
} {
  const version = data.version ?? 0;
  const settings = { ...data };
  delete settings.version;

  // Example migration block showing how version updates work

  // First make some updates to match v1
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

  return { settings, version };
}

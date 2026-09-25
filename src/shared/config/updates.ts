export const RELEASE_NOTES_TAGS = {
  NEW: 'new',
  IMPROVED: 'improved',
  FIXED: 'fixed',
} as const;

export type ReleaseNotesTag = (typeof RELEASE_NOTES_TAGS)[keyof typeof RELEASE_NOTES_TAGS];

export const UPDATE_CHANNELS = {
  PRERELEASE: 'prerelease',
  STABLE: 'stable',
} as const;

export type UpdateChannel = (typeof UPDATE_CHANNELS)[keyof typeof UPDATE_CHANNELS];

export const DEFAULT_UPDATE_CHANNEL: UpdateChannel = UPDATE_CHANNELS.STABLE;

export type UpdateInterval = 'startup' | 1 | 3 | 6 | 12 | 24;

export const DEFAULT_UPDATE_INTERVAL: UpdateInterval = 6;

export const UPDATE_INTERVALS: UpdateInterval[] = ['startup', 1, 3, 6, 12, 24];

export const DEFAULT_IS_AUTO_UPDATE_ENABLED = true;

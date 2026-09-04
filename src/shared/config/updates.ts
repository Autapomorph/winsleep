export interface GitHubReleaseResponse {
  body?: string;
  published_at?: string;
}

export interface ProxyUpdateResponse {
  version?: string;
  notes?: string;
}

export interface ProxyChangelogVersionsResponse {
  versions: string[];
}

export interface ProxyChangelogResponse {
  tag_name?: string;
  version?: string;
  notes?: string;
  released_at?: string;
  tags?: string[];
}

export const CHANGELOG_TAGS = {
  NEW: 'new',
  IMPROVED: 'improved',
  FIXED: 'fixed',
} as const;

export type ChangelogTag = (typeof CHANGELOG_TAGS)[keyof typeof CHANGELOG_TAGS];

export type UpdateInterval = 'startup' | 1 | 3 | 6 | 12 | 24;

export const DEFAULT_UPDATE_INTERVAL: UpdateInterval = 6;

export const UPDATE_INTERVALS: UpdateInterval[] = ['startup', 1, 3, 6, 12, 24];

export const DEFAULT_IS_AUTO_UPDATE_ENABLED = true;

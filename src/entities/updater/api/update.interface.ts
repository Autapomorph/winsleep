export interface UnifiedRelease {
  version: string;
  notes: string;
  releasedAt?: string;
  tags?: string[];
  url?: string;
}

export interface UpdateProvider {
  readonly name: string;
  fetchReleaseNotes(version: string): Promise<UnifiedRelease | null>;
  fetchAvailableVersions?(): Promise<string[] | null>;
  getReleaseUrl?(version: string): string;
  getReleasesUrl?(): string;
}

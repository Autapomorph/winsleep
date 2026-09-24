import { PROXY_UPDATER_URL } from '@/shared/config';
import { logger } from '@/shared/lib';
import { type UnifiedRelease, type UpdateProvider } from '../update.interface';

interface ProxyReleaseNotesDto {
  tagName?: string;
  version?: string;
  notes?: string;
  releasedAt?: string | null;
  tags?: string[];
  url?: string;
}

interface ProxyVersionsDto {
  versions: string[];
}

export class ProxyUpdateProvider implements UpdateProvider {
  readonly name = 'proxy';

  async fetchReleaseNotes(version: string): Promise<UnifiedRelease | null> {
    try {
      const cleanVersion = version.replace(/^v/, '');
      const response = await fetch(`${PROXY_UPDATER_URL}/release-notes/${cleanVersion}`, {
        cache: 'no-cache',
      });

      if (!response.ok) {
        return null;
      }

      const data: ProxyReleaseNotesDto = await response.json();

      return {
        notes: data.notes ?? '',
        releasedAt: data.releasedAt ?? undefined,
        tags: Array.isArray(data.tags) ? data.tags : [],
        url: data.url,
        version: data.version ?? cleanVersion,
      };
    } catch (err) {
      logger.debug(`[ProxyUpdateProvider] Failed to fetch release notes: ${err}`);
      return null;
    }
  }

  async fetchAvailableVersions(): Promise<string[] | null> {
    try {
      const response = await fetch(`${PROXY_UPDATER_URL}/release-notes`, {
        cache: 'no-cache',
      });

      if (!response.ok) {
        return null;
      }

      const data: ProxyVersionsDto = await response.json();

      if (Array.isArray(data.versions) && data.versions.length > 0) {
        return data.versions;
      }

      return null;
    } catch (err) {
      logger.debug(`[ProxyUpdateProvider] Failed to fetch available versions: ${err}`);
      return null;
    }
  }
}

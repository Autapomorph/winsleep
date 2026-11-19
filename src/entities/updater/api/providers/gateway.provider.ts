import i18n from 'i18next';

import { config, DEFAULT_LOCALE, GATEWAY_RELEASE_NOTES_URL } from '@/shared/config';
import { logger } from '@/shared/lib';
import { type UnifiedRelease, type UpdateProvider } from '../update.interface';

interface GatewayReleaseNotesDto {
  tagName?: string;
  version?: string;
  notes?: string;
  releasedAt?: string | null;
  tags?: string[];
  url?: string;
}

interface GatewayVersionsDto {
  versions: string[];
}

export class GatewayUpdateProvider implements UpdateProvider {
  readonly name = 'gateway';

  private getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'X-App-Language': i18n.language || DEFAULT_LOCALE,
    };

    if (config.isDev && config.VERCEL_AUTOMATION_BYPASS_SECRET) {
      headers['x-vercel-protection-bypass'] = config.VERCEL_AUTOMATION_BYPASS_SECRET;
    }

    return headers;
  }

  async fetchReleaseNotes(version: string): Promise<UnifiedRelease | null> {
    if (!GATEWAY_RELEASE_NOTES_URL) {
      return null;
    }

    try {
      const cleanVersion = version.replace(/^v/, '');
      const response = await fetch(`${GATEWAY_RELEASE_NOTES_URL}/${cleanVersion}`, {
        cache: 'no-cache',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        return null;
      }

      const data: GatewayReleaseNotesDto = await response.json();

      return {
        notes: data.notes ?? '',
        releasedAt: data.releasedAt ?? undefined,
        tags: Array.isArray(data.tags) ? data.tags : [],
        url: data.url,
        version: data.version ?? cleanVersion,
      };
    } catch (err) {
      logger.debug(`[GatewayUpdateProvider] Failed to fetch release notes: ${err}`);

      return null;
    }
  }

  async fetchAvailableVersions(): Promise<string[] | null> {
    if (!GATEWAY_RELEASE_NOTES_URL) {
      return null;
    }

    try {
      const response = await fetch(GATEWAY_RELEASE_NOTES_URL, {
        cache: 'no-cache',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        return null;
      }

      const data: GatewayVersionsDto = await response.json();

      if (Array.isArray(data.versions) && data.versions.length > 0) {
        return data.versions;
      }

      return null;
    } catch (err) {
      logger.debug(`[GatewayUpdateProvider] Failed to fetch available versions: ${err}`);

      return null;
    }
  }
}

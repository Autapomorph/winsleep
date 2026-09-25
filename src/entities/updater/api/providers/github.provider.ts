import { GITHUB_API_REPO_URL, RELEASES_PAGE_URL } from '@/shared/config';
import { logger } from '@/shared/lib';
import { type UnifiedRelease, type UpdateProvider } from '../update.interface';

interface GitHubReleaseDto {
  body?: string;
  published_at?: string;
}

export class GitHubUpdateProvider implements UpdateProvider {
  readonly name = 'github';

  getReleaseUrl(version: string): string {
    const tag = version.replace(/^v/, '');
    return `${RELEASES_PAGE_URL}/tag/${tag}`;
  }

  getReleasesUrl(): string {
    return RELEASES_PAGE_URL;
  }

  async fetchReleaseNotes(version: string): Promise<UnifiedRelease | null> {
    try {
      const tag = version.replace(/^v/, '');
      const response = await fetch(`${GITHUB_API_REPO_URL}/releases/tag/${tag}`, {
        cache: 'no-cache',
      });

      if (!response.ok) {
        return null;
      }

      const data: GitHubReleaseDto = await response.json();

      return {
        notes: data.body ?? '',
        releasedAt: data.published_at,
        tags: [],
        url: this.getReleaseUrl(tag),
        version: tag,
      };
    } catch (err) {
      logger.debug(`[GitHubUpdateProvider] Failed to fetch release notes: ${err}`);
      return null;
    }
  }
}

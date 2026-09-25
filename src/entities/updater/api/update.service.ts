import { RELEASES_PAGE_URL } from '@/shared/config';
import { logger } from '@/shared/lib';
import { GitHubUpdateProvider } from './providers/github.provider';
import { ProxyUpdateProvider } from './providers/proxy.provider';
import { type UnifiedRelease, type UpdateProvider } from './update.interface';

export class UpdateService {
  constructor(
    private readonly providers: UpdateProvider[] = [
      new ProxyUpdateProvider(),
      new GitHubUpdateProvider(),
    ],
  ) {}

  getReleaseUrl(version?: string): string {
    if (version) {
      for (const provider of this.providers) {
        if (provider.getReleaseUrl) {
          return provider.getReleaseUrl(version);
        }
      }
    }

    return this.getReleasesUrl();
  }

  getReleasesUrl(): string {
    for (const provider of this.providers) {
      if (provider.getReleasesUrl) {
        return provider.getReleasesUrl();
      }
    }

    return RELEASES_PAGE_URL;
  }

  async fetchReleaseNotes(version: string): Promise<UnifiedRelease> {
    const tryNext = async (index: number): Promise<UnifiedRelease> => {
      if (index >= this.providers.length) {
        throw new Error(`Release notes not found for version: ${version}`);
      }

      const provider = this.providers[index];

      try {
        const result = await provider.fetchReleaseNotes(version);

        if (result) {
          return result;
        }
      } catch (err) {
        logger.debug(`[UpdateService] Provider '${provider.name}' threw error: ${err}`);
      }

      return tryNext(index + 1);
    };

    return tryNext(0);
  }

  async fetchAvailableVersions(): Promise<string[]> {
    const tryNext = async (index: number): Promise<string[]> => {
      if (index >= this.providers.length) {
        return [];
      }

      const provider = this.providers[index];

      if (provider.fetchAvailableVersions) {
        try {
          const versions = await provider.fetchAvailableVersions();

          if (Array.isArray(versions) && versions.length > 0) {
            return versions;
          }
        } catch (err) {
          logger.debug(
            `[UpdateService] Provider '${provider.name}' failed to fetch versions: ${err}`,
          );
        }
      }

      return tryNext(index + 1);
    };

    return tryNext(0);
  }
}

export const updateService = new UpdateService();

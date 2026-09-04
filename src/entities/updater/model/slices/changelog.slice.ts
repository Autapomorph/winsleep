import { type StateCreator } from 'zustand';

import {
  type GitHubReleaseResponse,
  type ProxyChangelogResponse,
  type ProxyChangelogVersionsResponse,
  GITHUB_API_REPO_URL,
  PROXY_UPDATER_URL,
} from '@/shared/config';
import { delay, logger } from '@/shared/lib';
import { MOCK_CHANGELOG, MOCK_VERSION } from '../mockUpdate';
import { type UpdateStore } from '../update.store';

export type ChangelogSlice = ChangelogState & ChangelogActions;

export interface ChangelogState {
  availableVersions: string[];
  isVersionsLoading: boolean;
  isChangelogOpen: boolean;
  isChangelogLoading: boolean;
  changelogError: string | null;
  changelog: string;
  changelogVersion: string | null;
  changelogMeta: ChangelogMeta | null;
}

export interface ChangelogMeta {
  releasedAt?: string;
  tags?: string[];
}

export interface ChangelogActions {
  openChangelog: (version: string) => void;
  closeChangelog: () => void;
  fetchChangelog: (version: string) => Promise<void>;
  fetchAvailableVersions: () => Promise<void>;
}

export const initialChangelogState: ChangelogState = {
  availableVersions: [],
  changelog: '',
  changelogError: null,
  changelogMeta: null,
  changelogVersion: null,
  isChangelogLoading: false,
  isChangelogOpen: false,
  isVersionsLoading: false,
};

export const createChangelogSlice: StateCreator<
  UpdateStore,
  [['zustand/devtools', never]],
  [],
  ChangelogSlice
> = (set, get) => ({
  ...initialChangelogState,

  openChangelog: (version: string) => {
    set({ changelogVersion: version, isChangelogOpen: true }, false, 'updater/openChangelog');
    get()
      .fetchChangelog(version)
      .catch(() => {});
    get()
      .fetchAvailableVersions()
      .catch(() => {});
  },

  closeChangelog: () => {
    set(
      {
        changelog: '',
        changelogError: null,
        changelogMeta: null,
        changelogVersion: null,
        isChangelogLoading: false,
        isChangelogOpen: false,
      },
      false,
      'updater/closeChangelog',
    );
  },

  fetchAvailableVersions: async () => {
    set({ isVersionsLoading: true }, false, 'updater/fetchAvailableVersionsStart');
    try {
      const response = await fetch(`${PROXY_UPDATER_URL}/changelogs`, {
        cache: 'no-cache',
      });

      if (response.ok) {
        const data: ProxyChangelogVersionsResponse = await response.json();
        if (Array.isArray(data.versions) && data.versions.length > 0) {
          set(
            { availableVersions: data.versions, isVersionsLoading: false },
            false,
            'updater/fetchAvailableVersionsSuccess',
          );
          return;
        }
      }
    } catch (err) {
      logger.debug(`Failed to fetch available versions from proxy: ${err}`);
    }

    set({ isVersionsLoading: false }, false, 'updater/fetchAvailableVersionsEnd');
  },

  fetchChangelog: async (targetVersion: string) => {
    set(
      {
        changelogError: null,
        changelogVersion: targetVersion,
        isChangelogLoading: true,
      },
      false,
      'updater/fetchChangelogStart',
    );

    if (targetVersion === MOCK_VERSION) {
      await delay(3000);

      set(
        {
          changelog: MOCK_CHANGELOG,
          changelogMeta: {
            releasedAt: '2026-09-03',
            tags: ['New', 'Improved', 'Fixed'],
          },
          isChangelogLoading: false,
        },
        false,
        'updater/fetchMockChangelogSuccess',
      );

      return;
    }

    try {
      const proxyResponse = await fetch(`${PROXY_UPDATER_URL}/changelogs/${targetVersion}`, {
        cache: 'no-cache',
      });

      if (proxyResponse.ok) {
        const proxyData: ProxyChangelogResponse = await proxyResponse.json();
        set(
          {
            changelog: proxyData.notes ?? '',
            changelogMeta: {
              releasedAt: proxyData.released_at,
              tags: proxyData.tags ?? [],
            },
            isChangelogLoading: false,
          },
          false,
          'updater/fetchChangelogProxySuccess',
        );

        return;
      }
    } catch {
      // Fall back to direct GitHub API if proxy endpoint fails
    }

    try {
      const response = await fetch(`${GITHUB_API_REPO_URL}/releases/tag/${targetVersion}`, {
        cache: 'no-cache',
      });

      if (!response.ok) {
        throw new Error(`${response.status}`);
      }

      const data: GitHubReleaseResponse = await response.json();
      set(
        {
          changelog: data.body ?? '',
          changelogMeta: data.published_at ? { releasedAt: data.published_at, tags: [] } : null,
          isChangelogLoading: false,
        },
        false,
        'updater/fetchChangelogGithubSuccess',
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error(`Failed to fetch release notes: ${message}`);

      set(
        { changelogError: message, isChangelogLoading: false },
        false,
        'updater/fetchChangelogError',
      );
    }
  },
});

import { relaunch } from '@tauri-apps/plugin-process';
import { type Update, check } from '@tauri-apps/plugin-updater';
import { type StateCreator, create } from 'zustand';
import { devtools } from 'zustand/middleware';

import {
  type GitHubReleaseResponse,
  type ProxyChangelogResponse,
  type ProxyChangelogVersionsResponse,
  config,
  GITHUB_API_REPO_URL,
  PROXY_UPDATER_URL,
} from '@/shared/config';
import { delay, logger, showErrorToast } from '@/shared/lib';
import { MOCK_CHANGELOG, MOCK_VERSION } from './mockUpdate';

export type UpdateStore = UpdateSlice & ChangelogSlice;

export type UpdateStoreState = UpdateState & ChangelogState;

export type UpdateSlice = UpdateState & UpdateActions;

export type UpdateStatus =
  'idle' | 'checking' | 'upToDate' | 'available' | 'downloading' | 'readyToRestart' | 'error';

export interface UpdateState {
  status: UpdateStatus;
  isManualCheck: boolean;
  updateInfo: Update | null;
  downloadProgress: number;
  errorMessage: string | null;
}

export interface UpdateActions {
  checkUpdates: (options?: { isManual?: boolean }) => Promise<void>;
  downloadUpdate: () => Promise<void>;
  installUpdate: () => Promise<void>;
  relaunchApp: () => Promise<void>;
  resetStore: () => void;
  triggerMockUpdate: () => Promise<void>;
}

export type ChangelogSlice = ChangelogState & ChangelogActions;

export interface ChangelogMeta {
  releasedAt?: string;
  tags?: string[];
}

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

export interface ChangelogActions {
  openChangelog: (version: string) => void;
  closeChangelog: () => void;
  fetchChangelog: (version: string) => Promise<void>;
  fetchAvailableVersions: () => Promise<void>;
}

export const STORAGE_HAS_UPDATED_TO_KEY = 'hasUpdatedTo';

const initialUpdateState: UpdateState = {
  status: 'idle',
  isManualCheck: false,
  updateInfo: null,
  downloadProgress: 0,
  errorMessage: null,
};

const initialChangelogState: ChangelogState = {
  availableVersions: [],
  isChangelogLoading: false,
  isChangelogOpen: false,
  isVersionsLoading: false,
  changelogError: null,
  changelog: '',
  changelogVersion: null,
  changelogMeta: null,
};

const initialState: UpdateStoreState = {
  ...initialUpdateState,
  ...initialChangelogState,
};

const createUpdateSlice: StateCreator<
  UpdateStore,
  [['zustand/devtools', never]],
  [],
  UpdateSlice
> = (set, get) => {
  let mockUpdateController: AbortController | null = null;

  return {
    ...initialUpdateState,

    checkUpdates: async (options = {}) => {
      const { status } = get();

      if (status === 'checking' || status === 'downloading') {
        return;
      }

      set(
        { status: 'checking', errorMessage: null, isManualCheck: Boolean(options.isManual) },
        false,
        'updater/checkUpdates',
      );
      logger.info('Checking for updates...');

      try {
        const update = await check();

        if (update) {
          logger.info(`Update available: v${update.version}`);
          set({ status: 'available', updateInfo: update }, false, 'updater/updateAvailable');
          get()
            .downloadUpdate()
            .catch(() => {});
        } else {
          logger.info('Application is up-to-date.');
          set({ status: 'upToDate', updateInfo: null }, false, 'updater/upToDate');
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);

        if (options.isManual) {
          logger.error(`Error checking for updates: ${message}`);
        } else {
          logger.debug(`Error checking for updates: ${message}`);
        }

        set({ status: 'error', errorMessage: message }, false, 'updater/checkError');
      }
    },

    downloadUpdate: async () => {
      const { updateInfo, status } = get();

      if (!updateInfo || status === 'downloading') {
        return;
      }

      set({ status: 'downloading', downloadProgress: 0 }, false, 'updater/downloadStart');
      logger.info('Starting update download...');

      try {
        let downloaded = 0;
        let contentLength = 0;

        await updateInfo.download(event => {
          switch (event.event) {
            case 'Started':
              contentLength = event.data.contentLength ?? 0;
              logger.info(`Download started, content length: ${contentLength}`);
              break;

            case 'Progress':
              downloaded += event.data.chunkLength;

              if (contentLength > 0) {
                const progress = Math.round((downloaded / contentLength) * 100);
                const nextProgress = Math.min(progress, 99);

                if (nextProgress !== get().downloadProgress) {
                  set({ downloadProgress: nextProgress }, false, 'updater/downloadProgress');
                }
              }

              break;

            case 'Finished':
              logger.info('Download finished.');
              set({ downloadProgress: 100 }, false, 'updater/downloadFinished');
              break;

            default:
              break;
          }
        });

        logger.info('Update downloaded successfully. Ready to install.');
        set({ status: 'readyToRestart' }, false, 'updater/downloadReadyToRestart');
      } catch (error) {
        localStorage.removeItem(STORAGE_HAS_UPDATED_TO_KEY);
        const message = error instanceof Error ? error.message : String(error);
        logger.error(`Download failed: ${message}`);
        set({ status: 'error', errorMessage: message }, false, 'updater/downloadError');
        showErrorToast($ => $.titlebar.updateBtn.notifications.installFailed);
      }
    },

    installUpdate: async () => {
      const { updateInfo, status } = get();

      if (!updateInfo) {
        return;
      }

      if (status !== 'readyToRestart') {
        await get().downloadUpdate();
      }

      const currentStatus = get().status;
      if (currentStatus !== 'readyToRestart') {
        return;
      }

      logger.info('Starting update install...');

      try {
        localStorage.setItem(STORAGE_HAS_UPDATED_TO_KEY, updateInfo.version);
        await updateInfo.install();
        logger.info('Update installed');
      } catch (error) {
        localStorage.removeItem(STORAGE_HAS_UPDATED_TO_KEY);
        const message = error instanceof Error ? error.message : String(error);
        logger.error(`Installation failed: ${message}`);
        set({ status: 'error', errorMessage: message }, false, 'updater/installError');
        showErrorToast($ => $.titlebar.updateBtn.notifications.installFailed);
      }
    },

    relaunchApp: async () => {
      const { resetStore } = get();

      logger.info('Relaunching application...');

      if (config.isDev) {
        logger.info('Dev mode bypass: Resetting updater store state and reloading');
        resetStore();
        window.location.reload();
        return;
      }

      try {
        await relaunch();
      } catch (relaunchErr) {
        logger.warn(`Relaunch failed (normal in dev mode): ${relaunchErr}`);
        throw relaunchErr;
      }
    },

    resetStore: () => {
      if (mockUpdateController) {
        mockUpdateController.abort();
        mockUpdateController = null;
      }

      set({ ...initialState }, false, 'updater/resetStore');
    },

    triggerMockUpdate: async () => {
      const { status, resetStore } = get();

      if (status !== 'idle') {
        resetStore();
        return;
      }

      mockUpdateController = new AbortController();
      const { signal } = mockUpdateController;

      logger.info('Triggering mock update with 3s check simulation...');
      set(
        { status: 'checking', errorMessage: null, isManualCheck: true },
        false,
        'updater/triggerMockUpdateChecking',
      );

      try {
        await delay(3000, signal);

        set(
          {
            status: 'available',
            updateInfo: {
              version: MOCK_VERSION,
              errorMessage: null,
              downloadProgress: 0,
              download: async (
                onEvent?: (event: {
                  event: string;
                  data?: { contentLength?: number; chunkLength?: number } | Record<string, never>;
                }) => void,
              ) => {
                if (!onEvent) {
                  return;
                }

                try {
                  onEvent({ event: 'Started', data: { contentLength: 100 } });

                  for (let i = 1; i <= 100; i += 1) {
                    /* eslint-disable-next-line no-await-in-loop */
                    await delay(25, signal);

                    onEvent({ event: 'Progress', data: { chunkLength: 1 } });
                  }

                  onEvent({ event: 'Finished', data: {} });
                } catch (error) {
                  if (error instanceof Error && error.name === 'AbortError') {
                    logger.info('Mock download cancelled via AbortSignal');
                    return;
                  }

                  throw error;
                }
              },
              install: async () => {
                logger.info('Mock install executed');
              },
            } as unknown as Update,
          },
          false,
          'updater/triggerMockUpdateAvailable',
        );

        get()
          .downloadUpdate()
          .catch(() => {});
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          logger.info('Mock update check cancelled via AbortSignal');
          return;
        }

        const message = error instanceof Error ? error.message : String(error);
        set({ status: 'error', errorMessage: message }, false, 'updater/triggerMockUpdateError');
      } finally {
        if (mockUpdateController?.signal === signal) {
          mockUpdateController = null;
        }
      }
    },
  };
};

const createChangelogSlice: StateCreator<
  UpdateStore,
  [['zustand/devtools', never]],
  [],
  ChangelogSlice
> = (set, get) => ({
  ...initialChangelogState,

  openChangelog: (version: string) => {
    set({ isChangelogOpen: true, changelogVersion: version }, false, 'updater/openChangelog');
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
        isChangelogOpen: false,
        changelogVersion: null,
        changelog: '',
        changelogMeta: null,
        isChangelogLoading: false,
        changelogError: null,
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
        isChangelogLoading: true,
        changelogError: null,
        changelogVersion: targetVersion,
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

export const useUpdateStore = create<UpdateStore>()(
  devtools(
    (...a) => ({
      ...createUpdateSlice(...a),
      ...createChangelogSlice(...a),
    }),
    {
      name: 'updater',
    },
  ),
);

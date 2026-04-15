import { relaunch } from '@tauri-apps/plugin-process';
import { type Update, check } from '@tauri-apps/plugin-updater';
import { create } from 'zustand';

import { config, GITHUB_API_REPO_URL } from '@/shared/config';
import { delay, logger, showErrorToast } from '@/shared/lib';
import { MOCK_CHANGELOG, MOCK_VERSION } from './mockUpdate';

export type UpdateStatus =
  'idle' | 'checking' | 'upToDate' | 'available' | 'downloading' | 'readyToRestart' | 'error';

interface UpdateState {
  status: UpdateStatus;
  isManualCheck: boolean;
  updateInfo: Update | null;
  downloadProgress: number;
  errorMessage: string | null;
  changelogVersion: string | null;
  isChangelogOpen: boolean;
  changelog: string;
  isChangelogLoading: boolean;
  changelogError: string | null;
}

interface UpdateActions {
  checkUpdates: (options?: { isManual?: boolean }) => Promise<void>;
  installUpdate: () => Promise<void>;
  relaunchApp: () => Promise<void>;
  resetStore: () => void;
  triggerMockUpdate: () => Promise<void>;
  openChangelog: (version: string) => void;
  closeChangelog: () => void;
  fetchChangelog: (version: string) => Promise<void>;
}

export const STORAGE_HAS_UPDATED_TO_KEY = 'hasUpdatedTo';

export const useUpdateStore = create<UpdateState & UpdateActions>((set, get) => {
  let mockUpdateController: AbortController | null = null;

  return {
    status: 'idle',
    isManualCheck: false,
    updateInfo: null,
    downloadProgress: 0,
    errorMessage: null,
    changelogVersion: null,
    isChangelogOpen: false,
    changelog: '',
    isChangelogLoading: false,
    changelogError: null,

    checkUpdates: async (options = {}) => {
      const { status } = get();

      if (status === 'checking' || status === 'downloading') {
        return;
      }

      set({ status: 'checking', errorMessage: null, isManualCheck: Boolean(options.isManual) });
      logger.info('Checking for updates...');

      try {
        const update = await check();

        if (update) {
          logger.info(`Update available: v${update.version}`);
          set({ status: 'available', updateInfo: update });
          get()
            .installUpdate()
            .catch(() => {});
        } else {
          logger.info('Application is up-to-date.');
          set({ status: 'upToDate', updateInfo: null });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error(`Error checking for updates: ${message}`);
        set({ status: 'error', errorMessage: message });
      }
    },

    installUpdate: async () => {
      const { updateInfo, status } = get();

      if (!updateInfo || status === 'downloading') {
        return;
      }

      set({ status: 'downloading', downloadProgress: 0 });
      logger.info('Starting update download and install...');

      try {
        let downloaded = 0;
        let contentLength = 0;

        await updateInfo.downloadAndInstall(event => {
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
                  set({ downloadProgress: nextProgress });
                }
              }

              break;

            case 'Finished':
              logger.info('Download finished, installing...');
              set({ downloadProgress: 100 });
              break;

            default:
              break;
          }
        });

        logger.info('Update downloaded and installed. Ready to restart.');
        localStorage.setItem(STORAGE_HAS_UPDATED_TO_KEY, updateInfo.version);
        set({ status: 'readyToRestart' });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error(`Installation failed: ${message}`);
        set({ status: 'error', errorMessage: message });
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

      set({
        status: 'idle',
        updateInfo: null,
        downloadProgress: 0,
        errorMessage: null,
        isChangelogOpen: false,
        changelogVersion: null,
        isManualCheck: false,
        changelog: '',
        isChangelogLoading: false,
        changelogError: null,
      });
    },

    openChangelog: (version: string) => {
      set({ isChangelogOpen: true, changelogVersion: version });
      get()
        .fetchChangelog(version)
        .catch(() => {});
    },

    closeChangelog: () => {
      set({
        isChangelogOpen: false,
        changelogVersion: null,
        changelog: '',
        isChangelogLoading: false,
        changelogError: null,
      });
    },

    fetchChangelog: async (targetVersion: string) => {
      set({ isChangelogLoading: true, changelogError: null });

      if (targetVersion === MOCK_VERSION) {
        await delay(3000);
        set({ changelog: MOCK_CHANGELOG, isChangelogLoading: false });
        return;
      }

      try {
        const response = await fetch(`${GITHUB_API_REPO_URL}/releases/tag/${targetVersion}`);

        if (!response.ok) {
          throw new Error(`${response.status}`);
        }

        const data = await response.json();
        set({ changelog: data.body ?? '', isChangelogLoading: false });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        logger.error(`Failed to fetch release notes: ${message}`);
        set({ changelogError: message, isChangelogLoading: false });
      }
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
      set({ status: 'checking', errorMessage: null, isManualCheck: true });

      try {
        await delay(3000, signal);

        set({
          status: 'available',
          updateInfo: {
            version: MOCK_VERSION,
            errorMessage: null,
            downloadProgress: 0,
            downloadAndInstall: async (
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
          } as unknown as Update,
        });

        get()
          .installUpdate()
          .catch(() => {});
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          logger.info('Mock update check cancelled via AbortSignal');
          return;
        }

        const message = error instanceof Error ? error.message : String(error);
        set({ status: 'error', errorMessage: message });
      } finally {
        if (mockUpdateController?.signal === signal) {
          mockUpdateController = null;
        }
      }
    },
  };
});

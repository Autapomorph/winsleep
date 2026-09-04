import { relaunch } from '@tauri-apps/plugin-process';
import { type Update, check } from '@tauri-apps/plugin-updater';
import { type StateCreator } from 'zustand';

import { config } from '@/shared/config';
import { delay, logger, showErrorToast } from '@/shared/lib';
import { initialChangelogState } from './changelog.slice';
import { MOCK_VERSION } from '../mockUpdate';
import { type UpdateStore } from '../update.store';

export type UpdateSlice = UpdateState & UpdateActions;

export interface UpdateState {
  status: UpdateStatus;
  isManualCheck: boolean;
  updateInfo: Update | null;
  downloadProgress: number;
  errorMessage: string | null;
}

export type UpdateStatus =
  'idle' | 'checking' | 'upToDate' | 'available' | 'downloading' | 'readyToRestart' | 'error';

export interface UpdateActions {
  checkUpdates: (options?: { isManual?: boolean }) => Promise<void>;
  downloadUpdate: () => Promise<void>;
  installUpdate: () => Promise<void>;
  relaunchApp: () => Promise<void>;
  resetStore: () => void;
  triggerMockUpdate: () => Promise<void>;
}

export const STORAGE_HAS_UPDATED_TO_KEY = 'hasUpdatedTo';

export const initialUpdateState: UpdateState = {
  downloadProgress: 0,
  errorMessage: null,
  isManualCheck: false,
  status: 'idle',
  updateInfo: null,
};

export const createUpdateSlice: StateCreator<
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
        { errorMessage: null, isManualCheck: Boolean(options.isManual), status: 'checking' },
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

        set({ errorMessage: message, status: 'error' }, false, 'updater/checkError');
      }
    },

    downloadUpdate: async () => {
      const { status, updateInfo } = get();

      if (!updateInfo || status === 'downloading') {
        return;
      }

      set({ downloadProgress: 0, status: 'downloading' }, false, 'updater/downloadStart');
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

        set({ errorMessage: message, status: 'error' }, false, 'updater/downloadError');
        showErrorToast($ => $.titlebar.updateBtn.notifications.installFailed);
      }
    },

    installUpdate: async () => {
      const { status, updateInfo } = get();

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

        set({ errorMessage: message, status: 'error' }, false, 'updater/installError');
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

      set({ ...initialUpdateState, ...initialChangelogState }, false, 'updater/resetStore');
    },

    triggerMockUpdate: async () => {
      const { resetStore, status } = get();

      if (status !== 'idle') {
        resetStore();
        return;
      }

      mockUpdateController = new AbortController();
      const { signal } = mockUpdateController;

      logger.info('Triggering mock update with 3s check simulation...');
      set(
        { errorMessage: null, isManualCheck: true, status: 'checking' },
        false,
        'updater/triggerMockUpdateChecking',
      );

      try {
        await delay(3000, signal);

        set(
          {
            status: 'available',
            updateInfo: {
              download: async (
                onEvent?: (event: {
                  data?: { chunkLength?: number; contentLength?: number } | Record<string, never>;
                  event: string;
                }) => void,
              ) => {
                if (!onEvent) {
                  return;
                }

                try {
                  onEvent({ data: { contentLength: 100 }, event: 'Started' });

                  for (let i = 1; i <= 100; i += 1) {
                    /* eslint-disable-next-line no-await-in-loop */
                    await delay(25, signal);

                    onEvent({ data: { chunkLength: 1 }, event: 'Progress' });
                  }

                  onEvent({ data: {}, event: 'Finished' });
                } catch (error) {
                  if (error instanceof Error && error.name === 'AbortError') {
                    logger.info('Mock download cancelled via AbortSignal');
                    return;
                  }

                  throw error;
                }
              },
              downloadProgress: 0,
              errorMessage: null,
              install: async () => {
                logger.info('Mock install executed');
              },
              version: MOCK_VERSION,
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
        set({ errorMessage: message, status: 'error' }, false, 'updater/triggerMockUpdateError');
      } finally {
        if (mockUpdateController?.signal === signal) {
          mockUpdateController = null;
        }
      }
    },
  };
};

import { type StateCreator } from 'zustand';

import { delay, logger } from '@/shared/lib';
import { updateService } from '../../api/update.service';
import { MOCK_RELEASE_NOTES, MOCK_VERSION } from '../mockUpdate';
import { type UpdateStore } from '../update.store';

export type ReleaseNotesSlice = ReleaseNotesState & ReleaseNotesActions;

export interface ReleaseNotesState {
  availableVersions: string[];
  isVersionsLoading: boolean;
  isReleaseNotesOpen: boolean;
  isReleaseNotesLoading: boolean;
  releaseNotesError: string | null;
  releaseNotes: string;
  releaseNotesVersion: string | null;
  releaseNotesMeta: ReleaseNotesMeta | null;
}

export interface ReleaseNotesMeta {
  releasedAt?: string;
  tags?: string[];
}

export interface ReleaseNotesActions {
  openReleaseNotes: (version: string) => void;
  closeReleaseNotes: () => void;
  fetchReleaseNotes: (version: string) => Promise<void>;
  fetchAvailableVersions: () => Promise<void>;
}

export const initialReleaseNotesState: ReleaseNotesState = {
  availableVersions: [],
  releaseNotes: '',
  releaseNotesError: null,
  releaseNotesMeta: null,
  releaseNotesVersion: null,
  isReleaseNotesLoading: false,
  isReleaseNotesOpen: false,
  isVersionsLoading: false,
};

export const createReleaseNotesSlice: StateCreator<
  UpdateStore,
  [['zustand/devtools', never]],
  [],
  ReleaseNotesSlice
> = (set, get) => ({
  ...initialReleaseNotesState,

  openReleaseNotes: (version: string) => {
    set(
      { releaseNotesVersion: version, isReleaseNotesOpen: true },
      false,
      'updater/openReleaseNotes',
    );
    get()
      .fetchReleaseNotes(version)
      .catch(() => {});
    get()
      .fetchAvailableVersions()
      .catch(() => {});
  },

  closeReleaseNotes: () => {
    set(
      {
        releaseNotes: '',
        releaseNotesError: null,
        releaseNotesMeta: null,
        releaseNotesVersion: null,
        isReleaseNotesLoading: false,
        isReleaseNotesOpen: false,
      },
      false,
      'updater/closeReleaseNotes',
    );
  },

  fetchAvailableVersions: async () => {
    set({ isVersionsLoading: true }, false, 'updater/fetchAvailableVersionsStart');
    try {
      const versions = await updateService.fetchAvailableVersions();

      if (versions.length > 0) {
        set(
          { availableVersions: versions, isVersionsLoading: false },
          false,
          'updater/fetchAvailableVersionsSuccess',
        );
        return;
      }
    } catch (err) {
      logger.debug(`Failed to fetch available versions: ${err}`);
    }

    set({ isVersionsLoading: false }, false, 'updater/fetchAvailableVersionsEnd');
  },

  fetchReleaseNotes: async (targetVersion: string) => {
    set(
      {
        releaseNotesError: null,
        releaseNotesVersion: targetVersion,
        isReleaseNotesLoading: true,
      },
      false,
      'updater/fetchReleaseNotesStart',
    );

    if (targetVersion === MOCK_VERSION) {
      await delay(3000);

      set(
        {
          releaseNotes: MOCK_RELEASE_NOTES,
          releaseNotesMeta: {
            releasedAt: '2026-09-03',
            tags: ['New', 'Improved', 'Fixed'],
          },
          isReleaseNotesLoading: false,
        },
        false,
        'updater/fetchMockReleaseNotesSuccess',
      );

      return;
    }

    try {
      const data = await updateService.fetchReleaseNotes(targetVersion);

      set(
        {
          releaseNotes: data.notes,
          releaseNotesMeta:
            data.releasedAt || (data.tags && data.tags.length > 0)
              ? {
                  releasedAt: data.releasedAt,
                  tags: data.tags ?? [],
                }
              : null,
          isReleaseNotesLoading: false,
        },
        false,
        'updater/fetchReleaseNotesSuccess',
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error(`Failed to fetch release notes: ${message}`);

      set(
        { releaseNotesError: message, isReleaseNotesLoading: false },
        false,
        'updater/fetchReleaseNotesError',
      );
    }
  },
});

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import {
  type ReleaseNotesActions,
  type ReleaseNotesMeta,
  type ReleaseNotesSlice,
  type ReleaseNotesState,
  createReleaseNotesSlice,
  initialReleaseNotesState,
} from './slices/release-notes.slice';
import {
  type UpdateActions,
  type UpdateSlice,
  type UpdateState,
  type UpdateStatus,
  createUpdateSlice,
  initialUpdateState,
  STORAGE_LAST_SEEN_VERSION_KEY,
} from './slices/update.slice';

export type {
  ReleaseNotesActions,
  ReleaseNotesMeta,
  ReleaseNotesSlice,
  ReleaseNotesState,
  UpdateActions,
  UpdateSlice,
  UpdateState,
  UpdateStatus,
};

export type UpdateStore = UpdateSlice & ReleaseNotesSlice;

export type UpdateStoreState = UpdateState & ReleaseNotesState;

export { STORAGE_LAST_SEEN_VERSION_KEY };

export const initialUpdateStoreState: UpdateStoreState = {
  ...initialUpdateState,
  ...initialReleaseNotesState,
};

export const useUpdateStore = create<UpdateStore>()(
  devtools(
    (...a) => ({
      ...createUpdateSlice(...a),
      ...createReleaseNotesSlice(...a),
    }),
    {
      name: 'updater',
    },
  ),
);

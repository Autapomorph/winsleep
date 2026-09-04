import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import {
  type ChangelogActions,
  type ChangelogMeta,
  type ChangelogSlice,
  type ChangelogState,
  createChangelogSlice,
  initialChangelogState,
} from './slices/changelog.slice';
import {
  type UpdateActions,
  type UpdateSlice,
  type UpdateState,
  type UpdateStatus,
  createUpdateSlice,
  initialUpdateState,
  STORAGE_HAS_UPDATED_TO_KEY,
} from './slices/update.slice';

export type {
  ChangelogActions,
  ChangelogMeta,
  ChangelogSlice,
  ChangelogState,
  UpdateActions,
  UpdateSlice,
  UpdateState,
  UpdateStatus,
};

export type UpdateStore = UpdateSlice & ChangelogSlice;

export type UpdateStoreState = UpdateState & ChangelogState;

export { STORAGE_HAS_UPDATED_TO_KEY };

export const initialUpdateStoreState: UpdateStoreState = {
  ...initialUpdateState,
  ...initialChangelogState,
};

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

export { updateService } from './api/update.service';
export { useUpdater } from './lib/useUpdater';
export { MOCK_RELEASE_NOTES, MOCK_VERSION } from './model/mockUpdate';
export { STORAGE_LAST_SEEN_VERSION_KEY, useUpdateStore } from './model/update.store';
export type {
  ReleaseNotesMeta,
  ReleaseNotesSlice,
  UpdateSlice,
  UpdateStatus,
  UpdateStore,
  UpdateStoreState,
} from './model/update.store';

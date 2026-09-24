import { getVersion } from '@tauri-apps/api/app';
import { render, waitFor } from '@testing-library/react';

import { STORAGE_LAST_SEEN_VERSION_KEY, useUpdateStore } from '@/entities/updater';
import { ReleaseNotesModal } from './ReleaseNotesModal';

vi.mock(import('@tauri-apps/api/app'), () => ({
  getVersion: vi.fn(() => Promise.resolve('1.2.0')),
}));

vi.mock(import('react-i18next'), async importOriginal => {
  const { createMockUseTranslation } = await import('@/tests/i18nMock');
  return {
    ...(await importOriginal()),
    useTranslation: createMockUseTranslation(),
  };
});

describe('ReleaseNotesModal', () => {
  beforeEach(() => {
    localStorage.clear();
    useUpdateStore.getState().closeReleaseNotes();
    vi.mocked(getVersion).mockResolvedValue('1.2.0');
  });

  test('does not open release notes on clean first install and records lastSeenReleaseNotesVersion', async () => {
    render(<ReleaseNotesModal />);

    await waitFor(() => {
      expect(localStorage.getItem(STORAGE_LAST_SEEN_VERSION_KEY)).toBe('1.2.0');
    });

    expect(useUpdateStore.getState().isReleaseNotesOpen).toBe(false);
  });

  test('opens release notes when lastSeenReleaseNotesVersion is older than currentVersion even without pendingVersion', async () => {
    localStorage.setItem(STORAGE_LAST_SEEN_VERSION_KEY, '1.1.5');

    render(<ReleaseNotesModal />);

    await waitFor(() => {
      expect(useUpdateStore.getState().isReleaseNotesOpen).toBe(true);
      expect(useUpdateStore.getState().releaseNotesVersion).toBe('1.2.0');
    });
  });

  test('does not open release notes when lastSeenReleaseNotesVersion is already up to date', async () => {
    localStorage.setItem(STORAGE_LAST_SEEN_VERSION_KEY, '1.2.0');

    render(<ReleaseNotesModal />);

    await waitFor(() => {
      expect(useUpdateStore.getState().isReleaseNotesOpen).toBe(false);
    });
  });
});

import { getVersion } from '@tauri-apps/api/app';
import { render, waitFor } from '@testing-library/react';

import { STORAGE_LAST_SEEN_VERSION_KEY, useUpdateStore } from '@/entities/updater';
import { ChangelogModal } from './ChangelogModal';

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

describe('ChangelogModal', () => {
  beforeEach(() => {
    localStorage.clear();
    useUpdateStore.getState().closeChangelog();
    vi.mocked(getVersion).mockResolvedValue('1.2.0');
  });

  test('does not open changelog on clean first install and records lastSeenChangelogVersion', async () => {
    render(<ChangelogModal />);

    await waitFor(() => {
      expect(localStorage.getItem(STORAGE_LAST_SEEN_VERSION_KEY)).toBe('1.2.0');
    });

    expect(useUpdateStore.getState().isChangelogOpen).toBe(false);
  });

  test('opens changelog when lastSeenChangelogVersion is older than currentVersion even without pendingVersion', async () => {
    localStorage.setItem(STORAGE_LAST_SEEN_VERSION_KEY, '1.1.5');

    render(<ChangelogModal />);

    await waitFor(() => {
      expect(useUpdateStore.getState().isChangelogOpen).toBe(true);
      expect(useUpdateStore.getState().changelogVersion).toBe('1.2.0');
    });
  });

  test('does not open changelog when lastSeenChangelogVersion is already up to date', async () => {
    localStorage.setItem(STORAGE_LAST_SEEN_VERSION_KEY, '1.2.0');

    render(<ChangelogModal />);

    await waitFor(() => {
      expect(useUpdateStore.getState().isChangelogOpen).toBe(false);
    });
  });
});

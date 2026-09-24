import { getVersion } from '@tauri-apps/api/app';
import { relaunch } from '@tauri-apps/plugin-process';
import { type Update, check } from '@tauri-apps/plugin-updater';

import { MOCK_RELEASE_NOTES, MOCK_VERSION } from './mockUpdate';
import { useUpdateStore } from './update.store';

let mockIsDev = false;

vi.mock(import('@tauri-apps/api/app'), () => ({
  getVersion: vi.fn(() => Promise.resolve('1.3.1')),
}));

vi.mock(import('@tauri-apps/plugin-process'), () => ({
  relaunch: vi.fn(() => Promise.resolve()),
}));

vi.mock(import('@tauri-apps/plugin-updater'), () => ({
  check: vi.fn(),
}));

vi.mock(import('@tauri-apps/plugin-os'), () => ({
  arch: vi.fn((): import('@tauri-apps/plugin-os').Arch => 'x86_64'),
  platform: vi.fn((): import('@tauri-apps/plugin-os').Platform => 'windows'),
}));

vi.mock(import('@/shared/config'), async importOriginal => {
  const original = await importOriginal();
  return {
    ...original,
    config: {
      ...original.config,
      get isDev() {
        return mockIsDev;
      },
    },
  };
});

vi.mock(import('@/shared/lib'), async importOriginal => {
  const original = await importOriginal();
  return {
    ...original,
    delay: (ms: number, signal?: AbortSignal) => {
      if (ms === 25) {
        return Promise.resolve();
      }

      return original.delay(ms, signal).catch(err => {
        if (err instanceof Error && err.name === 'AbortError') {
          throw err;
        }

        if (err && typeof err === 'object' && 'name' in err && err.name === 'AbortError') {
          const abortErr = new Error('Aborted');
          abortErr.name = 'AbortError';
          throw abortErr;
        }

        throw err;
      });
    },
    showErrorToast: vi.fn(),
  };
});

describe('updateStore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockIsDev = false;
    useUpdateStore.getState().resetStore();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('should initialize with default state', () => {
    const state = useUpdateStore.getState();

    expect(state.status).toBe('idle');
    expect(state.updateInfo).toBeNull();
    expect(state.downloadProgress).toBe(0);
    expect(state.errorMessage).toBeNull();
    expect(state.isReleaseNotesOpen).toBe(false);
  });

  test('should handle checkUpdates when no update is available', async () => {
    vi.mocked(check).mockResolvedValueOnce(null);

    await useUpdateStore.getState().checkUpdates();

    const state = useUpdateStore.getState();

    expect(state.status).toBe('upToDate');
    expect(state.updateInfo).toBeNull();
    expect(check).toHaveBeenCalledWith({
      headers: {
        'x-update-channel': 'stable',
      },
    });
  });

  test('should pass prerelease channel headers when version is prerelease', async () => {
    vi.mocked(getVersion).mockResolvedValueOnce('1.3.2-beta.1');
    vi.mocked(check).mockResolvedValueOnce(null);

    await useUpdateStore.getState().checkUpdates();

    expect(check).toHaveBeenCalledWith({
      headers: {
        'x-update-channel': 'prerelease',
      },
    });
  });

  test('should respect explicit channel override in checkUpdates options', async () => {
    vi.mocked(getVersion).mockResolvedValueOnce('1.3.1');
    vi.mocked(check).mockResolvedValueOnce(null);

    await useUpdateStore.getState().checkUpdates({ channel: 'prerelease' });

    expect(check).toHaveBeenCalledWith({
      headers: {
        'x-update-channel': 'prerelease',
      },
    });
  });

  test('should handle checkUpdates error', async () => {
    vi.mocked(check).mockRejectedValueOnce(new Error('Network error'));

    await useUpdateStore.getState().checkUpdates();

    const state = useUpdateStore.getState();

    expect(state.status).toBe('error');
    expect(state.errorMessage).toBe('Network error');
  });

  test('should skip checkUpdates if status is already checking or downloading', async () => {
    useUpdateStore.setState({ status: 'checking' });
    await useUpdateStore.getState().checkUpdates();
    expect(check).not.toHaveBeenCalled();

    useUpdateStore.setState({ status: 'downloading' });
    await useUpdateStore.getState().checkUpdates();
    expect(check).not.toHaveBeenCalled();
  });

  test('should run download during checkUpdates and reach readyToInstall', async () => {
    const mockDownload = vi.fn(async onEvent => {
      if (onEvent) {
        onEvent({ data: { contentLength: 100 }, event: 'Started' });
        onEvent({ data: { chunkLength: 50 }, event: 'Progress' });
        onEvent({ data: {}, event: 'Finished' });
        // Cover fallback branch
        onEvent({ data: {}, event: 'UnknownEvent' });
      }
    });

    const mockUpdate = {
      download: mockDownload,
      install: vi.fn(),
      version: '2.1.0',
    };

    vi.mocked(check).mockResolvedValueOnce(
      mockUpdate as unknown as Awaited<ReturnType<typeof check>>,
    );

    // checkUpdates calls downloadUpdate in background, wait for it
    await useUpdateStore.getState().checkUpdates();
    // Flush microtasks
    await vi.advanceTimersByTimeAsync(0);

    const state = useUpdateStore.getState();
    expect(state.status).toBe('readyToInstall');
    expect(state.downloadProgress).toBe(100);
    expect(mockDownload).toHaveBeenCalled();
  });

  test('should ignore downloadUpdate if no updateInfo or already downloading', async () => {
    useUpdateStore.setState({ status: 'idle', updateInfo: null });
    await useUpdateStore.getState().downloadUpdate();
    expect(useUpdateStore.getState().status).toBe('idle');

    useUpdateStore.setState({ status: 'downloading', updateInfo: {} as unknown as Update });
    await useUpdateStore.getState().downloadUpdate();
    expect(useUpdateStore.getState().status).toBe('downloading');
  });

  test('should handle downloadUpdate failure and capture errors', async () => {
    const mockDownload = vi.fn(async () => {
      throw new Error('Disk full');
    });

    const mockUpdate = {
      download: mockDownload,
      version: '2.1.0',
    };

    useUpdateStore.setState({ status: 'idle', updateInfo: mockUpdate as unknown as Update });
    await useUpdateStore.getState().downloadUpdate();

    const state = useUpdateStore.getState();
    expect(state.status).toBe('error');
    expect(state.errorMessage).toBe('Disk full');
  });

  test('should run install during installUpdate when status is readyToInstall', async () => {
    const mockInstall = vi.fn(async () => {});
    const mockUpdate = {
      download: vi.fn(),
      install: mockInstall,
      version: '2.1.0',
    };

    useUpdateStore.setState({
      status: 'readyToInstall',
      updateInfo: mockUpdate as unknown as Update,
    });
    await useUpdateStore.getState().installUpdate();

    expect(mockInstall).toHaveBeenCalled();
  });

  test('should handle install failure during installUpdate', async () => {
    const mockInstall = vi.fn(async () => {
      throw new Error('Install error');
    });
    const mockUpdate = {
      download: vi.fn(),
      install: mockInstall,
      version: '2.1.0',
    };

    useUpdateStore.setState({
      status: 'readyToInstall',
      updateInfo: mockUpdate as unknown as Update,
    });
    await useUpdateStore.getState().installUpdate();

    const state = useUpdateStore.getState();
    expect(state.status).toBe('error');
    expect(state.errorMessage).toBe('Install error');
  });

  test('should pass options to updateInfo.install during installUpdate', async () => {
    const mockInstall = vi.fn().mockResolvedValue(undefined);
    const mockUpdate = {
      download: vi.fn(),
      install: mockInstall,
      version: '2.1.0',
    };

    useUpdateStore.setState({
      status: 'readyToInstall',
      updateInfo: mockUpdate as unknown as Update,
    });
    await useUpdateStore.getState().installUpdate({ restartAfterInstall: false });

    expect(mockInstall).toHaveBeenCalledWith({ restartAfterInstall: false });
  });

  test('should open and close release notes', () => {
    useUpdateStore.getState().openReleaseNotes('2.0.0');
    expect(useUpdateStore.getState().isReleaseNotesOpen).toBe(true);
    expect(useUpdateStore.getState().releaseNotesVersion).toBe('2.0.0');

    useUpdateStore.getState().closeReleaseNotes();
    expect(useUpdateStore.getState().isReleaseNotesOpen).toBe(false);
    expect(useUpdateStore.getState().releaseNotesVersion).toBeNull();
  });

  test('should trigger relaunch in production mode', async () => {
    mockIsDev = false;
    await useUpdateStore.getState().relaunchApp();
    expect(relaunch).toHaveBeenCalled();
  });

  test('should bypass relaunch in dev mode and reload location', async () => {
    mockIsDev = true;
    const originalLocation = window.location;
    const mockReload = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { reload: mockReload },
      writable: true,
    });

    try {
      await useUpdateStore.getState().relaunchApp();
      expect(relaunch).not.toHaveBeenCalled();
      expect(mockReload).toHaveBeenCalled();
    } finally {
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: originalLocation,
        writable: true,
      });
    }
  });

  test('handles simulated mock updates and aborts correctly', async () => {
    const store = useUpdateStore.getState();

    // Trigger mock update (simulate checking...)
    const mockPromise = store.triggerMockUpdate();

    expect(useUpdateStore.getState().status).toBe('checking');

    // Run check duration (3s check simulation)
    await vi.advanceTimersByTimeAsync(3000);

    // Wait for promise resolution
    await mockPromise;

    // Since download steps are mocked to resolve instantly, the status goes straight to readyToInstall!
    expect(useUpdateStore.getState().status).toBe('readyToInstall');

    // Calling triggerMockUpdate when not idle resets the store immediately
    await useUpdateStore.getState().triggerMockUpdate();
    expect(useUpdateStore.getState().status).toBe('idle');
  });

  test('handles abort error during triggerMockUpdate', async () => {
    const store = useUpdateStore.getState();

    const mockPromise = store.triggerMockUpdate();

    // Abort early
    store.resetStore();

    await vi.advanceTimersByTimeAsync(3000);
    await mockPromise;

    expect(useUpdateStore.getState().status).toBe('idle');
  });

  test('should initialize with default release notes state', () => {
    const state = useUpdateStore.getState();
    expect(state.releaseNotes).toBe('');
    expect(state.isReleaseNotesLoading).toBe(false);
    expect(state.releaseNotesError).toBeNull();
    expect(state.availableVersions).toEqual([]);
    expect(state.isVersionsLoading).toBe(false);
    expect(state.releaseNotesMeta).toBeNull();
  });

  test('should open release notes and trigger fetchReleaseNotes and fetchAvailableVersions', async () => {
    const fetchSpy = vi
      .spyOn(useUpdateStore.getState(), 'fetchReleaseNotes')
      .mockImplementation(async () => {});
    const fetchVersionsSpy = vi
      .spyOn(useUpdateStore.getState(), 'fetchAvailableVersions')
      .mockImplementation(async () => {});

    useUpdateStore.getState().openReleaseNotes('1.0.0');

    expect(useUpdateStore.getState().isReleaseNotesOpen).toBe(true);
    expect(useUpdateStore.getState().releaseNotesVersion).toBe('1.0.0');
    expect(fetchSpy).toHaveBeenCalledWith('1.0.0');
    expect(fetchVersionsSpy).toHaveBeenCalled();

    fetchSpy.mockRestore();
    fetchVersionsSpy.mockRestore();
  });

  test('should fetch mock release notes', async () => {
    const fetchPromise = useUpdateStore.getState().fetchReleaseNotes(MOCK_VERSION);

    expect(useUpdateStore.getState().isReleaseNotesLoading).toBe(true);
    expect(useUpdateStore.getState().releaseNotesError).toBeNull();

    await vi.advanceTimersByTimeAsync(3000);
    await fetchPromise;

    const state = useUpdateStore.getState();
    expect(state.isReleaseNotesLoading).toBe(false);
    expect(state.releaseNotes).toBe(MOCK_RELEASE_NOTES);
    expect(state.releaseNotesMeta).toEqual({
      releasedAt: '2026-09-03',
      tags: ['New', 'Improved', 'Fixed'],
    });
  });

  test('should fetch available versions from proxy successfully', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify({ versions: ['1.2.0', '1.1.5'] }), { status: 200 }),
      );

    await useUpdateStore.getState().fetchAvailableVersions();

    const state = useUpdateStore.getState();
    expect(state.isVersionsLoading).toBe(false);
    expect(state.availableVersions).toEqual(['1.2.0', '1.1.5']);

    fetchSpy.mockRestore();
  });

  test('should fetch git release notes from proxy successfully', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          notes: 'Proxy release notes',
          releasedAt: '2026-09-03',
          tags: ['New'],
        }),
        { status: 200 },
      ),
    );

    await useUpdateStore.getState().fetchReleaseNotes('v1.2.3');

    const state = useUpdateStore.getState();
    expect(state.isReleaseNotesLoading).toBe(false);
    expect(state.releaseNotes).toBe('Proxy release notes');
    expect(state.releaseNotesMeta).toEqual({ releasedAt: '2026-09-03', tags: ['New'] });
    expect(state.releaseNotesError).toBeNull();

    fetchSpy.mockRestore();
  });

  test('should handle git release notes fetch failure on both proxy and GitHub API', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(null, { status: 404 }));

    await useUpdateStore.getState().fetchReleaseNotes('v1.2.3');

    const state = useUpdateStore.getState();
    expect(state.isReleaseNotesLoading).toBe(false);
    expect(state.releaseNotesError).toContain('Release notes not found');

    fetchSpy.mockRestore();
  });

  test('should fallback to GitHub API when proxy release notes fetch fails', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async url => {
      if (typeof url === 'string' && url.includes('winsleep-proxy-updater')) {
        return new Response(null, { status: 500 });
      }

      return new Response(
        JSON.stringify({ body: 'GitHub release body', published_at: '2026-09-03T12:00:00Z' }),
        { status: 200 },
      );
    });

    await useUpdateStore.getState().fetchReleaseNotes('v1.2.3');

    const state = useUpdateStore.getState();
    expect(state.isReleaseNotesLoading).toBe(false);
    expect(state.releaseNotes).toBe('GitHub release body');
    expect(state.releaseNotesMeta).toEqual({ releasedAt: '2026-09-03T12:00:00Z', tags: [] });
    expect(state.releaseNotesError).toBeNull();

    fetchSpy.mockRestore();
  });
});
